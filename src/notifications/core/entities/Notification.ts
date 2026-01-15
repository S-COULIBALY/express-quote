// =============================================================================
// 🔔 ENTITÉ NOTIFICATION - Cœur du Système de Notification
// =============================================================================
//
// Utilité:
// - Entité principale du domaine notification dans Express Quote
// - Encapsule toute la logique métier des notifications (email, WhatsApp, SMS)
// - Gère le cycle de vie complet: création → envoi → suivi → archivage
// - Fournit une interface uniforme pour tous les canaux de communication
// - Intègre la traçabilité, la retry logic, et la gestion d'erreurs
//
// Architecture Domain-Driven Design:
// - Entité riche avec méthodes métier (pas d'anemic model)
// - Invariants métier protégés par la classe
// - Events de domaine pour intégration avec autres bounded contexts
// - Value Objects pour concepts métier (destinataire, contenu, etc.)
// =============================================================================

import { randomUUID } from 'crypto';
import { NotificationStatus, NotificationStatusEnum } from './NotificationStatus';

/**
 * 🎯 Types de canaux de notification supportés
 * 
 * Utilité:
 * - Définit les canaux de communication disponibles
 * - Permet le routage automatique selon les préférences
 * - Support du fallback entre canaux (email → SMS → WhatsApp)
 * - Intégration future avec nouveaux canaux (Push, Discord, etc.)
 */
export enum NotificationChannel {
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS',
  PUSH = 'PUSH',           // Notifications push mobile (futur)
  WEBHOOK = 'WEBHOOK'      // Webhooks vers systèmes tiers
}

/**
 * 📋 Types de notifications métier Express Quote
 * 
 * Utilité:
 * - Classification des notifications selon leur contexte métier
 * - Templates et logique spécialisée par type
 * - Règles de retry et priorité différenciées
 * - Analytics et métriques par type de notification
 */
export enum NotificationType {
  // Notifications de réservation
  BOOKING_CONFIRMATION = 'BOOKING_CONFIRMATION',
  BOOKING_CANCELLATION = 'BOOKING_CANCELLATION',
  BOOKING_MODIFICATION = 'BOOKING_MODIFICATION',
  
  // Notifications de devis
  QUOTE_CREATED = 'QUOTE_CREATED',
  QUOTE_ACCEPTED = 'QUOTE_ACCEPTED',
  QUOTE_EXPIRED = 'QUOTE_EXPIRED',
  
  // Notifications de paiement
  PAYMENT_CONFIRMATION = 'PAYMENT_CONFIRMATION',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_REFUND = 'PAYMENT_REFUND',
  
  // Rappels et relances
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  PAYMENT_REMINDER = 'PAYMENT_REMINDER',
  FEEDBACK_REQUEST = 'FEEDBACK_REQUEST',
  
  // Notifications système
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',
  
  // Notifications marketing (avec opt-out)
  PROMOTIONAL_OFFER = 'PROMOTIONAL_OFFER',
  NEWSLETTER = 'NEWSLETTER'
}

/**
 * 🎖️ Niveaux de priorité des notifications
 * 
 * Utilité:
 * - Gestion des files d'attente avec priorité
 * - Retry logic différenciée selon l'importance
 * - SLA de traitement selon la priorité
 * - Alerting automatique pour notifications critiques
 */
export enum NotificationPriority {
  LOW = 'LOW',          // Newsletter, promotions (SLA: 24h)
  NORMAL = 'NORMAL',    // Confirmations standard (SLA: 1h)
  HIGH = 'HIGH',        // Rappels urgents (SLA: 15min)
  CRITICAL = 'CRITICAL' // Erreurs système, paiements (SLA: 5min)
}

/**
 * 👤 Destinataire de notification
 * 
 * Utilité:
 * - Encapsulation des données destinataire
 * - Validation des coordonnées (email, téléphone)
 * - Support multi-canal avec préférences
 * - Conformité RGPD avec gestion du consentement
 */
export interface NotificationRecipient {
  /** ID unique du destinataire (customer ID, user ID) */
  id: string;
  
  /** Nom complet pour personnalisation */
  name: string;
  
  /** Adresse email principale */
  email?: string;
  
  /** Numéro de téléphone (format international) */
  phone?: string;
  
