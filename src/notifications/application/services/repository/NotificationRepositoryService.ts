/**
 * NotificationRepositoryService - CRUD et gestion des notifications
 * 
 * Responsabilité unique : Opérations CRUD et gestion des notifications
 */

import { NotificationRepository } from '../../../infrastructure/repositories/NotificationRepository';
import { ProductionQueueManager } from '../../../infrastructure/queue/queue.manager.production';
import { ProductionLogger } from '../../../infrastructure/logging/logger.production';
import { NotificationMessage } from '../notification.service.production';

export class NotificationRepositoryService {
  private logger = new ProductionLogger('NotificationRepositoryService');

  constructor(
    private repository: NotificationRepository,
    private queueManager: ProductionQueueManager
  ) {}

  /**
   * Récupérer une notification par ID
   */
  async getNotificationById(id: string) {
    try {
      return await this.repository.findById(id);
    } catch (error) {
      this.logger.error('Failed to get notification by ID', { id, error });
      throw error;
    }
  }

  /**
   * Récupérer une notification par ID externe
   */
  async getNotificationByExternalId(externalId: string): Promise<NotificationMessage | null> {
    try {
      const circuitResult = await this.repository.findByExternalId(externalId);

      // Extraire le résultat du CircuitBreaker
      if (!circuitResult.success || !circuitResult.result) {
        return null;
      }

      const notification = circuitResult.result;

      this.logger.info('Notification trouvée par ID externe', {
        externalId,
        notificationId: notification.id,
        channel: notification.channel,
        status: notification.status
      });

      return {
        id: notification.id,
        type: notification.channel.toLowerCase() as 'email' | 'sms' | 'whatsapp',
        recipient: (notification as any).recipient_id || (notification as any).recipientId,
        subject: notification.subject || undefined,
        content: notification.content || '',
        templateId: (notification as any).template_id || (notification as any).templateId || undefined,
        templateData: (notification as any).template_data as Record<string, unknown> || undefined,
        variables: (notification as any).template_data as Record<string, unknown> || undefined,
        priority: notification.priority?.toLowerCase() as 'low' | 'normal' | 'high' | 'critical' || 'normal',
        scheduledAt: (notification as any).scheduled_at || (notification as any).scheduledAt || undefined,
        metadata: notification.metadata as Record<string, unknown> || undefined
      };
    } catch (error) {
      this.logger.error('Erreur recherche par ID externe', { externalId, error });
      throw error;
    }
  }

  /**
   * Obtenir les statistiques des notifications
   */
  async getNotificationStats(dateFrom?: Date, dateTo?: Date) {
    try {
      return await this.repository.getStats(dateFrom, dateTo);
    } catch (error) {
      this.logger.error('Failed to get notification stats', { error });
      throw error;
    }
  }

  /**
   * Nettoyer les notifications expirées
   */
  async cleanupExpiredNotifications(): Promise<number> {
    try {
      const expiredNotifications = await this.repository.findExpired();

      for (const notification of expiredNotifications) {
        try {
          // Marquer comme expirée plutôt que supprimer
          await this.repository.markAsExpired(notification.id);
        } catch (error) {
          this.logger.warn('Failed to mark notification as expired', {
            id: notification.id,
            error: (error as Error).message
          });
        }
      }

      if (expiredNotifications.length > 0) {
        this.logger.info(`${expiredNotifications.length} notifications marquées comme expirées`);
      }

      return expiredNotifications.length;
    } catch (error) {
      this.logger.error('Failed to cleanup expired notifications', { error });
      throw error;
    }
  }

  /**
   * Nettoyer les jobs échoués d'une queue spécifique
   */
  async cleanFailedJobs(queueName: string): Promise<void> {
    this.logger.info(`Cleaning failed jobs from queue '${queueName}'`);
    
    try {
      const queue = this.queueManager.getQueue(queueName);
      
      const failedJobs = await queue.getFailed(0, -1);
      let cleanedCount = 0;
      
      for (const job of failedJobs) {
        try {
          await job.remove();
          cleanedCount++;
        } catch (error) {
          this.logger.warn(`Failed to remove job ${job.id}`, { error: (error as Error).message });
        }
      }
      
      this.logger.info(`Cleaned ${cleanedCount} failed jobs from queue '${queueName}'`);
    } catch (error) {
      this.logger.error(`Error cleaning failed jobs from queue '${queueName}'`, { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Attendre que toutes les queues soient vides
   */
  async waitForQueuesToComplete(timeoutMs: number = 30000, checkIntervalMs: number = 500): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const stats = await this.queueManager.getGlobalStats();
      const allQueuesEmpty = Object.values(stats).every((queueStats: any) => 
        queueStats.waiting === 0 && queueStats.active === 0
      );
      
      if (allQueuesEmpty) {
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
    }
    
    return false;
  }
}

