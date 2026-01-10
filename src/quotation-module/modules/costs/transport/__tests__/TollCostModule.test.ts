import { TollCostModule } from '../TollCostModule';
import { QuoteContext } from '../../../types/quote-types';
import { createEmptyComputedContext } from '../../../../core/ComputedContext';
import { MODULES_CONFIG } from '../../../../config/modules.config';

describe('TollCostModule', () => {
  let module: TollCostModule;
  let baseContext: QuoteContext;
  const distanceConfig = MODULES_CONFIG.distance;
  const tollsConfig = MODULES_CONFIG.tolls;

  beforeEach(() => {
    module = new TollCostModule();
    baseContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue de Lyon',
      computed: createEmptyComputedContext(),
    };
  });

  describe('apply', () => {
    it('should add toll cost for long distance', () => {
      baseContext.computed!.distanceKm = 100;
      baseContext.computed!.isLongDistance = true;
      const result = module.apply(baseContext);

      const tollCost = result.computed?.costs.find(c => c.moduleId === 'toll-cost');
      expect(tollCost).toBeDefined();
      const expectedHighwayDistance = 100 * tollsConfig.HIGHWAY_PERCENTAGE; // 100 × 70% = 70 km
      const expectedCost = expectedHighwayDistance * tollsConfig.COST_PER_KM; // 70 × 0.08 = 5.60€
      expect(tollCost?.amount).toBeCloseTo(expectedCost, 2);
      expect(tollCost?.category).toBe('TRANSPORT');
      expect(tollCost?.label).toBe('Péages (longue distance)');
      expect(tollCost?.metadata).toMatchObject({
        distanceKm: 100,
        estimatedHighwayDistance: expectedHighwayDistance,
        tollCostPerKm: tollsConfig.COST_PER_KM,
        highwayPercentage: tollsConfig.HIGHWAY_PERCENTAGE * 100,
      });
      expect(result.computed?.activatedModules).toContain('toll-cost');
    });

    it('should calculate toll cost based on estimated highway distance', () => {
      baseContext.computed!.distanceKm = 200;
      baseContext.computed!.isLongDistance = true;
      const result = module.apply(baseContext);

      const tollCost = result.computed?.costs.find(c => c.moduleId === 'toll-cost');
      const expectedHighwayDistance = 200 * tollsConfig.HIGHWAY_PERCENTAGE; // 200 × 70% = 140 km
      const expectedCost = expectedHighwayDistance * tollsConfig.COST_PER_KM; // 140 × 0.08 = 11.20€
      expect(tollCost?.amount).toBeCloseTo(expectedCost, 2);
      expect(tollCost?.metadata?.estimatedHighwayDistance).toBeCloseTo(expectedHighwayDistance, 2);
    });

    it('should not apply if not long distance', () => {
      baseContext.computed!.distanceKm = 45;
      baseContext.computed!.isLongDistance = false;
      const result = module.apply(baseContext);

      const tollCost = result.computed?.costs.find(c => c.moduleId === 'toll-cost');
      expect(tollCost).toBeUndefined();
    });
  });
});