  /** Langue préférée (ISO 639-1) */
  language: string;
  
  /** Fuseau horaire (IANA timezone) */
  timezone: string;
  
  /** Préférences de canal par type de notification */
  channelPreferences?: Partial<Record<NotificationType, NotificationChannel[]>>;
  
  /** Consentements RGPD par canal */
  consents?: Partial<Record<NotificationChannel, boolean>>;
  
  /** Métadonnées additionnelles */
  metadata?: Record<string, any>;
}

/**
 * 📄 Contenu de notification
 * 
 * Utilité:
 * - Structure unifiée pour tous les types de contenu
 * - Support multi-format (texte, HTML, Markdown)
 * - Personnalisation avec variables dynamiques
 * - Prévisualisation et validation avant envoi
 */
export interface NotificationContent {
  /** Sujet/titre de la notification */
  subject: string;
  
  /** Corps principal en texte brut */
  textBody: string;
  
  /** Corps en HTML (emails, notifications riches) */
  htmlBody?: string;
  
  /** Template ID utilisé (pour traçabilité) */
  templateId?: string;
  
  /** Variables de personnalisation */
  variables?: Record<string, any>;
  
  /** Pièces jointes (URLs ou base64) */
  attachments?: NotificationAttachment[];
  
  /** Actions possibles (boutons, liens) */
  actions?: NotificationAction[];
  
  /** Métadonnées de rendu */
  renderMetadata?: {
    templateVersion: string;
    renderEngine: string;
    renderTime: Date;
  };
}

/**
 * 📎 Pièce jointe
 */
export interface NotificationAttachment {
  filename: string;
  mimeType: string;
  size: number;
  url?: string;      // URL de téléchargement
  content?: string;  // Contenu base64
  metadata?: Record<string, any>;
}

/**
 * 🔘 Action utilisateur (boutons, liens)
 */
export interface NotificationAction {
  id: string;
  label: string;
  type: 'link' | 'button' | 'quick_reply';
  url?: string;
  payload?: string;
  style?: 'primary' | 'secondary' | 'danger';
}

/**
 * ⚙️ Configuration d'envoi
 * 
 * Utilité:
 * - Paramètres techniques de livraison
 * - Retry policy personnalisée
 * - Tracking et analytics
 * - Planification d'envoi différé
 */
export interface NotificationDeliveryConfig {
  /** Canal principal d'envoi */
  primaryChannel: NotificationChannel;
  
  /** Canaux de fallback en cas d'échec */
  fallbackChannels?: NotificationChannel[];
  
  /** Nombre maximum de tentatives */
  maxRetries?: number;
  
  /** Délai entre tentatives (ms) */
  retryDelay?: number;
  
  /** Multiplication du délai à chaque tentative */
  retryBackoffMultiplier?: number;
  
  /** Envoi programmé (si différé) */
  scheduledAt?: Date;
  
  /** Expiration de la notification */
  expiresAt?: Date;
  
  /** Tracking activé */
  trackingEnabled?: boolean;
  
  /** Tags pour analytics */
  tags?: string[];
  
  /** Métadonnées techniques */
  metadata?: Record<string, any>;
}

/**
 * 📊 Données de tracking et analytics
 */
export interface NotificationTracking {
  /** ID de tracking externe (provider) */
  externalId?: string;
  
  /** Timestamps des événements */
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  
  /** Détails de livraison */
  deliveryDetails?: {
    provider: string;
    messageId: string;
    attempts: number;
    cost?: number;
    latency?: number;
  };
  
  /** Erreurs rencontrées */
  errors?: Array<{
    timestamp: Date;
    code: string;
    message: string;
    recoverable: boolean;
  }>;
  
  /** Métriques d'engagement */
  engagement?: {
    opens: number;
    clicks: number;
    replies: number;
    unsubscribes: number;
  };

  /** Métadonnées additionnelles */
  metadata?: Record<string, unknown>;
}

/**
 * 🔔 ENTITÉ PRINCIPALE - Notification
 * 
 * Cette classe encapsule toute la logique métier d'une notification
 * dans le système Express Quote. Elle gère le cycle de vie complet
 * depuis la création jusqu'à la livraison finale.
 * 
 * Responsabilités:
 * - Maintenir l'état et l'intégrité de la notification
 * - Appliquer les règles métier de validation et de progression
 * - Gérer les tentatives de livraison avec retry intelligent
 * - Fournir une interface claire pour les services applicatifs
 * - Émettre des événements de domaine pour intégrations
 * - Calculer des métriques de performance et de fiabilité
 */
