/**
 * Événement émis lors de l'expiration d'une notification
 * 
 * Utilité :
 * - Nettoyage automatique des notifications expirées
 * - Audit trail des notifications non livrées
 * - Déclenchement d'actions de fallback
 * - Métriques de performance et qualité
 * - Alertes sur les problèmes de livraison
 * 
 * Configuration :
 * - Raison de l'expiration (timeout, TTL, échec repeated)
 * - Actions de nettoyage automatique
 * - Notification des administrateurs si critique
 * - Archivage des données importantes
 * 
 * Pourquoi ce choix :
 * - Évite l'accumulation de notifications orphelines
 * - Permet le monitoring de la qualité de service
 * - Déclenche des actions correctives automatiques
 * - Maintient l'intégrité du système
 */

import { DomainEvent } from '../interfaces';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

/**
 * Raisons possibles d'expiration d'une notification
 */
export type ExpirationReason = 
  | 'ttl_expired'           // TTL (Time To Live) dépassé
  | 'max_retries_exceeded'  // Nombre maximum de tentatives atteint
  | 'recipient_unreachable' // Destinataire injoignable définitivement
  | 'content_outdated'      // Contenu devenu obsolète (ex: promo expirée)
  | 'manual_expiration'     // Expiration manuelle par admin
  | 'system_cleanup'        // Nettoyage automatique du système
  | 'invalid_recipient'     // Destinataire invalide détecté
  | 'service_discontinued'; // Service/canal discontinué

/**
 * Actions de nettoyage à effectuer
 */
export interface CleanupActions {
  archiveNotification: boolean;
  removeFromQueue: boolean;
  notifyAdmins: boolean;
  updateRecipientStatus: boolean;
  triggerFallback: boolean;
  logMetrics: boolean;
}

/**
 * Données de l'événement d'expiration
 */
export interface NotificationExpiredData {
  notificationId: string;
  recipientId: string;
  channel: 'email' | 'whatsapp' | 'sms';
  templateId?: string;
  
  // Détails de l'expiration
  expirationReason: ExpirationReason;
  expiredAt: Date;
  originalExpiryDate?: Date; // Date d'expiration initiale
  
  // Historique de la notification
  createdAt: Date;
  scheduledAt?: Date;
  firstAttemptAt?: Date;
  lastAttemptAt?: Date;
  totalAttempts: number;
  
  // Contexte de l'expiration
  finalStatus: 'pending' | 'sending' | 'failed' | 'scheduled';
  lastError?: {
    message: string;
    type: string;
    timestamp: Date;
  };
  
  // Actions prises
  cleanupActions: CleanupActions;
  fallbackNotificationId?: string; // Si une notification de fallback a été créée
  
  // Métriques
  timeToExpiration: number; // Durée de vie en millisecondes
  costIncurred?: number; // Coût engagé avant expiration
  
  // Métadonnées d'expiration
  expirationMetadata: {
    triggeredBy: 'cron_job' | 'manual_action' | 'system_event' | 'cascade_cleanup';
    cleanupJobId?: string;
    adminUserId?: string;
    systemVersion: string;
    notes?: string;
  };
}

/**
 * Contexte du système au moment de l'expiration
 */
export interface ExpirationContext {
  systemMetrics: {
    totalExpiredToday: number;
    expirationRate: number; // Pourcentage d'expiration sur 24h
    queueDepth: number;
    systemLoad: 'low' | 'normal' | 'high';
  };
  
  channelStatus: {
    isHealthy: boolean;
    lastSuccessfulDelivery?: Date;
    errorRate: number;
  };
  
  recipientHistory: {
    totalNotifications: number;
    successfulDeliveries: number;
    previousExpirations: number;
    isBlacklisted: boolean;
  };
}

// ============================================================================
// ÉVÉNEMENT PRINCIPAL
// ============================================================================

/**
 * Événement de domaine pour l'expiration d'une notification
 * 
 * Responsabilités :
 * - Documenter la fin de vie d'une notification
 * - Déclencher les actions de nettoyage
 * - Alimenter les métriques de qualité
 * - Initier les processus de fallback
 * - Maintenir l'audit trail complet
 */
export class NotificationExpired implements DomainEvent<NotificationExpiredData> {
  public readonly eventId: string;
  public readonly eventType: string = 'NotificationExpired';
  public readonly version: string = '1.0';
  public readonly timestamp: Date;
  public readonly aggregateId: string;
  public readonly aggregateType: string = 'Notification';
  public readonly sequenceNumber: number;
  public readonly payload: NotificationExpiredData;
  public readonly correlationId?: string;

