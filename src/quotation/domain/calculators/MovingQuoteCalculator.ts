import { AbstractQuoteCalculator } from './AbstractQuoteCalculator';
import { QuoteContext } from '../valueObjects/QuoteContext';
import { Money } from '../valueObjects/Money';
import { Rule } from '../valueObjects/Rule';
import { ServiceType } from '../enums/ServiceType';
import { QuoteCalculationError } from '../../interfaces/http/errors';
import { Quote } from '../valueObjects/Quote';
import { ConfigurationService } from '../services/ConfigurationService';
import { PricingConfigKey } from '../configuration/ConfigurationKey';
import { RuleEngine } from '../services/RuleEngine';
import { DefaultValues } from '../configuration/DefaultValues';

/**
 * Calculateur de devis pour les services de déménagement, emballage et autres services
 * 
 * Terminologie des prix:
 * - defaultPrice: Prix unitaire de base sans considération des quantités, durées, etc.
 * - basePrice: Prix ajusté après multiplication par les quantités, durées, nombre de travailleurs
 * - finalPrice: Prix final après application des réductions et majorations
 */
export class QuoteCalculator extends AbstractQuoteCalculator {
  private readonly movingRules: Rule[];
  private readonly packRules: Rule[];
  private readonly serviceRules: Rule[];
  private readonly configService: ConfigurationService;

  constructor(
    configService: ConfigurationService,
    movingRules: Rule[] = [], 
    packRules: Rule[] = [], 
    serviceRules: Rule[] = []
  ) {
    super(); // Constructeur neutre sans paramètres
    this.movingRules = movingRules;
    this.packRules = packRules;
    this.serviceRules = serviceRules;
    this.configService = configService;
  }

  // ============================================================================
  // MÉTHODES PRINCIPALES DE CALCUL
  // ============================================================================

  /**
   * Point d'entrée principal pour le calcul de devis
   */
  async calculate(context: QuoteContext): Promise<Quote> {
    const serviceType = context.getServiceType();
    const data = context.getAllData();
    
    if (!this.hasModifications(context)) {
      return new Quote(
        new Money(data.defaultPrice || 0),
        new Money(data.defaultPrice || 0),
        [],
        serviceType
      );
    }

    const enrichedContext = this.enrichContext(context, serviceType);
    const rules = this.getRulesForServiceType(serviceType);
    const basePrice = this.getBasePrice(enrichedContext);
    
    const ruleEngine = new RuleEngine(rules);
    const { finalPrice, discounts } = ruleEngine.execute(enrichedContext, basePrice);

    return new Quote(basePrice, finalPrice, discounts, serviceType);
  }

  /**
   * Calcule le prix de base ajusté pour les quantités et durées
   */
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

  // ============================================================================
  // CALCULS PAR TYPE DE SERVICE
  // ============================================================================

  private getMovingBasePrice(context: QuoteContext): Money {
    this.validateServiceType(context, ServiceType.MOVING);

    const { volume, distance, calculatedMovers } = this.extractMovingData(context);
    const numberOfMovers = calculatedMovers;
    
    // Ajouter le nombre de déménageurs au contexte pour qu'il soit disponible dans le devis
    context.setValue('numberOfMovers', numberOfMovers);
    
    const costs = {
      volume: this.calculateVolumeCost(volume),
      distance: this.calculateDistanceCost(distance),
      fuel: this.getOrCalculateFuelCost(context, distance),
      toll: this.getOrCalculateTollCost(context, distance)
    };

    const totalCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
    return new Money(Math.round(totalCost));
  }
  
  private getPackBasePrice(context: QuoteContext): Money {
    this.validateServiceType(context, ServiceType.PACK);
    
    const data = this.extractPackData(context);
    
    const costs = {
      base: data.defaultPrice,
      extraDuration: this.calculatePackExtraDurationCost(data),
      extraWorkers: this.calculatePackExtraWorkerCost(data),
      distance: this.calculatePackDistanceCost(data.distance),
      lift: this.calculatePackLiftCost(data.pickupNeedsLift, data.deliveryNeedsLift)
    };

    const totalCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
    return new Money(Math.round(totalCost));
  }

