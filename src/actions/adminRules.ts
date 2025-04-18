'use server'

import { ServiceType } from '@/quotation/domain/enums/ServiceType';
import { 
  ConfigurationCategory, 
  BusinessRulesConfigKey, 
  LimitsConfigKey, 
  ServiceParamsConfigKey 
} from '@/quotation/domain/configuration/ConfigurationKey';
import { ConfigurationRepository } from '@/quotation/infrastructure/repositories/ConfigurationRepository';
import { Configuration } from '@/quotation/domain/configuration/Configuration';

/**
 * Interface pour les règles métier
 */
export interface BusinessRulesConfig {
  // Règles de réservation
  minAdvanceBookingHours: string;
  maxDaysInAdvance: string;
  cancellationDeadlineHours: string;
  
  // Règles de remboursement
  fullRefundHours: string;
  partialRefundPercentage: string;
  
  // Règles de planification
  minServiceDuration: string;
  maxServiceDuration: string;
  bufferBetweenBookings: string;
  
  // Règles par type de service
  movingEarlyBookingDays: string;
  movingEarlyBookingDiscount: string;
  movingWeekendSurcharge: string;
  
  serviceEarlyBookingDays: string;
  serviceEarlyBookingDiscount: string;
  serviceWeekendSurcharge: string;
  
  packEarlyBookingDays: string;
  packEarlyBookingDiscount: string;
  packWeekendSurcharge: string;
  packUrgentBookingSurcharge: string;
}

/**
 * Interface pour les limites
 */
export interface LimitsConfig {
  // Limites de réservation
  maxActiveBookingsPerUser: string;
  maxBookingsPerDay: string;
  maxActivePromoCodes: string;
  
  // Limites de service
  maxWorkersPerService: string;
  maxWorkersPerPack: string;
  maxItemsPerBooking: string;
  
  // Limites de distance
  maxServiceDistance: string;
  maxPackDistance: string;
  
  // Limites générales
  minBookingHours: string;
  maxBookingDaysAhead: string;
  minWorkers: string;
  maxWorkers: string;
}

/**
 * Interface pour les paramètres de service
 */
export interface ServiceParamsConfig {
  // Types de service
  enabledServiceTypes: string[];
  enabledPackTypes: string[];
  
  // Paramètres de disponibilité
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: string[];
  
  // Paramètres de trajet
  defaultTravelSpeed: string;
  workerSetupTime: string;
}

/**
 * Récupère les règles métier actuelles
 */
export async function getBusinessRulesConfig(): Promise<BusinessRulesConfig> {
  const configRepository = ConfigurationRepository.getInstance();
  const configService = configRepository.getConfigurationService();
  
  // Dans une implémentation réelle, ces valeurs viendraient de la configuration
  return {
    // Règles de réservation
    minAdvanceBookingHours: '24',
    maxDaysInAdvance: '90',
    cancellationDeadlineHours: '48',
    
    // Règles de remboursement
    fullRefundHours: '72',
    partialRefundPercentage: '50',
    
    // Règles de planification
    minServiceDuration: '1',
    maxServiceDuration: '8',
    bufferBetweenBookings: '1',
    
    // Règles par type de service
    movingEarlyBookingDays: configService.getStringValue(
      ConfigurationCategory.BUSINESS_RULES, 
      BusinessRulesConfigKey.MOVING_EARLY_BOOKING_DAYS, 
      '30'
    ),
    movingEarlyBookingDiscount: configService.getStringValue(
      ConfigurationCategory.BUSINESS_RULES, 
      BusinessRulesConfigKey.MOVING_EARLY_BOOKING_DISCOUNT, 
      '10'
    ),
    movingWeekendSurcharge: configService.getStringValue(
      ConfigurationCategory.BUSINESS_RULES, 
      BusinessRulesConfigKey.MOVING_WEEKEND_SURCHARGE, 
      '15'
    ),
    
    serviceEarlyBookingDays: configService.getStringValue(
      ConfigurationCategory.BUSINESS_RULES, 
      BusinessRulesConfigKey.SERVICE_EARLY_BOOKING_DAYS, 
      '14'
    ),
    serviceEarlyBookingDiscount: configService.getStringValue(
      ConfigurationCategory.BUSINESS_RULES, 
      BusinessRulesConfigKey.SERVICE_EARLY_BOOKING_DISCOUNT, 
      '5'
    ),
    serviceWeekendSurcharge: configService.getStringValue(
      ConfigurationCategory.BUSINESS_RULES, 
      BusinessRulesConfigKey.SERVICE_WEEKEND_SURCHARGE, 
      '10'
    ),
    
    packEarlyBookingDays: configService.getStringValue(
      ConfigurationCategory.BUSINESS_RULES, 
      BusinessRulesConfigKey.PACK_EARLY_BOOKING_DAYS, 
      '14'
    ),
    packEarlyBookingDiscount: configService.getStringValue(
      ConfigurationCategory.BUSINESS_RULES, 
      BusinessRulesConfigKey.PACK_EARLY_BOOKING_DISCOUNT, 
      '5'
    ),
    packWeekendSurcharge: configService.getStringValue(
      ConfigurationCategory.BUSINESS_RULES, 
      BusinessRulesConfigKey.PACK_WEEKEND_SURCHARGE, 
      '10'
    ),
    packUrgentBookingSurcharge: configService.getStringValue(
      ConfigurationCategory.BUSINESS_RULES, 
      BusinessRulesConfigKey.PACK_URGENT_BOOKING_SURCHARGE, 
      '20'
    ),
  };
}

