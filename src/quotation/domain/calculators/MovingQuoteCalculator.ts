import { AbstractQuoteCalculator } from './AbstractQuoteCalculator';
import { QuoteContext } from '../valueObjects/QuoteContext';
import { Money } from '../valueObjects/Money';
import { Rule } from '../valueObjects/Rule';
import { ServiceType } from '../enums/ServiceType';
import { QuoteCalculationError } from '../../interfaces/http/errors';
import { Quote } from '../valueObjects/Quote';
import { Discount, DiscountType } from '../valueObjects/Discount';
import { MovingResourceCalculator } from '../services/MovingResourceCalculator';

export class QuoteCalculator extends AbstractQuoteCalculator {
  // Constantes pour Moving
  private static readonly MOVING_BASE_PRICE_PER_M3 = 10;
  private static readonly DISTANCE_PRICE_PER_KM = 2;
  
  // Paramètres pour les frais de carburant
  private static readonly FUEL_CONSUMPTION_PER_100KM = 25; // litres/100km (camion de déménagement)
  private static readonly FUEL_PRICE_PER_LITER = 1.8; // prix moyen du diesel en €/litre
  
  // Paramètres pour l'estimation des péages
  private static readonly TOLL_COST_PER_KM = 0.15; // coût moyen des péages en €/km sur autoroute
  private static readonly HIGHWAY_RATIO = 0.7; // proportion moyenne du trajet sur autoroute
  
  // Constantes pour Pack et Service
  private static readonly WORKER_PRICE_PER_DAY = 120;
  private static readonly WORKER_PRICE_MULTIPLIER = 0.9; // réduction pour plus de travailleurs
  
  private readonly resourceCalculator: MovingResourceCalculator;
  private readonly packRules: Rule[];
  private readonly serviceRules: Rule[];

  constructor(movingRules: Rule[], packRules: Rule[] = [], serviceRules: Rule[] = []) {
    super(movingRules);
    this.resourceCalculator = new MovingResourceCalculator();
    this.packRules = packRules;
    this.serviceRules = serviceRules;
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

    const volume = context.getValue<number>('volume') ?? 0;
    const distance = context.getValue<number>('distance') ?? 0;

    // Récupération des frais de carburant et de péage du contexte ou calcul si non fournis
    const fuelCost = context.getValue<number>('fuelCost') ?? this.calculateFuelCost(distance);
    const tollCost = context.getValue<number>('tollCost') ?? this.calculateTollCost(distance);

    // Calcul du prix basé sur le volume
    const volumePrice = volume * QuoteCalculator.MOVING_BASE_PRICE_PER_M3;
    
    // Calcul du prix basé sur la distance (main d'œuvre et usure du véhicule)
    const distancePrice = distance * QuoteCalculator.DISTANCE_PRICE_PER_KM;
    
    // Prix total incluant tous les composants
    const totalBasePrice = volumePrice + distancePrice + fuelCost + tollCost;

    return new Money(Math.round(totalBasePrice));
  }
  
  private getPackBasePrice(context: QuoteContext): Money {
    if (context.getServiceType() !== ServiceType.PACK) {
      throw new QuoteCalculationError('Invalid context type for pack quote');
    }
    
    // Récupérer le prix de base du pack
    const basePrice = context.getValue<number>('basePrice') ?? 0;
    
    // Si duration et workers sont personnalisés, ajuster le prix
    const duration = context.getValue<number>('duration') ?? 1;
    const workers = context.getValue<number>('workers') ?? 2;
    
    // Vérifier si c'est le prix de base
    const isDefaultPrice = duration === 1 && workers === 2;
    
    if (isDefaultPrice) {
      return new Money(basePrice);
    }
    
    // Calculer le coût des travailleurs avec un facteur d'échelle
    const workerCost = workers * QuoteCalculator.WORKER_PRICE_PER_DAY * duration;
    const workerCostWithScale = workers > 2 
      ? workerCost * Math.pow(QuoteCalculator.WORKER_PRICE_MULTIPLIER, workers - 2)
      : workerCost;
    
    // Ajuster le prix de base en fonction du rapport durée/travailleurs
    const adjustedBasePrice = (basePrice * 0.6) + workerCostWithScale;
    
    return new Money(Math.round(adjustedBasePrice));
  }

