import { RuleEngine } from '@/quotation/domain/RuleEngine';

describe('RuleEngine', () => {
  it('should apply rules correctly', () => {
    const rules = [
      {
        condition: (context: any) => context.value > 10,
        apply: (price: number) => price * 2,
        description: "Double price if value > 10"
      }
    ];

    const engine = new RuleEngine(rules);
    const result = engine.execute({ value: 15 }, 100);
    expect(result).toBe(200);
  });
}); 