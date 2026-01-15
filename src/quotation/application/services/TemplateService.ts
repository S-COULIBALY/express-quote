import { Template } from '../../domain/entities/Template';
import { ITemplateRepository } from '../../domain/repositories/ITemplateRepository';
import { Money } from '../../domain/valueObjects/Money';
import { logger } from '@/lib/logger';

/**
 * Service d'application pour la gestion des templates
 * Suit l'architecture DDD et respecte les patterns existants
 */
export class TemplateService {
  constructor(
    private readonly templateRepository: ITemplateRepository
  ) {}

  /**
   * Récupère tous les templates actifs
   */
  async getAllTemplates(): Promise<Template[]> {
    logger.info('🔍 Récupération de tous les templates');

    try {
      logger.info('🔍 DEBUG: Avant appel templateRepository.findAll()');
      logger.info('🔍 DEBUG: Repository instance:', !!this.templateRepository);

      const result = await this.templateRepository.findAll();

      logger.info('🔍 DEBUG: Résultat repository:', result?.length || 0, 'templates');
      return result;
    } catch (error) {
      logger.error('❌ Erreur lors de la récupération des templates', error as Error);
      logger.error('❌ ERROR DETAILS:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      throw error;
    }
  }

  /**
   * Récupère un template par son ID
   */
  async getTemplateById(id: string): Promise<Template | null> {
    logger.info('🔍 Récupération d\'un template par ID', { id });

    try {
      const template = await this.templateRepository.findById(id);

      if (!template) {
        logger.warn('⚠️ Template non trouvé', { id });
        return null;
      }

      return template;
    } catch (error) {
      logger.error('❌ Erreur lors de la récupération du template', error as Error);
      throw error;
    }
  }

  /**
   * Récupère un template avec ses items associés
   */
  async getTemplateWithItems(id: string): Promise<Template | null> {
    logger.info('🔍 Récupération d\'un template avec items', { id });

    try {
      return await this.templateRepository.findWithItems(id);
    } catch (error) {
      logger.error('❌ Erreur lors de la récupération du template avec items', error as Error);
      throw error;
    }
  }

  /**
   * Récupère les templates par type de service
   */
  async getTemplatesByServiceType(serviceType: string): Promise<Template[]> {
    logger.info('🔍 Récupération des templates par type de service', { serviceType });

    try {
      return await this.templateRepository.findByServiceType(serviceType);
    } catch (error) {
      logger.error('❌ Erreur lors de la récupération des templates par type', error as Error);
      throw error;
    }
  }

  /**
   * Crée un nouveau template
   */
  async createTemplate(templateData: {
    name: string;
    description: string;
    serviceType: string;
    basePrice: number;
    duration: number;
    workers: number;
  }): Promise<Template> {
    logger.info('🆕 Création d\'un nouveau template', { name: templateData.name });

    try {
      // Générer un ID unique
      const id = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Créer l'entité Template
      const template = new Template(
        id,
        templateData.name,
        templateData.description,
        templateData.serviceType,
        new Money(templateData.basePrice, 'EUR'),
        templateData.duration,
        templateData.workers
      );

      // Sauvegarder via le repository
      const savedTemplate = await this.templateRepository.save(template);

      logger.info('✅ Template créé avec succès', {
        id: savedTemplate.getId(),
        name: savedTemplate.getName()
      });

      return savedTemplate;
    } catch (error) {
      logger.error('❌ Erreur lors de la création du template', error as Error);
      throw error;
    }
  }

  /**
   * Met à jour un template existant
   */
  async updateTemplate(id: string, templateData: {
    name?: string;
    description?: string;
    serviceType?: string;
    basePrice?: number;
    duration?: number;
    workers?: number;
  }): Promise<Template> {
    logger.info('📝 Mise à jour d\'un template', { id });

    try {
      // Récupérer le template existant
      const existingTemplate = await this.templateRepository.findById(id);
      if (!existingTemplate) {
        throw new Error(`Template avec l'ID ${id} non trouvé`);
      }

      // Créer le template mis à jour
      const updatedTemplate = new Template(
        id,
        templateData.name ?? existingTemplate.getName(),
        templateData.description ?? existingTemplate.getDescription(),
        templateData.serviceType ?? existingTemplate.getServiceType(),
        new Money(templateData.basePrice ?? existingTemplate.getBasePrice().getAmount(), 'EUR'),
        templateData.duration ?? existingTemplate.getDuration(),
        templateData.workers ?? existingTemplate.getWorkers(),
        existingTemplate.getCreatedAt(),
        new Date() // updatedAt
      );

      // Sauvegarder via le repository
      const savedTemplate = await this.templateRepository.update(id, updatedTemplate);

      logger.info('✅ Template mis à jour avec succès', { id });

      return savedTemplate;
    } catch (error) {
      logger.error('❌ Erreur lors de la mise à jour du template', error as Error);
      throw error;
    }
  }

  /**
   * Supprime un template
   */
  async deleteTemplate(id: string): Promise<boolean> {
    logger.info('🗑️ Suppression d\'un template', { id });

    try {
      // Vérifier que le template existe
      const template = await this.templateRepository.findById(id);
      if (!template) {
        logger.warn('⚠️ Tentative de suppression d\'un template inexistant', { id });
        return false;
      }

      // Supprimer via le repository
      const deleted = await this.templateRepository.delete(id);

      if (deleted) {
        logger.info('✅ Template supprimé avec succès', { id });
      } else {
        logger.warn('⚠️ Échec de la suppression du template', { id });
      }

      return deleted;
    } catch (error) {
      logger.error('❌ Erreur lors de la suppression du template', error as Error);
      throw error;
    }
  }

  /**
   * Clone un template existant
   */
  async cloneTemplate(id: string, newName: string): Promise<Template> {
    logger.info('📋 Clonage d\'un template', { originalId: id, newName });

    try {
      // Récupérer le template original
      const originalTemplate = await this.templateRepository.findById(id);
      if (!originalTemplate) {
        throw new Error(`Template avec l'ID ${id} non trouvé`);
      }

      // Créer le template cloné
      const clonedTemplate = await this.createTemplate({
        name: newName,
        description: `Clone de ${originalTemplate.getDescription()}`,
        serviceType: originalTemplate.getServiceType(),
        basePrice: originalTemplate.getBasePrice().getAmount(),
        duration: originalTemplate.getDuration(),
        workers: originalTemplate.getWorkers()
      });

      logger.info('✅ Template cloné avec succès', {
        originalId: id,
        clonedId: clonedTemplate.getId()
      });

      return clonedTemplate;
    } catch (error) {
      logger.error('❌ Erreur lors du clonage du template', error as Error);
      throw error;
    }
  }

  /**
   * Calcule le coût total d'un template pour une durée donnée
   */
  calculateTotalCost(template: Template, durationMinutes?: number): number {
    const actualDuration = durationMinutes || template.getDuration();
    const baseCost = template.calculateBaseCost();

    // Logique de calcul selon la durée
    if (actualDuration !== template.getDuration()) {
      const costPerMinute = baseCost / template.getDuration();
      return costPerMinute * actualDuration;
    }

    return baseCost;
  }

  /**
   * Récupère les statistiques complètes des templates
   */
  async getTemplateStatistics(): Promise<any> {
    logger.info('📊 Récupération des statistiques templates');

    try {
      // Récupérer tous les templates avec leurs données de base
      const templates = await this.templateRepository.findAll();

      // Calculer les statistiques de base
      const totalTemplates = templates.length;
      const activeTemplates = templates.length; // Tous sont actifs via findAll()

      // Statistiques calculées sur les templates
      const totalRevenue = templates.reduce((sum, template) => {
        return sum + template.getBasePrice().getAmount();
      }, 0);

      const avgPrice = totalTemplates > 0 ? totalRevenue / totalTemplates : 0;

      // Grouper par type de service pour les statistiques par type
      const typeGroups = templates.reduce((groups: any, template) => {
        const type = template.getServiceType();
        if (!groups[type]) {
          groups[type] = [];
        }
        groups[type].push(template);
        return groups;
      }, {});

      const revenueByType = Object.entries(typeGroups).map(([type, templates]) => {
        const templatesArray = Array.isArray(templates) ? templates : [];
        return {
          type,
          count: templatesArray.length,
          itemsCount: templatesArray.length, // Alias pour compatibilité frontend
          avgPrice: templatesArray.length > 0 ? templatesArray.reduce((sum, t) => sum + t.getBasePrice().getAmount(), 0) / templatesArray.length : 0,
          totalValue: templatesArray.reduce((sum, t) => sum + t.getBasePrice().getAmount(), 0),
          revenue: templatesArray.reduce((sum, t) => sum + t.getBasePrice().getAmount(), 0) // Alias pour compatibilité frontend
        };
      });

      // Templates par performance (basé sur le prix et type)
      const sortedByPrice = [...templates].sort((a, b) =>
        b.getBasePrice().getAmount() - a.getBasePrice().getAmount()
      );

      const topPerforming = sortedByPrice.slice(0, 5).map(t => ({
        id: t.getId(),
        name: t.getName(),
        type: t.getServiceType(),
        revenue: t.getBasePrice().getAmount(),
        usageCount: 0 // Sera calculé avec les vraies données items
      }));

      const underPerforming = templates
        .filter(t => t.getBasePrice().getAmount() < avgPrice)
        .slice(0, 5)
        .map(t => ({
          id: t.getId(),
          name: t.getName(),
          type: t.getServiceType(),
          revenue: t.getBasePrice().getAmount(), // Ajouté pour compatibilité frontend
          daysSinceCreation: Math.floor(
            (Date.now() - new Date(t.getCreatedAt()).getTime()) / (1000 * 60 * 60 * 24)
          )
        }));

      // Évolution d'usage (simulation pour les 7 derniers jours)
      const usageEvolution = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        usageEvolution.push({
          period: date.toISOString().split('T')[0],
          itemsCreated: Math.floor(Math.random() * 5), // Simulation
          revenue: Math.floor(Math.random() * 200)
        });
      }

      // Alertes basées sur les templates
      const unusedTemplates = templates
        .filter(t => t.getBasePrice().getAmount() === 0)
        .map(t => ({
          id: t.getId(),
          name: t.getName(),
          daysInactive: Math.floor(
            (Date.now() - new Date(t.getUpdatedAt()).getTime()) / (1000 * 60 * 60 * 24)
          )
        }));

      const lowPerformingTemplates = templates
        .filter(t => t.getBasePrice().getAmount() < avgPrice * 0.5)
        .slice(0, 3)
        .map(t => ({
          id: t.getId(),
          name: t.getName(),
          conversionRate: 2.5 // Simulation
        }));

      return {
        overview: {
          totalTemplates,
          activeTemplates,
          totalItems: 0, // Sera calculé avec les vraies données
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          avgConversionRate: 15.5, // Simulation
          avgUsageRate: 78.2 // Simulation
        },
        performance: {
          topPerforming,
          underPerforming
        },
        business: {
          revenueByType,
          profitability: {
            mostProfitable: topPerforming.slice(0, 3).map(t => ({
              id: t.id,
              name: t.name,
              roi: 25.8, // Simulation
              revenue: t.revenue
            })),
            leastProfitable: underPerforming.slice(0, 3).map(t => ({
              id: t.id,
              name: t.name,
              roi: 5.2, // Simulation
              revenue: t.revenue // Utiliser la vraie valeur au lieu de 0
            }))
          }
        },
        trends: {
          usageEvolution,
          popularityTrends: [] // Peut être étendu plus tard
        },
        alerts: {
          count: unusedTemplates.length + lowPerformingTemplates.length,
          unused: unusedTemplates.slice(0, 5),
          lowPerforming: lowPerformingTemplates
        }
      };

    } catch (error) {
      logger.error('❌ Erreur lors de la récupération des statistiques', error as Error);
      throw error;
    }
  }

  /**
   * Valide les données d'un template
   */
  private validateTemplateData(data: {
    name: string;
    serviceType: string;
    basePrice: number;
    duration: number;
    workers: number;
  }): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Le nom du template est obligatoire');
    }

    if (!data.serviceType || data.serviceType.trim().length === 0) {
      throw new Error('Le type de service est obligatoire');
    }

    if (data.basePrice < 0) {
      throw new Error('Le prix de base doit être positif');
    }

    if (data.duration <= 0) {
      throw new Error('La durée doit être positive');
    }

    if (data.workers <= 0) {
      throw new Error('Le nombre de travailleurs doit être positif');
    }
  }
}