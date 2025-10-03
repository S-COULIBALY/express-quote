import { Configuration } from './Configuration';
import { ConfigurationCategory, PricingConfigKey, BusinessRulesConfigKey, ServiceParamsConfigKey, BusinessTypePricingConfigKey } from './ConfigurationKey';
import { ServiceType } from '../enums/ServiceType';
import { DefaultValues } from './DefaultValues';

/**
 * Crée les configurations par défaut pour le système de tarification
 * 
 * ✅ REFACTORISÉ : Utilise maintenant DefaultValues.ts comme source unique de vérité
 * 
 * 🎯 Avantages :
 * - ✅ DRY (Don't Repeat Yourself) : Plus de duplication de valeurs
 * - ✅ Source unique : DefaultValues.ts est la seule source de vérité
 * - ✅ Cohérence garantie : Impossible d'avoir des valeurs différentes
 * - ✅ Maintenance simplifiée : Une seule place pour changer les valeurs
 * - ✅ Tests prévisibles : Valeurs constantes dans tous les contextes
 * 
 * @returns Un tableau de configurations avec les valeurs par défaut
 */
export function createDefaultConfigurations(): Configuration[] {
  const configurations: Configuration[] = [];
  
  // Configurations PRIX UNITAIRES DE BASE - Noms alignés avec DefaultValues.ts
  configurations.push(createPricingConfig(PricingConfigKey.UNIT_PRICE_PER_M3, DefaultValues.UNIT_PRICE_PER_M3));
  configurations.push(createPricingConfig(PricingConfigKey.UNIT_PRICE_PER_KM, DefaultValues.UNIT_PRICE_PER_KM));
  configurations.push(createPricingConfig(PricingConfigKey.EXTRA_KM_PRICE, DefaultValues.EXTRA_KM_PRICE));
  
  // Configurations PRIX OUVRERS ET ÉQUIPEMENTS - Noms alignés avec DefaultValues.ts
  configurations.push(createPricingConfig(PricingConfigKey.WORKER_PRICE, DefaultValues.WORKER_PRICE));
  configurations.push(createPricingConfig(PricingConfigKey.LIFT_PRICE, DefaultValues.LIFT_PRICE));
  configurations.push(createPricingConfig(PricingConfigKey.WORKER_HOUR_RATE, DefaultValues.WORKER_HOUR_RATE));
  configurations.push(createPricingConfig(PricingConfigKey.EXTRA_WORKER_HOUR_RATE, DefaultValues.EXTRA_WORKER_HOUR_RATE));
  
  // Configurations FRAIS FIXES & FORFAITS - Noms alignés avec DefaultValues.ts
  configurations.push(createPricingConfig(PricingConfigKey.VEHICLE_FLAT_FEE, DefaultValues.VEHICLE_FLAT_FEE));
  configurations.push(createPricingConfig(PricingConfigKey.INCLUDED_DISTANCE, DefaultValues.INCLUDED_DISTANCE));
  
  // Configurations FRAIS VARIABLES TRANSPORT - Noms alignés avec DefaultValues.ts
  configurations.push(createPricingConfig(PricingConfigKey.FUEL_CONSUMPTION_PER_100KM, DefaultValues.FUEL_CONSUMPTION_PER_100KM));
  configurations.push(createPricingConfig(PricingConfigKey.FUEL_PRICE_PER_LITER, DefaultValues.FUEL_PRICE_PER_LITER));
  configurations.push(createPricingConfig(PricingConfigKey.TOLL_COST_PER_KM, DefaultValues.TOLL_COST_PER_KM));
  configurations.push(createPricingConfig(PricingConfigKey.HIGHWAY_RATIO, DefaultValues.HIGHWAY_RATIO));
  
  // Configurations RÉDUCTIONS & RABAIS - Noms alignés avec DefaultValues.ts
  configurations.push(createPricingConfig(PricingConfigKey.EXTRA_DAY_DISCOUNT_RATE, DefaultValues.EXTRA_DAY_DISCOUNT_RATE));
  configurations.push(createPricingConfig(PricingConfigKey.EXTRA_WORKER_DISCOUNT_RATE, DefaultValues.EXTRA_WORKER_DISCOUNT_RATE));
  
  // Configurations PARAMÈTRES DE TARIFICATION COMPLÉMENTAIRES - Noms alignés avec DefaultValues.ts
  // TARIFICATION BASÉE SUR LE TEMPS
  configurations.push(createPricingConfig(PricingConfigKey.HOURLY_RATE_MULTIPLIER, DefaultValues.HOURLY_RATE_MULTIPLIER));
  configurations.push(createPricingConfig(PricingConfigKey.DAILY_RATE_MULTIPLIER, DefaultValues.DAILY_RATE_MULTIPLIER));
  configurations.push(createPricingConfig(PricingConfigKey.WEEKLY_RATE_MULTIPLIER, DefaultValues.WEEKLY_RATE_MULTIPLIER));
  
  // SEUILS DISTANCE & VOLUME
  configurations.push(createPricingConfig(PricingConfigKey.FREE_DELIVERY_DISTANCE_KM, DefaultValues.FREE_DELIVERY_DISTANCE_KM));
  configurations.push(createPricingConfig(PricingConfigKey.VOLUME_DISCOUNT_THRESHOLD_M3, DefaultValues.VOLUME_DISCOUNT_THRESHOLD_M3));
  configurations.push(createPricingConfig(PricingConfigKey.VOLUME_DISCOUNT_RATE, DefaultValues.VOLUME_DISCOUNT_RATE));
  
  // COÛTS ÉQUIPEMENT & MATÉRIEL
  configurations.push(createPricingConfig(PricingConfigKey.EQUIPMENT_RENTAL_DAILY, DefaultValues.EQUIPMENT_RENTAL_DAILY));
  configurations.push(createPricingConfig(PricingConfigKey.MATERIAL_COST_PER_M3, DefaultValues.MATERIAL_COST_PER_M3));
  configurations.push(createPricingConfig(PricingConfigKey.PROTECTIVE_EQUIPMENT_COST, DefaultValues.PROTECTIVE_EQUIPMENT_COST));
  
  // CONSTANTES OPÉRATIONNELLES
  configurations.push(createPricingConfig(PricingConfigKey.MAX_WORKERS_PER_VEHICLE, DefaultValues.MAX_WORKERS_PER_VEHICLE));
  configurations.push(createPricingConfig(PricingConfigKey.MAX_VOLUME_PER_VEHICLE_M3, DefaultValues.MAX_VOLUME_PER_VEHICLE_M3));
  configurations.push(createPricingConfig(PricingConfigKey.STANDARD_SERVICE_DURATION_HOURS, DefaultValues.STANDARD_SERVICE_DURATION_HOURS));
  configurations.push(createPricingConfig(PricingConfigKey.OVERTIME_RATE_MULTIPLIER, DefaultValues.OVERTIME_RATE_MULTIPLIER));
  
  // STANDARDS QUALITÉ & SÉCURITÉ
  configurations.push(createPricingConfig(PricingConfigKey.INSURANCE_COVERAGE_MINIMUM, DefaultValues.INSURANCE_COVERAGE_MINIMUM));
  configurations.push(createPricingConfig(PricingConfigKey.QUALITY_GUARANTEE_DAYS, DefaultValues.QUALITY_GUARANTEE_DAYS));
  configurations.push(createPricingConfig(PricingConfigKey.SAFETY_EQUIPMENT_REQUIRED, DefaultValues.SAFETY_EQUIPMENT_REQUIRED ? 1 : 0));
  
  // ASSURANCE - Prix d'assurance centralisés
  configurations.push(createPricingConfig(PricingConfigKey.INSURANCE_PRICE_HT, DefaultValues.INSURANCE_PRICE_HT));
  configurations.push(createPricingConfig(PricingConfigKey.INSURANCE_PRICE_TTC, DefaultValues.INSURANCE_PRICE_TTC));
  
  // CONSTANTES ATTRIBUTION PROFESSIONNELS
  configurations.push(createPricingConfig(PricingConfigKey.PROFESSIONAL_DEFAULT_SEARCH_RADIUS_KM, DefaultValues.PROFESSIONAL_DEFAULT_SEARCH_RADIUS_KM));
  
  // Configurations TARIFS PAR TYPE DE SERVICE MÉTIER - Tarification différenciée
  // DÉMÉNAGEMENT
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.MOVING_BASE_PRICE_PER_M3, DefaultValues.MOVING_BASE_PRICE_PER_M3));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.MOVING_WORKER_PRICE, DefaultValues.MOVING_WORKER_PRICE));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.MOVING_WORKER_HOUR_RATE, DefaultValues.MOVING_WORKER_HOUR_RATE));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.MOVING_EXTRA_HOUR_RATE, DefaultValues.MOVING_EXTRA_HOUR_RATE));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.MOVING_LIFT_PRICE, DefaultValues.MOVING_LIFT_PRICE));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.MOVING_VEHICLE_FLAT_FEE, DefaultValues.MOVING_VEHICLE_FLAT_FEE));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.MOVING_BOXES_PER_M3, DefaultValues.MOVING_BOXES_PER_M3));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.MOVING_BOX_PRICE, DefaultValues.MOVING_BOX_PRICE));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.MOVING_WORKERS_PER_M3_THRESHOLD, DefaultValues.MOVING_WORKERS_PER_M3_THRESHOLD));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.MOVING_PREMIUM_WORKER_PRICE_PER_HOUR, DefaultValues.MOVING_PREMIUM_WORKER_PRICE_PER_HOUR));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.MOVING_PREMIUM_SUPPLIES_MULTIPLIER, DefaultValues.MOVING_PREMIUM_SUPPLIES_MULTIPLIER));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.HOURS_PER_DAY, DefaultValues.HOURS_PER_DAY));
  
  // NETTOYAGE
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.CLEANING_PRICE_PER_M2, DefaultValues.CLEANING_PRICE_PER_M2));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.CLEANING_WORKER_PRICE, DefaultValues.CLEANING_WORKER_PRICE));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.CLEANING_WORKER_HOUR_RATE, DefaultValues.CLEANING_WORKER_HOUR_RATE));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.CLEANING_EXTRA_HOUR_RATE, DefaultValues.CLEANING_EXTRA_HOUR_RATE));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.CLEANING_MINIMUM_PRICE, DefaultValues.CLEANING_MINIMUM_PRICE));
  
  // LIVRAISON
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.DELIVERY_BASE_PRICE, DefaultValues.DELIVERY_BASE_PRICE));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.DELIVERY_PRICE_PER_KM, DefaultValues.DELIVERY_PRICE_PER_KM));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.DELIVERY_WORKER_HOUR_RATE, DefaultValues.DELIVERY_WORKER_HOUR_RATE));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.DELIVERY_EXTRA_HOUR_RATE, DefaultValues.DELIVERY_EXTRA_HOUR_RATE));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.DELIVERY_WEIGHT_SURCHARGE, DefaultValues.DELIVERY_WEIGHT_SURCHARGE));
  
  // TRANSPORT
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.TRANSPORT_BASE_PRICE, DefaultValues.TRANSPORT_BASE_PRICE));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.TRANSPORT_PRICE_PER_KM, DefaultValues.TRANSPORT_PRICE_PER_KM));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.TRANSPORT_WORKER_HOUR_RATE, DefaultValues.TRANSPORT_WORKER_HOUR_RATE));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.TRANSPORT_EXTRA_HOUR_RATE, DefaultValues.TRANSPORT_EXTRA_HOUR_RATE));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.TRANSPORT_VOLUME_SURCHARGE, DefaultValues.TRANSPORT_VOLUME_SURCHARGE));
  
  // EMBALLAGE
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.PACKING_PRICE_PER_M3, DefaultValues.PACKING_PRICE_PER_M3));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.PACKING_WORKER_PRICE, DefaultValues.PACKING_WORKER_PRICE));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.PACKING_WORKER_HOUR_RATE, DefaultValues.PACKING_WORKER_HOUR_RATE));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.PACKING_EXTRA_HOUR_RATE, DefaultValues.PACKING_EXTRA_HOUR_RATE));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.PACKING_MATERIAL_COST, DefaultValues.PACKING_MATERIAL_COST));
  
  // STOCKAGE
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.STORAGE_PRICE_PER_M3_PER_MONTH, DefaultValues.STORAGE_PRICE_PER_M3_PER_MONTH));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.STORAGE_WORKER_HOUR_RATE, DefaultValues.STORAGE_WORKER_HOUR_RATE));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.STORAGE_EXTRA_HOUR_RATE, DefaultValues.STORAGE_EXTRA_HOUR_RATE));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.STORAGE_MINIMUM_DURATION_MONTHS, DefaultValues.STORAGE_MINIMUM_DURATION_MONTHS));
  configurations.push(createBusinessTypePricingConfig(BusinessTypePricingConfigKey.STORAGE_ACCESS_FEE, DefaultValues.STORAGE_ACCESS_FEE));
  
  // NOTE: Les règles métier sont maintenant commentées dans DefaultValues.ts
  // Elles seront réactivées lors de futures implémentations
  // Pour l'instant, seules les constantes de base sont utilisées
  
  // Paramètres de service
  configurations.push(createServiceParamsConfig(ServiceParamsConfigKey.AVAILABLE_SERVICE_TYPES, 
    [ServiceType.MOVING, ServiceType.PACKING, ServiceType.CLEANING, ServiceType.DELIVERY, ServiceType.SERVICE], 
    "Types de services activés dans l'application"));
  
  configurations.push(createServiceParamsConfig(ServiceParamsConfigKey.AVAILABLE_PACK_TYPES, 
    ['basic', 'standard', 'premium', 'custom'], 
    "Types de forfaits activés dans l'application"));
  
  return configurations;
}

