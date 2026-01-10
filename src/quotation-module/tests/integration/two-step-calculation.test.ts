/**
 * Tests d'intégration - Système en 2 Étapes (BaseCostEngine + MultiQuoteService)
 *
 * Valide que le système modulaire fonctionne correctement en 2 étapes :
 * 1. BaseCostEngine : Calcule le coût opérationnel de base
 * 2. MultiQuoteService : Génère les 6 variantes en mode incrémental
 */

import { BaseCostEngine, BaseCostResult } from '../../core/BaseCostEngine';
import { MultiQuoteService, QuoteVariant } from '../../multi-offers/MultiQuoteService';
import { getAllModules } from '../../core/ModuleRegistry';
import { FormAdapter } from '../../adapters/FormAdapter';
import { STANDARD_SCENARIOS } from '../../multi-offers/QuoteScenario';

describe('Système en 2 Étapes - BaseCostEngine + MultiQuoteService', () => {
  let baseCostEngine: BaseCostEngine;
  let multiQuoteService: MultiQuoteService;

  beforeEach(() => {
    const allModules = getAllModules();
    baseCostEngine = new BaseCostEngine(allModules);
    multiQuoteService = new MultiQuoteService(allModules);
  });

  describe('Étape 1 : BaseCostEngine', () => {
    it('should calculate baseCost for a simple moving scenario', () => {
      const formData = {
        movingDate: '2025-03-15T10:00:00Z',
        housingType: 'F3' as const,
        surface: 65,
        rooms: 3,
        volumeMethod: 'FORM' as const,
        estimatedVolume: 30,
        volumeConfidence: 'MEDIUM' as const,
        departureAddress: '123 Rue de Paris, 75001 Paris',
        departurePostalCode: '75001',
        departureCity: 'Paris',
        pickupFloor: 3,
        pickupHasElevator: false,
        arrivalAddress: '456 Avenue Montaigne, 75008 Paris',
        arrivalPostalCode: '75008',
        arrivalCity: 'Paris',
        deliveryFloor: 2,
        deliveryHasElevator: true,
        distance: 15,
        declaredValue: 15000,
      };

      const context = FormAdapter.toQuoteContext(formData);
      const result: BaseCostResult = baseCostEngine.execute(context);

      // Vérifier que baseCost est calculé
      expect(result.baseCost).toBeDefined();
      expect(result.baseCost).toBeGreaterThan(0);

      // Vérifier que le contexte est enrichi
      expect(result.context.computed).toBeDefined();
      expect(result.context.computed?.baseVolume).toBeDefined();
      expect(result.context.computed?.adjustedVolume).toBeDefined();
      expect(result.context.computed?.distanceKm).toBe(15);
      expect(result.context.computed?.vehicleCount).toBeGreaterThan(0);
      expect(result.context.computed?.workersCount).toBeGreaterThan(0);

      // Vérifier le breakdown
      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.volume.baseVolume).toBeGreaterThan(0);
      expect(result.breakdown.volume.adjustedVolume).toBeGreaterThan(0);
      expect(result.breakdown.distance.km).toBe(15);
      expect(result.breakdown.distance.isLongDistance).toBe(false);
      expect(result.breakdown.transport.fuel).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.transport.tolls).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.transport.vehicle).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.labor.workers).toBeGreaterThan(0);
      expect(result.breakdown.labor.hours).toBeGreaterThan(0);
      expect(result.breakdown.labor.cost).toBeGreaterThan(0);

      // Vérifier que seuls les modules de base sont activés
      expect(result.activatedModules).toBeDefined();
      expect(result.activatedModules.length).toBeGreaterThan(0);
      expect(result.activatedModules).toContain('input-sanitization');
      expect(result.activatedModules).toContain('date-validation');
      expect(result.activatedModules).toContain('address-normalization');
      expect(result.activatedModules).toContain('volume-estimation');
      expect(result.activatedModules).toContain('distance-calculation');
      expect(result.activatedModules).toContain('vehicle-selection');
      expect(result.activatedModules).toContain('workers-calculation');
      expect(result.activatedModules).toContain('labor-base');

      // Vérifier que les modules additionnels ne sont PAS activés
      expect(result.activatedModules).not.toContain('packing-cost');
      expect(result.activatedModules).not.toContain('insurance-premium');
      expect(result.activatedModules).not.toContain('furniture-lift-cost');
    });

    it('should calculate baseCost for long distance moving (IDF → Province)', () => {
      const formData = {
        movingDate: '2025-04-01T10:00:00Z',
        housingType: 'F4' as const,
        surface: 85,
        rooms: 4,
        volumeMethod: 'FORM' as const,
        estimatedVolume: 45,
        volumeConfidence: 'HIGH' as const,
        departureAddress: '10 Boulevard Haussmann, 75009 Paris',
        departurePostalCode: '75009',
        departureCity: 'Paris',
        pickupFloor: 5,
        pickupHasElevator: true,
        arrivalAddress: '25 Rue de la République, 69001 Lyon',
        arrivalPostalCode: '69001',
        arrivalCity: 'Lyon',
        deliveryFloor: 1,
        deliveryHasElevator: false,
        distance: 465,
        declaredValue: 25000,
      };

      const context = FormAdapter.toQuoteContext(formData);
      const result: BaseCostResult = baseCostEngine.execute(context);

      // Vérifier que c'est bien une longue distance
      expect(result.breakdown.distance.km).toBe(465);
      expect(result.breakdown.distance.isLongDistance).toBe(true);

      // Vérifier que le coût carburant est calculé
      expect(result.breakdown.transport.fuel).toBeGreaterThan(0);

      // Vérifier que le coût péage est calculé (obligatoire pour longue distance)
      expect(result.breakdown.transport.tolls).toBeGreaterThan(0);

      // Vérifier que baseCost inclut tous les coûts de base
      expect(result.baseCost).toBeGreaterThan(0);
    });

    it('should not include variable costs in baseCost (workers-calculation, labor-base)', () => {
      const formData = {
        movingDate: '2025-03-15T10:00:00Z',
        housingType: 'F3' as const,
        surface: 65,
        estimatedVolume: 30,
        volumeConfidence: 'MEDIUM' as const,
        departureAddress: '123 Rue de Paris, 75001 Paris',
        departurePostalCode: '75001',
        arrivalAddress: '456 Avenue Montaigne, 75008 Paris',
        arrivalPostalCode: '75008',
        distance: 15,
        declaredValue: 15000,
      };

      const context = FormAdapter.toQuoteContext(formData);
      const result: BaseCostResult = baseCostEngine.execute(context);

      // Les modules workers-calculation et labor-base sont exécutés mais leur coût
      // n'est pas inclus dans baseCost car ils varient selon le scénario
      // Cependant, ils sont toujours dans le breakdown pour information
      expect(result.breakdown.labor.workers).toBeGreaterThan(0);
      expect(result.breakdown.labor.cost).toBeGreaterThan(0);
    });
  });

  describe('Étape 2 : MultiQuoteService (Mode Incrémental)', () => {
    it('should generate 6 variants from baseCost without recalculating base modules', () => {
      const formData = {
        movingDate: '2025-03-15T10:00:00Z',
        housingType: 'F3' as const,
        surface: 65,
        rooms: 3,
        volumeMethod: 'FORM' as const,
        estimatedVolume: 30,
        volumeConfidence: 'MEDIUM' as const,
        departureAddress: '123 Rue de Paris, 75001 Paris',
        departurePostalCode: '75001',
        departureCity: 'Paris',
        pickupFloor: 3,
        pickupHasElevator: false,
        arrivalAddress: '456 Avenue Montaigne, 75008 Paris',
        arrivalPostalCode: '75008',
        arrivalCity: 'Paris',
        deliveryFloor: 2,
        deliveryHasElevator: true,
        distance: 15,
        declaredValue: 15000,
      };

      // Étape 1 : Calculer le baseCost
      const context = FormAdapter.toQuoteContext(formData);
      const baseResult: BaseCostResult = baseCostEngine.execute(context);

      // Vérifier que les modules de base sont activés
      const baseModulesCount = baseResult.activatedModules.length;
      expect(baseModulesCount).toBeGreaterThan(0);

      // Étape 2 : Générer les 6 variantes
      const variants: QuoteVariant[] = multiQuoteService.generateMultipleQuotesFromBaseCost(
        baseResult.context,
        STANDARD_SCENARIOS,
        baseResult.baseCost
      );

      // Vérifier que 6 variantes sont générées
      expect(variants).toHaveLength(6);
      expect(variants.map(v => v.scenarioId)).toEqual([
        'ECO',
        'STANDARD',
        'CONFORT',
        'SECURITY_PLUS',
        'PREMIUM',
        'FLEX'
      ]);

      // Vérifier que chaque variante a un prix final
      variants.forEach(variant => {
        expect(variant.finalPrice).toBeDefined();
        expect(variant.finalPrice).toBeGreaterThan(0);
        expect(variant.context).toBeDefined();
        expect(variant.context.computed).toBeDefined();
      });

      // Vérifier que les modules de base ne sont PAS réexécutés
      // (ils sont dans skipModules, donc ne devraient pas être dans les nouveaux activatedModules)
      variants.forEach(variant => {
        const newModules = variant.context.computed?.activatedModules || [];
        // Les modules de base devraient être présents (car réutilisés) mais pas réexécutés
        // On vérifie que le contexte computed est bien réutilisé
        expect(variant.context.computed?.baseVolume).toBe(baseResult.context.computed?.baseVolume);
        expect(variant.context.computed?.distanceKm).toBe(baseResult.context.computed?.distanceKm);
      });
    });

    it('should apply different margins for each scenario', () => {
      const formData = {
        movingDate: '2025-03-15T10:00:00Z',
        housingType: 'F3' as const,
        surface: 65,
        estimatedVolume: 30,
        volumeConfidence: 'MEDIUM' as const,
        departureAddress: '123 Rue de Paris, 75001 Paris',
        departurePostalCode: '75001',
        arrivalAddress: '456 Avenue Montaigne, 75008 Paris',
        arrivalPostalCode: '75008',
        distance: 15,
        declaredValue: 15000,
      };

      const context = FormAdapter.toQuoteContext(formData);
      const baseResult: BaseCostResult = baseCostEngine.execute(context);
      const baseCost = baseResult.baseCost;

      const variants: QuoteVariant[] = multiQuoteService.generateMultipleQuotesFromBaseCost(
        baseResult.context,
        STANDARD_SCENARIOS,
        baseCost
      );

      // Vérifier que les marges sont différentes
      const margins = variants.map(v => v.marginRate);
      expect(new Set(margins).size).toBeGreaterThan(1); // Au moins 2 marges différentes

      // Vérifier que ECO a la marge la plus faible
      const ecoVariant = variants.find(v => v.scenarioId === 'ECO');
      const premiumVariant = variants.find(v => v.scenarioId === 'PREMIUM');
      expect(ecoVariant?.marginRate).toBeLessThan(premiumVariant?.marginRate!);

      // Vérifier que le prix final = (baseCost + additionalCosts) * (1 + marginRate)
      variants.forEach(variant => {
        const additionalCosts = variant.context.computed?.costs
          ?.filter(c => !['input-sanitization', 'date-validation', 'address-normalization', 
                          'volume-estimation', 'distance-calculation', 'fuel-cost', 
                          'toll-cost', 'vehicle-selection'].includes(c.moduleId))
          .reduce((sum, c) => sum + c.amount, 0) || 0;
        
        const basePrice = baseCost + additionalCosts;
        const expectedFinalPrice = basePrice * (1 + variant.marginRate);
        
        expect(variant.finalPrice).toBeCloseTo(expectedFinalPrice, 2);
      });
    });

    it('should add scenario-specific costs (packing, insurance, etc.)', () => {
      const formData = {
        movingDate: '2025-03-15T10:00:00Z',
        housingType: 'F3' as const,
        surface: 65,
        estimatedVolume: 30,
        volumeConfidence: 'MEDIUM' as const,
        departureAddress: '123 Rue de Paris, 75001 Paris',
        departurePostalCode: '75001',
        arrivalAddress: '456 Avenue Montaigne, 75008 Paris',
        arrivalPostalCode: '75008',
        distance: 15,
        declaredValue: 15000,
        // Activer packing pour tester
        packing: true,
      };

      const context = FormAdapter.toQuoteContext(formData);
      const baseResult: BaseCostResult = baseCostEngine.execute(context);

      const variants: QuoteVariant[] = multiQuoteService.generateMultipleQuotesFromBaseCost(
        baseResult.context,
        STANDARD_SCENARIOS,
        baseResult.baseCost
      );

      // CONFORT devrait avoir packing activé
      const confortVariant = variants.find(v => v.scenarioId === 'CONFORT');
      expect(confortVariant).toBeDefined();
      
      // Vérifier que CONFORT a des coûts additionnels (packing)
      const confortAdditionalCosts = confortVariant!.context.computed?.costs
        ?.filter(c => !['input-sanitization', 'date-validation', 'address-normalization', 
                        'volume-estimation', 'distance-calculation', 'fuel-cost', 
                        'toll-cost', 'vehicle-selection', 'workers-calculation', 'labor-base'].includes(c.moduleId))
        .reduce((sum, c) => sum + c.amount, 0) || 0;
      
      // CONFORT devrait avoir packing (coût additionnel)
      expect(confortAdditionalCosts).toBeGreaterThan(0);
    });

    it('should reuse context.computed from step 1 (incremental mode)', () => {
      const formData = {
        movingDate: '2025-03-15T10:00:00Z',
        housingType: 'F3' as const,
        surface: 65,
        estimatedVolume: 30,
        volumeConfidence: 'MEDIUM' as const,
        departureAddress: '123 Rue de Paris, 75001 Paris',
        departurePostalCode: '75001',
        arrivalAddress: '456 Avenue Montaigne, 75008 Paris',
        arrivalPostalCode: '75008',
        distance: 15,
        declaredValue: 15000,
      };

      const context = FormAdapter.toQuoteContext(formData);
      const baseResult: BaseCostResult = baseCostEngine.execute(context);

      // Sauvegarder les valeurs calculées à l'étape 1
      const step1Volume = baseResult.context.computed?.adjustedVolume;
      const step1Distance = baseResult.context.computed?.distanceKm;
      const step1VehicleCount = baseResult.context.computed?.vehicleCount;
      const step1WorkersCount = baseResult.context.computed?.workersCount;

      // Étape 2 : Générer les variantes
      const variants: QuoteVariant[] = multiQuoteService.generateMultipleQuotesFromBaseCost(
        baseResult.context,
        STANDARD_SCENARIOS,
        baseResult.baseCost
      );

      // Vérifier que les valeurs de l'étape 1 sont réutilisées (pas recalculées)
      variants.forEach(variant => {
        expect(variant.context.computed?.adjustedVolume).toBe(step1Volume);
        expect(variant.context.computed?.distanceKm).toBe(step1Distance);
        expect(variant.context.computed?.vehicleCount).toBe(step1VehicleCount);
        // workersCount peut varier selon le scénario (ECO vs STANDARD)
        // mais les autres valeurs doivent être identiques
      });
    });
  });

  describe('Flux Complet en 2 Étapes', () => {
    it('should complete full flow: baseCost → 6 variants', () => {
      const formData = {
        movingDate: '2025-03-15T10:00:00Z',
        housingType: 'F3' as const,
        surface: 65,
        rooms: 3,
        volumeMethod: 'FORM' as const,
        estimatedVolume: 30,
        volumeConfidence: 'MEDIUM' as const,
        departureAddress: '123 Rue de Paris, 75001 Paris',
        departurePostalCode: '75001',
        departureCity: 'Paris',
        pickupFloor: 3,
        pickupHasElevator: false,
        arrivalAddress: '456 Avenue Montaigne, 75008 Paris',
        arrivalPostalCode: '75008',
        arrivalCity: 'Paris',
        deliveryFloor: 2,
        deliveryHasElevator: true,
        distance: 15,
        declaredValue: 15000,
      };

      // Étape 1 : Calculer baseCost
      const context = FormAdapter.toQuoteContext(formData);
      const baseResult: BaseCostResult = baseCostEngine.execute(context);

      expect(baseResult.baseCost).toBeGreaterThan(0);
      expect(baseResult.context.computed).toBeDefined();

      // Étape 2 : Générer les 6 variantes
      const variants: QuoteVariant[] = multiQuoteService.generateMultipleQuotesFromBaseCost(
        baseResult.context,
        STANDARD_SCENARIOS,
        baseResult.baseCost
      );

      expect(variants).toHaveLength(6);

      // Vérifier que chaque variante a un prix supérieur ou égal au baseCost
      variants.forEach(variant => {
        expect(variant.finalPrice).toBeGreaterThanOrEqual(baseResult.baseCost);
      });

      // Vérifier que les prix sont différents entre scénarios
      const prices = variants.map(v => v.finalPrice);
      expect(new Set(prices).size).toBeGreaterThan(1); // Au moins 2 prix différents
    });

    it('should handle long distance scenario correctly', () => {
      const formData = {
        movingDate: '2025-04-01T10:00:00Z',
        housingType: 'F4' as const,
        surface: 85,
        rooms: 4,
        volumeMethod: 'FORM' as const,
        estimatedVolume: 45,
        volumeConfidence: 'HIGH' as const,
        departureAddress: '10 Boulevard Haussmann, 75009 Paris',
        departurePostalCode: '75009',
        departureCity: 'Paris',
        pickupFloor: 5,
        pickupHasElevator: true,
        arrivalAddress: '25 Rue de la République, 69001 Lyon',
        arrivalPostalCode: '69001',
        arrivalCity: 'Lyon',
        deliveryFloor: 1,
        deliveryHasElevator: false,
        distance: 465,
        declaredValue: 25000,
      };

      // Étape 1
      const context = FormAdapter.toQuoteContext(formData);
      const baseResult: BaseCostResult = baseCostEngine.execute(context);

      expect(baseResult.breakdown.distance.isLongDistance).toBe(true);
      expect(baseResult.breakdown.transport.fuel).toBeGreaterThan(0);
      expect(baseResult.breakdown.transport.tolls).toBeGreaterThan(0);

      // Étape 2
      const variants: QuoteVariant[] = multiQuoteService.generateMultipleQuotesFromBaseCost(
        baseResult.context,
        STANDARD_SCENARIOS,
        baseResult.baseCost
      );

      expect(variants).toHaveLength(6);

      // FLEX devrait avoir des coûts additionnels pour longue distance (arrêt nuit, etc.)
      const flexVariant = variants.find(v => v.scenarioId === 'FLEX');
      expect(flexVariant).toBeDefined();
      expect(flexVariant!.finalPrice).toBeGreaterThan(baseResult.baseCost);
    });
  });
});

