// =============================================================================
// 📡 INTERFACE ADAPTATEUR DE NOTIFICATION - Abstraction des Canaux
// =============================================================================
//
// Utilité:
// - Abstraction des services externes (SMTP, WhatsApp Business API, SMS)
// - Interface uniforme pour tous les canaux de communication
// - Découplage entre logique métier et implémentations techniques
// - Support des fallbacks et multi-providers par canal
// - Gestion centralisée des credentials et configurations
//
// Pattern Adapter:
// - Adapte les APIs externes vers interface unifiée Express Quote
// - Conversion des formats de données (HTML → WhatsApp, etc.)
// - Gestion des particularités de chaque canal
// - Normalisation des erreurs et statuts de retour
// - Health monitoring des services externes
// =============================================================================

import { Notification, NotificationChannel } from '../entities/Notification';

/**
 * 📊 Résultat de livraison d'un adaptateur
 * 
 * Utilité:
 * - Retour standardisé de tous les adaptateurs
 * - Informations de tracking spécifiques à chaque canal
 * - Métadonnées techniques pour debugging et optimisation
 * - Support des réponses asynchrones (webhooks)
 */
export interface AdapterDeliveryResult {
  /** Succès de la livraison */
  success: boolean;
  
  /** Canal utilisé pour la livraison */
  channel: NotificationChannel;
  
  /** ID externe fourni par le service */
  externalId?: string;
  
  /** Message de statut */
  message: string;
  
  /** Métadonnées de livraison */
  deliveryMetadata: {
    /** Fournisseur utilisé */
    provider: string;
    
    /** Endpoint API utilisé */
    endpoint?: string;
    
    /** Latence de la requête (ms) */
    latency: number;
    
    /** Code de statut HTTP */
    httpStatus?: number;
    
    /** Coût de l'envoi si applicable */
    cost?: {
      amount: number;
      currency: string;
      unitType: 'message' | 'character' | 'minute';
    };
    
    /** Informations de routage */
    routing?: {
      /** Région/datacenter utilisé */
      region?: string;
      
      /** Version d'API */
      apiVersion?: string;
      
      /** Rate limiting info */
      rateLimiting?: {
        remaining: number;
        resetTime: Date;
      };
    };
    
    /** Données brutes de la réponse (debugging) */
    rawResponse?: any;
  };
  
  /** Erreur détaillée si échec */
  error?: {
    /** Code d'erreur normalisé */
    code: string;
    
    /** Message d'erreur */
    message: string;
    
    /** Erreur temporaire (retry possible) */
    temporary: boolean;
    
    /** Erreur côté client (4xx) ou serveur (5xx) */
    type: 'client' | 'server' | 'network' | 'config';
    
    /** Code d'erreur du provider */
    providerCode?: string;
    
    /** Détails spécifiques au provider */
    providerDetails?: Record<string, any>;
  };
  
  /** Tracking avancé (selon les capacités du canal) */
  trackingInfo?: {
    /** URL de tracking si fournie */
    trackingUrl?: string;
    
    /** Webhook URL pour mises à jour de statut */
    webhookUrl?: string;
    
    /** Support du read receipt */
    supportsReadReceipt: boolean;
    
    /** Support du delivery receipt */
    supportsDeliveryReceipt: boolean;
    
    /** Estimation de livraison */
    estimatedDelivery?: Date;
  };
}

/**
 * ⚙️ Configuration d'un adaptateur
 * 
 * Utilité:
 * - Configuration spécifique à chaque canal
 * - Credentials et endpoints séparés par environnement
 * - Paramètres de performance et reliability
 * - Feature flags pour activation progressive
 */
export interface AdapterConfig {
  /** Identifiant unique de l'adaptateur */
  adapterId: string;
  
  /** Canal de communication géré */
  channel: NotificationChannel;
  
  /** Nom du fournisseur (gmail, whatsapp-business, twilio) */
  provider: string;
  
  /** Configuration active */
  enabled: boolean;
  
  /** Credentials et authentification */
  auth: {
    /** Type d'authentification */
    type: 'api-key' | 'oauth2' | 'basic' | 'bearer' | 'custom';
    
    /** Credentials (chiffrées) */
    credentials: Record<string, any>;
    
    /** URL de renouvellement des tokens si OAuth2 */
    tokenRefreshUrl?: string;
    
    /** Expiration du token actuel */
    tokenExpiresAt?: Date;
  };
  
