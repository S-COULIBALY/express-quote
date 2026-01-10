import { CoOwnershipRulesModule } from '../CoOwnershipRulesModule';
import { QuoteContext } from '../../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';

describe('CoOwnershipRulesModule', () => {
  const module = new CoOwnershipRulesModule();

  it('devrait avoir les bonnes propriétés', () => {
    expect(module.id).toBe('co-ownership-rules');
    expect(module.description).toBe('Gère les règles spécifiques aux copropriétés');
    expect(module.priority).toBe(75);
  });

  it('devrait être applicable si créneau syndic au départ', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      pickupSyndicTimeSlot: true,
      computed: createEmptyComputedContext(),
    };

    expect(module.isApplicable(ctx)).toBe(true);
  });

  it('devrait être applicable si copropriété avec ascenseur', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      pickupFloor: 3,
      pickupHasElevator: true,
      computed: createEmptyComputedContext(),
    };

    expect(module.isApplicable(ctx)).toBe(true);
  });

  it('ne devrait pas être applicable si aucune copropriété', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      pickupFloor: 0,
      computed: createEmptyComputedContext(),
    };

    expect(module.isApplicable(ctx)).toBe(false);
  });

  it('devrait ajouter un requirement et un impact juridique', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      pickupSyndicTimeSlot: true,
      computed: createEmptyComputedContext(),
    };

    const result = module.apply(ctx);

    expect(result.computed?.requirements).toHaveLength(1);
    const requirement = result.computed?.requirements.find(r => r.type === 'CO_OWNERSHIP_RULES');
    expect(requirement).toBeDefined();
    expect(requirement?.severity).toBe('MEDIUM');

    expect(result.computed?.legalImpacts).toHaveLength(1);
    const legalImpact = result.computed?.legalImpacts.find(i => i.moduleId === 'co-ownership-rules');
    expect(legalImpact).toBeDefined();
    expect(legalImpact?.type).toBe('REGULATORY');

    expect(result.computed?.riskContributions).toHaveLength(1);
    expect(result.computed?.riskContributions[0].amount).toBe(8);
    expect(result.computed?.activatedModules).toContain('co-ownership-rules');
  });
});

