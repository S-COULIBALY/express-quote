import { ServiceType } from "@/quotation/domain/enums/ServiceType";
import { logger } from "@/lib/logger";
import { Quote, AppliedDiscount } from "@/quotation/domain/valueObjects/Quote";
import { Money } from "@/quotation/domain/valueObjects/Money";
import {
  UnifiedDataService,
  ConfigurationCategory,
} from "@/quotation/infrastructure/services/UnifiedDataService";
import {
  BusinessTypePricingConfigKey,
  PricingFactorsConfigKey,
  ServiceParamsConfigKey,
  PricingConfigKey,
} from "@/quotation/domain/configuration/ConfigurationKey";

/**
 * Service centralisé pour les calculs de fallback
 * ✅ MIGRÉ VERS UNIFIED DATA SERVICE - Plus de valeurs hardcodées
 * Utilisé lorsque le QuoteCalculator principal n'est pas disponible
 */
export class FallbackCalculatorService {
  private static instance: FallbackCalculatorService;
  private readonly unifiedDataService: UnifiedDataService;

  private constructor() {
    this.unifiedDataService = UnifiedDataService.getInstance();
  }

  /**
   * Obtient l'instance unique du service (pattern Singleton)
   */
  public static getInstance(): FallbackCalculatorService {
    if (!FallbackCalculatorService.instance) {
      FallbackCalculatorService.instance = new FallbackCalculatorService();
    }
    return FallbackCalculatorService.instance;
  }

  /**
   * ✅ NOUVEAU: Récupère les prix par défaut depuis la configuration
   */
  private async getDefaultPrices(): Promise<Record<ServiceType, number>> {
    try {
      logger.info(
        "📊 [FALLBACK-CALC] Récupération des prix par défaut depuis la configuration",
      );

      const [movingPrice, packingPrice, cleaningPrice, deliveryPrice] =
        await Promise.all([
          this.unifiedDataService.getConfigurationValue(
            ConfigurationCategory.PRICING,
            BusinessTypePricingConfigKey.MOVING_BASE_PRICE_PER_M3,
            400,
          ),
          this.unifiedDataService.getConfigurationValue(
            ConfigurationCategory.PRICING,
            BusinessTypePricingConfigKey.PACKING_PRICE_PER_M3,
            300,
          ),
          this.unifiedDataService.getConfigurationValue(
            ConfigurationCategory.PRICING,
            BusinessTypePricingConfigKey.CLEANING_MINIMUM_PRICE,
            200,
          ),
          this.unifiedDataService.getConfigurationValue(
            ConfigurationCategory.PRICING,
            BusinessTypePricingConfigKey.DELIVERY_BASE_PRICE,
            250,
          ),
        ]);

      // Services abandonnés : PACKING, CLEANING, DELIVERY, SERVICE
      // Tous les services actifs sont des déménagements (MOVING, MOVING_PREMIUM)
      const prices: Record<ServiceType, number> = {
        [ServiceType.MOVING]: movingPrice,
        [ServiceType.MOVING_PREMIUM]: movingPrice, // Même prix que MOVING
        [ServiceType.PACKING]: packingPrice, // Abandonné mais gardé pour compatibilité
        [ServiceType.CLEANING]: cleaningPrice, // Abandonné mais gardé pour compatibilité
        [ServiceType.DELIVERY]: deliveryPrice, // Abandonné mais gardé pour compatibilité
        [ServiceType.SERVICE]: movingPrice, // Abandonné mais gardé pour compatibilité
        [ServiceType.CLEANING_PREMIUM]: cleaningPrice, // Abandonné mais gardé pour compatibilité
      };

      logger.info("✅ [FALLBACK-CALC] Prix par défaut récupérés:", prices);
      return prices;
    } catch (error) {
      logger.error(
        "❌ [FALLBACK-CALC] Erreur récupération prix par défaut, utilisation fallback:",
        error,
      );

      // Fallback vers les anciennes valeurs hardcodées
      // Services abandonnés : PACKING, CLEANING, DELIVERY, SERVICE
      return {
        [ServiceType.MOVING]: 400,
        [ServiceType.MOVING_PREMIUM]: 400,
        [ServiceType.PACKING]: 300, // Abandonné mais gardé pour compatibilité
        [ServiceType.CLEANING]: 200, // Abandonné mais gardé pour compatibilité
        [ServiceType.DELIVERY]: 250, // Abandonné mais gardé pour compatibilité
        [ServiceType.SERVICE]: 400, // Abandonné mais gardé pour compatibilité
        [ServiceType.CLEANING_PREMIUM]: 200, // Abandonné mais gardé pour compatibilité
      };
    }
  }

