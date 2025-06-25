import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { 
  EmailConfigDTO, 
  ExternalProviderDTO, 
  ProfessionalDTO,
  RecipientConfigDTO,
  InternalTeamType
} from '../dtos/EmailConfigDTO';
import { EmailService } from '../../infrastructure/adapters/EmailService';

@injectable()
export class EmailConfigService {
  constructor(
    @inject('PrismaClient') private prisma: PrismaClient,
    @inject('EmailService') private emailService: EmailService
  ) {}

  async getEmailConfig(): Promise<EmailConfigDTO> {
    const config = await this.prisma.emailConfiguration.findFirst({
      where: { isActive: true }
    });

    return config?.value as EmailConfigDTO;
  }

  async updateEmailConfig(config: EmailConfigDTO): Promise<EmailConfigDTO> {
    const updated = await this.prisma.emailConfiguration.upsert({
      where: { key: 'email_config' },
      update: { 
        value: config,
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        smtpUser: config.smtpUser,
        smtpPassword: config.smtpPassword,
        emailFrom: config.emailFrom,
        documents: config.documents,
        reminderDays: config.reminderDays,
        templates: config.templates,
        internalTeams: config.internalTeams,
        externalProviders: config.externalProviders,
        professionals: config.professionals
      },
      create: {
        key: 'email_config',
        category: 'email',
        value: config,
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        smtpUser: config.smtpUser,
        smtpPassword: config.smtpPassword,
        emailFrom: config.emailFrom,
        documents: config.documents,
        reminderDays: config.reminderDays,
        templates: config.templates,
        internalTeams: config.internalTeams,
        externalProviders: config.externalProviders,
        professionals: config.professionals,
        isActive: true
      }
    });

    return updated.value as EmailConfigDTO;
  }

  async updateInternalTeam(team: InternalTeamType, config: RecipientConfigDTO): Promise<void> {
    const emailConfig = await this.getEmailConfig();
    const updatedTeams = {
      ...emailConfig.internalTeams,
      [team]: {
        ...emailConfig.internalTeams[team],
        config
      }
    };

    await this.updateEmailConfig({
      ...emailConfig,
      internalTeams: updatedTeams
    });
  }

  async updateExternalProvider(provider: ExternalProviderDTO): Promise<void> {
    const emailConfig = await this.getEmailConfig();
    const providers = emailConfig.externalProviders;
    const index = providers.findIndex(p => p.id === provider.id);

    if (index >= 0) {
      providers[index] = provider;
    } else {
      providers.push({
        ...provider,
        id: Date.now().toString()
      });
    }

    await this.updateEmailConfig({
      ...emailConfig,
      externalProviders: providers
    });
  }

  async updateProfessional(professional: ProfessionalDTO): Promise<void> {
    const emailConfig = await this.getEmailConfig();
    const professionals = emailConfig.professionals;
    const index = professionals.findIndex(p => p.id === professional.id);

    if (index >= 0) {
      professionals[index] = professional;
    } else {
      professionals.push({
        ...professional,
        id: Date.now().toString()
      });
    }

    await this.updateEmailConfig({
      ...emailConfig,
      professionals
    });
  }

  async deleteExternalProvider(providerId: string): Promise<void> {
    const emailConfig = await this.getEmailConfig();
    await this.updateEmailConfig({
      ...emailConfig,
      externalProviders: emailConfig.externalProviders.filter(p => p.id !== providerId)
    });
  }

  async deleteProfessional(professionalId: string): Promise<void> {
    const emailConfig = await this.getEmailConfig();
    await this.updateEmailConfig({
      ...emailConfig,
      professionals: emailConfig.professionals.filter(p => p.id !== professionalId)
    });
  }

  async updateTemplate(template: UpdateEmailTemplateDTO): Promise<UpdateEmailTemplateDTO> {
    const updated = await this.prisma.emailTemplate.upsert({
      where: { type: template.type },
      update: {
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent
      },
      create: {
        type: template.type,
        name: template.type,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
        isActive: true
      }
    });

    return {
      type: updated.type,
      subject: updated.subject,
      htmlContent: updated.htmlContent,
      textContent: updated.textContent
    };
  }

  async updateDocumentConfig(document: DocumentConfigDTO): Promise<DocumentConfigDTO> {
    const config = await this.getEmailConfig();
    const documents = { ...config.documents, [document.type]: document };
    
    await this.updateEmailConfig({ ...config, documents });
    
    return document;
  }

  async updateReminderDays(days: number[]): Promise<number[]> {
    const config = await this.getEmailConfig();
    await this.updateEmailConfig({ ...config, reminderDays: days });
    return days;
  }

  async testSmtpConnection(smtpConfig: SmtpConfigDTO): Promise<boolean> {
    try {
      await this.emailService.testConnection(smtpConfig);
      return true;
    } catch (error) {
      console.error('SMTP connection test failed:', error);
      return false;
    }
  }
} 