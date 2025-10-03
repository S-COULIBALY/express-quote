// =============================================================================
// 🎯 ÉVÉNEMENT DOMAINE - Notification Créée
// =============================================================================
//
// Utilité:
// - Événement émis lors de la création d'une nouvelle notification
// - Déclenchement des workflows automatiques (mise en queue, validation)
// - Intégration avec d'autres bounded contexts (analytics, audit)
// - Pattern Event Sourcing pour traçabilité complète
// - Découplage des side effects via Event Handlers
//
// Architecture Event-Driven:
// - Événement immutable avec payload typé
// - Métadonnées de traçage et corrélation
// - Sérialisation/désérialisation transparente
// - Support des projections et event store
// - Integration avec message brokers (EventBridge, Kafka)
// =============================================================================

import { randomUUID } from 'crypto';
import { DomainEvent } from '../interfaces';
import { Notification, NotificationType, NotificationChannel } from '../entities/Notification';

/**
 * 📋 Payload de l'événement NotificationCreated
 * 
 * Utilité:
 * - Données spécifiques à la création de notification
 * - Informations nécessaires aux event handlers
 * - Contexte métier pour décisions automatiques
 * - Payload optimisé pour serialization/network transfer
 */
export interface NotificationCreatedPayload {
  /** ID de la notification créée */
  notificationId: string;
  
  /** Type de notification métier */
  type: NotificationType;
  
  /** Canal principal configuré */
  primaryChannel: NotificationChannel;
  
  /** Canaux de fallback disponibles */
  fallbackChannels?: NotificationChannel[];
  
  /** Informations du destinataire (anonymisées pour RGPD) */
  recipient: {
    /** ID utilisateur/customer */
    id: string;
    
    /** Langue préférée */
    language: string;
    
    /** Timezone du destinataire */
    timezone: string;
    
    /** Présence des coordonnées (sans exposer les valeurs réelles) */
    hasEmail: boolean;
    hasPhone: boolean;
    
    /** Préférences de canal si configurées */
    channelPreferences?: Partial<Record<NotificationType, NotificationChannel[]>>;
  };
  
  /** Métadonnées du contenu */
  content: {
    /** Template utilisé si applicable */
    templateId?: string;
    
    /** Version du template */
    templateVersion?: string;
    
    /** Nombre de variables de personnalisation */
    variableCount: number;
    
    /** Présence de pièces jointes */
    hasAttachments: boolean;
    
    /** Nombre de pièces jointes */
    attachmentCount: number;
    
    /** Taille approximative du contenu (bytes) */
    estimatedSize: number;
    
    /** Actions disponibles (boutons, liens) */
    actionCount: number;
  };
  
  /** Configuration de livraison */
  delivery: {
    /** Priorité de la notification */
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
    
    /** Envoi programmé */
    isScheduled: boolean;
    
    /** Date d'envoi programmée si applicable */
    scheduledAt?: Date;
    
    /** Date d'expiration */
    expiresAt?: Date;
    
    /** Tracking activé */
    trackingEnabled: boolean;
    
    /** Retry activé */
    retryEnabled: boolean;
    
    /** Nombre maximum de tentatives */
    maxRetries?: number;
    
    /** Tags pour analytics */
    tags: string[];
  };
  
  /** Contexte métier Express Quote */
  businessContext?: {
    /** Type d'entité liée (booking, quote, payment) */
    entityType?: string;
    
    /** ID de l'entité liée */
    entityId?: string;
    
    /** Workflow parent */
    workflowId?: string;
    
    /** Customer/user associé */
    customerId?: string;
    
    /** Service Express Quote concerné */
    serviceType?: string;
    
    /** Montant si applicable (pour notifications de paiement) */
    amount?: number;
    
    /** Autres données métier */
    metadata?: Record<string, any>;
  };
  
  /** Informations de création */
  creation: {
    /** Timestamp de création */
    createdAt: Date;
    
    /** Source de création (api, scheduler, system) */
    source: string;
    
    /** Version de l'application */
    appVersion?: string;
    
    /** Environment (dev, staging, prod) */
    environment?: string;
  };
}

