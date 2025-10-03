import { useQuoteRequestSubmission } from '../../generic/useQuoteRequestSubmission';
import { createDemenagementSurMesureSubmissionConfig, DemenagementSurMesureSubmissionExtraData } from './demenagementSurMesureSubmissionConfig';

export interface DemenagementSurMesureData {
  id: string;
  name: string;
  description: string;
  price: number | null;
  workers: number | null;
  duration: number | null;
  features: string[];
  includes: string[];
  serviceType: 'demenagement-sur-mesure';
  isPremium: boolean;
  requiresVolume: boolean;
  requiresCustomPricing: boolean;
  isDynamicPricing: boolean;
  catalogId: string;
  catalogCategory: string;
  subcategory: string;
}

export const useDemenagementSurMesureSubmission = (service: DemenagementSurMesureData, calculatedPrice: number, distance?: number) => {
  // Configuration pour la submission générique
  const config = createDemenagementSurMesureSubmissionConfig(service, distance || 0);
  
  // Données extra pour la submission
  const extraData: DemenagementSurMesureSubmissionExtraData = {
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
