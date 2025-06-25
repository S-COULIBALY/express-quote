import { useSubmission } from '../../generic/useSubmission';
import { createServiceSubmissionConfig, ServiceSubmissionExtraData } from './serviceSubmissionConfig';
import { Service } from '@/types/booking';

export const useServiceBookingSubmission = (service: Service, calculatedPrice: number) => {
  // Configuration pour la submission générique
  const config = createServiceSubmissionConfig(service);
  
  // Données extra pour la submission
  const extraData: ServiceSubmissionExtraData = {
    service
  };
  
  // Utiliser le hook générique
  const { isSubmitting, submit: submitBooking } = useSubmission(config, calculatedPrice, extraData);

  return {
    isSubmitting,
    submitBooking
  };
}; 