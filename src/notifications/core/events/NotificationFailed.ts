// =============================================================================
// ❌ ÉVÉNEMENT DOMAINE - Notification Échouée
// =============================================================================
//
// Utilité:
// - Événement émis lors de l'échec d'envoi d'une notification
// - Déclenchement des processus de retry et fallback automatiques
// - Alerting et monitoring des pannes de service
// - Analytics des taux d'erreur pour optimisation
// - Escalation vers support technique si critique
//
// Architecture Event-Driven:
// - Gestion intelligente des erreurs avec classification
// - Décision automatique de retry vs abandon
// - Correlation avec pannes d'infrastructure
// - Logging structuré pour debugging rapide
// - Integration avec systèmes d'incident management
// =============================================================================

import { randomUUID } from "crypto";
import { DomainEvent } from "../interfaces";
import {
  NotificationChannel,
  NotificationType,
} from "../entities/Notification";

/**
 * 🏷️ Classification des erreurs de notification
 *
 * Utilité:
 * - Catégorisation pour traitement différencié
 * - Décision automatique retry vs abandon
 * - Metrics et alerting par type d'erreur
 * - Escalation selon la criticité
 */
export enum NotificationErrorCategory {
  /** Erreur de validation des données (email invalide, etc.) */
  VALIDATION = "VALIDATION",

  /** Erreur d'authentification/autorisation */
  AUTHENTICATION = "AUTHENTICATION",

  /** Service externe indisponible */
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",

  /** Rate limiting atteint */
  RATE_LIMITED = "RATE_LIMITED",

  /** Quota dépassé */
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",

  /** Erreur réseau/timeout */
  NETWORK_ERROR = "NETWORK_ERROR",

  /** Configuration incorrecte */
  CONFIGURATION_ERROR = "CONFIGURATION_ERROR",

  /** Erreur de template/rendu */
  TEMPLATE_ERROR = "TEMPLATE_ERROR",

  /** Destinataire bloqué/opt-out */
  RECIPIENT_BLOCKED = "RECIPIENT_BLOCKED",

  /** Contenu rejeté (spam, etc.) */
  CONTENT_REJECTED = "CONTENT_REJECTED",

  /** Erreur système interne */
  SYSTEM_ERROR = "SYSTEM_ERROR",

  /** Erreur inconnue/non classifiée */
  UNKNOWN = "UNKNOWN",
}

/**
 * 🎯 Stratégie de récupération recommandée
 */
export enum RecoveryStrategy {
  /** Retry automatique immédiat */
  IMMEDIATE_RETRY = "IMMEDIATE_RETRY",

  /** Retry avec backoff exponentiel */
  DELAYED_RETRY = "DELAYED_RETRY",

  /** Fallback vers autre canal */
  FALLBACK_CHANNEL = "FALLBACK_CHANNEL",

  /** Fallback vers autre provider */
  FALLBACK_PROVIDER = "FALLBACK_PROVIDER",

  /** Escalation manuelle requise */
  MANUAL_ESCALATION = "MANUAL_ESCALATION",

  /** Abandon définitif */
  ABANDON = "ABANDON",
}

/**
 * 📋 Payload de l'événement NotificationFailed
 *
 * Utilité:
 * - Diagnostic complet de l'échec d'envoi
 * - Context pour décisions de récupération
 * - Données pour analytics et troubleshooting
 * - Information pour alerting et escalation
 */
export interface NotificationFailedPayload {
  /** ID de la notification échouée */
  notificationId: string;

  /** Type de notification métier */
  type: NotificationType;

  /** Canal qui a échoué */
  channel: NotificationChannel;

  /** Informations du destinataire (anonymisées) */
  recipient: {
    /** ID du destinataire */
    id: string;

    /** Hash de l'adresse email/téléphone */
    contactHash: string;

    /** Langue configurée */
    language: string;

    /** Timezone du destinataire */
    timezone: string;
  };

  /** Détails de l'erreur */
  error: {
    /** Catégorie d'erreur */
    category: NotificationErrorCategory;

    /** Code d'erreur interne */
    code: string;

    /** Message d'erreur principal */
    message: string;

    /** Message technique détaillé */
    technicalMessage?: string;

    /** Stack trace si disponible */
    stackTrace?: string;

    /** Erreur récupérable */
    recoverable: boolean;

    /** Erreur temporaire */
    temporary: boolean;

    /** Stratégie de récupération recommandée */
    recommendedRecovery: RecoveryStrategy;

    /** Codes d'erreur spécifiques au provider */
    providerError?: {
      /** Code du provider */
      code: string;

      /** Message du provider */
      message: string;

      /** Détails techniques */
      details?: Record<string, any>;
    };

    /** Erreur HTTP si applicable */
    httpError?: {
      /** Code de statut HTTP */
      status: number;

      /** Headers de réponse pertinents */
      headers?: Record<string, string>;

      /** Corps de la réponse d'erreur */
      body?: string;
    };
  };