export class Notification {
  // Propriétés principales (immutables après création)
  private readonly _id: string;
  private readonly _type: NotificationType;
  private readonly _createdAt: Date;
  
  // État mutable de la notification
  private _status: NotificationStatus;
  private _recipient: NotificationRecipient;
  private _content: NotificationContent;
  private _deliveryConfig: NotificationDeliveryConfig;
  private _tracking: NotificationTracking;
  
  // Métadonnées et contexte
  private _priority: NotificationPriority;
  private _correlationId?: string;  // Pour tracer les workflows
  private _updatedAt: Date;
  
  /**
   * 🏗️ Constructeur avec validation des invariants métier
   */
  constructor(
    type: NotificationType,
    recipient: NotificationRecipient,
    content: NotificationContent,
    deliveryConfig: NotificationDeliveryConfig,
    options: {
      id?: string;
      priority?: NotificationPriority;
      correlationId?: string;
    } = {}
  ) {
    // Validation des invariants
    this.validateRecipient(recipient);
    this.validateContent(content);
    this.validateDeliveryConfig(deliveryConfig, recipient);
    
    // Initialisation des propriétés immutables
    this._id = options.id || randomUUID();
    this._type = type;
    this._createdAt = new Date();
    
    // Initialisation de l'état
    this._status = new NotificationStatus();
    this._recipient = { ...recipient };
    this._content = { ...content };
    this._deliveryConfig = { ...deliveryConfig };
    this._tracking = {};
    
    // Configuration optionnelle
    this._priority = options.priority || this.deriveDefaultPriority(type);
    this._correlationId = options.correlationId;
    this._updatedAt = this._createdAt;
  }
  
  // =============================================================================
  // 📖 PROPRIÉTÉS DE LECTURE (Getters)
  // =============================================================================
  
