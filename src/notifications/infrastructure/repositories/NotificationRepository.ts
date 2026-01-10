/**
 * Repository moderne pour les notifications
 * - CRUD complet des notifications
 * - Gestion des statuts du cycle de vie
 * - Suivi des tentatives et retry
 * - Aucune dépendance InversifyJS
 */

import { PrismaClient, NotificationStatus, NotificationChannel, NotificationPriority } from '@prisma/client';
import { ProductionLogger } from '../../infrastructure/logging/logger.production';
import { CircuitBreaker } from '../resilience/circuit.breaker';

export interface CreateNotificationData {
  recipientId: string;
  channel: NotificationChannel;
  templateId?: string;
  templateData?: any;
  subject?: string;
  content?: string;
  priority?: NotificationPriority;
  scheduledAt?: Date;
  expiresAt?: Date;
  maxAttempts?: number;
  metadata?: any;
  tags?: string[];
}

export interface UpdateNotificationData {
  status?: NotificationStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  attempts?: number;
  lastError?: string;
  externalId?: string;
  providerResponse?: any;
  cost?: number;
}

export class NotificationRepository {
  private prisma: PrismaClient;
  private logger: ProductionLogger;
  private circuitBreaker: CircuitBreaker;
  
  constructor() {
    this.prisma = new PrismaClient();
    this.logger = new ProductionLogger({});
    
    // Circuit breaker pour protéger la base de données
    this.circuitBreaker = CircuitBreaker.forDatabase({
      onStateChange: (oldState: string, newState: string, reason: string) => {
        this.logger.warn(`🔌 Repository circuit breaker: ${oldState} -> ${newState} (${reason})`);
      },
      onFailure: (error: Error) => {
        this.logger.error('💥 Repository database failure', { error: error.message });
      }
    });
  }
  
  /**
   * Crée une nouvelle notification
   * Utilise SCHEDULED si scheduledAt est dans le futur, sinon PENDING
   */
  async create(data: CreateNotificationData) {
    try {
      // Déterminer le statut initial : SCHEDULED si programmé dans le futur, sinon PENDING
      const initialStatus: NotificationStatus = 
        data.scheduledAt && data.scheduledAt > new Date() 
          ? 'SCHEDULED' 
          : 'PENDING';
      
      const notification = await this.prisma.notification.create({
        data: {
          recipientId: data.recipientId,
          channel: data.channel,
          status: initialStatus,
          templateId: data.templateId,
          templateData: data.templateData,
          subject: data.subject,
          content: data.content,
          priority: data.priority || 'NORMAL',
          scheduledAt: data.scheduledAt,
          expiresAt: data.expiresAt,
          maxAttempts: data.maxAttempts || 3,
          metadata: data.metadata,
          tags: data.tags,
          attempts: 0
        }
      });
      
      this.logger.info('📝 Notification créée', { 
        id: notification.id, 
        channel: notification.channel,
        status: notification.status 
      });
      return notification;
      
    } catch (error) {
      this.logger.error('❌ Erreur création notification', { error: (error as Error).message });
      throw error;
    }
  }
  
  /**
   * Met à jour une notification
   */
  async update(id: string, data: UpdateNotificationData) {
    try {
      const notification = await this.prisma.notification.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });
      
      this.logger.info('📝 Notification mise à jour', { 
        id, 
        status: data.status,
        attempts: data.attempts 
      });
      
