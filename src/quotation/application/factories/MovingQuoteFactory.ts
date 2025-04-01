import { ServiceType } from '../../domain/enums/ServiceType';
import { QuoteContext } from '../../domain/valueObjects/QuoteContext';

/**
 * Interface pour les calculateurs de devis
 */
export interface IQuoteCalculator {
  /**
   * Calcule le prix de base du devis
   */
  calculateBasePrice(context: QuoteContext): number;
  
  /**
   * Calcule le prix des options
   */
  calculateOptionsPrice(context: QuoteContext): number;
}

/**
 * Calculateur pour les devis de déménagement
 */
export class MovingQuoteCalculator implements IQuoteCalculator {
  private readonly VOLUME_PRICE_PER_M3 = 10; // 10€ par m³
  private readonly DISTANCE_PRICE_PER_KM = 2; // 2€ par km
  private readonly OPTION_PRICES = {
    packaging: 150,
    furniture: 100,
    fragile: 80,
    storage: 200,
    disassembly: 120,
    unpacking: 100,
    supplies: 50,
    fragileItems: 80
  };

  constructor(private readonly rules: any[] = []) {}

  calculateBasePrice(context: QuoteContext): number {
    // Récupérer le volume et la distance
    const volume = context.getVolume() || 0;
    const distance = context.getDistance() || 0;
    
    // Calcul du prix selon le volume et la distance
    const volumePrice = volume * this.VOLUME_PRICE_PER_M3;
    const distancePrice = distance * this.DISTANCE_PRICE_PER_KM;
    
    // Appliquer des règles supplémentaires si nécessaire
    let basePrice = volumePrice + distancePrice;
    
    // Facteurs d'ajustement
    const pickupFloor = context.getPickupAddress().getFloor() || 0;
    const deliveryFloor = context.getDeliveryAddress().getFloor() || 0;
    const hasPickupElevator = context.getPickupAddress().hasElevatorAccess();
    const hasDeliveryElevator = context.getDeliveryAddress().hasElevatorAccess();
    
    // Ajustement pour les étages sans ascenseur
    if (pickupFloor > 0 && !hasPickupElevator) {
      basePrice += pickupFloor * 30; // 30€ par étage sans ascenseur
    }
    
    if (deliveryFloor > 0 && !hasDeliveryElevator) {
      basePrice += deliveryFloor * 30; // 30€ par étage sans ascenseur
    }
    
    // Distance de portage
    const pickupCarryDistance = context.getPickupAddress().getCarryDistance() || 0;
    const deliveryCarryDistance = context.getDeliveryAddress().getCarryDistance() || 0;
    
    if (pickupCarryDistance > 10) {
      // 1€ par mètre au-delà de 10m
      basePrice += (pickupCarryDistance - 10) * 1;
    }
    
    if (deliveryCarryDistance > 10) {
      // 1€ par mètre au-delà de 10m
      basePrice += (deliveryCarryDistance - 10) * 1;
    }
    
    return basePrice;
  }

  calculateOptionsPrice(context: QuoteContext): number {
    let optionsPrice = 0;
    const options = context.getOptions();
    
    // Calculer le prix des options sélectionnées
    for (const [optionName, isSelected] of Object.entries(options)) {
      if (isSelected && this.OPTION_PRICES[optionName as keyof typeof this.OPTION_PRICES]) {
        optionsPrice += this.OPTION_PRICES[optionName as keyof typeof this.OPTION_PRICES];
      }
    }
    
    return optionsPrice;
  }
}

/**
 * Factory pour créer les calculateurs de devis
 */
export class MovingQuoteFactory {
  private readonly calculators: Map<ServiceType, IQuoteCalculator>;

  constructor(rules: any[] = []) {
    this.calculators = new Map();
    this.calculators.set(ServiceType.MOVING, new MovingQuoteCalculator(rules));
  }

  /**
   * Crée un calculateur pour le type de service spécifié
   */
  createCalculator(serviceType: ServiceType): IQuoteCalculator {
    const calculator = this.calculators.get(serviceType);
    
    if (!calculator) {
      throw new Error(`Aucun calculateur trouvé pour le type de service: ${serviceType}`);
    }
    
    return calculator;
  }
} 