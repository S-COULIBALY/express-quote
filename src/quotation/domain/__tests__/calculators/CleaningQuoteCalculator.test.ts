import { CleaningQuoteCalculator } from '../../calculators/CleaningQuoteCalculator';
import { QuoteContext } from '../../valueObjects/QuoteContext';
import { ServiceType } from '../../entities/Service';
import { Money } from '../../valueObjects/Money';
import { Rule } from '../../valueObjects/Rule';
import { CleaningFrequency } from '../../valueObjects/types/CleaningTypes';

describe('CleaningQuoteCalculator', () => {
  let calculator: CleaningQuoteCalculator;

  beforeEach(() => {
    calculator = new CleaningQuoteCalculator([]);
  });

  describe('calculate', () => {
    it('should calculate quote with base price and frequency discount', async () => {
      const context = new QuoteContext({
        serviceType: ServiceType.CLEANING,
        squareMeters: 100,
        numberOfRooms: 3,
        frequency: 'WEEKLY',
        hasBalcony: true,
        hasPets: true
      });

      const quote = await calculator.calculate(context);
      
      // Base price should be: (100m² * 2) + (3 rooms * 10) = 230
      // With balcony (+10%) and pets (+15%): 230 * 1.1 * 1.15 = 291.45
      expect(quote.getBasePrice().getAmount()).toBeCloseTo(291.45);
      
      // Weekly frequency should give 20% discount
      expect(quote.getDiscounts()).toHaveLength(1);
      expect(quote.getDiscounts()[0].getName()).toBe('frequency');
      expect(quote.getDiscounts()[0].getValue()).toBe(20);
      
      // Final price should be base price - 20%
      expect(quote.getTotalPrice().getAmount()).toBeCloseTo(291.45 * 0.8);
    });

    it('should calculate quote with large surface discount', async () => {
      const context = new QuoteContext({
        serviceType: ServiceType.CLEANING,
        squareMeters: 200,
        numberOfRooms: 5,
        frequency: 'ONCE'
      });

      const quote = await calculator.calculate(context);
      
      // Base price should be: (200m² * 2) + (5 rooms * 10) = 450
      expect(quote.getBasePrice().getAmount()).toBe(450);
      
      // Surface > 150m² should give 10% discount
      expect(quote.getDiscounts()).toHaveLength(1);
      expect(quote.getDiscounts()[0].getName()).toBe('large_surface');
      expect(quote.getDiscounts()[0].getValue()).toBe(10);
      
      // Final price should be base price - 10%
      expect(quote.getTotalPrice().getAmount()).toBe(450 * 0.9);
    });
  });
}); 