  /**
   * ✅ NOUVEAU: Récupère les tarifs depuis la configuration
   */
  private async getRates(): Promise<Record<string, number>> {
    try {
      logger.info(
        "📊 [FALLBACK-CALC] Récupération des tarifs depuis la configuration",
      );

      const [
        pricePerM3,
        pricePerKm,
        fuelCostPerKm,
        tollCostPerKm,
        workerPricePerHour,
        workerPricePerDay,
        liftCost,
        includedDistance,
        vatRate,
      ] = await Promise.all([
        this.unifiedDataService.getConfigurationValue(
          ConfigurationCategory.PRICING,
          "MOVING_BASE_PRICE_PER_M3", // ✅ Corrigé (spécifique MOVING)
          40,
        ),
        this.unifiedDataService.getConfigurationValue(
          ConfigurationCategory.PRICING,
          PricingConfigKey.UNIT_PRICE_PER_KM, // ✅ OK (partagé)
          2,
        ),
        this.unifiedDataService.getConfigurationValue(
          ConfigurationCategory.PRICING,
          PricingConfigKey.FUEL_PRICE_PER_LITER, // ✅ OK (partagé)
          0.15,
        ),
        this.unifiedDataService.getConfigurationValue(
          ConfigurationCategory.PRICING,
          PricingConfigKey.TOLL_COST_PER_KM, // ✅ OK (partagé)
          0.1,
        ),
        this.unifiedDataService.getConfigurationValue(
          ConfigurationCategory.PRICING,
          "MOVING_WORKER_HOUR_RATE", // ✅ Corrigé (spécifique MOVING - pas SERVICE_WORKER_PRICE_PER_HOUR)
          35,
        ),
        this.unifiedDataService.getConfigurationValue(
          ConfigurationCategory.PRICING,
          "MOVING_WORKER_PRICE", // ✅ Corrigé (spécifique MOVING - était EXTRA_WORKER_HOUR_RATE)
          120,
        ),
        this.unifiedDataService.getConfigurationValue(
          ConfigurationCategory.PRICING,
          "MOVING_LIFT_PRICE", // ✅ Corrigé (spécifique MOVING)
          200,
        ),
        this.unifiedDataService.getConfigurationValue(
          ConfigurationCategory.PRICING,
          PricingConfigKey.INCLUDED_DISTANCE, // ✅ OK (partagé)
          20,
        ),
        this.unifiedDataService.getConfigurationValue(
          ConfigurationCategory.PRICING_FACTORS,
          "VAT_RATE", // ✅ OK
          0.2,
        ),
      ]);

      const rates = {
        PRICE_PER_M3: pricePerM3,
        PRICE_PER_KM: pricePerKm,
        FUEL_COST_PER_KM: fuelCostPerKm,
        TOLL_COST_PER_KM: tollCostPerKm,
        WORKER_PRICE_PER_HOUR: workerPricePerHour,
        WORKER_PRICE_PER_DAY: workerPricePerDay,
        LIFT_COST: liftCost,
        INCLUDED_DISTANCE: includedDistance,
        VAT_RATE: vatRate,
      };

      logger.info(
        "✅ [FALLBACK-CALC] Tarifs récupérés depuis la configuration",
      );
      return rates;
    } catch (error) {
      logger.error(
        "❌ [FALLBACK-CALC] Erreur récupération tarifs, utilisation fallback:",
        error,
      );

      // Fallback vers les anciennes valeurs hardcodées
      return {
        PRICE_PER_M3: 40,
        PRICE_PER_KM: 2,
        FUEL_COST_PER_KM: 0.15,
        TOLL_COST_PER_KM: 0.1,
        WORKER_PRICE_PER_HOUR: 35,
        WORKER_PRICE_PER_DAY: 120,
        LIFT_COST: 200,
        INCLUDED_DISTANCE: 20,
        VAT_RATE: 0.2,
      };
    }
  }