/**
 * Récupère les limites actuelles
 */
export async function getLimitsConfig(): Promise<LimitsConfig> {
  const configRepository = ConfigurationRepository.getInstance();
  const configService = configRepository.getConfigurationService();
  
  // Dans une implémentation réelle, ces valeurs viendraient de la configuration
  return {
    // Limites de réservation
    maxActiveBookingsPerUser: '5',
    maxBookingsPerDay: '10',
    maxActivePromoCodes: '3',
    
    // Limites de service
    maxWorkersPerService: '5',
    maxWorkersPerPack: '8',
    maxItemsPerBooking: '20',
    
    // Limites de distance
    maxServiceDistance: '50',
    maxPackDistance: '100',
    
    // Limites générales
    minBookingHours: configService.getStringValue(
      ConfigurationCategory.LIMITS, 
      LimitsConfigKey.MIN_BOOKING_HOURS, 
      '24'
    ),
    maxBookingDaysAhead: configService.getStringValue(
      ConfigurationCategory.LIMITS, 
      LimitsConfigKey.MAX_BOOKING_DAYS_AHEAD, 
      '90'
    ),
    minWorkers: configService.getStringValue(
      ConfigurationCategory.LIMITS, 
      LimitsConfigKey.MIN_WORKERS, 
      '1'
    ),
    maxWorkers: configService.getStringValue(
      ConfigurationCategory.LIMITS, 
      LimitsConfigKey.MAX_WORKERS, 
      '10'
    ),
  };
}

/**
 * Récupère les paramètres de service actuels
 */
export async function getServiceParamsConfig(): Promise<ServiceParamsConfig> {
  const configRepository = ConfigurationRepository.getInstance();
  const configService = configRepository.getConfigurationService();
  
  const availableServiceTypes = configService.getConfiguration(
    ConfigurationCategory.SERVICE_PARAMS,
    ServiceParamsConfigKey.AVAILABLE_SERVICE_TYPES
  );
  
  const enabledServiceTypes = availableServiceTypes ? 
    availableServiceTypes.value : 
    [
      ServiceType.MOVING,
      ServiceType.CLEANING,
      ServiceType.PACKING,
      ServiceType.DELIVERY
    ];
  
  const availablePackTypes = configService.getConfiguration(
    ConfigurationCategory.SERVICE_PARAMS,
    ServiceParamsConfigKey.AVAILABLE_PACK_TYPES
  );
  
  const enabledPackTypes = availablePackTypes ? 
    availablePackTypes.value : 
    ['basic', 'standard', 'premium'];
  
  // Récupérer les paramètres de disponibilité
  const workingHoursStartConfig = configService.getConfiguration(
    ConfigurationCategory.SERVICE_PARAMS,
    ServiceParamsConfigKey.WORKING_HOURS_START
  );
  
  const workingHoursStart = workingHoursStartConfig ?
    workingHoursStartConfig.value : 
    '8:00';
  
  const workingHoursEndConfig = configService.getConfiguration(
    ConfigurationCategory.SERVICE_PARAMS,
    ServiceParamsConfigKey.WORKING_HOURS_END
  );
  
  const workingHoursEnd = workingHoursEndConfig ?
    workingHoursEndConfig.value : 
    '18:00';
  
  const workingDaysConfig = configService.getConfiguration(
    ConfigurationCategory.SERVICE_PARAMS,
    ServiceParamsConfigKey.WORKING_DAYS
  );
  
  const workingDays = workingDaysConfig ?
    workingDaysConfig.value : 
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  // Récupérer les paramètres de trajet
  const defaultTravelSpeedConfig = configService.getConfiguration(
    ConfigurationCategory.SERVICE_PARAMS,
    ServiceParamsConfigKey.DEFAULT_TRAVEL_SPEED
  );
  
  const defaultTravelSpeed = defaultTravelSpeedConfig ?
    defaultTravelSpeedConfig.value : 
    '30';
  
  const workerSetupTimeConfig = configService.getConfiguration(
    ConfigurationCategory.SERVICE_PARAMS,
    ServiceParamsConfigKey.WORKER_SETUP_TIME
  );
  
  const workerSetupTime = workerSetupTimeConfig ?
    workerSetupTimeConfig.value : 
    '15';
  
  return {
    // Types de service
    enabledServiceTypes,
    enabledPackTypes,
    
    // Paramètres de disponibilité
    workingHoursStart,
    workingHoursEnd,
    workingDays,
    
    // Paramètres de trajet
    defaultTravelSpeed,
    workerSetupTime,
  };
}

