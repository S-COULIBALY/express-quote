/**
 * ============================================================================
 * TYPES DE SERVICES MÉTIER - Classification des activités
 * ============================================================================
 *
 * 🎯 OBJECTIF :
 * Définir les différents types de services métier pour permettre une
 * tarification et une gestion différenciée par activité.
 *
 * 📋 TYPES DE SERVICES :
 *
 * ✅ DÉMÉNAGEMENT : Services de déménagement complet
 * ✅ NETTOYAGE : Services de nettoyage (avant/après déménagement)
 * ✅ LIVRAISON : Services de livraison et transport de colis
 * ✅ TRANSPORT : Services de transport de marchandises
 * ✅ EMBALLAGE : Services d'emballage et conditionnement
 * ✅ STOCKAGE : Services de stockage temporaire
 */
export enum BusinessType {
  DÉMÉNAGEMENT = "DÉMÉNAGEMENT", // Services de déménagement complet
  NETTOYAGE = "NETTOYAGE", // Services de nettoyage
  LIVRAISON = "LIVRAISON", // Services de livraison
  TRANSPORT = "TRANSPORT", // Services de transport
  EMBALLAGE = "EMBALLAGE", // Services d'emballage
  STOCKAGE = "STOCKAGE", // Services de stockage
}

/**
 * ============================================================================
 * CATÉGORIES DE CONFIGURATION - Organisation des paramètres système
 * ============================================================================
 *
 * 🎯 OBJECTIF :
 * Classification des configurations par domaine métier pour une organisation
 * claire et une maintenance facilitée.
 *
 * 📋 CATÉGORIES ACTIVES :
 *
 * ✅ PRICING : Tarifs et prix de base
 * ✅ BUSINESS_RULES : Règles métier (actuellement commentées)
 * ✅ LIMITS : Limites techniques et contraintes
 * ✅ SERVICE_PARAMS : Paramètres des services
 * ✅ SYSTEM_VALUES : Valeurs système (TVA, devise, etc.)
 * ✅ INSURANCE_CONFIG : Configuration des assurances
 * ✅ TECHNICAL_LIMITS : Limites techniques
 * ✅ BUSINESS_TYPE_PRICING : Tarification par type de service métier
 *
 * 📝 NOTES :
 * - Les catégories commentées sont réservées pour futures implémentations
 * - Seules les catégories utilisées par les constantes actives sont conservées
 * - L'organisation suit la structure de DefaultValues.ts
 */
export enum ConfigurationCategory {
  // Catégories actives - Utilisées par les constantes de DefaultValues.ts
  PRICING = "PRICING", // Tarifs de base (UNIT_PRICE_PER_M3, etc.)
  SYSTEM_VALUES = "SYSTEM_VALUES", // Valeurs système (VAT_RATE, DEFAULT_CURRENCY)
  INSURANCE_CONFIG = "INSURANCE_CONFIG", // Configuration assurance (INSURANCE_PRICE_HT/TTC)
  TECHNICAL_LIMITS = "TECHNICAL_LIMITS", // Limites techniques (MIN_VOLUME, MAX_VOLUME)
  SERVICE_PARAMS = "SERVICE_PARAMS", // Paramètres des services
  BUSINESS_TYPE_PRICING = "BUSINESS_TYPE_PRICING", // Tarification par type de service métier

  // Catégories réservées pour futures implémentations
  BUSINESS_RULES = "BUSINESS_RULES", // Règles métier (commentées dans DefaultValues)
  LIMITS = "LIMITS", // Limites générales
  GEOGRAPHIC_CONFIG = "GEOGRAPHIC_CONFIG", // Configuration géographique
}