  /**
   * ✅ MIGRÉ: Calcule un prix pour un déménagement (MOVING) en mode fallback
   * @param params Paramètres du déménagement
   * @returns Objet avec les détails du calcul
   */
  public async calculateMovingFallback(params: {
    volume?: number;
    distance?: number;
    workers?: number;
    defaultPrice?: number;
    pickupNeedsLift?: boolean;
    deliveryNeedsLift?: boolean;
  }): Promise<{
    quote: Quote;
    details: Record<string, any>;
  }> {
    logger.info(
      "🔄 [FALLBACK-CALC] Calcul manuel pour MOVING via configuration",
      JSON.stringify(params),
    );

    const volume = params.volume || 0;
    const distance = params.distance || 0;
    const workers = params.workers || 2;

    // ✅ NOUVEAU: Récupération depuis la configuration
    const [defaultPrices, rates, minimumPriceFactor] = await Promise.all([
      this.getDefaultPrices(),
      this.getRates(),
      this.unifiedDataService.getConfigurationValue(
        ConfigurationCategory.PRICING_FACTORS,
        PricingFactorsConfigKey.MINIMUM_PRICE_FACTOR,
        0.9,
      ),
    ]);

    const defaultPrice =
      params.defaultPrice || defaultPrices[ServiceType.MOVING];

    // 1. ✅ MIGRÉ: Calcul du prix basé sur le volume
    const volumePrice = volume * rates.PRICE_PER_M3;

    // 2. ✅ MIGRÉ: Calcul du prix basé sur la distance
    const distancePrice = distance * rates.PRICE_PER_KM;

    // 3. ✅ MIGRÉ: Ajouter les frais de carburant et de péage
    const fuelCost = distance * rates.FUEL_COST_PER_KM;
    const tollCost = distance * rates.TOLL_COST_PER_KM;

    // 4. Calculer le prix de base
    const basePrice = volumePrice + distancePrice + fuelCost + tollCost;

    // 5. ✅ MIGRÉ: Ajouter les coûts de monte-meuble
    let liftCost = 0;
    if (params.pickupNeedsLift) liftCost += rates.LIFT_COST;
    if (params.deliveryNeedsLift) liftCost += rates.LIFT_COST;

    // 6. ✅ MIGRÉ: Appliquer un tarif minimum comme plancher (depuis configuration)
    const minimumPrice = defaultPrice * minimumPriceFactor;
    const totalPrice = Math.max(basePrice + liftCost, minimumPrice);

    const finalPrice = Math.round(totalPrice);

    // Créer les objets de domaine
    const baseMoneyPrice = new Money(defaultPrice);
    const finalMoneyPrice = new Money(finalPrice);
    const discounts: AppliedDiscount[] = [];

    // Créer un objet Quote
    const quote = new Quote(
      baseMoneyPrice,
      finalMoneyPrice,
      discounts,
      ServiceType.MOVING,
    );

    // ✅ MIGRÉ: Calculer la TVA depuis la configuration
    const vatRate = rates.VAT_RATE;
    const vatAmount = Math.round(finalPrice * vatRate);
    const totalWithVat = finalPrice + vatAmount;

    // Détails pour le débogage et l'affichage
    const details = {
      defaultPrice,
      volumePrice: Math.round(volumePrice),
      distancePrice: Math.round(distancePrice),
      fuelCost: Math.round(fuelCost),
      tollCost: Math.round(tollCost),
      basePrice: Math.round(basePrice),
      liftCost: Math.round(liftCost),
      minimumPrice: Math.round(minimumPrice),
      finalPrice,
      vatAmount,
      totalWithVat,
    };

    try {
      logger.info(
        "✅ FALLBACK - Résultat du calcul manuel pour MOVING: " +
          JSON.stringify(details),
      );
    } catch (e) {
      // Fallback pour le logger si non disponible
    }
    console.log(
      "✅ FALLBACK - Résultat du calcul manuel pour MOVING:",
      details,
    );

    return { quote, details };
  }

