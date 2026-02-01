/**
 * ModalSelectionsAdapter - Adaptateur pour convertir les sélections des modals en QuoteContext
 *
 * Rôle : Mapper les sélections des modals (addressConstraints, addressServices, globalServices)
 * vers les champs QuoteContext utilisés par les modules du moteur de devis.
 *
 * SOURCE UNIQUE : Les IDs utilisés ici correspondent à modal-data.ts
 * - Contraintes : constraint-1 à constraint-16
 * - Services : service-1 à service-16 (gérés via catalogue cross-selling)
 */

import { QuoteContext } from "../core/QuoteContext";

/**
 * Structure des sélections du modal
 */
export interface ModalSelections {
  pickup?: {
    addressConstraints?: Record<string, boolean>;
    addressServices?: Record<string, boolean>;
    globalServices?: Record<string, boolean>;
  };
  delivery?: {
    addressConstraints?: Record<string, boolean>;
    addressServices?: Record<string, boolean>;
    globalServices?: Record<string, boolean>;
  };
  // Services globaux partagés (piano, stockage)
  globalServices?: Record<string, boolean>;
}

/**
 * IDs des CONTRAINTES dans modal-data.ts (constraint-1 à constraint-16)
 * Ces contraintes impactent le prix en pourcentage
 */
const CONSTRAINT_IDS = {
  // Groupe : Accès véhicule
  STREET_NARROW: "constraint-1", // Rue étroite ou inaccessible au camion (+9%)
  COMPLEX_CIRCULATION: "constraint-2", // Circulation complexe (+6.5%)
  DIFFICULT_PARKING: "constraint-3", // Stationnement difficile ou payant (+7.5%)
  PEDESTRIAN_ZONE: "constraint-4", // Zone piétonne avec restrictions (+8.5%)

  // Groupe : Accès bâtiment
  ELEVATOR_OUT_OF_SERVICE: "constraint-5", // Ascenseur en panne ou hors service (+8%)
  ELEVATOR_FORBIDDEN: "constraint-6", // Ascenseur interdit pour déménagement (+8%)
  ELEVATOR_TOO_SMALL: "constraint-7", // Ascenseur trop petit pour les meubles (+7.5%)
  DIFFICULT_STAIRS: "constraint-8", // Escalier difficile ou dangereux (+8.5%)
  NARROW_CORRIDORS: "constraint-9", // Couloirs étroits ou encombrés (+6.5%)

  // Groupe : Distance
  MULTI_LEVEL_ACCESS: "constraint-10", // Accès complexe multi-niveaux (+9.5%)
  LONG_CARRYING_DISTANCE: "constraint-11", // Distance de portage > 30m (+7.8%)
  INDIRECT_PASSAGE: "constraint-12", // Passage indirect obligatoire (+8.2%)

  // Groupe : Sécurité / Admin
  ADMIN_AUTHORIZATION: "constraint-13", // Autorisation administrative (+7%)
  STRICT_ACCESS_CONTROL: "constraint-14", // Contrôle d'accès strict (+6%)
  TIME_RESTRICTIONS: "constraint-15", // Restrictions horaires strictes (+6.8%)
  FRAGILE_FLOOR: "constraint-16", // Sol fragile ou délicat (+5.5%)
} as const;

/**
 * IDs des SERVICES dans services-catalog.ts (gérés via cross-selling)
 * Conservés pour compatibilité mais les services sont maintenant dans le catalogue
 */
