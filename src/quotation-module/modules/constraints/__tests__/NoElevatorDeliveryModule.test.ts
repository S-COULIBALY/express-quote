import { NoElevatorDeliveryModule } from '../NoElevatorDeliveryModule';
import { QuoteContext } from '../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';

describe('NoElevatorDeliveryModule', () => {
  let module: NoElevatorDeliveryModule;
  let baseContext: QuoteContext;

  beforeEach(() => {
    module = new NoElevatorDeliveryModule();
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
      baseContext.deliveryFloor = 4;
      baseContext.deliveryHasElevator = false;
      expect(module.isApplicable(baseContext)).toBe(true);
    });

    it('should not be applicable if floor is 0', () => {
      baseContext.deliveryFloor = 0;
      baseContext.deliveryHasElevator = false;
      expect(module.isApplicable(baseContext)).toBe(false);
    });

    it('should not be applicable if has elevator', () => {
      baseContext.deliveryFloor = 4;
      baseContext.deliveryHasElevator = true;
      expect(module.isApplicable(baseContext)).toBe(false);
    });
  });

  describe('apply', () => {
    it('should add requirement and risk contribution for floor without elevator', () => {
      baseContext.deliveryFloor = 4;
      baseContext.deliveryHasElevator = false;
      const result = module.apply(baseContext);

      const requirement = result.computed?.requirements.find(r => r.type === 'LIFT_RECOMMENDED');
      expect(requirement).toBeDefined();
      expect(requirement?.severity).toBe('HIGH');
      expect(requirement?.reason).toContain('Étage 4 sans ascenseur');

      const riskContribution = result.computed?.riskContributions.find(r => r.moduleId === 'no-elevator-delivery');
      expect(riskContribution).toBeDefined();
      expect(riskContribution?.amount).toBe(15);

      expect(result.computed?.activatedModules).toContain('no-elevator-delivery');
    });
  });
});