/**
 * Sauvegarde les règles métier
 */
export async function saveBusinessRulesConfig(config: BusinessRulesConfig): Promise<{ success: boolean, message: string }> {
  try {
    const configRepository = ConfigurationRepository.getInstance();
    
    // Enregistrer les règles métier pour les types de service
    // Moving rules
    const movingEarlyBookingDaysConfig = Configuration.create(
      ConfigurationCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.MOVING_EARLY_BOOKING_DAYS,
      config.movingEarlyBookingDays,
      'Jours pour réduction de réservation anticipée (déménagement)'
    );
    configRepository.saveConfiguration(movingEarlyBookingDaysConfig);
    
    const movingEarlyBookingDiscountConfig = Configuration.create(
      ConfigurationCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.MOVING_EARLY_BOOKING_DISCOUNT,
      config.movingEarlyBookingDiscount,
      'Pourcentage de réduction pour réservation anticipée (déménagement)'
    );
    configRepository.saveConfiguration(movingEarlyBookingDiscountConfig);
    
    const movingWeekendSurchargeConfig = Configuration.create(
      ConfigurationCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.MOVING_WEEKEND_SURCHARGE,
      config.movingWeekendSurcharge,
      'Supplément pour déménagement en week-end'
    );
    configRepository.saveConfiguration(movingWeekendSurchargeConfig);
    
    // Service rules
    const serviceEarlyBookingDaysConfig = Configuration.create(
      ConfigurationCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.SERVICE_EARLY_BOOKING_DAYS,
      config.serviceEarlyBookingDays,
      'Jours pour réduction de réservation anticipée (service)'
    );
    configRepository.saveConfiguration(serviceEarlyBookingDaysConfig);
    
    const serviceEarlyBookingDiscountConfig = Configuration.create(
      ConfigurationCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.SERVICE_EARLY_BOOKING_DISCOUNT,
      config.serviceEarlyBookingDiscount,
      'Pourcentage de réduction pour réservation anticipée (service)'
    );
    configRepository.saveConfiguration(serviceEarlyBookingDiscountConfig);
    
    const serviceWeekendSurchargeConfig = Configuration.create(
      ConfigurationCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.SERVICE_WEEKEND_SURCHARGE,
      config.serviceWeekendSurcharge,
      'Supplément pour service en week-end'
    );
    configRepository.saveConfiguration(serviceWeekendSurchargeConfig);
    
    // Pack rules
    const packEarlyBookingDaysConfig = Configuration.create(
      ConfigurationCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.PACK_EARLY_BOOKING_DAYS,
      config.packEarlyBookingDays,
      'Jours pour réduction de réservation anticipée (pack)'
    );
    configRepository.saveConfiguration(packEarlyBookingDaysConfig);
    
    const packEarlyBookingDiscountConfig = Configuration.create(
      ConfigurationCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.PACK_EARLY_BOOKING_DISCOUNT,
      config.packEarlyBookingDiscount,
      'Pourcentage de réduction pour réservation anticipée (pack)'
    );
    configRepository.saveConfiguration(packEarlyBookingDiscountConfig);
    
    const packWeekendSurchargeConfig = Configuration.create(
      ConfigurationCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.PACK_WEEKEND_SURCHARGE,
      config.packWeekendSurcharge,
      'Supplément pour pack en week-end'
    );
    configRepository.saveConfiguration(packWeekendSurchargeConfig);
    
    const packUrgentBookingSurchargeConfig = Configuration.create(
      ConfigurationCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.PACK_URGENT_BOOKING_SURCHARGE,
      config.packUrgentBookingSurcharge,
      'Supplément pour réservation urgente de pack'
    );
    configRepository.saveConfiguration(packUrgentBookingSurchargeConfig);
    
    // Simulation d'une pause pour l'UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: "Règles métier mises à jour avec succès"
    };
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des règles métier:", error);
    return {
      success: false,
      message: "Une erreur est survenue lors de la mise à jour des règles métier"
    };
  }
}

