import { NextRequest } from 'next/server';
import { BaseApiController } from './BaseApiController';
import { TemplateService } from '../../../application/services/TemplateService';
import { PrismaTemplateRepository } from '../../../infrastructure/repositories/PrismaTemplateRepository';
import { Template } from '../../../domain/entities/Template';
import { logger } from '@/lib/logger';

/**
 * Contrôleur pour la gestion des templates
 * Suit l'architecture DDD avec BaseApiController
 */
export class TemplateController extends BaseApiController {
  private readonly templateService: TemplateService;

  constructor(templateService?: TemplateService) {
    super();
    if (templateService) {
      this.templateService = templateService;
    } else {
      // Fallback pour la compatibilité
      const templateRepository = new PrismaTemplateRepository();
      this.templateService = new TemplateService(templateRepository);
    }
  }

  /**
   * GET /api/admin/templates
   * Récupère tous les templates avec filtres et statistiques
   */
  async getAllTemplates(request: NextRequest) {
    return this.handleRequest(request, async (data: any) => {
      logger.info('🔍 DEBUG: Début getAllTemplates');

      const search = data.search || '';
      const type = data.type || '';
      const limit = parseInt(data.limit || '10');
      const offset = parseInt(data.offset || '0');

      logger.info('📋 Récupération des templates avec filtres', { search, type, limit, offset });
      logger.info('🔍 DEBUG: templateService instance:', !!this.templateService);

      // Récupérer les templates selon les filtres
      let templates;
      logger.info('🔍 DEBUG: Avant appel service, type:', type);

      if (type) {
        logger.info('🔍 DEBUG: Appel getTemplatesByServiceType');
        templates = await this.templateService.getTemplatesByServiceType(type);
      } else {
        logger.info('🔍 DEBUG: Appel getAllTemplates');
        templates = await this.templateService.getAllTemplates();
      }

      logger.info('🔍 DEBUG: Templates récupérés:', templates?.length || 0);

      // Filtrer par recherche si nécessaire
      if (search) {
        templates = templates.filter(template =>
          template.getName().toLowerCase().includes(search.toLowerCase()) ||
          template.getDescription().toLowerCase().includes(search.toLowerCase())
        );
      }

      // Pagination
      const paginatedTemplates = templates.slice(offset, offset + limit);

      // Conversion pour l'API
      const templatesData = paginatedTemplates.map(template => ({
        ...this.templateToApiFormat(template),
        itemsCount: 0,
        totalRevenue: 0,
        avgPrice: template.getBasePrice().getAmount(),
        lastUsed: template.getUpdatedAt(),
        isPopular: false
      }));

      return {
        templates: templatesData,
        total: templates.length,
        hasMore: offset + limit < templates.length,
        statistics: {
          overview: {
            total: templates.length,
            active: templates.length,
            avgPrice: templates.reduce((sum, t) => sum + t.getBasePrice().getAmount(), 0) / templates.length || 0
          }
        },
        pagination: {
          total: templates.length,
          limit,
          offset,
          hasMore: offset + limit < templates.length
        }
      };
    });
  }

  /**
   * GET /api/admin/templates/[id]
   * Récupère un template spécifique
   */
  async getTemplate(request: NextRequest, params: { id: string }) {
    return this.handleRequest(async () => {
      const templateId = params.id;
      logger.info('📋 Récupération d\'un template spécifique', { templateId });

      const template = await this.templateService.getTemplateById(templateId);

      if (!template) {
        throw new Error('Template non trouvé');
      }

      return {
        template: this.templateToApiFormat(template)
      };
    });
  }

  /**
   * PUT /api/admin/templates/[id]
   * Met à jour un template spécifique
   */
  async updateTemplate(request: NextRequest, params: { id: string }) {
    return this.handleRequest(request, async (data: any) => {
      const templateId = params.id;
      logger.info('📝 Mise à jour d\'un template', { templateId });

      const updatedTemplate = await this.templateService.updateTemplate(templateId, {
        name: data.name,
        description: data.description,
        serviceType: data.serviceType,
        basePrice: data.basePrice,
        duration: data.duration,
        workers: data.workers
      });

      return {
        template: this.templateToApiFormat(updatedTemplate),
        message: `Template "${updatedTemplate.getName()}" mis à jour avec succès`
      };
    });
  }

