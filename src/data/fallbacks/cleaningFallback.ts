/**
 * ============================================================================
 * FALLBACK CLEANING - Données générées automatiquement
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
 * ✅ CONTRAINTES NETTOYAGE
 * Total: 25 contraintes
 */
export const cleaningConstraintsFallback: Constraint[] = [
  {
    id: "rule_cmg29sh63000xca8kwkk6isr6",
    name: "Absence d'ascenseur",
    description: "Transport matériel par escaliers",
    category: "surcharge",
    icon: "🏢",
    type: "constraint",
    value: 15,
    impact: "+15€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sh6p000yca8kfbt4qwhz",
    name: "Accès difficile au bâtiment",
    description: "Codes, digicode, interphone complexe",
    category: "surcharge",
    icon: "⚠️",
    type: "constraint",
    value: 10,
    impact: "+10€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sh8r0012ca8kxgv8cmea",
    name: "Allergies signalées",
    description: "Produits hypoallergéniques, précautions spéciales",
    category: "surcharge",
    icon: "🤧",
    type: "constraint",
    value: 20,
    impact: "+20€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sh79000zca8kfwzgm3mp",
    name: "Contrôle de sécurité strict",
    description: "Badge, gardien, vérifications d'identité",
    category: "surcharge",
    icon: "⚠️",
    type: "constraint",
    value: 15,
    impact: "+15€",
    autoDetection: false
  },
  {
    id: "rule_cmg29shai0015ca8k3hjumiq7",
    name: "Créneau horaire spécifique",
    description: "Disponibilité réduite, contraintes client",
    category: "surcharge",
    icon: "⚠️",
    type: "constraint",
    value: 20,
    impact: "+20€",
    autoDetection: false
  },
  {
    id: "rule_cmg29she2001cca8ka1lkt0rk",
    name: "Dégâts des eaux récents",
    description: "Humidité, moisissures potentielles, équipement spécial",
    category: "surcharge",
    icon: "⚠️",
    type: "constraint",
    value: 80,
    impact: "+80€",
    autoDetection: false
  },
  {
    id: "rule_cmg29shhf001jca8kdyd56rk2",
    name: "Équipement industriel requis",
    description: "Mono-brosse, injecteur-extracteur, haute pression",
    category: "surcharge",
    icon: "⚠️",
    type: "constraint",
    value: 60,
    impact: "+60€",
    autoDetection: false
  },
  {
    id: "rule_cmg29shf1001eca8ktg2t57cb",
    name: "Espace très restreint",
    description: "Meubles encombrants, accès difficile",
    category: "surcharge",
    icon: "⚠️",
    type: "constraint",
    value: 25,
    impact: "+25€",
    autoDetection: false
  },
  {
    id: "rule_cmg29shay0016ca8k7fx0gjey",
    name: "Intervention matinale",
    description: "Majoration horaires atypiques (avant 8h)",
    category: "surcharge",
    icon: "⚠️",
    type: "constraint",
    value: 25,
    impact: "+25€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sh9x0014ca8ksk44hvqq",
    name: "Meubles lourds à déplacer",
    description: "Mobilier encombrant nécessitant 2 personnes",
    category: "surcharge",
    icon: "⚠️",
    type: "constraint",
    value: 30,
    impact: "+30€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sh990013ca8kthw9evjf",
    name: "Objets fragiles/précieux",
    description: "Antiquités, œuvres d'art, manipulation délicate",
    category: "surcharge",
    icon: "⚠️",
    type: "constraint",
    value: 25,
    impact: "+25€",
    autoDetection: false
  },
  {
    id: "rule_cmg29shg1001gca8ke3u7wbpy",
    name: "Pas d'accès à l'eau",
    description: "Approvisionnement eau, équipement autonome",
    category: "surcharge",
    icon: "⚠️",
    type: "constraint",
    value: 50,
    impact: "+50€",
    autoDetection: false
  },
  {
    id: "rule_cmg29shgh001hca8k6qif7yw7",
    name: "Pas d'électricité",
    description: "Matériel sur batterie, éclairage portatif",
    category: "surcharge",
    icon: "⚠️",
    type: "constraint",
    value: 40,
    impact: "+40€",
    autoDetection: false
  },
  {
    id: "rule_cmg29shdm001bca8kx5k0rke2",
    name: "Post-construction/travaux",
    description: "Poussière, gravats, matériel renforcé",
    category: "surcharge",
    icon: "⚠️",
    type: "constraint",
    value: 60,
    impact: "+60€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sh7s0010ca8kzuv4mvm3",
    name: "Présence d'animaux",
    description: "Chiens, chats, poils, produits adaptés nécessaires",
    category: "surcharge",
    icon: "🐕",
    type: "constraint",
    value: 10,
    impact: "+10€",
    autoDetection: false
  },
  {
    id: "rule_cmg29shek001dca8k02geo3ca",
    name: "Présence de moisissure",
    description: "Traitement antifongique, EPI spéciaux",
    category: "surcharge",
    icon: "⚠️",
    type: "constraint",
    value: 100,
    impact: "+100€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sh8a0011ca8khwq197yw",
    name: "Présence d'enfants",
    description: "Produits écologiques, sécurité renforcée",
    category: "surcharge",
    icon: "⚠️",
    type: "constraint",
    value: 15,
    impact: "+15€",
    autoDetection: false
  },
  {
    id: "rule_cmg29shgy001ica8k34p5m6gv",
    name: "Produits spécifiques requis",
    description: "Produits professionnels, détachants spéciaux",
    category: "surcharge",
    icon: "⚠️",
    type: "constraint",
    value: 30,
    impact: "+30€",
    autoDetection: false
  },
  {
    id: "rule_cmg29shd1001aca8kxp0gk583",
    name: "Saleté importante/tenace",
    description: "Nettoyage intensif, temps supplémentaire",
    category: "surcharge",
    icon: "⚠️",
    type: "constraint",
    value: 40,
    impact: "+40€",
    autoDetection: false
  },
  {
    id: "rule_cmg29shcc0019ca8k9mqiul70",
    name: "Service d'urgence",
    description: "Intervention d'urgence, mobilisation rapide",
    category: "surcharge",
    icon: "🚨",
    type: "constraint",
    value: 50,
    impact: "+50€",
    autoDetection: false
  },
  {
    id: "rule_cmg29shbe0017ca8kiw4bigh1",
    name: "Service en soirée",
    description: "Majoration horaires atypiques (après 18h)",
    category: "surcharge",
    icon: "⚠️",
    type: "constraint",
    value: 30,
    impact: "+30€",
    autoDetection: false
  },
  {
    id: "rule_cmg29shbv0018ca8kojxfph1a",
    name: "Service weekend",
    description: "Samedi/dimanche, majoration weekend",
    category: "surcharge",
    icon: "⚠️",
    type: "constraint",
    value: 40,
    impact: "+40€",
    autoDetection: false
  },
  {
    id: "rule_cmg29shfk001fca8kzxbzzzzy",
    name: "Situation d'accumulation",
    description: "Syndrome de Diogène, tri préalable nécessaire",
    category: "surcharge",
    icon: "⚠️",
    type: "constraint",
    value: 150,
    impact: "+150€",
    autoDetection: false
  },
  {
    id: "rule_cmg29sh5l000wca8k97v488xd",
    name: "Stationnement limité ou payant",
    description: "Difficulté de stationnement, frais supplémentaires possibles",
    category: "surcharge",
    icon: "🅿️",
    type: "constraint",
    value: 10,
    impact: "+10€",
    autoDetection: false
  },
  {
    id: "rule_cmg29shhu001kca8kw86v5l4j",
    name: "Travail en hauteur",
    description: "Échafaudage, harnais, nettoyage vitres hautes",
    category: "surcharge",
    icon: "⚠️",
    type: "constraint",
    value: 80,
    impact: "+80€",
    autoDetection: false
  }
];

