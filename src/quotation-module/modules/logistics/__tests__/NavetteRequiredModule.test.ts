import { NavetteRequiredModule } from '../NavetteRequiredModule';
import { QuoteContext } from '../../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';
import { MODULES_CONFIG } from '../../../config/modules.config';

describe('NavetteRequiredModule', () => {
  const module = new NavetteRequiredModule();
  const navetteConfig = MODULES_CONFIG.logistics.NAVETTE;

  it('devrait avoir les bonnes propriétés', () => {
    expect(module.id).toBe('navette-required');
    expect(module.description).toBe('Détecte si une navette est nécessaire (IDF)');
    expect(module.priority).toBe(45);
  });

  it('devrait être applicable si rue étroite au départ', () => {
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

  it('devrait être applicable si stationnement impossible à l\'arrivée', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      deliveryParkingAuthorizationRequired: true,
      computed: createEmptyComputedContext(),
    };

    expect(module.isApplicable(ctx)).toBe(true);
  });

  it('ne devrait pas être applicable si aucune contrainte', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      computed: createEmptyComputedContext(),
    };

    expect(module.isApplicable(ctx)).toBe(false);
  });

  it('devrait ajouter un coût de navette', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      pickupStreetNarrow: true,
      computed: {
        ...createEmptyComputedContext(),
        distanceKm: 15,
      },
    };

    const result = module.apply(ctx);

    expect(result.computed?.costs).toHaveLength(1);
    const navetteCost = result.computed?.costs.find(c => c.moduleId === 'navette-required');
    expect(navetteCost).toBeDefined();
    // Distance 15 km : 20€ (base) + (15 × 0.5€) = 20 + 7.5 = 27.5€
    const expectedCost = navetteConfig.BASE_COST + (15 * navetteConfig.DISTANCE_FACTOR);
    expect(navetteCost?.amount).toBe(expectedCost);
    expect(navetteCost?.category).toBe('TRANSPORT');
    expect(navetteCost?.metadata).toMatchObject({
      reasons: ['rue étroite au départ'],
      baseCost: navetteConfig.BASE_COST,
      distanceKm: 15,
      distanceFactor: navetteConfig.DISTANCE_FACTOR,
      distanceSurcharge: 15 * navetteConfig.DISTANCE_FACTOR,
    });
    expect(result.computed?.requirements).toHaveLength(1);
    expect(result.computed?.operationalFlags).toContain('NAVETTE_REQUIRED');
  });

  it('devrait ajouter un surcoût pour longue distance', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      pickupStreetNarrow: true,
      computed: {
        ...createEmptyComputedContext(),
        distanceKm: 50, // Longue distance
      },
    };

    const result = module.apply(ctx);
    const navetteCost = result.computed?.costs.find(c => c.moduleId === 'navette-required');
    // Distance 50 km : 20€ (base) + (50 × 0.5€) = 20 + 25 = 45€
    const expectedCost = navetteConfig.BASE_COST + (50 * navetteConfig.DISTANCE_FACTOR);
    expect(navetteCost?.amount).toBe(expectedCost);
    expect(navetteCost?.metadata).toMatchObject({
      baseCost: navetteConfig.BASE_COST,
      distanceKm: 50,
      distanceFactor: navetteConfig.DISTANCE_FACTOR,
      distanceSurcharge: 50 * navetteConfig.DISTANCE_FACTOR,
    });
  });
});

