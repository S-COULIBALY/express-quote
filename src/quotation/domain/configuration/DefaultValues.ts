/**
 * Valeurs par défaut centralisées pour toutes les configurations
 * 
 * ⚠️ IMPORTANT : Ces valeurs sont la source unique de vérité.
 * Elles sont utilisées par :
 * - DefaultConfigurations.ts (pour initialiser la BDD)
 * - MovingQuoteCalculator.ts (comme fallback en cas de panne)
 * - Tests unitaires (pour des valeurs prévisibles)
 * 
 * 🔧 Pour modifier une valeur :
 * 1. Changez-la ICI uniquement
 * 2. Les autres fichiers l'utiliseront automatiquement
 * 3. Cohérence garantie dans tous les contextes
 */
export class DefaultValues {
  
  // ============================================================================
  // MOVING - Configurations de déménagement
  // ============================================================================
  
  /** Prix de base par m³ pour les déménagements */
  static readonly MOVING_BASE_PRICE_PER_M3 = 10;
  
  /** Prix par kilomètre pour les déménagements */
  static readonly MOVING_DISTANCE_PRICE_PER_KM = 2;
  
  /** Consommation de carburant pour 100km (en litres) */
  static readonly FUEL_CONSUMPTION_PER_100KM = 25;
  
  /** Prix du carburant par litre (en euros) */
  static readonly FUEL_PRICE_PER_LITER = 1.8;
  
  /** Coût des péages par kilomètre (en euros) */
  static readonly TOLL_COST_PER_KM = 0.15;
  
  /** Ratio de distance sur autoroute (0.7 = 70%) */
  static readonly HIGHWAY_RATIO = 0.7;
  
  // ============================================================================
  // PACK - Configurations de forfaits
  // ============================================================================
  
  /** Prix par ouvrier par jour pour les forfaits */
  static readonly PACK_WORKER_PRICE = 120;
  
  /** Distance incluse dans le forfait de base (en km) */
  static readonly PACK_INCLUDED_DISTANCE = 20;
  
  /** Prix par kilomètre supplémentaire pour les forfaits */
  static readonly PACK_EXTRA_KM_PRICE = 1.5;
  
  /** Taux de réduction pour les jours supplémentaires */
  static readonly PACK_EXTRA_DAY_DISCOUNT_RATE = 0.8;
  
  /** Taux de réduction pour ouvriers supplémentaires (1 jour) */
  static readonly PACK_WORKER_DISCOUNT_RATE_1_DAY = 0.05;
  
  /** Taux de réduction pour ouvriers supplémentaires (multi-jours) */
  static readonly PACK_WORKER_DISCOUNT_RATE_MULTI_DAYS = 0.10;
  
  /** Prix du monte-charge pour les forfaits */
  static readonly PACK_LIFT_PRICE = 200;
  
  // ============================================================================
  // SERVICE - Configurations de services à l'heure
  // ============================================================================
  
  /** Prix par ouvrier par heure pour les services */
  static readonly SERVICE_WORKER_PRICE_PER_HOUR = 35;
  
  /** Taux de réduction pour services courts */
  static readonly SERVICE_WORKER_DISCOUNT_RATE_SHORT = 0.1;
  
  /** Taux de réduction pour services longs */
  static readonly SERVICE_WORKER_DISCOUNT_RATE_LONG = 0.15;
  
  /** Taux pour les heures supplémentaires (0.9 = 90% du tarif normal) */
  static readonly SERVICE_EXTRA_HOUR_RATE = 0.9;
  
  // ============================================================================
  // BUSINESS_RULES - Règles métier par défaut
  // ============================================================================
  
  /** Nombre de jours pour bénéficier de la réduction anticipée (déménagement) */
  static readonly MOVING_EARLY_BOOKING_DAYS = 30;
  
  /** Pourcentage de réduction pour réservation anticipée (déménagement) */
  static readonly MOVING_EARLY_BOOKING_DISCOUNT = 10;
  
  /** Supplément week-end pour les déménagements (en %) */
  static readonly MOVING_WEEKEND_SURCHARGE = 15;
  
  /** Nombre de jours pour bénéficier de la réduction anticipée (service) */
  static readonly SERVICE_EARLY_BOOKING_DAYS = 14;
  
