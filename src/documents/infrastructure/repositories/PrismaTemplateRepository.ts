// @ts-nocheck
/**
 * Repository Prisma pour la gestion des templates de documents
 * Phase 4: Templates avancés et personnalisation
 */

import { PrismaClient } from '@prisma/client';
import { Template } from '../../domain/entities/Template';
import { ITemplateRepository, TemplateSearchCriteria } from '../../domain/repositories/ITemplateRepository';
import { logger } from '@/lib/logger';

export class PrismaTemplateRepository implements ITemplateRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async save(template: Template): Promise<Template> {
    try {
      const savedTemplate = await this.prisma.documentTemplate.create({
        data: {
          id: template.id,
          name: template.name,
          documentType: template.documentType,
          description: template.description,
          layout: JSON.stringify(template.layout),
          sections: JSON.stringify(template.sections),
          branding: JSON.stringify(template.branding),
          isDefault: template.isDefault,
          isActive: template.isActive,
          version: template.version,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
          createdBy: template.createdBy,
          tags: JSON.stringify(template.tags),
          metadata: JSON.stringify(template.metadata)
        }
      });

      return this.mapPrismaToTemplate(savedTemplate);

    } catch (error) {
      logger.error('❌ Erreur lors de la sauvegarde du template', error as Error);
      throw error;
    }
  }

  async findById(id: string): Promise<Template | null> {
    try {
      const template = await this.prisma.documentTemplate.findUnique({
        where: { id }
      });

      return template ? this.mapPrismaToTemplate(template) : null;

    } catch (error) {
      logger.error('❌ Erreur lors de la recherche du template par ID', error as Error);
      throw error;
    }
  }

  async findByCriteria(criteria: TemplateSearchCriteria): Promise<Template[]> {
    try {
      const where: any = {};

      if (criteria.documentType) {
        where.documentType = criteria.documentType;
      }

      if (criteria.isActive !== undefined) {
        where.isActive = criteria.isActive;
      }

      if (criteria.isDefault !== undefined) {
        where.isDefault = criteria.isDefault;
      }

      if (criteria.createdBy) {
        where.createdBy = criteria.createdBy;
      }

      if (criteria.nameContains) {
        where.name = {
          contains: criteria.nameContains,
          mode: 'insensitive'
        };
      }

      // Pour les tags, on utilise une requête JSON
      if (criteria.tags && criteria.tags.length > 0) {
        where.tags = {
          path: '$',
          string_contains: criteria.tags[0] // Simplifié pour l'exemple
        };
      }

      const templates = await this.prisma.documentTemplate.findMany({
        where,
        take: criteria.limit,
        skip: criteria.offset,
        orderBy: criteria.sortBy ? {
          [criteria.sortBy]: criteria.sortOrder || 'asc'
        } : undefined
      });

      return templates.map(template => this.mapPrismaToTemplate(template));

    } catch (error) {
      logger.error('❌ Erreur lors de la recherche des templates', error as Error);
      throw error;
    }
  }

  async findDefaultByDocumentType(documentType: string): Promise<Template | null> {
    try {
      const template = await this.prisma.documentTemplate.findFirst({
        where: {
          documentType,
          isDefault: true,
          isActive: true
        }
      });

      return template ? this.mapPrismaToTemplate(template) : null;

    } catch (error) {
      logger.error('❌ Erreur lors de la recherche du template par défaut', error as Error);
      throw error;
    }
  }

  async update(template: Template): Promise<Template> {
    try {
      const updatedTemplate = await this.prisma.documentTemplate.update({
        where: { id: template.id },
        data: {
          name: template.name,
          description: template.description,
          layout: JSON.stringify(template.layout),
          sections: JSON.stringify(template.sections),
          branding: JSON.stringify(template.branding),
          isDefault: template.isDefault,
          isActive: template.isActive,
          version: template.version,
          updatedAt: new Date(),
          tags: JSON.stringify(template.tags),
          metadata: JSON.stringify(template.metadata)
        }
      });

      return this.mapPrismaToTemplate(updatedTemplate);

    } catch (error) {
      logger.error('❌ Erreur lors de la mise à jour du template', error as Error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.documentTemplate.delete({
        where: { id }
      });

      return true;

    } catch (error) {
      logger.error('❌ Erreur lors de la suppression du template', error as Error);
      return false;
    }
  }

  async clone(id: string, newName: string): Promise<Template> {
    try {
      const originalTemplate = await this.findById(id);
      if (!originalTemplate) {
        throw new Error(`Template avec l'ID ${id} non trouvé`);
      }

      const clonedTemplate = originalTemplate.clone(newName);
      return await this.save(clonedTemplate);

    } catch (error) {
      logger.error('❌ Erreur lors du clonage du template', error as Error);
      throw error;
    }
  }

  async setAsDefault(id: string): Promise<boolean> {
    try {
      // D'abord, récupérer le template pour connaître son type de document
      const template = await this.findById(id);
      if (!template) {
        throw new Error(`Template avec l'ID ${id} non trouvé`);
      }

      // Transaction pour s'assurer qu'un seul template est par défaut par type
      await this.prisma.$transaction(async (prisma) => {
        // Désactiver tous les templates par défaut pour ce type de document
        await prisma.documentTemplate.updateMany({
          where: {
            documentType: template.documentType,
            isDefault: true
          },
          data: {
            isDefault: false,
            updatedAt: new Date()
          }
        });

        // Activer le nouveau template par défaut
        await prisma.documentTemplate.update({
          where: { id },
          data: {
            isDefault: true,
            updatedAt: new Date()
          }
        });
      });

      return true;

    } catch (error) {
      logger.error('❌ Erreur lors de la définition du template par défaut', error as Error);
      return false;
    }
  }

  async setActive(id: string, isActive: boolean): Promise<boolean> {
    try {
      await this.prisma.documentTemplate.update({
        where: { id },
        data: {
          isActive,
          updatedAt: new Date()
        }
      });

      return true;

    } catch (error) {
      logger.error('❌ Erreur lors de la modification du statut', error as Error);
      return false;
    }
  }

  async countByCriteria(criteria: TemplateSearchCriteria): Promise<number> {
    try {
      const where: any = {};

      if (criteria.documentType) {
        where.documentType = criteria.documentType;
      }

      if (criteria.isActive !== undefined) {
        where.isActive = criteria.isActive;
      }

      if (criteria.isDefault !== undefined) {
        where.isDefault = criteria.isDefault;
      }

      if (criteria.createdBy) {
        where.createdBy = criteria.createdBy;
      }

      if (criteria.nameContains) {
        where.name = {
          contains: criteria.nameContains,
          mode: 'insensitive'
        };
      }

      const count = await this.prisma.documentTemplate.count({ where });
      return count;

    } catch (error) {
      logger.error('❌ Erreur lors du comptage des templates', error as Error);
      throw error;
    }
  }

  async getAvailableDocumentTypes(): Promise<string[]> {
    try {
      const result = await this.prisma.documentTemplate.findMany({
        select: { documentType: true },
        distinct: ['documentType']
      });

      return result.map(r => r.documentType);

    } catch (error) {
      logger.error('❌ Erreur lors de la récupération des types de documents', error as Error);
      throw error;
    }
  }

  async getAllTags(): Promise<string[]> {
    try {
      // Récupérer tous les templates et extraire les tags
      const templates = await this.prisma.documentTemplate.findMany({
        select: { tags: true }
      });

      const allTags = new Set<string>();

      templates.forEach(template => {
        if (template.tags) {
          const tags = JSON.parse(template.tags as string) as string[];
          tags.forEach(tag => allTags.add(tag));
        }
      });

      return Array.from(allTags).sort();

    } catch (error) {
      logger.error('❌ Erreur lors de la récupération des tags', error as Error);
      throw error;
    }
  }

  /**
   * Mappe les données Prisma vers l'entité Template
   */
  private mapPrismaToTemplate(prismaTemplate: any): Template {
    return new Template(
      prismaTemplate.id,
      prismaTemplate.name,
      prismaTemplate.documentType,
      prismaTemplate.description,
      JSON.parse(prismaTemplate.layout),
      JSON.parse(prismaTemplate.sections),
      JSON.parse(prismaTemplate.branding),
      prismaTemplate.isDefault,
      prismaTemplate.isActive,
      prismaTemplate.version,
      prismaTemplate.createdAt,
      prismaTemplate.updatedAt,
      prismaTemplate.createdBy,
      JSON.parse(prismaTemplate.tags || '[]'),
      JSON.parse(prismaTemplate.metadata || '{}')
    );
  }
}