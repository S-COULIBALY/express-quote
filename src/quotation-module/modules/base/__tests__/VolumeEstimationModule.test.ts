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
      housingType: 'F3',
      surface: 65,
      rooms: 3,
      volumeMethod: 'FORM',
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

  describe('calculateSpecialItemsVolume', () => {
    it('should calculate volume for special items', () => {
      const ctx: QuoteContext = {
        ...baseContext,
        piano: true,
        bulkyFurniture: true,
      };
      const result = module['calculateSpecialItemsVolume'](ctx);
      const expectedVolume = volumeConfig.SPECIAL_ITEMS_VOLUME.PIANO + volumeConfig.SPECIAL_ITEMS_VOLUME.BULKY_FURNITURE;
      expect(result.volume).toBe(expectedVolume);
      expect(result.items).toHaveLength(2);
      expect(result.items).toContain(`Piano: +${volumeConfig.SPECIAL_ITEMS_VOLUME.PIANO} m³`);
      expect(result.items).toContain(`Meubles encombrants: +${volumeConfig.SPECIAL_ITEMS_VOLUME.BULKY_FURNITURE} m³`);
    });

    it('should return 0 for no special items', () => {
      const result = module['calculateSpecialItemsVolume'](baseContext);
      expect(result.volume).toBe(0);
      expect(result.items).toHaveLength(0);
    });
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

    it('should handle VIDEO volume method', () => {
      const ctx: QuoteContext = {
        ...baseContext,
        volumeMethod: 'VIDEO',
        estimatedVolume: 35,
        volumeConfidence: 'HIGH',
      };
      const result = module.apply(ctx);

      expect(result.computed?.adjustedVolume).toBeDefined();
      expect(result.computed?.metadata?.volumeMethod).toBe('VIDEO');
    });

    it('should handle LIST volume method', () => {
      const ctx: QuoteContext = {
        ...baseContext,
        volumeMethod: 'LIST',
        estimatedVolume: 28,
        volumeConfidence: 'MEDIUM',
      };
      const result = module.apply(ctx);

      expect(result.computed?.adjustedVolume).toBeDefined();
      expect(result.computed?.metadata?.volumeMethod).toBe('LIST');
    });

    it('should add special items volume when not provided', () => {
      const ctx: QuoteContext = {
        ...baseContext,
        piano: true,
        bulkyFurniture: true,
      };
      const result = module.apply(ctx);

      expect(result.computed?.baseVolume).toBeGreaterThan(0);
      // Volume devrait inclure piano (8) + bulky (5) = 13 m³ additionnels
    });

    it('should include validation thresholds in metadata', () => {
      const result = module.apply(baseContext);

      expect(result.computed?.metadata?.validationThresholds).toBeDefined();
      expect(result.computed?.metadata?.validationThresholds?.criticalUnderestimate).toBe(volumeConfig.VOLUME_VALIDATION_THRESHOLDS.CRITICAL_UNDERESTIMATE);
      expect(result.computed?.metadata?.validationThresholds?.mediumUnderestimate).toBe(volumeConfig.VOLUME_VALIDATION_THRESHOLDS.MEDIUM_UNDERESTIMATE);
      expect(result.computed?.metadata?.validationThresholds?.overestimate).toBe(volumeConfig.VOLUME_VALIDATION_THRESHOLDS.OVERESTIMATE);
    });

    it('should include safety margins in metadata', () => {
      const result = module.apply(baseContext);

      expect(result.computed?.metadata?.safetyMargins).toBeDefined();
      expect(result.computed?.metadata?.safetyMargins?.critical).toBe(volumeConfig.SAFETY_MARGINS.CRITICAL);
      expect(result.computed?.metadata?.safetyMargins?.medium).toBe(volumeConfig.SAFETY_MARGINS.MEDIUM);
    });

    it('should include confidence adjustment details in metadata', () => {
      const ctx: QuoteContext = {
        ...baseContext,
        volumeMethod: 'FORM',
        volumeConfidence: 'MEDIUM',
      };
      const result = module.apply(ctx);

      expect(result.computed?.metadata?.confidenceAdjustment).toBeDefined();
      expect(result.computed?.metadata?.confidenceAdjustment?.method).toBe('FORM');
      expect(result.computed?.metadata?.confidenceAdjustment?.confidence).toBe('MEDIUM');
      expect(result.computed?.metadata?.confidenceAdjustment?.factor).toBeDefined();
      expect(result.computed?.metadata?.confidenceAdjustment?.adjustmentPercentage).toBeDefined();
    });

    it('should apply critical safety margin for severe underestimation', () => {
      const ctx: QuoteContext = {
        ...baseContext,
        surface: 100, // Volume théorique ~45 m³ (100 * 0.45)
        estimatedVolume: 20, // Sous-estimation de ~55% (>30%)
      };
      const result = module.apply(ctx);

      // Le volume devrait être corrigé avec marge critique
      expect(result.computed?.metadata?.safetyMarginApplied).toBe(volumeConfig.SAFETY_MARGINS.CRITICAL);
      expect(result.computed?.metadata?.volumeValidationApplied).toBe(true);
      expect(result.computed?.manualReviewRequired).toBe(true);
    });

    it('should apply medium safety margin for moderate underestimation', () => {
      const ctx: QuoteContext = {
        ...baseContext,
        surface: 100, // Volume théorique ~45 m³
        estimatedVolume: 30, // Sous-estimation de ~33% (15-30%)
      };
      const result = module.apply(ctx);

      // Le volume devrait être corrigé avec marge moyenne
      expect(result.computed?.metadata?.safetyMarginApplied).toBe(volumeConfig.SAFETY_MARGINS.MEDIUM);
      expect(result.computed?.metadata?.volumeValidationApplied).toBe(true);
    });

    it('should use user volume when difference is small', () => {
      const ctx: QuoteContext = {
        ...baseContext,
        surface: 100, // Volume théorique ~45 m³
        estimatedVolume: 43, // Écart de ~4% (<15%)
      };
      const result = module.apply(ctx);

      // Le volume fourni devrait être utilisé sans marge
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