const SERVICE_IDS = {
  // Services objets spéciaux
  PIANO: "service-8", // Transport piano
  SAFE: "service-10", // Objets très lourds
  ARTWORK: "service-4", // Emballage œuvres d'art
  BULKY_FURNITURE: "service-7", // Meubles encombrants
  DISMANTLING: "service-5", // Démontage de meubles
  REASSEMBLY: "service-6", // Remontage de meubles

  // Services additionnels
  PACKING_DEPARTURE: "service-1", // Emballage professionnel départ
  UNPACKING_ARRIVAL: "service-2", // Déballage professionnel arrivée
  CLEANING_END: "service-13", // Nettoyage après déménagement
  STORAGE: "service-14", // Stockage temporaire

  // Autres services
  PACKING_SUPPLIES: "service-3", // Fournitures d'emballage
  INVENTORY: "service-11", // Inventaire avec photos
  ADMINISTRATIVE: "service-15", // Gestion administrative
  PETS: "service-16", // Transport animaux
  MONTE_MEUBLE: "service-12", // Monte-meuble
} as const;

/**
 * Convertit les sélections des modals en QuoteContext partiel
 *
 * @param modalSelections Sélections des modals (pickup, delivery, globalServices)
 * @returns QuoteContext partiel avec les champs mappés depuis les modals
 */
