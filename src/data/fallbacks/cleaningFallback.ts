import { ServiceType, RuleType, RuleCategory } from '@prisma/client';

/**
 * ============================================================================
 * FALLBACK CLEANING - Données générées automatiquement
 * ============================================================================
 *
 * 🤖 GÉNÉRÉ AUTOMATIQUEMENT le 2025-10-20
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
 * ✅ CONTRAINTES NETTOYAGE
 * Total: 25 contraintes
 */
export const cleaningConstraintsFallback: Constraint[] = [
  {
    id: "49e42e4c-c240-418d-bbdc-aff9a2cefe37",
    name: "Absence d'ascenseur",
    description: "Transport matériel par escaliers",
    value: 6,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "access",
      elevator: "none"
    },
    percentBased: true,
    serviceType: "CLEANING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.830Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    metadata: {
      impact: "+6%",
      source: "realistic_seed_2025",
      display: {
        icon: "🛗",
        group: "access",
        priority: 49,
        description_short: "Transport matériel par escaliers"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "c2951072-61a4-4a1a-96ab-e5949cdbdbb3",
    name: "Accès difficile au bâtiment",
    description: "Codes, digicode, interphone complexe",
    value: 5.5,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "access",
      building: "difficult"
    },
    percentBased: true,
    serviceType: "CLEANING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.845Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    metadata: {
      impact: "+5.5%",
      source: "realistic_seed_2025",
      display: {
        icon: "📋",
        group: "access",
        priority: 49,
        description_short: "Codes, digicode, interphone complexe"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "a032d730-d1d8-44a0-8eb4-2f845b962bb6",
    name: "Allergies signalées",
    description: "Produits hypoallergéniques, précautions spéciales",
    value: 6.5,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "work",
      allergies: "present"
    },
    percentBased: true,
    serviceType: "CLEANING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.913Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    metadata: {
      impact: "+6.5%",
      source: "realistic_seed_2025",
      display: {
        icon: "📋",
        group: "work",
        priority: -43,
        description_short: "Produits hypoallergéniques, précautions spéciales"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "4185f3e1-b8d1-4536-88e4-a1896908cbe7",
    name: "Contrôle de sécurité strict",
    description: "Badge, gardien, vérifications d'identité",
    value: 6,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "access",
      security: "strict"
    },
    percentBased: true,
    serviceType: "CLEANING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.866Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    metadata: {
      impact: "+6%",
      source: "realistic_seed_2025",
      display: {
        icon: "🔒",
        group: "access",
        priority: 49,
        description_short: "Badge, gardien, vérifications d'identité"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "d7858dc6-712a-405b-b342-353e157d7c57",
    name: "Créneau horaire spécifique",
    description: "Disponibilité réduite, contraintes client",
    value: 6.5,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "schedule",
      window: "specific"
    },
    percentBased: true,
    serviceType: "CLEANING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.960Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    metadata: {
      impact: "+6.5%",
      source: "realistic_seed_2025",
      display: {
        icon: "⏰",
        group: "schedule",
        priority: -42,
        description_short: "Disponibilité réduite, contraintes client"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "2b9e827e-7990-4779-9ab7-cf72bf7d0016",
    name: "Dégâts des eaux récents",
    description: "Humidité, moisissures potentielles, équipement spécial",
    value: 9.8,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "location",
      damage: "water"
    },
    percentBased: true,
    serviceType: "CLEANING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:46.069Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    metadata: {
      impact: "+9.8%",
      source: "realistic_seed_2025",
      display: {
        icon: "💧",
        group: "location",
        priority: -41,
        description_short: "Humidité, moisissures potentielles, équipement spécial"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "edefd89b-117d-4739-9bf5-6ed67a5a4b64",
    name: "Équipement industriel requis",
    description: "Mono-brosse, injecteur-extracteur, haute pression",
    value: 9.5,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "utilities",
      equipment: "industrial"
    },
    percentBased: true,
    serviceType: "CLEANING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:46.196Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    metadata: {
      impact: "+9.5%",
      source: "realistic_seed_2025",
      display: {
        icon: "📋",
        group: "utilities",
        priority: -40,
        description_short: "Mono-brosse, injecteur-extracteur, haute pression"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "6ff2c0d6-8539-4618-b456-55750c0d0d13",
    name: "Espace très restreint",
    description: "Meubles encombrants, accès difficile",
    value: 7,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "location",
      space: "limited"
    },
    percentBased: true,
    serviceType: "CLEANING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:46.121Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    metadata: {
      impact: "+7%",
      source: "realistic_seed_2025",
      display: {
        icon: "📋",
        group: "location",
        priority: -41,
        description_short: "Meubles encombrants, accès difficile"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "e331f21f-caa5-4e07-b6b3-d5e86ee02f4d",
    name: "Intervention matinale",
    description: "Majoration horaires atypiques (avant 8h)",
    value: 7,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      time: "early",
      type: "schedule"
    },
    percentBased: true,
    serviceType: "CLEANING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.976Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    metadata: {
      impact: "+7%",
      source: "realistic_seed_2025",
      display: {
        icon: "📋",
        group: "schedule",
        priority: -42,
        description_short: "Majoration horaires atypiques (avant 8h)"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "1bdf8ac3-0fef-4b6e-9e2f-2de56714580c",
    name: "Meubles lourds à déplacer",
    description: "Mobilier encombrant nécessitant 2 personnes",
    value: 7.5,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "work",
      furniture: "heavy"
    },
    percentBased: true,
    serviceType: "CLEANING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.944Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    metadata: {
      impact: "+7.5%",
      source: "realistic_seed_2025",
      display: {
        icon: "🏋️",
        group: "work",
        priority: -43,
        description_short: "Mobilier encombrant nécessitant 2 personnes"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "bc66e368-2c23-4453-b308-f89d925fdb65",
    name: "Objets fragiles/précieux",
    description: "Antiquités, œuvres d'art, manipulation délicate",
    value: 7,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "work",
      items: "fragile"
    },
    percentBased: true,
    serviceType: "CLEANING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.929Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    metadata: {
      impact: "+7%",
      source: "realistic_seed_2025",
      display: {
        icon: "💎",
        group: "work",
        priority: -43,
        description_short: "Antiquités, œuvres d'art, manipulation délicate"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "0b75ab1c-a7d4-4c23-a8d5-5d6db9c45e9a",
    name: "Pas d'accès à l'eau",
    description: "Approvisionnement eau, équipement autonome",
    value: 9,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "utilities",
      water: "none"
    },
    percentBased: true,
    serviceType: "CLEANING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:46.151Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    metadata: {
      impact: "+9%",
      source: "realistic_seed_2025",
      display: {
        icon: "💧",
        group: "utilities",
        priority: -40,
        description_short: "Approvisionnement eau, équipement autonome"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "b32ae668-29a4-4d3e-9729-637f22b0cd2d",
    name: "Pas d'électricité",
    description: "Matériel sur batterie, éclairage portatif",
    value: 8.5,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "utilities",
      power: "none"
    },
    percentBased: true,
    serviceType: "CLEANING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:46.165Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    metadata: {
      impact: "+8.5%",
      source: "realistic_seed_2025",
      display: {
        icon: "⚡",
        group: "utilities",
        priority: -40,
        description_short: "Matériel sur batterie, éclairage portatif"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "0253e05d-2287-48bf-b0de-6dfbe17a3a21",
    name: "Post-construction/travaux",
    description: "Poussière, gravats, matériel renforcé",
    value: 9.5,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "location",
      work: "construction"
    },
    percentBased: true,
    serviceType: "CLEANING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:46.054Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    metadata: {
      impact: "+9.5%",
      source: "realistic_seed_2025",
      display: {
        icon: "📋",
        group: "location",
        priority: -41,
        description_short: "Poussière, gravats, matériel renforcé"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "670b8b7a-bedd-4e84-9aa8-dc6969738c3e",
    name: "Présence d'animaux",
    description: "Chiens, chats, poils, produits adaptés nécessaires",
    value: 5.5,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      pets: "present",
      type: "work"
    },
    percentBased: true,
    serviceType: "CLEANING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.883Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    metadata: {
      impact: "+5.5%",
      source: "realistic_seed_2025",
      display: {
        icon: "🐾",
        group: "work",
        priority: -43,
        description_short: "Chiens, chats, poils, produits adaptés nécessaires"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "6d58240f-3c9a-4e58-9d1f-4825213a4a7d",
    name: "Présence de moisissure",
    description: "Traitement antifongique, EPI spéciaux",
    value: 10,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      mold: "present",
      type: "location"
    },
    percentBased: true,
    serviceType: "CLEANING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:46.105Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    metadata: {
      impact: "+10%",
      source: "realistic_seed_2025",
      display: {
        icon: "🦠",
        group: "location",
        priority: -41,
        description_short: "Traitement antifongique, EPI spéciaux"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "f8b7187b-539f-43de-b4f9-54898560d908",
    name: "Présence d'enfants",
    description: "Produits écologiques, sécurité renforcée",
    value: 6,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "work",
      children: "present"
    },
    percentBased: true,
    serviceType: "CLEANING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.898Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    metadata: {
      impact: "+6%",
      source: "realistic_seed_2025",
      display: {
        icon: "📋",
        group: "work",
        priority: -43,
        description_short: "Produits écologiques, sécurité renforcée"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "27bdf16d-94aa-46da-b08e-2b3e1c6cc442",
    name: "Produits spécifiques requis",
    description: "Produits professionnels, détachants spéciaux",
    value: 7.5,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "utilities",
      products: "special"
    },
    percentBased: true,
    serviceType: "CLEANING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:46.181Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    metadata: {
      impact: "+7.5%",
      source: "realistic_seed_2025",
      display: {
        icon: "📋",
        group: "utilities",
        priority: -40,
        description_short: "Produits professionnels, détachants spéciaux"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "863ea826-b34d-4d6e-a990-e2334ccfdb97",
    name: "Saleté importante/tenace",
    description: "Nettoyage intensif, temps supplémentaire",
    value: 8.5,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      dirt: "heavy",
      type: "location"
    },
    percentBased: true,
    serviceType: "CLEANING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:46.039Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    metadata: {
      impact: "+8.5%",
      source: "realistic_seed_2025",
      display: {
        icon: "📋",
        group: "location",
        priority: -41,
        description_short: "Nettoyage intensif, temps supplémentaire"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "31b86be9-fc6d-43e4-9372-dbe12d944982",
    name: "Service d'urgence",
    description: "Intervention d'urgence, mobilisation rapide",
    value: 9,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "schedule",
      urgency: "emergency"
    },
    percentBased: true,
    serviceType: "CLEANING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:46.022Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    metadata: {
      impact: "+9%",
      source: "realistic_seed_2025",
      display: {
        icon: "⏰",
        group: "schedule",
        priority: -42,
        description_short: "Intervention d'urgence, mobilisation rapide"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "4bdacdf9-e723-446d-8c89-6034ad1a844b",
    name: "Service en soirée",
    description: "Majoration horaires atypiques (après 18h)",
    value: 7.5,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      time: "evening",
      type: "schedule"
    },
    percentBased: true,
    serviceType: "CLEANING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.990Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    metadata: {
      impact: "+7.5%",
      source: "realistic_seed_2025",
      display: {
        icon: "📋",
        group: "schedule",
        priority: -42,
        description_short: "Majoration horaires atypiques (après 18h)"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "eed07d02-692b-4d91-9568-793aec0edf28",
    name: "Service weekend",
    description: "Samedi/dimanche, majoration weekend",
    value: 8.5,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      day: "weekend",
      type: "schedule"
    },
    percentBased: true,
    serviceType: "CLEANING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:46.006Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    metadata: {
      impact: "+8.5%",
      source: "realistic_seed_2025",
      display: {
        icon: "📅",
        group: "schedule",
        priority: -42,
        description_short: "Samedi/dimanche, majoration weekend"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "8adc228c-823b-4161-ac37-a925c340c131",
    name: "Situation d'accumulation",
    description: "Syndrome de Diogène, tri préalable nécessaire",
    value: 10,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "location",
      hoarding: "present"
    },
    percentBased: true,
    serviceType: "CLEANING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:46.136Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    metadata: {
      impact: "+10%",
      source: "realistic_seed_2025",
      display: {
        icon: "📋",
        group: "location",
        priority: -41,
        description_short: "Syndrome de Diogène, tri préalable nécessaire"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "f48f86de-b12f-4a24-8186-9e363315623e",
    name: "Stationnement limité ou payant",
    description: "Difficulté de stationnement, frais supplémentaires possibles",
    value: 5.5,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "access",
      parking: "limited"
    },
    percentBased: true,
    serviceType: "CLEANING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:45.815Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    metadata: {
      impact: "+5.5%",
      source: "realistic_seed_2025",
      display: {
        icon: "🅿️",
        group: "access",
        priority: 49,
        description_short: "Difficulté de stationnement, frais supplémentaires possibles"
      },
      category_frontend: "constraint"
    }
  },
  {
    id: "2e91f72e-a210-4f7c-ae36-25bc4473bde3",
    name: "Travail en hauteur",
    description: "Échafaudage, harnais, nettoyage vitres hautes",
    value: 9.8,
    isActive: true,
    category: "SURCHARGE",
    condition: {
      type: "utilities",
      height: "required"
    },
    percentBased: true,
    serviceType: "CLEANING",
    ruleType: "CONSTRAINT",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:46.211Z"),
    validTo: null,
    tags: [
      "percentage"
    ],
    metadata: {
      impact: "+9.8%",
      source: "realistic_seed_2025",
      display: {
        icon: "🪜",
        group: "utilities",
        priority: -40,
        description_short: "Échafaudage, harnais, nettoyage vitres hautes"
      },
      category_frontend: "constraint"
    }
  }
];

