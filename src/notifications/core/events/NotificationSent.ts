// =============================================================================
// 📤 ÉVÉNEMENT DOMAINE - Notification Envoyée
// =============================================================================
//
// Utilité:
// - Événement émis lors de l'envoi réussi d'une notification
// - Déclenchement des processus de tracking et de suivi
// - Mise à jour des métriques de performance en temps réel
// - Intégration avec les systèmes d'analytics et de billing
// - Notification aux services intéressés (customer support, CRM)
//
// Architecture Event-Driven:
// - Confirmation de livraison pour reliability patterns
// - Données de performance pour optimisation continue
// - Context propagation pour distributed tracing
// - Webhook notifications pour systèmes externes
// - Event sourcing pour audit trail complet
// =============================================================================

import { randomUUID } from "crypto";
import { DomainEvent } from "../interfaces";
import {
  NotificationChannel,
  NotificationType,
} from "../entities/Notification";

/**
 * 📋 Payload de l'événement NotificationSent
 *
 * Utilité:
 * - Données de confirmation d'envoi
 * - Métriques de performance pour optimisation
 * - Informations de tracking pour suivi utilisateur
 * - Context pour décisions business automatiques
 */
export interface NotificationSentPayload {
  /** ID de la notification envoyée */
  notificationId: string;

  /** Type de notification métier */
  type: NotificationType;

  /** Canal utilisé pour l'envoi */
  channel: NotificationChannel;

  /** ID externe fourni par le service d'envoi */
  externalId: string;

  /** Informations du destinataire (anonymisées) */
  recipient: {
    /** ID du destinataire */
    id: string;

    /** Hash de l'adresse email/téléphone pour déduplication */
    contactHash: string;

    /** Langue utilisée pour l'envoi */
    language: string;

    /** Timezone du destinataire */
    timezone: string;
  };

  /** Détails de l'envoi */
  delivery: {
    /** Fournisseur utilisé (smtp.gmail.com, whatsapp-business, etc.) */
    provider: string;

    /** Endpoint API utilisé */
    endpoint?: string;

    /** Région/datacenter d'envoi */
    region?: string;

    /** Version d'API utilisée */
    apiVersion?: string;

    /** Tentative d'envoi (1, 2, 3...) */
    attempt: number;

    /** Horodatage d'envoi */
    sentAt: Date;

    /** Latence d'envoi (ms) */
    latency: number;

    /** Code de statut HTTP si applicable */
    httpStatusCode?: number;

    /** Taille du message envoyé (bytes) */
    messageSize: number;

    /** Coût de l'envoi si disponible */
    cost?: {
      amount: number;
      currency: string;
      unitType: "message" | "character" | "minute";
    };
  };

  /** Configuration de tracking */
  tracking: {
    /** Tracking activé pour cette notification */
    enabled: boolean;

    /** URL de tracking si générée */
    trackingUrl?: string;

    /** Webhook URL pour updates de statut */
    webhookUrl?: string;

    /** Support des accusés de réception */
    supportsDeliveryReceipt: boolean;

    /** Support des accusés de lecture */
    supportsReadReceipt: boolean;

    /** Estimation de livraison */
    estimatedDelivery?: Date;

    /** Expiration du tracking */
    trackingExpiresAt?: Date;
  };

  /** Template et contenu */
  content: {
    /** Template utilisé */
    templateId?: string;

    /** Version du template */
    templateVersion?: string;

    /** Hash du contenu pour déduplication */
    contentHash: string;

    /** Nombre de variables personnalisées */
    personalizedVariables: number;

    /** Présence de pièces jointes */
    hasAttachments: boolean;

    /** Nombre de pièces jointes */
    attachmentCount: number;

    /** Actions disponibles (boutons, liens) */
    actionCount: number;
  };

  /** Contexte métier Express Quote */
  businessContext?: {
    /** Type d'entité liée */
    entityType?: string;

    /** ID de l'entité liée */
    entityId?: string;

    /** Customer/user concerné */
    customerId?: string;

    /** Service Express Quote */
    serviceType?: string;

    /** Montant de transaction si applicable */
    transactionAmount?: number;

    /** Phase du workflow (confirmation, reminder, etc.) */
    workflowPhase?: string;

    /** Campagne marketing si applicable */
    campaignId?: string;
  };

