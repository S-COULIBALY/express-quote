import { CatalogData } from '@/hooks/useCatalogPreFill';
import { CatalogueMovingItem, CatalogueCleaningItem, CatalogueDeliveryItem } from '@/types/booking';

/** Seul le service déménagement sur mesure est actif. Toutes les catégories redirigent vers ce preset. */
export const getPresetForCategory = (category: string, subcategory?: string): 'catalogueMovingItem-service' | 'catalogueCleaningItem-service' | 'catalogueDeliveryItem-service' | 'demenagement-sur-mesure' | 'menage-sur-mesure' => {
  return 'demenagement-sur-mesure';
};

// Transformation catalogue → CatalogueMovingItem (pour déménagement/transport)
export const transformCatalogDataToCatalogueMovingItem = (catalogData: CatalogData): CatalogueMovingItem | null => {
  const { catalogSelection, item, template } = catalogData;

  // Vérification: item ou template requis pour packs catalogue
  if (!item && !template) {
    console.warn('transformCatalogDataToCatalogueMovingItem: ni item ni template disponible');
    return null;
  }

  // Utiliser item si disponible, sinon fallback sur template
  const sourceData = item || template!;

  const transformedData = {
    id: sourceData.id,
    bookingId: '', // Sera généré lors de la création du booking
    name: catalogSelection.marketingTitle || sourceData.name,
    description: catalogSelection.marketingDescription || sourceData.description || '',
    price: catalogSelection.marketingPrice || sourceData.price,
    originalPrice: catalogSelection.originalPrice,
    duration: sourceData.duration || 1,
    workers: sourceData.workers || 2,
    features: sourceData.features || [],
    includedDistance: sourceData.includedDistance || 20,
    distanceUnit: sourceData.distanceUnit || 'km',
    includes: sourceData.includes || [
      `${sourceData.duration || 1} jour${(sourceData.duration || 1) > 1 ? 's' : ''} de déménagement`,
      `${sourceData.workers || 2} déménageur${(sourceData.workers || 2) > 1 ? 's' : ''} professionnel${(sourceData.workers || 2) > 1 ? 's' : ''}`,
      `${sourceData.includedDistance || 20} km inclus`,
      "Matériel de déménagement fourni",
      "Assurance transport incluse"
    ],
    popular: (sourceData as any).popular || catalogSelection.isFeatured,
    imagePath: (sourceData as any).imagePath,
    
    // Propriétés requises pour Pack
    scheduledDate: new Date(), // Date par défaut - sera modifiée par l'utilisateur
    pickupAddress: '', // Sera rempli par l'utilisateur
    deliveryAddress: '', // Sera rempli par l'utilisateur
    additionalInfo: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    
    // Données catalogue pour traçabilité (propriétés existantes dans Pack)
    catalogId: catalogSelection.id,
    catalogCategory: catalogSelection.category,
    subcategory: catalogSelection.subcategory,
    badgeText: catalogSelection.badgeText,
    badgeColor: catalogSelection.badgeColor,
    promotionText: catalogSelection.promotionText,
    isFeatured: catalogSelection.isFeatured,
    isNewOffer: catalogSelection.isNewOffer,
    source: 'catalog' as const,
    
    // ✅ Ajout du snapshot pour la comparaison PACKING non modifié
    __presetSnapshot: {
      // ✅ CORRECTION : Pas de volume pour PACKING (pas de volume par défaut dans l'item)
      distance: sourceData.includedDistance || 20,
      workers: sourceData.workers || 2,
      duration: sourceData.duration || 1,
      // ✅ AJOUT : Données de promotion pour la comparaison
      promotionCode: catalogSelection.promotionCode,
      promotionValue: catalogSelection.promotionValue,
      promotionType: catalogSelection.promotionType,
      isPromotionActive: catalogSelection.isPromotionActive
    },
    
    // ✅ Ajout des données de promotion
    promotionCode: catalogSelection.promotionCode,
    promotionValue: catalogSelection.promotionValue,
    promotionType: catalogSelection.promotionType,
    isPromotionActive: catalogSelection.isPromotionActive
  };

  return transformedData;
};

