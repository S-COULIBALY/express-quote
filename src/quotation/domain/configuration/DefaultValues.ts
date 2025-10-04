/**
 * Configuration centrale - Valeurs par défaut du système
 *
 * Source unique de vérité pour:
 * - Initialisation BDD (DefaultConfigurations.ts)
 * - Fallback des calculs (QuoteCalculator.ts)
 * - Tests unitaires
 * - Développement local
 */
export class DefaultValues {
  // ========================================
  // CONSTANTES VRAIMENT PARTAGÉES (tous services)
  // ========================================

  // Fiscalité & Monétaire
  static readonly VAT_RATE = 0.2;
  static readonly DEFAULT_CURRENCY = "EUR";
  static readonly DEPOSIT_PERCENTAGE = 0.3; // Acompte 30%

  // Distance partagée (MOVING, PACKING, DELIVERY)
  static readonly INCLUDED_DISTANCE = 20; // km inclus dans le prix de base
  static readonly UNIT_PRICE_PER_KM = 2; // Prix de base par km supplémentaire (peut être overridé par service)

  // Transport partagé
  static readonly FUEL_CONSUMPTION_PER_100KM = 25;
  static readonly FUEL_PRICE_PER_LITER = 1.8;
  static readonly TOLL_COST_PER_KM = 0.15;
  static readonly HIGHWAY_RATIO = 0.7;

  // Taux horaire générique (fallback si service non spécifié)
  static readonly SERVICE_WORKER_PRICE_PER_HOUR = 35;

  // Limites & Seuils
  static readonly MIN_PRICE = 0;
  static readonly MIN_VOLUME = 1;
  static readonly MAX_VOLUME = 200;
  static readonly MIN_SQUARE_METERS = 10;

  // Multiplicateurs & Réductions
  static readonly HOURLY_RATE_MULTIPLIER = 1.0;
  static readonly DAILY_RATE_MULTIPLIER = 0.8;
  static readonly WEEKLY_RATE_MULTIPLIER = 0.7;
  static readonly EXTRA_DAY_DISCOUNT_RATE = 0.08;
  static readonly EXTRA_WORKER_DISCOUNT_RATE = 0.05;
  static readonly VOLUME_DISCOUNT_THRESHOLD_M3 = 50;
  static readonly VOLUME_DISCOUNT_RATE = 0.1;

  // Assurance
  static readonly INSURANCE_PRICE_HT = 30;
  static readonly INSURANCE_PRICE_TTC = 36;
  static readonly INSURANCE_COVERAGE_MINIMUM = 100000;

  // Équipement & Matériel
  static readonly EQUIPMENT_RENTAL_DAILY = 25;
  static readonly MATERIAL_COST_PER_M3 = 12;
  static readonly PROTECTIVE_EQUIPMENT_COST = 15;

  // Opérationnel
  static readonly MAX_WORKERS_PER_VEHICLE = 3;
  static readonly MAX_VOLUME_PER_VEHICLE_M3 = 30;
  static readonly STANDARD_SERVICE_DURATION_HOURS = 8;
  static readonly OVERTIME_RATE_MULTIPLIER = 1.5;
  static readonly HOURS_PER_DAY = 7; // Heures de travail par jour

  // Professionnels
  static readonly PROFESSIONAL_DEFAULT_SEARCH_RADIUS_KM = 150;

  // Qualité & Sécurité
  static readonly QUALITY_GUARANTEE_DAYS = 30;
  static readonly SAFETY_EQUIPMENT_REQUIRED = true;

  // ========================================
  // CONSTANTES SPÉCIFIQUES PAR SERVICE
  // ========================================

