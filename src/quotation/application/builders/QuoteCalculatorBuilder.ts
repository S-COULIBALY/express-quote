import { QuoteCalculator } from '../../domain/calculators/MovingQuoteCalculator';
import { ServiceType } from '../../domain/enums/ServiceType';
import { PrismaRuleRepository } from '../../infrastructure/repositories/PrismaRuleRepository';
import { PrismaConfigurationRepository } from '../../infrastructure/repositories/PrismaConfigurationRepository';
import { ConfigurationService } from '../../domain/services/ConfigurationService';
import { Configuration } from '../../domain/configuration/Configuration';
import { prisma } from '../../../lib/prisma';
import { ConfigurationCategory } from '../../domain/configuration/ConfigurationKey';
import { logger } from '../../../lib/logger';

/**
 * Builder pour créer des calculateurs de devis
 * Approche simple et évolutive basée sur le type de service
 */
export class QuoteCalculatorBuilder {
  private static ruleRepository = new PrismaRuleRepository(prisma);
  private static configRepository = new PrismaConfigurationRepository(prisma);

  /**
   * Récupère toutes les configurations depuis la BDD
   */
  private static async getConfigurations(): Promise<Configuration[]> {
    const [pricingConfigs, businessRulesConfigs, limitsConfigs, serviceParamsConfigs] = await Promise.all([
      this.configRepository.findActiveByCategory(ConfigurationCategory.PRICING),
      this.configRepository.findActiveByCategory(ConfigurationCategory.BUSINESS_RULES),
      this.configRepository.findActiveByCategory(ConfigurationCategory.LIMITS),
      this.configRepository.findActiveByCategory(ConfigurationCategory.SERVICE_PARAMS)
    ]);
    
    return [...pricingConfigs, ...businessRulesConfigs, ...limitsConfigs, ...serviceParamsConfigs];
  }

  /**
   * Crée un calculateur pour déménagements (actuel)
   */
  private static async createMovingCalculator(): Promise<QuoteCalculator> {
    const [movingRules, packRules, serviceRules, configurations] = await Promise.all([
      this.ruleRepository.findByServiceType(ServiceType.MOVING),
      this.ruleRepository.findByServiceType(ServiceType.PACK),
      this.ruleRepository.findByServiceType(ServiceType.SERVICE),
      this.getConfigurations()
    ]);
    
    const configService = new ConfigurationService(configurations);
    return new QuoteCalculator(configService, movingRules, packRules, serviceRules);
  }

  /**
   * Crée un calculateur pour nettoyage (futur)
   */
  private static async createCleaningCalculator(): Promise<any> {
    // TODO: Implémenter quand CleaningQuoteCalculator sera créé
    throw new Error('CleaningCalculator pas encore implémenté');
  }

  /**
   * Crée un calculateur pour jardinage (futur)
   */
  private static async createGardeningCalculator(): Promise<any> {
    // TODO: Implémenter quand GardeningQuoteCalculator sera créé
    throw new Error('GardeningCalculator pas encore implémenté');
  }

  /**
   * Méthode générique pour créer un calculateur selon le type de service
   * Point d'entrée principal - évolutif et extensible
   */
  static async create(serviceType: ServiceType = ServiceType.MOVING): Promise<any> {
    try {
      switch (serviceType) {
        case ServiceType.MOVING:
          return await this.createMovingCalculator();
        
        case ServiceType.CLEANING:
          return await this.createCleaningCalculator();
        
        case ServiceType.GARDENING:
          return await this.createGardeningCalculator();
        
        // Facile d'ajouter d'autres types :
        // case ServiceType.PLUMBING:
        //   return await this.createPlumbingCalculator();
        
        default:
          throw new Error(`Type de service non supporté: ${serviceType}`);
      }
    } catch (error) {
      logger.error(`❌ Erreur lors de la création du calculateur ${serviceType}:`, error as Error);
      throw new Error(`Impossible de créer le calculateur ${serviceType}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Méthode de compatibilité - crée le calculateur par défaut (MOVING)
   * Pour faciliter la migration depuis QuoteCalculatorService
   */
  static async createDefault(): Promise<QuoteCalculator> {
    return this.create(ServiceType.MOVING);
  }
} 