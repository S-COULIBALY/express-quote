import { useQuoteRequestSubmission } from '../../generic/useQuoteRequestSubmission';
import { createCatalogueCleaningItemSubmissionConfig, CatalogueCleaningItemSubmissionExtraData } from './catalogueCleaningItemSubmissionConfig';
import { CatalogueCleaningItem } from '@/types/booking';

export const useCatalogueCleaningItemSubmission = (service: CatalogueCleaningItem, calculatedPrice: number, distance?: number) => {
  // Configuration pour la submission générique
  const config = createCatalogueCleaningItemSubmissionConfig(service);
  
  // Données extra pour la submission
  const extraData: CatalogueCleaningItemSubmissionExtraData = {
    service
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