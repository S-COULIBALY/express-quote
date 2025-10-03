/**
 * Service de gestion des versions de documents
 * Phase 5: Système de versions et workflow d'approbation
 */

import { DocumentVersion, VersionStatus, VersionMetadata, ApprovalStep } from '../../domain/entities/DocumentVersion';
import { ApprovalWorkflow } from '../../domain/entities/ApprovalWorkflow';
import { IDocumentVersionRepository, VersionSearchCriteria } from '../../domain/repositories/IDocumentVersionRepository';
import { IApprovalWorkflowRepository } from '../../domain/repositories/IApprovalWorkflowRepository';
import { PrismaDocumentVersionRepository } from '../../infrastructure/repositories/PrismaDocumentVersionRepository';
import { PrismaApprovalWorkflowRepository } from '../../infrastructure/repositories/PrismaApprovalWorkflowRepository';
import { logger } from '@/lib/logger';

export interface VersionCreationRequest {
  documentId: string;
  templateId: string;
  content: Buffer;
  versionNumber?: string; // Auto-généré si non fourni
  metadata: VersionMetadata;
  createdBy: string;
  workflowId?: string; // Workflow spécifique, sinon auto-détection
  customData?: Record<string, any>;
}

export interface ApprovalRequest {
  versionId: string;
  approverId: string;
  approverName: string;
  comments?: string;
  conditions?: string[];
}

export interface RejectionRequest {
  versionId: string;
  rejectedBy: string;
  rejectedByName: string;
  reason: string;
}

export interface VersionComparisonResult {
  version1: DocumentVersion;
  version2: DocumentVersion;
  differences: {
    contentChanged: boolean;
    metadataChanged: boolean;
    statusChanged: boolean;
    approvalStepsChanged: boolean;
    changes: string[];
  };
}

export class DocumentVersionService {
  private versionRepository: IDocumentVersionRepository;
  private workflowRepository: IApprovalWorkflowRepository;

  constructor() {
    this.versionRepository = new PrismaDocumentVersionRepository();
    this.workflowRepository = new PrismaApprovalWorkflowRepository();
  }

