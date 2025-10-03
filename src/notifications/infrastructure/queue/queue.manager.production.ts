/**
 * 🔴 GESTIONNAIRE DE QUEUE PRODUCTION - BullMQ + Redis
 * 
 * Gestionnaire de queue robuste avec :
 * - Support BullMQ pour la performance
 * - Pool de connexions Redis
 * - Workers configurables avec concurrence
 * - Retry automatique et dead letter queue
 * - Monitoring et métriques
 */

import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import Redis from 'ioredis';

export interface QueueConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  queues: {
    email: QueueOptions;
    sms: QueueOptions;
    whatsapp: QueueOptions;
    reminders: QueueOptions;
  };
}

export interface QueueOptions {
  concurrency: number;
  attempts: number;
  backoff: 'exponential' | 'fixed';
  delay: number;
}

export interface JobData {
  id: string;
  type: string;
  payload?: any;
  
  // Propriétés de notification
  recipient?: string;
  subject?: string;
  content?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  metadata?: Record<string, any>;
  
  // Propriétés de queue
  priority?: number;
  delay?: number;
  attempts?: number;
}

export class ProductionQueueManager {
  private redis: Redis | null = null;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();
  private connected = false;
  private config: QueueConfig;
  
  constructor(config?: Partial<QueueConfig>) {
    // Parse REDIS_URL si fournie, sinon utiliser les variables individuelles
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0')
    };
    
    if (process.env.REDIS_URL) {
      try {
        const url = new URL(process.env.REDIS_URL);
        redisConfig.host = url.hostname;
        redisConfig.port = parseInt(url.port) || 6379;
        redisConfig.password = url.password || undefined;
        const dbMatch = url.pathname.match(/\/(\d+)$/);
        redisConfig.db = dbMatch ? parseInt(dbMatch[1]) : 0;
      } catch (error) {
        console.warn('Invalid REDIS_URL, using individual Redis variables');
      }
    }
    