  private getServiceBasePrice(context: QuoteContext): Money {
    this.validateServiceType(context, ServiceType.SERVICE);
    
    const data = this.extractServiceData(context);
    
    if (data.duration === data.defaultDuration && data.workers === data.defaultWorkers) {
      return new Money(data.defaultPrice);
    }

    const costs = {
      base: data.defaultPrice,
      extraWorkers: this.calculateServiceExtraWorkerCost(data),
      extraHours: this.calculateServiceExtraHoursCost(data)
    };

    const totalCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
    return new Money(Math.round(totalCost));
  }

  // ============================================================================
  // CALCULS DE COÛTS SPÉCIALISÉS - DÉMÉNAGEMENT
  // ============================================================================

  private calculateVolumeCost(volume: number): number {
    const pricePerM3 = this.configService.getNumberValue(PricingConfigKey.MOVING_BASE_PRICE_PER_M3, DefaultValues.MOVING_BASE_PRICE_PER_M3);
    return volume * pricePerM3;
  }

  private calculateDistanceCost(distance: number): number {
    const pricePerKm = this.configService.getNumberValue(PricingConfigKey.MOVING_DISTANCE_PRICE_PER_KM, DefaultValues.MOVING_DISTANCE_PRICE_PER_KM);
    return distance * pricePerKm;
  }



  // ============================================================================
  // CALCULS DE COÛTS SPÉCIALISÉS - PACK
  // ============================================================================

  private calculatePackExtraDurationCost(data: any): number {
    if (data.duration <= data.baseDuration) return 0;

    const extraDays = data.duration - data.baseDuration;
    const workerPricePerDay = this.configService.getNumberValue(PricingConfigKey.PACK_WORKER_PRICE, DefaultValues.PACK_WORKER_PRICE);
    const discountRate = this.configService.getNumberValue(PricingConfigKey.PACK_EXTRA_DAY_DISCOUNT_RATE, DefaultValues.PACK_EXTRA_DAY_DISCOUNT_RATE);
    
    return (extraDays * data.workers) * workerPricePerDay * discountRate;
  }

  private calculatePackExtraWorkerCost(data: any): number {
    if (data.workers <= data.baseWorkers) return 0;

    const extraWorkers = data.workers - data.baseWorkers;
    const workerPricePerDay = this.configService.getNumberValue(PricingConfigKey.PACK_WORKER_PRICE, DefaultValues.PACK_WORKER_PRICE);
    const baseCost = extraWorkers * workerPricePerDay * data.duration;
    
    const reductionRate = data.duration === 1 
      ? this.configService.getNumberValue(PricingConfigKey.PACK_WORKER_DISCOUNT_RATE_1_DAY, DefaultValues.PACK_WORKER_DISCOUNT_RATE_1_DAY)
      : this.configService.getNumberValue(PricingConfigKey.PACK_WORKER_DISCOUNT_RATE_MULTI_DAYS, DefaultValues.PACK_WORKER_DISCOUNT_RATE_MULTI_DAYS);
    
    return baseCost * (1 - reductionRate);
  }

  private calculatePackDistanceCost(distance: number): number {
    const includedDistance = this.configService.getNumberValue(PricingConfigKey.PACK_INCLUDED_DISTANCE, DefaultValues.PACK_INCLUDED_DISTANCE);
    
    if (distance <= includedDistance) return 0;

    const extraKm = distance - includedDistance;
    const pricePerExtraKm = this.configService.getNumberValue(PricingConfigKey.PACK_EXTRA_KM_PRICE, DefaultValues.PACK_EXTRA_KM_PRICE);
    
    return extraKm * pricePerExtraKm;
  }

  private calculatePackLiftCost(pickupNeedsLift: boolean, deliveryNeedsLift: boolean): number {
    const liftPrice = this.configService.getNumberValue(PricingConfigKey.PACK_LIFT_PRICE, DefaultValues.PACK_LIFT_PRICE);
    let cost = 0;
    
    if (pickupNeedsLift) cost += liftPrice;
    if (deliveryNeedsLift) cost += liftPrice;
    
    return cost;
  }

  // ============================================================================
  // CALCULS DE COÛTS SPÉCIALISÉS - SERVICE
  // ============================================================================

