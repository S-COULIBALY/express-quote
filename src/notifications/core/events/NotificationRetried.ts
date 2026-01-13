/**
 * Événement émis lors du retry d'une notification échouée
 *
 * Utilité :
 * - Traçabilité des tentatives de renvoi
 * - Monitoring des problèmes récurrents
 * - Déclenchement de logique métier (alertes, escalade)
 * - Audit trail complet des notifications
 *
 * Configuration :
 * - Inclut les détails de l'échec précédent
 * - Compte les tentatives effectuées
 * - Raison du retry
 * - Délai avant prochaine tentative
 *
 * Pourquoi ce choix :
 * - Observabilité complète du processus de retry
 * - Facilite le debugging des problèmes récurrents
 * - Permet l'implémentation de stratégies de retry intelligentes
 * - Support des alertes automatiques en cas de retry excessif
 */

import { DomainEvent } from "../interfaces";

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

/**
 * Données de l'événement de retry
 */
export interface NotificationRetriedData {
  notificationId: string;
  recipientId: string;
  channel: "email" | "whatsapp" | "sms";
  templateId?: string;

  // Informations sur les tentatives
  attemptNumber: number;
  maxAttempts: number;
  previousFailures: Array<{
    timestamp: Date;
    error: string;
    errorCode?: string;
    providerResponse?: any;
  }>;

  // Détails du retry
  retryReason: "automatic" | "manual" | "scheduled";
  retryStrategy: "exponential_backoff" | "fixed_interval" | "immediate";
  nextRetryAt?: Date;

  // Contexte de l'erreur précédente
  lastError: {
    message: string;
    code?: string;
    type:
      | "provider_error"
      | "network_error"
      | "validation_error"
      | "rate_limit"
      | "timeout";
    timestamp: Date;
    providerResponse?: any;
  };

  // Métadonnées du retry
  retryMetadata: {
    triggeredBy: "cron_job" | "api_call" | "webhook" | "manual";
    initiatedBy?: string; // User ID ou service name
    backoffDelay: number; // en millisecondes
    estimatedDeliveryTime?: Date;
  };
}

/**
 * Contexte d'exécution du retry
 */
export interface RetryContext {
  systemLoad: "low" | "normal" | "high";
  queueDepth: number;
  providerStatus: "healthy" | "degraded" | "down";
  rateLimitStatus: {
    remainingQuota: number;
    resetTime?: Date;
  };
}

// ============================================================================
// ÉVÉNEMENT PRINCIPAL
// ============================================================================

/**
 * Événement de domaine pour le retry d'une notification
 *
 * Responsabilités :
 * - Documenter chaque tentative de retry
 * - Fournir le contexte complet de l'échec
 * - Déclencher les handlers de retry
 * - Alimenter les métriques et alertes
 * - Maintenir l'audit trail
 */
class NotificationRetried implements DomainEvent<NotificationRetriedData> {
  public readonly eventId: string;
  public readonly eventType: string = "NotificationRetried";
  public readonly timestamp: Date;
  public readonly payload: NotificationRetriedData;
  public readonly metadata: DomainEvent["metadata"];

  // Propriétés additionnelles (non dans l'interface DomainEvent mais utiles)
  public readonly aggregateId: string;
  public readonly aggregateType: string = "Notification";
  public readonly sequenceNumber: number;
  public readonly version: string = "1.0";

