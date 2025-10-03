import { NextRequest } from 'next/server';
import { BaseApiController } from './BaseApiController';
import { CatalogueService } from '../../../application/services/CatalogueService';
import { PrismaCatalogueRepository } from '../../../infrastructure/repositories/PrismaCatalogueRepository';
import { Catalogue } from '../../../domain/entities/Catalogue';
import { logger } from '@/lib/logger';
import { PrismaClient } from '@prisma/client';

// Prisma client for enriching API payload with fields not mapped in domain
const prismaForCatalogueController = new PrismaClient();

/**
 * Contrôleur pour la gestion du catalogue
 * Suit l'architecture DDD avec BaseApiController
 */
export class CatalogueController extends BaseApiController {
  private readonly catalogueService: CatalogueService;

  constructor(catalogueService?: CatalogueService) {
    super();
    if (catalogueService) {
      this.catalogueService = catalogueService;
    } else {
      // Fallback pour la compatibilité
      const catalogueRepository = new PrismaCatalogueRepository();
      this.catalogueService = new CatalogueService(catalogueRepository);
    }
  }

  /**
   * GET /api/admin/catalogue
   * Récupère tous les catalogues avec filtres et statistiques
   */
  async getAllCatalogues(request: NextRequest) {
    return this.handleRequest(request, async (data: {
      search?: string;
      category?: string;
      featured?: string;
      popular?: string;
      limit?: string;
      offset?: string;
    }) => {
      logger.info('🔍 DEBUG: Début getAllCatalogues');

      const search = data.search || '';
      const category = data.category || '';
      const featured = data.featured === 'true';
      const popular = data.popular === 'true';
      const limit = parseInt(data.limit || '10');
      const offset = parseInt(data.offset || '0');

      logger.info('📋 Récupération des catalogues avec filtres', { search, category, featured, popular, limit, offset });
      logger.info('🔍 DEBUG: catalogueService instance:', !!this.catalogueService);

      // Récupérer les catalogues selon les filtres
      let catalogues;
      logger.info('🔍 DEBUG: Avant appel service, category:', category);

      if (featured) {
        logger.info('🔍 DEBUG: Appel getFeaturedCatalogues');
        catalogues = await this.catalogueService.getFeaturedCatalogues();
      } else if (popular) {
        logger.info('🔍 DEBUG: Appel getPopularCatalogues');
        catalogues = await this.catalogueService.getPopularCatalogues();
      } else if (category) {
        logger.info('🔍 DEBUG: Appel getCataloguesByCategory');
        catalogues = await this.catalogueService.getCataloguesByCategory(category);
      } else {
        logger.info('🔍 DEBUG: Appel getAllCatalogues');
        catalogues = await this.catalogueService.getAllCatalogues();
      }

      logger.info('🔍 DEBUG: Catalogues récupérés:', catalogues?.length || 0);

      // Filtrer par recherche si nécessaire
      if (search) {
        catalogues = catalogues.filter(catalogue =>
          catalogue.getCategory().toLowerCase().includes(search.toLowerCase()) ||
          (catalogue.getSubcategory() && catalogue.getSubcategory()!.toLowerCase().includes(search.toLowerCase())) ||
          (catalogue.getCustomDescription() && catalogue.getCustomDescription()!.toLowerCase().includes(search.toLowerCase()))
        );
      }

      // Pagination
      const paginatedCatalogues = catalogues.slice(offset, offset + limit);

      // Récupération des enregistrements bruts pour compléter avec les champs marketing attendus par l'UI
      const ids = paginatedCatalogues.map(c => c.getId());
      const rawRows = await prismaForCatalogueController.catalogSelection.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          marketingTitle: true,
          marketingSubtitle: true,
          marketingDescription: true,
          marketingPrice: true,
          originalPrice: true,
          badgeText: true,
          badgeColor: true,
          promotionText: true,
          targetAudience: true,
          isVisible: true,
          isNewOffer: true
        }
      });
      const idToRaw: Record<string, {
        id: string;
        marketingTitle: string | null;
        marketingSubtitle: string | null;
        marketingDescription: string | null;
        marketingPrice: number | null;
        originalPrice: number | null;
        badgeText: string | null;
        badgeColor: string | null;
        promotionText: string | null;
        targetAudience: string | null;
        isVisible: boolean;
        isNewOffer: boolean;
      }> = Object.fromEntries(rawRows.map(r => [r.id, r]));

