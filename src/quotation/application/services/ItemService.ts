import { Item } from '../../domain/entities/Item';
import { IItemRepository } from '../../domain/repositories/IItemRepository';
import { Money } from '../../domain/valueObjects/Money';
import { logger } from '@/lib/logger';

/**
 * Service d'application pour la gestion des items
 * Suit l'architecture DDD et respecte les patterns existants
 */
export class ItemService {
  constructor(
    private readonly itemRepository: IItemRepository
  ) {}

  /**
   * Récupère tous les items actifs
   */
  async getAllItems(): Promise<Item[]> {
    logger.info('🔍 Récupération de tous les items');

    try {
      logger.info('🔍 DEBUG: Avant appel itemRepository.findAll()');
      logger.info('🔍 DEBUG: Repository instance:', !!this.itemRepository);

      const result = await this.itemRepository.findAll();

      logger.info('🔍 DEBUG: Résultat repository:', result?.length || 0, 'items');
      return result;
    } catch (error) {
      logger.error('❌ Erreur lors de la récupération des items', error as Error);
      logger.error('❌ ERROR DETAILS:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      throw error;
    }
  }

  /**
   * Récupère un item par son ID
   */
  async getItemById(id: string): Promise<Item | null> {
    logger.info('🔍 Récupération d\'un item par ID', { id });

    try {
      const item = await this.itemRepository.findById(id);

      if (!item) {
        logger.warn('⚠️ Item non trouvé', { id });
        return null;
      }

      return item;
    } catch (error) {
      logger.error('❌ Erreur lors de la récupération de l\'item', error as Error);
      throw error;
    }
  }

  /**
   * Récupère les items par type de service
   */
  async getItemsByType(type: string): Promise<Item[]> {
    logger.info('🔍 Récupération des items par type', { type });

    try {
      const allItems = await this.itemRepository.findAll();
      return allItems.filter(item => item.getType() === type);
    } catch (error) {
      logger.error('❌ Erreur lors de la récupération des items par type', error as Error);
      throw error;
    }
  }

  /**
   * Récupère les items par template
   */
  async getItemsByTemplate(templateId: string): Promise<Item[]> {
    logger.info('🔍 Récupération des items par template', { templateId });

    try {
      return await this.itemRepository.findByTemplateId(templateId);
    } catch (error) {
      logger.error('❌ Erreur lors de la récupération des items par template', error as Error);
      throw error;
    }
  }

  /**
   * Crée un nouvel item
   */
  async createItem(itemData: {
    name: string;
    description: string;
    type: string;
    templateId?: string;
    price: number;
    workers: number;
    duration: number;
    features?: string[];
    includes?: string[];
    popular?: boolean;
    isActive?: boolean;
  }): Promise<Item> {
    logger.info('🆕 Création d\'un nouvel item', { name: itemData.name });

    try {
      // Générer un ID unique
      const id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Créer l'entité Item
      const item = new Item(
        id,
        itemData.type as any,
        itemData.templateId || null,
        null, // customerId
        null, // bookingId
        null, // parentItemId
        itemData.name,
        itemData.description,
        new Money(itemData.price, 'EUR'),
        itemData.workers,
        itemData.duration,
        itemData.features || [],
        null, // includedDistance
        'km', // distanceUnit
        itemData.includes || [],
        null, // categoryId
        itemData.popular || false,
        null, // imagePath
        itemData.isActive !== false,
        'ACTIVE'
      );

      // Sauvegarder via le repository
      const savedItem = await this.itemRepository.save(item);

      logger.info('✅ Item créé avec succès', {
        id: savedItem.getId(),
        name: savedItem.getName()
      });

      return savedItem;
    } catch (error) {
      logger.error('❌ Erreur lors de la création de l\'item', error as Error);
      throw error;
    }
  }

  /**
   * Met à jour un item existant
   */
  async updateItem(id: string, itemData: {
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
  }): Promise<Item> {
    logger.info('📝 Mise à jour d\'un item', { id });

    try {
      // Récupérer l'item existant
      const existingItem = await this.itemRepository.findById(id);
      if (!existingItem) {
        throw new Error(`Item avec l'ID ${id} non trouvé`);
      }

      // Créer l'item mis à jour
      const updatedItem = new Item(
        id,
        (itemData.type as any) ?? existingItem.getType(),
        itemData.templateId ?? existingItem.getTemplateId(),
        existingItem.getCustomerId(),
        existingItem.getBookingId(),
        existingItem.getParentItemId(),
        itemData.name ?? existingItem.getName(),
        itemData.description ?? existingItem.getDescription(),
        new Money(itemData.price ?? existingItem.getPrice().getAmount(), 'EUR'),
        itemData.workers ?? existingItem.getWorkers(),
        itemData.duration ?? existingItem.getDuration(),
        itemData.features ?? existingItem.getFeatures(),
        existingItem.getIncludedDistance(),
        existingItem.getDistanceUnit(),
        itemData.includes ?? existingItem.getIncludes(),
        existingItem.getCategoryId(),
        itemData.popular ?? existingItem.isPopular(),
        existingItem.getImagePath(),
        itemData.isActive ?? existingItem.isActive(),
        existingItem.getStatus(),
        new Date() // updatedAt
      );

      // Sauvegarder via le repository
      const savedItem = await this.itemRepository.save(updatedItem);

      logger.info('✅ Item mis à jour avec succès', { id });

      return savedItem;
    } catch (error) {
      logger.error('❌ Erreur lors de la mise à jour de l\'item', error as Error);
      throw error;
    }
  }

  /**
   * Supprime un item
   */
  async deleteItem(id: string): Promise<boolean> {
    logger.info('🗑️ Suppression d\'un item', { id });

    try {
      // Vérifier que l'item existe
      const item = await this.itemRepository.findById(id);
      if (!item) {
        logger.warn('⚠️ Tentative de suppression d\'un item inexistant', { id });
        return false;
      }

      // Vérifier qu'il n'est pas lié à une réservation
      if (item.getBookingId()) {
        throw new Error('Impossible de supprimer un item lié à une réservation');
      }

      // Supprimer via le repository
      const deleted = await this.itemRepository.delete(id);

      if (deleted) {
        logger.info('✅ Item supprimé avec succès', { id });
      } else {
        logger.warn('⚠️ Échec de la suppression de l\'item', { id });
      }

      return deleted;
    } catch (error) {
      logger.error('❌ Erreur lors de la suppression de l\'item', error as Error);
      throw error;
    }
  }

  /**
   * Clone un item existant
   */
  async cloneItem(id: string, newName: string): Promise<Item> {
    logger.info('📋 Clonage d\'un item', { originalId: id, newName });

    try {
      // Récupérer l'item original
      const originalItem = await this.itemRepository.findById(id);
      if (!originalItem) {
        throw new Error(`Item avec l'ID ${id} non trouvé`);
      }

      // Créer l'item cloné
      const clonedItem = await this.createItem({
        name: newName,
        description: `Clone de ${originalItem.getDescription()}`,
        type: originalItem.getType(),
        templateId: originalItem.getTemplateId() || undefined,
        price: originalItem.getPrice().getAmount(),
        workers: originalItem.getWorkers(),
        duration: originalItem.getDuration(),
        features: [...originalItem.getFeatures()],
        includes: [...originalItem.getIncludes()],
        popular: originalItem.isPopular(),
        isActive: originalItem.isActive()
      });

      logger.info('✅ Item cloné avec succès', {
        originalId: id,
        clonedId: clonedItem.getId()
      });

      return clonedItem;
    } catch (error) {
      logger.error('❌ Erreur lors du clonage de l\'item', error as Error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques complètes des items
   */
  async getItemStatistics(): Promise<any> {
    logger.info('📊 Récupération des statistiques items');

    try {
      // Récupérer tous les items avec leurs données de base
      const items = await this.itemRepository.findAll();

      // Calculer les statistiques de base
      const totalItems = items.length;
      const activeItems = items.filter(item => item.isActive()).length;
      const popularItems = items.filter(item => item.isPopular()).length;

      // Statistiques calculées sur les items
      const totalRevenue = items.reduce((sum, item) => {
        return sum + item.getPrice().getAmount();
      }, 0);

      const avgPrice = totalItems > 0 ? totalRevenue / totalItems : 0;

      // Grouper par type de service pour les statistiques par type
      const typeGroups = items.reduce((groups: any, item) => {
        const type = item.getType();
        if (!groups[type]) {
          groups[type] = [];
        }
        groups[type].push(item);
        return groups;
      }, {});

      const revenueByType = Object.entries(typeGroups).map(([type, items]: [string, any[]]) => ({
        type,
        count: items.length,
        itemsCount: items.length,
        avgPrice: items.reduce((sum, i) => sum + i.getPrice().getAmount(), 0) / items.length,
        totalValue: items.reduce((sum, i) => sum + i.getPrice().getAmount(), 0),
        revenue: items.reduce((sum, i) => sum + i.getPrice().getAmount(), 0)
      }));

      // Items par performance (basé sur le prix et popularité)
      const sortedByPrice = [...items].sort((a, b) =>
        b.getPrice().getAmount() - a.getPrice().getAmount()
      );

      const topPerforming = sortedByPrice.slice(0, 5).map(i => ({
        id: i.getId(),
        name: i.getName(),
        type: i.getType(),
        revenue: i.getPrice().getAmount(),
        isPopular: i.isPopular(),
        usageCount: 0 // Sera calculé avec les vraies données de réservations
      }));

      const underPerforming = items
        .filter(i => i.getPrice().getAmount() < avgPrice)
        .slice(0, 5)
        .map(i => ({
          id: i.getId(),
          name: i.getName(),
          type: i.getType(),
          revenue: i.getPrice().getAmount(),
          daysSinceCreation: Math.floor(
            (Date.now() - new Date(i.getCreatedAt()).getTime()) / (1000 * 60 * 60 * 24)
          )
        }));

      // Évolution d'usage (simulation pour les 7 derniers jours)
      const usageEvolution = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        usageEvolution.push({
          period: date.toISOString().split('T')[0],
          itemsCreated: Math.floor(Math.random() * 8),
          revenue: Math.floor(Math.random() * 300)
        });
      }

      // Alertes basées sur les items
      const unusedItems = items
        .filter(i => !i.isPopular() && i.getPrice().getAmount() === 0)
        .map(i => ({
          id: i.getId(),
          name: i.getName(),
          daysInactive: Math.floor(
            (Date.now() - new Date(i.getUpdatedAt()).getTime()) / (1000 * 60 * 60 * 24)
          )
        }));

      const lowPerformingItems = items
        .filter(i => i.getPrice().getAmount() < avgPrice * 0.5)
        .slice(0, 3)
        .map(i => ({
          id: i.getId(),
          name: i.getName(),
          conversionRate: 3.2 // Simulation
        }));

      return {
        overview: {
          totalItems,
          activeItems,
          popularItems,
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          avgConversionRate: 18.3, // Simulation
          avgUsageRate: 82.7 // Simulation
        },
        performance: {
          topPerforming,
          underPerforming
        },
        business: {
          revenueByType,
          profitability: {
            mostProfitable: topPerforming.slice(0, 3).map(i => ({
              id: i.id,
              name: i.name,
              roi: 28.5, // Simulation
              revenue: i.revenue
            })),
            leastProfitable: underPerforming.slice(0, 3).map(i => ({
              id: i.id,
              name: i.name,
              roi: 4.8, // Simulation
              revenue: i.revenue
            }))
          }
        },
        trends: {
          usageEvolution,
          popularityTrends: [] // Peut être étendu plus tard
        },
        alerts: {
          count: unusedItems.length + lowPerformingItems.length,
          unused: unusedItems.slice(0, 5),
          lowPerforming: lowPerformingItems
        }
      };

    } catch (error) {
      logger.error('❌ Erreur lors de la récupération des statistiques', error as Error);
      throw error;
    }
  }

  /**
   * Actions en lot
   */
  async bulkAction(action: string, itemIds: string[], data?: any): Promise<{ affectedCount: number; results: any[] }> {
    logger.info('🔄 Action en lot sur items', { action, itemIds, data });

    try {
      const results = [];
      let affectedCount = 0;

      for (const itemId of itemIds) {
        try {
          switch (action) {
            case 'activate':
              await this.updateItem(itemId, { isActive: true });
              results.push({ itemId, status: 'success' });
              affectedCount++;
              break;

            case 'deactivate':
              await this.updateItem(itemId, { isActive: false });
              results.push({ itemId, status: 'success' });
              affectedCount++;
              break;

            case 'set_popular':
              await this.updateItem(itemId, { popular: true });
              results.push({ itemId, status: 'success' });
              affectedCount++;
              break;

            case 'unset_popular':
              await this.updateItem(itemId, { popular: false });
              results.push({ itemId, status: 'success' });
              affectedCount++;
              break;

            case 'update_price':
              if (!data?.price) {
                throw new Error('Prix requis pour l\'action update_price');
              }
              await this.updateItem(itemId, { price: parseFloat(data.price) });
              results.push({ itemId, status: 'success' });
              affectedCount++;
              break;

            case 'bulk_delete':
              const deleted = await this.deleteItem(itemId);
              if (deleted) {
                results.push({ itemId, status: 'success' });
                affectedCount++;
              } else {
                results.push({ itemId, status: 'failed', reason: 'Cannot delete' });
              }
              break;

            default:
              results.push({ itemId, status: 'failed', reason: 'Unknown action' });
          }
        } catch (error) {
          results.push({
            itemId,
            status: 'failed',
            reason: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      logger.info('✅ Action en lot terminée', { action, affectedCount, totalRequested: itemIds.length });

      return { affectedCount, results };
    } catch (error) {
      logger.error('❌ Erreur lors de l\'action en lot', error as Error);
      throw error;
    }
  }

  /**
   * Valide les données d'un item
   */
  private validateItemData(data: {
    name: string;
    type: string;
    price: number;
    duration: number;
    workers: number;
  }): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Le nom de l\'item est obligatoire');
    }

    if (!data.type || data.type.trim().length === 0) {
      throw new Error('Le type de service est obligatoire');
    }

    if (data.price < 0) {
      throw new Error('Le prix doit être positif');
    }

    if (data.duration <= 0) {
      throw new Error('La durée doit être positive');
    }

    if (data.workers <= 0) {
      throw new Error('Le nombre de travailleurs doit être positif');
    }
  }
}