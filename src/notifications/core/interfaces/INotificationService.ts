// =============================================================================
// 🔔 INTERFACE SERVICE DE NOTIFICATION - Contrat Principal
// =============================================================================
//
// Utilité:
// - Définit le contrat principal du service de notification Express Quote
// - Abstraction pour découplage entre domain et infrastructure
// - Interface uniforme pour tous les canaux de communication
// - Support dependency injection et tests unitaires
// - Gestion centralisée des politiques de retry et fallback
//
// Architecture DDD:
// - Interface de domaine (pas d'implémentation)
// - Contrat respecté par les adaptateurs d'infrastructure
// - Abstraction des détails techniques (SMTP, WhatsApp API, etc.)
// - Focus sur les besoins métier Express Quote
// =============================================================================

import { Notification } from '../entities/Notification';
import { NotificationChannel, NotificationType } from '../entities/Notification';
import { NotificationStatus, NotificationStatusEnum } from '../entities/NotificationStatus';

/**
 * 📊 Résultat d'envoi d'une notification
 * 
 * Utilité:
 * - Retour standardisé des opérations d'envoi
 * - Informations de tracking et debugging
 * - Métriques de performance pour monitoring
 * - Support multi-tentatives avec détails d'erreur
 */
export interface NotificationSendResult {
  /** Succès ou échec de l'opération */
  success: boolean;
  
  /** ID unique de la notification */
  notificationId: string;
  
  /** ID externe fourni par le service (ex: message ID SMTP) */
  externalId?: string;
  
  /** Canal utilisé pour l'envoi */
  channel: NotificationChannel;
  
  /** Statut final après tentative d'envoi */
  status: NotificationStatusEnum;
  
  /** Message détaillé du résultat */
  message: string;
  
  /** Métadonnées techniques de l'envoi */
  metadata?: {
    /** Fournisseur utilisé (ex: 'smtp.gmail.com', 'whatsapp-business') */
    provider: string;
    
    /** Latence d'envoi en millisecondes */
    latency: number;
    
    /** Coût de l'envoi si applicable */
    cost?: number;
    
    /** Nombre de tentatives effectuées */
    attempts: number;
    
    /** Informations de debug */
    debugInfo?: Record<string, any>;
  };
  
  /** Erreur détaillée si échec */
  error?: {
    /** Code d'erreur standardisé */
    code: string;
    
    /** Message d'erreur technique */
    message: string;
    
    /** Erreur récupérable (retry possible) */
    recoverable: boolean;
    
    /** Stack trace pour debugging */
    stack?: string;
    
    /** Détails spécifiques au provider */
    providerDetails?: Record<string, any>;
  };
}

/**
 * 📋 Options d'envoi d'une notification
 * 
 * Utilité:
 * - Configuration fine du comportement d'envoi
 * - Override des paramètres par défaut
 * - Contexte spécifique pour tracking
 * - Support A/B testing et expérimentation
 */
export interface NotificationSendOptions {
  /** Forcer un canal spécifique (ignore les préférences utilisateur) */
  forceChannel?: NotificationChannel;
  
  /** Désactiver les canaux de fallback */
  disableFallback?: boolean;
  
  /** Priorité d'envoi (override celle de la notification) */
  priority?: 'low' | 'normal' | 'high' | 'critical';
  
  /** Envoi programmé différé */
  scheduleAt?: Date;
  
  /** Deadline d'envoi (expire après cette date) */
  expiresAt?: Date;
  
  /** Désactiver le tracking d'engagement */
  disableTracking?: boolean;
  
  /** Tags personnalisés pour analytics */
  customTags?: string[];
  
  /** Contexte métier pour corrélation */
  businessContext?: {
    /** ID de session utilisateur */
    sessionId?: string;
    
    /** Workflow ID pour traçabilité */
    workflowId?: string;
    
    /** A/B test variant */
    experimentVariant?: string;
    
    /** Métadonnées métier */
    metadata?: Record<string, any>;
  };
  
  /** Configuration de retry spécifique */
  retryConfig?: {
    /** Nombre maximum de tentatives */
    maxAttempts: number;
    
    /** Délai initial entre tentatives (ms) */
    initialDelay: number;
    
    /** Multiplicateur de backoff */
    backoffMultiplier: number;
    
    /** Délai maximum entre tentatives (ms) */
    maxDelay: number;
  };
}

