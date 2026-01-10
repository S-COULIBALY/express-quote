/**
 * Services d'analyse de volume pour renforcer l'exactitude
 *
 * Ces services sont appelés EN AMONT du moteur de devis pour analyser
 * les données fournies par le client (liste, vidéo, visite technique).
 *
 * Le résultat est injecté dans QuoteContext.estimatedVolume avant que
 * le moteur ne calcule le devis.
 */

export { ListAnalysisService, ListAnalysisError } from './ListAnalysisService';
export type { ListItem, ListAnalysisResult } from './ListAnalysisService';

export { VideoAnalysisService, VideoAnalysisError } from './VideoAnalysisService';
export type {
  VideoAnalysisOptions,
  DetectedItem,
  VideoAnalysisResult,
  IVisionProvider,
} from './VideoAnalysisService';

export { OnSiteVerificationService, OnSiteVerificationError } from './OnSiteVerificationService';
export type {
  OnSiteMeasurement,
  OnSiteVerificationRequest,
  OnSiteVerificationResult,
} from './OnSiteVerificationService';

export { defaultConfig, validateConfig } from './config';
export type { VolumeAnalysisConfig } from './config';

// Test helpers
export {
  createTestVideoAnalysisService,
  createTestListAnalysisService,
  TEST_DATA,
  TEST_CONFIG,
} from './test-helpers';

