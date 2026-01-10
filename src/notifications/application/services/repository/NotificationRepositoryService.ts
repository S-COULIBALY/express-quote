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
      const notifications = await this.repository.findByExternalId(externalId);
      
      if (notifications.length === 0) {
        return null;
      }
      
      const notification = notifications[0];
      
      this.logger.info('Notification trouvée par ID externe', {
        externalId,
        notificationId: notification.id,
        channel: notification.channel,
        status: notification.status
      });
      
      return {
        id: notification.id,
        type: notification.channel.toLowerCase() as 'email' | 'sms' | 'whatsapp',
        recipient: notification.recipient_id,
        subject: notification.subject || undefined,
        content: notification.content || '',
        templateId: notification.template_id || undefined,
        templateData: notification.template_data as Record<string, any> || undefined,
        variables: notification.template_data as Record<string, any> || undefined,
        priority: notification.priority?.toLowerCase() as any || 'normal',
        scheduledAt: notification.scheduled_at || undefined,
        metadata: notification.metadata as Record<string, any> || undefined
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
          await this.repository.delete(notification.id);
        } catch (error) {
          this.logger.warn('Failed to delete expired notification', {
            id: notification.id,
            error: (error as Error).message
          });
        }
      }
      
      if (expiredNotifications.length > 0) {
        this.logger.info(`${expiredNotifications.length} notifications expirées nettoyées`);
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

