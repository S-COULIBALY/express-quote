/**
 * NotificationWorkers - Workers BullMQ pour traitement des queues
 * 
 * Responsabilité unique : Traitement des jobs des queues (email, SMS, WhatsApp, reminders)
 */

import { RobustEmailAdapter } from '../../../infrastructure/adapters/email.adapter.production';
import { RobustSmsAdapter } from '../../../infrastructure/adapters/sms.adapter.production';
import { RobustWhatsAppAdapter } from '../../../infrastructure/adapters/whatsapp.adapter.production';
import { ProductionQueueManager } from '../../../infrastructure/queue/queue.manager.production';
import { CircuitBreaker } from '../../../infrastructure/resilience/circuit.breaker';
import { NotificationRepository } from '../../../infrastructure/repositories/NotificationRepository';
import { MetricsCollector } from '../../../infrastructure/monitoring/metrics.collector';
import { ModernEventBus, NotificationSentEvent, NotificationFailedEvent } from '../../../infrastructure/events/modern.event.bus';
import { ProductionLogger } from '../../../infrastructure/logging/logger.production';
import { NotificationMessage, NotificationResult, ReminderJobData } from '../notification.service.production';

export interface ReminderHandler {
  sendReminder7d: (data: ReminderJobData) => Promise<NotificationResult[]>;
  sendReminder24h: (data: ReminderJobData) => Promise<NotificationResult[]>;
  sendReminder1h: (data: ReminderJobData) => Promise<NotificationResult[]>;
}

export class NotificationWorkers {
  private logger = new ProductionLogger({ service: 'NotificationWorkers' });

  constructor(
    private emailAdapter: RobustEmailAdapter,
    private smsAdapter: RobustSmsAdapter,
    private whatsAppAdapter: RobustWhatsAppAdapter,
    private queueManager: ProductionQueueManager,
    private circuitBreaker: CircuitBreaker,
    private repository: NotificationRepository,
    private metricsCollector: MetricsCollector,
    private eventBus: ModernEventBus,
    private reminderHandler?: ReminderHandler
  ) {}

  /**
   * Créer les workers pour traiter les queues
   */
  createWorkers(): void {
    // Worker Email
    this.queueManager.createWorker('email', async (job) => {
      const notification = job.data as NotificationMessage;
      return await this.processEmailNotification(notification);
    });
    
    // Worker SMS
    this.queueManager.createWorker('sms', async (job) => {
      const notification = job.data as NotificationMessage;
      return await this.processSmsNotification(notification);
    });
    
    // Worker WhatsApp
    this.queueManager.createWorker('whatsapp', async (job) => {
      const notification = job.data as NotificationMessage;
      return await this.processWhatsAppNotification(notification);
    });
    
    // Worker Reminders
    this.queueManager.createWorker('reminders', async (job) => {
      const reminderData = job.data as ReminderJobData;
      return await this.processReminderNotification(reminderData);
    });
  }

