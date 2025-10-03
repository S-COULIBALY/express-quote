// =============================================================================
// 🔄 INTERFACE QUEUE DE NOTIFICATION - Gestion des Files d'Attente
// =============================================================================
//
// Utilité:
// - Abstraction du système de queues pour découplage infrastructure/domaine
// - Interface uniforme pour BullMQ, AWS SQS, ou autre système de queue
// - Gestion des priorités, retry, et dead letter queues
// - Support monitoring et observabilité des queues
// - Scalabilité horizontale avec multiple workers
//
// Architecture Event-Driven:
// - Queues asynchrones pour découpler envoi/traitement
// - Jobs typés avec payload sérialisable  
// - Gestion des erreurs avec policies configurables
// - Métriques temps réel pour monitoring
// - Health checks pour détection de problèmes
// =============================================================================

import { Notification } from '../entities/Notification';
import { NotificationChannel, NotificationPriority } from '../entities/Notification';

/**
 * 🎯 Types de queues par canal de communication
 * 
 * Utilité:
 * - Séparation des queues par canal pour isolation des pannes
 * - Configuration spécifique par type (concurrency, retry, etc.)
 * - Monitoring granulaire par canal
 * - Scaling indépendant selon la charge
 */
export type QueueName = 
  | 'email-queue'        // Queue dédiée aux emails
  | 'sms-queue'          // Queue dédiée aux SMS  
  | 'whatsapp-queue'     // Queue dédiée aux messages WhatsApp
  | 'push-queue'         // Queue dédiée aux notifications push
  | 'webhook-queue'      // Queue dédiée aux webhooks
  | 'scheduler-queue'    // Queue pour notifications programmées
  | 'retry-queue'        // Queue pour les nouvelles tentatives
  | 'dlq-queue';         // Dead Letter Queue pour notifications échec définitif

/**
 * 💼 Payload d'un job de notification
 * 
 * Utilité:
 * - Structure standardisée des données passées aux workers
 * - Sérialisation/désérialisation transparente
 * - Informations de contexte pour traçabilité
 * - Métadonnées pour debugging et analytics
 */
export interface NotificationJobPayload {
  /** ID unique du job */
  jobId: string;
  
  /** Notification complète à traiter */
  notification: Notification;
  
  /** Canal cible pour ce job */
  targetChannel: NotificationChannel;
  
  /** Tentative courante (1, 2, 3...) */
  attempt: number;
  
  /** Horodatage de création du job */
  createdAt: Date;
  
  /** Horodatage de traitement prévu */
  scheduledAt?: Date;
  
  /** Contexte métier pour corrélation */
  businessContext?: {
    /** ID de corrélation pour traçabilité */
    correlationId?: string;
    
    /** ID de workflow parent */
    workflowId?: string;
    
    /** Métadonnées additionnelles */
    metadata?: Record<string, any>;
  };
  
  /** Configuration spécifique au job */
  jobConfig?: {
    /** Priorité du job */
    priority: NotificationPriority;
    
    /** Délai d'expiration (TTL) */
    ttl?: number;
    
    /** Retry policy override */
    retryPolicy?: QueueRetryPolicy;
    
    /** Tags pour analytics */
    tags?: string[];
  };
}

/**
 * ⚙️ Politique de retry pour un job
 * 
 * Utilité:
 * - Configuration fine du comportement de retry
 * - Adaptation selon le type d'erreur rencontré
 * - Optimisation des ressources avec backoff exponentiel
 * - Prévention des thundering herds
 */
export interface QueueRetryPolicy {
  /** Nombre maximum de tentatives */
  maxAttempts: number;
  
  /** Délai initial entre tentatives (ms) */
  initialDelay: number;
  
  /** Facteur multiplicateur pour backoff exponentiel */
  backoffMultiplier: number;
  
  /** Délai maximum entre tentatives (ms) */
  maxDelay: number;
  
  /** Jitter pour éviter la synchronisation (0-1) */
  jitter?: number;
  
  /** Types d'erreurs à retry automatiquement */
  retryableErrors?: string[];
  