  get id(): string { return this._id; }
  get type(): NotificationType { return this._type; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  get status(): NotificationStatus { return this._status; }
  get recipient(): NotificationRecipient { return { ...this._recipient }; }
  get content(): NotificationContent { return { ...this._content }; }
  get deliveryConfig(): NotificationDeliveryConfig { return { ...this._deliveryConfig }; }
  get tracking(): NotificationTracking { return { ...this._tracking }; }
  get priority(): NotificationPriority { return this._priority; }
  get correlationId(): string | undefined { return this._correlationId; }
  
  // =============================================================================
  // 🎯 MÉTHODES MÉTIER PRINCIPALES
  // =============================================================================
  
  /**
   * 📤 Marquer la notification comme mise en queue
   */
  markAsQueued(queueName: string, workerId?: string): void {
    this._status.transitionTo(
      NotificationStatusEnum.QUEUED,
      'Ajoutée à la queue de traitement',
      { queueName },
      workerId
    );
    this._updatedAt = new Date();
  }
  
  /**
   * ⚙️ Marquer le début du traitement
   */
  startProcessing(workerId: string, provider?: string): void {
    this._status.transitionTo(
      NotificationStatusEnum.PROCESSING,
      'Traitement en cours',
      { provider },
      workerId
    );
    this._updatedAt = new Date();
  }
  
  /**
   * ✅ Marquer comme envoyée avec succès
   */
  markAsSent(externalId: string, provider: string, details?: any): void {
    this._status.transitionTo(
      NotificationStatusEnum.SENT,
      'Envoyée avec succès',
      { provider, externalId, ...details }
    );
    
    this._tracking.sentAt = new Date();
    this._tracking.externalId = externalId;
    this._tracking.deliveryDetails = {
      provider,
      messageId: externalId,
      attempts: this.getRetryCount() + 1,
      ...details
    };
    
    this._updatedAt = new Date();
  }
  
  /**
   * 🎯 Marquer comme livrée (confirmation externe)
   */
  markAsDelivered(deliveredAt?: Date): void {
    this._status.transitionTo(
      NotificationStatusEnum.DELIVERED,
      'Confirmée comme livrée'
    );
    
    this._tracking.deliveredAt = deliveredAt || new Date();
    this._updatedAt = new Date();
  }
  
  /**
   * ❌ Marquer en échec avec détails d'erreur
   */
  markAsFailed(error: string, isRecoverable = false, details?: any): void {
    this._status.transitionTo(
      NotificationStatusEnum.FAILED,
      `Échec: ${error}`,
      { isRecoverable, ...details }
    );
    
    // Ajouter l'erreur au tracking
    if (!this._tracking.errors) {
      this._tracking.errors = [];
    }
    
    this._tracking.errors.push({
      timestamp: new Date(),
      code: details?.errorCode || 'UNKNOWN',
      message: error,
      recoverable: isRecoverable
    });
    
    this._updatedAt = new Date();
  }
  
  /**
   * 🚫 Annuler la notification
   */
  cancel(reason: string): void {
    // Seulement si pas encore envoyée
    if (this._status.isSuccess()) {
      throw new Error('Impossible d\'annuler une notification déjà envoyée');
    }
    
    this._status.transitionTo(
      NotificationStatusEnum.CANCELLED,
      reason
    );
    this._updatedAt = new Date();
  }
  
  /**
   * ⏰ Marquer comme expirée
   */
  markAsExpired(): void {
    if (this._status.isTerminal()) {
      return; // Déjà dans un état terminal
    }
    
    this._status.transitionTo(
      NotificationStatusEnum.EXPIRED,
      'Expiration du délai de validité'
    );
    this._updatedAt = new Date();
  }
  
  // =============================================================================
  // 🔄 GESTION DES TENTATIVES (RETRY LOGIC)
  // =============================================================================
  
  /**
   * 🔁 Vérifier si une nouvelle tentative est possible
   */
  canRetry(): boolean {
    const currentRetries = this.getRetryCount();
    const maxRetries = this._deliveryConfig.maxRetries || 3;
    
    return !this._status.isTerminal() && 
           !this._status.isSuccess() && 
           currentRetries < maxRetries;
  }
  
  /**
   * 📊 Compter le nombre de tentatives effectuées
   */
  getRetryCount(): number {
    if (!this._tracking.errors) {
      return 0;
    }
    return this._tracking.errors.length;
  }
  
  /**
   * ⏳ Calculer le délai avant prochaine tentative
   */
  getNextRetryDelay(): number {
    const baseDelay = this._deliveryConfig.retryDelay || 1000;
    const backoffMultiplier = this._deliveryConfig.retryBackoffMultiplier || 2;
    const currentRetries = this.getRetryCount();
    
    return baseDelay * Math.pow(backoffMultiplier, currentRetries);
  }
  
  /**
   * 🔄 Préparer pour nouvelle tentative
   */
  prepareForRetry(newProvider?: string): void {
    // Transition vers QUEUED pour nouvelle tentative
    this._status.transitionTo(
      NotificationStatusEnum.QUEUED,
      'Préparation nouvelle tentative',
      { retryCount: this.getRetryCount() + 1, newProvider }
    );
    
    this._updatedAt = new Date();
  }
  
  // =============================================================================
  // 📈 TRACKING ET ANALYTICS
  // =============================================================================
  
  /**
   * 👁️ Enregistrer ouverture de notification
   */
  trackOpen(timestamp?: Date): void {
    this._tracking.openedAt = timestamp || new Date();
    
    if (!this._tracking.engagement) {
      this._tracking.engagement = { opens: 0, clicks: 0, replies: 0, unsubscribes: 0 };
    }
    
    this._tracking.engagement.opens++;
    this._updatedAt = new Date();
  }
  
  /**
   * 🖱️ Enregistrer clic sur action/lien
   */
  trackClick(actionId?: string, timestamp?: Date): void {
    this._tracking.clickedAt = timestamp || new Date();
    
    if (!this._tracking.engagement) {
      this._tracking.engagement = { opens: 0, clicks: 0, replies: 0, unsubscribes: 0 };
    }
    
    this._tracking.engagement.clicks++;
    
    // Tracking spécifique par action si fourni
    if (actionId) {
      this._tracking.metadata = {
        ...this._tracking.metadata,
        lastClickedAction: actionId
      };
    }
    
    this._updatedAt = new Date();
  }
  
  /**
   * 📊 Calculer les métriques de performance
   */
  getPerformanceMetrics(): {
    timeToSend: number | null;
    timeToDeliver: number | null;
    totalProcessingTime: number;
    retryCount: number;
    isEngaged: boolean;
  } {
    const sentTime = this._tracking.sentAt?.getTime();
    const deliveredTime = this._tracking.deliveredAt?.getTime();
    const createdTime = this._createdAt.getTime();
    
    return {
      timeToSend: sentTime ? sentTime - createdTime : null,
      timeToDeliver: deliveredTime ? deliveredTime - createdTime : null,
      totalProcessingTime: this._status.getTotalDuration(),
      retryCount: this.getRetryCount(),
      isEngaged: !!(this._tracking.openedAt || this._tracking.clickedAt)
    };
  }
  
  // =============================================================================
  // ✅ MÉTHODES DE VALIDATION
  // =============================================================================
  
  /**
   * 👤 Valider les données du destinataire
   */
  private validateRecipient(recipient: NotificationRecipient): void {
    if (!recipient.id || !recipient.name) {
      throw new Error('Destinataire invalide: ID et nom requis');
    }
    
    if (!recipient.email && !recipient.phone) {
      throw new Error('Destinataire invalide: email ou téléphone requis');
    }
    
    // Validation email basique
    if (recipient.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email)) {
      throw new Error('Format d\'email invalide');
    }
    
    // Validation langue/timezone
    if (!recipient.language || recipient.language.length !== 2) {
      throw new Error('Code langue invalide (format ISO 639-1 requis)');
    }
  }
  