/**
 * Crée une configuration pour une clé de tarification avec une valeur spécifique
 */
function createPricingConfig(key: PricingConfigKey, value: any): Configuration {
  return Configuration.create(
    ConfigurationCategory.PRICING,
    key,
    value,
    `Valeur par défaut pour ${key}`
  );
}

/**
 * Crée une configuration pour une clé de règle métier avec une valeur spécifique
 */
function createBusinessRulesConfig(key: BusinessRulesConfigKey, value: any, description: string): Configuration {
  return Configuration.create(
    ConfigurationCategory.BUSINESS_RULES,
    key,
    value,
    description
  );
}

/**
 * Crée une configuration pour une clé de paramètre de service avec une valeur spécifique
 */
function createServiceParamsConfig(key: ServiceParamsConfigKey, value: any, description: string): Configuration {
  return Configuration.create(
    ConfigurationCategory.SERVICE_PARAMS,
    key,
    value,
    description
  );
}

/**
 * Crée une configuration pour une clé de tarification par type de service métier avec une valeur spécifique
 */
function createBusinessTypePricingConfig(key: BusinessTypePricingConfigKey, value: any): Configuration {
  return Configuration.create(
    ConfigurationCategory.BUSINESS_TYPE_PRICING,
    key,
    value,
    `Tarification par type de service métier pour ${key}`
  );
}

/**
 * Initialise le service de configuration avec les valeurs par défaut
 */
export function initializeConfigurationService(configService: any): void {
  const defaultConfigs = createDefaultConfigurations();
  
  for (const config of defaultConfigs) {
    configService.addOrUpdateConfiguration(config);
  }
} 