/**
 * Sauvegarde les limites
 */
export async function saveLimitsConfig(config: LimitsConfig): Promise<{ success: boolean, message: string }> {
  try {
    const configRepository = ConfigurationRepository.getInstance();
    
    // Enregistrer les limites générales
    const minBookingHoursConfig = Configuration.create(
      ConfigurationCategory.LIMITS,
      LimitsConfigKey.MIN_BOOKING_HOURS,
      config.minBookingHours,
      'Heures minimales avant réservation'
    );
    configRepository.saveConfiguration(minBookingHoursConfig);
    
    const maxBookingDaysAheadConfig = Configuration.create(
      ConfigurationCategory.LIMITS,
      LimitsConfigKey.MAX_BOOKING_DAYS_AHEAD,
      config.maxBookingDaysAhead,
      'Jours maximum à l\'avance pour une réservation'
    );
    configRepository.saveConfiguration(maxBookingDaysAheadConfig);
    
    // Simulation d'une pause pour l'UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: "Limites mises à jour avec succès"
    };
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des limites:", error);
    return {
      success: false,
      message: "Une erreur est survenue lors de la mise à jour des limites"
    };
  }
}

/**
 * Sauvegarde les paramètres de service
 */
export async function saveServiceParamsConfig(config: ServiceParamsConfig): Promise<{ success: boolean, message: string }> {
  try {
    const configRepository = ConfigurationRepository.getInstance();
    
    // Enregistrer les types de service disponibles
    const availableServiceTypesConfig = Configuration.create(
      ConfigurationCategory.SERVICE_PARAMS,
      ServiceParamsConfigKey.AVAILABLE_SERVICE_TYPES,
      config.enabledServiceTypes,
      'Types de services activés dans l\'application'
    );
    configRepository.saveConfiguration(availableServiceTypesConfig);
    
    // Enregistrer les types de pack disponibles
    const availablePackTypesConfig = Configuration.create(
      ConfigurationCategory.SERVICE_PARAMS,
      ServiceParamsConfigKey.AVAILABLE_PACK_TYPES,
      config.enabledPackTypes,
      'Types de forfaits activés dans l\'application'
    );
    configRepository.saveConfiguration(availablePackTypesConfig);
    
    // Enregistrer les heures de travail
    const workingHoursStartConfig = Configuration.create(
      ConfigurationCategory.SERVICE_PARAMS,
      ServiceParamsConfigKey.WORKING_HOURS_START,
      config.workingHoursStart,
      'Heure de début de la journée de travail'
    );
    configRepository.saveConfiguration(workingHoursStartConfig);
    
    const workingHoursEndConfig = Configuration.create(
      ConfigurationCategory.SERVICE_PARAMS,
      ServiceParamsConfigKey.WORKING_HOURS_END,
      config.workingHoursEnd,
      'Heure de fin de la journée de travail'
    );
    configRepository.saveConfiguration(workingHoursEndConfig);
    
    // Enregistrer les jours de travail
    const workingDaysConfig = Configuration.create(
      ConfigurationCategory.SERVICE_PARAMS,
      ServiceParamsConfigKey.WORKING_DAYS,
      config.workingDays,
      'Jours de travail dans la semaine'
    );
    configRepository.saveConfiguration(workingDaysConfig);
    
    // Enregistrer les paramètres de trajet
    const defaultTravelSpeedConfig = Configuration.create(
      ConfigurationCategory.SERVICE_PARAMS,
      ServiceParamsConfigKey.DEFAULT_TRAVEL_SPEED,
      config.defaultTravelSpeed,
      'Vitesse moyenne de déplacement en km/h'
    );
    configRepository.saveConfiguration(defaultTravelSpeedConfig);
    
    const workerSetupTimeConfig = Configuration.create(
      ConfigurationCategory.SERVICE_PARAMS,
      ServiceParamsConfigKey.WORKER_SETUP_TIME,
      config.workerSetupTime,
      'Temps nécessaire pour la préparation en minutes'
    );
    configRepository.saveConfiguration(workerSetupTimeConfig);
    
    // Simulation d'une pause pour l'UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: "Paramètres de service mis à jour avec succès"
    };
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des paramètres de service:", error);
    return {
      success: false,
      message: "Une erreur est survenue lors de la mise à jour des paramètres de service"
    };
  }
} 