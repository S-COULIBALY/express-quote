/**
 * ============================================================================
 * SERVICE D'AUTO-DÉTECTION DES CONTRAINTES LOGISTIQUES
 * ============================================================================
 *
 * 🎯 OBJECTIF :
 * Centraliser toute la logique d'auto-détection pour monte-meuble et distance
 * de portage. Ce service élimine les duplications identifiées dans :
 * - MovingConstraintsAndServicesModal.tsx
 * - moving-service/index.ts
 * - MovingConstraintsModule.ts
 *
 * 📋 FONCTIONNALITÉS :
 * - Détection automatique monte-meuble selon étage/ascenseur/volume
 * - Détection automatique distance de portage selon distance déclarée
 * - Calcul automatique des surcharges associées
 * - Support pour adresses de départ ET d'arrivée
 *
 * 🔧 UTILISATION :
 * ```typescript
 * const result = AutoDetectionService.detectAutomaticConstraints(
 *   pickupData,
 *   deliveryData,
 *   volume
 * );
 *
 * if (result.pickup.furnitureLiftRequired) {
 *   // Ajouter contrainte monte-meuble au départ
 * }
 *
 * if (result.delivery.longCarryingDistance) {
 *   // Ajouter contrainte distance de portage à l'arrivée
 * }
 * ```
 */

import { DefaultValues } from '../configuration/DefaultValues';
import {
  RULE_UUID_ESCALIER_DIFFICILE,
  RULE_UUID_COULOIRS_ETROITS,
  RULE_UUID_MEUBLES_ENCOMBRANTS,
  RULE_UUID_OBJETS_LOURDS,
  RULE_UUID_DISTANCE_PORTAGE,
  RULE_UUID_PASSAGE_INDIRECT,
  RULE_UUID_ACCES_MULTINIVEAU,
  CONSUMED_BY_FURNITURE_LIFT,
  CRITICAL_CONSTRAINTS_REQUIRING_LIFT
} from '../constants/RuleUUIDs';

/**
 * 📋 INTERFACES
 */

/**
 * Données d'une adresse (départ ou arrivée)
 */
export interface AddressData {
  floor: number;
  elevator: 'no' | 'small' | 'medium' | 'large';
  elevatorUnavailable?: boolean;
  elevatorUnsuitable?: boolean;
  elevatorForbiddenMoving?: boolean;
  carryDistance?: '0-10' | '10-30' | '30+';
  constraints?: string[];
}

/**
 * Données brutes depuis un formulaire
 */
export interface FormAddressData {
  floor?: string | number;
  elevator?: string;
  carryDistance?: string;
  selectedConstraints?: string[];
}

/**
 * Résultat de la détection pour une adresse
 */
export interface AddressDetectionResult {
  furnitureLiftRequired: boolean;
  furnitureLiftReason?: string;
  longCarryingDistance: boolean;
  carryingDistanceReason?: string;
  /**
   * 🎯 Contraintes consommées par le monte-meubles
   * Ces contraintes ne doivent PAS être facturées séparément
   * car le monte-meubles résout déjà ces problèmes
   */
  consumedConstraints?: string[];
}

/**
 * Résultat complet de l'auto-détection
 */
export interface AutoDetectionResult {
  pickup: AddressDetectionResult;
  delivery: AddressDetectionResult;
  totalSurcharge: number;
  appliedConstraints: Array<{
    id: string;
    location: 'pickup' | 'delivery';
    reason: string;
    surcharge: number;
  }>;
}

/**
 * ============================================================================
 * SERVICE D'AUTO-DÉTECTION
 * ============================================================================
 */
export class AutoDetectionService {

  /**
   * CONSTANTES DE CONFIGURATION
   */
  private static readonly FURNITURE_LIFT_FLOOR_THRESHOLD = 3; // Étage à partir duquel le monte-meuble est requis
  private static readonly FURNITURE_LIFT_SURCHARGE = 300; // Surcharge pour monte-meuble (en €)
  private static readonly LONG_CARRYING_DISTANCE_THRESHOLD = '30+'; // Seuil distance de portage
  private static readonly LONG_CARRYING_DISTANCE_SURCHARGE = 50; // Surcharge distance portage (en €)