/**
 * ✅ CLÉS DE CONFIGURATION PRIX - Alignement avec DefaultValues.ts (APRÈS NETTOYAGE)
 *
 * 🎯 OBJECTIF :
 * Utilisation des mêmes noms que les propriétés de DefaultValues.ts
 * pour une cohérence parfaite dans tout le projet.
 *
 * ⚠️ MIGRATION EFFECTUÉE :
 * - Variables génériques dupliquées SUPPRIMÉES (UNIT_PRICE_PER_M3, WORKER_PRICE, etc.)
 * - Variables spécifiques par service CONSERVÉES (MOVING_*, CLEANING_*, etc.)
 * - Variables vraiment partagées CONSERVÉES (VAT_RATE, FUEL_PRICE_PER_LITER, etc.)
 *
 * ✅ CONSTANTES PARTAGÉES (tous services) :
 * - UNIT_PRICE_PER_KM, INCLUDED_DISTANCE
 * - FUEL_CONSUMPTION_PER_100KM, FUEL_PRICE_PER_LITER, TOLL_COST_PER_KM, HIGHWAY_RATIO
 * - SERVICE_WORKER_PRICE_PER_HOUR (nouveau - remplace WORKER_HOUR_RATE)
 * - EXTRA_DAY_DISCOUNT_RATE, EXTRA_WORKER_DISCOUNT_RATE
 */
export enum PricingConfigKey {
  // ========================================
  // CONSTANTES PARTAGÉES (tous services)
  // ========================================

  // Distance & Prix par km
  UNIT_PRICE_PER_KM = "UNIT_PRICE_PER_KM", // → DefaultValues.UNIT_PRICE_PER_KM (2€/km)
  INCLUDED_DISTANCE = "INCLUDED_DISTANCE", // → DefaultValues.INCLUDED_DISTANCE (20km inclus)

  // Taux horaire générique (fallback)
  SERVICE_WORKER_PRICE_PER_HOUR = "SERVICE_WORKER_PRICE_PER_HOUR", // → DefaultValues.SERVICE_WORKER_PRICE_PER_HOUR (35€/h - nouveau)

  // Fiscalité
  VAT_RATE = "VAT_RATE", // → DefaultValues.VAT_RATE (0.20)
  DEPOSIT_PERCENTAGE = "DEPOSIT_PERCENTAGE", // → DefaultValues.DEPOSIT_PERCENTAGE (0.30)

  // Transport partagé
  FUEL_CONSUMPTION_PER_100KM = "FUEL_CONSUMPTION_PER_100KM", // → DefaultValues.FUEL_CONSUMPTION_PER_100KM
  FUEL_PRICE_PER_LITER = "FUEL_PRICE_PER_LITER", // → DefaultValues.FUEL_PRICE_PER_LITER
  TOLL_COST_PER_KM = "TOLL_COST_PER_KM", // → DefaultValues.TOLL_COST_PER_KM
  HIGHWAY_RATIO = "HIGHWAY_RATIO", // → DefaultValues.HIGHWAY_RATIO

  // Multiplicateurs & Réductions
  HOURLY_RATE_MULTIPLIER = "HOURLY_RATE_MULTIPLIER", // → DefaultValues.HOURLY_RATE_MULTIPLIER
  DAILY_RATE_MULTIPLIER = "DAILY_RATE_MULTIPLIER", // → DefaultValues.DAILY_RATE_MULTIPLIER
  WEEKLY_RATE_MULTIPLIER = "WEEKLY_RATE_MULTIPLIER", // → DefaultValues.WEEKLY_RATE_MULTIPLIER
  EXTRA_DAY_DISCOUNT_RATE = "EXTRA_DAY_DISCOUNT_RATE", // → DefaultValues.EXTRA_DAY_DISCOUNT_RATE
  EXTRA_WORKER_DISCOUNT_RATE = "EXTRA_WORKER_DISCOUNT_RATE", // → DefaultValues.EXTRA_WORKER_DISCOUNT_RATE
  VOLUME_DISCOUNT_THRESHOLD_M3 = "VOLUME_DISCOUNT_THRESHOLD_M3", // → DefaultValues.VOLUME_DISCOUNT_THRESHOLD_M3
  VOLUME_DISCOUNT_RATE = "VOLUME_DISCOUNT_RATE", // → DefaultValues.VOLUME_DISCOUNT_RATE
  FREE_DELIVERY_DISTANCE_KM = "FREE_DELIVERY_DISTANCE_KM", // → DefaultValues.FREE_DELIVERY_DISTANCE_KM

