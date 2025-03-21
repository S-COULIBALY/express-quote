import { Money } from '../../valueObjects/Money';

describe('Money', () => {
  describe('constructor', () => {
    it('should create money with amount and default currency', () => {
      const money = new Money(100);
      expect(money.getAmount()).toBe(100);
      expect(money.getCurrency()).toBe('EUR');
    });

    it('should create money with amount and specified currency', () => {
      const money = new Money(100, 'USD');
      expect(money.getAmount()).toBe(100);
      expect(money.getCurrency()).toBe('USD');
    });

    it('should throw error for negative amount', () => {
      expect(() => {
        new Money(-100);
      }).toThrow('Amount must be a number');
    });
  });

  describe('arithmetic operations', () => {
    it('should add two money objects with same currency', () => {
      const money1 = new Money(100);
      const money2 = new Money(50);
      const result = money1.add(money2);
      expect(result.getAmount()).toBe(150);
      expect(result.getCurrency()).toBe('EUR');
    });

    it('should subtract two money objects with same currency', () => {
      const money1 = new Money(100);
      const money2 = new Money(50);
      const result = money1.subtract(money2);
      expect(result.getAmount()).toBe(50);
      expect(result.getCurrency()).toBe('EUR');
    });

    it('should multiply money by a factor', () => {
      const money = new Money(100);
      const result = money.multiply(1.5);
      expect(result.getAmount()).toBe(150);
      expect(result.getCurrency()).toBe('EUR');
    });

    it('should throw error when adding different currencies', () => {
      const money1 = new Money(100, 'EUR');
      const money2 = new Money(50, 'USD');
      expect(() => {
        money1.add(money2);
      }).toThrow('Cannot add money with different currencies');
    });

    it('should throw error when subtracting different currencies', () => {
      const money1 = new Money(100, 'EUR');
      const money2 = new Money(50, 'USD');
      expect(() => {
        money1.subtract(money2);
      }).toThrow('Cannot subtract money with different currencies');
    });
  });

  describe('comparison', () => {
    it('should compare money objects with same currency', () => {
      const money1 = new Money(100);
      const money2 = new Money(50);
      const money3 = new Money(100);

      expect(money1.equals(money2)).toBe(false);
      expect(money1.equals(money3)).toBe(true);
    });

    it('should throw error when comparing different currencies', () => {
      const money1 = new Money(100, 'EUR');
      const money2 = new Money(100, 'USD');
      expect(() => {
        money1.equals(money2);
      }).toThrow('Cannot compare money with different currencies');
    });
  });

  describe('formatting', () => {
    it('should format money as string', () => {
      const money = new Money(1234.56);
      expect(money.toString()).toBe('1234.56 EUR');
    });

    it('should format money with different currency', () => {
      const money = new Money(1234.56, 'USD');
      expect(money.toString()).toBe('1234.56 USD');
    });
  });

  describe('static methods', () => {
    it('should create money from cents', () => {
      const money = Money.fromCents(12345);
      expect(money.getAmount()).toBe(123.45);
      expect(money.getCurrency()).toBe('EUR');
    });

    it('should create money from cents with specified currency', () => {
      const money = Money.fromCents(12345, 'USD');
      expect(money.getAmount()).toBe(123.45);
      expect(money.getCurrency()).toBe('USD');
    });
  });
}); 