/**
 * 📊 Critères de recherche de notifications
 * 
 * Utilité:
 * - Recherche flexible dans l'historique des notifications
 * - Filtrage pour dashboards admin et analytics
 * - Debug et troubleshooting ciblé
 * - Exports pour conformité réglementaire
 */
export interface NotificationSearchCriteria {
  /** IDs spécifiques de notifications */
  ids?: string[];
  
  /** Types de notification */
  types?: NotificationType[];
  
  /** Canaux de communication */
  channels?: NotificationChannel[];
  
  /** Statuts des notifications */
  statuses?: NotificationStatusEnum[];
  
  /** ID du destinataire */
  recipientId?: string;
  
  /** Email du destinataire */
  recipientEmail?: string;
  
  /** Plage de dates de création */
  createdAt?: {
    from?: Date;
    to?: Date;
  };
  
  /** Plage de dates d'envoi */
  sentAt?: {
    from?: Date;
    to?: Date;
  };
  
  /** Tags pour filtrage */
  tags?: string[];
  
  /** ID de corrélation */
  correlationId?: string;
  
  /** Templates utilisés */
  templateIds?: string[];
  
  /** Fournisseurs d'envoi */
  providers?: string[];
  
  /** Tri des résultats */
  sortBy?: 'createdAt' | 'sentAt' | 'status' | 'type';
  
  /** Ordre de tri */
  sortOrder?: 'asc' | 'desc';
  
  /** Pagination */
  pagination?: {
    offset: number;
    limit: number;
  };
}

/**
 * 📈 Métriques globales du système de notification
 * 
 * Utilité:
 * - Dashboard de monitoring temps réel
 * - Alerting automatique sur dégradation
 * - Optimisation des performances
 * - Rapports de service pour management
 */
export interface NotificationMetrics {
  /** Période de calcul des métriques */
  period: {
    start: Date;
    end: Date;
    duration: number; // en millisecondes
  };
  
  /** Métriques globales */
  totals: {
    /** Total notifications envoyées */
    sent: number;
    
    /** Total notifications livrées */
    delivered: number;
    
    /** Total notifications échouées */
    failed: number;
    
    /** Total en attente/traitement */
    pending: number;
  };
  
  /** Taux de réussite par canal */
  channelMetrics: Record<NotificationChannel, {
    sent: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
    avgLatency: number;
  }>;
  
  /** Métriques par type de notification */
  typeMetrics: Record<NotificationType, {
    volume: number;
    successRate: number;
    avgProcessingTime: number;
  }>;
  
  /** Performance des templates */
  templateMetrics: Array<{
    templateId: string;
    usage: number;
    deliveryRate: number;
    engagementRate?: number;
    renderErrorRate: number;
  }>;
  
  /** Métriques de performance système */
  performance: {
    /** Latence moyenne d'envoi (ms) */
    avgSendLatency: number;
    
    /** Throughput (notifications/minute) */
    throughput: number;
    
    /** Taille moyenne des queues */
    avgQueueSize: number;
    
    /** Taux d'utilisation des workers */
    workerUtilization: number;
  };
  
  /** Erreurs les plus fréquentes */
  topErrors: Array<{
    code: string;
    message: string;
    count: number;
    percentage: number;
  }>;
}

/**
 * 🔔 INTERFACE PRINCIPALE - Service de Notification
 * 
 * Cette interface définit le contrat principal du système de notification
 * d'Express Quote. Elle abstrait tous les détails techniques d'envoi
 * et fournit une API uniforme pour l'envoi de notifications multi-canal.
 * 
 * Responsabilités contractuelles:
 * - Envoi de notifications avec gestion des erreurs
 * - Support multi-canal avec fallback automatique
 * - Gestion des files d'attente et de la planification
 * - Tracking et métriques de performance
 * - Recherche et consultation de l'historique
 * - Health monitoring du système
 */
export interface INotificationService {
  /**
   * 📤 Envoyer une notification
   * 
   * Méthode principale pour l'envoi de notifications.
   * Gère automatiquement le routage, les tentatives, et le fallback.
   * 
   * @param notification La notification à envoyer
   * @param options Options d'envoi optionnelles
   * @returns Promesse du résultat d'envoi
   * 
   * @throws NotificationValidationError Si la notification est invalide
   * @throws NotificationConfigError Si la configuration est incorrecte
   * @throws NotificationServiceError Pour les erreurs système
   */
  send(notification: Notification, options?: NotificationSendOptions): Promise<NotificationSendResult>;
  
