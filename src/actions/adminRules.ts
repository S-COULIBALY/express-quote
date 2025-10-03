'use server'

import { ServiceType } from '@/quotation/domain/enums/ServiceType';
import {
  BusinessRulesConfigKey,
  LimitsConfigKey,
  ServiceParamsConfigKey
} from '@/quotation/domain/configuration/ConfigurationKey';
// Ancienne imports désormais inutiles - migration vers UnifiedDataService
// import { ConfigurationRepository } from '@/quotation/infrastructure/repositories/ConfigurationRepository';
// import { Configuration } from '@/quotation/domain/configuration/Configuration';
import { UnifiedDataService, ConfigurationCategory as UnifiedConfigCategory } from '@/quotation/infrastructure/services/UnifiedDataService';
import { logger } from '@/lib/logger';

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
  logger.info('🔍 [ADMIN-RULES] Récupération des règles métier...');
  logger.info('🔍 [ADMIN-RULES] Origine: adminRules.getBusinessRulesConfig via UnifiedDataService');

  const unifiedService = UnifiedDataService.getInstance();

  // Récupération depuis le système unifié avec fallback
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
    
    // Règles par type de service - récupération depuis UnifiedDataService
    movingEarlyBookingDays: await unifiedService.getConfigurationValue(
      UnifiedConfigCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.MOVING_EARLY_BOOKING_DAYS,
      '30'
    ),
    movingEarlyBookingDiscount: await unifiedService.getConfigurationValue(
      UnifiedConfigCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.MOVING_EARLY_BOOKING_DISCOUNT,
      '10'
    ),
    movingWeekendSurcharge: await unifiedService.getConfigurationValue(
      UnifiedConfigCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.MOVING_WEEKEND_SURCHARGE,
      '15'
    ),

    serviceEarlyBookingDays: await unifiedService.getConfigurationValue(
      UnifiedConfigCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.SERVICE_EARLY_BOOKING_DAYS,
      '14'
    ),
    serviceEarlyBookingDiscount: await unifiedService.getConfigurationValue(
      UnifiedConfigCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.SERVICE_EARLY_BOOKING_DISCOUNT,
      '5'
    ),
    serviceWeekendSurcharge: await unifiedService.getConfigurationValue(
      UnifiedConfigCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.SERVICE_WEEKEND_SURCHARGE,
      '10'
    ),

    packEarlyBookingDays: await unifiedService.getConfigurationValue(
      UnifiedConfigCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.PACK_EARLY_BOOKING_DAYS,
      '14'
    ),
    packEarlyBookingDiscount: await unifiedService.getConfigurationValue(
      UnifiedConfigCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.PACK_EARLY_BOOKING_DISCOUNT,
      '5'
    ),
    packWeekendSurcharge: await unifiedService.getConfigurationValue(
      UnifiedConfigCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.PACK_WEEKEND_SURCHARGE,
      '10'
    ),
    packUrgentBookingSurcharge: await unifiedService.getConfigurationValue(
      UnifiedConfigCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.PACK_URGENT_BOOKING_SURCHARGE,
      '20'
    ),
  };
}

/**
 * Récupère les limites actuelles
 */
export async function getLimitsConfig(): Promise<LimitsConfig> {
  logger.info('🔍 [ADMIN-RULES] Récupération des limites...');
  logger.info('🔍 [ADMIN-RULES] Origine: adminRules.getLimitsConfig via UnifiedDataService');

  const unifiedService = UnifiedDataService.getInstance();

  // Récupération depuis le système unifié avec fallback
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
    
    // Limites générales - récupération depuis UnifiedDataService
    minBookingHours: await unifiedService.getConfigurationValue(
      UnifiedConfigCategory.LIMITS,
      LimitsConfigKey.MIN_BOOKING_HOURS,
      '24'
    ),
    maxBookingDaysAhead: await unifiedService.getConfigurationValue(
      UnifiedConfigCategory.LIMITS,
      LimitsConfigKey.MAX_BOOKING_DAYS_AHEAD,
      '90'
    ),
    minWorkers: await unifiedService.getConfigurationValue(
      UnifiedConfigCategory.LIMITS,
      LimitsConfigKey.MIN_WORKERS,
      '1'
    ),
    maxWorkers: await unifiedService.getConfigurationValue(
      UnifiedConfigCategory.LIMITS,
      LimitsConfigKey.MAX_WORKERS,
      '10'
    ),
  };
}

/**
 * Récupère les paramètres de service actuels
 */
