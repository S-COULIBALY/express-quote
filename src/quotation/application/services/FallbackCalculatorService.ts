import { ServiceType } from '@/quotation/domain/enums/ServiceType';
import { logger } from '@/lib/logger';
import { Quote } from '@/quotation/domain/valueObjects/Quote';
import { Money } from '@/quotation/domain/valueObjects/Money';
import { Discount } from '@/quotation/domain/valueObjects/Discount';
import { QuoteCalculator } from '@/quotation/domain/calculators/MovingQuoteCalculator';
import { ConfigurationService } from '@/quotation/domain/services/ConfigurationService';

/**
 * Service centralisé pour les calculs de fallback
 * Utilisé lorsque le QuoteCalculator principal n'est pas disponible
 */
export class FallbackCalculatorService {
  private static instance: FallbackCalculatorService;
  
  // Valeurs par défaut pour les différents services
  private static readonly DEFAULT_PRICES = {
    [ServiceType.MOVING]: 400,
    [ServiceType.PACK]: 300,
    [ServiceType.SERVICE]: 200
  };
  
  // Tarifs pour les calculs
  private static readonly RATES = {
    PRICE_PER_M3: 40,          // Prix par m³ pour déménagement
    PRICE_PER_KM: 2,           // Prix par km
    FUEL_COST_PER_KM: 0.15,    // Coût carburant par km
    TOLL_COST_PER_KM: 0.1,     // Coût péage par km
    WORKER_PRICE_PER_HOUR: 35, // Prix horaire par travailleur
    WORKER_PRICE_PER_DAY: 120, // Prix journalier par travailleur
    LIFT_COST: 200,            // Coût monte-meuble
    INCLUDED_DISTANCE: 20,     // Distance incluse dans le prix de base
    VAT_RATE: 0.2              // Taux de TVA (20%)
  };
  
  // Options pour les déménagements
  private static readonly MOVING_OPTIONS = {
    packaging: 150,
    furniture: 100,
    fragile: 80,
    storage: 200,
    disassembly: 120,
    unpacking: 100,
    supplies: 50,
    fragileItems: 80
  };

  private constructor() {}

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
   * Calcule un prix pour un déménagement (MOVING) en mode fallback
   * @param params Paramètres du déménagement
   * @returns Objet avec les détails du calcul
   */
  public calculateMovingFallback(params: {
    volume?: number,
    distance?: number,
    workers?: number,
    defaultPrice?: number,
    options?: Record<string, boolean>,
    pickupNeedsLift?: boolean,
    deliveryNeedsLift?: boolean
  }): {
    quote: Quote,
    details: Record<string, any>
  } {
    logger.info('🔄 FALLBACK - Calcul manuel pour MOVING', params);
    console.log('🔄 FALLBACK - Calcul manuel pour MOVING', params);
    
    const volume = params.volume || 0;
    const distance = params.distance || 0;
    const workers = params.workers || 2;
    const defaultPrice = params.defaultPrice || FallbackCalculatorService.DEFAULT_PRICES[ServiceType.MOVING];
    const options = params.options || {};
    
    // 1. Calcul du prix basé sur le volume
    const volumePrice = volume * FallbackCalculatorService.RATES.PRICE_PER_M3;
    
    // 2. Calcul du prix basé sur la distance
    const distancePrice = distance * FallbackCalculatorService.RATES.PRICE_PER_KM;
    
    // 3. Ajouter les frais de carburant et de péage
    const fuelCost = distance * FallbackCalculatorService.RATES.FUEL_COST_PER_KM;
    const tollCost = distance * FallbackCalculatorService.RATES.TOLL_COST_PER_KM;
    
    // 4. Calculer le prix de base
    const basePrice = volumePrice + distancePrice + fuelCost + tollCost;
    
    // 5. Ajouter les coûts des options
    let optionsCost = 0;
    
    for (const [option, isSelected] of Object.entries(options)) {
      if (isSelected && option in FallbackCalculatorService.MOVING_OPTIONS) {
        optionsCost += FallbackCalculatorService.MOVING_OPTIONS[option as keyof typeof FallbackCalculatorService.MOVING_OPTIONS];
      }
    }
    
    // 6. Ajouter les coûts de monte-meuble
    let liftCost = 0;
    if (params.pickupNeedsLift) liftCost += FallbackCalculatorService.RATES.LIFT_COST;
    if (params.deliveryNeedsLift) liftCost += FallbackCalculatorService.RATES.LIFT_COST;
    
    // 7. Appliquer un tarif minimum comme plancher (90% du prix par défaut)
    const minimumPrice = defaultPrice * 0.9;
    const totalPrice = Math.max(basePrice + optionsCost + liftCost, minimumPrice);
    
    const finalPrice = Math.round(totalPrice);
    
    // Créer les objets de domaine
    const baseMoneyPrice = new Money(defaultPrice);
    const finalMoneyPrice = new Money(finalPrice);
    const discounts: Discount[] = [];
    
    // Créer un objet Quote
    const quote = new Quote(baseMoneyPrice, finalMoneyPrice, discounts, ServiceType.MOVING);
    
    // Calculer la TVA
    const vatAmount = Math.round(finalPrice * FallbackCalculatorService.RATES.VAT_RATE);
    const totalWithVat = finalPrice + vatAmount;
    
    // Détails pour le débogage et l'affichage
    const details = {
      defaultPrice,
      volumePrice: Math.round(volumePrice),
      distancePrice: Math.round(distancePrice),
      fuelCost: Math.round(fuelCost),
      tollCost: Math.round(tollCost),
      basePrice: Math.round(basePrice),
      optionsCost: Math.round(optionsCost),
      liftCost: Math.round(liftCost),
      minimumPrice: Math.round(minimumPrice),
      finalPrice,
      vatAmount,
      totalWithVat,
    };
    
    logger.info('✅ FALLBACK - Résultat du calcul manuel pour MOVING:', details);
    console.log('✅ FALLBACK - Résultat du calcul manuel pour MOVING:', details);
    
    return { quote, details };
  }