  /**
   * 🎯 DÉTECTION COMPLÈTE DES CONTRAINTES AUTOMATIQUES
   *
   * Analyse les deux adresses (départ et arrivée) et détecte automatiquement :
   * - Monte-meuble requis
   * - Distance de portage longue
   *
   * @param pickupData Données de l'adresse de départ
   * @param deliveryData Données de l'adresse d'arrivée
   * @param volume Volume du déménagement (optionnel)
   * @returns Résultat complet de l'auto-détection
   */
  static detectAutomaticConstraints(
    pickupData: AddressData,
    deliveryData: AddressData,
    volume?: number
  ): AutoDetectionResult {
    // Détection monte-meuble pour chaque adresse
    const pickupFurnitureLift = this.detectFurnitureLift(pickupData, volume);
    const deliveryFurnitureLift = this.detectFurnitureLift(deliveryData, volume);

    // Détection distance de portage pour chaque adresse
    const pickupCarrying = this.detectLongCarryingDistance(pickupData);
    const deliveryCarrying = this.detectLongCarryingDistance(deliveryData);

    // Compilation des contraintes appliquées
    const appliedConstraints: Array<{
      id: string;
      location: 'pickup' | 'delivery';
      reason: string;
      surcharge: number;
    }> = [];

    let totalSurcharge = 0;

    // Ajout monte-meuble départ
    if (pickupFurnitureLift.furnitureLiftRequired) {
      appliedConstraints.push({
        id: 'furniture_lift',
        location: 'pickup',
        reason: pickupFurnitureLift.furnitureLiftReason || 'Monte-meuble requis au départ',
        surcharge: this.FURNITURE_LIFT_SURCHARGE
      });
      totalSurcharge += this.FURNITURE_LIFT_SURCHARGE;
    }

    // Ajout monte-meuble arrivée
    if (deliveryFurnitureLift.furnitureLiftRequired) {
      appliedConstraints.push({
        id: 'furniture_lift',
        location: 'delivery',
        reason: deliveryFurnitureLift.furnitureLiftReason || 'Monte-meuble requis à l\'arrivée',
        surcharge: this.FURNITURE_LIFT_SURCHARGE
      });
      totalSurcharge += this.FURNITURE_LIFT_SURCHARGE;
    }

    // Ajout distance portage départ
    if (pickupCarrying.longCarryingDistance) {
      appliedConstraints.push({
        id: 'long_carrying_distance',
        location: 'pickup',
        reason: pickupCarrying.carryingDistanceReason || 'Distance de portage longue au départ',
        surcharge: this.LONG_CARRYING_DISTANCE_SURCHARGE
      });
      totalSurcharge += this.LONG_CARRYING_DISTANCE_SURCHARGE;
    }

    // Ajout distance portage arrivée
    if (deliveryCarrying.longCarryingDistance) {
      appliedConstraints.push({
        id: 'long_carrying_distance',
        location: 'delivery',
        reason: deliveryCarrying.carryingDistanceReason || 'Distance de portage longue à l\'arrivée',
        surcharge: this.LONG_CARRYING_DISTANCE_SURCHARGE
      });
      totalSurcharge += this.LONG_CARRYING_DISTANCE_SURCHARGE;
    }

    return {
      pickup: {
        furnitureLiftRequired: pickupFurnitureLift.furnitureLiftRequired,
        furnitureLiftReason: pickupFurnitureLift.furnitureLiftReason,
        longCarryingDistance: pickupCarrying.longCarryingDistance,
        carryingDistanceReason: pickupCarrying.carryingDistanceReason
      },
      delivery: {
        furnitureLiftRequired: deliveryFurnitureLift.furnitureLiftRequired,
        furnitureLiftReason: deliveryFurnitureLift.furnitureLiftReason,
        longCarryingDistance: deliveryCarrying.longCarryingDistance,
        carryingDistanceReason: deliveryCarrying.carryingDistanceReason
      },
      totalSurcharge,
      appliedConstraints
    };
  }

