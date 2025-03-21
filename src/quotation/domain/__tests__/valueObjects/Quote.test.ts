import { Quote } from '../../valueObjects/Quote';
import { Money } from '../../valueObjects/Money';
import { Discount, DiscountType } from '../../valueObjects/Discount';
import { QuoteContext } from '../../valueObjects/QuoteContext';
import { ServiceType } from '../../entities/Service';

describe('Quote', () => {
  let basePrice: Money;
  let totalPrice: Money;
  let discounts: Discount[];
  let context: QuoteContext;

  beforeEach(() => {
    basePrice = new Money(200);
    totalPrice = new Money(160);
    discounts = [
      new Discount('test', DiscountType.PERCENTAGE, 20)
    ];
    context = new QuoteContext({
      serviceType: ServiceType.CLEANING,
      squareMeters: 100,
      numberOfRooms: 3,
      frequency: 'WEEKLY'
    });
  });

  describe('constructor', () => {
    it('should create a valid quote', () => {
      const quote = new Quote(basePrice, totalPrice, discounts, context);
      
      expect(quote.getBasePrice()).toBe(basePrice);
      expect(quote.getTotalPrice()).toBe(totalPrice);
      expect(quote.getDiscounts()).toEqual(discounts);
      expect(quote.getContext()).toBe(context);
      expect(quote.getCalculationDate()).toBeInstanceOf(Date);
    });
  });

  describe('discount calculations', () => {
    it('should calculate total discount', () => {
      const quote = new Quote(basePrice, totalPrice, discounts, context);
      const totalDiscount = quote.getTotalDiscount();
      
      expect(totalDiscount.getAmount()).toBe(40); // 20% of 200
    });

    it('should check if quote has discounts', () => {
      const quoteWithDiscounts = new Quote(basePrice, totalPrice, discounts, context);
      const quoteWithoutDiscounts = new Quote(basePrice, basePrice, [], context);
      
      expect(quoteWithDiscounts.hasDiscounts()).toBe(true);
      expect(quoteWithoutDiscounts.hasDiscounts()).toBe(false);
    });
  });

  describe('serialization', () => {
    it('should serialize quote to JSON', () => {
      const quote = new Quote(basePrice, totalPrice, discounts, context);
      const json = quote.toJSON();
      
      expect(json).toEqual({
        basePrice: '200.00 EUR',
        totalPrice: '160.00 EUR',
        discounts: [{
          type: DiscountType.PERCENTAGE,
          amount: '40.00 EUR',
          description: undefined
        }],
        calculatedAt: expect.any(String)
      });
      
      // Verify ISO date format
      expect(Date.parse(json.calculatedAt)).not.toBeNaN();
    });
  });
}); 