  /** Pourcentage de réduction pour réservation anticipée (service) */
  static readonly SERVICE_EARLY_BOOKING_DISCOUNT = 5;
  
  /** Supplément week-end pour les services (en %) */
  static readonly SERVICE_WEEKEND_SURCHARGE = 10;
  
  /** Nombre de jours pour bénéficier de la réduction anticipée (pack) */
  static readonly PACK_EARLY_BOOKING_DAYS = 14;
  
  /** Pourcentage de réduction pour réservation anticipée (pack) */
  static readonly PACK_EARLY_BOOKING_DISCOUNT = 5;
  
  /** Supplément week-end pour les packs (en %) */
  static readonly PACK_WEEKEND_SURCHARGE = 10;
  
    /** Supplément pour réservation urgente de pack (en %) */
  static readonly PACK_URGENT_BOOKING_SURCHARGE = 20;

  // ============================================================================
  // BOOKING & PLANNING - Règles de réservation et planification
  // ============================================================================
  
  /** Heures minimales de réservation à l'avance */
  static readonly MIN_ADVANCE_BOOKING_HOURS = 24;
  
  /** Jours maximum de réservation à l'avance */
  static readonly MAX_BOOKING_DAYS_AHEAD = 90;
  
  /** Heures avant annulation sans frais */
  static readonly CANCELLATION_DEADLINE_HOURS = 48;
  
  /** Heures pour remboursement complet */
  static readonly FULL_REFUND_HOURS = 72;
  
  /** Pourcentage de remboursement partiel */
  static readonly PARTIAL_REFUND_PERCENTAGE = 50;
  
  /** Durée minimale de service (en heures) */
  static readonly MIN_SERVICE_DURATION_HOURS = 1;
  
  /** Durée maximale de service (en heures) */
  static readonly MAX_SERVICE_DURATION_HOURS = 8;
  
  /** Intervalle minimum entre réservations (en heures) */
  static readonly BUFFER_BETWEEN_BOOKINGS_HOURS = 1;

  // ============================================================================
  // FALLBACK & GENERAL - Valeurs pour les calculs de fallback et générales
  // ============================================================================
  
  /** Taux de TVA (20%) */
  static readonly VAT_RATE = 0.20;
  
  /** Prix par défaut pour déménagement en mode fallback */
  static readonly FALLBACK_DEFAULT_MOVING_PRICE = 400;
  
  /** Prix par défaut pour pack en mode fallback */
  static readonly FALLBACK_DEFAULT_PACK_PRICE = 300;
  
  /** Prix par défaut pour service en mode fallback */
  static readonly FALLBACK_DEFAULT_SERVICE_PRICE = 200;
  
  // Options pour déménagements (mode fallback)
  static readonly MOVING_OPTION_PACKAGING = 150;
  static readonly MOVING_OPTION_FURNITURE = 100;
  static readonly MOVING_OPTION_FRAGILE = 80;
  static readonly MOVING_OPTION_STORAGE = 200;
  static readonly MOVING_OPTION_DISASSEMBLY = 120;
  static readonly MOVING_OPTION_UNPACKING = 100;
  static readonly MOVING_OPTION_SUPPLIES = 50;
  static readonly MOVING_OPTION_FRAGILE_ITEMS = 80;

  // ============================================================================
  // ASSURANCE - Prix d'assurance centralisés
  // ============================================================================
  
  /** Prix de l'assurance complémentaire HT (30€) */
  static readonly INSURANCE_PRICE_HT = 30;
  
  /** Prix de l'assurance complémentaire TTC (36€) */
  static readonly INSURANCE_PRICE_TTC = 36;
  
  // ============================================================================
  // CLEANING - Valeurs pour le nettoyage (migrées depuis constants.ts)
  // ============================================================================
  
  /** Prix de base par m² pour le nettoyage */
  static readonly CLEANING_BASE_PRICE_PER_M2 = 2;
  
  /** Prix supplémentaire par pièce */
  static readonly CLEANING_ROOM_EXTRA_PRICE = 10;
  
  /** Multiplicateur pour balcon (+10%) */
  static readonly CLEANING_BALCONY_MULTIPLIER = 1.1;
  
  /** Multiplicateur pour animaux (+15%) */
  static readonly CLEANING_PETS_MULTIPLIER = 1.15;
  
  /** Réduction hebdomadaire (-20%) */
  static readonly CLEANING_WEEKLY_DISCOUNT = 0.2;
  
