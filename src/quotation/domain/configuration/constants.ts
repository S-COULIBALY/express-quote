// ✅ MIGRATION VERS SYSTÈME CENTRALISÉ - Utilise DefaultValues.ts pour les prix
// Garde seulement les constantes non-liées aux prix

import { DefaultValues } from './DefaultValues';

export const PRICE_CONSTANTS = {
  DEFAULT_CURRENCY: 'EUR',
  MIN_PRICE: 0,
  TAX_RATE: 0.20, // 20% TVA - Constante technique, pas de prix
} as const;

export const MOVING_CONSTANTS = {
  MIN_VOLUME: 1,   // Limite technique, pas un prix
  MAX_VOLUME: 200, // Limite technique, pas un prix
  // ❌ SUPPRIMÉ - BASE_PRICE_PER_M3: migré vers DefaultValues.ts
  // ❌ SUPPRIMÉ - FLOOR_PRICE_MULTIPLIER: migré vers DefaultValues.ts 
  // ❌ SUPPRIMÉ - WEEKEND_PRICE_MULTIPLIER: migré vers DefaultValues.ts
} as const;

// 🏗️ CONSTANTES MONTE-MEUBLE ET ÉTAGES - HARMONISATION GLOBALE
// ✅ Centralisées pour éviter les incohérences entre composants

export const FLOOR_CONSTANTS = {
  // Seuils d'étages pour surcoûts
  FLOOR_SURCHARGE_THRESHOLD: 1,        // > 1 étage = supplément sans ascenseur
  FLOOR_SURCHARGE_AMOUNT: 25,          // 25€ par étage supplémentaire

  // Seuils pour monte-meuble automatique
  FURNITURE_LIFT_REQUIRED_THRESHOLD: 3, // > 3 étages sans ascenseur = monte-meuble obligatoire
  FURNITURE_LIFT_WARNING_THRESHOLD: 2,  // > 2 étages sans ascenseur = avertissement

  // Exceptions de volume pour monte-meuble
  SMALL_VOLUME_EXCEPTION: 10,          // < 10 m³ = exception possible pour éviter sur-prescription

  // Prix et coûts
  HIGH_FLOOR_SURCHARGE_PERCENT: 15,    // +15% pour étages très élevés (> 5)
  FURNITURE_LIFT_PRICE: 200,           // 200€ pour monte-meuble
};

/**
 * 🎯 FONCTION CENTRALISÉE - Détection du monte-meuble avec logique économique
 * Évite la duplication de code dans 5+ fichiers
 */
export const detectFurnitureLift = (
  floor: number, 
  elevator: string, 
  constraints: string[], 
  services: string[]
): boolean => {
  const floorNumber = floor;
  const ascenseur_present = elevator && elevator !== 'no';
  const ascenseur_type = elevator || 'no';
  
  // Contraintes d'ascenseur
  const ascenseur_indisponible = constraints.includes('elevator_unavailable');
  const ascenseur_inadapte = constraints.includes('elevator_unsuitable_size');
  const ascenseur_interdit_demenagement = constraints.includes('elevator_forbidden_moving');
  
  // Contraintes d'accès
  const escalier_difficile = constraints.includes('difficult_stairs');
  const couloirs_etroits = constraints.includes('narrow_corridors');
  const sortie_indirecte = constraints.includes('indirect_exit');
  
  // Services/objets
  const meubles_encombrants = services.includes('bulky_furniture');
  const objet_tres_lourd = services.includes('fragile_valuable_items') || services.includes('heavy_items');
  
  // 🎯 NOUVELLE LOGIQUE ÉCONOMIQUE
  
  // CAS 1: Ascenseur medium/large fonctionnel → PAS de monte-meuble
  if (ascenseur_present && ['medium', 'large'].includes(ascenseur_type) &&
      !ascenseur_indisponible && !ascenseur_inadapte && !ascenseur_interdit_demenagement) {
    return false;
  }
  
  // CAS 2: Ascenseur small avec contraintes spécifiques
  if (ascenseur_present && ascenseur_type === 'small' &&
      !ascenseur_indisponible && !ascenseur_inadapte && !ascenseur_interdit_demenagement &&
      (escalier_difficile || couloirs_etroits || sortie_indirecte) &&
      floorNumber >= 1 &&
      (meubles_encombrants || objet_tres_lourd)) {
    return true;
  }
  
  // CAS 3: Aucun ascenseur avec contraintes
  if (!ascenseur_present &&
      (escalier_difficile || couloirs_etroits || sortie_indirecte) &&
      ((floorNumber > 3 && !meubles_encombrants && !objet_tres_lourd) ||
       (floorNumber >= 1 && (meubles_encombrants || objet_tres_lourd)))) {
    return true;
  }
  
  // CAS 4: Ascenseur indisponible/inadapté/interdit → Traiter comme "aucun ascenseur"
  if (ascenseur_indisponible || ascenseur_inadapte || ascenseur_interdit_demenagement) {
    if ((escalier_difficile || couloirs_etroits || sortie_indirecte) &&
        ((floorNumber > 3 && !meubles_encombrants && !objet_tres_lourd) ||
         (floorNumber >= 1 && (meubles_encombrants || objet_tres_lourd)))) {
      return true;
    }
  }
  
  return false;
};