  /**
   * DELETE /api/admin/templates/[id]
   * Supprime un template spécifique
   */
  async deleteTemplate(request: NextRequest, params: { id: string }) {
    return this.handleRequest(async () => {
      const templateId = params.id;
      logger.info('🗑️ Suppression d\'un template', { templateId });

      const success = await this.templateService.deleteTemplate(templateId);

      if (!success) {
        throw new Error('Impossible de supprimer le template');
      }

      return { deleted: true, message: 'Template supprimé avec succès' };
    });
  }

  /**
   * PATCH /api/admin/templates/[id]
   * Actions spécifiques sur un template (clone, etc.)
   */
  async patchTemplate(request: NextRequest, params: { id: string }) {
    return this.handleRequest(request, async (data: any) => {
      const templateId = params.id;
      const { action } = data;

      logger.info('🔄 Action PATCH sur template', { templateId, action });

      switch (action) {
        case 'clone':
          if (!data.newName) {
            throw new Error('Le nom du nouveau template est requis');
          }

          const clonedTemplate = await this.templateService.cloneTemplate(templateId, data.newName);
          return {
            template: this.templateToApiFormat(clonedTemplate),
            message: `Template cloné sous le nom "${data.newName}"`
          };

        default:
          throw new Error('Action non reconnue');
      }
    });
  }

  /**
   * POST /api/admin/templates
   * Gère les différentes actions POST sur les templates
   */
  async postTemplate(request: NextRequest) {
    return this.handleRequest(request, async (data: any) => {
      const { action, ...actionData } = data;

      logger.info('📝 Action POST sur template', { action });

      switch (action) {
        case 'create':
          return await this.handleCreateAction(actionData);

        case 'clone':
          return await this.handleCloneAction(actionData);

        case 'create_defaults':
          return await this.handleCreateDefaultsAction();

        case 'customize':
          return await this.handleCustomizeAction(actionData);

        case 'preview':
          return await this.handlePreviewAction(actionData);

        case 'update':
          return await this.handleUpdateAction(actionData);

        case 'delete':
          return await this.handleDeleteAction(actionData);

        case 'get':
          return await this.handleGetAction(actionData);

        default:
          throw new Error('Action non reconnue');
      }
    });
  }

  /**
   * Action: create - Crée un nouveau template
   */
  private async handleCreateAction(data: any) {
    const template = await this.templateService.createTemplate({
      name: data.name,
      description: data.description || '',
      serviceType: data.serviceType || 'MOVING',
      basePrice: data.basePrice || 0,
      duration: data.duration || 60,
      workers: data.workers || 1
    });

    return {
      template: this.templateToApiFormat(template),
      message: `Template "${template.getName()}" créé avec succès`
    };
  }

  /**
   * Action: clone - Clone un template existant
   */
  private async handleCloneAction(data: { templateId: string; newName: string }) {
    if (!data.templateId || !data.newName) {
      throw new Error('L\'ID du template et le nouveau nom sont obligatoires');
    }

    const clonedTemplate = await this.templateService.cloneTemplate(data.templateId, data.newName);

    return {
      template: this.templateToApiFormat(clonedTemplate),
      message: `Template cloné sous le nom "${data.newName}"`
    };
  }

  /**
   * Action: create_defaults - Crée les templates par défaut
   */
  private async handleCreateDefaultsAction() {
    const defaultTemplates = [];

    const templateConfigs = [
      {
        name: 'Déménagement Standard',
        description: 'Service de déménagement complet avec équipe professionnelle',
        serviceType: 'MOVING',
        basePrice: 80,
        workers: 2,
        duration: 240
      },
      {
        name: 'Ménage Complet',
        description: 'Service de nettoyage complet pour particuliers',
        serviceType: 'CLEANING',
        basePrice: 25,
        workers: 1,
        duration: 120
      },
      {
        name: 'Transport Express',
        description: 'Service de transport rapide et fiable',
        serviceType: 'TRANSPORT',
        basePrice: 45,
        workers: 1,
        duration: 90
      },
      {
        name: 'Livraison Standard',
        description: 'Service de livraison pour colis et objets volumineux',
        serviceType: 'DELIVERY',
        basePrice: 15,
        workers: 1,
        duration: 60
      }
    ];

    for (const config of templateConfigs) {
      try {
        const template = await this.templateService.createTemplate(config);
        defaultTemplates.push(this.templateToApiFormat(template));
        logger.info('✅ Template par défaut créé', { name: template.getName() });
      } catch (error) {
        logger.warn('⚠️ Template par défaut non créé (existe déjà?)', { name: config.name });
      }
    }

    return {
      templates: defaultTemplates,
      count: defaultTemplates.length,
      message: `${defaultTemplates.length} templates par défaut créés avec succès`
    };
  }

