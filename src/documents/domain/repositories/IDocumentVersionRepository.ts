/**
 * Interface du repository pour les versions de documents
 * Phase 5: Système de versions et workflow d'approbation
 */

import { DocumentVersion, VersionStatus } from '../entities/DocumentVersion';

export interface VersionSearchCriteria {
  documentId?: string;
  templateId?: string;
  status?: VersionStatus;
  createdBy?: string;
  approvedBy?: string;
  versionNumber?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  impactLevel?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'versionNumber' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface VersionStatistics {
  totalVersions: number;
  byStatus: Record<VersionStatus, number>;
  pendingApprovals: number;
  averageApprovalTime: number; // en heures
  rejectionRate: number; // en pourcentage
  byImpactLevel: Record<string, number>;
}

export interface IDocumentVersionRepository {
  /**
   * Sauvegarde une version de document
   */
  save(version: DocumentVersion): Promise<DocumentVersion>;

  /**
   * Trouve une version par son ID
   */
  findById(id: string): Promise<DocumentVersion | null>;

  /**
   * Trouve toutes les versions d'un document
   */
  findByDocumentId(documentId: string): Promise<DocumentVersion[]>;

  /**
   * Trouve la version publiée actuelle d'un document
   */
  findCurrentPublishedVersion(documentId: string): Promise<DocumentVersion | null>;

  /**
   * Trouve les versions selon des critères
   */
  findByCriteria(criteria: VersionSearchCriteria): Promise<DocumentVersion[]>;

  /**
   * Trouve les versions en attente d'approbation pour un utilisateur
   */
  findPendingApprovalsForUser(userId: string, userRole: string): Promise<DocumentVersion[]>;

  /**
   * Met à jour une version
   */
  update(version: DocumentVersion): Promise<DocumentVersion>;

  /**
   * Supprime une version (soft delete)
   */
  delete(id: string): Promise<boolean>;

  /**
   * Compte les versions selon des critères
   */
  countByCriteria(criteria: VersionSearchCriteria): Promise<number>;

  /**
   * Récupère les statistiques des versions
   */
  getStatistics(dateRange?: { start: Date; end: Date }): Promise<VersionStatistics>;

  /**
   * Trouve l'historique complet des versions d'un document
   */
  getVersionHistory(documentId: string): Promise<DocumentVersion[]>;

  /**
   * Archive toutes les versions anciennes d'un document (garde seulement la dernière publiée)
   */
  archiveOldVersions(documentId: string, keepCount?: number): Promise<number>;

  /**
   * Trouve les versions expirées (timeout d'approbation dépassé)
   */
  findExpiredVersions(): Promise<DocumentVersion[]>;

  /**
   * Trouve les conflits de versions (plusieurs versions en cours de modification)
   */
  findVersionConflicts(documentId: string): Promise<{
    conflictingVersions: DocumentVersion[];
    hasConflict: boolean;
  }>;

  /**
   * Clone une version existante
   */
  cloneVersion(versionId: string, newVersionNumber: string, createdBy: string): Promise<DocumentVersion>;

  /**
   * Rollback vers une version précédente
   */
  rollbackToVersion(documentId: string, targetVersionId: string, rollbackBy: string): Promise<DocumentVersion>;
}