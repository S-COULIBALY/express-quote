import { CatalogData } from '@/hooks/useCatalogPreFill';
import { CatalogueMovingItem, CatalogueCleaningItem, CatalogueDeliveryItem } from '@/types/booking';

// Fonction pour déterminer le preset à utiliser selon la catégorie et sous-catégorie
export const getPresetForCategory = (category: string, subcategory?: string): 'catalogueMovingItem-service' | 'catalogueCleaningItem-service' | 'catalogueDeliveryItem-service' | 'demenagement-sur-mesure' | 'menage-sur-mesure' => {
  // Si c'est un service sur mesure, retourner le preset approprié
  if (subcategory === 'sur-mesure') {
    switch (category.toUpperCase()) {
      case 'DEMENAGEMENT':
        return 'demenagement-sur-mesure';
      case 'MENAGE':
        return 'menage-sur-mesure';
      default:
        return 'menage-sur-mesure';
    }
  }
  
  // Sinon, utiliser la logique existante pour les services du catalogue
  switch (category.toUpperCase()) {
    case 'DEMENAGEMENT':
    case 'TRANSPORT':
      return 'catalogueMovingItem-service';      // Adresses pickup/delivery + contraintes logistiques
    
    case 'MENAGE':
    case 'NETTOYAGE':
      return 'catalogueCleaningItem-service';   // Une adresse + contraintes service
    
    case 'LIVRAISON':
    case 'DELIVERY':
      return 'catalogueDeliveryItem-service';   // Pickup/delivery avec horaires + caractéristiques colis
    
    default:
      return 'catalogueCleaningItem-service';
  }
};

