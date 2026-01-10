import { MonteMeublesRecommendationModule } from '../MonteMeublesRecommendationModule';
import { QuoteContext } from '../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';
import { MODULES_CONFIG } from '../../../config/modules.config';

describe('MonteMeublesRecommendationModule', () => {
  let module: MonteMeublesRecommendationModule;
  let baseContext: QuoteContext;
  const floorThresholds = MODULES_CONFIG.furnitureLift.FLOOR_THRESHOLDS;
  const estimatedCosts = MODULES_CONFIG.furnitureLift.ESTIMATED_COSTS;

  beforeEach(() => {
    module = new MonteMeublesRecommendationModule();
    baseContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue de Lyon',
      computed: createEmptyComputedContext(),
    };
  });

  describe('isApplicable', () => {
    it('should be applicable if pickup floor > 0 and no elevator', () => {
      baseContext.pickupFloor = 3;
      baseContext.pickupHasElevator = false;
      expect(module.isApplicable(baseContext)).toBe(true);
    });

    it('should be applicable if delivery floor > 0 and no elevator', () => {
      baseContext.deliveryFloor = 2;
      baseContext.deliveryHasElevator = false;
      expect(module.isApplicable(baseContext)).toBe(true);
    });

    it('should not be applicable if both have elevator', () => {
      baseContext.pickupFloor = 3;
      baseContext.pickupHasElevator = true;
      baseContext.deliveryFloor = 2;
      baseContext.deliveryHasElevator = true;
      expect(module.isApplicable(baseContext)).toBe(false);
    });
  });

  describe('apply', () => {
    it('should add MEDIUM requirement for floor 1-2', () => {
      baseContext.pickupFloor = 2;
      baseContext.pickupHasElevator = false;
      const result = module.apply(baseContext);

      const requirement = result.computed?.requirements.find(r => 
        r.type === 'LIFT_RECOMMENDED' && r.moduleId === 'monte-meubles-recommendation'
      );
      expect(requirement).toBeDefined();
      expect(requirement?.severity).toBe('MEDIUM');
      expect(result.computed?.metadata?.monteMeublesSeverity).toBe('MEDIUM');
      expect(result.computed?.metadata?.maxFloor).toBe(2);
    });

    it('should add HIGH requirement for floor >= 3', () => {
      baseContext.pickupFloor = 3;
      baseContext.pickupHasElevator = false;
      const result = module.apply(baseContext);

      const requirement = result.computed?.requirements.find(r => 
        r.type === 'LIFT_RECOMMENDED' && r.moduleId === 'monte-meubles-recommendation'
      );
      expect(requirement).toBeDefined();
      expect(requirement?.severity).toBe('HIGH');
      expect(result.computed?.metadata?.monteMeublesSeverity).toBe('HIGH');
      expect(result.computed?.metadata?.maxFloor).toBe(3);
      expect(result.computed?.metadata?.floorThresholds?.high).toBe(floorThresholds.HIGH);
    });

    it('should add CRITICAL requirement for floor >= 5', () => {
      baseContext.pickupFloor = 5;
      baseContext.pickupHasElevator = false;
      const result = module.apply(baseContext);

      const requirement = result.computed?.requirements.find(r => 
        r.type === 'LIFT_RECOMMENDED' && r.moduleId === 'monte-meubles-recommendation'
      );
      expect(requirement).toBeDefined();
      expect(requirement?.severity).toBe('CRITICAL');
      expect(result.computed?.metadata?.monteMeublesSeverity).toBe('CRITICAL');
      expect(result.computed?.metadata?.maxFloor).toBe(5);
      expect(result.computed?.metadata?.floorThresholds?.critical).toBe(floorThresholds.CRITICAL);
    });

    it('should add requirement for both pickup and delivery if both need lift', () => {
      baseContext.pickupFloor = 3;
      baseContext.pickupHasElevator = false;
      baseContext.deliveryFloor = 4;
      baseContext.deliveryHasElevator = false;
      const result = module.apply(baseContext);

      const requirement = result.computed?.requirements.find(r => 
        r.type === 'LIFT_RECOMMENDED' && r.moduleId === 'monte-meubles-recommendation'
      );
      expect(requirement).toBeDefined();
      expect(requirement?.reason).toContain('Étage 3 sans ascenseur adapté au départ');
      expect(requirement?.reason).toContain('Étage 4 sans ascenseur adapté à l\'arrivée');
      expect(result.computed?.metadata?.maxFloor).toBe(4); // Max entre 3 et 4
    });

    it('should add cross-sell proposal with correct estimated costs', () => {
      baseContext.pickupFloor = 3;
      baseContext.pickupHasElevator = false;
      const result = module.apply(baseContext);

      const crossSell = result.computed?.crossSellProposals.find(p => p.id === 'MONTE_MEUBLES');
      expect(crossSell).toBeDefined();
      expect(crossSell?.priceImpact).toBe(estimatedCosts.LIFT);
      expect(crossSell?.metadata?.estimatedLiftCost).toBe(estimatedCosts.LIFT);
      expect(crossSell?.metadata?.estimatedRiskSurcharge).toBe(estimatedCosts.RISK_SURCHARGE);
      expect(crossSell?.metadata?.economy).toBe(estimatedCosts.RISK_SURCHARGE - estimatedCosts.LIFT);
    });

    it('should use correct severity based on max floor', () => {
      baseContext.pickupFloor = 2;
      baseContext.pickupHasElevator = false;
      baseContext.deliveryFloor = 4; // Max = 4, donc HIGH
      baseContext.deliveryHasElevator = false;
      const result = module.apply(baseContext);

      const requirement = result.computed?.requirements.find(r => 
        r.type === 'LIFT_RECOMMENDED' && r.moduleId === 'monte-meubles-recommendation'
      );
      expect(requirement?.severity).toBe('HIGH'); // Basé sur max(2, 4) = 4
      expect(result.computed?.metadata?.maxFloor).toBe(4);
    });

    it('should not apply if no lift needed', () => {
      baseContext.pickupFloor = 3;
      baseContext.pickupHasElevator = true; // Ascenseur présent
      const result = module.apply(baseContext);

      const requirement = result.computed?.requirements.find(r => 
        r.type === 'LIFT_RECOMMENDED' && r.moduleId === 'monte-meubles-recommendation'
      );
      expect(requirement).toBeUndefined();
      expect(result.computed?.metadata?.monteMeublesRecommended).toBeUndefined();
    });

    it('should detect small elevator as inadequate', () => {
      baseContext.pickupFloor = 3;
      baseContext.pickupHasElevator = true;
      baseContext.pickupElevatorSize = 'SMALL'; // Ascenseur trop petit
      const result = module.apply(baseContext);

      const requirement = result.computed?.requirements.find(r => 
        r.type === 'LIFT_RECOMMENDED' && r.moduleId === 'monte-meubles-recommendation'
      );
      expect(requirement).toBeDefined();
      expect(requirement?.severity).toBe('HIGH');
    });

    it('should enrich metadata with thresholds and costs', () => {
      baseContext.pickupFloor = 4;
      baseContext.pickupHasElevator = false;
      const result = module.apply(baseContext);

      expect(result.computed?.metadata?.floorThresholds).toEqual({
        high: floorThresholds.HIGH,
        critical: floorThresholds.CRITICAL,
      });
      expect(result.computed?.metadata?.estimatedCosts).toEqual({
        lift: estimatedCosts.LIFT,
        riskSurcharge: estimatedCosts.RISK_SURCHARGE,
        economy: estimatedCosts.RISK_SURCHARGE - estimatedCosts.LIFT,
      });
    });
  });
});

