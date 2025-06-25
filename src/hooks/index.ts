// Export des hooks génériques
export { usePriceCalculator } from './generic/usePriceCalculator';
export type { UsePriceCalculatorResult } from './generic/usePriceCalculator';

export { useSubmission } from './generic/useSubmission';
export type { UseSubmissionResult } from './generic/useSubmission';

// Export des hooks métier - MOVING
export { useMovingPriceCalculator } from './business/moving/useMovingPriceCalculator';
export { useMovingSubmission } from './business/moving/useMovingSubmission';

// Export des hooks métier - PACK
export { usePackPriceCalculator } from './business/pack/usePackPriceCalculator';
export { usePackSubmission } from './business/pack/usePackSubmission';

// Export des hooks métier - SERVICE
export { useServicePriceCalculator } from './business/service/useServicePriceCalculator';
export { useServiceBookingSubmission } from './business/service/useServiceBookingSubmission';

// Export des configurations de calcul de prix
export { createMovingPriceConfig } from './business/moving/movingPriceConfig';
export type { MovingExtraData } from './business/moving/movingPriceConfig';

export { createPackPriceConfig } from './business/pack/packPriceConfig';
export type { PackExtraData } from './business/pack/packPriceConfig';

export { createServicePriceConfig } from './business/service/servicePriceConfig';
export type { ServiceExtraData, ServicePriceDetails } from './business/service/servicePriceConfig';

// Export des configurations de submission
export { createMovingSubmissionConfig } from './business/moving/movingSubmissionConfig';
export type { MovingSubmissionExtraData } from './business/moving/movingSubmissionConfig';

export { createPackSubmissionConfig } from './business/pack/packSubmissionConfig';
export type { PackSubmissionExtraData } from './business/pack/packSubmissionConfig';

export { createServiceSubmissionConfig } from './business/service/serviceSubmissionConfig';
export type { ServiceSubmissionExtraData } from './business/service/serviceSubmissionConfig';

// Export des utilitaires de calcul de prix
export { 
  calculateVAT, 
  callPriceAPI, 
  handlePriceError, 
  logPriceCalculation 
} from '../utils/priceCalculatorUtils';
export type { PriceCalculatorConfig } from '../utils/priceCalculatorUtils';

// Export des utilitaires de submission
export { 
  callSubmissionAPI,
  extractContactInfo,
  sendSubmissionNotification,
  handleSuccessRedirect,
  validateSubmissionData,
  logSubmission
} from '../utils/submissionUtils';
export type { SubmissionConfig } from '../utils/submissionUtils';

// Export des hooks partagés
export { useQuotes } from './shared/useQuotes';
export { useBooking } from './shared/useBooking';
export { useGoogleMaps } from './shared/useGoogleMaps';
export { useAddressAutocomplete } from './shared/useAddressAutocomplete';
export { useApi } from './shared/useApi';
export { useForm } from './shared/useForm';
export { useFormValidation } from './shared/useFormValidation';
export { usePagination } from './shared/usePagination';
export { useHasMounted } from './shared/useHasMounted'; 