  /**
   * 📄 Valider le contenu
   */
  private validateContent(content: NotificationContent): void {
    if (!content.subject || !content.textBody) {
      throw new Error('Contenu invalide: sujet et corps texte requis');
    }
    
    if (content.subject.length > 200) {
      throw new Error('Sujet trop long (max 200 caractères)');
    }
    
    if (content.attachments) {
      for (const attachment of content.attachments) {
        if (attachment.size > 25 * 1024 * 1024) { // 25MB max
          throw new Error(`Pièce jointe trop voluminheuse: ${attachment.filename}`);
        }
      }
    }
  }
  
  /**
   * ⚙️ Valider la configuration de livraison
   */
  private validateDeliveryConfig(config: NotificationDeliveryConfig, recipient: NotificationRecipient): void {
    // Vérifier que le canal principal est disponible pour le destinataire
    if (config.primaryChannel === NotificationChannel.EMAIL && !recipient.email) {
      throw new Error('Canal EMAIL requis mais email destinataire manquant');
    }
    
    if (config.primaryChannel === NotificationChannel.SMS && !recipient.phone) {
      throw new Error('Canal SMS requis mais téléphone destinataire manquant');
    }
    
    if (config.primaryChannel === NotificationChannel.WHATSAPP && !recipient.phone) {
      throw new Error('Canal WhatsApp requis mais téléphone destinataire manquant');
    }
    
    // Validation des paramètres de retry
    if (config.maxRetries && (config.maxRetries < 0 || config.maxRetries > 10)) {
      throw new Error('Nombre de tentatives invalide (0-10)');
    }
    
    // Validation dates
    if (config.scheduledAt && config.scheduledAt <= new Date()) {
      throw new Error('Date de planification doit être dans le futur');
    }
    
    if (config.expiresAt && config.expiresAt <= new Date()) {
      throw new Error('Date d\'expiration doit être dans le futur');
    }
  }
  
  /**
   * 🎖️ Dériver la priorité par défaut selon le type
   */
  private deriveDefaultPriority(type: NotificationType): NotificationPriority {
    switch (type) {
      case NotificationType.PAYMENT_FAILED:
      case NotificationType.SYSTEM_MAINTENANCE:
        return NotificationPriority.CRITICAL;
        
      case NotificationType.APPOINTMENT_REMINDER:
      case NotificationType.PAYMENT_REMINDER:
        return NotificationPriority.HIGH;
        
      case NotificationType.PROMOTIONAL_OFFER:
      case NotificationType.NEWSLETTER:
        return NotificationPriority.LOW;
        
      default:
        return NotificationPriority.NORMAL;
    }
  }
  
