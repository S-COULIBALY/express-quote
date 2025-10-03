/**
 * DocumentVersion - Entité pour la gestion des versions de documents
 * Phase 5: Système de versions et workflow d'approbation
 */

export enum VersionStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review', 
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export enum ApprovalLevel {
  LEVEL_1 = 'level_1', // Approbation superviseur
  LEVEL_2 = 'level_2', // Approbation manager
  LEVEL_3 = 'level_3', // Approbation direction
  FINAL = 'final'      // Approbation finale
}

export interface VersionMetadata {
  changes: string[];
  changeDescription: string;
  impactLevel: 'minor' | 'major' | 'critical';
  testingRequired: boolean;
  backupRequired: boolean;
  rollbackPlan?: string;
}

export interface ApprovalStep {
  id: string;
  level: ApprovalLevel;
  approverId: string;
  approverName: string;
  approverRole: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: Date;
  rejectedAt?: Date;
  comments?: string;
  conditions?: string[];
  isRequired: boolean;
}

export class DocumentVersion {
  constructor(
    public readonly id: string,
    public readonly documentId: string,
    public readonly templateId: string,
    public readonly versionNumber: string, // Ex: "1.0.0", "1.1.0", "2.0.0"
    public readonly status: VersionStatus,
    public readonly content: Buffer, // Contenu PDF de cette version
    public readonly metadata: VersionMetadata,
    public readonly approvalSteps: ApprovalStep[],
    public readonly createdBy: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly parentVersionId?: string, // Version précédente
    public readonly approvedBy?: string,
    public readonly approvedAt?: Date,
    public readonly publishedAt?: Date,
    public readonly archivedAt?: Date,
    public readonly tags: string[] = [],
    public readonly customData?: Record<string, any>
  ) {}

  /**
   * Vérifie si cette version peut être approuvée par un utilisateur
   */
  canBeApprovedBy(userId: string, userRole: string): boolean {
    const currentStep = this.getCurrentApprovalStep();
    
    if (!currentStep || currentStep.status !== 'pending') {
      return false;
    }

    // Vérifier si l'utilisateur est l'approbateur désigné
    if (currentStep.approverId === userId) {
      return true;
    }

    // Vérifier si l'utilisateur a le rôle requis (fallback)
    const roleHierarchy: Record<string, ApprovalLevel[]> = {
      'supervisor': [ApprovalLevel.LEVEL_1],
      'manager': [ApprovalLevel.LEVEL_1, ApprovalLevel.LEVEL_2],
      'director': [ApprovalLevel.LEVEL_1, ApprovalLevel.LEVEL_2, ApprovalLevel.LEVEL_3],
      'admin': [ApprovalLevel.LEVEL_1, ApprovalLevel.LEVEL_2, ApprovalLevel.LEVEL_3, ApprovalLevel.FINAL]
    };

    return roleHierarchy[userRole]?.includes(currentStep.level) || false;
  }

  /**
   * Récupère l'étape d'approbation actuelle
   */
  getCurrentApprovalStep(): ApprovalStep | null {
    return this.approvalSteps.find(step => step.status === 'pending') || null;
  }

  /**
   * Récupère toutes les étapes d'approbation complétées
   */
  getCompletedApprovalSteps(): ApprovalStep[] {
    return this.approvalSteps.filter(step => step.status === 'approved');
  }

  /**
   * Calcule le pourcentage d'avancement de l'approbation
   */
  getApprovalProgress(): { completed: number; total: number; percentage: number } {
    const requiredSteps = this.approvalSteps.filter(step => step.isRequired);
    const completedSteps = requiredSteps.filter(step => step.status === 'approved');
    
    return {
      completed: completedSteps.length,
      total: requiredSteps.length,
      percentage: requiredSteps.length > 0 ? Math.round((completedSteps.length / requiredSteps.length) * 100) : 0
    };
  }

  /**
   * Vérifie si toutes les approbations requises sont complétées
   */
  areAllApprovalsCompleted(): boolean {
    const requiredSteps = this.approvalSteps.filter(step => step.isRequired);
    return requiredSteps.every(step => step.status === 'approved');
  }

  /**
   * Vérifie si la version a été rejetée
   */
  isRejected(): boolean {
    return this.status === VersionStatus.REJECTED || 
           this.approvalSteps.some(step => step.status === 'rejected');
  }

  /**
   * Vérifie si la version peut être publiée
   */
  canBePublished(): boolean {
    return this.status === VersionStatus.APPROVED && this.areAllApprovalsCompleted();
  }