  public readonly metadata: {
    source: string;
    userId?: string;
    sessionId?: string;
    traceId?: string;
    context?: Record<string, any>;
  };

  constructor(
    notificationId: string,
    payload: NotificationExpiredData,
    context: ExpirationContext,
    options: {
      correlationId?: string;
      sequenceNumber?: number;
      userId?: string;
      sessionId?: string;
      traceId?: string;
    } = {}
  ) {
    this.eventId = `exp_${notificationId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.timestamp = new Date();
    this.aggregateId = notificationId;
    this.sequenceNumber = options.sequenceNumber || Date.now();
    this.correlationId = options.correlationId;
    this.payload = {
      ...payload,
      notificationId,
      expiredAt: this.timestamp
    };

    this.metadata = {
      source: 'NotificationSystem',
      userId: options.userId,
      sessionId: options.sessionId,
      traceId: options.traceId,
      context: {
        expirationContext: context,
        eventGeneratedAt: this.timestamp.toISOString(),
        systemVersion: process.env.npm_package_version || '1.0.0'
      }
    };

    // Calcul automatique du temps d'expiration
    this.payload.timeToExpiration = this.timestamp.getTime() - this.payload.createdAt.getTime();

    // Validation des données critiques
    this.validate();
  }

  // ============================================================================
  // MÉTHODES DE VALIDATION
  // ============================================================================

  /**
   * Valide la cohérence des données de l'événement
   */
  private validate(): void {
    if (!this.payload.notificationId) {
      throw new Error('NotificationExpired: notificationId is required');
    }

    if (!this.payload.recipientId) {
      throw new Error('NotificationExpired: recipientId is required');
    }

    if (!this.payload.channel) {
      throw new Error('NotificationExpired: channel is required');
    }

    if (!this.payload.expirationReason) {
      throw new Error('NotificationExpired: expirationReason is required');
    }

    if (!this.payload.createdAt) {
      throw new Error('NotificationExpired: createdAt is required');
    }

    if (this.payload.createdAt > this.timestamp) {
      throw new Error('NotificationExpired: createdAt cannot be in the future');
    }

    if (this.payload.totalAttempts < 0) {
      throw new Error('NotificationExpired: totalAttempts must be non-negative');
    }

    if (!this.payload.cleanupActions) {
      throw new Error('NotificationExpired: cleanupActions is required');
    }
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES
  // ============================================================================

  /**
   * Indique si l'expiration était prévisible (TTL vs échec)
   */
  public isPredictableExpiration(): boolean {
    return ['ttl_expired', 'content_outdated', 'manual_expiration'].includes(this.payload.expirationReason);
  }

  /**
   * Indique si c'est un échec de livraison
   */
  public isDeliveryFailure(): boolean {
    return ['max_retries_exceeded', 'recipient_unreachable', 'invalid_recipient'].includes(this.payload.expirationReason);
  }

  /**
   * Indique si une notification de fallback doit être créée
   */
  public shouldCreateFallback(): boolean {
    return this.payload.cleanupActions.triggerFallback && 
           this.isDeliveryFailure() && 
           this.payload.channel !== 'sms'; // SMS est souvent le dernier fallback
  }

  /**
   * Indique si les administrateurs doivent être notifiés
   */
  public requiresAdminNotification(): boolean {
    return this.payload.cleanupActions.notifyAdmins ||
           (this.isDeliveryFailure() && this.payload.totalAttempts > 0) ||
           this.payload.expirationReason === 'service_discontinued';
  }

  /**
   * Calcule le taux de succès de cette notification
   */
  public getSuccessRate(): number {
    if (this.payload.totalAttempts === 0) return 0;
    // Une notification expirée a un taux de succès de 0
    return 0;
  }

  /**
   * Calcule la durée de vie effective
   */
  public getEffectiveLifetime(): {
    totalLifetimeMs: number;
    activeLifetimeMs: number; // Temps entre première tentative et expiration
    averageAttemptInterval: number;
  } {
    const totalLifetimeMs = this.payload.timeToExpiration;
    const firstAttempt = this.payload.firstAttemptAt || this.payload.createdAt;
    const activeLifetimeMs = this.timestamp.getTime() - firstAttempt.getTime();
    const averageAttemptInterval = this.payload.totalAttempts > 1 ? 
      activeLifetimeMs / (this.payload.totalAttempts - 1) : 0;

    return {
      totalLifetimeMs,
      activeLifetimeMs,
      averageAttemptInterval
    };
  }

  /**
   * Génère un résumé lisible de l'événement
   */
  public getSummary(): string {
    const { notificationId, channel, expirationReason, totalAttempts } = this.payload;
    const lifetime = this.getEffectiveLifetime();
    const lifetimeHours = Math.round(lifetime.totalLifetimeMs / (1000 * 60 * 60) * 10) / 10;
    
    return `Notification ${notificationId} (${channel}) expired after ${lifetimeHours}h ` +
           `due to ${expirationReason} (${totalAttempts} attempts)`;
  }

  /**
   * Génère le niveau de criticité de l'expiration
   */
  public getCriticalityLevel(): 'low' | 'medium' | 'high' | 'critical' {
    if (this.payload.expirationReason === 'service_discontinued') return 'critical';
    if (this.payload.expirationReason === 'max_retries_exceeded' && this.payload.totalAttempts > 5) return 'high';
    if (this.isDeliveryFailure()) return 'medium';
    return 'low';
  }

  /**
   * Convertit en format pour logging
   */
  public toLogFormat(): Record<string, any> {
    const lifetime = this.getEffectiveLifetime();
    
    return {
      eventType: this.eventType,
      eventId: this.eventId,
      timestamp: this.timestamp.toISOString(),
      notificationId: this.payload.notificationId,
      recipientId: this.payload.recipientId,
      channel: this.payload.channel,
      expirationReason: this.payload.expirationReason,
      totalAttempts: this.payload.totalAttempts,
      totalLifetimeMs: lifetime.totalLifetimeMs,
      activeLifetimeMs: lifetime.activeLifetimeMs,
      isPredictable: this.isPredictableExpiration(),
      isDeliveryFailure: this.isDeliveryFailure(),
      criticalityLevel: this.getCriticalityLevel(),
      requiresAdminNotification: this.requiresAdminNotification(),
      costIncurred: this.payload.costIncurred,
      cleanupActions: this.payload.cleanupActions,
      correlationId: this.correlationId,
      traceId: this.metadata.traceId
    };
  }

  /**
   * Convertit en format pour métriques Prometheus
   */
  public toMetricsFormat(): Record<string, any> {
    const lifetime = this.getEffectiveLifetime();
    
    return {
      notification_expired_total: {
        labels: {
          channel: this.payload.channel,
          reason: this.payload.expirationReason,
          criticality: this.getCriticalityLevel(),
          is_delivery_failure: this.isDeliveryFailure().toString()
        },
        value: 1
      },
      notification_lifetime_duration_ms: {
        labels: {
          channel: this.payload.channel,
          reason: this.payload.expirationReason
        },
        value: lifetime.totalLifetimeMs
      },
      notification_attempts_before_expiration: {
        labels: {
          channel: this.payload.channel,
          reason: this.payload.expirationReason
        },
        value: this.payload.totalAttempts
      },
      notification_expiration_cost: {
        labels: {
          channel: this.payload.channel
        },
        value: this.payload.costIncurred || 0
      }
    };
  }

  /**
   * Génère les actions de nettoyage à exécuter
   */
  public getCleanupTasks(): Array<{
    taskType: string;
    priority: 'high' | 'medium' | 'low';
    data: any;
  }> {
    const tasks = [];
    const { cleanupActions } = this.payload;

    if (cleanupActions.removeFromQueue) {
      tasks.push({
        taskType: 'remove_from_queue',
        priority: 'high' as const,
        data: { notificationId: this.payload.notificationId }
      });
    }

    if (cleanupActions.archiveNotification) {
      tasks.push({
        taskType: 'archive_notification',
        priority: 'medium' as const,
        data: { 
          notificationId: this.payload.notificationId,
          archiveReason: this.payload.expirationReason,
          archiveData: this.toLogFormat()
        }
      });
    }

    if (cleanupActions.updateRecipientStatus) {
      tasks.push({
        taskType: 'update_recipient_status',
        priority: 'medium' as const,
        data: { 
          recipientId: this.payload.recipientId,
          channel: this.payload.channel,
          status: 'unreachable',
          reason: this.payload.expirationReason
        }
      });
    }

    if (cleanupActions.triggerFallback) {
      tasks.push({
        taskType: 'create_fallback_notification',
        priority: 'high' as const,
        data: {
          originalNotificationId: this.payload.notificationId,
          recipientId: this.payload.recipientId,
          fallbackChannel: this.payload.channel === 'email' ? 'sms' : 'email',
          reason: `Fallback for expired ${this.payload.channel} notification`
        }
      });
    }

    if (cleanupActions.notifyAdmins) {
      tasks.push({
        taskType: 'notify_admins',
        priority: this.getCriticalityLevel() === 'critical' ? 'high' as const : 'medium' as const,
        data: {
          subject: `Notification expired: ${this.getSummary()}`,
          details: this.toLogFormat(),
          criticalityLevel: this.getCriticalityLevel()
        }
      });
    }

    return tasks.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
}

// ============================================================================
// FACTORY ET BUILDERS
// ============================================================================

/**
 * Builder pour créer facilement des événements NotificationExpired
 */
export class NotificationExpiredBuilder {
  private data: Partial<NotificationExpiredData> = {};
  private context: Partial<ExpirationContext> = {};
  private options: {
    correlationId?: string;
    sequenceNumber?: number;
    userId?: string;
    sessionId?: string;
    traceId?: string;
  } = {};

  public static create(): NotificationExpiredBuilder {
    return new NotificationExpiredBuilder();
  }

  public forNotification(notificationId: string, recipientId: string, channel: 'email' | 'whatsapp' | 'sms'): this {
    this.data.notificationId = notificationId;
    this.data.recipientId = recipientId;
    this.data.channel = channel;
    return this;
  }

  public withReason(reason: ExpirationReason, details?: string): this {
    this.data.expirationReason = reason;
    if (!this.data.expirationMetadata) this.data.expirationMetadata = {} as any;
    if (details) this.data.expirationMetadata.notes = details;
    return this;
  }

  public withLifecycle(createdAt: Date, scheduledAt?: Date, firstAttemptAt?: Date, lastAttemptAt?: Date): this {
    this.data.createdAt = createdAt;
    this.data.scheduledAt = scheduledAt;
    this.data.firstAttemptAt = firstAttemptAt;
    this.data.lastAttemptAt = lastAttemptAt;
    return this;
  }

  public withAttempts(totalAttempts: number, finalStatus: NotificationExpiredData['finalStatus']): this {
    this.data.totalAttempts = totalAttempts;
    this.data.finalStatus = finalStatus;
    return this;
  }

  public withLastError(error: NotificationExpiredData['lastError']): this {
    this.data.lastError = error;
    return this;
  }

  public withCleanupActions(actions: Partial<CleanupActions>): this {
    this.data.cleanupActions = {
      archiveNotification: true,
      removeFromQueue: true,
      notifyAdmins: false,
      updateRecipientStatus: false,
      triggerFallback: false,
      logMetrics: true,
      ...actions
    };
    return this;
  }

  public withCost(cost: number): this {
    this.data.costIncurred = cost;
    return this;
  }

  public withContext(context: ExpirationContext): this {
    this.context = context;
    return this;
  }

  public triggeredBy(source: NotificationExpiredData['expirationMetadata']['triggeredBy'], userId?: string): this {
    if (!this.data.expirationMetadata) this.data.expirationMetadata = {} as any;
    this.data.expirationMetadata.triggeredBy = source;
    this.data.expirationMetadata.adminUserId = userId;
    return this;
  }

  public withCorrelation(correlationId: string, traceId?: string): this {
    this.options.correlationId = correlationId;
    this.options.traceId = traceId;
    return this;
  }

  public build(): NotificationExpired {
    if (!this.data.notificationId || !this.data.recipientId || !this.data.channel) {
      throw new Error('Missing required notification identification');
    }

    if (!this.data.expirationReason) {
      throw new Error('Missing required expiration reason');
    }

    if (!this.data.createdAt) {
      throw new Error('Missing required createdAt timestamp');
    }

    const fullContext: ExpirationContext = {
      systemMetrics: {
        totalExpiredToday: 0,
        expirationRate: 0,
        queueDepth: 0,
        systemLoad: 'normal'
      },
      channelStatus: {
        isHealthy: true,
        errorRate: 0
      },
      recipientHistory: {
        totalNotifications: 0,
        successfulDeliveries: 0,
        previousExpirations: 0,
        isBlacklisted: false
      },
      ...this.context
    };

    const fullData: NotificationExpiredData = {
      totalAttempts: 0,
      finalStatus: 'pending',
      cleanupActions: {
        archiveNotification: true,
        removeFromQueue: true,
        notifyAdmins: false,
        updateRecipientStatus: false,
        triggerFallback: false,
        logMetrics: true
      },
      expirationMetadata: {
        triggeredBy: 'system_event',
        systemVersion: process.env.npm_package_version || '1.0.0'
      },
      timeToExpiration: 0, // Sera calculé dans le constructeur
      ...this.data
    } as NotificationExpiredData;

    return new NotificationExpired(
      this.data.notificationId!,
      fullData,
      fullContext,
      this.options
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { NotificationExpiredData, ExpirationContext, ExpirationReason, CleanupActions };