  // Équipement & Matériel
  EQUIPMENT_RENTAL_DAILY = "EQUIPMENT_RENTAL_DAILY", // → DefaultValues.EQUIPMENT_RENTAL_DAILY
  MATERIAL_COST_PER_M3 = "MATERIAL_COST_PER_M3", // → DefaultValues.MATERIAL_COST_PER_M3
  PROTECTIVE_EQUIPMENT_COST = "PROTECTIVE_EQUIPMENT_COST", // → DefaultValues.PROTECTIVE_EQUIPMENT_COST

  // Opérationnel
  MAX_WORKERS_PER_VEHICLE = "MAX_WORKERS_PER_VEHICLE", // → DefaultValues.MAX_WORKERS_PER_VEHICLE
  MAX_VOLUME_PER_VEHICLE_M3 = "MAX_VOLUME_PER_VEHICLE_M3", // → DefaultValues.MAX_VOLUME_PER_VEHICLE_M3
  STANDARD_SERVICE_DURATION_HOURS = "STANDARD_SERVICE_DURATION_HOURS", // → DefaultValues.STANDARD_SERVICE_DURATION_HOURS
  OVERTIME_RATE_MULTIPLIER = "OVERTIME_RATE_MULTIPLIER", // → DefaultValues.OVERTIME_RATE_MULTIPLIER
  HOURS_PER_DAY = "HOURS_PER_DAY", // → DefaultValues.HOURS_PER_DAY

  // Assurance
  INSURANCE_PRICE_HT = "INSURANCE_PRICE_HT", // → DefaultValues.INSURANCE_PRICE_HT
  INSURANCE_PRICE_TTC = "INSURANCE_PRICE_TTC", // → DefaultValues.INSURANCE_PRICE_TTC
  INSURANCE_COVERAGE_MINIMUM = "INSURANCE_COVERAGE_MINIMUM", // → DefaultValues.INSURANCE_COVERAGE_MINIMUM

  // Qualité & Sécurité
  QUALITY_GUARANTEE_DAYS = "QUALITY_GUARANTEE_DAYS", // → DefaultValues.QUALITY_GUARANTEE_DAYS
  SAFETY_EQUIPMENT_REQUIRED = "SAFETY_EQUIPMENT_REQUIRED", // → DefaultValues.SAFETY_EQUIPMENT_REQUIRED

  // Professionnels
  PROFESSIONAL_DEFAULT_SEARCH_RADIUS_KM = "PROFESSIONAL_DEFAULT_SEARCH_RADIUS_KM", // → DefaultValues.PROFESSIONAL_DEFAULT_SEARCH_RADIUS_KM

  // Auto-détection
  FURNITURE_LIFT_FLOOR_THRESHOLD = "FURNITURE_LIFT_FLOOR_THRESHOLD", // → DefaultValues.FURNITURE_LIFT_FLOOR_THRESHOLD
  FURNITURE_LIFT_SURCHARGE = "FURNITURE_LIFT_SURCHARGE", // → DefaultValues.FURNITURE_LIFT_SURCHARGE
  LONG_CARRYING_DISTANCE_THRESHOLD = "LONG_CARRYING_DISTANCE_THRESHOLD", // → DefaultValues.LONG_CARRYING_DISTANCE_THRESHOLD
  LONG_CARRYING_DISTANCE_SURCHARGE = "LONG_CARRYING_DISTANCE_SURCHARGE", // → DefaultValues.LONG_CARRYING_DISTANCE_SURCHARGE
}

/**
 * CLÉS DE CONFIGURATION RÈGLES MÉTIER - Réservées pour futures implémentations
 *
 * 📝 NOTE :
 * Ces clés correspondent aux constantes commentées dans DefaultValues.ts
 * Elles seront réactivées lors de futures implémentations
 */
export enum BusinessRulesConfigKey {
  // Règles de réservation (actuellement commentées dans DefaultValues.ts)
  PACK_EARLY_BOOKING_DAYS = "PACK_EARLY_BOOKING_DAYS",
  PACK_EARLY_BOOKING_DISCOUNT = "PACK_EARLY_BOOKING_DISCOUNT",
  PACK_WEEKEND_SURCHARGE = "PACK_WEEKEND_SURCHARGE",
  PACK_URGENT_BOOKING_SURCHARGE = "PACK_URGENT_BOOKING_SURCHARGE",

