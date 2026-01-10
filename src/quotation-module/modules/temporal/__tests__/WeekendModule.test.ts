import { WeekendModule } from '../WeekendModule';
import { QuoteContext } from '../../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';
import { MODULES_CONFIG } from '../../../config/modules.config';

describe('WeekendModule', () => {
  const module = new WeekendModule();
  const config = MODULES_CONFIG.temporal;

  it('devrait avoir les bonnes propriétés', () => {
    expect(module.id).toBe('weekend');
    expect(module.description).toBe('Surcoût week-end (samedi ou dimanche)');
    expect(module.priority).toBe(81);
  });

  it('devrait être applicable si samedi', () => {
    // 2026-03-14 est un samedi
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      movingDate: '2026-03-14T10:00:00Z',
      computed: createEmptyComputedContext(),
    };

    expect(module.isApplicable(ctx)).toBe(true);
  });

  it('devrait être applicable si dimanche', () => {
    // 2026-03-15 est un dimanche
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      movingDate: '2026-03-15T10:00:00Z',
      computed: createEmptyComputedContext(),
    };

    expect(module.isApplicable(ctx)).toBe(true);
  });

  it('ne devrait pas être applicable si jour de semaine', () => {
    // 2026-03-17 est un mardi (vérifié)
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      movingDate: '2026-03-17T10:00:00Z',
      computed: createEmptyComputedContext(),
    };

    expect(module.isApplicable(ctx)).toBe(false);
  });

  it('devrait appliquer un surcoût de 5% si samedi', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      movingDate: '2026-03-14T10:00:00Z', // samedi
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
    const surcharge = result.computed?.costs.find(c => c.moduleId === 'weekend');
    expect(surcharge).toBeDefined();
    const expectedSurcharge = 1000 * config.WEEKEND_SURCHARGE_PERCENTAGE; // 5% de 1000 = 50€
    expect(surcharge?.amount).toBe(expectedSurcharge);
    expect(surcharge?.category).toBe('TEMPORAL');
    expect(surcharge?.label).toContain('samedi');
    expect(surcharge?.metadata).toMatchObject({
      dayOfWeek: 6,
      dayName: 'samedi',
      surchargePercentage: parseFloat((config.WEEKEND_SURCHARGE_PERCENTAGE * 100).toFixed(1)),
      basePrice: 1000,
      riskContribution: config.WEEKEND_RISK_CONTRIBUTION,
    });
    expect(result.computed?.activatedModules).toContain('weekend');
  });

  it('devrait appliquer un surcoût de 5% si dimanche', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      movingDate: '2026-03-15T10:00:00Z', // dimanche
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

    const surcharge = result.computed?.costs.find(c => c.moduleId === 'weekend');
    expect(surcharge?.label).toContain('dimanche');
    const expectedSurcharge = 1000 * config.WEEKEND_SURCHARGE_PERCENTAGE; // 5% de 1000 = 50€
    expect(surcharge?.amount).toBe(expectedSurcharge);
    expect(surcharge?.metadata).toMatchObject({
      dayOfWeek: 0,
      dayName: 'dimanche',
    });
  });

  it('ne devrait pas appliquer de surcoût si jour de semaine', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      movingDate: '2026-03-17T10:00:00Z', // mardi
      computed: createEmptyComputedContext(),
    };

    const result = module.apply(ctx);
    expect(result.computed?.costs).toHaveLength(0);
  });

  it('devrait contribuer au risque', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      movingDate: '2026-03-14T10:00:00Z', // samedi
      computed: createEmptyComputedContext(),
    };

    const result = module.apply(ctx);
    const riskContribution = result.computed?.riskContributions.find(
      r => r.moduleId === 'weekend'
    );
    expect(riskContribution).toBeDefined();
    expect(riskContribution?.amount).toBe(config.WEEKEND_RISK_CONTRIBUTION);
  });
});