  /** Endpoints et URLs */
  endpoints: {
    /** URL principale d'envoi */
    sendUrl: string;
    
    /** URL de vérification de statut */
    statusUrl?: string;
    
    /** URL des webhooks entrants */
    webhookUrl?: string;
    
    /** URL de santé/ping */
    healthUrl?: string;
  };
  
  /** Paramètres de performance */
  performance: {
    /** Timeout par défaut (ms) */
    timeout: number;
    
    /** Nombre maximum de connexions concurrentes */
    maxConcurrency: number;
    
    /** Intervalle entre requêtes (rate limiting) */
    rateLimitInterval: number;
    
    /** Nombre de requêtes par intervalle */
    rateLimitRequests: number;
    
    /** Taille maximale des messages */
    maxMessageSize: number;
  };
  
  /** Configuration de retry */
  retryConfig: {
    /** Tentatives maximum */
    maxAttempts: number;
    
    /** Délai initial (ms) */
    initialDelay: number;
    
    /** Facteur de backoff */
    backoffFactor: number;
    
    /** Délai maximum (ms) */
    maxDelay: number;
    
    /** Codes d'erreur pour retry automatique */
    retryableCodes: string[];
  };
  
  /** Features spécifiques au canal */
  features: {
    /** Support des pièces jointes */
    supportsAttachments: boolean;
    
    /** Support des images inline */
    supportsInlineImages: boolean;
    
    /** Support du HTML */
    supportsHtml: boolean;
    
    /** Support des templates */
    supportsTemplates: boolean;
    
    /** Support du tracking */
    supportsTracking: boolean;
    
    /** Support des boutons d'action */
    supportsButtons: boolean;
    
    /** Taille max des pièces jointes (bytes) */
    maxAttachmentSize?: number;
    
    /** Formats d'image supportés */
    supportedImageFormats?: string[];
  };
  
  /** Métadonnées additionnelles */
  metadata: {
    /** Version de l'adaptateur */
    version: string;
    
    /** Environnement (dev, staging, prod) */
    environment: string;
    
    /** Tags pour organisation */
    tags: string[];
    
    /** Dernière mise à jour de config */
    lastUpdated: Date;
    
    /** Notes de configuration */
    notes?: string;
  };
}

/**
 * 🏥 État de santé d'un adaptateur
 * 
 * Utilité:
 * - Monitoring continu des services externes
 * - Détection proactive des pannes
 * - Métriques de fiabilité pour SLA
 * - Décision automatique de fallback
 */
export interface AdapterHealthStatus {
  /** Identifiant de l'adaptateur */
  adapterId: string;
  
  /** Canal géré */
  channel: NotificationChannel;
  
  /** État global */
  status: 'healthy' | 'degraded' | 'down' | 'maintenance';
  
  /** Horodatage du check */
  timestamp: Date;
  
  /** Latence du dernier check (ms) */
  latency: number;
  
  /** Tests de santé détaillés */
  checks: Array<{
    /** Nom du test */
    name: string;
    
    /** Statut du test */
    status: 'pass' | 'fail' | 'warn';
    
    /** Message détaillé */
    message: string;
    
    /** Latence de ce test (ms) */
    latency?: number;
    
    /** Métadonnées du test */
    metadata?: Record<string, any>;
  }>;
  
  /** Métriques de performance récentes */
  metrics: {
    /** Taux de succès dernières 24h (%) */
    successRate24h: number;
    
    /** Latence moyenne dernière heure (ms) */
    avgLatency1h: number;
    
    /** Nombre d'erreurs dernière heure */
    errors1h: number;
    
    /** Disponibilité derniers 7 jours (%) */
    uptime7d: number;
    
    /** Dernier incident */
    lastIncident?: {
      timestamp: Date;
      duration: number; // ms
      cause: string;
    };
  };
  
  /** Rate limiting status */
  rateLimiting?: {
    /** Requêtes restantes */
    remaining: number;
    
    /** Reset du compteur */
    resetTime: Date;
    
    /** Limite par période */
    limit: number;
  };
  
