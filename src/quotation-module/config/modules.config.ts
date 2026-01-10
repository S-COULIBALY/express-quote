/**
 * Configuration centralisée pour tous les modules du système de devis
 * 
 * SOURCE UNIQUE DE VÉRITÉ pour toutes les valeurs codées en dur dans les modules
 * 
 * ORGANISATION :
 * - Les valeurs sont organisées par catégories logiques (transport, main-d'œuvre, contraintes, etc.)
 * - Chaque valeur est documentée avec son unité et son usage
 * - Les valeurs peuvent être ajustées sans modifier le code des modules
 * 
 * UTILISATION :
 * - Importer la configuration dans chaque module : `import { MODULES_CONFIG } from '../../config/modules.config'`
 * - Remplacer les valeurs codées en dur par les références à la config
 * 
 * MAINTENANCE :
 * - Toute modification de tarification doit se faire uniquement dans ce fichier
 * - Documenter les changements dans le changelog
 */

export const MODULES_CONFIG = {
  /**
   * ============================================
   * DISTANCE & TRANSPORT
   * ============================================
   */
  distance: {
    /** Distance par défaut si non fournie (km) */
    DEFAULT_DISTANCE_KM: 20,
    
    /** Distance maximale valide (France métropolitaine) */
    MAX_DISTANCE_KM: 5000,
    
    /** Seuil pour considérer une longue distance (km) */
    LONG_DISTANCE_THRESHOLD_KM: 50,
    
    /** Seuil pour arrêt nuit obligatoire (km) */
    OVERNIGHT_STOP_THRESHOLD_KM: 1000,
    
    /** Vitesse moyenne estimée pour calcul temps de trajet (km/h) */
    AVERAGE_SPEED_KMH: 50,
    
    /** Multiplicateur pour estimer le temps de trajet (minutes = distance * factor) */
    TRAVEL_TIME_FACTOR: 1.2,
  },

  /**
   * ============================================
   * CARBURANT & PÉAGES
   * ============================================
   */
  fuel: {
    /** Prix du carburant par litre (€/L) - diesel utilitaire */
    PRICE_PER_LITER: 1.70,
    
    /** Consommation moyenne véhicule utilitaire (L/100km) */
    VEHICLE_CONSUMPTION_L_PER_100KM: 12,
    
    /**
     * Forfait kilométrique longue distance (€/km) - TARIFICATION PROGRESSIVE
     *
     * ⚠️ IMPORTANT : Ce forfait n'est PAS du carburant supplémentaire !
     * Le carburant est déjà calculé par FuelCostModule pour la distance totale.
     *
     * Ce forfait couvre les coûts d'exploitation longue distance :
     * - Usure accélérée du véhicule (pneus, freins, mécanique)
     * - Indisponibilité prolongée du véhicule pour d'autres missions
     * - Frais annexes (pauses conducteur, péages secondaires, etc.)
     * - Risque accru sur long trajet
     */
    LONG_DISTANCE_SURCHARGE: {
      /** Plafond de distance excédentaire prise en compte (km) */
      MAX_EXCESS_DISTANCE_KM: 1000,

      /** Tarification progressive par tranche */
      PROGRESSIVE_RATES: [
        {
          /** Tranche 1 : 0-200 km excédentaire */
          maxKm: 200,
          costPerKm: 0.15,
        },
        {
          /** Tranche 2 : 200-1000 km excédentaire */
          maxKm: 1000,
          costPerKm: 0.20,
        },
      ],
    },
  },

  tolls: {
    /** Coût moyen des péages en France (€/km) */
    COST_PER_KM: 0.08,
    
    /** Pourcentage du trajet estimé sur autoroute (pour calcul péages) */
    HIGHWAY_PERCENTAGE: 0.7,
  },

  /**
   * ============================================
   * VÉHICULES
   * ============================================
   */
  vehicle: {
    /** Coûts de location par type de véhicule (€) */
    VEHICLE_COSTS: {
      CAMION_12M3: 80,
      CAMION_20M3: 250,
      CAMION_30M3: 350,
    },

    /** Capacités des véhicules (m³) */
    VEHICLE_CAPACITIES: {
      CAMION_12M3: 12,
      CAMION_20M3: 20,
      CAMION_30M3: 30,
    },

    /** Seuils de volume pour sélection du type de véhicule (m³) */
    VOLUME_THRESHOLDS: {
      CAMION_12M3: 12,
      CAMION_20M3: 20,
      CAMION_30M3: 30,
    },

    /** Type de véhicule par défaut si volume non disponible */
    DEFAULT_VEHICLE_TYPE: 'CAMION_20M3',
  },

  /**
   * ============================================
   * VOLUME & ESTIMATION
   * ============================================
   */
  volume: {
    /** Coefficients de conversion surface → volume par type de logement (m³/m²) */
    VOLUME_COEFFICIENTS: {
      STUDIO: 0.50,  // Studio : mobilier dense
      F2: 0.45,      // F2 : mobilier standard
      F3: 0.45,      // F3 : mobilier standard
      F4: 0.45,      // F4 : mobilier standard
      HOUSE: 0.40,   // Maison : mobilier moins dense
    },

    /** Volumes de base par type de logement (m³) - fallback si pas de surface */
    BASE_VOLUMES_BY_TYPE: {
      STUDIO: 12,
      F2: 20,
      F3: 30,
      F4: 40,
      HOUSE: 60,
    },

    /** Volumes de base par nombre de pièces (m³) - fallback ultime */
    BASE_VOLUMES_BY_ROOMS: {
      1: 12,   // Studio/T1
      2: 20,   // F2
      3: 30,   // F3
      4: 40,   // F4
      5: 50,   // F5
      6: 60,   // F6+
    },

    /** Volume minimum valide (m³) */
    MIN_VOLUME_M3: 5,
    
    /** Volume maximum valide (m³) */
    MAX_VOLUME_M3: 200,

    /** Volumes additionnels pour objets spéciaux (m³) */
    SPECIAL_ITEMS_VOLUME: {
      PIANO: 8,              // Piano droit/à queue
      BULKY_FURNITURE: 5,    // Meubles encombrants
      SAFE: 3,               // Coffre-fort standard
      ARTWORK: 2,            // Œuvres d'art avec emballage
      BUILT_IN_APPLIANCES: 3, // Électroménager encastré
    },

    /** Marges de sécurité selon méthode d'estimation et confiance */
    CONFIDENCE_MARGINS: {
      VIDEO: {
        LOW: 1.05,    // +5%
        MEDIUM: 1.02, // +2%
        HIGH: 1.0,    // 0%
      },
      LIST: {
        LOW: 1.10,    // +10%
        MEDIUM: 1.05, // +5%
        HIGH: 1.02,   // +2%
      },
      FORM: {
        // Volume fourni manuellement
        USER_PROVIDED: {
          LOW: 1.10,    // +10%
          MEDIUM: 1.05, // +5%
          HIGH: 1.02,   // +2%
        },
        // Volume calculé
        CALCULATED: {
          LOW: 1.20,    // +20%
          MEDIUM: 1.10, // +10%
          HIGH: 1.05,   // +5%
        },
      },
    },

    /** Seuils pour validation du volume fourni vs théorique (%) */
    VOLUME_VALIDATION_THRESHOLDS: {
      CRITICAL_UNDERESTIMATE: 30,  // >30% sous-estimation = critique
      MEDIUM_UNDERESTIMATE: 15,    // 15-30% sous-estimation = moyen
      OVERESTIMATE: 30,            // >30% sur-estimation = utiliser volume fourni
    },

    /** Marges de sécurité pour sous-estimation (%) */
    SAFETY_MARGINS: {
      CRITICAL: 0.25,  // +25% si sous-estimation critique
      MEDIUM: 0.15,    // +15% si sous-estimation moyenne
    },
  },

  /**
   * ============================================
   * MAIN-D'ŒUVRE
   * ============================================
   */
  labor: {
    /** Nombre de déménageurs par défaut */
    DEFAULT_WORKERS_COUNT: 2,
    
    /** Nombre maximum de déménageurs */
    MAX_WORKERS_COUNT: 6,

    /** Taux horaire de base (€/h) */
    BASE_HOURLY_RATE: 30,

    /** Heures de travail par journée (h) */
    BASE_WORK_HOURS: 7,

    /** Volume par déménageur (m³) - Calcul: nombre déménageurs = volume / VOLUME_PER_WORKER */
    VOLUME_PER_WORKER: 5,

    /** Règles de nombre de déménageurs selon le scénario */
    SCENARIO_RULES: {
      /** Scénario ECO : nombre maximum de déménageurs */
      ECO_MAX_WORKERS: 2,
      /** Scénario STANDARD : facteur de réduction (0.5 = moitié) */
      STANDARD_WORKERS_FACTOR: 0.5,
    },

    /** Seuils de volume pour nombre de déménageurs (m³) */
    WORKERS_VOLUME_THRESHOLDS: {
      THREE_WORKERS: 30,   // >30m³ → 3 déménageurs
      FOUR_WORKERS: 50,    // >50m³ → 4 déménageurs
      FIVE_WORKERS: 100,   // >100m³ → 5 déménageurs
    },

    /** Pénalités d'accès (€) */
    ACCESS_PENALTIES: {
      STAIRS_PER_FLOOR: 25,           // € par étage sans ascenseur
      STAIRS_FLOOR_THRESHOLD: 3,      // Seuil d'étage pour appliquer la pénalité (> 3)
      CARRY_DISTANCE_PER_METER: 2,    // € par mètre de portage
      CARRY_DISTANCE_THRESHOLD: 30,   // Seuil de distance pour appliquer la pénalité (> 30m)
    },

    /** Garantie flexibilité équipe (€) */
    FLEXIBILITY_GUARANTEE_COST: 500,

    /** Temps de chargement/déchargement (minutes) */
    LOADING_TIME: {
      BASE_MINUTES_PER_M3_PER_WORKER: 15,  // Minutes par m³ par déménageur
      FLOOR_PENALTY_MINUTES: 5,            // Minutes supplémentaires par étage sans ascenseur
      CARRY_DISTANCE_PENALTY_PER_METER: 0.5, // Minutes par mètre de portage
    },
  },

  /**
   * ============================================
   * MONTE-MEUBLES
   * ============================================
   */
  furnitureLift: {
    /** Coût de base monte-meubles (€) - installation + opérateur */
    BASE_LIFT_COST: 250,
    
    /** Surcoût si monte-meubles aux deux adresses (€) - double installation */
    DOUBLE_LIFT_SURCHARGE: 250,

    /** Seuils d'étage pour gradation de la recommandation */
    FLOOR_THRESHOLDS: {
      HIGH: 3,      // Étage ≥ 3 = HIGH
      CRITICAL: 5,  // Étage ≥ 5 = CRITICAL
    },

    /** Coûts estimés pour comparaison (€) */
    ESTIMATED_COSTS: {
      LIFT: 350,        // Coût moyen monte-meubles
      RISK_SURCHARGE: 500, // Surcoût estimé sans monte-meubles
    },

    /** Surcoût risque manutention si refus monte-meubles (€) */
    MANUAL_HANDLING_RISK: {
      BASE_COST: 150,        // Coût de base pour risque manutention
      COST_PER_FLOOR: 50,    // Coût supplémentaire par étage
    },
  },

  /**
   * ============================================
   * CONTRAINTES D'ACCÈS
   * ============================================
   */
  access: {
    /** Contribution au risque pour escaliers sans ascenseur (0-100) */
    NO_ELEVATOR_RISK_CONTRIBUTION: 15,
    
    /** Contribution au risque pour dommages voisinage (0-100) */
    NEIGHBORHOOD_DAMAGE_RISK: {
      BASE: 5,
      HIGH_FLOOR_MULTIPLIER: 2,  // Multiplicateur par étage élevé
      BULKY_FURNITURE_RISK: 10,  // Risque supplémentaire pour meubles encombrants
    },
  },

  /**
   * ============================================
   * LOGISTIQUE
   * ============================================
   */
  logistics: {
    /** Coût navette logistique (€) */
    NAVETTE: {
      BASE_COST: 20,               // Coût fixe de la navette
      DISTANCE_FACTOR: 0.5,        // Coût supplémentaire par km (pas de seuil, appliqué dès le premier km)
    },

    /** Surcoût créneau syndic (€) */
    SYNDIC_SURCHARGE: 80,
    
    /** Contribution au risque créneau syndic (0-100) */
    SYNDIC_RISK_CONTRIBUTION: 5,

    /** Coûts arrêt nuit (€) */
    OVERNIGHT_STOP: {
      HOTEL_COST_PER_WORKER: 120,      // € par déménageur (nuit + petit-déjeuner)
      SECURE_PARKING_COST: 50,         // € parking sécurisé camion
      MEAL_ALLOWANCE_PER_WORKER: 30,   // € par déménageur (dîner)
    },

    /** Surcoûts trafic IDF (%) */
    TRAFFIC_IDF: {
      RUSH_HOUR_SURCHARGE: 0.01,           // Surcoût de 1% en heures de pointe
      FRIDAY_AFTERNOON_SURCHARGE: 0.02,    // Surcoût de 2% vendredi après-midi (prioritaire)
    },

    /** Heures de pointe IDF */
    RUSH_HOURS: {
      MORNING_START: 7,
      MORNING_END: 9,
      EVENING_START: 17,
      EVENING_END: 19,
    },

    /** Vendredi après-midi (heures) */
    FRIDAY_AFTERNOON: {
      START: 14,
      END: 19,
    },
  },

  /**
   * ============================================
   * TEMPORAL (Week-end, fin de mois, etc.)
   * ============================================
   */
  temporal: {
    /** Surcoût week-end (%) */
    WEEKEND_SURCHARGE_PERCENTAGE: 0.05,  // Surcoût de 5% du prix de base
    
    /** Contribution au risque week-end (0-100) */
    WEEKEND_RISK_CONTRIBUTION: 8,

    /** Seuil jour pour fin de mois (à partir du jour X) */
    END_OF_MONTH_THRESHOLD_DAY: 25,
    
    /** Surcoût fin de mois (%) */
    END_OF_MONTH_SURCHARGE_PERCENTAGE: 0.05,  // Surcoût de 5% du prix de base
    
    /** Contribution au risque fin de mois (0-100) */
    END_OF_MONTH_RISK_CONTRIBUTION: 10,
  },

  /**
   * ============================================
   * CROSS-SELLING (Options)
   * ============================================
   */
  crossSelling: {
    /** Coût emballage (€/m³) */
    PACKING_COST_PER_M3: 5,
    
    /** Seuil volume pour recommander emballage (m³) */
    PACKING_VOLUME_THRESHOLD: 40,

    /** Coût stockage temporaire (€/m³/mois) */
    STORAGE_COST_PER_M3_PER_MONTH: 30,
    
    /** Durée de stockage par défaut (jours) */
    STORAGE_DEFAULT_DURATION_DAYS: 30,
    
    /** Nombre de jours par mois pour calcul stockage */
    DAYS_PER_MONTH: 30,

    /** Coût nettoyage fin de chantier (€/m²) */
    CLEANING_COST_PER_M2: 8,

    /** Coûts démontage de meubles (€) - Service de démontage seul */
    DISMANTLING: {
      BASE_COST: 50,                    // Coût de base pour démontage seul
      COST_PER_COMPLEX_ITEM: 25,        // Coût par meuble complexe
      COST_PER_BULKY_FURNITURE: 40,     // Coût pour meuble encombrant
      PIANO_COST: 60,                   // Démontage piano (expertise spécialisée)
    },

    /** Coûts remontage de meubles (€) - Service de remontage seul */
    REASSEMBLY: {
      BASE_COST: 50,                    // Coût de base pour remontage seul
      COST_PER_COMPLEX_ITEM: 25,        // Coût par meuble complexe
      COST_PER_BULKY_FURNITURE: 40,     // Coût pour meuble encombrant
      PIANO_COST: 60,                   // Remontage piano (expertise spécialisée)
    },
  },

  /**
   * ============================================
   * OBJETS DE GRANDE VALEUR
   * ============================================
   */
  highValueItems: {
    /** Coûts de manipulation spécialisée (€) */
    HANDLING_COSTS: {
      PIANO: 150,
      SAFE: 200,
      ARTWORK: 100,
    },

    /** Contribution au risque objets de valeur (0-100) */
    RISK_CONTRIBUTION: 15,
    
    /** Seuil valeur déclarée élevée (€) */
    HIGH_DECLARED_VALUE_THRESHOLD: 50000,
  },

  /**
   * ============================================
   * RISQUE & INCERTITUDE
   * ============================================
   */
  risk: {
    /** Scores de risque selon confiance volume (0-100) */
    VOLUME_UNCERTAINTY: {
      LOW: 15,      // Risque élevé si confiance faible
      MEDIUM: 8,    // Risque moyen si confiance moyenne
      HIGH: 3,      // Risque faible si confiance élevée
    },

    /** Ajustements selon différence volume (%) */
    VOLUME_DIFF_ADJUSTMENTS: {
      HIGH_DIFF: 10,    // +10 si grande différence (>30%)
      MEDIUM_DIFF: 5,   // +5 si différence moyenne (15-30%)
    },

    /** Plafond score de risque incertitude volume (0-100) */
    MAX_VOLUME_UNCERTAINTY_RISK: 30,

    /** Contribution au risque copropriété (0-100) */
    COOWNERSHIP_RISK_CONTRIBUTION: 8,

    /** Contribution au risque occupation domaine public (0-100) */
    PUBLIC_DOMAIN_RISK_CONTRIBUTION: 5,
  },

  /**
   * ============================================
   * ADMINISTRATIF & LÉGAL
   * ============================================
   */
  administrative: {
    /** Coût administratif pour autorisation domaine public (€) */
    PUBLIC_DOMAIN_AUTHORIZATION_COST: 50,
    
    /** Multiplicateur si plusieurs emplacements */
    MULTIPLE_LOCATIONS_MULTIPLIER: 1.5,
  },
} as const;

/**
 * Type pour la configuration (utile pour TypeScript)
 */
export type ModulesConfig = typeof MODULES_CONFIG;

/**
 * Helpers pour accéder facilement aux valeurs
 */
export const getConfig = () => MODULES_CONFIG;