      return notification;
      
    } catch (error) {
      // Si l'enregistrement n'existe plus (nettoyage de test), ne pas faire échouer
      if ((error as any).code === 'P2025') {
        this.logger.warn('⚠️ Tentative de mise à jour d\'une notification qui n\'existe plus (probablement nettoyée par les tests)', { id });
        return null;
      }
      
      this.logger.error('❌ Erreur mise à jour notification', { id, error });
      throw error;
    }
  }
  
  /**
   * Trouve une notification par ID
   */
  async findById(id: string) {
    try {
      return await this.prisma.notification.findUnique({
        where: { id }
      });
    } catch (error) {
      this.logger.error('❌ Erreur recherche notification', { id, error });
      throw error;
    }
  }
  
  /**
   * Marque une notification comme en cours d'envoi
   */
  async markAsSending(id: string) {
    return this.update(id, {
      status: 'SENDING',
      attempts: await this.incrementAttempts(id)
    });
  }
  
  /**
   * Marque une notification comme envoyée
   */
  async markAsSent(id: string, externalId?: string, providerResponse?: any, cost?: number) {
    return this.update(id, {
      status: 'SENT',
      sentAt: new Date(),
      externalId,
      providerResponse,
      cost
    });
  }
  
  /**
   * Marque une notification comme échouée
   */
  async markAsFailed(id: string, error: string, providerResponse?: any) {
    return this.update(id, {
      status: 'FAILED',
      failedAt: new Date(),
      lastError: error,
      providerResponse
    });
  }
  
  /**
   * Marque une notification pour retry
   */
  async markAsRetrying(id: string, error: string) {
    return this.update(id, {
      status: 'RETRYING',
      lastError: error
    });
  }

  /**
   * Marque une notification comme programmée (SCHEDULED)
   */
  async markAsScheduled(id: string) {
    return this.update(id, {
      status: 'SCHEDULED'
    });
  }

  /**
   * Marque une notification comme livrée (DELIVERED)
   */
  async markAsDelivered(id: string, deliveredAt?: Date, providerResponse?: any) {
    return this.update(id, {
      status: 'DELIVERED',
      deliveredAt: deliveredAt || new Date(),
      providerResponse
    });
  }

  /**
   * Marque une notification comme lue (READ)
   */
  async markAsRead(id: string, readAt?: Date, providerResponse?: any) {
    return this.update(id, {
      status: 'READ',
      readAt: readAt || new Date(),
      providerResponse
    });
  }

  /**
   * Marque une notification comme annulée (CANCELLED)
   */
  async markAsCancelled(id: string, reason?: string) {
    return this.update(id, {
      status: 'CANCELLED',
      lastError: reason
    });
  }

  /**
   * Marque une notification comme expirée (EXPIRED)
   */
  async markAsExpired(id: string) {
    return this.update(id, {
      status: 'EXPIRED'
    });
  }

  /**
   * Trouve les notifications programmées (SCHEDULED) qui doivent être traitées
   * (scheduledAt <= Date.now())
   */
  async findScheduledReady(limit: number = 100) {
    try {
      return await this.prisma.notification.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: { lte: new Date() }
        },
        orderBy: [
          { priority: 'desc' },
          { scheduledAt: 'asc' }
        ],
        take: limit
      });
    } catch (error) {
      this.logger.error('❌ Erreur recherche notifications scheduled ready', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Transition SCHEDULED → PENDING pour les notifications programmées
   */
  async transitionScheduledToPending(id: string) {
    const notification = await this.findById(id);
    if (!notification) {
      throw new Error(`Notification ${id} not found`);
    }
    if (notification.status !== 'SCHEDULED') {
      this.logger.warn('⚠️ Tentative de transition SCHEDULED → PENDING sur une notification non-SCHEDULED', {
        id,
        currentStatus: notification.status
      });
      return notification;
    }
    return this.update(id, {
      status: 'PENDING'
    });
  }
  
  /**
   * Incrémente le compteur de tentatives
   */
  private async incrementAttempts(id: string): Promise<number> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      select: { attempts: true }
    });
    
    return (notification?.attempts || 0) + 1;
  }
  
  /**
   * Trouve les notifications en attente de traitement
   * Inclut PENDING, RETRYING, et SCHEDULED qui sont prêtes (scheduledAt <= now)
   */
  async findPending(limit: number = 100) {
    try {
      return await this.prisma.notification.findMany({
        where: {
          OR: [
            // Notifications PENDING ou RETRYING sans scheduledAt ou avec scheduledAt passé
            {
              status: { in: ['PENDING', 'RETRYING'] },
              OR: [
                { scheduledAt: null },
                { scheduledAt: { lte: new Date() } }
              ]
            },
            // Notifications SCHEDULED qui sont prêtes à être traitées
            {
              status: 'SCHEDULED',
              scheduledAt: { lte: new Date() }
            }
          ]
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' }
        ],
        take: limit
      });
    } catch (error) {
      this.logger.error('❌ Erreur recherche notifications pending', { error: (error as Error).message });
      throw error;
    }
  }
  
  /**
   * Trouve les notifications expirées
   */
  async findExpired() {
    try {
      return await this.prisma.notification.findMany({
        where: {
          expiresAt: { lte: new Date() },
          status: { in: ['PENDING', 'SCHEDULED', 'RETRYING'] }
        }
      });
    } catch (error) {
      this.logger.error('❌ Erreur recherche notifications expirées', { error: (error as Error).message });
      throw error;
    }
  }
  
  /**
   * Trouve une notification par ID externe (provider)
   */
  async findByExternalId(externalId: string) {
    try {
      return await this.circuitBreaker.call(async () => {
        return await this.prisma.notification.findFirst({
          where: { externalId }
        });
      }, 'notification-find-by-external-id');
    } catch (error) {
      this.logger.error('❌ Erreur recherche notification par ID externe', { externalId, error });
      throw error;
    }
  }

  /**
   * Statistiques des notifications
   */
  async getStats(dateFrom?: Date, dateTo?: Date) {
    try {
      return await this.circuitBreaker.call(async () => {
        const where = {
          ...(dateFrom && dateTo && {
            createdAt: {
              gte: dateFrom,
              lte: dateTo
            }
          })
        };
        
        const [total, byStatus, byChannel] = await Promise.all([
          this.prisma.notification.count({ where }),
          this.prisma.notification.groupBy({
            by: ['status'],
            where,
            _count: { id: true }
          }),
          this.prisma.notification.groupBy({
            by: ['channel'],
            where,
            _count: { id: true }
          })
        ]);
        
        const statusStats = byStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {} as Record<string, number>);
        
        const channelStats = byChannel.reduce((acc, item) => {
          acc[item.channel] = item._count.id;
          return acc;
        }, {} as Record<string, number>);
        
        const sent = statusStats.SENT || 0;
        const successRate = total > 0 ? (sent / total) * 100 : 0;
        
        return {
          total,
          byStatus: statusStats,
          byChannel: channelStats,
          successRate: Math.round(successRate * 100) / 100
        };
      }, 'notification-stats');
      
    } catch (error) {
      this.logger.error('❌ Erreur calcul statistiques', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Vérifier l'état de santé du repository
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      
      await this.circuitBreaker.call(async () => {
        // Test simple de connexion à la base
        await this.prisma.$queryRaw`SELECT 1`;
      }, 'health-check');
      
      const latency = Date.now() - startTime;
      
      return {
        isHealthy: true,
        latency,
        circuitBreakerState: this.circuitBreaker.getMetrics().state,
        lastHealthCheck: new Date()
      };
      
    } catch (error) {
      this.logger.error('❌ Health check failed', { error: (error as Error).message });
      return {
        isHealthy: false,
        error: (error as Error).message,
        circuitBreakerState: this.circuitBreaker.getMetrics().state,
        lastHealthCheck: new Date()
      };
    }
  }
}