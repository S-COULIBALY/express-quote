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

    it('devrait être applicable si logement F2/F3/F4/HOUSE', () => {
      const housingTypes = ['F2', 'F3', 'F4', 'HOUSE'] as const;
      
      housingTypes.forEach(housingType => {
        const ctx: QuoteContext = {
          serviceType: 'MOVING',
          region: 'IDF',
          departureAddress: '123 Rue de Paris',
          arrivalAddress: '456 Avenue Montaigne',
          housingType,
        };

        expect(module.isApplicable(ctx)).toBe(true);
      });
    });

    it('devrait être applicable si nombre de pièces ≥ 2', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue Montaigne',
        rooms: 2,
      };

      expect(module.isApplicable(ctx)).toBe(true);
    });

    it('ne devrait pas être applicable si logement STUDIO avec 1 pièce', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue Montaigne',
        housingType: 'STUDIO',
        rooms: 1,
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
        complexItemsCount: 0,
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

    it('devrait ajouter un surcoût pour 3 pièces (1 meuble complexe)', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue Montaigne',
        rooms: 3,
        computed: createEmptyComputedContext(),
      };

      const result = module.apply(ctx);

      const cost = result.computed?.costs[0];
      const expectedCost = config.BASE_COST + config.COST_PER_COMPLEX_ITEM; // 80 + 40 = 120€
      expect(cost?.amount).toBe(expectedCost);
      expect(cost?.metadata).toMatchObject({
        rooms: 3,
        complexItemsCount: 1,
      });
    });

    it('devrait ajouter un surcoût pour 4+ pièces (2 meubles complexes)', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue Montaigne',
        housingType: 'F4',
        rooms: 4,
        computed: createEmptyComputedContext(),
      };

      const result = module.apply(ctx);

      const cost = result.computed?.costs[0];
      const expectedCost = config.BASE_COST + (config.COST_PER_COMPLEX_ITEM * 2); // 80 + 80 = 160€
      expect(cost?.amount).toBe(expectedCost);
      expect(cost?.metadata).toMatchObject({
        rooms: 4,
        complexItemsCount: 2,
      });
    });

    it('devrait calculer correctement le breakdown', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue Montaigne',
        bulkyFurniture: true,
        rooms: 4,
        piano: true,
        computed: createEmptyComputedContext(),
      };

      const result = module.apply(ctx);

      const cost = result.computed?.costs[0];
      expect(cost?.metadata.breakdown).toBeDefined();
      const breakdown = cost?.metadata.breakdown as Array<{ item: string; cost: number }>;
      expect(breakdown.length).toBe(4); // Base + bulky + complex + piano
      expect(breakdown[0].item).toBe('Coût de base');
      expect(breakdown[0].cost).toBe(config.BASE_COST);
    });
  });
});

