import { PriceAggregator } from '../PriceAggregator';
import { QuoteContext } from '../../core/QuoteContext';
import { createEmptyComputedContext } from '../../core/ComputedContext';

describe('PriceAggregator', () => {
  describe('compute', () => {
    it('devrait calculer le prix de base avec marge', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue Montaigne',
        computed: {
          ...createEmptyComputedContext(),
          costs: [
            {
              moduleId: 'test-1',
              category: 'TRANSPORT',
              label: 'Transport',
              amount: 100,
            },
            {
              moduleId: 'test-2',
              category: 'LABOR',
              label: 'Main-d\'œuvre',
              amount: 200,
            },
          ],
        },
      };

      const result = PriceAggregator.compute(ctx, 0.30);

      expect(result.totalCosts).toBe(300);
      expect(result.basePrice).toBe(390); // 300 * 1.30
      expect(result.finalPrice).toBe(390); // Pas d'ajustements
      expect(result.marginRate).toBe(0.30);
    });

    it('devrait inclure les ajustements dans le prix final', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue Montaigne',
        computed: {
          ...createEmptyComputedContext(),
          costs: [
            {
              moduleId: 'test-1',
              category: 'TRANSPORT',
              label: 'Transport',
              amount: 100,
            },
          ],
          adjustments: [
            {
              moduleId: 'test-adj',
              label: 'Surcharge',
              amount: 50,
              type: 'SURCHARGE',
              reason: 'Test',
            },
          ],
        },
      };

      const result = PriceAggregator.compute(ctx, 0.30);

      expect(result.totalCosts).toBe(100);
      expect(result.basePrice).toBe(130); // 100 * 1.30
      expect(result.totalAdjustments).toBe(50);
      expect(result.finalPrice).toBe(180); // 130 + 50
    });

    it('devrait gérer les réductions', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue Montaigne',
        computed: {
          ...createEmptyComputedContext(),
          costs: [
            {
              moduleId: 'test-1',
              category: 'TRANSPORT',
              label: 'Transport',
              amount: 100,
            },
          ],
          adjustments: [
            {
              moduleId: 'test-discount',
              label: 'Réduction',
              amount: -20,
              type: 'DISCOUNT',
              reason: 'Promotion',
            },
          ],
        },
      };

      const result = PriceAggregator.compute(ctx, 0.30);

      expect(result.basePrice).toBe(130);
      expect(result.totalAdjustments).toBe(-20);
      expect(result.finalPrice).toBe(110); // 130 - 20
    });

    it('devrait calculer le breakdown par catégorie', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue Montaigne',
        computed: {
          ...createEmptyComputedContext(),
          costs: [
            {
              moduleId: 'test-1',
              category: 'TRANSPORT',
              label: 'Transport',
              amount: 100,
            },
            {
              moduleId: 'test-2',
              category: 'TRANSPORT',
              label: 'Péages',
              amount: 50,
            },
            {
              moduleId: 'test-3',
              category: 'LABOR',
              label: 'Main-d\'œuvre',
              amount: 200,
            },
          ],
        },
      };

      const result = PriceAggregator.compute(ctx, 0.30);

      expect(result.breakdown.costsByCategory.TRANSPORT).toBe(150);
      expect(result.breakdown.costsByCategory.LABOR).toBe(200);
    });
  });

  describe('computeBasePrice', () => {
    it('devrait calculer uniquement le prix de base', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue Montaigne',
        computed: {
          ...createEmptyComputedContext(),
          costs: [
            {
              moduleId: 'test-1',
              category: 'TRANSPORT',
              label: 'Transport',
              amount: 100,
            },
          ],
        },
      };

      const basePrice = PriceAggregator.computeBasePrice(ctx, 0.20);

      expect(basePrice).toBe(120); // 100 * 1.20
    });
  });

  describe('computeFinalPrice', () => {
    it('devrait calculer le prix final avec ajustements', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue Montaigne',
        computed: {
          ...createEmptyComputedContext(),
          costs: [
            {
              moduleId: 'test-1',
              category: 'TRANSPORT',
              label: 'Transport',
              amount: 100,
            },
          ],
          adjustments: [
            {
              moduleId: 'test-adj',
              label: 'Surcharge',
              amount: 30,
              type: 'SURCHARGE',
              reason: 'Test',
            },
          ],
        },
      };

      const finalPrice = PriceAggregator.computeFinalPrice(ctx, 0.30);

      expect(finalPrice).toBe(160); // (100 * 1.30) + 30
    });
  });

  describe('getCostBreakdown', () => {
    it('devrait retourner un breakdown détaillé', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue Montaigne',
        computed: {
          ...createEmptyComputedContext(),
          costs: [
            {
              moduleId: 'test-1',
              category: 'TRANSPORT',
              label: 'Transport',
              amount: 100,
            },
            {
              moduleId: 'test-2',
              category: 'LABOR',
              label: 'Main-d\'œuvre',
              amount: 200,
            },
          ],
        },
      };

      const breakdown = PriceAggregator.getCostBreakdown(ctx);

      expect(breakdown.totalCosts).toBe(300);
      expect(breakdown.costsByCategory.TRANSPORT).toBe(100);
      expect(breakdown.costsByCategory.LABOR).toBe(200);
      expect(breakdown.costsByModule).toHaveLength(2);
      expect(breakdown.costsByModule[0].moduleId).toBe('test-1');
    });
  });
});

