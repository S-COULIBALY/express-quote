'use server'

import { UnifiedDataService, ConfigurationCategory } from '@/quotation/infrastructure/services/UnifiedDataService';
import { logger } from '@/lib/logger';

/**
 * Interface pour les données de tarification admin
 */
export interface AdminPricingConfig {
  // Prix de base
  basePrice: string;
  distancePrice: string;
  workerPrice: string;
  
  // Services additionnels
  packingPrice: string;
  unpackingPrice: string;
  storagePrice: string;
  insurancePrice: string;
  
  // Réductions et majorations
  earlyBookingDiscount: string;
  lastMinuteSurcharge: string;
  weekendSurcharge: string;
  holidaySurcharge: string;
}

/**
 * Récupère les configurations de tarification actuelles depuis les Server Actions
 */
export async function getAdminPricingConfig(): Promise<AdminPricingConfig> {
  const unifiedService = UnifiedDataService.getInstance();
  const constants = await unifiedService.getAllPricingConstants();
  
  return {
    // Prix de base
    basePrice: (constants.MOVING_BASE_PRICE_PER_M3 || 50).toString(),
    distancePrice: (constants.PACK_EXTRA_KM_PRICE || constants.MOVING_DISTANCE_PRICE_PER_KM || 2).toString(),
    workerPrice: (constants.PACK_WORKER_PRICE || 150).toString(),

    // Services additionnels
    packingPrice: (constants.PACKING_PRICE || 20).toString(),
    unpackingPrice: (constants.UNPACKING_PRICE || 20).toString(),
    storagePrice: (constants.STORAGE_PRICE || 5).toString(),
    insurancePrice: (constants.INSURANCE_PRICE_HT || 15).toString(),
    
    // Réductions et majorations
    earlyBookingDiscount: (constants.EARLY_BOOKING_DISCOUNT || 10).toString(),
    lastMinuteSurcharge: (constants.LAST_MINUTE_SURCHARGE || 15).toString(),
    weekendSurcharge: (constants.WEEKEND_SURCHARGE || 20).toString(),
    holidaySurcharge: (constants.HOLIDAY_SURCHARGE || 30).toString(),
  };
}

/**
 * Sauvegarde les configurations de tarification avec vraie persistance BDD
 */
export async function saveAdminPricingConfig(config: AdminPricingConfig): Promise<{ success: boolean, message: string }> {
  try {
    logger.info('🔧 Sauvegarde des configurations de prix en cours...');
    const unifiedService = UnifiedDataService.getInstance();

    // Enregistrer toutes les configurations de prix en BDD avec rafraîchissement automatique
    await Promise.all([
      // Prix de base
      unifiedService.updateConfiguration(
        ConfigurationCategory.PRICING,
        'MOVING_BASE_PRICE_PER_M3',
        parseFloat(config.basePrice),
        'Prix de base par m³ pour déménagement'
      ),
      unifiedService.updateConfiguration(
        ConfigurationCategory.PRICING,
        'MOVING_DISTANCE_PRICE_PER_KM',
        parseFloat(config.distancePrice),
        'Prix par kilomètre pour déménagement'
      ),
      unifiedService.updateConfiguration(
        ConfigurationCategory.PRICING,
        'PACK_WORKER_PRICE',
        parseFloat(config.workerPrice),
        'Prix par travailleur pour pack'
      ),
      
      // Services additionnels
      unifiedService.updateConfiguration(
        ConfigurationCategory.PRICING,
        'PACKING_PRICE',
        parseFloat(config.packingPrice),
        'Prix du service d\'emballage'
      ),
      unifiedService.updateConfiguration(
        ConfigurationCategory.PRICING,
        'UNPACKING_PRICE',
        parseFloat(config.unpackingPrice),
        'Prix du service de déballage'
      ),
      unifiedService.updateConfiguration(
        ConfigurationCategory.PRICING,
        'STORAGE_PRICE',
        parseFloat(config.storagePrice),
        'Prix du stockage par jour'
      ),

      // Réductions et majorations
      unifiedService.updateConfiguration(
        ConfigurationCategory.PRICING,
        'EARLY_BOOKING_DISCOUNT',
        parseFloat(config.earlyBookingDiscount),
        'Pourcentage de réduction pour réservation anticipée'
      ),
      unifiedService.updateConfiguration(
        ConfigurationCategory.PRICING,
        'LAST_MINUTE_SURCHARGE',
        parseFloat(config.lastMinuteSurcharge),
        'Supplément pour réservation de dernière minute'
      ),
      unifiedService.updateConfiguration(
        ConfigurationCategory.PRICING,
        'WEEKEND_SURCHARGE',
        parseFloat(config.weekendSurcharge),
        'Supplément pour service en week-end'
      ),
      unifiedService.updateConfiguration(
        ConfigurationCategory.PRICING,
        'HOLIDAY_SURCHARGE',
        parseFloat(config.holidaySurcharge),
        'Supplément pour service en jour férié'
      ),
    ]);
    
    logger.info('✅ Configurations de prix sauvegardées avec succès');
    
    return {
      success: true,
      message: "Configuration des prix mise à jour avec succès en base de données"
    };
  } catch (error) {
    logger.error(error as Error, "❌ Erreur lors de la sauvegarde des configurations de prix");
    return {
      success: false,
      message: "Une erreur est survenue lors de la mise à jour des prix"
    };
  }
} 