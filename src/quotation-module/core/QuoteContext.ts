/**
 * QuoteContext - Contexte d'entrée pour le calcul de devis
 *
 * Données collectées depuis le formulaire, normalisées par les adaptateurs.
 * Ce contexte est immuable - les modules créent de nouveaux contextes.
 */

import { ComputedContext } from "./ComputedContext";

export interface QuoteContext {
  // ============================================================================
  // IDENTIFICATION
  // ============================================================================
  serviceType: "MOVING"; // Fixe pour ce système
  region: "IDF"; // Point de départ obligatoire Île-de-France

  // ============================================================================
  // DATE ET PLANNING
  // ============================================================================
  movingDate?: string; // ISO 8601
  flexibility?: "NONE" | "PLUS_MINUS_3" | "PLUS_MINUS_7";

  // ============================================================================
  // VOLUME
  // ============================================================================
  volumeMethod?: "FORM";
  estimatedVolume?: number; // m³
  volumeConfidence?: "LOW" | "MEDIUM" | "HIGH";

  // ============================================================================
  // ADRESSES - DÉPART (PICKUP)
  // ============================================================================
  departureAddress: string;
  departurePostalCode?: string;
  departureCity?: string;
  pickupFloor?: number;
  pickupHasElevator?: boolean;
  pickupElevatorSize?: "SMALL" | "STANDARD" | "LARGE";
  pickupCarryDistance?: number; // mètres
  pickupStreetNarrow?: boolean;
  pickupParkingAuthorizationRequired?: boolean;
  pickupSyndicTimeSlot?: boolean;
  // Contraintes d'accès supplémentaires (IDs depuis modal-data.ts)
  pickupAccessConstraints?: string[];

  // ============================================================================
  // ADRESSES - ARRIVÉE (DELIVERY)
  // ============================================================================
  arrivalAddress: string;
  arrivalPostalCode?: string;
  arrivalCity?: string;
  deliveryFloor?: number;
  deliveryHasElevator?: boolean;
  deliveryElevatorSize?: "SMALL" | "STANDARD" | "LARGE";
  deliveryCarryDistance?: number; // mètres
  deliveryStreetNarrow?: boolean;
  deliveryParkingAuthorizationRequired?: boolean;
  deliverySyndicTimeSlot?: boolean;
  // Contraintes d'accès supplémentaires (IDs depuis modal-data.ts)
  deliveryAccessConstraints?: string[];

  // ============================================================================
  // DISTANCE (CALCULÉE EN TEMPS RÉEL PAR LE FORMULAIRE)
  // ============================================================================
  distance?: number; // Distance en kilomètres (via Google Maps Distance Matrix API)

  // ============================================================================
  // INVENTAIRE
  // ============================================================================
  bulkyFurniture?: boolean;
  piano?: boolean;
  safe?: boolean;
  artwork?: boolean;
  builtInAppliances?: boolean;

  // ============================================================================
  // LOGISTIQUE
  // ============================================================================
  multiplePickupPoints?: boolean;
  temporaryStorage?: boolean;
  storageDurationDays?: number;

  // ============================================================================
  // SERVICES
  // ============================================================================
  packing?: boolean;
  unpacking?: boolean;
  cleaningEnd?: boolean;
  dismantling?: boolean; // Service démontage meubles (sans remontage)
  reassembly?: boolean; // Service remontage meubles (après démontage)

  // ============================================================================
  // MONTE-MEUBLES (checkbox par adresse dans le formulaire)
  // ============================================================================
  // Gestion automatique par seuils :
  // - HIGH (≥3) : Coché par défaut, décochable avec avertissement
  // - CRITICAL (≥5) : Coché et non décochable
  pickupFurnitureLift?: boolean; // Monte-meubles adresse départ
  deliveryFurnitureLift?: boolean; // Monte-meubles adresse arrivée

  // ============================================================================
  // JURIDIQUE & ASSURANCE
  // ============================================================================
  declaredValue?: number; // Valeur déclarée pour assurance (€)
  declaredValueInsurance?: boolean; // Option assurance valeur déclarée (cochée par le client)
  refuseLiftDespiteRecommendation?: boolean; // @deprecated - Remplacé par pickupFurnitureLift/deliveryFurnitureLift

  // ============================================================================
  // OPTIONS SCÉNARIOS
  // ============================================================================
  crewFlexibility?: boolean; // Garantie flexibilité équipe (scénario FLEX)
  forceOvernightStop?: boolean; // Force arrêt nuit obligatoire (scénario FLEX pour très longue distance)
  forceSupplies?: boolean; // Force les fournitures (scénarios CONFORT, PREMIUM, SECURITY_PLUS) - calcul dynamique si client n'a rien sélectionné

  // ============================================================================
  // CROSS-SELLING (fournitures depuis le catalogue)
  // ============================================================================
  crossSellingSuppliesTotal?: number; // Total des fournitures sélectionnées (€)
  crossSellingSuppliesDetails?: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  crossSellingServicesTotal?: number; // Total des services cross-selling (€) - pour traçabilité
  crossSellingGrandTotal?: number; // Total général cross-selling (€) - pour traçabilité

  // ============================================================================
  // SORTIE (INJECTÉE PAR LE MOTEUR)
  // ============================================================================
  computed?: ComputedContext;

  // ============================================================================
  // MÉTADONNÉES
  // ============================================================================
  metadata?: Record<string, any>;
}
