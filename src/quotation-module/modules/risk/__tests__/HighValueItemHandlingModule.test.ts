import { HighValueItemHandlingModule } from '../HighValueItemHandlingModule';
import { QuoteContext } from '../../../core/QuoteContext';
import { createEmptyComputedContext } from '../../../core/ComputedContext';
import { MODULES_CONFIG } from '../../../config/modules.config';

describe('HighValueItemHandlingModule', () => {
  const module = new HighValueItemHandlingModule();
  const config = MODULES_CONFIG.highValueItems;

  describe('isApplicable', () => {
    it('devrait être applicable si piano présent', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue Montaigne',
        piano: true,
        computed: {
          ...createEmptyComputedContext(),
          activatedModules: ['insurance-premium', 'declared-value-validation'],
        },
      };

      expect(module.isApplicable(ctx)).toBe(true);
    });

    it('devrait être applicable si coffre-fort présent', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue Montaigne',
        safe: true,
        computed: {
          ...createEmptyComputedContext(),
          activatedModules: ['insurance-premium', 'declared-value-validation'],
        },
      };

      expect(module.isApplicable(ctx)).toBe(true);
    });

    it('devrait être applicable si œuvres d\'art présentes', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue Montaigne',
        artwork: true,
        computed: {
          ...createEmptyComputedContext(),
          activatedModules: ['insurance-premium', 'declared-value-validation'],
        },
      };

      expect(module.isApplicable(ctx)).toBe(true);
    });

    it('devrait être applicable si valeur déclarée > seuil', () => {
      const threshold = config.HIGH_DECLARED_VALUE_THRESHOLD;
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue Montaigne',
        declaredValue: threshold + 10000,
        computed: {
          ...createEmptyComputedContext(),
          activatedModules: ['insurance-premium', 'declared-value-validation'],
        },
      };

      expect(module.isApplicable(ctx)).toBe(true);
    });

    it('ne devrait pas être applicable si aucun objet de valeur', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue Montaigne',
        declaredValue: 10000,
        computed: {
          ...createEmptyComputedContext(),
          activatedModules: ['insurance-premium', 'declared-value-validation'],
        },
      };

      expect(module.isApplicable(ctx)).toBe(false);
    });
  });

  describe('apply', () => {
    it('devrait ajouter le coût et requirement pour piano', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue Montaigne',
        piano: true,
        computed: {
          ...createEmptyComputedContext(),
          activatedModules: ['insurance-premium', 'declared-value-validation'],
        },
      };

      const result = module.apply(ctx);

      expect(result.computed?.costs).toHaveLength(1);
      const cost = result.computed?.costs[0];
      expect(cost?.moduleId).toBe('high-value-item-handling');
      expect(cost?.amount).toBe(config.HANDLING_COSTS.PIANO);
      expect(cost?.metadata).toMatchObject({
        piano: true,
        safe: false,
        artwork: false,
        costBreakdown: [{ item: 'Piano', cost: config.HANDLING_COSTS.PIANO }],
        riskContribution: config.RISK_CONTRIBUTION,
      });
      expect(result.computed?.requirements).toHaveLength(1);
      expect(result.computed?.requirements[0].type).toBe('SPECIAL_HANDLING_REQUIRED');
      expect(result.computed?.riskContributions).toHaveLength(1);
      expect(result.computed?.riskContributions[0].amount).toBe(config.RISK_CONTRIBUTION);
      expect(result.computed?.activatedModules).toContain('high-value-item-handling');
    });

    it('devrait ajouter le coût et requirement pour coffre-fort', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue Montaigne',
        safe: true,
        computed: {
          ...createEmptyComputedContext(),
          activatedModules: ['insurance-premium', 'declared-value-validation'],
        },
      };

      const result = module.apply(ctx);

      const cost = result.computed?.costs[0];
      expect(cost?.amount).toBe(config.HANDLING_COSTS.SAFE);
      expect(cost?.metadata).toMatchObject({
        piano: false,
        safe: true,
        artwork: false,
        costBreakdown: [{ item: 'Coffre-fort', cost: config.HANDLING_COSTS.SAFE }],
        riskContribution: config.RISK_CONTRIBUTION,
      });
      const requirement = result.computed?.requirements.find(r => r.metadata?.itemType === 'SAFE');
      expect(requirement?.severity).toBe('CRITICAL');
    });

    it('devrait gérer plusieurs objets de valeur', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue Montaigne',
        piano: true,
        artwork: true,
        computed: {
          ...createEmptyComputedContext(),
          activatedModules: ['insurance-premium', 'declared-value-validation'],
        },
      };

      const result = module.apply(ctx);

      const cost = result.computed?.costs[0];
      const expectedCost = config.HANDLING_COSTS.PIANO + config.HANDLING_COSTS.ARTWORK;
      expect(cost?.amount).toBe(expectedCost);
      expect(cost?.metadata.costBreakdown).toHaveLength(2);
      expect(cost?.metadata.costBreakdown).toContainEqual({ item: 'Piano', cost: config.HANDLING_COSTS.PIANO });
      expect(cost?.metadata.costBreakdown).toContainEqual({ item: 'Œuvres d\'art', cost: config.HANDLING_COSTS.ARTWORK });
      expect(result.computed?.requirements).toHaveLength(2);
    });

    it('devrait ajouter requirement pour valeur déclarée élevée (sans coût)', () => {
      const threshold = config.HIGH_DECLARED_VALUE_THRESHOLD;
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue Montaigne',
        declaredValue: threshold + 10000,
        computed: {
          ...createEmptyComputedContext(),
          activatedModules: ['insurance-premium', 'declared-value-validation'],
        },
      };

      const result = module.apply(ctx);

      // Pas de coût car pas d'objets physiques
      expect(result.computed?.costs).toHaveLength(0);
      const requirement = result.computed?.requirements.find(r => r.type === 'HIGH_VALUE_DECLARED');
      expect(requirement).toBeDefined();
      expect(requirement?.metadata.threshold).toBe(threshold);
      expect(result.computed?.activatedModules).toContain('high-value-item-handling');
    });

    it('devrait calculer le coût total pour tous les objets', () => {
      const ctx: QuoteContext = {
        serviceType: 'MOVING',
        region: 'IDF',
        departureAddress: '123 Rue de Paris',
        arrivalAddress: '456 Avenue Montaigne',
        piano: true,
        safe: true,
        artwork: true,
        computed: {
          ...createEmptyComputedContext(),
          activatedModules: ['insurance-premium', 'declared-value-validation'],
        },
      };

      const result = module.apply(ctx);

      const cost = result.computed?.costs[0];
      const expectedCost = config.HANDLING_COSTS.PIANO + 
                          config.HANDLING_COSTS.SAFE + 
                          config.HANDLING_COSTS.ARTWORK;
      expect(cost?.amount).toBe(expectedCost);
      expect(cost?.metadata.costBreakdown).toHaveLength(3);
      expect(result.computed?.requirements).toHaveLength(3);
      expect(result.computed?.riskContributions[0].amount).toBe(config.RISK_CONTRIBUTION);
    });
  });
});

