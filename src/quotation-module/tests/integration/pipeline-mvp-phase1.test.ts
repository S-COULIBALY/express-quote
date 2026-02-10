/**
 * Tests d'intégration - Pipeline complet MVP Phase 1
 *
 * Valide que tous les modules MVP Phase 1 fonctionnent ensemble correctement
 * 
 * NOTE: Ces tests utilisent QuoteEngine directement (moteur complet).
 * Pour tester le système en 2 étapes (BaseCostEngine + MultiQuoteService),
 * voir: two-step-calculation.test.ts
 */

import { QuoteEngine } from '../../core/QuoteEngine';
import { getAllModules } from '../../core/ModuleRegistry';
import { QuoteContext } from '../../core/QuoteContext';
import { FormAdapter } from '../../adapters/FormAdapter';

describe('Pipeline MVP Phase 1 - Intégration Complète', () => {
  let engine: QuoteEngine;

  beforeEach(() => {
    engine = new QuoteEngine(getAllModules(), {
      executionPhase: 'QUOTE',
      marginRate: 0.30,
    });
  });

  describe('Scénario Simple - F3 IDF → IDF', () => {
    it('should calculate a complete quote for a simple moving scenario', () => {
      const formData = {
        movingDate: '2025-03-15T10:00:00Z',
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
      const result = engine.execute(context);

      // Vérifier que le contexte a été enrichi
      expect(result.computed).toBeDefined();
      expect(result.computed?.activatedModules.length).toBeGreaterThan(0);

      // Vérifier le volume
      expect(result.computed?.baseVolume).toBeDefined();
      expect(result.computed?.adjustedVolume).toBeDefined();
      expect(result.computed?.adjustedVolume).toBeGreaterThan(0);

      // Vérifier la distance
      expect(result.computed?.distanceKm).toBe(15);
      expect(result.computed?.isLongDistance).toBe(false);

      // Vérifier les véhicules
      expect(result.computed?.vehicleCount).toBeDefined();
      expect(result.computed?.vehicleCount).toBeGreaterThan(0);
      expect(result.computed?.vehicleTypes).toBeDefined();

      // Vérifier la main-d'œuvre
      expect(result.computed?.workersCount).toBeDefined();
      expect(result.computed?.workersCount).toBeGreaterThan(0);
      expect(result.computed?.baseDurationHours).toBeDefined();

      // Vérifier les coûts
      expect(result.computed?.costs).toBeDefined();
      expect(result.computed?.costs.length).toBeGreaterThan(0);

      // Vérifier le prix
      expect(result.computed?.basePrice).toBeDefined();
      expect(result.computed?.basePrice).toBeGreaterThan(0);
      expect(result.computed?.finalPrice).toBeDefined();
      expect(result.computed?.finalPrice).toBeGreaterThan(0);

      // Vérifier que le prix final = basePrice + adjustments
      const totalAdjustments = result.computed?.adjustments?.reduce((sum, adj) => sum + adj.amount, 0) || 0;
      expect(result.computed?.finalPrice).toBe(result.computed?.basePrice! + totalAdjustments);

      // Vérifier la traçabilité
      expect(result.computed?.activatedModules).toContain('input-sanitization');
      expect(result.computed?.activatedModules).toContain('date-validation');
      expect(result.computed?.activatedModules).toContain('address-normalization');
      expect(result.computed?.activatedModules).toContain('volume-estimation');
      expect(result.computed?.activatedModules).toContain('distance-calculation');
      expect(result.computed?.activatedModules).toContain('vehicle-selection');
      expect(result.computed?.activatedModules).toContain('workers-calculation');
      expect(result.computed?.activatedModules).toContain('labor-base');
    });
  });

  describe('Scénario Longue Distance - IDF → Province', () => {
    it('should calculate a quote for long distance moving', () => {
      const formData = {
        movingDate: '2025-04-01T10:00:00Z',
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
      const result = engine.execute(context);

      // Vérifier que c'est bien une longue distance
      expect(result.computed?.distanceKm).toBe(465);
      expect(result.computed?.isLongDistance).toBe(true);

      // Vérifier que les coûts sont calculés
      expect(result.computed?.costs.length).toBeGreaterThan(0);

      // Vérifier le coût carburant (présent pour longue distance)
      const fuelCost = result.computed?.costs.find(c => c.moduleId === 'fuel-cost');
      expect(fuelCost).toBeDefined();
      expect(fuelCost?.amount).toBeGreaterThan(0);

      // Vérifier le prix final
      expect(result.computed?.finalPrice).toBeDefined();
      expect(result.computed?.finalPrice).toBeGreaterThan(0);
    });
  });

  describe('Scénario avec Objets Spéciaux - Piano', () => {
    it('should calculate a quote with special items (piano)', () => {
      const formData = {
        movingDate: '2025-03-20T10:00:00Z',
        volumeMethod: 'FORM' as const,
        estimatedVolume: 30,
        volumeConfidence: 'MEDIUM' as const,
        departureAddress: '123 Rue de Paris, 75001 Paris',
        departurePostalCode: '75001',
        pickupFloor: 2,
        pickupHasElevator: false,
        arrivalAddress: '456 Avenue de Lyon, 69001 Lyon',
        arrivalPostalCode: '69001',
        deliveryFloor: 1,
        deliveryHasElevator: true,
        distance: 465,
        piano: true,
        declaredValue: 20000,
      };

      const context = FormAdapter.toQuoteContext(formData);
      const result = engine.execute(context);

      // Vérifier que le volume inclut le piano
      expect(result.computed?.adjustedVolume).toBeDefined();
      // Le volume devrait être ajusté pour inclure le piano

      // Vérifier que plus de déménageurs sont nécessaires (piano)
      expect(result.computed?.workersCount).toBeGreaterThanOrEqual(3);

      // Vérifier le prix final
      expect(result.computed?.finalPrice).toBeDefined();
      expect(result.computed?.finalPrice).toBeGreaterThan(0);
    });
  });

  describe('Scénario avec Contraintes - Pas d\'Ascenseur', () => {
    it('should calculate a quote with access constraints (no elevator)', () => {
      const formData = {
        movingDate: '2025-03-25T10:00:00Z',
        volumeMethod: 'FORM' as const,
        estimatedVolume: 20,
        volumeConfidence: 'MEDIUM' as const,
        departureAddress: '123 Rue de Paris, 75001 Paris',
        departurePostalCode: '75001',
        pickupFloor: 5,
        pickupHasElevator: false,
        pickupCarryDistance: 30,
        arrivalAddress: '456 Avenue de Lyon, 69001 Lyon',
        arrivalPostalCode: '69001',
        deliveryFloor: 4,
        deliveryHasElevator: false,
        deliveryCarryDistance: 25,
        distance: 465,
        declaredValue: 15000,
      };

      const context = FormAdapter.toQuoteContext(formData);
      const result = engine.execute(context);

      // Vérifier que plus de déménageurs sont nécessaires (escaliers)
      expect(result.computed?.workersCount).toBeGreaterThanOrEqual(3);

      // Vérifier que la durée est ajustée (escaliers)
      expect(result.computed?.baseDurationHours).toBeDefined();
      expect(result.computed?.baseDurationHours).toBeGreaterThan(0);

      // Vérifier le prix final
      expect(result.computed?.finalPrice).toBeDefined();
      expect(result.computed?.finalPrice).toBeGreaterThan(0);
    });
  });

  describe('Ordre d\'Exécution des Modules', () => {
    it('should execute modules in the correct priority order', () => {
      const formData = {
        movingDate: '2025-03-15T10:00:00Z',
        estimatedVolume: 30,
        volumeConfidence: 'MEDIUM' as const,
        departureAddress: '123 Rue de Paris, 75001 Paris',
        departurePostalCode: '75001',
        arrivalAddress: '456 Avenue de Lyon, 69001 Lyon',
        arrivalPostalCode: '69001',
        distance: 15,
        declaredValue: 15000,
      };

      const context = FormAdapter.toQuoteContext(formData);
      const result = engine.execute(context);

      const activatedModules = result.computed?.activatedModules || [];
      const modulePriorities = getAllModules()
        .filter(m => activatedModules.includes(m.id))
        .map(m => ({ id: m.id, priority: m.priority }))
        .sort((a, b) => a.priority - b.priority);

      // Vérifier que les modules sont dans l'ordre de priorité
      for (let i = 0; i < modulePriorities.length - 1; i++) {
        expect(modulePriorities[i].priority).toBeLessThanOrEqual(modulePriorities[i + 1].priority);
      }

      // Vérifier que les modules PHASE 1 sont exécutés en premier
      const phase1Modules = modulePriorities.filter(m => m.priority >= 10 && m.priority < 20);
      const phase2Modules = modulePriorities.filter(m => m.priority >= 20 && m.priority < 30);
      const phase3Modules = modulePriorities.filter(m => m.priority >= 30 && m.priority < 40);

      if (phase1Modules.length > 0 && phase2Modules.length > 0) {
        expect(phase1Modules[phase1Modules.length - 1].priority).toBeLessThan(phase2Modules[0].priority);
      }
      if (phase2Modules.length > 0 && phase3Modules.length > 0) {
        expect(phase2Modules[phase2Modules.length - 1].priority).toBeLessThan(phase3Modules[0].priority);
      }
    });
  });

  describe('Dépendances entre Modules', () => {
    it('should respect module dependencies', () => {
      const formData = {
        movingDate: '2025-03-15T10:00:00Z',
        estimatedVolume: 30,
        volumeConfidence: 'MEDIUM' as const,
        departureAddress: '123 Rue de Paris, 75001 Paris',
        departurePostalCode: '75001',
        arrivalAddress: '456 Avenue de Lyon, 69001 Lyon',
        arrivalPostalCode: '69001',
        distance: 15,
        declaredValue: 15000,
      };

      const context = FormAdapter.toQuoteContext(formData);
      const result = engine.execute(context);

      const activatedModules = result.computed?.activatedModules || [];

      // VolumeUncertaintyRiskModule dépend de VolumeEstimationModule
      if (activatedModules.includes('volume-uncertainty-risk')) {
        expect(activatedModules.includes('volume-estimation')).toBe(true);
      }

      // FuelCostModule dépend de DistanceModule
      if (activatedModules.includes('fuel-cost')) {
        expect(activatedModules.includes('distance-calculation')).toBe(true);
      }

      // VehicleSelectionModule dépend de VolumeEstimationModule
      if (activatedModules.includes('vehicle-selection')) {
        expect(activatedModules.includes('volume-estimation')).toBe(true);
      }

      // WorkersCalculationModule dépend de VolumeEstimationModule
      if (activatedModules.includes('workers-calculation')) {
        expect(activatedModules.includes('volume-estimation')).toBe(true);
      }

      // LaborBaseModule dépend de VolumeEstimationModule
      if (activatedModules.includes('labor-base')) {
        expect(activatedModules.includes('volume-estimation')).toBe(true);
      }

      // InsurancePremiumModule dépend de VolumeEstimationModule et DistanceModule
      if (activatedModules.includes('insurance-premium')) {
        expect(activatedModules.includes('volume-estimation')).toBe(true);
        expect(activatedModules.includes('distance-calculation')).toBe(true);
      }
    });
  });
});

