import { PrismaClient } from '@prisma/client';
import { ICatalogueRepository } from '../../domain/repositories/ICatalogueRepository';
import { Catalogue } from '../../domain/entities/Catalogue';
import { Money } from '../../domain/valueObjects/Money';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

export class PrismaCatalogueRepository implements ICatalogueRepository {
  async findAll(): Promise<Catalogue[]> {
    try {
      logger.info('🔍 PrismaCatalogueRepository.findAll - Début');

      const catalogueSelections = await prisma.catalogSelection.findMany({
        orderBy: [
          { category: 'asc' },
          { displayOrder: 'asc' }
        ]
      });

      logger.info('🔍 PrismaCatalogueRepository.findAll - Trouvé:', catalogueSelections.length);

      return catalogueSelections.map(this.mapToDomain);
    } catch (error) {
      logger.error('❌ Erreur dans PrismaCatalogueRepository.findAll:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<Catalogue | null> {
    try {
      const catalogueSelection = await prisma.catalogSelection.findUnique({
        where: { id }
      });

      if (!catalogueSelection) {
        return null;
      }

      return this.mapToDomain(catalogueSelection);
    } catch (error) {
      logger.error('❌ Erreur dans PrismaCatalogueRepository.findById:', error);
      throw error;
    }
  }

  async findByCategory(category: string): Promise<Catalogue[]> {
    try {
      const catalogueSelections = await prisma.catalogSelection.findMany({
        where: {
          category: category as 'DEMENAGEMENT' | 'MENAGE' | 'TRANSPORT' | 'LIVRAISON',
          isActive: true
        },
        orderBy: { displayOrder: 'asc' }
      });

      return catalogueSelections.map(this.mapToDomain);
    } catch (error) {
      logger.error('❌ Erreur dans PrismaCatalogueRepository.findByCategory:', error);
      throw error;
    }
  }

  async findBySubcategory(category: string, subcategory: string): Promise<Catalogue[]> {
    try {
      const catalogueSelections = await prisma.catalogSelection.findMany({
        where: {
          category: category as 'DEMENAGEMENT' | 'MENAGE' | 'TRANSPORT' | 'LIVRAISON',
          subcategory,
          isActive: true
        },
        orderBy: { displayOrder: 'asc' }
      });

      return catalogueSelections.map(this.mapToDomain);
    } catch (error) {
      logger.error('❌ Erreur dans PrismaCatalogueRepository.findBySubcategory:', error);
      throw error;
    }
  }

  async findFeatured(): Promise<Catalogue[]> {
    try {
      const catalogueSelections = await prisma.catalogSelection.findMany({
        where: {
          isFeatured: true,
          isActive: true
        },
        orderBy: { displayOrder: 'asc' }
      });

      return catalogueSelections.map(this.mapToDomain);
    } catch (error) {
      logger.error('❌ Erreur dans PrismaCatalogueRepository.findFeatured:', error);
      throw error;
    }
  }

  async findPopular(): Promise<Catalogue[]> {
    try {
      // Comme isPopular n'existe pas dans le schéma, on utilise les éléments avec badges comme critère
      const catalogueSelections = await prisma.catalogSelection.findMany({
        where: {
          isActive: true,
          badgeText: { not: null } // Éléments avec badge = populaires
        },
        orderBy: { displayOrder: 'asc' }
      });

      return catalogueSelections.map(this.mapToDomain);
    } catch (error) {
      logger.error('❌ Erreur dans PrismaCatalogueRepository.findPopular:', error);
      throw error;
    }
  }

  async findActive(): Promise<Catalogue[]> {
    try {
      const catalogueSelections = await prisma.catalogSelection.findMany({
        where: { isActive: true },
        orderBy: [
          { category: 'asc' },
          { displayOrder: 'asc' }
        ]
      });

      return catalogueSelections.map(this.mapToDomain);
    } catch (error) {
      logger.error('❌ Erreur dans PrismaCatalogueRepository.findActive:', error);
      throw error;
    }
  }

  async findByItemId(itemId: string): Promise<Catalogue[]> {
    try {
      const catalogueSelections = await prisma.catalogSelection.findMany({
        where: { itemId },
        orderBy: { displayOrder: 'asc' }
      });

      return catalogueSelections.map(this.mapToDomain);
    } catch (error) {
      logger.error('❌ Erreur dans PrismaCatalogueRepository.findByItemId:', error);
      throw error;
    }
  }

  async findByTags(tags: string[]): Promise<Catalogue[]> {
    try {
      const catalogueSelections = await prisma.catalogSelection.findMany({
        where: {
          isActive: true
          // Note: Le champ tags n'existe pas dans le schéma actuel
        },
        orderBy: { displayOrder: 'asc' }
      });

      return catalogueSelections.map(this.mapToDomain);
    } catch (error) {
      logger.error('❌ Erreur dans PrismaCatalogueRepository.findByTags:', error);
      throw error;
    }
  }

  async save(catalogue: Catalogue): Promise<Catalogue> {
    try {
      const baseData = {
        category: catalogue.getCategory() as 'DEMENAGEMENT' | 'MENAGE' | 'TRANSPORT' | 'LIVRAISON',
        subcategory: catalogue.getSubcategory(),
        displayOrder: catalogue.getDisplayOrder(),
        isActive: catalogue.isActiveCatalog(),
        isFeatured: catalogue.isFeaturedCatalog(),
        // Alignement avec le schéma Prisma actuel
        marketingPrice: catalogue.getCustomPrice()?.getAmount() || null,
        marketingDescription: catalogue.getCustomDescription(),
        updatedAt: new Date()
      };

      const itemId = catalogue.getItemId();
      const updateData = {
        ...baseData,
        ...(itemId ? { item: { connect: { id: itemId } } } : {})
      };
      const createData = {
        id: catalogue.getId(),
        ...baseData,
        ...(itemId ? { item: { connect: { id: itemId } } } : {}),
        createdAt: catalogue.getCreatedAt()
      };

      const saved = await prisma.catalogSelection.upsert({
        where: { id: catalogue.getId() },
        update: updateData,
        create: createData
      });

      logger.info('✅ Catalogue sauvegardé:', saved.id);
      return this.mapToDomain(saved);
    } catch (error) {
      logger.error('❌ Erreur dans PrismaCatalogueRepository.save:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.catalogSelection.delete({
        where: { id }
      });

      logger.info('✅ Catalogue supprimé:', id);
      return true;
    } catch (error) {
      logger.error('❌ Erreur dans PrismaCatalogueRepository.delete:', error);
      return false;
    }
  }

  async getNextDisplayOrder(category: string): Promise<number> {
    try {
      const maxOrder = await prisma.catalogSelection.aggregate({
        where: { category: category as 'DEMENAGEMENT' | 'MENAGE' | 'TRANSPORT' | 'LIVRAISON' },
        _max: { displayOrder: true }
      });

      return (maxOrder._max.displayOrder || 0) + 1;
    } catch (error) {
      logger.error('❌ Erreur dans PrismaCatalogueRepository.getNextDisplayOrder:', error);
      throw error;
    }
  }

  async reorderCategory(category: string, catalogueIds: string[]): Promise<void> {
    try {
      // Mettre à jour l'ordre d'affichage en batch
      const updatePromises = catalogueIds.map((id, index) =>
        prisma.catalogSelection.update({
          where: { id },
          data: { displayOrder: index + 1 }
        })
      );

      await Promise.all(updatePromises);
      logger.info('✅ Ordre de catégorie mis à jour:', category);
    } catch (error) {
      logger.error('❌ Erreur dans PrismaCatalogueRepository.reorderCategory:', error);
      throw error;
    }
  }

  private mapToDomain(catalogueSelection: {
    id: string;
    itemId: string | null;
    category: string;
    subcategory: string | null;
    displayOrder: number;
    isActive: boolean;
    isFeatured: boolean;
    marketingPrice: number | null;
    customPrice?: number | null;
    marketingDescription: string | null;
    customDescription?: string | null;
    tags?: string[] | null;
    metadata?: object | null;
    createdAt: Date;
    updatedAt: Date;
  }): Catalogue {
    return new Catalogue(
      catalogueSelection.id,
      catalogueSelection.itemId,
      catalogueSelection.category as 'DEMENAGEMENT' | 'MENAGE' | 'TRANSPORT' | 'LIVRAISON',
      catalogueSelection.subcategory,
      catalogueSelection.displayOrder,
      catalogueSelection.isActive,
      catalogueSelection.isFeatured,
      false, // isPopular n'existe pas dans le schéma actuel
      catalogueSelection.marketingPrice != null
        ? new Money(catalogueSelection.marketingPrice as number, 'EUR')
        : null,
      catalogueSelection.marketingDescription ?? null,
      [], // tags n'existe pas dans le schéma actuel
      null, // metadata n'existe pas dans le schéma actuel
      catalogueSelection.createdAt,
      catalogueSelection.updatedAt
    );
  }
}