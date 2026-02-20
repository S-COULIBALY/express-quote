/**
 * SOURCE UNIQUE - Catalogue des Services et Fournitures Déménagement
 *
 * Ce fichier centralise toutes les définitions de services et fournitures.
 * Les prix sont alignés sur les modules de pricing (quotation-module).
 *
 * Utilisé par :
 * - Page /catalogue (affichage vitrine)
 * - Formulaire déménagement (sélection cross-selling)
 * - Modules de pricing (calcul final)
 */

// ============================================================================
// TYPES
// ============================================================================

export type ServiceCategory = "SERVICE" | "FOURNITURE" | "OPTION";

export type PricingType =
  | "FIXED" // Prix fixe en €
  | "PER_M3" // Prix par m³
  | "PER_M2" // Prix par m²
  | "PER_UNIT" // Prix par unité/pièce
  | "PER_MONTH" // Prix par mois (stockage)
  | "PERCENTAGE" // Pourcentage de la valeur
  | "CALCULATED"; // Calculé dynamiquement selon contexte

export interface ServiceDefinition {
  id: string;
  moduleId?: string; // ID correspondant dans les modules de pricing
  title: string;
  description: string;
  shortDescription?: string; // Description courte pour les cartes
  icon: string;
  category: ServiceCategory;

  // Pricing
  pricingType: PricingType;
  basePrice: number; // Prix de base (ou taux pour PER_M3, etc.)
  minPrice?: number; // Prix minimum
  maxPrice?: number; // Prix maximum
  unit?: string; // Unité d'affichage (m³, m², pièce, mois, etc.)

  // Affichage
  displayPrice?: string; // Prix affiché (ex: "À partir de 50€")
  badge?: string; // Badge optionnel (Populaire, Recommandé, etc.)
  badgeColor?: string; // Couleur du badge

  // État
  isAvailable: boolean;
  isRecommended?: boolean;
  requiresVolume?: boolean; // Nécessite le volume pour calculer le prix
  requiresSurface?: boolean; // Nécessite la surface pour calculer le prix

  // Métadonnées pour le calcul
  metadata?: {
    scope?: "PICKUP" | "DELIVERY" | "BOTH" | "GLOBAL";
    group?: string;
    priority?: number;
  };
}

export interface SupplyDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "FOURNITURE";

  // Pricing fixe pour les fournitures
  price: number;
  unit: string;

  // Contenu du pack (pour les packs)
  contents?: string[];

  // Affichage
  badge?: string;
  badgeColor?: string;

  // État
  isAvailable: boolean;

  // Recommandation selon volume
  recommendedForVolume?: {
    min: number;
    max: number;
  };
}

// ============================================================================
// SERVICES ADDITIONNELS (alignés sur modules de pricing)
// ============================================================================

