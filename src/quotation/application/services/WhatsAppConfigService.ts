import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { WhatsAppConfigDTO, WhatsAppTemplateDTO, WhatsAppDocumentConfigDTO, WhatsAppRecipientConfigDTO } from '../dtos/WhatsAppConfigDTO';

@injectable()
export class WhatsAppConfigService {
  constructor(
    @inject('PrismaClient') private prisma: PrismaClient
  ) {}

  async getWhatsAppConfig(): Promise<WhatsAppConfigDTO> {
    const config = await this.prisma.configuration.findFirst({
      where: { 
        category: 'whatsapp',
        key: 'whatsapp_config',
        isActive: true 
      }
    });

    return config?.value as unknown as WhatsAppConfigDTO;
  }

  async updateWhatsAppConfig(config: WhatsAppConfigDTO): Promise<WhatsAppConfigDTO> {
    const updated = await this.prisma.configuration.upsert({
      where: { 
        category_key: {
          category: 'whatsapp',
          key: 'whatsapp_config'
        }
      },
      update: { 
        value: config as any,
        updatedAt: new Date()
      },
      create: {
        id: crypto.randomUUID(),
        category: 'whatsapp',
        key: 'whatsapp_config',
        value: config as any,
        isActive: true,
        validFrom: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return updated.value as unknown as WhatsAppConfigDTO;
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