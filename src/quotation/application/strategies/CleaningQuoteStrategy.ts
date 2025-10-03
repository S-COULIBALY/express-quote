import { injectable, inject } from "inversify";
import { QuoteStrategy } from "../../domain/interfaces/QuoteStrategy";
import { QuoteContext } from "../../domain/valueObjects/QuoteContext";
import { Quote } from "../../domain/valueObjects/Quote";
import { Money } from "../../domain/valueObjects/Money";
import { ServiceType } from "../../domain/enums/ServiceType";
import { ConfigurationService } from "../services/ConfigurationService";
import { RuleEngine } from "../../domain/services/RuleEngine";
import { calculationDebugLogger } from "../../../lib/calculation-debug-logger";
import { UnifiedDataService, ServiceType as UnifiedServiceType, ConfigurationCategory } from "../../infrastructure/services/UnifiedDataService";
import { DefaultValues } from "../../domain/configuration/DefaultValues";
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
    @inject("TemplateRuleEngine") ruleEngine?: RuleEngine
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
      const businessRules = await this.unifiedDataService.getBusinessRulesForEngine(UnifiedServiceType.CLEANING);
      if (businessRules.length > 0) {
        console.log(`✅ [CLEANING-STRATEGY] ${businessRules.length} règles métier chargées depuis UnifiedDataService`);
        // Remplacer le RuleEngine avec les nouvelles règles
        this.ruleEngine = new RuleEngine(businessRules);
      } else {
        console.log('⚠️ [CLEANING-STRATEGY] Aucune règle métier trouvée, utilisation des règles par défaut');
      }
    } catch (error) {
      console.warn('⚠️ [CLEANING-STRATEGY] Erreur lors du chargement des règles métier:', error);
      // Garder le RuleEngine existant en cas d'erreur
    }
  }

  canHandle(serviceType: string): boolean {
    return serviceType === ServiceType.CLEANING || 
           serviceType === ServiceType.CLEANING_PREMIUM ||
           serviceType === 'CLEANING' ||
           serviceType === 'CLEANING_PREMIUM';
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
          this.serviceType
        );
        
        calculationDebugLogger.logFinalCalculation(defaultQuote, Date.now() - startTime);
        return defaultQuote;
      }

      const enrichedContext = await this.enrichContext(context);
      const basePrice = await this.getBasePrice(enrichedContext);
      
      const { finalPrice, discounts } = this.ruleEngine.execute(enrichedContext, new Money(basePrice));

      const quote = new Quote(new Money(basePrice), finalPrice, discounts, this.serviceType);
      calculationDebugLogger.logFinalCalculation(quote, Date.now() - startTime);
      
      return quote;
    } catch (error) {
      calculationDebugLogger.logCalculationError(error, 'CLEANING_STRATEGY', data);
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

    console.log('\n🧽 [CLEANING-STRATEGY] ═══════════════════════════════════════════════════');
    console.log('🧽 [CLEANING-STRATEGY] ═══ DÉBUT CALCUL PRIX DE BASE CLEANING ═══');
    console.log('🧽 [CLEANING-STRATEGY] ═══════════════════════════════════════════════════');
    console.log('📊 [CLEANING-STRATEGY] Type de service:', serviceType);
    console.log('📋 [CLEANING-STRATEGY] Données d\'entrée:', {
      defaultPrice: data.defaultPrice,
      surface,
      workers,
      duration,
      rooms
    });

    // ✅ NOUVEAU: Récupérer les constantes depuis le système unifié
    const pricingConstants = await this.getPricingConstants();
    const minimumPrice = pricingConstants['CLEANING_MINIMUM_PRICE'] || DefaultValues.CLEANING_MINIMUM_PRICE;
    const laborRate = pricingConstants['SERVICE_WORKER_PRICE_PER_HOUR'] || DefaultValues.WORKER_HOUR_RATE;

    let basePrice = 0;
    let surfaceCost = 0;
    let roomsCost = 0;
    let laborCost = 0;

    // ✅ CAS 1 : CLEANING_PREMIUM (sur mesure) → SURFACE UNIQUEMENT
    if (serviceType === ServiceType.CLEANING_PREMIUM) {
      // ✅ VALIDATION: CLEANING_PREMIUM requiert une surface
      if (!surface || surface === 0) {
        throw new Error('CLEANING_PREMIUM (ménage sur mesure) requiert une surface non nulle');
      }

      console.log('\n✨ [CLEANING-STRATEGY] MODE: MÉNAGE SUR MESURE (SURFACE UNIQUEMENT)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Calcul basé sur la surface
      surfaceCost = this.calculateSurfaceCost(surface, pricingConstants);
      const pricePerM2 = pricingConstants['CLEANING_PRICE_PER_M2'] || DefaultValues.CLEANING_PRICE_PER_M2;

      console.log(`\n📏 [CLEANING-STRATEGY] ─── Calcul Surface ───`);
      console.log(`   📐 Surface à nettoyer: ${surface}m²`);
      console.log(`   💶 Tarif au m²: ${pricePerM2.toFixed(2)}€/m²`);
      console.log(`   └─ Coût total: ${surface}m² × ${pricePerM2.toFixed(2)}€ = ${surfaceCost.toFixed(2)}€`);

      // Supplément pièces si applicable
      if (rooms > 1) {
        roomsCost = await this.calculateRoomsCost(rooms, pricingConstants);
        console.log(`\n🏠 [CLEANING-STRATEGY] ─── Supplément Pièces ───`);
        console.log(`   🚪 Pièces supplémentaires: ${rooms - 1}`);
        console.log(`   └─ Supplément: ${roomsCost.toFixed(2)}€`);
      }

      basePrice = Math.max(surfaceCost + roomsCost, minimumPrice);

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('💰 [CLEANING-STRATEGY] RÉSUMÉ (SUR MESURE):');
      console.log(`   • Surface: ${surfaceCost.toFixed(2)}€ (${surface}m²)`);
      console.log(`   • Pièces: ${roomsCost.toFixed(2)}€ (${rooms > 1 ? rooms - 1 : 0} extra)`);
      console.log(`   • Minimum: ${minimumPrice.toFixed(2)}€`);
      console.log(`   = ${basePrice.toFixed(2)}€`);
    }

    // ✅ CAS 2 : CLEANING (catalogue) → MAIN D'ŒUVRE UNIQUEMENT
    else if (serviceType === ServiceType.CLEANING) {
      // ✅ VALIDATION: CLEANING requiert workers ET duration
      if (!workers || workers === 0 || !duration || duration === 0) {
        throw new Error('CLEANING (pack catalogue) requiert workers et duration non nuls');
      }

      console.log('\n📦 [CLEANING-STRATEGY] MODE: PACK CATALOGUE (MAIN D\'ŒUVRE UNIQUEMENT)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Calcul basé sur main d'œuvre
      laborCost = workers * duration * laborRate;

      console.log(`\n👥 [CLEANING-STRATEGY] ─── Calcul Main d'œuvre ───`);
      console.log(`   👤 Travailleurs: ${workers}`);
      console.log(`   ⏱️  Durée: ${duration}h`);
      console.log(`   💶 Tarif horaire: ${laborRate.toFixed(2)}€/h`);
      console.log(`   └─ Coût total: ${workers} × ${duration}h × ${laborRate.toFixed(2)}€ = ${laborCost.toFixed(2)}€`);

      basePrice = Math.max(laborCost, minimumPrice);

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('💰 [CLEANING-STRATEGY] RÉSUMÉ (PACK CATALOGUE):');
      console.log(`   • Main d'œuvre: ${laborCost.toFixed(2)}€ (${workers} × ${duration}h)`);
      console.log(`   • Minimum: ${minimumPrice.toFixed(2)}€`);
      console.log(`   = ${basePrice.toFixed(2)}€`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ✅ NOUVEAU: APPLICATION DES PROMOTIONS
    const priceBeforePromotion = basePrice;
    const promotionResult = this.applyPromotionCodes(context, basePrice);
    basePrice = promotionResult.finalPrice;

    if (promotionResult.discountAmount > 0) {
      console.log(`\n🎁 [CLEANING-STRATEGY] Promotion appliquée: -${promotionResult.discountAmount.toFixed(2)}€`);
      console.log(`   📊 Prix final après promotion: ${basePrice.toFixed(2)}€`);
    }

    console.log(`\n💰 [CLEANING-STRATEGY] ═══ PRIX DE BASE FINAL: ${basePrice.toFixed(2)}€ ═══`);
    console.log('🧽 [CLEANING-STRATEGY] ═══════════════════════════════════════════════════\n');

    return basePrice;
  }

  private calculateSurfaceCost(surface: number, pricingConstants: Record<string, number>): number {
    const pricePerM2 = pricingConstants['CLEANING_PRICE_PER_M2'] || DefaultValues.CLEANING_PRICE_PER_M2;
    return surface * pricePerM2;
  }

  private async calculateRoomsCost(rooms: number, pricingConstants: Record<string, number>): Promise<number> {
    try {
      const [minimumPrice, extraRoomMultiplier] = await Promise.all([
        this.unifiedDataService.getConfigurationValue(
          ConfigurationCategory.PRICING,
          BusinessTypePricingConfigKey.CLEANING_MINIMUM_PRICE,
          pricingConstants['CLEANING_MINIMUM_PRICE'] || DefaultValues.CLEANING_MINIMUM_PRICE
        ),
        this.unifiedDataService.getConfigurationValue(
          ConfigurationCategory.PRICING,
          'CLEANING_EXTRA_ROOM_MULTIPLIER',
          0.1
        )
      ]);
      return (rooms - 1) * (minimumPrice * extraRoomMultiplier);
    } catch (error) {
      console.warn('⚠️ [CLEANING-STRATEGY] Erreur récupération coût pièces, utilisation fallback:', error);
      const minimumPrice = pricingConstants['CLEANING_MINIMUM_PRICE'] || DefaultValues.CLEANING_MINIMUM_PRICE;
      return (rooms - 1) * (minimumPrice * 0.1); // Fallback hardcodé
    }
  }

  private hasModifications(context: QuoteContext): boolean {
    const data = context.getAllData();
    return !!(data.surface || data.rooms || data.workers || data.duration);
  }

  private async enrichContext(context: QuoteContext): Promise<QuoteContext> {
    const data = context.getAllData();
    const enrichedContext = new QuoteContext(context.getServiceType());

    // Copier toutes les données existantes
    Object.keys(data).forEach(key => {
      enrichedContext.setValue(key, data[key]);
    });

    // ✅ MIGRÉ: Ajouter des calculs enrichis (depuis configuration)
    if (data.surface) {
      const [estimatedDuration, requiredWorkers] = await Promise.all([
        this.calculateEstimatedDuration(data.surface),
        this.calculateRequiredWorkers(data.surface)
      ]);

      enrichedContext.setValue('estimatedDuration', estimatedDuration);
      enrichedContext.setValue('requiredWorkers', requiredWorkers);
    }

    return enrichedContext;
  }

  private async calculateEstimatedDuration(surface: number): Promise<number> {
    try {
      const m2PerHour = await this.unifiedDataService.getConfigurationValue(
        ConfigurationCategory.PRICING,
        'CLEANING_M2_PER_HOUR',
        20
      );
      return Math.ceil(surface / m2PerHour);
    } catch (error) {
      console.warn('⚠️ [CLEANING-STRATEGY] Erreur récupération m2 par heure, utilisation fallback:', error);
      return Math.ceil(surface / 20); // Fallback hardcodé
    }
  }

  private async calculateRequiredWorkers(surface: number): Promise<number> {
    try {
      const [threshold1, threshold2] = await Promise.all([
        this.unifiedDataService.getConfigurationValue(
          ConfigurationCategory.PRICING,
          'CLEANING_SURFACE_THRESHOLD_1',
          100
        ),
        this.unifiedDataService.getConfigurationValue(
          ConfigurationCategory.PRICING,
          'CLEANING_SURFACE_THRESHOLD_2',
          200
        )
      ]);

      if (surface <= threshold1) return 1;
      if (surface <= threshold2) return 2;
      return 3;
    } catch (error) {
      console.warn('⚠️ [CLEANING-STRATEGY] Erreur récupération seuils surface, utilisation fallback:', error);
      if (surface <= 100) return 1;
      if (surface <= 200) return 2;
      return 3; // Fallback hardcodé
    }
  }

  /**
   * ✅ NOUVEAU: Applique les codes promotion sur le prix de base
   * Cette méthode est appelée AVANT l'application des règles métier
   */
  private applyPromotionCodes(context: QuoteContext, basePrice: number): { finalPrice: number; discountAmount: number } {
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
      isPromotionActive = data.__presetSnapshot.isPromotionActive !== undefined ? data.__presetSnapshot.isPromotionActive : isPromotionActive;
    }

    console.log('🎁 [CLEANING-STRATEGY] ═══ APPLICATION DES PROMOTIONS ═══');
    console.log(`📊 [CLEANING-STRATEGY] Promotion active: ${isPromotionActive}`);
    console.log(`📊 [CLEANING-STRATEGY] Code promo: ${promotionCode}`);
    console.log(`📊 [CLEANING-STRATEGY] Type: ${promotionType}, Valeur: ${promotionValue}`);
    console.log(`💰 [CLEANING-STRATEGY] Prix de base avant promotion: ${basePrice.toFixed(2)}€`);

    let finalPrice = basePrice;
    let discountAmount = 0;

    // Vérifier si une promotion est active
    if (!isPromotionActive || !promotionCode || !promotionValue || !promotionType) {
      console.log('❌ [CLEANING-STRATEGY] Aucune promotion active');
      return { finalPrice, discountAmount };
    }

    // Appliquer la promotion selon le type
    if (promotionType === 'PERCENT') {
      discountAmount = (basePrice * promotionValue) / 100;
      finalPrice = basePrice - discountAmount;
      console.log(`✅ [CLEANING-STRATEGY] Promotion pourcentage appliquée: -${promotionValue}% = -${discountAmount.toFixed(2)}€`);
    } else if (promotionType === 'FIXED') {
      discountAmount = promotionValue;
      finalPrice = Math.max(0, basePrice - promotionValue); // Éviter les prix négatifs
      console.log(`✅ [CLEANING-STRATEGY] Promotion fixe appliquée: -${promotionValue}€`);
    } else {
      console.log(`⚠️ [CLEANING-STRATEGY] Type de promotion non reconnu: ${promotionType}`);
    }

    console.log(`💰 [CLEANING-STRATEGY] Prix final après promotion: ${finalPrice.toFixed(2)}€`);
    return { finalPrice, discountAmount };
  }

  /**
   * ✅ NOUVEAU: Récupère les constantes de pricing depuis le système unifié
   */
  private async getPricingConstants(): Promise<Record<string, number>> {
    try {
      // 1. Essayer de récupérer depuis le service unifié
      const unifiedConfigs = await this.unifiedDataService.getAllPricingConstants(UnifiedServiceType.CLEANING);
      if (Object.keys(unifiedConfigs).length > 0) {
        console.log(`✅ [CLEANING-STRATEGY] ${Object.keys(unifiedConfigs).length} configurations récupérées depuis UnifiedDataService`);
        return unifiedConfigs;
      }
    } catch (error) {
      console.warn('⚠️ [CLEANING-STRATEGY] Erreur UnifiedDataService, fallback vers DefaultValues:', error);
    }

    // 2. Dernier recours : DefaultValues
    console.log('⚠️ [CLEANING-STRATEGY] Utilisation de DefaultValues comme fallback');
    return {
      'CLEANING_PRICE_PER_M2': DefaultValues.CLEANING_PRICE_PER_M2,
      'CLEANING_WORKER_PRICE': DefaultValues.CLEANING_WORKER_PRICE,
      'CLEANING_WORKER_HOUR_RATE': DefaultValues.CLEANING_WORKER_HOUR_RATE,
      'CLEANING_MINIMUM_PRICE': DefaultValues.CLEANING_MINIMUM_PRICE
    };
  }
}
