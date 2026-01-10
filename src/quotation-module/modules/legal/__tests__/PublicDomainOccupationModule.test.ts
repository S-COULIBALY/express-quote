import { PublicDomainOccupationModule } from '../PublicDomainOccupationModule';
import { QuoteContext } from '../../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';
import { MODULES_CONFIG } from '../../../config/modules.config';

describe('PublicDomainOccupationModule', () => {
  const module = new PublicDomainOccupationModule();
  const adminConfig = MODULES_CONFIG.administrative;
  const riskConfig = MODULES_CONFIG.risk;

  it('devrait avoir les bonnes propriétés', () => {
    expect(module.id).toBe('public-domain-occupation');
    expect(module.description).toBe('Gère l\'occupation du domaine public');
    expect(module.priority).toBe(77);
  });

  it('devrait être applicable si autorisation stationnement requise', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      pickupParkingAuthorizationRequired: true,
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

  it('ne devrait pas être applicable si aucune occupation domaine public', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      computed: createEmptyComputedContext(),
    };

    expect(module.isApplicable(ctx)).toBe(false);
  });

  it('devrait ajouter un coût administratif et un requirement', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      pickupParkingAuthorizationRequired: true,
      computed: createEmptyComputedContext(),
    };

    const result = module.apply(ctx);

    expect(result.computed?.costs).toHaveLength(1);
    const cost = result.computed?.costs.find(c => c.moduleId === 'public-domain-occupation');
    expect(cost).toBeDefined();
    expect(cost?.amount).toBe(adminConfig.PUBLIC_DOMAIN_AUTHORIZATION_COST); // Coût de base
    expect(cost?.category).toBe('ADMINISTRATIVE');
    expect(cost?.metadata).toMatchObject({
      locations: ['départ'],
      baseCost: adminConfig.PUBLIC_DOMAIN_AUTHORIZATION_COST,
      multipleLocations: false,
      multiplier: 1,
      riskContribution: riskConfig.PUBLIC_DOMAIN_RISK_CONTRIBUTION,
    });

    expect(result.computed?.requirements).toHaveLength(1);
    const requirement = result.computed?.requirements.find(r => r.type === 'PUBLIC_DOMAIN_OCCUPATION_REQUIRED');
    expect(requirement).toBeDefined();

    expect(result.computed?.legalImpacts).toHaveLength(1);
    const legalImpact = result.computed?.legalImpacts.find(i => i.moduleId === 'public-domain-occupation');
    expect(legalImpact).toBeDefined();
    expect(legalImpact?.type).toBe('REGULATORY');

    expect(result.computed?.riskContributions).toHaveLength(1);
    expect(result.computed?.riskContributions[0].amount).toBe(riskConfig.PUBLIC_DOMAIN_RISK_CONTRIBUTION);
    expect(result.computed?.operationalFlags).toContain('PUBLIC_DOMAIN_OCCUPATION_REQUIRED');
  });

  it('devrait appliquer un surcoût majoré si deux locations', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      pickupParkingAuthorizationRequired: true,
      deliveryParkingAuthorizationRequired: true,
      computed: createEmptyComputedContext(),
    };

    const result = module.apply(ctx);
    const cost = result.computed?.costs.find(c => c.moduleId === 'public-domain-occupation');
    const expectedCost = adminConfig.PUBLIC_DOMAIN_AUTHORIZATION_COST * adminConfig.MULTIPLE_LOCATIONS_MULTIPLIER; // 50 * 1.5 = 75€
    expect(cost?.amount).toBe(expectedCost);
    expect(cost?.metadata).toMatchObject({
      locations: ['départ', 'arrivée'],
      baseCost: adminConfig.PUBLIC_DOMAIN_AUTHORIZATION_COST,
      multipleLocations: true,
      multiplier: adminConfig.MULTIPLE_LOCATIONS_MULTIPLIER,
      riskContribution: riskConfig.PUBLIC_DOMAIN_RISK_CONTRIBUTION,
    });
  });
});