  /** Types d'erreurs à ne jamais retry */
  nonRetryableErrors?: string[];
}

/**
 * 📊 Options d'ajout d'un job à la queue
 * 
 * Utilité:
 * - Configuration granulaire par job
 * - Override des paramètres par défaut de la queue
 * - Support des patterns avancés (batching, deduplication)
 * - Intégration avec systems externes (tracing, metrics)
 */
export interface QueueJobOptions {
  /** Priorité du job (1=low, 10=high) */
  priority?: number;
  
  /** Délai avant traitement (ms) */
  delay?: number;
  
  /** Traitement programmé à une date précise */
  scheduledAt?: Date;
  
  /** Durée de vie du job (TTL) en ms */
  ttl?: number;
  
  /** Politique de retry spécifique */
  retryPolicy?: QueueRetryPolicy;
  
  /** Déduplication par clé unique */
  deduplicationKey?: string;
  
  /** ID personnalisé du job */
  jobId?: string;
  
  /** Groupe de jobs pour traitement par lot */
  batchGroup?: string;
  
  /** Taille du lot si batching activé */
  batchSize?: number;
  
  /** Timeout du worker pour ce job (ms) */
  workerTimeout?: number;
  
  /** Désactiver le retry pour ce job */
  disableRetry?: boolean;
  
  /** Tags pour filtrage et analytics */
  tags?: string[];
  
  /** Métadonnées personnalisées */
  metadata?: Record<string, any>;
}

/**
 * 📈 Statistiques détaillées d'une queue
 * 
 * Utilité:
 * - Monitoring temps réel des performances
 * - Alerting automatique sur seuils critiques
 * - Optimisation de la configuration des workers
 * - Rapports de capacité et planification
 */
export interface QueueStats {
  /** Nom de la queue */
  queueName: QueueName;
  
  /** Horodatage de collecte des stats */
  timestamp: Date;
  
  /** Jobs en attente de traitement */
  waiting: number;
  
  /** Jobs actuellement traités */
  active: number;
  
  /** Jobs terminés avec succès */
  completed: number;
  
  /** Jobs échoués */
  failed: number;
  
  /** Jobs reportés (delayed) */
  delayed: number;
  
  /** Jobs en cours de retry */
  retrying: number;
  
  /** Jobs dans la dead letter queue */
  deadLetterQueue: number;
  
  /** Métriques temporelles */
  timing: {
    /** Temps d'attente moyen (ms) */
    avgWaitTime: number;
    
    /** Temps de traitement moyen (ms) */
    avgProcessingTime: number;
    
    /** Débit (jobs/minute) */
    throughput: number;
    
    /** Latence du 95e percentile (ms) */
    p95Latency: number;
  };
  
  /** Santé de la queue */
  health: {
    /** État général */
    status: 'healthy' | 'degraded' | 'critical';
    
    /** Workers actifs */
    activeWorkers: number;
    
    /** Workers configurés */
    totalWorkers: number;
    
    /** Utilisation CPU moyenne des workers (%) */
    avgCpuUsage: number;
    
    /** Utilisation mémoire moyenne des workers (MB) */
    avgMemoryUsage: number;
    
    /** Taux d'erreur récent (%) */
    errorRate: number;
  };
  
  /** Top erreurs */
  topErrors: Array<{
    error: string;
    count: number;
    lastOccurrence: Date;
  }>;
}

/**
 * 👷 Informations sur un worker de queue
 * 
 * Utilité:
 * - Monitoring des workers individuels
 * - Distribution de charge et load balancing
 * - Debugging des problèmes de performance
 * - Gestion du cycle de vie des workers
 */
export interface QueueWorkerInfo {
  /** ID unique du worker */
  workerId: string;
  
  /** Nom de la queue assignée */
  queueName: QueueName;
  
  /** État du worker */
  status: 'idle' | 'busy' | 'paused' | 'stopped' | 'error';
  
  /** Job actuellement traité */
  currentJob?: {
    jobId: string;
    startedAt: Date;
    estimatedCompletion?: Date;
  };
  
