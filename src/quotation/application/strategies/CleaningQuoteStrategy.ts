import { devLog } from '../../../lib/conditional-logger';
import { injectable, inject } from "inversify";
import { QuoteStrategy } from "../../domain/interfaces/QuoteStrategy";
import { QuoteContext } from "../../domain/valueObjects/QuoteContext";
import { Quote } from "../../domain/valueObjects/Quote";
import { Money } from "../../domain/valueObjects/Money";
import { ServiceType } from "../../domain/enums/ServiceType";
import { ConfigurationService } from "../services/ConfigurationService";
import { RuleEngine } from "../../domain/services/RuleEngine";
import { calculationDebugLogger } from "../../../lib/calculation-debug-logger";
import {
  UnifiedDataService,
  ServiceType as UnifiedServiceType,
  ConfigurationCategory,
} from "../../infrastructure/services/UnifiedDataService";
import { configAccessService } from "../services/ConfigurationAccessService";
import { BusinessTypePricingConfigKey } from "../../domain/configuration/ConfigurationKey";

@injectable()
export class CleaningQuoteStrategy implements QuoteStrategy {
  serviceType = ServiceType.CLEANING;
  private readonly configService: ConfigurationService;
  private readonly rules: any[];
  private ruleEngine: RuleEngine; // Retiré readonly pour permettre la réinitialisation
  private readonly unifiedDataService: UnifiedDataService;

  constructor(
    @inject("ConfigurationService") configService?: ConfigurationService,
    @inject("TemplateRuleEngine") ruleEngine?: RuleEngine,
  ) {
    // Injection de dépendances avec fallback pour compatibilité
    this.configService = configService || new ConfigurationService(null as any);
    this.ruleEngine = ruleEngine || new RuleEngine([]);
    this.rules = this.ruleEngine.getRules();

    // ✅ NOUVEAU: Service unifié pour accès aux données
    this.unifiedDataService = UnifiedDataService.getInstance();

    // ✅ NOUVEAU: Charger les règles métier au démarrage
    this.initializeRules();
  }

  /**
   * ✅ NOUVEAU: Initialise les règles métier depuis le système unifié
   */
  private async initializeRules(): Promise<void> {
    try {
      const businessRules =
        await this.unifiedDataService.getBusinessRulesForEngine(
          UnifiedServiceType.CLEANING,
        );
      if (businessRules.length > 0) {
        devLog.debug('Strategy', 
          `✅ [CLEANING-STRATEGY] ${businessRules.length} règles métier chargées depuis UnifiedDataService`,
        );
        // Remplacer le RuleEngine avec les nouvelles règles
        this.ruleEngine = new RuleEngine(businessRules);
      } else {
        devLog.debug('Strategy', 
          "⚠️ [CLEANING-STRATEGY] Aucune règle métier trouvée, utilisation des règles par défaut",
        );
      }
    } catch (error) {
      devLog.warn('Strategy', 
        "⚠️ [CLEANING-STRATEGY] Erreur lors du chargement des règles métier:",
        error,
      );
      // Garder le RuleEngine existant en cas d'erreur
    }
  }

  canHandle(serviceType: string): boolean {
    return (
      serviceType === ServiceType.CLEANING ||
      serviceType === ServiceType.CLEANING_PREMIUM ||
      serviceType === "CLEANING" ||
      serviceType === "CLEANING_PREMIUM"
    );
  }

  async calculate(context: QuoteContext): Promise<Quote> {
    const startTime = Date.now();
    const data = context.getAllData();

    calculationDebugLogger.startPriceCalculation(this.serviceType, data);

    try {
      if (!this.hasModifications(context)) {
        const defaultQuote = new Quote(
          new Money(data.defaultPrice || 0),
          new Money(data.defaultPrice || 0),
          [],
          this.serviceType,
        );

        calculationDebugLogger.logFinalCalculation(
          defaultQuote,
          Date.now() - startTime,
        );
        return defaultQuote;
      }

      const enrichedContext = await this.enrichContext(context);
      const basePrice = await this.getBasePrice(enrichedContext);

      // Appliquer les règles métier via le RuleEngine
      const ruleResult = this.ruleEngine.execute(
        enrichedContext,
        new Money(basePrice),
      );

      devLog.debug('Strategy', 
        `\n📊 [CLEANING-STRATEGY] Résultat du RuleEngine (nouvelle architecture):`,
      );
      devLog.debug('Strategy', 
        `   └─ Prix de base: ${ruleResult.basePrice.getAmount().toFixed(2)}€`,
      );
      devLog.debug('Strategy', 
        `   └─ Prix final: ${ruleResult.finalPrice.getAmount().toFixed(2)}€`,
      );
      devLog.debug('Strategy', 
        `   └─ Total réductions: ${ruleResult.totalReductions.getAmount().toFixed(2)}€`,
      );
      devLog.debug('Strategy', 
        `   └─ Total surcharges: ${ruleResult.totalSurcharges.getAmount().toFixed(2)}€`,
      );
      devLog.debug('Strategy', 
        `      → Contraintes logistiques: ${ruleResult.totalConstraints.getAmount().toFixed(2)}€`,
      );
      devLog.debug('Strategy', 
        `      → Services supplémentaires: ${ruleResult.totalAdditionalServices.getAmount().toFixed(2)}€`,
      );
      devLog.debug('Strategy', 
        `   └─ Nombre total de règles: ${ruleResult.appliedRules.length}`,
      );

      const discounts = (ruleResult as any).discounts || [];

      const quote = new Quote(
        new Money(basePrice),
        ruleResult.finalPrice,
        discounts,
        this.serviceType,
      );
      calculationDebugLogger.logFinalCalculation(quote, Date.now() - startTime);

      return quote;
    } catch (error) {
      calculationDebugLogger.logCalculationError(
        error,
        "CLEANING_STRATEGY",
        data,
      );
      throw error;
    }
  }

