/**
 * 🪝 GESTIONNAIRE WEBHOOKS POUR NOTIFICATIONS
 * 
 * Gestionnaire de webhooks pour callbacks de delivery :
 * - Support multi-providers (Email, SMS, WhatsApp)
 * - Validation des signatures de sécurité
 * - Mise à jour automatique des statuts
 * - Retry en cas d'échec de traitement
 * - Métriques et monitoring
 */

import crypto from 'crypto';
import { ProductionLogger } from '../logging/logger.production';
import { NotificationRepository } from '../../infrastructure/repositories/NotificationRepository';

export interface WebhookConfig {
  security: {
    validateSignatures: boolean;
    secrets: {
      email?: string;    // Secret pour webhooks email (SendGrid, Mailgun, etc.)
      sms?: string;      // Secret pour webhooks SMS (Twilio, etc.)
      whatsapp?: string; // Secret pour webhooks WhatsApp
    };
  };
  endpoints: {
    email: string;
    sms: string; 
    whatsapp: string;
  };
  retry: {
    maxAttempts: number;
    backoffMultiplier: number;
  };
}

export interface WebhookEvent {
  provider: 'email' | 'sms' | 'whatsapp';
  eventType: 'delivered' | 'bounced' | 'failed' | 'opened' | 'clicked' | 'read';
  externalId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface WebhookResult {
  success: boolean;
  processed: boolean;
  notificationId?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export class WebhookHandler {
  private logger: ProductionLogger;
  private repository: NotificationRepository;
  private config: WebhookConfig;
  
  // Métriques
  private metrics = {
    totalWebhooks: 0,
    processedWebhooks: 0,
    failedWebhooks: 0,
    byProvider: {
      email: { total: 0, processed: 0, failed: 0 },
      sms: { total: 0, processed: 0, failed: 0 },
      whatsapp: { total: 0, processed: 0, failed: 0 }
    }
  };
  
  constructor(repository: NotificationRepository, config?: Partial<WebhookConfig>) {
    this.logger = new ProductionLogger();
    this.repository = repository;
    
    this.config = {
      security: {
        validateSignatures: process.env.WEBHOOK_VALIDATE_SIGNATURES === 'true',
        secrets: {
          email: process.env.WEBHOOK_EMAIL_SECRET,
          sms: process.env.WEBHOOK_SMS_SECRET,
          whatsapp: process.env.WEBHOOK_WHATSAPP_SECRET
        }
      },
      endpoints: {
        email: process.env.WEBHOOK_EMAIL_ENDPOINT || '/webhooks/email',
        sms: process.env.WEBHOOK_SMS_ENDPOINT || '/webhooks/sms',
        whatsapp: process.env.WEBHOOK_WHATSAPP_ENDPOINT || '/webhooks/whatsapp'
      },
      retry: {
        maxAttempts: parseInt(process.env.WEBHOOK_MAX_ATTEMPTS || '3'),
        backoffMultiplier: parseFloat(process.env.WEBHOOK_BACKOFF_MULTIPLIER || '2')
      },
      ...config
    };
  }
  
  /**
   * Traiter un webhook entrant
   */
  async handleWebhook(
    provider: 'email' | 'sms' | 'whatsapp',
    payload: any,
    signature?: string,
    headers?: Record<string, string>
  ): Promise<WebhookResult> {
    const startTime = Date.now();
    
    try {
      this.logger.info('🪝 Webhook reçu', { 
        provider, 
        hasSignature: !!signature,
        payloadSize: JSON.stringify(payload).length 
      });
      
      // Incrémenter les métriques
      this.metrics.totalWebhooks++;
      this.metrics.byProvider[provider].total++;
      
      // 1. Valider la signature si configurée
      if (this.config.security.validateSignatures && signature) {
        const isValid = this.validateSignature(provider, payload, signature, headers);
        if (!isValid) {
          this.logger.warn('⚠️ Signature webhook invalide', { provider });
          this.incrementFailedMetrics(provider);
          return {
            success: false,
            processed: false,
            error: 'Invalid webhook signature'
          };
        }
      }
      
      // 2. Parser l'événement selon le provider
      const event = this.parseWebhookEvent(provider, payload);
      if (!event) {
        this.logger.warn('⚠️ Impossible de parser l\'événement webhook', { provider, payload });
        this.incrementFailedMetrics(provider);
        return {
          success: false,
          processed: false,
          error: 'Unable to parse webhook event'
        };
      }
      
      // 3. Trouver la notification correspondante
      const notificationResult = await this.repository.findByExternalId(event.externalId);
      if (!notificationResult || !notificationResult.success || !notificationResult.result) {
        this.logger.warn('⚠️ Notification non trouvée pour le webhook', { 
          provider, 
          externalId: event.externalId 
        });
        // Ce n'est pas forcément une erreur - pourrait être un webhook en retard
        return {
          success: true,
          processed: false,
          error: 'Notification not found'
        };
      }
      
      const notification = notificationResult.result;
      
      // 4. Traiter l'événement
      const processed = await this.processWebhookEvent(notification.id, event);
      
      const latency = Date.now() - startTime;
      
      if (processed) {
        this.metrics.processedWebhooks++;
        this.metrics.byProvider[provider].processed++;
        
        this.logger.info('✅ Webhook traité avec succès', {
          provider,
          eventType: event.eventType,
          notificationId: notification.id,
          latency
        });
        
        return {
          success: true,
          processed: true,
          notificationId: notification.id,
          metadata: {
            eventType: event.eventType,
            latency
          }
        };
      } else {
        this.incrementFailedMetrics(provider);
        return {
          success: false,
          processed: false,
          notificationId: notification.id,
          error: 'Failed to process webhook event'
        };
      }
      
    } catch (error) {
      this.incrementFailedMetrics(provider);
      
      this.logger.error('❌ Erreur lors du traitement du webhook', { 
        provider, 
        error: (error as Error).message 
      });
      
      return {
        success: false,
        processed: false,
        error: (error as Error).message
      };
    }
  }
  
  /**
   * Valider la signature d'un webhook
   */
  private validateSignature(
    provider: 'email' | 'sms' | 'whatsapp',
    payload: any,
    signature: string,
    headers?: Record<string, string>
  ): boolean {
    const secret = this.config.security.secrets[provider];
    if (!secret) {
      this.logger.warn('⚠️ Secret webhook non configuré', { provider });
      return false;
    }
    
    try {
      switch (provider) {
        case 'email':
          return this.validateEmailSignature(payload, signature, secret, headers);
        case 'sms':
          return this.validateSmsSignature(payload, signature, secret, headers);
        case 'whatsapp':
          return this.validateWhatsAppSignature(payload, signature, secret, headers);
        default:
          return false;
      }
    } catch (error) {
      this.logger.error('❌ Erreur validation signature', { provider, error });
      return false;
    }
  }
  
  /**
   * Valider signature email (format SendGrid/Mailgun)
   */
  private validateEmailSignature(
    payload: any,
    signature: string,
    secret: string,
    headers?: Record<string, string>
  ): boolean {
    // Format SendGrid : SHA256 HMAC
    const payloadString = JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
    
    return signature === expectedSignature || signature === `sha256=${expectedSignature}`;
  }
  
  /**
   * Valider signature SMS (format Twilio)
   */
  private validateSmsSignature(
    payload: any,
    signature: string,
    secret: string,
    headers?: Record<string, string>
  ): boolean {
    // Format Twilio : base64(sha1(url + sorted_params))
    const payloadString = JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac('sha1', secret)
      .update(payloadString)
      .digest('base64');
    
    return signature === expectedSignature;
  }
  
  /**
   * Valider signature WhatsApp (format Meta)
   */
  private validateWhatsAppSignature(
    payload: any,
    signature: string,
    secret: string,
    headers?: Record<string, string>
  ): boolean {
    // Format Meta : sha256=hash
    const payloadString = JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
    
    return signature === `sha256=${expectedSignature}`;
  }
  
  /**
   * Parser un événement webhook selon le provider
   */
  private parseWebhookEvent(provider: 'email' | 'sms' | 'whatsapp', payload: any): WebhookEvent | null {
    try {
      switch (provider) {
        case 'email':
          return this.parseEmailWebhook(payload);
        case 'sms':
          return this.parseSmsWebhook(payload);
        case 'whatsapp':
          return this.parseWhatsAppWebhook(payload);
        default:
          return null;
      }
    } catch (error) {
      this.logger.error('❌ Erreur parsing webhook', { provider, error });
      return null;
    }
  }
  
  /**
   * Parser webhook email (SendGrid format)
   */
  private parseEmailWebhook(payload: any): WebhookEvent | null {
    // Format SendGrid webhook
    if (payload.event && payload.sg_message_id) {
      return {
        provider: 'email',
        eventType: this.mapEmailEventType(payload.event),
        externalId: payload.sg_message_id,
        timestamp: new Date(payload.timestamp * 1000),
        metadata: {
          email: payload.email,
          reason: payload.reason,
          userAgent: payload.useragent
        }
      };
    }
    
    // Format Mailgun
    if (payload['event-data']) {
      const eventData = payload['event-data'];
      return {
        provider: 'email',
        eventType: this.mapEmailEventType(eventData.event),
        externalId: eventData.message.headers['message-id'],
        timestamp: new Date(eventData.timestamp * 1000),
        metadata: {
          recipient: eventData.recipient,
          reason: eventData.reason
        }
      };
    }
    
    return null;
  }
  
  /**
   * Parser webhook SMS (Twilio format)
   */
  private parseSmsWebhook(payload: any): WebhookEvent | null {
    if (payload.MessageSid && payload.MessageStatus) {
      return {
        provider: 'sms',
        eventType: this.mapSmsEventType(payload.MessageStatus),
        externalId: payload.MessageSid,
        timestamp: new Date(),
        metadata: {
          to: payload.To,
          from: payload.From,
          errorCode: payload.ErrorCode,
          errorMessage: payload.ErrorMessage
        }
      };
    }
    
    return null;
  }
  
  /**
   * Parser webhook WhatsApp (Meta format)
   */
  private parseWhatsAppWebhook(payload: any): WebhookEvent | null {
    if (payload.entry && payload.entry[0]?.changes) {
      const change = payload.entry[0].changes[0];
      if (change.field === 'messages' && change.value.statuses) {
        const status = change.value.statuses[0];
        return {
          provider: 'whatsapp',
          eventType: this.mapWhatsAppEventType(status.status),
          externalId: status.id,
          timestamp: new Date(status.timestamp * 1000),
          metadata: {
            recipient: status.recipient_id,
            conversation: status.conversation
          }
        };
      }
    }
    
    return null;
  }
  
  /**
   * Mapper les types d'événements email
   */
  private mapEmailEventType(event: string): 'delivered' | 'bounced' | 'failed' | 'opened' | 'clicked' {
    switch (event.toLowerCase()) {
      case 'delivered':
      case 'delivery':
        return 'delivered';
      case 'bounce':
      case 'bounced':
        return 'bounced';
      case 'dropped':
      case 'failed':
        return 'failed';
      case 'open':
      case 'opened':
        return 'opened';
      case 'click':
      case 'clicked':
        return 'clicked';
      default:
        return 'delivered';
    }
  }
  
  /**
   * Mapper les types d'événements SMS
   */
  private mapSmsEventType(status: string): 'delivered' | 'bounced' | 'failed' | 'opened' | 'clicked' {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'delivered';
      case 'undelivered':
      case 'failed':
        return 'failed';
      default:
        return 'delivered';
    }
  }
  
  /**
   * Mapper les types d'événements WhatsApp
   */
  private mapWhatsAppEventType(status: string): 'delivered' | 'bounced' | 'failed' | 'opened' | 'clicked' {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'delivered';
      case 'failed':
        return 'failed';
      case 'read':
        return 'opened';
      default:
        return 'delivered';
    }
  }
  
