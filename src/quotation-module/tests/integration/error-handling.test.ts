/**
 * Tests d'intégration - Gestion d'Erreurs
 *
 * Valide que le moteur gère correctement les erreurs selon les phases
 * 
 * NOTE: Ces tests utilisent QuoteEngine directement (moteur complet).
 * Les erreurs sont gérées de la même manière dans BaseCostEngine et MultiQuoteService.
 */

import { QuoteEngine } from '../../core/QuoteEngine';
import { getAllModules } from '../../core/ModuleRegistry';
import { QuoteContext } from '../../core/QuoteContext';
import { FormAdapter } from '../../adapters/FormAdapter';

describe('Gestion d\'Erreurs - Intégration', () => {
  let engine: QuoteEngine;

  beforeEach(() => {
    engine = new QuoteEngine(getAllModules(), {
      executionPhase: 'QUOTE',
      marginRate: 0.30,
    });
  });

  describe('Erreurs PHASE 1 (Critiques)', () => {
    it('should throw error when movingDate is missing', () => {
      const formData = {
        // movingDate manquant intentionnellement
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

      // DateValidationModule (PHASE 1, priority 11) devrait lancer une erreur
      expect(() => {
        engine.execute(context);
      }).toThrow(/Date de déménagement manquante/);
    });

    it('should throw error when movingDate is in the past', () => {
      const formData = {
        movingDate: '2020-01-01T10:00:00Z', // Date dans le passé
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

      // DateValidationModule devrait lancer une erreur
      expect(() => {
        engine.execute(context);
      }).toThrow(/Date de déménagement dans le passé/);
    });

    it('should throw error when movingDate format is invalid', () => {
      const formData = {
        movingDate: 'invalid-date-format',
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

      // DateValidationModule devrait lancer une erreur
      expect(() => {
        engine.execute(context);
      }).toThrow(/Date de déménagement invalide/);
    });
  });

  describe('Résilience Autres Phases', () => {
    it('should continue execution even if a non-critical module fails', () => {
      const formData = {
        movingDate: '2025-03-15T10:00:00Z',
        estimatedVolume: 30,
        volumeConfidence: 'MEDIUM' as const,
        departureAddress: '123 Rue de Paris, 75001 Paris',
        departurePostalCode: '75001',
        arrivalAddress: '456 Avenue de Lyon, 69001 Lyon',
        arrivalPostalCode: '69001',
        distance: 15,
        // declaredValue manquant intentionnellement (pour tester résilience)
      };

      const context = FormAdapter.toQuoteContext(formData);

      // Le moteur devrait continuer même si InsurancePremiumModule ne peut pas s'exécuter
      const result = engine.execute(context);

      // Vérifier que le calcul a continué
      expect(result.computed).toBeDefined();
      expect(result.computed?.activatedModules.length).toBeGreaterThan(0);

      // Vérifier que le prix de base est calculé même sans assurance
      expect(result.computed?.basePrice).toBeDefined();
      expect(result.computed?.basePrice).toBeGreaterThan(0);

      // InsurancePremiumModule ne devrait pas être activé (declaredValue manquant)
      expect(result.computed?.activatedModules).not.toContain('insurance-premium');
    });

    it('should handle missing optional data gracefully', () => {
      const formData = {
        movingDate: '2025-03-15T10:00:00Z',
        // Données minimales uniquement
        departureAddress: '123 Rue de Paris, 75001 Paris',
        arrivalAddress: '456 Avenue de Lyon, 69001 Lyon',
        distance: 15,
      };

      const context = FormAdapter.toQuoteContext(formData);

      // Le moteur devrait fonctionner avec des données minimales
      const result = engine.execute(context);

      expect(result.computed).toBeDefined();
      expect(result.computed?.activatedModules.length).toBeGreaterThan(0);

      // VolumeEstimationModule devrait calculer un volume par défaut
      expect(result.computed?.adjustedVolume).toBeDefined();
      expect(result.computed?.adjustedVolume).toBeGreaterThan(0);
    });
  });

  describe('Validation des Données d\'Entrée', () => {
    it('should sanitize dangerous input', () => {
      const formData = {
        movingDate: '2025-03-15T10:00:00Z',
        estimatedVolume: 30,
        volumeConfidence: 'MEDIUM' as const,
        departureAddress: '123 Rue <script>alert("xss")</script> de Paris',
        departurePostalCode: '75 001',
        arrivalAddress: '456 Avenue de Lyon',
        arrivalPostalCode: '69001',
        distance: 15,
        declaredValue: 15000,
      };

      const context = FormAdapter.toQuoteContext(formData);
      const result = engine.execute(context);

      // InputSanitizationModule devrait avoir sanitizé les données
      expect(result.departureAddress).not.toContain('<script>');
      expect(result.departureAddress).not.toContain('alert');
      expect(result.departurePostalCode).toBe('75001'); // Espaces supprimés
    });

    it('should handle invalid numbers gracefully', () => {
      const formData = {
        movingDate: '2025-03-15T10:00:00Z',
        estimatedVolume: NaN as any,
        distance: Infinity as any,
        departureAddress: '123 Rue de Paris, 75001 Paris',
        departurePostalCode: '75001',
        arrivalAddress: '456 Avenue de Lyon, 69001 Lyon',
        arrivalPostalCode: '69001',
        declaredValue: 15000,
      };

      const context = FormAdapter.toQuoteContext(formData);
      const result = engine.execute(context);

      // Les valeurs invalides devraient être undefined
      expect(result.estimatedVolume).toBeUndefined();
      expect(result.distance).toBeUndefined();

      // Le moteur devrait quand même fonctionner
      expect(result.computed).toBeDefined();
    });
  });

  describe('Gestion des Dépendances Manquantes', () => {
    it('should skip modules when dependencies are missing', () => {
      const formData = {
        movingDate: '2025-03-15T10:00:00Z',
        // estimatedVolume manquant intentionnellement
        departureAddress: '123 Rue de Paris, 75001 Paris',
        departurePostalCode: '75001',
        arrivalAddress: '456 Avenue de Lyon, 69001 Lyon',
        arrivalPostalCode: '69001',
        distance: 15,
        declaredValue: 15000,
      };

      const context = FormAdapter.toQuoteContext(formData);
      const result = engine.execute(context);

      // VolumeEstimationModule devrait calculer un volume par défaut
      expect(result.computed?.adjustedVolume).toBeDefined();

      // Les modules dépendants devraient quand même s'exécuter
      expect(result.computed?.activatedModules).toContain('volume-estimation');
      expect(result.computed?.activatedModules).toContain('vehicle-selection');
    });
  });
});