  /**
   * Calcule un prix pour un service d'emballage (PACK) en mode fallback
   * @param params Paramètres du service d'emballage
   * @returns Objet avec les détails du calcul
   */
  public calculatePackFallback(params: {
    defaultPrice?: number,
    baseWorkers?: number,
    baseDuration?: number,
    workers?: number,
    duration?: number,
    distance?: number,
    pickupNeedsLift?: boolean,
    deliveryNeedsLift?: boolean
  }): {
    quote: Quote,
    details: Record<string, any>
  } {
    logger.info('🔄 FALLBACK - Calcul manuel pour PACK', params);
    console.log('🔄 FALLBACK - Calcul manuel pour PACK', params);
    
    const defaultPrice = params.defaultPrice || FallbackCalculatorService.DEFAULT_PRICES[ServiceType.PACK];
    const workers = params.workers || 2;
    const duration = params.duration || 1;
    const baseWorkers = params.baseWorkers || 2;
    const baseDuration = params.baseDuration || 1;
    const distance = params.distance || 0;
    
    let calculatedPrice = defaultPrice;
    
    // 1. Coût des jours supplémentaires
    let extraDurationCost = 0;
    if (duration > baseDuration) {
      const extraDays = duration - baseDuration;
      const dailyRate = defaultPrice / baseDuration;
      extraDurationCost = dailyRate * extraDays * 0.9; // 10% de réduction
      calculatedPrice += extraDurationCost;
    }
    
    // 2. Coût des travailleurs supplémentaires
    let extraWorkerCost = 0;
    if (workers > baseWorkers) {
      const extraWorkers = workers - baseWorkers;
      const reductionRate = duration === 1 ? 0.05 : 0.10; // 5% pour 1 jour, 10% pour plusieurs jours
      extraWorkerCost = extraWorkers * FallbackCalculatorService.RATES.WORKER_PRICE_PER_DAY * duration * (1 - reductionRate);
      calculatedPrice += extraWorkerCost;
    }
    
    // 3. Calculer le coût de la distance supplémentaire
    let extraDistanceCost = 0;
    if (distance > FallbackCalculatorService.RATES.INCLUDED_DISTANCE) {
      const extraKm = distance - FallbackCalculatorService.RATES.INCLUDED_DISTANCE;
      extraDistanceCost = extraKm * 1.5; // 1,50€ par km supplémentaire
      calculatedPrice += extraDistanceCost;
    }
    
    // 4. Calculer le coût du monte-meuble
    let liftCost = 0;
    if (params.pickupNeedsLift) liftCost += FallbackCalculatorService.RATES.LIFT_COST;
    if (params.deliveryNeedsLift) liftCost += FallbackCalculatorService.RATES.LIFT_COST;
    calculatedPrice += liftCost;
    
    // 5. Appliquer un tarif minimum comme plancher (90% du prix par défaut)
    const minimumPrice = defaultPrice * 0.9;
    const totalPrice = Math.max(calculatedPrice, minimumPrice);
    
    const finalPrice = Math.round(totalPrice);
    
    // Créer les objets de domaine
    const baseMoneyPrice = new Money(defaultPrice);
    const finalMoneyPrice = new Money(finalPrice);
    const discounts: Discount[] = [];
    
    // Créer un objet Quote
    const quote = new Quote(baseMoneyPrice, finalMoneyPrice, discounts, ServiceType.PACK);
    
    // Calculer la TVA
    const vatAmount = Math.round(finalPrice * FallbackCalculatorService.RATES.VAT_RATE);
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
      totalWithVat
    };
    
    logger.info('✅ FALLBACK - Résultat du calcul manuel pour PACK:', details);
    console.log('✅ FALLBACK - Résultat du calcul manuel pour PACK:', details);
    
