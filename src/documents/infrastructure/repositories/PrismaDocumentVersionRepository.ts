// @ts-nocheck
/**
 * Repository Prisma pour la gestion des versions de documents
 * Phase 5: Système de versions et workflow d'approbation
 */

import {
  DocumentVersion,
  VersionStatus,
} from "../../domain/entities/DocumentVersion";
import {
  IDocumentVersionRepository,
  VersionSearchCriteria,
  VersionStatistics,
} from "../../domain/repositories/IDocumentVersionRepository";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export class PrismaDocumentVersionRepository
  implements IDocumentVersionRepository
{
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async save(version: DocumentVersion): Promise<DocumentVersion> {
    try {
      const savedVersion = await this.prisma.documentVersion.create({
        data: {
          id: version.id,
          documentId: version.documentId,
          templateId: version.templateId,
          versionNumber: version.versionNumber,
          status: version.status,
          content: version.content,
          metadata: JSON.stringify(version.metadata),
          approvalSteps: JSON.stringify(version.approvalSteps),
          createdBy: version.createdBy,
          createdAt: version.createdAt,
          updatedAt: version.updatedAt,
          parentVersionId: version.parentVersionId,
          approvedBy: version.approvedBy,
          approvedAt: version.approvedAt,
          publishedAt: version.publishedAt,
          archivedAt: version.archivedAt,
          tags: JSON.stringify(version.tags),
          customData: JSON.stringify(version.customData || {}),
        },
      });

      return this.mapPrismaToVersion(savedVersion);
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la sauvegarde de la version",
        error as Error,
      );
      throw error;
    }
  }

  async findById(id: string): Promise<DocumentVersion | null> {
    try {
      const version = await this.prisma.documentVersion.findUnique({
        where: { id },
      });

      return version ? this.mapPrismaToVersion(version) : null;
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la recherche de version par ID",
        error as Error,
      );
      throw error;
    }
  }

  async findByDocumentId(documentId: string): Promise<DocumentVersion[]> {
    try {
      const versions = await this.prisma.documentVersion.findMany({
        where: { documentId },
        orderBy: { createdAt: "desc" },
      });

      return versions.map((version) => this.mapPrismaToVersion(version));
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la recherche de versions par document",
        error as Error,
      );
      throw error;
    }
  }

  async findCurrentPublishedVersion(
    documentId: string,
  ): Promise<DocumentVersion | null> {
    try {
      const version = await this.prisma.documentVersion.findFirst({
        where: {
          documentId,
          status: VersionStatus.PUBLISHED,
        },
        orderBy: { publishedAt: "desc" },
      });

      return version ? this.mapPrismaToVersion(version) : null;
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la recherche de version publiée",
        error as Error,
      );
      throw error;
    }
  }

  async findByCriteria(
    criteria: VersionSearchCriteria,
  ): Promise<DocumentVersion[]> {
    try {
      const where: any = {};

      if (criteria.documentId) {
        where.documentId = criteria.documentId;
      }

      if (criteria.templateId) {
        where.templateId = criteria.templateId;
      }

      if (criteria.status) {
        where.status = criteria.status;
      }

      if (criteria.createdBy) {
        where.createdBy = criteria.createdBy;
      }

      if (criteria.approvedBy) {
        where.approvedBy = criteria.approvedBy;
      }

      if (criteria.versionNumber) {
        where.versionNumber = criteria.versionNumber;
      }

      if (criteria.dateRange) {
        where.createdAt = {
          gte: criteria.dateRange.start,
          lte: criteria.dateRange.end,
        };
      }

      // Pour les tags, on utilise une requête JSON
      if (criteria.tags && criteria.tags.length > 0) {
        where.tags = {
          path: "$",
          string_contains: criteria.tags[0], // Simplifié pour l'exemple
        };
      }

      const versions = await this.prisma.documentVersion.findMany({
        where,
        take: criteria.limit,
        skip: criteria.offset,
        orderBy: criteria.sortBy
          ? {
              [criteria.sortBy]: criteria.sortOrder || "desc",
            }
          : { createdAt: "desc" },
      });

      return versions.map((version) => this.mapPrismaToVersion(version));
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la recherche de versions par critères",
        error as Error,
      );
      throw error;
    }
  }

  async findPendingApprovalsForUser(
    userId: string,
    userRole: string,
  ): Promise<DocumentVersion[]> {
    try {
      // Cette requête est simplifiée - dans une implémentation complète,
      // il faudrait analyser les approvalSteps JSON pour trouver les versions
      // où l'utilisateur peut approuver
      const versions = await this.prisma.documentVersion.findMany({
        where: {
          status: {
            in: [VersionStatus.PENDING_REVIEW, VersionStatus.UNDER_REVIEW],
          },
        },
        orderBy: { createdAt: "asc" },
      });

      // Filtrer côté application pour vérifier les permissions
      const mappedVersions = versions.map((version) =>
        this.mapPrismaToVersion(version),
      );

      return mappedVersions.filter((version) =>
        version.canBeApprovedBy(userId, userRole),
      );
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la recherche d'approbations en attente",
        error as Error,
      );
      throw error;
    }
  }

  async update(version: DocumentVersion): Promise<DocumentVersion> {
    try {
      const updatedVersion = await this.prisma.documentVersion.update({
        where: { id: version.id },
        data: {
          status: version.status,
          metadata: JSON.stringify(version.metadata),
          approvalSteps: JSON.stringify(version.approvalSteps),
          updatedAt: new Date(),
          approvedBy: version.approvedBy,
          approvedAt: version.approvedAt,
          publishedAt: version.publishedAt,
          archivedAt: version.archivedAt,
          tags: JSON.stringify(version.tags),
          customData: JSON.stringify(version.customData || {}),
        },
      });

      return this.mapPrismaToVersion(updatedVersion);
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la mise à jour de version",
        error as Error,
      );
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.documentVersion.delete({
        where: { id },
      });

      return true;
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la suppression de version",
        error as Error,
      );
      return false;
    }
  }

  async countByCriteria(criteria: VersionSearchCriteria): Promise<number> {
    try {
      const where: any = {};

      if (criteria.documentId) {
        where.documentId = criteria.documentId;
      }

      if (criteria.status) {
        where.status = criteria.status;
      }

      if (criteria.createdBy) {
        where.createdBy = criteria.createdBy;
      }

      if (criteria.dateRange) {
        where.createdAt = {
          gte: criteria.dateRange.start,
          lte: criteria.dateRange.end,
        };
      }

      const count = await this.prisma.documentVersion.count({ where });
      return count;
    } catch (error) {
      logger.error("❌ Erreur lors du comptage de versions", error as Error);
      throw error;
    }
  }

  async getStatistics(dateRange?: {
    start: Date;
    end: Date;
  }): Promise<VersionStatistics> {
    try {
      const where: any = {};

      if (dateRange) {
        where.createdAt = {
          gte: dateRange.start,
          lte: dateRange.end,
        };
      }

      // Compter le total
      const totalVersions = await this.prisma.documentVersion.count({ where });

      // Compter par statut
      const byStatusPromises = Object.values(VersionStatus).map(
        async (status) => {
          const count = await this.prisma.documentVersion.count({
            where: { ...where, status },
          });
          return { status, count };
        },
      );

      const byStatusResults = await Promise.all(byStatusPromises);
      const byStatus: Record<VersionStatus, number> = {} as any;

      byStatusResults.forEach((result) => {
        byStatus[result.status] = result.count;
      });

      // Calculer les approbations en attente
      const pendingApprovals =
        (byStatus[VersionStatus.PENDING_REVIEW] || 0) +
        (byStatus[VersionStatus.UNDER_REVIEW] || 0);

      // Calculer le temps moyen d'approbation (simplifié)
      const approvedVersions = await this.prisma.documentVersion.findMany({
        where: {
          ...where,
          status: VersionStatus.APPROVED,
          approvedAt: { not: null },
        },
        select: {
          createdAt: true,
          approvedAt: true,
        },
      });

      let averageApprovalTime = 0;
      if (approvedVersions.length > 0) {
        const totalApprovalTime = approvedVersions.reduce((sum, version) => {
          const diffMs =
            version.approvedAt!.getTime() - version.createdAt.getTime();
          return sum + diffMs / (1000 * 60 * 60); // Convertir en heures
        }, 0);

        averageApprovalTime = Math.round(
          totalApprovalTime / approvedVersions.length,
        );
      }

      // Calculer le taux de rejet
      const rejectedCount = byStatus[VersionStatus.REJECTED] || 0;
      const rejectionRate =
        totalVersions > 0
          ? Math.round((rejectedCount / totalVersions) * 100)
          : 0;

      // Par niveau d'impact (requête simplifiée)
      const byImpactLevel = {
        minor: 0,
        major: 0,
        critical: 0,
      };

      return {
        totalVersions,
        byStatus,
        pendingApprovals,
        averageApprovalTime,
        rejectionRate,
        byImpactLevel,
      };
    } catch (error) {
      logger.error("❌ Erreur lors du calcul des statistiques", error as Error);
      throw error;
    }
  }

  async getVersionHistory(documentId: string): Promise<DocumentVersion[]> {
    try {
      const versions = await this.prisma.documentVersion.findMany({
        where: { documentId },
        orderBy: [{ createdAt: "desc" }, { versionNumber: "desc" }],
      });

      return versions.map((version) => this.mapPrismaToVersion(version));
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la récupération de l'historique",
        error as Error,
      );
      throw error;
    }
  }

  async archiveOldVersions(
    documentId: string,
    keepCount: number = 5,
  ): Promise<number> {
    try {
      // Récupérer les versions les plus récentes à garder
      const versionsToKeep = await this.prisma.documentVersion.findMany({
        where: {
          documentId,
          status: { not: VersionStatus.ARCHIVED },
        },
        orderBy: { createdAt: "desc" },
        take: keepCount,
        select: { id: true },
      });

      const idsToKeep = versionsToKeep.map((v) => v.id);

      // Archiver toutes les autres versions
      const result = await this.prisma.documentVersion.updateMany({
        where: {
          documentId,
          status: { not: VersionStatus.ARCHIVED },
          id: { notIn: idsToKeep },
        },
        data: {
          status: VersionStatus.ARCHIVED,
          archivedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return result.count;
    } catch (error) {
      logger.error(
        "❌ Erreur lors de l'archivage des anciennes versions",
        error as Error,
      );
      throw error;
    }
  }

  async findExpiredVersions(): Promise<DocumentVersion[]> {
    try {
      // Chercher les versions en attente depuis plus de X heures
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 72); // 72h par défaut

      const versions = await this.prisma.documentVersion.findMany({
        where: {
          status: {
            in: [VersionStatus.PENDING_REVIEW, VersionStatus.UNDER_REVIEW],
          },
          createdAt: { lt: expiredDate },
        },
        orderBy: { createdAt: "asc" },
      });

      return versions.map((version) => this.mapPrismaToVersion(version));
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la recherche de versions expirées",
        error as Error,
      );
      throw error;
    }
  }

  async findVersionConflicts(documentId: string): Promise<{
    conflictingVersions: DocumentVersion[];
    hasConflict: boolean;
  }> {
    try {
      // Chercher plusieurs versions en cours de modification pour le même document
      const activeVersions = await this.prisma.documentVersion.findMany({
        where: {
          documentId,
          status: {
            in: [
              VersionStatus.DRAFT,
              VersionStatus.PENDING_REVIEW,
              VersionStatus.UNDER_REVIEW,
            ],
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const conflictingVersions = activeVersions.map((version) =>
        this.mapPrismaToVersion(version),
      );
      const hasConflict = conflictingVersions.length > 1;

      return {
        conflictingVersions,
        hasConflict,
      };
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la recherche de conflits",
        error as Error,
      );
      throw error;
    }
  }

  async cloneVersion(
    versionId: string,
    newVersionNumber: string,
    createdBy: string,
  ): Promise<DocumentVersion> {
    try {
      const originalVersion = await this.findById(versionId);
      if (!originalVersion) {
        throw new Error(`Version ${versionId} non trouvée`);
      }

      const clonedVersion = originalVersion.createNewVersion(
        newVersionNumber,
        originalVersion.content,
        originalVersion.metadata,
        createdBy,
      );

      return await this.save(clonedVersion);
    } catch (error) {
      logger.error("❌ Erreur lors du clonage de version", error as Error);
      throw error;
    }
  }

  async rollbackToVersion(
    documentId: string,
    targetVersionId: string,
    rollbackBy: string,
  ): Promise<DocumentVersion> {
    try {
      const targetVersion = await this.findById(targetVersionId);
      if (!targetVersion) {
        throw new Error(`Version cible ${targetVersionId} non trouvée`);
      }

      if (targetVersion.documentId !== documentId) {
        throw new Error("La version cible ne correspond pas au document");
      }

      // Générer un nouveau numéro de version pour le rollback
      const existingVersions = await this.findByDocumentId(documentId);
      const nextVersionNumber =
        this.generateNextVersionNumber(existingVersions);

      const rollbackVersion = targetVersion.createNewVersion(
        nextVersionNumber,
        targetVersion.content,
        {
          ...targetVersion.metadata,
          changes: [`Rollback vers version ${targetVersion.versionNumber}`],
          changeDescription: `Rollback effectué vers la version ${targetVersion.versionNumber}`,
          impactLevel: "major",
        },
        rollbackBy,
      );

      return await this.save(rollbackVersion);
    } catch (error) {
      logger.error("❌ Erreur lors du rollback", error as Error);
      throw error;
    }
  }

  /**
   * Mappe les données Prisma vers l'entité DocumentVersion
   */
  private mapPrismaToVersion(prismaVersion: any): DocumentVersion {
    return new DocumentVersion(
      prismaVersion.id,
      prismaVersion.documentId,
      prismaVersion.templateId,
      prismaVersion.versionNumber,
      prismaVersion.status as VersionStatus,
      prismaVersion.content,
      JSON.parse(prismaVersion.metadata),
      JSON.parse(prismaVersion.approvalSteps),
      prismaVersion.createdBy,
      prismaVersion.createdAt,
      prismaVersion.updatedAt,
      prismaVersion.parentVersionId,
      prismaVersion.approvedBy,
      prismaVersion.approvedAt,
      prismaVersion.publishedAt,
      prismaVersion.archivedAt,
      JSON.parse(prismaVersion.tags || "[]"),
      JSON.parse(prismaVersion.customData || "{}"),
    );
  }

  /**
   * Génère le numéro de version suivant
   */
  private generateNextVersionNumber(
    existingVersions: DocumentVersion[],
  ): string {
    if (existingVersions.length === 0) {
      return "1.0.0";
    }

    const sortedVersions = existingVersions
      .map((v) => v.versionNumber)
      .sort((a, b) => this.compareVersionNumbers(b, a));

    const latestVersion = sortedVersions[0];
    const [major, minor, patch] = latestVersion.split(".").map(Number);

    return `${major}.${minor}.${patch + 1}`;
  }

  /**
   * Compare deux numéros de version
   */
  private compareVersionNumbers(version1: string, version2: string): number {
    const v1Parts = version1.split(".").map(Number);
    const v2Parts = version2.split(".").map(Number);

    for (let i = 0; i < 3; i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }

    return 0;
  }
}
