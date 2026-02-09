import { VolumeEstimationModule } from '../VolumeEstimationModule';
import { QuoteContext } from '../../types/quote-types';
import { MODULES_CONFIG } from '../../../config/modules.config';

describe('VolumeEstimationModule', () => {
  let module: VolumeEstimationModule;
  let baseContext: QuoteContext;
  const volumeConfig = MODULES_CONFIG.volume;

  beforeEach(() => {
    module = new VolumeEstimationModule();
    baseContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      movingDate: '2025-03-15T00:00:00Z',
      volumeMethod: 'FORM',
      estimatedVolume: 35,
      volumeConfidence: 'MEDIUM',
      departureAddress: '123 Rue Test, 75001 Paris',
      arrivalAddress: '456 Avenue Test, 75002 Paris',
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
  });

  describe('apply method', () => {
    it('should update quote context with volume calculations', () => {
      const result = module.apply(baseContext);

      expect(result.computed?.baseVolume).toBeDefined();
      expect(result.computed?.baseVolume).toBeGreaterThan(0);
      expect(result.computed?.adjustedVolume).toBeDefined();
      expect(result.computed?.adjustedVolume).toBeGreaterThan(0);
      expect(result.computed?.metadata?.volumeConfidenceScore).toBeDefined();
    });

    it('should add module to activatedModules', () => {
      const result = module.apply(baseContext);

      expect(result.computed?.activatedModules).toContain('volume-estimation');
    });

    it('should handle context with user provided volume', () => {
      const ctx: QuoteContext = {
        ...baseContext,
        estimatedVolume: 30,
        volumeConfidence: 'HIGH',
      };
      const result = module.apply(ctx);

      expect(result.computed?.adjustedVolume).toBeDefined();
      expect(result.computed?.adjustedVolume).toBeGreaterThan(0);
    });

    it('should always use FORM volume method in metadata', () => {
      const ctx: QuoteContext = {
        ...baseContext,
        estimatedVolume: 35,
        volumeConfidence: 'HIGH',
      };
      const result = module.apply(ctx);

      expect(result.computed?.adjustedVolume).toBeDefined();
      expect(result.computed?.metadata?.volumeMethod).toBe('FORM');
    });

    it('should use fallback volume when not provided', () => {
      const ctx: QuoteContext = {
        ...baseContext,
        estimatedVolume: undefined,
        piano: true,
        bulkyFurniture: true,
      };
      const result = module.apply(ctx);

      expect(result.computed?.baseVolume).toBeGreaterThan(0);
      // Fallback F3 = 20 m³ (pas d'ajout d'objets spéciaux côté backend)
    });

    it('should include confidence adjustment details in metadata', () => {
      const ctx: QuoteContext = {
        ...baseContext,
        estimatedVolume: 30,
        volumeConfidence: 'MEDIUM',
      };
      const result = module.apply(ctx);

      expect(result.computed?.metadata?.confidenceAdjustment).toBeDefined();
      expect(result.computed?.metadata?.confidenceAdjustment?.method).toBe('FORM');
      expect(result.computed?.metadata?.confidenceAdjustment?.confidence).toBe('MEDIUM');
      expect(result.computed?.metadata?.confidenceAdjustment?.factor).toBeDefined();
      expect(result.computed?.metadata?.confidenceAdjustment?.adjustmentPercentage).toBeDefined();
    });

    it('should use user volume with minimal margin (V3 calculator)', () => {
      const ctx: QuoteContext = {
        ...baseContext,
        estimatedVolume: 43,
      };
      const result = module.apply(ctx);

      expect(result.computed?.baseVolume).toBe(43);
      expect(result.computed?.metadata?.safetyMarginApplied).toBeNull();
      expect(result.computed?.metadata?.volumeValidationApplied).toBe(false);
    });
  });

  describe('calculateConfidenceScore', () => {
    it('should calculate confidence score with HIGH confidence', () => {
      const ctx: QuoteContext = {
        ...baseContext,
        volumeConfidence: 'HIGH',
        estimatedVolume: 30,
      };

      const result = module['calculateConfidenceScore'](ctx);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should calculate confidence score with LOW confidence', () => {
      const ctx: QuoteContext = {
        ...baseContext,
        volumeConfidence: 'LOW',
      };

      const result = module['calculateConfidenceScore'](ctx);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });
});
