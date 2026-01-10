import { PackingCostModule } from '../PackingCostModule';
import { QuoteContext } from '../../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';
import { MODULES_CONFIG } from '../../../config/modules.config';

describe('PackingCostModule', () => {
  const module = new PackingCostModule();
  const config = MODULES_CONFIG.crossSelling;

  it('devrait avoir les bonnes propriétés', () => {
    expect(module.id).toBe('packing-cost');
    expect(module.description).toBe('Calcule le coût du service d\'emballage si accepté');
    expect(module.priority).toBe(85);
    expect(module.dependencies).toEqual(['packing-requirement']);
  });

  it('devrait être applicable si emballage recommandé ET accepté', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      packing: true, // Accepté
      computed: {
        ...createEmptyComputedContext(),
        requirements: [
          {
            type: 'PACKING_RECOMMENDED',
            severity: 'MEDIUM',
            reason: 'Volume élevé',
            moduleId: 'packing-requirement',
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
      packing: false,
      computed: {
        ...createEmptyComputedContext(),
        requirements: [
          {
            type: 'PACKING_RECOMMENDED',
            severity: 'MEDIUM',
            reason: 'Volume élevé',
            moduleId: 'packing-requirement',
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
      packing: true,
      computed: createEmptyComputedContext(),
    };

    expect(module.isApplicable(ctx)).toBe(false);
  });

  it('devrait ajouter le coût d\'emballage', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      packing: true,
      estimatedVolume: 30,
      computed: {
        ...createEmptyComputedContext(),
        adjustedVolume: 30,
        requirements: [
          {
            type: 'PACKING_RECOMMENDED',
            severity: 'MEDIUM',
            reason: 'Volume élevé',
            moduleId: 'packing-requirement',
          }
        ],
      },
    };

    const result = module.apply(ctx);

    expect(result.computed?.costs).toHaveLength(1);
    const cost = result.computed?.costs.find(c => c.moduleId === 'packing-cost');
    expect(cost).toBeDefined();
    const expectedCost = 30 * config.PACKING_COST_PER_M3; // 30 m³ * 5 €/m³ = 150€
    expect(cost?.amount).toBe(expectedCost);
    expect(cost?.category).toBe('ADMINISTRATIVE');
    expect(cost?.label).toBe('Service d\'emballage professionnel');
    expect(cost?.metadata).toMatchObject({
      volume: 30,
      volumeUsed: 30,
      costPerM3: config.PACKING_COST_PER_M3,
    });

    expect(result.computed?.activatedModules).toContain('packing-cost');
    expect(result.computed?.metadata?.packingAccepted).toBe(true);
    expect(result.computed?.metadata?.packingCost).toBe(expectedCost);
  });
});