/**
 * 🎯 ÉVÉNEMENT DOMAINE - NotificationCreated
 * 
 * Cet événement est émis à chaque fois qu'une nouvelle notification
 * est créée dans le système Express Quote. Il déclenche automatiquement
 * les processus de validation, mise en queue, et notification des
 * services intéressés.
 * 
 * Cas d'usage typiques:
 * - Validation automatique du contenu et des destinataires
 // - Mise en queue dans le système BullMQ approprié
 * - Logging et audit des créations de notifications
 * - Déclenchement d'analytics temps réel
 * - Intégration avec systèmes externes (CRM, marketing)
 * - A/B testing et expérimentation
 */
export class NotificationCreated implements DomainEvent<NotificationCreatedPayload> {
  public readonly eventId: string;
  public readonly eventType: string = 'NotificationCreated';
  public readonly version: string = '1.0.0';
  public readonly timestamp: Date;
  public readonly aggregateId: string;
  public readonly aggregateType: string = 'Notification';
  public readonly sequenceNumber: number;
  public readonly payload: NotificationCreatedPayload;
  public readonly metadata: DomainEvent['metadata'];

  /**
   * 🏗️ Constructeur de l'événement
   * 
   * @param notification La notification qui vient d'être créée
   * @param sequenceNumber Numéro de séquence dans l'agrégat
   * @param correlationId ID de corrélation pour traçage
   * @param metadata Métadonnées additionnelles
   */
  constructor(
    notification: Notification,
    sequenceNumber: number = 1,
    correlationId?: string,
    metadata?: Partial<DomainEvent['metadata']>
  ) {
    this.eventId = randomUUID();
    this.timestamp = new Date();
    this.aggregateId = notification.id;
    this.sequenceNumber = sequenceNumber;
    this.correlationId = correlationId;
    
    // Construction du payload depuis la notification
    this.payload = this.buildPayload(notification);
    
    // Métadonnées avec valeurs par défaut
    this.metadata = {
      source: 'notification-service',
      traceId: randomUUID(),
      context: {
        notificationService: 'express-quote-v2',
        domain: 'notification'
      },
      ...metadata
    };
  }
  
  /**
   * 🏗️ Construction du payload depuis une notification
   * 
   * Extrait les données pertinentes en préservant la confidentialité.
   * Anonymise les données personnelles selon les exigences RGPD.
   */
  private buildPayload(notification: Notification): NotificationCreatedPayload {
    const recipient = notification.recipient;
    const content = notification.content;
    const deliveryConfig = notification.deliveryConfig;
    
    return {
      notificationId: notification.id,
      type: notification.type,
      primaryChannel: deliveryConfig.primaryChannel,
      fallbackChannels: deliveryConfig.fallbackChannels,
      
      recipient: {
        id: recipient.id,
        language: recipient.language,
        timezone: recipient.timezone,
        hasEmail: !!recipient.email,
        hasPhone: !!recipient.phone,
        channelPreferences: recipient.channelPreferences
      },
      
      content: {
        templateId: content.templateId,
        templateVersion: content.renderMetadata?.templateVersion,
        variableCount: Object.keys(content.variables || {}).length,
        hasAttachments: !!(content.attachments && content.attachments.length > 0),
        attachmentCount: content.attachments?.length || 0,
        estimatedSize: this.estimateContentSize(content),
        actionCount: content.actions?.length || 0
      },
      
      delivery: {
        priority: notification.priority as any,
        isScheduled: !!deliveryConfig.scheduledAt,
        scheduledAt: deliveryConfig.scheduledAt,
        expiresAt: deliveryConfig.expiresAt,
        trackingEnabled: deliveryConfig.trackingEnabled || false,
        retryEnabled: (deliveryConfig.maxRetries || 0) > 0,
        maxRetries: deliveryConfig.maxRetries,
        tags: deliveryConfig.tags || []
      },
      
      businessContext: this.extractBusinessContext(notification),
      
      creation: {
        createdAt: notification.createdAt,
        source: this.metadata?.source || 'unknown',
        appVersion: process.env.APP_VERSION,
        environment: process.env.NODE_ENV || 'development'
      }
    };
  }
  