  /**
   * Crée une nouvelle version de document
   */
  async createVersion(request: VersionCreationRequest): Promise<DocumentVersion> {
    try {
      logger.info('📄 Création d\'une nouvelle version de document', {
        documentId: request.documentId,
        createdBy: request.createdBy,
        impactLevel: request.metadata.impactLevel
      });

      // Auto-générer le numéro de version si non fourni
      let versionNumber = request.versionNumber;
      if (!versionNumber) {
        const existingVersions = await this.versionRepository.findByDocumentId(request.documentId);
        versionNumber = this.generateNextVersionNumber(existingVersions, request.metadata.impactLevel);
      }

      // Déterminer le workflow d'approbation
      let workflow: ApprovalWorkflow | null;
      if (request.workflowId) {
        workflow = await this.workflowRepository.findById(request.workflowId);
      } else {
        workflow = await this.workflowRepository.findBestWorkflowForContext({
          documentType: request.customData?.documentType,
          amount: request.customData?.amount,
          impactLevel: request.metadata.impactLevel,
          templateChanged: request.metadata.changes.some(c => c.includes('template')),
          customData: request.customData
        });
      }

      if (!workflow) {
        workflow = await this.workflowRepository.findDefaultWorkflow();
      }

      if (!workflow) {
        throw new Error('Aucun workflow d\'approbation disponible');
      }

      // Générer les étapes d'approbation
      const approvalSteps = workflow.generateApprovalSteps({
        documentType: request.customData?.documentType,
        amount: request.customData?.amount,
        impactLevel: request.metadata.impactLevel,
        customData: request.customData
      });

      // Créer la version
      const versionId = `dv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const version = new DocumentVersion(
        versionId,
        request.documentId,
        request.templateId,
        versionNumber,
        VersionStatus.DRAFT,
        request.content,
        request.metadata,
        approvalSteps,
        request.createdBy,
        new Date(),
        new Date(),
        undefined, // parentVersionId sera défini si c'est une mise à jour
        undefined,
        undefined,
        undefined,
        undefined,
        [],
        { ...request.customData, workflowId: workflow.id }
      );

      const savedVersion = await this.versionRepository.save(version);

      logger.info('✅ Version créée avec succès', {
        versionId: savedVersion.id,
        versionNumber: savedVersion.versionNumber,
        approvalStepsCount: savedVersion.approvalSteps.length
      });

      return savedVersion;

    } catch (error) {
      logger.error('❌ Erreur lors de la création de version', error as Error);
      throw error;
    }
  }

  /**
   * Soumet une version pour approbation
   */
  async submitForApproval(versionId: string): Promise<DocumentVersion> {
    try {
      logger.info('📋 Soumission pour approbation', { versionId });

      const version = await this.versionRepository.findById(versionId);
      if (!version) {
        throw new Error('Version non trouvée');
      }

      if (version.status !== VersionStatus.DRAFT) {
        throw new Error('Seules les versions en brouillon peuvent être soumises pour approbation');
      }

      // Créer la version mise à jour avec le nouveau statut
      const updatedVersion = new DocumentVersion(
        version.id,
        version.documentId,
        version.templateId,
        version.versionNumber,
        VersionStatus.PENDING_REVIEW,
        version.content,
        version.metadata,
        version.approvalSteps,
        version.createdBy,
        version.createdAt,
        new Date(),
        version.parentVersionId,
        version.approvedBy,
        version.approvedAt,
        version.publishedAt,
        version.archivedAt,
        version.tags,
        version.customData
      );

      const savedVersion = await this.versionRepository.update(updatedVersion);

      logger.info('✅ Version soumise pour approbation', { versionId });

      return savedVersion;

    } catch (error) {
      logger.error('❌ Erreur lors de la soumission pour approbation', error as Error);
      throw error;
    }
  }

  /**
   * Approuve une version
   */
  async approveVersion(request: ApprovalRequest): Promise<DocumentVersion> {
    try {
      logger.info('✅ Approbation de version', {
        versionId: request.versionId,
        approverId: request.approverId
      });

      const version = await this.versionRepository.findById(request.versionId);
      if (!version) {
        throw new Error('Version non trouvée');
      }

      // Vérifier si l'utilisateur peut approuver
      if (!version.canBeApprovedBy(request.approverId, '')) {
        throw new Error('Vous n\'êtes pas autorisé à approuver cette version');
      }

      const approvedVersion = version.approve(
        request.approverId,
        request.approverName,
        request.comments,
        request.conditions
      );

      const savedVersion = await this.versionRepository.update(approvedVersion);

      logger.info('✅ Version approuvée avec succès', {
        versionId: savedVersion.id,
        newStatus: savedVersion.status,
        progress: savedVersion.getApprovalProgress()
      });

      return savedVersion;

    } catch (error) {
      logger.error('❌ Erreur lors de l\'approbation', error as Error);
      throw error;
    }
  }

  /**
   * Rejette une version
   */
  async rejectVersion(request: RejectionRequest): Promise<DocumentVersion> {
    try {
      logger.info('❌ Rejet de version', {
        versionId: request.versionId,
        rejectedBy: request.rejectedBy,
        reason: request.reason
      });

      const version = await this.versionRepository.findById(request.versionId);
      if (!version) {
        throw new Error('Version non trouvée');
      }

      const rejectedVersion = version.reject(
        request.rejectedBy,
        request.rejectedByName,
        request.reason
      );

      const savedVersion = await this.versionRepository.update(rejectedVersion);

      logger.info('❌ Version rejetée', {
        versionId: savedVersion.id,
        reason: request.reason
      });

      return savedVersion;

    } catch (error) {
      logger.error('❌ Erreur lors du rejet', error as Error);
      throw error;
    }
  }

  /**
   * Publie une version approuvée
   */
  async publishVersion(versionId: string): Promise<DocumentVersion> {
    try {
      logger.info('🚀 Publication de version', { versionId });

      const version = await this.versionRepository.findById(versionId);
      if (!version) {
        throw new Error('Version non trouvée');
      }

      if (!version.canBePublished()) {
        throw new Error('Cette version ne peut pas être publiée');
      }

      // Archiver l'ancienne version publiée
      const currentPublished = await this.versionRepository.findCurrentPublishedVersion(version.documentId);
      if (currentPublished) {
        const archivedVersion = currentPublished.archive();
        await this.versionRepository.update(archivedVersion);
      }

      const publishedVersion = version.publish();
      const savedVersion = await this.versionRepository.update(publishedVersion);

      logger.info('🚀 Version publiée avec succès', {
        versionId: savedVersion.id,
        versionNumber: savedVersion.versionNumber
      });

      return savedVersion;

    } catch (error) {
      logger.error('❌ Erreur lors de la publication', error as Error);
      throw error;
    }
  }

  /**
   * Récupère les versions en attente d'approbation pour un utilisateur
   */
  async getPendingApprovalsForUser(userId: string, userRole: string): Promise<DocumentVersion[]> {
    try {
      return await this.versionRepository.findPendingApprovalsForUser(userId, userRole);
    } catch (error) {
      logger.error('❌ Erreur lors de la récupération des approbations en attente', error as Error);
      throw error;
    }
  }

  /**
   * Récupère l'historique des versions d'un document
   */
  async getVersionHistory(documentId: string): Promise<DocumentVersion[]> {
    try {
      return await this.versionRepository.getVersionHistory(documentId);
    } catch (error) {
      logger.error('❌ Erreur lors de la récupération de l\'historique', error as Error);
      throw error;
    }
  }

  /**
   * Compare deux versions
   */
  async compareVersions(version1Id: string, version2Id: string): Promise<VersionComparisonResult> {
    try {
      logger.info('🔄 Comparaison de versions', { version1Id, version2Id });

      const [version1, version2] = await Promise.all([
        this.versionRepository.findById(version1Id),
        this.versionRepository.findById(version2Id)
      ]);

      if (!version1 || !version2) {
        throw new Error('Une ou plusieurs versions non trouvées');
      }

      const differences = {
        contentChanged: !version1.content.equals(version2.content),
        metadataChanged: JSON.stringify(version1.metadata) !== JSON.stringify(version2.metadata),
        statusChanged: version1.status !== version2.status,
        approvalStepsChanged: JSON.stringify(version1.approvalSteps) !== JSON.stringify(version2.approvalSteps),
        changes: [] as string[]
      };

      // Analyser les changements détaillés
      if (differences.contentChanged) {
        differences.changes.push('Contenu du document modifié');
      }
      
      if (differences.metadataChanged) {
        differences.changes.push('Métadonnées modifiées');
        
        // Détailler les changements de métadonnées
        if (version1.metadata.impactLevel !== version2.metadata.impactLevel) {
          differences.changes.push(`Niveau d'impact: ${version1.metadata.impactLevel} → ${version2.metadata.impactLevel}`);
        }
        
        if (version1.metadata.changeDescription !== version2.metadata.changeDescription) {
          differences.changes.push('Description des changements modifiée');
        }
      }