  // =============================================================================
  // 🔄 SÉRIALISATION ET PERSISTENCE
  // =============================================================================
  
  /**
   * 📋 Export pour sauvegarde/cache
   */
  toJSON(): any {
    return {
      id: this._id,
      type: this._type,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      status: this._status.toJSON(),
      recipient: this._recipient,
      content: this._content,
      deliveryConfig: {
        ...this._deliveryConfig,
        scheduledAt: this._deliveryConfig.scheduledAt?.toISOString(),
        expiresAt: this._deliveryConfig.expiresAt?.toISOString()
      },
      tracking: {
        ...this._tracking,
        sentAt: this._tracking.sentAt?.toISOString(),
        deliveredAt: this._tracking.deliveredAt?.toISOString(),
        openedAt: this._tracking.openedAt?.toISOString(),
        clickedAt: this._tracking.clickedAt?.toISOString(),
        errors: this._tracking.errors?.map(e => ({
          ...e,
          timestamp: e.timestamp.toISOString()
        }))
      },
      priority: this._priority,
      correlationId: this._correlationId
    };
  }
  
  /**
   * 🔄 Import depuis données persistées
   */
  static fromJSON(json: any): Notification {
    const notification = Object.create(Notification.prototype);
    
    notification._id = json.id;
    notification._type = json.type;
    notification._createdAt = new Date(json.createdAt);
    notification._updatedAt = new Date(json.updatedAt);
    notification._status = NotificationStatus.fromJSON(json.status);
    notification._recipient = json.recipient;
    notification._content = json.content;
    notification._deliveryConfig = {
      ...json.deliveryConfig,
      scheduledAt: json.deliveryConfig.scheduledAt ? new Date(json.deliveryConfig.scheduledAt) : undefined,
      expiresAt: json.deliveryConfig.expiresAt ? new Date(json.deliveryConfig.expiresAt) : undefined
    };
    notification._tracking = {
      ...json.tracking,
      sentAt: json.tracking.sentAt ? new Date(json.tracking.sentAt) : undefined,
      deliveredAt: json.tracking.deliveredAt ? new Date(json.tracking.deliveredAt) : undefined,
      openedAt: json.tracking.openedAt ? new Date(json.tracking.openedAt) : undefined,
      clickedAt: json.tracking.clickedAt ? new Date(json.tracking.clickedAt) : undefined,
      errors: json.tracking.errors?.map((e: any) => ({
        ...e,
        timestamp: new Date(e.timestamp)
      }))
    };
    notification._priority = json.priority;
    notification._correlationId = json.correlationId;
    
    return notification;
  }
}

// =============================================================================
// 🏭 FACTORY POUR CRÉATION SIMPLIFIÉE
// =============================================================================

/**
 * 🏭 Factory pour créer des notifications Express Quote
 * 
 * Utilité:
 * - Simplification de la création de notifications
 * - Configuration par défaut selon le contexte Express Quote
 * - Templates pré-configurés pour les cas d'usage courants
 * - Validation et enrichissement automatique des données
 */
export class NotificationFactory {
  /**
   * 📧 Créer notification de confirmation de réservation
   */
  static createBookingConfirmation(
    recipient: NotificationRecipient,
    bookingData: any,
    options?: { correlationId?: string }
  ): Notification {
    const content: NotificationContent = {
      subject: `Confirmation de réservation #${bookingData.id}`,
      textBody: `Bonjour ${recipient.name}, votre réservation est confirmée.`,
      templateId: 'booking-confirmation',
      variables: { booking: bookingData }
    };
    
    const deliveryConfig: NotificationDeliveryConfig = {
      primaryChannel: NotificationChannel.EMAIL,
      fallbackChannels: [NotificationChannel.SMS],
      maxRetries: 3,
      trackingEnabled: true,
      tags: ['booking', 'confirmation']
    };
    
    return new Notification(
      NotificationType.BOOKING_CONFIRMATION,
      recipient,
      content,
      deliveryConfig,
      { priority: NotificationPriority.HIGH, ...options }
    );
  }
  
