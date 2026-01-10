import { DistanceModule } from '../DistanceModule';
import type { QuoteContext } from '../../../types/quote-types';
import { MODULES_CONFIG } from '../../../config/modules.config';

describe('DistanceModule', () => {
  let module: DistanceModule;
  const distanceConfig = MODULES_CONFIG.distance;

  beforeEach(() => {
    module = new DistanceModule();
  });

  it('should use distance from context when provided', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '10 Rue de Rivoli, 75001 Paris',
      arrivalAddress: 'Avenue des Champs-Élysées, 75008 Paris',
      distance: 3.2 // Distance calculée par le formulaire
    };

    const result = module.apply(ctx);
    const expectedTravelTime = Math.round(3.2 * distanceConfig.TRAVEL_TIME_FACTOR);

    expect(result.computed?.distanceKm).toBe(3.2);
    expect(result.computed?.estimatedTravelTimeMinutes).toBe(expectedTravelTime);
    expect(result.computed?.isLongDistance).toBe(false);
    expect(result.computed?.activatedModules).toContain('distance-calculation');
    expect(result.computed?.metadata?.distanceSource).toBe('GOOGLE_MAPS_API');
    expect(result.computed?.metadata?.distanceProvided).toBe(3.2);
    expect(result.computed?.metadata?.distanceValidated).toBe(3.2);
    expect(result.computed?.metadata?.maxDistanceThreshold).toBe(distanceConfig.MAX_DISTANCE_KM);
    expect(result.computed?.metadata?.longDistanceThreshold).toBe(distanceConfig.LONG_DISTANCE_THRESHOLD_KM);
    expect(result.computed?.metadata?.travelTimeFactor).toBe(distanceConfig.TRAVEL_TIME_FACTOR);
  });

  it('should use default distance when not provided', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '10 Rue de Rivoli, 75001 Paris',
      arrivalAddress: 'Avenue des Champs-Élysées, 75008 Paris'
      // distance manquante (Google Maps API indisponible)
    };

    const result = module.apply(ctx);
    const expectedTravelTime = Math.round(distanceConfig.DEFAULT_DISTANCE_KM * distanceConfig.TRAVEL_TIME_FACTOR);

    expect(result.computed?.distanceKm).toBe(distanceConfig.DEFAULT_DISTANCE_KM);
    expect(result.computed?.estimatedTravelTimeMinutes).toBe(expectedTravelTime);
    expect(result.computed?.isLongDistance).toBe(false);
    expect(result.computed?.metadata?.distanceSource).toBe('DEFAULT_FALLBACK');
    expect(result.computed?.metadata?.distanceProvided).toBeUndefined();
    expect(result.computed?.metadata?.distanceValidated).toBe(distanceConfig.DEFAULT_DISTANCE_KM);
  });

  it('should handle distance = 0 (same building)', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '10 Rue de Rivoli, Appt 1',
      arrivalAddress: '10 Rue de Rivoli, Appt 5',
      distance: 0 // Même adresse
    };

    const result = module.apply(ctx);

    expect(result.computed?.distanceKm).toBe(0);
    expect(result.computed?.estimatedTravelTimeMinutes).toBe(0);
    expect(result.computed?.isLongDistance).toBe(false);
    expect(result.computed?.metadata?.distanceSource).toBe('GOOGLE_MAPS_API');
  });

  it('should reject negative distance', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: 'Paris',
      arrivalAddress: 'Versailles',
      distance: -10 // Invalide
    };

    const result = module.apply(ctx);

    expect(result.computed?.distanceKm).toBe(20); // Fallback
    expect(result.computed?.metadata?.distanceSource).toBe('DEFAULT_FALLBACK');
    expect(result.computed?.metadata?.distanceProvided).toBe(-10);
  });

  it('should reject aberrant distance (> MAX_DISTANCE_KM)', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: 'Paris',
      arrivalAddress: 'Tokyo',
      distance: 9700 // Invalide pour France métropolitaine (> MAX_DISTANCE_KM)
    };

    const result = module.apply(ctx);

    expect(result.computed?.distanceKm).toBe(distanceConfig.DEFAULT_DISTANCE_KM); // Fallback
    expect(result.computed?.metadata?.distanceSource).toBe('DEFAULT_FALLBACK');
    expect(result.computed?.metadata?.distanceProvided).toBe(9700);
  });

  it('should detect long distance (> LONG_DISTANCE_THRESHOLD_KM)', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: 'Paris 75001',
      arrivalAddress: 'Marseille 13001',
      distance: 775 // IDF → Province (> 50 km)
    };

    const result = module.apply(ctx);

    expect(result.computed?.distanceKm).toBe(775);
    expect(result.computed?.isLongDistance).toBe(true);
    expect(result.computed?.metadata?.longDistanceThreshold).toBe(distanceConfig.LONG_DISTANCE_THRESHOLD_KM);
  });

  it('should not detect long distance for distance ≤ LONG_DISTANCE_THRESHOLD_KM', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: 'Paris 75001',
      arrivalAddress: 'Versailles 78000',
      distance: 45 // ≤ 50 km
    };

    const result = module.apply(ctx);

    expect(result.computed?.distanceKm).toBe(45);
    expect(result.computed?.isLongDistance).toBe(false);
  });

  it('should preserve existing computed data', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: 'Paris',
      arrivalAddress: 'Versailles',
      distance: 18.5,
      computed: {
        costs: [{ moduleId: 'test', category: 'TRANSPORT', label: 'Test', amount: 100 }],
        adjustments: [],
        riskContributions: [],
        legalImpacts: [],
        insuranceNotes: [],
        requirements: [],
        crossSellProposals: [],
        operationalFlags: [],
        activatedModules: ['previous-module'],
        metadata: {}
      }
    };

    const result = module.apply(ctx);

    expect(result.computed?.costs).toHaveLength(1);
    expect(result.computed?.activatedModules).toContain('previous-module');
    expect(result.computed?.activatedModules).toContain('distance-calculation');
    expect(result.computed?.distanceKm).toBe(18.5);
  });

  it('should have correct module metadata', () => {
    expect(module.id).toBe('distance-calculation');
    expect(module.description).toBe('Récupère la distance calculée par le formulaire');
    expect(module.priority).toBe(30);
  });
});