// Transformation catalogue → CatalogueMovingItem (pour déménagement/transport)
export const transformCatalogDataToCatalogueMovingItem = (catalogData: CatalogData): CatalogueMovingItem => {
  const { catalogSelection, item, template } = catalogData;
  
  const transformedData = {
    id: item.id,
    bookingId: '', // Sera généré lors de la création du booking
    name: catalogSelection.marketingTitle || item.name,
    description: catalogSelection.marketingDescription || item.description || '',
    price: catalogSelection.marketingPrice || item.price,
    originalPrice: catalogSelection.originalPrice,
    duration: item.duration || template?.duration || 1,
    workers: item.workers || template?.workers || 2,
    features: item.features || template?.features || [],
    includedDistance: item.includedDistance || template?.includedDistance || 20,
    distanceUnit: item.distanceUnit || template?.distanceUnit || 'km',
    includes: item.includes || template?.includes || [
      `${item.duration || 1} jour${(item.duration || 1) > 1 ? 's' : ''} de déménagement`,
      `${item.workers || 2} déménageur${(item.workers || 2) > 1 ? 's' : ''} professionnel${(item.workers || 2) > 1 ? 's' : ''}`,
      `${item.includedDistance || 20} km inclus`,
      "Matériel de déménagement fourni",
      "Assurance transport incluse"
    ],
    popular: item.popular || catalogSelection.isFeatured,
    imagePath: item.imagePath,
    
    // Propriétés requises pour Pack
    scheduledDate: new Date(), // Sera mis à jour par le formulaire
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
      distance: item.includedDistance || 20,
      workers: item.workers || template?.workers || 2,
      duration: item.duration || template?.duration || 1,
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

  console.log('📦 [TRANSFORMER] CatalogueMovingItem avec __presetSnapshot:', {
    name: transformedData.name,
    price: transformedData.price,
    __presetSnapshot: transformedData.__presetSnapshot
  });

  return transformedData;
};

// Transformation catalogue → CatalogueCleaningItem (pour nettoyage)
export const transformCatalogDataToCatalogueCleaningItem = (catalogData: CatalogData): CatalogueCleaningItem => {
  const { catalogSelection, item, template } = catalogData;
  
  const transformedData = {
    id: item.id,
    bookingId: '', // Sera généré lors de la création du booking
    name: catalogSelection.marketingTitle || item.name,
    description: catalogSelection.marketingDescription || item.description || '',
    price: catalogSelection.marketingPrice || item.price,
    originalPrice: catalogSelection.originalPrice,
    duration: item.duration || template?.duration || 2, // en heures pour services
    workers: item.workers || template?.workers || 1,
    features: item.features || template?.features || [],
    includes: item.includes || template?.includes || [
      `${item.duration || 2} heure${(item.duration || 2) > 1 ? 's' : ''} de service`,
      `${item.workers || 1} professionnel${(item.workers || 1) > 1 ? 's' : ''} qualifié${(item.workers || 1) > 1 ? 's' : ''}`,
      "Matériel professionnel inclus",
      "Assurance responsabilité civile"
    ],
    imagePath: item.imagePath,
    
    // Propriétés requises pour Service
    categoryId: catalogSelection.category, // Utiliser la catégorie comme categoryId
    scheduledDate: new Date(), // Sera mis à jour par le formulaire
    location: '', // Sera rempli par l'utilisateur
    additionalInfo: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    
    // Données catalogue pour traçabilité (propriétés existantes dans Service)
    
    // ✅ Ajout du snapshot pour la comparaison CLEANING non modifié
    __presetSnapshot: {
      volume: 0, // Pas de volume pour le nettoyage
      distance: 0, // Pas de distance pour le nettoyage
      workers: item.workers || template?.workers || 1,
      duration: item.duration || template?.duration || 2
    },
    
    // ✅ Ajout des données de promotion
    promotionCode: catalogSelection.promotionCode,
    promotionValue: catalogSelection.promotionValue,
    promotionType: catalogSelection.promotionType,
    isPromotionActive: catalogSelection.isPromotionActive
  };

  console.log('🏠 [TRANSFORMER] CatalogueCleaningItem avec __presetSnapshot:', {
    name: transformedData.name,
    price: transformedData.price,
    __presetSnapshot: transformedData.__presetSnapshot
  });

  return transformedData;
};

// Transformation catalogue → CatalogueDeliveryItem (pour livraison)
export const transformCatalogDataToCatalogueDeliveryItem = (catalogData: CatalogData): CatalogueDeliveryItem => {
  const { catalogSelection, item, template } = catalogData;
  
  return {
    id: item.id,
    bookingId: '', // Sera généré lors de la création du booking
    name: catalogSelection.marketingTitle || item.name,
    description: catalogSelection.marketingDescription || item.description || '',
    price: catalogSelection.marketingPrice || item.price,
    originalPrice: catalogSelection.originalPrice,
    features: item.features || template?.features || [],
    includes: item.includes || template?.includes || [
      "Transport sécurisé",
      "Suivi en temps réel", 
      "Assurance colis",
      "Notification SMS"
    ],
    imagePath: item.imagePath,
    
    // Propriétés spécifiques à la livraison avec valeurs par défaut
    packageType: 'colis', // Sera modifié par l'utilisateur
    weight: undefined, // Sera rempli par l'utilisateur
    isFragile: false,
    pickupAddress: '', // Sera rempli par l'utilisateur
    deliveryAddress: '', // Sera rempli par l'utilisateur
    pickupTime: '', // Sera rempli par l'utilisateur
    deliveryTime: '', // Sera rempli par l'utilisateur
    scheduledDate: new Date(), // Sera mis à jour par le formulaire
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
  
  return {
    id: item.id,
    name: catalogSelection.marketingTitle || 'Déménagement sur mesure',
    description: catalogSelection.marketingDescription || 'Service de déménagement personnalisé selon vos besoins',
    price: null, // Prix calculé dynamiquement selon les besoins du client
    originalPrice: null, // Pas de prix original pour les services sur mesure
    workers: null, // Nombre d'intervenants calculé selon le volume
    duration: null, // Durée calculée selon la complexité
    features: ['Service personnalisé', 'Devis adapté'],
    includes: ['Étude gratuite', 'Options modulables'],
    imagePath: item.imagePath,
    
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
  
  return {
    id: item.id,
    name: catalogSelection.marketingTitle || 'Ménage sur mesure',
    description: catalogSelection.marketingDescription || 'Service de nettoyage personnalisé selon vos besoins',
    price: null, // Prix calculé dynamiquement selon les besoins du client
    originalPrice: null, // Pas de prix original pour les services sur mesure
    workers: null, // Nombre d'intervenants calculé selon la surface
    duration: null, // Durée calculée selon la complexité
    features: ['Service personnalisé', 'Devis adapté'],
    includes: ['Étude gratuite', 'Options modulables'],
    imagePath: item.imagePath,
    
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
  switch (category.toUpperCase()) {
    case 'DEMENAGEMENT':
    case 'TRANSPORT':
      return `/moving/success?bookingId=${bookingId}`;
    case 'MENAGE':
    case 'NETTOYAGE':
      return `/cleaning/success?bookingId=${bookingId}`;
    case 'LIVRAISON':
    case 'DELIVERY':
      return `/delivery/success?bookingId=${bookingId}`;
    default:
      return `/success?bookingId=${bookingId}`;
  }
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