/**
 * FormAdapter - Adaptateur pour convertir les données du formulaire en QuoteContext
 *
 * RÈGLE ABSOLUE : Aucune logique métier ici, uniquement mapping et normalisation basique.
 * Toute la logique métier est dans les modules du moteur.
 *
 * ENRICHISSEMENT AUTOMATIQUE :
 * - Estimation des distances de portage (basée sur étage + ascenseur)
 * - Calcul de la confiance du volume (basée sur méthode + cohérence)
 * - Note : La distance est calculée côté frontend via Google Maps API
 */

import { QuoteContext } from '../core/QuoteContext';
import { modalSelectionsToQuoteContext, ModalSelections } from './ModalSelectionsAdapter';

/**
 * Interface pour les données brutes du formulaire
 * Cette interface peut être étendue selon les besoins du formulaire frontend
 */
export interface FormData {
  // Date (supporte plusieurs conventions de nommage)
  movingDate?: string | Date;
  dateSouhaitee?: string | Date; // Alias depuis le formulaire
  flexibility?: 'NONE' | 'PLUS_MINUS_3' | 'PLUS_MINUS_7' | string;

  // Logement
  housingType?: 'STUDIO' | 'F2' | 'F3' | 'F4' | 'F5+' | 'HOUSE' | string;
  surface?: number | string;
  rooms?: number | string;

  // Volume
  volumeMethod?: 'FORM' | 'LIST' | 'VIDEO';
  estimatedVolume?: number | string;
  volumeEstime?: 'petit' | 'moyen' | 'grand' | 'tres-grand' | string; // Support du format catégoriel depuis le formulaire
  volumeConfidence?: 'LOW' | 'MEDIUM' | 'HIGH';

  // Adresse départ (support de plusieurs conventions de nommage)
  departureAddress?: string; // Convention moteur de tarification
  pickupAddress?: string; // Convention formulaires (alias de departureAddress)
  adresseDepart?: string; // Alias français legacy
  departurePostalCode?: string;
  pickupPostalCode?: string; // Alias
  departureCity?: string;
  pickupCity?: string; // Alias
  pickupFloor?: number | string;
  pickupHasElevator?: boolean | string;
  pickupElevator?: 'no' | 'small' | 'medium' | 'large' | string; // Support du format enum depuis le formulaire
  pickupElevatorSize?: 'SMALL' | 'STANDARD' | 'LARGE';
  pickupCarryDistance?: number | string;
  pickupStreetNarrow?: boolean | string;
  pickupParkingAuthorizationRequired?: boolean | string;
  pickupSyndicTimeSlot?: boolean | string;

  // Adresse arrivée (support de plusieurs conventions de nommage)
  arrivalAddress?: string; // Convention moteur de tarification
  deliveryAddress?: string; // Convention formulaires (alias de arrivalAddress)
  adresseArrivee?: string; // Alias français legacy
  arrivalPostalCode?: string;
  deliveryPostalCode?: string; // Alias
  arrivalCity?: string;
  deliveryCity?: string; // Alias
  deliveryFloor?: number | string;
  deliveryHasElevator?: boolean | string;
  deliveryElevator?: 'no' | 'small' | 'medium' | 'large' | string; // Support du format enum depuis le formulaire
  deliveryElevatorSize?: 'SMALL' | 'STANDARD' | 'LARGE';
  deliveryCarryDistance?: number | string;
  deliveryStreetNarrow?: boolean | string;
  deliveryParkingAuthorizationRequired?: boolean | string;
  deliverySyndicTimeSlot?: boolean | string;

  // Distance (calculée par le formulaire via Google Maps)
  distance?: number | string;

  // Inventaire
  bulkyFurniture?: boolean | string;
  piano?: boolean | string;
  safe?: boolean | string;
  artwork?: boolean | string;
  builtInAppliances?: boolean | string;

  // Logistique
  multiplePickupPoints?: boolean | string;
  temporaryStorage?: boolean | string;
  storageDurationDays?: number | string;

