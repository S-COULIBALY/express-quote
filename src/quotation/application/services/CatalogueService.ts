import { Catalogue } from '../../domain/entities/Catalogue';
import { ICatalogueRepository } from '../../domain/repositories/ICatalogueRepository';
import { Money } from '../../domain/valueObjects/Money';
import { logger } from '@/lib/logger';

/**
 * Service d'application pour la gestion du catalogue
 * Suit l'architecture DDD et respecte les patterns existants
 */
export class CatalogueService {
  constructor(
    private readonly catalogueRepository: ICatalogueRepository
  ) {}

  /**
   * Récupère tous les éléments du catalogue
   */
  async getAllCatalogues(): Promise<Catalogue[]> {
    logger.info('🔍 Récupération de tous les catalogues');

    try {
      logger.info('🔍 DEBUG: Avant appel catalogueRepository.findAll()');
      logger.info('🔍 DEBUG: Repository instance:', !!this.catalogueRepository);

      const result = await this.catalogueRepository.findAll();

      logger.info('🔍 DEBUG: Résultat repository:', result?.length || 0, 'catalogues');
      return result;
    } catch (error) {
      logger.error('❌ Erreur lors de la récupération des catalogues', error as Error);
      logger.error('❌ ERROR DETAILS:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      throw error;
    }
  }

  /**
   * Récupère un catalogue par son ID
   */
  async getCatalogueById(id: string): Promise<Catalogue | null> {
    logger.info('🔍 Récupération d\'un catalogue par ID', { id });

    try {
      const catalogue = await this.catalogueRepository.findById(id);

      if (!catalogue) {
        logger.warn('⚠️ Catalogue non trouvé', { id });
        return null;
      }

      return catalogue;
    } catch (error) {
      logger.error('❌ Erreur lors de la récupération du catalogue', error as Error);
      throw error;
    }
  }

  /**
   * Récupère les catalogues par catégorie
   */
  async getCataloguesByCategory(category: string): Promise<Catalogue[]> {
    logger.info('🔍 Récupération des catalogues par catégorie', { category });

    try {
      return await this.catalogueRepository.findByCategory(category);
    } catch (error) {
      logger.error('❌ Erreur lors de la récupération des catalogues par catégorie', error as Error);
      throw error;
    }
  }

  /**
   * Récupère les catalogues en vedette
   */
  async getFeaturedCatalogues(): Promise<Catalogue[]> {
    logger.info('🔍 Récupération des catalogues en vedette');

    try {
      return await this.catalogueRepository.findFeatured();
    } catch (error) {
      logger.error('❌ Erreur lors de la récupération des catalogues en vedette', error as Error);
      throw error;
    }
  }

  /**
   * Récupère les catalogues populaires
   */
  async getPopularCatalogues(): Promise<Catalogue[]> {
    logger.info('🔍 Récupération des catalogues populaires');

    try {
      return await this.catalogueRepository.findPopular();
    } catch (error) {
      logger.error('❌ Erreur lors de la récupération des catalogues populaires', error as Error);
      throw error;
    }
  }

  /**
   * Crée un nouvel élément de catalogue
   */
  async createCatalogue(catalogueData: {
    itemId?: string;
    category: 'DEMENAGEMENT' | 'MENAGE' | 'TRANSPORT' | 'LIVRAISON';
    subcategory?: string;
    displayOrder?: number;
    isActive?: boolean;
    isFeatured?: boolean;
    customPrice?: number;
    customDescription?: string;
  }): Promise<Catalogue> {
    logger.info('🆕 Création d\'un nouvel élément de catalogue', { category: catalogueData.category });

    try {
      // Générer un ID unique
      const id = `catalogue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Obtenir l'ordre d'affichage suivant si non spécifié
      const displayOrder = catalogueData.displayOrder ??
        await this.catalogueRepository.getNextDisplayOrder(catalogueData.category);

      // Créer l'entité Catalogue
      const catalogue = new Catalogue(
        id,
        catalogueData.itemId || null,
        catalogueData.category,
        catalogueData.subcategory || null,
        displayOrder,
        catalogueData.isActive !== false,
        catalogueData.isFeatured || false,
        false, // isPopular n'existe plus dans le schéma
        catalogueData.customPrice ? new Money(catalogueData.customPrice, 'EUR') : null,
        catalogueData.customDescription || null,
        [], // tags n'existe plus dans le schéma
        null // metadata n'existe plus dans le schéma
      );

      // Validation
      catalogue.validate();

      // Sauvegarder via le repository
      const savedCatalogue = await this.catalogueRepository.save(catalogue);

      logger.info('✅ Catalogue créé avec succès', {
        id: savedCatalogue.getId(),
        category: savedCatalogue.getCategory()
      });

      return savedCatalogue;
    } catch (error) {
      logger.error('❌ Erreur lors de la création du catalogue', error as Error);
      throw error;
    }
  }

  /**
   * Met à jour un catalogue existant
   */
  async updateCatalogue(id: string, catalogueData: {
    itemId?: string;
    category?: 'DEMENAGEMENT' | 'MENAGE' | 'TRANSPORT' | 'LIVRAISON';
    subcategory?: string;
    displayOrder?: number;
    isActive?: boolean;
    isFeatured?: boolean;
    customPrice?: number;
    customDescription?: string;
  }): Promise<Catalogue> {
    logger.info('📝 Mise à jour d\'un catalogue', { id });

    try {
      // Récupérer le catalogue existant
      const existingCatalogue = await this.catalogueRepository.findById(id);
      if (!existingCatalogue) {
        throw new Error(`Catalogue avec l'ID ${id} non trouvé`);
      }

      // Appliquer les modifications
      if (catalogueData.category !== undefined) {
        existingCatalogue.updateCategory(catalogueData.category);
      }

      if (catalogueData.subcategory !== undefined) {
        existingCatalogue.updateSubcategory(catalogueData.subcategory);
      }

      if (catalogueData.displayOrder !== undefined) {
        existingCatalogue.updateDisplayOrder(catalogueData.displayOrder);
      }

      if (catalogueData.isActive !== undefined) {
        if (catalogueData.isActive) {
          existingCatalogue.activate();
        } else {
          existingCatalogue.deactivate();
        }
      }

      if (catalogueData.isFeatured !== undefined) {
        existingCatalogue.setFeatured(catalogueData.isFeatured);
      }

      if (catalogueData.customPrice !== undefined) {
        existingCatalogue.setCustomPrice(
          catalogueData.customPrice ? new Money(catalogueData.customPrice, 'EUR') : null
        );
      }

      if (catalogueData.customDescription !== undefined) {
        existingCatalogue.setCustomDescription(catalogueData.customDescription);
      }

      // Validation
      existingCatalogue.validate();

      // Sauvegarder via le repository
      const savedCatalogue = await this.catalogueRepository.save(existingCatalogue);

      logger.info('✅ Catalogue mis à jour avec succès', { id });

      return savedCatalogue;
    } catch (error) {
      logger.error('❌ Erreur lors de la mise à jour du catalogue', error as Error);
      throw error;
    }
  }