  /** Informations sur les quotas */
  quotas?: {
    /** Usage actuel */
    current: number;
    
    /** Limite maximale */
    limit: number;
    
    /** Période de reset */
    period: 'hour' | 'day' | 'month';
    
    /** Prochain reset */
    nextReset: Date;
  };
}

/**
 * 📊 Métriques détaillées d'un adaptateur
 * 
 * Utilité:
 * - Analytics de performance par canal
 * - Optimisation des configurations
 * - Reporting pour les SLA clients
 * - Détection des patterns d'usage
 */
export interface AdapterMetrics {
  /** Identifiant de l'adaptateur */
  adapterId: string;
  
  /** Canal géré */
  channel: NotificationChannel;
  
  /** Période des métriques */
  period: {
    start: Date;
    end: Date;
    duration: number; // ms
  };
  
  /** Volume d'envois */
  volume: {
    /** Total envoyé */
    total: number;
    
    /** Succès */
    success: number;
    
    /** Échecs */
    failed: number;
    
    /** En cours */
    pending: number;
    
    /** Taux de succès (%) */
    successRate: number;
  };
  
  /** Performance temporelle */
  performance: {
    /** Latence moyenne (ms) */
    avgLatency: number;
    
    /** Latence P50 (ms) */
    p50Latency: number;
    
    /** Latence P95 (ms) */
    p95Latency: number;
    
    /** Latence P99 (ms) */
    p99Latency: number;
    
    /** Timeout occurrences */
    timeouts: number;
    
    /** Débit (msg/min) */
    throughput: number;
  };
  
  /** Erreurs par catégorie */
  errors: {
    /** Erreurs client (4xx) */
    clientErrors: number;
    
    /** Erreurs serveur (5xx) */
    serverErrors: number;
    
    /** Erreurs réseau */
    networkErrors: number;
    
    /** Erreurs d'authentification */
    authErrors: number;
    
    /** Rate limiting hits */
    rateLimitErrors: number;
    
    /** Top 5 des codes d'erreur */
    topErrorCodes: Array<{
      code: string;
      count: number;
      percentage: number;
    }>;
  };
  
  /** Coûts (si applicable) */
  costs?: {
    /** Coût total */
    total: number;
    
    /** Devise */
    currency: string;
    
    /** Coût par message moyen */
    avgPerMessage: number;
    
    /** Répartition par type */
    breakdown: Record<string, number>;
  };
  
  /** Engagement (selon les capacités du canal) */
  engagement?: {
    /** Messages ouverts */
    opens: number;
    
    /** Taux d'ouverture (%) */
    openRate: number;
    
    /** Clics sur liens */
    clicks: number;
    
    /** Taux de clic (%) */
    clickRate: number;
    
    /** Réponses reçues */
    replies: number;
    
    /** Désabonnements */
    unsubscribes: number;
  };
}

/**
 * 📡 INTERFACE PRINCIPALE - Adaptateur de Canal de Notification
 * 
 * Cette interface définit le contrat que doivent respecter tous
 * les adaptateurs de canaux de communication (Email, SMS, WhatsApp, etc.).
 * Elle standardise les interactions avec les services externes.
 * 
 * Responsabilités contractuelles:
 * - Envoi de notifications via le canal spécifique
 * - Conversion des formats de données
 * - Gestion des erreurs et retry spécifique au canal
 * - Tracking et webhooks selon les capacités
 * - Health monitoring du service externe
 * - Gestion des credentials et authentification
 */
export interface INotificationAdapter {
  /**
   * 📤 Envoyer une notification
   * 
   * Méthode principale pour l'envoi via ce canal.
   * Gère la conversion de format et l'appel au service externe.
   * 
   * @param notification Notification complète à envoyer
   * @param config Configuration spécifique à cet envoi
   * @returns Résultat détaillé de la livraison
   * 
   * @throws AdapterError Si l'envoi échoue de façon non récupérable
   */
  send(
    notification: Notification, 
    config?: Partial<AdapterConfig>
  ): Promise<AdapterDeliveryResult>;
  
