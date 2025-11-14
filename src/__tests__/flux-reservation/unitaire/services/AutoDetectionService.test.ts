/**
 * 🧪 **TESTS UNITAIRES - AutoDetectionService**
 * 
 * Tests unitaires pour le service d'auto-détection des contraintes logistiques.
 */

import { AutoDetectionService, AddressData, FormAddressData } from '@/quotation/domain/services/AutoDetectionService';

// Mock des constantes - UUIDs réels de la BDD
jest.mock('@/quotation/domain/constants/RuleUUIDs', () => ({
  // UUIDs réels des contraintes
  RULE_UUID_ESCALIER_DIFFICILE: '40acdd70-5c1f-4936-a53c-8f52e6695a4c', // PICKUP
  RULE_UUID_COULOIRS_ETROITS: 'b2b8f00b-00a2-456c-ad06-1150d25d71a3', // PICKUP
  RULE_UUID_MEUBLES_ENCOMBRANTS: '55ea42b9-aed0-465c-8e5f-ee82a7bb8c85', // PICKUP (ascenseur trop petit)
  RULE_UUID_OBJETS_LOURDS: '352eabed-8869-460f-b7f0-99237b003cc1', // Service objets fragiles
  RULE_UUID_DISTANCE_PORTAGE: 'ca6cb6e5-9f5a-4d50-8200-d78d9dedd901', // DELIVERY
  RULE_UUID_PASSAGE_INDIRECT: '8a7f2b1d-3c45-4e89-b234-5d6e7f8g9h0i', // DELIVERY (accès étroit)
  RULE_UUID_ACCES_MULTINIVEAU: '293dc311-6f22-42d8-8b31-b322c0e888f9', // BOTH
  RULE_UUID_MONTE_MEUBLE: '5cdd32e3-23d5-413e-a9b4-26a746066ce0', // Service monte-meuble

  // Contraintes consommées par le monte-meuble
  CONSUMED_BY_FURNITURE_LIFT: [
    '40acdd70-5c1f-4936-a53c-8f52e6695a4c', // escalier_difficile
    'b2b8f00b-00a2-456c-ad06-1150d25d71a3', // couloirs_etroits
    '55ea42b9-aed0-465c-8e5f-ee82a7bb8c85', // ascenseur trop petit
    '352eabed-8869-460f-b7f0-99237b003cc1'  // objets_lourds
  ],

  // Contraintes critiques nécessitant un monte-meuble
  CRITICAL_CONSTRAINTS_REQUIRING_LIFT: [
    '40acdd70-5c1f-4936-a53c-8f52e6695a4c', // escalier_difficile
    '55ea42b9-aed0-465c-8e5f-ee82a7bb8c85'  // meubles_encombrants (ascenseur trop petit)
  ]
}));

