import { ConfigurationService } from '../../domain/services/ConfigurationService';
import { Configuration } from '../../domain/configuration/Configuration';
import { ConfigurationCategory, PricingConfigKey } from '../../domain/configuration/ConfigurationKey';
import { PrismaConfigurationRepository } from '../repositories/PrismaConfigurationRepository';
import { logger } from '../../../lib/logger';
import { prisma } from '../../../lib/prisma';

/**
 * Service de cache pour les configurations
 * Version simplifiée avec uniquement un cache en mémoire
 */
export class ConfigurationCacheService {
  private static instance: ConfigurationCacheService;
  private configService: ConfigurationService | null = null;
  private repository: PrismaConfigurationRepository;
  
  // Cache mémoire simple
  private memoryCache: Map<string, any> = new Map();
  
  private lastRefresh: number = 0;
  private isRefreshing: boolean = false;
  private isInitialized: boolean = false;
  
  private constructor() {
    this.repository = new PrismaConfigurationRepository(prisma);
  }
  
  /**
   * Récupère l'instance singleton
   */
  static getInstance(): ConfigurationCacheService {
    if (!ConfigurationCacheService.instance) {
      ConfigurationCacheService.instance = new ConfigurationCacheService();
    }
    return ConfigurationCacheService.instance;
  }
  
  /**
   * Initialise le service de cache
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await this.refreshCache();
      this.isInitialized = true;
      logger.info('Configuration cache initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize configuration cache', error as Error);
      throw error;
    }
  }
  
  /**
   * Rafraîchit le cache des configurations
   */
  private async refreshCache(): Promise<void> {
    if (this.isRefreshing) return;
    
    try {
      this.isRefreshing = true;
      logger.debug('Refreshing configuration cache');
      
      // Récupérer toutes les configurations actives depuis la base de données
      const pricingConfigs = await this.repository.findActiveByCategory(ConfigurationCategory.PRICING);
      const businessConfigs = await this.repository.findActiveByCategory(ConfigurationCategory.BUSINESS_RULES);
      const limitsConfigs = await this.repository.findActiveByCategory(ConfigurationCategory.LIMITS);
      const serviceParamsConfigs = await this.repository.findActiveByCategory(ConfigurationCategory.SERVICE_PARAMS);
      
      const allConfigs = [
        ...pricingConfigs,
        ...businessConfigs,
        ...limitsConfigs,
        ...serviceParamsConfigs
      ];
      
      // Mettre à jour le service de configuration
      this.configService = new ConfigurationService(allConfigs);
      
      // Mettre à jour le cache mémoire simple
      this.memoryCache.clear();
      for (const config of allConfigs) {
        const cacheKey = `${config.category}_${config.key}`;
        this.memoryCache.set(cacheKey, config.value);
      }
      
      this.lastRefresh = Date.now();
      logger.debug(`Cache refreshed with ${allConfigs.length} configurations`);
    } catch (error) {
      logger.error('Failed to refresh configuration cache', error as Error);
    } finally {
      this.isRefreshing = false;
    }
  }
  
  /**
   * Récupère le service de configuration
   */
  async getConfigurationService(): Promise<ConfigurationService> {
    if (!this.configService) {
      throw new Error('Configuration service not initialized');
    }
    return this.configService;
  }
  
  /**
   * Récupère une valeur de configuration directement depuis le cache
   */
  async getValue<T>(category: ConfigurationCategory, key: string, defaultValue: T): Promise<T> {
    const cacheKey = `${category}_${key}`;
    
    // Essayer de récupérer depuis le cache
    const cachedValue = this.memoryCache.get(cacheKey);
    if (cachedValue !== undefined) {
      return cachedValue as T;
    }
    
    // Si pas dans le cache, rafraîchir manuellement une seule fois
    if (!this.isInitialized) {
      await this.refreshCache();
      const refreshedValue = this.memoryCache.get(cacheKey);
      return refreshedValue !== undefined ? refreshedValue as T : defaultValue;
    }
    
    return defaultValue;
  }
  
  /**
   * Invalide manuellement le cache pour forcer un rechargement
   */
  async invalidateCache(): Promise<void> {
    this.memoryCache.clear();
    this.lastRefresh = 0;
    await this.refreshCache();
  }
  
  /**
   * Force la mise à jour des valeurs
   */
  async updateConfigurationValue(
    category: ConfigurationCategory,
    key: string,
    value: any,
    description?: string
  ): Promise<void> {
    await this.repository.updateValue(category, key, value, description);
    await this.invalidateCache();
  }
} 