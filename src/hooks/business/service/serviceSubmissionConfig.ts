import { SubmissionConfig } from '@/utils/submissionUtils';
import { Service } from '@/types/booking';
import { cleaningConstraints } from '@/components/CleaningConstraintsModal';

export interface ServiceSubmissionExtraData {
  service: Service;
}

export const createServiceSubmissionConfig = (service: Service): SubmissionConfig => ({
  submissionType: 'SERVICE',

  validateFormData: (formData: any, extraData?: ServiceSubmissionExtraData) => {
    if (!formData.scheduledDate || !formData.location) {
      return 'Please fill in all required fields';
    }
    
    if (!service) {
      return 'Service non disponible.';
    }

    return true;
  },

  prepareRequestData: (formData: any, extraData?: ServiceSubmissionExtraData) => {
    return {
      serviceId: service.id,
      scheduledDate: formData.scheduledDate,
      location: formData.location,
      duration: formData.duration,
      workers: formData.workers,
      additionalInfo: formData.additionalInfo,
      calculatedPrice: formData.calculatedPrice,
      whatsappOptIn: formData.whatsappOptIn,
      serviceConstraints: formData.serviceConstraints || []
    };
  },

  getSuccessRedirectUrl: (responseData: any) => {
    return `/services/summary?quoteRequestId=${encodeURIComponent(responseData.id)}`;
  },

  getNotificationData: (formData: any, responseData: any, extraData?: ServiceSubmissionExtraData) => {
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