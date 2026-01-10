import { HighMileageFuelAdjustmentModule } from '../HighMileageFuelAdjustmentModule';
import { QuoteContext } from '../../../types/quote-types';
import { createEmptyComputedContext } from '../../../../core/ComputedContext';
import { MODULES_CONFIG } from '../../../../config/modules.config';

describe('HighMileageFuelAdjustmentModule', () => {
  let module: HighMileageFuelAdjustmentModule;
  let baseContext: QuoteContext;
  const threshold = MODULES_CONFIG.distance.LONG_DISTANCE_THRESHOLD_KM; // 50 km

  beforeEach(() => {
    module = new HighMileageFuelAdjustmentModule();
    baseContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue de Lyon',
      computed: createEmptyComputedContext(),
    };
  });

  describe('apply', () => {
    describe('conditions d\'application', () => {
      it('should not apply if distance is below threshold', () => {
        baseContext.computed!.distanceKm = 45;
        baseContext.computed!.isLongDistance = false;
        const result = module.apply(baseContext);

        const adjustmentCost = result.computed?.costs.find(c => c.moduleId === 'high-mileage-fuel-adjustment');
        expect(adjustmentCost).toBeUndefined();
      });

      it('should not apply if distance equals threshold', () => {
        baseContext.computed!.distanceKm = threshold;
        baseContext.computed!.isLongDistance = true;
        const result = module.apply(baseContext);

        const adjustmentCost = result.computed?.costs.find(c => c.moduleId === 'high-mileage-fuel-adjustment');
        expect(adjustmentCost).toBeUndefined();
      });

      it('should not apply if isLongDistance is false', () => {
        baseContext.computed!.distanceKm = 100;
        baseContext.computed!.isLongDistance = false;
        const result = module.apply(baseContext);

        const adjustmentCost = result.computed?.costs.find(c => c.moduleId === 'high-mileage-fuel-adjustment');
        expect(adjustmentCost).toBeUndefined();
      });

      it('should apply if long distance detected', () => {
        baseContext.computed!.distanceKm = 100;
        baseContext.computed!.isLongDistance = true;
        const result = module.apply(baseContext);

        const adjustmentCost = result.computed?.costs.find(c => c.moduleId === 'high-mileage-fuel-adjustment');
        expect(adjustmentCost).toBeDefined();
        expect(adjustmentCost?.category).toBe('TRANSPORT');
        expect(adjustmentCost?.label).toBe('Ajustement carburant longue distance');
        expect(result.computed?.activatedModules).toContain('high-mileage-fuel-adjustment');
      });
    });

    describe('tarification progressive - tranche 1 uniquement (0-200 km excédentaire)', () => {
      it('should calculate correct cost for 100 km total (50 km excess) - tranche 1', () => {
        baseContext.computed!.distanceKm = 100;
        baseContext.computed!.isLongDistance = true;
        const result = module.apply(baseContext);

        const adjustmentCost = result.computed?.costs.find(c => c.moduleId === 'high-mileage-fuel-adjustment');
        const expectedCost = 50 * 0.15; // 50 km × 0.15€/km (tranche 1)
        expect(adjustmentCost?.amount).toBeCloseTo(expectedCost, 2);
        expect(adjustmentCost?.amount).toBe(7.50);
      });

      it('should calculate correct cost for 150 km total (100 km excess) - tranche 1', () => {
        baseContext.computed!.distanceKm = 150;
        baseContext.computed!.isLongDistance = true;
        const result = module.apply(baseContext);

        const adjustmentCost = result.computed?.costs.find(c => c.moduleId === 'high-mileage-fuel-adjustment');
        const expectedCost = 100 * 0.15; // 100 km × 0.15€/km (tranche 1)
        expect(adjustmentCost?.amount).toBeCloseTo(expectedCost, 2);
        expect(adjustmentCost?.amount).toBe(15.00);
      });

      it('should calculate correct cost for exactly 200 km excess (frontière tranche 1)', () => {
        baseContext.computed!.distanceKm = threshold + 200; // 250 km total
        baseContext.computed!.isLongDistance = true;
        const result = module.apply(baseContext);

        const adjustmentCost = result.computed?.costs.find(c => c.moduleId === 'high-mileage-fuel-adjustment');
        const expectedCost = 200 * 0.15; // 200 km × 0.15€/km (tranche 1 uniquement)
        expect(adjustmentCost?.amount).toBeCloseTo(expectedCost, 2);
        expect(adjustmentCost?.amount).toBe(30.00);
      });
    });

    describe('tarification progressive - deux tranches (200-1000 km excédentaire)', () => {
      it('should calculate correct cost for 500 km total (450 km excess) - tranche 1 + tranche 2', () => {
        baseContext.computed!.distanceKm = 500;
        baseContext.computed!.isLongDistance = true;
        const result = module.apply(baseContext);

        const adjustmentCost = result.computed?.costs.find(c => c.moduleId === 'high-mileage-fuel-adjustment');
        // Tranche 1 : 200 km × 0.15€/km = 30€
        // Tranche 2 : 250 km × 0.20€/km = 50€
        // Total : 80€
        const expectedCost = (200 * 0.15) + (250 * 0.20);
        expect(adjustmentCost?.amount).toBeCloseTo(expectedCost, 2);
        expect(adjustmentCost?.amount).toBe(80.00);

        // Vérifier les métadonnées
        expect(adjustmentCost?.metadata).toBeDefined();
        expect(adjustmentCost?.metadata.excessDistance).toBe(450);
        expect(adjustmentCost?.metadata.wasCapped).toBe(false);
        expect(adjustmentCost?.metadata.breakdown).toHaveLength(2);
        expect(adjustmentCost?.metadata.breakdown[0].km).toBe(200);
        expect(adjustmentCost?.metadata.breakdown[0].rate).toBe(0.15);
        expect(adjustmentCost?.metadata.breakdown[1].km).toBe(250);
        expect(adjustmentCost?.metadata.breakdown[1].rate).toBe(0.20);
      });

      it('should calculate correct cost for 1000 km total (950 km excess) - tranche 1 + tranche 2', () => {
        baseContext.computed!.distanceKm = 1000;
        baseContext.computed!.isLongDistance = true;
        const result = module.apply(baseContext);

        const adjustmentCost = result.computed?.costs.find(c => c.moduleId === 'high-mileage-fuel-adjustment');
        // Tranche 1 : 200 km × 0.15€/km = 30€
        // Tranche 2 : 750 km × 0.20€/km = 150€
        // Total : 180€
        const expectedCost = (200 * 0.15) + (750 * 0.20);
        expect(adjustmentCost?.amount).toBeCloseTo(expectedCost, 2);
        expect(adjustmentCost?.amount).toBe(180.00);
      });
    });

    describe('plafond (max 1000 km excédentaire)', () => {
      it('should apply cap for 2000 km total (1950 km excess → capped at 1000 km)', () => {
        baseContext.computed!.distanceKm = 2000;
        baseContext.computed!.isLongDistance = true;
        const result = module.apply(baseContext);

        const adjustmentCost = result.computed?.costs.find(c => c.moduleId === 'high-mileage-fuel-adjustment');
        // Distance excédentaire brute : 1950 km
        // Distance excédentaire retenue (plafond) : 1000 km
        // Tranche 1 : 200 km × 0.15€/km = 30€
        // Tranche 2 : 800 km × 0.20€/km = 160€
        // Total : 190€
        const expectedCost = (200 * 0.15) + (800 * 0.20);
        expect(adjustmentCost?.amount).toBeCloseTo(expectedCost, 2);
        expect(adjustmentCost?.amount).toBe(190.00);

        // Vérifier que le plafond est bien appliqué
        expect(adjustmentCost?.metadata.rawExcessDistance).toBe(1950);
        expect(adjustmentCost?.metadata.excessDistance).toBe(1000);
        expect(adjustmentCost?.metadata.wasCapped).toBe(true);
        expect(adjustmentCost?.metadata.maxExcessDistance).toBe(1000);
        expect(result.computed?.metadata.highMileageAdjustmentCapped).toBe(true);
      });

      it('should apply cap for exactly 1000 km excess (frontière du plafond)', () => {
        baseContext.computed!.distanceKm = threshold + 1000; // 1050 km total
        baseContext.computed!.isLongDistance = true;
        const result = module.apply(baseContext);

        const adjustmentCost = result.computed?.costs.find(c => c.moduleId === 'high-mileage-fuel-adjustment');
        // Distance excédentaire : exactement 1000 km (pas de plafond appliqué)
        // Tranche 1 : 200 km × 0.15€/km = 30€
        // Tranche 2 : 800 km × 0.20€/km = 160€
        // Total : 190€
        const expectedCost = (200 * 0.15) + (800 * 0.20);
        expect(adjustmentCost?.amount).toBeCloseTo(expectedCost, 2);
        expect(adjustmentCost?.metadata.wasCapped).toBe(false);
      });

      it('should apply cap for 5000 km total (4950 km excess → capped at 1000 km)', () => {
        baseContext.computed!.distanceKm = 5000;
        baseContext.computed!.isLongDistance = true;
        const result = module.apply(baseContext);

        const adjustmentCost = result.computed?.costs.find(c => c.moduleId === 'high-mileage-fuel-adjustment');
        // Distance excédentaire brute : 4950 km
        // Distance excédentaire retenue (plafond) : 1000 km
        // Tranche 1 : 200 km × 0.15€/km = 30€
        // Tranche 2 : 800 km × 0.20€/km = 160€
        // Total : 190€ (même coût que pour 2000 km)
        const expectedCost = (200 * 0.15) + (800 * 0.20);
        expect(adjustmentCost?.amount).toBeCloseTo(expectedCost, 2);
        expect(adjustmentCost?.amount).toBe(190.00);
        expect(adjustmentCost?.metadata.wasCapped).toBe(true);
      });
    });

    describe('métadonnées', () => {
      it('should store correct metadata for simple case', () => {
        baseContext.computed!.distanceKm = 100;
        baseContext.computed!.isLongDistance = true;
        const result = module.apply(baseContext);

        const adjustmentCost = result.computed?.costs.find(c => c.moduleId === 'high-mileage-fuel-adjustment');
        expect(adjustmentCost?.metadata).toMatchObject({
          distanceKm: 100,
          threshold: threshold,
          rawExcessDistance: 50,
          excessDistance: 50,
          wasCapped: false,
          maxExcessDistance: 1000,
        });
        expect(adjustmentCost?.metadata.breakdown).toHaveLength(1);
        expect(result.computed?.metadata.highMileageAdjustmentApplied).toBe(true);
        expect(result.computed?.metadata.excessDistanceKm).toBe(50);
      });

      it('should store correct metadata for capped case', () => {
        baseContext.computed!.distanceKm = 2000;
        baseContext.computed!.isLongDistance = true;
        const result = module.apply(baseContext);

        const adjustmentCost = result.computed?.costs.find(c => c.moduleId === 'high-mileage-fuel-adjustment');
        expect(adjustmentCost?.metadata).toMatchObject({
          distanceKm: 2000,
          threshold: threshold,
          rawExcessDistance: 1950,
          excessDistance: 1000,
          wasCapped: true,
          maxExcessDistance: 1000,
        });
        expect(adjustmentCost?.metadata.breakdown).toHaveLength(2);
        expect(result.computed?.metadata.highMileageAdjustmentCapped).toBe(true);
      });
    });
  });
});

