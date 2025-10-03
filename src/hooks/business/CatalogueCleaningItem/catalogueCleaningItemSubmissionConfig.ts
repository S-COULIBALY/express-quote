import { SubmissionConfig } from '@/utils/submissionUtils';
import { CatalogueCleaningItem } from '@/types/booking';
import { cleaningConstraints } from '@/components/CleaningConstraintsModal';

export interface CatalogueCleaningItemSubmissionExtraData {
  service: CatalogueCleaningItem;
}

export const createCatalogueCleaningItemSubmissionConfig = (service: CatalogueCleaningItem): SubmissionConfig => ({
  submissionType: 'SERVICE',

  validateFormData: (formData: any, extraData?: CatalogueCleaningItemSubmissionExtraData) => {
    if (!formData.scheduledDate || !formData.location) {
      return 'Please fill in all required fields';
    }
    
    if (!service) {
      return 'Service non disponible.';
    }

    return true;
  },

  prepareRequestData: (formData: any, extraData?: CatalogueCleaningItemSubmissionExtraData) => {
    return {
      serviceId: service.id,
      scheduledDate: formData.scheduledDate,
      location: formData.location,
      duration: formData.duration,
      workers: formData.workers,
      // ✅ Ajouter les valeurs par défaut du service pour le calcul des suppléments
      defaultDuration: service.duration,
      defaultWorkers: service.workers,
      defaultPrice: service.price,
      additionalInfo: formData.additionalInfo,
      calculatedPrice: formData.calculatedPrice,
      whatsappOptIn: formData.whatsappOptIn,
      serviceConstraints: formData.serviceConstraints || []
    };
  },

  getSuccessRedirectUrl: (responseData: any) => {
    return `/services/summary?quoteRequestId=${encodeURIComponent(responseData.id)}`;
  },

  getNotificationData: (formData: any, responseData: any, extraData?: CatalogueCleaningItemSubmissionExtraData) => {
    // Préparer le texte des contraintes pour l'email
    let constraintsText = '';
    if (formData.serviceConstraints && formData.serviceConstraints.length > 0) {
      const constraintNames = formData.serviceConstraints.map((id: string) => 
        cleaningConstraints.find((c: any) => c.id === id)?.name || id
      );
      constraintsText = `Contraintes: ${constraintNames.join(', ')}`;
    }

    return {
      serviceDate: formData.scheduledDate,
      serviceAddress: formData.location,
      additionalDetails: constraintsText
    };
  }
}); 