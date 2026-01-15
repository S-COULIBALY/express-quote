/**
 * NotificationOrchestrator - Orchestration principale des notifications
 * 
 * Responsabilité unique : Orchestration du flux de notification (persistance, template, validation, queue)
 */

import { NotificationRepository } from '../../../infrastructure/repositories/NotificationRepository';
import { ProductionQueueManager } from '../../../infrastructure/queue/queue.manager.production';
import { RateLimiter } from '../../../infrastructure/security/rate.limiter';
import { MetricsCollector } from '../../../infrastructure/monitoring/metrics.collector';
import { ModernEventBus, NotificationCreatedEvent } from '../../../infrastructure/events/modern.event.bus';
import { ProductionLogger } from '../../../infrastructure/logging/logger.production';
import { NotificationMessage, NotificationResult, BulkNotificationRequest } from '../notification.service.production';
import { TemplateService } from '../templates/TemplateService';
import { NotificationValidator } from '../validators/NotificationValidator';

export class NotificationOrchestrator {
  private logger = new ProductionLogger({ service: 'NotificationOrchestrator' });

  constructor(
    private repository: NotificationRepository,
    private templateService: TemplateService,
    private validator: NotificationValidator,
    private queueManager: ProductionQueueManager,
    private rateLimiter: RateLimiter,
    private metricsCollector: MetricsCollector,
    private eventBus: ModernEventBus
  ) {}

