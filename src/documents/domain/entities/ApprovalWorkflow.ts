/**
 * ApprovalWorkflow - Entité pour la définition des workflows d'approbation
 * Phase 5: Système de versions et workflow d'approbation
 */

import { ApprovalLevel, ApprovalStep } from './DocumentVersion';

export enum WorkflowType {
  SIMPLE = 'simple',           // 1 niveau d'approbation
  STANDARD = 'standard',       // 2 niveaux d'approbation  
  ADVANCED = 'advanced',       // 3 niveaux d'approbation
  CUSTOM = 'custom'           // Workflow personnalisé
}

export enum TriggerCondition {
  ALWAYS = 'always',
  DOCUMENT_TYPE = 'document_type',
  AMOUNT_THRESHOLD = 'amount_threshold',
  IMPACT_LEVEL = 'impact_level',
  TEMPLATE_CHANGE = 'template_change',
  CUSTOMER_TYPE = 'customer_type'
}

export interface WorkflowCondition {
  type: TriggerCondition;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
  description: string;
}

export interface WorkflowStepDefinition {
  id: string;
  order: number;
  level: ApprovalLevel;
  name: string;
  description: string;
  requiredRole: string;
  assigneeId?: string; // Approbateur spécifique
  assigneeRole?: string; // Role requis si pas d'assignee spécifique
  isRequired: boolean;
  isParallel: boolean; // Peut être traité en parallèle avec d'autres étapes
  timeoutHours?: number; // Délai d'expiration en heures
  escalationUserId?: string; // Utilisateur d'escalade si timeout
  conditions?: WorkflowCondition[]; // Conditions pour activer cette étape
  autoApprove?: { // Conditions d'auto-approbation
    enabled: boolean;
    conditions: WorkflowCondition[];
  };
}

