import { DefaultValues } from "../../domain/configuration/DefaultValues";
import {
  ConfigurationCategory,
  PricingConfigKey,
  BusinessTypePricingConfigKey,
} from "../../domain/configuration/ConfigurationKey";
import {
  UnifiedDataService,
  ConfigurationCategory as UnifiedConfigCategory,
} from "../../infrastructure/services/UnifiedDataService";
import { logger } from "../../../lib/logger";

/**
 * ✅ ConfigurationAccessService - Wrapper simplifié pour l'accès aux configurations
 *
 * Architecture: UnifiedDataService (BDD + Cache 5min) → DefaultValues (fallback)
 *
 * Objectifs:
 * - ✅ API simplifiée: get('KEY') au lieu de getConfigurationValue(category, 'KEY', defaultValue)
 * - ✅ Empêcher l'accès direct à DefaultValues dans les Strategies
 * - ✅ Centraliser le mapping des fallbacks (70+ clés)
 * - ✅ Type-safe avec enums PricingConfigKey
 * - ✅ Délègue à UnifiedDataService (pas de cache doublon)
 *
 * @example
 * const configService = ConfigurationAccessService.getInstance();
 * const baseRate = await configService.get('MOVING_BASE_PRICE_PER_M3');
 * // Retourne la valeur de la BDD (via UnifiedDataService), sinon DefaultValues
 */
export class ConfigurationAccessService {
  private static instance: ConfigurationAccessService;
  private unifiedDataService: UnifiedDataService;

  private constructor() {
    this.unifiedDataService = UnifiedDataService.getInstance();
  }

  /**
   * Singleton pattern - retourne l'instance unique
   */
  public static getInstance(): ConfigurationAccessService {
    if (!ConfigurationAccessService.instance) {
      ConfigurationAccessService.instance = new ConfigurationAccessService();
    }
    return ConfigurationAccessService.instance;
  }

  /**
   * ✅ Méthode principale - Récupère une configuration (délègue à UnifiedDataService)
   *
   * @param key - Clé de configuration (PricingConfigKey ou BusinessTypePricingConfigKey)
   * @param category - Catégorie (par défaut PRICING)
   * @returns La valeur de la configuration
   *
   * @example
   * const baseRate = await configService.get('MOVING_BASE_PRICE_PER_M3');
   */
  async get<T = number>(
    key: PricingConfigKey | BusinessTypePricingConfigKey | string,
    category: ConfigurationCategory = ConfigurationCategory.PRICING,
  ): Promise<T> {
    // ✅ Déléguer à UnifiedDataService avec le fallback DefaultValues
    const unifiedCategory = category as any as UnifiedConfigCategory;
    const defaultValue = this.getDefaultValue(key);

    return this.unifiedDataService.getConfigurationValue<T>(
      unifiedCategory,
      key,
      defaultValue,
    );
  }

  /**
   * ✅ Récupère plusieurs configurations en une seule fois
   * Optimisé pour les cas où on a besoin de plusieurs valeurs
   *
   * @param keys - Liste des clés à récupérer
   * @param category - Catégorie (par défaut PRICING)
   * @returns Record avec toutes les valeurs
   *
   * @example
   * const configs = await configService.getMultiple([
   *   'MOVING_BASE_PRICE_PER_M3',
   *   'WORKER_HOUR_RATE'
   * ]);
   * console.log(configs['MOVING_BASE_PRICE_PER_M3']); // 35
   */
  async getMultiple(
    keys: string[],
    category: ConfigurationCategory = ConfigurationCategory.PRICING,
  ): Promise<Record<string, any>> {
    const result: Record<string, any> = {};

    // Récupérer en parallèle pour optimiser les performances
    await Promise.all(
      keys.map(async (key) => {
        result[key] = await this.get(key, category);
      }),
    );

    return result;
  }

  /**
   * ✅ Vide le cache (délègue à UnifiedDataService)
   */
  clearCache(): void {
    this.unifiedDataService.clearAllCaches();
    logger.info("[ConfigAccessService] Cache vidé (via UnifiedDataService)");
  }

