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
import { logger } from "../../../lib/logger";
import {
  UnifiedDataService,
  ServiceType as UnifiedServiceType,
  ConfigurationCategory,
} from "../../infrastructure/services/UnifiedDataService";
import { configAccessService } from "../services/ConfigurationAccessService";
import { BusinessTypePricingConfigKey } from "../../domain/configuration/ConfigurationKey";

@injectable()
export class DeliveryQuoteStrategy implements QuoteStrategy {
  serviceType = ServiceType.DELIVERY;
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

    // Service unifié pour accès aux données
    this.unifiedDataService = UnifiedDataService.getInstance();

    // Charger les règles métier au démarrage
    this.initializeRules();
  }

  /**
   * Initialise les règles métier depuis le système unifié
   * Charge toutes les règles actives DELIVERY
   */
  private async initializeRules(): Promise<void> {
    try {
      const businessRules =
        await this.unifiedDataService.getBusinessRulesForEngine(
          UnifiedServiceType.DELIVERY,
        );
      if (businessRules.length > 0) {
        devLog.debug('Strategy',
          `✅ [DELIVERY-STRATEGY] ${businessRules.length} règles métier chargées depuis UnifiedDataService`,
        );
        // Remplacer le RuleEngine avec les nouvelles règles
        this.ruleEngine = new RuleEngine(businessRules);
      } else {
        devLog.debug('Strategy',
          "⚠️ [DELIVERY-STRATEGY] Aucune règle métier trouvée, utilisation des règles par défaut",
        );
      }
    } catch (error) {
      devLog.warn('Strategy',
        "⚠️ [DELIVERY-STRATEGY] Erreur lors du chargement des règles métier:",
        error,
      );
      // Garder le RuleEngine existant en cas d'erreur
    }
  }

  /**
   * Recharge les règles métier depuis le système unifié
   * Le filtrage se fait automatiquement : seules les règles SÉLECTIONNÉES s'appliquent
   */
  private async initializeRulesWithContext(context: QuoteContext): Promise<void> {
    try {
      const businessRules =
        await this.unifiedDataService.getBusinessRulesForEngine(
          UnifiedServiceType.DELIVERY
        );

      if (businessRules.length > 0) {
        devLog.debug('Strategy',
          `✅ [DELIVERY-STRATEGY] ${businessRules.length} règles métier chargées`
        );
        // Remplacer le RuleEngine avec toutes les règles
        this.ruleEngine = new RuleEngine(businessRules);
      }
    } catch (error) {
      devLog.warn('Strategy',
        "⚠️ [DELIVERY-STRATEGY] Erreur lors du rechargement des règles métier:", error
      );
      // Garder le RuleEngine existant en cas d'erreur
    }
  }

  canHandle(serviceType: string): boolean {
    return serviceType === ServiceType.DELIVERY || serviceType === "DELIVERY";
  }

  async calculate(context: QuoteContext): Promise<Quote> {
    const startTime = Date.now();
    const data = context.getAllData();
    const serviceType = context.getServiceType();

    // Log de début
    devLog.debug('DeliveryStrategy', `🎯 Calcul ${serviceType}`);

    calculationDebugLogger.startPriceCalculation(this.serviceType, data);

    try {
      // Recharger les règles métier
      await this.initializeRulesWithContext(context);
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

      // Appliquer les règles métier via le RuleEngine (startRulesEngine appelé dans RuleEngine.execute)
      const ruleResult = this.ruleEngine.execute(
        enrichedContext,
        new Money(basePrice),
      );

      devLog.debug('Strategy', 
        `\n📊 [DELIVERY-STRATEGY] Résultat du RuleEngine (nouvelle architecture):`,
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

      // ✅ NOUVEAU: Stocker le RuleExecutionResult dans le contexte pour traçabilité
      context.setValue('__ruleExecutionResult', ruleResult);

      const quote = new Quote(
        new Money(basePrice),
        ruleResult.finalPrice,
        discounts,
        this.serviceType,
      );
      calculationDebugLogger.logFinalCalculation(quote, Date.now() - startTime);
      calculationDebugLogger.finishRulesEngine({ finalPrice: quote.getTotalPrice().getAmount(), appliedRules: discounts });

      return quote;
    } catch (error) {
      calculationDebugLogger.logCalculationError(
        error,
        "DELIVERY_STRATEGY",
        data,
      );
      throw error;
    } finally {
      // Log de fin
      devLog.debug('DeliveryStrategy', `✅ Calcul terminé en ${Date.now() - startTime}ms`);
    }
  }

  async getBasePrice(context: QuoteContext): Promise<number> {
    const data = context.getAllData();
    const distance = data.distance || 0;
    const weight = data.weight || 0;
    const volume = data.volume || 0;
    const urgency = data.urgency || "normal";

    devLog.debug('Strategy', 
      "\n🚚 [DELIVERY-STRATEGY] ═══════════════════════════════════════════════════",
    );
    devLog.debug('Strategy', 
      "🚚 [DELIVERY-STRATEGY] ═══ DÉBUT CALCUL PRIX DE BASE DELIVERY ═══",
    );
    devLog.debug('Strategy', 
      "🚚 [DELIVERY-STRATEGY] ═══════════════════════════════════════════════════",
    );
    devLog.debug('Strategy', 
      "📊 [DELIVERY-STRATEGY] Type de service:",
      context.getServiceType(),
    );
    devLog.debug('Strategy', "📋 [DELIVERY-STRATEGY] Données d'entrée:", {
      defaultPrice: data.defaultPrice,
      distance,
      weight,
      volume,
      urgency,
    });

    // ✅ NOUVEAU: Récupérer les constantes depuis ConfigurationAccessService (BDD → Cache → DefaultValues)
    const minimumPrice = await configAccessService.get<number>(
      "DELIVERY_BASE_PRICE",
    );
    let basePrice = Math.max(data.defaultPrice || 0, minimumPrice);
    if (minimumPrice > (data.defaultPrice || 0)) {
      calculationDebugLogger.logPriceComponent('Prix minimum', minimumPrice, `max(${data.defaultPrice || 0}€, ${minimumPrice}€)`, { minimumPrice }, 'max(defaultPrice, minimumPrice)');
    }

    if (data.defaultPrice && data.defaultPrice < minimumPrice) {
      devLog.debug('Strategy', 
        `⚠️  [DELIVERY-STRATEGY] Prix initial (${data.defaultPrice.toFixed(2)}€) < minimum (${minimumPrice.toFixed(2)}€)`,
      );
      devLog.debug('Strategy', 
        `✅ [DELIVERY-STRATEGY] Application du prix minimum: ${minimumPrice.toFixed(2)}€`,
      );
    }

    devLog.debug('Strategy', 
      `\n💰 [DELIVERY-STRATEGY] PRIX DE BASE INITIAL: ${basePrice.toFixed(2)}€`,
    );
    devLog.debug('Strategy', "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // ✅ AMÉLIORATION: Détails distance
    devLog.debug('Strategy', "\n📏 [DELIVERY-STRATEGY] ─── Calcul Distance ───");
    let distanceCost = 0;
    if (distance > 0) {
      const pricePerKm = await configAccessService.get<number>(
        "DELIVERY_PRICE_PER_KM",
      );
      distanceCost = distance * pricePerKm;
      calculationDebugLogger.logPriceComponent(
        'Distance',
        distanceCost,
        `${distance}km × ${pricePerKm.toFixed(2)}€`,
        { pricePerKm },
        'distance * pricePerKm'
      );
      devLog.debug('Strategy', `   🛣️  Distance à parcourir: ${distance}km`);
      devLog.debug('Strategy', `   💶 Tarif par km: ${pricePerKm.toFixed(2)}€/km`);
      devLog.debug('Strategy', 
        `   └─ Coût distance: ${distance}km × ${pricePerKm.toFixed(2)}€ = ${distanceCost.toFixed(2)}€`,
      );
      basePrice += distanceCost;
      devLog.debug('Strategy', `   ✅ Sous-total après distance: ${basePrice.toFixed(2)}€`);
    } else {
      devLog.debug('Strategy', 
        "   ℹ️  Aucune distance spécifiée (utilisation prix de base uniquement)",
      );
    }

    // ✅ AMÉLIORATION: Détails poids
    devLog.debug('Strategy', "\n⚖️  [DELIVERY-STRATEGY] ─── Calcul Poids ───");
    let weightCost = 0;
    if (weight > 0) {
      const weightSurcharge = await configAccessService.get<number>(
        "DELIVERY_WEIGHT_SURCHARGE",
      );
      weightCost = weight * weightSurcharge;
      calculationDebugLogger.logPriceComponent(
        'Poids',
        weightCost,
        `${weight}kg × ${weightSurcharge.toFixed(2)}€`,
        { weightSurcharge },
        'weight * weightSurcharge'
      );
      devLog.debug('Strategy', `   ⚖️  Poids de la livraison: ${weight}kg`);
      devLog.debug('Strategy', `   💶 Supplément par kg: ${weightSurcharge.toFixed(2)}€/kg`);
      devLog.debug('Strategy', 
        `   └─ Coût poids: ${weight}kg × ${weightSurcharge.toFixed(2)}€ = ${weightCost.toFixed(2)}€`,
      );
      basePrice += weightCost;
      devLog.debug('Strategy', `   ✅ Sous-total après poids: ${basePrice.toFixed(2)}€`);
    } else {
      devLog.debug('Strategy', "   ℹ️  Aucun poids spécifié (pas de supplément)");
    }

    // ✅ AMÉLIORATION: Détails volume
    devLog.debug('Strategy', "\n📦 [DELIVERY-STRATEGY] ─── Calcul Volume ───");
    let volumeCost = 0;
    if (volume > 0) {
      volumeCost = await this.calculateVolumeCost(volume);
      calculationDebugLogger.logPriceComponent(
        'Volume',
        volumeCost,
        `${volume}m³ × prix_m3`,
        { volume },
        'volume * pricePerM3'
      );
      const volumePrice = await this.unifiedDataService.getConfigurationValue(
        ConfigurationCategory.PRICING,
        "DELIVERY_VOLUME_PRICE_PER_M3",
        1.5,
      );
      devLog.debug('Strategy', `   📦 Volume de la livraison: ${volume}m³`);
      devLog.debug('Strategy', `   💶 Tarif par m³: ${volumePrice.toFixed(2)}€/m³`);
      devLog.debug('Strategy', 
        `   └─ Coût volume: ${volume}m³ × ${volumePrice.toFixed(2)}€ = ${volumeCost.toFixed(2)}€`,
      );
      basePrice += volumeCost;
      devLog.debug('Strategy', `   ✅ Sous-total après volume: ${basePrice.toFixed(2)}€`);
    } else {
      devLog.debug('Strategy', "   ℹ️  Aucun volume spécifié (pas de supplément)");
    }

    // ✅ AMÉLIORATION: Détails urgence
    devLog.debug('Strategy', "\n⚡ [DELIVERY-STRATEGY] ─── Calcul Urgence ───");
    const priceBeforeUrgency = basePrice;
    let urgencyMultiplier = 1;
    let urgencyLabel = "NORMALE";

    if (urgency === "express") {
      urgencyMultiplier = await this.unifiedDataService.getConfigurationValue(
        ConfigurationCategory.PRICING,
        "DELIVERY_EXPRESS_MULTIPLIER",
        1.5,
      );
      urgencyLabel = "EXPRESS";
      devLog.debug('Strategy', `   ⚡ Mode de livraison: EXPRESS`);
      devLog.debug('Strategy', `   💶 Multiplicateur: ×${urgencyMultiplier}`);
      devLog.debug('Strategy', 
        `   └─ Calcul: ${priceBeforeUrgency.toFixed(2)}€ × ${urgencyMultiplier} = ${(priceBeforeUrgency * urgencyMultiplier).toFixed(2)}€`,
      );
      basePrice *= urgencyMultiplier;
      calculationDebugLogger.logPriceComponent(
        `Urgence (${urgencyLabel})`,
        basePrice - priceBeforeUrgency,
        `${priceBeforeUrgency.toFixed(2)}€ × ${urgencyMultiplier}`,
        { urgencyMultiplier, urgencyLabel },
        'priceBeforeUrgency * urgencyMultiplier - priceBeforeUrgency'
      );
      devLog.debug('Strategy', `   ✅ Sous-total après urgence: ${basePrice.toFixed(2)}€`);
    } else if (urgency === "urgent") {
      urgencyMultiplier = await this.unifiedDataService.getConfigurationValue(
        ConfigurationCategory.PRICING,
        "DELIVERY_URGENT_MULTIPLIER",
        2.0,
      );
      urgencyLabel = "URGENT";
      devLog.debug('Strategy', `   🚨 Mode de livraison: URGENT`);
      devLog.debug('Strategy', `   💶 Multiplicateur: ×${urgencyMultiplier}`);
      devLog.debug('Strategy', 
        `   └─ Calcul: ${priceBeforeUrgency.toFixed(2)}€ × ${urgencyMultiplier} = ${(priceBeforeUrgency * urgencyMultiplier).toFixed(2)}€`,
      );
      basePrice *= urgencyMultiplier;
      devLog.debug('Strategy', `   ✅ Sous-total après urgence: ${basePrice.toFixed(2)}€`);
    } else {
      devLog.debug('Strategy', `   🕐 Mode de livraison: NORMALE (pas de supplément)`);
      devLog.debug('Strategy', `   💶 Multiplicateur: ×1 (aucun)`);
    }

    // ✅ AMÉLIORATION: Résumé avant promotions
    devLog.debug('Strategy', "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    devLog.debug('Strategy', "💰 [DELIVERY-STRATEGY] ═══ PRIX DE BASE AVANT PROMOTIONS ═══");
    devLog.debug('Strategy', `   📊 Prix total: ${basePrice.toFixed(2)}€`);
    devLog.debug('Strategy', "\n   📝 Détail du calcul:");
    devLog.debug('Strategy', `      • Prix de départ: ${data.defaultPrice || 0}€`);
    devLog.debug('Strategy', 
      `      • Distance: +${distanceCost.toFixed(2)}€ (${distance}km)`,
    );
    devLog.debug('Strategy', `      • Poids: +${weightCost.toFixed(2)}€ (${weight}kg)`);
    devLog.debug('Strategy', `      • Volume: +${volumeCost.toFixed(2)}€ (${volume}m³)`);
    devLog.debug('Strategy', `      • Urgence: ×${urgencyMultiplier} (${urgencyLabel})`);
    devLog.debug('Strategy', `      = ${basePrice.toFixed(2)}€`);
    devLog.debug('Strategy', "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // ✅ NOUVEAU: APPLICATION DES PROMOTIONS
    const priceBeforePromotion = basePrice;
    const promotionResult = this.applyPromotionCodes(context, basePrice);
    basePrice = promotionResult.finalPrice;

    if (promotionResult.discountAmount > 0) {
      devLog.debug('Strategy', 
        `\n🎁 [DELIVERY-STRATEGY] Promotion appliquée: -${promotionResult.discountAmount.toFixed(2)}€`,
      );
      devLog.debug('Strategy', `   📊 Prix final après promotion: ${basePrice.toFixed(2)}€`);
    }

    calculationDebugLogger.logBasePriceCalculation(context.getServiceType(), {
      baseStart: data.defaultPrice || 0,
      distanceCost,
      weightCost,
      volumeCost,
      urgencyMultiplier
    }, basePrice);
    devLog.debug('Strategy', 
      "🚚 [DELIVERY-STRATEGY] ═══════════════════════════════════════════════════\n",
    );

    return basePrice;
  }

  private async calculateVolumeCost(volume: number): Promise<number> {
    try {
      const volumePrice = await this.unifiedDataService.getConfigurationValue(
        ConfigurationCategory.PRICING,
        "DELIVERY_VOLUME_PRICE_PER_M3",
        1.5,
      );
      return volume * volumePrice;
    } catch (error) {
      devLog.warn('Strategy', 
        "⚠️ [DELIVERY-STRATEGY] Erreur récupération prix volume, utilisation fallback:",
        error,
      );
      return volume * 1.5; // Fallback hardcodé
    }
  }

  private hasModifications(context: QuoteContext): boolean {
    const data = context.getAllData();
    return !!(data.distance || data.weight || data.volume || data.urgency);
  }

  private async enrichContext(context: QuoteContext): Promise<QuoteContext> {
    const data = context.getAllData();
    const enrichedContext = new QuoteContext(context.getServiceType());

    // Copier toutes les données existantes
    Object.keys(data).forEach((key) => {
      enrichedContext.setValue(key, data[key]);
    });

    // ✅ MIGRÉ: Ajouter des calculs enrichis (depuis configuration)
    if (data.distance) {
      const [estimatedDuration, fuelCost, tollCost] = await Promise.all([
        this.calculateEstimatedDuration(data.distance),
        this.calculateFuelCost(data.distance),
        this.calculateTollCost(data.distance),
      ]);

      enrichedContext.setValue("estimatedDuration", estimatedDuration);
      enrichedContext.setValue("fuelCost", fuelCost);
      enrichedContext.setValue("tollCost", tollCost);
    }

    return enrichedContext;
  }

  private async calculateEstimatedDuration(distance: number): Promise<number> {
    try {
      const travelSpeed = await this.unifiedDataService.getConfigurationValue(
        ConfigurationCategory.PRICING,
        "DELIVERY_TRAVEL_SPEED_KMH",
        50,
      );
      return Math.ceil(distance / travelSpeed);
    } catch (error) {
      devLog.warn('Strategy', 
        "⚠️ [DELIVERY-STRATEGY] Erreur récupération vitesse, utilisation fallback:",
        error,
      );
      return Math.ceil(distance / 50); // Fallback hardcodé
    }
  }

  private async calculateFuelCost(distance: number): Promise<number> {
    try {
      const fuelCostPerKm = await this.unifiedDataService.getConfigurationValue(
        ConfigurationCategory.PRICING,
        "DELIVERY_FUEL_COST_PER_KM",
        0.15,
      );
      return distance * fuelCostPerKm;
    } catch (error) {
      devLog.warn('Strategy', 
        "⚠️ [DELIVERY-STRATEGY] Erreur récupération coût carburant, utilisation fallback:",
        error,
      );
      return distance * 0.15; // Fallback hardcodé
    }
  }

  private async calculateTollCost(distance: number): Promise<number> {
    try {
      const [tollCostPerKm, tollThreshold] = await Promise.all([
        this.unifiedDataService.getConfigurationValue(
          ConfigurationCategory.PRICING,
          "DELIVERY_TOLL_COST_PER_KM",
          0.05,
        ),
        this.unifiedDataService.getConfigurationValue(
          ConfigurationCategory.PRICING,
          "DELIVERY_TOLL_THRESHOLD_KM",
          100,
        ),
      ]);
      return distance > tollThreshold ? distance * tollCostPerKm : 0;
    } catch (error) {
      devLog.warn('Strategy', 
        "⚠️ [DELIVERY-STRATEGY] Erreur récupération coût péage, utilisation fallback:",
        error,
      );
      return distance > 100 ? distance * 0.05 : 0; // Fallback hardcodé
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

    devLog.debug('Strategy', "🎁 [DELIVERY-STRATEGY] ═══ APPLICATION DES PROMOTIONS ═══");
    devLog.debug('Strategy', 
      `📊 [DELIVERY-STRATEGY] Promotion active: ${isPromotionActive}`,
    );
    devLog.debug('Strategy', `📊 [DELIVERY-STRATEGY] Code promo: ${promotionCode}`);
    devLog.debug('Strategy', 
      `📊 [DELIVERY-STRATEGY] Type: ${promotionType}, Valeur: ${promotionValue}`,
    );
    devLog.debug('Strategy', 
      `💰 [DELIVERY-STRATEGY] Prix de base avant promotion: ${basePrice.toFixed(2)}€`,
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
      devLog.debug('Strategy', "❌ [DELIVERY-STRATEGY] Aucune promotion active");
      return { finalPrice, discountAmount };
    }

    // Appliquer la promotion selon le type
    if (promotionType === "PERCENT") {
      discountAmount = (basePrice * promotionValue) / 100;
      finalPrice = basePrice - discountAmount;
      devLog.debug('Strategy', 
        `✅ [DELIVERY-STRATEGY] Promotion pourcentage appliquée: -${promotionValue}% = -${discountAmount.toFixed(2)}€`,
      );
    } else if (promotionType === "FIXED") {
      discountAmount = promotionValue;
      finalPrice = Math.max(0, basePrice - promotionValue); // Éviter les prix négatifs
      devLog.debug('Strategy', 
        `✅ [DELIVERY-STRATEGY] Promotion fixe appliquée: -${promotionValue}€`,
      );
    } else {
      devLog.debug('Strategy', 
        `⚠️ [DELIVERY-STRATEGY] Type de promotion non reconnu: ${promotionType}`,
      );
    }

    devLog.debug('Strategy', 
      `💰 [DELIVERY-STRATEGY] Prix final après promotion: ${finalPrice.toFixed(2)}€`,
    );
    return { finalPrice, discountAmount };
  }
}
