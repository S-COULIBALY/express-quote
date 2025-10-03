import { useQuoteRequestSubmission } from '../../generic/useQuoteRequestSubmission';
import { createCatalogueMovingItemSubmissionConfig, CatalogueMovingItemSubmissionExtraData } from './catalogueMovingItemSubmissionConfig';
import { CatalogueMovingItem } from '@/types/booking';

export const useCatalogueMovingItemSubmission = (pack: CatalogueMovingItem, calculatedPrice: number, distance?: number) => {
  // Configuration pour la submission générique
  const config = createCatalogueMovingItemSubmissionConfig(pack, distance || 0);
  
  // Données extra pour la submission
  const extraData: CatalogueMovingItemSubmissionExtraData = {
    pack,
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