  /**
   * 📦 Envoyer plusieurs notifications en lot
   * 
   * Optimisé pour l'envoi en volume quand supporté par le canal.
   * Fallback automatique vers envois individuels si pas de support batch.
   * 
   * @param notifications Liste des notifications à envoyer
   * @param config Configuration commune
   * @returns Résultats individuels pour chaque notification
   */
  sendBatch(
    notifications: Notification[], 
    config?: Partial<AdapterConfig>
  ): Promise<AdapterDeliveryResult[]>;
  
  /**
   * 📊 Vérifier le statut d'une notification
   * 
   * Interroge le service externe pour l'état de livraison.
   * Pas supporté par tous les canaux.
   * 
   * @param externalId ID externe retourné lors de l'envoi
   * @returns Statut de livraison ou null si non supporté
   */
  getDeliveryStatus(externalId: string): Promise<{
    status: 'pending' | 'delivered' | 'failed' | 'read';
    timestamp: Date;
    details?: Record<string, any>;
  } | null>;
  
  /**
   * ✅ Valider une notification pour ce canal
   * 
   * Vérifie que la notification est compatible avec ce canal.
   * Appelé avant l'envoi pour validation précoce.
   * 
   * @param notification Notification à valider
   * @returns Résultat de validation avec erreurs détaillées
   */
  validateNotification(notification: Notification): Promise<{
    valid: boolean;
    errors: Array<{
      field: string;
      message: string;
      severity: 'error' | 'warning';
    }>;
    warnings: string[];
    estimatedCost?: number;
  }>;
  
  /**
   * 🔄 Convertir le contenu pour ce canal
   * 
   * Adapte le format du contenu aux contraintes du canal.
   * Ex: HTML → texte pour SMS, HTML → WhatsApp formatting.
   * 
   * @param notification Notification avec contenu source
   * @returns Contenu adapté au canal
   */
  convertContent(notification: Notification): Promise<{
    subject?: string;
    body: string;
    attachments?: Array<{
      filename: string;
      content: Buffer;
      mimeType: string;
    }>;
    metadata?: Record<string, any>;
  }>;
  
  /**
   * 🏥 Vérifier la santé du service externe
   * 
   * Health check complet de la connectivité et des fonctionnalités.
   * 
   * @returns État de santé détaillé
   */
  healthCheck(): Promise<AdapterHealthStatus>;
  
  /**
   * 📈 Obtenir les métriques de performance
   * 
   * Statistiques d'usage et de performance sur une période.
   * 
   * @param period Période d'analyse
   * @returns Métriques complètes
   */
  getMetrics(period?: { start: Date; end: Date }): Promise<AdapterMetrics>;
  
  /**
   * ⚙️ Recharger la configuration
   * 
   * Recharge les paramètres sans redémarrer l'adaptateur.
   * Utile pour rotation des credentials, mise à jour des endpoints.
   * 
   * @param newConfig Nouvelle configuration
   * @returns true si rechargement réussi
   */
  reloadConfig(newConfig: AdapterConfig): Promise<boolean>;
  
  /**
   * 🔐 Renouveler les tokens d'authentification
   * 
   * Gestion automatique du renouvellement des tokens OAuth2, etc.
   * Appelé automatiquement avant expiration.
   * 
   * @returns true si renouvellement réussi
   */
  refreshCredentials(): Promise<boolean>;
  
  /**
   * 📞 Traiter un webhook entrant
   * 
   * Gestion des notifications de statut du service externe.
   * Mise à jour automatique des statuts de livraison.
   * 
   * @param payload Données du webhook
   * @param signature Signature pour validation
   * @returns Événements de mise à jour extraits
   */
  processWebhook(payload: any, signature?: string): Promise<Array<{
    externalId: string;
    status: 'delivered' | 'failed' | 'read' | 'replied';
    timestamp: Date;
    metadata?: Record<string, any>;
  }>>;
  
  /**
   * 🧪 Envoyer une notification de test
   * 
   * Envoi de test pour validation de configuration.
   * 
   * @param testRecipient Destinataire de test
   * @param testMessage Message de test
   * @returns Résultat du test
   */
  sendTest(
    testRecipient: string, 
    testMessage: string
  ): Promise<AdapterDeliveryResult>;
  
