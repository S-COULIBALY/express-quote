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
 * - Gestion de la consommation des contraintes (évite double facturation)
 * - Inférence automatique des contraintes manquantes (principe : "Mieux vaut inférer trop que facturer deux fois")
 *
 * 🔗 INTÉGRATION DANS LE FLUX DE CALCUL :
 * 
 * 1. FRONTEND → API
 *    - Le frontend envoie les données du formulaire via POST /api/price/calculate
 *    - Les contraintes sont envoyées comme arrays d'UUIDs (pickupLogisticsConstraints, deliveryLogisticsConstraints)
 *
 * 2. PriceService → QuoteCalculator → Strategy
 *    - PriceService crée un QuoteContext avec les données du formulaire
 *    - QuoteCalculator sélectionne la stratégie appropriée (MovingQuoteStrategy, CleaningQuoteStrategy, etc.)
 *    - La stratégie charge les règles depuis la BDD via UnifiedDataService.getBusinessRulesForEngine()
 *
 * 3. Strategy → RuleEngine → RuleContextEnricher
 *    - RuleEngine reçoit les règles (Rule[]) chargées depuis la BDD
 *    - RuleContextEnricher.enrichContext() appelle AutoDetectionService.detectFurnitureLift()
 *    - AutoDetectionService analyse les données d'adresse et détecte le besoin de monte-meuble
 *    - Si monte-meuble requis, le service infère automatiquement toutes les contraintes consommables non déclarées
 *    - Les contraintes déclarées, inférées et consommées sont retournées dans le résultat
 *
 * 4. RuleEngine → RuleApplicationService
 *    - RuleApplicationService applique les règles en ignorant celles dont l'ID est dans consumed_constraints
 *    - Cela évite la double facturation (monte-meuble + contraintes résolues)
 *    - Les contraintes inférées sont tracées via inferenceMetadata pour audit
 *
 * 📊 STRUCTURE DES RÈGLES EN BDD (table `rules`) :
 * 
 * ```typescript
 * {
 *   id: string,                    // UUID de la règle (ex: '40acdd70-5c1f-4936-a53c-8f52e6695a4c')
 *   name: string,                  // Nom de la règle (ex: 'Escalier difficile ou dangereux')
 *   description: string?,         // Description optionnelle
 *   value: number,                 // Valeur de la règle (montant ou pourcentage)
 *   isActive: boolean,             // Règle active ou non
 *   category: RuleCategory,        // Catégorie (SURCHARGE, DISCOUNT, etc.)
 *   condition: Json?,              // Conditions d'application (JSON)
 *   percentBased: boolean,         // Calcul en pourcentage ou montant fixe
 *   serviceType: ServiceType,      // Type de service (MOVING, CLEANING, etc.)
 *   ruleType: RuleType?,           // Type de règle (CONSTRAINT, BUSINESS, PRICING, etc.)
 *   priority: number?,             // Priorité d'application (défaut: 100)
 *   validFrom: DateTime?,          // Date de début de validité
 *   validTo: DateTime?,            // Date de fin de validité
 *   tags: string[],                // Tags pour filtrage
 *   configKey: string?,            // Clé de configuration
 *   metadata: Json?,                // Métadonnées (category_frontend, scope, etc.)
 *   scope: RuleScope                // Portée (PICKUP, DELIVERY, BOTH, GLOBAL)
 * }
 * ```
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
 *
 * ⚙️ CONFIGURATION :
 * - FURNITURE_LIFT_FLOOR_THRESHOLD = 5 (étage > 5 = monte-meuble requis)
 * - Les UUIDs des contraintes consommables sont définis dans RuleUUIDs.ts
 * - Ces UUIDs doivent correspondre exactement aux IDs dans la table `rules` de la BDD
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
  RULE_UUID_ASCENSEUR_TROP_PETIT,
  RULE_UUID_ASCENSEUR_PANNE,
  RULE_UUID_ASCENSEUR_INTERDIT,
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
   * 🎯 Contraintes déclarées par le client
   * Contraintes explicitement sélectionnées par l'utilisateur dans le formulaire
   */
  declaredConstraints?: string[];
  
  /**
   * 🎯 Contraintes inférées automatiquement
   * Contraintes déduites par le système si monte-meuble requis mais non déclarées par le client
   * Représentent les oublis compensés par le moteur
   */
  inferredConstraints?: string[];
  
  /**
   * 🎯 Contraintes consommées par le monte-meubles
   * Total des contraintes résolues par le monte-meuble (déclarées + inférées)
   * Ces contraintes ne doivent PAS être facturées séparément
   * car le monte-meubles résout déjà ces problèmes
   */
  consumedConstraints?: string[];
  
  /**
   * 📊 Métadonnées pour la traçabilité de l'inférence
   */
  inferenceMetadata?: {
    reason: string;
    inferredAt: Date;
    allowInference: boolean;
  };
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
  private static readonly FURNITURE_LIFT_FLOOR_THRESHOLD = 5; // Étage à partir duquel le monte-meuble est requis (> 5)
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
   * - Étage (> 5 = requis, seuil configuré via FURNITURE_LIFT_FLOOR_THRESHOLD)
   * - Type d'ascenseur (no/small/medium/large)
   * - État de l'ascenseur (indisponible/inadapté/interdit)
   * - Volume (petits volumes peuvent être exemptés)
   *
   * 📋 INTÉGRATION AVEC LE FLUX DE CALCUL :
   * - Les règles sont chargées depuis la BDD via UnifiedDataService.getBusinessRulesForEngine()
   * - Les UUIDs des contraintes consommables sont définis dans RuleUUIDs.ts (CONSUMED_BY_FURNITURE_LIFT)
   * - Ces UUIDs correspondent aux IDs des règles dans la table `rules` de la BDD
   * - Le service implémente l'inférence : si monte-meuble requis, toutes les contraintes consommables
   *   sont automatiquement inférées et consommées, même si non déclarées par le client
   * - Les contraintes consommées sont passées au RuleEngine via RuleContextEnricher
   * - Le RuleEngine ignore les règles dont l'ID est dans consumed_constraints
   *
   * 🔗 STRUCTURE DES RÈGLES EN BDD :
   * - id: UUID de la règle (correspond aux constantes dans RuleUUIDs.ts)
   * - name: Nom de la règle (ex: "Escalier difficile ou dangereux")
   * - condition: JSON avec les conditions d'application
   * - metadata: JSON avec métadonnées (category_frontend, scope, etc.)
   * - ruleType: Type de règle (CONSTRAINT, BUSINESS, PRICING, etc.)
   * - scope: Portée de la règle (PICKUP, DELIVERY, BOTH, GLOBAL)
   *
   * 🎯 INFÉRENCE AUTOMATIQUE :
   * Principe : "Mieux vaut inférer trop que facturer deux fois"
   * - Si monte-meuble requis ET allowInference = true, toutes les contraintes de CONSUMED_BY_FURNITURE_LIFT
   *   non déclarées sont automatiquement inférées et consommées
   * - Cela évite la double facturation si le client oublie de cocher une contrainte
   *
   * @param addressData Données de l'adresse à analyser
   * @param volume Volume du déménagement (optionnel)
   * @param options Options pour activer/désactiver l'inférence
   * @returns Résultat de la détection monte-meuble avec contraintes déclarées/inférées/consommées
   */
  static detectFurnitureLift(
    addressData: AddressData,
    volume?: number,
    options?: {
      allowInference?: boolean;        // Activer l'inférence automatique (défaut: true)
      submissionContext?: 'draft' | 'final';  // Contexte de soumission (draft = pas d'inférence)
    }
  ): AddressDetectionResult {
    const floor = addressData.floor || 0;
    const elevator = addressData.elevator || 'no';
    const elevatorUnavailable = addressData.elevatorUnavailable || false;
    const elevatorUnsuitable = addressData.elevatorUnsuitable || false;
    const elevatorForbiddenMoving = addressData.elevatorForbiddenMoving || false;
    const constraints = addressData.constraints || [];

    // 🎯 Déterminer si l'inférence doit être activée
    // Par défaut, activée sauf si explicitement désactivée ou en mode draft
    const shouldInfer = options?.allowInference !== false && 
                        options?.submissionContext !== 'draft';

    // 🎯 Contraintes déclarées par le client
    const declaredConstraints = constraints || [];
    
    // 🎯 Liste des contraintes potentiellement consommées par le monte-meubles
    const consumedConstraints: string[] = [];
    const inferredConstraints: string[] = [];

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
        declaredConstraints: [],
        inferredConstraints: [],
        consumedConstraints: []
      };
    }

    // CAS 2: Aucun ascenseur - Logique harmonisée
    if (elevator === 'no') {
      if (floor > this.FURNITURE_LIFT_FLOOR_THRESHOLD) {
        const reason = `Étage ${floor} sans ascenseur (seuil: ${this.FURNITURE_LIFT_FLOOR_THRESHOLD})`;
        
        // ✅ INFÉRENCE: Si monte-meuble requis, inférer toutes les contraintes consommables non déclarées
        if (shouldInfer) {
          // Contraintes inférées (toutes celles de CONSUMED_BY_FURNITURE_LIFT non déclarées)
          const inferred = CONSUMED_BY_FURNITURE_LIFT.filter(
            c => !declaredConstraints.includes(c)
          );
          inferredConstraints.push(...inferred);
        }
        
        // ✅ CONSOMMATION: Contraintes déclarées qui sont consommables
        const declaredConsumable = declaredConstraints.filter(
          c => (CONSUMED_BY_FURNITURE_LIFT as readonly string[]).includes(c)
        );
        consumedConstraints.push(...declaredConsumable);
        
        // ✅ CONSOMMATION: Ajouter les contraintes inférées
        consumedConstraints.push(...inferredConstraints);

        return {
          furnitureLiftRequired: true,
          furnitureLiftReason: reason,
          longCarryingDistance: false,
          declaredConstraints: [...declaredConstraints],
          inferredConstraints: [...inferredConstraints],
          consumedConstraints: [...consumedConstraints],
          inferenceMetadata: shouldInfer ? {
            reason: 'Monte-meuble requis, inférence automatique activée',
            inferredAt: new Date(),
            allowInference: true
          } : undefined
        };
      }
      // Étage <= seuil → pas de monte-meuble
      return {
        furnitureLiftRequired: false,
        longCarryingDistance: false,
        declaredConstraints: [...declaredConstraints],
        inferredConstraints: [],
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

        // ✅ CONSOMMATION: Problèmes d'ascenseur (déclarés)
        // Si elevator === 'small', c'est implicitement inadapté pour les meubles
        // Utiliser les UUIDs réels au lieu des strings
        if (elevator === 'small' && constraints.includes(RULE_UUID_ASCENSEUR_TROP_PETIT)) {
          consumedConstraints.push(RULE_UUID_ASCENSEUR_TROP_PETIT);
        }

        if (elevatorUnavailable) {
          reason += ' (indisponible)';
          if (constraints.includes(RULE_UUID_ASCENSEUR_PANNE)) {
            consumedConstraints.push(RULE_UUID_ASCENSEUR_PANNE);
          }
        }
        if (elevatorUnsuitable) {
          reason += ' (inadapté)';
          if (constraints.includes(RULE_UUID_ASCENSEUR_TROP_PETIT)) {
            consumedConstraints.push(RULE_UUID_ASCENSEUR_TROP_PETIT);
          }
        }
        if (elevatorForbiddenMoving) {
          reason += ' (interdit déménagement)';
          if (constraints.includes(RULE_UUID_ASCENSEUR_INTERDIT)) {
            consumedConstraints.push(RULE_UUID_ASCENSEUR_INTERDIT);
          }
        }

        // ✅ CONSOMMATION: Contraintes déclarées qui sont consommables
        const declaredConsumable = declaredConstraints.filter(
          c => (CONSUMED_BY_FURNITURE_LIFT as readonly string[]).includes(c)
        );
        consumedConstraints.push(...declaredConsumable);

        // ✅ INFÉRENCE: Si monte-meuble requis, inférer toutes les contraintes consommables non déclarées
        if (shouldInfer) {
          // Contraintes inférées (toutes celles de CONSUMED_BY_FURNITURE_LIFT non déclarées)
          const inferred = CONSUMED_BY_FURNITURE_LIFT.filter(
            c => !declaredConstraints.includes(c)
          );
          inferredConstraints.push(...inferred);
        }
        
        // ✅ CONSOMMATION: Ajouter les contraintes inférées
        consumedConstraints.push(...inferredConstraints);

        return {
          furnitureLiftRequired: true,
          furnitureLiftReason: reason,
          longCarryingDistance: false,
          declaredConstraints: [...declaredConstraints],
          inferredConstraints: [...inferredConstraints],
          consumedConstraints: [...consumedConstraints],
          inferenceMetadata: shouldInfer ? {
            reason: 'Monte-meuble requis, inférence automatique activée',
            inferredAt: new Date(),
            allowInference: true
          } : undefined
        };
      }

      // Étage <= seuil → pas de monte-meuble (même avec petit ascenseur)
      return {
        furnitureLiftRequired: false,
        longCarryingDistance: false,
        declaredConstraints: [...declaredConstraints],
        inferredConstraints: [],
        consumedConstraints: []
      };
    }

    // Par défaut : pas de monte-meuble
    return {
      furnitureLiftRequired: false,
      longCarryingDistance: false,
      declaredConstraints: [...declaredConstraints],
      inferredConstraints: [],
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
    return constraints.some(c => (CRITICAL_CONSTRAINTS_REQUIRING_LIFT as readonly string[]).includes(c));
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