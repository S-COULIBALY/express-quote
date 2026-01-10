import { NeighborhoodDamageRiskModule } from '../NeighborhoodDamageRiskModule';
import { QuoteContext } from '../../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';

describe('NeighborhoodDamageRiskModule', () => {
  const module = new NeighborhoodDamageRiskModule();

  it('devrait avoir les bonnes propriétés', () => {
    expect(module.id).toBe('neighborhood-damage-risk');
    expect(module.description).toBe('Évalue le risque de dommages au voisinage');
    expect(module.priority).toBe(76);
  });

  it('devrait être applicable si étage élevé sans ascenseur', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      pickupFloor: 5,
      pickupHasElevator: false,
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

  it('devrait être applicable si rue étroite', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      pickupStreetNarrow: true,
      computed: createEmptyComputedContext(),
    };

    expect(module.isApplicable(ctx)).toBe(true);
  });

  it('ne devrait pas être applicable si aucun risque', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      computed: createEmptyComputedContext(),
    };

    expect(module.isApplicable(ctx)).toBe(false);
  });

  it('devrait calculer le risque correctement', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      pickupFloor: 5,
      pickupHasElevator: false,
      piano: true,
      computed: createEmptyComputedContext(),
    };

    const result = module.apply(ctx);

    expect(result.computed?.requirements).toHaveLength(1);
    const requirement = result.computed?.requirements.find(r => r.type === 'NEIGHBORHOOD_DAMAGE_RISK');
    expect(requirement).toBeDefined();
    expect(requirement?.severity).toBe('HIGH'); // Risque élevé car > 15 points

    expect(result.computed?.riskContributions).toHaveLength(1);
    const riskContribution = result.computed?.riskContributions[0];
    expect(riskContribution?.amount).toBeGreaterThan(15);
    expect(riskContribution?.amount).toBeLessThanOrEqual(30); // Plafonné à 30

    expect(result.computed?.insuranceNotes.length).toBeGreaterThan(0);
    expect(result.computed?.activatedModules).toContain('neighborhood-damage-risk');
  });
});

