import { PrismaClient } from '@prisma/client';
import { Configuration } from '../../domain/configuration/Configuration';
import { ConfigurationCategory } from '../../domain/configuration/ConfigurationKey';
import { IConfigurationRepository } from '../../domain/repositories/IConfigurationRepository';
import { logger } from '../../../lib/logger';
import { createDefaultConfigurations } from '../../domain/configuration/DefaultConfigurations';

/**
 * Repository pour accéder aux configurations dans la base de données
 * Version corrigée avec une meilleure gestion des erreurs
 */
export class PrismaConfigurationRepository implements IConfigurationRepository {
  constructor(private prisma: PrismaClient) {
    logger.info('PrismaConfigurationRepository créé');
  }

  /**
   * Mappeur pour convertir les données brutes en objets du domaine
   */
  private mapToDomain(data: any): Configuration {
    try {
      return new Configuration(
        data.id,
        data.category as ConfigurationCategory,
        data.key,
        // Convertir la valeur JSON si nécessaire
        typeof data.value === 'string' ? JSON.parse(data.value) : data.value,
        data.description,
        data.isActive,
        data.validFrom,
        data.validTo,
        data.updatedAt
      );
    } catch (error) {
      logger.error(`Erreur lors du mapping de la configuration ${data.key}:`, error as Error);
      // Créer un objet configuration minimal en cas d'erreur
      return Configuration.create(
        data.category as ConfigurationCategory,
        data.key,
        data.value,
        data.description || 'Erreur de conversion'
      );
    }
  }

  /**
   * Vérifie l'existence de la table configuration
   * Retourne true si la table existe et est accessible
   */
  async checkConfigurationTableExists(): Promise<boolean> {
    try {
      // Tenter une requête simple pour vérifier l'existence et l'accès à la table
      await this.prisma.configuration.findFirst();
      return true;
    } catch (error) {
      logger.error('La table configuration n\'est pas accessible:', error);
      return false;
    }
  }

  /**
   * Crée une configuration
   */
  async save(configuration: Configuration): Promise<Configuration> {
    try {
      logger.debug(`Sauvegarde de la configuration ${configuration.category}.${configuration.key}`);
      
      const data = await this.prisma.configuration.create({
        data: {
          category: configuration.category,
          key: configuration.key,
          value: configuration.value,
          description: configuration.description,
          isActive: configuration.isActive,
          validFrom: configuration.validFrom,
          validTo: configuration.validTo,
        },
      });

      return this.mapToDomain(data);
    } catch (error) {
      logger.error(`Erreur lors de la sauvegarde de la configuration ${configuration.category}.${configuration.key}:`, error);
      throw error;
    }
  }

