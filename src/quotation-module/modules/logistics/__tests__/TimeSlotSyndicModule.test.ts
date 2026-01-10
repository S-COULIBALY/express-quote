import { TimeSlotSyndicModule } from '../TimeSlotSyndicModule';
import { QuoteContext } from '../../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';
import { MODULES_CONFIG } from '../../../config/modules.config';

describe('TimeSlotSyndicModule', () => {
  const module = new TimeSlotSyndicModule();
  const logisticsConfig = MODULES_CONFIG.logistics;
  const adminConfig = MODULES_CONFIG.administrative;

  it('devrait avoir les bonnes propriétés', () => {
    expect(module.id).toBe('time-slot-syndic');
    expect(module.description).toBe('Détecte si un créneau syndic est requis');
    expect(module.priority).toBe(47);
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

  it('devrait être applicable si créneau syndic à l\'arrivée', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      deliverySyndicTimeSlot: true,
      computed: createEmptyComputedContext(),
    };

    expect(module.isApplicable(ctx)).toBe(true);
  });

  it('ne devrait pas être applicable si aucun créneau syndic', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      computed: createEmptyComputedContext(),
    };

    expect(module.isApplicable(ctx)).toBe(false);
  });

  it('devrait ajouter un surcoût et un requirement', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      pickupSyndicTimeSlot: true,
      computed: createEmptyComputedContext(),
    };

    const result = module.apply(ctx);

    expect(result.computed?.costs).toHaveLength(1);
    const syndicCost = result.computed?.costs.find(c => c.moduleId === 'time-slot-syndic');
    expect(syndicCost).toBeDefined();
    expect(syndicCost?.amount).toBe(logisticsConfig.SYNDIC_SURCHARGE); // Surcoût de base
    expect(syndicCost?.category).toBe('ADMINISTRATIVE');
    expect(syndicCost?.metadata).toMatchObject({
      locations: ['départ'],
      baseSurcharge: logisticsConfig.SYNDIC_SURCHARGE,
      multipleLocations: false,
      multiplier: 1,
      riskContribution: logisticsConfig.SYNDIC_RISK_CONTRIBUTION,
    });
    expect(result.computed?.requirements).toHaveLength(1);
    expect(result.computed?.riskContributions).toHaveLength(1);
    expect(result.computed?.riskContributions[0].amount).toBe(logisticsConfig.SYNDIC_RISK_CONTRIBUTION);
    expect(result.computed?.operationalFlags).toContain('SYNDIC_TIME_SLOT_REQUIRED');
  });

  it('devrait appliquer un surcoût majoré si créneaux aux deux endroits', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      pickupSyndicTimeSlot: true,
      deliverySyndicTimeSlot: true,
      computed: createEmptyComputedContext(),
    };

    const result = module.apply(ctx);
    const syndicCost = result.computed?.costs.find(c => c.moduleId === 'time-slot-syndic');
    const expectedSurcharge = logisticsConfig.SYNDIC_SURCHARGE * adminConfig.MULTIPLE_LOCATIONS_MULTIPLIER; // 80 * 1.5 = 120€
    expect(syndicCost?.amount).toBe(expectedSurcharge);
    expect(syndicCost?.metadata).toMatchObject({
      locations: ['départ', 'arrivée'],
      baseSurcharge: logisticsConfig.SYNDIC_SURCHARGE,
      multipleLocations: true,
      multiplier: adminConfig.MULTIPLE_LOCATIONS_MULTIPLIER,
      riskContribution: logisticsConfig.SYNDIC_RISK_CONTRIBUTION,
    });
  });
});

