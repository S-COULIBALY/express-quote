import { NextRequest, NextResponse } from 'next/server';
import { ConfigurationService } from '../../../application/services/ConfigurationService';
import { ConfigurationCategory } from '../../../domain/configuration/ConfigurationKey';
import { BaseApiController } from './BaseApiController';
import { logger } from '@/lib/logger';

/**
 * Contrôleur DDD pour la gestion des configurations
 * Orchestre les appels au ConfigurationService en respectant l'architecture DDD
 */
export class ConfigurationController extends BaseApiController {
  constructor(private configurationService: ConfigurationService) {
    super();
  }

  /**
   * Récupère toutes les configurations d'une catégorie
   */
  async getConfigurations(request: NextRequest): Promise<NextResponse> {
    return this.handleRequest(request, async (data: any) => {
      const { category, date } = data;

      if (!category) {
        throw new Error('Paramètre category requis');
      }

      if (!Object.values(ConfigurationCategory).includes(category as ConfigurationCategory)) {
        throw new Error(`Catégorie invalide. Valeurs autorisées: ${Object.values(ConfigurationCategory).join(', ')}`);
      }

      const configurations = await this.configurationService.getConfigurations(
        category as ConfigurationCategory,
        date ? new Date(date) : undefined
      );

      logger.info(`Configurations récupérées pour la catégorie ${category}: ${configurations.length} éléments`);

      return {
        configurations,
        category,
        total: configurations.length
      };
    });
  }

  /**
   * Récupère la valeur d'une configuration spécifique
   */
  async getValue(request: NextRequest): Promise<NextResponse> {
    return this.handleRequest(request, async (data: any) => {
      const { category, key, date } = data;

      if (!category || !key) {
        throw new Error('Paramètres category et key requis');
      }

      if (!Object.values(ConfigurationCategory).includes(category as ConfigurationCategory)) {
        throw new Error(`Catégorie invalide. Valeurs autorisées: ${Object.values(ConfigurationCategory).join(', ')}`);
      }

      // Récupérer la configuration complète, pas seulement la valeur
      const configuration = await this.configurationService.getConfigurations(
        category as ConfigurationCategory,
        date ? new Date(date) : undefined
      );

      // Trouver la configuration spécifique par clé
      const specificConfig = configuration.find(config => config.key === key);

      if (!specificConfig) {
        throw new Error('Configuration non trouvée');
      }

      logger.info(`Configuration récupérée pour ${category}.${key}: ${JSON.stringify(specificConfig.value)}`);

      return {
        configuration: {
          id: specificConfig.getId(),
          category: specificConfig.category,
          key: specificConfig.key,
          value: specificConfig.value,
          description: specificConfig.description,
          isActive: specificConfig.isActive,
          validFrom: specificConfig.validFrom,
          validTo: specificConfig.validTo,
          updatedAt: specificConfig.updatedAt
        },
        retrievedAt: new Date().toISOString()
      };
    });
  }

  /**
   * Définit la valeur d'une configuration
   */
  async setValue(request: NextRequest): Promise<NextResponse> {
    return this.handleRequest(request, async (data: any) => {
      const { category, key, value, description, validFrom, validTo } = data;

      if (!category || !key) {
        throw new Error('Paramètres category et key requis');
      }

      if (value === undefined) {
        throw new Error('Paramètre value requis');
      }

      if (!Object.values(ConfigurationCategory).includes(category as ConfigurationCategory)) {
        throw new Error(`Catégorie invalide. Valeurs autorisées: ${Object.values(ConfigurationCategory).join(', ')}`);
      }

      const configuration = await this.configurationService.setValue(
        category as ConfigurationCategory,
        key,
        value,
        description,
        validFrom ? new Date(validFrom) : undefined,
        validTo ? new Date(validTo) : undefined
      );

      logger.info(`Configuration mise à jour: ${category}.${key} = ${JSON.stringify(value)}`);

      return {
        configuration,
        updatedAt: new Date().toISOString(),
        message: `Configuration ${category}.${key} mise à jour avec succès`
      };
    });
  }

  /**
   * Désactive une configuration
   */
  async deactivateConfiguration(request: NextRequest): Promise<NextResponse> {
    return this.handleRequest(request, async (data: any) => {
      const { category, key } = data;

      if (!category || !key) {
        throw new Error('Paramètres category et key requis');
      }

      if (!Object.values(ConfigurationCategory).includes(category as ConfigurationCategory)) {
        throw new Error(`Catégorie invalide. Valeurs autorisées: ${Object.values(ConfigurationCategory).join(', ')}`);
      }

      await this.configurationService.deactivateConfiguration(
        category as ConfigurationCategory,
        key
      );

      logger.info(`Configuration désactivée: ${category}.${key}`);

      return {
        message: `Configuration ${category}.${key} désactivée avec succès`,
        deactivatedAt: new Date().toISOString()
      };
    });
  }

  /**
   * Supprime définitivement une configuration
   */
  async deleteConfiguration(request: NextRequest): Promise<NextResponse> {
    return this.handleRequest(request, async (data: any) => {
      const { id } = data;

      if (!id) {
        throw new Error('Paramètre id requis');
      }

      await this.configurationService.deleteConfiguration(id);

      logger.info(`Configuration supprimée définitivement: ${id}`);

      return {
        message: `Configuration ${id} supprimée définitivement`,
        deletedAt: new Date().toISOString()
      };
    });
  }

  /**
   * Vide le cache des configurations
   */
  async clearCache(): Promise<NextResponse> {
    return this.handleRequest(async () => {
      this.configurationService.clearConfigurationCache();

      logger.info('Cache des configurations vidé');

      return {
        message: 'Cache des configurations vidé avec succès',
        clearedAt: new Date().toISOString()
      };
    });
  }

  /**
   * Récupère toutes les catégories de configuration disponibles
   */
  async getCategories(): Promise<NextResponse> {
    return this.handleRequest(async () => {
      const categories = Object.values(ConfigurationCategory);

      return {
        categories,
        total: categories.length,
        description: 'Catégories de configuration disponibles'
      };
    });
  }

  /**
   * Récupère les statistiques des configurations
   */
  async getStatistics(request: NextRequest): Promise<NextResponse> {
    return this.handleRequest(request, async (data: any) => {
      const { category } = data;

      // Ici on pourrait implémenter des statistiques via le service
      // Pour le moment, retournons des statistiques basiques
      const allCategories = Object.values(ConfigurationCategory);

      const stats: any = {
        totalCategories: allCategories.length,
        availableCategories: allCategories,
        generatedAt: new Date().toISOString()
      };

      if (category) {
        if (!Object.values(ConfigurationCategory).includes(category as ConfigurationCategory)) {
          throw new Error(`Catégorie invalide. Valeurs autorisées: ${allCategories.join(', ')}`);
        }

        // Stats pour une catégorie spécifique
        stats.requestedCategory = category;
        stats.message = `Statistiques pour la catégorie ${category}`;
      } else {
        stats.message = 'Statistiques globales des configurations';
      }

      return stats;
    });
  }
} 