  /** Statistiques du worker */
  stats: {
    /** Jobs traités avec succès */
    completedJobs: number;
    
    /** Jobs échoués */
    failedJobs: number;
    
    /** Temps de fonctionnement (ms) */
    uptime: number;
    
    /** Dernière activité */
    lastActivity: Date;
  };
  
  /** Ressources système */
  resources: {
    /** Usage CPU (%) */
    cpuUsage: number;
    
    /** Usage mémoire (MB) */
    memoryUsage: number;
    
    /** Latence réseau moyenne (ms) */
    networkLatency?: number;
  };
}

/**
 * 🔍 Critères de recherche dans les jobs
 * 
 * Utilité:
 * - Debug et troubleshooting des jobs problématiques
 * - Analytics et reporting détaillé
 * - Audit trail pour conformité
 * - Nettoyage ciblé des anciennes données
 */
export interface JobSearchCriteria {
  /** Nom de la queue */
  queueName?: QueueName;
  
  /** IDs spécifiques de jobs */
  jobIds?: string[];
  
  /** États des jobs */
  statuses?: ('waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'retrying')[];
  
  /** Canal de notification */
  channel?: NotificationChannel;
  
  /** Types de notification */
  notificationTypes?: string[];
  
  /** Plage de création */
  createdAt?: {
    from: Date;
    to: Date;
  };
  
  /** Plage de traitement */
  processedAt?: {
    from: Date;
    to: Date;
  };
  
  /** Priorité minimale */
  minPriority?: number;
  
  /** Tags à inclure */
  includeTags?: string[];
  
  /** Tags à exclure */
  excludeTags?: string[];
  
  /** ID de corrélation */
  correlationId?: string;
  
  /** Codes d'erreur */
  errorCodes?: string[];
  
  /** Nombre de tentatives */
  attempts?: {
    min?: number;
    max?: number;
  };
  
  /** Pagination */
  pagination?: {
    offset: number;
    limit: number;
  };
  
  /** Tri */
  sortBy?: 'createdAt' | 'processedAt' | 'priority' | 'attempts';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 🔄 INTERFACE PRINCIPALE - Service de Queue de Notification
 * 
 * Cette interface définit le contrat pour le système de queues
 * de notifications d'Express Quote. Elle abstrait l'implémentation
 * spécifique (BullMQ, AWS SQS, etc.) et fournit une API uniforme.
 * 
 * Responsabilités contractuelles:
 * - Ajout et gestion des jobs de notification
 * - Configuration des workers et du traitement
 * - Monitoring et métriques des queues
 * - Gestion des erreurs et retry automatique
 * - Scaling et load balancing des workers
 * - Maintenance et nettoyage des données
 */
export interface INotificationQueue {
  /**
   * ➕ Ajouter un job à une queue
   * 
   * Ajoute une notification à traiter dans la queue appropriée.
   * Gère automatiquement la sérialisation et la validation.
   * 
   * @param queueName Nom de la queue cible
   * @param payload Données de la notification
   * @param options Configuration du job
   * @returns ID du job créé
   * 
   * @throws QueueError Si l'ajout échoue
   */
  addJob(
    queueName: QueueName, 
    payload: NotificationJobPayload, 
    options?: QueueJobOptions
  ): Promise<string>;
  
  /**
   * 📦 Ajouter plusieurs jobs en lot
   * 
   * Optimisé pour l'ajout en volume avec transaction atomique.
   * 
   * @param queueName Nom de la queue cible
   * @param payloads Liste des payloads
   * @param options Options communes aux jobs
   * @returns IDs des jobs créés
   */
  addBatchJobs(
    queueName: QueueName,
    payloads: NotificationJobPayload[],
    options?: QueueJobOptions
  ): Promise<string[]>;
  
  /**
   * 🔍 Récupérer un job par ID
   * 
   * @param queueName Nom de la queue
   * @param jobId ID du job
   * @returns Job complet ou null si inexistant
   */
  getJob(queueName: QueueName, jobId: string): Promise<{
    id: string;
    payload: NotificationJobPayload;
    status: string;
    progress: number;
    createdAt: Date;
    processedAt?: Date;
    completedAt?: Date;
    failedAt?: Date;
    error?: any;
    attempts: number;
    metadata?: Record<string, any>;
  } | null>;
  
  /**
   * 🗑️ Supprimer un job
   * 
   * Supprime un job de la queue (seulement si pas encore traité).
   * 
   * @param queueName Nom de la queue
   * @param jobId ID du job à supprimer
   * @returns true si supprimé, false si impossible
   */
  removeJob(queueName: QueueName, jobId: string): Promise<boolean>;
  
  /**
   * 🔁 Relancer un job échoué
   * 
   * Remet en queue un job qui a échoué pour nouvelle tentative.
   * 
   * @param queueName Nom de la queue
   * @param jobId ID du job à relancer
   * @param options Nouvelles options (optionnel)
   * @returns true si relancé avec succès
   */
  retryJob(queueName: QueueName, jobId: string, options?: QueueJobOptions): Promise<boolean>;
  
  /**
   * 🔍 Rechercher des jobs
   * 
   * Recherche flexible dans l'historique des jobs.
   * 
   * @param criteria Critères de recherche
   * @returns Résultats paginés
   */
  searchJobs(criteria: JobSearchCriteria): Promise<{
    jobs: Array<{
      id: string;
      queueName: QueueName;
      payload: NotificationJobPayload;
      status: string;
      createdAt: Date;
      processedAt?: Date;
      attempts: number;
      error?: any;
    }>;
    totalCount: number;
    hasMore: boolean;
  }>;
  
  /**
   * 📊 Obtenir les statistiques d'une queue
   * 
   * @param queueName Nom de la queue
   * @returns Statistiques complètes
   */
  getQueueStats(queueName: QueueName): Promise<QueueStats>;
  
  /**
   * 📊 Obtenir les statistiques de toutes les queues
   * 
   * @returns Map des statistiques par queue
   */
  getAllQueueStats(): Promise<Map<QueueName, QueueStats>>;
  
  /**
   * 👷 Lister les workers actifs
   * 
   * @param queueName Nom de la queue (optionnel)
   * @returns Liste des workers
   */
  getActiveWorkers(queueName?: QueueName): Promise<QueueWorkerInfo[]>;
  
  /**
   * ⏸️ Mettre en pause une queue
   * 
   * Suspend le traitement des nouveaux jobs.
   * Les jobs en cours continuent jusqu'à completion.
   * 
   * @param queueName Nom de la queue
   * @returns true si mise en pause réussie
   */
  pauseQueue(queueName: QueueName): Promise<boolean>;
  
  /**
   * ▶️ Reprendre une queue en pause
   * 
   * @param queueName Nom de la queue
   * @returns true si reprise réussie
   */
  resumeQueue(queueName: QueueName): Promise<boolean>;
  
  /**
   * 🧹 Nettoyer une queue
   * 
   * Supprime les jobs anciens selon les critères donnés.
   * 
   * @param queueName Nom de la queue
   * @param options Critères de nettoyage
   * @returns Nombre de jobs supprimés
   */
  cleanQueue(
    queueName: QueueName, 
    options: {
      /** Supprimer jobs complétés plus anciens que (ms) */
      completedOlderThan?: number;
      
      /** Supprimer jobs échoués plus anciens que (ms) */
      failedOlderThan?: number;
      
      /** Garder au maximum N jobs complétés récents */
      keepRecentCompleted?: number;
      
      /** Garder au maximum N jobs échoués récents */
      keepRecentFailed?: number;
      
      /** Mode simulation (ne supprime pas vraiment) */
      dryRun?: boolean;
    }
  ): Promise<number>;
  
  /**
   * 🏥 Vérifier la santé du système de queues
   * 
   * Health check complet de toutes les queues et workers.
   * 
   * @returns État de santé détaillé
   */
  healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    timestamp: Date;
    queues: Array<{
      name: QueueName;
      status: 'healthy' | 'degraded' | 'critical';
      activeJobs: number;
      waitingJobs: number;
      failedJobs: number;
      workers: number;
      errorRate: number;
    }>;
    system: {
      totalMemoryUsage: number;
      totalCpuUsage: number;
      networkLatency: number;
      redisConnections: number;
    };
  }>;
  
  /**
   * 📊 Obtenir les métriques pour monitoring
   * 
   * Export des métriques au format Prometheus/Grafana.
   * 
   * @returns Métriques formatées
   */
  getMetrics(): Promise<{
    queues: Record<string, {
      waiting_jobs: number;
      active_jobs: number;
      completed_jobs: number;
      failed_jobs: number;
      processing_time_seconds: number;
      throughput_jobs_per_minute: number;
    }>;
    workers: {
      total_workers: number;
      active_workers: number;
      idle_workers: number;
      average_cpu_percent: number;
      average_memory_mb: number;
    };
    system: {
      uptime_seconds: number;
      redis_connected: boolean;
      queue_errors_total: number;
    };
  }>;
  
  /**
   * ⚙️ Mettre à jour la configuration d'une queue
   * 
   * Modification dynamique des paramètres de queue.
   * 
   * @param queueName Nom de la queue
   * @param config Nouvelle configuration
   * @returns true si mise à jour réussie
   */
  updateQueueConfig(
    queueName: QueueName, 
    config: {
      /** Nombre de workers concurrents */
      concurrency?: number;
      
      /** Politique de retry par défaut */
      defaultRetryPolicy?: QueueRetryPolicy;
      
      /** Limite de jobs en attente */
      maxWaitingJobs?: number;
      
      /** TTL par défaut des jobs (ms) */
      defaultTtl?: number;
      
      /** Taille des batches pour traitement groupé */
      batchSize?: number;
    }
  ): Promise<boolean>;
  
  /**
   * 🔄 Redémarrer tous les workers d'une queue
   * 
   * Redémarrage gracieux avec attente de completion des jobs en cours.
   * 
   * @param queueName Nom de la queue
   * @param timeout Timeout pour attendre la completion (ms)
   * @returns true si redémarrage réussi
   */
  restartWorkers(queueName: QueueName, timeout?: number): Promise<boolean>;
}

/**
 * 🚨 Exceptions spécifiques aux queues
 */
export class QueueError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly queueName?: QueueName,
    public readonly jobId?: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'QueueError';
  }
}

