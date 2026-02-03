import { CatalogData } from '@/hooks/useCatalogPreFill';

// Transformation catalogue → Service sur mesure (déménagement)
export const transformCatalogDataToDemenagementSurMesure = (catalogData: CatalogData): any => {
  const { catalogSelection, item, template } = catalogData;

  // Utiliser item si disponible, sinon fallback sur template
  const sourceData = item || template!;

  return {
    id: sourceData.id,
    name: catalogSelection.marketingTitle || 'Déménagement sur mesure',
    description: catalogSelection.marketingDescription || 'Service de déménagement personnalisé selon vos besoins',
    price: null, // Prix calculé dynamiquement selon les besoins du client
    originalPrice: null, // Pas de prix original pour les services sur mesure
    workers: null, // Nombre d'intervenants calculé selon le volume
    duration: null, // Durée calculée selon la complexité
    features: ['Service personnalisé', 'Devis adapté'],
    includes: ['Étude gratuite', 'Options modulables'],
    imagePath: (sourceData as any).imagePath,

    // Propriétés spécifiques au service sur mesure
    serviceType: 'demenagement-sur-mesure',
    isPremium: true,
    requiresVolume: true,
    requiresCustomPricing: true,
    isDynamicPricing: true, // Indique que le prix est calculé dynamiquement

    // Données catalogue pour traçabilité
    catalogId: catalogSelection.id,
    catalogCategory: catalogSelection.category,
    subcategory: catalogSelection.subcategory,
    badgeText: catalogSelection.badgeText,
    badgeColor: catalogSelection.badgeColor,
    promotionText: catalogSelection.promotionText,
    isFeatured: catalogSelection.isFeatured,
    isNewOffer: catalogSelection.isNewOffer,
    source: 'catalog' as const
  };
};

// Fonction pour obtenir l'icône selon la catégorie (utilisée par CatalogHero)
export const getCategoryIcon = (category: string, subcategory?: string): string => {
  switch (category.toUpperCase()) {
    case 'DEMENAGEMENT':
      if (subcategory === 'studio') return '🏠';
      if (subcategory === 'famille') return '👨‍👩‍👧‍👦';
      if (subcategory === 'premium') return '✨';
      return '🚚';
    case 'MENAGE':
      return '🧹';
    case 'TRANSPORT':
      return '🚛';
    case 'LIVRAISON':
      return '📦';
    default:
      return '🏠';
  }
};

// Fonction pour obtenir les couleurs selon la catégorie (utilisée par CatalogHero)
export const getCategoryColors = (category: string) => {
  switch (category.toUpperCase()) {
    case 'DEMENAGEMENT':
      return {
        primary: 'emerald',
        background: 'bg-emerald-50',
        text: 'text-emerald-600',
        border: 'border-emerald-200'
      };
    case 'MENAGE':
      return {
        primary: 'blue',
        background: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-200'
      };
    case 'TRANSPORT':
      return {
        primary: 'purple',
        background: 'bg-purple-50',
        text: 'text-purple-600',
        border: 'border-purple-200'
      };
    case 'LIVRAISON':
      return {
        primary: 'orange',
        background: 'bg-orange-50',
        text: 'text-orange-600',
        border: 'border-orange-200'
      };
    default:
      return {
        primary: 'gray',
        background: 'bg-gray-50',
        text: 'text-gray-600',
        border: 'border-gray-200'
      };
  }
};