  /**
   * 📋 Lister les templates disponibles
   * 
   * Pour les canaux supportant les templates (WhatsApp Business).
   * 
   * @returns Liste des templates approuvés
   */
  getAvailableTemplates?(): Promise<Array<{
    id: string;
    name: string;
    language: string;
    status: 'approved' | 'pending' | 'rejected';
    category: string;
    components: any[];
  }>>;
  
  /**
   * 🔍 Rechercher dans l'historique
   * 
   * Recherche dans les logs d'envoi de l'adaptateur.
   * 
   * @param criteria Critères de recherche
   * @returns Résultats paginés
   */
  searchHistory(criteria: {
    externalIds?: string[];
    status?: string;
    dateRange?: { start: Date; end: Date };
    recipient?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    results: Array<{
      externalId: string;
      status: string;
      timestamp: Date;
      recipient: string;
      metadata?: Record<string, any>;
    }>;
    totalCount: number;
    hasMore: boolean;
  }>;
}

/**
 * 🚨 Exceptions spécifiques aux adaptateurs
 */
export class AdapterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly channel: NotificationChannel,
    public readonly temporary: boolean = false,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AdapterError';
  }
}

export class AdapterConfigError extends AdapterError {
  constructor(message: string, channel: NotificationChannel, details?: Record<string, any>) {
    super(message, 'ADAPTER_CONFIG_ERROR', channel, false, details);
    this.name = 'AdapterConfigError';
  }
}

export class AdapterAuthError extends AdapterError {
  constructor(message: string, channel: NotificationChannel, details?: Record<string, any>) {
    super(message, 'ADAPTER_AUTH_ERROR', channel, true, details);
    this.name = 'AdapterAuthError';
  }
}

export class AdapterRateLimitError extends AdapterError {
  constructor(
    message: string,
    channel: NotificationChannel,
    public readonly resetTime: Date,
    details?: Record<string, any>
  ) {
    super(message, 'ADAPTER_RATE_LIMIT_ERROR', channel, true, details);
    this.name = 'AdapterRateLimitError';
  }
}

export class AdapterQuotaExceededError extends AdapterError {
  constructor(
    message: string,
    channel: NotificationChannel,
    public readonly resetTime: Date,
    details?: Record<string, any>
  ) {
    super(message, 'ADAPTER_QUOTA_EXCEEDED_ERROR', channel, false, details);
    this.name = 'AdapterQuotaExceededError';
  }
}

export class AdapterServiceUnavailableError extends AdapterError {
  constructor(message: string, channel: NotificationChannel, details?: Record<string, any>) {
    super(message, 'ADAPTER_SERVICE_UNAVAILABLE_ERROR', channel, true, details);
    this.name = 'AdapterServiceUnavailableError';
  }
}

// =============================================================================
// 🏭 FACTORY D'ADAPTATEURS
// =============================================================================

/**
 * 🏭 Interface pour Factory d'adaptateurs
 * 
 * Utilité:
 * - Création standardisée des adaptateurs
 * - Injection de dépendances
 // - Configuration centralisée
 * - Support du hot-swapping d'adaptateurs
 */
export interface INotificationAdapterFactory {
  /**
   * 🏗️ Créer un adaptateur pour un canal
   * 
   * @param channel Canal de notification
   * @param config Configuration spécifique
   * @returns Instance d'adaptateur configuré
   */
  createAdapter(channel: NotificationChannel, config: AdapterConfig): Promise<INotificationAdapter>;
  
  /**
   * 📋 Lister les adaptateurs disponibles
   * 
   * @returns Liste des canaux supportés avec leurs providers
   */
  getAvailableAdapters(): Promise<Array<{
    channel: NotificationChannel;
    providers: Array<{
      name: string;
      description: string;
      features: string[];
      pricing: string;
    }>;
  }>>;
  
  /**
   * ✅ Valider une configuration d'adaptateur
   * 
   * @param config Configuration à valider
   * @returns Résultat de validation
   */
  validateConfig(config: AdapterConfig): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }>;
}