  /**
   * Traiter un événement webhook
   */
  private async processWebhookEvent(notificationId: string, event: WebhookEvent): Promise<boolean> {
    try {
      switch (event.eventType) {
        case 'delivered':
          // Transition SENT → DELIVERED
          await this.repository.markAsDelivered(
            notificationId,
            event.timestamp,
            event.metadata
          );
          break;
          
        case 'failed':
        case 'bounced':
          await this.repository.markAsFailed(
            notificationId,
            event.metadata?.reason || 'Provider reported failure',
            event.metadata
          );
          break;
          
        case 'opened':
        case 'read':
          // Transition DELIVERED → READ (ou SENT → READ si pas de DELIVERED)
          await this.repository.markAsRead(
            notificationId,
            event.timestamp,
            {
              ...event.metadata,
              openedAt: event.timestamp
            }
          );
          break;
          
        case 'clicked':
          // Mettre à jour les métriques d'engagement (ne change pas le statut)
          await this.repository.update(notificationId, {
            providerResponse: {
              ...event.metadata,
              clickedAt: event.timestamp
            }
          });
          break;
      }
      
      return true;
      
    } catch (error) {
      this.logger.error('❌ Erreur traitement événement webhook', { 
        notificationId, 
        event, 
        error 
      });
      return false;
    }
  }
  
  /**
   * Incrémenter les métriques d'échec
   */
  private incrementFailedMetrics(provider: 'email' | 'sms' | 'whatsapp'): void {
    this.metrics.failedWebhooks++;
    this.metrics.byProvider[provider].failed++;
  }
  
  /**
   * Obtenir les métriques de webhooks
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalWebhooks > 0 
        ? (this.metrics.processedWebhooks / this.metrics.totalWebhooks) * 100 
        : 0
    };
  }
  
  /**
   * Reset des métriques
   */
  resetMetrics(): void {
    this.metrics = {
      totalWebhooks: 0,
      processedWebhooks: 0,
      failedWebhooks: 0,
      byProvider: {
        email: { total: 0, processed: 0, failed: 0 },
        sms: { total: 0, processed: 0, failed: 0 },
        whatsapp: { total: 0, processed: 0, failed: 0 }
      }
    };
  }
}