import { Configuration } from './Configuration';
import { ConfigurationCategory, PricingConfigKey, BusinessRulesConfigKey, ServiceParamsConfigKey } from './ConfigurationKey';
import { ServiceType } from '../enums/ServiceType';

/**
 * Crée les configurations par défaut pour le système de tarification
 * @returns Un tableau de configurations avec les valeurs par défaut
 */
export function createDefaultConfigurations(): Configuration[] {
  const configurations: Configuration[] = [];
  
  // Configurations pour Moving
  configurations.push(createPricingConfig(PricingConfigKey.MOVING_BASE_PRICE_PER_M3, 10));
  configurations.push(createPricingConfig(PricingConfigKey.MOVING_DISTANCE_PRICE_PER_KM, 2));
  configurations.push(createPricingConfig(PricingConfigKey.FUEL_CONSUMPTION_PER_100KM, 25));
  configurations.push(createPricingConfig(PricingConfigKey.FUEL_PRICE_PER_LITER, 1.8));
  configurations.push(createPricingConfig(PricingConfigKey.TOLL_COST_PER_KM, 0.15));
  configurations.push(createPricingConfig(PricingConfigKey.HIGHWAY_RATIO, 0.7));
  
  // Configurations pour Pack
  configurations.push(createPricingConfig(PricingConfigKey.PACK_WORKER_PRICE, 120));
  configurations.push(createPricingConfig(PricingConfigKey.PACK_INCLUDED_DISTANCE, 20));
  configurations.push(createPricingConfig(PricingConfigKey.PACK_EXTRA_KM_PRICE, 1.5));
  configurations.push(createPricingConfig(PricingConfigKey.PACK_EXTRA_DAY_DISCOUNT_RATE, 0.8));
  configurations.push(createPricingConfig(PricingConfigKey.PACK_WORKER_DISCOUNT_RATE_1_DAY, 0.05));
  configurations.push(createPricingConfig(PricingConfigKey.PACK_WORKER_DISCOUNT_RATE_MULTI_DAYS, 0.10));
  configurations.push(createPricingConfig(PricingConfigKey.PACK_LIFT_PRICE, 200));
  
  // Configurations pour Service
  configurations.push(createPricingConfig(PricingConfigKey.SERVICE_WORKER_PRICE_PER_HOUR, 35));
  configurations.push(createPricingConfig(PricingConfigKey.SERVICE_WORKER_DISCOUNT_RATE_SHORT, 0.1));
  configurations.push(createPricingConfig(PricingConfigKey.SERVICE_WORKER_DISCOUNT_RATE_LONG, 0.15));
  
  // Configurations des règles métier
  // Moving
  configurations.push(createBusinessRulesConfig(BusinessRulesConfigKey.MOVING_EARLY_BOOKING_DAYS, 30, 
    "Jours pour réduction de réservation anticipée (déménagement)"));
  configurations.push(createBusinessRulesConfig(BusinessRulesConfigKey.MOVING_EARLY_BOOKING_DISCOUNT, 10, 
    "Pourcentage de réduction pour réservation anticipée (déménagement)"));
  configurations.push(createBusinessRulesConfig(BusinessRulesConfigKey.MOVING_WEEKEND_SURCHARGE, 15, 
    "Supplément pour déménagement en week-end"));
  
  // Service
  configurations.push(createBusinessRulesConfig(BusinessRulesConfigKey.SERVICE_EARLY_BOOKING_DAYS, 14, 
    "Jours pour réduction de réservation anticipée (service)"));
  configurations.push(createBusinessRulesConfig(BusinessRulesConfigKey.SERVICE_EARLY_BOOKING_DISCOUNT, 5, 
    "Pourcentage de réduction pour réservation anticipée (service)"));
  configurations.push(createBusinessRulesConfig(BusinessRulesConfigKey.SERVICE_WEEKEND_SURCHARGE, 10, 
    "Supplément pour service en week-end"));
  
  // Pack
  configurations.push(createBusinessRulesConfig(BusinessRulesConfigKey.PACK_EARLY_BOOKING_DAYS, 14, 
    "Jours pour réduction de réservation anticipée (pack)"));
  configurations.push(createBusinessRulesConfig(BusinessRulesConfigKey.PACK_EARLY_BOOKING_DISCOUNT, 5, 
    "Pourcentage de réduction pour réservation anticipée (pack)"));
  configurations.push(createBusinessRulesConfig(BusinessRulesConfigKey.PACK_WEEKEND_SURCHARGE, 10, 
    "Supplément pour pack en week-end"));
  configurations.push(createBusinessRulesConfig(BusinessRulesConfigKey.PACK_URGENT_BOOKING_SURCHARGE, 20, 
    "Supplément pour réservation urgente de pack"));
  
  // Paramètres de service
  configurations.push(createServiceParamsConfig(ServiceParamsConfigKey.AVAILABLE_SERVICE_TYPES, 
    [ServiceType.MOVING, ServiceType.PACKING, ServiceType.CLEANING, ServiceType.DELIVERY, ServiceType.PACK, ServiceType.SERVICE], 
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
 * Initialise le service de configuration avec les valeurs par défaut
 */
export function initializeConfigurationService(configService: any): void {
  const defaultConfigs = createDefaultConfigurations();
  
  for (const config of defaultConfigs) {
    configService.addOrUpdateConfiguration(config);
  }
} 