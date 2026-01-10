import { ServiceType, RuleType, RuleCategory } from '@prisma/client';

/**
 * ============================================================================
 * FALLBACK MOVING - Données générées automatiquement
 * ============================================================================
 *
 * 🤖 GÉNÉRÉ AUTOMATIQUEMENT le 2025-10-29
 * ⚠️  NE PAS MODIFIER MANUELLEMENT
 *
 * Ce fichier est généré via: npm run generate:fallbacks
 * Source: Base de données production (table BusinessRule)
 *
 * 📋 Utilisation:
 * Ces données sont utilisées comme fallback si la BDD est indisponible.
 */

export interface Constraint {
  id: string;
  name: string;
  description?: string;
  value: number;
  isActive: boolean;
  category: RuleCategory;
  condition?: any;
  percentBased: boolean;
  serviceType: ServiceType;
  ruleType: RuleType;
  priority: number;
  validFrom?: Date;
  validTo?: Date | null;
  tags: string[];
  configKey?: string;
  scope?: 'GLOBAL' | 'PICKUP' | 'DELIVERY' | 'BOTH'; // ✅ NOUVEAU: Support du champ scope
  metadata?: {
    source?: string;
    impact?: string;
    category_frontend?: "constraint" | "service";
    display?: {
      icon?: string;
      priority?: number;
      group?: string;
      description_short?: string;
    };
  };
}

/**
 * ✅ CONTRAINTES DÉMÉNAGEMENT
 * Total: 16 contraintes
 */