  // Services
  packing?: boolean | string;
  unpacking?: boolean | string;
  cleaningEnd?: boolean | string;

  // Juridique
  declaredValue?: number | string;
  refuseLiftDespiteRecommendation?: boolean | string;

  // Sélections des modals (contraintes et services)
  pickupLogistics?: {
    addressConstraints?: Record<string, boolean>;
    addressServices?: Record<string, boolean>;
    globalServices?: Record<string, boolean>;
  };
  deliveryLogistics?: {
    addressConstraints?: Record<string, boolean>;
    addressServices?: Record<string, boolean>;
    globalServices?: Record<string, boolean>;
  };

  // ============================================================================
  // CROSS-SELLING (depuis le catalogue)
  // ============================================================================

  // Services cross-selling (flags pour activer les modules)
  dismantling?: boolean | string;     // Service démontage meubles
  reassembly?: boolean | string;      // Service remontage meubles

  // ============================================================================
  // MONTE-MEUBLES (checkbox par adresse dans le formulaire)
  // ============================================================================
  // Gestion automatique par seuils :
  // - HIGH (≥3) : Coché par défaut, décochable avec avertissement
  // - CRITICAL (≥5) : Coché et non décochable
  pickupFurnitureLift?: boolean | string;    // Monte-meubles adresse départ
  deliveryFurnitureLift?: boolean | string;  // Monte-meubles adresse arrivée