  /**
   * 🚪 DÉTECTION MONTE-MEUBLE POUR UNE ADRESSE
   *
   * Logique unifiée et harmonisée basée sur :
   * - Étage (> 3 = requis)
   * - Type d'ascenseur (no/small/medium/large)
   * - État de l'ascenseur (indisponible/inadapté/interdit)
   * - Volume (petits volumes peuvent être exemptés)
   *
   * @param addressData Données de l'adresse à analyser
   * @param volume Volume du déménagement (optionnel)
   * @returns Résultat de la détection monte-meuble
   */
  static detectFurnitureLift(
    addressData: AddressData,
    volume?: number
  ): AddressDetectionResult {
    const floor = addressData.floor || 0;
    const elevator = addressData.elevator || 'no';
    const elevatorUnavailable = addressData.elevatorUnavailable || false;
    const elevatorUnsuitable = addressData.elevatorUnsuitable || false;
    const elevatorForbiddenMoving = addressData.elevatorForbiddenMoving || false;
    const constraints = addressData.constraints || [];

    // 🎯 Liste des contraintes potentiellement consommées par le monte-meubles
    const consumedConstraints: string[] = [];

    // CAS 1: Ascenseur medium/large fonctionnel → PAS de monte-meuble
    if (
      ['medium', 'large'].includes(elevator) &&
      !elevatorUnavailable &&
      !elevatorUnsuitable &&
      !elevatorForbiddenMoving
    ) {
      return {
        furnitureLiftRequired: false,
        longCarryingDistance: false,
        consumedConstraints: []
      };
    }

    // CAS 2: Aucun ascenseur - Logique harmonisée
    if (elevator === 'no') {
      if (floor > this.FURNITURE_LIFT_FLOOR_THRESHOLD) {
        // ✅ CONSOMMATION: Utilise les UUIDs des règles consommables
        CONSUMED_BY_FURNITURE_LIFT.forEach(ruleUuid => {
          if (constraints.includes(ruleUuid)) {
            consumedConstraints.push(ruleUuid);
          }
        });

        return {
          furnitureLiftRequired: true,
          furnitureLiftReason: `Étage ${floor} sans ascenseur (seuil: ${this.FURNITURE_LIFT_FLOOR_THRESHOLD})`,
          longCarryingDistance: false,
          consumedConstraints
        };
      }
      // Étage <= seuil → pas de monte-meuble
      return {
        furnitureLiftRequired: false,
        longCarryingDistance: false,
        consumedConstraints: []
      };
    }

    // CAS 3: Ascenseur small ou problèmes avec ascenseur medium/large
    if (
      elevator === 'small' ||
      elevatorUnavailable ||
      elevatorUnsuitable ||
      elevatorForbiddenMoving
    ) {
      // Étage > seuil → monte-meuble requis
      if (floor > this.FURNITURE_LIFT_FLOOR_THRESHOLD) {
        let reason = `Étage ${floor} avec ascenseur ${elevator}`;

        // ✅ CONSOMMATION: Problèmes d'ascenseur
        // Si elevator === 'small', c'est implicitement inadapté pour les meubles
        if (elevator === 'small' && constraints.includes('elevator_unsuitable_size')) {
          consumedConstraints.push('elevator_unsuitable_size');
        }

        if (elevatorUnavailable) {
          reason += ' (indisponible)';
          if (constraints.includes('elevator_unavailable')) consumedConstraints.push('elevator_unavailable');
        }
        if (elevatorUnsuitable) {
          reason += ' (inadapté)';
          if (constraints.includes('elevator_unsuitable_size')) consumedConstraints.push('elevator_unsuitable_size');
        }
        if (elevatorForbiddenMoving) {
          reason += ' (interdit déménagement)';
          if (constraints.includes('elevator_forbidden_moving')) consumedConstraints.push('elevator_forbidden_moving');
        }

        // ✅ CONSOMMATION: Utilise les UUIDs des règles consommables
        CONSUMED_BY_FURNITURE_LIFT.forEach(ruleUuid => {
          if (constraints.includes(ruleUuid)) {
            consumedConstraints.push(ruleUuid);
          }
        });

        return {
          furnitureLiftRequired: true,
          furnitureLiftReason: reason,
          longCarryingDistance: false,
          consumedConstraints
        };
      }

      // Étage <= seuil → pas de monte-meuble (même avec petit ascenseur)
      return {
        furnitureLiftRequired: false,
        longCarryingDistance: false,
        consumedConstraints: []
      };
    }

    // Par défaut : pas de monte-meuble
    return {
      furnitureLiftRequired: false,
      longCarryingDistance: false,
      consumedConstraints: []
    };
  }