  /**
   * 💳 Créer notification de confirmation de paiement
   */
  static createPaymentConfirmation(
    recipient: NotificationRecipient,
    paymentData: any,
    options?: { correlationId?: string }
  ): Notification {
    const content: NotificationContent = {
      subject: `Paiement confirmé - ${paymentData.amount}€`,
      textBody: `Votre paiement de ${paymentData.amount}€ a été confirmé.`,
      templateId: 'payment-confirmation',
      variables: { payment: paymentData }
    };
    
    const deliveryConfig: NotificationDeliveryConfig = {
      primaryChannel: NotificationChannel.EMAIL,
      trackingEnabled: true,
      tags: ['payment', 'confirmation']
    };
    
    return new Notification(
      NotificationType.PAYMENT_CONFIRMATION,
      recipient,
      content,
      deliveryConfig,
      { priority: NotificationPriority.HIGH, ...options }
    );
  }
  
  /**
   * ⏰ Créer rappel de rendez-vous
   */
  static createAppointmentReminder(
    recipient: NotificationRecipient,
    appointmentData: any,
    reminderTime: Date,
    options?: { correlationId?: string }
  ): Notification {
    const content: NotificationContent = {
      subject: `Rappel: RDV ${appointmentData.service} demain`,
      textBody: `N'oubliez pas votre rendez-vous ${appointmentData.service} demain à ${appointmentData.time}.`,
      templateId: 'appointment-reminder',
      variables: { appointment: appointmentData }
    };
    
    const deliveryConfig: NotificationDeliveryConfig = {
      primaryChannel: recipient.phone ? NotificationChannel.SMS : NotificationChannel.EMAIL,
      fallbackChannels: [NotificationChannel.EMAIL],
      scheduledAt: reminderTime,
      trackingEnabled: true,
      tags: ['reminder', 'appointment']
    };
    
    return new Notification(
      NotificationType.APPOINTMENT_REMINDER,
      recipient,
      content,
      deliveryConfig,
      { priority: NotificationPriority.HIGH, ...options }
    );
  }
}

// =============================================================================
// 📝 EXEMPLE D'UTILISATION
// =============================================================================
/*
import { 
  Notification, 
  NotificationFactory,
  NotificationType,
  NotificationChannel,
  NotificationPriority 
} from './Notification';

// 1. Création manuelle d'une notification
const recipient = {
  id: 'customer-123',
  name: 'Jean Dupont',
  email: 'jean@example.com',
  phone: '+33123456789',
  language: 'fr',
  timezone: 'Europe/Paris'
};

const content = {
  subject: 'Votre devis Express Quote',
  textBody: 'Votre devis est prêt',
  templateId: 'quote-ready'
};

const config = {
  primaryChannel: NotificationChannel.EMAIL,
  fallbackChannels: [NotificationChannel.SMS],
  trackingEnabled: true
};

const notification = new Notification(
  NotificationType.QUOTE_CREATED,
  recipient,
  content,
  config
);

// 2. Utilisation de la factory (plus simple)
const booking = { id: 'BK-123', service: 'Déménagement', date: '2025-03-15' };
const bookingNotif = NotificationFactory.createBookingConfirmation(
  recipient,
  booking,
  { correlationId: 'booking-flow-456' }
);

// 3. Cycle de vie d'une notification
bookingNotif.markAsQueued('email-queue', 'worker-1');
bookingNotif.startProcessing('worker-1', 'smtp.gmail.com');
bookingNotif.markAsSent('msg-789', 'gmail-smtp', { latency: 250 });
bookingNotif.trackOpen();
bookingNotif.trackClick('view-booking');

// 4. Gestion des erreurs et retry
const failedNotif = NotificationFactory.createPaymentConfirmation(recipient, { amount: 150 });
failedNotif.markAsQueued('email-queue');
failedNotif.startProcessing('worker-2');
failedNotif.markAsFailed('SMTP timeout', true);

if (failedNotif.canRetry()) {
  const delay = failedNotif.getNextRetryDelay();
  setTimeout(() => {
    failedNotif.prepareForRetry('backup-smtp');
  }, delay);
}

// 5. Analytics et métriques
const metrics = bookingNotif.getPerformanceMetrics();
console.log(`Temps d'envoi: ${metrics.timeToSend}ms`);
console.log(`Engagement: ${metrics.isEngaged}`);

// 6. Sérialisation pour cache/BDD
const json = bookingNotif.toJSON();
const restored = Notification.fromJSON(json);
*/
