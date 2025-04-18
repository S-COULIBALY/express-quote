import { AbstractQuoteCalculator } from './AbstractQuoteCalculator';
import { QuoteContext } from '../valueObjects/QuoteContext';
import { Money } from '../valueObjects/Money';
import { Rule } from '../valueObjects/Rule';
import { ServiceType } from '../enums/ServiceType';
import { QuoteCalculationError } from '../../interfaces/http/errors';
import { Quote } from '../valueObjects/Quote';
import { Discount, DiscountType } from '../valueObjects/Discount';
import { MovingResourceCalculator } from '../services/MovingResourceCalculator';
import { ConfigurationService } from '../services/ConfigurationService';
import { PricingConfigKey } from '../configuration/ConfigurationKey';
import { RuleEngine } from '../services/RuleEngine';

export class QuoteCalculator extends AbstractQuoteCalculator {
  private readonly resourceCalculator: MovingResourceCalculator;
  private readonly packRules: Rule[];
  private readonly serviceRules: Rule[];
  private readonly configService: ConfigurationService;

  constructor(
    configService: ConfigurationService,
    movingRules: Rule[] = [], 
    packRules: Rule[] = [], 
    serviceRules: Rule[] = []
  ) {
    super(movingRules);
    this.resourceCalculator = new MovingResourceCalculator();
    this.packRules = packRules;
    this.serviceRules = serviceRules;
    this.configService = configService;
  }

  getBasePrice(context: QuoteContext): Money {
    const serviceType = context.getServiceType();
    
    switch(serviceType) {
      case ServiceType.MOVING:
        return this.getMovingBasePrice(context);
      case ServiceType.PACK:
        return this.getPackBasePrice(context);
      case ServiceType.SERVICE:
        return this.getServiceBasePrice(context);
      default:
        throw new QuoteCalculationError(`Invalid service type: ${serviceType}`);
    }
  }

  private getMovingBasePrice(context: QuoteContext): Money {
    if (context.getServiceType() !== ServiceType.MOVING) {
      throw new QuoteCalculationError('Invalid context type for moving quote');
    }

    // 1. Récupérer les valeurs du contexte
    const volume = context.getValue<number>('volume') ?? 0;
    const distance = context.getValue<number>('distance') ?? 0;
    
    // 2. Récupération des frais de carburant et de péage du contexte ou calcul si non fournis
    const fuelCost = context.getValue<number>('fuelCost') ?? this.calculateFuelCost(distance);
    const tollCost = context.getValue<number>('tollCost') ?? this.calculateTollCost(distance);
    
    // 3. Calcul du prix basé sur le volume
    const pricePerM3 = this.configService.getNumberValue(
      PricingConfigKey.MOVING_BASE_PRICE_PER_M3, 
      10 // valeur par défaut
    );
    const volumePrice = volume * pricePerM3;
    
    // 4. Calcul du prix basé sur la distance (main d'œuvre et usure du véhicule)
    const pricePerKm = this.configService.getNumberValue(
      PricingConfigKey.MOVING_DISTANCE_PRICE_PER_KM, 
      2 // valeur par défaut
    );
    const distancePrice = distance * pricePerKm;
    
    // 5. Calculer le prix final
    const finalPrice = volumePrice + distancePrice + fuelCost + tollCost;

    return new Money(Math.round(finalPrice));
  }
  
