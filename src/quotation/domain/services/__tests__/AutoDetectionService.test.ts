/**
 * ============================================================================
 * TESTS UNITAIRES - AUTO DETECTION SERVICE
 * ============================================================================
 *
 * Tests complets pour le service d'auto-détection des contraintes.
 * Couvre tous les cas d'usage identifiés dans le rapport de duplication.
 */

import { AutoDetectionService, AddressData } from '../AutoDetectionService';

describe('AutoDetectionService', () => {

  describe('detectFurnitureLift', () => {

    it('devrait NE PAS détecter monte-meuble pour étage <= 3 sans ascenseur', () => {
      const addressData: AddressData = {
        floor: 3,
        elevator: 'no'
      };

      const result = AutoDetectionService.detectFurnitureLift(addressData);

      expect(result.furnitureLiftRequired).toBe(false);
    });

    it('devrait détecter monte-meuble pour étage > 3 sans ascenseur', () => {
      const addressData: AddressData = {
        floor: 4,
        elevator: 'no'
      };

      const result = AutoDetectionService.detectFurnitureLift(addressData);

      expect(result.furnitureLiftRequired).toBe(true);
      expect(result.furnitureLiftReason).toContain('Étage 4');
    });

    it('devrait NE PAS détecter monte-meuble avec ascenseur medium fonctionnel', () => {
      const addressData: AddressData = {
        floor: 5,
        elevator: 'medium',
        elevatorUnavailable: false,
        elevatorUnsuitable: false,
        elevatorForbiddenMoving: false
      };

      const result = AutoDetectionService.detectFurnitureLift(addressData);

      expect(result.furnitureLiftRequired).toBe(false);
    });

    it('devrait NE PAS détecter monte-meuble avec ascenseur large fonctionnel', () => {
      const addressData: AddressData = {
        floor: 10,
        elevator: 'large',
        elevatorUnavailable: false,
        elevatorUnsuitable: false,
        elevatorForbiddenMoving: false
      };

      const result = AutoDetectionService.detectFurnitureLift(addressData);

      expect(result.furnitureLiftRequired).toBe(false);
    });

    it('devrait détecter monte-meuble avec ascenseur medium indisponible et étage > 3', () => {
      const addressData: AddressData = {
        floor: 5,
        elevator: 'medium',
        elevatorUnavailable: true
      };

      const result = AutoDetectionService.detectFurnitureLift(addressData);

      expect(result.furnitureLiftRequired).toBe(true);
      expect(result.furnitureLiftReason).toContain('indisponible');
    });

    it('devrait détecter monte-meuble avec ascenseur medium inadapté et étage > 3', () => {
      const addressData: AddressData = {
        floor: 6,
        elevator: 'medium',
        elevatorUnsuitable: true
      };

      const result = AutoDetectionService.detectFurnitureLift(addressData);

      expect(result.furnitureLiftRequired).toBe(true);
      expect(result.furnitureLiftReason).toContain('inadapté');
    });

    it('devrait détecter monte-meuble avec ascenseur interdit déménagement et étage > 3', () => {
      const addressData: AddressData = {
        floor: 4,
        elevator: 'large',
        elevatorForbiddenMoving: true
      };

      const result = AutoDetectionService.detectFurnitureLift(addressData);

      expect(result.furnitureLiftRequired).toBe(true);
      expect(result.furnitureLiftReason).toContain('interdit déménagement');
    });

    it('devrait NE PAS détecter monte-meuble avec petit ascenseur et étage <= 3', () => {
      const addressData: AddressData = {
        floor: 2,
        elevator: 'small'
      };

      const result = AutoDetectionService.detectFurnitureLift(addressData);

      expect(result.furnitureLiftRequired).toBe(false);
    });

    it('devrait détecter monte-meuble avec petit ascenseur et étage > 3', () => {
      const addressData: AddressData = {
        floor: 5,
        elevator: 'small'
      };

      const result = AutoDetectionService.detectFurnitureLift(addressData);

      expect(result.furnitureLiftRequired).toBe(true);
      expect(result.furnitureLiftReason).toContain('small');
    });

    it('devrait NE PAS détecter monte-meuble pour RDC (étage 0)', () => {
      const addressData: AddressData = {
        floor: 0,
        elevator: 'no'
      };

      const result = AutoDetectionService.detectFurnitureLift(addressData);

      expect(result.furnitureLiftRequired).toBe(false);
    });

    it('devrait NE PAS détecter monte-meuble pour 1er étage', () => {
      const addressData: AddressData = {
        floor: 1,
        elevator: 'no'
      };

      const result = AutoDetectionService.detectFurnitureLift(addressData);

      expect(result.furnitureLiftRequired).toBe(false);
    });
  });

  describe('detectLongCarryingDistance', () => {

    it('devrait NE PAS détecter distance longue pour 0-10m', () => {
      const addressData: AddressData = {
        floor: 2,
        elevator: 'no',
        carryDistance: '0-10'
      };

      const result = AutoDetectionService.detectLongCarryingDistance(addressData);

      expect(result.longCarryingDistance).toBe(false);
    });

    it('devrait NE PAS détecter distance longue pour 10-30m', () => {
      const addressData: AddressData = {
        floor: 2,
        elevator: 'no',
        carryDistance: '10-30'
      };

      const result = AutoDetectionService.detectLongCarryingDistance(addressData);

      expect(result.longCarryingDistance).toBe(false);
    });

    it('devrait détecter distance longue pour 30+m', () => {
      const addressData: AddressData = {
        floor: 2,
        elevator: 'no',
        carryDistance: '30+'
      };

      const result = AutoDetectionService.detectLongCarryingDistance(addressData);

      expect(result.longCarryingDistance).toBe(true);
      expect(result.carryingDistanceReason).toContain('> 30m');
    });

    it('devrait NE PAS détecter si carryDistance non défini', () => {
      const addressData: AddressData = {
        floor: 2,
        elevator: 'no'
      };

      const result = AutoDetectionService.detectLongCarryingDistance(addressData);

      expect(result.longCarryingDistance).toBe(false);
    });
  });

  describe('detectAutomaticConstraints', () => {

    it('devrait détecter monte-meuble au départ et distance portage à l\'arrivée', () => {
      const pickupData: AddressData = {
        floor: 5,
        elevator: 'no'
      };

      const deliveryData: AddressData = {
        floor: 1,
        elevator: 'large',
        carryDistance: '30+'
      };

      const result = AutoDetectionService.detectAutomaticConstraints(
        pickupData,
        deliveryData
      );

      expect(result.pickup.furnitureLiftRequired).toBe(true);
      expect(result.delivery.longCarryingDistance).toBe(true);
      expect(result.appliedConstraints).toHaveLength(2);
      expect(result.totalSurcharge).toBe(250); // 200 (monte-meuble) + 50 (portage)
    });

    it('devrait détecter monte-meuble aux deux adresses', () => {
      const pickupData: AddressData = {
        floor: 4,
        elevator: 'no'
      };

      const deliveryData: AddressData = {
        floor: 5,
        elevator: 'small'
      };

      const result = AutoDetectionService.detectAutomaticConstraints(
        pickupData,
        deliveryData
      );

      expect(result.pickup.furnitureLiftRequired).toBe(true);
      expect(result.delivery.furnitureLiftRequired).toBe(true);
      expect(result.appliedConstraints).toHaveLength(2);
      expect(result.totalSurcharge).toBe(400); // 200 + 200
    });

    it('devrait détecter distance portage aux deux adresses', () => {
      const pickupData: AddressData = {
        floor: 1,
        elevator: 'large',
        carryDistance: '30+'
      };

      const deliveryData: AddressData = {
        floor: 0,
        elevator: 'no',
        carryDistance: '30+'
      };

      const result = AutoDetectionService.detectAutomaticConstraints(
        pickupData,
        deliveryData
      );

      expect(result.pickup.longCarryingDistance).toBe(true);
      expect(result.delivery.longCarryingDistance).toBe(true);
      expect(result.appliedConstraints).toHaveLength(2);
      expect(result.totalSurcharge).toBe(100); // 50 + 50
    });

    it('devrait ne détecter aucune contrainte pour situation simple', () => {
      const pickupData: AddressData = {
        floor: 2,
        elevator: 'large',
        carryDistance: '0-10'
      };

      const deliveryData: AddressData = {
        floor: 1,
        elevator: 'medium',
        carryDistance: '10-30'
      };

      const result = AutoDetectionService.detectAutomaticConstraints(
        pickupData,
        deliveryData
      );

      expect(result.appliedConstraints).toHaveLength(0);
      expect(result.totalSurcharge).toBe(0);
    });

    it('devrait gérer cas complexe avec toutes les contraintes', () => {
      const pickupData: AddressData = {
        floor: 6,
        elevator: 'no',
        carryDistance: '30+'
      };

      const deliveryData: AddressData = {
        floor: 8,
        elevator: 'small',
        carryDistance: '30+'
      };

      const result = AutoDetectionService.detectAutomaticConstraints(
        pickupData,
        deliveryData
      );

      expect(result.appliedConstraints).toHaveLength(4); // 2 monte-meubles + 2 portages
      expect(result.totalSurcharge).toBe(500); // (200+50) + (200+50)
    });
  });

  describe('getAutomaticConstraintIds', () => {

    it('devrait retourner les IDs des contraintes par adresse', () => {
      const pickupData: AddressData = {
        floor: 5,
        elevator: 'no',
        carryDistance: '30+'
      };

      const deliveryData: AddressData = {
        floor: 1,
        elevator: 'large'
      };

      const detectionResult = AutoDetectionService.detectAutomaticConstraints(
        pickupData,
        deliveryData
      );

      const ids = AutoDetectionService.getAutomaticConstraintIds(detectionResult);

      expect(ids.pickup).toContain('furniture_lift');
      expect(ids.pickup).toContain('long_carrying_distance');
      expect(ids.delivery).toHaveLength(0);
    });
  });

  describe('getSummary', () => {

    it('devrait générer un résumé des détections', () => {
      const pickupData: AddressData = {
        floor: 5,
        elevator: 'no'
      };

      const deliveryData: AddressData = {
        floor: 1,
        elevator: 'large',
        carryDistance: '30+'
      };

      const result = AutoDetectionService.detectAutomaticConstraints(
        pickupData,
        deliveryData
      );

      const summary = AutoDetectionService.getSummary(result);

      expect(summary.length).toBeGreaterThan(0);
      expect(summary.some(line => line.includes('départ'))).toBe(true);
      expect(summary.some(line => line.includes('arrivée'))).toBe(true);
      expect(summary.some(line => line.includes('TOTAL'))).toBe(true);
    });

    it('devrait indiquer aucune contrainte si rien détecté', () => {
      const pickupData: AddressData = {
        floor: 1,
        elevator: 'large'
      };

      const deliveryData: AddressData = {
        floor: 2,
        elevator: 'medium'
      };

      const result = AutoDetectionService.detectAutomaticConstraints(
        pickupData,
        deliveryData
      );

      const summary = AutoDetectionService.getSummary(result);

      expect(summary).toContain('Aucune contrainte automatique détectée');
    });
  });

  describe('validateAddressData', () => {

    it('devrait valider des données correctes', () => {
      const addressData: AddressData = {
        floor: 3,
        elevator: 'medium',
        carryDistance: '10-30'
      };

      const isValid = AutoDetectionService.validateAddressData(addressData);

      expect(isValid).toBe(true);
    });

    it('devrait rejeter étage négatif', () => {
      const addressData: AddressData = {
        floor: -1,
        elevator: 'no'
      };

      const isValid = AutoDetectionService.validateAddressData(addressData);

      expect(isValid).toBe(false);
    });

    it('devrait rejeter type ascenseur invalide', () => {
      const addressData: AddressData = {
        floor: 2,
        elevator: 'invalid' as any
      };

      const isValid = AutoDetectionService.validateAddressData(addressData);

      expect(isValid).toBe(false);
    });

    it('devrait rejeter distance portage invalide', () => {
      const addressData: AddressData = {
        floor: 2,
        elevator: 'no',
        carryDistance: 'invalid' as any
      };

      const isValid = AutoDetectionService.validateAddressData(addressData);

      expect(isValid).toBe(false);
    });
  });
});