  /** Réduction bi-hebdomadaire (-15%) */
  static readonly CLEANING_BIWEEKLY_DISCOUNT = 0.15;
  
  /** Réduction mensuelle (-10%) */
  static readonly CLEANING_MONTHLY_DISCOUNT = 0.1;
  
  // ============================================================================
  // FLOOR & LIFT - Valeurs pour étages et monte-meuble (migrées depuis constants.ts)
  // ============================================================================
  
  /** Supplément par étage sans ascenseur */
  static readonly FLOOR_SURCHARGE_AMOUNT = 25;
  
  /** Seuil d'étages pour surcoût */
  static readonly FLOOR_SURCHARGE_THRESHOLD = 1;
  
  /** Seuil pour monte-meuble obligatoire */
  static readonly FURNITURE_LIFT_REQUIRED_THRESHOLD = 3;
  
  /** Seuil pour avertissement monte-meuble */
  static readonly FURNITURE_LIFT_WARNING_THRESHOLD = 2;
  
  /** Exception de volume pour monte-meuble */
  static readonly SMALL_VOLUME_EXCEPTION = 10;
  
  /** Surcoût pour étages très élevés (+15%) */
  static readonly HIGH_FLOOR_SURCHARGE_PERCENT = 15;
  
  // ============================================================================
  // MÉTHODES UTILITAIRES
  // ============================================================================
  
