// Exports principaux pour le système de configuration centralisé
export { DefaultValues } from './DefaultValues';
export { Configuration } from './Configuration';
export { ConfigurationCategory, PricingConfigKey, BusinessRulesConfigKey, LimitsConfigKey, ServiceParamsConfigKey } from './ConfigurationKey';
export { createDefaultConfigurations, initializeConfigurationService } from './DefaultConfigurations';
export { validateDefaultConfigurationsConsistency, printValidationReport } from './validateDefaultValues';

// Constantes techniques (séparées des prix) - exports spécifiques pour éviter les conflits
export { 
  PRICE_CONSTANTS, 
  MOVING_CONSTANTS, 
  CLEANING_CONSTANTS, 
  FLOOR_CONSTANTS,
  calculateFloorSurcharge,
  calculateFurnitureLiftPrice,
  detectFurnitureLift
} from './constants'; 