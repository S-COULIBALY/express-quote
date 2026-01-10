import { PackingRequirementModule } from '../PackingRequirementModule';
import { QuoteContext } from '../../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';

describe('PackingRequirementModule', () => {
  const module = new PackingRequirementModule();

  it('devrait avoir les bonnes propriétés', () => {
    expect(module.id).toBe('packing-requirement');
    expect(module.description).toBe('Recommande le service d\'emballage si nécessaire');
    expect(module.priority).toBe(82);
  });

  it('devrait être applicable si volume élevé', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      estimatedVolume: 50, // > 40 m³
      computed: createEmptyComputedContext(),
    };

    expect(module.isApplicable(ctx)).toBe(true);
  });

  it('devrait être applicable si piano', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      piano: true,
      computed: createEmptyComputedContext(),
    };

    expect(module.isApplicable(ctx)).toBe(true);
  });

  it('devrait être applicable si longue distance', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      computed: {
        ...createEmptyComputedContext(),
        isLongDistance: true,
      },
    };

    expect(module.isApplicable(ctx)).toBe(true);
  });

  it('ne devrait pas être applicable si aucune condition remplie', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      estimatedVolume: 30,
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
      estimatedVolume: 50,
      computed: {
        ...createEmptyComputedContext(),
        adjustedVolume: 50,
      },
    };

    const result = module.apply(ctx);

    expect(result.computed?.requirements).toHaveLength(1);
    const requirement = result.computed?.requirements.find(r => r.type === 'PACKING_RECOMMENDED');
    expect(requirement).toBeDefined();
    expect(requirement?.severity).toBe('MEDIUM');
    expect(requirement?.moduleId).toBe('packing-requirement');

    expect(result.computed?.crossSellProposals).toHaveLength(1);
    const proposal = result.computed?.crossSellProposals.find(p => p.id === 'PACKING_SERVICE');
    expect(proposal).toBeDefined();
    expect(proposal?.optional).toBe(true);
    expect(proposal?.basedOnRequirement).toBe('PACKING_RECOMMENDED');
    expect(proposal?.priceImpact).toBeGreaterThan(0);

    expect(result.computed?.activatedModules).toContain('packing-requirement');
  });
});

