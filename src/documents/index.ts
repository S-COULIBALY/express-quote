// @ts-nocheck
// Documents Module - Point d'entrée principal
// Module autonome pour la gestion des documents PDF

// Domain exports
export { Document, DocumentType } from './domain/entities/Document';
export type { IDocumentRepository } from './domain/repositories/IDocumentRepository';
export type { IDocumentService } from './domain/interfaces/IDocumentService';
export { DocumentGenerationError } from './domain/errors/DocumentGenerationError';

// Template exports (Phase 4)
export { 
  Template, 
  TemplateFormat, 
  TemplateOrientation, 
  TemplateFieldType,
  type TemplateField,
  type TemplateSection,
  type TemplateLayout,
  type TemplateBranding
} from './domain/entities/Template';
export type {
  ITemplateRepository,
  TemplateSearchCriteria
} from './domain/repositories/ITemplateRepository';

// Version exports (Phase 5)
export {
  DocumentVersion,
  VersionStatus,
  ApprovalLevel,
  type VersionMetadata,
  type ApprovalStep
} from './domain/entities/DocumentVersion';
export {
  ApprovalWorkflow,
  WorkflowType,
  TriggerCondition,
  type WorkflowStepDefinition,
  type WorkflowCondition
} from './domain/entities/ApprovalWorkflow';
export type {
  IDocumentVersionRepository,
  VersionSearchCriteria,
  VersionStatistics
} from './domain/repositories/IDocumentVersionRepository';
export type {
  IApprovalWorkflowRepository,
  WorkflowSearchCriteria
} from './domain/repositories/IApprovalWorkflowRepository';

// Application exports
export {
  DocumentService
} from './application/services/DocumentService';

export {
  DocumentOrchestrationService,
  DocumentTrigger,
  DocumentRecipient
} from './application/services/DocumentOrchestrationService';

export {
  DocumentNotificationService,
  type PDFAttachment,
  type NotificationWithAttachments
} from './application/services/DocumentNotificationService';

// Template services (Phase 4)
export {
  TemplateService,
  type TemplateCreationRequest,
  type TemplateCustomizationOptions
} from './application/services/TemplateService';

export {
  TemplateCustomizationService,
  type CustomizationProfile,
  type CustomizationRule,
  type DynamicContent,
  type TemplatePersonalization
} from './application/services/TemplateCustomizationService';

// Version services (Phase 5)
export {
  DocumentVersionService,
  type VersionCreationRequest,
  type ApprovalRequest,
  type RejectionRequest,
  type VersionComparisonResult
} from './application/services/DocumentVersionService';

export {
  ApprovalWorkflowService,
  type WorkflowCreationRequest,
  type WorkflowUpdateRequest,
  type WorkflowTestContext,
  type WorkflowTestResult
} from './application/services/ApprovalWorkflowService';

// Infrastructure exports
export { PdfGeneratorService } from './infrastructure/services/PdfGeneratorService';
export { StorageService } from './infrastructure/services/StorageService';
export { PrismaDocumentRepository } from './infrastructure/repositories/PrismaDocumentRepository';
export { PrismaTemplateRepository } from './infrastructure/repositories/PrismaTemplateRepository';
export { PrismaDocumentVersionRepository } from './infrastructure/repositories/PrismaDocumentVersionRepository';
export { PrismaApprovalWorkflowRepository } from './infrastructure/repositories/PrismaApprovalWorkflowRepository';

// Interface exports
export { DocumentList } from './interfaces/components/DocumentList';

// Fonctions utilitaires
export function createDocumentService(): DocumentService {
  // Instanciation simple - le service gère ses dépendances en interne
  return new DocumentService();
}

export function createTemplateService(): TemplateService {
  // Instanciation simple pour le service de templates
  return new TemplateService();
}

export function createTemplateCustomizationService(): TemplateCustomizationService {
  // Instanciation simple pour le service de personnalisation
  return new TemplateCustomizationService();
}

export function createDocumentVersionService(): DocumentVersionService {
  // Instanciation simple pour le service de versions
  return new DocumentVersionService();
}

export function createApprovalWorkflowService(): ApprovalWorkflowService {
  // Instanciation simple pour le service de workflows
  return new ApprovalWorkflowService();
}