      const cataloguesData = paginatedCatalogues.map(catalogue => {
        const base = this.catalogueToApiFormat(catalogue);
        const raw = idToRaw[base.id] || {
          marketingTitle: null,
          marketingSubtitle: null,
          marketingDescription: null,
          marketingPrice: null,
          originalPrice: null,
          badgeText: null,
          badgeColor: null,
          promotionText: null,
          targetAudience: null,
          isVisible: true,
          isNewOffer: false
        };
        return {
          ...base,
          // Champs marketing attendus par l'interface d'admin
          marketingTitle: raw.marketingTitle || null,
          marketingSubtitle: raw.marketingSubtitle || null,
          marketingDescription: raw.marketingDescription || null,
          marketingPrice: raw.marketingPrice ?? null,
          originalPrice: raw.originalPrice ?? null,
          badgeText: raw.badgeText || null,
          badgeColor: raw.badgeColor || null,
          promotionText: raw.promotionText || null,
          targetAudience: raw.targetAudience || null,
          isVisible: raw.isVisible ?? true,
          isNewOffer: raw.isNewOffer ?? false,
          // Statistiques simulées pour compatibilité avec l'interface existante
          viewsCount: Math.floor(Math.random() * 1000),
          clicksCount: Math.floor(Math.random() * 100),
          conversionRate: Math.random() * 10
        };
      });

