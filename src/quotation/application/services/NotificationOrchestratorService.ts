import { injectable, inject } from 'tsyringe';
import { EmailDistributionService } from '../../infrastructure/services/EmailDistributionService';
import { WhatsAppDistributionService } from '../../infrastructure/services/whatsapp/WhatsAppDistributionService';
import { QuoteRequest } from '../../domain/entities/QuoteRequest';
import { Booking } from '../../domain/entities/Booking';
import { logger } from '@/lib/logger';
import { RetryHelper } from '@/utils/RetryHelper';
import { NotificationMetricsService, NotificationEvent, NotificationCategoryType } from '../../infrastructure/services/NotificationMetricsService';
import { v4 as uuidv4 } from 'uuid';

type MessageType = 'quote_request' | 'booking' | 'payment' | 'cancellation' | 'reminder';
type NotificationChannel = 'email' | 'whatsapp' | 'both';

interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  error?: Error;
  messageIds?: string[];
  attempts?: number;
  id?: string;
}

// Configuration par défaut pour la nouvelle tentative
const DEFAULT_RETRY_OPTIONS = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  backoffFactor: 2,
  maxDelayMs: 15000,
  isRetryableError: RetryHelper.isRetryableError,
  context: 'NotificationOrchestrator'
};

/**
 * Service orchestrateur pour la gestion des notifications multicouche
 */
@injectable()
export class NotificationOrchestratorService {
  private orchestratorLogger = logger.withContext('NotificationOrchestrator');
  private retryHelper: RetryHelper;

  constructor(
    @inject('EmailDistributionService') private emailDistributionService: EmailDistributionService,
    @inject('WhatsAppDistributionService') private whatsappDistributionService: WhatsAppDistributionService,
    @inject('NotificationMetricsService') private metricsService: NotificationMetricsService
  ) {
    this.retryHelper = new RetryHelper(DEFAULT_RETRY_OPTIONS);
  }

  /**
   * Convertit un MessageType en NotificationCategoryType
   */
  private mapMessageTypeToCategory(type: MessageType): NotificationCategoryType {
    // Adaptation des types de message aux catégories de notification
    const mapping: Record<MessageType, NotificationCategoryType> = {
      'quote_request': 'quote_request',
      'booking': 'booking',
      'payment': 'payment',
      'cancellation': 'cancellation',
      'reminder': 'reminder'
    };
    
    return mapping[type] || 'quote_request';
  }

  /**
   * Enregistre un événement de notification
   */
  private trackNotificationEvent(
    id: string,
    channel: 'email' | 'whatsapp',
    type: MessageType,
    eventType: 'sent' | 'delivered' | 'read' | 'failed' | 'retry',
    metadata?: any
  ): void {
    const event: NotificationEvent = {
      id,
      channel,
      category: this.mapMessageTypeToCategory(type),
      eventType,
      timestamp: new Date(),
      metadata,
      attempts: metadata?.attempts,
      recipient: metadata?.recipient
    };
    
    this.metricsService.trackEvent(event);
  }