  /** Context de l'échec */
  failure: {
    /** Horodatage de l'échec */
    failedAt: Date;

    /** Tentative qui a échoué (1, 2, 3...) */
    attempt: number;

    /** Fournisseur utilisé */
    provider: string;

    /** Endpoint qui a échoué */
    endpoint?: string;

    /** Région/datacenter */
    region?: string;

    /** Latence avant échec (ms) */
    latencyBeforeFailure: number;

    /** Worker qui a traité */
    workerId?: string;

    /** Queue source */
    queueName?: string;

    /** Temps passé en queue avant traitement */
    queueLatency?: number;
  };

  /** Historique des tentatives précédentes */
  retryHistory: Array<{
    /** Numéro de la tentative */
    attemptNumber: number;

    /** Timestamp de la tentative */
    attemptedAt: Date;

    /** Provider utilisé pour cette tentative */
    provider: string;

    /** Canal utilisé */
    channel: NotificationChannel;

    /** Résultat */
    result: "success" | "failed";

    /** Erreur si échec */
    error?: string;

    /** Latence de cette tentative */
    latency: number;
  }>;

  /** Template et contenu */
  content: {
    /** Template utilisé */
    templateId?: string;

    /** Version du template */
    templateVersion?: string;

    /** Hash du contenu */
    contentHash: string;

    /** Erreur liée au template */
    templateError?: string;

    /** Variables manquantes ou invalides */
    invalidVariables?: string[];

    /** Taille du contenu (bytes) */
    contentSize: number;

    /** Présence de pièces jointes */
    hasAttachments: boolean;

    /** Nombre de pièces jointes */
    attachmentCount: number;
  };

  /** Configuration au moment de l'échec */
  configuration: {
    /** Retry activé */
    retryEnabled: boolean;

    /** Tentatives maximum configurées */
    maxRetries: number;

    /** Canaux de fallback disponibles */
    fallbackChannels: NotificationChannel[];

    /** Tracking activé */
    trackingEnabled: boolean;

    /** Expiration configurée */
    expiresAt?: Date;

    /** Tags de configuration */
    tags: string[];
  };

  /** Contexte métier Express Quote */
  businessContext?: {
    /** Type d'entité liée */
    entityType?: string;

    /** ID de l'entité liée */
    entityId?: string;

    /** Customer concerné */
    customerId?: string;

    /** Service Express Quote */
    serviceType?: string;

    /** Criticité business */
    businessCriticality: "low" | "normal" | "high" | "critical";

    /** Impact sur l'expérience client */
    customerImpact: "none" | "minimal" | "moderate" | "high";

    /** Workflow affecté */
    workflowPhase?: string;
  };

  /** Prochaines actions recommandées */
  recommendations: {
    /** Action immédiate */
    immediateAction: RecoveryStrategy;

    /** Délai recommandé avant retry (ms) */
    retryAfter?: number;

    /** Canal de fallback suggéré */
    fallbackChannel?: NotificationChannel;

    /** Provider alternatif */
    alternativeProvider?: string;

    /** Escalation nécessaire */
    requiresEscalation: boolean;

    /** Niveau d'escalation */
    escalationLevel?: "support" | "engineering" | "management";

    /** Actions correctives */
    correctiveActions?: string[];
  };

  /** Informations système */
  system: {
    /** Environment où l'erreur s'est produite */
    environment: string;

    /** Version de l'application */
    appVersion?: string;

    /** ID de la session worker */
    sessionId?: string;

    /** Trace ID pour distributed tracing */
    traceId?: string;

    /** Santé générale du système au moment de l'échec */
    systemHealth?: {
      /** CPU usage (%) */
      cpuUsage: number;

      /** Memory usage (%) */
      memoryUsage: number;

      /** Queue sizes */
      queueSizes: Record<string, number>;

      /** Active connections */
      activeConnections: number;
    };
  };
}

/**
 * ❌ ÉVÉNEMENT DOMAINE - NotificationFailed
 *
 * Cet événement signale l'échec d'envoi d'une notification et déclenche
 * automatiquement les processus de récupération, alerting, et analytics
 * d'erreurs. Il fournit un diagnostic complet pour résolution rapide.
 *
 * Cas d'usage typiques:
 * - Retry automatique avec stratégie adaptée
 * - Fallback vers canal ou provider alternatif
 * - Alerting temps réel des équipes techniques
 * - Analytics des taux d'erreur et patterns
 * - Escalation automatique pour erreurs critiques
 * - Logging structuré pour debugging
 * - Mise à jour des SLA et dashboards
 */
