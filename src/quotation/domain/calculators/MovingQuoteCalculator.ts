import { AbstractQuoteCalculator } from './AbstractQuoteCalculator';
import { QuoteContext } from '../valueObjects/QuoteContext';
import { Money } from '../valueObjects/Money';
import { Rule } from '../valueObjects/Rule';
import { ServiceType } from '../entities/Service';
import { QuoteCalculationError } from '../../interfaces/http/errors';
import { Quote } from '../valueObjects/Quote';
import { Discount, DiscountType } from '../valueObjects/Discount';
import { MovingResourceCalculator } from '../services/MovingResourceCalculator';

export class MovingQuoteCalculator extends AbstractQuoteCalculator {
  private static readonly BASE_PRICE_PER_M3 = 10;
  private static readonly DISTANCE_PRICE_PER_KM = 2;
  
  // Paramètres pour les frais de carburant
  private static readonly FUEL_CONSUMPTION_PER_100KM = 25; // litres/100km (camion de déménagement)
  private static readonly FUEL_PRICE_PER_LITER = 1.8; // prix moyen du diesel en €/litre
  
  // Paramètres pour l'estimation des péages
  private static readonly TOLL_COST_PER_KM = 0.15; // coût moyen des péages en €/km sur autoroute
  private static readonly HIGHWAY_RATIO = 0.7; // proportion moyenne du trajet sur autoroute
  
  private readonly resourceCalculator: MovingResourceCalculator;

  constructor(rules: Rule[]) {
    super(rules);
    this.resourceCalculator = new MovingResourceCalculator();
  }

  getBasePrice(context: QuoteContext): Money {
    if (context.getServiceType() !== ServiceType.MOVING) {
      throw new QuoteCalculationError('Invalid context type for moving quote');
    }

    const volume = context.getValue<number>('volume') ?? 0;
    const distance = context.getValue<number>('distance') ?? 0;

    // Calcul du prix basé sur le volume
    const volumePrice = volume * MovingQuoteCalculator.BASE_PRICE_PER_M3;
    
    // Calcul du prix basé sur la distance (main d'œuvre et usure du véhicule)
    const distancePrice = distance * MovingQuoteCalculator.DISTANCE_PRICE_PER_KM;
    
    // Calcul des frais de carburant
    const fuelCost = this.calculateFuelCost(distance);
    
    // Calcul des frais de péage
    const tollCost = this.calculateTollCost(distance);
    
    // Prix total incluant tous les composants
    const totalBasePrice = volumePrice + distancePrice + fuelCost + tollCost;

    return new Money(Math.round(totalBasePrice));
  }
  
  /**
   * Calcule les frais de carburant en fonction de la distance
   * @param distance Distance en km
   * @returns Coût du carburant en euros
   */
  private calculateFuelCost(distance: number): number {
    // Consommation totale en litres
    const fuelConsumption = (distance * MovingQuoteCalculator.FUEL_CONSUMPTION_PER_100KM) / 100;
    
    // Coût du carburant
    return fuelConsumption * MovingQuoteCalculator.FUEL_PRICE_PER_LITER;
  }
  
  /**
   * Estime les frais de péage en fonction de la distance
   * @param distance Distance en km
   * @returns Coût estimé des péages en euros
   */
  private calculateTollCost(distance: number): number {
    // Estimation de la distance sur autoroute
    const highwayDistance = distance * MovingQuoteCalculator.HIGHWAY_RATIO;
    
    // Coût des péages
    return highwayDistance * MovingQuoteCalculator.TOLL_COST_PER_KM;
  }

  private enrichContextWithResources(context: QuoteContext): QuoteContext {
    const volume = context.getValue<number>('volume') ?? 0;
    const distance = context.getValue<number>('distance') ?? 0;
    const numberOfMovers = this.resourceCalculator.calculateRequiredMovers(volume);
    const numberOfBoxes = this.resourceCalculator.calculateEstimatedBoxes(volume);
    
    // Calculer et ajouter les frais de carburant et de péage au contexte
    const fuelCost = this.calculateFuelCost(distance);
    const tollCost = this.calculateTollCost(distance);
    
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
    // 1. Vérification du type de service
    if (context.getServiceType() !== ServiceType.MOVING) {
      throw new QuoteCalculationError('Invalid context type for moving quote');
    }

    // 2. Enrichir le contexte avec les ressources calculées
    const enrichedContext = this.enrichContextWithResources(context);
    
    // 3. Calculer le prix de base
    const basePrice = this.getBasePrice(enrichedContext);
    
    // 4. Appliquer les règles et récupérer les réductions et majorations
    const { finalPrice, discounts } = this.ruleEngine.execute(enrichedContext, basePrice);
    
    // 5. Retourner le devis final avec uniquement les réductions
    return new Quote(
      basePrice,
      finalPrice,
      discounts,
      enrichedContext
    );
  }
} 