  /**
   * Traiter une notification email (worker)
   */
  private async processEmailNotification(notification: NotificationMessage): Promise<NotificationResult> {
    const startTime = Date.now();
    const notificationId = (notification as any).notificationId || notification.id;
    
    try {
      // ✅ ÉTAPE 1 : Vérifier/créer l'entrée DB si nécessaire
      // Si la création DB a échoué dans NotificationOrchestrator, créer l'entrée ici
      if (notificationId) {
        let dbNotification = await this.repository.findById(notificationId);
        
        // ✅ CORRECTION : Créer l'entrée DB si elle n'existe pas (cas où création DB a échoué)
        if (!dbNotification) {
          this.logger.warn(`⚠️ Notification non trouvée en DB, création depuis la queue`, {
            id: notificationId,
            recipient: notification.recipient,
            type: notification.type
          });
          
          try {
            dbNotification = await this.repository.create({
              id: notificationId, // Utiliser l'ID de la queue
              recipientId: notification.recipient,
              channel: notification.type.toUpperCase() as any,
              templateId: notification.templateId,
              templateData: notification.variables,
              subject: notification.subject,
              content: notification.content,
              priority: (notification.priority?.toUpperCase() as any) || 'NORMAL',
              scheduledAt: notification.scheduledAt,
              metadata: notification.metadata
            });
            
            this.logger.info(`✅ Entrée DB créée depuis le worker`, {
              id: dbNotification.id,
              status: dbNotification.status
            });
          } catch (createError) {
            // Si la création DB échoue encore, continuer quand même (notification déjà dans la queue)
            this.logger.warn(`⚠️ Échec création DB depuis worker (non-bloquant)`, {
              id: notificationId,
              error: createError instanceof Error ? createError.message : 'Erreur inconnue',
              errorName: createError instanceof Error ? createError.name : undefined
            });
            // Ne pas throw : continuer le traitement même sans entrée DB
          }
        }
        
        // 2. Transition de statut si nécessaire
        if (dbNotification && dbNotification.status === 'SCHEDULED') {
          try {
            await this.repository.transitionScheduledToPending(notificationId);
          } catch (transitionError) {
            // Non-bloquant : continuer même si la transition échoue
            this.logger.warn(`⚠️ Échec transition SCHEDULED→PENDING (non-bloquant)`, {
              id: notificationId,
              error: transitionError instanceof Error ? transitionError.message : 'Erreur inconnue'
            });
          }
        }
        
        // 3. Marquer comme en cours d'envoi
        try {
          await this.repository.markAsSending(notificationId);
        } catch (markError) {
          // Non-bloquant : continuer même si le marquage échoue
          this.logger.warn(`⚠️ Échec marquage SENDING (non-bloquant)`, {
            id: notificationId,
            error: markError instanceof Error ? markError.message : 'Erreur inconnue'
          });
        }
      }
      
      // 2. Envoi via l'adapter (avec circuit breaker)
      const result = await this.circuitBreaker.call(async () => {
        const attachments = notification.metadata?.attachments || [];
        const cc = notification.metadata?.cc;
        const bcc = notification.metadata?.bcc;

        if (attachments.length > 0) {
          const attachmentSizes = attachments.map((att: any) => {
            let size = 0;
            if (att.content) {
              if (typeof att.content === 'string') {
                try {
                  size = Buffer.from(att.content, 'base64').length;
                } catch (e) {
                  size = att.content.length;
                }
              } else if (Buffer.isBuffer(att.content)) {
                size = att.content.length;
              } else {
                size = att.content.length || 0;
              }
            } else if (att.path) {
              size = -1;
            }
            return { filename: att.filename, size, isEmpty: size === 0 || size === 361 };
          });
          
          this.logger.info(`Email avec ${attachments.length} pièce(s) jointe(s)`, {
            filenames: attachments.map((att: any) => att.filename),
            totalSize: attachmentSizes.reduce((sum: number, att: any) => sum + (att.size > 0 ? att.size : 0), 0)
          });
          
          const emptyAttachments = attachmentSizes.filter((att: any) => att.isEmpty);
          if (emptyAttachments.length > 0) {
            this.logger.warn(`PDF(s) suspect(s) détecté(s) (taille <= 361 octets)`, {
              emptyAttachments: emptyAttachments.map((att: any) => ({ filename: att.filename, size: att.size }))
            });
          }
        }

        return await this.emailAdapter.sendEmail({
          to: notification.recipient,
          cc,
          bcc,
          subject: notification.subject || 'Notification',
          html: notification.content,
          /**
           * CORRECTION GMAIL - Préparation des attachments pour l'adapter email
           * 
           * Contexte : Les attachments peuvent arriver sous différents formats :
           * - String base64 (depuis la base de données)
           * - Buffer (depuis la génération de documents)
           * - Path (chemin de fichier, rare)
           * 
           * L'adapter email (`RobustEmailAdapter`) attend un format spécifique :
           * - String base64 OU Buffer pour le contenu
           * - L'adapter convertira ensuite en Buffer pour Nodemailer
           * 
           * Cette conversion intermédiaire est nécessaire car :
           * 1. Les notifications sont stockées en base avec content en base64
           * 2. L'adapter email doit convertir en Buffer pour Nodemailer
           * 3. Nodemailer gère ensuite l'encodage base64 pour le transport SMTP
           * 
           * Référence : Voir `RobustEmailAdapter.sendEmail()` pour la conversion finale
           * Test validé : 06/12/2025 - emails-groupes-regression-customer.test.ts ✅
           */
          attachments: attachments.map((att: any) => {
            let content: string | Buffer;
            
            if (att.path) {
              // Si on a un path, le laisser tel quel (Nodemailer lira le fichier)
              return {
                filename: att.filename,
                path: att.path,
                contentType: att.contentType || att.mimeType || 'application/pdf'
              };
            } else if (typeof att.content === 'string') {
              // Si c'est déjà une string (base64), la garder
              content = att.content;
            } else if (Buffer.isBuffer(att.content)) {
              // Si c'est un Buffer, le convertir en base64 string
              content = att.content.toString('base64');
            } else {
              // Fallback : essayer toString
              content = att.content?.toString('base64') || '';
            }
            
            return {
              filename: att.filename,
              content: content, // String base64 ou Buffer
              contentType: att.contentType || att.mimeType || 'application/pdf'
            };
          })
        });
      });
      
      const latencyMs = Date.now() - startTime;
      
      // ✅ ÉTAPE 3 : Mise à jour du statut selon le résultat (non-bloquant si DB échoue)
      if (notificationId) {
        if (result.success && result.result) {
          try {
            await this.repository.markAsSent(
              notificationId, 
              result.result.messageId,
              result.result,
              result.result.metadata?.cost
            );
          } catch (markError) {
            // Non-bloquant : l'email est déjà envoyé
            this.logger.warn(`⚠️ Échec marquage SENT (non-bloquant) - email déjà envoyé`, {
              id: notificationId,
              error: markError instanceof Error ? markError.message : 'Erreur inconnue'
            });
          }
          
          try {
            await this.eventBus.emit('notification.sent', {
              notificationId,
              recipientId: notification.recipient,
              channel: 'EMAIL',
              timestamp: new Date(),
              externalId: result.result.messageId,
              providerResponse: result.result,
              deliveryTime: latencyMs,
              cost: result.result.metadata?.cost || 0,
              metadata: notification.metadata
            } as NotificationSentEvent);
          } catch (eventError) {
            this.logger.warn(`⚠️ Échec émission événement sent (non-bloquant)`, {
              id: notificationId,
              error: eventError instanceof Error ? eventError.message : 'Erreur inconnue'
            });
          }
          
        } else {
          try {
            await this.repository.markAsFailed(
              notificationId, 
              result.error?.message || 'Email sending failed',
              result.error
            );
          } catch (markError) {
            // Non-bloquant : l'erreur est déjà loggée
            this.logger.warn(`⚠️ Échec marquage FAILED (non-bloquant)`, {
              id: notificationId,
              error: markError instanceof Error ? markError.message : 'Erreur inconnue'
            });
          }
          
          try {
            await this.eventBus.emit('notification.failed', {
              notificationId,
              recipientId: notification.recipient,
              channel: 'EMAIL',
              timestamp: new Date(),
              error: result.error?.message || 'Email sending failed',
              attempts: 1,
              maxAttempts: 3,
              canRetry: true,
              metadata: notification.metadata
            } as NotificationFailedEvent);
          } catch (eventError) {
            this.logger.warn(`⚠️ Échec émission événement failed (non-bloquant)`, {
              id: notificationId,
              error: eventError instanceof Error ? eventError.message : 'Erreur inconnue'
            });
          }
        }
      }
      
      // 4. Métriques
      this.metricsCollector.recordNotificationSent(
        'email', 
        result.result?.metadata?.provider || 'default',
        result.success,
        latencyMs
      );
      
      return {
        id: notification.id,
        success: result.success,
        messageId: (result.result as any)?.result?.messageId,
        error: result.error?.message,
        timestamp: new Date(),
        latencyMs,
        retryCount: 0,
        cost: result.result?.metadata?.cost || 0
      };
      
    } catch (error) {
      if (notificationId) {
        try {
          await this.repository.markAsFailed(
            notificationId,
            (error as Error).message
          );
        } catch (dbError) {
          this.logger.error('Failed to update notification status on error', { dbError });
        }
      }
      
      this.metricsCollector.recordNotificationError('email', 'smtp', (error as Error).message);
      throw error;
    }
  }

