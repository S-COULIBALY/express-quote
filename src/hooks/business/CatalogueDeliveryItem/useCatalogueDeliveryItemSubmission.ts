import { useQuoteRequestSubmission } from '../../generic/useQuoteRequestSubmission';
import { createCatalogueDeliveryItemSubmissionConfig, CatalogueDeliveryItemSubmissionExtraData } from './catalogueDeliveryItemSubmissionConfig';
import { CatalogueDeliveryItem } from '@/types/booking';

export const useCatalogueDeliveryItemSubmission = (service: CatalogueDeliveryItem, calculatedPrice: number, distance?: number) => {
  // Configuration pour la submission générique
  const config = createCatalogueDeliveryItemSubmissionConfig(service);
  
  // Données extra pour la submission
  const extraData: CatalogueDeliveryItemSubmissionExtraData = {
    service,
    distance
  };
  
  // Utiliser le hook générique avec QuoteRequest
  const { submit, isSubmitting, temporaryId } = useQuoteRequestSubmission(
    config,
    calculatedPrice,
    extraData
  );
  
  return {
    submit,
    isSubmitting,
    temporaryId
  };
}; 