import { StorageRequirementModule } from '../StorageRequirementModule';
import { QuoteContext } from '../../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';

describe('StorageRequirementModule', () => {
  const module = new StorageRequirementModule();

  it('devrait avoir les bonnes propriétés', () => {
    expect(module.id).toBe('storage-requirement');
    expect(module.description).toBe('Recommande le stockage temporaire si nécessaire');
    expect(module.priority).toBe(84);
  });

  it('devrait être applicable si stockage temporaire déclaré', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      temporaryStorage: true,
      computed: createEmptyComputedContext(),
    };

    expect(module.isApplicable(ctx)).toBe(true);
  });

  it('devrait être applicable si durée de stockage spécifiée', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      storageDurationDays: 30,
      computed: createEmptyComputedContext(),
    };

    expect(module.isApplicable(ctx)).toBe(true);
  });

  it('ne devrait pas être applicable si aucun besoin de stockage', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
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
      temporaryStorage: true,
      storageDurationDays: 45,
      estimatedVolume: 30,
      computed: {
        ...createEmptyComputedContext(),
        adjustedVolume: 30,
      },
    };

    const result = module.apply(ctx);

    expect(result.computed?.requirements).toHaveLength(1);
    const requirement = result.computed?.requirements.find(r => r.type === 'STORAGE_RECOMMENDED');
    expect(requirement).toBeDefined();
    expect(requirement?.severity).toBe('MEDIUM');
    expect(requirement?.moduleId).toBe('storage-requirement');

    expect(result.computed?.crossSellProposals).toHaveLength(1);
    const proposal = result.computed?.crossSellProposals.find(p => p.id === 'STORAGE_SERVICE');
    expect(proposal).toBeDefined();
    expect(proposal?.optional).toBe(true);
    expect(proposal?.basedOnRequirement).toBe('STORAGE_RECOMMENDED');
    expect(proposal?.priceImpact).toBeGreaterThan(0);

    expect(result.computed?.activatedModules).toContain('storage-requirement');
  });
});