  /**
   * Envoyer une notification (orchestration complète)
   * 
   * ✅ CORRECTION : Ordre inversé pour résistance aux erreurs DB
   * - Queue d'abord (résistant aux erreurs DB)
   * - DB après (non-bloquant)
   * 
   * Cette modification résout le problème où les notifications client/équipe interne
   * échouaient lorsque la DB était saturée, alors que les prestataires fonctionnaient
   * car ils étaient notifiés avant la saturation.
   */
  async sendNotification(notification: NotificationMessage): Promise<NotificationResult> {
    const startTime = Date.now();
    
    try {
      this.logger.debug(`Starting sendNotification`, {
        id: notification.id,
        type: notification.type,
        templateId: notification.templateId
      });
      
      // ✅ ÉTAPE 1 : Générer un ID temporaire si nécessaire (pour template/validation)
      // L'ID sera utilisé pour la queue et la DB
      if (!notification.id) {
        notification.id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // ✅ ÉTAPE 2 : Application du template (avant validation et queue)
      if (notification.templateId) {
        try {
          notification = await this.templateService.applyTemplate(notification);
        } catch (templateError) {
          this.logger.error(`Template application failed`, {
            id: notification.id,
            templateId: notification.templateId,
            error: (templateError as Error).message,
            stack: (templateError as Error).stack
          });
          throw templateError;
        }
      }
      
      // ✅ ÉTAPE 3 : Validation et nettoyage du contenu
      try {
        await this.validator.validateAndSanitizeNotification(notification);
      } catch (validationError) {
        this.logger.error(`Validation failed`, {
          id: notification.id,
          error: (validationError as Error).message,
          stack: (validationError as Error).stack
        });
        throw validationError;
      }
      
      // ✅ ÉTAPE 4 : Rate limiting (désactivé en test)
      if (process.env.NODE_ENV !== 'test') {
        const rateLimitResult = await this.rateLimiter.checkLimit({
          userId: notification.metadata?.userId || 'default-user',
          ip: notification.metadata?.ip || '127.0.0.1'
        });
        
        if (!rateLimitResult.allowed) {
          this.logger.warn(`Rate limit exceeded`, {
            id: notification.id,
            retryAfter: rateLimitResult.retryAfter
          });
          // ⚠️ Note : On ne peut pas marquer comme failed dans la DB car on n'a pas encore créé l'entrée
          // Le rate limiting bloque avant l'ajout à la queue, donc c'est OK
          throw new Error(`Rate limit exceeded. Retry after ${rateLimitResult.retryAfter} seconds`);
        }
      }
      
      // ✅ ÉTAPE 5 : Ajout à la queue BullMQ D'ABORD (résistant aux erreurs DB)
      // Cette étape est critique : elle garantit que la notification est toujours envoyée
      // même si la création DB échoue ensuite
      const priority = this.getPriorityValue(notification.priority || 'normal');
      const delay = notification.scheduledAt ? 
        Math.max(0, notification.scheduledAt.getTime() - Date.now()) : 0;
      
      let queueJob;
      try {
        queueJob = await this.queueManager.addJob(notification.type, 'send', {
          id: notification.id,
          type: notification.type,
          recipient: notification.recipient,
          subject: notification.subject,
          content: notification.content,
          templateId: notification.templateId,
          templateData: notification.templateData || notification.variables,
          priority: this.getPriorityValue(notification.priority || 'normal'),
          metadata: notification.metadata
        }, {
          priority,
          delay
        });
        
        this.logger.info(`✅ Notification ajoutée à la queue (résistant aux erreurs DB)`, {
          id: notification.id,
          queueType: notification.type,
          queueJobId: queueJob.id
        });
      } catch (queueError) {
        this.logger.error(`Failed to add job to queue`, {
          id: notification.id,
          queueType: notification.type,
          error: (queueError as Error).message,
          stack: (queueError as Error).stack
        });
        throw queueError;
      }
      
      // ✅ ÉTAPE 6 : Création DB APRÈS l'ajout à la queue (non-bloquant)
      // Si la création DB échoue, ce n'est pas bloquant car la notification est déjà dans la queue
      // Le worker BullMQ créera l'entrée DB lors du traitement si nécessaire
      try {
        const dbNotification = await this.repository.create({
          recipientId: notification.recipient,
          channel: notification.type.toUpperCase() as 'EMAIL' | 'SMS' | 'WHATSAPP',
          templateId: notification.templateId,
          templateData: notification.variables,
          subject: notification.subject,
          content: notification.content,
          priority: notification.priority === 'critical' ? 'URGENT' : (notification.priority?.toUpperCase() as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT') || 'NORMAL',
          scheduledAt: notification.scheduledAt,
          metadata: { ...notification.metadata, originalId: notification.id }
        });
        
        this.logger.debug(`✅ Entrée DB créée`, {
          id: dbNotification.id,
          status: dbNotification.status
        });
        
        // Note: Le contenu du template est stocké dans metadata lors de la création
        // Pas besoin de mise à jour supplémentaire
      } catch (dbError) {
        // ⚠️ NON-BLOQUANT : La notification est déjà dans la queue
        // Le worker BullMQ créera l'entrée DB lors du traitement si nécessaire
        this.logger.warn(`⚠️ Échec création DB (non-bloquant) - notification déjà dans la queue`, {
          id: notification.id,
          queueJobId: queueJob?.id,
          error: dbError instanceof Error ? dbError.message : 'Erreur inconnue',
          errorName: dbError instanceof Error ? dbError.name : undefined,
          // Log détaillé pour debugging
          isConnectionError: dbError instanceof Error && (
            dbError.message.includes('Too many database connections') ||
            dbError.message.includes('connection') ||
            dbError.name === 'PrismaClientInitializationError'
          )
        });
        
        // Ne pas throw : la notification est déjà dans la queue et sera traitée
        // On continue le flux normalement
      }
      
      const latencyMs = Date.now() - startTime;
      
      // ✅ ÉTAPE 7 : Métriques et événements (après ajout à la queue)
      // Ces opérations fonctionnent même si la création DB a échoué
      this.metricsCollector.recordMetric('notification.queued', 1, {
        type: notification.type,
        priority: notification.priority || 'normal'
      });
      
      try {
        await this.eventBus.emit('notification.created', {
          notificationId: notification.id,
          recipientId: notification.recipient,
          channel: notification.type.toUpperCase() as 'EMAIL' | 'SMS' | 'WHATSAPP',
          timestamp: new Date(),
          templateId: notification.templateId,
          templateData: notification.templateData,
          priority: (notification.priority?.toUpperCase() as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT') || 'NORMAL',
          metadata: notification.metadata
        } as NotificationCreatedEvent);
      } catch (eventError) {
        this.logger.warn(`Failed to emit notification.created event (non-blocking)`, {
          id: notification.id,
          error: (eventError as Error).message
        });
      }
      
      this.logger.info(`✅ Notification créée et ajoutée à la queue`, {
        id: notification.id,
        type: notification.type,
        queueJobId: queueJob?.id,
        status: delay > 0 ? 'SCHEDULED' : 'PENDING'
      });
      
      return {
        id: notification.id,
        success: true,
        timestamp: new Date(),
        latencyMs,
        retryCount: 0
      };
      
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      
      // ✅ CORRECTION : Ne pas essayer de marquer comme failed dans la DB si elle n'existe pas encore
      // Si l'erreur survient avant l'ajout à la queue, il n'y a pas d'entrée DB à mettre à jour
      // Si l'erreur survient après l'ajout à la queue, la notification sera traitée par le worker
      if (notification.id) {
        try {
          // Essayer de marquer comme failed seulement si l'entrée DB existe
          // Sinon, le worker gérera l'erreur lors du traitement
          await this.repository.markAsFailed(notification.id, (error as Error).message);
        } catch (dbError) {
          // Non-bloquant : l'entrée DB peut ne pas exister (si erreur avant création DB)
          // ou la DB peut être saturée (si erreur après ajout à la queue)
          this.logger.warn('⚠️ Échec mise à jour statut failed (non-bloquant)', { 
            id: notification.id,
            dbError: dbError instanceof Error ? dbError.message : 'Erreur inconnue'
          });
        }
      }
      
      this.logger.error(`Failed to queue notification`, {
        id: notification.id,
        type: notification.type,
        templateId: notification.templateId,
        recipient: notification.recipient,
        error: (error as Error).message,
        stack: (error as Error).stack,
        errorName: (error as Error).name
      });
      
      this.metricsCollector.recordNotificationError(
        notification.type, 
        'queue', 
        (error as Error).message
      );
      
      return {
        id: notification.id,
        success: false,
        error: (error as Error).message,
        timestamp: new Date(),
        latencyMs,
        retryCount: 0
      };
    }
  }

  /**
   * Envoyer des notifications en lot
   */
  async sendBulkNotifications(request: BulkNotificationRequest): Promise<NotificationResult[]> {
    const { notifications, batchSize = 100, delayBetweenBatches = 1000 } = request;
    const results: NotificationResult[] = [];
    
    this.logger.info(`Starting bulk notification send`, {
      total: notifications.length,
      batchSize
    });
    
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(notification => this.sendNotification(notification))
      );
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            id: batch[index].id,
            success: false,
            error: result.reason.message,
            timestamp: new Date(),
            latencyMs: 0,
            retryCount: 0
          });
        }
      });
      
      if (i + batchSize < notifications.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    this.logger.info(`Bulk notification completed`, {
      total: results.length,
      success: successCount,
      failures: failureCount
    });
    
    return results;
  }

  /**
   * Convertir une priorité en valeur numérique pour BullMQ
   */
  private getPriorityValue(priority: string): number {
    switch (priority) {
      case 'critical': return 1;
      case 'high': return 5;
      case 'normal': return 10;
      case 'low': return 15;
      default: return 10;
    }
  }
}