/**
 * 🎯 FONCTION CENTRALISÉE - Détection pour deux adresses (pickup + delivery)
 */
export const detectFurnitureLiftForBothAddresses = (
  pickupData: { floor: number; elevator: string; constraints: string[]; services: string[] },
  deliveryData: { floor: number; elevator: string; constraints: string[]; services: string[] }
): boolean => {
  return detectFurnitureLift(
    pickupData.floor, 
    pickupData.elevator, 
    pickupData.constraints, 
    pickupData.services
  ) || detectFurnitureLift(
    deliveryData.floor, 
    deliveryData.elevator, 
    deliveryData.constraints, 
    deliveryData.services
  );
};

// ✅ MIGRATION VERS SYSTÈME CENTRALISÉ - Garde seulement les constantes techniques
export const CLEANING_CONSTANTS = {
  MIN_SQUARE_METERS: 10, // Limite technique, pas un prix
  // ✅ MIGRÉ - Toutes les valeurs de prix ont été migrées vers DefaultValues.ts
  // Utiliser DefaultValues.CLEANING_* pour accéder aux prix
} as const;

/**
 * 🎯 FONCTION UTILITAIRE - Calcul des surcoûts d'étage
 * ✅ UTILISE DefaultValues pour les prix
 */
export const calculateFloorSurcharge = (floor: number, elevator: string, volume?: number): number => {
  const floorNumber = parseInt(floor.toString()) || 0;
  const hasElevator = elevator && elevator !== 'no';
  
  if (floorNumber > FLOOR_CONSTANTS.FLOOR_SURCHARGE_THRESHOLD && !hasElevator) {
    // Surcoût progressif par étage - ✅ UTILISE DefaultValues
    const extraFloors = floorNumber - FLOOR_CONSTANTS.FLOOR_SURCHARGE_THRESHOLD;
    return extraFloors * DefaultValues.FLOOR_SURCHARGE_AMOUNT;
  }
  
  return 0;
};

/**
 * 🎯 FONCTION UTILITAIRE - Calcul du prix du monte-meuble
 * ✅ UTILISE DefaultValues pour le prix
 */
export const calculateFurnitureLiftPrice = (): number => {
  return DefaultValues.PACK_LIFT_PRICE;
};

/**
 * 🎯 FONCTION UTILITAIRE - Validation des contraintes
 */
export const validateConstraints = (constraints: string[]): string[] => {
  const validConstraints = [
    'pedestrian_zone',
    'narrow_inaccessible_street', 
    'difficult_parking',
    'complex_traffic',
    'elevator_unavailable',
    'elevator_unsuitable_size',
    'elevator_forbidden_moving',
    'difficult_stairs',
    'narrow_corridors',
    'long_carrying_distance',
    'indirect_exit',
    'complex_multilevel_access',
    'access_control',
    'administrative_permit',
    'time_restrictions',
    'fragile_floor'
  ];
  
  return constraints.filter(constraint => validConstraints.includes(constraint));
};

/**
 * 🎯 FONCTION UTILITAIRE - Validation des services
 */
export const validateServices = (services: string[]): string[] => {
  const validServices = [
    'bulky_furniture',
    'furniture_disassembly',
    'furniture_reassembly',
    'professional_packing_departure',
    'professional_unpacking_arrival',
    'packing_supplies',
    'fragile_valuable_items',
    'heavy_items',
    'additional_insurance',
    'temporary_storage_service'
  ];
  
  return services.filter(service => validServices.includes(service));
}; 