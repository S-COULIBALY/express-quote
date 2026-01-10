import { VolumeUncertaintyRiskModule } from '../VolumeUncertaintyRiskModule';
import { QuoteContext } from '../../types/quote-types';

describe('VolumeUncertaintyRiskModule', () => {
  let module: VolumeUncertaintyRiskModule;
  let baseContext: QuoteContext;

  beforeEach(() => {
    module = new VolumeUncertaintyRiskModule();
    baseContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      movingDate: '2025-03-15T00:00:00Z',
      housingType: 'F3',
      surface: 65,
      volumeConfidence: 'MEDIUM',
      departureAddress: '123 Rue Test, 75001 Paris',
      arrivalAddress: '456 Avenue Test, 75002 Paris',
      computed: {
        baseVolume: 30,
        adjustedVolume: 33, // +10% pour MEDIUM confidence
        costs: [],
        adjustments: [],
        riskContributions: [],
        legalImpacts: [],
        insuranceNotes: [],
        requirements: [],
        crossSellProposals: [],
        operationalFlags: [],
        activatedModules: ['volume-estimation'],
        metadata: {},
      },
    };
  });

  describe('isApplicable', () => {
    it('should be applicable when volume is calculated', () => {
      expect(module.isApplicable!(baseContext)).toBe(true);
    });

    it('should not be applicable when volume is not calculated', () => {
      const ctx: QuoteContext = {
        ...baseContext,
        computed: {
          ...baseContext.computed!,
          baseVolume: undefined,
        },
      };
      expect(module.isApplicable!(ctx)).toBe(false);
    });
  });

  describe('Nominal cases', () => {
    it('should calculate low risk when volumes are similar', () => {
      const ctx: QuoteContext = {
        ...baseContext,
        computed: {
          ...baseContext.computed!,
          baseVolume: 30,
          adjustedVolume: 30, // Pas de différence
        },
      };

      const result = module.apply(ctx);
      
      const riskContribution = result.computed?.riskContributions?.find(
        r => r.moduleId === 'volume-uncertainty-risk'
      );
      expect(riskContribution).toBeDefined();
      expect(riskContribution?.amount).toBeLessThanOrEqual(8); // MEDIUM confidence = 8
    });

    it('should calculate medium risk for significant volume differences', () => {
      const ctx: QuoteContext = {
        ...baseContext,
        volumeConfidence: 'MEDIUM',
        computed: {
          ...baseContext.computed!,
          baseVolume: 30,
          adjustedVolume: 36, // +20% différence
        },
      };

      const result = module.apply(ctx);
      
      const riskContribution = result.computed?.riskContributions?.find(
        r => r.moduleId === 'volume-uncertainty-risk'
      );
      expect(riskContribution).toBeDefined();
      expect(riskContribution?.amount).toBeGreaterThan(8); // MEDIUM (8) + différence (5) = 13
    });

    it('should calculate high risk for LOW confidence', () => {
      const ctx: QuoteContext = {
        ...baseContext,
        volumeConfidence: 'LOW',
        computed: {
          ...baseContext.computed!,
          baseVolume: 30,
          adjustedVolume: 36, // +20% différence
        },
      };

      const result = module.apply(ctx);
      
      const riskContribution = result.computed?.riskContributions?.find(
        r => r.moduleId === 'volume-uncertainty-risk'
      );
      expect(riskContribution).toBeDefined();
      expect(riskContribution?.amount).toBeGreaterThanOrEqual(15); // LOW = 15 minimum
    });

    it('should calculate low risk for HIGH confidence', () => {
      const ctx: QuoteContext = {
        ...baseContext,
        volumeConfidence: 'HIGH',
        computed: {
          ...baseContext.computed!,
          baseVolume: 30,
          adjustedVolume: 31.5, // +5% différence
        },
      };

      const result = module.apply(ctx);
      
      const riskContribution = result.computed?.riskContributions?.find(
        r => r.moduleId === 'volume-uncertainty-risk'
      );
      expect(riskContribution).toBeDefined();
      expect(riskContribution?.amount).toBeLessThanOrEqual(3); // HIGH = 3
    });
  });

  describe('Edge cases', () => {
    it('should handle zero base volume', () => {
      const ctx: QuoteContext = {
        ...baseContext,
        computed: {
          ...baseContext.computed!,
          baseVolume: 0,
          adjustedVolume: 0,
        },
      };

      const result = module.apply(ctx);
      
      const riskContribution = result.computed?.riskContributions?.find(
        r => r.moduleId === 'volume-uncertainty-risk'
      );
      // Devrait quand même calculer un risque basé sur la confiance
      expect(riskContribution).toBeDefined();
    });

    it('should cap risk score at 30', () => {
      const ctx: QuoteContext = {
        ...baseContext,
        volumeConfidence: 'LOW',
        computed: {
          ...baseContext.computed!,
          baseVolume: 30,
          adjustedVolume: 60, // +100% différence
        },
      };

      const result = module.apply(ctx);
      
      const riskContribution = result.computed?.riskContributions?.find(
        r => r.moduleId === 'volume-uncertainty-risk'
      );
      expect(riskContribution?.amount).toBeLessThanOrEqual(30);
    });
  });

  describe('Traceability', () => {
    it('should add module to activatedModules', () => {
      const result = module.apply(baseContext);
      
      expect(result.computed?.activatedModules).toContain('volume-uncertainty-risk');
    });

    it('should add risk contribution with metadata', () => {
      const result = module.apply(baseContext);
      
      const riskContribution = result.computed?.riskContributions?.find(
        r => r.moduleId === 'volume-uncertainty-risk'
      );
      expect(riskContribution).toBeDefined();
      expect(riskContribution?.reason).toBeDefined();
      expect(riskContribution?.metadata).toBeDefined();
    });
  });
});