export class QueueConfigError extends QueueError {
  constructor(message: string, queueName?: QueueName, details?: Record<string, any>) {
    super(message, 'QUEUE_CONFIG_ERROR', queueName, undefined, details);
    this.name = 'QueueConfigError';
  }
}

export class JobNotFoundError extends QueueError {
  constructor(jobId: string, queueName?: QueueName) {
    super(`Job ${jobId} not found`, 'JOB_NOT_FOUND', queueName, jobId);
    this.name = 'JobNotFoundError';
  }
}

export class QueueCapacityError extends QueueError {
  constructor(queueName: QueueName, currentSize: number, maxSize: number) {
    super(
      `Queue ${queueName} at capacity: ${currentSize}/${maxSize}`,
      'QUEUE_CAPACITY_ERROR',
      queueName,
      undefined,
      { currentSize, maxSize }
    );
    this.name = 'QueueCapacityError';
  }
}

// =============================================================================
// 📝 EXEMPLE D'UTILISATION
// =============================================================================
/*
import { INotificationQueue, QueueName, NotificationJobPayload } from './INotificationQueue';
import { NotificationFactory } from '../entities/Notification';

class NotificationService {
  constructor(private queue: INotificationQueue) {}
  
  async sendBookingConfirmation(customer: any, booking: any) {
    // 1. Créer la notification
    const notification = NotificationFactory.createBookingConfirmation(
      customer, booking, { correlationId: `booking-${booking.id}` }
    );
    
    // 2. Préparer le payload du job
    const payload: NotificationJobPayload = {
      jobId: `booking-${booking.id}-${Date.now()}`,
      notification,
      targetChannel: 'EMAIL',
      attempt: 1,
      createdAt: new Date(),
      businessContext: {
        correlationId: `booking-${booking.id}`,
        workflowId: 'booking-confirmation-flow',
        metadata: { bookingType: booking.serviceType }
      },
      jobConfig: {
        priority: 'HIGH',
        ttl: 24 * 60 * 60 * 1000, // 24 heures
        tags: ['booking', 'confirmation', 'high-priority']
      }
    };
    
    // 3. Ajouter à la queue email
    const jobId = await this.queue.addJob('email-queue', payload, {
      priority: 8, // Priorité haute
      retryPolicy: {
        maxAttempts: 3,
        initialDelay: 1000,
        backoffMultiplier: 2,
        maxDelay: 10000,
        retryableErrors: ['SMTP_TIMEOUT', 'DNS_ERROR'],
        nonRetryableErrors: ['INVALID_EMAIL', 'BLACKLISTED']
      },
      tags: ['booking-confirmation']
    });
    
    console.log(`Job ajouté à la queue: ${jobId}`);
    
    // 4. Vérifier le statut plus tard
    setTimeout(async () => {
      const job = await this.queue.getJob('email-queue', jobId);
      if (job) {
        console.log(`Statut du job: ${job.status}`);
        if (job.error) {
          console.error(`Erreur: ${job.error.message}`);
        }
      }
    }, 5000);
    
    return jobId;
  }
  
  async monitorQueues() {
    // Statistiques de toutes les queues
    const allStats = await this.queue.getAllQueueStats();
    
    for (const [queueName, stats] of allStats) {
      console.log(`Queue ${queueName}:`);
      console.log(`  - En attente: ${stats.waiting}`);
      console.log(`  - Actifs: ${stats.active}`);
      console.log(`  - Complétés: ${stats.completed}`);
      console.log(`  - Échoués: ${stats.failed}`);
      console.log(`  - Débit: ${stats.timing.throughput} jobs/min`);
      console.log(`  - Latence P95: ${stats.timing.p95Latency}ms`);
      
      if (stats.health.status !== 'healthy') {
        console.warn(`⚠️ Queue ${queueName} en état: ${stats.health.status}`);
      }
    }
  }
  
  async cleanupOldJobs() {
    const oneWeekAgo = 7 * 24 * 60 * 60 * 1000; // 1 semaine en ms
    
    for (const queueName of ['email-queue', 'sms-queue', 'whatsapp-queue']) {
      const cleaned = await this.queue.cleanQueue(queueName as QueueName, {
        completedOlderThan: oneWeekAgo,
        failedOlderThan: oneWeekAgo * 2, // Garder les échecs 2 semaines
        keepRecentCompleted: 1000,
        keepRecentFailed: 100
      });
      
      console.log(`Nettoyé ${cleaned} jobs de ${queueName}`);
    }
  }
  
  async handleHealthCheck() {
    const health = await this.queue.healthCheck();
    
    if (health.status !== 'healthy') {
      console.error(`🚨 Système de queues en état: ${health.status}`);
      
      // Alerting automatique si dégradé
      if (health.status === 'critical') {
        await this.sendAlertToOperations(health);
      }
    }
    
    return health;
  }
  
  private async sendAlertToOperations(health: any) {
    // Logique d'alerte (email admin, Slack, PagerDuty, etc.)
    console.error('🚨 ALERTE: Système de notification en panne critique!', health);
  }
}

// Configuration des workers (exemple avec BullMQ)
class QueueWorkerManager {
  async startWorkers(queue: INotificationQueue) {
    // Configuration différenciée par type de queue
    await queue.updateQueueConfig('email-queue', {
      concurrency: 5,
      batchSize: 10,
      maxWaitingJobs: 10000,
      defaultRetryPolicy: {
        maxAttempts: 3,
        initialDelay: 1000,
        backoffMultiplier: 2,
        maxDelay: 30000
      }
    });
    
    await queue.updateQueueConfig('whatsapp-queue', {
      concurrency: 3, // Limite WhatsApp Business API
      batchSize: 1,   // Pas de batch pour WhatsApp
      maxWaitingJobs: 1000,
      defaultRetryPolicy: {
        maxAttempts: 2,
        initialDelay: 2000,
        backoffMultiplier: 3,
        maxDelay: 60000
      }
    });
    
    console.log('Workers configurés et démarrés');
  }
}
*/