  private getPackBasePrice(context: QuoteContext): Money {
    if (context.getServiceType() !== ServiceType.PACK) {
      throw new QuoteCalculationError('Invalid context type for pack quote');
    }
    
    // 1. Récupérer les valeurs du contexte
    const basePrice = context.getValue<number>('basePrice') ?? 0;
    const duration = context.getValue<number>('duration') ?? 1;
    const workers = context.getValue<number>('workers') ?? 2;
    const baseWorkers = context.getValue<number>('baseWorkers') ?? 2;
    const baseDuration = context.getValue<number>('baseDuration') ?? 1;
    const distance = context.getValue<number>('distance') ?? 0;
    const pickupNeedsLift = context.getValue<boolean>('pickupNeedsLift') ?? false;
    const deliveryNeedsLift = context.getValue<boolean>('deliveryNeedsLift') ?? false;
    
    // 2. Calculer le coût des jours supplémentaires
    let extraDurationCost = 0;
    if (duration > baseDuration) {
      const extraDays = duration - baseDuration;
      const dailyRate = basePrice / baseDuration;
      const extraDayDiscountRate = this.configService.getNumberValue(
        PricingConfigKey.PACK_EXTRA_DAY_DISCOUNT_RATE, 
        0.8 // valeur par défaut
      );
      extraDurationCost = dailyRate * extraDays * extraDayDiscountRate;
    }
    
    // 3. Calculer le coût des travailleurs supplémentaires
    let extraWorkerCost = 0;
    if (workers > baseWorkers) {
      const extraWorkers = workers - baseWorkers;
      const workerPricePerDay = this.configService.getNumberValue(
        PricingConfigKey.PACK_WORKER_PRICE, 
        120 // valeur par défaut
      );
      const extraWorkerBaseCost = extraWorkers * workerPricePerDay * duration;
      
      let reductionRate;
      if (duration === 1) {
        reductionRate = this.configService.getNumberValue(
          PricingConfigKey.PACK_WORKER_DISCOUNT_RATE_1_DAY, 
          0.05 // valeur par défaut
        );
      } else {
        reductionRate = this.configService.getNumberValue(
          PricingConfigKey.PACK_WORKER_DISCOUNT_RATE_MULTI_DAYS, 
          0.10 // valeur par défaut
        );
      }
      
      extraWorkerCost = extraWorkerBaseCost * (1 - reductionRate);
    }
    
    // 4. Calculer les frais de distance (km au-delà de l'inclus)
    let distanceCost = 0;
    const includedDistance = this.configService.getNumberValue(
      PricingConfigKey.PACK_INCLUDED_DISTANCE, 
      20 // valeur par défaut
    );
    
    if (distance > includedDistance) {
      const extraKm = distance - includedDistance;
      const pricePerExtraKm = this.configService.getNumberValue(
        PricingConfigKey.PACK_EXTRA_KM_PRICE, 
        1.5 // valeur par défaut
      );
      distanceCost = extraKm * pricePerExtraKm;
    }
    
    // 5. Calculer le coût du monte-meuble
    let liftCost = 0;
    const liftPrice = this.configService.getNumberValue(
      PricingConfigKey.PACK_LIFT_PRICE, 
      200 // valeur par défaut
    );
    
    if (pickupNeedsLift) liftCost += liftPrice;
    if (deliveryNeedsLift) liftCost += liftPrice;
    
    // 6. Calculer le prix final
    const finalPrice = basePrice + extraDurationCost + extraWorkerCost + distanceCost + liftCost;
    
    return new Money(Math.round(finalPrice));
  }

  private getServiceBasePrice(context: QuoteContext): Money {
    if (context.getServiceType() !== ServiceType.SERVICE) {
      throw new QuoteCalculationError('Invalid context type for service quote');
    }
    
    // 1. Récupérer les valeurs du contexte
    const basePrice = context.getValue<number>('basePrice') ?? 0;
    const duration = context.getValue<number>('duration') ?? 1;
    const workers = context.getValue<number>('workers') ?? 1;
    const defaultDuration = context.getValue<number>('defaultDuration') ?? 1;
    const defaultWorkers = context.getValue<number>('defaultWorkers') ?? 1;
    
    // 2. Vérifier si c'est la configuration par défaut
    if (duration === defaultDuration && workers === defaultWorkers) {
      return new Money(basePrice);
    }
    
    // 3. Calculer le coût des travailleurs supplémentaires
    let extraWorkerCost = 0;
    if (workers > defaultWorkers) {
      const extraWorkers = workers - defaultWorkers;
      const workerPricePerHour = this.configService.getNumberValue(
        PricingConfigKey.SERVICE_WORKER_PRICE_PER_HOUR, 
        35 // valeur par défaut
      );
      const extraWorkerBaseCost = extraWorkers * workerPricePerHour * duration;
      
      let reductionRate;
      if (duration <= 2) {
        reductionRate = this.configService.getNumberValue(
          PricingConfigKey.SERVICE_WORKER_DISCOUNT_RATE_SHORT, 
          0.1 // valeur par défaut
        );
      } else {
        reductionRate = this.configService.getNumberValue(
          PricingConfigKey.SERVICE_WORKER_DISCOUNT_RATE_LONG, 
          0.15 // valeur par défaut
        );
      }
      
      extraWorkerCost = extraWorkerBaseCost * (1 - reductionRate);
    }
    
    // 4. Calculer le coût des heures supplémentaires pour les travailleurs par défaut
    let defaultWorkerExtraHoursCost = 0;
    if (duration > defaultDuration) {
      const extraHours = duration - defaultDuration;
      const workerPricePerHour = this.configService.getNumberValue(
        PricingConfigKey.SERVICE_WORKER_PRICE_PER_HOUR, 
        35 // valeur par défaut
      );
      defaultWorkerExtraHoursCost = defaultWorkers * workerPricePerHour * extraHours;
    }
    
    // 5. Calculer le prix final
    const calculatedPrice = basePrice + extraWorkerCost + defaultWorkerExtraHoursCost;
    
    return new Money(Math.round(calculatedPrice));
  }
  