  /**
   * Traiter une notification SMS
   */
  private async processSmsNotification(notification: NotificationMessage): Promise<NotificationResult> {
    const startTime = Date.now();
    const notificationId = (notification as any).notificationId || notification.id;
    
    try {
      // ✅ ÉTAPE 1 : Vérifier/créer l'entrée DB si nécessaire
      if (notificationId) {
        let dbNotification = await this.repository.findById(notificationId);
        
        // ✅ CORRECTION : Créer l'entrée DB si elle n'existe pas
        if (!dbNotification) {
          this.logger.warn(`⚠️ Notification SMS non trouvée en DB, création depuis la queue`, {
            id: notificationId,
            recipient: notification.recipient
          });
          
          try {
            dbNotification = await this.repository.create({
              id: notificationId,
              recipientId: notification.recipient,
              channel: notification.type.toUpperCase() as any,
              templateId: notification.templateId,
              templateData: notification.variables,
              subject: notification.subject,
              content: notification.content,
              priority: (notification.priority?.toUpperCase() as any) || 'NORMAL',
              scheduledAt: notification.scheduledAt,
              metadata: notification.metadata
            });
            
            this.logger.info(`✅ Entrée DB SMS créée depuis le worker`, {
              id: dbNotification.id
            });
          } catch (createError) {
            this.logger.warn(`⚠️ Échec création DB SMS depuis worker (non-bloquant)`, {
              id: notificationId,
              error: createError instanceof Error ? createError.message : 'Erreur inconnue'
            });
          }
        }
        
        // 2. Transition de statut si nécessaire
        if (dbNotification && dbNotification.status === 'SCHEDULED') {
          try {
            await this.repository.transitionScheduledToPending(notificationId);
          } catch (transitionError) {
            this.logger.warn(`⚠️ Échec transition SCHEDULED→PENDING SMS (non-bloquant)`, {
              id: notificationId,
              error: transitionError instanceof Error ? transitionError.message : 'Erreur inconnue'
            });
          }
        }
        
        // 3. Marquer comme en cours d'envoi
        try {
          await this.repository.markAsSending(notificationId);
        } catch (markError) {
          this.logger.warn(`⚠️ Échec marquage SENDING SMS (non-bloquant)`, {
            id: notificationId,
            error: markError instanceof Error ? markError.message : 'Erreur inconnue'
          });
        }
      }
      
      const result = await this.circuitBreaker.call(async () => {
        return await this.smsAdapter.sendSms({
          to: notification.recipient,
          message: notification.content
        });
      });
      
      const latencyMs = Date.now() - startTime;
      
      // ✅ Mise à jour du statut selon le résultat (non-bloquant si DB échoue)
      if (notificationId) {
        if (result.success && result.result) {
          try {
            await this.repository.markAsSent(
              notificationId, 
              result.result.messageId,
              result.result,
              result.result.metadata?.cost
            );
          } catch (markError) {
            // Non-bloquant : le SMS est déjà envoyé
            this.logger.warn(`⚠️ Échec marquage SENT SMS (non-bloquant) - SMS déjà envoyé`, {
              id: notificationId,
              error: markError instanceof Error ? markError.message : 'Erreur inconnue'
            });
          }
        } else {
          try {
            await this.repository.markAsFailed(
              notificationId, 
              result.error?.message || 'SMS sending failed',
              result.error
            );
          } catch (markError) {
            // Non-bloquant : l'erreur est déjà loggée
            this.logger.warn(`⚠️ Échec marquage FAILED SMS (non-bloquant)`, {
              id: notificationId,
              error: markError instanceof Error ? markError.message : 'Erreur inconnue'
            });
          }
        }
      }
      
      this.metricsCollector.recordNotificationSent(
        'sms',
        result.result?.metadata?.provider || 'default',
        result.success,
        latencyMs
      );
      
      return {
        id: notification.id,
        success: result.success,
        messageId: (result.result as any)?.result?.messageId,
        error: result.error?.message,
        timestamp: new Date(),
        latencyMs,
        retryCount: 0,
        cost: result.result?.metadata?.cost || 0
      };
      
    } catch (error) {
      if (notificationId) {
        try {
          await this.repository.markAsFailed(
            notificationId,
            (error as Error).message
          );
        } catch (dbError) {
          this.logger.error('Failed to update notification status on error', { dbError });
        }
      }
      
      this.metricsCollector.recordNotificationError('sms', 'api', (error as Error).message);
      throw error;
    }
  }