  private getServiceBasePrice(context: QuoteContext): Money {
    if (context.getServiceType() !== ServiceType.SERVICE) {
      throw new QuoteCalculationError('Invalid context type for service quote');
    }
    
    // Récupérer le prix de base du service
    const basePrice = context.getValue<number>('basePrice') ?? 0;
    
    // Si duration et workers sont personnalisés, ajuster le prix
    const duration = context.getValue<number>('duration') ?? 1;
    const workers = context.getValue<number>('workers') ?? 2;
    
    // Vérifier si c'est le prix de base (en vérifiant contre les valeurs par défaut du service)
    const defaultDuration = context.getValue<number>('defaultDuration') ?? duration;
    const defaultWorkers = context.getValue<number>('defaultWorkers') ?? workers;
    const isDefaultPrice = duration === defaultDuration && workers === defaultWorkers;
    
    if (isDefaultPrice) {
      return new Money(basePrice);
    }
    
    // Calculer le coût des travailleurs
    const workerCost = workers * QuoteCalculator.WORKER_PRICE_PER_DAY * (duration / 8); // durée en heures
    
    // Ajuster le prix de base en fonction du rapport durée/travailleurs
    const adjustedBasePrice = (basePrice * 0.4) + workerCost;
    
    return new Money(Math.round(adjustedBasePrice));
  }
  
  /**
   * Calcule les frais de carburant en fonction de la distance
   * @param distance Distance en km
   * @returns Coût du carburant en euros
   */
  private calculateFuelCost(distance: number): number {
    // Consommation totale en litres
    const fuelConsumption = (distance * QuoteCalculator.FUEL_CONSUMPTION_PER_100KM) / 100;
    
    // Coût du carburant
    return fuelConsumption * QuoteCalculator.FUEL_PRICE_PER_LITER;
  }
  
  /**
   * Estime les frais de péage en fonction de la distance
   * @param distance Distance en km
   * @returns Coût estimé des péages en euros
   */
  private calculateTollCost(distance: number): number {
    // Estimation de la distance sur autoroute
    const highwayDistance = distance * QuoteCalculator.HIGHWAY_RATIO;
    
    // Coût des péages
    return highwayDistance * QuoteCalculator.TOLL_COST_PER_KM;
  }

  private enrichContextWithMovingResources(context: QuoteContext): QuoteContext {
    const volume = context.getValue<number>('volume') ?? 0;
    const distance = context.getValue<number>('distance') ?? 0;
    const numberOfMovers = this.resourceCalculator.calculateRequiredMovers(volume);
    const numberOfBoxes = this.resourceCalculator.calculateEstimatedBoxes(volume);
    
    // Utiliser les frais de carburant et de péage du contexte ou les calculer si non fournis
    const fuelCost = context.getValue<number>('fuelCost') ?? this.calculateFuelCost(distance);
    const tollCost = context.getValue<number>('tollCost') ?? this.calculateTollCost(distance);
    
    const enrichedData = {
      ...context.getAllData(),
      numberOfMovers,
      numberOfBoxes,
      fuelCost,
      tollCost
    };
    
    return new QuoteContext(enrichedData);
  }

  async calculate(context: QuoteContext): Promise<Quote> {
    const serviceType = context.getServiceType();
    let enrichedContext = context;
    let rules: Rule[];
    
    // Choisir les règles appropriées et enrichir le contexte selon le type
    switch(serviceType) {
      case ServiceType.MOVING:
        enrichedContext = this.enrichContextWithMovingResources(context);
        rules = this.rules;
        break;
      case ServiceType.PACK:
        rules = this.packRules;
        break;
      case ServiceType.SERVICE:
        rules = this.serviceRules;
        break;
      default:
        throw new QuoteCalculationError(`Invalid service type: ${serviceType}`);
    }
    
    // Calculer le prix de base
    const basePrice = this.getBasePrice(enrichedContext);
    
    // Appliquer les règles spécifiques au type de service
    const { finalPrice, discounts } = this.ruleEngine.execute(enrichedContext, basePrice);
    
    // Retourner le devis final
    return new Quote(
      basePrice,
      finalPrice,
      discounts,
      enrichedContext
    );
  }
} 