  /** Métriques techniques */
  performance: {
    /** Temps depuis création de la notification */
    timeToSend: number;

    /** Temps depuis mise en queue */
    queueLatency?: number;

    /** Worker qui a traité l'envoi */
    workerId?: string;

    /** Queue utilisée */
    queueName?: string;

    /** Utilisation CPU du worker (%) */
    workerCpuUsage?: number;

    /** Utilisation mémoire du worker (MB) */
    workerMemoryUsage?: number;
  };

  /** Rate limiting et quotas */
  rateLimiting?: {
    /** Requêtes restantes pour ce provider */
    remaining: number;

    /** Reset du compteur */
    resetTime: Date;

    /** Limite par période */
    limit: number;

    /** Utilisation actuelle des quotas (%) */
    quotaUsage: number;
  };

  /** Tags et métadonnées */
  metadata: {
    /** Tags de la notification */
    tags: string[];

    /** Environment d'envoi */
    environment: string;

    /** Version de l'application */
    appVersion?: string;

    /** Channel fallback utilisé */
    wasFallback: boolean;

    /** Channel principal prévu */
    originalChannel?: NotificationChannel;

    /** Informations de retry */
    retryInfo?: {
      isRetry: boolean;
      previousAttempts: number;
      totalRetryDelay: number;
    };
  };
}

/**
 * 📤 ÉVÉNEMENT DOMAINE - NotificationSent
 *
 * Cet événement confirme qu'une notification a été envoyée avec succès
 * vers un service externe (SMTP, WhatsApp Business API, etc.). Il déclenche
 * les processus de suivi, tracking, et analytics.
 *
 * Cas d'usage typiques:
 * - Mise à jour des métriques de performance temps réel
 * - Déclenchement du système de tracking d'engagement
 * - Facturation des envois pour les services payants
 * - Notification du customer support en cas d'envois critiques
 * - Analytics comportementales et A/B testing
 * - SLA monitoring et alerting
 */
export class NotificationSent implements DomainEvent<NotificationSentPayload> {
  public readonly eventId: string;
  public readonly eventType: string = "NotificationSent";
  public readonly timestamp: Date;
  public readonly payload: NotificationSentPayload;
  public readonly metadata: DomainEvent["metadata"];

  // Propriétés additionnelles (non dans l'interface DomainEvent mais utiles)
  public readonly aggregateId: string;
  public readonly aggregateType: string = "Notification";
  public readonly sequenceNumber: number;
  public readonly version: string = "1.0.0";

