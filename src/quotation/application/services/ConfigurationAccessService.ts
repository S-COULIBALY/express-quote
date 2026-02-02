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
 * Valeurs par défaut pour les clés de configuration (fallback si non en BDD).
 * Anciennement dans DefaultValues ; le calcul de prix utilise quotation-module (MODULES_CONFIG).
 */
const CONFIG_DEFAULTS: Record<string, number | string> = {
  VAT_RATE: 0.2,
  DEFAULT_CURRENCY: "EUR",
  DEPOSIT_PERCENTAGE: 0.3,
  INCLUDED_DISTANCE: 20,
  UNIT_PRICE_PER_KM: 2,
  FUEL_CONSUMPTION_PER_100KM: 25,
  FUEL_PRICE_PER_LITER: 1.8,
  TOLL_COST_PER_KM: 0.15,
  HIGHWAY_RATIO: 0.7,
  SERVICE_WORKER_PRICE_PER_HOUR: 35,
  MIN_PRICE: 0,
  MIN_VOLUME: 1,
  MAX_VOLUME_M3: 200,
  MAX_VOLUME: 200,
  MIN_SQUARE_METERS: 10,
  HOURLY_RATE_MULTIPLIER: 1.0,
  DAILY_RATE_MULTIPLIER: 0.8,
  WEEKLY_RATE_MULTIPLIER: 0.7,
  EXTRA_DAY_DISCOUNT_RATE: 0.08,
  EXTRA_WORKER_DISCOUNT_RATE: 0.05,
  VOLUME_DISCOUNT_THRESHOLD_M3: 50,
  VOLUME_DISCOUNT_RATE: 0.1,
  FREE_DELIVERY_DISTANCE_KM: 20,
  INSURANCE_PRICE_HT: 30,
  INSURANCE_PRICE_TTC: 36,
  INSURANCE_COVERAGE_MINIMUM: 100000,
  EQUIPMENT_RENTAL_DAILY: 25,
  MATERIAL_COST_PER_M3: 12,
  PROTECTIVE_EQUIPMENT_COST: 15,
  MAX_WORKERS_PER_VEHICLE: 3,
  MAX_VOLUME_PER_VEHICLE_M3: 30,
  STANDARD_SERVICE_DURATION_HOURS: 8,
  OVERTIME_RATE_MULTIPLIER: 1.5,
  HOURS_PER_DAY: 7,
  PROFESSIONAL_DEFAULT_SEARCH_RADIUS_KM: 100,
  MOVING_BASE_PRICE_PER_M3: 35,
  MOVING_WORKER_PRICE: 120,
  MOVING_WORKER_HOUR_RATE: 35,
  MOVING_EXTRA_HOUR_RATE: 40,
  MOVING_LIFT_PRICE: 200,
  MOVING_VEHICLE_FLAT_FEE: 150,
  MOVING_BOXES_PER_M3: 10,
  MOVING_BOX_PRICE: 2,
  MOVING_WORKERS_PER_M3_THRESHOLD: 5,
  MOVING_PREMIUM_WORKER_PRICE_PER_HOUR: 40,
  MOVING_PREMIUM_SUPPLIES_MULTIPLIER: 2.5,
  MOVING_TRUCK_PRICE: 150,
  MOVING_WORKER_PRICE_PER_HOUR: 35,
  MOVING_FREE_DISTANCE_KM: 20,
  MOVING_DISTANCE_PRICE_PER_KM: 2,
  FURNITURE_LIFT_FLOOR_THRESHOLD: 3,
  FURNITURE_LIFT_SURCHARGE: 50,
  LONG_CARRYING_DISTANCE_THRESHOLD: 30,
  LONG_CARRYING_DISTANCE_SURCHARGE: 2,
};

/**
 * ConfigurationAccessService - Wrapper pour l'accès aux configurations (table Configuration).
 * Fallback vers CONFIG_DEFAULTS si clé absente en BDD.
 */
export class ConfigurationAccessService {
  private static instance: ConfigurationAccessService;
  private unifiedDataService: UnifiedDataService;

  private constructor() {
    this.unifiedDataService = UnifiedDataService.getInstance();
  }

  public static getInstance(): ConfigurationAccessService {
    if (!ConfigurationAccessService.instance) {
      ConfigurationAccessService.instance = new ConfigurationAccessService();
    }
    return ConfigurationAccessService.instance;
  }

  async get<T = number>(
    key: PricingConfigKey | BusinessTypePricingConfigKey | string,
    category: ConfigurationCategory = ConfigurationCategory.PRICING,
  ): Promise<T> {
    const unifiedCategory = category as unknown as UnifiedConfigCategory;
    const defaultValue = this.getDefaultValue(key);

    return this.unifiedDataService.getConfigurationValue<T>(
      unifiedCategory,
      key,
      defaultValue as T,
    );
  }

  async getMultiple(
    keys: string[],
    category: ConfigurationCategory = ConfigurationCategory.PRICING,
  ): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};

    await Promise.all(
      keys.map(async (key) => {
        result[key] = await this.get(key, category);
      }),
    );

    return result;
  }

  clearCache(): void {
    this.unifiedDataService.clearAllCaches();
    logger.info("[ConfigAccessService] Cache vidé (via UnifiedDataService)");
  }

  private getDefaultValue(key: string): number | string {
    const value = CONFIG_DEFAULTS[key];

    if (value === undefined) {
      logger.warn(
        `[ConfigAccessService] Clé inconnue: ${key}, retour 0 par défaut`,
      );
      return 0;
    }

    return value;
  }
}

export const configAccessService = ConfigurationAccessService.getInstance();