  /**
   * Crée une nouvelle version basée sur celle-ci
   */
  createNewVersion(
    newVersionNumber: string,
    newContent: Buffer,
    metadata: VersionMetadata,
    createdBy: string
  ): DocumentVersion {
    const newApprovalSteps: ApprovalStep[] = this.approvalSteps.map(step => ({
      ...step,
      status: 'pending' as const,
      approvedAt: undefined,
      rejectedAt: undefined,
      comments: undefined
    }));

    return new DocumentVersion(
      `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      this.documentId,
      this.templateId,
      newVersionNumber,
      VersionStatus.DRAFT,
      newContent,
      metadata,
      newApprovalSteps,
      createdBy,
      new Date(),
      new Date(),
      this.id, // Cette version devient le parent
      undefined,
      undefined,
      undefined,
      undefined,
      [...this.tags],
      { ...this.customData }
    );
  }

  /**
   * Applique une approbation à cette version
   */
  approve(
    approverId: string,
    approverName: string,
    comments?: string,
    conditions?: string[]
  ): DocumentVersion {
    const currentStep = this.getCurrentApprovalStep();
    if (!currentStep) {
      throw new Error('Aucune étape d\'approbation en attente');
    }

    const updatedSteps = this.approvalSteps.map(step => {
      if (step.id === currentStep.id) {
        return {
          ...step,
          status: 'approved' as const,
          approvedAt: new Date(),
          comments,
          conditions: conditions || step.conditions
        };
      }
      return step;
    });

    // Déterminer le nouveau statut
    let newStatus = this.status;
    const progress = this.getApprovalProgress();
    
    if (this.areAllApprovalsCompleted()) {
      newStatus = VersionStatus.APPROVED;
    } else {
      newStatus = VersionStatus.UNDER_REVIEW;
    }

    return new DocumentVersion(
      this.id,
      this.documentId,
      this.templateId,
      this.versionNumber,
      newStatus,
      this.content,
      this.metadata,
      updatedSteps,
      this.createdBy,
      this.createdAt,
      new Date(),
      this.parentVersionId,
      newStatus === VersionStatus.APPROVED ? approverId : this.approvedBy,
      newStatus === VersionStatus.APPROVED ? new Date() : this.approvedAt,
      this.publishedAt,
      this.archivedAt,
      this.tags,
      this.customData
    );
  }

  /**
   * Rejette cette version
   */
  reject(
    rejectedBy: string,
    rejectedByName: string,
    reason: string
  ): DocumentVersion {
    const currentStep = this.getCurrentApprovalStep();
    if (!currentStep) {
      throw new Error('Aucune étape d\'approbation en attente');
    }

    const updatedSteps = this.approvalSteps.map(step => {
      if (step.id === currentStep.id) {
        return {
          ...step,
          status: 'rejected' as const,
          rejectedAt: new Date(),
          comments: reason
        };
      }
      return step;
    });

    return new DocumentVersion(
      this.id,
      this.documentId,
      this.templateId,
      this.versionNumber,
      VersionStatus.REJECTED,
      this.content,
      this.metadata,
      updatedSteps,
      this.createdBy,
      this.createdAt,
      new Date(),
      this.parentVersionId,
      this.approvedBy,
      this.approvedAt,
      this.publishedAt,
      this.archivedAt,
      this.tags,
      { ...this.customData, rejectedBy, rejectedAt: new Date(), rejectionReason: reason }
    );
  }

  /**
   * Marque cette version comme publiée
   */
  publish(): DocumentVersion {
    if (!this.canBePublished()) {
      throw new Error('Cette version ne peut pas être publiée');
    }

    return new DocumentVersion(
      this.id,
      this.documentId,
      this.templateId,
      this.versionNumber,
      VersionStatus.PUBLISHED,
      this.content,
      this.metadata,
      this.approvalSteps,
      this.createdBy,
      this.createdAt,
      new Date(),
      this.parentVersionId,
      this.approvedBy,
      this.approvedAt,
      new Date(),
      this.archivedAt,
      this.tags,
      this.customData
    );
  }

  /**
   * Archive cette version
   */
  archive(): DocumentVersion {
    return new DocumentVersion(
      this.id,
      this.documentId,
      this.templateId,
      this.versionNumber,
      VersionStatus.ARCHIVED,
      this.content,
      this.metadata,
      this.approvalSteps,
      this.createdBy,
      this.createdAt,
      new Date(),
      this.parentVersionId,
      this.approvedBy,
      this.approvedAt,
      this.publishedAt,
      new Date(),
      this.tags,
      this.customData
    );
  }
}