    this.config = {
      redis: redisConfig,
      queues: {
        email: {
          concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '3'),
          attempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3'),
          backoff: 'exponential',
          delay: parseInt(process.env.RETRY_DELAY_MS || '1000')
        },
        sms: {
          concurrency: parseInt(process.env.SMS_QUEUE_CONCURRENCY || '3'),
          attempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3'),
          backoff: 'exponential',
          delay: parseInt(process.env.RETRY_DELAY_MS || '1000')
        },
        whatsapp: {
          concurrency: parseInt(process.env.WHATSAPP_QUEUE_CONCURRENCY || '3'),
          attempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3'),
          backoff: 'exponential',
          delay: parseInt(process.env.RETRY_DELAY_MS || '1000')
        },
        reminders: {
          concurrency: parseInt(process.env.REMINDER_QUEUE_CONCURRENCY || '2'),
          attempts: parseInt(process.env.REMINDER_MAX_ATTEMPTS || '3'),
          backoff: 'exponential',
          delay: parseInt(process.env.REMINDER_RETRY_DELAY || '5000')
        }
      },
      ...config
    };
  }
  
  /**
   * Initialiser le gestionnaire de queue avec connexion partagée
   */
  async initialize(): Promise<void> {
    console.log('🔴 Initializing production queue manager with shared connection...');
    
    try {
      // Créer LA SEULE connexion Redis partagée avec configuration BullMQ-compatible
      this.redis = new Redis({
        host: this.config.redis.host,
        port: this.config.redis.port,
        password: this.config.redis.password,
        db: this.config.redis.db,
        maxRetriesPerRequest: null, // BullMQ strict requirement
        family: 4,
        lazyConnect: true
      });
      
      // Tester la connexion partagée
      await this.redis.ping();
      console.log('✅ Single shared Redis connection established');
      
      // Créer les queues avec connexion partagée
      await this.createQueues();
      
      this.connected = true;
      console.log('✅ Queue manager initialized with SHARED Redis connection');
      
    } catch (error) {
      console.error('❌ Queue manager initialization failed:', error);
      throw new Error(`Queue initialization failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Générer la configuration Redis optimale pour BullMQ avec pooling partagé
   */
  private getSharedRedisConfig() {
    const baseConfig = {
      host: this.config.redis.host,
      port: this.config.redis.port,
      password: this.config.redis.password,
      db: this.config.redis.db,
      maxRetriesPerRequest: null, // BullMQ strict requirement
      family: 4,
      lazyConnect: true
    };
    
    console.log('🔧 Redis config for BullMQ:', JSON.stringify(baseConfig, null, 2));
    return baseConfig;
  }
  
  /**
   * Créer toutes les queues avec configuration Redis optimisée pour BullMQ
   */
  private async createQueues(): Promise<void> {
    const queueNames = ['email', 'sms', 'whatsapp', 'reminders'];
    const sharedRedisConfig = this.getSharedRedisConfig();
    
    for (const queueName of queueNames) {
      // Utiliser la configuration partagée optimisée
      const queue = new Queue(queueName, {
        connection: sharedRedisConfig, // Configuration partagée optimisée
        defaultJobOptions: {
          attempts: this.config.queues[queueName as keyof typeof this.config.queues].attempts,
          backoff: {
            type: this.config.queues[queueName as keyof typeof this.config.queues].backoff,
            delay: this.config.queues[queueName as keyof typeof this.config.queues].delay
          },
          removeOnComplete: parseInt(process.env.QUEUE_REMOVE_ON_COMPLETE || '50'),
          removeOnFail: parseInt(process.env.QUEUE_REMOVE_ON_FAIL || '25')
        }
      });
      
      this.queues.set(queueName, queue);
      
      // Créer les événements de queue avec même configuration
      const queueEvents = new QueueEvents(queueName, {
        connection: sharedRedisConfig // Même configuration partagée
      });
      
      this.queueEvents.set(queueName, queueEvents);
      
      console.log(`✅ Queue '${queueName}' created with OPTIMIZED shared Redis config`);
    }
  }
  
  /**
   * Obtenir une queue spécifique
   */
  getQueue(queueName: string): Queue {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }
    return queue;
  }
  
  /**
   * Créer un worker pour traiter une queue avec configuration Redis optimisée
   */
  createWorker(queueName: string, processor: (job: Job) => Promise<any>): Worker {
    if (!this.connected) {
      throw new Error('Queue manager not initialized');
    }
    
    const queueConfig = this.config.queues[queueName as keyof typeof this.config.queues];
    if (!queueConfig) {
      throw new Error(`No configuration found for queue '${queueName}'`);
    }
    
    const sharedRedisConfig = this.getSharedRedisConfig();
    
    const worker = new Worker(queueName, processor, {
      connection: sharedRedisConfig, // Configuration optimisée partagée
      concurrency: queueConfig.concurrency,
      removeOnComplete: parseInt(process.env.QUEUE_REMOVE_ON_COMPLETE || '50'),
      removeOnFail: parseInt(process.env.QUEUE_REMOVE_ON_FAIL || '25')
    });
    
    // Événements du worker
    worker.on('completed', (job: Job) => {
      console.log(`✅ Job ${job.id} completed in queue '${queueName}'`);
    });
    
    worker.on('failed', (job: Job | undefined, error: Error) => {
      console.error(`❌ Job ${job?.id || 'unknown'} failed in queue '${queueName}':`, error.message);
    });
    
    worker.on('error', (error: Error) => {
      console.error(`❌ Worker error in queue '${queueName}':`, error);
    });
    
    this.workers.set(queueName, worker);
    console.log(`✅ Worker created for queue '${queueName}' with concurrency ${queueConfig.concurrency}`);
    
    return worker;
  }
  
  /**
   * Ajouter un job à une queue
   */
  async addJob(queueName: string, jobName: string, data: JobData, options?: any): Promise<Job> {
    const queue = this.getQueue(queueName);
    
    const job = await queue.add(jobName, data, {
      priority: data.priority || 10,
      delay: data.delay || 0,
      attempts: data.attempts || this.config.queues[queueName as keyof typeof this.config.queues]?.attempts || 3,
      ...options
    });
    
    console.log(`📤 Job ${job.id} added to queue '${queueName}'`);
    return job;
  }
  
  /**
   * Obtenir les statistiques d'une queue
   */
  async getQueueStats(queueName: string): Promise<any> {
    const queue = this.getQueue(queueName);
    
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed()
    ]);
    
    return {
      queueName,
      counts: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length
      },
      jobs: {
        waiting: waiting.slice(0, 5).map(job => ({ id: job.id, data: job.data })),
        active: active.slice(0, 5).map(job => ({ id: job.id, data: job.data })),
        failed: failed.slice(0, 5).map(job => ({ id: job.id, data: job.data, error: job.failedReason }))
      }
    };
  }
  
  /**
   * Obtenir les statistiques globales
   */
  async getGlobalStats(): Promise<any> {
    const stats = {};
    
    for (const queueName of this.queues.keys()) {
      stats[queueName] = await this.getQueueStats(queueName);
    }
    
    return {
      redis: {
        connected: this.connected,
        host: this.config.redis.host,
        port: this.config.redis.port,
        db: this.config.redis.db
      },
      queues: stats
    };
  }
  
  /**
   * Purger une queue (supprimer tous les jobs)
   */
  async purgeQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    
    await queue.drain(); // Supprimer les jobs en attente
    await queue.clean(0, 'active');     // Jobs actifs
    await queue.clean(0, 'completed');  // Jobs complétés
    await queue.clean(0, 'failed');     // Jobs échoués
    
    console.log(`🧹 Queue '${queueName}' purged`);
  }
  
  /**
   * Mettre en pause une queue
   */
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.pause();
    console.log(`⏸️ Queue '${queueName}' paused`);
  }
  
  /**
   * Reprendre une queue
   */
  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.resume();
    console.log(`▶️ Queue '${queueName}' resumed`);
  }
  
  /**
   * Vérifier l'état de connexion
   */
  isConnected(): boolean {
    return this.connected === true && this.redis?.status === 'ready';
  }
  
  /**
   * Fermer toutes les connexions
   */
  async close(): Promise<void> {
    console.log('🔴 Closing queue manager...');
    
    // Fermer tous les workers
    for (const [queueName, worker] of this.workers) {
      console.log(`Closing worker for queue '${queueName}'`);
      await worker.close();
    }
    this.workers.clear();
    
    // Fermer tous les événements de queue
    for (const [queueName, queueEvents] of this.queueEvents) {
      console.log(`Closing events for queue '${queueName}'`);
      await queueEvents.close();
    }
    this.queueEvents.clear();
    
    // Fermer toutes les queues
    for (const [queueName, queue] of this.queues) {
      console.log(`Closing queue '${queueName}'`);
      await queue.close();
    }
    this.queues.clear();
    
    // Fermer Redis
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
    
    this.connected = false;
    console.log('✅ Queue manager closed');
  }
}