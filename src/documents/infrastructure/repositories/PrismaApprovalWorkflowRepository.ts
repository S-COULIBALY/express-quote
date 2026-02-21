// @ts-nocheck
/**
 * Repository Prisma pour la gestion des workflows d'approbation
 * Phase 5: Système de versions et workflow d'approbation
 */

import {
  ApprovalWorkflow,
  WorkflowType,
} from "../../domain/entities/ApprovalWorkflow";
import {
  IApprovalWorkflowRepository,
  WorkflowSearchCriteria,
} from "../../domain/repositories/IApprovalWorkflowRepository";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export class PrismaApprovalWorkflowRepository
  implements IApprovalWorkflowRepository
{
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async save(workflow: ApprovalWorkflow): Promise<ApprovalWorkflow> {
    try {
      const savedWorkflow = await this.prisma.approvalWorkflow.create({
        data: {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          type: workflow.type,
          steps: JSON.stringify(workflow.steps),
          activationConditions: JSON.stringify(workflow.activationConditions),
          isActive: workflow.isActive,
          isDefault: workflow.isDefault,
          priority: workflow.priority,
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt,
          createdBy: workflow.createdBy,
          version: workflow.version,
          tags: JSON.stringify(workflow.tags),
          metadata: JSON.stringify(workflow.metadata || {}),
        },
      });

      return this.mapPrismaToWorkflow(savedWorkflow);
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la sauvegarde du workflow",
        error as Error,
      );
      throw error;
    }
  }

  async findById(id: string): Promise<ApprovalWorkflow | null> {
    try {
      const workflow = await this.prisma.approvalWorkflow.findUnique({
        where: { id },
      });

      return workflow ? this.mapPrismaToWorkflow(workflow) : null;
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la recherche de workflow par ID",
        error as Error,
      );
      throw error;
    }
  }

  async findByCriteria(
    criteria: WorkflowSearchCriteria,
  ): Promise<ApprovalWorkflow[]> {
    try {
      const where: any = {};

      if (criteria.type) {
        where.type = criteria.type;
      }

      if (criteria.isActive !== undefined) {
        where.isActive = criteria.isActive;
      }

      if (criteria.isDefault !== undefined) {
        where.isDefault = criteria.isDefault;
      }

      if (criteria.name) {
        where.name = {
          contains: criteria.name,
          mode: "insensitive",
        };
      }

      if (criteria.createdBy) {
        where.createdBy = criteria.createdBy;
      }

      // Pour les tags, on utilise une requête JSON
      if (criteria.tags && criteria.tags.length > 0) {
        where.tags = {
          path: "$",
          string_contains: criteria.tags[0], // Simplifié pour l'exemple
        };
      }

      const workflows = await this.prisma.approvalWorkflow.findMany({
        where,
        take: criteria.limit,
        skip: criteria.offset,
        orderBy: criteria.sortBy
          ? {
              [criteria.sortBy]: criteria.sortOrder || "asc",
            }
          : { priority: "desc" }, // Par défaut, trier par priorité décroissante
      });

      return workflows.map((workflow) => this.mapPrismaToWorkflow(workflow));
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la recherche de workflows par critères",
        error as Error,
      );
      throw error;
    }
  }

  async findDefaultWorkflow(): Promise<ApprovalWorkflow | null> {
    try {
      const workflow = await this.prisma.approvalWorkflow.findFirst({
        where: {
          isDefault: true,
          isActive: true,
        },
        orderBy: { priority: "desc" },
      });

      return workflow ? this.mapPrismaToWorkflow(workflow) : null;
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la recherche du workflow par défaut",
        error as Error,
      );
      throw error;
    }
  }

  async findBestWorkflowForContext(context: {
    documentType?: string;
    amount?: number;
    impactLevel?: string;
    templateChanged?: boolean;
    customerType?: string;
    customData?: Record<string, any>;
  }): Promise<ApprovalWorkflow | null> {
    try {
      // Récupérer tous les workflows actifs triés par priorité
      const workflows = await this.prisma.approvalWorkflow.findMany({
        where: { isActive: true },
        orderBy: { priority: "desc" },
      });

      const mappedWorkflows = workflows.map((workflow) =>
        this.mapPrismaToWorkflow(workflow),
      );

      // Tester chaque workflow pour voir s'il s'applique au contexte
      for (const workflow of mappedWorkflows) {
        if (workflow.shouldApply(context)) {
          return workflow;
        }
      }

      // Si aucun workflow spécifique ne s'applique, retourner le workflow par défaut
      return await this.findDefaultWorkflow();
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la recherche du meilleur workflow",
        error as Error,
      );
      throw error;
    }
  }

  async update(workflow: ApprovalWorkflow): Promise<ApprovalWorkflow> {
    try {
      const updatedWorkflow = await this.prisma.approvalWorkflow.update({
        where: { id: workflow.id },
        data: {
          name: workflow.name,
          description: workflow.description,
          steps: JSON.stringify(workflow.steps),
          activationConditions: JSON.stringify(workflow.activationConditions),
          isActive: workflow.isActive,
          isDefault: workflow.isDefault,
          priority: workflow.priority,
          updatedAt: new Date(),
          version: workflow.version,
          tags: JSON.stringify(workflow.tags),
          metadata: JSON.stringify(workflow.metadata || {}),
        },
      });

      return this.mapPrismaToWorkflow(updatedWorkflow);
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la mise à jour du workflow",
        error as Error,
      );
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.approvalWorkflow.delete({
        where: { id },
      });

      return true;
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la suppression du workflow",
        error as Error,
      );
      return false;
    }
  }

  async setActive(id: string, isActive: boolean): Promise<boolean> {
    try {
      await this.prisma.approvalWorkflow.update({
        where: { id },
        data: {
          isActive,
          updatedAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la modification du statut du workflow",
        error as Error,
      );
      return false;
    }
  }

  async setAsDefault(id: string): Promise<boolean> {
    try {
      // Transaction pour s'assurer qu'un seul workflow est par défaut
      await this.prisma.$transaction(async (prisma) => {
        // Désactiver tous les workflows par défaut
        await prisma.approvalWorkflow.updateMany({
          where: { isDefault: true },
          data: {
            isDefault: false,
            updatedAt: new Date(),
          },
        });

        // Activer le nouveau workflow par défaut
        await prisma.approvalWorkflow.update({
          where: { id },
          data: {
            isDefault: true,
            isActive: true, // Un workflow par défaut doit être actif
            updatedAt: new Date(),
          },
        });
      });

      return true;
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la définition du workflow par défaut",
        error as Error,
      );
      return false;
    }
  }

  async clone(id: string, newName: string): Promise<ApprovalWorkflow> {
    try {
      const originalWorkflow = await this.findById(id);
      if (!originalWorkflow) {
        throw new Error(`Workflow ${id} non trouvé`);
      }

      const clonedWorkflow = originalWorkflow.clone(newName);
      return await this.save(clonedWorkflow);
    } catch (error) {
      logger.error("❌ Erreur lors du clonage du workflow", error as Error);
      throw error;
    }
  }

  async countByCriteria(criteria: WorkflowSearchCriteria): Promise<number> {
    try {
      const where: any = {};

      if (criteria.type) {
        where.type = criteria.type;
      }

      if (criteria.isActive !== undefined) {
        where.isActive = criteria.isActive;
      }

      if (criteria.isDefault !== undefined) {
        where.isDefault = criteria.isDefault;
      }

      if (criteria.name) {
        where.name = {
          contains: criteria.name,
          mode: "insensitive",
        };
      }

      if (criteria.createdBy) {
        where.createdBy = criteria.createdBy;
      }

      const count = await this.prisma.approvalWorkflow.count({ where });
      return count;
    } catch (error) {
      logger.error("❌ Erreur lors du comptage des workflows", error as Error);
      throw error;
    }
  }

  async getUsedWorkflowTypes(): Promise<WorkflowType[]> {
    try {
      const result = await this.prisma.approvalWorkflow.findMany({
        select: { type: true },
        distinct: ["type"],
      });

      return result.map((r) => r.type as WorkflowType);
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la récupération des types de workflows",
        error as Error,
      );
      throw error;
    }
  }

  async getAllTags(): Promise<string[]> {
    try {
      // Récupérer tous les workflows et extraire les tags
      const workflows = await this.prisma.approvalWorkflow.findMany({
        select: { tags: true },
      });

      const allTags = new Set<string>();

      workflows.forEach((workflow) => {
        if (workflow.tags) {
          const tags = JSON.parse(workflow.tags as string) as string[];
          tags.forEach((tag) => allTags.add(tag));
        }
      });

      return Array.from(allTags).sort();
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la récupération des tags",
        error as Error,
      );
      throw error;
    }
  }

  async findActiveWorkflowsByPriority(): Promise<ApprovalWorkflow[]> {
    try {
      const workflows = await this.prisma.approvalWorkflow.findMany({
        where: { isActive: true },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      });

      return workflows.map((workflow) => this.mapPrismaToWorkflow(workflow));
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la récupération des workflows par priorité",
        error as Error,
      );
      throw error;
    }
  }

  async canBeDeleted(
    id: string,
  ): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      // Vérifier si le workflow est utilisé par des versions en cours
      const versionsUsingWorkflow = await this.prisma.documentVersion.count({
        where: {
          customData: {
            path: "$.workflowId",
            string_contains: id,
          },
          status: {
            in: ["draft", "pending_review", "under_review"],
          },
        },
      });

      if (versionsUsingWorkflow > 0) {
        return {
          canDelete: false,
          reason: `Ce workflow est utilisé par ${versionsUsingWorkflow} version(s) en cours`,
        };
      }

      // Vérifier si c'est le workflow par défaut
      const workflow = await this.findById(id);
      if (workflow?.isDefault) {
        return {
          canDelete: false,
          reason: "Le workflow par défaut ne peut pas être supprimé",
        };
      }

      return { canDelete: true };
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la vérification de suppression",
        error as Error,
      );
      return {
        canDelete: false,
        reason: "Erreur lors de la vérification",
      };
    }
  }

  /**
   * Mappe les données Prisma vers l'entité ApprovalWorkflow
   */
  private mapPrismaToWorkflow(prismaWorkflow: any): ApprovalWorkflow {
    return new ApprovalWorkflow(
      prismaWorkflow.id,
      prismaWorkflow.name,
      prismaWorkflow.description,
      prismaWorkflow.type as WorkflowType,
      JSON.parse(prismaWorkflow.steps),
      JSON.parse(prismaWorkflow.activationConditions),
      prismaWorkflow.isActive,
      prismaWorkflow.isDefault,
      prismaWorkflow.priority,
      prismaWorkflow.createdAt,
      prismaWorkflow.updatedAt,
      prismaWorkflow.createdBy,
      prismaWorkflow.version,
      JSON.parse(prismaWorkflow.tags || "[]"),
      JSON.parse(prismaWorkflow.metadata || "{}"),
    );
  }
}
