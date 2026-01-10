import { InsurancePremiumModule } from '../InsurancePremiumModule';
import { QuoteContext } from '../../types/quote-types';
import { INSURANCE_CONFIG } from '../../../config/insurance.config';

describe('InsurancePremiumModule', () => {
  let module: InsurancePremiumModule;

  beforeEach(() => {
    module = new InsurancePremiumModule();
  });

  describe('isApplicable', () => {
    it('should be applicable when declaredValueInsurance is true and declaredValue is provided', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        declaredValueInsurance: true,
        declaredValue: 10000,
        computed: {
          costs: [],
          adjustments: [],
          riskContributions: [],
          legalImpacts: [],
          insuranceNotes: [],
          requirements: [],
          crossSellProposals: [],
          operationalFlags: [],
          activatedModules: [],
          metadata: {},
        },
      };

      expect(module.isApplicable!(ctx)).toBe(true);
    });

    it('should not be applicable when declaredValueInsurance is false', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        declaredValueInsurance: false,
        declaredValue: 10000,
        computed: {
          costs: [],
          adjustments: [],
          riskContributions: [],
          legalImpacts: [],
          insuranceNotes: [],
          requirements: [],
          crossSellProposals: [],
          operationalFlags: [],
          activatedModules: [],
          metadata: {},
        },
      };

      expect(module.isApplicable!(ctx)).toBe(false);
    });

    it('should not be applicable when declaredValue is missing', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        declaredValueInsurance: true,
        computed: {
          costs: [],
          adjustments: [],
          riskContributions: [],
          legalImpacts: [],
          insuranceNotes: [],
          requirements: [],
          crossSellProposals: [],
          operationalFlags: [],
          activatedModules: [],
          metadata: {},
        },
      };

      expect(module.isApplicable!(ctx)).toBe(false);
    });

    it('should not be applicable when declaredValue is 0', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        declaredValueInsurance: true,
        declaredValue: 0,
        computed: {
          costs: [],
          adjustments: [],
          riskContributions: [],
          legalImpacts: [],
          insuranceNotes: [],
          requirements: [],
          crossSellProposals: [],
          operationalFlags: [],
          activatedModules: [],
          metadata: {},
        },
      };

      expect(module.isApplicable!(ctx)).toBe(false);
    });
  });

  describe('apply method', () => {
    it('should calculate insurance premium for default scenario', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        declaredValueInsurance: true,
        declaredValue: 10000,
        computed: {
          adjustedVolume: 15,
          distanceKm: 100,
          costs: [],
          adjustments: [],
          riskContributions: [],
          legalImpacts: [],
          insuranceNotes: [],
          requirements: [],
          crossSellProposals: [],
          operationalFlags: [],
          activatedModules: ['volume-estimation', 'distance-calculation'],
          metadata: {},
        },
      };

      const result = module.apply(ctx);

      const insuranceCost = result.computed?.costs?.find(c => c.moduleId === 'insurance-premium');
      expect(insuranceCost).toBeDefined();
      expect(insuranceCost?.amount).toBe(100); // 10000 * 0.01 = 100
      expect(insuranceCost?.category).toBe('INSURANCE');
      expect(insuranceCost?.metadata).toMatchObject({
        declaredValue: 10000,
        rate: 0.01,
        rawPremium: 100,
        minPremium: INSURANCE_CONFIG.MIN_PREMIUM,
        maxPremium: INSURANCE_CONFIG.MAX_PREMIUM,
        minApplied: false,
        maxApplied: false,
      });
      expect(result.computed?.activatedModules).toContain('insurance-premium');
    });

    it('should respect minimum premium of 50', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        declaredValueInsurance: true,
        declaredValue: 100, // 100 * 0.01 = 1€, mais min = 50€
        computed: {
          adjustedVolume: 5,
          distanceKm: 20,
          costs: [],
          adjustments: [],
          riskContributions: [],
          legalImpacts: [],
          insuranceNotes: [],
          requirements: [],
          crossSellProposals: [],
          operationalFlags: [],
          activatedModules: ['volume-estimation', 'distance-calculation'],
          metadata: {},
        },
      };

      const result = module.apply(ctx);

      const insuranceCost = result.computed?.costs?.find(c => c.moduleId === 'insurance-premium');
      expect(insuranceCost?.amount).toBe(50); // Minimum appliqué
      expect(insuranceCost?.metadata).toMatchObject({
        declaredValue: 100,
        rawPremium: 1, // 100 * 0.01
        minApplied: true,
        maxApplied: false,
      });
    });

    it('should cap premium at 5000', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        declaredValueInsurance: true,
        declaredValue: 1000000, // 1000000 * 0.01 = 10000€, mais max = 5000€
        computed: {
          adjustedVolume: 100,
          distanceKm: 600,
          costs: [],
          adjustments: [],
          riskContributions: [],
          legalImpacts: [],
          insuranceNotes: [],
          requirements: [],
          crossSellProposals: [],
          operationalFlags: [],
          activatedModules: ['volume-estimation', 'distance-calculation'],
          metadata: {},
        },
      };

      const result = module.apply(ctx);

      const insuranceCost = result.computed?.costs?.find(c => c.moduleId === 'insurance-premium');
      expect(insuranceCost?.amount).toBe(5000); // Maximum appliqué
      expect(insuranceCost?.metadata).toMatchObject({
        declaredValue: 1000000,
        rawPremium: 10000, // 1000000 * 0.01
        minApplied: false,
        maxApplied: true,
      });
    });

    it('should add insurance note', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        declaredValueInsurance: true,
        declaredValue: 10000,
        computed: {
          adjustedVolume: 15,
          distanceKm: 100,
          costs: [],
          adjustments: [],
          riskContributions: [],
          legalImpacts: [],
          insuranceNotes: [],
          requirements: [],
          crossSellProposals: [],
          operationalFlags: [],
          activatedModules: ['volume-estimation', 'distance-calculation'],
          metadata: {},
        },
      };

      const result = module.apply(ctx);

      expect(result.computed?.insuranceNotes?.length).toBeGreaterThan(0);
      expect(result.computed?.insuranceNotes?.[0]).toContain('Assurance Valeur Déclarée');
    });

    it('should preserve existing costs', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        declaredValueInsurance: true,
        declaredValue: 10000,
        computed: {
          adjustedVolume: 15,
          distanceKm: 100,
          costs: [
            {
              moduleId: 'other-module',
              label: 'Other cost',
              amount: 100,
              category: 'TRANSPORT',
            },
          ],
          adjustments: [],
          riskContributions: [],
          legalImpacts: [],
          insuranceNotes: [],
          requirements: [],
          crossSellProposals: [],
          operationalFlags: [],
          activatedModules: ['volume-estimation', 'distance-calculation'],
          metadata: {},
        },
      };

      const result = module.apply(ctx);

      expect(result.computed?.costs?.length).toBe(2);
      expect(result.computed?.costs?.find(c => c.moduleId === 'other-module')).toBeDefined();
      expect(result.computed?.costs?.find(c => c.moduleId === 'insurance-premium')).toBeDefined();
    });

    it('should calculate premium correctly for various declared values', () => {
      const testCases = [
        { declaredValue: 5000, expectedPremium: 50, expectedRaw: 50 }, // Exact minimum
        { declaredValue: 20000, expectedPremium: 200, expectedRaw: 200 }, // Normal case
        { declaredValue: 500000, expectedPremium: 5000, expectedRaw: 5000 }, // Exact maximum
        { declaredValue: 600000, expectedPremium: 5000, expectedRaw: 6000 }, // Above maximum
      ];

      testCases.forEach(({ declaredValue, expectedPremium, expectedRaw }) => {
        const ctx: QuoteContext = {
          serviceType: 'MOVING',
          region: 'IDF',
          declaredValueInsurance: true,
          declaredValue,
          computed: {
            costs: [],
            adjustments: [],
            riskContributions: [],
            legalImpacts: [],
            insuranceNotes: [],
            requirements: [],
            crossSellProposals: [],
            operationalFlags: [],
            activatedModules: [],
            metadata: {},
          },
        };

        const result = module.apply(ctx);
        const insuranceCost = result.computed?.costs?.find(c => c.moduleId === 'insurance-premium');

        expect(insuranceCost?.amount).toBe(expectedPremium);
        expect(insuranceCost?.metadata.rawPremium).toBe(expectedRaw);
      });
    });
  });
});
