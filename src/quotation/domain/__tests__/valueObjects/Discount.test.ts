import { Discount, DiscountType } from '../../valueObjects/Discount';
import { Money } from '../../valueObjects/Money';

describe('Discount', () => {
  describe('constructor', () => {
    it('should create a valid fixed discount', () => {
      const discount = new Discount('test', DiscountType.FIXED, 50);
      expect(discount.getName()).toBe('test');
      expect(discount.getType()).toBe(DiscountType.FIXED);
      expect(discount.getValue()).toBe(50);
    });

    it('should create a valid percentage discount', () => {
      const discount = new Discount('test', DiscountType.PERCENTAGE, 20);
      expect(discount.getName()).toBe('test');
      expect(discount.getType()).toBe(DiscountType.PERCENTAGE);
      expect(discount.getValue()).toBe(20);
    });

    it('should create a valid promotional discount with expiration', () => {
      const expirationDate = new Date(Date.now() + 86400000); // tomorrow
      const discount = new Discount('test', DiscountType.PROMOTIONAL, 50, 'PROMO123', expirationDate);
      expect(discount.getName()).toBe('test');
      expect(discount.getType()).toBe(DiscountType.PROMOTIONAL);
      expect(discount.getValue()).toBe(50);
      expect(discount.getCode()).toBe('PROMO123');
      expect(discount.getExpirationDate()).toEqual(expirationDate);
    });

    it('should throw error for invalid name', () => {
      expect(() => {
        new Discount('', DiscountType.FIXED, 50);
      }).toThrow('Discount name is required');
    });

    it('should throw error for invalid type', () => {
      expect(() => {
        new Discount('test', 'INVALID' as DiscountType, 50);
      }).toThrow('Invalid discount type');
    });

    it('should throw error for invalid value', () => {
      expect(() => {
        new Discount('test', DiscountType.FIXED, -50);
      }).toThrow('Discount value must be a positive number');
    });

    it('should throw error for percentage over 100', () => {
      expect(() => {
        new Discount('test', DiscountType.PERCENTAGE, 150);
      }).toThrow('Percentage discount cannot exceed 100%');
    });

    it('should throw error for expired date', () => {
      const pastDate = new Date(Date.now() - 86400000); // yesterday
      expect(() => {
        new Discount('test', DiscountType.PROMOTIONAL, 50, 'PROMO123', pastDate);
      }).toThrow('Expiration date cannot be in the past');
    });
  });

  describe('apply', () => {
    it('should apply fixed discount', () => {
      const discount = new Discount('test', DiscountType.FIXED, 50);
      const price = new Money(200);
      const result = discount.apply(price);
      expect(result.getAmount()).toBe(150);
    });

    it('should apply percentage discount', () => {
      const discount = new Discount('test', DiscountType.PERCENTAGE, 20);
      const price = new Money(200);
      const result = discount.apply(price);
      expect(result.getAmount()).toBe(160);
    });

    it('should not apply expired discount', () => {
      const expirationDate = new Date(Date.now() - 86400000); // yesterday
      const discount = new Discount('test', DiscountType.FIXED, 50, 'PROMO123', expirationDate);
      const price = new Money(200);
      const result = discount.apply(price);
      expect(result.getAmount()).toBe(200);
    });
  });

  describe('static methods', () => {
    it('should combine multiple discounts', () => {
      const discounts = [
        new Discount('test1', DiscountType.FIXED, 50),
        new Discount('test2', DiscountType.FIXED, 30)
      ];
      const result = Discount.combine(discounts);
      expect(result.getAmount()).toBe(80);
    });

    it('should return zero for empty discount list', () => {
      const result = Discount.combine([]);
      expect(result.getAmount()).toBe(0);
    });

    it('should ignore expired discounts when combining', () => {
      const pastDate = new Date(Date.now() - 86400000); // yesterday
      const discounts = [
        new Discount('test1', DiscountType.FIXED, 50),
        new Discount('test2', DiscountType.FIXED, 30, 'PROMO123', pastDate)
      ];
      const result = Discount.combine(discounts);
      expect(result.getAmount()).toBe(50);
    });
  });

  describe('expiration', () => {
    it('should check if discount is expired', () => {
      const pastDate = new Date(Date.now() - 86400000); // yesterday
      const futureDate = new Date(Date.now() + 86400000); // tomorrow
      
      const expiredDiscount = new Discount('test', DiscountType.PROMOTIONAL, 50, 'PROMO123', pastDate);
      const validDiscount = new Discount('test', DiscountType.PROMOTIONAL, 50, 'PROMO123', futureDate);
      const noExpirationDiscount = new Discount('test', DiscountType.FIXED, 50);

      expect(expiredDiscount.isExpired()).toBe(true);
      expect(validDiscount.isExpired()).toBe(false);
      expect(noExpirationDiscount.isExpired()).toBe(false);
    });
  });
}); 