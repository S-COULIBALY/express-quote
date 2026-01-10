/**
 * NotificationSender - Méthodes d'envoi simplifiées
 * 
 * Responsabilité unique : Wrappers simplifiés pour l'envoi de notifications
 */

import { ProductionLogger } from '../../../infrastructure/logging/logger.production';
import { NotificationMessage, NotificationResult } from '../notification.service.production';
import { ContentGenerator } from '../generators/ContentGenerator';

export interface SendEmailOptions {
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  template?: string;
  data?: any;
  html?: string;
  text?: string;
  priority?: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  scheduledAt?: Date;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  metadata?: Record<string, any>;
}

export interface SendSMSOptions {
  to: string;
  message: string;
  from?: string;
  priority?: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  scheduledAt?: Date;
  unicode?: boolean;
  metadata?: Record<string, any>;
}

export interface SendWhatsAppOptions {
  to: string;
  message?: string;
  template?: {
    name: string;
    params?: any[];
  };
  priority?: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  scheduledAt?: Date;
  metadata?: Record<string, any>;
}

export interface SendEmailWithFallbackOptions extends SendEmailOptions {
  primaryTemplate: string;
  fallbackTemplate: string;
}

export class NotificationSender {
  private logger = new ProductionLogger('NotificationSender');
  private contentGenerator = new ContentGenerator();

  constructor(
    private sendNotification: (notification: NotificationMessage) => Promise<NotificationResult>
  ) {}

  /**
   * Envoie un email avec options simplifiées
   */
  async sendEmail(options: SendEmailOptions): Promise<NotificationResult> {
    const recipient = Array.isArray(options.to) ? options.to[0] : options.to;
    
    const message: NotificationMessage = {
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'email',
      recipient,
      subject: options.subject,
      content: options.html || options.text || '',
      templateId: options.template,
      variables: options.data,
      priority: options.priority?.toLowerCase() as any || 'normal',
      scheduledAt: options.scheduledAt,
      metadata: {
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments,
        ...options.metadata
      }
    };

    return await this.sendNotification(message);
  }

  /**
   * Envoie un SMS avec options simplifiées
   */
  async sendSMS(options: SendSMSOptions): Promise<NotificationResult> {
    const message: NotificationMessage = {
      id: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'sms',
      recipient: options.to,
      content: options.message,
      priority: options.priority?.toLowerCase() as any || 'normal',
      scheduledAt: options.scheduledAt,
      metadata: {
        from: options.from,
        unicode: options.unicode,
        ...options.metadata
      }
    };

    return await this.sendNotification(message);
  }

  /**
   * Envoie un WhatsApp avec options simplifiées
   */
  async sendWhatsApp(options: SendWhatsAppOptions): Promise<NotificationResult> {
    const message: NotificationMessage = {
      id: `whatsapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'whatsapp',
      recipient: options.to,
      content: options.message || '',
      templateId: options.template?.name,
      variables: options.template?.params ? { params: options.template.params } : undefined,
      priority: options.priority?.toLowerCase() as any || 'normal',
      scheduledAt: options.scheduledAt,
      metadata: options.metadata
    };

    return await this.sendNotification(message);
  }

  /**
   * Envoie un email avec fallback de template
   */
  async sendEmailWithFallback(options: SendEmailWithFallbackOptions): Promise<NotificationResult> {
    try {
      // Essayer d'abord avec le template principal
      return await this.sendEmail({
        ...options,
        template: options.primaryTemplate
      });
    } catch (error) {
      this.logger.warn(`Failed to use primary template '${options.primaryTemplate}', falling back to '${options.fallbackTemplate}'`, {
        error: (error as Error).message,
        primaryTemplate: options.primaryTemplate,
        fallbackTemplate: options.fallbackTemplate
      });
      
      try {
        // Fallback vers le template de secours
        return await this.sendEmail({
          ...options,
          template: options.fallbackTemplate
        });
      } catch (fallbackError) {
        this.logger.error(`Both primary and fallback templates failed`, {
          primaryError: (error as Error).message,
          fallbackError: (fallbackError as Error).message,
          primaryTemplate: options.primaryTemplate,
          fallbackTemplate: options.fallbackTemplate
        });
        
        // Si même le fallback échoue, essayer d'envoyer un email simple
        return await this.sendSimpleEmail({
          to: options.to,
          subject: options.subject || `Rappel de service - ${(options.data?.serviceName || 'Express Quote')}`,
          content: this.contentGenerator.generateSimpleReminderText(options.data),
          priority: options.priority
        });
      }
    }
  }

  /**
   * Envoie un email simple sans template (fallback interne)
   */
  private async sendSimpleEmail(options: {
    to: string | string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    content: string;
    priority?: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
    scheduledAt?: Date;
    metadata?: Record<string, any>;
  }): Promise<NotificationResult> {
    return await this.sendEmail({
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      subject: options.subject,
      html: this.contentGenerator.generateSimpleHtml(options.content, options.subject),
      text: options.content,
      priority: options.priority,
      scheduledAt: options.scheduledAt,
      metadata: options.metadata
    });
  }
}

