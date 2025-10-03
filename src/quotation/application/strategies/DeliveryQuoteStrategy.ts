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
export class DeliveryQuoteStrategy implements QuoteStrategy {
  serviceType = ServiceType.DELIVERY;
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
      const businessRules = await this.unifiedDataService.getBusinessRulesForEngine(UnifiedServiceType.DELIVERY);
      if (businessRules.length > 0) {
        console.log(`✅ [DELIVERY-STRATEGY] ${businessRules.length} règles métier chargées depuis UnifiedDataService`);
        // Remplacer le RuleEngine avec les nouvelles règles
        this.ruleEngine = new RuleEngine(businessRules);
      } else {
        console.log('⚠️ [DELIVERY-STRATEGY] Aucune règle métier trouvée, utilisation des règles par défaut');
      }
    } catch (error) {
      console.warn('⚠️ [DELIVERY-STRATEGY] Erreur lors du chargement des règles métier:', error);
      // Garder le RuleEngine existant en cas d'erreur
    }
  }

  canHandle(serviceType: string): boolean {
    return serviceType === ServiceType.DELIVERY || serviceType === 'DELIVERY';
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
      calculationDebugLogger.logCalculationError(error, 'DELIVERY_STRATEGY', data);
      throw error;
    }
  }

  async getBasePrice(context: QuoteContext): Promise<number> {
    const data = context.getAllData();
    const distance = data.distance || 0;
    const weight = data.weight || 0;
    const volume = data.volume || 0;
    const urgency = data.urgency || 'normal';

    console.log('\n🚚 [DELIVERY-STRATEGY] ═══════════════════════════════════════════════════');
    console.log('🚚 [DELIVERY-STRATEGY] ═══ DÉBUT CALCUL PRIX DE BASE DELIVERY ═══');
    console.log('🚚 [DELIVERY-STRATEGY] ═══════════════════════════════════════════════════');
    console.log('📊 [DELIVERY-STRATEGY] Type de service:', context.getServiceType());
    console.log('📋 [DELIVERY-STRATEGY] Données d\'entrée:', {
      defaultPrice: data.defaultPrice,
      distance,
      weight,
      volume,
      urgency
    });

    // ✅ NOUVEAU: Récupérer les constantes depuis le système unifié
    const pricingConstants = await this.getPricingConstants();

    // ✅ AMÉLIORATION: Validation du prix minimum
    const minimumPrice = pricingConstants['DELIVERY_BASE_PRICE'] || DefaultValues.DELIVERY_BASE_PRICE;
    let basePrice = Math.max(data.defaultPrice || 0, minimumPrice);

    if (data.defaultPrice && data.defaultPrice < minimumPrice) {
      console.log(`⚠️  [DELIVERY-STRATEGY] Prix initial (${data.defaultPrice.toFixed(2)}€) < minimum (${minimumPrice.toFixed(2)}€)`);
      console.log(`✅ [DELIVERY-STRATEGY] Application du prix minimum: ${minimumPrice.toFixed(2)}€`);
    }

    console.log(`\n💰 [DELIVERY-STRATEGY] PRIX DE BASE INITIAL: ${basePrice.toFixed(2)}€`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ✅ AMÉLIORATION: Détails distance
    console.log('\n📏 [DELIVERY-STRATEGY] ─── Calcul Distance ───');
    let distanceCost = 0;
    if (distance > 0) {
      distanceCost = this.calculateDistanceCost(distance, pricingConstants);
      const pricePerKm = pricingConstants['DELIVERY_PRICE_PER_KM'] || DefaultValues.DELIVERY_PRICE_PER_KM;
      console.log(`   🛣️  Distance à parcourir: ${distance}km`);
      console.log(`   💶 Tarif par km: ${pricePerKm.toFixed(2)}€/km`);
      console.log(`   └─ Coût distance: ${distance}km × ${pricePerKm.toFixed(2)}€ = ${distanceCost.toFixed(2)}€`);
      basePrice += distanceCost;
      console.log(`   ✅ Sous-total après distance: ${basePrice.toFixed(2)}€`);
    } else {
      console.log('   ℹ️  Aucune distance spécifiée (utilisation prix de base uniquement)');
    }

    // ✅ AMÉLIORATION: Détails poids
    console.log('\n⚖️  [DELIVERY-STRATEGY] ─── Calcul Poids ───');
    let weightCost = 0;
    if (weight > 0) {
      weightCost = this.calculateWeightCost(weight, pricingConstants);
      const weightSurcharge = pricingConstants['DELIVERY_WEIGHT_SURCHARGE'] || DefaultValues.DELIVERY_WEIGHT_SURCHARGE;
      console.log(`   ⚖️  Poids de la livraison: ${weight}kg`);
      console.log(`   💶 Supplément par kg: ${weightSurcharge.toFixed(2)}€/kg`);
      console.log(`   └─ Coût poids: ${weight}kg × ${weightSurcharge.toFixed(2)}€ = ${weightCost.toFixed(2)}€`);
      basePrice += weightCost;
      console.log(`   ✅ Sous-total après poids: ${basePrice.toFixed(2)}€`);
    } else {
      console.log('   ℹ️  Aucun poids spécifié (pas de supplément)');
    }

    // ✅ AMÉLIORATION: Détails volume
    console.log('\n📦 [DELIVERY-STRATEGY] ─── Calcul Volume ───');
    let volumeCost = 0;
    if (volume > 0) {
      volumeCost = await this.calculateVolumeCost(volume);
      const volumePrice = await this.unifiedDataService.getConfigurationValue(
        ConfigurationCategory.PRICING,
        'DELIVERY_VOLUME_PRICE_PER_M3',
        1.5
      );
      console.log(`   📦 Volume de la livraison: ${volume}m³`);
      console.log(`   💶 Tarif par m³: ${volumePrice.toFixed(2)}€/m³`);
      console.log(`   └─ Coût volume: ${volume}m³ × ${volumePrice.toFixed(2)}€ = ${volumeCost.toFixed(2)}€`);
      basePrice += volumeCost;
      console.log(`   ✅ Sous-total après volume: ${basePrice.toFixed(2)}€`);
    } else {
      console.log('   ℹ️  Aucun volume spécifié (pas de supplément)');
    }

    // ✅ AMÉLIORATION: Détails urgence
    console.log('\n⚡ [DELIVERY-STRATEGY] ─── Calcul Urgence ───');
    const priceBeforeUrgency = basePrice;
    let urgencyMultiplier = 1;
    let urgencyLabel = 'NORMALE';

    if (urgency === 'express') {
      urgencyMultiplier = await this.unifiedDataService.getConfigurationValue(
        ConfigurationCategory.PRICING,
        'DELIVERY_EXPRESS_MULTIPLIER',
        1.5
      );
      urgencyLabel = 'EXPRESS';
      console.log(`   ⚡ Mode de livraison: EXPRESS`);
      console.log(`   💶 Multiplicateur: ×${urgencyMultiplier}`);
      console.log(`   └─ Calcul: ${priceBeforeUrgency.toFixed(2)}€ × ${urgencyMultiplier} = ${(priceBeforeUrgency * urgencyMultiplier).toFixed(2)}€`);
      basePrice *= urgencyMultiplier;
      console.log(`   ✅ Sous-total après urgence: ${basePrice.toFixed(2)}€`);
    } else if (urgency === 'urgent') {
      urgencyMultiplier = await this.unifiedDataService.getConfigurationValue(
        ConfigurationCategory.PRICING,
        'DELIVERY_URGENT_MULTIPLIER',
        2.0
      );
      urgencyLabel = 'URGENT';
      console.log(`   🚨 Mode de livraison: URGENT`);
      console.log(`   💶 Multiplicateur: ×${urgencyMultiplier}`);
      console.log(`   └─ Calcul: ${priceBeforeUrgency.toFixed(2)}€ × ${urgencyMultiplier} = ${(priceBeforeUrgency * urgencyMultiplier).toFixed(2)}€`);
      basePrice *= urgencyMultiplier;
      console.log(`   ✅ Sous-total après urgence: ${basePrice.toFixed(2)}€`);
    } else {
      console.log(`   🕐 Mode de livraison: NORMALE (pas de supplément)`);
      console.log(`   💶 Multiplicateur: ×1 (aucun)`);
    }

    // ✅ AMÉLIORATION: Résumé avant promotions
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💰 [DELIVERY-STRATEGY] ═══ PRIX DE BASE AVANT PROMOTIONS ═══');
    console.log(`   📊 Prix total: ${basePrice.toFixed(2)}€`);
    console.log('\n   📝 Détail du calcul:');
    console.log(`      • Prix de départ: ${data.defaultPrice || 0}€`);
    console.log(`      • Distance: +${distanceCost.toFixed(2)}€ (${distance}km)`);
    console.log(`      • Poids: +${weightCost.toFixed(2)}€ (${weight}kg)`);
    console.log(`      • Volume: +${volumeCost.toFixed(2)}€ (${volume}m³)`);
    console.log(`      • Urgence: ×${urgencyMultiplier} (${urgencyLabel})`);
    console.log(`      = ${basePrice.toFixed(2)}€`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ✅ NOUVEAU: APPLICATION DES PROMOTIONS
    const priceBeforePromotion = basePrice;
    const promotionResult = this.applyPromotionCodes(context, basePrice);
    basePrice = promotionResult.finalPrice;

    if (promotionResult.discountAmount > 0) {
      console.log(`\n🎁 [DELIVERY-STRATEGY] Promotion appliquée: -${promotionResult.discountAmount.toFixed(2)}€`);
      console.log(`   📊 Prix final après promotion: ${basePrice.toFixed(2)}€`);
    }

    console.log(`\n💰 [DELIVERY-STRATEGY] ═══ PRIX DE BASE FINAL: ${basePrice.toFixed(2)}€ ═══`);
    console.log('🚚 [DELIVERY-STRATEGY] ═══════════════════════════════════════════════════\n');

    return basePrice;
  }

  private calculateDistanceCost(distance: number, pricingConstants: Record<string, number>): number {
    const pricePerKm = pricingConstants['DELIVERY_PRICE_PER_KM'] || DefaultValues.DELIVERY_PRICE_PER_KM;
    return distance * pricePerKm;
  }

  private calculateWeightCost(weight: number, pricingConstants: Record<string, number>): number {
    const weightSurcharge = pricingConstants['DELIVERY_WEIGHT_SURCHARGE'] || DefaultValues.DELIVERY_WEIGHT_SURCHARGE;
    return weight * weightSurcharge;
  }

  private async calculateVolumeCost(volume: number): Promise<number> {
    try {
      const volumePrice = await this.unifiedDataService.getConfigurationValue(
        ConfigurationCategory.PRICING,
        'DELIVERY_VOLUME_PRICE_PER_M3',
        1.5
      );
      return volume * volumePrice;
    } catch (error) {
      console.warn('⚠️ [DELIVERY-STRATEGY] Erreur récupération prix volume, utilisation fallback:', error);
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
    Object.keys(data).forEach(key => {
      enrichedContext.setValue(key, data[key]);
    });

    // ✅ MIGRÉ: Ajouter des calculs enrichis (depuis configuration)
    if (data.distance) {
      const [estimatedDuration, fuelCost, tollCost] = await Promise.all([
        this.calculateEstimatedDuration(data.distance),
        this.calculateFuelCost(data.distance),
        this.calculateTollCost(data.distance)
      ]);

      enrichedContext.setValue('estimatedDuration', estimatedDuration);
      enrichedContext.setValue('fuelCost', fuelCost);
      enrichedContext.setValue('tollCost', tollCost);
    }

    return enrichedContext;
  }

  private async calculateEstimatedDuration(distance: number): Promise<number> {
    try {
      const travelSpeed = await this.unifiedDataService.getConfigurationValue(
        ConfigurationCategory.PRICING,
        'DELIVERY_TRAVEL_SPEED_KMH',
        50
      );
      return Math.ceil(distance / travelSpeed);
    } catch (error) {
      console.warn('⚠️ [DELIVERY-STRATEGY] Erreur récupération vitesse, utilisation fallback:', error);
      return Math.ceil(distance / 50); // Fallback hardcodé
    }
  }

  private async calculateFuelCost(distance: number): Promise<number> {
    try {
      const fuelCostPerKm = await this.unifiedDataService.getConfigurationValue(
        ConfigurationCategory.PRICING,
        'DELIVERY_FUEL_COST_PER_KM',
        0.15
      );
      return distance * fuelCostPerKm;
    } catch (error) {
      console.warn('⚠️ [DELIVERY-STRATEGY] Erreur récupération coût carburant, utilisation fallback:', error);
      return distance * 0.15; // Fallback hardcodé
    }
  }

  private async calculateTollCost(distance: number): Promise<number> {
    try {
      const [tollCostPerKm, tollThreshold] = await Promise.all([
        this.unifiedDataService.getConfigurationValue(
          ConfigurationCategory.PRICING,
          'DELIVERY_TOLL_COST_PER_KM',
          0.05
        ),
        this.unifiedDataService.getConfigurationValue(
          ConfigurationCategory.PRICING,
          'DELIVERY_TOLL_THRESHOLD_KM',
          100
        )
      ]);
      return distance > tollThreshold ? distance * tollCostPerKm : 0;
    } catch (error) {
      console.warn('⚠️ [DELIVERY-STRATEGY] Erreur récupération coût péage, utilisation fallback:', error);
      return distance > 100 ? distance * 0.05 : 0; // Fallback hardcodé
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

    console.log('🎁 [DELIVERY-STRATEGY] ═══ APPLICATION DES PROMOTIONS ═══');
    console.log(`📊 [DELIVERY-STRATEGY] Promotion active: ${isPromotionActive}`);
    console.log(`📊 [DELIVERY-STRATEGY] Code promo: ${promotionCode}`);
    console.log(`📊 [DELIVERY-STRATEGY] Type: ${promotionType}, Valeur: ${promotionValue}`);
    console.log(`💰 [DELIVERY-STRATEGY] Prix de base avant promotion: ${basePrice.toFixed(2)}€`);

    let finalPrice = basePrice;
    let discountAmount = 0;

    // Vérifier si une promotion est active
    if (!isPromotionActive || !promotionCode || !promotionValue || !promotionType) {
      console.log('❌ [DELIVERY-STRATEGY] Aucune promotion active');
      return { finalPrice, discountAmount };
    }

    // Appliquer la promotion selon le type
    if (promotionType === 'PERCENT') {
      discountAmount = (basePrice * promotionValue) / 100;
      finalPrice = basePrice - discountAmount;
      console.log(`✅ [DELIVERY-STRATEGY] Promotion pourcentage appliquée: -${promotionValue}% = -${discountAmount.toFixed(2)}€`);
    } else if (promotionType === 'FIXED') {
      discountAmount = promotionValue;
      finalPrice = Math.max(0, basePrice - promotionValue); // Éviter les prix négatifs
      console.log(`✅ [DELIVERY-STRATEGY] Promotion fixe appliquée: -${promotionValue}€`);
    } else {
      console.log(`⚠️ [DELIVERY-STRATEGY] Type de promotion non reconnu: ${promotionType}`);
    }

    console.log(`💰 [DELIVERY-STRATEGY] Prix final après promotion: ${finalPrice.toFixed(2)}€`);
    return { finalPrice, discountAmount };
  }

  /**
   * ✅ NOUVEAU: Récupère les constantes de pricing depuis le système unifié
   */
  private async getPricingConstants(): Promise<Record<string, number>> {
    try {
      // 1. Essayer de récupérer depuis le service unifié
      const unifiedConfigs = await this.unifiedDataService.getAllPricingConstants(UnifiedServiceType.DELIVERY);
      if (Object.keys(unifiedConfigs).length > 0) {
        console.log(`✅ [DELIVERY-STRATEGY] ${Object.keys(unifiedConfigs).length} configurations récupérées depuis UnifiedDataService`);
        return unifiedConfigs;
      }
    } catch (error) {
      console.warn('⚠️ [DELIVERY-STRATEGY] Erreur UnifiedDataService, fallback vers DefaultValues:', error);
    }

    // 2. Dernier recours : DefaultValues
    console.log('⚠️ [DELIVERY-STRATEGY] Utilisation de DefaultValues comme fallback');
    return {
      'DELIVERY_BASE_PRICE': DefaultValues.DELIVERY_BASE_PRICE,
      'DELIVERY_PRICE_PER_KM': DefaultValues.DELIVERY_PRICE_PER_KM,
      'DELIVERY_WORKER_HOUR_RATE': DefaultValues.DELIVERY_WORKER_HOUR_RATE,
      'DELIVERY_WEIGHT_SURCHARGE': DefaultValues.DELIVERY_WEIGHT_SURCHARGE
    };
  }
}
