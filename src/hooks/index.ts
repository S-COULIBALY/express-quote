// Export des hooks génériques
export { usePriceCalculator } from './generic/usePriceCalculator';
export type { UsePriceCalculatorResult } from './generic/usePriceCalculator';

export { useSubmission } from './generic/useSubmission';
export type { UseSubmissionResult } from './generic/useSubmission';


// Export des hooks métier - PACK
export { useCatalogueMovingItemPriceCalculator } from './business/CatalogueMovingItem/useCatalogueMovingItemPriceCalculator';

// Export des hooks métier - SERVICE
export { useCatalogueCleaningItemPriceCalculator } from './business/CatalogueCleaningItem/useCatalogueCleaningItemPriceCalculator';

// Export des configurations de calcul de prix

export { createCatalogueMovingItemPriceConfig } from './business/CatalogueMovingItem/catalogueMovingItemPriceConfig';
export type { CatalogueMovingItemExtraData } from './business/CatalogueMovingItem/catalogueMovingItemPriceConfig';

export { createCatalogueCleaningItemPriceConfig } from './business/CatalogueCleaningItem/catalogueCleaningItemPriceConfig';
export type { CatalogueCleaningItemExtraData, CatalogueCleaningItemPriceDetails } from './business/CatalogueCleaningItem/catalogueCleaningItemPriceConfig';

// Export des configurations de submission

export { createCatalogueMovingItemSubmissionConfig } from './business/CatalogueMovingItem/catalogueMovingItemSubmissionConfig';
export type { CatalogueMovingItemSubmissionExtraData } from './business/CatalogueMovingItem/catalogueMovingItemSubmissionConfig';

export { createCatalogueCleaningItemSubmissionConfig } from './business/CatalogueCleaningItem/catalogueCleaningItemSubmissionConfig';
export type { CatalogueCleaningItemSubmissionExtraData } from './business/CatalogueCleaningItem/catalogueCleaningItemSubmissionConfig';

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