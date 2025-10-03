/**
 * Tests pour CleaningConstraintsModal avec fallbacks centralisés
 */

import { describe, it, expect } from '@jest/globals';
import {
  cleaningConstraintsFallback,
  cleaningServicesFallback,
  allCleaningItemsFallback
} from '@/data/fallbacks';

describe('CleaningConstraintsModal - Fallbacks', () => {
  describe('Imports des fallbacks', () => {
    it('devrait importer cleaningConstraintsFallback correctement', () => {
      expect(cleaningConstraintsFallback).toBeDefined();
      expect(Array.isArray(cleaningConstraintsFallback)).toBe(true);
      expect(cleaningConstraintsFallback.length).toBeGreaterThan(0);
    });

    it('devrait importer cleaningServicesFallback correctement', () => {
      expect(cleaningServicesFallback).toBeDefined();
      expect(Array.isArray(cleaningServicesFallback)).toBe(true);
      expect(cleaningServicesFallback.length).toBeGreaterThan(0);
    });

    it('devrait importer allCleaningItemsFallback correctement', () => {
      expect(allCleaningItemsFallback).toBeDefined();
      expect(Array.isArray(allCleaningItemsFallback)).toBe(true);
      expect(allCleaningItemsFallback.length).toBe(
        cleaningConstraintsFallback.length + cleaningServicesFallback.length
      );
    });
  });

  describe('Structure des contraintes', () => {
    it('chaque contrainte devrait avoir les propriétés requises', () => {
      cleaningConstraintsFallback.forEach((constraint) => {
        expect(constraint).toHaveProperty('id');
        expect(constraint).toHaveProperty('name');
        expect(constraint).toHaveProperty('type');
        expect(constraint.type).toBe('constraint');

        // Propriétés optionnelles mais attendues
        expect(constraint).toHaveProperty('description');
        expect(constraint).toHaveProperty('category');
        expect(constraint).toHaveProperty('icon');
        expect(constraint).toHaveProperty('value');
        expect(constraint).toHaveProperty('impact');
      });
    });

    it('chaque contrainte devrait avoir un nom non vide', () => {
      cleaningConstraintsFallback.forEach((constraint) => {
        expect(constraint.name).toBeTruthy();
        expect(constraint.name.length).toBeGreaterThan(0);
      });
    });

    it('chaque contrainte devrait avoir une icône', () => {
      cleaningConstraintsFallback.forEach((constraint) => {
        expect(constraint.icon).toBeTruthy();
        expect(typeof constraint.icon).toBe('string');
      });
    });
  });

  describe('Structure des services', () => {
    it('chaque service devrait avoir les propriétés requises', () => {
      cleaningServicesFallback.forEach((service) => {
        expect(service).toHaveProperty('id');
        expect(service).toHaveProperty('name');
        expect(service).toHaveProperty('type');
        expect(service.type).toBe('service');
      });
    });

    it('chaque service devrait avoir un nom non vide', () => {
      cleaningServicesFallback.forEach((service) => {
        expect(service.name).toBeTruthy();
        expect(service.name.length).toBeGreaterThan(0);
      });
    });

    it('chaque service devrait avoir une valeur numérique', () => {
      cleaningServicesFallback.forEach((service) => {
        expect(service.value).toBeDefined();
        expect(typeof service.value).toBe('number');
        expect(service.value).toBeGreaterThan(0);
      });
    });
  });

  describe('Cohérence des données', () => {
    it('ne devrait pas avoir d\'IDs dupliqués', () => {
      const ids = allCleaningItemsFallback.map(item => item.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('toutes les contraintes devraient avoir type="constraint"', () => {
      const constraints = allCleaningItemsFallback.filter(item => item.type === 'constraint');
      expect(constraints.length).toBe(cleaningConstraintsFallback.length);
    });

    it('tous les services devraient avoir type="service"', () => {
      const services = allCleaningItemsFallback.filter(item => item.type === 'service');
      expect(services.length).toBe(cleaningServicesFallback.length);
    });

    it('les valeurs d\'impact devraient correspondre aux valeurs', () => {
      allCleaningItemsFallback.forEach((item) => {
        if (item.value && item.impact) {
          expect(item.impact).toBe(`+${item.value}€`);
        }
      });
    });
  });

  describe('Catégories', () => {
    it('toutes les contraintes devraient avoir une catégorie valide', () => {
      const validCategories = ['access', 'work', 'schedule', 'location', 'utilities', 'surcharge', 'other'];

      cleaningConstraintsFallback.forEach((constraint) => {
        expect(constraint.category).toBeTruthy();
        expect(validCategories).toContain(constraint.category);
      });
    });

    it('tous les services devraient avoir une catégorie valide', () => {
      const validCategories = ['specialized', 'disinfection', 'maintenance', 'logistics', 'fixed', 'other'];

      cleaningServicesFallback.forEach((service) => {
        expect(service.category).toBeTruthy();
        expect(validCategories).toContain(service.category);
      });
    });
  });

  describe('Génération automatique', () => {
    it('les données devraient provenir de fichiers générés', () => {
      // Les IDs générés suivent le pattern rule_*
      allCleaningItemsFallback.forEach((item) => {
        expect(item.id).toMatch(/^rule_[a-z0-9]+$/);
      });
    });

    it('devrait avoir au moins 30 items au total', () => {
      // Validation basique pour s'assurer que la génération a fonctionné
      expect(allCleaningItemsFallback.length).toBeGreaterThanOrEqual(30);
    });
  });
});