  /**
   * Envoie une notification avec basculement automatique entre canaux en cas d'échec
   * Essaie d'abord le canal prioritaire, puis bascule vers le canal secondaire en cas d'échec
   * 
   * @param type Type de message à envoyer
   * @param data Données du message (QuoteRequest ou Booking)
   * @param primaryChannel Canal prioritaire à utiliser ('email' ou 'whatsapp')
   * @param metadata Métadonnées supplémentaires pour le message
   * @returns Résultat de l'envoi avec indication du canal utilisé
   */
  async sendWithFallback(
    type: MessageType,
    data: QuoteRequest | Booking,
    primaryChannel: 'email' | 'whatsapp' = 'whatsapp',
    metadata?: Record<string, any>
  ): Promise<NotificationResult> {
    const notificationId = uuidv4();
    this.orchestratorLogger.info(`Envoi de notification ${type} avec basculement, canal primaire: ${primaryChannel}`, { id: notificationId });
    
    // Enrichir les métadonnées avec l'ID de notification
    const enrichedMetadata = { ...metadata, notificationId };
    
    // Déterminer le canal secondaire (autre que le primaire)
    const secondaryChannel = primaryChannel === 'email' ? 'whatsapp' : 'email';
    
    try {
      // Essayer d'abord le canal prioritaire avec nouvelle tentative
      const results = await this.sendNotificationWithRetry(type, data, [primaryChannel], enrichedMetadata);
      const primaryResult = results.find(r => r.channel === primaryChannel);
      
      // Si le canal prioritaire a réussi, retourner le résultat
      if (primaryResult && primaryResult.success) {
        this.orchestratorLogger.info(`Notification ${type} envoyée avec succès via le canal prioritaire: ${primaryChannel}`, { id: notificationId });
        
        // Suivre l'événement
        this.trackNotificationEvent(notificationId, primaryChannel, type, 'sent', {
          recipient: this.getRecipientFromData(data),
          attempts: primaryResult.attempts || 1
        });
        
        return { ...primaryResult, channel: primaryChannel, id: notificationId };
      }
      
      // Si le canal prioritaire a échoué, essayer le canal secondaire
      this.orchestratorLogger.warn(`Échec d'envoi via le canal prioritaire ${primaryChannel}, basculement vers ${secondaryChannel}`, { id: notificationId });
      
      // Suivre l'erreur
      if (primaryResult) {
        this.trackNotificationEvent(notificationId, primaryChannel, type, 'failed', {
          recipient: this.getRecipientFromData(data),
          attempts: primaryResult.attempts || 1,
          error: primaryResult.error
        });
      }
      
      const fallbackResults = await this.sendNotificationWithRetry(type, data, [secondaryChannel], enrichedMetadata);
      const secondaryResult = fallbackResults.find(r => r.channel === secondaryChannel);
      
      if (secondaryResult && secondaryResult.success) {
        this.orchestratorLogger.info(`Notification ${type} envoyée avec succès via le canal secondaire: ${secondaryChannel}`, { id: notificationId });
        
        // Suivre l'événement
        this.trackNotificationEvent(notificationId, secondaryChannel, type, 'sent', {
          recipient: this.getRecipientFromData(data),
          attempts: secondaryResult.attempts || 1,
          fallback: true
        });
        
        return { ...secondaryResult, channel: secondaryChannel, id: notificationId };
      }
      
      // Si les deux canaux ont échoué
      this.orchestratorLogger.error(`Échec d'envoi de notification ${type} sur tous les canaux`, { id: notificationId });
      
      // Suivre l'erreur du canal secondaire
      if (secondaryResult) {
        this.trackNotificationEvent(notificationId, secondaryChannel, type, 'failed', {
          recipient: this.getRecipientFromData(data),
          attempts: secondaryResult.attempts || 1,
          error: secondaryResult.error,
          fallback: true
        });
      }
      
      return { 
        success: false, 
        channel: 'both', 
        error: new Error(`Échec d'envoi sur les canaux ${primaryChannel} et ${secondaryChannel}`),
        id: notificationId
      };
      
    } catch (error) {
      this.orchestratorLogger.error(`Erreur lors du basculement de notification ${type}:`, error, { id: notificationId });
      
      // Suivre l'erreur globale
      this.trackNotificationEvent(notificationId, 'email', type, 'failed', { 
        error,
        recipient: this.getRecipientFromData(data)
      });
      this.trackNotificationEvent(notificationId, 'whatsapp', type, 'failed', { 
        error,
        recipient: this.getRecipientFromData(data)
      });
      
      return { 
        success: false, 
        channel: 'both', 
        error: error as Error,
        id: notificationId
      };
    }
  }

  /**
   * Récupère le destinataire à partir des données
   */
  private getRecipientFromData(data: QuoteRequest | Booking): string {
    if (data instanceof QuoteRequest) {
      // Récupérer l'email du devis via getQuoteData()
      const quoteData = data.getQuoteData();
      return quoteData?.email || '';
    } else if (data instanceof Booking) {
      // Récupérer l'email du client dans la réservation
      const customer = data.getCustomer();
      return customer?.getContactInfo().getEmail() || '';
    }
    return '';
  }

  /**
   * Envoie une notification sur les canaux spécifiés avec mécanisme de nouvelle tentative
   */
  async sendNotificationWithRetry(
    type: MessageType,
    data: QuoteRequest | Booking,
    channels: NotificationChannel[] = ['email'],
    metadata?: Record<string, any>
  ): Promise<NotificationResult[]> {
    let attemptCount = 0;
    
    return this.retryHelper.execute(
      async () => {
        attemptCount++;
        if (attemptCount > 1) {
          // Suivre la nouvelle tentative
          channels.forEach(channel => {
            if (channel === 'email' || channel === 'whatsapp') {
              this.trackNotificationEvent(
                metadata?.notificationId || uuidv4(),
                channel,
                type,
                'retry',
                { attempts: attemptCount, recipient: this.getRecipientFromData(data) }
              );
            }
          });
        }
        
        const results = await this.sendNotification(type, data, channels, metadata);
        
        // Ajouter le nombre de tentatives à chaque résultat
        return results.map(result => ({ ...result, attempts: attemptCount }));
      },
      `envoi de notification ${type} sur ${channels.join(',')}`
    );
  }

  /**
   * Envoie une notification sur les canaux spécifiés
   */
  async sendNotification(
    type: MessageType,
    data: QuoteRequest | Booking,
    channels: NotificationChannel[] = ['email'],
    metadata?: Record<string, any>
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];
    const notificationId = metadata?.notificationId || uuidv4();