  /**
   * 📤 Envoyer plusieurs notifications en lot
   * 
   * Optimisé pour l'envoi en volume (newsletters, rappels de masse).
   * Utilise le batching et la parallélisation pour la performance.
   * 
   * @param notifications Liste des notifications à envoyer
   * @param options Options communes d'envoi
   * @returns Promesse des résultats d'envoi
   * 
   * @throws NotificationBatchError Si le lot contient des erreurs
   */
  sendBatch(
    notifications: Notification[], 
    options?: NotificationSendOptions
  ): Promise<NotificationSendResult[]>;
  
  /**
   * ⏰ Programmer l'envoi d'une notification
   * 
   * Planifie l'envoi pour une date future.
   * Utilise le système de queues avec délai programmé.
   * 
   * @param notification La notification à programmer
   * @param scheduledAt Date/heure d'envoi programmée
   * @param options Options d'envoi optionnelles
   * @returns ID de planification pour suivi/annulation
   * 
   * @throws NotificationSchedulingError Si la planification échoue
   */
  schedule(
    notification: Notification, 
    scheduledAt: Date, 
    options?: NotificationSendOptions
  ): Promise<string>;
  
  /**
   * 🚫 Annuler une notification programmée
   * 
   * Annule l'envoi d'une notification avant sa date programmée.
   * 
   * @param scheduleId ID de planification à annuler
   * @returns true si annulée, false si déjà envoyée/inexistante
   */
  cancelScheduled(scheduleId: string): Promise<boolean>;
  
  /**
   * 📊 Obtenir le statut d'une notification
   * 
   * Récupère le statut actuel et l'historique d'une notification.
   * 
   * @param notificationId ID de la notification
   * @returns Statut complet ou null si inexistante
   */
  getStatus(notificationId: string): Promise<NotificationStatus | null>;
  
  /**
   * 🔍 Rechercher des notifications
   * 
   * Recherche flexible dans l'historique avec filtrage avancé.
   * Utilise la pagination pour les gros volumes.
   * 
   * @param criteria Critères de recherche
   * @returns Résultats paginés avec métadonnées
   */
  search(criteria: NotificationSearchCriteria): Promise<{
    notifications: Notification[];
    totalCount: number;
    hasMore: boolean;
    nextOffset?: number;
  }>;
  
  /**
   * 🔁 Relancer une notification échouée
   * 
   * Remet en queue une notification qui a échoué.
   * Respecte les limites de retry et les politiques de backoff.
   * 
   * @param notificationId ID de la notification à relancer
   * @param options Options de relance (canal différent, etc.)
   * @returns Résultat de la relance
   * 
   * @throws NotificationRetryError Si la relance est impossible
   */
  retry(notificationId: string, options?: NotificationSendOptions): Promise<NotificationSendResult>;
  
  /**
   * 📈 Obtenir les métriques du système
   * 
   * Récupère les métriques de performance et d'usage.
   * Utilisé pour les dashboards de monitoring.
   * 
   * @param period Période d'analyse (par défaut: dernière heure)
   * @returns Métriques complètes du système
   */
  getMetrics(period?: { start: Date; end: Date }): Promise<NotificationMetrics>;
  
  /**
   * 🏥 Vérifier la santé du système
   * 
   * Health check complet de tous les composants.
   * Utilisé par les sondes de monitoring (Prometheus, etc.).
   * 
   * @returns État de santé détaillé
   */
  healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    timestamp: Date;
    components: Array<{
      name: string;
      status: 'healthy' | 'degraded' | 'down';
      latency?: number;
      error?: string;
      metadata?: Record<string, any>;
    }>;
    version: string;
  }>;
  
  /**
   * 🔄 Recharger la configuration
   * 
   * Recharge la configuration sans redémarrer le service.
   * Utile pour les mises à jour de templates, règles, etc.
   * 
   * @returns true si rechargement réussi
   */
  reloadConfiguration(): Promise<boolean>;
  
  /**
   * 🧹 Nettoyer l'historique ancien
   * 
   * Supprime les notifications anciennes selon les politiques de rétention.
   * Optimise les performances et respecte la conformité RGPD.
   * 
   * @param olderThan Date limite (supprimer avant cette date)
   * @param dryRun Mode simulation (ne supprime pas réellement)
   * @returns Nombre d'enregistrements supprimés
   */
  cleanup(olderThan: Date, dryRun?: boolean): Promise<number>;
}