export const SERVICES: ServiceDefinition[] = [
  // --- EMBALLAGE ---
  {
    id: "packing",
    moduleId: "packing-cost",
    title: "Emballage professionnel",
    description:
      "Service d'emballage complet par nos équipes qualifiées. Inclut protection et mise en carton de tous vos biens.",
    shortDescription: "Emballage complet par nos équipes",
    icon: "📦",
    category: "SERVICE",
    pricingType: "PER_M3",
    basePrice: 5, // 5€/m³ (aligné sur PackingCostModule)
    unit: "m³",
    displayPrice: "À partir de 50€",
    badge: "Populaire",
    badgeColor: "#f97316",
    isAvailable: true,
    isRecommended: true,
    requiresVolume: true,
    metadata: {
      scope: "PICKUP",
      group: "packing",
      priority: 85,
    },
  },

  // --- DÉMONTAGE / REMONTAGE ---
  {
    id: "dismantling",
    moduleId: "dismantling-cost",
    title: "Démontage de meubles",
    description:
      "Démontage professionnel de vos meubles par des techniciens qualifiés. Outillage professionnel inclus.",
    shortDescription: "Démontage par des techniciens",
    icon: "🔧",
    category: "SERVICE",
    pricingType: "CALCULATED",
    basePrice: 50, // Base 50€ + 25€/meuble complexe (aligné sur DismantlingCostModule)
    minPrice: 50,
    unit: "forfait",
    displayPrice: "À partir de 50€",
    isAvailable: true,
    metadata: {
      scope: "PICKUP",
      group: "assembly",
      priority: 86.5,
    },
  },
  {
    id: "reassembly",
    moduleId: "reassembly-cost",
    title: "Remontage de meubles",
    description:
      "Remontage garanti conforme de tous vos meubles démontés. Vérification du bon fonctionnement.",
    shortDescription: "Remontage garanti conforme",
    icon: "🔨",
    category: "SERVICE",
    pricingType: "CALCULATED",
    basePrice: 50, // Base 50€ + 25€/meuble complexe (aligné sur ReassemblyCostModule)
    minPrice: 50,
    unit: "forfait",
    displayPrice: "À partir de 50€",
    isAvailable: true,
    metadata: {
      scope: "DELIVERY",
      group: "assembly",
      priority: 86.6,
    },
  },

  // --- MANUTENTION SPÉCIALISÉE ---
  {
    id: "piano-handling",
    moduleId: "high-value-item-handling",
    title: "Transport de piano",
    description:
      "Transport spécialisé pour piano. Équipement adapté, équipe formée et assurance renforcée.",
    shortDescription: "Transport spécialisé piano",
    icon: "🎹",
    category: "SERVICE",
    pricingType: "FIXED",
    basePrice: 150, // 150€ (aligné sur HighValueItemHandlingModule)
    unit: "forfait",
    displayPrice: "150€",
    badge: "Expert",
    badgeColor: "#8b5cf6",
    isAvailable: true,
    metadata: {
      scope: "BOTH",
      group: "special_handling",
      priority: 73,
    },
  },
  {
    id: "safe-handling",
    moduleId: "high-value-item-handling",
    title: "Transport coffre-fort",
    description:
      "Manutention spécialisée pour coffres-forts. Équipement hydraulique si nécessaire.",
    shortDescription: "Manutention coffre-fort",
    icon: "🔐",
    category: "SERVICE",
    pricingType: "FIXED",
    basePrice: 200, // 200€ (aligné sur HighValueItemHandlingModule)
    unit: "forfait",
    displayPrice: "200€",
    badge: "Expert",
    badgeColor: "#8b5cf6",
    isAvailable: true,
    metadata: {
      scope: "BOTH",
      group: "special_handling",
      priority: 73,
    },
  },
  {
    id: "artwork-handling",
    moduleId: "high-value-item-handling",
    title: "Transport œuvres d'art",
    description:
      "Protection et transport spécialisé pour œuvres d'art. Caissage sur mesure disponible.",
    shortDescription: "Transport œuvres d'art",
    icon: "🎨",
    category: "SERVICE",
    pricingType: "FIXED",
    basePrice: 100, // 100€ (aligné sur HighValueItemHandlingModule)
    unit: "forfait",
    displayPrice: "100€",
    isAvailable: true,
    metadata: {
      scope: "BOTH",
      group: "special_handling",
      priority: 73,
    },
  },

  // --- NETTOYAGE ---
  {
    id: "cleaning-end",
    moduleId: "cleaning-end-cost",
    title: "Nettoyage fin de bail",
    description:
      "Nettoyage complet de votre ancien logement. Idéal pour récupérer votre dépôt de garantie.",
    shortDescription: "Nettoyage complet ancien logement",
    icon: "✨",
    category: "SERVICE",
    pricingType: "PER_M2",
    basePrice: 8, // 8€/m² (aligné sur CleaningEndCostModule)
    unit: "m²",
    displayPrice: "À partir de 80€",
    isAvailable: true,
    requiresSurface: true,
    metadata: {
      scope: "PICKUP",
      group: "cleaning",
      priority: 86,
    },
  },
  // --- MONTAGE MEUBLES NEUFS ---
  {
    id: "new-furniture-assembly",
    title: "Montage de meubles neufs",
    description:
      "Montage professionnel de vos meubles neufs (IKEA, Conforama, etc.). Outillage et visserie inclus.",
    shortDescription: "Montage meubles neufs par nos techniciens",
    icon: "🪑",
    category: "SERVICE",
    pricingType: "FIXED",
    basePrice: 80,
    unit: "forfait",
    displayPrice: "À partir de 80€",
    isAvailable: true,
    metadata: {
      scope: "DELIVERY",
      group: "assembly",
      priority: 86.7,
    },
  },

  // --- MISE AU REBUT ---
  {
    id: "waste-disposal",
    title: "Mise au rebut et gestion des déchets",
    description:
      "Évacuation et traitement de vos encombrants, meubles usagés et déchets de déménagement. Tri sélectif et recyclage assurés.",
    shortDescription: "Évacuation encombrants et déchets",
    icon: "♻️",
    category: "SERVICE",
    pricingType: "FIXED",
    basePrice: 120,
    unit: "forfait",
    displayPrice: "À partir de 120€",
    isAvailable: true,
    metadata: {
      scope: "PICKUP",
      group: "waste",
      priority: 88,
    },
  },

  // NOTE: Monte-meubles SUPPRIMÉ du catalogue
  // Géré par FurnitureLiftCheckbox dans le formulaire (par adresse avec seuils HIGH/CRITICAL)
];