    try {
      const useEmail = channels.includes('email') || channels.includes('both');
      const useWhatsapp = channels.includes('whatsapp') || channels.includes('both');

      // Traitement du type de notification
      switch (type) {
        case 'quote_request':
          if (data instanceof QuoteRequest) {
            if (useEmail) {
              try {
                await this.emailDistributionService.distributeQuoteConfirmation(data);
                results.push({ success: true, channel: 'email', id: notificationId });
              } catch (error) {
                results.push({ success: false, channel: 'email', error: error as Error, id: notificationId });
              }
            }
            
            if (useWhatsapp) {
              try {
                await this.whatsappDistributionService.distributeQuoteConfirmation(data);
                results.push({ success: true, channel: 'whatsapp', id: notificationId });
              } catch (error) {
                results.push({ success: false, channel: 'whatsapp', error: error as Error, id: notificationId });
              }
            }
          }
          break;

        case 'booking':
          if (data instanceof Booking) {
            if (useEmail) {
              try {
                await this.emailDistributionService.distributeBookingConfirmation(data);
                results.push({ success: true, channel: 'email', id: notificationId });
              } catch (error) {
                results.push({ success: false, channel: 'email', error: error as Error, id: notificationId });
              }
            }
            
            if (useWhatsapp) {
              try {
                await this.whatsappDistributionService.distributeBookingConfirmation(data);
                results.push({ success: true, channel: 'whatsapp', id: notificationId });
              } catch (error) {
                results.push({ success: false, channel: 'whatsapp', error: error as Error, id: notificationId });
              }
            }
          }
          break;

        case 'payment':
          if (data instanceof Booking && metadata?.transactionId) {
            const transactionId = metadata.transactionId;
            
            if (useEmail) {
              try {
                await this.emailDistributionService.distributePaymentConfirmation(data, transactionId);
                results.push({ success: true, channel: 'email', id: notificationId });
              } catch (error) {
                results.push({ success: false, channel: 'email', error: error as Error, id: notificationId });
              }
            }
            
            if (useWhatsapp) {
              try {
                await this.whatsappDistributionService.distributePaymentConfirmation(data, transactionId);
                results.push({ success: true, channel: 'whatsapp', id: notificationId });
              } catch (error) {
                results.push({ success: false, channel: 'whatsapp', error: error as Error, id: notificationId });
              }
            }
          }
          break;

        case 'cancellation':
          if (data instanceof Booking) {
            const reason = metadata?.reason;
            
            if (useEmail) {
              try {
                await this.emailDistributionService.distributeCancellationNotification(data, reason);
                results.push({ success: true, channel: 'email', id: notificationId });
              } catch (error) {
                results.push({ success: false, channel: 'email', error: error as Error, id: notificationId });
              }
            }
            
            if (useWhatsapp) {
              try {
                await this.whatsappDistributionService.distributeCancellationNotification(data, reason);
                results.push({ success: true, channel: 'whatsapp', id: notificationId });
              } catch (error) {
                results.push({ success: false, channel: 'whatsapp', error: error as Error, id: notificationId });
              }
            }
          }
          break;

        case 'reminder':
          if (data instanceof Booking) {
            // Pour les rappels, nous devons traiter par lot
            if (useEmail) {
              try {
                await this.emailDistributionService.sendAppointmentReminders([data]);
                results.push({ success: true, channel: 'email', id: notificationId });
              } catch (error) {
                results.push({ success: false, channel: 'email', error: error as Error, id: notificationId });
              }
            }
            
            if (useWhatsapp) {
              try {
                await this.whatsappDistributionService.sendAppointmentReminders([data]);
                results.push({ success: true, channel: 'whatsapp', id: notificationId });
              } catch (error) {
                results.push({ success: false, channel: 'whatsapp', error: error as Error, id: notificationId });
              }
            }
          }
          break;
      }

      return results;
    } catch (error) {
      this.orchestratorLogger.error(`Erreur lors de l'envoi de notification ${type}:`, error);
      throw error; // Permettre au RetryHelper de capturer l'erreur pour une nouvelle tentative
    }
  }

  /**
   * Obtient les métriques des notifications
   */
  getNotificationMetrics() {
    return this.metricsService.getMetrics();
  }

  /**
   * Obtient les taux de succès par canal
   */
  getSuccessRates() {
    return {
      email: this.metricsService.getSuccessRate('email'),
      whatsapp: this.metricsService.getSuccessRate('whatsapp'),
      overall: this.metricsService.getSuccessRate('both')
    };
  }

  /**
   * Obtient les statistiques de retries
   */
  getRetryStatistics() {
    return this.metricsService.getRetryStats();
  }
} 