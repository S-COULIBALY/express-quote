/**
 * Repository pour les rappels programmés (scheduled_reminders)
 * - CRUD complet des rappels
 * - Gestion des statuts du cycle de vie (SCHEDULED → PROCESSING → SENT/FAILED)
 * - Suivi des tentatives et retry
 */

import { PrismaClient, ReminderStatus, ReminderType, NotificationPriority } from '@prisma/client';
import { ProductionLogger } from '../../infrastructure/logging/logger.production';
import { CircuitBreaker } from '../resilience/circuit.breaker';

export interface CreateScheduledReminderData {
  bookingId: string;
  professionalId?: string;
  attributionId?: string;
  reminderType: ReminderType;
  scheduledDate: Date;
  serviceDate: Date;
  recipientEmail: string;
  recipientPhone?: string;
  fullClientData: any;
  priority?: NotificationPriority;
  maxAttempts?: number;
  metadata?: any;
}

export interface UpdateScheduledReminderData {
  status?: ReminderStatus;
  sentAt?: Date;
  cancelReason?: string;
  attempts?: number;
  lastError?: string;
  nextRetryAt?: Date;
  metadata?: any;
}

export class ScheduledReminderRepository {
  private prisma: PrismaClient;
  private logger: ProductionLogger;
  private circuitBreaker: CircuitBreaker;
  
  constructor() {
    this.prisma = new PrismaClient();
    this.logger = new ProductionLogger({});
    
    // Circuit breaker pour protéger la base de données
    this.circuitBreaker = CircuitBreaker.forDatabase({
      onStateChange: (oldState: string, newState: string, reason: string) => {
        this.logger.warn(`🔌 ScheduledReminderRepository circuit breaker: ${oldState} -> ${newState} (${reason})`);
      },
      onFailure: (error: Error) => {
        this.logger.error('💥 ScheduledReminderRepository database failure', { error: error.message });
      }
    });
  }
  
  /**
   * Crée un nouveau rappel programmé
   */
  async create(data: CreateScheduledReminderData) {
    try {
      const reminder = await this.prisma.scheduled_reminders.create({
        data: {
          booking_id: data.bookingId,
          professional_id: data.professionalId,
          attribution_id: data.attributionId,
          reminder_type: data.reminderType,
          scheduled_date: data.scheduledDate,
          service_date: data.serviceDate,
          recipient_email: data.recipientEmail,
          recipient_phone: data.recipientPhone,
          full_client_data: data.fullClientData,
          status: 'SCHEDULED', // Statut par défaut
          priority: data.priority || 'NORMAL',
          max_attempts: data.maxAttempts || 3,
          attempts: 0,
          metadata: data.metadata || {},
          updated_at: new Date()
        } as any
      });
      
      this.logger.info('📝 Rappel programmé créé', { 
        id: reminder.id, 
        reminderType: (reminder as any).reminder_type,
        scheduledDate: (reminder as any).scheduled_date 
      });
      return reminder;
      
    } catch (error) {
      this.logger.error('❌ Erreur création rappel programmé', { error: (error as Error).message });
      throw error;
    }
  }
  
  /**
   * Met à jour un rappel programmé
   */
  async update(id: string, data: UpdateScheduledReminderData) {
    try {
      const reminder = await this.prisma.scheduled_reminders.update({
        where: { id },
        data: {
          ...data,
          updated_at: new Date()
        }
      });
      
      this.logger.info('📝 Rappel programmé mis à jour', { 
        id, 
        status: data.status,
        attempts: data.attempts 
      });
      
      return reminder;
      
    } catch (error) {
      if ((error as any).code === 'P2025') {
        this.logger.warn('⚠️ Tentative de mise à jour d\'un rappel qui n\'existe plus', { id });
        return null;
      }
      
      this.logger.error('❌ Erreur mise à jour rappel programmé', { id, error });
      throw error;
    }
  }
  
  /**
   * Trouve un rappel par ID
   */
  async findById(id: string) {
    try {
      return await this.prisma.scheduled_reminders.findUnique({
        where: { id }
      });
    } catch (error) {
      this.logger.error('❌ Erreur recherche rappel', { id, error });
      throw error;
    }
  }

  /**
   * Marque un rappel comme en cours de traitement (PROCESSING)
   * Transition: SCHEDULED → PROCESSING
   */
  async markAsProcessing(id: string) {
    const reminder = await this.findById(id);
    if (!reminder) {
      throw new Error(`Rappel ${id} not found`);
    }
    if (reminder.status !== 'SCHEDULED') {
      this.logger.warn('⚠️ Tentative de transition SCHEDULED → PROCESSING sur un rappel non-SCHEDULED', {
        id,
        currentStatus: reminder.status
      });
      return reminder;
    }
    
    return this.update(id, {
      status: 'PROCESSING',
      attempts: await this.incrementAttempts(id)
    });
  }