  // Fournitures cross-selling (prix fixes ajoutés au total)
  crossSellingSuppliesTotal?: number | string;  // Total des fournitures sélectionnées (€)
  crossSellingSuppliesDetails?: Array<{         // Détail des fournitures
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;

  // Totaux cross-selling (pour traçabilité)
  crossSellingServicesTotal?: number | string;  // Total des services cross-selling (€)
  crossSellingGrandTotal?: number | string;     // Total général cross-selling (€)
}

/**
 * FormAdapter - Convertit les données du formulaire en QuoteContext
 */
export class FormAdapter {
  /**
   * Convertit les données du formulaire en QuoteContext
   *
   * @param formData Données brutes du formulaire
   * @returns QuoteContext normalisé
   */
  static toQuoteContext(formData: FormData): QuoteContext {
    // ✅ Mapper les sélections des modals vers QuoteContext
    const modalSelections: ModalSelections = {
      pickup: formData.pickupLogistics,
      delivery: formData.deliveryLogistics,
      globalServices: {
        ...formData.pickupLogistics?.globalServices,
        ...formData.deliveryLogistics?.globalServices,
      }
    };
    
    const modalMappedContext = modalSelectionsToQuoteContext(modalSelections);

    // ✅ Fusionner : les modals ont la priorité, mais on garde les champs directs pour compatibilité
    const context: QuoteContext = {
      // Identification (fixe)
      serviceType: 'MOVING',
      region: 'IDF',

      // Date (supporte dateSouhaitee comme alias)
      movingDate: this.normalizeDate(formData.movingDate || formData.dateSouhaitee),
      flexibility: this.convertFlexibilityFromForm(formData.flexibility) ?? this.normalizeFlexibility(formData.flexibility),

      // Logement
      housingType: this.normalizeHousingType(formData.housingType),
      surface: this.normalizeNumber(formData.surface),
      rooms: this.normalizeInteger(formData.rooms),

      // Volume
      // Priorité : estimatedVolume (input number exact) > volumeEstime (select catégorie)
      // Si l'utilisateur a saisi un volume exact, on l'utilise (plus précis)
      // Sinon, on convertit la catégorie sélectionnée
      volumeMethod: this.normalizeVolumeMethod(formData.volumeMethod),
      estimatedVolume: this.normalizeNumber(formData.estimatedVolume) ?? this.convertVolumeEstimeToNumeric(formData.volumeEstime),
      // Confiance du volume : utilise valeur fournie OU calcul automatique
      volumeConfidence: (() => {
        const provided = this.normalizeVolumeConfidence(formData.volumeConfidence);
        if (provided !== undefined) return provided;
        return this.calculateVolumeConfidence({
          method: this.normalizeVolumeMethod(formData.volumeMethod),
          housingType: this.normalizeHousingType(formData.housingType),
          surface: this.normalizeNumber(formData.surface),
          estimatedVolume: this.convertVolumeEstimeToNumeric(formData.volumeEstime) ?? this.normalizeNumber(formData.estimatedVolume)
        });
      })(),

      // Adresse départ (avec support des alias pickupAddress, adresseDepart, pickupPostalCode, pickupCity)
      // Ordre de priorité : departureAddress > pickupAddress > adresseDepart
      departureAddress: formData.departureAddress || formData.pickupAddress || formData.adresseDepart || '',
      departurePostalCode: this.normalizePostalCode(formData.departurePostalCode ?? formData.pickupPostalCode),
      departureCity: this.normalizeString(formData.departureCity ?? formData.pickupCity),
      pickupFloor: this.normalizeInteger(formData.pickupFloor),
      pickupHasElevator: this.convertElevatorEnumToBoolean(formData.pickupElevator) ?? this.normalizeBoolean(formData.pickupHasElevator),
      pickupElevatorSize: this.convertElevatorEnumToSize(formData.pickupElevator) ?? this.normalizeElevatorSize(formData.pickupElevatorSize),
      // Distance de portage : utilise valeur fournie OU estimation automatique
      pickupCarryDistance: (() => {
        const provided = this.normalizeNumber(formData.pickupCarryDistance);
        if (provided !== undefined) return provided;
        return this.estimateCarryDistance({
          floor: this.normalizeInteger(formData.pickupFloor),
          hasElevator: this.convertElevatorEnumToBoolean(formData.pickupElevator) ?? this.normalizeBoolean(formData.pickupHasElevator)
        });
      })(),
      pickupStreetNarrow: this.normalizeBoolean(formData.pickupStreetNarrow),
      pickupParkingAuthorizationRequired: this.normalizeBoolean(formData.pickupParkingAuthorizationRequired),
      pickupSyndicTimeSlot: this.normalizeBoolean(formData.pickupSyndicTimeSlot),

      // Adresse arrivée (avec support des alias deliveryAddress, adresseArrivee, deliveryPostalCode, deliveryCity)
      // Ordre de priorité : arrivalAddress > deliveryAddress > adresseArrivee
      arrivalAddress: formData.arrivalAddress || formData.deliveryAddress || formData.adresseArrivee || '',
      arrivalPostalCode: this.normalizePostalCode(formData.arrivalPostalCode ?? formData.deliveryPostalCode),
      arrivalCity: this.normalizeString(formData.arrivalCity ?? formData.deliveryCity),
      deliveryFloor: this.normalizeInteger(formData.deliveryFloor),
      deliveryHasElevator: this.convertElevatorEnumToBoolean(formData.deliveryElevator) ?? this.normalizeBoolean(formData.deliveryHasElevator),
      deliveryElevatorSize: this.convertElevatorEnumToSize(formData.deliveryElevator) ?? this.normalizeElevatorSize(formData.deliveryElevatorSize),
      // Distance de portage : utilise valeur fournie OU estimation automatique
      deliveryCarryDistance: (() => {
        const provided = this.normalizeNumber(formData.deliveryCarryDistance);
        if (provided !== undefined) return provided;
        return this.estimateCarryDistance({
          floor: this.normalizeInteger(formData.deliveryFloor),
          hasElevator: this.convertElevatorEnumToBoolean(formData.deliveryElevator) ?? this.normalizeBoolean(formData.deliveryHasElevator)
        });
      })(),
      deliveryStreetNarrow: this.normalizeBoolean(formData.deliveryStreetNarrow),
      deliveryParkingAuthorizationRequired: this.normalizeBoolean(formData.deliveryParkingAuthorizationRequired),
      deliverySyndicTimeSlot: this.normalizeBoolean(formData.deliverySyndicTimeSlot),

      // Distance
      distance: this.normalizeNumber(formData.distance),

      // Inventaire - Priorité aux modals, fallback sur champs directs
      bulkyFurniture: modalMappedContext.bulkyFurniture ?? this.normalizeBoolean(formData.bulkyFurniture),
      piano: modalMappedContext.piano ?? this.normalizeBoolean(formData.piano),
      safe: modalMappedContext.safe ?? this.normalizeBoolean(formData.safe),
      artwork: modalMappedContext.artwork ?? this.normalizeBoolean(formData.artwork),
      builtInAppliances: this.normalizeBoolean(formData.builtInAppliances), // Pas dans les modals actuellement

      // Logistique
      multiplePickupPoints: this.normalizeBoolean(formData.multiplePickupPoints),
      // Stockage temporaire - Priorité aux modals, fallback sur champ direct
      temporaryStorage: modalMappedContext.temporaryStorage ?? this.normalizeBoolean(formData.temporaryStorage),
      // Durée de stockage - Gardée du formulaire (valeur numérique)
      storageDurationDays: this.normalizeInteger(formData.storageDurationDays),

      // Services - Priorité aux modals, fallback sur champs directs
      packing: modalMappedContext.packing ?? this.normalizeBoolean(formData.packing),
      unpacking: modalMappedContext.unpacking ?? this.normalizeBoolean(formData.unpacking),
      cleaningEnd: modalMappedContext.cleaningEnd ?? this.normalizeBoolean(formData.cleaningEnd),

      // Services cross-selling (depuis catalogue)
      dismantling: this.normalizeBoolean(formData.dismantling),
      reassembly: this.normalizeBoolean(formData.reassembly),

      // Monte-meubles par adresse (checkbox formulaire)
      pickupFurnitureLift: this.normalizeBoolean(formData.pickupFurnitureLift),
      deliveryFurnitureLift: this.normalizeBoolean(formData.deliveryFurnitureLift),

      // Juridique
      declaredValue: this.normalizeNumber(formData.declaredValue),
      refuseLiftDespiteRecommendation: this.normalizeBoolean(formData.refuseLiftDespiteRecommendation),

      // Cross-selling fournitures (depuis catalogue)
      crossSellingSuppliesTotal: this.normalizeNumber(formData.crossSellingSuppliesTotal),
      // Normaliser les détails des fournitures : transformer 'total' en 'totalPrice' si nécessaire
      crossSellingSuppliesDetails: formData.crossSellingSuppliesDetails?.map(item => ({
        id: item.id || '',
        name: item.name || '',
        quantity: item.quantity || 0,
        unitPrice: item.unitPrice || 0,
        // Gérer les deux formats : totalPrice (attendu) ou total (venant du frontend)
        totalPrice: (item as any).totalPrice ?? (item as any).total ?? 0,
      })),
      crossSellingServicesTotal: this.normalizeNumber(formData.crossSellingServicesTotal),
      crossSellingGrandTotal: this.normalizeNumber(formData.crossSellingGrandTotal),
    };

    return context;
  }