  /**
   * Traiter une notification WhatsApp
   */
  private async processWhatsAppNotification(notification: NotificationMessage): Promise<NotificationResult> {
    const startTime = Date.now();
    const notificationId = (notification as any).notificationId || notification.id;

    try {
      // ✅ ÉTAPE 1 : Vérifier/créer l'entrée DB si nécessaire
      if (notificationId) {
        let dbNotification = await this.repository.findById(notificationId);
        
        // ✅ CORRECTION : Créer l'entrée DB si elle n'existe pas
        if (!dbNotification) {
          this.logger.warn(`⚠️ Notification WhatsApp non trouvée en DB, création depuis la queue`, {
            id: notificationId,
            recipient: notification.recipient
          });
          
          try {
            dbNotification = await this.repository.create({
              id: notificationId,
              recipientId: notification.recipient,
              channel: notification.type.toUpperCase() as any,
              templateId: notification.templateId,
              templateData: notification.variables,
              subject: notification.subject,
              content: notification.content,
              priority: (notification.priority?.toUpperCase() as any) || 'NORMAL',
              scheduledAt: notification.scheduledAt,
              metadata: notification.metadata
            });
            
            this.logger.info(`✅ Entrée DB WhatsApp créée depuis le worker`, {
              id: dbNotification.id
            });
          } catch (createError) {
            this.logger.warn(`⚠️ Échec création DB WhatsApp depuis worker (non-bloquant)`, {
              id: notificationId,
              error: createError instanceof Error ? createError.message : 'Erreur inconnue'
            });
          }
        }
        
        // 2. Transition de statut si nécessaire
        if (dbNotification && dbNotification.status === 'SCHEDULED') {
          try {
            await this.repository.transitionScheduledToPending(notificationId);
          } catch (transitionError) {
            this.logger.warn(`⚠️ Échec transition SCHEDULED→PENDING WhatsApp (non-bloquant)`, {
              id: notificationId,
              error: transitionError instanceof Error ? transitionError.message : 'Erreur inconnue'
            });
          }
        }
        
        // 3. Marquer comme en cours d'envoi
        try {
          await this.repository.markAsSending(notificationId);
        } catch (markError) {
          this.logger.warn(`⚠️ Échec marquage SENDING WhatsApp (non-bloquant)`, {
            id: notificationId,
            error: markError instanceof Error ? markError.message : 'Erreur inconnue'
          });
        }
      }

      const result = await this.circuitBreaker.call(async () => {
        const attachments = notification.metadata?.attachments || [];

        if (attachments.length > 0) {
          this.logger.info(`WhatsApp: ${attachments.length} pièce(s) jointe(s) à envoyer`);

          const textResult = await this.whatsAppAdapter.sendWhatsApp({
            to: notification.recipient,
            type: 'text',
            text: notification.content
          });

          for (const att of attachments) {
            try {
              const content = typeof att.content === 'string'
                ? att.content
                : att.content?.toString('base64');

              if (content) {
                const mediaId = await this.whatsAppAdapter.uploadMedia(
                  content,
                  att.contentType || att.mimeType || 'application/pdf',
                  att.filename
                );

                await this.whatsAppAdapter.sendWhatsApp({
                  to: notification.recipient,
                  type: 'media',
                  media: {
                    type: 'document',
                    id: mediaId,
                    filename: att.filename,
                    caption: `📄 ${att.filename}`
                  }
                });

                this.logger.info(`Document WhatsApp envoyé: ${att.filename}`);
              }
            } catch (attachError) {
              this.logger.error(`Erreur envoi document WhatsApp: ${att.filename}`, {
                error: (attachError as Error).message
              });
            }
          }

          return textResult;
        }

        return await this.whatsAppAdapter.sendWhatsApp({
          to: notification.recipient,
          type: 'text',
          text: notification.content
        });
      });
      
      const latencyMs = Date.now() - startTime;
      
      // ✅ Mise à jour du statut selon le résultat (non-bloquant si DB échoue)
      if (notificationId) {
        if (result.success && result.result) {
          try {
            await this.repository.markAsSent(
              notificationId, 
              result.result.messageId,
              result.result,
              result.result.metadata?.cost
            );
          } catch (markError) {
            // Non-bloquant : le WhatsApp est déjà envoyé
            this.logger.warn(`⚠️ Échec marquage SENT WhatsApp (non-bloquant) - WhatsApp déjà envoyé`, {
              id: notificationId,
              error: markError instanceof Error ? markError.message : 'Erreur inconnue'
            });
          }
        } else {
          try {
            await this.repository.markAsFailed(
              notificationId, 
              result.error?.message || 'WhatsApp sending failed',
              result.error
            );
          } catch (markError) {
            // Non-bloquant : l'erreur est déjà loggée
            this.logger.warn(`⚠️ Échec marquage FAILED WhatsApp (non-bloquant)`, {
              id: notificationId,
              error: markError instanceof Error ? markError.message : 'Erreur inconnue'
            });
          }
        }
      }
      
      this.metricsCollector.recordNotificationSent(
        'whatsapp',
        result.result?.metadata?.provider || 'meta',
        result.success,
        latencyMs
      );
      
      return {
        id: notification.id,
        success: result.success,
        messageId: (result.result as any)?.result?.messageId,
        error: result.error?.message,
        timestamp: new Date(),
        latencyMs,
        retryCount: 0,
        cost: result.result?.metadata?.cost || 0
      };
      
    } catch (error) {
      if (notificationId) {
        try {
          await this.repository.markAsFailed(
            notificationId,
            (error as Error).message
          );
        } catch (dbError) {
          this.logger.error('Failed to update notification status on error', { dbError });
        }
      }
      
      this.metricsCollector.recordNotificationError('whatsapp', 'api', (error as Error).message);
      throw error;
    }
  }