/**
 * ✅ SERVICES NETTOYAGE
 * Total: 13 services
 */
export const cleaningServicesFallback: Constraint[] = [
  {
    id: "e1c7b822-878d-44a6-93cc-fac1a232313b",
    name: "Désinfection complète",
    description: "Traitement virucide, surfaces contact",
    value: 70,
    isActive: true,
    category: "FIXED",
    condition: {
      type: "service",
      disinfection: "complete"
    },
    percentBased: false,
    serviceType: "CLEANING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:46.292Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    metadata: {
      impact: "+70€",
      source: "realistic_seed_2025",
      display: {
        icon: "🧼",
        group: "service",
        priority: 6,
        description_short: "Traitement virucide, surfaces contact"
      },
      category_frontend: "service"
    }
  },
  {
    id: "310ddae6-6f96-46a1-b87c-4fc61e583819",
    name: "Entretien mobilier",
    description: "Nourrissage cuir, cirage bois, protection",
    value: 35,
    isActive: true,
    category: "FIXED",
    condition: {
      type: "service",
      maintenance: "furniture"
    },
    percentBased: false,
    serviceType: "CLEANING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:46.341Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    metadata: {
      impact: "+35€",
      source: "realistic_seed_2025",
      display: {
        icon: "📋",
        group: "service",
        priority: 6,
        description_short: "Nourrissage cuir, cirage bois, protection"
      },
      category_frontend: "service"
    }
  },
  {
    id: "41c91949-f9c8-4843-b44f-77b2839f5e39",
    name: "Évacuation déchets",
    description: "Tri sélectif, évacuation selon réglementation",
    value: 40,
    isActive: true,
    category: "FIXED",
    condition: {
      type: "service",
      logistics: "waste"
    },
    percentBased: false,
    serviceType: "CLEANING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:46.416Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    metadata: {
      impact: "+40€",
      source: "realistic_seed_2025",
      display: {
        icon: "🗑️",
        group: "service",
        priority: 6,
        description_short: "Tri sélectif, évacuation selon réglementation"
      },
      category_frontend: "service"
    }
  },
  {
    id: "43e86f13-f2d5-494c-91c0-75aeb00709e8",
    name: "Gestion trousseau de clés",
    description: "Service récupération/dépôt clés sécurisé",
    value: 15,
    isActive: true,
    category: "FIXED",
    condition: {
      type: "service",
      logistics: "keys"
    },
    percentBased: false,
    serviceType: "CLEANING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:46.434Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    metadata: {
      impact: "+15€",
      source: "realistic_seed_2025",
      display: {
        icon: "💧",
        group: "service",
        priority: 6,
        description_short: "Service récupération/dépôt clés sécurisé"
      },
      category_frontend: "service"
    }
  },
  {
    id: "ada91bb4-1041-43dd-84cb-915250c2679d",
    name: "Grand nettoyage de printemps",
    description: "Nettoyage complet incluant placards, électroménager",
    value: 80,
    isActive: true,
    category: "FIXED",
    condition: {
      type: "service",
      specialized: "deep"
    },
    percentBased: false,
    serviceType: "CLEANING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:46.227Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    metadata: {
      impact: "+80€",
      source: "realistic_seed_2025",
      display: {
        icon: "🧹",
        group: "service",
        priority: 6,
        description_short: "Nettoyage complet incluant placards, électroménager"
      },
      category_frontend: "service"
    }
  },
  {
    id: "d9d29af9-3081-4e45-aa88-d97f3a8be3c6",
    name: "Nettoyage argenterie",
    description: "Produits spécialisés métaux précieux",
    value: 25,
    isActive: true,
    category: "FIXED",
    condition: {
      type: "service",
      maintenance: "silver"
    },
    percentBased: false,
    serviceType: "CLEANING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:46.360Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    metadata: {
      impact: "+25€",
      source: "realistic_seed_2025",
      display: {
        icon: "🧹",
        group: "service",
        priority: 6,
        description_short: "Produits spécialisés métaux précieux"
      },
      category_frontend: "service"
    }
  },
  {
    id: "54f28bcd-e602-4148-8df6-175ba3ef6bc8",
    name: "Nettoyage électroménager",
    description: "Four, frigo, lave-vaisselle, micro-ondes",
    value: 50,
    isActive: true,
    category: "FIXED",
    condition: {
      type: "service",
      specialized: "appliances"
    },
    percentBased: false,
    serviceType: "CLEANING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:46.277Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    metadata: {
      impact: "+50€",
      source: "realistic_seed_2025",
      display: {
        icon: "🧹",
        group: "service",
        priority: 6,
        description_short: "Four, frigo, lave-vaisselle, micro-ondes"
      },
      category_frontend: "service"
    }
  },
  {
    id: "c8b12ff6-f3fe-4519-8a8f-83c9987a44aa",
    name: "Nettoyage tapis et moquettes",
    description: "Injection-extraction, traitement taches",
    value: 60,
    isActive: true,
    category: "FIXED",
    condition: {
      type: "service",
      specialized: "carpet"
    },
    percentBased: false,
    serviceType: "CLEANING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:46.246Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    metadata: {
      impact: "+60€",
      source: "realistic_seed_2025",
      display: {
        icon: "🧹",
        group: "service",
        priority: 6,
        description_short: "Injection-extraction, traitement taches"
      },
      category_frontend: "service"
    }
  },
  {
    id: "5c2ae204-c271-428b-9251-ef27072c15ec",
    name: "Nettoyage vitres complet",
    description: "Toutes vitres accessibles, produits anti-traces",
    value: 40,
    isActive: true,
    category: "FIXED",
    condition: {
      type: "service",
      specialized: "windows"
    },
    percentBased: false,
    serviceType: "CLEANING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:46.261Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    metadata: {
      impact: "+40€",
      source: "realistic_seed_2025",
      display: {
        icon: "🧹",
        group: "service",
        priority: 6,
        description_short: "Toutes vitres accessibles, produits anti-traces"
      },
      category_frontend: "service"
    }
  },
  {
    id: "f73b5754-5865-465b-b366-861e429d7801",
    name: "Protocole sanitaire renforcé",
    description: "Désinfection selon protocoles sanitaires",
    value: 30,
    isActive: true,
    category: "FIXED",
    condition: {
      type: "service",
      disinfection: "covid"
    },
    percentBased: false,
    serviceType: "CLEANING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:46.308Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    metadata: {
      impact: "+30€",
      source: "realistic_seed_2025",
      display: {
        icon: "📋",
        group: "service",
        priority: 6,
        description_short: "Désinfection selon protocoles sanitaires"
      },
      category_frontend: "service"
    }
  },
  {
    id: "deff0691-fd7f-4930-8a8e-3ab96555ac9e",
    name: "Rangement et organisation",
    description: "Tri, rangement optimisé, étiquetage",
    value: 60,
    isActive: true,
    category: "FIXED",
    condition: {
      type: "service",
      maintenance: "organization"
    },
    percentBased: false,
    serviceType: "CLEANING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:46.377Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    metadata: {
      impact: "+60€",
      source: "realistic_seed_2025",
      display: {
        icon: "🗄️",
        group: "service",
        priority: 6,
        description_short: "Tri, rangement optimisé, étiquetage"
      },
      category_frontend: "service"
    }
  },
  {
    id: "1dd42931-8314-4a0d-8b6d-bbefeece6d2d",
    name: "Réapprovisionnement produits",
    description: "Achat et approvisionnement produits ménagers",
    value: 20,
    isActive: true,
    category: "FIXED",
    condition: {
      type: "service",
      logistics: "supply"
    },
    percentBased: false,
    serviceType: "CLEANING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:46.400Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    metadata: {
      impact: "+20€",
      source: "realistic_seed_2025",
      display: {
        icon: "📋",
        group: "service",
        priority: 6,
        description_short: "Achat et approvisionnement produits ménagers"
      },
      category_frontend: "service"
    }
  },
  {
    id: "73d0f2a4-c8dc-47bd-99dc-573c4e4c3846",
    name: "Traitement anti-allergènes",
    description: "Produits hypoallergéniques, acariens",
    value: 45,
    isActive: true,
    category: "FIXED",
    condition: {
      type: "service",
      disinfection: "allergen"
    },
    percentBased: false,
    serviceType: "CLEANING",
    ruleType: "BUSINESS",
    priority: 100,
    validFrom: new Date("2025-10-15T14:39:46.325Z"),
    validTo: null,
    tags: [
      "fixed"
    ],
    metadata: {
      impact: "+45€",
      source: "realistic_seed_2025",
      display: {
        icon: "📋",
        group: "service",
        priority: 6,
        description_short: "Produits hypoallergéniques, acariens"
      },
      category_frontend: "service"
    }
  }
];

/**
 * ✅ TOUS LES ITEMS NETTOYAGE
 * Total: 38 items
 */
export const allCleaningItemsFallback = [
  ...cleaningConstraintsFallback,
  ...cleaningServicesFallback
];
