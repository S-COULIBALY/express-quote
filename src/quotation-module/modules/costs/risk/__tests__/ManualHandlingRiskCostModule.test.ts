import { ManualHandlingRiskCostModule } from '../ManualHandlingRiskCostModule';
import { QuoteContext } from '../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';
import { MODULES_CONFIG } from '../../../config/modules.config';

describe('ManualHandlingRiskCostModule', () => {
  let module: ManualHandlingRiskCostModule;
  let baseContext: QuoteContext;
  const config = MODULES_CONFIG.furnitureLift.MANUAL_HANDLING_RISK;
  const estimatedLiftCost = MODULES_CONFIG.furnitureLift.ESTIMATED_COSTS.LIFT;

  beforeEach(() => {
    module = new ManualHandlingRiskCostModule();
    baseContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue de Lyon',
      computed: createEmptyComputedContext(),
    };
  });

  describe('isApplicable', () => {
    it('should be applicable if lift recommended and refused', () => {
      baseContext.computed!.requirements = [{
        type: 'LIFT_RECOMMENDED',
        severity: 'HIGH',
        reason: 'Test',
        moduleId: 'monte-meubles-recommendation',
      }];
      baseContext.refuseLiftDespiteRecommendation = true;
      expect(module.isApplicable(baseContext)).toBe(true);
    });

    it('should not be applicable if not refused', () => {
      baseContext.computed!.requirements = [{
        type: 'LIFT_RECOMMENDED',
        severity: 'HIGH',
        reason: 'Test',
        moduleId: 'monte-meubles-recommendation',
      }];
      baseContext.refuseLiftDespiteRecommendation = false;
      expect(module.isApplicable(baseContext)).toBe(false);
    });
  });

  describe('apply', () => {
    it('should add risk cost if lift refused (pickup only)', () => {
      baseContext.computed!.requirements = [{
        type: 'LIFT_RECOMMENDED',
        severity: 'HIGH',
        reason: 'Test',
        moduleId: 'monte-meubles-recommendation',
      }];
      baseContext.refuseLiftDespiteRecommendation = true;
      baseContext.pickupFloor = 3;
      baseContext.pickupHasElevator = false;
      
      const result = module.apply(baseContext);

      const riskCost = result.computed?.costs.find(c => c.moduleId === 'manual-handling-risk-cost');
      expect(riskCost).toBeDefined();
      const expectedCost = config.BASE_COST + (3 * config.COST_PER_FLOOR); // 150 + (3 * 50) = 300
      expect(riskCost?.amount).toBe(expectedCost);
      expect(riskCost?.category).toBe('RISK');
      expect(riskCost?.metadata).toMatchObject({
        baseRiskCost: config.BASE_COST,
        pickupFloors: 3,
        deliveryFloors: 0,
        totalFloors: 3,
        riskCostPerFloor: config.COST_PER_FLOOR,
        floorsCost: 150, // 3 * 50
        estimatedLiftCost,
        economyIfLiftAccepted: expectedCost - estimatedLiftCost, // 300 - 350 = -50
      });
      expect(result.computed?.activatedModules).toContain('manual-handling-risk-cost');
    });

    it('should calculate cost for both pickup and delivery floors', () => {
      baseContext.computed!.requirements = [{
        type: 'LIFT_RECOMMENDED',
        severity: 'HIGH',
        reason: 'Test',
        moduleId: 'monte-meubles-recommendation',
      }];
      baseContext.refuseLiftDespiteRecommendation = true;
      baseContext.pickupFloor = 3;
      baseContext.pickupHasElevator = false;
      baseContext.deliveryFloor = 2;
      baseContext.deliveryHasElevator = false;
      
      const result = module.apply(baseContext);

      const riskCost = result.computed?.costs.find(c => c.moduleId === 'manual-handling-risk-cost');
      const expectedCost = config.BASE_COST + ((3 + 2) * config.COST_PER_FLOOR); // 150 + (5 * 50) = 400
      expect(riskCost?.amount).toBe(expectedCost);
      expect(riskCost?.metadata).toMatchObject({
        baseRiskCost: config.BASE_COST,
        pickupFloors: 3,
        deliveryFloors: 2,
        totalFloors: 5,
        riskCostPerFloor: config.COST_PER_FLOOR,
        floorsCost: 250, // 5 * 50
        estimatedLiftCost,
        economyIfLiftAccepted: expectedCost - estimatedLiftCost, // 400 - 350 = 50
      });
    });

    it('should not count floors with elevator', () => {
      baseContext.computed!.requirements = [{
        type: 'LIFT_RECOMMENDED',
        severity: 'HIGH',
        reason: 'Test',
        moduleId: 'monte-meubles-recommendation',
      }];
      baseContext.refuseLiftDespiteRecommendation = true;
      baseContext.pickupFloor = 3;
      baseContext.pickupHasElevator = true; // Avec ascenseur, ne doit pas compter
      baseContext.deliveryFloor = 2;
      baseContext.deliveryHasElevator = false;
      
      const result = module.apply(baseContext);

      const riskCost = result.computed?.costs.find(c => c.moduleId === 'manual-handling-risk-cost');
      const expectedCost = config.BASE_COST + (2 * config.COST_PER_FLOOR); // 150 + (2 * 50) = 250
      expect(riskCost?.amount).toBe(expectedCost);
      expect(riskCost?.metadata).toMatchObject({
        pickupFloors: 0, // Pas compté car ascenseur
        deliveryFloors: 2,
        totalFloors: 2,
      });
    });

    it('should calculate economy correctly when risk cost is higher than lift', () => {
      baseContext.computed!.requirements = [{
        type: 'LIFT_RECOMMENDED',
        severity: 'HIGH',
        reason: 'Test',
        moduleId: 'monte-meubles-recommendation',
      }];
      baseContext.refuseLiftDespiteRecommendation = true;
      baseContext.pickupFloor = 5; // 5 étages = 150 + (5 * 50) = 400€
      baseContext.pickupHasElevator = false;
      
      const result = module.apply(baseContext);

      const riskCost = result.computed?.costs.find(c => c.moduleId === 'manual-handling-risk-cost');
      const expectedCost = config.BASE_COST + (5 * config.COST_PER_FLOOR); // 150 + 250 = 400
      expect(riskCost?.amount).toBe(expectedCost);
      expect(riskCost?.metadata.economyIfLiftAccepted).toBe(50); // 400 - 350 = 50€ d'économie si monte-meubles
    });

    it('should calculate negative economy when risk cost is lower than lift', () => {
      baseContext.computed!.requirements = [{
        type: 'LIFT_RECOMMENDED',
        severity: 'HIGH',
        reason: 'Test',
        moduleId: 'monte-meubles-recommendation',
      }];
      baseContext.refuseLiftDespiteRecommendation = true;
      baseContext.pickupFloor = 2; // 2 étages = 150 + (2 * 50) = 250€
      baseContext.pickupHasElevator = false;
      
      const result = module.apply(baseContext);

      const riskCost = result.computed?.costs.find(c => c.moduleId === 'manual-handling-risk-cost');
      const expectedCost = config.BASE_COST + (2 * config.COST_PER_FLOOR); // 150 + 100 = 250
      expect(riskCost?.amount).toBe(expectedCost);
      expect(riskCost?.metadata.economyIfLiftAccepted).toBe(-100); // 250 - 350 = -100€ (surcoût si monte-meubles)
    });
  });
});