export class ApprovalWorkflow {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly type: WorkflowType,
    public readonly steps: WorkflowStepDefinition[],
    public readonly activationConditions: WorkflowCondition[],
    public readonly isActive: boolean = true,
    public readonly isDefault: boolean = false,
    public readonly priority: number = 0, // Plus élevé = plus prioritaire
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly createdBy?: string,
    public readonly version: string = '1.0.0',
    public readonly tags: string[] = [],
    public readonly metadata?: Record<string, any>
  ) {}

  /**
   * Vérifie si ce workflow doit être appliqué selon les conditions
   */
  shouldApply(context: {
    documentType?: string;
    amount?: number;
    impactLevel?: string;
    templateChanged?: boolean;
    customerType?: string;
    customData?: Record<string, any>;
  }): boolean {
    if (!this.isActive) {
      return false;
    }

    // Si pas de conditions d'activation, s'applique toujours
    if (this.activationConditions.length === 0) {
      return this.isDefault;
    }

    // Vérifier toutes les conditions d'activation
    return this.activationConditions.every(condition => 
      this.evaluateCondition(condition, context)
    );
  }

  /**
   * Évalue une condition selon le contexte
   */
  private evaluateCondition(
    condition: WorkflowCondition, 
    context: Record<string, any>
  ): boolean {
    const contextValue = this.getContextValue(condition.type, context);
    
    switch (condition.operator) {
      case 'equals':
        return contextValue === condition.value;
      case 'not_equals':
        return contextValue !== condition.value;
      case 'greater_than':
        return Number(contextValue) > Number(condition.value);
      case 'less_than':
        return Number(contextValue) < Number(condition.value);
      case 'contains':
        return String(contextValue).includes(String(condition.value));
      default:
        return false;
    }
  }

  /**
   * Récupère la valeur du contexte selon le type de condition
   */
  private getContextValue(conditionType: TriggerCondition, context: Record<string, any>): any {
    switch (conditionType) {
      case TriggerCondition.DOCUMENT_TYPE:
        return context.documentType;
      case TriggerCondition.AMOUNT_THRESHOLD:
        return context.amount;
      case TriggerCondition.IMPACT_LEVEL:
        return context.impactLevel;
      case TriggerCondition.TEMPLATE_CHANGE:
        return context.templateChanged;
      case TriggerCondition.CUSTOMER_TYPE:
        return context.customerType;
      case TriggerCondition.ALWAYS:
        return true;
      default:
        return null;
    }
  }

  /**
   * Génère les étapes d'approbation pour un document selon ce workflow
   */
  generateApprovalSteps(context: {
    documentType?: string;
    amount?: number;
    impactLevel?: string;
    customData?: Record<string, any>;
  }): ApprovalStep[] {
    const applicableSteps = this.steps.filter(stepDef => {
      // Si l'étape a des conditions, les vérifier
      if (stepDef.conditions && stepDef.conditions.length > 0) {
        return stepDef.conditions.every(condition => 
          this.evaluateCondition(condition, context)
        );
      }
      return true;
    });

    // Trier les étapes par ordre
    const sortedSteps = applicableSteps.sort((a, b) => a.order - b.order);

    return sortedSteps.map(stepDef => ({
      id: `step_${stepDef.id}_${Date.now()}`,
      level: stepDef.level,
      approverId: stepDef.assigneeId || '', // Sera assigné dynamiquement si vide
      approverName: '', // Sera résolu dynamiquement
      approverRole: stepDef.requiredRole,
      status: 'pending' as const,
      isRequired: stepDef.isRequired,
      conditions: stepDef.conditions?.map(c => c.description)
    }));
  }

  /**
   * Clone ce workflow pour en créer une nouvelle version
   */
  clone(newName?: string, newVersion?: string): ApprovalWorkflow {
    return new ApprovalWorkflow(
      `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      newName || `${this.name} (Copie)`,
      this.description,
      this.type,
      this.steps.map(step => ({ ...step })),
      this.activationConditions.map(condition => ({ ...condition })),
      false, // La copie n'est pas active par défaut
      false, // La copie n'est pas par défaut
      this.priority,
      new Date(),
      new Date(),
      this.createdBy,
      newVersion || '1.0.0',
      [...this.tags],
      { ...this.metadata }
    );
  }

  /**
   * Met à jour ce workflow
   */
  update(updates: Partial<{
    name: string;
    description: string;
    steps: WorkflowStepDefinition[];
    activationConditions: WorkflowCondition[];
    isActive: boolean;
    isDefault: boolean;
    priority: number;
    tags: string[];
    metadata: Record<string, any>;
  }>): ApprovalWorkflow {
    return new ApprovalWorkflow(
      this.id,
      updates.name || this.name,
      updates.description || this.description,
      this.type,
      updates.steps || this.steps,
      updates.activationConditions || this.activationConditions,
      updates.isActive !== undefined ? updates.isActive : this.isActive,
      updates.isDefault !== undefined ? updates.isDefault : this.isDefault,
      updates.priority !== undefined ? updates.priority : this.priority,
      this.createdAt,
      new Date(),
      this.createdBy,
      this.version,
      updates.tags || this.tags,
      updates.metadata || this.metadata
    );
  }

  /**
   * Valide la configuration du workflow
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validation basique
    if (!this.name.trim()) {
      errors.push('Le nom du workflow est requis');
    }

    if (this.steps.length === 0) {
      errors.push('Au moins une étape d\'approbation est requise');
    }

    // Validation des étapes
    const orders = this.steps.map(s => s.order);
    if (new Set(orders).size !== orders.length) {
      errors.push('Les numéros d\'ordre des étapes doivent être uniques');
    }

    // Validation que chaque étape a un approbateur ou un rôle
    this.steps.forEach((step, index) => {
      if (!step.assigneeId && !step.assigneeRole) {
        errors.push(`Étape ${index + 1}: Un approbateur ou un rôle requis doit être spécifié`);
      }
      
      if (!step.name.trim()) {
        errors.push(`Étape ${index + 1}: Le nom est requis`);
      }
    });

    // Au moins une étape doit être requise
    if (!this.steps.some(step => step.isRequired)) {
      errors.push('Au moins une étape d\'approbation doit être requise');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Crée un workflow simple avec un seul niveau d'approbation
   */
  static createSimple(
    name: string,
    approverRole: string,
    documentTypes?: string[]
  ): ApprovalWorkflow {
    const conditions: WorkflowCondition[] = documentTypes ? 
      documentTypes.map(type => ({
        type: TriggerCondition.DOCUMENT_TYPE,
        operator: 'equals' as const,
        value: type,
        description: `Type de document: ${type}`
      })) : [];

    const steps: WorkflowStepDefinition[] = [{
      id: 'simple_approval',
      order: 1,
      level: ApprovalLevel.LEVEL_1,
      name: 'Approbation simple',
      description: 'Approbation par le superviseur',
      requiredRole: approverRole,
      isRequired: true,
      isParallel: false
    }];

    return new ApprovalWorkflow(
      `workflow_simple_${Date.now()}`,
      name,
      `Workflow simple d'approbation pour ${approverRole}`,
      WorkflowType.SIMPLE,
      steps,
      conditions,
      true,
      documentTypes === undefined, // Par défaut si pas de types spécifiques
      1
    );
  }

  /**
   * Crée un workflow standard avec deux niveaux d'approbation
   */
  static createStandard(
    name: string,
    level1Role: string,
    level2Role: string,
    amountThreshold?: number
  ): ApprovalWorkflow {
    const conditions: WorkflowCondition[] = amountThreshold ? [{
      type: TriggerCondition.AMOUNT_THRESHOLD,
      operator: 'greater_than',
      value: amountThreshold,
      description: `Montant supérieur à ${amountThreshold}€`
    }] : [];

    const steps: WorkflowStepDefinition[] = [
      {
        id: 'level1_approval',
        order: 1,
        level: ApprovalLevel.LEVEL_1,
        name: 'Approbation Niveau 1',
        description: `Approbation par ${level1Role}`,
        requiredRole: level1Role,
        isRequired: true,
        isParallel: false
      },
      {
        id: 'level2_approval',
        order: 2,
        level: ApprovalLevel.LEVEL_2,
        name: 'Approbation Niveau 2',
        description: `Approbation par ${level2Role}`,
        requiredRole: level2Role,
        isRequired: true,
        isParallel: false
      }
    ];

    return new ApprovalWorkflow(
      `workflow_standard_${Date.now()}`,
      name,
      `Workflow standard à 2 niveaux d'approbation`,
      WorkflowType.STANDARD,
      steps,
      conditions,
      true,
      false,
      2
    );
  }
}