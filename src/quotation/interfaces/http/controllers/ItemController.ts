import { NextRequest } from 'next/server';
import { BaseApiController } from './BaseApiController';
import { ItemService } from '../../../application/services/ItemService';
import { PrismaItemRepository } from '../../../infrastructure/repositories/PrismaItemRepository';
import { Item } from '../../../domain/entities/Item';
import { logger } from '@/lib/logger';

/**
 * Contrôleur pour la gestion des items
 * Suit l'architecture DDD avec BaseApiController
 */
export class ItemController extends BaseApiController {
  private readonly itemService: ItemService;

  constructor(itemService?: ItemService) {
    super();
    if (itemService) {
      this.itemService = itemService;
    } else {
      // Fallback pour la compatibilité
      const itemRepository = new PrismaItemRepository();
      this.itemService = new ItemService(itemRepository);
    }
  }

  /**
   * GET /api/admin/items
   * Récupère tous les items avec filtres et statistiques
   */
  async getAllItems(request: NextRequest) {
    return this.handleRequest(request, async (data: any) => {
      logger.info('🔍 DEBUG: Début getAllItems');

      try {
        const search = data.search || '';
        const type = data.type || '';
        const templateId = data.templateId || '';
        const limit = parseInt(data.limit || '10');
        const offset = parseInt(data.offset || '0');

        logger.info('📋 Récupération des items avec filtres', { search, type, templateId, limit, offset });
        logger.info('🔍 DEBUG: itemService instance:', !!this.itemService);

        // Récupérer les items selon les filtres
        let items;
        logger.info('🔍 DEBUG: Avant appel service, type:', type);

        if (type) {
          logger.info('🔍 DEBUG: Appel getItemsByType');
          items = await this.itemService.getItemsByType(type);
        } else if (templateId) {
          logger.info('🔍 DEBUG: Appel getItemsByTemplate');
          items = await this.itemService.getItemsByTemplate(templateId);
        } else {
          logger.info('🔍 DEBUG: Appel getAllItems');
          items = await this.itemService.getAllItems();
        }

        logger.info('🔍 DEBUG: Items récupérés:', items?.length || 0);

        // Filtrer par recherche si nécessaire
        if (search) {
          items = items.filter(item =>
            item.getName().toLowerCase().includes(search.toLowerCase()) ||
            item.getDescription()?.toLowerCase().includes(search.toLowerCase()) ||
            item.getType().toLowerCase().includes(search.toLowerCase())
          );
        }

        // Pagination
        const paginatedItems = items.slice(offset, offset + limit);

        // Conversion pour l'API
        const itemsData = paginatedItems.map(item => ({
          ...this.itemToApiFormat(item),
          // Statistiques simulées pour compatibilité avec l'interface existante
          usageCount: 0,
          totalRevenue: item.getPrice().getAmount(),
          avgPrice: item.getPrice().getAmount(),
          lastUsed: item.getUpdatedAt(),
          isBooked: !!item.getBookingId()
        }));

        return {
          items: itemsData,
          total: items.length,
          hasMore: offset + limit < items.length,
          statistics: {
            overview: {
              total: items.length,
              active: items.filter(i => i.isActive()).length,
              popular: items.filter(i => i.isPopular()).length,
              avgPrice: items.reduce((sum, i) => sum + i.getPrice().getAmount(), 0) / items.length || 0
            }
          },
          pagination: {
            total: items.length,
            limit,
            offset,
            hasMore: offset + limit < items.length
          }
        };
      } catch (error) {
        logger.error('❌ Erreur dans getAllItems:', error);
        throw error;
      }
    });
  }

