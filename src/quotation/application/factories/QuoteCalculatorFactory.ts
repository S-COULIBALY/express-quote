import { QuoteCalculator } from '../../domain/calculators/MovingQuoteCalculator';
import { Rule } from '../../domain/valueObjects/Rule';
import { logger } from '../../../lib/logger';
import { ServiceType } from '../../domain/enums/ServiceType';
import { PrismaRuleRepository } from '../../infrastructure/repositories/PrismaRuleRepository';
import { PrismaConfigurationRepository } from '../../infrastructure/repositories/PrismaConfigurationRepository';
import { ConfigurationService } from '../../domain/services/ConfigurationService';
import { Configuration } from '../../domain/configuration/Configuration';
import { prisma } from '../../../lib/prisma';
import { ConfigurationCategory } from '../../domain/configuration/ConfigurationKey';

/**
 * Version de la factory utilisant les repositories corrigés pour accéder
 * aux règles et configurations
 */
export class QuoteCalculatorFactory {
  // Utiliser les repositories pour accéder aux données
  private static ruleRepository: PrismaRuleRepository = new PrismaRuleRepository(prisma);
  private static configRepository: PrismaConfigurationRepository = new PrismaConfigurationRepository(prisma);
  private static initialized: boolean = false;
  
  /**
   * Initialise la factory
   */
  static async initialize(): Promise<void> {
    if (QuoteCalculatorFactory.initialized) {
      return;
    }
    
    console.log('==== INITIALISATION DE QUOTECALCULATORFACTORY ====');
    logger.info('📋 Initialisation de QuoteCalculatorFactory');
    
    // Vérifier si la table de configuration est accessible
    const tableExists = await QuoteCalculatorFactory.configRepository.checkConfigurationTableExists();
    if (tableExists) {
      console.log('==== TABLE DE CONFIGURATION ACCESSIBLE ====');
      logger.info('✅ La table de configuration est accessible');
    } else {
      console.log('==== TABLE DE CONFIGURATION NON ACCESSIBLE - UTILISATION DES VALEURS PAR DÉFAUT ====');
      logger.warn('⚠️ La table de configuration n\'est pas accessible - les valeurs par défaut seront utilisées');
    }
    
    QuoteCalculatorFactory.initialized = true;
  }
  