  /**
   * Supprime un catalogue
   */
  async deleteCatalogue(id: string): Promise<boolean> {
    logger.info('🗑️ Suppression d\'un catalogue', { id });

    try {
      // Vérifier que le catalogue existe
      const catalogue = await this.catalogueRepository.findById(id);
      if (!catalogue) {
        logger.warn('⚠️ Tentative de suppression d\'un catalogue inexistant', { id });
        return false;
      }

      // Supprimer via le repository
      const deleted = await this.catalogueRepository.delete(id);

      if (deleted) {
        logger.info('✅ Catalogue supprimé avec succès', { id });
      } else {
        logger.warn('⚠️ Échec de la suppression du catalogue', { id });
      }

      return deleted;
    } catch (error) {
      logger.error('❌ Erreur lors de la suppression du catalogue', error as Error);
      throw error;
    }
  }

  /**
   * Clone un catalogue existant
   */
  async cloneCatalogue(id: string, newCategory?: string): Promise<Catalogue> {
    logger.info('📋 Clonage d\'un catalogue', { originalId: id, newCategory });

    try {
      // Récupérer le catalogue original
      const originalCatalogue = await this.catalogueRepository.findById(id);
      if (!originalCatalogue) {
        throw new Error(`Catalogue avec l'ID ${id} non trouvé`);
      }

      // Créer le catalogue cloné
      const clonedCatalogue = await this.createCatalogue({
        itemId: originalCatalogue.getItemId() || undefined,
        category: (newCategory as 'DEMENAGEMENT' | 'MENAGE' | 'TRANSPORT' | 'LIVRAISON') || (originalCatalogue.getCategory() as 'DEMENAGEMENT' | 'MENAGE' | 'TRANSPORT' | 'LIVRAISON'),
        subcategory: originalCatalogue.getSubcategory() || undefined,
        isActive: originalCatalogue.isActiveCatalog(),
        isFeatured: false, // Ne pas cloner le statut featured
        customPrice: originalCatalogue.getCustomPrice()?.getAmount(),
        customDescription: originalCatalogue.getCustomDescription() || undefined
      });

      logger.info('✅ Catalogue cloné avec succès', {
        originalId: id,
        clonedId: clonedCatalogue.getId()
      });

      return clonedCatalogue;
    } catch (error) {
      logger.error('❌ Erreur lors du clonage du catalogue', error as Error);
      throw error;
    }
  }