describe('AutoDetectionService', () => {
  describe('detectAutomaticConstraints', () => {
    test('détecter monte-meuble requis au départ', () => {
      const pickupData: AddressData = {
        floor: 4,
        elevator: 'no',
        carryDistance: '0-10'
      };

      const deliveryData: AddressData = {
        floor: 1,
        elevator: 'large',
        carryDistance: '0-10'
      };

      const result = AutoDetectionService.detectAutomaticConstraints(
        pickupData,
        deliveryData,
        25
      );

      expect(result.pickup.furnitureLiftRequired).toBe(true);
      expect(result.pickup.furnitureLiftReason).toContain('Étage 4 sans ascenseur');
      expect(result.delivery.furnitureLiftRequired).toBe(false);
      expect(result.totalSurcharge).toBe(300);
    });

    test('détecter monte-meuble requis à l\'arrivée', () => {
      const pickupData: AddressData = {
        floor: 1,
        elevator: 'large',
        carryDistance: '0-10'
      };

      const deliveryData: AddressData = {
        floor: 5,
        elevator: 'no',
        carryDistance: '0-10'
      };

      const result = AutoDetectionService.detectAutomaticConstraints(
        pickupData,
        deliveryData,
        30
      );

      expect(result.pickup.furnitureLiftRequired).toBe(false);
      expect(result.delivery.furnitureLiftRequired).toBe(true);
      expect(result.delivery.furnitureLiftReason).toContain('Étage 5 sans ascenseur');
      expect(result.totalSurcharge).toBe(300);
    });

    test('détecter distance de portage longue', () => {
      const pickupData: AddressData = {
        floor: 1,
        elevator: 'large',
        carryDistance: '30+'
      };

      const deliveryData: AddressData = {
        floor: 1,
        elevator: 'large',
        carryDistance: '0-10'
      };

      const result = AutoDetectionService.detectAutomaticConstraints(
        pickupData,
        deliveryData,
        20
      );

      expect(result.pickup.longCarryingDistance).toBe(true);
      expect(result.pickup.carryingDistanceReason).toBe('Distance de portage > 30m');
      expect(result.delivery.longCarryingDistance).toBe(false);
      expect(result.totalSurcharge).toBe(50);
    });

    test('détecter contraintes multiples', () => {
      const pickupData: AddressData = {
        floor: 4,
        elevator: 'no',
        carryDistance: '30+'
      };

      const deliveryData: AddressData = {
        floor: 3,
        elevator: 'small',
        carryDistance: '30+'
      };

      const result = AutoDetectionService.detectAutomaticConstraints(
        pickupData,
        deliveryData,
        40
      );

      expect(result.pickup.furnitureLiftRequired).toBe(true);
      expect(result.pickup.longCarryingDistance).toBe(true);
      expect(result.delivery.furnitureLiftRequired).toBe(true);
      expect(result.delivery.longCarryingDistance).toBe(true);
      expect(result.totalSurcharge).toBe(700); // 300 + 50 + 300 + 50
    });

    test('aucune contrainte détectée', () => {
      const pickupData: AddressData = {
        floor: 1,
        elevator: 'large',
        carryDistance: '0-10'
      };

      const deliveryData: AddressData = {
        floor: 1,
        elevator: 'large',
        carryDistance: '0-10'
      };

      const result = AutoDetectionService.detectAutomaticConstraints(
        pickupData,
        deliveryData,
        15
      );

      expect(result.pickup.furnitureLiftRequired).toBe(false);
      expect(result.pickup.longCarryingDistance).toBe(false);
      expect(result.delivery.furnitureLiftRequired).toBe(false);
      expect(result.delivery.longCarryingDistance).toBe(false);
      expect(result.totalSurcharge).toBe(0);
    });
  });

  describe('detectFurnitureLift', () => {
    test('ascenseur medium/large fonctionnel - pas de monte-meuble', () => {
      const addressData: AddressData = {
        floor: 5,
        elevator: 'large',
        carryDistance: '0-10'
      };

      const result = AutoDetectionService.detectFurnitureLift(addressData, 30);

      expect(result.furnitureLiftRequired).toBe(false);
      expect(result.consumedConstraints).toEqual([]);
    });

    test('étage élevé sans ascenseur - monte-meuble requis (PICKUP scope)', () => {
      const addressData: AddressData = {
        floor: 4,
        elevator: 'no',
        carryDistance: '0-10',
        // Contraintes PICKUP réelles de la BDD
        constraints: [
          '40acdd70-5c1f-4936-a53c-8f52e6695a4c', // escalier_difficile (PICKUP)
          '55ea42b9-aed0-465c-8e5f-ee82a7bb8c85'  // ascenseur trop petit (PICKUP)
        ]
      };

      const result = AutoDetectionService.detectFurnitureLift(addressData, 25);

      expect(result.furnitureLiftRequired).toBe(true);
      expect(result.furnitureLiftReason).toContain('Étage 4 sans ascenseur');
      // Vérifier que les contraintes PICKUP sont consommées
      expect(result.consumedConstraints).toContain('40acdd70-5c1f-4936-a53c-8f52e6695a4c');
      expect(result.consumedConstraints).toContain('55ea42b9-aed0-465c-8e5f-ee82a7bb8c85');
    });

    test('étage bas sans ascenseur - pas de monte-meuble', () => {
      const addressData: AddressData = {
        floor: 2,
        elevator: 'no',
        carryDistance: '0-10'
      };

      const result = AutoDetectionService.detectFurnitureLift(addressData, 20);

      expect(result.furnitureLiftRequired).toBe(false);
    });

    test('ascenseur small avec étage élevé - monte-meuble requis', () => {
      const addressData: AddressData = {
        floor: 4,
        elevator: 'small',
        carryDistance: '0-10'
      };

      const result = AutoDetectionService.detectFurnitureLift(addressData, 30);

      expect(result.furnitureLiftRequired).toBe(true);
      expect(result.furnitureLiftReason).toContain('Étage 4 avec ascenseur small');
    });

    test('ascenseur indisponible - monte-meuble requis', () => {
      const addressData: AddressData = {
        floor: 4,
        elevator: 'large',
        elevatorUnavailable: true,
        carryDistance: '0-10'
      };

      const result = AutoDetectionService.detectFurnitureLift(addressData, 25);

      expect(result.furnitureLiftRequired).toBe(true);
      expect(result.furnitureLiftReason).toContain('indisponible');
    });

    test('ascenseur inadapté - monte-meuble requis', () => {
      const addressData: AddressData = {
        floor: 4,
        elevator: 'large',
        elevatorUnsuitable: true,
        carryDistance: '0-10'
      };

      const result = AutoDetectionService.detectFurnitureLift(addressData, 25);

      expect(result.furnitureLiftRequired).toBe(true);
      expect(result.furnitureLiftReason).toContain('inadapté');
    });

    test('ascenseur interdit déménagement - monte-meuble requis', () => {
      const addressData: AddressData = {
        floor: 4,
        elevator: 'large',
        elevatorForbiddenMoving: true,
        carryDistance: '0-10'
      };

      const result = AutoDetectionService.detectFurnitureLift(addressData, 25);

      expect(result.furnitureLiftRequired).toBe(true);
      expect(result.furnitureLiftReason).toContain('interdit déménagement');
    });
  });

  describe('detectLongCarryingDistance', () => {
    test('distance courte - pas de surcharge', () => {
      const addressData: AddressData = {
        floor: 1,
        elevator: 'large',
        carryDistance: '0-10'
      };

      const result = AutoDetectionService.detectLongCarryingDistance(addressData);

      expect(result.longCarryingDistance).toBe(false);
    });

    test('distance moyenne - pas de surcharge', () => {
      const addressData: AddressData = {
        floor: 1,
        elevator: 'large',
        carryDistance: '10-30'
      };

      const result = AutoDetectionService.detectLongCarryingDistance(addressData);

      expect(result.longCarryingDistance).toBe(false);
    });

    test('distance longue - surcharge appliquée', () => {
      const addressData: AddressData = {
        floor: 1,
        elevator: 'large',
        carryDistance: '30+'
      };

      const result = AutoDetectionService.detectLongCarryingDistance(addressData);

      expect(result.longCarryingDistance).toBe(true);
      expect(result.carryingDistanceReason).toBe('Distance de portage > 30m');
    });
  });

  describe('validateAddressData', () => {
    test('données valides', () => {
      const addressData: AddressData = {
        floor: 2,
        elevator: 'medium',
        carryDistance: '10-30'
      };

      const isValid = AutoDetectionService.validateAddressData(addressData);

      expect(isValid).toBe(true);
    });

    test('étage invalide', () => {
      const addressData: AddressData = {
        floor: -1,
        elevator: 'medium',
        carryDistance: '10-30'
      };

      const isValid = AutoDetectionService.validateAddressData(addressData);

      expect(isValid).toBe(false);
    });

    test('ascenseur invalide', () => {
      const addressData: AddressData = {
        floor: 2,
        elevator: 'invalid' as any,
        carryDistance: '10-30'
      };

      const isValid = AutoDetectionService.validateAddressData(addressData);

      expect(isValid).toBe(false);
    });

    test('distance de portage invalide', () => {
      const addressData: AddressData = {
        floor: 2,
        elevator: 'medium',
        carryDistance: 'invalid' as any
      };

      const isValid = AutoDetectionService.validateAddressData(addressData);

      expect(isValid).toBe(false);
    });
  });

  describe('buildAddressDataFromForm', () => {
    test('conversion des données de formulaire', () => {
      const formData: FormAddressData = {
        floor: '3',
        elevator: 'small',
        carryDistance: '30+',
        selectedConstraints: ['elevator_unavailable', 'elevator_unsuitable_size']
      };

      const result = AutoDetectionService.buildAddressDataFromForm(formData);

      expect(result.floor).toBe(3);
      expect(result.elevator).toBe('small');
      expect(result.carryDistance).toBe('30+');
      expect(result.elevatorUnavailable).toBe(true);
      expect(result.elevatorUnsuitable).toBe(true);
      expect(result.elevatorForbiddenMoving).toBe(false);
      expect(result.constraints).toEqual(['elevator_unavailable', 'elevator_unsuitable_size']);
    });

    test('valeurs par défaut', () => {
      const formData: FormAddressData = {};

      const result = AutoDetectionService.buildAddressDataFromForm(formData);

      expect(result.floor).toBe(0);
      expect(result.elevator).toBe('no');
      expect(result.elevatorUnavailable).toBe(false);
      expect(result.elevatorUnsuitable).toBe(false);
      expect(result.elevatorForbiddenMoving).toBe(false);
      expect(result.constraints).toEqual([]);
    });
  });

  describe('getDetailedReasonsForFurnitureLift', () => {
    test('raisons détaillées avec contraintes réelles BDD (PICKUP scope)', () => {
      const addressData: AddressData = {
        floor: 4,
        elevator: 'no',
        carryDistance: '0-10',
        // Contraintes réelles de la BDD (PICKUP scope)
        constraints: [
          '40acdd70-5c1f-4936-a53c-8f52e6695a4c', // Escaliers étroits (PICKUP)
          '55ea42b9-aed0-465c-8e5f-ee82a7bb8c85'  // Ascenseur trop petit (PICKUP)
        ]
      };

      const reasons = AutoDetectionService.getDetailedReasonsForFurnitureLift(addressData, 30);

      // Vérifier les raisons basées sur les contraintes PICKUP
      expect(reasons.length).toBeGreaterThan(0);
      expect(reasons).toContain('étage élevé (4)');
      expect(reasons).toContain('volume important (30 m³)');
    });

    test('raisons détaillées sans contraintes', () => {
      const addressData: AddressData = {
        floor: 2,
        elevator: 'no',
        carryDistance: '0-10',
        constraints: []
      };

      const reasons = AutoDetectionService.getDetailedReasonsForFurnitureLift(addressData, 15);

      expect(reasons).toEqual([]);
    });
  });

  describe('shouldWarnUser', () => {
    test('avertir pour étage élevé sans ascenseur adapté', () => {
      const addressData: AddressData = {
        floor: 3,
        elevator: 'no',
        carryDistance: '0-10'
      };

      const shouldWarn = AutoDetectionService.shouldWarnUser(addressData);

      expect(shouldWarn).toBe(true);
    });

    test('avertir pour contraintes critiques (PICKUP scope)', () => {
      const addressData: AddressData = {
        floor: 1,
        elevator: 'large',
        carryDistance: '0-10',
        // Contrainte critique réelle de la BDD (PICKUP)
        constraints: ['40acdd70-5c1f-4936-a53c-8f52e6695a4c'] // Escaliers étroits
      };

      const shouldWarn = AutoDetectionService.shouldWarnUser(addressData);

      expect(shouldWarn).toBe(true);
    });

    test('ne pas avertir pour situation normale', () => {
      const addressData: AddressData = {
        floor: 1,
        elevator: 'large',
        carryDistance: '0-10',
        constraints: []
      };

      const shouldWarn = AutoDetectionService.shouldWarnUser(addressData);

      expect(shouldWarn).toBe(false);
    });
  });

  describe('validateConstraintSelection', () => {
    test('sélection valide', () => {
      const addressData: AddressData = {
        floor: 1,
        elevator: 'large',
        carryDistance: '0-10'
      };

      const result = AutoDetectionService.validateConstraintSelection(
        ['constraint-1'],
        ['constraint-1', 'constraint-2'],
        addressData,
        20
      );

      expect(result.isValid).toBe(true);
    });

    test('tentative de désélection monte-meuble requis', () => {
      const addressData: AddressData = {
        floor: 4,
        elevator: 'no',
        carryDistance: '0-10'
      };

      const result = AutoDetectionService.validateConstraintSelection(
        ['furniture_lift_required'],
        [],
        addressData,
        25
      );

      expect(result.isValid).toBe(false);
      expect(result.blockedConstraintId).toBe('furniture_lift_required');
    });

    test('tentative de désélection distance portage requise', () => {
      const addressData: AddressData = {
        floor: 1,
        elevator: 'large',
        carryDistance: '30+'
      };

      const result = AutoDetectionService.validateConstraintSelection(
        ['long_carrying_distance'],
        [],
        addressData,
        20
      );

      expect(result.isValid).toBe(false);
      expect(result.blockedConstraintId).toBe('long_carrying_distance');
    });
  });

  describe('applyAutomaticConstraints', () => {
    test('appliquer contraintes automatiques', () => {
      const addressData: AddressData = {
        floor: 4,
        elevator: 'no',
        carryDistance: '30+'
      };

      const result = AutoDetectionService.applyAutomaticConstraints(
        ['constraint-1'],
        addressData,
        25
      );

      expect(result).toContain('constraint-1');
      expect(result).toContain('furniture_lift_required');
      expect(result).toContain('long_carrying_distance');
    });

    test('ne pas dupliquer contraintes existantes', () => {
      const addressData: AddressData = {
        floor: 4,
        elevator: 'no',
        carryDistance: '30+'
      };

      const result = AutoDetectionService.applyAutomaticConstraints(
        ['furniture_lift_required', 'long_carrying_distance'],
        addressData,
        25
      );

      expect(result).toEqual(['furniture_lift_required', 'long_carrying_distance']);
    });
  });

  describe('getAutomaticConstraintIds', () => {
    test('obtenir les IDs des contraintes automatiques', () => {
      const result = {
        pickup: { furnitureLiftRequired: true, longCarryingDistance: false },
        delivery: { furnitureLiftRequired: false, longCarryingDistance: true },
        totalSurcharge: 350,
        appliedConstraints: [
          { id: 'furniture_lift', location: 'pickup', reason: 'Test', surcharge: 300 },
          { id: 'long_carrying_distance', location: 'delivery', reason: 'Test', surcharge: 50 }
        ]
      };

      const ids = AutoDetectionService.getAutomaticConstraintIds(result);

      expect(ids.pickup).toEqual(['furniture_lift']);
      expect(ids.delivery).toEqual(['long_carrying_distance']);
    });
  });

  describe('calculateAutomaticSurcharges', () => {
    test('calculer les surcharges automatiques', () => {
      const result = {
        pickup: { furnitureLiftRequired: true, longCarryingDistance: false },
        delivery: { furnitureLiftRequired: false, longCarryingDistance: true },
        totalSurcharge: 350,
        appliedConstraints: []
      };

      const surcharges = AutoDetectionService.calculateAutomaticSurcharges(result);

      expect(surcharges).toBe(350);
    });
  });

  describe('getSummary', () => {
    test('obtenir le résumé des détections', () => {
      const result = {
        pickup: { furnitureLiftRequired: true, longCarryingDistance: false },
        delivery: { furnitureLiftRequired: false, longCarryingDistance: true },
        totalSurcharge: 350,
        appliedConstraints: [
          { id: 'furniture_lift', location: 'pickup', reason: 'Étage 4 sans ascenseur', surcharge: 300 },
          { id: 'long_carrying_distance', location: 'delivery', reason: 'Distance > 30m', surcharge: 50 }
        ]
      };

      const summary = AutoDetectionService.getSummary(result);

      expect(summary).toContain('[départ] Étage 4 sans ascenseur (+300€)');
      expect(summary).toContain('[arrivée] Distance > 30m (+50€)');
      expect(summary).toContain('TOTAL SURCHARGES: 350€');
    });

    test('résumé sans contraintes', () => {
      const result = {
        pickup: { furnitureLiftRequired: false, longCarryingDistance: false },
        delivery: { furnitureLiftRequired: false, longCarryingDistance: false },
        totalSurcharge: 0,
        appliedConstraints: []
      };

      const summary = AutoDetectionService.getSummary(result);

      expect(summary).toEqual(['Aucune contrainte automatique détectée']);
    });
  });
});