  // ============================================================================
  // MÉTHODES DE NORMALISATION (sans logique métier)
  // ============================================================================

  /**
   * Normalise une date en ISO 8601
   */
  private static normalizeDate(date?: string | Date): string | undefined {
    if (!date) return undefined;
    if (date instanceof Date) {
      return date.toISOString();
    }
    if (typeof date === 'string') {
      // Si déjà au format ISO, retourner tel quel
            const iso8601SimpleRegex = /^\d{4}-\d{2}-\d{2}$/;
            const iso8601FullRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?$/;
            if (iso8601SimpleRegex.test(date) || iso8601FullRegex.test(date)) {
        return date;
      }
      // Sinon, essayer de parser
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
    return undefined;
  }

  /**
   * Normalise flexibility
   */
  private static normalizeFlexibility(
    flexibility?: 'NONE' | 'PLUS_MINUS_3' | 'PLUS_MINUS_7' | string
  ): 'NONE' | 'PLUS_MINUS_3' | 'PLUS_MINUS_7' | undefined {
    if (!flexibility) return undefined;
    const valid = ['NONE', 'PLUS_MINUS_3', 'PLUS_MINUS_7'];
    return valid.includes(flexibility) ? (flexibility as any) : undefined;
  }

  /**
   * Normalise housingType
   */
  private static normalizeHousingType(
    housingType?: 'STUDIO' | 'F2' | 'F3' | 'F4' | 'F5+' | 'HOUSE' | string
  ): 'STUDIO' | 'F2' | 'F3' | 'F4' | 'HOUSE' | undefined {
    if (!housingType) return undefined;
    const valid = ['STUDIO', 'F2', 'F3', 'F4', 'F5+', 'HOUSE'];
    // Mapper F5+ vers F4 pour la compatibilité avec QuoteContext
    if (housingType === 'F5+') return 'F4';
    return valid.includes(housingType) ? (housingType as any) : undefined;
  }

  /**
   * Normalise volumeMethod
   */
  private static normalizeVolumeMethod(
    volumeMethod?: 'FORM' | 'LIST' | 'VIDEO' | string
  ): 'FORM' | 'LIST' | 'VIDEO' | undefined {
    if (!volumeMethod) return undefined;
    const valid = ['FORM', 'LIST', 'VIDEO'];
    return valid.includes(volumeMethod) ? (volumeMethod as any) : undefined;
  }

  /**
   * Normalise volumeConfidence
   */
  private static normalizeVolumeConfidence(
    confidence?: 'LOW' | 'MEDIUM' | 'HIGH' | string
  ): 'LOW' | 'MEDIUM' | 'HIGH' | undefined {
    if (!confidence) return undefined;
    const valid = ['LOW', 'MEDIUM', 'HIGH'];
    return valid.includes(confidence) ? (confidence as any) : undefined;
  }

  /**
   * Normalise elevatorSize
   */
  private static normalizeElevatorSize(
    size?: 'SMALL' | 'STANDARD' | 'LARGE' | string
  ): 'SMALL' | 'STANDARD' | 'LARGE' | undefined {
    if (!size) return undefined;
    const valid = ['SMALL', 'STANDARD', 'LARGE'];
    return valid.includes(size) ? (size as any) : undefined;
  }

  /**
   * Normalise un nombre (string → number)
   */
  private static normalizeNumber(value?: number | string): number | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'number') {
      return isNaN(value) || !isFinite(value) ? undefined : value;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  }