  /**
   * Crée une instance de QuoteCalculator avec les règles et configurations
   */
  static async createDefaultCalculator(): Promise<QuoteCalculator> {
    await QuoteCalculatorFactory.initialize();
    
    try {
      console.log('\n\n==== CRÉATION DU CALCULATEUR PAR DÉFAUT ====');
      logger.info('📋 Création du calculateur par défaut');
      
      // Récupérer les règles depuis le repository
      console.log('\n==== RÉCUPÉRATION DES RÈGLES ====');
      const movingRules = await QuoteCalculatorFactory.ruleRepository.findByServiceType(ServiceType.MOVING);
      const packRules = await QuoteCalculatorFactory.ruleRepository.findByServiceType(ServiceType.PACK); 
      const serviceRules = await QuoteCalculatorFactory.ruleRepository.findByServiceType(ServiceType.SERVICE);
      
      console.log(`\n==== RÈGLES RÉCUPÉRÉES : MOVING(${movingRules.length}), PACK(${packRules.length}), SERVICE(${serviceRules.length}) ====`);
      
      // Afficher des détails sur les règles MOVING
      console.log('\n=== DÉTAILS DES RÈGLES MOVING ===');
      movingRules.forEach((rule, index) => {
        if (index < 5) { // Limiter à 5 règles pour éviter trop de logs
          console.log(`[${index + 1}/${movingRules.length}] ${rule.name}`);
          console.log(`  - ServiceType: ${rule.serviceType}`);
          console.log(`  - Valeur: ${rule.value} (${rule.isPercentage() ? '%' : '€'})`);
          console.log(`  - Actif: ${rule.isActive}`);
        } else if (index === 5) {
          console.log(`... et ${movingRules.length - 5} autres règles MOVING`);
        }
      });
      
      // Afficher des détails sur les règles PACK
      console.log('\n=== DÉTAILS DES RÈGLES PACK ===');
      packRules.forEach((rule, index) => {
        if (index < 5) { // Limiter à 5 règles pour éviter trop de logs
          console.log(`[${index + 1}/${packRules.length}] ${rule.name}`);
          console.log(`  - ServiceType: ${rule.serviceType}`);
          console.log(`  - Valeur: ${rule.value} (${rule.isPercentage() ? '%' : '€'})`);
          console.log(`  - Actif: ${rule.isActive}`);
        } else if (index === 5) {
          console.log(`... et ${packRules.length - 5} autres règles PACK`);
        }
      });
      
      // Afficher des détails sur les règles SERVICE
      console.log('\n=== DÉTAILS DES RÈGLES SERVICE ===');
      serviceRules.forEach((rule, index) => {
        if (index < 5) { // Limiter à 5 règles pour éviter trop de logs
          console.log(`[${index + 1}/${serviceRules.length}] ${rule.name}`);
          console.log(`  - ServiceType: ${rule.serviceType}`);
          console.log(`  - Valeur: ${rule.value} (${rule.isPercentage() ? '%' : '€'})`);
          console.log(`  - Actif: ${rule.isActive}`);
        } else if (index === 5) {
          console.log(`... et ${serviceRules.length - 5} autres règles SERVICE`);
        }
      });
      
      logger.info('📊 Règles récupérées:', { 
        moving: movingRules.length, 
        pack: packRules.length, 
        service: serviceRules.length 
      });
      
      // Récupérer les configurations à partir des différentes catégories
      console.log('\n==== RÉCUPÉRATION DES CONFIGURATIONS ====');
      const pricingConfigs = await QuoteCalculatorFactory.configRepository.findActiveByCategory(
        ConfigurationCategory.PRICING
      );
      
      const businessRulesConfigs = await QuoteCalculatorFactory.configRepository.findActiveByCategory(
        ConfigurationCategory.BUSINESS_RULES
      );
      
      const limitsConfigs = await QuoteCalculatorFactory.configRepository.findActiveByCategory(
        ConfigurationCategory.LIMITS
      );
      
      const serviceParamsConfigs = await QuoteCalculatorFactory.configRepository.findActiveByCategory(
        ConfigurationCategory.SERVICE_PARAMS
      );
      
      // Combiner les configurations
      const allConfigurations = [
        ...pricingConfigs,
        ...businessRulesConfigs,
        ...limitsConfigs,
        ...serviceParamsConfigs
      ];
      
      console.log(`\n==== CONFIGURATIONS RÉCUPÉRÉES : ${allConfigurations.length} ====`);
      
      // Afficher les détails des configurations PRICING
      console.log('\n=== DÉTAILS DES CONFIGURATIONS PRICING ===');
      pricingConfigs.forEach((config, index) => {
        if (index < 5) { // Limiter à 5 configurations pour éviter trop de logs
          console.log(`[${index + 1}/${pricingConfigs.length}] ${config.key}`);
          console.log(`  - Valeur: ${JSON.stringify(config.value)}`);
          console.log(`  - Description: ${config.description || 'N/A'}`);
          console.log(`  - Actif: ${config.isActive}`);
        } else if (index === 5) {
          console.log(`... et ${pricingConfigs.length - 5} autres configurations PRICING`);
        }
      });
      
      // Afficher les détails des configurations BUSINESS_RULES
      console.log('\n=== DÉTAILS DES CONFIGURATIONS BUSINESS_RULES ===');
      businessRulesConfigs.forEach((config, index) => {
        if (index < 5) { // Limiter à 5 configurations pour éviter trop de logs
          console.log(`[${index + 1}/${businessRulesConfigs.length}] ${config.key}`);
          console.log(`  - Valeur: ${JSON.stringify(config.value)}`);
          console.log(`  - Description: ${config.description || 'N/A'}`);
          console.log(`  - Actif: ${config.isActive}`);
        } else if (index === 5) {
          console.log(`... et ${businessRulesConfigs.length - 5} autres configurations BUSINESS_RULES`);
        }
      });
      
      // Afficher les détails des autres configurations si elles existent
      if (limitsConfigs.length > 0 || serviceParamsConfigs.length > 0) {
        console.log('\n=== DÉTAILS DES AUTRES CONFIGURATIONS ===');
        [...limitsConfigs, ...serviceParamsConfigs].forEach((config, index) => {
          if (index < 5) {
            console.log(`[${index + 1}/${limitsConfigs.length + serviceParamsConfigs.length}] ${config.key} (${config.category})`);
            console.log(`  - Valeur: ${JSON.stringify(config.value)}`);
            console.log(`  - Description: ${config.description || 'N/A'}`);
            console.log(`  - Actif: ${config.isActive}`);
          } else if (index === 5) {
            console.log(`... et ${limitsConfigs.length + serviceParamsConfigs.length - 5} autres configurations`);
          }
        });
      }
      
      logger.info(`📊 Configurations récupérées: ${allConfigurations.length}`);
      
      // Créer le service de configuration
      const configService = new ConfigurationService(allConfigurations);
      
      // Créer le calculateur
      console.log('\n==== CALCULATEUR CRÉÉ AVEC SUCCÈS ====');
      logger.info('✅ Calculateur créé avec succès');
      return new QuoteCalculator(configService, movingRules, packRules, serviceRules);
    } catch (error) {
      logger.error('❌ Erreur lors de la création du calculateur:', error as Error);
      throw new Error(`Impossible de créer le calculateur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }
  
  /**
   * Crée une instance de QuoteCalculator avec des règles personnalisées
   */
  static async createCalculatorWithRules(
    movingRules: Rule[] = [],
    packRules: Rule[] = [],
    serviceRules: Rule[] = []
  ): Promise<QuoteCalculator> {
    await QuoteCalculatorFactory.initialize();
    
    try {
      logger.info('📋 Création du calculateur avec règles personnalisées');
      
      // Récupérer les configurations à partir des différentes catégories
      const pricingConfigs = await QuoteCalculatorFactory.configRepository.findActiveByCategory(
        ConfigurationCategory.PRICING
      );
      
      const businessRulesConfigs = await QuoteCalculatorFactory.configRepository.findActiveByCategory(
        ConfigurationCategory.BUSINESS_RULES
      );
      
      const limitsConfigs = await QuoteCalculatorFactory.configRepository.findActiveByCategory(
        ConfigurationCategory.LIMITS
      );
      
      const serviceParamsConfigs = await QuoteCalculatorFactory.configRepository.findActiveByCategory(
        ConfigurationCategory.SERVICE_PARAMS
      );
      
      // Combiner les configurations
      const allConfigurations = [
        ...pricingConfigs,
        ...businessRulesConfigs,
        ...limitsConfigs,
        ...serviceParamsConfigs
      ];
      
      logger.info(`📊 Configurations récupérées: ${allConfigurations.length}`);
      logger.info('📊 Règles personnalisées:', { 
        moving: movingRules.length, 
        pack: packRules.length, 
        service: serviceRules.length 
      });
      
      // Créer le service de configuration
      const configService = new ConfigurationService(allConfigurations);
      
      // Créer le calculateur
      logger.info('✅ Calculateur avec règles personnalisées créé avec succès');
      return new QuoteCalculator(configService, movingRules, packRules, serviceRules);
    } catch (error) {
      logger.error('❌ Erreur lors de la création du calculateur avec règles personnalisées:', error as Error);
      throw new Error(`Impossible de créer le calculateur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }
  
  /**
   * Méthode de compatibilité - ne fait rien dans cette version
   */
  static async invalidateConfigurationCache(): Promise<void> {
    logger.info('ℹ️ Invalidation du cache ignorée');
  }
} 