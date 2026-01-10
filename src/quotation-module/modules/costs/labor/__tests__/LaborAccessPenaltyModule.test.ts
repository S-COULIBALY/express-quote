import { LaborAccessPenaltyModule } from '../LaborAccessPenaltyModule';
import { QuoteContext } from '../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';
import { MODULES_CONFIG } from '../../../config/modules.config';

describe('LaborAccessPenaltyModule', () => {
  let module: LaborAccessPenaltyModule;
  let baseContext: QuoteContext;
  const config = MODULES_CONFIG.labor.ACCESS_PENALTIES;

  beforeEach(() => {
    module = new LaborAccessPenaltyModule();
    baseContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue de Lyon',
      computed: createEmptyComputedContext(),
    };
  });

  describe('isApplicable', () => {
    it('should not be applicable if pickup floor = 3 (threshold)', () => {
      baseContext.pickupFloor = 3;
      baseContext.pickupHasElevator = false;
      expect(module.isApplicable(baseContext)).toBe(false);
    });

    it('should be applicable if pickup floor > 3 and no elevator and no lift', () => {
      baseContext.pickupFloor = 4;
      baseContext.pickupHasElevator = false;
      expect(module.isApplicable(baseContext)).toBe(true);
    });

    it('should not be applicable if pickup floor > 3 but has lift', () => {
      baseContext.pickupFloor = 4;
      baseContext.pickupHasElevator = false;
      baseContext.refuseLiftDespiteRecommendation = false; // Lift accepté
      expect(module.isApplicable(baseContext)).toBe(false);
    });

    it('should not be applicable if carry distance = 30 (threshold)', () => {
      baseContext.pickupCarryDistance = 30;
      expect(module.isApplicable(baseContext)).toBe(false);
    });

    it('should be applicable if carry distance > 30', () => {
      baseContext.pickupCarryDistance = 31;
      expect(module.isApplicable(baseContext)).toBe(true);
    });
  });

  describe('apply', () => {
    it('should add penalty cost for stairs without elevator and no lift (floor > 3)', () => {
      baseContext.pickupFloor = 4;
      baseContext.pickupHasElevator = false;
      const result = module.apply(baseContext);

      const penaltyCost = result.computed?.costs.find(c => c.moduleId === 'labor-access-penalty');
      expect(penaltyCost).toBeDefined();
      expect(penaltyCost?.amount).toBe(100); // 4 étages * 25 €
      expect(penaltyCost?.category).toBe('LABOR');
      expect(result.computed?.activatedModules).toContain('labor-access-penalty');
    });

    it('should not add penalty if floor = 3 (threshold)', () => {
      baseContext.pickupFloor = 3;
      baseContext.pickupHasElevator = false;
      const result = module.apply(baseContext);

      const penaltyCost = result.computed?.costs.find(c => c.moduleId === 'labor-access-penalty');
      expect(penaltyCost).toBeUndefined();
    });

    it('should not add penalty if has lift even with floor > 3', () => {
      baseContext.pickupFloor = 5;
      baseContext.pickupHasElevator = false;
      baseContext.computed!.costs = [
        {
          moduleId: 'furniture-lift-cost',
          category: 'TRANSPORT',
          label: 'Monte-meubles',
          amount: 350,
        }
      ];
      const result = module.apply(baseContext);

      const penaltyCost = result.computed?.costs.find(c => c.moduleId === 'labor-access-penalty');
      expect(penaltyCost).toBeUndefined();
    });

    it('should add penalty for both pickup and delivery stairs (both > 3)', () => {
      baseContext.pickupFloor = 4;
      baseContext.pickupHasElevator = false;
      baseContext.deliveryFloor = 5;
      baseContext.deliveryHasElevator = false;
      const result = module.apply(baseContext);

      const penaltyCost = result.computed?.costs.find(c => c.moduleId === 'labor-access-penalty');
      expect(penaltyCost?.amount).toBe(225); // (4 + 5) étages * 25 € = 225€
    });

    it('should not add penalty for carry distance = 30 (threshold)', () => {
      baseContext.pickupCarryDistance = 30;
      const result = module.apply(baseContext);

      const penaltyCost = result.computed?.costs.find(c => c.moduleId === 'labor-access-penalty');
      expect(penaltyCost).toBeUndefined();
    });

    it('should add penalty for carry distance > 30', () => {
      baseContext.pickupCarryDistance = 50; // 50 mètres
      const result = module.apply(baseContext);

      const penaltyCost = result.computed?.costs.find(c => c.moduleId === 'labor-access-penalty');
      expect(penaltyCost?.amount).toBe(100); // 50 m * 2 €/m = 100€
    });

    it('should add penalty for both stairs and carry distance', () => {
      baseContext.pickupFloor = 4;
      baseContext.pickupHasElevator = false;
      baseContext.pickupCarryDistance = 50;
      const result = module.apply(baseContext);

      const penaltyCost = result.computed?.costs.find(c => c.moduleId === 'labor-access-penalty');
      expect(penaltyCost?.amount).toBe(200); // (4 * 25) + (50 * 2) = 100 + 100 = 200€
    });
  });
});

