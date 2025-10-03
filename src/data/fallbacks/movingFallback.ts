/**
 * ============================================================================
 * FALLBACK MOVING - Données générées automatiquement
 * ============================================================================
 *
 * 🤖 GÉNÉRÉ AUTOMATIQUEMENT le 2025-10-02
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
  category?: string;
  icon?: string;
  type: 'constraint' | 'service';
  value?: number;
  impact?: string;
  autoDetection?: boolean;
}

/**
 * ✅ CONTRAINTES DÉMÉNAGEMENT
 * Total: 16 contraintes
 */
export const movingConstraintsFallback: Constraint[] = [
  {
    id: "rule_cmg29sgv5000bca8kppngnob9",
    name: "Accès complexe multi-niveaux",
    description: "Plusieurs étages à traverser, temps multiplié",
    category: "surcharge",
    icon: "⚠️",
    type: "constraint",
    value: 50,
    impact: "+50€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sgri0004ca8km36457ai",
    name: "Ascenseur en panne ou hors service",
    description: "Transport par escaliers obligatoire",
    category: "surcharge",
    icon: "🏢",
    type: "constraint",
    value: 35,
    impact: "+35€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sgsg0006ca8k9r3gli1c",
    name: "Ascenseur interdit pour déménagement",
    description: "Règlement copropriété, escaliers obligatoires",
    category: "surcharge",
    icon: "🏢",
    type: "constraint",
    value: 35,
    impact: "+35€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sgs00005ca8kdmeb38o7",
    name: "Ascenseur trop petit pour les meubles",
    description: "Démontage obligatoire ou escaliers",
    category: "surcharge",
    icon: "🏢",
    type: "constraint",
    value: 30,
    impact: "+30€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sgw5000dca8k1f4hvtzr",
    name: "Autorisation administrative",
    description: "Démarches mairie, réservation voirie",
    category: "surcharge",
    icon: "⚠️",
    type: "constraint",
    value: 30,
    impact: "+30€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sgr20003ca8k3om0rewh",
    name: "Circulation complexe",
    description: "Temps de trajet augmenté, détours obligatoires",
    category: "surcharge",
    icon: "🚦",
    type: "constraint",
    value: 25,
    impact: "+25€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sgvn000cca8k8skux6qm",
    name: "Contrôle d'accès strict",
    description: "Autorisation préalable, badges nécessaires",
    category: "surcharge",
    icon: "⚠️",
    type: "constraint",
    value: 20,
    impact: "+20€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sgti0008ca8kgrxyfc5l",
    name: "Couloirs étroits ou encombrés",
    description: "Démontage supplémentaire, temps augmenté",
    category: "surcharge",
    icon: "⚠️",
    type: "constraint",
    value: 25,
    impact: "+25€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sgu20009ca8kral60drp",
    name: "Distance de portage > 30m",
    description: "Surcoût main d'œuvre, navettes nécessaires",
    category: "surcharge",
    icon: "📏",
    type: "constraint",
    value: 35,
    impact: "+35€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sgsz0007ca8kvv5fuypo",
    name: "Escalier difficile ou dangereux",
    description: "Monte-meuble recommandé, risques élevés",
    category: "surcharge",
    icon: "🪜",
    type: "constraint",
    value: 40,
    impact: "+40€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sgum000aca8k142g7mox",
    name: "Passage indirect obligatoire",
    description: "Sortie non directe, protection sols",
    category: "surcharge",
    icon: "⚠️",
    type: "constraint",
    value: 40,
    impact: "+40€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sgwn000eca8koo5b8hl6",
    name: "Restrictions horaires strictes",
    description: "Créneaux limités, coordination complexe",
    category: "surcharge",
    icon: "⚠️",
    type: "constraint",
    value: 25,
    impact: "+25€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sgpz0001ca8kggefoo5a",
    name: "Rue étroite ou inaccessible au camion",
    description: "Camion ne peut pas accéder, portage supplémentaire",
    category: "surcharge",
    icon: "🚧",
    type: "constraint",
    value: 50,
    impact: "+50€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sgx3000fca8kivtsn3zy",
    name: "Sol fragile ou délicat",
    description: "Protection supplémentaire obligatoire",
    category: "surcharge",
    icon: "⚠️",
    type: "constraint",
    value: 15,
    impact: "+15€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sgqj0002ca8kyfqdesky",
    name: "Stationnement difficile ou payant",
    description: "Frais de stationnement, temps supplémentaire",
    category: "surcharge",
    icon: "🅿️",
    type: "constraint",
    value: 30,
    impact: "+30€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sgny0000ca8ko44rb67q",
    name: "Zone piétonne avec restrictions",
    description: "Autorisation mairie requise, frais administratifs",
    category: "surcharge",
    icon: "🚶",
    type: "constraint",
    value: 40,
    impact: "+40€",
    autoDetection: false
  }
];

