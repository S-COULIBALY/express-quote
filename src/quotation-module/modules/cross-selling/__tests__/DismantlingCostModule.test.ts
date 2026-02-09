import { DismantlingCostModule } from '../DismantlingCostModule';
import { QuoteContext } from '../../../core/QuoteContext';
import { createEmptyComputedContext } from '../../../core/ComputedContext';
import { MODULES_CONFIG } from '../../../config/modules.config';

describe('DismantlingCostModule', () => {
  const module = new DismantlingCostModule();
  const config = MODULES_CONFIG.crossSelling.DISMANTLING;

  describe('isApplicable', () => {
    it('devrait être applicable si meubles encombrants présents', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue Montaigne',
        bulkyFurniture: true,
      };

      expect(module.isApplicable(ctx)).toBe(true);
    });

    it('ne devrait pas être applicable si pas dismantling et pas bulkyFurniture', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue Montaigne',
      };

      expect(module.isApplicable(ctx)).toBe(false);
    });
  });

  describe('apply', () => {
    it('devrait ajouter le coût de base pour meubles encombrants', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue Montaigne',
        bulkyFurniture: true,
        computed: createEmptyComputedContext(),
      };

      const result = module.apply(ctx);

      expect(result.computed?.costs).toHaveLength(1);
      const cost = result.computed?.costs[0];
      expect(cost?.moduleId).toBe('dismantling-cost');
      const expectedCost = config.BASE_COST + config.COST_PER_BULKY_FURNITURE; // 80 + 60 = 140€
      expect(cost?.amount).toBe(expectedCost);
      expect(cost?.metadata).toMatchObject({
        baseCost: config.BASE_COST,
        bulkyFurniture: true,
      });
      expect(cost?.metadata.breakdown).toBeDefined();
      expect(result.computed?.activatedModules).toContain('dismantling-cost');
    });

    it('devrait ajouter un surcoût pour piano', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue Montaigne',
        bulkyFurniture: true,
        piano: true,
        computed: createEmptyComputedContext(),
      };

      const result = module.apply(ctx);

      const cost = result.computed?.costs[0];
      const expectedCost = config.BASE_COST + config.COST_PER_BULKY_FURNITURE + config.PIANO_COST; // 80 + 60 + 100 = 240€
      expect(cost?.amount).toBe(expectedCost);
      expect(cost?.metadata).toMatchObject({
        piano: true,
      });
    });

    it('devrait calculer correctement le breakdown', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue Montaigne',
        dismantling: true,
        bulkyFurniture: true,
        piano: true,
        computed: createEmptyComputedContext(),
      };

      const result = module.apply(ctx);

      const cost = result.computed?.costs[0];
      expect(cost?.metadata.breakdown).toBeDefined();
      const breakdown = cost?.metadata.breakdown as Array<{ item: string; cost: number }>;
      expect(breakdown.length).toBe(3); // Base + bulky + piano
      expect(breakdown[0].item).toBe('Coût de base démontage');
      expect(breakdown[0].cost).toBe(config.BASE_COST);
    });
  });
});