  /**
   * ✅ Récupère la valeur par défaut depuis DefaultValues
   * Type-safe grâce au mapping exhaustif (APRÈS NETTOYAGE)
   */
  private getDefaultValue(key: string): any {
    // ========================================
    // ✅ MAPPING NETTOYÉ - Uniquement les variables qui existent dans DefaultValues
    // ========================================
    const defaultsMap: Record<string, any> = {
      // ========================================
      // CONSTANTES PARTAGÉES
      // ========================================
      VAT_RATE: DefaultValues.VAT_RATE,
      DEFAULT_CURRENCY: DefaultValues.DEFAULT_CURRENCY,
      DEPOSIT_PERCENTAGE: DefaultValues.DEPOSIT_PERCENTAGE,
      INCLUDED_DISTANCE: DefaultValues.INCLUDED_DISTANCE,
      UNIT_PRICE_PER_KM: DefaultValues.UNIT_PRICE_PER_KM,
      FUEL_CONSUMPTION_PER_100KM: DefaultValues.FUEL_CONSUMPTION_PER_100KM,
      FUEL_PRICE_PER_LITER: DefaultValues.FUEL_PRICE_PER_LITER,
      TOLL_COST_PER_KM: DefaultValues.TOLL_COST_PER_KM,
      HIGHWAY_RATIO: DefaultValues.HIGHWAY_RATIO,
      SERVICE_WORKER_PRICE_PER_HOUR:
        DefaultValues.SERVICE_WORKER_PRICE_PER_HOUR,

      // Limites & Seuils
      MIN_PRICE: DefaultValues.MIN_PRICE,
      MIN_VOLUME: DefaultValues.MIN_VOLUME,
      MAX_VOLUME_M3: DefaultValues.MAX_VOLUME,
      MAX_VOLUME: DefaultValues.MAX_VOLUME,
      MIN_SQUARE_METERS: DefaultValues.MIN_SQUARE_METERS,

      // Multiplicateurs & Réductions
      HOURLY_RATE_MULTIPLIER: DefaultValues.HOURLY_RATE_MULTIPLIER,
      DAILY_RATE_MULTIPLIER: DefaultValues.DAILY_RATE_MULTIPLIER,
      WEEKLY_RATE_MULTIPLIER: DefaultValues.WEEKLY_RATE_MULTIPLIER,
      EXTRA_DAY_DISCOUNT_RATE: DefaultValues.EXTRA_DAY_DISCOUNT_RATE,
      EXTRA_WORKER_DISCOUNT_RATE: DefaultValues.EXTRA_WORKER_DISCOUNT_RATE,
      VOLUME_DISCOUNT_THRESHOLD_M3: DefaultValues.VOLUME_DISCOUNT_THRESHOLD_M3,
      VOLUME_DISCOUNT_RATE: DefaultValues.VOLUME_DISCOUNT_RATE,
      FREE_DELIVERY_DISTANCE_KM: DefaultValues.FREE_DELIVERY_DISTANCE_KM,

      // Assurance
      INSURANCE_PRICE_HT: DefaultValues.INSURANCE_PRICE_HT,
      INSURANCE_PRICE_TTC: DefaultValues.INSURANCE_PRICE_TTC,
      INSURANCE_COVERAGE_MINIMUM: DefaultValues.INSURANCE_COVERAGE_MINIMUM,

      // Équipement & Matériel
      EQUIPMENT_RENTAL_DAILY: DefaultValues.EQUIPMENT_RENTAL_DAILY,
      MATERIAL_COST_PER_M3: DefaultValues.MATERIAL_COST_PER_M3,
      PACKING_MATERIAL_COST_PER_M3: DefaultValues.MATERIAL_COST_PER_M3,
      PROTECTIVE_EQUIPMENT_COST: DefaultValues.PROTECTIVE_EQUIPMENT_COST,

      // Opérationnel
      MAX_WORKERS_PER_VEHICLE: DefaultValues.MAX_WORKERS_PER_VEHICLE,
      MAX_VOLUME_PER_VEHICLE_M3: DefaultValues.MAX_VOLUME_PER_VEHICLE_M3,
      STANDARD_SERVICE_DURATION_HOURS:
        DefaultValues.STANDARD_SERVICE_DURATION_HOURS,
      OVERTIME_RATE_MULTIPLIER: DefaultValues.OVERTIME_RATE_MULTIPLIER,
      HOURS_PER_DAY: DefaultValues.HOURS_PER_DAY,

      // Professionnels
      PROFESSIONAL_DEFAULT_SEARCH_RADIUS_KM:
        DefaultValues.PROFESSIONAL_DEFAULT_SEARCH_RADIUS_KM,

      // DÉMÉNAGEMENT (MOVING)
      // ========================================
      MOVING_BASE_PRICE_PER_M3: DefaultValues.MOVING_BASE_PRICE_PER_M3,
      MOVING_WORKER_PRICE: DefaultValues.MOVING_WORKER_PRICE,
      MOVING_WORKER_HOUR_RATE: DefaultValues.MOVING_WORKER_HOUR_RATE,
      MOVING_EXTRA_HOUR_RATE: DefaultValues.MOVING_EXTRA_HOUR_RATE,
      MOVING_LIFT_PRICE: DefaultValues.MOVING_LIFT_PRICE,
      MOVING_VEHICLE_FLAT_FEE: DefaultValues.MOVING_VEHICLE_FLAT_FEE,
      MOVING_BOXES_PER_M3: DefaultValues.MOVING_BOXES_PER_M3,
      MOVING_BOX_PRICE: DefaultValues.MOVING_BOX_PRICE,
      MOVING_WORKERS_PER_M3_THRESHOLD:
        DefaultValues.MOVING_WORKERS_PER_M3_THRESHOLD,
      MOVING_PREMIUM_WORKER_PRICE_PER_HOUR:
        DefaultValues.MOVING_PREMIUM_WORKER_PRICE_PER_HOUR,
      MOVING_PREMIUM_SUPPLIES_MULTIPLIER:
        DefaultValues.MOVING_PREMIUM_SUPPLIES_MULTIPLIER,

      // Alias MOVING (pour compatibilité avec le code existant)
      MOVING_TRUCK_PRICE: DefaultValues.MOVING_TRUCK_PRICE,
      MOVING_WORKER_PRICE_PER_HOUR: DefaultValues.MOVING_WORKER_HOUR_RATE,
      MOVING_FREE_DISTANCE_KM: DefaultValues.MOVING_FREE_DISTANCE_KM,
      MOVING_DISTANCE_PRICE_PER_KM: DefaultValues.MOVING_DISTANCE_PRICE_PER_KM,

      // ========================================
      // NETTOYAGE (CLEANING)
      // ========================================
      CLEANING_PRICE_PER_M2: DefaultValues.CLEANING_PRICE_PER_M2,
      CLEANING_WORKER_PRICE: DefaultValues.CLEANING_WORKER_PRICE,
      CLEANING_WORKER_HOUR_RATE: DefaultValues.CLEANING_WORKER_HOUR_RATE,
      CLEANING_EXTRA_HOUR_RATE: DefaultValues.CLEANING_EXTRA_HOUR_RATE,
      CLEANING_MINIMUM_PRICE: DefaultValues.CLEANING_MINIMUM_PRICE,

      // ========================================
      // LIVRAISON (DELIVERY)
      // ========================================
      DELIVERY_BASE_PRICE: DefaultValues.DELIVERY_BASE_PRICE,
      DELIVERY_PRICE_PER_KM: DefaultValues.DELIVERY_PRICE_PER_KM,
      DELIVERY_WORKER_HOUR_RATE: DefaultValues.DELIVERY_WORKER_HOUR_RATE,
      DELIVERY_EXTRA_HOUR_RATE: DefaultValues.DELIVERY_EXTRA_HOUR_RATE,
      DELIVERY_WEIGHT_SURCHARGE: DefaultValues.DELIVERY_WEIGHT_SURCHARGE,

      // ========================================
      // TRANSPORT
      // ========================================
      TRANSPORT_BASE_PRICE: DefaultValues.TRANSPORT_BASE_PRICE,
      TRANSPORT_PRICE_PER_KM: DefaultValues.TRANSPORT_PRICE_PER_KM,
      TRANSPORT_WORKER_HOUR_RATE: DefaultValues.TRANSPORT_WORKER_HOUR_RATE,
      TRANSPORT_EXTRA_HOUR_RATE: DefaultValues.TRANSPORT_EXTRA_HOUR_RATE,
      TRANSPORT_VOLUME_SURCHARGE: DefaultValues.TRANSPORT_VOLUME_SURCHARGE,

      // ========================================
      // EMBALLAGE (PACKING)
      // ========================================
      PACKING_PRICE_PER_M3: DefaultValues.PACKING_PRICE_PER_M3,
      PACKING_WORKER_PRICE: DefaultValues.PACKING_WORKER_PRICE,
      PACKING_WORKER_HOUR_RATE: DefaultValues.PACKING_WORKER_HOUR_RATE,
      PACKING_EXTRA_HOUR_RATE: DefaultValues.PACKING_EXTRA_HOUR_RATE,
      PACKING_MATERIAL_COST: DefaultValues.PACKING_MATERIAL_COST,
      PACK_INCLUDED_DISTANCE: DefaultValues.INCLUDED_DISTANCE,

      // ========================================
      // STOCKAGE (STORAGE)
      // ========================================
      STORAGE_PRICE_PER_M3_PER_MONTH:
        DefaultValues.STORAGE_PRICE_PER_M3_PER_MONTH,
      STORAGE_WORKER_HOUR_RATE: DefaultValues.STORAGE_WORKER_HOUR_RATE,
      STORAGE_EXTRA_HOUR_RATE: DefaultValues.STORAGE_EXTRA_HOUR_RATE,
      STORAGE_ACCESS_FEE: DefaultValues.STORAGE_ACCESS_FEE,
      STORAGE_MINIMUM_DURATION_MONTHS:
        DefaultValues.STORAGE_MINIMUM_DURATION_MONTHS,

      // ========================================
      // AUTO-DÉTECTION
      // ========================================
      FURNITURE_LIFT_FLOOR_THRESHOLD:
        DefaultValues.FURNITURE_LIFT_FLOOR_THRESHOLD,
      FURNITURE_LIFT_SURCHARGE: DefaultValues.FURNITURE_LIFT_SURCHARGE,
      LONG_CARRYING_DISTANCE_THRESHOLD:
        DefaultValues.LONG_CARRYING_DISTANCE_THRESHOLD,
      LONG_CARRYING_DISTANCE_SURCHARGE:
        DefaultValues.LONG_CARRYING_DISTANCE_SURCHARGE,
    };

    const value = defaultsMap[key];

    if (value === undefined) {
      logger.warn(
        `[ConfigAccessService] Clé inconnue: ${key}, retour 0 par défaut`,
      );
      return 0;
    }

    return value;
  }
}

// Export singleton instance pour usage direct
export const configAccessService = ConfigurationAccessService.getInstance();