export function modalSelectionsToQuoteContext(
  modalSelections: ModalSelections,
): Partial<QuoteContext> {
  const ctx: Partial<QuoteContext> = {};

  // Fusionner tous les services globaux (pickup, delivery, global)
  const allGlobalServices: Record<string, boolean> = {
    ...modalSelections.globalServices,
    ...modalSelections.pickup?.globalServices,
    ...modalSelections.delivery?.globalServices,
  };

  // Fusionner les services d'adresse (pickup + delivery)
  const allAddressServices: Record<string, boolean> = {
    ...modalSelections.pickup?.addressServices,
    ...modalSelections.delivery?.addressServices,
  };

  // ============================================================================
  // OBJETS SPÉCIAUX
  // ============================================================================

  // Piano (service global)
  if (
    allGlobalServices[SERVICE_IDS.PIANO] ||
    allAddressServices[SERVICE_IDS.PIANO]
  ) {
    ctx.piano = true;
  }

  // Coffre-fort / Objets très lourds (service global ou adresse)
  if (
    allGlobalServices[SERVICE_IDS.SAFE] ||
    allAddressServices[SERVICE_IDS.SAFE]
  ) {
    ctx.safe = true;
  }

  // Œuvres d'art (service adresse, généralement pickup)
  if (
    allAddressServices[SERVICE_IDS.ARTWORK] ||
    modalSelections.pickup?.addressServices?.[SERVICE_IDS.ARTWORK]
  ) {
    ctx.artwork = true;
  }

  // Meubles encombrants (service global ou adresse)
  if (
    allGlobalServices[SERVICE_IDS.BULKY_FURNITURE] ||
    allAddressServices[SERVICE_IDS.BULKY_FURNITURE]
  ) {
    ctx.bulkyFurniture = true;
  }

  // Démontage de meubles (service pickup)
  if (modalSelections.pickup?.addressServices?.[SERVICE_IDS.DISMANTLING]) {
    // Note: builtInAppliances pourrait être déduit du démontage
    // Pour l'instant, on ne le mappe pas automatiquement
  }

  // Remontage de meubles (service delivery)
  if (modalSelections.delivery?.addressServices?.[SERVICE_IDS.REASSEMBLY]) {
    // Note: pourrait être utilisé pour déduire unpacking
  }

  // ============================================================================
  // SERVICES ADDITIONNELS
  // ============================================================================

  // Emballage professionnel départ (service pickup)
  if (
    modalSelections.pickup?.addressServices?.[SERVICE_IDS.PACKING_DEPARTURE]
  ) {
    ctx.packing = true;
  }

  // Déballage professionnel arrivée (service delivery)
  if (
    modalSelections.delivery?.addressServices?.[SERVICE_IDS.UNPACKING_ARRIVAL]
  ) {
    ctx.unpacking = true;
  }

  // Nettoyage après déménagement (service pickup)
  if (modalSelections.pickup?.addressServices?.[SERVICE_IDS.CLEANING_END]) {
    ctx.cleaningEnd = true;
  }

  // Stockage temporaire (service global)
  if (allGlobalServices[SERVICE_IDS.STORAGE]) {
    ctx.temporaryStorage = true;
    // Note: storageDurationDays doit être saisi séparément dans le formulaire
    // car c'est une valeur numérique qui ne peut pas être dans le modal
  }

  // ============================================================================
  // CONTRAINTES D'ACCÈS (constraint-1 à constraint-16 depuis modal-data.ts)
  // ============================================================================

  // Récupérer les contraintes par adresse
  const pickupConstraints = modalSelections.pickup?.addressConstraints || {};
  const deliveryConstraints =
    modalSelections.delivery?.addressConstraints || {};

  // Collecter tous les IDs de contraintes sélectionnées pour le module AccessConstraintsPenaltyModule
  const pickupConstraintIds = Object.keys(pickupConstraints).filter(
    (id) => pickupConstraints[id] === true,
  );
  const deliveryConstraintIds = Object.keys(deliveryConstraints).filter(
    (id) => deliveryConstraints[id] === true,
  );

  // Stocker les IDs pour le calcul des pourcentages par AccessConstraintsPenaltyModule
  if (pickupConstraintIds.length > 0) {
    ctx.pickupAccessConstraints = pickupConstraintIds;
  }
  if (deliveryConstraintIds.length > 0) {
    ctx.deliveryAccessConstraints = deliveryConstraintIds;
  }

  // --- PICKUP (Départ) - Mappings spécifiques pour modules existants ---

  // Rue étroite (constraint-1) - utilisé par NavetteRequiredModule
  if (pickupConstraints[CONSTRAINT_IDS.STREET_NARROW]) {
    ctx.pickupStreetNarrow = true;
  }

  // Autorisation stationnement requise (constraint-3 ou constraint-13) - utilisé par NavetteRequiredModule
  if (
    pickupConstraints[CONSTRAINT_IDS.DIFFICULT_PARKING] ||
    pickupConstraints[CONSTRAINT_IDS.ADMIN_AUTHORIZATION]
  ) {
    ctx.pickupParkingAuthorizationRequired = true;
  }

  // Restrictions horaires syndic (constraint-15) - utilisé par TimeSlotSyndicModule
  if (pickupConstraints[CONSTRAINT_IDS.TIME_RESTRICTIONS]) {
    ctx.pickupSyndicTimeSlot = true;
  }

  // Distance de portage > 30m (constraint-11) - utilisé par LaborAccessPenaltyModule
  if (pickupConstraints[CONSTRAINT_IDS.LONG_CARRYING_DISTANCE]) {
    ctx.pickupCarryDistance = 40; // Valeur par défaut pour > 30m
  }

  // Ascenseur hors service ou interdit (constraint-5 ou constraint-6) - utilisé par NoElevatorPickupModule
  if (
    pickupConstraints[CONSTRAINT_IDS.ELEVATOR_OUT_OF_SERVICE] ||
    pickupConstraints[CONSTRAINT_IDS.ELEVATOR_FORBIDDEN]
  ) {
    ctx.pickupHasElevator = false;
  }

  // Ascenseur trop petit (constraint-7)
  if (pickupConstraints[CONSTRAINT_IDS.ELEVATOR_TOO_SMALL]) {
    ctx.pickupElevatorSize = "SMALL";
  }

  // --- DELIVERY (Arrivée) - Mappings spécifiques pour modules existants ---

  // Rue étroite (constraint-1) - utilisé par NavetteRequiredModule
  if (deliveryConstraints[CONSTRAINT_IDS.STREET_NARROW]) {
    ctx.deliveryStreetNarrow = true;
  }

  // Autorisation stationnement requise (constraint-3 ou constraint-13) - utilisé par NavetteRequiredModule
  if (
    deliveryConstraints[CONSTRAINT_IDS.DIFFICULT_PARKING] ||
    deliveryConstraints[CONSTRAINT_IDS.ADMIN_AUTHORIZATION]
  ) {
    ctx.deliveryParkingAuthorizationRequired = true;
  }

  // Restrictions horaires syndic (constraint-15) - utilisé par TimeSlotSyndicModule
  if (deliveryConstraints[CONSTRAINT_IDS.TIME_RESTRICTIONS]) {
    ctx.deliverySyndicTimeSlot = true;
  }

  // Distance de portage > 30m (constraint-11) - utilisé par LaborAccessPenaltyModule
  if (deliveryConstraints[CONSTRAINT_IDS.LONG_CARRYING_DISTANCE]) {
    ctx.deliveryCarryDistance = 40; // Valeur par défaut pour > 30m
  }

  // Ascenseur hors service ou interdit (constraint-5 ou constraint-6) - utilisé par NoElevatorDeliveryModule
  if (
    deliveryConstraints[CONSTRAINT_IDS.ELEVATOR_OUT_OF_SERVICE] ||
    deliveryConstraints[CONSTRAINT_IDS.ELEVATOR_FORBIDDEN]
  ) {
    ctx.deliveryHasElevator = false;
  }

  // Ascenseur trop petit (constraint-7)
  if (deliveryConstraints[CONSTRAINT_IDS.ELEVATOR_TOO_SMALL]) {
    ctx.deliveryElevatorSize = "SMALL";
  }

  return ctx;
}