  /**
   * Traiter une notification de rappel programmé
   */
  private async processReminderNotification(reminderData: ReminderJobData): Promise<NotificationResult> {
    const startTime = Date.now();
    
    try {
      this.logger.info(`Processing reminder ${reminderData.reminderType} for booking ${reminderData.bookingId}`);
      
      if (!this.reminderHandler) {
        throw new Error('Reminder handler not configured');
      }

      let results: NotificationResult[] = [];
      
      switch (reminderData.reminderType) {
        case '7d':
          results = await this.reminderHandler.sendReminder7d(reminderData);
          break;
        case '24h':
          results = await this.reminderHandler.sendReminder24h(reminderData);
          break;
        case '1h':
          results = await this.reminderHandler.sendReminder1h(reminderData);
          break;
        default:
          throw new Error(`Unknown reminder type: ${reminderData.reminderType}`);
      }
      
      const latencyMs = Date.now() - startTime;
      const success = results.every(r => r.success);
      
      this.logger.info(`Reminder ${reminderData.reminderType} processed for booking ${reminderData.bookingId}`, {
        success,
        latencyMs,
        channels: results.length
      });
      
      return {
        id: results[0]?.id || `reminder_${Date.now()}`,
        success,
        messageId: results.map(r => r.messageId).filter(Boolean).join(','),
        error: results.find(r => !r.success)?.error,
        timestamp: new Date(),
        latencyMs,
        retryCount: 0
      };
      
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      
      this.logger.error(`Failed to process reminder ${reminderData.reminderType} for booking ${reminderData.bookingId}`, {
        error: (error as Error).message,
        latencyMs
      });
      
      return {
        id: `reminder_${Date.now()}`,
        success: false,
        error: (error as Error).message,
        timestamp: new Date(),
        latencyMs,
        retryCount: 0
      };
    }
  }
}