// Transformation catalogue → CatalogueCleaningItem (pour nettoyage)
export const transformCatalogDataToCatalogueCleaningItem = (catalogData: CatalogData): CatalogueCleaningItem => {
  const { catalogSelection, item, template } = catalogData;
  
  // Utiliser item si disponible, sinon fallback sur template
  const sourceData = item || template!;
  
  const transformedData = {
    id: sourceData.id,
    bookingId: '', // Sera généré lors de la création du booking
    name: catalogSelection.marketingTitle || sourceData.name,
    description: catalogSelection.marketingDescription || sourceData.description || '',
    price: catalogSelection.marketingPrice || sourceData.price,
    originalPrice: catalogSelection.originalPrice,
    duration: sourceData.duration || 2, // en heures pour services
    workers: sourceData.workers || 1,
    features: sourceData.features || [],
    includes: sourceData.includes || [
      `${sourceData.duration || 2} heure${(sourceData.duration || 2) > 1 ? 's' : ''} de service`,
      `${sourceData.workers || 1} professionnel${(sourceData.workers || 1) > 1 ? 's' : ''} qualifié${(sourceData.workers || 1) > 1 ? 's' : ''}`,
      "Matériel professionnel inclus",
      "Assurance responsabilité civile"
    ],
    imagePath: (sourceData as any).imagePath,
    
    // Propriétés requises pour Service
    categoryId: catalogSelection.category, // Utiliser la catégorie comme categoryId
    scheduledDate: new Date(), // Date par défaut - sera modifiée par l'utilisateur
    location: '', // Sera rempli par l'utilisateur
    additionalInfo: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    
    // Données catalogue pour traçabilité (propriétés existantes dans Service)
    
    // ✅ Ajout du snapshot pour la comparaison CLEANING non modifié
    __presetSnapshot: {
      volume: 0, // Pas de volume pour le nettoyage
      distance: 0, // Pas de distance pour le nettoyage
      workers: sourceData.workers || 1,
      duration: sourceData.duration || 2
    },
    
    // ✅ Ajout des données de promotion
    promotionCode: catalogSelection.promotionCode,
    promotionValue: catalogSelection.promotionValue,
    promotionType: catalogSelection.promotionType,
    isPromotionActive: catalogSelection.isPromotionActive
  };

  return transformedData;
};

// Transformation catalogue → CatalogueDeliveryItem (pour livraison)
export const transformCatalogDataToCatalogueDeliveryItem = (catalogData: CatalogData): CatalogueDeliveryItem => {
  const { catalogSelection, item, template } = catalogData;
  
  // Utiliser item si disponible, sinon fallback sur template
  const sourceData = item || template!;
  
  return {
    id: sourceData.id,
    bookingId: '', // Sera généré lors de la création du booking
    name: catalogSelection.marketingTitle || sourceData.name,
    description: catalogSelection.marketingDescription || sourceData.description || '',
    price: catalogSelection.marketingPrice || sourceData.price,
    originalPrice: catalogSelection.originalPrice,
    features: sourceData.features || [],
    includes: sourceData.includes || [
      "Transport sécurisé",
      "Suivi en temps réel", 
      "Assurance colis",
      "Notification SMS"
    ],
    imagePath: (sourceData as any).imagePath,
    
    // Propriétés spécifiques à la livraison avec valeurs par défaut
    packageType: 'colis', // Sera modifié par l'utilisateur
    weight: undefined, // Sera rempli par l'utilisateur
    isFragile: false,
    pickupAddress: '', // Sera rempli par l'utilisateur
    deliveryAddress: '', // Sera rempli par l'utilisateur
    pickupTime: '', // Sera rempli par l'utilisateur
    deliveryTime: '', // Sera rempli par l'utilisateur
    scheduledDate: new Date(), // Date par défaut - sera modifiée par l'utilisateur
    additionalInfo: '',
    
    // Données catalogue pour traçabilité
    catalogId: catalogSelection.id,
    catalogCategory: catalogSelection.category,
    subcategory: catalogSelection.subcategory,
    badgeText: catalogSelection.badgeText,
    badgeColor: catalogSelection.badgeColor,
    promotionText: catalogSelection.promotionText,
    isFeatured: catalogSelection.isFeatured,
    isNewOffer: catalogSelection.isNewOffer,
    source: 'catalog' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    
    // ✅ Ajout des données de promotion
    promotionCode: catalogSelection.promotionCode,
    promotionValue: catalogSelection.promotionValue,
    promotionType: catalogSelection.promotionType,
    isPromotionActive: catalogSelection.isPromotionActive
  };
};

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

// Transformation catalogue → Service sur mesure (ménage)
export const transformCatalogDataToMenageSurMesure = (catalogData: CatalogData): any => {
  const { catalogSelection, item, template } = catalogData;
  
  // Utiliser item si disponible, sinon fallback sur template
  const sourceData = item || template!;
  
  return {
    id: sourceData.id,
    name: catalogSelection.marketingTitle || 'Ménage sur mesure',
    description: catalogSelection.marketingDescription || 'Service de nettoyage personnalisé selon vos besoins',
    price: null, // Prix calculé dynamiquement selon les besoins du client
    originalPrice: null, // Pas de prix original pour les services sur mesure
    workers: null, // Nombre d'intervenants calculé selon la surface
    duration: null, // Durée calculée selon la complexité
    features: ['Service personnalisé', 'Devis adapté'],
    includes: ['Étude gratuite', 'Options modulables'],
    imagePath: (sourceData as any).imagePath,
    
    // Propriétés spécifiques au service sur mesure
    serviceType: 'menage-sur-mesure',
    isPremium: true,
    requiresSurface: true,
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

// Fonction pour obtenir le chemin de redirection après soumission
export const getSuccessRedirectPath = (category: string, bookingId: string): string => {
  // Rediriger vers la page de détail de la réservation
  return `/bookings/${bookingId}`;
};

// Fonction pour obtenir l'icône selon la catégorie
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

// Fonction pour obtenir les couleurs selon la catégorie
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