// ============================================================================
// OPTIONS (Assurance, Stockage, etc.)
// ============================================================================

// NOTE: Assurance Premium SUPPRIMÉE du catalogue
// Gérée dans PaymentPriceSection (catalog-demenagement-sur-mesure/page.tsx)
// après l'affichage des scénarios multi-offres
export const OPTIONS: ServiceDefinition[] = [
  {
    id: "storage",
    moduleId: "storage-cost",
    title: "Garde-meuble temporaire",
    description:
      "Stockage sécurisé de vos biens en garde-meuble climatisé. Accès possible 24h/24.",
    shortDescription: "Stockage sécurisé climatisé",
    icon: "🏢",
    category: "OPTION",
    pricingType: "PER_M3",
    basePrice: 30, // 30€/m³/mois (aligné sur StorageCostModule)
    unit: "m³/mois",
    displayPrice: "À partir de 150€/mois",
    isAvailable: true,
    requiresVolume: true,
    metadata: {
      scope: "GLOBAL",
      group: "storage",
      priority: 87,
    },
  },
];

// ============================================================================
// FOURNITURES (Packs cartons, protections, etc.)
// ============================================================================

export const SUPPLIES: SupplyDefinition[] = [
  // --- PACKS CARTONS ---
  {
    id: "pack-cartons-studio",
    title: "Pack Cartons Studio",
    description: "20 cartons standards + 5 cartons livres + 1 rouleau scotch",
    icon: "📦",
    category: "FOURNITURE",
    price: 45,
    unit: "pack",
    contents: [
      "20 cartons standards (55x35x30cm)",
      "5 cartons livres (35x30x30cm)",
      "1 rouleau scotch 66m",
    ],
    badge: "Économique",
    badgeColor: "#f97316",
    isAvailable: true,
    recommendedForVolume: { min: 0, max: 15 },
  },
  {
    id: "pack-cartons-famille",
    title: "Pack Cartons Famille",
    description:
      "40 cartons standards + 10 cartons livres + 5 penderies + scotch",
    icon: "📦",
    category: "FOURNITURE",
    price: 89,
    unit: "pack",
    contents: [
      "40 cartons standards (55x35x30cm)",
      "10 cartons livres (35x30x30cm)",
      "5 cartons penderie",
      "2 rouleaux scotch 66m",
    ],
    badge: "Best-seller",
    badgeColor: "#10b981",
    isAvailable: true,
    recommendedForVolume: { min: 15, max: 35 },
  },
  {
    id: "pack-cartons-maison",
    title: "Pack Cartons Maison",
    description:
      "60 cartons standards + 15 cartons livres + 10 penderies + accessoires",
    icon: "📦",
    category: "FOURNITURE",
    price: 129,
    unit: "pack",
    contents: [
      "60 cartons standards (55x35x30cm)",
      "15 cartons livres (35x30x30cm)",
      "10 cartons penderie",
      "3 rouleaux scotch 66m",
      "1 marqueur indélébile",
    ],
    isAvailable: true,
    recommendedForVolume: { min: 35, max: 100 },
  },

  // --- PROTECTIONS ---
  {
    id: "papier-bulle",
    title: "Papier bulle (rouleau 50m)",
    description:
      "Protection optimale pour objets fragiles. Rouleau de 50m × 1m.",
    icon: "🫧",
    category: "FOURNITURE",
    price: 25,
    unit: "rouleau",
    isAvailable: true,
  },
  {
    id: "couvertures-protection",
    title: "Couvertures de protection (x10)",
    description:
      "Couvertures matelassées pour protéger meubles et objets volumineux.",
    icon: "🛡️",
    category: "FOURNITURE",
    price: 35,
    unit: "lot de 10",
    isAvailable: true,
  },
  {
    id: "housses-matelas-1p",
    title: "Housse matelas 1 place",
    description:
      "Housse de protection imperméable pour matelas 1 place (90×190cm).",
    icon: "🛏️",
    category: "FOURNITURE",
    price: 12,
    unit: "pièce",
    isAvailable: true,
  },
  {
    id: "housses-matelas-2p",
    title: "Housse matelas 2 places",
    description:
      "Housse de protection imperméable pour matelas 2 places (140×190cm).",
    icon: "🛏️",
    category: "FOURNITURE",
    price: 15,
    unit: "pièce",
    isAvailable: true,
  },
  {
    id: "housses-matelas-queen",
    title: "Housse matelas Queen/King",
    description:
      "Housse de protection imperméable pour grand matelas (160×200cm+).",
    icon: "🛏️",
    category: "FOURNITURE",
    price: 18,
    unit: "pièce",
    isAvailable: true,
  },
  {
    id: "film-etirable",
    title: "Film étirable (rouleau 300m)",
    description:
      "Film plastique étirable pour sécuriser tiroirs et portes de meubles.",
    icon: "🎞️",
    category: "FOURNITURE",
    price: 15,
    unit: "rouleau",
    isAvailable: true,
  },
];

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Calcule le prix d'un service selon le contexte
 */
