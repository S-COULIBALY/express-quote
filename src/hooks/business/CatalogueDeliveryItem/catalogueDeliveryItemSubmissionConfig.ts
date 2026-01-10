import { SubmissionConfig } from '@/utils/submissionUtils';
import { CatalogueDeliveryItem } from '@/types/booking';

export interface CatalogueDeliveryItemSubmissionExtraData {
  service: CatalogueDeliveryItem;
  distance?: number;
}

export const createCatalogueDeliveryItemSubmissionConfig = (service: CatalogueDeliveryItem): SubmissionConfig => ({
  submissionType: 'SERVICE',

  validateFormData: (formData: any, extraData?: CatalogueDeliveryItemSubmissionExtraData) => {
    // Validation des champs requis
    if (!formData.scheduledDate || !formData.pickupAddress || !formData.deliveryAddress) {
      return 'Veuillez renseigner tous les champs obligatoires';
    }
    if (!formData.packageType) {
      return 'Veuillez sélectionner le type de colis';
    }
    return '';
  },

  prepareRequestData: (formData: any, extraData?: CatalogueDeliveryItemSubmissionExtraData) => {
    const deliveryService = extraData?.service || service;
    const distance = extraData?.distance || 0;
    
    return {
      // Données de base du service
      id: deliveryService.id,
      bookingId: '', // Sera généré par le système
      name: deliveryService.name,
      description: deliveryService.description,
      price: deliveryService.price,
      originalPrice: deliveryService.originalPrice,
      features: deliveryService.features || [],
      includes: deliveryService.includes || [],
      imagePath: deliveryService.imagePath,
      
      // Données spécifiques à la livraison
      packageType: formData.packageType,
      weight: parseFloat(formData.weight) || 0,
      isFragile: formData.isFragile || false,
      pickupAddress: formData.pickupAddress,
      deliveryAddress: formData.deliveryAddress,
      pickupTime: formData.pickupTime,
      deliveryTime: formData.deliveryTime,
      scheduledDate: new Date(formData.scheduledDate),
      duration: formData.duration,
      workers: formData.workers,
      // ✅ Ajouter les valeurs par défaut du service pour le calcul des suppléments
      // Note: CatalogueDeliveryItem n'a pas de duration/workers par défaut, utiliser des valeurs standard
      defaultDuration: formData.duration || 1, // 1 heure par défaut pour les livraisons
      defaultWorkers: formData.workers || 1,   // 1 livreur par défaut
      defaultPrice: deliveryService.price,
      additionalInfo: formData.additionalInfo || '',
      
      // Métadonnées
      catalogId: deliveryService.catalogId,
      catalogCategory: deliveryService.catalogCategory,
      subcategory: deliveryService.subcategory,
      badgeText: deliveryService.badgeText,
      badgeColor: deliveryService.badgeColor,
      promotionText: deliveryService.promotionText,
      isFeatured: deliveryService.isFeatured,
      isNewOffer: deliveryService.isNewOffer,
      source: deliveryService.source,
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // Données de calcul
      distance: distance
    };
  },

  getSuccessRedirectUrl: (responseData: any, extraData?: CatalogueDeliveryItemSubmissionExtraData) => {
    return `/booking/${responseData.temporaryId || responseData.id}`;
  }
}); 