  /**
   * ✅ MIGRÉ: Calcule un prix pour un service d'emballage (PACK) en mode fallback
   * @param params Paramètres du service d'emballage
   * @returns Objet avec les détails du calcul
   */
  public async calculatePackFallback(params: {
    defaultPrice?: number;
    baseWorkers?: number;
    baseDuration?: number;
    workers?: number;
    duration?: number;
    distance?: number;
    pickupNeedsLift?: boolean;
    deliveryNeedsLift?: boolean;
  }): Promise<{
    quote: Quote;
    details: Record<string, any>;
  }> {
    try {
      logger.info(
        "🔄 FALLBACK - Calcul manuel pour PACK",
        JSON.stringify(params),
      );
    } catch (e) {
      // Fallback pour le logger si non disponible
    }
    console.log("🔄 FALLBACK - Calcul manuel pour PACK", params);

    // ✅ NOUVEAU: Récupération depuis la configuration
    const [
      defaultPrices,
      rates,
      minimumPriceFactor,
      extraDayDiscountFactor,
      extraKmPrice,
    ] = await Promise.all([
      this.getDefaultPrices(),
      this.getRates(),
      this.unifiedDataService.getConfigurationValue(
        ConfigurationCategory.PRICING_FACTORS,
        PricingFactorsConfigKey.MINIMUM_PRICE_FACTOR,
        0.9,
      ),
      this.unifiedDataService.getConfigurationValue(
        ConfigurationCategory.PRICING_FACTORS,
        PricingFactorsConfigKey.EXTRA_DAY_DISCOUNT_FACTOR,
        0.9,
      ),
      this.unifiedDataService.getConfigurationValue(
        ConfigurationCategory.PRICING,
        "EXTRA_KM_PRICE",
        1.5,
      ),
    ]);

    const defaultPrice =
      params.defaultPrice || defaultPrices[ServiceType.PACKING];
    const workers = params.workers || 2;
    const duration = params.duration || 1;
    const baseWorkers = params.baseWorkers || 2;
    const baseDuration = params.baseDuration || 1;
    const distance = params.distance || 0;

    let calculatedPrice = defaultPrice;

    // 1. ✅ MIGRÉ: Coût des jours supplémentaires (depuis configuration)
    let extraDurationCost = 0;
    if (duration > baseDuration) {
      const extraDays = duration - baseDuration;
      const dailyRate = defaultPrice / baseDuration;
      extraDurationCost = dailyRate * extraDays * extraDayDiscountFactor;
      calculatedPrice += extraDurationCost;
    }

    // 2. ✅ MIGRÉ: Coût des travailleurs supplémentaires (depuis configuration)
    let extraWorkerCost = 0;
    if (workers > baseWorkers) {
      const extraWorkers = workers - baseWorkers;
      const [workerReductionSingle, workerReductionMultiple] =
        await Promise.all([
          this.unifiedDataService.getConfigurationValue(
            ConfigurationCategory.PRICING_FACTORS,
            "WORKER_REDUCTION_SINGLE_DAY",
            0.05,
          ),
          this.unifiedDataService.getConfigurationValue(
            ConfigurationCategory.PRICING_FACTORS,
            "WORKER_REDUCTION_MULTIPLE_DAYS",
            0.1,
          ),
        ]);
      const reductionRate =
        duration === 1 ? workerReductionSingle : workerReductionMultiple;
      extraWorkerCost =
        extraWorkers *
        rates.WORKER_PRICE_PER_DAY *
        duration *
        (1 - reductionRate);
      calculatedPrice += extraWorkerCost;
    }

    // 3. ✅ MIGRÉ: Calculer le coût de la distance supplémentaire (depuis configuration)
    let extraDistanceCost = 0;
    if (distance > rates.INCLUDED_DISTANCE) {
      const extraKm = distance - rates.INCLUDED_DISTANCE;
      extraDistanceCost = extraKm * extraKmPrice;
      calculatedPrice += extraDistanceCost;
    }

    // 4. ✅ MIGRÉ: Calculer le coût du monte-meuble (depuis configuration)
    let liftCost = 0;
    if (params.pickupNeedsLift) liftCost += rates.LIFT_COST;
    if (params.deliveryNeedsLift) liftCost += rates.LIFT_COST;
    calculatedPrice += liftCost;

    // 5. ✅ MIGRÉ: Appliquer un tarif minimum comme plancher (depuis configuration)
    const minimumPrice = defaultPrice * minimumPriceFactor;
    const totalPrice = Math.max(calculatedPrice, minimumPrice);

    const finalPrice = Math.round(totalPrice);

    // Créer les objets de domaine
    const baseMoneyPrice = new Money(defaultPrice);
    const finalMoneyPrice = new Money(finalPrice);
    const discounts: AppliedDiscount[] = [];

    // Créer un objet Quote
    const quote = new Quote(
      baseMoneyPrice,
      finalMoneyPrice,
      discounts,
      ServiceType.PACKING,
    );

    // ✅ MIGRÉ: Calculer la TVA (depuis configuration)
    const vatAmount = Math.round(finalPrice * rates.VAT_RATE);
    const totalWithVat = finalPrice + vatAmount;

    // Détails pour le débogage et l'affichage
    const details = {
      defaultPrice,
      extraDurationCost: Math.round(extraDurationCost),
      extraWorkerCost: Math.round(extraWorkerCost),
      extraDistanceCost: Math.round(extraDistanceCost),
      liftCost: Math.round(liftCost),
      minimumPrice: Math.round(minimumPrice),
      finalPrice,
      vatAmount,
      totalWithVat,
    };

    try {
      logger.info(
        "✅ FALLBACK - Résultat du calcul manuel pour PACK: " +
          JSON.stringify(details),
      );
    } catch (e) {
      // Fallback pour le logger si non disponible
    }
    console.log("✅ FALLBACK - Résultat du calcul manuel pour PACK:", details);

    return { quote, details };
  }

