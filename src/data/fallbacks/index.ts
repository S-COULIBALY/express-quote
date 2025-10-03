/**
 * ============================================================================
 * FALLBACKS CENTRALISÉS - Export unique
 * ============================================================================
 *
 * 🎯 OBJECTIF:
 * Point d'entrée centralisé pour tous les fallbacks générés automatiquement.
 *
 * 📋 UTILISATION:
 * ```typescript
 * import {
 *   movingConstraintsFallback,
 *   movingServicesFallback,
 *   cleaningConstraintsFallback,
 *   cleaningServicesFallback
 * } from '@/data/fallbacks';
 * ```
 */

// Exports MOVING
export {
  movingConstraintsFallback,
  movingServicesFallback,
  allMovingItemsFallback,
  type Constraint as MovingConstraint
} from './movingFallback';

// Exports CLEANING
export {
  cleaningConstraintsFallback,
  cleaningServicesFallback,
  allCleaningItemsFallback,
  type Constraint as CleaningConstraint
} from './cleaningFallback';