  SERVICE_EARLY_BOOKING_DAYS = "SERVICE_EARLY_BOOKING_DAYS",
  SERVICE_EARLY_BOOKING_DISCOUNT = "SERVICE_EARLY_BOOKING_DISCOUNT",
  SERVICE_WEEKEND_SURCHARGE = "SERVICE_WEEKEND_SURCHARGE",

  MOVING_EARLY_BOOKING_DAYS = "MOVING_EARLY_BOOKING_DAYS",
  MOVING_EARLY_BOOKING_DISCOUNT = "MOVING_EARLY_BOOKING_DISCOUNT",
  MOVING_WEEKEND_SURCHARGE = "MOVING_WEEKEND_SURCHARGE",
}

/**
 * ✅ CLÉS DE CONFIGURATION SYSTÈME - Alignement avec DefaultValues.ts (APRÈS NETTOYAGE)
 *
 * ✅ CONSTANTES ACTIVES (noms identiques à DefaultValues.ts) :
 * - VAT_RATE, DEFAULT_CURRENCY, DEPOSIT_PERCENTAGE
 * - MIN_PRICE, MIN_VOLUME, MAX_VOLUME, MIN_SQUARE_METERS
 */
export enum SystemValuesConfigKey {
  VAT_RATE = "VAT_RATE", // → DefaultValues.VAT_RATE
  DEFAULT_CURRENCY = "DEFAULT_CURRENCY", // → DefaultValues.DEFAULT_CURRENCY
  DEPOSIT_PERCENTAGE = "DEPOSIT_PERCENTAGE", // → DefaultValues.DEPOSIT_PERCENTAGE (nouveau)
  MIN_PRICE = "MIN_PRICE", // → DefaultValues.MIN_PRICE
}

export enum TechnicalLimitsConfigKey {
  MIN_VOLUME = "MIN_VOLUME", // → DefaultValues.MIN_VOLUME
  MAX_VOLUME = "MAX_VOLUME", // → DefaultValues.MAX_VOLUME
  MIN_SQUARE_METERS = "MIN_SQUARE_METERS", // → DefaultValues.MIN_SQUARE_METERS
}

export enum InsuranceConfigKey {
  INSURANCE_PRICE_HT = "INSURANCE_PRICE_HT", // → DefaultValues.INSURANCE_PRICE_HT
  INSURANCE_PRICE_TTC = "INSURANCE_PRICE_TTC", // → DefaultValues.INSURANCE_PRICE_TTC
}

export enum GeographicConfigKey {
  PROFESSIONAL_DEFAULT_SEARCH_RADIUS_KM = "PROFESSIONAL_DEFAULT_SEARCH_RADIUS_KM", // → DefaultValues.PROFESSIONAL_DEFAULT_SEARCH_RADIUS_KM
}

export enum ServiceParamsConfigKey {
  AVAILABLE_SERVICE_TYPES = "AVAILABLE_SERVICE_TYPES", // Types de services disponibles
  AVAILABLE_PACK_TYPES = "AVAILABLE_PACK_TYPES", // Types de forfaits disponibles
  WORKING_HOURS_START = "WORKING_HOURS_START", // Heure de début de travail
  WORKING_HOURS_END = "WORKING_HOURS_END", // Heure de fin de travail
  WORKING_DAYS = "WORKING_DAYS", // Jours de travail
  DEFAULT_TRAVEL_SPEED = "DEFAULT_TRAVEL_SPEED", // Vitesse de déplacement par défaut
  WORKER_SETUP_TIME = "WORKER_SETUP_TIME", // Temps de préparation ouvrier