  /**
   * ✅ MIGRÉ: Calcule un prix pour un service (SERVICE) en mode fallback
   * @param params Paramètres du service
   * @returns Objet avec les détails du calcul
   */
  public async calculateServiceFallback(params: {
    defaultPrice?: number;
    defaultWorkers?: number;
    defaultDuration?: number;
    workers?: number;
    duration?: number;
  }): Promise<{
    quote: Quote;
    details: Record<string, any>;
  }> {
    try {
      logger.info(
        "🔄 FALLBACK - Calcul manuel pour SERVICE",
        JSON.stringify(params),
      );
    } catch (e) {
      // Fallback pour le logger si non disponible
    }
    console.log("🔄 FALLBACK - Calcul manuel pour SERVICE", params);

    // ✅ NOUVEAU: Récupération depuis la configuration
    const [defaultPrices, rates, minimumPriceFactor] = await Promise.all([
      this.getDefaultPrices(),
      this.getRates(),
      this.unifiedDataService.getConfigurationValue(
        ConfigurationCategory.PRICING_FACTORS,
        PricingFactorsConfigKey.MINIMUM_PRICE_FACTOR,
        0.9,
      ),
    ]);

    const defaultPrice =
      params.defaultPrice || defaultPrices[ServiceType.CLEANING];
    const duration = params.duration || 1;
    const workers = params.workers || 1;
    const defaultDuration = params.defaultDuration || 1;
    const defaultWorkers = params.defaultWorkers || 1;

    // Calculer le prix
    let calculatedPrice = defaultPrice;

    // 1. ✅ MIGRÉ: Coût des travailleurs supplémentaires (depuis configuration)
    let extraWorkerCost = 0;
    if (workers > defaultWorkers) {
      const extraWorkers = workers - defaultWorkers;
      const [durationReductionShort, durationReductionLong] = await Promise.all(
        [
          this.unifiedDataService.getConfigurationValue(
            ConfigurationCategory.PRICING_FACTORS,
            "DURATION_REDUCTION_SHORT",
            0.1,
          ),
          this.unifiedDataService.getConfigurationValue(
            ConfigurationCategory.PRICING_FACTORS,
            "DURATION_REDUCTION_LONG",
            0.15,
          ),
        ],
      );
      const reductionRate =
        duration <= 2 ? durationReductionShort : durationReductionLong;
      extraWorkerCost =
        extraWorkers *
        rates.WORKER_PRICE_PER_HOUR *
        duration *
        (1 - reductionRate);
      calculatedPrice += extraWorkerCost;
    }

    // 2. ✅ MIGRÉ: Coût des heures supplémentaires (depuis configuration)
    let extraHoursCost = 0;
    if (duration > defaultDuration) {
      const extraHours = duration - defaultDuration;
      extraHoursCost =
        defaultWorkers * rates.WORKER_PRICE_PER_HOUR * extraHours;
      calculatedPrice += extraHoursCost;
    }

    // 3. ✅ MIGRÉ: Appliquer un tarif minimum comme plancher (depuis configuration)
    const minimumPrice = defaultPrice * minimumPriceFactor;
    const totalPrice = Math.max(calculatedPrice, minimumPrice);

    const finalPrice = Math.round(totalPrice);

    // Créer les objets de domaine
    const baseMoneyPrice = new Money(defaultPrice);
    const finalMoneyPrice = new Money(finalPrice);
    const discounts: AppliedDiscount[] = [];

    // Créer un objet Quote
    const quote = new Quote(
      baseMoneyPrice,
      finalMoneyPrice,
      discounts,
      ServiceType.CLEANING,
    );

    // ✅ MIGRÉ: Calculer la TVA (depuis configuration)
    const vatAmount = Math.round(finalPrice * rates.VAT_RATE);
    const totalWithVat = finalPrice + vatAmount;

    // Détails pour le débogage et l'affichage
    const details = {
      defaultPrice,
      extraWorkerCost: Math.round(extraWorkerCost),
      extraHoursCost: Math.round(extraHoursCost),
      minimumPrice: Math.round(minimumPrice),
      finalPrice,
      vatAmount,
      totalWithVat,
    };

    try {
      logger.info(
        "✅ FALLBACK - Résultat du calcul manuel pour SERVICE: " +
          JSON.stringify(details),
      );
    } catch (e) {
      // Fallback pour le logger si non disponible
    }
    console.log(
      "✅ FALLBACK - Résultat du calcul manuel pour SERVICE:",
      details,
    );

    return { quote, details };
  }

