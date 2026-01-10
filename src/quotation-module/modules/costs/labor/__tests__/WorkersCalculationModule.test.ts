import { WorkersCalculationModule } from '../WorkersCalculationModule';
import { QuoteContext } from '../../types/quote-types';
import { MODULES_CONFIG } from '../../../config/modules.config';

describe('WorkersCalculationModule', () => {
  let module: WorkersCalculationModule;
  let baseContext: QuoteContext;
  const laborConfig = MODULES_CONFIG.labor;
  const distanceConfig = MODULES_CONFIG.distance;

  beforeEach(() => {
    module = new WorkersCalculationModule();
    baseContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      movingDate: '2025-03-15T00:00:00Z',
      housingType: 'F3',
      surface: 65,
      departureAddress: '123 Rue Test, 75001 Paris',
      arrivalAddress: '456 Avenue Test, 75002 Paris',
      computed: {
        adjustedVolume: 25,
        distanceKm: 50,
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

  describe('Base worker count calculation (volume / 5 m³)', () => {
    it('calculates workers based on volume / 5 m³ with standard rounding', () => {
      const testCases = [
        { volume: 5, expected: 1 },   // 5 / 5 = 1.0 → 1 (exact)
        { volume: 10, expected: 2 },   // 10 / 5 = 2.0 → 2 (exact)
        { volume: 12, expected: 2 },   // 12 / 5 = 2.4 → 2 (arrondi à l'inférieur, < 0.5)
        { volume: 13, expected: 3 },   // 13 / 5 = 2.6 → 3 (arrondi au supérieur, > 0.5)
        { volume: 25, expected: 5 },   // 25 / 5 = 5.0 → 5 (exact)
        { volume: 30, expected: 6 },   // 30 / 5 = 6.0 → 6 (exact)
        { volume: 27, expected: 5 },   // 27 / 5 = 5.4 → 5 (arrondi à l'inférieur, < 0.5)
        { volume: 28, expected: 6 },   // 28 / 5 = 5.6 → 6 (arrondi au supérieur, > 0.5)
      ];

      testCases.forEach(({ volume, expected }) => {
        const context: QuoteContext = {
          ...baseContext,
          computed: {
            ...baseContext.computed!,
            adjustedVolume: volume,
          },
        };
        const result = module.apply(context);
        expect(result.computed?.workersCount).toBe(expected);
        expect(result.computed?.metadata?.baseWorkers).toBe(expected);
      });
    });
  });

  describe('No cap applied', () => {
    it('calculates workers without cap for large volumes', () => {
      const largeVolumeContext: QuoteContext = {
        ...baseContext,
        computed: {
          ...baseContext.computed!,
          adjustedVolume: 35, // 35 / 5 = 7 déménageurs
        },
      };
      const result = module.apply(largeVolumeContext);
      expect(result.computed?.workersCount).toBe(7);
      expect(result.computed?.metadata?.baseWorkers).toBe(7);
    });
  });

  describe('evaluateWorkforceComplexity', () => {
    it('returns LOW complexity for 2 workers', () => {
      const complexity = module['evaluateWorkforceComplexity'](2);
      expect(complexity).toBe('LOW');
    });

    it('returns MEDIUM complexity for 3 workers', () => {
      const complexity = module['evaluateWorkforceComplexity'](3);
      expect(complexity).toBe('MEDIUM');
    });

    it('returns HIGH complexity for 4+ workers', () => {
      const complexity = module['evaluateWorkforceComplexity'](4);
      expect(complexity).toBe('HIGH');
    });
  });

  describe('apply method', () => {
    it('correctly updates quote context with workers count', () => {
      const updatedContext = module.apply(baseContext);
      
      expect(updatedContext.computed?.workersCount).toBeDefined();
      expect(updatedContext.computed?.workersCount).toBeGreaterThanOrEqual(2);
      expect(updatedContext.computed?.activatedModules).toContain('workers-calculation');
    });

    it('uses default workers count from config if volume not available', () => {
      const noVolumeContext: QuoteContext = {
        ...baseContext,
        computed: {
          ...baseContext.computed!,
          adjustedVolume: undefined,
        },
      };

      const result = module.apply(noVolumeContext);
      
      expect(result.computed?.workersCount).toBe(laborConfig.DEFAULT_WORKERS_COUNT);
      expect(result.computed?.metadata?.baseWorkers).toBe(laborConfig.DEFAULT_WORKERS_COUNT);
      expect(result.computed?.activatedModules).toContain('workers-calculation');
    });

    it('preserves existing computed fields', () => {
      const result = module.apply(baseContext);
      
      expect(result.computed?.adjustedVolume).toBe(25);
      expect(result.computed?.distanceKm).toBe(50);
    });

    it('includes metadata with baseWorkers and volumePerWorker', () => {
      const result = module.apply(baseContext);
      
      expect(result.computed?.metadata?.baseWorkers).toBe(5); // 25 / 5 = 5
      expect(result.computed?.metadata?.volumePerWorker).toBe(laborConfig.VOLUME_PER_WORKER);
      expect(result.computed?.metadata?.workforceComplexity).toBeDefined();
    });
  });

  describe('Scenario-based adjustments', () => {
    it('applies ECO scenario: maximum 2 workers', () => {
      const ecoContext: QuoteContext = {
        ...baseContext,
        metadata: {
          scenarioId: 'ECO',
        },
        computed: {
          ...baseContext.computed!,
          adjustedVolume: 25, // 25 / 5 = 5 déménageurs de base
        },
      };

      const result = module.apply(ecoContext);
      
      // Devrait être plafonné à 2
      expect(result.computed?.workersCount).toBe(laborConfig.SCENARIO_RULES.ECO_MAX_WORKERS);
      expect(result.computed?.metadata?.baseWorkers).toBe(5);
      expect(result.computed?.metadata?.scenarioId).toBe('ECO');
      expect(result.computed?.metadata?.scenarioAdjustment).toBeDefined();
      expect(result.computed?.metadata?.scenarioAdjustment?.type).toBe('ECO_MAX_LIMIT');
      expect(result.computed?.metadata?.scenarioAdjustment?.final).toBe(2);
    });

    it('does not apply ECO limit if base workers <= 2', () => {
      const ecoContext: QuoteContext = {
        ...baseContext,
        metadata: {
          scenarioId: 'ECO',
        },
        computed: {
          ...baseContext.computed!,
          adjustedVolume: 10, // 10 / 5 = 2 déménageurs de base
        },
      };

      const result = module.apply(ecoContext);
      
      // Ne devrait pas être ajusté car déjà <= 2
      expect(result.computed?.workersCount).toBe(2);
      expect(result.computed?.metadata?.baseWorkers).toBe(2);
      expect(result.computed?.metadata?.scenarioId).toBe('ECO');
      expect(result.computed?.metadata?.scenarioAdjustment).toBeNull();
    });

    it('applies STANDARD scenario: half of calculated workers with standard rounding', () => {
      const standardContext: QuoteContext = {
        ...baseContext,
        metadata: {
          scenarioId: 'STANDARD',
        },
        computed: {
          ...baseContext.computed!,
          adjustedVolume: 25, // 25 / 5 = 5.0 → 5 déménageurs de base (exact)
        },
      };

      const result = module.apply(standardContext);
      
      // Devrait être la moitié : 5 × 0.5 = 2.5 → 3 (arrondi au supérieur, >= 0.5)
      const expectedWorkers = Math.round(5 * laborConfig.SCENARIO_RULES.STANDARD_WORKERS_FACTOR);
      expect(result.computed?.workersCount).toBe(expectedWorkers);
      expect(result.computed?.metadata?.baseWorkers).toBe(5);
      expect(result.computed?.metadata?.scenarioId).toBe('STANDARD');
      expect(result.computed?.metadata?.scenarioAdjustment).toBeDefined();
      expect(result.computed?.metadata?.scenarioAdjustment?.type).toBe('STANDARD_HALF');
      expect(result.computed?.metadata?.scenarioAdjustment?.final).toBe(expectedWorkers);
    });

    it('applies STANDARD scenario correctly for even number of workers', () => {
      const standardContext: QuoteContext = {
        ...baseContext,
        metadata: {
          scenarioId: 'STANDARD',
        },
        computed: {
          ...baseContext.computed!,
          adjustedVolume: 30, // 30 / 5 = 6.0 → 6 déménageurs de base (exact)
        },
      };

      const result = module.apply(standardContext);
      
      // Devrait être la moitié : 6 × 0.5 = 3.0 → 3 (exact)
      const expectedWorkers = Math.round(6 * laborConfig.SCENARIO_RULES.STANDARD_WORKERS_FACTOR);
      expect(result.computed?.workersCount).toBe(expectedWorkers);
      expect(result.computed?.metadata?.baseWorkers).toBe(6);
      expect(result.computed?.metadata?.scenarioAdjustment?.final).toBe(3);
    });

    it('applies STANDARD scenario with rounding up when decimal >= 0.5', () => {
      const standardContext: QuoteContext = {
        ...baseContext,
        metadata: {
          scenarioId: 'STANDARD',
        },
        computed: {
          ...baseContext.computed!,
          adjustedVolume: 24, // 24 / 5 = 4.8 → 5 déménageurs de base (arrondi au supérieur)
        },
      };

      const result = module.apply(standardContext);
      
      // 5 × 0.5 = 2.5 → 3 (arrondi au supérieur, >= 0.5)
      const expectedWorkers = Math.round(5 * laborConfig.SCENARIO_RULES.STANDARD_WORKERS_FACTOR);
      expect(result.computed?.workersCount).toBe(expectedWorkers);
      expect(result.computed?.metadata?.baseWorkers).toBe(5);
    });

    it('applies STANDARD scenario with rounding down when decimal < 0.5', () => {
      const standardContext: QuoteContext = {
        ...baseContext,
        metadata: {
          scenarioId: 'STANDARD',
        },
        computed: {
          ...baseContext.computed!,
          adjustedVolume: 22, // 22 / 5 = 4.4 → 4 déménageurs de base (arrondi à l'inférieur)
        },
      };

      const result = module.apply(standardContext);
      
      // 4 × 0.5 = 2.0 → 2 (exact)
      const expectedWorkers = Math.round(4 * laborConfig.SCENARIO_RULES.STANDARD_WORKERS_FACTOR);
      expect(result.computed?.workersCount).toBe(expectedWorkers);
      expect(result.computed?.metadata?.baseWorkers).toBe(4);
    });

    it('does not apply scenario adjustments when no scenario is provided', () => {
      const noScenarioContext: QuoteContext = {
        ...baseContext,
        metadata: {},
        computed: {
          ...baseContext.computed!,
          adjustedVolume: 25, // 25 / 5 = 5 déménageurs
        },
      };

      const result = module.apply(noScenarioContext);
      
      // Devrait utiliser le calcul normal sans ajustement
      expect(result.computed?.workersCount).toBe(5);
      expect(result.computed?.metadata?.baseWorkers).toBe(5);
      expect(result.computed?.metadata?.scenarioId).toBeNull();
      expect(result.computed?.metadata?.scenarioAdjustment).toBeNull();
    });
  });
});