  /**
   * Retourne toutes les valeurs sous forme d'objet pour debug/logging
   */
  static getAllValues(): Record<string, number> {
    return {
      // MOVING
      MOVING_BASE_PRICE_PER_M3: this.MOVING_BASE_PRICE_PER_M3,
      MOVING_DISTANCE_PRICE_PER_KM: this.MOVING_DISTANCE_PRICE_PER_KM,
      FUEL_CONSUMPTION_PER_100KM: this.FUEL_CONSUMPTION_PER_100KM,
      FUEL_PRICE_PER_LITER: this.FUEL_PRICE_PER_LITER,
      TOLL_COST_PER_KM: this.TOLL_COST_PER_KM,
      HIGHWAY_RATIO: this.HIGHWAY_RATIO,
      
      // PACK
      PACK_WORKER_PRICE: this.PACK_WORKER_PRICE,
      PACK_INCLUDED_DISTANCE: this.PACK_INCLUDED_DISTANCE,
      PACK_EXTRA_KM_PRICE: this.PACK_EXTRA_KM_PRICE,
      PACK_EXTRA_DAY_DISCOUNT_RATE: this.PACK_EXTRA_DAY_DISCOUNT_RATE,
      PACK_WORKER_DISCOUNT_RATE_1_DAY: this.PACK_WORKER_DISCOUNT_RATE_1_DAY,
      PACK_WORKER_DISCOUNT_RATE_MULTI_DAYS: this.PACK_WORKER_DISCOUNT_RATE_MULTI_DAYS,
      PACK_LIFT_PRICE: this.PACK_LIFT_PRICE,
      
      // SERVICE
      SERVICE_WORKER_PRICE_PER_HOUR: this.SERVICE_WORKER_PRICE_PER_HOUR,
      SERVICE_WORKER_DISCOUNT_RATE_SHORT: this.SERVICE_WORKER_DISCOUNT_RATE_SHORT,
      SERVICE_WORKER_DISCOUNT_RATE_LONG: this.SERVICE_WORKER_DISCOUNT_RATE_LONG,
      SERVICE_EXTRA_HOUR_RATE: this.SERVICE_EXTRA_HOUR_RATE,
      
      // BUSINESS_RULES
      MOVING_EARLY_BOOKING_DAYS: this.MOVING_EARLY_BOOKING_DAYS,
      MOVING_EARLY_BOOKING_DISCOUNT: this.MOVING_EARLY_BOOKING_DISCOUNT,
      MOVING_WEEKEND_SURCHARGE: this.MOVING_WEEKEND_SURCHARGE,
      SERVICE_EARLY_BOOKING_DAYS: this.SERVICE_EARLY_BOOKING_DAYS,
      SERVICE_EARLY_BOOKING_DISCOUNT: this.SERVICE_EARLY_BOOKING_DISCOUNT,
      SERVICE_WEEKEND_SURCHARGE: this.SERVICE_WEEKEND_SURCHARGE,
      PACK_EARLY_BOOKING_DAYS: this.PACK_EARLY_BOOKING_DAYS,
      PACK_EARLY_BOOKING_DISCOUNT: this.PACK_EARLY_BOOKING_DISCOUNT,
      PACK_WEEKEND_SURCHARGE: this.PACK_WEEKEND_SURCHARGE,
      PACK_URGENT_BOOKING_SURCHARGE: this.PACK_URGENT_BOOKING_SURCHARGE,
      
      // FALLBACK & GENERAL
      VAT_RATE: this.VAT_RATE,
      FALLBACK_DEFAULT_MOVING_PRICE: this.FALLBACK_DEFAULT_MOVING_PRICE,
      FALLBACK_DEFAULT_PACK_PRICE: this.FALLBACK_DEFAULT_PACK_PRICE,
      FALLBACK_DEFAULT_SERVICE_PRICE: this.FALLBACK_DEFAULT_SERVICE_PRICE,
      
      // MOVING OPTIONS
      MOVING_OPTION_PACKAGING: this.MOVING_OPTION_PACKAGING,
      MOVING_OPTION_FURNITURE: this.MOVING_OPTION_FURNITURE,
      MOVING_OPTION_FRAGILE: this.MOVING_OPTION_FRAGILE,
      MOVING_OPTION_STORAGE: this.MOVING_OPTION_STORAGE,
      MOVING_OPTION_DISASSEMBLY: this.MOVING_OPTION_DISASSEMBLY,
      MOVING_OPTION_UNPACKING: this.MOVING_OPTION_UNPACKING,
      MOVING_OPTION_SUPPLIES: this.MOVING_OPTION_SUPPLIES,
      MOVING_OPTION_FRAGILE_ITEMS: this.MOVING_OPTION_FRAGILE_ITEMS,
      
      // CLEANING
      CLEANING_BASE_PRICE_PER_M2: this.CLEANING_BASE_PRICE_PER_M2,
      CLEANING_ROOM_EXTRA_PRICE: this.CLEANING_ROOM_EXTRA_PRICE,
      CLEANING_BALCONY_MULTIPLIER: this.CLEANING_BALCONY_MULTIPLIER,
      CLEANING_PETS_MULTIPLIER: this.CLEANING_PETS_MULTIPLIER,
      CLEANING_WEEKLY_DISCOUNT: this.CLEANING_WEEKLY_DISCOUNT,
      CLEANING_BIWEEKLY_DISCOUNT: this.CLEANING_BIWEEKLY_DISCOUNT,
      CLEANING_MONTHLY_DISCOUNT: this.CLEANING_MONTHLY_DISCOUNT,
      
      // FLOOR & LIFT
      FLOOR_SURCHARGE_AMOUNT: this.FLOOR_SURCHARGE_AMOUNT,
      FLOOR_SURCHARGE_THRESHOLD: this.FLOOR_SURCHARGE_THRESHOLD,
      FURNITURE_LIFT_REQUIRED_THRESHOLD: this.FURNITURE_LIFT_REQUIRED_THRESHOLD,
      FURNITURE_LIFT_WARNING_THRESHOLD: this.FURNITURE_LIFT_WARNING_THRESHOLD,
      SMALL_VOLUME_EXCEPTION: this.SMALL_VOLUME_EXCEPTION,
      HIGH_FLOOR_SURCHARGE_PERCENT: this.HIGH_FLOOR_SURCHARGE_PERCENT
    };
  }
  
  /**
   * Valide que toutes les valeurs sont cohérentes
   */
  static validateValues(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Vérifications de cohérence
    if (this.MOVING_BASE_PRICE_PER_M3 <= 0) {
      errors.push('MOVING_BASE_PRICE_PER_M3 doit être positif');
    }
    
    if (this.FUEL_PRICE_PER_LITER <= 0) {
      errors.push('FUEL_PRICE_PER_LITER doit être positif');
    }
    
    if (this.HIGHWAY_RATIO < 0 || this.HIGHWAY_RATIO > 1) {
      errors.push('HIGHWAY_RATIO doit être entre 0 et 1');
    }
    
    if (this.PACK_INCLUDED_DISTANCE < 0) {
      errors.push('PACK_INCLUDED_DISTANCE ne peut pas être négatif');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 