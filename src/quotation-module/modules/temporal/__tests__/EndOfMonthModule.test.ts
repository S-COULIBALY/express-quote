import { EndOfMonthModule } from '../EndOfMonthModule';
import { QuoteContext } from '../../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';
import { MODULES_CONFIG } from '../../../config/modules.config';

describe('EndOfMonthModule', () => {
  const module = new EndOfMonthModule();
  const config = MODULES_CONFIG.temporal;

  it('devrait avoir les bonnes propriétés', () => {
    expect(module.id).toBe('end-of-month');
    expect(module.description).toBe('Surcoût fin de mois (jour >= 25)');
    expect(module.priority).toBe(80);
  });

  it('devrait être applicable si jour >= 25', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      movingDate: '2026-03-25T10:00:00Z', // 25 mars
      computed: createEmptyComputedContext(),
    };

    expect(module.isApplicable(ctx)).toBe(true);
  });

  it('ne devrait pas être applicable si jour < 25', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      movingDate: '2026-03-15T10:00:00Z', // 15 mars
      computed: createEmptyComputedContext(),
    };

    expect(module.isApplicable(ctx)).toBe(false);
  });

  it('devrait appliquer un surcoût de 5% si jour >= 25', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      movingDate: '2026-03-28T10:00:00Z', // 28 mars
      computed: {
        ...createEmptyComputedContext(),
        costs: [
          {
            moduleId: 'test',
            category: 'TRANSPORT',
            label: 'Test',
            amount: 1000,
          }
        ],
      },
    };

    const result = module.apply(ctx);

    expect(result.computed?.costs).toHaveLength(2);
    const surcharge = result.computed?.costs.find(c => c.moduleId === 'end-of-month');
    expect(surcharge).toBeDefined();
    const expectedSurcharge = 1000 * config.END_OF_MONTH_SURCHARGE_PERCENTAGE; // 5% de 1000 = 50€
    expect(surcharge?.amount).toBe(expectedSurcharge);
    expect(surcharge?.category).toBe('TEMPORAL');
    expect(surcharge?.metadata).toMatchObject({
      dayOfMonth: 28,
      month: 'mars',
      surchargePercentage: parseFloat((config.END_OF_MONTH_SURCHARGE_PERCENTAGE * 100).toFixed(1)),
      basePrice: 1000,
      riskContribution: config.END_OF_MONTH_RISK_CONTRIBUTION,
    });
    expect(result.computed?.activatedModules).toContain('end-of-month');
  });

  it('ne devrait pas appliquer de surcoût si jour < 25', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      movingDate: '2026-03-20T10:00:00Z', // 20 mars
      computed: createEmptyComputedContext(),
    };

    const result = module.apply(ctx);
    expect(result.computed?.costs).toHaveLength(0);
  });

  it('devrait contribuer au risque', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      movingDate: '2026-03-30T10:00:00Z', // 30 mars
      computed: createEmptyComputedContext(),
    };

    const result = module.apply(ctx);
    const riskContribution = result.computed?.riskContributions.find(
      r => r.moduleId === 'end-of-month'
    );
    expect(riskContribution).toBeDefined();
    expect(riskContribution?.amount).toBe(config.END_OF_MONTH_RISK_CONTRIBUTION);
  });
});

