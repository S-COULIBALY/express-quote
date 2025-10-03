import { SubmissionConfig } from '@/utils/submissionUtils';
import { DemenagementSurMesureData } from './useDemenagementSurMesureSubmission';
import { AutoDetectionService, AddressData } from '@/quotation/domain/services/AutoDetectionService';
import { DefaultValues } from '@/quotation/domain/configuration/DefaultValues';

export interface DemenagementSurMesureSubmissionExtraData {
  service: DemenagementSurMesureData;
  distance?: number;
}

export const createDemenagementSurMesureSubmissionConfig = (service: DemenagementSurMesureData, distance: number = 0): SubmissionConfig => ({
  submissionType: 'MOVING_PREMIUM',

  validateFormData: (formData: any, extraData?: DemenagementSurMesureSubmissionExtraData) => {
    // Validation des champs requis pour un service sur mesure
    if (!formData.scheduledDate || !formData.pickupAddress || !formData.deliveryAddress) {
      return 'Veuillez remplir tous les champs obligatoires.';
    }
    
    // Validation spécifique au déménagement sur mesure
    if (!formData.typeDemenagement || !formData.surface || !formData.nombrePieces) {
      return 'Veuillez spécifier le type de déménagement, la surface et le nombre de pièces.';
    }
    
    // ✅ REFACTORISÉ: Validation avec AutoDetectionService
    const pickupData: AddressData = {
      floor: parseInt(formData.etageDepart) || 0,
      elevator: (formData.ascenseurDepart ? 'medium' : 'no') as 'no' | 'small' | 'medium' | 'large',
      constraints: formData.pickupLogisticsConstraints || []
    };

    const deliveryData: AddressData = {
      floor: parseInt(formData.etageArrivee) || 0,
      elevator: (formData.ascenseurArrivee ? 'medium' : 'no') as 'no' | 'small' | 'medium' | 'large',
      constraints: formData.deliveryLogisticsConstraints || []
    };

    const detectionResult = AutoDetectionService.detectAutomaticConstraints(pickupData, deliveryData);
    const furnitureLiftRequired = detectionResult.pickup.furnitureLiftRequired || detectionResult.delivery.furnitureLiftRequired;

    if (furnitureLiftRequired && !formData.pickupNeedsLift && !formData.deliveryNeedsLift) {
      return 'Un monte-meuble est obligatoire selon les contraintes détectées (étages élevés, contraintes d\'accès, ou ascenseur inadapté).';
    }

    return true;
  },

  prepareRequestData: (formData: any, extraData?: DemenagementSurMesureSubmissionExtraData) => {
    return {
      // Données du service sur mesure
      serviceId: service.id,
      serviceType: 'MOVING_PREMIUM',
      catalogId: service.catalogId,
      
      // Informations générales
      typeDemenagement: formData.typeDemenagement,
      surface: parseInt(formData.surface),
      nombrePieces: parseInt(formData.nombrePieces),
      volumeEstime: formData.volumeEstime,
      
      // Planification
      scheduledDate: formData.scheduledDate,
      flexibilite: formData.flexibilite,
      horaire: formData.horaire,
      
      // Adresses et contraintes
      pickupAddress: formData.pickupAddress,
      deliveryAddress: formData.deliveryAddress,
      distanceEstimee: extraData?.distance || 0,
      
      // Contraintes logistiques
      etageDepart: parseInt(formData.etageDepart) || 0,
      etageArrivee: parseInt(formData.etageArrivee) || 0,
      ascenseurDepart: formData.ascenseurDepart,
      ascenseurArrivee: formData.ascenseurArrivee,
      
      // Mobilier et objets
      meubles: formData.meubles || [],
      electromenager: formData.electromenager || [],
      objetsFragiles: formData.objetsFragiles || [],
      
      // Services optionnels
      emballage: formData.emballage,
      montage: formData.montage,
      nettoyage: formData.nettoyage,
      stockage: formData.stockage,
      assurance: formData.assurance,
      
      // Contact
      nom: formData.nom,
      email: formData.email,
      telephone: formData.telephone,
      commentaires: formData.commentaires,
      
      // Prix et calculs
      calculatedPrice: formData.calculatedPrice || 0,
      isDynamicPricing: true,
      
      // Données du service
      serviceName: service.name,
      serviceDescription: service.description,
      isPremium: service.isPremium,
      requiresVolume: service.requiresVolume,
      requiresCustomPricing: service.requiresCustomPricing
    };
  },

  getSuccessRedirectUrl: (responseData: any) => {
    return `/summary/quote/${responseData.temporaryId || responseData.id}`;
  },

  getNotificationData: (formData: any, responseData: any, extraData?: DemenagementSurMesureSubmissionExtraData) => {
    const servicesOptionnels = [];
    if (formData.emballage) servicesOptionnels.push('Emballage');
    if (formData.montage) servicesOptionnels.push('Montage/Démontage');
    if (formData.nettoyage) servicesOptionnels.push('Nettoyage');
    if (formData.stockage) servicesOptionnels.push('Stockage');
    if (formData.assurance) servicesOptionnels.push('Assurance');

    return {
      serviceDate: formData.scheduledDate,
      serviceAddress: `${formData.pickupAddress} → ${formData.deliveryAddress}`,
      additionalDetails: `Type: ${formData.typeDemenagement}, Surface: ${formData.surface}m², ${formData.nombrePieces} pièces${servicesOptionnels.length > 0 ? `, Services: ${servicesOptionnels.join(', ')}` : ''}`
    };
  }
});
