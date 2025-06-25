import { EmailConfig, EmailTemplate, ExternalProvider } from '../entities/EmailConfig';

export interface IEmailConfigRepository {
  getEmailConfig(): Promise<EmailConfig>;
  updateEmailConfig(config: EmailConfig): Promise<EmailConfig>;
  
  getExternalProviders(): Promise<ExternalProvider[]>;
  addExternalProvider(provider: Omit<ExternalProvider, 'id'>): Promise<ExternalProvider>;
  updateExternalProvider(provider: ExternalProvider): Promise<ExternalProvider>;
  deleteExternalProvider(id: string): Promise<void>;
}

export interface IEmailTemplateRepository {
  getTemplates(): Promise<EmailTemplate[]>;
  getTemplateByType(type: string): Promise<EmailTemplate | null>;
  updateTemplate(template: EmailTemplate): Promise<EmailTemplate>;
} 