// =============================================================================
// 📝 EXEMPLE D'UTILISATION
// =============================================================================
/*
import { INotificationAdapter, AdapterConfig, AdapterDeliveryResult } from './INotificationAdapter';
import { Notification, NotificationChannel } from '../entities/Notification';

// Exemple d'implémentation d'un adaptateur Email SMTP
class SmtpEmailAdapter implements INotificationAdapter {
  private config: AdapterConfig;
  
  constructor(config: AdapterConfig) {
    this.config = config;
  }
  
  async send(notification: Notification): Promise<AdapterDeliveryResult> {
    const startTime = Date.now();
    
    try {
      // 1. Validation préalable
      const validation = await this.validateNotification(notification);
      if (!validation.valid) {
        throw new AdapterError(
          `Validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
          'VALIDATION_ERROR',
          NotificationChannel.EMAIL
        );
      }
      
      // 2. Conversion du contenu
      const content = await this.convertContent(notification);
      
      // 3. Envoi via SMTP
      const smtpResult = await this.sendViaSMTP({
        to: notification.recipient.email,
        subject: content.subject,
        html: content.body,
        attachments: content.attachments
      });
      
      const latency = Date.now() - startTime;
      
      // 4. Retour du résultat
      return {
        success: true,
        channel: NotificationChannel.EMAIL,
        externalId: smtpResult.messageId,
        message: 'Email sent successfully',
        deliveryMetadata: {
          provider: 'smtp-gmail',
          latency,
          httpStatus: 200,
          routing: {
            region: 'eu-west-1',
            apiVersion: 'smtp-v1'
          }
        },
        trackingInfo: {
          supportsReadReceipt: true,
          supportsDeliveryReceipt: true,
          estimatedDelivery: new Date(Date.now() + 5000)
        }
      };
      
    } catch (error) {
      const latency = Date.now() - startTime;
      
      return {
        success: false,
        channel: NotificationChannel.EMAIL,
        message: 'Failed to send email',
        deliveryMetadata: {
          provider: 'smtp-gmail',
          latency
        },
        error: {
          code: 'SMTP_ERROR',
          message: error.message,
          temporary: this.isTemporaryError(error),
          type: 'server',
          providerCode: error.responseCode,
          providerDetails: {
            smtpResponse: error.response
          }
        }
      };
    }
  }
  
  async sendBatch(notifications: Notification[]): Promise<AdapterDeliveryResult[]> {
    // Gmail SMTP ne supporte pas le batch, envoi séquentiel
    const results: AdapterDeliveryResult[] = [];
    
    for (const notification of notifications) {
      const result = await this.send(notification);
      results.push(result);
      
      // Rate limiting - attendre 100ms entre envois
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }
  
  async validateNotification(notification: Notification) {
    const errors = [];
    const warnings = [];
    
    // Validation email
    if (!notification.recipient.email) {
      errors.push({
        field: 'recipient.email',
        message: 'Email address required',
        severity: 'error' as const
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notification.recipient.email)) {
      errors.push({
        field: 'recipient.email',
        message: 'Invalid email format',
        severity: 'error' as const
      });
    }
    
    // Validation taille
    const contentSize = notification.content.htmlBody?.length || 0;
    if (contentSize > 1024 * 1024) { // 1MB
      errors.push({
        field: 'content.htmlBody',
        message: 'Email content too large (max 1MB)',
        severity: 'error' as const
      });
    }
    
    // Validation pièces jointes
    if (notification.content.attachments) {
      for (const attachment of notification.content.attachments) {
        if (attachment.size > 25 * 1024 * 1024) { // 25MB
          errors.push({
            field: 'content.attachments',
            message: `Attachment ${attachment.filename} too large (max 25MB)`,
            severity: 'error' as const
          });
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      estimatedCost: 0.001 // $0.001 per email
    };
  }
  
  async convertContent(notification: Notification) {
    return {
      subject: notification.content.subject,
      body: notification.content.htmlBody || notification.content.textBody,
      attachments: notification.content.attachments?.map(att => ({
        filename: att.filename,
        content: Buffer.from(att.content || '', 'base64'),
        mimeType: att.mimeType
      }))
    };
  }
  
  async healthCheck(): Promise<AdapterHealthStatus> {
    const checks = [];
    const startTime = Date.now();
    
    try {
      // Test connexion SMTP
      await this.testSmtpConnection();
      checks.push({
        name: 'smtp-connection',
        status: 'pass' as const,
        message: 'SMTP connection successful'
      });
      
      // Test authentification
      await this.testAuthentication();
      checks.push({
        name: 'authentication',
        status: 'pass' as const,
        message: 'Authentication successful'
      });
      
    } catch (error) {
      checks.push({
        name: 'smtp-connection',
        status: 'fail' as const,
        message: `Connection failed: ${error.message}`
      });
    }
    
    const latency = Date.now() - startTime;
    const allPassed = checks.every(check => check.status === 'pass');
    
    return {
      adapterId: this.config.adapterId,
      channel: NotificationChannel.EMAIL,
      status: allPassed ? 'healthy' : 'down',
      timestamp: new Date(),
      latency,
      checks,
      metrics: {
        successRate24h: 99.2,
        avgLatency1h: 250,
        errors1h: 2,
        uptime7d: 99.8
      }
    };
  }
  
  private async sendViaSMTP(emailData: any) {
    // Implémentation SMTP réelle avec nodemailer ou autre
    return { messageId: `msg-${Date.now()}` };
  }
  
  private async testSmtpConnection() {
    // Test de connexion SMTP
  }
  
  private async testAuthentication() {
    // Test d'authentification
  }
  
  private isTemporaryError(error: any): boolean {
    // Logique pour déterminer si l'erreur est temporaire
    const temporaryCodes = ['421', '450', '451', '452'];
    return temporaryCodes.includes(error.responseCode);
  }
  
  // Autres méthodes de l'interface...
  getMetrics(): Promise<AdapterMetrics>;
  reloadConfig(): Promise<void>;
  refreshCredentials(): Promise<boolean>;
  processWebhook(webhook: any): Promise<boolean>;
  sendTest(recipient: string): Promise<boolean>;
  searchHistory(criteria: any): Promise<any[]>;
  getDeliveryStatus(notificationId: string): Promise<any>;
}

// Utilisation dans le service principal
class NotificationService {
  private adapters: Map<NotificationChannel, INotificationAdapter> = new Map();
  
  async initializeAdapters() {
    // Configuration des adaptateurs
    const emailConfig: AdapterConfig = {
      adapterId: 'smtp-gmail-prod',
      channel: NotificationChannel.EMAIL,
      provider: 'gmail-smtp',
      enabled: true,
      auth: {
        type: 'oauth2',
        credentials: {
          clientId: process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.GMAIL_CLIENT_SECRET,
          refreshToken: process.env.GMAIL_REFRESH_TOKEN
        }
      },
      endpoints: {
        sendUrl: 'smtp.gmail.com:587'
      },
      performance: {
        timeout: 30000,
        maxConcurrency: 10,
        rateLimitInterval: 60000,
        rateLimitRequests: 100,
        maxMessageSize: 25 * 1024 * 1024
      },
      // ... autres configs
    };
    
    const emailAdapter = new SmtpEmailAdapter(emailConfig);
    this.adapters.set(NotificationChannel.EMAIL, emailAdapter);
  }
  
  async sendNotification(notification: Notification) {
    const adapter = this.adapters.get(notification.deliveryConfig.primaryChannel);
    if (!adapter) {
      throw new Error(`No adapter for channel: ${notification.deliveryConfig.primaryChannel}`);
    }
    
    // Health check avant envoi
    const health = await adapter.healthCheck();
    if (health.status === 'down') {
      // Fallback vers autre canal
      return await this.handleFallback(notification);
    }
    
    // Envoi principal
    const result = await adapter.send(notification);
    
    if (!result.success && result.error?.temporary) {
      // Retry automatique pour erreurs temporaires
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await adapter.send(notification);
    }
    
    return result;
  }
  
  private async handleFallback(notification: Notification) {
    const fallbackChannels = notification.deliveryConfig.fallbackChannels || [];
    
    for (const channel of fallbackChannels) {
      const adapter = this.adapters.get(channel);
      if (adapter) {
        const health = await adapter.healthCheck();
        if (health.status === 'healthy') {
          return await adapter.send(notification);
        }
      }
    }
    
    throw new Error('No healthy adapter available');
  }
}
*/