  private calculateServiceExtraWorkerCost(data: any): number {
    if (data.workers <= data.defaultWorkers) return 0;

    const extraWorkers = data.workers - data.defaultWorkers;
    const workerPricePerHour = this.configService.getNumberValue(PricingConfigKey.SERVICE_WORKER_PRICE_PER_HOUR, DefaultValues.SERVICE_WORKER_PRICE_PER_HOUR);
    const baseCost = (extraWorkers * data.duration) * workerPricePerHour;
    
    const reductionRate = data.duration <= 2 
      ? this.configService.getNumberValue(PricingConfigKey.SERVICE_WORKER_DISCOUNT_RATE_SHORT, DefaultValues.SERVICE_WORKER_DISCOUNT_RATE_SHORT)
      : this.configService.getNumberValue(PricingConfigKey.SERVICE_WORKER_DISCOUNT_RATE_LONG, DefaultValues.SERVICE_WORKER_DISCOUNT_RATE_LONG);
    
    return baseCost * (1 - reductionRate);
  }

  private calculateServiceExtraHoursCost(data: any): number {
    if (data.duration <= data.defaultDuration) return 0;

    const extraHours = data.duration - data.defaultDuration;
    const hourlyRate = this.configService.getNumberValue(PricingConfigKey.SERVICE_WORKER_PRICE_PER_HOUR, DefaultValues.SERVICE_WORKER_PRICE_PER_HOUR);
    const extraHourRate = this.configService.getNumberValue(PricingConfigKey.SERVICE_EXTRA_HOUR_RATE, DefaultValues.SERVICE_EXTRA_HOUR_RATE);
    
    return hourlyRate * extraHours * extraHourRate * data.workers;
  }

  // ============================================================================
  // CALCULS UTILITAIRES
  // ============================================================================

  private calculateFuelCost(distance: number): number {
    const consumption = this.configService.getNumberValue(PricingConfigKey.FUEL_CONSUMPTION_PER_100KM, DefaultValues.FUEL_CONSUMPTION_PER_100KM);
    const pricePerLiter = this.configService.getNumberValue(PricingConfigKey.FUEL_PRICE_PER_LITER, DefaultValues.FUEL_PRICE_PER_LITER);
    
    return (distance * consumption / 100) * pricePerLiter;
  }
  
  private calculateTollCost(distance: number): number {
    const highwayRatio = this.configService.getNumberValue(PricingConfigKey.HIGHWAY_RATIO, DefaultValues.HIGHWAY_RATIO);
    const tollCostPerKm = this.configService.getNumberValue(PricingConfigKey.TOLL_COST_PER_KM, DefaultValues.TOLL_COST_PER_KM);
    
    return distance * highwayRatio * tollCostPerKm;
  }

  private calculateRequiredMovers(volume: number): number {
    if (volume <= 0) return 2;
    return Math.max(2, Math.min(Math.ceil(volume / 5), 6));
  }

  private calculateEstimatedBoxes(volume: number): number {
    return Math.ceil(volume * 10);
  }

  // ============================================================================
  // MÉTHODES D'EXTRACTION DE DONNÉES
  // ============================================================================

  private extractMovingData(context: QuoteContext) {
    const volume = context.getValue<number>('volume') ?? 10;
    const distance = context.getValue<number>('distance') ?? 50;
    const calculatedMovers = context.getValue<number>('numberOfMovers') ?? this.calculateRequiredMovers(volume);
    
    return { volume, distance, calculatedMovers };
  }

  private extractPackData(context: QuoteContext) {
    return {
      defaultPrice: context.getValue<number>('defaultPrice') ?? 0,
      duration: context.getValue<number>('duration') ?? 1,
      workers: context.getValue<number>('workers') ?? 2,
      baseWorkers: context.getValue<number>('baseWorkers') ?? 2,
      baseDuration: context.getValue<number>('baseDuration') ?? 1,
      distance: context.getValue<number>('distance') ?? 50,
      pickupNeedsLift: context.getValue<boolean>('pickupNeedsLift') ?? false,
      deliveryNeedsLift: context.getValue<boolean>('deliveryNeedsLift') ?? false
    };
  }