export const movingConstraintsFallback: Constraint[] = [
  {
    id: "293dc311-6f22-42d8-8b31-b322c0e888f9",
    name: "Accès complexe multi-niveaux",
    description: "Plusieurs étages à traverser, temps multiplié",
    value: 9.5,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "distance",
      access: "multilevel"
    },
    percentBased: true,
    serviceType: "MOVING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.446Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    scope: "BOTH",
    metadata: {
      impact: "+9.5%",
      source: "realistic_seed_2025",
      display: {
        icon: "💧",
        group: "distance",
        priority: -47,
        description_short: "Plusieurs étages à traverser, temps multiplié"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "8c35a3fc-5e2f-4355-b121-a0af0da4b4a7",
    name: "Ascenseur en panne ou hors service",
    description: "Transport par escaliers obligatoire",
    value: 8,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "building",
      elevator: "unavailable"
    },
    percentBased: true,
    serviceType: "MOVING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.329Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    scope: "BOTH",
    metadata: {
      impact: "+8%",
      source: "realistic_seed_2025",
      display: {
        icon: "🛗",
        group: "building",
        priority: -48,
        description_short: "Transport par escaliers obligatoire"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "98ce49a1-3add-4e6b-8a8e-a364a5333423",
    name: "Ascenseur interdit pour déménagement",
    description: "Règlement copropriété, escaliers obligatoires",
    value: 8,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "building",
      elevator: "forbidden"
    },
    percentBased: true,
    serviceType: "MOVING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.363Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    scope: "BOTH",
    metadata: {
      impact: "+8%",
      source: "realistic_seed_2025",
      display: {
        icon: "🛗",
        group: "building",
        priority: -48,
        description_short: "Règlement copropriété, escaliers obligatoires"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "55ea42b9-aed0-465c-8e5f-ee82a7bb8c85",
    name: "Ascenseur trop petit pour les meubles",
    description: "Démontage obligatoire ou escaliers",
    value: 7.5,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "building",
      elevator: "small"
    },
    percentBased: true,
    serviceType: "MOVING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.344Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    scope: "PICKUP",
    metadata: {
      impact: "+7.5%",
      source: "realistic_seed_2025",
      display: {
        icon: "🛗",
        group: "building",
        priority: -48,
        description_short: "Démontage obligatoire ou escaliers"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "be4d1f35-12e3-4c1e-8bd4-ed436fa4a843",
    name: "Autorisation administrative",
    description: "Démarches mairie, réservation voirie",
    value: 7,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "security",
      permit: "required"
    },
    percentBased: true,
    serviceType: "MOVING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.480Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    scope: "BOTH",
    metadata: {
      impact: "+7%",
      source: "realistic_seed_2025",
      display: {
        icon: "📋",
        group: "security",
        priority: -49,
        description_short: "Démarches mairie, réservation voirie"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "d85f44a1-3f5f-4e28-883c-778000a2e23e",
    name: "Circulation complexe",
    description: "Temps de trajet augmenté, détours obligatoires",
    value: 6.5,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "vehicle_access",
      traffic: "complex"
    },
    percentBased: true,
    serviceType: "MOVING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.313Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    scope: "GLOBAL",
    metadata: {
      impact: "+6.5%",
      source: "realistic_seed_2025",
      display: {
        icon: "📋",
        group: "vehicle_access",
        priority: -46,
        description_short: "Temps de trajet augmenté, détours obligatoires"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "c2ed1e45-65cf-47b0-bfeb-967df4275087",
    name: "Contrôle d'accès strict",
    description: "Autorisation préalable, badges nécessaires",
    value: 6,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "security",
      access: "strict"
    },
    percentBased: true,
    serviceType: "MOVING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.464Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    scope: "BOTH",
    metadata: {
      impact: "+6%",
      source: "realistic_seed_2025",
      display: {
        icon: "🔒",
        group: "security",
        priority: -49,
        description_short: "Autorisation préalable, badges nécessaires"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "b2b8f00b-00a2-456c-ad06-1150d25d71a3",
    name: "Couloirs étroits ou encombrés",
    description: "Démontage supplémentaire, temps augmenté",
    value: 6.5,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "building",
      corridors: "narrow"
    },
    percentBased: true,
    serviceType: "MOVING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.397Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    scope: "PICKUP",
    metadata: {
      impact: "+6.5%",
      source: "realistic_seed_2025",
      display: {
        icon: "📋",
        group: "building",
        priority: -48,
        description_short: "Démontage supplémentaire, temps augmenté"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "ca6cb6e5-9f5a-4d50-8200-d78d9dedd901",
    name: "Distance de portage > 30m",
    description: "Surcoût main d'œuvre, navettes nécessaires",
    value: 7.8,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "distance",
      carrying: "long"
    },
    percentBased: true,
    serviceType: "MOVING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.413Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    scope: "BOTH",
    metadata: {
      impact: "+7.8%",
      source: "realistic_seed_2025",
      display: {
        icon: "📏",
        group: "distance",
        priority: -47,
        description_short: "Surcoût main d'œuvre, navettes nécessaires"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "40acdd70-5c1f-4936-a53c-8f52e6695a4c",
    name: "Escalier difficile ou dangereux",
    description: "Monte-meuble recommandé, risques élevés",
    value: 8.5,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "building",
      stairs: "difficult"
    },
    percentBased: true,
    serviceType: "MOVING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.379Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    scope: "BOTH",
    metadata: {
      impact: "+8.5%",
      source: "realistic_seed_2025",
      display: {
        icon: "🪜",
        group: "building",
        priority: -48,
        description_short: "Monte-meuble recommandé, risques élevés"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "24e4e233-655e-4730-9b6b-451b3731789a",
    name: "Passage indirect obligatoire",
    description: "Sortie non directe, protection sols",
    value: 8.2,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "distance",
      access: "indirect"
    },
    percentBased: true,
    serviceType: "MOVING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.431Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    scope: "BOTH",
    metadata: {
      impact: "+8.2%",
      source: "realistic_seed_2025",
      display: {
        icon: "📋",
        group: "distance",
        priority: -47,
        description_short: "Sortie non directe, protection sols"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "cd0c6f29-c489-449b-b462-6e6e80594fee",
    name: "Restrictions horaires strictes",
    description: "Créneaux limités, coordination complexe",
    value: 6.8,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      time: "restricted",
      type: "security"
    },
    percentBased: true,
    serviceType: "MOVING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.496Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    scope: "BOTH",
    metadata: {
      impact: "+6.8%",
      source: "realistic_seed_2025",
      display: {
        icon: "⏰",
        group: "security",
        priority: -49,
        description_short: "Créneaux limités, coordination complexe"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "6267e023-e9ae-4c41-8101-5ce4f863363d",
    name: "Rue étroite ou inaccessible au camion",
    description: "Camion ne peut pas accéder, portage supplémentaire",
    value: 9,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      road: "narrow",
      type: "vehicle_access"
    },
    percentBased: true,
    serviceType: "MOVING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.279Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    scope: "BOTH",
    metadata: {
      impact: "+9%",
      source: "realistic_seed_2025",
      display: {
        icon: "🚛",
        group: "vehicle_access",
        priority: -46,
        description_short: "Camion ne peut pas accéder, portage supplémentaire"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "1c4b4bff-522e-4ddb-a551-5d2f773b5d91",
    name: "Sol fragile ou délicat",
    description: "Protection supplémentaire obligatoire",
    value: 5.5,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "security",
      floor: "fragile"
    },
    percentBased: true,
    serviceType: "MOVING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.512Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    scope: "BOTH",
    metadata: {
      impact: "+5.5%",
      source: "realistic_seed_2025",
      display: {
        icon: "💎",
        group: "security",
        priority: -49,
        description_short: "Protection supplémentaire obligatoire"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "76d5aa58-d9ad-45c8-8c72-6a03d178d15d",
    name: "Stationnement difficile ou payant",
    description: "Frais de stationnement, temps supplémentaire",
    value: 7.5,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "vehicle_access",
      parking: "difficult"
    },
    percentBased: true,
    serviceType: "MOVING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.296Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    scope: "GLOBAL",
    metadata: {
      impact: "+7.5%",
      source: "realistic_seed_2025",
      display: {
        icon: "🅿️",
        group: "vehicle_access",
        priority: -46,
        description_short: "Frais de stationnement, temps supplémentaire"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "ec4ac13f-3ede-458a-bf77-4e5964bc6614",
    name: "Zone piétonne avec restrictions",
    description: "Autorisation mairie requise, frais administratifs",
    value: 8.5,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "vehicle_access",
      zone: "pedestrian"
    },
    percentBased: true,
    serviceType: "MOVING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.213Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    scope: "BOTH",
    metadata: {
      impact: "+8.5%",
      source: "realistic_seed_2025",
      display: {
        icon: "🚶",
        group: "vehicle_access",
        priority: -46,
        description_short: "Autorisation mairie requise, frais administratifs"
      },
      category_frontend: "constraint"
    }
  }
];

/**
 * ✅ SERVICES DÉMÉNAGEMENT
 * Total: 16 services
 */
export const movingServicesFallback: Constraint[] = [
  {
    id: "388128a7-b47e-4a35-8143-5455b3e0ab52",
    name: "Déballage professionnel arrivée",
    description: "Déballage + nettoyage + évacuation cartons",
    value: 100,
    isActive: true,
    category: "FIXED",
    condition: {
      type: "service",
      packing: "arrival"
    },
    percentBased: false,
    serviceType: "MOVING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.620Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    scope: "DELIVERY",
    metadata: {
      impact: "+100€",
      source: "realistic_seed_2025",
      display: {
        icon: "📋",
        group: "service",
        priority: 6,
        description_short: "Déballage + nettoyage + évacuation cartons"
      },
      category_frontend: "service"
    }
  },
  {
    id: "1c0eadfd-50e2-42d2-9f35-400abec4dfa5",
    name: "Démontage de meubles",
    description: "Temps spécialisé inclus, outillage pro",
    value: 80,
    isActive: true,
    category: "FIXED",
    condition: {
      type: "service",
      handling: "disassembly"
    },
    percentBased: false,
    serviceType: "MOVING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.558Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    scope: "PICKUP",
    metadata: {
      impact: "+80€",
      source: "realistic_seed_2025",
      display: {
        icon: "🔧",
        group: "service",
        priority: 6,
        description_short: "Temps spécialisé inclus, outillage pro"
      },
      category_frontend: "service"
    }
  },
  {
    id: "c2bb1202-1b12-4f9c-aa88-e44671ce04f1",
    name: "Emballage œuvres d'art",
    description: "Caissage sur mesure, protection maximale",
    value: 200,
    isActive: true,
    category: "FIXED",
    condition: {
      type: "service",
      packing: "artwork"
    },
    percentBased: false,
    serviceType: "MOVING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.682Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    scope: "PICKUP",
    metadata: {
      impact: "+200€",
      source: "realistic_seed_2025",
      display: {
        icon: "📦",
        group: "service",
        priority: 6,
        description_short: "Caissage sur mesure, protection maximale"
      },
      category_frontend: "service"
    }
  },
  {
    id: "42b851fa-992a-45ef-9da8-744968fdc6b4",
    name: "Emballage professionnel départ",
    description: "Équipe spécialisée, matériel professionnel",
    value: 120,
    isActive: true,
    category: "FIXED",
    condition: {
      type: "service",
      packing: "departure"
    },
    percentBased: false,
    serviceType: "MOVING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.605Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    scope: "PICKUP",
    metadata: {
      impact: "+120€",
      source: "realistic_seed_2025",
      display: {
        icon: "📦",
        group: "service",
        priority: 6,
        description_short: "Équipe spécialisée, matériel professionnel"
      },
      category_frontend: "service"
    }
  },
  {
    id: "8746a048-33d8-4216-95a2-1fa1fa418fce",
    name: "Fournitures d'emballage",
    description: "Cartons renforcés, papier bulle, sangles pro",
    value: 50,
    isActive: true,
    category: "FIXED",
    condition: {
      type: "service",
      packing: "supplies"
    },
    percentBased: false,
    serviceType: "MOVING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.659Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    scope: "PICKUP",
    metadata: {
      impact: "+50€",
      source: "realistic_seed_2025",
      display: {
        icon: "📦",
        group: "service",
        priority: 6,
        description_short: "Cartons renforcés, papier bulle, sangles pro"
      },
      category_frontend: "service"
    }
  },
  {
    id: "3edf411c-7f67-4217-9d74-47d11edb88ed",
    name: "Gestion administrative",
    description: "Résiliation/transfert tous contrats",
    value: 60,
    isActive: true,
    category: "FIXED",
    condition: {
      type: "service",
      annexe: "admin"
    },
    percentBased: false,
    serviceType: "MOVING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.783Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    scope: "BOTH",
    metadata: {
      impact: "+60€",
      source: "realistic_seed_2025",
      display: {
        icon: "📋",
        group: "service",
        priority: 6,
        description_short: "Résiliation/transfert tous contrats"
      },
      category_frontend: "service"
    }
  },
  {
    id: "76b2bd7a-1acb-4f4e-b215-330765c4e788",
    name: "Inventaire avec photos",
    description: "État des lieux photographique complet",
    value: 80,
    isActive: true,
    category: "FIXED",
    condition: {
      type: "service",
      protection: "inventory"
    },
    percentBased: false,
    serviceType: "MOVING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.737Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    scope: "BOTH",
    metadata: {
      impact: "+80€",
      source: "realistic_seed_2025",
      display: {
        icon: "📝",
        group: "service",
        priority: 6,
        description_short: "État des lieux photographique complet"
      },
      category_frontend: "service"
    }
  },
  {
    id: "a58d62cc-8de6-4ac5-99ec-0428e268c025",
    name: "Meubles encombrants",
    description: "Armoires, canapés d'angle, piano droit",
    value: 150,
    isActive: true,
    category: "FIXED",
    condition: {
      type: "service",
      handling: "bulky"
    },
    percentBased: false,
    serviceType: "MOVING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.542Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    scope: "BOTH",
    metadata: {
      impact: "+150€",
      source: "realistic_seed_2025",
      display: {
        icon: "📋",
        group: "service",
        priority: 6,
        description_short: "Armoires, canapés d'angle, piano droit"
      },
      category_frontend: "service"
    }
  },
  {
    id: "5cdd32e3-23d5-413e-a9b4-26a746066ce0",
    name: "Monte-meuble",
    description: "Location monte-meuble 200-400€, ajouté automatiquement",
    value: 300,
    isActive: true,
    category: "FIXED",
    condition: {
      lift: "required",
      type: "equipment"
    },
    percentBased: false,
    serviceType: "MOVING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.528Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    scope: "BOTH",
    metadata: {
      impact: "+300€",
      source: "realistic_seed_2025",
      display: {
        icon: "🏗️",
        group: "equipment",
        priority: 5,
        description_short: "Location monte-meuble 200-400€, ajouté automatiquement"
      },
      category_frontend: "service"
    }
  },
  {
    id: "44542f01-5539-4858-b05e-a2adb39c5877",
    name: "Nettoyage après déménagement",
    description: "Nettoyage complet logement vide",
    value: 120,
    isActive: true,
    category: "FIXED",
    condition: {
      type: "service",
      annexe: "cleaning"
    },
    percentBased: false,
    serviceType: "MOVING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.767Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    scope: "PICKUP",
    metadata: {
      impact: "+120€",
      source: "realistic_seed_2025",
      display: {
        icon: "🧹",
        group: "service",
        priority: 6,
        description_short: "Nettoyage complet logement vide"
      },
      category_frontend: "service"
    }
  },
  {
    id: "352eabed-8869-460f-b7f0-99237b003cc1",
    name: "Objets fragiles/précieux",
    description: "Emballage renforcé + assurance tous risques",
    value: 180,
    isActive: true,
    category: "FIXED",
    condition: {
      type: "service",
      protection: "fragile"
    },
    percentBased: false,
    serviceType: "MOVING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.706Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    scope: "PICKUP",
    metadata: {
      impact: "+180€",
      source: "realistic_seed_2025",
      display: {
        icon: "💎",
        group: "service",
        priority: 6,
        description_short: "Emballage renforcé + assurance tous risques"
      },
      category_frontend: "service"
    }
  },
  {
    id: "fb522208-5206-482f-9ad5-9abf8cf6f0b1",
    name: "Objets très lourds",
    description: "Équipement hydraulique, sangles renforcées",
    value: 200,
    isActive: true,
    category: "FIXED",
    condition: {
      type: "service",
      protection: "heavy"
    },
    percentBased: false,
    serviceType: "MOVING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.721Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    scope: "BOTH",
    metadata: {
      impact: "+200€",
      source: "realistic_seed_2025",
      display: {
        icon: "🏋️",
        group: "service",
        priority: 6,
        description_short: "Équipement hydraulique, sangles renforcées"
      },
      category_frontend: "service"
    }
  },
  {
    id: "9b08837b-666e-4ff8-8ea7-223b7c695fb0",
    name: "Remontage de meubles",
    description: "Remontage garanti conforme",
    value: 100,
    isActive: true,
    category: "FIXED",
    condition: {
      type: "service",
      handling: "reassembly"
    },
    percentBased: false,
    serviceType: "MOVING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.575Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    scope: "DELIVERY",
    metadata: {
      impact: "+100€",
      source: "realistic_seed_2025",
      display: {
        icon: "🛠️",
        group: "service",
        priority: 6,
        description_short: "Remontage garanti conforme"
      },
      category_frontend: "service"
    }
  },
  {
    id: "eb0a68e9-c9fb-4c1d-8e78-fd307fea654d",
    name: "Stockage temporaire",
    description: "Garde-meuble climatisé, accès 24h/24",
    value: 150,
    isActive: true,
    category: "FIXED",
    condition: {
      type: "service",
      annexe: "storage"
    },
    percentBased: false,
    serviceType: "MOVING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.752Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    scope: "BOTH",
    metadata: {
      impact: "+150€",
      source: "realistic_seed_2025",
      display: {
        icon: "📦",
        group: "service",
        priority: 6,
        description_short: "Garde-meuble climatisé, accès 24h/24"
      },
      category_frontend: "service"
    }
  },
  {
    id: "a059350a-923d-499f-8140-96f8c7e2dd70",
    name: "Transport animaux",
    description: "Véhicule adapté, cage de transport",
    value: 80,
    isActive: true,
    category: "FIXED",
    condition: {
      type: "service",
      annexe: "pets"
    },
    percentBased: false,
    serviceType: "MOVING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.798Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    scope: "BOTH",
    metadata: {
      impact: "+80€",
      source: "realistic_seed_2025",
      display: {
        icon: "🐾",
        group: "service",
        priority: 6,
        description_short: "Véhicule adapté, cage de transport"
      },
      category_frontend: "service"
    }
  },
  {
    id: "7b09890c-9151-41e2-a017-4f478e601fc4",
    name: "Transport piano",
    description: "Équipement spécialisé, assurance renforcée",
    value: 250,
    isActive: true,
    category: "FIXED",
    condition: {
      type: "service",
      handling: "piano"
    },
    percentBased: false,
    serviceType: "MOVING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.590Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    scope: "BOTH",
    metadata: {
      impact: "+250€",
      source: "realistic_seed_2025",
      display: {
        icon: "🎹",
        group: "service",
        priority: 6,
        description_short: "Équipement spécialisé, assurance renforcée"
      },
      category_frontend: "service"
    }
  }
];

/**
 * ✅ TOUS LES ITEMS DÉMÉNAGEMENT
 * Total: 32 items
 */
export const allMovingItemsFallback = [
  ...movingConstraintsFallback,
  ...movingServicesFallback
];