  constructor(
    notificationId: string,
    payload: NotificationRetriedData,
    context: RetryContext,
    options: {
      correlationId?: string;
      sequenceNumber?: number;
      userId?: string;
      sessionId?: string;
      traceId?: string;
    } = {},
  ) {
    this.eventId = `retry_${notificationId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.timestamp = new Date();
    this.aggregateId = notificationId;
    this.sequenceNumber = options.sequenceNumber || Date.now();
    this.payload = {
      ...payload,
      notificationId,
    };

    this.metadata = {
      source: "NotificationSystem",
      correlationId: options.correlationId,
      userId: options.userId,
      sessionId: options.sessionId,
      traceId: options.traceId,
      context: {
        retryContext: context,
        eventGeneratedAt: this.timestamp.toISOString(),
        systemVersion: process.env.npm_package_version || "1.0.0",
        aggregateId: notificationId,
        aggregateType: "Notification",
        sequenceNumber: this.sequenceNumber,
        version: this.version,
      },
    };

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
      throw new Error("NotificationRetried: notificationId is required");
    }

    if (!this.payload.recipientId) {
      throw new Error("NotificationRetried: recipientId is required");
    }

    if (!this.payload.channel) {
      throw new Error("NotificationRetried: channel is required");
    }

    if (this.payload.attemptNumber < 1) {
      throw new Error("NotificationRetried: attemptNumber must be positive");
    }

    if (this.payload.attemptNumber > this.payload.maxAttempts) {
      throw new Error(
        "NotificationRetried: attemptNumber cannot exceed maxAttempts",
      );
    }

    if (!this.payload.lastError) {
      throw new Error("NotificationRetried: lastError is required");
    }

    if (
      this.payload.retryStrategy === "exponential_backoff" &&
      this.payload.retryMetadata.backoffDelay <= 0
    ) {
      throw new Error(
        "NotificationRetried: backoffDelay must be positive for exponential backoff",
      );
    }
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES
  // ============================================================================

  /**
   * Indique s'il s'agit du dernier retry possible
   */
  public isLastRetry(): boolean {
    return this.payload.attemptNumber >= this.payload.maxAttempts;
  }

  /**
   * Indique si le retry est automatique ou manuel
   */
  public isAutomatic(): boolean {
    return this.payload.retryReason === "automatic";
  }

  /**
   * Indique si c'est un retry à cause d'un rate limiting
   */
  public isRateLimited(): boolean {
    return this.payload.lastError.type === "rate_limit";
  }

  /**
   * Calcule le délai total depuis la première tentative
   */
  public getTotalDelayFromFirstAttempt(): number {
    if (this.payload.previousFailures.length === 0) {
      return 0;
    }

    const firstFailure = this.payload.previousFailures[0];
    return this.timestamp.getTime() - firstFailure.timestamp.getTime();
  }

  /**
   * Récupère le pattern d'erreurs pour détection de problèmes systémiques
   */
  public getErrorPattern(): {
    errorTypes: string[];
    errorCodes: string[];
    isConsistentError: boolean;
    dominantErrorType: string;
  } {
    const allErrors = [
      ...this.payload.previousFailures.map((f) => ({
        type: "unknown" as const,
        code: f.errorCode || "unknown",
      })),
      {
        type: this.payload.lastError.type,
        code: this.payload.lastError.code || "unknown",
      },
    ];
    const errorTypes = allErrors.map((e) => e.type || "unknown");
    const errorCodes = allErrors.map((e) => e.code || "unknown");

    // Compte les occurrences pour identifier le pattern dominant
    const typeCount = errorTypes.reduce(
      (acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const dominantErrorType =
      Object.entries(typeCount).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      "unknown";

    const isConsistentError = errorTypes.every(
      (type) => type === errorTypes[0],
    );

    return {
      errorTypes: [...new Set(errorTypes)],
      errorCodes: [...new Set(errorCodes)],
      isConsistentError,
      dominantErrorType,
    };
  }

  /**
   * Génère un résumé lisible de l'événement
   */
  public getSummary(): string {
    const { notificationId, attemptNumber, maxAttempts, channel, lastError } =
      this.payload;
    const isLast = this.isLastRetry() ? " (FINAL ATTEMPT)" : "";

    return (
      `Retry ${attemptNumber}/${maxAttempts} for notification ${notificationId} ` +
      `(${channel}) failed with ${lastError.type}: ${lastError.message}${isLast}`
    );
  }

  /**
   * Convertit en format pour logging
   */
  public toLogFormat(): Record<string, any> {
    return {
      eventType: this.eventType,
      eventId: this.eventId,
      timestamp: this.timestamp.toISOString(),
      notificationId: this.payload.notificationId,
      channel: this.payload.channel,
      attemptNumber: this.payload.attemptNumber,
      maxAttempts: this.payload.maxAttempts,
      retryReason: this.payload.retryReason,
      lastErrorType: this.payload.lastError.type,
      lastErrorMessage: this.payload.lastError.message,
      backoffDelay: this.payload.retryMetadata.backoffDelay,
      nextRetryAt: this.payload.nextRetryAt?.toISOString(),
      isLastRetry: this.isLastRetry(),
      totalDelayMs: this.getTotalDelayFromFirstAttempt(),
      correlationId: this.metadata.correlationId,
      traceId: this.metadata.traceId,
    };
  }

  /**
   * Convertit en format pour métriques Prometheus
   */
  public toMetricsFormat(): Record<string, any> {
    const errorPattern = this.getErrorPattern();

    return {
      notification_retry_total: {
        labels: {
          channel: this.payload.channel,
          error_type: this.payload.lastError.type,
          retry_reason: this.payload.retryReason,
          attempt_number: this.payload.attemptNumber.toString(),
          is_last_retry: this.isLastRetry().toString(),
        },
        value: 1,
      },
      notification_retry_backoff_duration_ms: {
        labels: {
          channel: this.payload.channel,
          strategy: this.payload.retryStrategy,
        },
        value: this.payload.retryMetadata.backoffDelay,
      },
      notification_retry_total_delay_ms: {
        labels: {
          channel: this.payload.channel,
          dominant_error_type: errorPattern.dominantErrorType,
        },
        value: this.getTotalDelayFromFirstAttempt(),
      },
    };
  }
}

// ============================================================================
// FACTORY ET BUILDERS
// ============================================================================

/**
 * Builder pour créer facilement des événements NotificationRetried
 */
class NotificationRetriedBuilder {
  private data: Partial<NotificationRetriedData> = {};
  private context: Partial<RetryContext> = {};
  private options: {
    correlationId?: string;
    sequenceNumber?: number;
    userId?: string;
    sessionId?: string;
    traceId?: string;
  } = {};

  public static create(): NotificationRetriedBuilder {
    return new NotificationRetriedBuilder();
  }

  public forNotification(
    notificationId: string,
    recipientId: string,
    channel: "email" | "whatsapp" | "sms",
  ): this {
    this.data.notificationId = notificationId;
    this.data.recipientId = recipientId;
    this.data.channel = channel;
    return this;
  }

  public withAttempt(attemptNumber: number, maxAttempts: number): this {
    this.data.attemptNumber = attemptNumber;
    this.data.maxAttempts = maxAttempts;
    return this;
  }

  public withLastError(error: NotificationRetriedData["lastError"]): this {
    this.data.lastError = error;
    return this;
  }

  public withRetryStrategy(
    strategy: "exponential_backoff" | "fixed_interval" | "immediate",
    backoffDelay: number,
    nextRetryAt?: Date,
  ): this {
    this.data.retryStrategy = strategy;
    this.data.nextRetryAt = nextRetryAt;
    if (!this.data.retryMetadata) this.data.retryMetadata = {} as any;
    if (this.data.retryMetadata) {
      this.data.retryMetadata.backoffDelay = backoffDelay;
    }
    return this;
  }

  public withReason(
    reason: "automatic" | "manual" | "scheduled",
    triggeredBy: string,
    initiatedBy?: string,
  ): this {
    this.data.retryReason = reason;
    if (!this.data.retryMetadata) this.data.retryMetadata = {} as any;
    if (this.data.retryMetadata) {
      this.data.retryMetadata.triggeredBy = triggeredBy as any;
      this.data.retryMetadata.initiatedBy = initiatedBy;
    }
    return this;
  }

  public withPreviousFailures(
    failures: NotificationRetriedData["previousFailures"],
  ): this {
    this.data.previousFailures = failures;
    return this;
  }

  public withContext(context: RetryContext): this {
    this.context = context;
    return this;
  }

  public withCorrelation(correlationId: string, traceId?: string): this {
    this.options.correlationId = correlationId;
    this.options.traceId = traceId;
    return this;
  }

  public build(): NotificationRetried {
    if (
      !this.data.notificationId ||
      !this.data.recipientId ||
      !this.data.channel
    ) {
      throw new Error("Missing required notification identification");
    }

    if (!this.data.lastError) {
      throw new Error("Missing required lastError");
    }

    const fullContext: RetryContext = {
      systemLoad: "normal",
      queueDepth: 0,
      providerStatus: "healthy",
      rateLimitStatus: { remainingQuota: 100 },
      ...this.context,
    };

    const fullData: NotificationRetriedData = {
      attemptNumber: 1,
      maxAttempts: 3,
      previousFailures: [],
      retryReason: "automatic",
      retryStrategy: "exponential_backoff",
      retryMetadata: {
        triggeredBy: "cron_job",
        backoffDelay: 5000,
      },
      ...this.data,
    } as NotificationRetriedData;

    return new NotificationRetried(
      this.data.notificationId!,
      fullData,
      fullContext,
      this.options,
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { NotificationRetried, NotificationRetriedBuilder };
// NotificationRetriedData et RetryContext sont déjà exportés comme interfaces ci-dessus