      return {
        catalogues: cataloguesData,
        total: catalogues.length,
        hasMore: offset + limit < catalogues.length,
        statistics: {
          overview: {
            total: catalogues.length,
            active: catalogues.filter(c => c.isActiveCatalog()).length,
            featured: catalogues.filter(c => c.isFeaturedCatalog()).length,
            popular: 0 // isPopular n'existe plus dans le schéma
          }
        },
        pagination: {
          total: catalogues.length,
          limit,
          offset,
          hasMore: offset + limit < catalogues.length
        }
      };
    });
  }

  /**
   * GET /api/admin/catalogue/[id]
   * Récupère un catalogue spécifique
   */
  async getCatalogue(request: NextRequest, params: { id?: string }) {
    try {
      const catalogueId = params?.id;

      if (!catalogueId) {
        return this.badRequestResponse('ID du catalogue manquant');
      }

      logger.info('📋 Récupération d\'un catalogue spécifique', { catalogueId });

      const catalogue = await this.catalogueService.getCatalogueById(catalogueId);

      if (!catalogue) {
        return this.notFoundResponse('Catalogue non trouvé');
      }

      // Récupérer les données brutes avec les champs marketing
      const rawData = await prismaForCatalogueController.catalogSelection.findUnique({
        where: { id: catalogueId },
        select: {
          id: true,
          marketingTitle: true,
          marketingSubtitle: true,
          marketingDescription: true,
          marketingPrice: true,
          originalPrice: true,
          badgeText: true,
          badgeColor: true,
          promotionText: true,
          targetAudience: true,
          isVisible: true,
          isNewOffer: true
        }
      });

      // Récupérer les données de l'item associé si nécessaire
      let itemData = null;
      if (catalogue.getItemId()) {
        // Pour l'instant, simuler les données d'item basées sur le catalogue
        // En production, il faudrait récupérer depuis la table items
        const displayName = rawData?.marketingTitle || `${catalogue.getCategory()} ${catalogue.getSubcategory() || ''}`.trim();
        itemData = {
          id: catalogue.getItemId(),
          name: displayName,
          description: rawData?.marketingDescription || catalogue.getCustomDescription() || 'Service professionnel',
          price: rawData?.marketingPrice || catalogue.getCustomPrice()?.getAmount() || 0,
          type: catalogue.getCategory().toLowerCase(),
          duration: catalogue.getCategory() === 'DEMENAGEMENT' ? 4 : catalogue.getCategory() === 'MENAGE' ? 3 : 2,
          workers: catalogue.getCategory() === 'DEMENAGEMENT' ? 3 : catalogue.getCategory() === 'MENAGE' ? 2 : 1,
          imagePath: null,
          category: catalogue.getCategory(),
          subcategory: catalogue.getSubcategory(),
          createdAt: catalogue.getCreatedAt(),
          updatedAt: catalogue.getUpdatedAt()
        };
      }

      return this.successResponse({
        catalogSelection: {
          id: catalogue.getId(),
          category: catalogue.getCategory(),
          subcategory: catalogue.getSubcategory(),
          marketingTitle: rawData?.marketingTitle || null,
          marketingSubtitle: rawData?.marketingSubtitle || null,
          marketingDescription: rawData?.marketingDescription || catalogue.getCustomDescription(),
          marketingPrice: rawData?.marketingPrice || catalogue.getCustomPrice()?.getAmount() || 0,
          originalPrice: rawData?.originalPrice || null,
          badgeText: rawData?.badgeText || null,
          badgeColor: rawData?.badgeColor || null,
          promotionText: rawData?.promotionText || null,
          targetAudience: rawData?.targetAudience || null,
          isFeatured: catalogue.isFeaturedCatalog(),
          isActive: catalogue.isActiveCatalog(),
          displayOrder: catalogue.getDisplayOrder(),
          itemId: catalogue.getItemId(),
          createdAt: catalogue.getCreatedAt(),
          updatedAt: catalogue.getUpdatedAt()
        },
        item: itemData
      });
    } catch (error) {
      logger.error('❌ Erreur dans getCatalogue:', error);
      return this.errorResponse(error, 'Erreur lors de la récupération du catalogue');
    }
  }

  /**
   * PUT /api/admin/catalogue/[id]
   * Met à jour un catalogue spécifique
   */
  async updateCatalogue(request: NextRequest, params: { id: string }) {
    try {
      const catalogueId = params.id;
      const body = await request.json();

      logger.info('📝 Mise à jour d\'un catalogue', { catalogueId, body });

      const updatedCatalogue = await this.catalogueService.updateCatalogue(catalogueId, {
        itemId: body.itemId,
        category: body.category,
        subcategory: body.subcategory,
        displayOrder: body.displayOrder,
        isActive: body.isActive,
        isFeatured: body.isFeatured,
        customPrice: body.customPrice,
        customDescription: body.customDescription
      });

      return this.successResponse({
        catalogue: this.catalogueToApiFormat(updatedCatalogue)
      }, `Catalogue mis à jour avec succès`);
    } catch (error) {
      logger.error('❌ Erreur dans updateCatalogue:', error);
      return this.errorResponse(error, 'Erreur lors de la mise à jour du catalogue');
    }
  }

  /**
   * DELETE /api/admin/catalogue/[id]
   * Supprime un catalogue spécifique
   */
  async deleteCatalogue(request: NextRequest, params: { id: string }) {
    try {
      const catalogueId = params.id;

      logger.info('🗑️ Suppression d\'un catalogue', { catalogueId });

      const success = await this.catalogueService.deleteCatalogue(catalogueId);

      if (!success) {
        return this.badRequestResponse('Impossible de supprimer le catalogue');
      }

      return this.successResponse({ deleted: true }, 'Catalogue supprimé avec succès');
    } catch (error) {
      logger.error('❌ Erreur dans deleteCatalogue:', error);
      return this.errorResponse(error, 'Erreur lors de la suppression du catalogue');
    }
  }

  /**
   * PATCH /api/admin/catalogue/[id]
   * Actions spécifiques sur un catalogue (clone, etc.)
   */
  async patchCatalogue(request: NextRequest, params: { id: string }) {
    try {
      const catalogueId = params.id;
      const body = await request.json();
      const { action } = body;

      logger.info('🔄 Action PATCH sur catalogue', { catalogueId, action, body });

      switch (action) {
        case 'clone':
          return await this.handleClone(catalogueId, body.newCategory);

        case 'reorder':
          return await this.handleReorder(body.category, body.catalogueIds);

        default:
          return this.badRequestResponse('Action non reconnue');
      }
    } catch (error) {
      logger.error('❌ Erreur dans patchCatalogue:', error);
      return this.errorResponse(error, 'Erreur lors de l\'action sur le catalogue');
    }
  }

  /**
   * POST /api/admin/catalogue
   * Gère les différentes actions POST sur les catalogues
   */
  async postCatalogue(request: NextRequest) {
    try {
      const body = await request.json();
      const { action, ...data } = body;

      logger.info('📝 Action POST sur catalogue', { action, data });

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

        case 'reorder_category':
          return await this.handleReorderCategory(data);

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
      logger.error('❌ Erreur dans postCatalogue:', error);
      return this.errorResponse(error, 'Erreur lors de l\'action sur le catalogue');
    }
  }

  /**
   * Action: create - Crée un nouveau catalogue
   */
  private async handleCreateAction(data: {
    itemId?: string;
    category?: string;
    subcategory?: string;
    displayOrder?: number;
    isActive?: boolean;
    isFeatured?: boolean;
    customPrice?: number;
    customDescription?: string;
  }) {
    const catalogue = await this.catalogueService.createCatalogue({
      itemId: data.itemId,
      category: (data.category as 'DEMENAGEMENT' | 'MENAGE' | 'TRANSPORT' | 'LIVRAISON') || 'DEMENAGEMENT',
      subcategory: data.subcategory,
      displayOrder: data.displayOrder,
      isActive: data.isActive !== false,
      isFeatured: data.isFeatured || false,
      customPrice: data.customPrice,
      customDescription: data.customDescription
    });

    return this.successResponse({
      catalogue: this.catalogueToApiFormat(catalogue)
    }, `Catalogue créé avec succès`);
  }

  /**
   * Action: clone - Clone un catalogue existant
   */
  private async handleCloneAction(data: { catalogueId: string; newCategory?: string }) {
    if (!data.catalogueId) {
      return this.badRequestResponse('L\'ID du catalogue est obligatoire');
    }

    const clonedCatalogue = await this.catalogueService.cloneCatalogue(data.catalogueId, data.newCategory);

    return this.successResponse({
      catalogue: this.catalogueToApiFormat(clonedCatalogue)
    }, `Catalogue cloné avec succès`);
  }

  /**
   * Action: create_defaults - Crée les catalogues par défaut
   */
  private async handleCreateDefaultsAction() {
    const defaultCatalogues = [];

    const catalogueConfigs = [
      {
        category: 'DEMENAGEMENT',
        subcategory: 'Standard',
        customDescription: 'Service de déménagement complet avec équipe professionnelle',
        isFeatured: true
      },
      {
        category: 'MENAGE',
        subcategory: 'Complet',
        customDescription: 'Service de nettoyage complet pour particuliers',
        isFeatured: true
      },
      {
        category: 'TRANSPORT',
        subcategory: 'Express',
        customDescription: 'Service de transport rapide et fiable',
        isFeatured: false
      },
      {
        category: 'LIVRAISON',
        subcategory: 'Standard',
        customDescription: 'Service de livraison pour colis et objets volumineux',
        isFeatured: false
      }
    ];

    for (const config of catalogueConfigs) {
      try {
        const catalogue = await this.catalogueService.createCatalogue(config as {
          category: 'DEMENAGEMENT' | 'MENAGE' | 'TRANSPORT' | 'LIVRAISON';
          subcategory: string;
          customDescription: string;
          isFeatured: boolean;
        });
        defaultCatalogues.push(this.catalogueToApiFormat(catalogue));
        logger.info('✅ Catalogue par défaut créé', { category: catalogue.getCategory() });
      } catch (error) {
        // Catalogue peut déjà exister, continuer
        logger.warn('⚠️ Catalogue par défaut non créé (existe déjà?)', { category: config.category });
      }
    }

    return this.successResponse({
      catalogues: defaultCatalogues,
      count: defaultCatalogues.length
    }, `${defaultCatalogues.length} catalogues par défaut créés avec succès`);
  }

  /**
   * Action: customize - Personnalise un catalogue
   */
  private async handleCustomizeAction(data: {
    catalogueId: string;
    personalization: {
      customPrice?: number;
      customDescription?: string;
      isFeatured?: boolean;
    };
  }) {
    if (!data.catalogueId) {
      return this.badRequestResponse('L\'ID du catalogue est obligatoire');
    }

    logger.info('🎨 Personnalisation d\'un catalogue', {
      catalogueId: data.catalogueId
    });

    const catalogue = await this.catalogueService.getCatalogueById(data.catalogueId);

    if (!catalogue) {
      return this.notFoundResponse('Catalogue non trouvé');
    }

    // Application des personnalisations
    const customizedCatalogue = {
      ...this.catalogueToApiFormat(catalogue),
      customPrice: data.personalization?.customPrice !== undefined ? parseFloat(data.personalization.customPrice.toString()) : catalogue.getCustomPrice()?.getAmount(),
      customDescription: data.personalization?.customDescription || catalogue.getCustomDescription(),
      isPopular: false, // isPopular n'existe plus dans le schéma
      isFeatured: data.personalization?.isFeatured !== undefined ? data.personalization.isFeatured : catalogue.isFeaturedCatalog()
    };

    return this.successResponse({
      catalogue: customizedCatalogue
    }, 'Catalogue personnalisé avec succès');
  }

  /**
   * Action: preview - Génère un aperçu de catalogue
   */
  private async handlePreviewAction(data: {
    catalogueId: string;
    personalization: {
      customPrice?: number;
      customDescription?: string;
      isFeatured?: boolean;
    };
  }) {
    if (!data.catalogueId) {
      return this.badRequestResponse('L\'ID du catalogue est obligatoire');
    }

    logger.info('👀 Génération d\'aperçu de catalogue', { catalogueId: data.catalogueId });

    const catalogue = await this.catalogueService.getCatalogueById(data.catalogueId);

    if (!catalogue) {
      return this.notFoundResponse('Catalogue non trouvé');
    }

    // Générer un aperçu avec les personnalisations appliquées
    const preview = {
      catalogueId: catalogue.getId(),
      category: catalogue.getCategory(),
      subcategory: catalogue.getSubcategory(),
      customDescription: data.personalization?.customDescription || catalogue.getCustomDescription(),
      customPrice: data.personalization?.customPrice !== undefined ? parseFloat(data.personalization.customPrice.toString()) : catalogue.getCustomPrice()?.getAmount(),
      isPopular: false, // isPopular n'existe plus dans le schéma
      isFeatured: data.personalization?.isFeatured !== undefined ? data.personalization.isFeatured : catalogue.isFeaturedCatalog()
    };

    return this.successResponse({
      preview
    }, 'Aperçu généré avec succès');
  }

  /**
   * Action: bulk_action - Actions en lot
   */
  private async handleBulkAction(data: {
    bulkAction: string;
    catalogueIds: string[];
    actionData?: { category?: string };
  }) {
    if (!data.bulkAction || !data.catalogueIds || !Array.isArray(data.catalogueIds)) {
      return this.badRequestResponse('Action et catalogueIds sont requis');
    }

    const result = await this.catalogueService.bulkAction(data.bulkAction, data.catalogueIds, data.actionData);

    return this.successResponse({
      affectedCount: result.affectedCount,
      results: result.results
    }, `Action ${data.bulkAction} effectuée sur ${result.affectedCount} catalogues`);
  }

  /**
   * Action: reorder_category - Réorganise une catégorie
   */
  private async handleReorderCategory(data: {
    category: string;
    catalogueIds: string[];
  }) {
    if (!data.category || !data.catalogueIds || !Array.isArray(data.catalogueIds)) {
      return this.badRequestResponse('Catégorie et catalogueIds sont requis');
    }

    await this.catalogueService.reorderCategory(data.category, data.catalogueIds);

    return this.successResponse({
      category: data.category,
      reorderedCount: data.catalogueIds.length
    }, `Catégorie ${data.category} réorganisée avec succès`);
  }

  /**
   * Autres actions (update, delete, get) - Délèguent aux méthodes spécialisées
   */
  private async handleUpdateAction(_data: unknown) {
    // Cette action sera gérée par updateCatalogue si nécessaire
    return this.badRequestResponse('Utilisez PUT /api/admin/catalogue/[id] pour les mises à jour');
  }

  private async handleDeleteAction(_data: unknown) {
    // Cette action sera gérée par deleteCatalogue si nécessaire
    return this.badRequestResponse('Utilisez DELETE /api/admin/catalogue/[id] pour les suppressions');
  }

  private async handleGetAction(_data: unknown) {
    // Cette action sera gérée par getCatalogue si nécessaire
    return this.badRequestResponse('Utilisez GET /api/admin/catalogue/[id] pour récupérer un catalogue');
  }

  /**
   * Clone un catalogue
   */
  private async handleClone(catalogueId: string, newCategory?: string) {
    const clonedCatalogue = await this.catalogueService.cloneCatalogue(catalogueId, newCategory);

    return this.successResponse({
      catalogue: this.catalogueToApiFormat(clonedCatalogue)
    }, `Catalogue cloné avec succès`);
  }

  /**
   * Réorganise l'ordre d'affichage
   */
  private async handleReorder(category: string, catalogueIds: string[]) {
    if (!category || !catalogueIds || !Array.isArray(catalogueIds)) {
      return this.badRequestResponse('Catégorie et catalogueIds sont requis');
    }

    await this.catalogueService.reorderCategory(category, catalogueIds);

    return this.successResponse({
      category,
      reorderedCount: catalogueIds.length
    }, `Ordre de la catégorie ${category} mis à jour`);
  }

  /**
   * GET /api/admin/catalogue/stats
   * Récupère les statistiques complètes des catalogues
   */
  async getCatalogueStatistics(request: NextRequest) {
    return this.handleRequest(request, async (_data: unknown) => {
      logger.info('📊 Récupération des statistiques catalogues');

      const statistics = await this.catalogueService.getCatalogueStatistics();

      return {
        data: statistics
      };
    });
  }

  /**
   * Helper pour convertir Catalogue entity en format API
   */
  private catalogueToApiFormat(catalogue: Catalogue) {
    return {
      id: catalogue.getId(),
      itemId: catalogue.getItemId(),
      category: catalogue.getCategory(),
      subcategory: catalogue.getSubcategory(),
      displayOrder: catalogue.getDisplayOrder(),
      isActive: catalogue.isActiveCatalog(),
      isFeatured: catalogue.isFeaturedCatalog(),
      isPopular: catalogue.isPopularCatalog(),
      customPrice: catalogue.getCustomPrice()?.getAmount() || null,
      customDescription: catalogue.getCustomDescription(),
      tags: catalogue.getTags(),
      metadata: catalogue.getMetadata(),
      createdAt: catalogue.getCreatedAt(),
      updatedAt: catalogue.getUpdatedAt()
    };
  }
}