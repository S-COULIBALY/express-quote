// ============================================================================
// HOOKS BUSINESS INDEX - Express Quote
// ============================================================================
// Seul le service DEMENAGEMENT SUR MESURE est actif.
// Les services CLEANING, DELIVERY, PACKING, MOVING (packs catalogue) ont été abandonnés.
// Voir: docs/PLAN_REFACTORISATION_ANCIEN_SYSTEME.md
// ============================================================================

// Configuration pour le service sur mesure (SEUL SERVICE ACTIF)
export {
  createDemenagementSurMesureSubmissionConfig,
  type DemenagementSurMesureData
} from './DemenagementSurMesure/demenagementSurMesureSubmissionConfig';