const DAYS_PER_MONTH = 30; // Aligné sur quotation-module (modules.config)

export function calculateServicePrice(
  service: ServiceDefinition,
  context: {
    volume?: number; // m³
    surface?: number; // m²
    declaredValue?: number; // € (pour assurance)
    rooms?: number; // Nombre de pièces
    hasPiano?: boolean;
    hasBulkyFurniture?: boolean;
    storageDurationDays?: number; // Jours (pour stockage temporaire)
  },
): number {
  switch (service.pricingType) {
    case "FIXED":
      return service.basePrice;

    case "PER_M3":
      if (!context.volume) return service.minPrice ?? service.basePrice;
      // Stockage temporaire : volume × prix/m³/mois × nombre de mois (arrondi au supérieur)
      if (service.id === "storage") {
        const days = context.storageDurationDays ?? DAYS_PER_MONTH;
        const months = Math.ceil(days / DAYS_PER_MONTH);
        const price = context.volume * service.basePrice * months;
        return Math.max(price, service.minPrice ?? 0);
      }
      return Math.max(
        context.volume * service.basePrice,
        service.minPrice ?? 0,
      );

    case "PER_M2":
      if (!context.surface) return service.minPrice || service.basePrice;
      return Math.max(
        context.surface * service.basePrice,
        service.minPrice || 0,
      );

    case "PERCENTAGE":
      if (!context.declaredValue) return service.minPrice || service.basePrice;
      const calculated = context.declaredValue * (service.basePrice / 100);
      return Math.min(
        Math.max(calculated, service.minPrice || 0),
        service.maxPrice || Infinity,
      );

    case "CALCULATED":
      // Calcul spécifique selon le service
      if (service.id === "dismantling" || service.id === "reassembly") {
        let price = service.basePrice; // 50€ base
        if (context.hasBulkyFurniture) price += 40;
        if (context.rooms && context.rooms >= 4)
          price += 50; // 2 meubles complexes
        else if (context.rooms && context.rooms >= 3) price += 25; // 1 meuble complexe
        if (context.hasPiano) price += 60;
        return price;
      }
      return service.basePrice;

    default:
      return service.basePrice;
  }
}

/**
 * Recommande un pack de cartons selon le volume
 */
export function recommendSupplyPack(volume: number): SupplyDefinition | null {
  return (
    SUPPLIES.find(
      (supply) =>
        supply.recommendedForVolume &&
        volume >= supply.recommendedForVolume.min &&
        volume < supply.recommendedForVolume.max,
    ) || null
  );
}

/**
 * Récupère tous les services et options combinés
 */
export function getAllServices(): ServiceDefinition[] {
  return [...SERVICES, ...OPTIONS];
}

/**
 * Récupère un service par son ID
 */
export function getServiceById(id: string): ServiceDefinition | undefined {
  return getAllServices().find((s) => s.id === id);
}

/**
 * Récupère une fourniture par son ID
 */
export function getSupplyById(id: string): SupplyDefinition | undefined {
  return SUPPLIES.find((s) => s.id === id);
}

/**
 * Formate le prix pour l'affichage
 */
export function formatDisplayPrice(service: ServiceDefinition): string {
  if (service.displayPrice) return service.displayPrice;

  switch (service.pricingType) {
    case "FIXED":
      return `${service.basePrice}€`;
    case "PER_M3":
      return `${service.basePrice}€/m³`;
    case "PER_M2":
      return `${service.basePrice}€/m²`;
    case "PERCENTAGE":
      return `${service.basePrice}% de la valeur`;
    case "PER_MONTH":
      return `${service.basePrice}€/mois`;
    default:
      return "Sur devis";
  }
}
