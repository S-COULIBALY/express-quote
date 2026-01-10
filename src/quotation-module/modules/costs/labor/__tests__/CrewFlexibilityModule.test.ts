import { CrewFlexibilityModule } from '../CrewFlexibilityModule';
import { QuoteContext } from '../../../types/quote-types';
import { createEmptyComputedContext } from '../../../../core/ComputedContext';
import { MODULES_CONFIG } from '../../../../config/modules.config';

describe('CrewFlexibilityModule', () => {
  let module: CrewFlexibilityModule;
  let baseContext: QuoteContext;
  const config = MODULES_CONFIG.labor.FLEXIBILITY_GUARANTEE_COST;

  beforeEach(() => {
    module = new CrewFlexibilityModule();
    baseContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue de Lyon',
      computed: createEmptyComputedContext(),
    };
  });

  describe('isApplicable', () => {
    it('should be applicable if crewFlexibility is true (FLEX scenario)', () => {
      baseContext.crewFlexibility = true;
      expect(module.isApplicable(baseContext)).toBe(true);
    });

    it('should not be applicable if crewFlexibility is false', () => {
      baseContext.crewFlexibility = false;
      expect(module.isApplicable(baseContext)).toBe(false);
    });

    it('should not be applicable if crewFlexibility is undefined', () => {
      baseContext.crewFlexibility = undefined;
      expect(module.isApplicable(baseContext)).toBe(false);
    });

    it('should not be applicable even if volumeMethod is FORM (exclusive to FLEX)', () => {
      baseContext.crewFlexibility = undefined;
      baseContext.volumeMethod = 'FORM';
      expect(module.isApplicable(baseContext)).toBe(false);
    });

    it('should not be applicable even if volumeConfidence is LOW (exclusive to FLEX)', () => {
      baseContext.crewFlexibility = undefined;
      baseContext.volumeConfidence = 'LOW';
      expect(module.isApplicable(baseContext)).toBe(false);
    });
  });

  describe('apply', () => {
    it('should not apply if crewFlexibility is not true', () => {
      baseContext.crewFlexibility = false;
      const result = module.apply(baseContext);

      const cost = result.computed?.costs.find(c => c.moduleId === 'crew-flexibility');
      expect(cost).toBeUndefined();
    });

    it('should apply and add cost if crewFlexibility is true (FLEX scenario)', () => {
      baseContext.crewFlexibility = true;
      const result = module.apply(baseContext);

      const cost = result.computed?.costs.find(c => c.moduleId === 'crew-flexibility');
      expect(cost).toBeDefined();
      expect(cost?.amount).toBe(config);
      expect(cost?.category).toBe('LABOR');
      expect(cost?.label).toBe('Garantie Flexibilité Équipe');
      expect(result.computed?.activatedModules).toContain('crew-flexibility');
    });

    it('should add cross-sell proposal', () => {
      baseContext.crewFlexibility = true;
      const result = module.apply(baseContext);

      const proposal = result.computed?.crossSellProposals.find(
        p => p.id === 'CREW_FLEXIBILITY_GUARANTEE'
      );
      expect(proposal).toBeDefined();
      expect(proposal?.label).toBe('Garantie Flexibilité Équipe');
      expect(proposal?.priceImpact).toBe(config);
      expect(proposal?.optional).toBe(false);
    });

    it('should add operational flag', () => {
      baseContext.crewFlexibility = true;
      const result = module.apply(baseContext);

      expect(result.computed?.operationalFlags).toContain('CREW_FLEXIBILITY_GUARANTEED');
    });

    it('should update computed metadata', () => {
      baseContext.crewFlexibility = true;
      const result = module.apply(baseContext);

      expect(result.computed?.metadata.crewFlexibilityGuarantee).toBe(true);
      expect(result.computed?.metadata.crewFlexibilityCost).toBe(config);
    });

    it('should store correct metadata in cost', () => {
      baseContext.crewFlexibility = true;
      baseContext.volumeMethod = 'FORM';
      const result = module.apply(baseContext);

      const cost = result.computed?.costs.find(c => c.moduleId === 'crew-flexibility');
      expect(cost?.metadata).toMatchObject({
        coverage: ['+1 déménageur si besoin', '+2h de travail', 'Véhicule plus grand si nécessaire'],
        volumeMethod: 'FORM',
      });
    });
  });
});