  /**
   * GET /api/admin/items/[id]
   * Récupère un item spécifique
   */
  async getItem(request: NextRequest, params: { id: string }) {
    try {
      const itemId = params.id;

      logger.info('📋 Récupération d\'un item spécifique', { itemId });

      const item = await this.itemService.getItemById(itemId);

      if (!item) {
        return this.notFoundResponse('Item non trouvé');
      }

      return this.successResponse({
        item: this.itemToApiFormat(item)
      });
    } catch (error) {
      logger.error('❌ Erreur dans getItem:', error);
      return this.errorResponse(error, 'Erreur lors de la récupération de l\'item');
    }
  }

  /**
   * PUT /api/admin/items/[id]
   * Met à jour un item spécifique
   */
  async updateItem(request: NextRequest, params: { id: string }) {
    try {
      const itemId = params.id;
      const body = await request.json();

      logger.info('📝 Mise à jour d\'un item', { itemId, body });

      const updatedItem = await this.itemService.updateItem(itemId, {
        name: body.name,
        description: body.description,
        type: body.type,
        templateId: body.templateId,
        price: body.price,
        workers: body.workers,
        duration: body.duration,
        features: body.features,
        includes: body.includes,
        popular: body.popular,
        isActive: body.isActive
      });

      return this.successResponse({
        item: this.itemToApiFormat(updatedItem)
      }, `Item "${updatedItem.getName()}" mis à jour avec succès`);
    } catch (error) {
      logger.error('❌ Erreur dans updateItem:', error);
      return this.errorResponse(error, 'Erreur lors de la mise à jour de l\'item');
    }
  }

  /**
   * DELETE /api/admin/items/[id]
   * Supprime un item spécifique
   */
  async deleteItem(request: NextRequest, params: { id: string }) {
    try {
      const itemId = params.id;

      logger.info('🗑️ Suppression d\'un item', { itemId });

      const success = await this.itemService.deleteItem(itemId);

      if (!success) {
        return this.badRequestResponse('Impossible de supprimer l\'item');
      }

      return this.successResponse({ deleted: true }, 'Item supprimé avec succès');
    } catch (error) {
      logger.error('❌ Erreur dans deleteItem:', error);
      return this.errorResponse(error, 'Erreur lors de la suppression de l\'item');
    }
  }

  /**
   * PATCH /api/admin/items/[id]
   * Actions spécifiques sur un item (clone, etc.)
   */
  async patchItem(request: NextRequest, params: { id: string }) {
    try {
      const itemId = params.id;
      const body = await request.json();
      const { action } = body;

      logger.info('🔄 Action PATCH sur item', { itemId, action, body });

      switch (action) {
        case 'clone':
          return await this.handleClone(itemId, body.newName);

        case 'toggle_popular':
          return await this.handleTogglePopular(itemId);

        case 'toggle_active':
          return await this.handleToggleActive(itemId);

        default:
          return this.badRequestResponse('Action non reconnue');
      }
    } catch (error) {
      logger.error('❌ Erreur dans patchItem:', error);
      return this.errorResponse(error, 'Erreur lors de l\'action sur l\'item');
    }
  }

  /**
   * POST /api/admin/items
   * Gère les différentes actions POST sur les items
   */
  async postItem(request: NextRequest) {
    try {
      const body = await request.json();
      const { action, ...data } = body;

      logger.info('📝 Action POST sur item', { action, data });

      switch (action) {
        case 'create':
          return await this.handleCreateAction(data);

        case 'clone':
          return await this.handleCloneAction(data);

        case 'create_defaults':
          return await this.handleCreateDefaultsAction();

        case 'customize':
          return await this.handleCustomizeAction(data);

        case 'preview':
          return await this.handlePreviewAction(data);

        case 'bulk_action':
          return await this.handleBulkAction(data);

        case 'update':
          return await this.handleUpdateAction(data);

        case 'delete':
          return await this.handleDeleteAction(data);

        case 'get':
          return await this.handleGetAction(data);

        default:
          return this.badRequestResponse('Action non reconnue');
      }
    } catch (error) {
      logger.error('❌ Erreur dans postItem:', error);
      return this.errorResponse(error, 'Erreur lors de l\'action sur l\'item');
    }
  }

