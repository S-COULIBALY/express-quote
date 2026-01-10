/**
 * 🧪 **TESTS UNITAIRES - RuleEngine**
 * 
 * Tests unitaires pour le moteur d'exécution des règles métier.
 */

import { RuleEngine } from '@/quotation/domain/services/RuleEngine';
import { Rule } from '@/quotation/domain/valueObjects/Rule';
import { Money } from '@/quotation/domain/valueObjects/Money';
import { QuoteContext } from '@/quotation/domain/valueObjects/QuoteContext';
import { ServiceType } from '@/quotation/domain/enums/ServiceType';
import { RuleType } from '@/quotation/domain/enums/RuleType';

// Mock des dépendances
jest.mock('@/quotation/domain/services/engine', () => ({
  RuleContextEnricher: jest.fn().mockImplementation(() => ({
    enrichContext: jest.fn()
  })),
  RuleApplicationService: jest.fn().mockImplementation(() => ({
    applyRules: jest.fn()
  })),
  RulePriceCalculator: jest.fn().mockImplementation(() => ({
    calculateFinalPrice: jest.fn()
  }))
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

jest.mock('@/lib/calculation-debug-logger', () => ({
  calculationDebugLogger: {
    startRulesEngine: jest.fn(),
    finishRulesEngine: jest.fn(),
    logError: jest.fn()
  }
}));

jest.mock('@/lib/conditional-logger', () => ({
  devLog: {
    debug: jest.fn()
  }
}));

import { RuleContextEnricher, RuleApplicationService, RulePriceCalculator } from '@/quotation/domain/services/engine';
import { calculationDebugLogger } from '@/lib/calculation-debug-logger';
import { devLog } from '@/lib/conditional-logger';

const MockRuleContextEnricher = RuleContextEnricher as jest.MockedClass<typeof RuleContextEnricher>;
const MockRuleApplicationService = RuleApplicationService as jest.MockedClass<typeof RuleApplicationService>;
const MockRulePriceCalculator = RulePriceCalculator as jest.MockedClass<typeof RulePriceCalculator>;

describe('RuleEngine', () => {
  let mockContextEnricher: jest.Mocked<RuleContextEnricher>;
  let mockApplicationService: jest.Mocked<RuleApplicationService>;
  let mockPriceCalculator: jest.Mocked<RulePriceCalculator>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock des services
    mockContextEnricher = {
      enrichContext: jest.fn()
    } as any;

    mockApplicationService = {
      applyRules: jest.fn()
    } as any;

    mockPriceCalculator = {
      calculateFinalPrice: jest.fn()
    } as any;

    MockRuleContextEnricher.mockImplementation(() => mockContextEnricher);
    MockRuleApplicationService.mockImplementation(() => mockApplicationService);
    MockRulePriceCalculator.mockImplementation(() => mockPriceCalculator);
  });

  describe('constructor', () => {
    test('initialiser avec des règles', () => {
      const rules = [
        new Rule('rule-1', 'Règle 1', 'Description 1', 100, RuleType.CONSTRAINT, ServiceType.MOVING),
        new Rule('rule-2', 'Règle 2', 'Description 2', 50, RuleType.CUSTOM, ServiceType.MOVING)
      ];

      const engine = new RuleEngine(rules);

      expect(engine.getRules()).toHaveLength(2);
      expect(MockRuleContextEnricher).toHaveBeenCalledWith(rules);
      expect(MockRuleApplicationService).toHaveBeenCalled();
      expect(MockRulePriceCalculator).toHaveBeenCalled();
    });

    test('trier les règles par priorité', () => {
      const rules = [
        new Rule('rule-1', 'Règle normale', 'Description 1', 100, RuleType.CONSTRAINT, ServiceType.MOVING),
        new Rule('rule-2', 'Tarif minimum', 'Description 2', 50, RuleType.CONSTRAINT, ServiceType.MOVING),
        new Rule('rule-3', 'Règle pourcentage', 'Description 3', 10, RuleType.CONSTRAINT, ServiceType.MOVING, true)
      ];

      const engine = new RuleEngine(rules);
      const sortedRules = engine.getRules();

      // Tarif minimum doit être en premier
      expect(sortedRules[0].name).toBe('Tarif minimum');
      // Règle pourcentage doit être en deuxième
      expect(sortedRules[1].name).toBe('Règle pourcentage');
      // Règle normale en dernier
      expect(sortedRules[2].name).toBe('Règle normale');
    });
  });

  describe('execute', () => {
    let mockContext: jest.Mocked<QuoteContext>;
    let basePrice: Money;

    beforeEach(() => {
      mockContext = {
        validate: jest.fn(),
        getAllData: jest.fn().mockReturnValue({}),
        setValue: jest.fn()
      } as any;

      basePrice = new Money(1000);
    });

    test('exécution réussie avec toutes les étapes', () => {
      const rules = [
        new Rule('rule-1', 'Règle 1', 'Description 1', 100, RuleType.CONSTRAINT, ServiceType.MOVING)
      ];

      const enrichedContext = { allServices: [] };
      const appliedRules = [{ id: 'rule-1', applied: true }];
      const expectedResult = {
        finalPrice: new Money(1100),
        appliedRules: appliedRules,
        totalSurcharge: 100
      };

      mockContextEnricher.enrichContext.mockReturnValue(enrichedContext);
      mockApplicationService.applyRules.mockReturnValue(appliedRules);
      mockPriceCalculator.calculateFinalPrice.mockReturnValue(expectedResult);

      const engine = new RuleEngine(rules);
      const result = engine.execute(mockContext, basePrice);

      expect(calculationDebugLogger.startRulesEngine).toHaveBeenCalledWith(
        rules,
        1000,
        {}
      );
      expect(mockContext.validate).toHaveBeenCalled();
      expect(mockContextEnricher.enrichContext).toHaveBeenCalledWith(mockContext);
      expect(mockApplicationService.applyRules).toHaveBeenCalledWith(
        rules,
        enrichedContext,
        basePrice
      );
      expect(mockPriceCalculator.calculateFinalPrice).toHaveBeenCalledWith(
        basePrice,
        appliedRules
      );
      expect(calculationDebugLogger.finishRulesEngine).toHaveBeenCalledWith(expectedResult);
      expect(result).toBe(expectedResult);
    });

    test('mettre à jour le contexte avec les services fusionnés', () => {
      const rules = [new Rule('rule-1', 'Règle 1', 'Description 1', 100, RuleType.CONSTRAINT, ServiceType.MOVING)];
      const enrichedContext = { allServices: [{ id: 'service-1', name: 'Service 1' }] };
      const appliedRules = [];
      const expectedResult = { finalPrice: basePrice, appliedRules: [], totalSurcharge: 0 };

      mockContextEnricher.enrichContext.mockReturnValue(enrichedContext);
      mockApplicationService.applyRules.mockReturnValue(appliedRules);
      mockPriceCalculator.calculateFinalPrice.mockReturnValue(expectedResult);

      const engine = new RuleEngine(rules);
      engine.execute(mockContext, basePrice);

      expect(mockContext.setValue).toHaveBeenCalledWith('additionalServices', [{ id: 'service-1', name: 'Service 1' }]);
    });

    test('ne pas mettre à jour le contexte si pas de services', () => {
      const rules = [new Rule('rule-1', 'Règle 1', 'Description 1', 100, RuleType.CONSTRAINT, ServiceType.MOVING)];
      const enrichedContext = { allServices: [] };
      const appliedRules = [];
      const expectedResult = { finalPrice: basePrice, appliedRules: [], totalSurcharge: 0 };

      mockContextEnricher.enrichContext.mockReturnValue(enrichedContext);
      mockApplicationService.applyRules.mockReturnValue(appliedRules);
      mockPriceCalculator.calculateFinalPrice.mockReturnValue(expectedResult);

      const engine = new RuleEngine(rules);
      engine.execute(mockContext, basePrice);

      expect(mockContext.setValue).not.toHaveBeenCalled();
    });

    test('gérer les erreurs de validation du contexte', () => {
      const rules = [new Rule('rule-1', 'Règle 1', 'Description 1', 100, RuleType.CONSTRAINT, ServiceType.MOVING)];
      const validationError = new Error('Contexte invalide');

      mockContext.validate.mockImplementation(() => {
        throw validationError;
      });

      const engine = new RuleEngine(rules);

      expect(() => engine.execute(mockContext, basePrice)).toThrow('Contexte invalide');
      expect(devLog.debug).toHaveBeenCalledWith('RuleEngine', '❌ ERREUR DE VALIDATION DU CONTEXTE:', validationError);
    });

    test('gérer les erreurs générales', () => {
      const rules = [new Rule('rule-1', 'Règle 1', 'Description 1', 100, RuleType.CONSTRAINT, ServiceType.MOVING)];
      const generalError = new Error('Erreur générale');

      mockContextEnricher.enrichContext.mockImplementation(() => {
        throw generalError;
      });

      const engine = new RuleEngine(rules);

      expect(() => engine.execute(mockContext, basePrice)).toThrow('Impossible d\'exécuter les règles: Erreur générale');
      expect(calculationDebugLogger.logError).toHaveBeenCalledWith(generalError);
    });

    test('gérer les erreurs non-Error', () => {
      const rules = [new Rule('rule-1', 'Règle 1', 'Description 1', 100, RuleType.CONSTRAINT, ServiceType.MOVING)];

      mockContextEnricher.enrichContext.mockImplementation(() => {
        throw 'String error';
      });

      const engine = new RuleEngine(rules);

      expect(() => engine.execute(mockContext, basePrice)).toThrow('Impossible d\'exécuter les règles: Erreur inconnue');
    });
  });

  describe('getRules', () => {
    test('retourner une copie des règles', () => {
      const rules = [
        new Rule('rule-1', 'Règle 1', 'Description 1', 100, RuleType.CONSTRAINT, ServiceType.MOVING)
      ];

      const engine = new RuleEngine(rules);
      const returnedRules = engine.getRules();

      expect(returnedRules).toEqual(rules);
      expect(returnedRules).not.toBe(rules); // Copie, pas référence
    });
  });

  describe('addRule', () => {
    test('ajouter une règle', () => {
      const rules = [
        new Rule('rule-1', 'Règle 1', 'Description 1', 100, RuleType.CONSTRAINT, ServiceType.MOVING)
      ];

      const engine = new RuleEngine(rules);
      const newRule = new Rule('rule-2', 'Règle 2', 'Description 2', 50, RuleType.CUSTOM, ServiceType.MOVING);

      engine.addRule(newRule);

      expect(engine.getRules()).toHaveLength(2);
      expect(engine.getRules()).toContain(newRule);
    });
  });

  describe('removeRule', () => {
    test('supprimer une règle existante', () => {
      const rule1 = new Rule('rule-1', 'Règle 1', 'Description 1', 100, RuleType.CONSTRAINT, ServiceType.MOVING);
      const rule2 = new Rule('rule-2', 'Règle 2', 'Description 2', 50, RuleType.CUSTOM, ServiceType.MOVING);
      const rules = [rule1, rule2];

      const engine = new RuleEngine(rules);

      engine.removeRule(rule1);

      expect(engine.getRules()).toHaveLength(1);
      expect(engine.getRules()).toContain(rule2);
      expect(engine.getRules()).not.toContain(rule1);
    });

    test('ne pas supprimer une règle inexistante', () => {
      const rule1 = new Rule('rule-1', 'Règle 1', 'Description 1', 100, RuleType.CONSTRAINT, ServiceType.MOVING);
      const rule2 = new Rule('rule-2', 'Règle 2', 'Description 2', 50, RuleType.CUSTOM, ServiceType.MOVING);
      const rule3 = new Rule('rule-3', 'Règle 3', 'Description 3', 75, RuleType.CONSTRAINT, ServiceType.MOVING);
      const rules = [rule1, rule2];

      const engine = new RuleEngine(rules);

      engine.removeRule(rule3);

      expect(engine.getRules()).toHaveLength(2);
      expect(engine.getRules()).toContain(rule1);
      expect(engine.getRules()).toContain(rule2);
    });
  });

  describe('tri des règles', () => {
    test('priorité spéciale pour Tarif minimum', () => {
      const rules = [
        new Rule('rule-1', 'Règle normale', 'Description 1', 100, RuleType.CONSTRAINT, ServiceType.MOVING),
        new Rule('rule-2', 'Tarif minimum', 'Description 2', 50, RuleType.CONSTRAINT, ServiceType.MOVING),
        new Rule('rule-3', 'Autre règle', 'Description 3', 75, RuleType.CONSTRAINT, ServiceType.MOVING)
      ];

      const engine = new RuleEngine(rules);
      const sortedRules = engine.getRules();

      expect(sortedRules[0].name).toBe('Tarif minimum');
    });

    test('priorité pour les règles en pourcentage', () => {
      const rules = [
        new Rule('rule-1', 'Règle fixe', 'Description 1', 100, RuleType.CONSTRAINT, ServiceType.MOVING),
        new Rule('rule-2', 'Règle pourcentage', 'Description 2', 10, RuleType.CONSTRAINT, ServiceType.MOVING, true),
        new Rule('rule-3', 'Autre règle fixe', 'Description 3', 75, RuleType.CONSTRAINT, ServiceType.MOVING)
      ];

      const engine = new RuleEngine(rules);
      const sortedRules = engine.getRules();

      expect(sortedRules[0].name).toBe('Règle pourcentage');
    });

    test('combinaison des priorités', () => {
      const rules = [
        new Rule('rule-1', 'Règle fixe', 'Description 1', 100, RuleType.CONSTRAINT, ServiceType.MOVING),
        new Rule('rule-2', 'Tarif minimum', 'Description 2', 50, RuleType.CONSTRAINT, ServiceType.MOVING),
        new Rule('rule-3', 'Règle pourcentage', 'Description 3', 10, RuleType.CONSTRAINT, ServiceType.MOVING, true),
        new Rule('rule-4', 'Autre règle fixe', 'Description 4', 75, RuleType.CONSTRAINT, ServiceType.MOVING)
      ];

      const engine = new RuleEngine(rules);
      const sortedRules = engine.getRules();

      expect(sortedRules[0].name).toBe('Tarif minimum');
      expect(sortedRules[1].name).toBe('Règle pourcentage');
    });
  });

  describe('logging et debugging', () => {
    test('logger les informations de démarrage', () => {
      const rules = [new Rule('rule-1', 'Règle 1', 'Description 1', 100, RuleType.CONSTRAINT, ServiceType.MOVING)];
      const mockContext = {
        validate: jest.fn(),
        getAllData: jest.fn().mockReturnValue({ test: 'data' }),
        setValue: jest.fn()
      } as any;

      const basePrice = new Money(1000);
      const enrichedContext = { allServices: [] };
      const appliedRules = [];
      const expectedResult = { finalPrice: basePrice, appliedRules: [], totalSurcharge: 0 };

      mockContextEnricher.enrichContext.mockReturnValue(enrichedContext);
      mockApplicationService.applyRules.mockReturnValue(appliedRules);
      mockPriceCalculator.calculateFinalPrice.mockReturnValue(expectedResult);

      const engine = new RuleEngine(rules);
      engine.execute(mockContext, basePrice);

      expect(calculationDebugLogger.startRulesEngine).toHaveBeenCalledWith(
        rules,
        1000,
        { test: 'data' }
      );
      expect(devLog.debug).toHaveBeenCalledWith('RuleEngine', '📋 CONTEXTE: 1 règles | Prix base: 1000.00€');
    });

    test('logger les étapes de validation', () => {
      const rules = [new Rule('rule-1', 'Règle 1', 'Description 1', 100, RuleType.CONSTRAINT, ServiceType.MOVING)];
      const mockContext = {
        validate: jest.fn(),
        getAllData: jest.fn().mockReturnValue({}),
        setValue: jest.fn()
      } as any;

      const basePrice = new Money(1000);
      const enrichedContext = { allServices: [] };
      const appliedRules = [];
      const expectedResult = { finalPrice: basePrice, appliedRules: [], totalSurcharge: 0 };

      mockContextEnricher.enrichContext.mockReturnValue(enrichedContext);
      mockApplicationService.applyRules.mockReturnValue(appliedRules);
      mockPriceCalculator.calculateFinalPrice.mockReturnValue(expectedResult);

      const engine = new RuleEngine(rules);
      engine.execute(mockContext, basePrice);

      expect(devLog.debug).toHaveBeenCalledWith('RuleEngine', '🔍 VALIDATION DU CONTEXTE...');
      expect(devLog.debug).toHaveBeenCalledWith('RuleEngine', '✅ CONTEXTE VALIDÉ');
    });

    test('logger les étapes de traitement', () => {
      const rules = [new Rule('rule-1', 'Règle 1', 'Description 1', 100, RuleType.CONSTRAINT, ServiceType.MOVING)];
      const mockContext = {
        validate: jest.fn(),
        getAllData: jest.fn().mockReturnValue({}),
        setValue: jest.fn()
      } as any;

      const basePrice = new Money(1000);
      const enrichedContext = { allServices: [] };
      const appliedRules = [];
      const expectedResult = { finalPrice: basePrice, appliedRules: [], totalSurcharge: 0 };

      mockContextEnricher.enrichContext.mockReturnValue(enrichedContext);
      mockApplicationService.applyRules.mockReturnValue(appliedRules);
      mockPriceCalculator.calculateFinalPrice.mockReturnValue(expectedResult);

      const engine = new RuleEngine(rules);
      engine.execute(mockContext, basePrice);

      expect(devLog.debug).toHaveBeenCalledWith('RuleEngine', '🔄 TRAITEMENT DE CHAQUE RÈGLE...');
    });

    test('logger la fin d\'exécution', () => {
      const rules = [new Rule('rule-1', 'Règle 1', 'Description 1', 100, RuleType.CONSTRAINT, ServiceType.MOVING)];
      const mockContext = {
        validate: jest.fn(),
        getAllData: jest.fn().mockReturnValue({}),
        setValue: jest.fn()
      } as any;

      const basePrice = new Money(1000);
      const enrichedContext = { allServices: [] };
      const appliedRules = [];
      const expectedResult = { finalPrice: basePrice, appliedRules: [], totalSurcharge: 0 };

      mockContextEnricher.enrichContext.mockReturnValue(enrichedContext);
      mockApplicationService.applyRules.mockReturnValue(appliedRules);
      mockPriceCalculator.calculateFinalPrice.mockReturnValue(expectedResult);

      const engine = new RuleEngine(rules);
      engine.execute(mockContext, basePrice);

      expect(devLog.debug).toHaveBeenCalledWith('RuleEngine', '==== FIN RULEENGINE.EXECUTE (SUCCÈS) ====\n');
    });
  });
});