  private extractServiceData(context: QuoteContext) {
    return {
      defaultPrice: context.getValue<number>('defaultPrice') ?? 0,
      duration: context.getValue<number>('duration') ?? 1,
      workers: context.getValue<number>('workers') ?? 1,
      defaultDuration: context.getValue<number>('defaultDuration') ?? 1,
      defaultWorkers: context.getValue<number>('defaultWorkers') ?? 1
    };
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES
  // ============================================================================

  private validateServiceType(context: QuoteContext, expectedType: ServiceType): void {
    if (context.getServiceType() !== expectedType) {
      throw new QuoteCalculationError(`Invalid context type for ${expectedType} quote`);
    }
  }

  private getOrCalculateFuelCost(context: QuoteContext, distance: number): number {
    return context.getValue<number>('fuelCost') ?? this.calculateFuelCost(distance);
  }

  private getOrCalculateTollCost(context: QuoteContext, distance: number): number {
    return context.getValue<number>('tollCost') ?? this.calculateTollCost(distance);
  }

  private enrichContext(context: QuoteContext, serviceType: ServiceType): QuoteContext {
    if (serviceType !== ServiceType.MOVING) return context;
    
    return this.enrichContextWithMovingResources(context);
  }

  private getRulesForServiceType(serviceType: ServiceType): Rule[] {
    switch(serviceType) {
      case ServiceType.MOVING: return this.movingRules;
      case ServiceType.PACK: return this.packRules;
      case ServiceType.SERVICE: return this.serviceRules;
      default: throw new QuoteCalculationError(`Invalid service type: ${serviceType}`);
    }
  }

  private enrichContextWithMovingResources(context: QuoteContext): QuoteContext {
    const volume = context.getValue<number>('volume') ?? 0;
    const distance = context.getValue<number>('distance') ?? 0;
    
    const newContext = new QuoteContext(context.getServiceType());
    const existingData = context.getAllData();
    
    Object.keys(existingData).forEach(key => {
      newContext.setValue(key, existingData[key]);
    });
    
    newContext.setValue('numberOfMovers', this.calculateRequiredMovers(volume));
    newContext.setValue('numberOfBoxes', this.calculateEstimatedBoxes(volume));
    newContext.setValue('fuelCost', this.getOrCalculateFuelCost(context, distance));
    newContext.setValue('tollCost', this.getOrCalculateTollCost(context, distance));
    
    return newContext;
  }

  private hasModifications(context: QuoteContext): boolean {
    const data = context.getAllData();
    const serviceType = context.getServiceType();
    
    const isDurationModified = data.duration !== undefined && 
                              data.defaultDuration !== undefined && 
                              data.duration !== data.defaultDuration;
                            
    const isWorkersModified = data.workers !== undefined && 
                             data.defaultWorkers !== undefined && 
                             data.workers !== data.defaultWorkers;
    
    switch(serviceType) {
      case ServiceType.PACK:
        return this.hasPackModifications(data, isDurationModified, isWorkersModified);
        
      case ServiceType.MOVING:
        return this.hasMovingModifications(data);
        
      case ServiceType.SERVICE:
        return isDurationModified || isWorkersModified;
        
      default:
        return true;
    }
  }

  private hasPackModifications(data: any, isDurationModified: boolean, isWorkersModified: boolean): boolean {
    const hasLiftOption = data.pickupNeedsLift === true || data.deliveryNeedsLift === true;
    const hasExtraDistance = (data.distance ?? 0) > (data.includedDistance || 20);
    
    return isDurationModified || isWorkersModified || hasLiftOption || hasExtraDistance;
  }

  private hasMovingModifications(data: any): boolean {
    const hasVolumeAndDistance = (data.volume !== undefined && data.volume > 0) && 
                               (data.distance !== undefined && data.distance > 0);
    
    const hasLogisticsConstraints = (data.pickupLogisticsConstraints && data.pickupLogisticsConstraints.length > 0) ||
                                  (data.deliveryLogisticsConstraints && data.deliveryLogisticsConstraints.length > 0);
    
    const hasFloorInfo = data.pickupFloor !== undefined || data.deliveryFloor !== undefined;
    
    return hasVolumeAndDistance || hasLogisticsConstraints || hasFloorInfo;
  }
} 