  /**
   * Met à jour une configuration existante
   */
  async update(configuration: Configuration): Promise<Configuration> {
    try {
      logger.debug(`Mise à jour de la configuration ${configuration.category}.${configuration.key}`);
      
      const data = await this.prisma.configuration.update({
        where: { id: configuration.getId() },
        data: {
          value: configuration.value,
          description: configuration.description,
          isActive: configuration.isActive,
          validTo: configuration.validTo,
          updatedAt: new Date(),
        },
      });

      return this.mapToDomain(data);
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour de la configuration ${configuration.category}.${configuration.key}:`, error);
      throw error;
    }
  }

  /**
   * Recherche une configuration par son ID
   */
  async findById(id: string): Promise<Configuration | null> {
    try {
      logger.debug(`Recherche de la configuration avec l'ID ${id}`);
      
      const data = await this.prisma.configuration.findUnique({
        where: { id },
      });

      return data ? this.mapToDomain(data) : null;
    } catch (error) {
      logger.error(`Erreur lors de la recherche de la configuration avec l'ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Recherche une configuration par sa catégorie et sa clé
   */
  async findByKey(
    category: ConfigurationCategory,
    key: string
  ): Promise<Configuration | null> {
    try {
      logger.debug(`Recherche de la configuration ${category}.${key}`);
      
      const data = await this.prisma.configuration.findFirst({
        where: {
          category,
          key,
        },
        orderBy: {
          validFrom: 'desc',
        },
      });

      return data ? this.mapToDomain(data) : null;
    } catch (error) {
      logger.error(`Erreur lors de la recherche de la configuration ${category}.${key}:`, error);
      return null;
    }
  }

  /**
   * Recherche une configuration active par sa catégorie et sa clé
   */
  async findActiveByKey(
    category: ConfigurationCategory,
    key: string,
    date: Date = new Date()
  ): Promise<Configuration | null> {
    try {
      logger.debug(`Recherche de la configuration active ${category}.${key}`);
      
      const data = await this.prisma.configuration.findFirst({
        where: {
          category,
          key,
          isActive: true,
          validFrom: {
            lte: date,
          },
          OR: [
            {
              validTo: null,
            },
            {
              validTo: {
                gt: date,
              },
            },
          ],
        },
        orderBy: {
          validFrom: 'desc',
        },
      });

      return data ? this.mapToDomain(data) : null;
    } catch (error) {
      logger.error(`Erreur lors de la recherche de la configuration active ${category}.${key}:`, error);
      return null;
    }
  }

  /**
   * Recherche toutes les configurations d'une catégorie
   */
  async findByCategory(category: ConfigurationCategory): Promise<Configuration[]> {
    try {
      logger.debug(`Recherche des configurations de la catégorie ${category}`);
      
      const data = await this.prisma.configuration.findMany({
        where: {
          category,
        },
        orderBy: {
          key: 'asc',
        },
      });

      return data.map((item) => this.mapToDomain(item));
    } catch (error) {
      logger.error(`Erreur lors de la recherche des configurations de la catégorie ${category}:`, error);
      logger.info('Retour des configurations par défaut pour cette catégorie');
      
      // Retourner les configurations par défaut de cette catégorie
      const defaultConfigs = createDefaultConfigurations();
      return defaultConfigs.filter(config => config.category === category);
    }
  }

  /**
   * Recherche toutes les configurations actives d'une catégorie
   */
  async findActiveByCategory(
    category: ConfigurationCategory,
    date: Date = new Date()
  ): Promise<Configuration[]> {
    try {
      console.log(`==== RECHERCHE DES CONFIGURATIONS ACTIVES DE LA CATÉGORIE ${category} ====`);
      logger.debug(`Recherche des configurations actives de la catégorie ${category}`);
      
      // Vérifier d'abord si la table existe
      const tableExists = await this.checkConfigurationTableExists();
      if (!tableExists) {
        console.log(`==== TABLE CONFIGURATION INACCESSIBLE, UTILISATION DES CONFIGURATIONS PAR DÉFAUT POUR ${category} ====`);
        logger.warn(`Table configuration inaccessible, utilisation des configurations par défaut pour ${category}`);
        const defaultConfigs = createDefaultConfigurations();
        const filteredConfigs = defaultConfigs.filter(config => config.category === category);
        console.log(`==== ${filteredConfigs.length} CONFIGURATIONS PAR DÉFAUT TROUVÉES POUR ${category} ====`);
        return filteredConfigs;
      }
      
      const data = await this.prisma.configuration.findMany({
        where: {
          category,
          isActive: true,
          validFrom: {
            lte: date,
          },
          OR: [
            {
              validTo: null,
            },
            {
              validTo: {
                gt: date,
              },
            },
          ],
        },
        orderBy: {
          key: 'asc',
        },
      });

      console.log(`==== ${data.length} CONFIGURATIONS ACTIVES TROUVÉES POUR LA CATÉGORIE ${category} ====`);
      if (data.length > 0) {
        console.log(`==== EXEMPLE CONFIG ${category}: ${data[0].key} ====`);
      }
      
      logger.info(`${data.length} configurations actives trouvées pour la catégorie ${category}`);
      return data.map((item) => this.mapToDomain(item));
    } catch (error) {
      console.error(`==== ERREUR LORS DE LA RECHERCHE DES CONFIGURATIONS POUR ${category}: ${error instanceof Error ? error.message : 'Erreur inconnue'} ====`);
      logger.error(`Erreur lors de la recherche des configurations actives de la catégorie ${category}:`, error as Error);
      logger.info('Retour des configurations par défaut pour cette catégorie');
      
      // Retourner les configurations par défaut de cette catégorie
      const defaultConfigs = createDefaultConfigurations();
      const filteredConfigs = defaultConfigs.filter(config => config.category === category);
      console.log(`==== UTILISATION DE ${filteredConfigs.length} CONFIGURATIONS PAR DÉFAUT POUR ${category} ====`);
      return filteredConfigs;
    }
  }

  /**
   * Supprime une configuration
   */
  async delete(id: string): Promise<void> {
    try {
      logger.debug(`Suppression de la configuration avec l'ID ${id}`);
      
      await this.prisma.configuration.delete({
        where: { id },
      });
    } catch (error) {
      logger.error(`Erreur lors de la suppression de la configuration avec l'ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Enregistre plusieurs configurations en utilisant une transaction
   */
  async saveMultiple(configurations: Configuration[]): Promise<Configuration[]> {
    return this.prisma.$transaction(async (tx) => {
      const results: Configuration[] = [];
      
      for (const config of configurations) {
        const data = await tx.configuration.create({
          data: {
            category: config.category,
            key: config.key,
            value: config.value,
            description: config.description,
            isActive: config.isActive,
            validFrom: config.validFrom,
            validTo: config.validTo,
          },
        });
        
        results.push(this.mapToDomain(data));
      }
      
      return results;
    });
  }
  
  /**
   * Met à jour plusieurs configurations en utilisant une transaction
   */
  async updateMultiple(configurations: Configuration[]): Promise<Configuration[]> {
    return this.prisma.$transaction(async (tx) => {
      const results: Configuration[] = [];
      
      for (const config of configurations) {
        const data = await tx.configuration.update({
          where: { id: config.getId() },
          data: {
            value: config.value,
            description: config.description,
            isActive: config.isActive,
            validTo: config.validTo,
            updatedAt: new Date(),
          },
        });
        
        results.push(this.mapToDomain(data));
      }
      
      return results;
    });
  }
  
  /**
   * Supprime plusieurs configurations en utilisant une transaction
   */
  async deleteMultiple(ids: string[]): Promise<void> {
    await this.prisma.$transaction(
      ids.map(id => 
        this.prisma.configuration.delete({
          where: { id }
        })
      )
    );
  }

  async updateValue(
    category: ConfigurationCategory,
    key: string,
    value: any,
    description?: string
  ): Promise<void> {
    try {
      // Récupérer la configuration existante
      const existingConfig = await this.prisma.configuration.findFirst({
        where: {
          category,
          key,
          isActive: true
        }
      });

      if (existingConfig) {
        // Mettre à jour la configuration existante
        await this.prisma.configuration.update({
          where: { id: existingConfig.id },
          data: {
            value,
            description,
            updatedAt: new Date()
          }
        });
      } else {
        // Créer une nouvelle configuration
        await this.prisma.configuration.create({
          data: {
            category,
            key,
            value,
            description,
            isActive: true
          }
        });
      }
    } catch (error) {
      console.error(`Failed to update configuration ${category}_${key}`, error);
      throw error;
    }
  }
} 