  /**
   * 📏 DÉTECTION DISTANCE DE PORTAGE LONGUE
   *
   * Logique unifiée basée sur la distance déclarée :
   * - '0-10' : courte (pas de surcharge)
   * - '10-30' : moyenne (pas de surcharge)
   * - '30+' : longue (surcharge appliquée)
   *
   * @param addressData Données de l'adresse à analyser
   * @returns Résultat de la détection distance de portage
   */
  static detectLongCarryingDistance(
    addressData: AddressData
  ): AddressDetectionResult {
    const carryDistance = addressData.carryDistance;

    // Vérifier si la distance est longue (30+)
    if (carryDistance === this.LONG_CARRYING_DISTANCE_THRESHOLD) {
      return {
        furnitureLiftRequired: false,
        longCarryingDistance: true,
        carryingDistanceReason: 'Distance de portage > 30m'
      };
    }

    // Sinon, pas de distance longue détectée
    return {
      furnitureLiftRequired: false,
      longCarryingDistance: false
    };
  }

  /**
   * 🔍 OBTENIR LES IDS DES CONTRAINTES AUTOMATIQUES
   *
   * Utilitaire pour obtenir les IDs des contraintes à ajouter/retirer
   * dans les listes de contraintes sélectionnées.
   *
   * @param result Résultat de l'auto-détection
   * @returns Liste des IDs de contraintes à appliquer
   */
  static getAutomaticConstraintIds(result: AutoDetectionResult): {
    pickup: string[];
    delivery: string[];
  } {
    const pickupIds: string[] = [];
    const deliveryIds: string[] = [];

    result.appliedConstraints.forEach(constraint => {
      if (constraint.location === 'pickup') {
        pickupIds.push(constraint.id);
      } else {
        deliveryIds.push(constraint.id);
      }
    });

    return {
      pickup: pickupIds,
      delivery: deliveryIds
    };
  }

  /**
   * 💰 CALCULER LA SURCHARGE TOTALE DES CONTRAINTES AUTOMATIQUES
   *
   * Utilitaire pour obtenir le montant total des surcharges automatiques.
   *
   * @param result Résultat de l'auto-détection
   * @returns Montant total des surcharges (en €)
   */
  static calculateAutomaticSurcharges(result: AutoDetectionResult): number {
    return result.totalSurcharge;
  }

  /**
   * 📊 OBTENIR UN RÉSUMÉ TEXTUEL DES DÉTECTIONS
   *
   * Génère un résumé lisible des contraintes détectées.
   * Utile pour affichage dans l'UI ou logging.
   *
   * @param result Résultat de l'auto-détection
   * @returns Tableau de messages descriptifs
   */
  static getSummary(result: AutoDetectionResult): string[] {
    const summary: string[] = [];

    result.appliedConstraints.forEach(constraint => {
      const location = constraint.location === 'pickup' ? 'départ' : 'arrivée';
      summary.push(`[${location}] ${constraint.reason} (+${constraint.surcharge}€)`);
    });

    if (summary.length === 0) {
      summary.push('Aucune contrainte automatique détectée');
    } else {
      summary.push(`TOTAL SURCHARGES: ${result.totalSurcharge}€`);
    }

    return summary;
  }