  /**
   * Marque un rappel comme envoyé (SENT)
   * Transition: PROCESSING → SENT
   */
  async markAsSent(id: string) {
    const reminder = await this.findById(id);
    if (!reminder) {
      throw new Error(`Rappel ${id} not found`);
    }
    if (reminder.status !== 'PROCESSING') {
      this.logger.warn('⚠️ Tentative de transition PROCESSING → SENT sur un rappel non-PROCESSING', {
        id,
        currentStatus: reminder.status
      });
      return reminder;
    }
    
    return this.update(id, {
      status: 'SENT',
      sent_at: new Date()
    } as any);
  }

  /**
   * Marque un rappel comme échoué (FAILED)
   * Transition: PROCESSING → FAILED
   */
  async markAsFailed(id: string, error: string) {
    return this.update(id, {
      status: 'FAILED',
      lastError: error
    });
  }

  /**
   * Marque un rappel comme annulé (CANCELLED)
   * Transition: SCHEDULED → CANCELLED ou PROCESSING → CANCELLED
   */
  async markAsCancelled(id: string, reason?: string) {
    return this.update(id, {
      status: 'CANCELLED',
      cancelReason: reason
    });
  }

  /**
   * Marque un rappel comme expiré (EXPIRED)
   * Transition: SCHEDULED → EXPIRED ou PROCESSING → EXPIRED
   */
  async markAsExpired(id: string) {
    return this.update(id, {
      status: 'EXPIRED'
    });
  }

  /**
   * Incrémente le compteur de tentatives
   */
  private async incrementAttempts(id: string): Promise<number> {
    const reminder = await this.findById(id);
    return (reminder?.attempts || 0) + 1;
  }

  /**
   * Trouve les rappels programmés qui doivent être traités
   * (scheduledDate <= Date.now() et status = SCHEDULED)
   */
  async findScheduledReady(limit: number = 100) {
    try {
      return await this.prisma.scheduled_reminders.findMany({
        where: {
          status: 'SCHEDULED',
          scheduled_date: { lte: new Date() }
        },
        orderBy: [
          { priority: 'desc' },
          { scheduled_date: 'asc' }
        ],
        take: limit
      });
    } catch (error) {
      this.logger.error('❌ Erreur recherche rappels scheduled ready', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Trouve les rappels expirés
   * (scheduledDate passé depuis longtemps et status = SCHEDULED ou PROCESSING)
   */
  async findExpired(expirationHours: number = 24) {
    try {
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() - expirationHours);
      
      return await this.prisma.scheduled_reminders.findMany({
        where: {
          status: { in: ['SCHEDULED', 'PROCESSING'] },
          scheduled_date: { lt: expirationDate }
        }
      });
    } catch (error) {
      this.logger.error('❌ Erreur recherche rappels expirés', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Trouve les rappels par bookingId
   */
  async findByBookingId(bookingId: string) {
    try {
      return await this.prisma.scheduled_reminders.findMany({
        where: { booking_id: bookingId },
        orderBy: { scheduled_date: 'asc' }
      });
    } catch (error) {
      this.logger.error('❌ Erreur recherche rappels par bookingId', { bookingId, error });
      throw error;
    }
  }

  /**
   * Trouve les rappels par attributionId
   */
  async findByAttributionId(attributionId: string) {
    try {
      return await this.prisma.scheduled_reminders.findMany({
        where: { attribution_id: attributionId },
        orderBy: { scheduled_date: 'asc' }
      });
    } catch (error) {
      this.logger.error('❌ Erreur recherche rappels par attributionId', { attributionId, error });
      throw error;
    }
  }

  /**
   * Statistiques des rappels
   */
  async getStats(dateFrom?: Date, dateTo?: Date) {
    try {
      return await this.circuitBreaker.call(async () => {
        const where = {
          ...(dateFrom && dateTo && {
            created_at: {
              gte: dateFrom,
              lte: dateTo
            }
          })
        };
        
        const [total, byStatus, byType] = await Promise.all([
          this.prisma.scheduled_reminders.count({ where }),
          this.prisma.scheduled_reminders.groupBy({
            by: ['status'],
            where,
            _count: { id: true }
          }),
          this.prisma.scheduled_reminders.groupBy({
            by: ['reminder_type'],
            where,
            _count: { id: true }
          })
        ]);
        
        const statusStats = byStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {} as Record<string, number>);
        
        const typeStats = byType.reduce((acc, item) => {
          acc[(item as any).reminder_type] = item._count.id;
          return acc;
        }, {} as Record<string, number>);
        
        const sent = statusStats.SENT || 0;
        const successRate = total > 0 ? (sent / total) * 100 : 0;
        
        return {
          total,
          byStatus: statusStats,
          byType: typeStats,
          successRate: Math.round(successRate * 100) / 100
        };
      }, 'scheduled-reminder-stats');
      
    } catch (error) {
      this.logger.error('❌ Erreur calcul statistiques rappels', { error: (error as Error).message });
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

