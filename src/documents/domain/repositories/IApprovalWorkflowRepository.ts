/**
 * Interface du repository pour les workflows d'approbation
 * Phase 5: Système de versions et workflow d'approbation
 */

import { ApprovalWorkflow, WorkflowType } from '../entities/ApprovalWorkflow';

export interface WorkflowSearchCriteria {
  type?: WorkflowType;
  isActive?: boolean;
  isDefault?: boolean;
  name?: string;
  tags?: string[];
  createdBy?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface IApprovalWorkflowRepository {
  /**
   * Sauvegarde un workflow d'approbation
   */
  save(workflow: ApprovalWorkflow): Promise<ApprovalWorkflow>;

  /**
   * Trouve un workflow par son ID
   */
  findById(id: string): Promise<ApprovalWorkflow | null>;

  /**
   * Trouve tous les workflows selon des critères
   */
  findByCriteria(criteria: WorkflowSearchCriteria): Promise<ApprovalWorkflow[]>;

  /**
   * Trouve le workflow par défaut
   */
  findDefaultWorkflow(): Promise<ApprovalWorkflow | null>;

  /**
   * Trouve le meilleur workflow pour un contexte donné
   */
  findBestWorkflowForContext(context: {
    documentType?: string;
    amount?: number;
    impactLevel?: string;
    templateChanged?: boolean;
    customerType?: string;
    customData?: Record<string, any>;
  }): Promise<ApprovalWorkflow | null>;

  /**
   * Met à jour un workflow
   */
  update(workflow: ApprovalWorkflow): Promise<ApprovalWorkflow>;

  /**
   * Supprime un workflow
   */
  delete(id: string): Promise<boolean>;

  /**
   * Active ou désactive un workflow
   */
  setActive(id: string, isActive: boolean): Promise<boolean>;

  /**
   * Définit un workflow comme workflow par défaut
   */
  setAsDefault(id: string): Promise<boolean>;

  /**
   * Clone un workflow existant
   */
  clone(id: string, newName: string): Promise<ApprovalWorkflow>;

  /**
   * Compte les workflows selon des critères
   */
  countByCriteria(criteria: WorkflowSearchCriteria): Promise<number>;

  /**
   * Récupère tous les types de workflows utilisés
   */
  getUsedWorkflowTypes(): Promise<WorkflowType[]>;

  /**
   * Récupère tous les tags utilisés
   */
  getAllTags(): Promise<string[]>;

  /**
   * Trouve tous les workflows actifs triés par priorité
   */
  findActiveWorkflowsByPriority(): Promise<ApprovalWorkflow[]>;

  /**
   * Valide qu'un workflow peut être supprimé (pas de versions en cours qui l'utilisent)
   */
  canBeDeleted(id: string): Promise<{ canDelete: boolean; reason?: string }>;
}