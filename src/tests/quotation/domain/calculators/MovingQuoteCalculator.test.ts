import { QuoteCalculator } from '../../../../quotation/domain/calculators/MovingQuoteCalculator';
import { QuoteContext } from '../../../../quotation/domain/valueObjects/QuoteContext';
import { ServiceType } from '../../../../quotation/domain/enums/ServiceType';
import { ConfigurationService } from '../../../../quotation/domain/services/ConfigurationService';
import { PricingConfigKey } from '../../../../quotation/domain/configuration/ConfigurationKey';
import { Money } from '../../../../quotation/domain/valueObjects/Money';

// Mock de ConfigurationService pour les tests
class MockConfigurationService extends ConfigurationService {
  constructor(private mockValues: Record<string, any> = {}) {
    super([]);
  }

  // Override la méthode pour retourner les valeurs mockées
  getNumberValue(key: PricingConfigKey, defaultValue: number): number {
    if (key in this.mockValues) {
      return this.mockValues[key];
    }
    return defaultValue;
  }
}

describe('QuoteCalculator', () => {
  // Test pour le calcul d'un devis de déménagement
  describe('Moving Quote Calculation', () => {
    it('calculates base price correctly for moving service', async () => {
      // Arrange
      const mockConfigService = new MockConfigurationService({
        [PricingConfigKey.MOVING_BASE_PRICE_PER_M3]: 10,
        [PricingConfigKey.MOVING_DISTANCE_PRICE_PER_KM]: 2,
        [PricingConfigKey.FUEL_CONSUMPTION_PER_100KM]: 25,
        [PricingConfigKey.FUEL_PRICE_PER_LITER]: 1.8,
        [PricingConfigKey.TOLL_COST_PER_KM]: 0.15,
        [PricingConfigKey.HIGHWAY_RATIO]: 0.7
      });
      
      const calculator = new QuoteCalculator(mockConfigService);
      const context = new QuoteContext(ServiceType.MOVING);
      
      // Set values for moving quote
      context.setValue('volume', 20);     // 20 m³
      context.setValue('distance', 100);  // 100 km
      context.setValue('workers', 2);     // 2 workers
      
      // Act
      const quote = await calculator.calculate(context);
      
      // Assert
      // Attendu : 20m³ * 10€/m³ + 100km * 2€/km + coûts carburant + péages
      // Carburant: (100km * 25L/100km * 1.8€/L) = 45€
      // Péages: (100km * 0.7 * 0.15€/km) = 10.5€
      // Total attendu: 200 + 200 + 45 + 10.5 = 455.5€, arrondi à 456€
      const expectedBasePrice = 456;
      expect(quote.getBasePrice().getAmount()).toBe(expectedBasePrice);
    });
    
    it('throws error for invalid context', async () => {
      // Arrange
      const mockConfigService = new MockConfigurationService();
      const calculator = new QuoteCalculator(mockConfigService);
      const context = new QuoteContext(ServiceType.MOVING);
      
      // Act & Assert
      await expect(calculator.calculate(context)).rejects.toThrow();
    });
  });
  
  // Test pour le calcul d'un devis de pack
  describe('Pack Quote Calculation', () => {
    it('calculates base price correctly for pack service', async () => {
      // Arrange
      const mockConfigService = new MockConfigurationService({
        [PricingConfigKey.PACK_WORKER_PRICE]: 120,
        [PricingConfigKey.PACK_INCLUDED_DISTANCE]: 20,
        [PricingConfigKey.PACK_EXTRA_KM_PRICE]: 1.5,
        [PricingConfigKey.PACK_WORKER_DISCOUNT_RATE_1_DAY]: 0.05,
        [PricingConfigKey.PACK_WORKER_DISCOUNT_RATE_MULTI_DAYS]: 0.10,
        [PricingConfigKey.PACK_EXTRA_DAY_DISCOUNT_RATE]: 0.8
      });
      
      const calculator = new QuoteCalculator(mockConfigService);
      const context = new QuoteContext(ServiceType.PACK);
      
      // Set values for pack quote
      context.setValue('defaultPrice', 500);    // Prix unitaire: 500€
      context.setValue('duration', 1);       // 1 day
      context.setValue('workers', 3);        // 3 workers
      context.setValue('baseWorkers', 2);    // Base workers: 2
      context.setValue('baseDuration', 1);   // Base duration: 1 day
      context.setValue('distance', 50);      // 50 km
      
      // Act
      const quote = await calculator.calculate(context);
      
      // Assert
      // defaultPrice + extra worker cost + extra distance cost
      // 500 + (1 worker * 120€ * 0.95) + (30km * 1.5€)
      const expectedBasePrice = 500 + (1 * 120 * (1 - 0.05)) + (30 * 1.5);
      // 500 + 114 + 45 = 659€
      expect(quote.getBasePrice().getAmount()).toBe(659);
    });
  });
  
  // Test pour le calcul d'un devis de service
  describe('Service Quote Calculation', () => {
    it('calculates base price correctly for service', async () => {
      // Arrange
      const mockConfigService = new MockConfigurationService({
        [PricingConfigKey.SERVICE_WORKER_PRICE_PER_HOUR]: 35,
        [PricingConfigKey.SERVICE_WORKER_DISCOUNT_RATE_SHORT]: 0.1,
        [PricingConfigKey.SERVICE_WORKER_DISCOUNT_RATE_LONG]: 0.15,
        [PricingConfigKey.SERVICE_EXTRA_HOUR_RATE]: 0.9
      });
      
      const calculator = new QuoteCalculator(mockConfigService);
      const context = new QuoteContext(ServiceType.SERVICE);
      
      // Set values for service quote
      context.setValue('defaultPrice', 200);       // Prix unitaire: 200€
      context.setValue('duration', 4);          // 4 hours
      context.setValue('workers', 2);           // 2 workers
      context.setValue('defaultDuration', 2);   // Default duration: 2h
      context.setValue('defaultWorkers', 1);    // Default workers: 1
      
      // Act
      const quote = await calculator.calculate(context);
      
      // Assert
      // defaultPrice + extra worker cost + extra hours cost
      // Avec les nouveaux calculs:
      // - 1 travailleur supplémentaire: 1 * 35€ * 4h * (1-0.15) = 119€
      // - Heures supplémentaires: (200€/2h) * 2h * 0.9 = 180€
      const extraWorkerCost = 1 * 35 * 4 * (1 - 0.15);
      const extraHoursCost = (200 / 2) * 2 * 0.9;
      const expectedBasePrice = 200 + extraWorkerCost + extraHoursCost;
      // 200 + 119 + 180 = 499€
      expect(quote.getBasePrice().getAmount()).toBe(499);
    });
  });
}); 