  /**
   * 📏 Estimation de la taille du contenu
   */
  private estimateContentSize(content: any): number {
    const textSize = (content.subject?.length || 0) + 
                    (content.textBody?.length || 0) + 
                    (content.htmlBody?.length || 0);
    
    const attachmentSize = content.attachments?.reduce(
      (total: number, att: any) => total + (att.size || 0), 0
    ) || 0;
    
    return textSize + attachmentSize;
  }
  
  /**
   * 🏢 Extraction du contexte métier Express Quote
   */
  private extractBusinessContext(notification: Notification): NotificationCreatedPayload['businessContext'] {
    const correlationId = notification.correlationId;
    
    // Extraction des informations depuis le correlation ID ou les métadonnées
    const businessContext: NotificationCreatedPayload['businessContext'] = {};
    
    // Pattern matching sur le correlation ID pour extraire le contexte
    if (correlationId) {
      const bookingMatch = correlationId.match(/booking-(\w+)/);
      if (bookingMatch) {
        businessContext.entityType = 'booking';
        businessContext.entityId = bookingMatch[1];
      }
      
      const quoteMatch = correlationId.match(/quote-(\w+)/);
      if (quoteMatch) {
        businessContext.entityType = 'quote';
        businessContext.entityId = quoteMatch[1];
      }
      
      const paymentMatch = correlationId.match(/payment-(\w+)/);
      if (paymentMatch) {
        businessContext.entityType = 'payment';
        businessContext.entityId = paymentMatch[1];
      }
    }
    
    // Extraction depuis les variables du template
    const variables = notification.content.variables || {};
    if (variables.customer?.id) {
      businessContext.customerId = variables.customer.id;
    }
    
    if (variables.booking?.serviceType) {
      businessContext.serviceType = variables.booking.serviceType;
    }
    
    if (variables.payment?.amount) {
      businessContext.amount = variables.payment.amount;
    }
    
    // Ajout des tags de livraison comme métadonnées
    if (notification.deliveryConfig.tags) {
      businessContext.metadata = {
        deliveryTags: notification.deliveryConfig.tags
      };
    }
    
    return Object.keys(businessContext).length > 0 ? businessContext : undefined;
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
      correlationId: this.correlationId,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      sequenceNumber: this.sequenceNumber,
      payload: {
        ...this.payload,
        scheduledAt: this.payload.delivery.scheduledAt?.toISOString(),
        expiresAt: this.payload.delivery.expiresAt?.toISOString(),
        creation: {
          ...this.payload.creation,
          createdAt: this.payload.creation.createdAt.toISOString()
        }
      },
      metadata: this.metadata
    };
  }
  
  /**
   * 🔄 Désérialisation depuis JSON
   */
  static fromJSON(json: any): NotificationCreated {
    const event = Object.create(NotificationCreated.prototype);
    
    event.eventId = json.eventId;
    event.eventType = json.eventType;
    event.version = json.version;
    event.timestamp = new Date(json.timestamp);
    event.correlationId = json.correlationId;
    event.aggregateId = json.aggregateId;
    event.aggregateType = json.aggregateType;
    event.sequenceNumber = json.sequenceNumber;
    event.metadata = json.metadata;
    
    // Reconstruction du payload avec dates
    event.payload = {
      ...json.payload,
      delivery: {
        ...json.payload.delivery,
        scheduledAt: json.payload.delivery.scheduledAt ? 
          new Date(json.payload.delivery.scheduledAt) : undefined,
        expiresAt: json.payload.delivery.expiresAt ? 
          new Date(json.payload.delivery.expiresAt) : undefined
      },
      creation: {
        ...json.payload.creation,
        createdAt: new Date(json.payload.creation.createdAt)
      }
    };
    
    return event;
  }
  
  /**
   * 🎯 Factory method pour création simplifiée
   */
  static create(
    notification: Notification,
    options: {
      correlationId?: string;
      sequenceNumber?: number;
      source?: string;
      userId?: string;
      sessionId?: string;
      traceId?: string;
      additionalContext?: Record<string, any>;
    } = {}
  ): NotificationCreated {
    return new NotificationCreated(
      notification,
      options.sequenceNumber || 1,
      options.correlationId,
      {
        source: options.source,
        userId: options.userId,
        sessionId: options.sessionId,
        traceId: options.traceId,
        context: options.additionalContext
      }
    );
  }
  
  /**
   * 🏷️ Extraction des tags pour routing d'événements
   */
  getTags(): string[] {
    const tags: string[] = [
      'notification-created',
      `type-${this.payload.type.toLowerCase()}`,
      `channel-${this.payload.primaryChannel.toLowerCase()}`,
      `priority-${this.payload.delivery.priority.toLowerCase()}`
    ];
    
    // Ajout des tags métier
    if (this.payload.businessContext?.entityType) {
      tags.push(`entity-${this.payload.businessContext.entityType}`);
    }
    
    if (this.payload.businessContext?.serviceType) {
      tags.push(`service-${this.payload.businessContext.serviceType.toLowerCase()}`);
    }
    
    // Ajout des tags de livraison
    tags.push(...this.payload.delivery.tags.map(tag => `custom-${tag}`));
    
    // Tag scheduled si programmé
    if (this.payload.delivery.isScheduled) {
      tags.push('scheduled');
    }
    
    return tags;
  }
  
  /**
   * 🔍 Prédicat pour filtrage d'événements
   */
  matches(criteria: {
    types?: NotificationType[];
    channels?: NotificationChannel[];
    priorities?: string[];
    hasBusinessContext?: boolean;
    isScheduled?: boolean;
    entityTypes?: string[];
    serviceTypes?: string[];
    tags?: string[];
  }): boolean {
    if (criteria.types && !criteria.types.includes(this.payload.type)) {
      return false;
    }
    
    if (criteria.channels && !criteria.channels.includes(this.payload.primaryChannel)) {
      return false;
    }
    
    if (criteria.priorities && !criteria.priorities.includes(this.payload.delivery.priority)) {
      return false;
    }
    
    if (criteria.hasBusinessContext !== undefined) {
      const hasContext = !!this.payload.businessContext;
      if (criteria.hasBusinessContext !== hasContext) {
        return false;
      }
    }
    
    if (criteria.isScheduled !== undefined) {
      if (criteria.isScheduled !== this.payload.delivery.isScheduled) {
        return false;
      }
    }
    
    if (criteria.entityTypes && this.payload.businessContext?.entityType) {
      if (!criteria.entityTypes.includes(this.payload.businessContext.entityType)) {
        return false;
      }
    }
    
    if (criteria.serviceTypes && this.payload.businessContext?.serviceType) {
      if (!criteria.serviceTypes.includes(this.payload.businessContext.serviceType)) {
        return false;
      }
    }
    
    if (criteria.tags && criteria.tags.length > 0) {
      const eventTags = this.getTags();
      const hasMatchingTag = criteria.tags.some(tag => eventTags.includes(tag));
      if (!hasMatchingTag) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * 📊 Extraction des métriques pour analytics
   */
  getAnalyticsData(): Record<string, any> {
    return {
      eventType: this.eventType,
      notificationType: this.payload.type,
      channel: this.payload.primaryChannel,
      priority: this.payload.delivery.priority,
      hasAttachments: this.payload.content.hasAttachments,
      attachmentCount: this.payload.content.attachmentCount,
      isScheduled: this.payload.delivery.isScheduled,
      trackingEnabled: this.payload.delivery.trackingEnabled,
      recipientLanguage: this.payload.recipient.language,
      recipientTimezone: this.payload.recipient.timezone,
      hasEmail: this.payload.recipient.hasEmail,
      hasPhone: this.payload.recipient.hasPhone,
      templateId: this.payload.content.templateId,
      businessEntityType: this.payload.businessContext?.entityType,
      serviceType: this.payload.businessContext?.serviceType,
      environment: this.payload.creation.environment,
      tags: this.payload.delivery.tags,
      estimatedSize: this.payload.content.estimatedSize,
      variableCount: this.payload.content.variableCount,
      actionCount: this.payload.content.actionCount
    };
  }
}

// =============================================================================
// 📝 EXEMPLE D'UTILISATION
// =============================================================================
/*
import { NotificationCreated } from './NotificationCreated';
import { NotificationFactory } from '../entities/Notification';

// 1. Création d'événement lors de la création de notification
class NotificationService {
  async createNotification(recipient: any, content: any) {
    // Créer la notification
    const notification = NotificationFactory.createBookingConfirmation(
      recipient,
      content,
      { correlationId: 'booking-12345' }
    );
    
    // Émettre l'événement de création
    const event = NotificationCreated.create(notification, {
      correlationId: 'booking-12345',
      source: 'booking-service',
      userId: recipient.id,
      sessionId: 'session-789',
      additionalContext: {
        userAgent: 'Express Quote Mobile App',
        ipAddress: '192.168.1.100'
      }
    });
    
    // Publier l'événement
    await this.eventBus.publish(event);
    
    return notification;
  }
}

// 2. Handler d'événement pour mise en queue automatique
class NotificationQueueHandler {
  async handle(event: NotificationCreated) {
    const { notificationId, primaryChannel, priority } = event.payload;
    
    // Déterminer la queue appropriée
    const queueName = this.getQueueName(primaryChannel);
    
    // Créer le job avec priorité
    await this.queue.addJob(queueName, {
      notificationId,
      priority,
      correlationId: event.correlationId
    });
    
    console.log(`Notification ${notificationId} ajoutée à ${queueName}`);
  }
}

// 3. Analytics handler pour métriques temps réel
class NotificationAnalyticsHandler {
  async handle(event: NotificationCreated) {
    const metrics = event.getAnalyticsData();
    
    // Increment des compteurs
    await this.metricsCollector.increment('notifications_created_total', {
      type: metrics.notificationType,
      channel: metrics.channel,
      priority: metrics.priority
    });
    
    // Tracking business metrics
    if (metrics.businessEntityType) {
      await this.metricsCollector.increment('business_notifications_total', {
        entity_type: metrics.businessEntityType,
        service_type: metrics.serviceType || 'unknown'
      });
    }
  }
}

// 4. Audit handler pour compliance
class NotificationAuditHandler {
  async handle(event: NotificationCreated) {
    const auditRecord = {
      eventId: event.eventId,
      timestamp: event.timestamp,
      action: 'notification_created',
      resourceId: event.payload.notificationId,
      resourceType: 'notification',
      userId: event.metadata.userId,
      details: {
        type: event.payload.type,
        channel: event.payload.primaryChannel,
        recipientId: event.payload.recipient.id,
        businessContext: event.payload.businessContext
      }
    };
    
    await this.auditLogger.log(auditRecord);
  }
}

// 5. Configuration des handlers dans l'event bus
const eventBus = new EventBus();

eventBus.subscribe(NotificationCreated, [
  new NotificationQueueHandler(),
  new NotificationAnalyticsHandler(),
  new NotificationAuditHandler()
]);

// 6. Filtrage d'événements pour traitement conditionnel
eventBus.subscribe(
  NotificationCreated,
  new UrgentNotificationHandler(),
  (event) => event.matches({
    priorities: ['HIGH', 'CRITICAL'],
    types: [NotificationType.PAYMENT_FAILED, NotificationType.SYSTEM_MAINTENANCE]
  })
);

// 7. Recherche et replay d'événements
const events = await eventStore.getEvents({
  aggregateType: 'Notification',
  eventTypes: ['NotificationCreated'],
  from: new Date('2025-01-01'),
  to: new Date('2025-01-31')
});

for (const eventData of events) {
  const event = NotificationCreated.fromJSON(eventData);
  if (event.matches({ serviceTypes: ['MOVING'], priorities: ['HIGH'] })) {
    await replayHandler.handle(event);
  }
}
*/