      if (differences.statusChanged) {
        differences.changes.push(`Statut: ${version1.status} → ${version2.status}`);
      }

      return {
        version1,
        version2,
        differences
      };

    } catch (error) {
      logger.error('❌ Erreur lors de la comparaison', error as Error);
      throw error;
    }
  }

  /**
   * Effectue un rollback vers une version précédente
   */
  async rollbackToVersion(documentId: string, targetVersionId: string, rollbackBy: string): Promise<DocumentVersion> {
    try {
      logger.info('🔄 Rollback vers version précédente', {
        documentId,
        targetVersionId,
        rollbackBy
      });

      const targetVersion = await this.versionRepository.findById(targetVersionId);
      if (!targetVersion) {
        throw new Error('Version cible non trouvée');
      }

      if (targetVersion.documentId !== documentId) {
        throw new Error('La version cible ne correspond pas au document');
      }

      // Créer une nouvelle version basée sur la version cible
      const rollbackVersion = await this.createVersion({
        documentId,
        templateId: targetVersion.templateId,
        content: targetVersion.content,
        metadata: {
          ...targetVersion.metadata,
          changes: [`Rollback vers version ${targetVersion.versionNumber}`],
          changeDescription: `Rollback effectué par ${rollbackBy} vers la version ${targetVersion.versionNumber}`,
          impactLevel: 'major'
        },
        createdBy: rollbackBy,
        customData: {
          ...targetVersion.customData,
          isRollback: true,
          rollbackFromVersion: targetVersion.id,
          rollbackReason: `Restauration de la version ${targetVersion.versionNumber}`
        }
      });

      logger.info('✅ Rollback effectué avec succès', {
        newVersionId: rollbackVersion.id,
        targetVersionNumber: targetVersion.versionNumber
      });

      return rollbackVersion;

    } catch (error) {
      logger.error('❌ Erreur lors du rollback', error as Error);
      throw error;
    }
  }

  /**
   * Recherche des versions selon des critères
   */
  async searchVersions(criteria: VersionSearchCriteria): Promise<DocumentVersion[]> {
    try {
      return await this.versionRepository.findByCriteria(criteria);
    } catch (error) {
      logger.error('❌ Erreur lors de la recherche de versions', error as Error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques des versions
   */
  async getVersionStatistics(dateRange?: { start: Date; end: Date }) {
    try {
      return await this.versionRepository.getStatistics(dateRange);
    } catch (error) {
      logger.error('❌ Erreur lors du calcul des statistiques', error as Error);
      throw error;
    }
  }

  /**
   * Génère le numéro de version suivant
   */
  private generateNextVersionNumber(existingVersions: DocumentVersion[], impactLevel: string): string {
    if (existingVersions.length === 0) {
      return '1.0.0';
    }

    // Trouver la version la plus récente
    const sortedVersions = existingVersions
      .map(v => v.versionNumber)
      .sort((a, b) => this.compareVersionNumbers(b, a)); // Tri décroissant

    const latestVersion = sortedVersions[0];
    const [major, minor, patch] = latestVersion.split('.').map(Number);

    // Incrémenter selon le niveau d'impact
    switch (impactLevel) {
      case 'critical':
        return `${major + 1}.0.0`;
      case 'major':
        return `${major}.${minor + 1}.0`;
      case 'minor':
      default:
        return `${major}.${minor}.${patch + 1}`;
    }
  }

  /**
   * Compare deux numéros de version (ex: "1.2.3" vs "1.2.4")
   */
  private compareVersionNumbers(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }

    return 0;
  }
}