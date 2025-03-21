import { Rule, RuleType } from '../../valueObjects/Rule';
import { QuoteContext } from '../../valueObjects/QuoteContext';
import { ServiceType } from '../../entities/Service';
import { Money } from '../../valueObjects/Money';

describe('Rule', () => {
  describe('constructor', () => {
    it('should create a valid fixed amount rule', () => {
      const rule = new Rule(
        'fixed_discount',
        RuleType.FIXED_AMOUNT,
        50
      );

      expect(rule.getName()).toBe('fixed_discount');
      expect(rule.getType()).toBe(RuleType.FIXED_AMOUNT);
      expect(rule.getValue()).toBe(50);
    });

    it('should create a valid percentage rule', () => {
      const rule = new Rule(
        'percentage_discount',
        RuleType.PERCENTAGE,
        20
      );

      expect(rule.getName()).toBe('percentage_discount');
      expect(rule.getType()).toBe(RuleType.PERCENTAGE);
      expect(rule.getValue()).toBe(20);
    });

    it('should create a valid conditional rule', () => {
      const rule = new Rule(
        'conditional_discount',
        RuleType.CONDITIONAL,
        50,
        (context: any) => context.squareMeters > 100
      );

      expect(rule.getName()).toBe('conditional_discount');
      expect(rule.getType()).toBe(RuleType.CONDITIONAL);
      expect(rule.getValue()).toBe(50);
    });

    it('should throw error for invalid name', () => {
      expect(() => {
        new Rule('', RuleType.FIXED_AMOUNT, 50);
      }).toThrow('Rule name is required');
    });

    it('should throw error for invalid type', () => {
      expect(() => {
        new Rule('test_rule', 'INVALID' as RuleType, 50);
      }).toThrow('Invalid rule type');
    });

    it('should throw error for invalid percentage value', () => {
      expect(() => {
        new Rule('test_rule', RuleType.PERCENTAGE, 150);
      }).toThrow('Percentage value must be between 0 and 100');

      expect(() => {
        new Rule('test_rule', RuleType.PERCENTAGE, -10);
      }).toThrow('Percentage value must be between 0 and 100');
    });
  });

  describe('apply', () => {
    it('should apply fixed amount rule', () => {
      const rule = new Rule('fixed_discount', RuleType.FIXED_AMOUNT, 50);
      const basePrice = new Money(200);
      const result = rule.apply(basePrice);

      expect(result.getAmount()).toBe(50);
    });

    it('should apply percentage rule', () => {
      const rule = new Rule('percentage_increase', RuleType.PERCENTAGE, 20);
      const basePrice = new Money(100);
      const result = rule.apply(basePrice);

      expect(result.getAmount()).toBe(120); // 100 + 20%
    });

    it('should apply conditional rule when condition is met', () => {
      const rule = new Rule(
        'large_surface_surcharge',
        RuleType.CONDITIONAL,
        50,
        (context: any) => context.squareMeters > 100
      );

      const basePrice = new Money(200);
      const context = { squareMeters: 150 };
      const result = rule.apply(basePrice, context);

      expect(result.getAmount()).toBe(250); // 200 + 50
    });

    it('should not apply conditional rule when condition is not met', () => {
      const rule = new Rule(
        'large_surface_surcharge',
        RuleType.CONDITIONAL,
        50,
        (context: any) => context.squareMeters > 100
      );

      const basePrice = new Money(200);
      const context = { squareMeters: 50 };
      const result = rule.apply(basePrice, context);

      expect(result.getAmount()).toBe(200); // No change
    });
  });

  describe('comparison', () => {
    it('should compare rules by priority', () => {
      const rule1 = new Rule(
        'rule1',
        (context: QuoteContext) => true,
        (price: Money) => price,
        1
      );

      const rule2 = new Rule(
        'rule2',
        (context: QuoteContext) => true,
        (price: Money) => price,
        2
      );

      const rule3 = new Rule(
        'rule3',
        (context: QuoteContext) => true,
        (price: Money) => price,
        1
      );

      expect(rule1.compareTo(rule2)).toBe(-1);
      expect(rule2.compareTo(rule1)).toBe(1);
      expect(rule1.compareTo(rule3)).toBe(0);
    });
  });
}); 