  // DÉMÉNAGEMENT (MOVING)
  static readonly MOVING_BASE_PRICE_PER_M3 = 35;
  static readonly MOVING_WORKER_PRICE = 120; // Prix par travailleur (forfait journée)
  static readonly MOVING_WORKER_HOUR_RATE = 35;
  static readonly MOVING_EXTRA_HOUR_RATE = 40;
  static readonly MOVING_LIFT_PRICE = 200; // Monte-meuble
  static readonly MOVING_VEHICLE_FLAT_FEE = 150; // Frais camion
  static readonly MOVING_TRUCK_PRICE = 150; // Alias pour VEHICLE_FLAT_FEE
  static readonly MOVING_BOXES_PER_M3 = 10; // Cartons par m³
  static readonly MOVING_BOX_PRICE = 2; // Prix par carton
  static readonly MOVING_WORKERS_PER_M3_THRESHOLD = 5; // 1 worker par 5m³
  static readonly MOVING_PREMIUM_WORKER_PRICE_PER_HOUR = 40; // Taux horaire premium
  static readonly MOVING_PREMIUM_SUPPLIES_MULTIPLIER = 2.5; // Fournitures premium = cartons × 2.5
  static readonly MOVING_FREE_DISTANCE_KM = 20; // Alias pour INCLUDED_DISTANCE
  static readonly MOVING_DISTANCE_PRICE_PER_KM = 2; // Alias pour UNIT_PRICE_PER_KM

  // NETTOYAGE (CLEANING)
  static readonly CLEANING_PRICE_PER_M2 = 8;
  static readonly CLEANING_WORKER_PRICE = 25;
  static readonly CLEANING_WORKER_HOUR_RATE = 20;
  static readonly CLEANING_EXTRA_HOUR_RATE = 25;
  static readonly CLEANING_MINIMUM_PRICE = 80;

  // LIVRAISON (DELIVERY)
  static readonly DELIVERY_BASE_PRICE = 25;
  static readonly DELIVERY_PRICE_PER_KM = 1.2;
  static readonly DELIVERY_WORKER_HOUR_RATE = 18;
  static readonly DELIVERY_EXTRA_HOUR_RATE = 22;
  static readonly DELIVERY_WEIGHT_SURCHARGE = 0.5;

  // TRANSPORT
  static readonly TRANSPORT_BASE_PRICE = 40;
  static readonly TRANSPORT_PRICE_PER_KM = 1.8;
  static readonly TRANSPORT_WORKER_HOUR_RATE = 22;
  static readonly TRANSPORT_EXTRA_HOUR_RATE = 28;
  static readonly TRANSPORT_VOLUME_SURCHARGE = 0.3;

  // EMBALLAGE (PACKING)
  static readonly PACKING_PRICE_PER_M3 = 45;
  static readonly PACKING_WORKER_PRICE = 30;
  static readonly PACKING_WORKER_HOUR_RATE = 25;
  static readonly PACKING_EXTRA_HOUR_RATE = 30;
  static readonly PACKING_MATERIAL_COST = 15;

  // STOCKAGE (STORAGE)
  static readonly STORAGE_PRICE_PER_M3_PER_MONTH = 12;
  static readonly STORAGE_WORKER_HOUR_RATE = 20;
  static readonly STORAGE_EXTRA_HOUR_RATE = 25;
  static readonly STORAGE_MINIMUM_DURATION_MONTHS = 1;
  static readonly STORAGE_ACCESS_FEE = 20;