  /**
   * Calcule les frais de carburant en fonction de la distance
   * @param distance Distance en km
   * @returns Coût du carburant en euros
   */
  private calculateFuelCost(distance: number): number {
    // Récupérer les valeurs de configuration
    const fuelConsumptionPer100km = this.configService.getNumberValue(
      PricingConfigKey.FUEL_CONSUMPTION_PER_100KM, 
      25 // valeur par défaut
    );
    
    const fuelPricePerLiter = this.configService.getNumberValue(
      PricingConfigKey.FUEL_PRICE_PER_LITER, 
      1.8 // valeur par défaut
    );
    
    // Consommation totale en litres
    const fuelConsumption = (distance * fuelConsumptionPer100km) / 100;
    
    // Coût du carburant
    return fuelConsumption * fuelPricePerLiter;
  }
  
  /**
   * Estime les frais de péage en fonction de la distance
   * @param distance Distance en km
   * @returns Coût estimé des péages en euros
   */
  private calculateTollCost(distance: number): number {
    // Récupérer les valeurs de configuration
    const highwayRatio = this.configService.getNumberValue(
      PricingConfigKey.HIGHWAY_RATIO, 
      0.7 // valeur par défaut
    );
    
    const tollCostPerKm = this.configService.getNumberValue(
      PricingConfigKey.TOLL_COST_PER_KM, 
      0.15 // valeur par défaut
    );
    
    // Estimation de la distance sur autoroute
    const highwayDistance = distance * highwayRatio;
    
    // Coût des péages
    return highwayDistance * tollCostPerKm;
  }

  private enrichContextWithMovingResources(context: QuoteContext): QuoteContext {
    const volume = context.getValue<number>('volume') ?? 0;
    const distance = context.getValue<number>('distance') ?? 0;
    const numberOfMovers = this.resourceCalculator.calculateRequiredMovers(volume);
    const numberOfBoxes = this.resourceCalculator.calculateEstimatedBoxes(volume);
    
    // Utiliser les frais de carburant et de péage du contexte ou les calculer si non fournis
    const fuelCost = context.getValue<number>('fuelCost') ?? this.calculateFuelCost(distance);
    const tollCost = context.getValue<number>('tollCost') ?? this.calculateTollCost(distance);
    
    // Créer un nouveau contexte avec le même type de service que le contexte d'origine
    const serviceType = context.getServiceType();
    const newContext = new QuoteContext(serviceType);
    
    // Copier toutes les données existantes
    const existingData = context.getAllData();
    Object.keys(existingData).forEach(key => {
      newContext.setValue(key, existingData[key]);
    });
    
    // Ajouter les nouvelles données
    newContext.setValue('numberOfMovers', numberOfMovers);
    newContext.setValue('numberOfBoxes', numberOfBoxes);
    newContext.setValue('fuelCost', fuelCost);
    newContext.setValue('tollCost', tollCost);
    
    return newContext;
  }

