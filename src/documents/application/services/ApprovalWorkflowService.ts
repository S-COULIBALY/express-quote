/**
 * Service de gestion des workflows d'approbation
 * Phase 5: Système de versions et workflow d'approbation
 */

import { 
  ApprovalWorkflow, 
  WorkflowType, 
  WorkflowStepDefinition, 
  WorkflowCondition,
  TriggerCondition
} from '../../domain/entities/ApprovalWorkflow';
import { ApprovalLevel } from '../../domain/entities/DocumentVersion';
import { IApprovalWorkflowRepository, WorkflowSearchCriteria } from '../../domain/repositories/IApprovalWorkflowRepository';
import { PrismaApprovalWorkflowRepository } from '../../infrastructure/repositories/PrismaApprovalWorkflowRepository';
import { logger } from '@/lib/logger';

export interface WorkflowCreationRequest {
  name: string;
  description: string;
  type: WorkflowType;
  steps: Omit<WorkflowStepDefinition, 'id'>[];
  activationConditions: WorkflowCondition[];
  isDefault?: boolean;
  priority?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface WorkflowUpdateRequest {
  name?: string;
  description?: string;
  steps?: Omit<WorkflowStepDefinition, 'id'>[];
  activationConditions?: WorkflowCondition[];
  isActive?: boolean;
  isDefault?: boolean;
  priority?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface WorkflowTestContext {
  documentType: string;
  amount: number;
  impactLevel: string;
  templateChanged: boolean;
  customerType: string;
  customData?: Record<string, any>;
}

export interface WorkflowTestResult {
  workflow: ApprovalWorkflow;
  shouldApply: boolean;
  reason: string;
  generatedSteps: any[];
  estimatedDuration: number; // en heures
}

export class ApprovalWorkflowService {
  private workflowRepository: IApprovalWorkflowRepository;

  constructor() {
    this.workflowRepository = new PrismaApprovalWorkflowRepository();
  }

  /**
   * Crée un nouveau workflow d'approbation
   */
  async createWorkflow(request: WorkflowCreationRequest): Promise<ApprovalWorkflow> {
    try {
      logger.info('🔄 Création d\'un workflow d\'approbation', {
        name: request.name,
        type: request.type,
        stepsCount: request.steps.length
      });

      // Génération de l'ID et ajout des IDs aux étapes
      const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const stepsWithIds: WorkflowStepDefinition[] = request.steps.map((step, index) => ({
        ...step,
        id: `step_${index + 1}`,
        order: step.order || index + 1
      }));

      const workflow = new ApprovalWorkflow(
        workflowId,
        request.name,
        request.description,
        request.type,
        stepsWithIds,
        request.activationConditions,
        true, // Actif par défaut
        request.isDefault || false,
        request.priority || 0,
        new Date(),
        new Date(),
        undefined, // createdBy sera ajouté par le repository
        '1.0.0',
        request.tags || [],
        request.metadata || {}
      );

      // Validation du workflow
      const validation = workflow.validate();
      if (!validation.isValid) {
        throw new Error(`Workflow invalide: ${validation.errors.join(', ')}`);
      }

      const savedWorkflow = await this.workflowRepository.save(workflow);

      logger.info('✅ Workflow créé avec succès', {
        id: savedWorkflow.id,
        name: savedWorkflow.name
      });

      return savedWorkflow;

    } catch (error) {
      logger.error('❌ Erreur lors de la création du workflow', error as Error);
      throw error;
    }
  }

  /**
   * Met à jour un workflow existant
   */
  async updateWorkflow(workflowId: string, request: WorkflowUpdateRequest): Promise<ApprovalWorkflow> {
    try {
      logger.info('📝 Mise à jour du workflow', { workflowId });

      const existingWorkflow = await this.workflowRepository.findById(workflowId);
      if (!existingWorkflow) {
        throw new Error('Workflow non trouvé');
      }

      // Préparer les étapes mises à jour si fournies
      let updatedSteps = existingWorkflow.steps;
      if (request.steps) {
        updatedSteps = request.steps.map((step, index) => ({
          ...step,
          id: `step_${index + 1}`,
          order: step.order || index + 1
        }));
      }

      const updatedWorkflow = existingWorkflow.update({
        name: request.name,
        description: request.description,
        steps: updatedSteps,
        activationConditions: request.activationConditions,
        isActive: request.isActive,
        isDefault: request.isDefault,
        priority: request.priority,
        tags: request.tags,
        metadata: request.metadata
      });

      // Validation
      const validation = updatedWorkflow.validate();
      if (!validation.isValid) {
        throw new Error(`Workflow invalide: ${validation.errors.join(', ')}`);
      }

      const savedWorkflow = await this.workflowRepository.update(updatedWorkflow);

      logger.info('✅ Workflow mis à jour avec succès', { id: savedWorkflow.id });

      return savedWorkflow;

    } catch (error) {
      logger.error('❌ Erreur lors de la mise à jour du workflow', error as Error);
      throw error;
    }
  }

  /**
   * Récupère un workflow par son ID
   */
  async getWorkflowById(id: string): Promise<ApprovalWorkflow | null> {
    try {
      return await this.workflowRepository.findById(id);
    } catch (error) {
      logger.error('❌ Erreur lors de la récupération du workflow', error as Error);
      throw error;
    }
  }

  /**
   * Recherche des workflows selon des critères
   */
  async searchWorkflows(criteria: WorkflowSearchCriteria): Promise<ApprovalWorkflow[]> {
    try {
      return await this.workflowRepository.findByCriteria(criteria);
    } catch (error) {
      logger.error('❌ Erreur lors de la recherche de workflows', error as Error);
      throw error;
    }
  }

  /**
   * Trouve le meilleur workflow pour un contexte donné
   */
  async findBestWorkflowForContext(context: WorkflowTestContext): Promise<ApprovalWorkflow | null> {
    try {
      logger.info('🔍 Recherche du meilleur workflow', { context });

      return await this.workflowRepository.findBestWorkflowForContext(context);

    } catch (error) {
      logger.error('❌ Erreur lors de la recherche du workflow optimal', error as Error);
      throw error;
    }
  }

  /**
   * Teste un workflow contre un contexte
   */
  async testWorkflow(workflowId: string, context: WorkflowTestContext): Promise<WorkflowTestResult> {
    try {
      logger.info('🧪 Test du workflow', { workflowId, context });

      const workflow = await this.workflowRepository.findById(workflowId);
      if (!workflow) {
        throw new Error('Workflow non trouvé');
      }

      const shouldApply = workflow.shouldApply(context);
      let reason = '';
      
      if (shouldApply) {
        reason = 'Le workflow correspond aux conditions du contexte';
      } else {
        reason = 'Le workflow ne correspond pas aux conditions du contexte';
      }

      const generatedSteps = shouldApply ? 
        workflow.generateApprovalSteps(context) : [];

      // Estimation simple de la durée (en heures)
      const estimatedDuration = generatedSteps.length * 24; // 1 jour par étape par défaut

      const result: WorkflowTestResult = {
        workflow,
        shouldApply,
        reason,
        generatedSteps,
        estimatedDuration
      };

      logger.info('🧪 Test de workflow terminé', {
        workflowId,
        shouldApply,
        stepsCount: generatedSteps.length
      });

      return result;

    } catch (error) {
      logger.error('❌ Erreur lors du test du workflow', error as Error);
      throw error;
    }
  }

  /**
   * Clone un workflow existant
   */
  async cloneWorkflow(workflowId: string, newName: string): Promise<ApprovalWorkflow> {
    try {
      logger.info('📋 Clonage du workflow', { workflowId, newName });

      const clonedWorkflow = await this.workflowRepository.clone(workflowId, newName);

      logger.info('✅ Workflow cloné avec succès', {
        originalId: workflowId,
        clonedId: clonedWorkflow.id,
        newName
      });

      return clonedWorkflow;

    } catch (error) {
      logger.error('❌ Erreur lors du clonage du workflow', error as Error);
      throw error;
    }
  }

  /**
   * Active/désactive un workflow
   */
  async setWorkflowActive(workflowId: string, isActive: boolean): Promise<boolean> {
    try {
      logger.info('🔄 Modification du statut du workflow', { workflowId, isActive });

      const success = await this.workflowRepository.setActive(workflowId, isActive);

      if (success) {
        logger.info('✅ Statut du workflow modifié', { workflowId, isActive });
      }

      return success;

    } catch (error) {
      logger.error('❌ Erreur lors de la modification du statut', error as Error);
      throw error;
    }
  }

  /**
   * Définit un workflow comme workflow par défaut
   */
  async setAsDefault(workflowId: string): Promise<boolean> {
    try {
      logger.info('⭐ Définition du workflow par défaut', { workflowId });

      const success = await this.workflowRepository.setAsDefault(workflowId);

      if (success) {
        logger.info('✅ Workflow défini comme par défaut', { workflowId });
      }

      return success;

    } catch (error) {
      logger.error('❌ Erreur lors de la définition du workflow par défaut', error as Error);
      throw error;
    }
  }

  /**
   * Supprime un workflow
   */
  async deleteWorkflow(workflowId: string): Promise<boolean> {
    try {
      logger.info('🗑️ Suppression du workflow', { workflowId });

      // Vérifier si le workflow peut être supprimé
      const canDelete = await this.workflowRepository.canBeDeleted(workflowId);
      if (!canDelete.canDelete) {
        throw new Error(canDelete.reason || 'Le workflow ne peut pas être supprimé');
      }

      const success = await this.workflowRepository.delete(workflowId);

      if (success) {
        logger.info('✅ Workflow supprimé avec succès', { workflowId });
      }

      return success;

    } catch (error) {
      logger.error('❌ Erreur lors de la suppression du workflow', error as Error);
      throw error;
    }
  }

  /**
   * Crée les workflows par défaut du système
   */
  async createDefaultWorkflows(): Promise<ApprovalWorkflow[]> {
    try {
      logger.info('🏗️ Création des workflows par défaut');

      const defaultWorkflows: ApprovalWorkflow[] = [];

      // Workflow simple pour documents standards
      const simpleWorkflow = ApprovalWorkflow.createSimple(
        'Approbation Simple',
        'supervisor'
      );
      const savedSimple = await this.workflowRepository.save(simpleWorkflow);
      defaultWorkflows.push(savedSimple);

      // Workflow standard pour montants élevés
      const standardWorkflow = ApprovalWorkflow.createStandard(
        'Approbation Standard',
        'supervisor',
        'manager',
        5000
      );
      const savedStandard = await this.workflowRepository.save(standardWorkflow);
      defaultWorkflows.push(savedStandard);

      // Workflow avancé pour documents critiques
      const advancedWorkflow = await this.createWorkflow({
        name: 'Approbation Avancée',
        description: 'Workflow à 3 niveaux pour documents critiques',
        type: WorkflowType.ADVANCED,
        steps: [
          {
            order: 1,
            level: ApprovalLevel.LEVEL_1,
            name: 'Approbation Superviseur',
            description: 'Première vérification par le superviseur',
            requiredRole: 'supervisor',
            isRequired: true,
            isParallel: false
          },
          {
            order: 2,
            level: ApprovalLevel.LEVEL_2,
            name: 'Approbation Manager',
            description: 'Validation par le manager',
            requiredRole: 'manager',
            isRequired: true,
            isParallel: false
          },
          {
            order: 3,
            level: ApprovalLevel.LEVEL_3,
            name: 'Approbation Direction',
            description: 'Approbation finale par la direction',
            requiredRole: 'director',
            isRequired: true,
            isParallel: false
          }
        ],
        activationConditions: [{
          type: TriggerCondition.IMPACT_LEVEL,
          operator: 'equals',
          value: 'critical',
          description: 'Documents avec impact critique'
        }],
        isDefault: false,
        priority: 3,
        tags: ['critical', 'advanced']
      });
      defaultWorkflows.push(advancedWorkflow);

      // Définir le workflow simple comme par défaut
      await this.setAsDefault(savedSimple.id);

      logger.info('✅ Workflows par défaut créés', { count: defaultWorkflows.length });

      return defaultWorkflows;

    } catch (error) {
      logger.error('❌ Erreur lors de la création des workflows par défaut', error as Error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques des workflows
   */
  async getWorkflowStatistics(): Promise<{
    total: number;
    byType: Record<WorkflowType, number>;
    activeCount: number;
    inactiveCount: number;
    defaultCount: number;
  }> {
    try {
      const allWorkflows = await this.workflowRepository.findByCriteria({});
      
      const stats = {
        total: allWorkflows.length,
        byType: {} as Record<WorkflowType, number>,
        activeCount: 0,
        inactiveCount: 0,
        defaultCount: 0
      };

      // Initialiser les compteurs par type
      Object.values(WorkflowType).forEach(type => {
        stats.byType[type] = 0;
      });

      allWorkflows.forEach(workflow => {
        // Comptage par type
        stats.byType[workflow.type]++;

        // Comptage des statuts
        if (workflow.isActive) stats.activeCount++;
        else stats.inactiveCount++;
        
        if (workflow.isDefault) stats.defaultCount++;
      });

      return stats;

    } catch (error) {
      logger.error('❌ Erreur lors du calcul des statistiques des workflows', error as Error);
      throw error;
    }
  }

  /**
   * Valide la configuration d'un workflow
   */
  validateWorkflowConfiguration(workflow: ApprovalWorkflow): { isValid: boolean; errors: string[] } {
    return workflow.validate();
  }

  /**
   * Récupère tous les workflows actifs triés par priorité
   */
  async getActiveWorkflowsByPriority(): Promise<ApprovalWorkflow[]> {
    try {
      return await this.workflowRepository.findActiveWorkflowsByPriority();
    } catch (error) {
      logger.error('❌ Erreur lors de la récupération des workflows par priorité', error as Error);
      throw error;
    }
  }
}