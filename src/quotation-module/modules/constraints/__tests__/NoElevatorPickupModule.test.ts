import { NoElevatorPickupModule } from '../NoElevatorPickupModule';
import { QuoteContext } from '../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';

describe('NoElevatorPickupModule', () => {
  let module: NoElevatorPickupModule;
  let baseContext: QuoteContext;

  beforeEach(() => {
    module = new NoElevatorPickupModule();
    baseContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue de Lyon',
      computed: createEmptyComputedContext(),
    };
  });

  describe('isApplicable', () => {
    it('should be applicable if floor > 0 and no elevator', () => {
      baseContext.pickupFloor = 3;
      baseContext.pickupHasElevator = false;
      expect(module.isApplicable(baseContext)).toBe(true);
    });

    it('should not be applicable if floor is 0', () => {
      baseContext.pickupFloor = 0;
      baseContext.pickupHasElevator = false;
      expect(module.isApplicable(baseContext)).toBe(false);
    });

    it('should not be applicable if has elevator', () => {
      baseContext.pickupFloor = 3;
      baseContext.pickupHasElevator = true;
      expect(module.isApplicable(baseContext)).toBe(false);
    });
  });

  describe('apply', () => {
    it('should add requirement and risk contribution for floor without elevator', () => {
      baseContext.pickupFloor = 3;
      baseContext.pickupHasElevator = false;
      const result = module.apply(baseContext);

      const requirement = result.computed?.requirements.find(r => r.type === 'LIFT_RECOMMENDED');
      expect(requirement).toBeDefined();
      expect(requirement?.severity).toBe('HIGH');
      expect(requirement?.reason).toContain('Étage 3 sans ascenseur');

      const riskContribution = result.computed?.riskContributions.find(r => r.moduleId === 'no-elevator-pickup');
      expect(riskContribution).toBeDefined();
      expect(riskContribution?.amount).toBe(15);

      expect(result.computed?.activatedModules).toContain('no-elevator-pickup');
    });

    it('should not apply if no constraint', () => {
      baseContext.pickupFloor = 0;
      const result = module.apply(baseContext);

      expect(result.computed?.requirements.find(r => r.type === 'LIFT_RECOMMENDED')).toBeUndefined();
      expect(result.computed?.activatedModules).not.toContain('no-elevator-pickup');
    });
  });
});