  /**
   * Action: customize - Personnalise un template
   */
  private async handleCustomizeAction(data: any) {
    if (!data.templateId) {
      throw new Error('L\'ID du template est obligatoire');
    }

    const template = await this.templateService.getTemplateById(data.templateId);
    if (!template) {
      throw new Error('Template non trouvé');
    }

    const customizedTemplate = {
      ...this.templateToApiFormat(template),
      basePrice: data.personalization?.price !== undefined ? parseFloat(data.personalization.price) : template.getBasePrice().getAmount(),
      workers: data.personalization?.workers !== undefined ? parseInt(data.personalization.workers) : template.getWorkers(),
      duration: data.personalization?.duration !== undefined ? parseInt(data.personalization.duration) : template.getDuration(),
      description: data.personalization?.description || template.getDescription()
    };

    return {
      template: customizedTemplate,
      message: 'Template personnalisé avec succès'
    };
  }

  /**
   * Action: preview - Génère un aperçu de template
   */
  private async handlePreviewAction(data: any) {
    if (!data.templateId) {
      throw new Error('L\'ID du template est obligatoire');
    }

    const template = await this.templateService.getTemplateById(data.templateId);
    if (!template) {
      throw new Error('Template non trouvé');
    }

    const preview = {
      templateId: template.getId(),
      name: template.getName(),
      serviceType: template.getServiceType(),
      description: data.personalization?.description || template.getDescription(),
      estimatedPrice: data.personalization?.price !== undefined ? parseFloat(data.personalization.price) : template.getBasePrice().getAmount(),
      workers: data.personalization?.workers !== undefined ? parseInt(data.personalization.workers) : template.getWorkers(),
      duration: data.personalization?.duration !== undefined ? parseInt(data.personalization.duration) : template.getDuration()
    };

    return {
      preview,
      message: 'Aperçu généré avec succès'
    };
  }

  /**
   * Actions simples
   */
  private async handleUpdateAction(data: any) {
    if (!data.id) throw new Error('L\'ID du template est obligatoire');
    const template = await this.templateService.updateTemplate(data.id, data);
    return { template: this.templateToApiFormat(template) };
  }

  private async handleDeleteAction(data: any) {
    if (!data.id) throw new Error('L\'ID du template est obligatoire');
    const success = await this.templateService.deleteTemplate(data.id);
    if (!success) throw new Error('Impossible de supprimer le template');
    return { deleted: true };
  }

  private async handleGetAction(data: any) {
    if (!data.id) throw new Error('L\'ID du template est obligatoire');
    const template = await this.templateService.getTemplateById(data.id);
    if (!template) throw new Error('Template non trouvé');
    return { template: this.templateToApiFormat(template) };
  }

  /**
   * GET /api/admin/templates/stats
   * Récupère les statistiques complètes des templates
   */
  async getTemplateStatistics(request: NextRequest) {
    return this.handleRequest(async () => {
      logger.info('📊 Récupération des statistiques templates');

      const statistics = await this.templateService.getTemplateStatistics();

      return {
        data: statistics
      };
    });
  }

  /**
   * Helper pour convertir Template entity en format API
   */
  private templateToApiFormat(template: Template) {
    return {
      id: template.getId(),
      name: template.getName(),
      description: template.getDescription(),
      serviceType: template.getServiceType(),
      basePrice: template.getBasePrice().getAmount(),
      duration: template.getDuration(),
      workers: template.getWorkers(),
      createdAt: template.getCreatedAt(),
      updatedAt: template.getUpdatedAt()
    };
  }
}