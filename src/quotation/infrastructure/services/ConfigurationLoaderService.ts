import { PrismaClient } from '@prisma/client';
import { ConfigurationService } from '../../domain/services/ConfigurationService';
import { Configuration } from '../../domain/configuration/Configuration';
import { PrismaConfigurationRepository } from '../repositories/PrismaConfigurationRepository';
import { ConfigurationCategory, PricingConfigKey } from '../../domain/configuration/ConfigurationKey';
import { createDefaultConfigurations } from '../../domain/configuration/DefaultConfigurations';
import { logger } from '../../../lib/logger';

/**
 * Service responsable de charger les configurations depuis la base de données
 * et de les convertir en un service de configuration utilisable par l'application
 */
export class ConfigurationLoaderService {
  private prisma: PrismaClient;
  private repository: PrismaConfigurationRepository;
  private configService: ConfigurationService;
  private isInitialized: boolean = false;
  
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.repository = new PrismaConfigurationRepository(prisma);
    this.configService = new ConfigurationService([]);
  }
  
  /**
   * Initialise le service de configuration en chargeant les données depuis la base de données
   */
  async initialize(): Promise<ConfigurationService> {
    if (this.isInitialized) {
      return this.configService;
    }
    
    try {
      // Récupérer toutes les configurations actives
      const pricingConfigs = await this.repository.findActiveByCategory(
        ConfigurationCategory.PRICING
      );
      
      const businessRulesConfigs = await this.repository.findActiveByCategory(
        ConfigurationCategory.BUSINESS_RULES
      );
      
      const limitsConfigs = await this.repository.findActiveByCategory(
        ConfigurationCategory.LIMITS
      );
      
      const serviceParamsConfigs = await this.repository.findActiveByCategory(
        ConfigurationCategory.SERVICE_PARAMS
      );
      
      // Combiner toutes les configurations
      const allConfigs = [
        ...pricingConfigs,
        ...businessRulesConfigs,
        ...limitsConfigs,
        ...serviceParamsConfigs
      ];
      
      // Créer un nouveau service de configuration avec toutes les configurations chargées
      this.configService = new ConfigurationService(allConfigs);
      this.isInitialized = true;

      logger.info(`⚙️ [ConfigurationLoader] Service initialisé avec ${allConfigs.length} configs`);
      return this.configService;
    } catch (error) {
      logger.error('❌ [ConfigurationLoader] Erreur chargement configs:', error);
      // En cas d'erreur, utiliser les configurations par défaut
      const defaultConfigs = createDefaultConfigurations();
      this.configService = new ConfigurationService(defaultConfigs);
      this.isInitialized = true;

      logger.info(`⚙️ [ConfigurationLoader] Fallback: ${defaultConfigs.length} configs par défaut`);
      return this.configService;
    }
  }
  
  /**
   * Récupère le service de configuration (initialise si nécessaire)
   */
  async getConfigurationService(): Promise<ConfigurationService> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.configService;
  }
  
  /**
   * S'assure que les configurations par défaut existent dans la base de données
   */
  async ensureDefaultConfigurations(): Promise<void> {
    
    try {
      // Récupérer les configurations par défaut
      const defaultConfigs = createDefaultConfigurations();
      
      for (const config of defaultConfigs) {
        // Vérifier si la configuration existe déjà
        const existingConfig = await this.repository.findActiveByKey(
          config.category,
          config.key
        );
        
        if (!existingConfig) {
          // Si elle n'existe pas, l'enregistrer
          await this.repository.save(config);
          logger.info(`📁 [ConfigurationLoaderService.ts] ✅ Created default configuration: ${config.category}_${config.key}`);
        }
      }
      
      logger.info('⚙️ [ConfigurationLoader] Configurations par défaut vérifiées');
    } catch (error) {
      logger.error('❌ [ConfigurationLoader] Erreur vérification configurations:', error);
    }
  }
} 