export async function getServiceParamsConfig(): Promise<ServiceParamsConfig> {
  logger.info('🔍 [ADMIN-RULES] Récupération des paramètres de service...');
  logger.info('🔍 [ADMIN-RULES] Origine: adminRules.getServiceParamsConfig via UnifiedDataService');

  const unifiedService = UnifiedDataService.getInstance();

  // Récupération depuis le système unifié avec fallback
  const enabledServiceTypes = await unifiedService.getConfigurationValue(
    UnifiedConfigCategory.SERVICE_PARAMS,
    ServiceParamsConfigKey.AVAILABLE_SERVICE_TYPES,
    [
      ServiceType.MOVING,
      ServiceType.CLEANING,
      ServiceType.PACKING,
      ServiceType.DELIVERY
    ]
  );

  const enabledPackTypes = await unifiedService.getConfigurationValue(
    UnifiedConfigCategory.SERVICE_PARAMS,
    ServiceParamsConfigKey.AVAILABLE_PACK_TYPES,
    ['basic', 'standard', 'premium']
  );

  // Récupérer les paramètres de disponibilité
  const workingHoursStart = await unifiedService.getConfigurationValue(
    UnifiedConfigCategory.SERVICE_PARAMS,
    ServiceParamsConfigKey.WORKING_HOURS_START,
    '8:00'
  );

  const workingHoursEnd = await unifiedService.getConfigurationValue(
    UnifiedConfigCategory.SERVICE_PARAMS,
    ServiceParamsConfigKey.WORKING_HOURS_END,
    '18:00'
  );

  const workingDays = await unifiedService.getConfigurationValue(
    UnifiedConfigCategory.SERVICE_PARAMS,
    ServiceParamsConfigKey.WORKING_DAYS,
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  );

  // Récupérer les paramètres de trajet
  const defaultTravelSpeed = await unifiedService.getConfigurationValue(
    UnifiedConfigCategory.SERVICE_PARAMS,
    ServiceParamsConfigKey.DEFAULT_TRAVEL_SPEED,
    '30'
  );

  const workerSetupTime = await unifiedService.getConfigurationValue(
    UnifiedConfigCategory.SERVICE_PARAMS,
    ServiceParamsConfigKey.WORKER_SETUP_TIME,
    '15'
  );
  
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
 * Sauvegarde les règles métier avec vraie persistance BDD
 */
export async function saveBusinessRulesConfig(config: BusinessRulesConfig): Promise<{ success: boolean, message: string }> {
  try {
    logger.info('🔧 [ADMIN-RULES] Sauvegarde des règles métier en cours...');
    logger.info('🔍 [ADMIN-RULES] Origine: adminRules.saveBusinessRulesConfig via UnifiedDataService');
    const unifiedService = UnifiedDataService.getInstance();
    
    // Enregistrer toutes les règles métier en BDD avec rafraîchissement automatique
    await Promise.all([
    // Moving rules
      unifiedService.updateConfiguration(
      UnifiedConfigCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.MOVING_EARLY_BOOKING_DAYS,
      config.movingEarlyBookingDays,
      'Jours pour réduction de réservation anticipée (déménagement)'
      ),
      unifiedService.updateConfiguration(
      UnifiedConfigCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.MOVING_EARLY_BOOKING_DISCOUNT,
      config.movingEarlyBookingDiscount,
      'Pourcentage de réduction pour réservation anticipée (déménagement)'
      ),
      unifiedService.updateConfiguration(
      UnifiedConfigCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.MOVING_WEEKEND_SURCHARGE,
      config.movingWeekendSurcharge,
      'Supplément pour déménagement en week-end'
      ),
    
    // Service rules
      unifiedService.updateConfiguration(
      UnifiedConfigCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.SERVICE_EARLY_BOOKING_DAYS,
      config.serviceEarlyBookingDays,
      'Jours pour réduction de réservation anticipée (service)'
      ),
      unifiedService.updateConfiguration(
      UnifiedConfigCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.SERVICE_EARLY_BOOKING_DISCOUNT,
      config.serviceEarlyBookingDiscount,
      'Pourcentage de réduction pour réservation anticipée (service)'
      ),
      unifiedService.updateConfiguration(
      UnifiedConfigCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.SERVICE_WEEKEND_SURCHARGE,
      config.serviceWeekendSurcharge,
      'Supplément pour service en week-end'
      ),
    
    // Pack rules
      unifiedService.updateConfiguration(
      UnifiedConfigCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.PACK_EARLY_BOOKING_DAYS,
      config.packEarlyBookingDays,
      'Jours pour réduction de réservation anticipée (pack)'
      ),
      unifiedService.updateConfiguration(
      UnifiedConfigCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.PACK_EARLY_BOOKING_DISCOUNT,
      config.packEarlyBookingDiscount,
      'Pourcentage de réduction pour réservation anticipée (pack)'
      ),
      unifiedService.updateConfiguration(
      UnifiedConfigCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.PACK_WEEKEND_SURCHARGE,
      config.packWeekendSurcharge,
      'Supplément pour pack en week-end'
      ),
      unifiedService.updateConfiguration(
      UnifiedConfigCategory.BUSINESS_RULES,
      BusinessRulesConfigKey.PACK_URGENT_BOOKING_SURCHARGE,
      config.packUrgentBookingSurcharge,
      'Supplément pour réservation urgente de pack'
      ),
    ]);
    
    logger.info('✅ [ADMIN-RULES] Règles métier sauvegardées avec succès via UnifiedDataService');
    
    return {
      success: true,
      message: "Règles métier mises à jour avec succès en base de données"
    };
  } catch (error) {
    logger.error(error as Error, "❌ [ADMIN-RULES] Erreur lors de la sauvegarde des règles métier via UnifiedDataService");
    return {
      success: false,
      message: "Une erreur est survenue lors de la mise à jour des règles métier"
    };
  }
}

/**
 * Sauvegarde les limites avec vraie persistance BDD
 */
export async function saveLimitsConfig(config: LimitsConfig): Promise<{ success: boolean, message: string }> {
  try {
    logger.info('🔧 [ADMIN-RULES] Sauvegarde des limites en cours...');
    logger.info('🔍 [ADMIN-RULES] Origine: adminRules.saveLimitsConfig via UnifiedDataService');
    const unifiedService = UnifiedDataService.getInstance();
    
    // Enregistrer toutes les limites en BDD avec rafraîchissement automatique
    await Promise.all([
      unifiedService.updateConfiguration(
      UnifiedConfigCategory.LIMITS,
      LimitsConfigKey.MIN_BOOKING_HOURS,
      config.minBookingHours,
      'Heures minimales avant réservation'
      ),
      unifiedService.updateConfiguration(
      UnifiedConfigCategory.LIMITS,
      LimitsConfigKey.MAX_BOOKING_DAYS_AHEAD,
      config.maxBookingDaysAhead,
      'Jours maximum à l\'avance pour une réservation'
      ),
    ]);
    
    logger.info('✅ [ADMIN-RULES] Limites sauvegardées avec succès via UnifiedDataService');
    
    return {
      success: true,
      message: "Limites mises à jour avec succès en base de données"
    };
  } catch (error) {
    logger.error(error as Error, "❌ [ADMIN-RULES] Erreur lors de la sauvegarde des limites via UnifiedDataService");
    return {
      success: false,
      message: "Une erreur est survenue lors de la mise à jour des limites"
    };
  }
}

/**
 * Sauvegarde les paramètres de service avec vraie persistance BDD
 */
export async function saveServiceParamsConfig(config: ServiceParamsConfig): Promise<{ success: boolean, message: string }> {
  try {
    logger.info('🔧 [ADMIN-RULES] Sauvegarde des paramètres de service en cours...');
    logger.info('🔍 [ADMIN-RULES] Origine: adminRules.saveServiceParamsConfig via UnifiedDataService');
    const unifiedService = UnifiedDataService.getInstance();
    
    // Enregistrer tous les paramètres en BDD avec rafraîchissement automatique
    await Promise.all([
      unifiedService.updateConfiguration(
      UnifiedConfigCategory.SERVICE_PARAMS,
      ServiceParamsConfigKey.AVAILABLE_SERVICE_TYPES,
      config.enabledServiceTypes,
      'Types de services activés dans l\'application'
      ),
      unifiedService.updateConfiguration(
      UnifiedConfigCategory.SERVICE_PARAMS,
      ServiceParamsConfigKey.AVAILABLE_PACK_TYPES,
      config.enabledPackTypes,
      'Types de forfaits activés dans l\'application'
      ),
      unifiedService.updateConfiguration(
      UnifiedConfigCategory.SERVICE_PARAMS,
      ServiceParamsConfigKey.WORKING_HOURS_START,
      config.workingHoursStart,
      'Heure de début de la journée de travail'
      ),
      unifiedService.updateConfiguration(
      UnifiedConfigCategory.SERVICE_PARAMS,
      ServiceParamsConfigKey.WORKING_HOURS_END,
      config.workingHoursEnd,
      'Heure de fin de la journée de travail'
      ),
      unifiedService.updateConfiguration(
      UnifiedConfigCategory.SERVICE_PARAMS,
      ServiceParamsConfigKey.WORKING_DAYS,
      config.workingDays,
      'Jours de travail dans la semaine'
      ),
      unifiedService.updateConfiguration(
      UnifiedConfigCategory.SERVICE_PARAMS,
      ServiceParamsConfigKey.DEFAULT_TRAVEL_SPEED,
      config.defaultTravelSpeed,
        'Vitesse de déplacement par défaut (km/h)'
      ),
    ]);
    
    logger.info('✅ [ADMIN-RULES] Paramètres de service sauvegardés avec succès via UnifiedDataService');
    
    return {
      success: true,
      message: "Paramètres de service mis à jour avec succès en base de données"
    };
  } catch (error) {
    logger.error(error as Error, "❌ [ADMIN-RULES] Erreur lors de la sauvegarde des paramètres de service via UnifiedDataService");
    return {
      success: false,
      message: "Une erreur est survenue lors de la mise à jour des paramètres de service"
    };
  }
} 