  /**
   * Action: create - Crée un nouvel item
   */
  private async handleCreateAction(data: any) {
    const item = await this.itemService.createItem({
      name: data.name,
      description: data.description || '',
      type: data.type || 'DEMENAGEMENT',
      templateId: data.templateId,
      price: data.price || 0,
      workers: data.workers || 1,
      duration: data.duration || 60,
      features: data.features || [],
      includes: data.includes || [],
      popular: data.popular || false,
      isActive: data.isActive !== false
    });

    return this.successResponse({
      item: this.itemToApiFormat(item)
    }, `Item "${item.getName()}" créé avec succès`);
  }

  /**
   * Action: clone - Clone un item existant
   */
  private async handleCloneAction(data: { itemId: string; newName: string }) {
    if (!data.itemId || !data.newName) {
      return this.badRequestResponse('L\'ID de l\'item et le nouveau nom sont obligatoires');
    }

    const clonedItem = await this.itemService.cloneItem(data.itemId, data.newName);

    return this.successResponse({
      item: this.itemToApiFormat(clonedItem)
    }, `Item cloné sous le nom "${data.newName}"`);
  }

  /**
   * Action: create_defaults - Crée les items par défaut
   */
  private async handleCreateDefaultsAction() {
    const defaultItems = [];

    const itemConfigs = [
      {
        name: 'Déménagement Standard',
        description: 'Service de déménagement complet avec équipe professionnelle',
        type: 'DEMENAGEMENT',
        price: 80,
        workers: 2,
        duration: 240,
        features: ['Démontage/Remontage', 'Transport sécurisé', 'Équipe qualifiée'],
        includes: ['Équipe de 2 professionnels', 'Matériel de base', 'Transport']
      },
      {
        name: 'Ménage Complet',
        description: 'Service de nettoyage complet pour particuliers',
        type: 'MENAGE',
        price: 35,
        workers: 1,
        duration: 120,
        features: ['Nettoyage complet', 'Produits fournis', 'Garantie qualité'],
        includes: ['Nettoyage toutes surfaces', 'Sanitaires', 'Cuisine']
      },
      {
        name: 'Transport Express',
        description: 'Service de transport rapide et fiable',
        type: 'TRANSPORT',
        price: 45,
        workers: 1,
        duration: 90,
        features: ['Transport rapide', 'Véhicule adapté', 'Suivi temps réel'],
        includes: ['Véhicule utilitaire', 'Chauffeur professionnel', 'Assurance']
      },
      {
        name: 'Livraison Standard',
        description: 'Service de livraison pour colis et objets volumineux',
        type: 'LIVRAISON',
        price: 25,
        workers: 1,
        duration: 60,
        features: ['Livraison rapide', 'Manipulation soigneuse', 'Confirmation SMS'],
        includes: ['Livraison à domicile', 'Notification client', 'Service suivi']
      }
    ];

    for (const config of itemConfigs) {
      try {
        const item = await this.itemService.createItem(config);
        defaultItems.push(this.itemToApiFormat(item));
        logger.info('✅ Item par défaut créé', { name: item.getName() });
      } catch (error) {
        // Item peut déjà exister, continuer
        logger.warn('⚠️ Item par défaut non créé (existe déjà?)', { name: config.name });
      }
    }

    return this.successResponse({
      items: defaultItems,
      count: defaultItems.length
    }, `${defaultItems.length} items par défaut créés avec succès`);
  }