/**
 * ✅ SERVICES NETTOYAGE
 * Total: 13 services
 */
export const cleaningServicesFallback: Constraint[] = [
  {
    id: "rule_cmg29shkn001pca8kopzxqpvn",
    name: "Désinfection complète",
    description: "Traitement virucide, surfaces contact",
    category: "fixed",
    icon: "🦠",
    type: "service",
    value: 70,
    impact: "+70€",
    autoDetection: false
  },
  {
    id: "rule_cmg29shm2001sca8kl2y21ymp",
    name: "Entretien mobilier",
    description: "Nourrissage cuir, cirage bois, protection",
    category: "fixed",
    icon: "🧽",
    type: "service",
    value: 35,
    impact: "+35€",
    autoDetection: false
  },
  {
    id: "rule_cmg29shnv001wca8k5fks1t0s",
    name: "Évacuation déchets",
    description: "Tri sélectif, évacuation selon réglementation",
    category: "fixed",
    icon: "🧽",
    type: "service",
    value: 40,
    impact: "+40€",
    autoDetection: false
  },
  {
    id: "rule_cmg29shoa001xca8k2virkx9g",
    name: "Gestion trousseau de clés",
    description: "Service récupération/dépôt clés sécurisé",
    category: "fixed",
    icon: "🧽",
    type: "service",
    value: 15,
    impact: "+15€",
    autoDetection: false
  },
  {
    id: "rule_cmg29shib001lca8kptjnyu62",
    name: "Grand nettoyage de printemps",
    description: "Nettoyage complet incluant placards, électroménager",
    category: "fixed",
    icon: "🌸",
    type: "service",
    value: 80,
    impact: "+80€",
    autoDetection: false
  },
  {
    id: "rule_cmg29shmi001tca8kcq5anxhp",
    name: "Nettoyage argenterie",
    description: "Produits spécialisés métaux précieux",
    category: "fixed",
    icon: "🧽",
    type: "service",
    value: 25,
    impact: "+25€",
    autoDetection: false
  },
  {
    id: "rule_cmg29shk5001oca8k8rrk2oby",
    name: "Nettoyage électroménager",
    description: "Four, frigo, lave-vaisselle, micro-ondes",
    category: "fixed",
    icon: "🧽",
    type: "service",
    value: 50,
    impact: "+50€",
    autoDetection: false
  },
  {
    id: "rule_cmg29shir001mca8kuanq5t2j",
    name: "Nettoyage tapis et moquettes",
    description: "Injection-extraction, traitement taches",
    category: "fixed",
    icon: "🧽",
    type: "service",
    value: 60,
    impact: "+60€",
    autoDetection: false
  },
  {
    id: "rule_cmg29shji001nca8k287qhzc1",
    name: "Nettoyage vitres complet",
    description: "Toutes vitres accessibles, produits anti-traces",
    category: "fixed",
    icon: "🪟",
    type: "service",
    value: 40,
    impact: "+40€",
    autoDetection: false
  },
  {
    id: "rule_cmg29shl5001qca8kvo609ug5",
    name: "Protocole sanitaire renforcé",
    description: "Désinfection selon protocoles sanitaires",
    category: "fixed",
    icon: "🧽",
    type: "service",
    value: 30,
    impact: "+30€",
    autoDetection: false
  },
  {
    id: "rule_cmg29shmz001uca8k2yt8cba8",
    name: "Rangement et organisation",
    description: "Tri, rangement optimisé, étiquetage",
    category: "fixed",
    icon: "🧽",
    type: "service",
    value: 60,
    impact: "+60€",
    autoDetection: false
  },
  {
    id: "rule_cmg29shne001vca8k9dqzf54l",
    name: "Réapprovisionnement produits",
    description: "Achat et approvisionnement produits ménagers",
    category: "fixed",
    icon: "🧽",
    type: "service",
    value: 20,
    impact: "+20€",
    autoDetection: false
  },
  {
    id: "rule_cmg29shlm001rca8ktkq626ry",
    name: "Traitement anti-allergènes",
    description: "Produits hypoallergéniques, acariens",
    category: "fixed",
    icon: "🧽",
    type: "service",
    value: 45,
    impact: "+45€",
    autoDetection: false
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
