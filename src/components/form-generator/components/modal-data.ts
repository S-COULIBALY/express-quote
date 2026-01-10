/**
 * Données statiques pour les CONTRAINTES D'ACCÈS uniquement
 *
 * Les services et fournitures ont été déplacés vers :
 * - src/config/services-catalog.ts (source unique)
 *
 * Ce fichier ne contient plus que les 16 contraintes d'accès
 * qui impactent le prix en pourcentage.
 */

export interface AccessConstraint {
  id: string;
  name: string;
  description: string;
  value: number; // Impact en %
  percentBased?: boolean; // True si l'impact est en pourcentage
  serviceType: 'MOVING';
  scope: 'GLOBAL' | 'PICKUP' | 'DELIVERY' | 'BOTH';
  metadata: {
    impact: string;
    category_frontend?: string; // 'constraint' for access constraints
    display: {
      icon: string;
      priority: number;
      group: string;
      description_short?: string;
    };
  };
}

/**
 * 16 CONTRAINTES D'ACCÈS
 * Ces contraintes impactent le prix en pourcentage
 */
export const ACCESS_CONSTRAINTS: AccessConstraint[] = [
  // Groupe : Accès véhicule
  {
    id: 'constraint-1',
    name: 'Rue étroite ou inaccessible au camion',
    description: 'Camion ne peut pas accéder, portage supplémentaire',
    value: 9,
    percentBased: true,
    serviceType: 'MOVING',
    scope: 'BOTH',
    metadata: {
      impact: '+9%',
      category_frontend: 'constraint',
      display: {
        icon: '🚚',
        priority: 1,
        group: 'vehicle_access',
        description_short: 'Camion ne peut pas accéder, portage supplémentaire'
      }
    }
  },
  {
    id: 'constraint-2',
    name: 'Circulation complexe',
    description: 'Temps de trajet augmenté, détours obligatoires',
    value: 6.5,
    percentBased: true,
    serviceType: 'MOVING',
    scope: 'GLOBAL',
    metadata: {
      impact: '+6.5%',
      category_frontend: 'constraint',
      display: {
        icon: '🛣️',
        priority: 2,
        group: 'vehicle_access',
        description_short: 'Temps de trajet augmenté, détours obligatoires'
      }
    }
  },
  {
    id: 'constraint-3',
    name: 'Stationnement difficile ou payant',
    description: 'Frais de stationnement, temps supplémentaire',
    value: 7.5,
    percentBased: true,
    serviceType: 'MOVING',
    scope: 'GLOBAL',
    metadata: {
      impact: '+7.5%',
      category_frontend: 'constraint',
      display: {
        icon: '🅿️',
        priority: 3,
        group: 'vehicle_access',
        description_short: 'Frais de stationnement, temps supplémentaire'
      }
    }
  },
  {
    id: 'constraint-4',
    name: 'Zone piétonne avec restrictions',
    description: 'Autorisation mairie requise, frais administratifs',
    value: 8.5,
    percentBased: true,
    serviceType: 'MOVING',
    scope: 'BOTH',
    metadata: {
      impact: '+8.5%',
      category_frontend: 'constraint',
      display: {
        icon: '🚶',
        priority: 4,
        group: 'vehicle_access',
        description_short: 'Autorisation mairie requise, frais administratifs'
      }
    }
  },
  // Groupe : Accès bâtiment
  {
    id: 'constraint-5',
    name: 'Ascenseur en panne ou hors service',
    description: 'Transport par escaliers obligatoire',
    value: 8,
    percentBased: true,
    serviceType: 'MOVING',
    scope: 'BOTH',
    metadata: {
      impact: '+8%',
      category_frontend: 'constraint',
      display: {
        icon: '🚫',
        priority: 5,
        group: 'building_access',
        description_short: 'Transport par escaliers obligatoire'
      }
    }
  },
  {
    id: 'constraint-6',
    name: 'Ascenseur interdit pour déménagement',
    description: 'Règlement copropriété, escaliers obligatoires',
    value: 8,
    percentBased: true,
    serviceType: 'MOVING',
    scope: 'BOTH',
    metadata: {
      impact: '+8%',
      category_frontend: 'constraint',
      display: {
        icon: '🚫',
        priority: 6,
        group: 'building_access',
        description_short: 'Règlement copropriété, escaliers obligatoires'
      }
    }
  },
  {
    id: 'constraint-7',
    name: 'Ascenseur trop petit pour les meubles',
    description: 'Démontage obligatoire ou escaliers',
    value: 7.5,
    percentBased: true,
    serviceType: 'MOVING',
    scope: 'PICKUP',
    metadata: {
      impact: '+7.5%',
      category_frontend: 'constraint',
      display: {
        icon: '📦',
        priority: 7,
        group: 'building_access',
        description_short: 'Démontage obligatoire ou escaliers'
      }
    }
  },
  {
    id: 'constraint-8',
    name: 'Escalier difficile ou dangereux',
    description: 'Monte-meuble recommandé, risques élevés',
    value: 8.5,
    percentBased: true,
    serviceType: 'MOVING',
    scope: 'BOTH',
    metadata: {
      impact: '+8.5%',
      category_frontend: 'constraint',
      display: {
        icon: '⚠️',
        priority: 8,
        group: 'building_access',
        description_short: 'Monte-meuble recommandé, risques élevés'
      }
    }
  },
  {
    id: 'constraint-9',
    name: 'Couloirs étroits ou encombrés',
    description: 'Démontage supplémentaire, temps augmenté',
    value: 6.5,
    percentBased: true,
    serviceType: 'MOVING',
    scope: 'PICKUP',
    metadata: {
      impact: '+6.5%',
      category_frontend: 'constraint',
      display: {
        icon: '🚪',
        priority: 9,
        group: 'building_access',
        description_short: 'Démontage supplémentaire, temps augmenté'
      }
    }
  },
  // Groupe : Distance
  {
    id: 'constraint-10',
    name: 'Accès complexe multi-niveaux',
    description: 'Plusieurs étages à traverser, temps multiplié',
    value: 9.5,
    percentBased: true,
    serviceType: 'MOVING',
    scope: 'BOTH',
    metadata: {
      impact: '+9.5%',
      category_frontend: 'constraint',
      display: {
        icon: '🏢',
        priority: 10,
        group: 'floor_access',
        description_short: 'Plusieurs étages à traverser, temps multiplié'
      }
    }
  },
  {
    id: 'constraint-11',
    name: 'Distance de portage > 30m',
    description: 'Surcoût main d\'œuvre, navettes nécessaires',
    value: 7.8,
    percentBased: true,
    serviceType: 'MOVING',
    scope: 'BOTH',
    metadata: {
      impact: '+7.8%',
      category_frontend: 'constraint',
      display: {
        icon: '📏',
        priority: 11,
        group: 'floor_access',
        description_short: 'Surcoût main d\'œuvre, navettes nécessaires'
      }
    }
  },
  {
    id: 'constraint-12',
    name: 'Passage indirect obligatoire',
    description: 'Sortie non directe, protection sols',
    value: 8.2,
    percentBased: true,
    serviceType: 'MOVING',
    scope: 'BOTH',
    metadata: {
      impact: '+8.2%',
      category_frontend: 'constraint',
      display: {
        icon: '🔄',
        priority: 12,
        group: 'floor_access',
        description_short: 'Sortie non directe, protection sols'
      }
    }
  },
  // Groupe : Sécurité
  {
    id: 'constraint-13',
    name: 'Autorisation administrative',
    description: 'Démarches mairie, réservation voirie',
    value: 7,
    percentBased: true,
    serviceType: 'MOVING',
    scope: 'BOTH',
    metadata: {
      impact: '+7%',
      category_frontend: 'constraint',
      display: {
        icon: '📋',
        priority: 13,
        group: 'security',
        description_short: 'Démarches mairie, réservation voirie'
      }
    }
  },
  {
    id: 'constraint-14',
    name: 'Contrôle d\'accès strict',
    description: 'Autorisation préalable, badges nécessaires',
    value: 6,
    percentBased: true,
    serviceType: 'MOVING',
    scope: 'BOTH',
    metadata: {
      impact: '+6%',
      category_frontend: 'constraint',
      display: {
        icon: '🔐',
        priority: 14,
        group: 'security',
        description_short: 'Autorisation préalable, badges nécessaires'
      }
    }
  },
  {
    id: 'constraint-15',
    name: 'Restrictions horaires strictes',
    description: 'Créneaux limités, coordination complexe',
    value: 6.8,
    percentBased: true,
    serviceType: 'MOVING',
    scope: 'BOTH',
    metadata: {
      impact: '+6.8%',
      category_frontend: 'constraint',
      display: {
        icon: '⏰',
        priority: 15,
        group: 'time_constraints',
        description_short: 'Créneaux limités, coordination complexe'
      }
    }
  },
  {
    id: 'constraint-16',
    name: 'Sol fragile ou délicat',
    description: 'Protection supplémentaire obligatoire',
    value: 5.5,
    percentBased: true,
    serviceType: 'MOVING',
    scope: 'BOTH',
    metadata: {
      impact: '+5.5%',
      category_frontend: 'constraint',
      display: {
        icon: '🛡️',
        priority: 16,
        group: 'security',
        description_short: 'Protection supplémentaire obligatoire'
      }
    }
  }
];

/**
 * IDs des contraintes auto-détectées
 */
export const AUTO_DETECTED_CONSTRAINT_IDS = {
  DISTANCE_PORTAGE: 'constraint-11', // Distance de portage > 30m
};

/**
 * Alias pour compatibilité avec l'ancien code
 * @deprecated Utiliser ACCESS_CONSTRAINTS à la place
 */
export const STATIC_CONSTRAINTS = ACCESS_CONSTRAINTS;
