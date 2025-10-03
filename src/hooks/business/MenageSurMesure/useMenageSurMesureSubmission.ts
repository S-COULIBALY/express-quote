import { useQuoteRequestSubmission } from '../../generic/useQuoteRequestSubmission';
import { createMenageSurMesureSubmissionConfig, MenageSurMesureSubmissionExtraData } from './menageSurMesureSubmissionConfig';

export interface MenageSurMesureData {
  id: string;
  name: string;
  description: string;
  price: number | null;
  workers: number | null;
  duration: number | null;
  features: string[];
  includes: string[];
  serviceType: 'menage-sur-mesure';
  isPremium: boolean;
  requiresSurface: boolean;
  requiresCustomPricing: boolean;
  isDynamicPricing: boolean;
  catalogId: string;
  catalogCategory: string;
  subcategory: string;
}

export const useMenageSurMesureSubmission = (service: MenageSurMesureData, calculatedPrice: number) => {
  // Configuration pour la submission générique
  const config = createMenageSurMesureSubmissionConfig(service);
  
  // Données extra pour la submission
  const extraData: MenageSurMesureSubmissionExtraData = {
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
