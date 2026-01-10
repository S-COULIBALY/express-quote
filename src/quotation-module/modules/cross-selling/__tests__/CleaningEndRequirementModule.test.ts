import { CleaningEndRequirementModule } from '../CleaningEndRequirementModule';
import { QuoteContext } from '../../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';
import { MODULES_CONFIG } from '../../../config/modules.config';

describe('CleaningEndRequirementModule', () => {
  const module = new CleaningEndRequirementModule();
  const config = MODULES_CONFIG.crossSelling;

  it('devrait avoir les bonnes propriétés', () => {
    expect(module.id).toBe('cleaning-end-requirement');
    expect(module.description).toBe('Recommande le nettoyage de fin de chantier');
    expect(module.priority).toBe(83);
  });

  it('devrait être applicable si surface > 0 (pas de conditions restrictives)', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      surface: 50, // N'importe quelle surface > 0
      computed: createEmptyComputedContext(),
    };

    expect(module.isApplicable(ctx)).toBe(true);
  });

  it('devrait être applicable même avec stockage temporaire', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      surface: 80,
      temporaryStorage: true, // Même avec stockage temporaire
      computed: createEmptyComputedContext(),
    };

    expect(module.isApplicable(ctx)).toBe(true);
  });

  it('ne devrait pas être applicable si surface = 0', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      surface: 0,
      computed: createEmptyComputedContext(),
    };

    expect(module.isApplicable(ctx)).toBe(false);
  });

  it('devrait ajouter un requirement et une proposition cross-selling', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      surface: 80,
      computed: createEmptyComputedContext(),
    };

    const result = module.apply(ctx);

    expect(result.computed?.requirements).toHaveLength(1);
    const requirement = result.computed?.requirements.find(r => r.type === 'CLEANING_RECOMMENDED');
    expect(requirement).toBeDefined();
    expect(requirement?.severity).toBe('LOW');
    expect(requirement?.moduleId).toBe('cleaning-end-requirement');

    expect(result.computed?.crossSellProposals).toHaveLength(1);
    const proposal = result.computed?.crossSellProposals.find(p => p.id === 'CLEANING_END_SERVICE');
    expect(proposal).toBeDefined();
    expect(proposal?.optional).toBe(true);
    expect(proposal?.basedOnRequirement).toBe('CLEANING_RECOMMENDED');
    const expectedCost = 80 * config.CLEANING_COST_PER_M2; // 80 m² * 8 €/m² = 640€
    expect(proposal?.priceImpact).toBe(expectedCost);
    expect(proposal?.metadata).toMatchObject({
      surface: 80,
      costPerM2: config.CLEANING_COST_PER_M2,
    });

    expect(result.computed?.activatedModules).toContain('cleaning-end-requirement');
  });

  it('devrait fonctionner pour n\'importe quelle surface > 0', () => {
    const testCases = [
      { surface: 30, expectedCost: 30 * config.CLEANING_COST_PER_M2 },
      { surface: 60, expectedCost: 60 * config.CLEANING_COST_PER_M2 },
      { surface: 100, expectedCost: 100 * config.CLEANING_COST_PER_M2 },
    ];

    testCases.forEach(({ surface, expectedCost }) => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue Montaigne',
        surface,
        computed: createEmptyComputedContext(),
      };

      expect(module.isApplicable(ctx)).toBe(true);
      const result = module.apply(ctx);
      const proposal = result.computed?.crossSellProposals.find(p => p.id === 'CLEANING_END_SERVICE');
      expect(proposal?.priceImpact).toBe(expectedCost);
    });
  });
});

