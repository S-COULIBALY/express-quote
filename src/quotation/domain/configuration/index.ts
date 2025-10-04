/**
 * ============================================================================
 * EXPORTS CONFIGURATION - Point d'entrée centralisé pour le système de configuration
 * ============================================================================
 *
 * 🎯 OBJECTIF :
 * Export centralisé de tous les éléments du système de configuration
 * pour une utilisation simplifiée dans le reste de l'application.
 *
 * 📋 EXPORTS PRINCIPAUX :
 *
 * ✅ DefaultValues : Source unique de vérité pour toutes les valeurs
 * ✅ Configuration : Entité de gestion des configurations avec versioning
 * ✅ ConfigurationCategory : Catégories d'organisation des configurations
 * ✅ ConfigurationKeys : Clés de mapping vers les constantes
 * ✅ DefaultConfigurations : Factory pour créer les configurations par défaut
 * ✅ Validation : Outils de validation et cohérence
 * ✅ Constants : Fonctions utilitaires et constantes techniques
 *
 * 🚀 UTILISATION (APRÈS NETTOYAGE) :
 *
 * ```typescript
 * import { DefaultValues, Configuration, createDefaultConfigurations } from './configuration';
 *
 * // ✅ Utilisation des valeurs par défaut (APRÈS NETTOYAGE)
 * const movingPrice = DefaultValues.MOVING_BASE_PRICE_PER_M3; // Spécifique MOVING
 * const sharedPrice = DefaultValues.UNIT_PRICE_PER_KM; // Partagé (tous services)
 * const genericRate = DefaultValues.SERVICE_WORKER_PRICE_PER_HOUR; // Taux générique
 *
 * // Création de configurations
 * const configs = createDefaultConfigurations();
 *
 * // Validation
 * const validation = DefaultValues.validateValues();
 * ```
 */

// ============================================================================
// EXPORTS PRINCIPAUX - Système de configuration centralisé
// ============================================================================

export { DefaultValues } from "./DefaultValues";
export { Configuration } from "./Configuration";
export {
  ConfigurationCategory,
  PricingConfigKey,
  BusinessRulesConfigKey,
  SystemValuesConfigKey,
  TechnicalLimitsConfigKey,
  InsuranceConfigKey,
  GeographicConfigKey,
  ServiceParamsConfigKey,
  BusinessTypePricingConfigKey,
  BusinessType,
} from "./ConfigurationKey";
export {
  createDefaultConfigurations,
  initializeConfigurationService,
} from "./DefaultConfigurations";
export {
  validateDefaultConfigurationsConsistency,
  printValidationReport,
} from "./validateDefaultValues";

// ============================================================================
// EXPORTS UTILITAIRES - Fonctions et constantes techniques
// ============================================================================

export {
  PRICE_CONSTANTS,
  MOVING_CONSTANTS,
  CLEANING_CONSTANTS,
  calculateFloorSurcharge,
  calculateFurnitureLiftPrice,
  validateConstraints,
  validateServices,
} from "./constants";

// ============================================================================
// EXPORTS SERVICES CENTRALISÉS
// ============================================================================

// AutoDetectionService - Détection automatique des contraintes logistiques
export { AutoDetectionService } from "../services/AutoDetectionService";
export type {
  AddressData,
  FormAddressData,
  AddressDetectionResult,
  AutoDetectionResult,
} from "../services/AutoDetectionService";

// ConstraintIconService - Mapping centralisé des icônes
export { ConstraintIconService } from "../services/ConstraintIconService";
export type { ServiceType, ItemType } from "../services/ConstraintIconService";

// ConstraintTransformerService - Transformation règles BDD → Format UI/API
export { ConstraintTransformerService } from "../services/ConstraintTransformerService";
export type {
  BusinessRule,
  ModalConstraint,
  TransformedData,
} from "../services/ConstraintTransformerService";