  /**
   * Action: customize - Personnalise un item
   */
  private async handleCustomizeAction(data: {
    itemId: string;
    personalization: any;
    profileId?: string;
  }) {
    if (!data.itemId) {
      return this.badRequestResponse('L\'ID de l\'item est obligatoire');
    }

    logger.info('🎨 Personnalisation d\'un item', {
      itemId: data.itemId,
      profileId: data.profileId
    });

    const item = await this.itemService.getItemById(data.itemId);

    if (!item) {
      return this.notFoundResponse('Item non trouvé');
    }

    // Application des personnalisations
    const customizedItem = {
      ...this.itemToApiFormat(item),
      price: data.personalization?.price !== undefined ? parseFloat(data.personalization.price) : item.getPrice().getAmount(),
      workers: data.personalization?.workers !== undefined ? parseInt(data.personalization.workers) : item.getWorkers(),
      duration: data.personalization?.duration !== undefined ? parseInt(data.personalization.duration) : item.getDuration(),
      description: data.personalization?.description || item.getDescription(),
      features: data.personalization?.features || item.getFeatures(),
      includes: data.personalization?.includes || item.getIncludes()
    };

    return this.successResponse({
      item: customizedItem
    }, 'Item personnalisé avec succès');
  }

  /**
   * Action: preview - Génère un aperçu d'item
   */
  private async handlePreviewAction(data: {
    itemId: string;
    personalization: any;
  }) {
    if (!data.itemId) {
      return this.badRequestResponse('L\'ID de l\'item est obligatoire');
    }

    logger.info('👀 Génération d\'aperçu d\'item', { itemId: data.itemId });

    const item = await this.itemService.getItemById(data.itemId);

    if (!item) {
      return this.notFoundResponse('Item non trouvé');
    }

    // Générer un aperçu avec les personnalisations appliquées
    const preview = {
      itemId: item.getId(),
      name: item.getName(),
      type: item.getType(),
      description: data.personalization?.description || item.getDescription(),
      estimatedPrice: data.personalization?.price !== undefined ? parseFloat(data.personalization.price) : item.getPrice().getAmount(),
      workers: data.personalization?.workers !== undefined ? parseInt(data.personalization.workers) : item.getWorkers(),
      duration: data.personalization?.duration !== undefined ? parseInt(data.personalization.duration) : item.getDuration(),
      features: data.personalization?.features || item.getFeatures(),
      includes: data.personalization?.includes || item.getIncludes()
    };

    return this.successResponse({
      preview
    }, 'Aperçu généré avec succès');
  }

  /**
   * Action: bulk_action - Actions en lot
   */
  private async handleBulkAction(data: {
    action: string;
    itemIds: string[];
    actionData?: any;
  }) {
    if (!data.action || !data.itemIds || !Array.isArray(data.itemIds)) {
      return this.badRequestResponse('Action et itemIds sont obligatoires');
    }

    logger.info('🔄 Action en lot sur items', { action: data.action, itemIds: data.itemIds });

    const result = await this.itemService.bulkAction(data.action, data.itemIds, data.actionData);

    return this.successResponse({
      affectedCount: result.affectedCount,
      results: result.results,
      itemIds: data.itemIds
    }, `Action ${data.action} effectuée avec succès sur ${result.affectedCount} items`);
  }

  /**
   * Action: update - Met à jour un item via POST
   */
  private async handleUpdateAction(data: {
    id: string;
    name?: string;
    description?: string;
    type?: string;
    templateId?: string;
    price?: number;
    workers?: number;
    duration?: number;
    features?: string[];
    includes?: string[];
    popular?: boolean;
    isActive?: boolean;
  }) {
    if (!data.id) {
      return this.badRequestResponse('L\'ID de l\'item est obligatoire');
    }

    logger.info('📝 Mise à jour d\'un item via action POST', { id: data.id });

    const updatedItem = await this.itemService.updateItem(data.id, {
      name: data.name,
      description: data.description,
      type: data.type,
      templateId: data.templateId,
      price: data.price,
      workers: data.workers,
      duration: data.duration,
      features: data.features,
      includes: data.includes,
      popular: data.popular,
      isActive: data.isActive
    });

    return this.successResponse({
      item: this.itemToApiFormat(updatedItem)
    }, `Item "${updatedItem.getName()}" mis à jour avec succès`);
  }