export class NotificationFailed
  implements DomainEvent<NotificationFailedPayload>
{
  public readonly eventId: string;
  public readonly eventType: string = "NotificationFailed";
  public readonly timestamp: Date;
  public readonly payload: NotificationFailedPayload;
  public readonly metadata: DomainEvent["metadata"];

  // Propriétés additionnelles (non dans l'interface DomainEvent mais utiles)
  public readonly aggregateId: string;
  public readonly aggregateType: string = "Notification";
  public readonly sequenceNumber: number;
  public readonly version: string = "1.0.0";

  /**
   * 🏗️ Constructeur de l'événement
   *
   * @param notificationId ID de la notification échouée
   * @param payload Données complètes de l'échec
   * @param sequenceNumber Numéro de séquence dans l'agrégat
   * @param correlationId ID de corrélation pour traçage
   * @param metadata Métadonnées additionnelles
   */
  constructor(
    notificationId: string,
    payload: NotificationFailedPayload,
    sequenceNumber: number = 2,
    correlationId?: string,
    metadata?: Partial<DomainEvent["metadata"]>,
  ) {
    this.eventId = randomUUID();
    this.timestamp = new Date();
    this.aggregateId = notificationId;
    this.sequenceNumber = sequenceNumber;
    this.payload = { ...payload };

    // Métadonnées avec valeurs par défaut (correlationId dans metadata)
    this.metadata = {
      source: "notification-worker",
      traceId: randomUUID(),
      correlationId: correlationId,
      context: {
        notificationService: "express-quote-v2",
        domain: "notification",
        operation: "send-failed",
        aggregateId: notificationId,
        aggregateType: "Notification",
        sequenceNumber: sequenceNumber,
        version: this.version,
      },
      ...metadata,
    };
  }

  /**
   * 🏭 Factory method depuis résultat d'adaptateur échoué
   */
  static fromAdapterError(
    notificationId: string,
    type: NotificationType,
    channel: NotificationChannel,
    adapterError: any, // AdapterDeliveryResult with error
    additionalContext?: {
      retryHistory?: NotificationFailedPayload["retryHistory"];
      businessContext?: NotificationFailedPayload["businessContext"];
      configuration?: Partial<NotificationFailedPayload["configuration"]>;
      correlationId?: string;
      sequenceNumber?: number;
      metadata?: Partial<DomainEvent["metadata"]>;
    },
  ): NotificationFailed {
    const payload: NotificationFailedPayload = {
      notificationId,
      type,
      channel,

      recipient: {
        id: "recipient-id", // À passer via additionalContext
        contactHash: NotificationFailed.hashContact("contact"), // À calculer
        language: "fr",
        timezone: "Europe/Paris",
      },

      error: {
        category: NotificationFailed.categorizeError(adapterError.error),
        code: adapterError.error?.code || "UNKNOWN_ERROR",
        message: adapterError.message || "Unknown error occurred",
        technicalMessage: adapterError.error?.message,
        stackTrace: adapterError.error?.stack,
        recoverable: adapterError.error?.temporary || false,
        temporary: adapterError.error?.temporary || false,
        recommendedRecovery: NotificationFailed.getRecoveryStrategy(
          adapterError.error,
        ),
        providerError: adapterError.error?.providerDetails
          ? {
              code: adapterError.error.providerCode || "UNKNOWN",
              message: adapterError.error.message,
              details: adapterError.error.providerDetails,
            }
          : undefined,
        httpError:
          adapterError.error?.type === "server"
            ? {
                status: adapterError.deliveryMetadata?.httpStatus || 500,
                headers: {},
                body: adapterError.error?.message,
              }
            : undefined,
      },

      failure: {
        failedAt: new Date(),
        attempt: 1, // À passer via additionalContext
        provider: adapterError.deliveryMetadata?.provider || "unknown",
        endpoint: adapterError.deliveryMetadata?.endpoint,
        region: adapterError.deliveryMetadata?.routing?.region,
        latencyBeforeFailure: adapterError.deliveryMetadata?.latency || 0,
        workerId: additionalContext?.metadata?.userId,
        queueName: "unknown-queue",
      },

      retryHistory: additionalContext?.retryHistory || [],

      content: {
        templateId: undefined, // À passer
        templateVersion: undefined,
        contentHash: "content-hash", // À calculer
        contentSize: 0, // À calculer
        hasAttachments: false,
        attachmentCount: 0,
      },

      configuration: {
        retryEnabled: true,
        maxRetries: 3,
        fallbackChannels: [],
        trackingEnabled: false,
        tags: [],
        ...additionalContext?.configuration,
      },

      businessContext: additionalContext?.businessContext,

      recommendations: NotificationFailed.generateRecommendations(
        adapterError.error,
        additionalContext?.configuration?.fallbackChannels || [],
      ),

      system: {
        environment: process.env.NODE_ENV || "development",
        appVersion: process.env.APP_VERSION,
        sessionId: randomUUID(),
        traceId: additionalContext?.metadata?.traceId,
        systemHealth: {
          cpuUsage: 0, // À mesurer
          memoryUsage: 0, // À mesurer
          queueSizes: {},
          activeConnections: 0,
        },
      },
    };

    return new NotificationFailed(
      notificationId,
      payload,
      additionalContext?.sequenceNumber,
      additionalContext?.correlationId,
      additionalContext?.metadata,
    );
  }

  /**
   * 🏷️ Classification automatique des erreurs
   */
  private static categorizeError(error: any): NotificationErrorCategory {
    if (!error) return NotificationErrorCategory.UNKNOWN;

    const code = error.code?.toUpperCase() || "";
    const message = error.message?.toLowerCase() || "";

    // Classification par code d'erreur
    if (code.includes("AUTH") || code.includes("UNAUTHORIZED")) {
      return NotificationErrorCategory.AUTHENTICATION;
    }

    if (code.includes("RATE") || code.includes("LIMIT")) {
      return NotificationErrorCategory.RATE_LIMITED;
    }

    if (code.includes("QUOTA") || code.includes("EXCEEDED")) {
      return NotificationErrorCategory.QUOTA_EXCEEDED;
    }

    if (code.includes("VALIDATION") || code.includes("INVALID")) {
      return NotificationErrorCategory.VALIDATION;
    }

    if (
      code.includes("NETWORK") ||
      code.includes("TIMEOUT") ||
      code.includes("CONNECTION")
    ) {
      return NotificationErrorCategory.NETWORK_ERROR;
    }

    if (code.includes("TEMPLATE") || code.includes("RENDER")) {
      return NotificationErrorCategory.TEMPLATE_ERROR;
    }

    if (
      code.includes("BLOCKED") ||
      code.includes("BLACKLIST") ||
      code.includes("OPT_OUT")
    ) {
      return NotificationErrorCategory.RECIPIENT_BLOCKED;
    }

    if (
      code.includes("SPAM") ||
      code.includes("CONTENT") ||
      code.includes("REJECTED")
    ) {
      return NotificationErrorCategory.CONTENT_REJECTED;
    }

    if (code.includes("CONFIG") || code.includes("SETUP")) {
      return NotificationErrorCategory.CONFIGURATION_ERROR;
    }

    if (
      code.includes("SERVICE") ||
      code.includes("UNAVAILABLE") ||
      code.includes("DOWN")
    ) {
      return NotificationErrorCategory.SERVICE_UNAVAILABLE;
    }

    // Classification par message
    if (
      message.includes("invalid email") ||
      message.includes("invalid phone")
    ) {
      return NotificationErrorCategory.VALIDATION;
    }

    if (
      message.includes("service unavailable") ||
      message.includes("server error")
    ) {
      return NotificationErrorCategory.SERVICE_UNAVAILABLE;
    }

    if (message.includes("timeout") || message.includes("network")) {
      return NotificationErrorCategory.NETWORK_ERROR;
    }

    return NotificationErrorCategory.SYSTEM_ERROR;
  }

  /**
   * 🎯 Détermination de la stratégie de récupération
   */
  private static getRecoveryStrategy(error: any): RecoveryStrategy {
    const category = NotificationFailed.categorizeError(error);

    switch (category) {
      case NotificationErrorCategory.VALIDATION:
      case NotificationErrorCategory.RECIPIENT_BLOCKED:
      case NotificationErrorCategory.CONTENT_REJECTED:
        return RecoveryStrategy.ABANDON;

      case NotificationErrorCategory.RATE_LIMITED:
        return RecoveryStrategy.DELAYED_RETRY;

      case NotificationErrorCategory.QUOTA_EXCEEDED:
        return RecoveryStrategy.FALLBACK_PROVIDER;

      case NotificationErrorCategory.SERVICE_UNAVAILABLE:
      case NotificationErrorCategory.NETWORK_ERROR:
        return RecoveryStrategy.FALLBACK_CHANNEL;

      case NotificationErrorCategory.AUTHENTICATION:
      case NotificationErrorCategory.CONFIGURATION_ERROR:
        return RecoveryStrategy.MANUAL_ESCALATION;

      case NotificationErrorCategory.TEMPLATE_ERROR:
        return RecoveryStrategy.FALLBACK_CHANNEL;

      default:
        return RecoveryStrategy.DELAYED_RETRY;
    }
  }

  /**
   * 💡 Génération des recommandations de récupération
   */
  private static generateRecommendations(
    error: any,
    fallbackChannels: NotificationChannel[],
  ): NotificationFailedPayload["recommendations"] {
    const category = NotificationFailed.categorizeError(error);
    const strategy = NotificationFailed.getRecoveryStrategy(error);

    const recommendations: NotificationFailedPayload["recommendations"] = {
      immediateAction: strategy,
      requiresEscalation: false,
      correctiveActions: [],
    };

    switch (strategy) {
      case RecoveryStrategy.IMMEDIATE_RETRY:
        recommendations.retryAfter = 1000; // 1 seconde
        break;

      case RecoveryStrategy.DELAYED_RETRY:
        recommendations.retryAfter =
          category === NotificationErrorCategory.RATE_LIMITED
            ? 60000 // 1 minute pour rate limiting
            : 5000; // 5 secondes pour autres
        break;

      case RecoveryStrategy.FALLBACK_CHANNEL:
        if (fallbackChannels.length > 0) {
          recommendations.fallbackChannel = fallbackChannels[0];
        } else {
          recommendations.immediateAction = RecoveryStrategy.DELAYED_RETRY;
          recommendations.retryAfter = 30000;
        }
        break;

      case RecoveryStrategy.FALLBACK_PROVIDER:
        recommendations.alternativeProvider = "backup-provider";
        recommendations.retryAfter = 5000;
        break;

      case RecoveryStrategy.MANUAL_ESCALATION:
        recommendations.requiresEscalation = true;
        recommendations.escalationLevel =
          category === NotificationErrorCategory.CONFIGURATION_ERROR
            ? "engineering"
            : "support";
        recommendations.correctiveActions = [
          "Vérifier la configuration du provider",
          "Valider les credentials",
          "Tester la connectivité",
        ];
        break;

      case RecoveryStrategy.ABANDON:
        recommendations.correctiveActions = [
          "Vérifier la validité du destinataire",
          "Nettoyer les listes de diffusion",
          "Mettre à jour les préférences de notification",
        ];
        break;
    }

    return recommendations;
  }

  /**
   * 🔐 Hash sécurisé d'un contact
   */
  private static hashContact(contact: string): string {
    if (!contact) return "unknown";
    return Buffer.from(contact.toLowerCase()).toString("base64").slice(0, 16);
  }

  /**
   * 📊 Calcul du score de criticité (0-100)
   */
  getSeverityScore(): number {
    let score = 50; // Score de base

    // Ajustement par catégorie d'erreur
    switch (this.payload.error.category) {
      case NotificationErrorCategory.VALIDATION:
      case NotificationErrorCategory.RECIPIENT_BLOCKED:
        score = 20; // Faible criticité
        break;
      case NotificationErrorCategory.RATE_LIMITED:
        score = 30; // Faible-moyenne
        break;
      case NotificationErrorCategory.NETWORK_ERROR:
      case NotificationErrorCategory.SERVICE_UNAVAILABLE:
        score = 70; // Haute
        break;
      case NotificationErrorCategory.AUTHENTICATION:
      case NotificationErrorCategory.CONFIGURATION_ERROR:
        score = 90; // Très haute
        break;
      case NotificationErrorCategory.SYSTEM_ERROR:
        score = 80; // Haute
        break;
    }

    // Ajustement par criticité business
    if (this.payload.businessContext?.businessCriticality === "critical") {
      score += 20;
    } else if (this.payload.businessContext?.businessCriticality === "high") {
      score += 10;
    }

    // Ajustement par nombre de tentatives
    const attempts = this.payload.retryHistory.length + 1;
    if (attempts > 3) {
      score += 10;
    }

    // Ajustement par impact client
    if (this.payload.businessContext?.customerImpact === "high") {
      score += 15;
    } else if (this.payload.businessContext?.customerImpact === "moderate") {
      score += 5;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 🏷️ Extraction des tags pour routing et alerting
   */
  getTags(): string[] {
    const tags: string[] = [
      "notification-failed",
      `type-${this.payload.type.toLowerCase()}`,
      `channel-${this.payload.channel.toLowerCase()}`,
      `category-${this.payload.error.category.toLowerCase()}`,
      `provider-${this.payload.failure.provider}`,
      `attempt-${this.payload.failure.attempt}`,
    ];

    // Tags de récupération
    tags.push(
      `recovery-${this.payload.recommendations.immediateAction.toLowerCase()}`,
    );

    if (this.payload.error.recoverable) {
      tags.push("recoverable");
    } else {
      tags.push("non-recoverable");
    }

    if (this.payload.error.temporary) {
      tags.push("temporary");
    } else {
      tags.push("permanent");
    }

    // Tags métier
    if (this.payload.businessContext?.entityType) {
      tags.push(`entity-${this.payload.businessContext.entityType}`);
    }

    if (this.payload.businessContext?.serviceType) {
      tags.push(
        `service-${this.payload.businessContext.serviceType.toLowerCase()}`,
      );
    }

    // Tags de criticité
    const severity = this.getSeverityScore();
    if (severity >= 80) {
      tags.push("critical-error");
    } else if (severity >= 60) {
      tags.push("high-severity");
    } else if (severity >= 40) {
      tags.push("medium-severity");
    } else {
      tags.push("low-severity");
    }

    // Tags d'escalation
    if (this.payload.recommendations.requiresEscalation) {
      tags.push("requires-escalation");
      if (this.payload.recommendations.escalationLevel) {
        tags.push(`escalation-${this.payload.recommendations.escalationLevel}`);
      }
    }

    // Tags personnalisés
    tags.push(...this.payload.configuration.tags.map((tag) => `config-${tag}`));

    return tags;
  }

  /**
   * ⏰ Détermination si retry immédiat possible
   */
  canRetryImmediately(): boolean {
    return (
      this.payload.recommendations.immediateAction ===
      RecoveryStrategy.IMMEDIATE_RETRY
    );
  }

  /**
   * ⏳ Calcul du délai avant prochain retry
   */
  getRetryDelay(): number {
    return this.payload.recommendations.retryAfter || 0;
  }

  /**
   * 🔀 Vérification si fallback disponible
   */
  hasFallbackOption(): boolean {
    return !!(
      this.payload.recommendations.fallbackChannel ||
      this.payload.recommendations.alternativeProvider ||
      this.payload.configuration.fallbackChannels.length > 0
    );
  }

  /**
   * 📊 Extraction des métriques d'erreur
   */
  getErrorMetrics(): Record<string, any> {
    return {
      // Identifiants
      eventId: this.eventId,
      notificationId: this.payload.notificationId,
      correlationId: this.metadata.correlationId,

      // Classification
      errorCategory: this.payload.error.category,
      errorCode: this.payload.error.code,
      notificationType: this.payload.type,
      channel: this.payload.channel,
      provider: this.payload.failure.provider,

      // Tentatives
      attempt: this.payload.failure.attempt,
      totalAttempts: this.payload.retryHistory.length + 1,
      maxRetries: this.payload.configuration.maxRetries,

      // Performance
      latencyBeforeFailure: this.payload.failure.latencyBeforeFailure,
      queueLatency: this.payload.failure.queueLatency,

      // Récupération
      recoverable: this.payload.error.recoverable,
      temporary: this.payload.error.temporary,
      recommendedRecovery: this.payload.recommendations.immediateAction,
      retryDelay: this.payload.recommendations.retryAfter,
      hasFallback: this.hasFallbackOption(),

      // Business
      entityType: this.payload.businessContext?.entityType,
      serviceType: this.payload.businessContext?.serviceType,
      businessCriticality: this.payload.businessContext?.businessCriticality,
      customerImpact: this.payload.businessContext?.customerImpact,

      // Système
      environment: this.payload.system.environment,
      appVersion: this.payload.system.appVersion,
      workerId: this.payload.failure.workerId,
      queueName: this.payload.failure.queueName,

      // Criticité calculée
      severityScore: this.getSeverityScore(),
      requiresEscalation: this.payload.recommendations.requiresEscalation,
      escalationLevel: this.payload.recommendations.escalationLevel,

      // Timestamps
      failedAt: this.payload.failure.failedAt,

      // HTTP details si applicable
      httpStatus: this.payload.error.httpError?.status,

      // Template info
      templateId: this.payload.content.templateId,
      hasAttachments: this.payload.content.hasAttachments,
    };
  }

  /**
   * 📋 Sérialisation pour persistance/transport
   */
  toJSON(): any {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      version: this.version,
      timestamp: this.timestamp.toISOString(),
      correlationId: this.metadata.correlationId,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      sequenceNumber: this.sequenceNumber,
      payload: {
        ...this.payload,
        failure: {
          ...this.payload.failure,
          failedAt: this.payload.failure.failedAt.toISOString(),
        },
        configuration: {
          ...this.payload.configuration,
          expiresAt: this.payload.configuration.expiresAt?.toISOString(),
        },
        retryHistory: this.payload.retryHistory.map((retry) => ({
          ...retry,
          attemptedAt: retry.attemptedAt.toISOString(),
        })),
      },
      metadata: this.metadata,
    };
  }

  /**
   * 🔄 Désérialisation depuis JSON
   */
  static fromJSON(json: any): NotificationFailed {
    const event = Object.create(NotificationFailed.prototype);

    event.eventId = json.eventId;
    event.eventType = json.eventType;
    event.version = json.version;
    event.timestamp = new Date(json.timestamp);
    event.aggregateId = json.aggregateId;
    event.aggregateType = json.aggregateType;
    event.sequenceNumber = json.sequenceNumber;
    event.metadata = {
      ...json.metadata,
      correlationId: json.correlationId || json.metadata?.correlationId,
    };

    // Reconstruction du payload avec dates
    event.payload = {
      ...json.payload,
      failure: {
        ...json.payload.failure,
        failedAt: new Date(json.payload.failure.failedAt),
      },
      configuration: {
        ...json.payload.configuration,
        expiresAt: json.payload.configuration.expiresAt
          ? new Date(json.payload.configuration.expiresAt)
          : undefined,
      },
      retryHistory: json.payload.retryHistory.map((retry: any) => ({
        ...retry,
        attemptedAt: new Date(retry.attemptedAt),
      })),
    };

    return event;
  }
}

// =============================================================================
// 📝 EXEMPLE D'UTILISATION
// =============================================================================
/*
import { NotificationFailed, NotificationErrorCategory, RecoveryStrategy } from './NotificationFailed';

// 1. Création d'événement après échec d'adaptateur
class EmailAdapter {
  async send(notification: Notification): Promise<AdapterDeliveryResult> {
    try {
      // Tentative d'envoi SMTP
      return await this.sendEmail(notification);
      
    } catch (error) {
      // Création de l'événement d'échec
      const failedEvent = NotificationFailed.fromAdapterError(
        notification.id,
        notification.type,
        NotificationChannel.EMAIL,
        {
          success: false,
          channel: NotificationChannel.EMAIL,
          message: 'SMTP connection failed',
          deliveryMetadata: {
            provider: 'smtp-gmail',
            latency: 5000,
            httpStatus: 500
          },
          error: {
            code: 'SMTP_CONNECTION_ERROR',
            message: 'Connection to SMTP server failed',
            temporary: true,
            type: 'network',
            providerCode: '421',
            providerDetails: {
              smtpResponse: '421 Service not available'
            }
          }
        },
        {
          businessContext: {
            entityType: 'booking',
            entityId: 'BK-12345',
            serviceType: 'MOVING',
            businessCriticality: 'high',
            customerImpact: 'moderate'
          },
          configuration: {
            retryEnabled: true,
            maxRetries: 3,
            fallbackChannels: [NotificationChannel.SMS],
            trackingEnabled: true,
            tags: ['booking-confirmation']
          },
          correlationId: notification.correlationId // Sera dans metadata
        }
      );
      
      // Publication de l'événement
      await this.eventBus.publish(failedEvent);
      
      throw error;
    }
  }
}

// 2. Handler pour retry automatique
class NotificationRetryHandler {
  async handle(event: NotificationFailed) {
    const { notificationId, recommendations } = event.payload;
    
    // Vérifier si retry possible
    if (recommendations.immediateAction === RecoveryStrategy.ABANDON) {
      console.log(`Abandon définitif de la notification ${notificationId}`);
      return;
    }
    
    if (!event.payload.error.recoverable) {
      console.log(`Erreur non récupérable pour ${notificationId}`);
      return;
    }
    
    // Stratégie selon la recommandation
    switch (recommendations.immediateAction) {
      case RecoveryStrategy.IMMEDIATE_RETRY:
        await this.scheduleRetry(notificationId, 0);
        break;
        
      case RecoveryStrategy.DELAYED_RETRY:
        const delay = recommendations.retryAfter || 5000;
        await this.scheduleRetry(notificationId, delay);
        break;
        
      case RecoveryStrategy.FALLBACK_CHANNEL:
        if (recommendations.fallbackChannel) {
          await this.scheduleWithFallback(notificationId, recommendations.fallbackChannel);
        } else {
          await this.scheduleRetry(notificationId, 30000); // 30s delay
        }
        break;
        
      case RecoveryStrategy.FALLBACK_PROVIDER:
        await this.scheduleWithProvider(notificationId, recommendations.alternativeProvider);
        break;
        
      case RecoveryStrategy.MANUAL_ESCALATION:
        await this.escalateToSupport(event);
        break;
    }
  }
  
  private async scheduleRetry(notificationId: string, delay: number) {
    await this.scheduler.schedule({
      notificationId,
      delay,
      action: 'retry'
    });
  }
}

// 3. Handler pour alerting automatique
class ErrorAlertingHandler {
  async handle(event: NotificationFailed) {
    const severity = event.getSeverityScore();
    const metrics = event.getErrorMetrics();
    
    // Alerte immédiate pour erreurs critiques
    if (severity >= 80) {
      await this.alertManager.sendAlert({
        severity: 'critical',
        title: `Échec Notification Critique - ${event.payload.error.category}`,
        description: `${event.payload.error.message} (${event.payload.type})`,
        tags: event.getTags(),
        metadata: {
          notificationId: event.payload.notificationId,
          errorCode: event.payload.error.code,
          provider: event.payload.failure.provider,
          businessImpact: event.payload.businessContext?.customerImpact,
          recommendedAction: event.payload.recommendations.immediateAction
        },
        escalation: event.payload.recommendations.requiresEscalation
      });
    }
    
    // Pattern detection pour erreurs récurrentes
    const recentErrors = await this.getRecentErrors(
      event.payload.failure.provider,
      event.payload.error.category,
      '5m'
    );
    
    if (recentErrors.length > 5) {
      await this.alertManager.sendAlert({
        severity: 'warning',
        title: `Pattern d'Erreur Détecté - ${event.payload.error.category}`,
        description: `${recentErrors.length} erreurs similaires en 5 minutes`,
        tags: ['pattern-detection', ...event.getTags()],
        metadata: {
          errorCount: recentErrors.length,
          provider: event.payload.failure.provider,
          category: event.payload.error.category
        }
      });
    }
  }
}

// 4. Handler pour analytics d'erreur
class ErrorAnalyticsHandler {
  async handle(event: NotificationFailed) {
    const metrics = event.getErrorMetrics();
    
    // Métriques Prometheus
    this.prometheus.increment('notifications_failed_total', {
      type: metrics.notificationType,
      channel: metrics.channel,
      provider: metrics.provider,
      error_category: metrics.errorCategory,
      recoverable: metrics.recoverable.toString(),
      environment: metrics.environment
    });
    
    // Distribution des latences avant échec
    this.prometheus.observe('notification_failure_latency_seconds',
      metrics.latencyBeforeFailure / 1000, {
        provider: metrics.provider,
        error_category: metrics.errorCategory
      }
    );
    
    // Score de sévérité
    this.prometheus.histogram('notification_failure_severity',
      metrics.severityScore, {
        business_criticality: metrics.businessCriticality || 'normal'
      }
    );
    
    // Analytics business
    if (metrics.entityType) {
      await this.analytics.track('notification_failed', {
        entityType: metrics.entityType,
        entityId: event.payload.businessContext?.entityId,
        serviceType: metrics.serviceType,
        customerId: event.payload.businessContext?.customerId,
        errorCategory: metrics.errorCategory,
        recoverable: metrics.recoverable,
        severityScore: metrics.severityScore,
        channel: metrics.channel,
        provider: metrics.provider
      });
    }
  }
}

// 5. Handler pour logging structuré
class ErrorLoggingHandler {
  async handle(event: NotificationFailed) {
    const severity = event.getSeverityScore();
    const logLevel = severity >= 80 ? 'error' : 
                    severity >= 60 ? 'warn' : 'info';
    
    this.logger[logLevel]({
      event: 'notification_failed',
      notificationId: event.payload.notificationId,
      correlationId: event.metadata.correlationId,
      errorCategory: event.payload.error.category,
      errorCode: event.payload.error.code,
      errorMessage: event.payload.error.message,
      provider: event.payload.failure.provider,
      channel: event.payload.channel,
      attempt: event.payload.failure.attempt,
      totalAttempts: event.payload.retryHistory.length + 1,
      recoverable: event.payload.error.recoverable,
      recommendedRecovery: event.payload.recommendations.immediateAction,
      businessContext: event.payload.businessContext,
      severityScore: severity,
      tags: event.getTags(),
      stackTrace: event.payload.error.stackTrace
    }, `Notification failed: ${event.payload.error.message}`);
  }
}

// 6. Configuration des handlers
const eventBus = new EventBus();

eventBus.subscribe(NotificationFailed, [
  new NotificationRetryHandler(),
  new ErrorAlertingHandler(),
  new ErrorAnalyticsHandler(), 
  new ErrorLoggingHandler()
]);

// 7. Filtrage pour handlers spécialisés
eventBus.subscribe(
  NotificationFailed,
  new CriticalErrorHandler(),
  (event) => event.getSeverityScore() >= 80
);

eventBus.subscribe(
  NotificationFailed,
  new AuthErrorHandler(),
  (event) => event.payload.error.category === NotificationErrorCategory.AUTHENTICATION
);

eventBus.subscribe(
  NotificationFailed,
  new RateLimitHandler(),
  (event) => event.payload.error.category === NotificationErrorCategory.RATE_LIMITED
);
*/