  // VALEURS PAR DÉFAUT PAR SERVICE - Nouvellement ajoutées
  PACKING_DEFAULT_DURATION = "PACKING_DEFAULT_DURATION", // Durée par défaut emballage
  PACKING_DEFAULT_WORKERS = "PACKING_DEFAULT_WORKERS", // Ouvriers par défaut emballage
  CLEANING_DEFAULT_DURATION = "CLEANING_DEFAULT_DURATION", // Durée par défaut nettoyage
  CLEANING_DEFAULT_WORKERS = "CLEANING_DEFAULT_WORKERS", // Ouvriers par défaut nettoyage
  DELIVERY_DEFAULT_DURATION = "DELIVERY_DEFAULT_DURATION", // Durée par défaut livraison
  DELIVERY_DEFAULT_WORKERS = "DELIVERY_DEFAULT_WORKERS", // Ouvriers par défaut livraison
}

/**
 * CLÉS DE CONFIGURATION LIMITES - Nouvellement ajoutées pour adminRules.ts
 */
export enum LimitsConfigKey {
  MIN_BOOKING_HOURS = "MIN_BOOKING_HOURS", // Heures minimales avant réservation
  MAX_BOOKING_DAYS_AHEAD = "MAX_BOOKING_DAYS_AHEAD", // Jours maximum à l'avance
  MIN_WORKERS = "MIN_WORKERS", // Nombre minimum d'ouvriers
  MAX_WORKERS = "MAX_WORKERS", // Nombre maximum d'ouvriers
}

/**
 * CLÉS DE CONFIGURATION PAR TYPE DE SERVICE MÉTIER
 *
 * 🎯 OBJECTIF :
 * Permettre une tarification différenciée selon le type de service métier.
 * Chaque type de service peut avoir ses propres tarifs et paramètres.
 *
 * 📋 TYPES DE SERVICES SUPPORTÉS :
 * - DÉMÉNAGEMENT : Services de déménagement complet
 * - NETTOYAGE : Services de nettoyage
 * - LIVRAISON : Services de livraison
 * - TRANSPORT : Services de transport
 * - EMBALLAGE : Services d'emballage
 * - STOCKAGE : Services de stockage
 */
export enum BusinessTypePricingConfigKey {
  // TARIFS DÉMÉNAGEMENT
  MOVING_BASE_PRICE_PER_M3 = "MOVING_BASE_PRICE_PER_M3",
  MOVING_WORKER_PRICE = "MOVING_WORKER_PRICE",
  MOVING_WORKER_HOUR_RATE = "MOVING_WORKER_HOUR_RATE",
  MOVING_EXTRA_HOUR_RATE = "MOVING_EXTRA_HOUR_RATE",
  MOVING_LIFT_PRICE = "MOVING_LIFT_PRICE",
  MOVING_VEHICLE_FLAT_FEE = "MOVING_VEHICLE_FLAT_FEE",

  // TARIFS DÉMÉNAGEMENT SPÉCIALISÉS - Nouvellement ajoutés
  MOVING_WORKERS_PER_M3_THRESHOLD = "MOVING_WORKERS_PER_M3_THRESHOLD",
  MOVING_BOXES_PER_M3 = "MOVING_BOXES_PER_M3",
  MOVING_BOX_PRICE = "MOVING_BOX_PRICE",
  MOVING_PREMIUM_WORKER_PRICE_PER_HOUR = "MOVING_PREMIUM_WORKER_PRICE_PER_HOUR",
  MOVING_PREMIUM_SUPPLIES_MULTIPLIER = "MOVING_PREMIUM_SUPPLIES_MULTIPLIER",
  HOURS_PER_DAY = "HOURS_PER_DAY",

  // TARIFS NETTOYAGE
  CLEANING_PRICE_PER_M2 = "CLEANING_PRICE_PER_M2",
  CLEANING_WORKER_PRICE = "CLEANING_WORKER_PRICE",
  CLEANING_WORKER_HOUR_RATE = "CLEANING_WORKER_HOUR_RATE",
  CLEANING_EXTRA_HOUR_RATE = "CLEANING_EXTRA_HOUR_RATE",
  CLEANING_MINIMUM_PRICE = "CLEANING_MINIMUM_PRICE",