  /**
   * ✅ VALIDER LES DONNÉES D'ADRESSE
   *
   * Vérifie que les données fournies sont valides avant traitement.
   *
   * @param addressData Données d'adresse à valider
   * @returns true si valide, false sinon
   */
  static validateAddressData(addressData: AddressData): boolean {
    // Vérifier que l'étage est un nombre positif
    if (typeof addressData.floor !== 'number' || addressData.floor < 0) {
      return false;
    }

    // Vérifier que l'ascenseur a une valeur valide
    const validElevatorValues = ['no', 'small', 'medium', 'large'];
    if (!validElevatorValues.includes(addressData.elevator)) {
      return false;
    }

    // Vérifier la distance de portage si fournie
    if (addressData.carryDistance) {
      const validCarryDistances = ['0-10', '10-30', '30+'];
      if (!validCarryDistances.includes(addressData.carryDistance)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 🔧 CONSTRUIRE AddressData DEPUIS DONNÉES FORMULAIRE
   *
   * Convertit les données brutes d'un formulaire en AddressData typé.
   * Centralise la logique de parsing et normalisation.
   *
   * @param formData Données brutes du formulaire
   * @returns AddressData normalisé
   */
  static buildAddressDataFromForm(formData: FormAddressData): AddressData {
    const floor = typeof formData.floor === 'string'
      ? parseInt(formData.floor) || 0
      : formData.floor || 0;

    const elevator = (formData.elevator || 'no') as 'no' | 'small' | 'medium' | 'large';
    const selectedConstraints = formData.selectedConstraints || [];

    return {
      floor,
      elevator,
      elevatorUnavailable: selectedConstraints.includes('elevator_unavailable'),
      elevatorUnsuitable: selectedConstraints.includes('elevator_unsuitable_size'),
      elevatorForbiddenMoving: selectedConstraints.includes('elevator_forbidden_moving'),
      carryDistance: formData.carryDistance as '0-10' | '10-30' | '30+' | undefined,
      constraints: selectedConstraints
    };
  }

  /**
   * 📋 OBTENIR LES RAISONS DÉTAILLÉES DU MONTE-MEUBLE
   *
   * Analyse les contraintes sélectionnées et génère une liste détaillée
   * des raisons expliquant pourquoi le monte-meuble est requis.
   *
   * @param addressData Données de l'adresse
   * @param volume Volume du déménagement (optionnel)
   * @returns Liste des raisons détaillées
   */
  static getDetailedReasonsForFurnitureLift(
    addressData: AddressData,
    volume?: number
  ): string[] {
    const reasons: string[] = [];
    const constraints = addressData.constraints || [];

    // Raisons liées à l'ascenseur et contraintes (utilise les UUIDs)
    if (constraints.includes(RULE_UUID_ESCALIER_DIFFICILE)) {
      reasons.push('escalier difficile');
    }
    if (constraints.includes(RULE_UUID_COULOIRS_ETROITS)) {
      reasons.push('couloirs étroits');
    }
    if (constraints.includes(RULE_UUID_PASSAGE_INDIRECT)) {
      reasons.push('sortie indirecte');
    }

    // Raisons liées aux objets (utilise les UUIDs)
    if (constraints.includes(RULE_UUID_MEUBLES_ENCOMBRANTS)) {
      reasons.push('meubles encombrants');
    }
    if (constraints.includes(RULE_UUID_OBJETS_LOURDS)) {
      reasons.push('objets très lourds');
    }

    // Raisons liées à l'étage
    const hasNoElevator = !addressData.elevator || addressData.elevator === 'no';
    const hasSmallElevator = addressData.elevator === 'small';
    if (addressData.floor > this.FURNITURE_LIFT_FLOOR_THRESHOLD && (hasNoElevator || hasSmallElevator)) {
      reasons.push(`étage élevé (${addressData.floor})`);
    }

    // Raison liée au volume (seuil: 10 m³)
    if (volume && volume >= 10) {
      reasons.push(`volume important (${volume} m³)`);
    }

    return reasons;
  }

  /**
   * ⚠️ VÉRIFIER SI UN AVERTISSEMENT EST NÉCESSAIRE
   *
   * Détermine si l'utilisateur doit être averti d'une situation
   * nécessitant un monte-meuble.
   *
   * @param addressData Données de l'adresse
   * @returns true si avertissement nécessaire
   */
  static shouldWarnUser(addressData: AddressData): boolean {
    const floor = addressData.floor || 0;
    const elevator = addressData.elevator || 'no';
    const constraints = addressData.constraints || [];

    // Avertir si étage élevé sans ascenseur adapté
    if (floor > 2 && (elevator === 'no' || elevator === 'small')) {
      return true;
    }

    // Avertir si contraintes critiques détectées (utilise les UUIDs)
    return constraints.some(c => CRITICAL_CONSTRAINTS_REQUIRING_LIFT.includes(c));
  }

  /**
   * ✅ VALIDER LA SÉLECTION DE CONTRAINTES
   *
   * Vérifie si une tentative de désélection de contrainte automatique doit être bloquée.
   * Utilisé dans les modals pour empêcher l'utilisateur de décocher des contraintes obligatoires.
   *
   * @param previousSelectedIds IDs des contraintes précédemment sélectionnées
   * @param newSelectedIds IDs des contraintes nouvellement sélectionnées
   * @param addressData Données de l'adresse pour détection automatique
   * @param volume Volume du déménagement (optionnel)
   * @returns Résultat de validation avec contrainte bloquée si applicable
   */
  static validateConstraintSelection(
    previousSelectedIds: string[],
    newSelectedIds: string[],
    addressData: AddressData,
    volume?: number
  ): {
    isValid: boolean;
    blockedConstraintId?: 'furniture_lift_required' | 'long_carrying_distance';
    reason?: string;
  } {
    // Détecter les contraintes automatiques requises
    const furnitureLiftResult = this.detectFurnitureLift(addressData, volume);
    const longCarryingResult = this.detectLongCarryingDistance(addressData);

    // Vérifier tentative de désélection monte-meuble
    const wasFurnitureLiftSelected = previousSelectedIds.includes('furniture_lift_required');
    const isFurnitureLiftSelected = newSelectedIds.includes('furniture_lift_required');

    if (wasFurnitureLiftSelected && !isFurnitureLiftSelected && furnitureLiftResult.furnitureLiftRequired) {
      return {
        isValid: false,
        blockedConstraintId: 'furniture_lift_required',
        reason: furnitureLiftResult.furnitureLiftReason || 'Monte-meuble requis automatiquement'
      };
    }

    // Vérifier tentative de désélection distance portage
    const wasLongCarryingSelected = previousSelectedIds.includes('long_carrying_distance');
    const isLongCarryingSelected = newSelectedIds.includes('long_carrying_distance');

    if (wasLongCarryingSelected && !isLongCarryingSelected && longCarryingResult.longCarryingDistance) {
      return {
        isValid: false,
        blockedConstraintId: 'long_carrying_distance',
        reason: longCarryingResult.carryingDistanceReason || 'Distance de portage longue détectée'
      };
    }

    // Sélection valide
    return {
      isValid: true
    };
  }

  /**
   * 🔄 APPLIQUER LES CONTRAINTES AUTOMATIQUES
   *
   * Ajoute automatiquement les contraintes requises à une sélection existante.
   * Retourne la liste mise à jour avec les contraintes automatiques.
   *
   * @param currentSelectedIds IDs actuellement sélectionnés
   * @param addressData Données de l'adresse
   * @param volume Volume du déménagement (optionnel)
   * @returns Liste mise à jour avec contraintes automatiques
   */
  static applyAutomaticConstraints(
    currentSelectedIds: string[],
    addressData: AddressData,
    volume?: number
  ): string[] {
    const result = [...currentSelectedIds];

    // Ajouter monte-meuble si requis et pas déjà présent
    const furnitureLiftResult = this.detectFurnitureLift(addressData, volume);
    if (furnitureLiftResult.furnitureLiftRequired && !result.includes('furniture_lift_required')) {
      result.push('furniture_lift_required');
    }

    // Ajouter distance portage si requise et pas déjà présente
    const longCarryingResult = this.detectLongCarryingDistance(addressData);
    if (longCarryingResult.longCarryingDistance && !result.includes('long_carrying_distance')) {
      result.push('long_carrying_distance');
    }

    return result;
  }
}