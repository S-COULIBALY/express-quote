import { SubmissionConfig } from '@/utils/submissionUtils';

/**
 * Type pour les données du service déménagement sur mesure
 * Utilisé pour la configuration de soumission
 */
export interface DemenagementSurMesureData {
  id: string;
  name: string;
  description: string;
  catalogId?: string;
  isPremium?: boolean;
  requiresVolume?: boolean;
  requiresCustomPricing?: boolean;
  __presetSnapshot?: Record<string, unknown>;
}

export interface DemenagementSurMesureSubmissionExtraData {
  service: DemenagementSurMesureData;
  distance?: number;
}

export const createDemenagementSurMesureSubmissionConfig = (
  service: DemenagementSurMesureData,
  distance: number = 0
): SubmissionConfig => ({
  submissionType: 'MOVING_PREMIUM',

  validateFormData: (formData: Record<string, unknown>) => {
    // Validation des champs requis pour un service sur mesure
    if (!formData.scheduledDate || !formData.pickupAddress || !formData.deliveryAddress) {
      return 'Veuillez remplir tous les champs obligatoires.';
    }

    // Validation spécifique au déménagement sur mesure
    if (!formData.typeDemenagement || !formData.surface || !formData.nombrePieces) {
      return 'Veuillez spécifier le type de déménagement, la surface et le nombre de pièces.';
    }

    return true;
  },

  prepareRequestData: (formData: Record<string, unknown>, extraData?: unknown) => {
    const extra = extraData as DemenagementSurMesureSubmissionExtraData | undefined;

    return {
      // Données du service sur mesure
      serviceId: service.id,
      serviceType: 'MOVING_PREMIUM',
      catalogId: service.catalogId,

      // Informations générales
      typeDemenagement: formData.typeDemenagement,
      surface: parseInt(String(formData.surface)),
      nombrePieces: parseInt(String(formData.nombrePieces)),
      volumeEstime: formData.volumeEstime,

      // Planification
      scheduledDate: formData.scheduledDate,
      flexibilite: formData.flexibilite,
      horaire: formData.horaire,

      // Adresses et contraintes
      pickupAddress: formData.pickupAddress,
      deliveryAddress: formData.deliveryAddress,
      distanceEstimee: extra?.distance || distance,

      // Contraintes logistiques
      etageDepart: parseInt(String(formData.etageDepart)) || 0,
      etageArrivee: parseInt(String(formData.etageArrivee)) || 0,
      ascenseurDepart: formData.ascenseurDepart,
      ascenseurArrivee: formData.ascenseurArrivee,
      pickupLogisticsConstraints: formData.pickupLogisticsConstraints,
      deliveryLogisticsConstraints: formData.deliveryLogisticsConstraints,
      additionalServices: formData.additionalServices,

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

  getSuccessRedirectUrl: (responseData: Record<string, unknown>) => {
    const temporaryId = responseData.temporaryId as string | undefined;
    const id = responseData.id as string | undefined;
    return `/booking/${temporaryId || id}`;
  },

  getNotificationData: (formData: Record<string, unknown>) => {
    const servicesOptionnels: string[] = [];
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