  // TARIFS NETTOYAGE SPÉCIALISÉS - Nouvellement ajoutés
  CLEANING_EXTRA_ROOM_MULTIPLIER = "CLEANING_EXTRA_ROOM_MULTIPLIER",
  CLEANING_M2_PER_HOUR = "CLEANING_M2_PER_HOUR",
  CLEANING_SURFACE_THRESHOLD_1 = "CLEANING_SURFACE_THRESHOLD_1",
  CLEANING_SURFACE_THRESHOLD_2 = "CLEANING_SURFACE_THRESHOLD_2",

  // TARIFS LIVRAISON
  DELIVERY_BASE_PRICE = "DELIVERY_BASE_PRICE",
  DELIVERY_PRICE_PER_KM = "DELIVERY_PRICE_PER_KM",
  DELIVERY_WORKER_HOUR_RATE = "DELIVERY_WORKER_HOUR_RATE",
  DELIVERY_EXTRA_HOUR_RATE = "DELIVERY_EXTRA_HOUR_RATE",
  DELIVERY_WEIGHT_SURCHARGE = "DELIVERY_WEIGHT_SURCHARGE",

  // TARIFS LIVRAISON SPÉCIALISÉS - Nouvellement ajoutés
  DELIVERY_VOLUME_PRICE_PER_M3 = "DELIVERY_VOLUME_PRICE_PER_M3",
  DELIVERY_EXPRESS_MULTIPLIER = "DELIVERY_EXPRESS_MULTIPLIER",
  DELIVERY_URGENT_MULTIPLIER = "DELIVERY_URGENT_MULTIPLIER",
  DELIVERY_TRAVEL_SPEED_KMH = "DELIVERY_TRAVEL_SPEED_KMH",
  DELIVERY_FUEL_COST_PER_KM = "DELIVERY_FUEL_COST_PER_KM",
  DELIVERY_TOLL_COST_PER_KM = "DELIVERY_TOLL_COST_PER_KM",

  // TARIFS TRANSPORT
  TRANSPORT_BASE_PRICE = "TRANSPORT_BASE_PRICE",
  TRANSPORT_PRICE_PER_KM = "TRANSPORT_PRICE_PER_KM",
  TRANSPORT_WORKER_HOUR_RATE = "TRANSPORT_WORKER_HOUR_RATE",
  TRANSPORT_EXTRA_HOUR_RATE = "TRANSPORT_EXTRA_HOUR_RATE",
  TRANSPORT_VOLUME_SURCHARGE = "TRANSPORT_VOLUME_SURCHARGE",

  // TARIFS EMBALLAGE
  PACKING_PRICE_PER_M3 = "PACKING_PRICE_PER_M3",
  PACKING_WORKER_PRICE = "PACKING_WORKER_PRICE",
  PACKING_WORKER_HOUR_RATE = "PACKING_WORKER_HOUR_RATE",
  PACKING_EXTRA_HOUR_RATE = "PACKING_EXTRA_HOUR_RATE",
  PACKING_MATERIAL_COST = "PACKING_MATERIAL_COST",

  // TARIFS STOCKAGE
  STORAGE_PRICE_PER_M3_PER_MONTH = "STORAGE_PRICE_PER_M3_PER_MONTH",
  STORAGE_WORKER_HOUR_RATE = "STORAGE_WORKER_HOUR_RATE",
  STORAGE_EXTRA_HOUR_RATE = "STORAGE_EXTRA_HOUR_RATE",
  STORAGE_MINIMUM_DURATION_MONTHS = "STORAGE_MINIMUM_DURATION_MONTHS",
  STORAGE_ACCESS_FEE = "STORAGE_ACCESS_FEE",
}

/**
 * CLÉS DE CONFIGURATION FACTEURS DE PRICING - Nouvellement créées
 *
 * 🎯 OBJECTIF :
 * Centraliser tous les facteurs et multiplicateurs utilisés dans les calculs
 * de prix pour remplacer les valeurs hardcodées.
 */
export enum PricingFactorsConfigKey {
  // FACTEURS GÉNÉRAUX
  MINIMUM_PRICE_FACTOR = "MINIMUM_PRICE_FACTOR", // 0.9 (90% du prix par défaut)
  EXTRA_DAY_DISCOUNT_FACTOR = "EXTRA_DAY_DISCOUNT_FACTOR", // 0.9 (10% de réduction sur jours supplémentaires)
  ESTIMATION_FACTOR = "ESTIMATION_FACTOR", // 0.85 (estimation sans marge)
  INSURANCE_PRICE = "INSURANCE_PRICE", // 30 (prix fixe assurance)