  /**
   * Action: delete - Supprime un item via POST
   */
  private async handleDeleteAction(data: { id: string }) {
    if (!data.id) {
      return this.badRequestResponse('L\'ID de l\'item est obligatoire');
    }

    logger.info('🗑️ Suppression d\'un item via action POST', { id: data.id });

    const success = await this.itemService.deleteItem(data.id);

    if (!success) {
      return this.badRequestResponse('Impossible de supprimer l\'item');
    }

    return this.successResponse({ deleted: true }, 'Item supprimé avec succès');
  }

  /**
   * Action: get - Récupère un item via POST
   */
  private async handleGetAction(data: { id: string }) {
    if (!data.id) {
      return this.badRequestResponse('L\'ID de l\'item est obligatoire');
    }

    logger.info('📋 Récupération d\'un item via action POST', { id: data.id });

    const item = await this.itemService.getItemById(data.id);

    if (!item) {
      return this.notFoundResponse('Item non trouvé');
    }

    return this.successResponse({
      item: this.itemToApiFormat(item)
    });
  }

  /**
   * Clone un item
   */
  private async handleClone(itemId: string, newName: string) {
    if (!newName) {
      return this.badRequestResponse('Le nom du nouvel item est requis');
    }

    const clonedItem = await this.itemService.cloneItem(itemId, newName);

    return this.successResponse({
      item: this.itemToApiFormat(clonedItem)
    }, `Item cloné sous le nom "${newName}"`);
  }

  /**
   * Toggle popularité d'un item
   */
  private async handleTogglePopular(itemId: string) {
    const item = await this.itemService.getItemById(itemId);
    if (!item) {
      return this.notFoundResponse('Item non trouvé');
    }

    const updatedItem = await this.itemService.updateItem(itemId, {
      popular: !item.isPopular()
    });

    return this.successResponse({
      item: this.itemToApiFormat(updatedItem)
    }, `Item ${updatedItem.isPopular() ? 'marqué comme populaire' : 'retiré des populaires'}`);
  }

  /**
   * Toggle statut actif d'un item
   */
  private async handleToggleActive(itemId: string) {
    const item = await this.itemService.getItemById(itemId);
    if (!item) {
      return this.notFoundResponse('Item non trouvé');
    }

    const updatedItem = await this.itemService.updateItem(itemId, {
      isActive: !item.isActive()
    });

    return this.successResponse({
      item: this.itemToApiFormat(updatedItem)
    }, `Item ${updatedItem.isActive() ? 'activé' : 'désactivé'}`);
  }

  /**
   * GET /api/admin/items/stats
   * Récupère les statistiques complètes des items
   */
  async getItemStatistics(request: NextRequest) {
    return this.handleRequest(request, async (data: any) => {
      logger.info('📊 Récupération des statistiques items');

      const statistics = await this.itemService.getItemStatistics();

      return {
        data: statistics
      };
    });
  }

  /**
   * Helper pour convertir Item entity en format API
   */
  private itemToApiFormat(item: Item) {
    return {
      id: item.getId(),
      name: item.getName(),
      description: item.getDescription(),
      type: item.getType(),
      templateId: item.getTemplateId(),
      customerId: item.getCustomerId(),
      bookingId: item.getBookingId(),
      parentItemId: item.getParentItemId(),
      price: item.getPrice().getAmount(),
      workers: item.getWorkers(),
      duration: item.getDuration(),
      features: item.getFeatures(),
      includedDistance: item.getIncludedDistance(),
      distanceUnit: item.getDistanceUnit(),
      includes: item.getIncludes(),
      categoryId: item.getCategoryId(),
      isPopular: item.isPopular(),
      imagePath: item.getImagePath(),
      isActive: item.isActive(),
      status: item.getStatus(),
      createdAt: item.getCreatedAt(),
      updatedAt: item.getUpdatedAt()
    };
  }
}