  /**
   * ✅ NOUVEAU: Calcule un prix pour un service de livraison (DELIVERY) en mode fallback
   * @param params Paramètres du service de livraison
   * @returns Objet avec les détails du calcul
   */
  public async calculateDeliveryFallback(params: {
    defaultPrice?: number;
    volume?: number;
    distance?: number;
    urgency?: "STANDARD" | "EXPRESS" | "URGENT";
  }): Promise<{
    quote: Quote;
    details: Record<string, any>;
  }> {
    try {
      logger.info(
        "🔄 [FALLBACK-CALC] Calcul manuel pour DELIVERY via configuration",
        JSON.stringify(params),
      );
    } catch (e) {
      // Fallback pour le logger si non disponible
    }
    console.log("🔄 [FALLBACK-CALC] Calcul manuel pour DELIVERY", params);

    // ✅ NOUVEAU: Récupération depuis la configuration
    const [
      defaultPrices,
      rates,
      minimumPriceFactor,
      volumePrice,
      expressMultiplier,
      urgentMultiplier,
    ] = await Promise.all([
      this.getDefaultPrices(),
      this.getRates(),
      this.unifiedDataService.getConfigurationValue(
        ConfigurationCategory.PRICING_FACTORS,
        PricingFactorsConfigKey.MINIMUM_PRICE_FACTOR,
        0.9,
      ),
      this.unifiedDataService.getConfigurationValue(
        ConfigurationCategory.PRICING,
        "DELIVERY_VOLUME_PRICE_PER_M3",
        1.5,
      ),
      this.unifiedDataService.getConfigurationValue(
        ConfigurationCategory.PRICING,
        "DELIVERY_EXPRESS_MULTIPLIER",
        1.5,
      ),
      this.unifiedDataService.getConfigurationValue(
        ConfigurationCategory.PRICING,
        "DELIVERY_URGENT_MULTIPLIER",
        2.0,
      ),
    ]);

    const defaultPrice =
      params.defaultPrice || defaultPrices[ServiceType.DELIVERY];
    const volume = params.volume || 0;
    const distance = params.distance || 0;
    const urgency = params.urgency || "STANDARD";

    // 1. ✅ MIGRÉ: Calcul du prix basé sur le volume
    const volumeCost = volume * volumePrice;

    // 2. ✅ MIGRÉ: Calcul du prix basé sur la distance
    const distancePrice = distance * rates.PRICE_PER_KM;

    // 3. ✅ MIGRÉ: Ajouter les frais de carburant et de péage
    const fuelCost = distance * rates.FUEL_COST_PER_KM;
    const tollCost = distance > 100 ? distance * rates.TOLL_COST_PER_KM : 0;

    // 4. Calculer le prix de base
    let basePrice =
      defaultPrice + volumeCost + distancePrice + fuelCost + tollCost;

    // 5. ✅ MIGRÉ: Appliquer le multiplicateur d'urgence (depuis configuration)
    let urgencyMultiplier = 1;
    switch (urgency) {
      case "EXPRESS":
        urgencyMultiplier = expressMultiplier;
        break;
      case "URGENT":
        urgencyMultiplier = urgentMultiplier;
        break;
      default:
        urgencyMultiplier = 1;
    }

    basePrice = basePrice * urgencyMultiplier;

    // 6. ✅ MIGRÉ: Appliquer un tarif minimum comme plancher (depuis configuration)
    const minimumPrice = defaultPrice * minimumPriceFactor;
    const totalPrice = Math.max(basePrice, minimumPrice);

    const finalPrice = Math.round(totalPrice);

    // Créer les objets de domaine
    const baseMoneyPrice = new Money(defaultPrice);
    const finalMoneyPrice = new Money(finalPrice);
    const discounts: AppliedDiscount[] = [];

    // Créer un objet Quote
    const quote = new Quote(
      baseMoneyPrice,
      finalMoneyPrice,
      discounts,
      ServiceType.DELIVERY,
    );

    // ✅ MIGRÉ: Calculer la TVA (depuis configuration)
    const vatAmount = Math.round(finalPrice * rates.VAT_RATE);
    const totalWithVat = finalPrice + vatAmount;

    // Détails pour le débogage et l'affichage
    const details = {
      defaultPrice,
      volumeCost: Math.round(volumeCost),
      distancePrice: Math.round(distancePrice),
      fuelCost: Math.round(fuelCost),
      tollCost: Math.round(tollCost),
      urgencyMultiplier,
      basePrice: Math.round(basePrice),
      minimumPrice: Math.round(minimumPrice),
      finalPrice,
      vatAmount,
      totalWithVat,
      urgency,
    };

    try {
      logger.info(
        "✅ [FALLBACK-CALC] Résultat du calcul manuel pour DELIVERY: " +
          JSON.stringify(details),
      );
    } catch (e) {
      // Fallback pour le logger si non disponible
    }
    console.log(
      "✅ [FALLBACK-CALC] Résultat du calcul manuel pour DELIVERY:",
      details,
    );

    return { quote, details };
  }