/**
 * ✅ SERVICES DÉMÉNAGEMENT
 * Total: 16 services
 */
export const movingServicesFallback: Constraint[] = [
  {
    id: "rule_cmg29sh0q000mca8kenvdzew2",
    name: "Déballage professionnel arrivée",
    description: "Déballage + nettoyage + évacuation cartons",
    category: "fixed",
    icon: "📭",
    type: "service",
    value: 100,
    impact: "+100€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sgyk000ica8kewogwhzz",
    name: "Démontage de meubles",
    description: "Temps spécialisé inclus, outillage pro",
    category: "fixed",
    icon: "🔧",
    type: "service",
    value: 80,
    impact: "+80€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sh1t000oca8kkr27sz2n",
    name: "Emballage œuvres d'art",
    description: "Caissage sur mesure, protection maximale",
    category: "fixed",
    icon: "📦",
    type: "service",
    value: 200,
    impact: "+200€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sh04000lca8kbkgd4vkh",
    name: "Emballage professionnel départ",
    description: "Équipe spécialisée, matériel professionnel",
    category: "fixed",
    icon: "📦",
    type: "service",
    value: 120,
    impact: "+120€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sh1a000nca8kkla7sipm",
    name: "Fournitures d'emballage",
    description: "Cartons renforcés, papier bulle, sangles pro",
    category: "fixed",
    icon: "📦",
    type: "service",
    value: 50,
    impact: "+50€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sh4l000uca8kogwi6hzv",
    name: "Gestion administrative",
    description: "Résiliation/transfert tous contrats",
    category: "fixed",
    icon: "🔧",
    type: "service",
    value: 60,
    impact: "+60€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sh36000rca8k3wshjj80",
    name: "Inventaire avec photos",
    description: "État des lieux photographique complet",
    category: "fixed",
    icon: "🔧",
    type: "service",
    value: 80,
    impact: "+80€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sgy3000hca8kj7gy2939",
    name: "Meubles encombrants",
    description: "Armoires, canapés d'angle, piano droit",
    category: "fixed",
    icon: "🔧",
    type: "service",
    value: 150,
    impact: "+150€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sgxm000gca8kldocckf9",
    name: "Monte-meuble",
    description: "Location monte-meuble 200-400€, ajouté automatiquement",
    category: "fixed",
    icon: "🔧",
    type: "service",
    value: 300,
    impact: "+300€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sh42000tca8kz0so0pj2",
    name: "Nettoyage après déménagement",
    description: "Nettoyage complet logement vide",
    category: "fixed",
    icon: "🧹",
    type: "service",
    value: 120,
    impact: "+120€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sh2a000pca8k3ftxe8wd",
    name: "Objets fragiles/précieux",
    description: "Emballage renforcé + assurance tous risques",
    category: "fixed",
    icon: "🔧",
    type: "service",
    value: 180,
    impact: "+180€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sh2q000qca8keokczf4j",
    name: "Objets très lourds",
    description: "Équipement hydraulique, sangles renforcées",
    category: "fixed",
    icon: "🔧",
    type: "service",
    value: 200,
    impact: "+200€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sgz2000jca8ki0zr7t7r",
    name: "Remontage de meubles",
    description: "Remontage garanti conforme",
    category: "fixed",
    icon: "🔨",
    type: "service",
    value: 100,
    impact: "+100€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sh3m000sca8k62erslsp",
    name: "Stockage temporaire",
    description: "Garde-meuble climatisé, accès 24h/24",
    category: "fixed",
    icon: "🏪",
    type: "service",
    value: 150,
    impact: "+150€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sh53000vca8kp5eh7brd",
    name: "Transport animaux",
    description: "Véhicule adapté, cage de transport",
    category: "fixed",
    icon: "🔧",
    type: "service",
    value: 80,
    impact: "+80€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sgzl000kca8kr4aj9enq",
    name: "Transport piano",
    description: "Équipement spécialisé, assurance renforcée",
    category: "fixed",
    icon: "🎹",
    type: "service",
    value: 250,
    impact: "+250€",
    autoDetection: false
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