  // FACTEURS DE VARIANCE DE PRIX
  PRICE_VARIANCE_DEFAULT = "PRICE_VARIANCE_DEFAULT", // 0.15 (15% variance par défaut)
  PRICE_VARIANCE_HIGH_COMPLETENESS = "PRICE_VARIANCE_HIGH_COMPLETENESS", // 0.1 (10% si données complètes)
  PRICE_VARIANCE_LOW_COMPLETENESS = "PRICE_VARIANCE_LOW_COMPLETENESS", // 0.25 (25% si données incomplètes)

  // FACTEURS DE RÉDUCTION
  WORKER_REDUCTION_RATE_1_DAY = "WORKER_REDUCTION_RATE_1_DAY", // 0.05 (5% pour 1 jour)
  WORKER_REDUCTION_RATE_MULTI_DAY = "WORKER_REDUCTION_RATE_MULTI_DAY", // 0.10 (10% pour plusieurs jours)
  DURATION_REDUCTION_RATE_SHORT = "DURATION_REDUCTION_RATE_SHORT", // 0.1 (10% pour durée <= 2h)
  DURATION_REDUCTION_RATE_LONG = "DURATION_REDUCTION_RATE_LONG", // 0.15 (15% pour durée > 2h)

  // TARIFS EXTRA
  EXTRA_KM_PRICE = "EXTRA_KM_PRICE", // 1.5 (1,50€ par km supplémentaire)
}

/**
 * CLÉS DE CONFIGURATION SEUILS - Nouvellement créées
 *
 * 🎯 OBJECTIF :
 * Centraliser tous les seuils et conditions utilisés dans la logique métier.
 */
export enum ThresholdsConfigKey {
  // SEUILS DE COMPLÉTUDE DES DONNÉES
  COMPLETENESS_HIGH_THRESHOLD = "COMPLETENESS_HIGH_THRESHOLD", // 0.8 (80% pour haute complétude)
  COMPLETENESS_LOW_THRESHOLD = "COMPLETENESS_LOW_THRESHOLD", // 0.3 (30% pour faible complétude)

  // SEUILS DE CONFIANCE
  CONFIDENCE_HIGH_THRESHOLD = "CONFIDENCE_HIGH_THRESHOLD", // 0.8 (80% pour confiance élevée)
  CONFIDENCE_MEDIUM_THRESHOLD = "CONFIDENCE_MEDIUM_THRESHOLD", // 0.5 (50% pour confiance moyenne)

  // LIMITES SYSTÈME
  MAX_ANALYTICS_EVENTS = "MAX_ANALYTICS_EVENTS", // 50000 (max événements analytics)
  DEFAULT_EXTENSION_HOURS = "DEFAULT_EXTENSION_HOURS", // 24 (heures d'extension par défaut)
  ANALYTICS_DAYS_HISTORY = "ANALYTICS_DAYS_HISTORY", // 7 (jours d'historique analytics)

  // VALIDATIONS MÉTIER
  MIN_DURATION = "MIN_DURATION", // 1 (durée minimale)
  MIN_PRICE_VALUE = "MIN_PRICE_VALUE", // 0 (prix minimum accepté)
}

/**
 * CLÉS DE CONFIGURATION COORDONNÉES ET MÉTRIQUES - Nouvellement créées
 *
 * 🎯 OBJECTIF :
 * Centraliser les coordonnées par défaut et métriques système.
 */
export enum SystemMetricsConfigKey {
  // COORDONNÉES PAR DÉFAUT (Paris)
  DEFAULT_LATITUDE = "DEFAULT_LATITUDE", // 48.8566
  DEFAULT_LONGITUDE = "DEFAULT_LONGITUDE", // 2.3522

  // MÉTRIQUES SYSTÈME
  DEFAULT_SYSTEM_UPTIME = "DEFAULT_SYSTEM_UPTIME", // 99.9
}