  /**
   * Crée une réponse formatée pour l'API à partir des résultats de calcul
   * @param serviceType Type de service
   * @param quote Objet Quote
   * @param details Détails du calcul
   * @param requestData Données originales de la requête
   * @returns Objet de réponse formaté pour l'API
   */
  public createApiResponse(
    serviceType: ServiceType,
    quote: Quote,
    details: Record<string, any>,
    requestData: any,
  ): Record<string, any> {
    return {
      success: true,
      manual_calculation: true,
      price: quote.getTotalPrice().getAmount(),
      vat: details.vatAmount,
      totalWithVat: details.totalWithVat,
      quote: {
        defaultPrice: details.defaultPrice,
        basePrice: quote.getBasePrice().getAmount(),
        finalPrice: quote.getTotalPrice().getAmount(),
        vatAmount: details.vatAmount,
        totalWithVat: details.totalWithVat,
        discounts: quote.getDiscounts().map((d) => ({
          description: d.description,
          amount: d.amount.getAmount(),
          type: d.type,
        })),
        serviceType,
      },
      details,
      original_request: requestData,
      calculation_type: "centralized_fallback",
    };
  }

  /**
   * Crée une réponse simplifiée pour l'UI
   * @param serviceType Type de service
   * @param details Détails du calcul
   * @returns Objet de réponse simplifié pour l'UI
   */
  public createUiResponse(
    serviceType: ServiceType,
    details: Record<string, any>,
  ): Record<string, any> {
    const response: Record<string, any> = {
      baseCost: details.defaultPrice,
      totalCost: details.finalPrice,
    };

    // Ajouter des propriétés spécifiques selon le type de service
    switch (serviceType) {
      case ServiceType.MOVING:
        response.distancePrice = details.distancePrice;
        response.volumeCost = details.volumePrice;
        response.tollCost = details.tollCost;
        response.fuelCost = details.fuelCost;
        break;

      case ServiceType.PACKING:
        response.extraWorkerCost = details.extraWorkerCost;
        response.extraDurationCost = details.extraDurationCost;
        response.distancePrice = details.extraDistanceCost;
        response.liftCost = details.liftCost;
        break;

      case ServiceType.CLEANING:
        response.extraWorkerCost = details.extraWorkerCost;
        response.extraHoursCost = details.extraHoursCost;
        break;

      case ServiceType.DELIVERY:
        response.volumeCost = details.volumeCost;
        response.distancePrice = details.distancePrice;
        response.fuelCost = details.fuelCost;
        response.tollCost = details.tollCost;
        response.urgencyMultiplier = details.urgencyMultiplier;
        response.urgency = details.urgency;
        break;
    }

    return response;
  }

  /**
   * Crée une instance de calculateur de fallback
   * Utilise maintenant les TemplateRules unifiées
   *
   * @param configService Service de configuration à utiliser
   * @returns Une instance de calculateur configurée avec des règles par défaut
   */
  public createFallbackCalculator(configService: any): any {
    // Import dynamique des fonctions de création de règles
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {
      createMovingRules,
    } = require("@/quotation/domain/rules/MovingRules");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {
      createTemplateRules,
    } = require("@/quotation/domain/rules/TemplateRules");

    // Créer les listes de règles
    const movingRulesList = createMovingRules();
    const templateRulesList = createTemplateRules(); // Règles unifiées remplaçant Pack et Service

    // Créer et retourner le calculateur
    const calculator = {
      configService,
      movingRulesList,
      templateRulesList, // Remplace packRulesList et serviceRulesList (services abandonnés)
    };

    logger.info(
      "✅ Calculateur de fallback créé avec TemplateRules unifiées via FallbackCalculatorService",
    );
    console.log(
      "✅ Calculateur de fallback créé avec TemplateRules unifiées via FallbackCalculatorService",
    );

    return calculator;
  }
}