  /**
   * Réorganise l'ordre d'affichage d'une catégorie
   */
  async reorderCategory(category: string, catalogueIds: string[]): Promise<void> {
    logger.info('🔄 Réorganisation de catégorie', { category, count: catalogueIds.length });

    try {
      await this.catalogueRepository.reorderCategory(category, catalogueIds);
      logger.info('✅ Catégorie réorganisée avec succès', { category });
    } catch (error) {
      logger.error('❌ Erreur lors de la réorganisation', error as Error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques complètes du catalogue
   */
  async getCatalogueStatistics(): Promise<{
    overview: {
      totalCatalogues: number;
      activeCatalogues: number;
      featuredCatalogues: number;
      popularCatalogues: number;
      avgVisibility: number;
      categoriesCount: number;
    };
    performance: {
      topPerforming: Array<{
        id: string;
        category: string;
        subcategory: string | null;
        isPopular: boolean;
        isFeatured: boolean;
        displayOrder: number;
        hasCustomPrice: boolean;
      }>;
      underPerforming: Array<{
        id: string;
        category: string;
        subcategory: string | null;
        isActive: boolean;
        daysSinceCreation: number;
      }>;
    };
    business: {
      statsByCategory: Array<{
        category: string;
        total: number;
        active: number;
        featured: number;
        popular: number;
        withCustomPrice: number;
      }>;
      distribution: {
        byCategory: Array<{ category: string; percentage: string }>;
        byStatus: Array<{ status: string; count: number; percentage: string }>;
      };
    };
    trends: {
      usageEvolution: Array<{ period: string; cataloguesCreated: number; totalViews: number }>;
      popularityTrends: unknown[];
    };
    alerts: {
      count: number;
      inactive: Array<{ id: string; category: string; daysInactive: number }>;
      duplicateSubcategories: Array<{ category: string; subcategory: string | null; count: number }>;
    };
  }> {
    logger.info('📊 Récupération des statistiques catalogue');

    try {
      // Récupérer tous les catalogues avec leurs données de base
      const catalogues = await this.catalogueRepository.findAll();

      // Calculer les statistiques de base
      const totalCatalogues = catalogues.length;
      const activeCatalogues = catalogues.filter(c => c.isActiveCatalog()).length;
      const featuredCatalogues = catalogues.filter(c => c.isFeaturedCatalog()).length;
      const popularCatalogues = 0; // isPopular n'existe plus dans le schéma

      // Statistiques par catégorie
      const categoryGroups = catalogues.reduce((groups: Record<string, Catalogue[]>, catalogue) => {
        const category = catalogue.getCategory();
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(catalogue);
        return groups;
      }, {});

      const statsByCategory = Object.entries(categoryGroups).map(([category, catalogues]: [string, Catalogue[]]) => ({
        category,
        total: catalogues.length,
        active: catalogues.filter(c => c.isActiveCatalog()).length,
        featured: catalogues.filter(c => c.isFeaturedCatalog()).length,
        popular: 0, // isPopular n'existe plus dans le schéma
        withCustomPrice: catalogues.filter(c => c.getCustomPrice() !== null).length
      }));

      // Top catalogues par popularité
      const topPerforming = catalogues
        .filter(c => c.isActiveCatalog())
        .sort((a, b) => {
          // Critères: featured > ordre d'affichage
          const scoreA = a.isFeaturedCatalog() ? 2 : 0;
          const scoreB = b.isFeaturedCatalog() ? 2 : 0;
          return scoreB - scoreA || a.getDisplayOrder() - b.getDisplayOrder();
        })
        .slice(0, 5)
        .map(c => ({
          id: c.getId(),
          category: c.getCategory(),
          subcategory: c.getSubcategory(),
          isPopular: false, // isPopular n'existe plus dans le schéma
          isFeatured: c.isFeaturedCatalog(),
          displayOrder: c.getDisplayOrder(),
          hasCustomPrice: c.getCustomPrice() !== null
        }));

      // Catalogues sous-performants (inactifs ou mal positionnés)
      const underPerforming = catalogues
        .filter(c => !c.isActiveCatalog() || !c.isFeaturedCatalog())
        .slice(0, 5)
        .map(c => ({
          id: c.getId(),
          category: c.getCategory(),
          subcategory: c.getSubcategory(),
          isActive: c.isActiveCatalog(),
          daysSinceCreation: Math.floor(
            (Date.now() - new Date(c.getCreatedAt()).getTime()) / (1000 * 60 * 60 * 24)
          )
        }));

      // Évolution (simulation pour les 7 derniers jours)
      const usageEvolution = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        usageEvolution.push({
          period: date.toISOString().split('T')[0],
          cataloguesCreated: Math.floor(Math.random() * 5),
          totalViews: Math.floor(Math.random() * 200)
        });
      }

      // Alertes
      const inactiveCatalogues = catalogues
        .filter(c => !c.isActiveCatalog())
        .map(c => ({
          id: c.getId(),
          category: c.getCategory(),
          daysInactive: Math.floor(
            (Date.now() - new Date(c.getUpdatedAt()).getTime()) / (1000 * 60 * 60 * 24)
          )
        }));

      const duplicateSubcategories: Array<{ category: string; subcategory: string | null; count: number }> = [];
      const subcategoryMap = new Map();
      catalogues.forEach(c => {
        const key = `${c.getCategory()}-${c.getSubcategory()}`;
        if (subcategoryMap.has(key)) {
          duplicateSubcategories.push({
            category: c.getCategory(),
            subcategory: c.getSubcategory(),
            count: subcategoryMap.get(key) + 1
          });
          subcategoryMap.set(key, subcategoryMap.get(key) + 1);
        } else {
          subcategoryMap.set(key, 1);
        }
      });

      return {
        overview: {
          totalCatalogues,
          activeCatalogues,
          featuredCatalogues,
          popularCatalogues,
          avgVisibility: (activeCatalogues / totalCatalogues * 100) || 0,
          categoriesCount: Object.keys(categoryGroups).length
        },
        performance: {
          topPerforming,
          underPerforming
        },
        business: {
          statsByCategory,
          distribution: {
            byCategory: statsByCategory.map(s => ({
              category: s.category,
              percentage: (s.total / totalCatalogues * 100).toFixed(1)
            })),
            byStatus: [
              { status: 'Active', count: activeCatalogues, percentage: (activeCatalogues / totalCatalogues * 100).toFixed(1) },
              { status: 'Inactive', count: totalCatalogues - activeCatalogues, percentage: ((totalCatalogues - activeCatalogues) / totalCatalogues * 100).toFixed(1) }
            ]
          }
        },
        trends: {
          usageEvolution,
          popularityTrends: [] // Peut être étendu plus tard
        },
        alerts: {
          count: inactiveCatalogues.length + duplicateSubcategories.length,
          inactive: inactiveCatalogues.slice(0, 5),
          duplicateSubcategories: duplicateSubcategories.slice(0, 3)
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
  async bulkAction(action: string, catalogueIds: string[], data?: { category?: string }): Promise<{ affectedCount: number; results: { catalogueId: string; status: string; reason?: string }[] }> {
    logger.info('🔄 Action en lot sur catalogues', { action, catalogueIds, data });

    try {
      const results = [];
      let affectedCount = 0;

      for (const catalogueId of catalogueIds) {
        try {
          switch (action) {
            case 'activate':
              await this.updateCatalogue(catalogueId, { isActive: true });
              results.push({ catalogueId, status: 'success' });
              affectedCount++;
              break;

            case 'deactivate':
              await this.updateCatalogue(catalogueId, { isActive: false });
              results.push({ catalogueId, status: 'success' });
              affectedCount++;
              break;

            case 'set_featured':
              await this.updateCatalogue(catalogueId, { isFeatured: true });
              results.push({ catalogueId, status: 'success' });
              affectedCount++;
              break;

            case 'unset_featured':
              await this.updateCatalogue(catalogueId, { isFeatured: false });
              results.push({ catalogueId, status: 'success' });
              affectedCount++;
              break;

            case 'set_popular':
              // isPopular n'existe plus, ne rien faire
              results.push({ catalogueId, status: 'skipped', reason: 'isPopular field no longer exists' });
              break;

            case 'unset_popular':
              // isPopular n'existe plus, ne rien faire
              results.push({ catalogueId, status: 'skipped', reason: 'isPopular field no longer exists' });
              break;

            case 'update_category':
              if (!data?.category) {
                throw new Error('Catégorie requise pour l\'action update_category');
              }
              await this.updateCatalogue(catalogueId, { category: data.category as 'DEMENAGEMENT' | 'MENAGE' | 'TRANSPORT' | 'LIVRAISON' });
              results.push({ catalogueId, status: 'success' });
              affectedCount++;
              break;

            case 'bulk_delete':
              const deleted = await this.deleteCatalogue(catalogueId);
              if (deleted) {
                results.push({ catalogueId, status: 'success' });
                affectedCount++;
              } else {
                results.push({ catalogueId, status: 'failed', reason: 'Cannot delete' });
              }
              break;

            default:
              results.push({ catalogueId, status: 'failed', reason: 'Unknown action' });
          }
        } catch (error) {
          results.push({
            catalogueId,
            status: 'failed',
            reason: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      logger.info('✅ Action en lot terminée', { action, affectedCount, totalRequested: catalogueIds.length });

      return { affectedCount, results };
    } catch (error) {
      logger.error('❌ Erreur lors de l\'action en lot', error as Error);
      throw error;
    }
  }
}