    return { quote, details };
  }

  /**
   * Calcule un prix pour un service (SERVICE) en mode fallback
   * @param params Paramètres du service
   * @returns Objet avec les détails du calcul
   */
  public calculateServiceFallback(params: {
    defaultPrice?: number,
    defaultWorkers?: number,
    defaultDuration?: number,
    workers?: number,
    duration?: number
  }): {
    quote: Quote,
    details: Record<string, any>
  } {
    logger.info('🔄 FALLBACK - Calcul manuel pour SERVICE', params);
    console.log('🔄 FALLBACK - Calcul manuel pour SERVICE', params);
    
    const defaultPrice = params.defaultPrice || FallbackCalculatorService.DEFAULT_PRICES[ServiceType.SERVICE];
    const duration = params.duration || 1;
    const workers = params.workers || 1;
    const defaultDuration = params.defaultDuration || 1;
    const defaultWorkers = params.defaultWorkers || 1;
    
    // Calculer le prix
    let calculatedPrice = defaultPrice;
    
    // 1. Coût des travailleurs supplémentaires
    let extraWorkerCost = 0;
    if (workers > defaultWorkers) {
      const extraWorkers = workers - defaultWorkers;
      const reductionRate = duration <= 2 ? 0.1 : 0.15;
      extraWorkerCost = extraWorkers * FallbackCalculatorService.RATES.WORKER_PRICE_PER_HOUR * duration * (1 - reductionRate);
      calculatedPrice += extraWorkerCost;
    }
    
    // 2. Coût des heures supplémentaires
    let extraHoursCost = 0;
    if (duration > defaultDuration) {
      const extraHours = duration - defaultDuration;
      extraHoursCost = defaultWorkers * FallbackCalculatorService.RATES.WORKER_PRICE_PER_HOUR * extraHours;
      calculatedPrice += extraHoursCost;
    }
    
    // 3. Appliquer un tarif minimum comme plancher (90% du prix par défaut)
    const minimumPrice = defaultPrice * 0.9;
    const totalPrice = Math.max(calculatedPrice, minimumPrice);
    
    const finalPrice = Math.round(totalPrice);
    
    // Créer les objets de domaine
    const baseMoneyPrice = new Money(defaultPrice);
    const finalMoneyPrice = new Money(finalPrice);
    const discounts: Discount[] = [];
    
    // Créer un objet Quote
    const quote = new Quote(baseMoneyPrice, finalMoneyPrice, discounts, ServiceType.SERVICE);
    
    // Calculer la TVA
    const vatAmount = Math.round(finalPrice * FallbackCalculatorService.RATES.VAT_RATE);
    const totalWithVat = finalPrice + vatAmount;
    
    // Détails pour le débogage et l'affichage
    const details = {
      defaultPrice,
      extraWorkerCost: Math.round(extraWorkerCost),
      extraHoursCost: Math.round(extraHoursCost),
      minimumPrice: Math.round(minimumPrice),
      finalPrice,
      vatAmount,
      totalWithVat
    };
    
    logger.info('✅ FALLBACK - Résultat du calcul manuel pour SERVICE:', details);
    console.log('✅ FALLBACK - Résultat du calcul manuel pour SERVICE:', details);
    
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
    requestData: any
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
        discounts: quote.getDiscounts().map(d => ({
          description: d.getDescription(),
          amount: d.getAmount().getAmount(),
          type: d.getType()
        })),
        serviceType
      },
      details,
      original_request: requestData,
      calculation_type: "centralized_fallback"
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
    details: Record<string, any>
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
        response.optionsCost = details.optionsCost;
        break;
        
      case ServiceType.PACK:
        response.extraWorkerCost = details.extraWorkerCost;
        response.extraDurationCost = details.extraDurationCost;
        response.distancePrice = details.extraDistanceCost;
        response.liftCost = details.liftCost;
        break;
        
      case ServiceType.SERVICE:
        response.extraWorkerCost = details.extraWorkerCost;
        response.extraHoursCost = details.extraHoursCost;
        break;
    }
    
    return response;
  }
  
  /**
   * Crée une instance de QuoteCalculator avec des règles par défaut
   * 
   * @param configService Service de configuration à utiliser
   * @returns Une instance de QuoteCalculator configurée avec des règles par défaut
   */
  public createFallbackCalculator(configService: ConfigurationService): QuoteCalculator {
    // Import dynamique des fonctions de création de règles
    const { createMovingRules } = require('@/quotation/domain/rules/MovingRules');
    const { createPackRules } = require('@/quotation/domain/rules/PackRules');
    const { createServiceRules } = require('@/quotation/domain/rules/ServiceRules');
    
    // Créer les listes de règles
    const movingRulesList = createMovingRules();
    const packRulesList = createPackRules();
    const serviceRulesList = createServiceRules();
    
    // Créer et retourner le calculateur
    const calculator = new QuoteCalculator(
      configService,
      movingRulesList,
      packRulesList,
      serviceRulesList
    );
    
    logger.info('✅ Calculateur de fallback créé avec des règles codées en dur via FallbackCalculatorService');
    console.log("✅ Calculateur de fallback créé avec des règles codées en dur via FallbackCalculatorService");
    
    return calculator;
  }
} 