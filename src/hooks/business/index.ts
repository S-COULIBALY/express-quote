// ✅ REFACTOR PHASE 1: Export des configurations au lieu des hooks
// Les hooks business ont été remplacés par useUnifiedSubmission
// On garde uniquement les configurations qui contiennent la logique métier

// Configurations pour les services du catalogue
export { createCatalogueMovingItemSubmissionConfig } from './CatalogueMovingItem/catalogueMovingItemSubmissionConfig';
export { createCatalogueCleaningItemSubmissionConfig } from './CatalogueCleaningItem/catalogueCleaningItemSubmissionConfig';
export { createCatalogueDeliveryItemSubmissionConfig } from './CatalogueDeliveryItem/catalogueDeliveryItemSubmissionConfig';

// Configurations pour les services sur mesure
export { createDemenagementSurMesureSubmissionConfig, type DemenagementSurMesureData } from './DemenagementSurMesure/demenagementSurMesureSubmissionConfig';
export { createMenageSurMesureSubmissionConfig, type MenageSurMesureData } from './MenageSurMesure/menageSurMesureSubmissionConfig';