  async calculate(context: QuoteContext): Promise<Quote> {
    console.log("\n==== DÉBUT QUOTEACLCULATOR.CALCULATE ====");
    console.log("📋 CONTEXTE REÇU:", {
      serviceType: context.getServiceType(),
      data: context.getAllData()
    });
    
    try {
      const serviceType = context.getServiceType();
      console.log("🔍 TYPE DE SERVICE:", serviceType);
      
      let enrichedContext = context;
      let rules: Rule[];
      
      // Choisir les règles appropriées et enrichir le contexte selon le type
      console.log("🔄 SÉLECTION DES RÈGLES en fonction du type de service");
      switch(serviceType) {
        case ServiceType.MOVING:
          console.log("🚚 SERVICE DE TYPE MOVING");
          enrichedContext = this.enrichContextWithMovingResources(context);
          rules = this.rules;
          console.log(`📋 ${this.rules.length} règles MOVING chargées`);
          break;
        case ServiceType.PACK:
          console.log("📦 SERVICE DE TYPE PACK");
          rules = this.packRules;
          console.log(`📋 ${this.packRules.length} règles PACK chargées`);
          break;
        case ServiceType.SERVICE:
          console.log("🛠️ SERVICE DE TYPE SERVICE");
          rules = this.serviceRules;
          console.log(`📋 ${this.serviceRules.length} règles SERVICE chargées`);
          break;
        default:
          console.log("❌ TYPE DE SERVICE INVALIDE:", serviceType);
          throw new QuoteCalculationError(`Invalid service type: ${serviceType}`);
      }
      
      console.log("🧮 CALCUL DU PRIX DE BASE");
      try {
        // Calculer le prix de base
        const basePrice = this.getBasePrice(enrichedContext);
        console.log("✅ PRIX DE BASE CALCULÉ:", basePrice.getAmount());
        
        console.log("⚙️ CRÉATION D'UNE INSTANCE DE RULEENGINE");
        // Instancier un nouveau RuleEngine avec les règles appropriées
        // pour s'assurer que les bonnes règles sont utilisées
        const { RuleEngine } = require('../services/RuleEngine');
        const ruleEngine = new RuleEngine(rules);
        
        console.log("🔍 EXÉCUTION DES RÈGLES pour ajuster le prix");
        // Appliquer les règles spécifiques au type de service
        try {
          const result = ruleEngine.execute(enrichedContext, basePrice);
          console.log("✅ RÈGLES APPLIQUÉES AVEC SUCCÈS");
          console.log("💰 RÉSULTAT:", {
            basePrice: basePrice.getAmount(),
            finalPrice: result.finalPrice.getAmount(),
            discounts: result.discounts.length
          });
          
          const { finalPrice, discounts } = result;
          
          // Retourner le devis final
          const quote = new Quote(
            basePrice,
            finalPrice,
            discounts,
            serviceType // Passer directement le type de service au lieu du contexte
          );
          
          console.log("==== FIN QUOTEACLCULATOR.CALCULATE (SUCCÈS) ====\n");
          return quote;
        } catch (ruleError) {
          console.log("❌ ERREUR DANS L'EXÉCUTION DES RÈGLES:", ruleError);
          if (ruleError instanceof Error) {
            console.log("📋 TYPE D'ERREUR:", ruleError.constructor.name);
            console.log("📋 MESSAGE:", ruleError.message);
            console.log("📋 STACK:", ruleError.stack);
          }
          throw new QuoteCalculationError(`Error applying rules: ${ruleError instanceof Error ? ruleError.message : String(ruleError)}`);
        }
      } catch (basePriceError) {
        console.log("❌ ERREUR DANS LE CALCUL DU PRIX DE BASE:", basePriceError);
        if (basePriceError instanceof Error) {
          console.log("📋 TYPE D'ERREUR:", basePriceError.constructor.name);
          console.log("📋 MESSAGE:", basePriceError.message);
          console.log("📋 STACK:", basePriceError.stack);
        }
        throw basePriceError; // Propager l'erreur telle quelle
      }
    } catch (error) {
      console.log("❌ ERREUR GLOBALE DANS QUOTEACLCULATOR.CALCULATE:", error);
      if (error instanceof Error) {
        console.log("📋 TYPE D'ERREUR:", error.constructor.name);
        console.log("📋 MESSAGE:", error.message);
        console.log("📋 STACK:", error.stack);
      }
      console.log("==== FIN QUOTEACLCULATOR.CALCULATE (ERREUR) ====\n");
      throw error;
    }
  }
} 