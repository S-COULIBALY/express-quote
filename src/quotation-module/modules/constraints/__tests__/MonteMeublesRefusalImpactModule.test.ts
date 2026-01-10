import { MonteMeublesRefusalImpactModule } from '../MonteMeublesRefusalImpactModule';
import { QuoteContext } from '../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';

describe('MonteMeublesRefusalImpactModule', () => {
  let module: MonteMeublesRefusalImpactModule;
  let baseContext: QuoteContext;

  beforeEach(() => {
    module = new MonteMeublesRefusalImpactModule();
    baseContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue de Lyon',
      declaredValue: 20000,
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
    it('should add legal impacts and insurance notes if lift refused', () => {
      baseContext.computed!.requirements = [{
        type: 'LIFT_RECOMMENDED',
        severity: 'HIGH',
        reason: 'Test',
        moduleId: 'monte-meubles-recommendation',
      }];
      baseContext.refuseLiftDespiteRecommendation = true;
      baseContext.declaredValue = 20000;
      
      const result = module.apply(baseContext);

      const liabilityImpact = result.computed?.legalImpacts.find(i => i.type === 'LIABILITY_LIMITATION');
      expect(liabilityImpact).toBeDefined();
      expect(liabilityImpact?.severity).toBe('WARNING');
      expect(liabilityImpact?.message).toContain('Responsabilité limitée');

      const insuranceImpact = result.computed?.legalImpacts.find(i => i.type === 'INSURANCE_CAP');
      expect(insuranceImpact).toBeDefined();
      expect(insuranceImpact?.message).toContain('Assurance plafonnée');

      expect(result.computed?.insuranceNotes.length).toBeGreaterThan(0);
      expect(result.computed?.operationalFlags).toContain('LIFT_REFUSAL_LEGAL_IMPACT');
      expect(result.computed?.activatedModules).toContain('monte-meubles-refusal-impact');
    });

    it('should add risk contribution when lift refused', () => {
      baseContext.computed!.requirements = [{
        type: 'LIFT_RECOMMENDED',
        severity: 'HIGH',
        reason: 'Test',
        moduleId: 'monte-meubles-recommendation',
      }];
      baseContext.refuseLiftDespiteRecommendation = true;
      
      const result = module.apply(baseContext);

      const riskContribution = result.computed?.riskContributions.find(r => 
        r.moduleId === 'monte-meubles-refusal-impact'
      );
      expect(riskContribution).toBeDefined();
      expect(riskContribution?.amount).toBe(25);
    });
  });
});