/**
 * 🚨 Exceptions spécifiques au service de notification
 * 
 * Utilité:
 * - Classification fine des erreurs
 * - Gestion différenciée selon le type d'erreur
 * - Information détaillée pour debugging
 * - Codes d'erreur standardisés pour APIs
 */

export class NotificationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'NotificationError';
  }
}

export class NotificationValidationError extends NotificationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'NotificationValidationError';
  }
}

export class NotificationConfigError extends NotificationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'CONFIG_ERROR', details);
    this.name = 'NotificationConfigError';
  }
}

export class NotificationServiceError extends NotificationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'SERVICE_ERROR', details);
    this.name = 'NotificationServiceError';
  }
}

export class NotificationBatchError extends NotificationError {
  constructor(
    message: string,
    public readonly failures: Array<{ index: number; error: Error }>,
    details?: Record<string, any>
  ) {
    super(message, 'BATCH_ERROR', details);
    this.name = 'NotificationBatchError';
  }
}

export class NotificationSchedulingError extends NotificationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'SCHEDULING_ERROR', details);
    this.name = 'NotificationSchedulingError';
  }
}

export class NotificationRetryError extends NotificationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'RETRY_ERROR', details);
    this.name = 'NotificationRetryError';
  }
}

// =============================================================================
// 📝 EXEMPLE D'UTILISATION
// =============================================================================
/*
import { INotificationService, NotificationSendOptions } from './INotificationService';
import { NotificationFactory } from '../entities/Notification';

class BookingService {
  constructor(private notificationService: INotificationService) {}
  
  async confirmBooking(booking: any, customer: any) {
    try {
      // 1. Créer la notification
      const notification = NotificationFactory.createBookingConfirmation(
        {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          language: 'fr',
          timezone: 'Europe/Paris'
        },
        booking,
        { correlationId: `booking-${booking.id}` }
      );
      
      // 2. Options d'envoi avec fallback
      const options: NotificationSendOptions = {
        priority: 'high',
        customTags: ['booking-confirmation', 'high-priority'],
        businessContext: {
          workflowId: 'booking-confirmation-flow',
          metadata: { bookingType: booking.serviceType }
        },
        retryConfig: {
          maxAttempts: 3,
          initialDelay: 1000,
          backoffMultiplier: 2,
          maxDelay: 10000
        }
      };
      
      // 3. Envoi avec gestion d'erreur
      const result = await this.notificationService.send(notification, options);
      
      if (result.success) {
        console.log(`Notification envoyée: ${result.externalId}`);
      } else {
        console.error(`Erreur d'envoi: ${result.error?.message}`);
        
        // 4. Retry automatique si erreur récupérable
        if (result.error?.recoverable) {
          await this.scheduleRetry(notification.id);
        }
      }
      
      // 5. Tracking du statut
      const status = await this.notificationService.getStatus(notification.id);
      console.log(`Statut actuel: ${status?.currentStatus}`);
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi de notification:', error);
      throw error;
    }
  }
  
  async scheduleRetry(notificationId: string) {
    const retryDelay = 5 * 60 * 1000; // 5 minutes
    const retryAt = new Date(Date.now() + retryDelay);
    
    await this.notificationService.schedule(
      notification, 
      retryAt, 
      { forceChannel: 'SMS' } // Fallback vers SMS
    );
  }
  
  async getNotificationMetrics() {
    const metrics = await this.notificationService.getMetrics({
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Dernières 24h
      end: new Date()
    });
    
    console.log(`Taux de livraison: ${metrics.totals.delivered / metrics.totals.sent * 100}%`);
    console.log(`Latence moyenne: ${metrics.performance.avgSendLatency}ms`);
    
    return metrics;
  }
}

// Utilisation dans un contrôleur API
app.post('/api/bookings/:id/confirm', async (req, res) => {
  try {
    const bookingService = new BookingService(container.get('INotificationService'));
    await bookingService.confirmBooking(req.body.booking, req.body.customer);
    
    res.json({ success: true, message: 'Booking confirmé et notification envoyée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
*/