  async getBasePrice(context: QuoteContext): Promise<number> {
    const data = context.getAllData();
    const serviceType = context.getServiceType();
    const surface = data.surface || 0;
    const workers = data.workers || 1;
    const duration = data.duration || 1;
    const rooms = data.rooms || 1;

    devLog.debug('Strategy', 
      "\n🧽 [CLEANING-STRATEGY] ═══════════════════════════════════════════════════",
    );
    devLog.debug('Strategy', 
      "🧽 [CLEANING-STRATEGY] ═══ DÉBUT CALCUL PRIX DE BASE CLEANING ═══",
    );
    devLog.debug('Strategy', 
      "🧽 [CLEANING-STRATEGY] ═══════════════════════════════════════════════════",
    );
    devLog.debug('Strategy', "📊 [CLEANING-STRATEGY] Type de service:", serviceType);
    devLog.debug('Strategy', "📋 [CLEANING-STRATEGY] Données d'entrée:", {
      defaultPrice: data.defaultPrice,
      surface,
      workers,
      duration,
      rooms,
    });

    // ✅ NOUVEAU: Récupérer les constantes depuis ConfigurationAccessService (BDD → Cache → DefaultValues)
    const minimumPrice = await configAccessService.get<number>(
      "CLEANING_MINIMUM_PRICE",
    );
    const laborRate = await configAccessService.get<number>(
      "CLEANING_WORKER_HOUR_RATE",
    ); // ✅ Corrigé (spécifique CLEANING)

    let basePrice = 0;
    let surfaceCost = 0;
    let roomsCost = 0;
    let laborCost = 0;

    // ✅ CAS 1 : CLEANING_PREMIUM (sur mesure) → SURFACE UNIQUEMENT
    if (serviceType === ServiceType.CLEANING_PREMIUM) {
      // ✅ VALIDATION: CLEANING_PREMIUM requiert une surface
      if (!surface || surface === 0) {
        throw new Error(
          "CLEANING_PREMIUM (ménage sur mesure) requiert une surface non nulle",
        );
      }

      devLog.debug('Strategy', 
        "\n✨ [CLEANING-STRATEGY] MODE: MÉNAGE SUR MESURE (SURFACE UNIQUEMENT)",
      );
      devLog.debug('Strategy', "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      // Calcul basé sur la surface
      const pricePerM2 = await configAccessService.get<number>(
        "CLEANING_PRICE_PER_M2",
      );
      surfaceCost = surface * pricePerM2;

      devLog.debug('Strategy', `\n📏 [CLEANING-STRATEGY] ─── Calcul Surface ───`);
      devLog.debug('Strategy', `   📐 Surface à nettoyer: ${surface}m²`);
      devLog.debug('Strategy', `   💶 Tarif au m²: ${pricePerM2.toFixed(2)}€/m²`);
      devLog.debug('Strategy', 
        `   └─ Coût total: ${surface}m² × ${pricePerM2.toFixed(2)}€ = ${surfaceCost.toFixed(2)}€`,
      );

      // Supplément pièces si applicable
      if (rooms > 1) {
        // Calcul direct sans méthode intermédiaire
        const roomSurcharge = 10; // Valeur par défaut, peut être configurée si nécessaire
        roomsCost = (rooms - 1) * roomSurcharge;
        devLog.debug('Strategy', `\n🏠 [CLEANING-STRATEGY] ─── Supplément Pièces ───`);
        devLog.debug('Strategy', `   🚪 Pièces supplémentaires: ${rooms - 1}`);
        devLog.debug('Strategy', `   └─ Supplément: ${roomsCost.toFixed(2)}€`);
      }

      basePrice = Math.max(surfaceCost + roomsCost, minimumPrice);

      devLog.debug('Strategy', "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      devLog.debug('Strategy', "💰 [CLEANING-STRATEGY] RÉSUMÉ (SUR MESURE):");
      devLog.debug('Strategy', `   • Surface: ${surfaceCost.toFixed(2)}€ (${surface}m²)`);
      devLog.debug('Strategy', 
        `   • Pièces: ${roomsCost.toFixed(2)}€ (${rooms > 1 ? rooms - 1 : 0} extra)`,
      );
      devLog.debug('Strategy', `   • Minimum: ${minimumPrice.toFixed(2)}€`);
      devLog.debug('Strategy', `   = ${basePrice.toFixed(2)}€`);
    }

    // ✅ CAS 2 : CLEANING (catalogue) → MAIN D'ŒUVRE UNIQUEMENT
    else if (serviceType === ServiceType.CLEANING) {
      // ✅ VALIDATION: CLEANING requiert workers ET duration
      if (!workers || workers === 0 || !duration || duration === 0) {
        throw new Error(
          "CLEANING (pack catalogue) requiert workers et duration non nuls",
        );
      }

      devLog.debug('Strategy', 
        "\n📦 [CLEANING-STRATEGY] MODE: PACK CATALOGUE (MAIN D'ŒUVRE UNIQUEMENT)",
      );
      devLog.debug('Strategy', "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      // Calcul basé sur main d'œuvre
      laborCost = workers * duration * laborRate;

      devLog.debug('Strategy', `\n👥 [CLEANING-STRATEGY] ─── Calcul Main d'œuvre ───`);
      devLog.debug('Strategy', `   👤 Travailleurs: ${workers}`);
      devLog.debug('Strategy', `   ⏱️  Durée: ${duration}h`);
      devLog.debug('Strategy', `   💶 Tarif horaire: ${laborRate.toFixed(2)}€/h`);
      devLog.debug('Strategy', 
        `   └─ Coût total: ${workers} × ${duration}h × ${laborRate.toFixed(2)}€ = ${laborCost.toFixed(2)}€`,
      );

      basePrice = Math.max(laborCost, minimumPrice);

      devLog.debug('Strategy', "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      devLog.debug('Strategy', "💰 [CLEANING-STRATEGY] RÉSUMÉ (PACK CATALOGUE):");
      devLog.debug('Strategy', 
        `   • Main d'œuvre: ${laborCost.toFixed(2)}€ (${workers} × ${duration}h)`,
      );
      devLog.debug('Strategy', `   • Minimum: ${minimumPrice.toFixed(2)}€`);
      devLog.debug('Strategy', `   = ${basePrice.toFixed(2)}€`);
    }

    devLog.debug('Strategy', "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // ✅ NOUVEAU: APPLICATION DES PROMOTIONS
    const priceBeforePromotion = basePrice;
    const promotionResult = this.applyPromotionCodes(context, basePrice);
    basePrice = promotionResult.finalPrice;

    if (promotionResult.discountAmount > 0) {
      devLog.debug('Strategy', 
        `\n🎁 [CLEANING-STRATEGY] Promotion appliquée: -${promotionResult.discountAmount.toFixed(2)}€`,
      );
      devLog.debug('Strategy', `   📊 Prix final après promotion: ${basePrice.toFixed(2)}€`);
    }

    devLog.debug('Strategy', 
      `\n💰 [CLEANING-STRATEGY] ═══ PRIX DE BASE FINAL: ${basePrice.toFixed(2)}€ ═══`,
    );
    devLog.debug('Strategy', 
      "🧽 [CLEANING-STRATEGY] ═══════════════════════════════════════════════════\n",
    );

    return basePrice;
  }

  private hasModifications(context: QuoteContext): boolean {
    const data = context.getAllData();
    return !!(data.surface || data.rooms || data.workers || data.duration);
  }

  private async enrichContext(context: QuoteContext): Promise<QuoteContext> {
    const data = context.getAllData();
    const enrichedContext = new QuoteContext(context.getServiceType());

    // Copier toutes les données existantes
    Object.keys(data).forEach((key) => {
      enrichedContext.setValue(key, data[key]);
    });

    // ✅ MIGRÉ: Ajouter des calculs enrichis (depuis configuration)
    if (data.surface) {
      const [estimatedDuration, requiredWorkers] = await Promise.all([
        this.calculateEstimatedDuration(data.surface),
        this.calculateRequiredWorkers(data.surface),
      ]);

      enrichedContext.setValue("estimatedDuration", estimatedDuration);
      enrichedContext.setValue("requiredWorkers", requiredWorkers);
    }

    return enrichedContext;
  }

  private async calculateEstimatedDuration(surface: number): Promise<number> {
    try {
      const m2PerHour = await this.unifiedDataService.getConfigurationValue(
        ConfigurationCategory.PRICING,
        "CLEANING_M2_PER_HOUR",
        20,
      );
      return Math.ceil(surface / m2PerHour);
    } catch (error) {
      devLog.warn('Strategy', 
        "⚠️ [CLEANING-STRATEGY] Erreur récupération m2 par heure, utilisation fallback:",
        error,
      );
      return Math.ceil(surface / 20); // Fallback hardcodé
    }
  }

  private async calculateRequiredWorkers(surface: number): Promise<number> {
    try {
      const [threshold1, threshold2] = await Promise.all([
        this.unifiedDataService.getConfigurationValue(
          ConfigurationCategory.PRICING,
          "CLEANING_SURFACE_THRESHOLD_1",
          100,
        ),
        this.unifiedDataService.getConfigurationValue(
          ConfigurationCategory.PRICING,
          "CLEANING_SURFACE_THRESHOLD_2",
          200,
        ),
      ]);

      if (surface <= threshold1) return 1;
      if (surface <= threshold2) return 2;
      return 3;
    } catch (error) {
      devLog.warn('Strategy', 
        "⚠️ [CLEANING-STRATEGY] Erreur récupération seuils surface, utilisation fallback:",
        error,
      );
      if (surface <= 100) return 1;
      if (surface <= 200) return 2;
      return 3; // Fallback hardcodé
    }
  }

  /**
   * ✅ NOUVEAU: Applique les codes promotion sur le prix de base
   * Cette méthode est appelée AVANT l'application des règles métier
   */
  private applyPromotionCodes(
    context: QuoteContext,
    basePrice: number,
  ): { finalPrice: number; discountAmount: number } {
    const data = context.getAllData();

    // Extraire les données de promotion
    let promotionCode = data.promotionCode;
    let promotionValue = data.promotionValue;
    let promotionType = data.promotionType;
    let isPromotionActive = data.isPromotionActive;

    // Toujours extraire les données du __presetSnapshot si disponible
    if (data.__presetSnapshot) {
      promotionCode = data.__presetSnapshot.promotionCode || promotionCode;
      promotionValue = data.__presetSnapshot.promotionValue || promotionValue;
      promotionType = data.__presetSnapshot.promotionType || promotionType;
      isPromotionActive =
        data.__presetSnapshot.isPromotionActive !== undefined
          ? data.__presetSnapshot.isPromotionActive
          : isPromotionActive;
    }

    devLog.debug('Strategy', "🎁 [CLEANING-STRATEGY] ═══ APPLICATION DES PROMOTIONS ═══");
    devLog.debug('Strategy', 
      `📊 [CLEANING-STRATEGY] Promotion active: ${isPromotionActive}`,
    );
    devLog.debug('Strategy', `📊 [CLEANING-STRATEGY] Code promo: ${promotionCode}`);
    devLog.debug('Strategy', 
      `📊 [CLEANING-STRATEGY] Type: ${promotionType}, Valeur: ${promotionValue}`,
    );
    devLog.debug('Strategy', 
      `💰 [CLEANING-STRATEGY] Prix de base avant promotion: ${basePrice.toFixed(2)}€`,
    );

    let finalPrice = basePrice;
    let discountAmount = 0;

    // Vérifier si une promotion est active
    if (
      !isPromotionActive ||
      !promotionCode ||
      !promotionValue ||
      !promotionType
    ) {
      devLog.debug('Strategy', "❌ [CLEANING-STRATEGY] Aucune promotion active");
      return { finalPrice, discountAmount };
    }

    // Appliquer la promotion selon le type
    if (promotionType === "PERCENT") {
      discountAmount = (basePrice * promotionValue) / 100;
      finalPrice = basePrice - discountAmount;
      devLog.debug('Strategy', 
        `✅ [CLEANING-STRATEGY] Promotion pourcentage appliquée: -${promotionValue}% = -${discountAmount.toFixed(2)}€`,
      );
    } else if (promotionType === "FIXED") {
      discountAmount = promotionValue;
      finalPrice = Math.max(0, basePrice - promotionValue); // Éviter les prix négatifs
      devLog.debug('Strategy', 
        `✅ [CLEANING-STRATEGY] Promotion fixe appliquée: -${promotionValue}€`,
      );
    } else {
      devLog.debug('Strategy', 
        `⚠️ [CLEANING-STRATEGY] Type de promotion non reconnu: ${promotionType}`,
      );
    }

    devLog.debug('Strategy', 
      `💰 [CLEANING-STRATEGY] Prix final après promotion: ${finalPrice.toFixed(2)}€`,
    );
    return { finalPrice, discountAmount };
  }
}
