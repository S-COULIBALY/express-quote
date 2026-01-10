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
      let parsedValue = data.value;

      // Essayer de parser seulement si c'est vraiment du JSON valide
      if (typeof data.value === 'string' && data.value.length > 0) {
        try {
          // Plus strict sur la détection JSON - doit vraiment ressembler à du JSON
          const trimmedValue = data.value.trim();
          if ((trimmedValue.startsWith('{') && trimmedValue.endsWith('}') && trimmedValue.length > 2) ||
              (trimmedValue.startsWith('[') && trimmedValue.endsWith(']') && trimmedValue.length > 2)) {
            // Tester si c'est vraiment du JSON valide
            const testParse = JSON.parse(trimmedValue);
            parsedValue = testParse;
          }
          // Sinon, garder la valeur string telle quelle
        } catch (jsonError) {
          // Si le parse JSON échoue, garder la valeur string originale
          parsedValue = data.value;
        }
      }

      return new Configuration(
        data.id,
        data.category as ConfigurationCategory,
        data.key,
        parsedValue,
        data.description,
        data.isActive,
        data.validFrom,
        data.validTo,
        data.updatedAt
      );
    } catch (error) {
      logger.error(`Erreur lors du mapping de la configuration ${data.key}:`, error as Error);
      // Créer un objet configuration minimal en cas d'erreur - ne pas essayer de parser
      return Configuration.create(
        data.category as ConfigurationCategory,
        data.key,
        String(data.value), // Forcer en string pour éviter les erreurs de parsing
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
      // ✅ CORRECTION: Générer un ID unique car le schéma Prisma n'a pas @default()
      const id = configuration.getId() || `${configuration.category}_${configuration.key}_${Date.now()}`;

      const data = await this.prisma.configuration.create({
        data: {
          id, // ✅ ID requis par le schéma
          category: configuration.category,
          key: configuration.key,
          value: configuration.value,
          description: configuration.description,
          isActive: configuration.isActive,
          validFrom: configuration.validFrom,
          validTo: configuration.validTo,
          updatedAt: new Date(), // ✅ CORRECTION: updatedAt requis par le schéma
          // Nouveaux champs avec valeurs par défaut
          environment: 'production',
          created_by: 'system', // ✅ CORRECTION: snake_case selon le schéma Prisma
          tags: [],
          priority: 100,
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
      // Vérifier d'abord si la table existe
      const tableExists = await this.checkConfigurationTableExists();
      if (!tableExists) {
        logger.warn(`Table configuration inaccessible, utilisation des configurations par défaut pour ${category}`);
        const defaultConfigs = createDefaultConfigurations();
        const filteredConfigs = defaultConfigs.filter(config => config.category === category);
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
        // ✅ CORRECTION: Générer un ID unique pour chaque configuration
        const id = config.getId() || `${config.category}_${config.key}_${Date.now()}`;

        const data = await tx.configuration.create({
          data: {
            id, // ✅ ID requis par le schéma
            category: config.category,
            key: config.key,
            value: config.value,
            description: config.description,
            isActive: config.isActive,
            validFrom: config.validFrom,
            validTo: config.validTo,
            updatedAt: new Date(), // ✅ CORRECTION: updatedAt requis par le schéma
            environment: 'production',
            created_by: 'system', // ✅ CORRECTION: snake_case
            tags: [],
            priority: 100,
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
        // ✅ CORRECTION: Générer un ID unique lors de la création
        const id = `${category}_${key}_${Date.now()}`;

        // Créer une nouvelle configuration
        await this.prisma.configuration.create({
          data: {
            id, // ✅ ID requis par le schéma
            category,
            key,
            value,
            description,
            isActive: true,
            updatedAt: new Date(), // ✅ CORRECTION: updatedAt requis par le schéma
            environment: 'production',
            created_by: 'system', // ✅ CORRECTION: snake_case
            tags: [],
            priority: 100
          }
        });
      }
    } catch (error) {
      console.error(`Failed to update configuration ${category}_${key}`, error);
      throw error;
    }
  }

  /**
   * Créer ou mettre à jour une configuration avec tous les nouveaux champs
   */
  async upsertConfiguration(
    category: ConfigurationCategory,
    key: string,
    value: any,
    options: {
      description?: string;
      environment?: string;
      createdBy?: string;
      tags?: string[];
      priority?: number;
      validationSchema?: any;
      changeReason?: string;
    } = {}
  ): Promise<Configuration> {
    try {
      const data = await this.prisma.configuration.upsert({
        where: {
          category_key: {
            category,
            key
          }
        },
        update: {
          value,
          description: options.description,
          tags: options.tags || [],
          priority: options.priority,
          validationSchema: options.validationSchema,
          changeReason: options.changeReason,
          updatedAt: new Date()
        },
        create: {
          category,
          key,
          value,
          description: options.description,
          isActive: true,
          environment: options.environment || 'production',
          createdBy: options.createdBy || 'system',
          tags: options.tags || [],
          priority: options.priority || 100,
          validationSchema: options.validationSchema,
          changeReason: options.changeReason || 'Configuration créée'
        }
      });

      return this.mapToDomain(data);
    } catch (error) {
      logger.error(`Erreur lors de l'upsert de la configuration ${category}.${key}:`, error);
      throw error;
    }
  }

  /**
   * Recherche des configurations par environnement
   */
  async findByEnvironment(environment: string): Promise<Configuration[]> {
    try {
      const data = await this.prisma.configuration.findMany({
        where: {
          environment,
          isActive: true
        },
        orderBy: [
          { category: 'asc' },
          { key: 'asc' }
        ]
      });

      return data.map(item => this.mapToDomain(item));
    } catch (error) {
      logger.error(`Erreur lors de la recherche par environnement ${environment}:`, error);
      return [];
    }
  }

  /**
   * Recherche des configurations par tags
   */
  async findByTags(tags: string[]): Promise<Configuration[]> {
    try {
      const data = await this.prisma.configuration.findMany({
        where: {
          tags: {
            hasSome: tags
          },
          isActive: true
        },
        orderBy: [
          { priority: 'asc' },
          { category: 'asc' },
          { key: 'asc' }
        ]
      });

      return data.map(item => this.mapToDomain(item));
    } catch (error) {
      logger.error(`Erreur lors de la recherche par tags:`, error);
      return [];
    }
  }
} 