  /**
   * 🏗️ Constructeur de l'événement
   *
   * @param notificationId ID de la notification envoyée
   * @param payload Données complètes de l'envoi
   * @param sequenceNumber Numéro de séquence dans l'agrégat
   * @param correlationId ID de corrélation pour traçage
   * @param metadata Métadonnées additionnelles
   */
  constructor(
    notificationId: string,
    payload: NotificationSentPayload,
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
        operation: "send",
        aggregateId: notificationId,
        aggregateType: "Notification",
        sequenceNumber: sequenceNumber,
        version: this.version,
      },
      ...metadata,
    };
  }

  /**
   * 🏭 Factory method depuis résultat d'adaptateur
   *
   * Crée l'événement depuis le résultat d'un adaptateur de canal.
   */
  static fromAdapterResult(
    notificationId: string,
    type: NotificationType,
    adapterResult: any, // AdapterDeliveryResult
    additionalContext?: {
      businessContext?: NotificationSentPayload["businessContext"];
      performance?: Partial<NotificationSentPayload["performance"]>;
      correlationId?: string;
      sequenceNumber?: number;
      metadata?: Partial<DomainEvent["metadata"]>;
    },
  ): NotificationSent {
    const payload: NotificationSentPayload = {
      notificationId,
      type,
      channel: adapterResult.channel,
      externalId: adapterResult.externalId,

      recipient: {
        id: "recipient-id", // À passer via additionalContext
        contactHash: NotificationSent.hashContact(
          adapterResult.recipientEmail || adapterResult.recipientPhone,
        ),
        language: "fr", // À passer via additionalContext
        timezone: "Europe/Paris", // À passer via additionalContext
      },

      delivery: {
        provider: adapterResult.deliveryMetadata.provider,
        endpoint: adapterResult.deliveryMetadata.endpoint,
        region: adapterResult.deliveryMetadata.routing?.region,
        apiVersion: adapterResult.deliveryMetadata.routing?.apiVersion,
        attempt: additionalContext?.performance?.queueLatency
          ? Math.floor(additionalContext.performance.queueLatency / 1000)
          : 1,
        sentAt: new Date(),
        latency: adapterResult.deliveryMetadata.latency,
        httpStatusCode: adapterResult.deliveryMetadata.httpStatus,
        messageSize: NotificationSent.estimateMessageSize(adapterResult),
        cost: adapterResult.deliveryMetadata.cost,
      },

      tracking: {
        enabled: !!adapterResult.trackingInfo,
        trackingUrl: adapterResult.trackingInfo?.trackingUrl,
        webhookUrl: adapterResult.trackingInfo?.webhookUrl,
        supportsDeliveryReceipt:
          adapterResult.trackingInfo?.supportsDeliveryReceipt || false,
        supportsReadReceipt:
          adapterResult.trackingInfo?.supportsReadReceipt || false,
        estimatedDelivery: adapterResult.trackingInfo?.estimatedDelivery,
        trackingExpiresAt: adapterResult.trackingInfo?.estimatedDelivery
          ? new Date(
              adapterResult.trackingInfo.estimatedDelivery.getTime() +
                30 * 24 * 60 * 60 * 1000,
            )
          : undefined,
      },

      content: {
        templateId: undefined, // À passer via additionalContext
        templateVersion: undefined,
        contentHash: NotificationSent.hashContent(adapterResult.content || ""),
        personalizedVariables: 0, // À calculer
        hasAttachments: false, // À passer via additionalContext
        attachmentCount: 0,
        actionCount: 0, // À passer via additionalContext
      },

      businessContext: additionalContext?.businessContext,

      performance: {
        timeToSend:
          Date.now() - (additionalContext?.performance?.queueLatency || 0),
        queueLatency: additionalContext?.performance?.queueLatency,
        workerId: additionalContext?.performance?.workerId,
        queueName: additionalContext?.performance?.queueName,
        workerCpuUsage: additionalContext?.performance?.workerCpuUsage,
        workerMemoryUsage: additionalContext?.performance?.workerMemoryUsage,
      },

      rateLimiting: adapterResult.deliveryMetadata.routing?.rateLimiting
        ? {
            remaining:
              adapterResult.deliveryMetadata.routing.rateLimiting.remaining,
            resetTime:
              adapterResult.deliveryMetadata.routing.rateLimiting.resetTime,
            limit:
              adapterResult.deliveryMetadata.routing.rateLimiting.limit || 100,
            quotaUsage:
              100 -
              (adapterResult.deliveryMetadata.routing.rateLimiting.remaining /
                (adapterResult.deliveryMetadata.routing.rateLimiting.limit ||
                  100)) *
                100,
          }
        : undefined,

      metadata: {
        tags: [], // À passer via additionalContext
        environment: process.env.NODE_ENV || "development",
        appVersion: process.env.APP_VERSION,
        wasFallback: false, // À déterminer par le service
        retryInfo:
          additionalContext?.performance?.queueLatency &&
          additionalContext.performance.queueLatency > 60000
            ? {
                isRetry: true,
                previousAttempts: Math.floor(
                  additionalContext.performance.queueLatency / 60000,
                ),
                totalRetryDelay: additionalContext.performance.queueLatency,
              }
            : {
                isRetry: false,
                previousAttempts: 0,
                totalRetryDelay: 0,
              },
      },
    };

    return new NotificationSent(
      notificationId,
      payload,
      additionalContext?.sequenceNumber,
      additionalContext?.correlationId,
      additionalContext?.metadata,
    );
  }

  /**
   * 🔐 Hash sécurisé d'un contact (email/téléphone)
   */
  private static hashContact(contact: string): string {
    if (!contact) return "unknown";

    // Simple hash pour l'exemple - en production utiliser crypto.createHash
    return Buffer.from(contact.toLowerCase()).toString("base64").slice(0, 16);
  }

  /**
   * 📏 Estimation de la taille d'un message
   */
  private static estimateMessageSize(adapterResult: any): number {
    // Estimation basée sur le contenu disponible
    const baseSize = JSON.stringify(adapterResult).length;
    return baseSize;
  }

  /**
   * 🔐 Hash du contenu pour déduplication
   */
  private static hashContent(content: string): string {
    // Simple hash pour l'exemple
    return Buffer.from(content).toString("base64").slice(0, 20);
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
        delivery: {
          ...this.payload.delivery,
          sentAt: this.payload.delivery.sentAt.toISOString(),
        },
        tracking: {
          ...this.payload.tracking,
          estimatedDelivery:
            this.payload.tracking.estimatedDelivery?.toISOString(),
          trackingExpiresAt:
            this.payload.tracking.trackingExpiresAt?.toISOString(),
        },
        rateLimiting: this.payload.rateLimiting
          ? {
              ...this.payload.rateLimiting,
              resetTime: this.payload.rateLimiting.resetTime.toISOString(),
            }
          : undefined,
      },
      metadata: this.metadata,
    };
  }

  /**
   * 🔄 Désérialisation depuis JSON
   */
  static fromJSON(json: any): NotificationSent {
    const event = Object.create(NotificationSent.prototype);

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
      delivery: {
        ...json.payload.delivery,
        sentAt: new Date(json.payload.delivery.sentAt),
      },
      tracking: {
        ...json.payload.tracking,
        estimatedDelivery: json.payload.tracking.estimatedDelivery
          ? new Date(json.payload.tracking.estimatedDelivery)
          : undefined,
        trackingExpiresAt: json.payload.tracking.trackingExpiresAt
          ? new Date(json.payload.tracking.trackingExpiresAt)
          : undefined,
      },
      rateLimiting: json.payload.rateLimiting
        ? {
            ...json.payload.rateLimiting,
            resetTime: new Date(json.payload.rateLimiting.resetTime),
          }
        : undefined,
    };

    return event;
  }

  /**
   * 🏷️ Extraction des tags pour routing
   */
  getTags(): string[] {
    const tags: string[] = [
      "notification-sent",
      `type-${this.payload.type.toLowerCase()}`,
      `channel-${this.payload.channel.toLowerCase()}`,
      `provider-${this.payload.delivery.provider}`,
      `attempt-${this.payload.delivery.attempt}`,
    ];

    // Tags métier
    if (this.payload.businessContext?.entityType) {
      tags.push(`entity-${this.payload.businessContext.entityType}`);
    }

    if (this.payload.businessContext?.serviceType) {
      tags.push(
        `service-${this.payload.businessContext.serviceType.toLowerCase()}`,
      );
    }

    // Tags de performance
    if (this.payload.delivery.latency > 5000) {
      tags.push("slow-delivery");
    }

    if (this.payload.metadata.wasFallback) {
      tags.push("fallback-used");
    }

    if (this.payload.metadata.retryInfo?.isRetry) {
      tags.push("retry-success");
    }

    // Tags de tracking
    if (this.payload.tracking.enabled) {
      tags.push("tracking-enabled");
    }

    // Tags de coût
    if (this.payload.delivery.cost) {
      tags.push(`paid-${this.payload.delivery.cost.currency.toLowerCase()}`);
    }

    // Tags personnalisés
    tags.push(...this.payload.metadata.tags.map((tag) => `custom-${tag}`));

    return tags;
  }

  /**
   * 📊 Calcul du score de performance
   */
  getPerformanceScore(): number {
    let score = 100;

    // Pénalité pour latence élevée
    if (this.payload.delivery.latency > 10000) {
      // > 10s
      score -= 30;
    } else if (this.payload.delivery.latency > 5000) {
      // > 5s
      score -= 15;
    } else if (this.payload.delivery.latency > 2000) {
      // > 2s
      score -= 5;
    }

    // Pénalité pour retry
    if (this.payload.metadata.retryInfo?.isRetry) {
      score -= 10 * this.payload.metadata.retryInfo.previousAttempts;
    }

    // Pénalité pour fallback
    if (this.payload.metadata.wasFallback) {
      score -= 20;
    }

    // Bonus pour tracking activé
    if (this.payload.tracking.enabled) {
      score += 5;
    }

    // Bonus pour faible latence
    if (this.payload.delivery.latency < 1000) {
      // < 1s
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 💰 Calcul du coût estimé si pas fourni
   */
  getEstimatedCost(): { amount: number; currency: string } | null {
    if (this.payload.delivery.cost) {
      return {
        amount: this.payload.delivery.cost.amount,
        currency: this.payload.delivery.cost.currency,
      };
    }

    // Estimation basée sur le canal et la taille
    const baseCosts: Record<string, number> = {
      EMAIL: 0.001, // $0.001 per email
      SMS: 0.05, // $0.05 per SMS
      WHATSAPP: 0.02, // $0.02 per WhatsApp message
      PUSH: 0.0001, // $0.0001 per push
    };

    const baseCost = baseCosts[this.payload.channel] || 0;

    // Ajustement pour taille du message
    const sizeMultiplier = Math.ceil(this.payload.delivery.messageSize / 1024); // Par KB

    return baseCost > 0
      ? {
          amount: baseCost * sizeMultiplier,
          currency: "USD",
        }
      : null;
  }

  /**
   * 🎯 Prédicat pour filtrage avancé
   */
  matches(criteria: {
    types?: NotificationType[];
    channels?: NotificationChannel[];
    providers?: string[];
    minLatency?: number;
    maxLatency?: number;
    hasTracking?: boolean;
    wasFallback?: boolean;
    isRetry?: boolean;
    hasBusinessContext?: boolean;
    entityTypes?: string[];
    serviceTypes?: string[];
    environments?: string[];
    costRange?: { min: number; max: number; currency?: string };
  }): boolean {
    if (criteria.types && !criteria.types.includes(this.payload.type)) {
      return false;
    }

    if (
      criteria.channels &&
      !criteria.channels.includes(this.payload.channel)
    ) {
      return false;
    }

    if (
      criteria.providers &&
      !criteria.providers.includes(this.payload.delivery.provider)
    ) {
      return false;
    }

    if (
      criteria.minLatency &&
      this.payload.delivery.latency < criteria.minLatency
    ) {
      return false;
    }

    if (
      criteria.maxLatency &&
      this.payload.delivery.latency > criteria.maxLatency
    ) {
      return false;
    }

    if (
      criteria.hasTracking !== undefined &&
      criteria.hasTracking !== this.payload.tracking.enabled
    ) {
      return false;
    }

    if (
      criteria.wasFallback !== undefined &&
      criteria.wasFallback !== this.payload.metadata.wasFallback
    ) {
      return false;
    }

    if (
      criteria.isRetry !== undefined &&
      criteria.isRetry !== this.payload.metadata.retryInfo?.isRetry
    ) {
      return false;
    }

    if (criteria.hasBusinessContext !== undefined) {
      const hasContext = !!this.payload.businessContext;
      if (criteria.hasBusinessContext !== hasContext) {
        return false;
      }
    }

    if (criteria.costRange && this.payload.delivery.cost) {
      const cost = this.payload.delivery.cost;
      if (
        criteria.costRange.currency &&
        cost.currency !== criteria.costRange.currency
      ) {
        return false;
      }

      if (
        cost.amount < criteria.costRange.min ||
        cost.amount > criteria.costRange.max
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * 📊 Extraction des métriques détaillées
   */
  getDetailedMetrics(): Record<string, any> {
    const estimatedCost = this.getEstimatedCost();

    return {
      // Identifiants
      eventId: this.eventId,
      notificationId: this.payload.notificationId,
      externalId: this.payload.externalId,
      correlationId: this.metadata.correlationId,

      // Classification
      type: this.payload.type,
      channel: this.payload.channel,
      provider: this.payload.delivery.provider,

      // Performance
      latency: this.payload.delivery.latency,
      timeToSend: this.payload.performance.timeToSend,
      queueLatency: this.payload.performance.queueLatency,
      performanceScore: this.getPerformanceScore(),

      // Delivery
      attempt: this.payload.delivery.attempt,
      messageSize: this.payload.delivery.messageSize,
      httpStatusCode: this.payload.delivery.httpStatusCode,
      region: this.payload.delivery.region,

      // Content
      hasAttachments: this.payload.content.hasAttachments,
      attachmentCount: this.payload.content.attachmentCount,
      personalizedVariables: this.payload.content.personalizedVariables,
      actionCount: this.payload.content.actionCount,

      // Tracking
      trackingEnabled: this.payload.tracking.enabled,
      supportsDeliveryReceipt: this.payload.tracking.supportsDeliveryReceipt,
      supportsReadReceipt: this.payload.tracking.supportsReadReceipt,

      // Business
      entityType: this.payload.businessContext?.entityType,
      serviceType: this.payload.businessContext?.serviceType,
      customerId: this.payload.businessContext?.customerId,
      transactionAmount: this.payload.businessContext?.transactionAmount,

      // Cost
      cost: this.payload.delivery.cost?.amount || estimatedCost?.amount,
      currency: this.payload.delivery.cost?.currency || estimatedCost?.currency,

      // Metadata
      environment: this.payload.metadata.environment,
      wasFallback: this.payload.metadata.wasFallback,
      isRetry: this.payload.metadata.retryInfo?.isRetry || false,
      previousAttempts: this.payload.metadata.retryInfo?.previousAttempts || 0,

      // Rate limiting
      rateLimitRemaining: this.payload.rateLimiting?.remaining,
      quotaUsage: this.payload.rateLimiting?.quotaUsage,

      // Timestamps
      sentAt: this.payload.delivery.sentAt,
      estimatedDelivery: this.payload.tracking.estimatedDelivery,

      // Technical
      workerId: this.payload.performance.workerId,
      queueName: this.payload.performance.queueName,
      workerCpuUsage: this.payload.performance.workerCpuUsage,
      workerMemoryUsage: this.payload.performance.workerMemoryUsage,
    };
  }
}

// =============================================================================
// 📝 EXEMPLE D'UTILISATION
// =============================================================================
/*
import { NotificationSent } from './NotificationSent';
import { NotificationType, NotificationChannel } from '../entities/Notification';

// 1. Création d'événement après envoi réussi
class EmailAdapter {
  async send(notification: Notification): Promise<AdapterDeliveryResult> {
    const startTime = Date.now();
    
    try {
      // Envoi SMTP
      const smtpResult = await this.sendEmail(notification);
      
      // Création de l'événement de succès
      const event = NotificationSent.fromAdapterResult(
        notification.id,
        notification.type,
        {
          success: true,
          channel: NotificationChannel.EMAIL,
          externalId: smtpResult.messageId,
          deliveryMetadata: {
            provider: 'smtp-gmail',
            latency: Date.now() - startTime,
            httpStatus: 250,
            routing: {
              region: 'europe-west1',
              apiVersion: 'smtp-v1'
            }
          },
          trackingInfo: {
            supportsReadReceipt: true,
            supportsDeliveryReceipt: true,
            estimatedDelivery: new Date(Date.now() + 5000)
          }
        },
        {
          businessContext: {
            entityType: 'booking',
            entityId: 'BK-12345',
            serviceType: 'MOVING',
            customerId: 'customer-789'
          },
          performance: {
            timeToSend: Date.now() - notification.createdAt.getTime(),
            workerId: 'worker-email-1',
            queueName: 'email-queue'
          },
          correlationId: notification.correlationId // Sera dans metadata
        }
      );
      
      // Publication de l'événement
      await this.eventBus.publish(event);
      
      return result;
      
    } catch (error) {
      // En cas d'erreur, publier NotificationFailed (autre événement)
      throw error;
    }
  }
}

// 2. Handler pour métriques temps réel
class PerformanceMetricsHandler {
  async handle(event: NotificationSent) {
    const metrics = event.getDetailedMetrics();
    
    // Métriques Prometheus
    this.prometheus.increment('notifications_sent_total', {
      type: metrics.type,
      channel: metrics.channel,
      provider: metrics.provider,
      environment: metrics.environment
    });
    
    this.prometheus.observe('notification_send_duration_seconds', 
      metrics.latency / 1000, {
        channel: metrics.channel,
        provider: metrics.provider
      }
    );
    
    this.prometheus.observe('notification_queue_duration_seconds',
      (metrics.queueLatency || 0) / 1000, {
        queue: metrics.queueName
      }
    );
    
    // Score de performance
    this.prometheus.gauge('notification_performance_score',
      metrics.performanceScore, {
        provider: metrics.provider
      }
    );
  }
}

// 3. Handler pour tracking automatique
class TrackingSetupHandler {
  async handle(event: NotificationSent) {
    if (!event.payload.tracking.enabled) {
      return; // Tracking désactivé
    }
    
    // Enregistrer dans le système de tracking
    await this.trackingService.register({
      notificationId: event.payload.notificationId,
      externalId: event.payload.externalId,
      channel: event.payload.channel,
      trackingUrl: event.payload.tracking.trackingUrl,
      webhookUrl: event.payload.tracking.webhookUrl,
      expiresAt: event.payload.tracking.trackingExpiresAt
    });
    
    // Si SMS/WhatsApp, pas de tracking additionnel nécessaire
    // Si Email, setup tracking pixels et liens
    if (event.payload.channel === 'EMAIL') {
      await this.setupEmailTracking(event);
    }
  }
}

// 4. Handler pour billing automatique
class BillingHandler {
  async handle(event: NotificationSent) {
    const cost = event.payload.delivery.cost || event.getEstimatedCost();
    
    if (!cost || cost.amount <= 0) {
      return; // Pas de coût
    }
    
    // Enregistrer la charge
    await this.billingService.recordCharge({
      customerId: event.payload.businessContext?.customerId,
      entityType: event.payload.businessContext?.entityType,
      entityId: event.payload.businessContext?.entityId,
      notificationId: event.payload.notificationId,
      channel: event.payload.channel,
      provider: event.payload.delivery.provider,
      amount: cost.amount,
      currency: cost.currency,
      chargeDate: event.payload.delivery.sentAt,
      metadata: {
        messageSize: event.payload.delivery.messageSize,
        region: event.payload.delivery.region,
        attempt: event.payload.delivery.attempt
      }
    });
  }
}

// 5. Handler pour analytics business
class BusinessAnalyticsHandler {
  async handle(event: NotificationSent) {
    const context = event.payload.businessContext;
    if (!context) return;
    
    // Analytics par type d'entité
    switch (context.entityType) {
      case 'booking':
        await this.analytics.track('booking_notification_sent', {
          bookingId: context.entityId,
          serviceType: context.serviceType,
          channel: event.payload.channel,
          customerId: context.customerId,
          latency: event.payload.delivery.latency,
          isRetry: event.payload.metadata.retryInfo?.isRetry || false
        });
        break;
        
      case 'payment':
        await this.analytics.track('payment_notification_sent', {
          paymentId: context.entityId,
          amount: context.transactionAmount,
          customerId: context.customerId,
          channel: event.payload.channel,
          performanceScore: event.getPerformanceScore()
        });
        break;
    }
    
    // Funnel tracking pour conversion
    if (event.payload.tracking.enabled) {
      await this.funnelTracker.recordStep('notification_delivered', {
        userId: context.customerId,
        entityType: context.entityType,
        entityId: context.entityId,
        channel: event.payload.channel
      });
    }
  }
}

// 6. Handler pour alerting automatique
class AlertingHandler {
  async handle(event: NotificationSent) {
    // Alerte si performance dégradée
    const performanceScore = event.getPerformanceScore();
    if (performanceScore < 50) {
      await this.alertManager.sendAlert({
        severity: 'warning',
        title: 'Performance Notification Dégradée',
        description: `Score: ${performanceScore}%, Latence: ${event.payload.delivery.latency}ms`,
        tags: ['performance', event.payload.channel, event.payload.delivery.provider],
        metadata: {
          notificationId: event.payload.notificationId,
          provider: event.payload.delivery.provider,
          latency: event.payload.delivery.latency,
          isRetry: event.payload.metadata.retryInfo?.isRetry
        }
      });
    }
    
    // Alerte si utilisation quota élevée
    if (event.payload.rateLimiting && event.payload.rateLimiting.quotaUsage > 85) {
      await this.alertManager.sendAlert({
        severity: 'warning',
        title: 'Quota Provider Bientôt Atteint',
        description: `Utilisation: ${event.payload.rateLimiting.quotaUsage}%`,
        tags: ['quota', event.payload.delivery.provider]
      });
    }
  }
}

// 7. Configuration des handlers
const eventBus = new EventBus();

eventBus.subscribe(NotificationSent, [
  new PerformanceMetricsHandler(),
  new TrackingSetupHandler(), 
  new BillingHandler(),
  new BusinessAnalyticsHandler(),
  new AlertingHandler()
]);

// 8. Filtrage pour handlers conditionnels
eventBus.subscribe(
  NotificationSent,
  new CriticalNotificationHandler(),
  (event) => event.matches({
    types: [NotificationType.PAYMENT_FAILED, NotificationType.SYSTEM_MAINTENANCE],
    hasBusinessContext: true
  })
);

eventBus.subscribe(
  NotificationSent,
  new SlowDeliveryAnalysisHandler(),
  (event) => event.matches({
    minLatency: 5000, // > 5s
    isRetry: false     // Pas de retry pour éviter les doublons d'analyse
  })
);
*/
