import { CleaningEndCostModule } from '../CleaningEndCostModule';
import { QuoteContext } from '../../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';
import { MODULES_CONFIG } from '../../../config/modules.config';

describe('CleaningEndCostModule', () => {
  const module = new CleaningEndCostModule();
  const config = MODULES_CONFIG.crossSelling;

  it('devrait avoir les bonnes propriétés', () => {
    expect(module.id).toBe('cleaning-end-cost');
    expect(module.description).toBe('Calcule le coût du nettoyage de fin de chantier si accepté');
    expect(module.priority).toBe(86);
    expect(module.dependencies).toEqual(['cleaning-end-requirement']);
  });

  it('devrait être applicable si nettoyage recommandé ET accepté', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      cleaningEnd: true, // Accepté
      computed: {
        ...createEmptyComputedContext(),
        requirements: [
          {
            type: 'CLEANING_RECOMMENDED',
            severity: 'LOW',
            reason: 'Surface importante',
            moduleId: 'cleaning-end-requirement',
          }
        ],
      },
    };

    expect(module.isApplicable(ctx)).toBe(true);
  });

  it('ne devrait pas être applicable si non accepté', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      cleaningEnd: false,
      computed: {
        ...createEmptyComputedContext(),
        requirements: [
          {
            type: 'CLEANING_RECOMMENDED',
            severity: 'LOW',
            reason: 'Surface importante',
            moduleId: 'cleaning-end-requirement',
          }
        ],
      },
    };

    expect(module.isApplicable(ctx)).toBe(false);
  });

  it('ne devrait pas être applicable si pas de recommandation', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      cleaningEnd: true,
      computed: createEmptyComputedContext(),
    };

    expect(module.isApplicable(ctx)).toBe(false);
  });

  it('devrait ajouter le coût de nettoyage', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      cleaningEnd: true,
      surface: 80,
      computed: {
        ...createEmptyComputedContext(),
        requirements: [
          {
            type: 'CLEANING_RECOMMENDED',
            severity: 'LOW',
            reason: 'Surface importante',
            moduleId: 'cleaning-end-requirement',
          }
        ],
      },
    };

    const result = module.apply(ctx);

    expect(result.computed?.costs).toHaveLength(1);
    const cost = result.computed?.costs.find(c => c.moduleId === 'cleaning-end-cost');
    expect(cost).toBeDefined();
    const expectedCost = 80 * config.CLEANING_COST_PER_M2; // 80 m² * 8 €/m² = 640€
    expect(cost?.amount).toBe(expectedCost);
    expect(cost?.category).toBe('ADMINISTRATIVE');
    expect(cost?.label).toBe('Nettoyage de fin de chantier');
    expect(cost?.metadata).toMatchObject({
      surface: 80,
      surfaceUsed: 80,
      costPerM2: config.CLEANING_COST_PER_M2,
    });

    expect(result.computed?.activatedModules).toContain('cleaning-end-cost');
    expect(result.computed?.metadata?.cleaningEndAccepted).toBe(true);
    expect(result.computed?.metadata?.cleaningEndCost).toBe(expectedCost);
  });
});