  // ========================================
  // RÈGLES D'AUTO-DÉTECTION
  // ========================================
  static readonly FURNITURE_LIFT_FLOOR_THRESHOLD = 3;
  static readonly FURNITURE_LIFT_SURCHARGE = 200;
  static readonly LONG_CARRYING_DISTANCE_THRESHOLD = 30;
  static readonly LONG_CARRYING_DISTANCE_SURCHARGE = 50;
  static readonly FREE_DELIVERY_DISTANCE_KM = 5;
  /**
   * ✅ Export toutes les valeurs pour debug/logging (après nettoyage)
   */
  static getAllValues(): Record<string, number | string> {
    return {
      // Constantes partagées
      VAT_RATE: this.VAT_RATE,
      DEFAULT_CURRENCY: this.DEFAULT_CURRENCY,
      DEPOSIT_PERCENTAGE: this.DEPOSIT_PERCENTAGE,
      INCLUDED_DISTANCE: this.INCLUDED_DISTANCE,
      UNIT_PRICE_PER_KM: this.UNIT_PRICE_PER_KM,
      FUEL_CONSUMPTION_PER_100KM: this.FUEL_CONSUMPTION_PER_100KM,
      FUEL_PRICE_PER_LITER: this.FUEL_PRICE_PER_LITER,
      TOLL_COST_PER_KM: this.TOLL_COST_PER_KM,
      HIGHWAY_RATIO: this.HIGHWAY_RATIO,
      SERVICE_WORKER_PRICE_PER_HOUR: this.SERVICE_WORKER_PRICE_PER_HOUR,

      // Limites & Seuils
      MIN_PRICE: this.MIN_PRICE,
      MIN_VOLUME: this.MIN_VOLUME,
      MAX_VOLUME: this.MAX_VOLUME,
      MIN_SQUARE_METERS: this.MIN_SQUARE_METERS,

      // Multiplicateurs & Réductions
      HOURLY_RATE_MULTIPLIER: this.HOURLY_RATE_MULTIPLIER,
      DAILY_RATE_MULTIPLIER: this.DAILY_RATE_MULTIPLIER,
      WEEKLY_RATE_MULTIPLIER: this.WEEKLY_RATE_MULTIPLIER,
      EXTRA_DAY_DISCOUNT_RATE: this.EXTRA_DAY_DISCOUNT_RATE,
      EXTRA_WORKER_DISCOUNT_RATE: this.EXTRA_WORKER_DISCOUNT_RATE,
      VOLUME_DISCOUNT_THRESHOLD_M3: this.VOLUME_DISCOUNT_THRESHOLD_M3,
      VOLUME_DISCOUNT_RATE: this.VOLUME_DISCOUNT_RATE,

      // Assurance
      INSURANCE_PRICE_HT: this.INSURANCE_PRICE_HT,
      INSURANCE_PRICE_TTC: this.INSURANCE_PRICE_TTC,
      INSURANCE_COVERAGE_MINIMUM: this.INSURANCE_COVERAGE_MINIMUM,

      // Équipement & Matériel
      EQUIPMENT_RENTAL_DAILY: this.EQUIPMENT_RENTAL_DAILY,
      MATERIAL_COST_PER_M3: this.MATERIAL_COST_PER_M3,
      PROTECTIVE_EQUIPMENT_COST: this.PROTECTIVE_EQUIPMENT_COST,

      // Opérationnel
      MAX_WORKERS_PER_VEHICLE: this.MAX_WORKERS_PER_VEHICLE,
      MAX_VOLUME_PER_VEHICLE_M3: this.MAX_VOLUME_PER_VEHICLE_M3,
      STANDARD_SERVICE_DURATION_HOURS: this.STANDARD_SERVICE_DURATION_HOURS,
      OVERTIME_RATE_MULTIPLIER: this.OVERTIME_RATE_MULTIPLIER,
      HOURS_PER_DAY: this.HOURS_PER_DAY,

      // Professionnels
      PROFESSIONAL_DEFAULT_SEARCH_RADIUS_KM:
        this.PROFESSIONAL_DEFAULT_SEARCH_RADIUS_KM,

      // Qualité & Sécurité
      QUALITY_GUARANTEE_DAYS: this.QUALITY_GUARANTEE_DAYS,
      SAFETY_EQUIPMENT_REQUIRED: this.SAFETY_EQUIPMENT_REQUIRED ? 1 : 0,

      // MOVING
      MOVING_BASE_PRICE_PER_M3: this.MOVING_BASE_PRICE_PER_M3,
      MOVING_WORKER_PRICE: this.MOVING_WORKER_PRICE,
      MOVING_WORKER_HOUR_RATE: this.MOVING_WORKER_HOUR_RATE,
      MOVING_EXTRA_HOUR_RATE: this.MOVING_EXTRA_HOUR_RATE,
      MOVING_LIFT_PRICE: this.MOVING_LIFT_PRICE,
      MOVING_VEHICLE_FLAT_FEE: this.MOVING_VEHICLE_FLAT_FEE,
      MOVING_TRUCK_PRICE: this.MOVING_TRUCK_PRICE,
      MOVING_BOXES_PER_M3: this.MOVING_BOXES_PER_M3,
      MOVING_BOX_PRICE: this.MOVING_BOX_PRICE,
      MOVING_WORKERS_PER_M3_THRESHOLD: this.MOVING_WORKERS_PER_M3_THRESHOLD,
      MOVING_PREMIUM_WORKER_PRICE_PER_HOUR:
        this.MOVING_PREMIUM_WORKER_PRICE_PER_HOUR,
      MOVING_PREMIUM_SUPPLIES_MULTIPLIER:
        this.MOVING_PREMIUM_SUPPLIES_MULTIPLIER,
      MOVING_FREE_DISTANCE_KM: this.MOVING_FREE_DISTANCE_KM,
      MOVING_DISTANCE_PRICE_PER_KM: this.MOVING_DISTANCE_PRICE_PER_KM,

      // CLEANING
      CLEANING_PRICE_PER_M2: this.CLEANING_PRICE_PER_M2,
      CLEANING_WORKER_PRICE: this.CLEANING_WORKER_PRICE,
      CLEANING_WORKER_HOUR_RATE: this.CLEANING_WORKER_HOUR_RATE,
      CLEANING_EXTRA_HOUR_RATE: this.CLEANING_EXTRA_HOUR_RATE,
      CLEANING_MINIMUM_PRICE: this.CLEANING_MINIMUM_PRICE,

      // DELIVERY
      DELIVERY_BASE_PRICE: this.DELIVERY_BASE_PRICE,
      DELIVERY_PRICE_PER_KM: this.DELIVERY_PRICE_PER_KM,
      DELIVERY_WORKER_HOUR_RATE: this.DELIVERY_WORKER_HOUR_RATE,
      DELIVERY_EXTRA_HOUR_RATE: this.DELIVERY_EXTRA_HOUR_RATE,
      DELIVERY_WEIGHT_SURCHARGE: this.DELIVERY_WEIGHT_SURCHARGE,

      // TRANSPORT
      TRANSPORT_BASE_PRICE: this.TRANSPORT_BASE_PRICE,
      TRANSPORT_PRICE_PER_KM: this.TRANSPORT_PRICE_PER_KM,
      TRANSPORT_WORKER_HOUR_RATE: this.TRANSPORT_WORKER_HOUR_RATE,
      TRANSPORT_EXTRA_HOUR_RATE: this.TRANSPORT_EXTRA_HOUR_RATE,
      TRANSPORT_VOLUME_SURCHARGE: this.TRANSPORT_VOLUME_SURCHARGE,

      // PACKING
      PACKING_PRICE_PER_M3: this.PACKING_PRICE_PER_M3,
      PACKING_WORKER_PRICE: this.PACKING_WORKER_PRICE,
      PACKING_WORKER_HOUR_RATE: this.PACKING_WORKER_HOUR_RATE,
      PACKING_EXTRA_HOUR_RATE: this.PACKING_EXTRA_HOUR_RATE,
      PACKING_MATERIAL_COST: this.PACKING_MATERIAL_COST,

      // STORAGE
      STORAGE_PRICE_PER_M3_PER_MONTH: this.STORAGE_PRICE_PER_M3_PER_MONTH,
      STORAGE_WORKER_HOUR_RATE: this.STORAGE_WORKER_HOUR_RATE,
      STORAGE_EXTRA_HOUR_RATE: this.STORAGE_EXTRA_HOUR_RATE,
      STORAGE_MINIMUM_DURATION_MONTHS: this.STORAGE_MINIMUM_DURATION_MONTHS,
      STORAGE_ACCESS_FEE: this.STORAGE_ACCESS_FEE,

      // Auto-détection
      FURNITURE_LIFT_FLOOR_THRESHOLD: this.FURNITURE_LIFT_FLOOR_THRESHOLD,
      FURNITURE_LIFT_SURCHARGE: this.FURNITURE_LIFT_SURCHARGE,
      LONG_CARRYING_DISTANCE_THRESHOLD: this.LONG_CARRYING_DISTANCE_THRESHOLD,
      LONG_CARRYING_DISTANCE_SURCHARGE: this.LONG_CARRYING_DISTANCE_SURCHARGE,
      FREE_DELIVERY_DISTANCE_KM: this.FREE_DELIVERY_DISTANCE_KM,
    };
  }
  /**
   * ✅ Valide la cohérence des valeurs (après nettoyage)
   */
  static validateValues(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Prix positifs (vérifier uniquement les valeurs qui existent encore)
    const mustBePositive = [
      "MOVING_BASE_PRICE_PER_M3",
      "UNIT_PRICE_PER_KM",
      "SERVICE_WORKER_PRICE_PER_HOUR",
      "FUEL_PRICE_PER_LITER",
      "MIN_VOLUME",
      "MIN_SQUARE_METERS",
      "CLEANING_PRICE_PER_M2",
      "DELIVERY_BASE_PRICE",
    ];
    mustBePositive.forEach((key) => {
      if ((this as any)[key] <= 0) errors.push(`${key} doit être positif`);
    });

    // Ratios entre 0 et 1
    const mustBeRatio = [
      "HIGHWAY_RATIO",
      "EXTRA_DAY_DISCOUNT_RATE",
      "EXTRA_WORKER_DISCOUNT_RATE",
      "VAT_RATE",
      "VOLUME_DISCOUNT_RATE",
      "DEPOSIT_PERCENTAGE",
    ];
    mustBeRatio.forEach((key) => {
      const val = (this as any)[key];
      if (val < 0 || val > 1) errors.push(`${key} doit être entre 0 et 1`);
    });

    // Limites logiques
    if (this.MAX_VOLUME <= this.MIN_VOLUME) {
      errors.push("MAX_VOLUME doit être > MIN_VOLUME");
    }
    if (this.OVERTIME_RATE_MULTIPLIER <= 1) {
      errors.push("OVERTIME_RATE_MULTIPLIER doit être > 1");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // RÈGLES FALLBACK (utilisées si BDD indisponible)
  static readonly DEFAULT_MOVING_CONSTRAINTS = [
    {
      id: "elevator_unavailable",
      name: "Ascenseur en panne ou hors service",
      value: 35,
      category: "SURCHARGE",
      description: "Transport par escaliers obligatoire",
    },
    {
      id: "narrow_street",
      name: "Rue étroite ou inaccessible au camion",
      value: 50,
      category: "SURCHARGE",
      description: "Camion ne peut pas accéder, portage supplémentaire",
    },
    {
      id: "difficult_parking",
      name: "Stationnement difficile ou payant",
      value: 30,
      category: "SURCHARGE",
      description: "Frais de stationnement, temps supplémentaire",
    },
    {
      id: "long_carrying_distance",
      name: "Portage longue distance (>50m)",
      value: 40,
      category: "SURCHARGE",
      description: "Distance excessive entre véhicule et logement",
    },
    {
      id: "administrative_permit",
      name: "Autorisation administrative",
      value: 30,
      category: "SURCHARGE",
      description: "Démarches administratives requises",
    },
    {
      id: "access_control",
      name: "Contrôle d'accès strict",
      value: 25,
      category: "SURCHARGE",
      description: "Procédures de sécurité complexes",
    },
    {
      id: "time_restrictions",
      name: "Restrictions horaires",
      value: 20,
      category: "SURCHARGE",
      description: "Créneaux horaires limités",
    },
    {
      id: "pedestrian_zone",
      name: "Zone piétonne avec restrictions",
      value: 40,
      category: "SURCHARGE",
      description: "Autorisation mairie requise",
    },
    {
      id: "complex_traffic",
      name: "Circulation complexe",
      value: 25,
      category: "SURCHARGE",
      description: "Temps de trajet augmenté",
    },
    {
      id: "fragile_floor",
      name: "Sol fragile ou délicat",
      value: 30,
      category: "SURCHARGE",
      description: "Protection sol spécialisée",
    },
    {
      id: "complex_access",
      name: "Accès complexe multi-niveaux",
      value: 50,
      category: "SURCHARGE",
      description: "Accès difficile au logement",
    },
    {
      id: "heavy_floor",
      name: "Étage élevé sans ascenseur",
      value: 35,
      category: "SURCHARGE",
      description: "Transport manuel par escaliers",
    },
    {
      id: "weekend_service",
      name: "Service week-end",
      value: 30,
      category: "SURCHARGE",
      description: "Majoration weekend et jours fériés",
    },
    {
      id: "emergency_service",
      name: "Service urgent (< 48h)",
      value: 50,
      category: "SURCHARGE",
      description: "Intervention en urgence",
    },
    {
      id: "seasonal_demand",
      name: "Période de forte demande",
      value: 20,
      category: "SURCHARGE",
      description: "Majoration période chargée",
    },
    {
      id: "special_equipment",
      name: "Équipement spécialisé requis",
      value: 40,
      category: "SURCHARGE",
      description: "Matériel spécialisé nécessaire",
    },
  ] as const;

  static readonly DEFAULT_MOVING_SERVICES = [
    {
      id: "furniture_disassembly",
      name: "Démontage de meubles",
      value: 80,
      category: "FIXED",
      description: "Démontage professionnel des meubles volumineux",
    },
    {
      id: "furniture_reassembly",
      name: "Remontage de meubles",
      value: 100,
      category: "FIXED",
      description: "Remontage professionnel des meubles",
    },
    {
      id: "professional_packing",
      name: "Emballage professionnel",
      value: 150,
      category: "FIXED",
      description: "Emballage sécurisé par nos équipes",
    },
    {
      id: "professional_unpacking",
      name: "Déballage professionnel",
      value: 120,
      category: "FIXED",
      description: "Déballage et installation",
    },
    {
      id: "fragile_handling",
      name: "Manipulation objets fragiles",
      value: 90,
      category: "FIXED",
      description: "Soin particulier pour objets délicats",
    },
    {
      id: "heavy_items",
      name: "Transport objets lourds",
      value: 110,
      category: "FIXED",
      description: "Équipement spécialisé pour objets lourds",
    },
    {
      id: "storage_service",
      name: "Service de stockage temporaire",
      value: 200,
      category: "FIXED",
      description: "Stockage sécurisé entre déménagements",
    },
    {
      id: "cleaning_service",
      name: "Nettoyage fin de déménagement",
      value: 180,
      category: "FIXED",
      description: "Nettoyage complet post-déménagement",
    },
    {
      id: "furniture_lift_service",
      name: "Location monte-meuble",
      value: 300,
      category: "FIXED",
      description: "Location et utilisation d'un monte-meuble",
    },
    {
      id: "piano_transport",
      name: "Transport piano",
      value: 250,
      category: "FIXED",
      description: "Transport spécialisé pour piano",
    },
    {
      id: "artwork_handling",
      name: "Transport œuvres d'art",
      value: 200,
      category: "FIXED",
      description: "Manipulation spécialisée œuvres d'art",
    },
    {
      id: "appliance_connection",
      name: "Branchement électroménager",
      value: 80,
      category: "FIXED",
      description: "Installation électroménager",
    },
    {
      id: "furniture_protection",
      name: "Protection mobilier",
      value: 60,
      category: "FIXED",
      description: "Emballage de protection",
    },
    {
      id: "vehicle_upgrade",
      name: "Véhicule plus grand",
      value: 150,
      category: "FIXED",
      description: "Camion de plus grande capacité",
    },
    {
      id: "extra_crew",
      name: "Équipe supplémentaire",
      value: 120,
      category: "FIXED",
      description: "Déménageurs additionnels",
    },
    {
      id: "insurance_premium",
      name: "Assurance premium",
      value: 100,
      category: "FIXED",
      description: "Couverture assurance étendue",
    },
  ] as const;

  static readonly DEFAULT_CLEANING_CONSTRAINTS = [
    {
      id: "high_dirt_level",
      name: "Saleté importante",
      value: 100,
      category: "SURCHARGE",
      description: "Nettoyage intensif requis",
    },
    {
      id: "no_water_access",
      name: "Accès eau limité",
      value: 50,
      category: "SURCHARGE",
      description: "Contraintes d'approvisionnement en eau",
    },
    {
      id: "mold_presence",
      name: "Présence de moisissure confirmée",
      value: 100,
      category: "SURCHARGE",
      description: "Traitement spécialisé anti-moisissure",
    },
    {
      id: "emergency_service",
      name: "Service d'urgence (< 24h)",
      value: 50,
      category: "SURCHARGE",
      description: "Intervention en urgence",
    },
    {
      id: "weekend_service",
      name: "Intervention week-end",
      value: 30,
      category: "SURCHARGE",
      description: "Majoration weekend et jours fériés",
    },
    {
      id: "difficult_access",
      name: "Accès difficile au bâtiment",
      value: 25,
      category: "SURCHARGE",
      description: "Contraintes d'accès au site",
    },
    {
      id: "no_elevator",
      name: "Absence d'ascenseur",
      value: 35,
      category: "SURCHARGE",
      description: "Transport matériel par escaliers",
    },
    {
      id: "hazardous_products",
      name: "Produits dangereux/toxiques",
      value: 80,
      category: "SURCHARGE",
      description: "Équipement de protection spécialisé",
    },
  ] as const;

  static readonly DEFAULT_CLEANING_SERVICES = [
    {
      id: "deep_cleaning",
      name: "Grand nettoyage de printemps",
      value: 80,
      category: "FIXED",
      description: "Nettoyage en profondeur complet",
    },
    {
      id: "carpet_cleaning",
      name: "Nettoyage tapis et moquettes",
      value: 60,
      category: "FIXED",
      description: "Nettoyage spécialisé textiles",
    },
    {
      id: "window_cleaning",
      name: "Nettoyage vitres complet",
      value: 40,
      category: "FIXED",
      description: "Nettoyage intérieur/extérieur vitres",
    },
    {
      id: "kitchen_deep_clean",
      name: "Dégraissage cuisine professionnelle",
      value: 90,
      category: "FIXED",
      description: "Nettoyage approfondi cuisine",
    },
    {
      id: "bathroom_sanitizing",
      name: "Désinfection salle de bain",
      value: 50,
      category: "FIXED",
      description: "Traitement antibactérien complet",
    },
  ] as const;

  static readonly DEFAULT_DELIVERY_CONSTRAINTS = [
    {
      id: "heavy_package",
      name: "Colis très lourd (>30kg)",
      value: 20,
      category: "FIXED",
      description: "Équipement spécialisé requis",
    },
    {
      id: "fragile_delivery",
      name: "Livraison fragile",
      value: 15,
      category: "FIXED",
      description: "Manipulation délicate nécessaire",
    },
    {
      id: "express_delivery",
      name: "Livraison express",
      value: 25,
      category: "FIXED",
      description: "Livraison prioritaire sous 2h",
    },
  ] as const;

  static getDefaultRulesForService(
    serviceType: "MOVING" | "CLEANING" | "DELIVERY",
  ): {
    constraints: readonly any[];
    services: readonly any[];
  } {
    switch (serviceType) {
      case "MOVING":
        return {
          constraints: this.DEFAULT_MOVING_CONSTRAINTS,
          services: this.DEFAULT_MOVING_SERVICES,
        };
      case "CLEANING":
        return {
          constraints: this.DEFAULT_CLEANING_CONSTRAINTS,
          services: this.DEFAULT_CLEANING_SERVICES,
        };
      case "DELIVERY":
        return {
          constraints: this.DEFAULT_DELIVERY_CONSTRAINTS,
          services: [],
        };
      default:
        return { constraints: [], services: [] };
    }
  }

  static getAllDefaultRules(): {
    MOVING: { constraints: readonly any[]; services: readonly any[] };
    CLEANING: { constraints: readonly any[]; services: readonly any[] };
    DELIVERY: { constraints: readonly any[]; services: readonly any[] };
  } {
    return {
      MOVING: this.getDefaultRulesForService("MOVING"),
      CLEANING: this.getDefaultRulesForService("CLEANING"),
      DELIVERY: this.getDefaultRulesForService("DELIVERY"),
    };
  }
}
