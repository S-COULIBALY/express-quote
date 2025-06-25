import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { WhatsAppConfigDTO, WhatsAppTemplateDTO, WhatsAppDocumentConfigDTO, WhatsAppRecipientConfigDTO } from '../dtos/WhatsAppConfigDTO';

@injectable()
export class WhatsAppConfigService {
  constructor(
    @inject('PrismaClient') private prisma: PrismaClient
  ) {}

  async getWhatsAppConfig(): Promise<WhatsAppConfigDTO> {
    const config = await this.prisma.whatsAppConfiguration.findFirst({
      where: { isActive: true }
    });

    return config?.value as WhatsAppConfigDTO;
  }

  async updateWhatsAppConfig(config: WhatsAppConfigDTO): Promise<WhatsAppConfigDTO> {
    const updated = await this.prisma.whatsAppConfiguration.upsert({
      where: { key: 'whatsapp_config' },
      update: { 
        value: config,
        apiKey: config.apiKey,
        phoneNumberId: config.phoneNumberId,
        businessAccountId: config.businessAccountId,
        webhookVerifyToken: config.webhookVerifyToken,
        sessionTimeout: config.sessionTimeout,
        maxMessagesPerDay: config.maxMessagesPerDay,
        templates: config.templates,
        documents: config.documents,
        recipients: config.recipients,
        analytics: {
          trackMessageMetrics: config.trackMessageMetrics,
          trackUserEngagement: config.trackUserEngagement,
          generateReports: config.generateReports,
          reportFrequency: config.reportFrequency
        }
      },
      create: {
        key: 'whatsapp_config',
        category: 'whatsapp',
        value: config,
        apiKey: config.apiKey,
        phoneNumberId: config.phoneNumberId,
        businessAccountId: config.businessAccountId,
        webhookVerifyToken: config.webhookVerifyToken,
        sessionTimeout: config.sessionTimeout,
        maxMessagesPerDay: config.maxMessagesPerDay,
        templates: config.templates,
        documents: config.documents,
        recipients: config.recipients,
        analytics: {
          trackMessageMetrics: config.trackMessageMetrics,
          trackUserEngagement: config.trackUserEngagement,
          generateReports: config.generateReports,
          reportFrequency: config.reportFrequency
        },
        isActive: true
      }
    });

    return updated.value as WhatsAppConfigDTO;
  }

  async updateTemplate(template: WhatsAppTemplateDTO): Promise<WhatsAppTemplateDTO> {
    const config = await this.getWhatsAppConfig();
    const templates = { ...config.templates, [template.name]: template.content };
    
    await this.updateWhatsAppConfig({ ...config, templates });
    
    return template;
  }

  async updateDocumentConfig(document: WhatsAppDocumentConfigDTO): Promise<WhatsAppDocumentConfigDTO> {
    const config = await this.getWhatsAppConfig();
    const documents = { ...config.documents, [document.type]: { enabled: document.enabled, caption: document.caption } };
    
    await this.updateWhatsAppConfig({ ...config, documents });
    
    return document;
  }

  async updateRecipientConfig(recipient: WhatsAppRecipientConfigDTO): Promise<WhatsAppRecipientConfigDTO> {
    const config = await this.getWhatsAppConfig();
    const recipients = { 
      ...config.recipients, 
      [recipient.type]: { 
        enabled: recipient.enabled, 
        messageTypes: recipient.messageTypes 
      } 
    };
    
    await this.updateWhatsAppConfig({ ...config, recipients });
    
    return recipient;
  }
} 