/**
 * Vérifie si un service spécifique est sélectionné dans les modals
 *
 * @param modalSelections Sélections des modals
 * @param serviceId ID du service (ex: 'service-8' pour piano)
 * @returns true si le service est sélectionné
 */
export function isServiceSelected(
  modalSelections: ModalSelections,
  serviceId: string,
): boolean {
  const allGlobalServices: Record<string, boolean> = {
    ...modalSelections.globalServices,
    ...modalSelections.pickup?.globalServices,
    ...modalSelections.delivery?.globalServices,
  };

  const allAddressServices: Record<string, boolean> = {
    ...modalSelections.pickup?.addressServices,
    ...modalSelections.delivery?.addressServices,
  };

  return !!(allGlobalServices[serviceId] || allAddressServices[serviceId]);
}

/**
 * Obtient tous les IDs de services sélectionnés
 *
 * @param modalSelections Sélections des modals
 * @returns Array d'IDs de services sélectionnés
 */
export function getSelectedServiceIds(
  modalSelections: ModalSelections,
): string[] {
  const allGlobalServices: Record<string, boolean> = {
    ...modalSelections.globalServices,
    ...modalSelections.pickup?.globalServices,
    ...modalSelections.delivery?.globalServices,
  };

  const allAddressServices: Record<string, boolean> = {
    ...modalSelections.pickup?.addressServices,
    ...modalSelections.delivery?.addressServices,
  };

  const allServices = { ...allGlobalServices, ...allAddressServices };
  return Object.keys(allServices).filter((id) => allServices[id] === true);
}

/**
 * Obtient tous les IDs de contraintes sélectionnées
 *
 * @param modalSelections Sélections des modals
 * @returns Object avec les contraintes pickup et delivery
 */
export function getSelectedConstraintIds(modalSelections: ModalSelections): {
  pickup: string[];
  delivery: string[];
  all: string[];
} {
  const pickupConstraints = modalSelections.pickup?.addressConstraints || {};
  const deliveryConstraints =
    modalSelections.delivery?.addressConstraints || {};

  const pickupIds = Object.keys(pickupConstraints).filter(
    (id) => pickupConstraints[id] === true,
  );
  const deliveryIds = Object.keys(deliveryConstraints).filter(
    (id) => deliveryConstraints[id] === true,
  );

  // Fusionner sans doublons
  const allIds = [...new Set([...pickupIds, ...deliveryIds])];

  return {
    pickup: pickupIds,
    delivery: deliveryIds,
    all: allIds,
  };
}

/**
 * Exporte les IDs de contraintes pour usage externe
 */
export { CONSTRAINT_IDS };