  /**
   * Normalise un entier
   */
  private static normalizeInteger(value?: number | string): number | undefined {
    const normalized = this.normalizeNumber(value);
    return normalized === undefined ? undefined : Math.floor(normalized);
  }

  /**
   * Normalise un booléen (string → boolean)
   */
  private static normalizeBoolean(value?: boolean | string): boolean | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      if (lower === 'true' || lower === '1' || lower === 'yes' || lower === 'oui') {
        return true;
      }
      if (lower === 'false' || lower === '0' || lower === 'no' || lower === 'non') {
        return false;
      }
    }
    return undefined;
  }

  /**
   * Normalise une chaîne de caractères
   */
  private static normalizeString(value?: string): string | undefined {
    if (!value || typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  /**
   * Normalise un code postal (extrait 5 chiffres)
   */
  private static normalizePostalCode(postalCode?: string): string | undefined {
    if (!postalCode || typeof postalCode !== 'string') return undefined;
    const cleaned = postalCode.replace(/\D/g, '');
    return /^\d{5}$/.test(cleaned) ? cleaned : undefined;
  }

  // ============================================================================
  // MÉTHODES DE CONVERSION SPÉCIFIQUES AU FORMULAIRE
  // ============================================================================

  /**
   * Convertit volumeEstime catégoriel en volume numérique (m³)
   *
   * Mapping avec catégories resserrées :
   * - "tres-petit" → 12 m³ (< 15m³)
   * - "petit" → 20 m³ (15-25m³)
   * - "petit-moyen" → 30 m³ (25-35m³)
   * - "moyen" → 42 m³ (35-50m³)
   * - "moyen-grand" → 60 m³ (50-70m³)
   * - "grand" → 85 m³ (70-100m³)
   * - "tres-grand" / "très-grand" → 120 m³ (> 100m³)
   *
   * Gère les variantes avec/sans accents et différentes casses
   */
  private static convertVolumeEstimeToNumeric(volumeEstime?: string): number | undefined {
    if (!volumeEstime || typeof volumeEstime !== 'string') return undefined;

    // Normaliser : lowercase + remplacer accents courants
    const normalized = volumeEstime
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Supprime les accents

    const mapping: Record<string, number> = {
      // Nouvelles catégories resserrées avec nouveaux noms
      'tres-petit': 12,
      'trespetit': 12,
      'très-petit': 12,
      'moyen-1': 20,
      'moyen1': 20, // Sans tiret
      'petit': 20, // Alias pour compatibilité
      'moyen-2': 30,
      'moyen2': 30, // Sans tiret
      'petit-moyen': 30, // Alias pour compatibilité
      'petitmoyen': 30,
      'moyen-intermediaire': 42,
      'moyenintermediaire': 42, // Sans tiret
      'moyen': 42, // Alias pour compatibilité
      'moyen-grand': 60,
      'moyengrand': 60,
      'grand': 85,
      'tres-grand': 120,
      'tresgrand': 120, // Sans tiret
      'très-grand': 120,
      'extra-grand': 120, // Alias possible
      'extragrand': 120,
    };

    return mapping[normalized];
  }

  /**
   * Convertit l'enum elevator ('no'|'small'|'medium'|'large') en boolean
   *
   * Mapping:
   * - 'no' → false
   * - 'small' | 'medium' | 'large' → true
   */
  private static convertElevatorEnumToBoolean(elevator?: string): boolean | undefined {
    if (!elevator || typeof elevator !== 'string') return undefined;

    const lower = elevator.toLowerCase().trim();
    if (lower === 'no') return false;
    if (['small', 'medium', 'large'].includes(lower)) return true;

    return undefined;
  }

  /**
   * Convertit l'enum elevator ('no'|'small'|'medium'|'large') en ElevatorSize
   *
   * Mapping:
   * - 'no' → undefined (pas d'ascenseur)
   * - 'small' → 'SMALL'
   * - 'medium' → 'STANDARD'
   * - 'large' → 'LARGE'
   */
  private static convertElevatorEnumToSize(elevator?: string): 'SMALL' | 'STANDARD' | 'LARGE' | undefined {
    if (!elevator || typeof elevator !== 'string') return undefined;

    const lower = elevator.toLowerCase().trim();
    const mapping: Record<string, 'SMALL' | 'STANDARD' | 'LARGE'> = {
      'small': 'SMALL',
      'medium': 'STANDARD',
      'large': 'LARGE'
    };

    return mapping[lower];
  }

  /**
   * Convertit la flexibilité depuis le formulaire vers QuoteContext
   *
   * Mapping depuis le formulaire:
   * - "exacte" → 'NONE'
   * - "semaine" → 'PLUS_MINUS_3'
   * - "mois" → 'PLUS_MINUS_7'
   * - "flexible" → 'PLUS_MINUS_7'
   */
  private static convertFlexibilityFromForm(flexibility?: string): 'NONE' | 'PLUS_MINUS_3' | 'PLUS_MINUS_7' | undefined {
    if (!flexibility || typeof flexibility !== 'string') return undefined;

    const lower = flexibility.toLowerCase().trim();
    const mapping: Record<string, 'NONE' | 'PLUS_MINUS_3' | 'PLUS_MINUS_7'> = {
      'exacte': 'NONE',
      'semaine': 'PLUS_MINUS_3',
      'mois': 'PLUS_MINUS_7',
      'flexible': 'PLUS_MINUS_7'
    };

    return mapping[lower];
  }

  // ============================================================================
  // MÉTHODES D'ENRICHISSEMENT AUTOMATIQUE
  // ============================================================================

  /**
   * Estime la distance de portage basée sur étage + ascenseur
   *
   * LOGIQUE :
   * - RDC (floor = 0) : 0 m
   * - Avec ascenseur : 5 m (distance minimale depuis l'ascenseur)
   * - Sans ascenseur :
   *   - 1-2 étages : 10 m
   *   - 3-4 étages : 20 m
   *   - 5+ étages : 30 m
   *
   * @param params Paramètres (floor, hasElevator)
   * @returns Distance estimée en mètres, ou undefined si impossible à estimer
   */
  private static estimateCarryDistance(params: {
    floor?: number;
    hasElevator?: boolean;
  }): number | undefined {
    const { floor, hasElevator } = params;

    // RDC : pas de portage
    if (!floor || floor === 0) {
      return 0;
    }

    // Avec ascenseur : distance minimale depuis l'ascenseur
    if (hasElevator === true) {
      return 5;
    }

    // Sans ascenseur : augmente avec l'étage
    if (floor <= 2) {
      return 10;
    }
    if (floor <= 4) {
      return 20;
    }
    // 5+ étages
    return 30;
  }

  /**
   * Calcule la confiance du volume estimé
   *
   * LOGIQUE :
   * - VIDEO : HIGH (analyse IA précise)
   * - LIST : MEDIUM (liste d'objets analysée)
   * - FORM : Vérifie cohérence entre surface et volume estimé
   *   - Si cohérent (ratio 0.7-1.3) : MEDIUM
   *   - Sinon : LOW
   *
   * @param params Paramètres (method, housingType, surface, estimatedVolume)
   * @returns Confiance calculée
   */
  private static calculateVolumeConfidence(params: {
    method?: 'FORM' | 'LIST' | 'VIDEO';
    housingType?: string;
    surface?: number;
    estimatedVolume?: number;
  }): 'LOW' | 'MEDIUM' | 'HIGH' | undefined {
    const { method, housingType, surface, estimatedVolume } = params;

    // Si pas de méthode, impossible de calculer
    if (!method) {
      return undefined;
    }

    // VIDEO = haute confiance (analyse IA précise)
    if (method === 'VIDEO') {
      return 'HIGH';
    }

    // LIST = confiance moyenne (liste d'objets analysée)
    if (method === 'LIST') {
      return 'MEDIUM';
    }

    // FORM = vérifier cohérence entre surface et volume estimé
    if (method === 'FORM' && surface && estimatedVolume && surface > 0 && estimatedVolume > 0) {
      const expectedVolume = this.estimateVolumeFromSurface(surface, housingType);
      if (expectedVolume > 0) {
        const ratio = estimatedVolume / expectedVolume;

        // Si cohérent (ratio entre 0.7 et 1.3)
        if (ratio >= 0.7 && ratio <= 1.3) {
          return 'MEDIUM';
        }
      }
    }

    // Par défaut : confiance faible
    return 'LOW';
  }

  /**
   * Estime le volume depuis la surface
   *
   * Formule approximative : surface × hauteur sous plafond × taux de remplissage
   *
   * @param surface Surface en m²
   * @param housingType Type de logement (pour ajustement éventuel)
   * @returns Volume estimé en m³
   */
  private static estimateVolumeFromSurface(
    surface: number,
    housingType?: string
  ): number {
    // Formule approximative : surface × hauteur sous plafond × taux de remplissage
    const height = 2.5; // m (hauteur sous plafond standard)
    const fillRate = 0.3; // 30% de remplissage moyen (meubles, objets)

    // Ajustement selon le type de logement (optionnel)
    let typeFactor = 1.0;
    if (housingType === 'STUDIO') {
      typeFactor = 0.9; // Studio : remplissage légèrement plus faible
    } else if (housingType === 'HOUSE') {
      typeFactor = 1.1; // Maison : remplissage légèrement plus élevé
    }

    return surface * height * fillRate * typeFactor;
  }
}

