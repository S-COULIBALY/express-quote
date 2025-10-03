/**
 * 🎯 MODERN EVENT BUS - Architecture Moderne
 * 
 * EventBus moderne pour le système de notifications :
 * - Découplage des composants
 * - Extensibilité sans modification du code core
 * - Métriques automatiques
 * - Résilience avec circuit breakers
 * - Architecture simple sans InversifyJS
 */

import { EventEmitter } from 'events';
import { ProductionLogger } from '../logging/logger.production';
import { CircuitBreaker } from '../resilience/circuit.breaker';

/**
 * Types d'événements du système de notifications
 */
export type NotificationEventType = 
  | 'notification.created'
  | 'notification.queued'
  | 'notification.sending'
  | 'notification.sent'
  | 'notification.delivered'
  | 'notification.failed'
  | 'notification.retried'
  | 'notification.expired'
  | 'notification.cancelled'
  | 'queue.job.completed'
  | 'queue.job.failed'
  | 'system.health.degraded'
  | 'system.health.recovered';

/**
 * Données de base pour tous les événements
 */
export interface BaseNotificationEvent {
  notificationId: string;
  recipientId: string;
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP';
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Événements spécifiques
 */
export interface NotificationCreatedEvent extends BaseNotificationEvent {
  templateId?: string;
  templateData?: Record<string, any>;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

export interface NotificationSentEvent extends BaseNotificationEvent {
  externalId?: string;
  providerResponse?: any;
  deliveryTime: number; // ms
  cost?: number;
}

export interface NotificationFailedEvent extends BaseNotificationEvent {
  error: string;
  attempts: number;
  maxAttempts: number;
  canRetry: boolean;
  nextRetryAt?: Date;
}

export interface NotificationDeliveredEvent extends BaseNotificationEvent {
  externalId: string;
  deliveryConfirmation: any;
  finalDeliveryTime: number; // ms depuis création
}

/**
 * Interface pour un handler d'événement
 */
export interface EventHandler<T = any> {
  name: string;
  handle(event: T): Promise<void>;
  priority?: number; // Plus bas = plus prioritaire
  timeout?: number; // Timeout en ms
  retries?: number; // Nombre de tentatives
}

/**
 * Métriques par type d'événement
 */
export interface EventMetrics {
  eventType: string;
  totalEmitted: number;
  totalHandled: number;
  totalFailed: number;
  averageProcessingTime: number;
  lastEmitted?: Date;
  handlers: Array<{
    name: string;
    successCount: number;
    failureCount: number;
    averageTime: number;
    lastExecution?: Date;
  }>;
}

/**
 * EventBus moderne pour notifications
 */
export class ModernEventBus {
  private emitter: EventEmitter;
  private handlers: Map<string, EventHandler[]> = new Map();
  private metrics: Map<string, EventMetrics> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private logger: ProductionLogger;
  private isRunning = false;
  private registeredHandlers: Set<string> = new Set(); // Protection contre enregistrement multiple

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100); // Support pour plusieurs handlers
    this.logger = new ProductionLogger({
      level: 'info',
      enableConsole: true
    });
  }

  /**
   * Initialiser l'EventBus
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('🚀 Initializing Modern Event Bus...');
      
      // Setup des handlers par défaut
      await this.setupDefaultHandlers();
      
      // Setup des métriques
      this.setupMetricsCollection();
      
      this.isRunning = true;
      this.logger.info('✅ Modern Event Bus initialized successfully');
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize Event Bus', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Émettre un événement
   */
  async emit<T>(eventType: NotificationEventType, event: T): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('⚠️ EventBus not running, event discarded', { eventType });
      return;
    }

    const startTime = Date.now();
    
    try {
      // Mise à jour des métriques d'émission
      this.updateEmissionMetrics(eventType);
      
      // Log de l'événement
      this.logger.debug(`📡 Event emitted: ${eventType}`, {
        eventType,
        timestamp: new Date(),
        eventData: event
      });

      // Traitement asynchrone des handlers
      this.processHandlers(eventType, event, startTime);
      
    } catch (error) {
      this.logger.error('❌ Failed to emit event', {
        eventType,
        error: (error as Error).message
      });
    }
  }

  /**
   * Enregistrer un handler pour un type d'événement
   */
  on<T>(eventType: NotificationEventType, handler: EventHandler<T>): void {
    const handlerKey = `${eventType}:${handler.name}`;
    
    // Protection contre enregistrement multiple
    if (this.registeredHandlers.has(handlerKey)) {
      this.logger.debug(`⚠️ Handler already registered: ${handlerKey}`);
      return;
    }
    
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    
    // Tri par priorité (plus bas = plus prioritaire)
    handlers.sort((a, b) => (a.priority || 100) - (b.priority || 100));
    
    this.handlers.set(eventType, handlers);
    this.registeredHandlers.add(handlerKey);
    
    // Créer un circuit breaker pour ce handler
    const breakerKey = `${eventType}:${handler.name}`;
    if (!this.circuitBreakers.has(breakerKey)) {
      this.circuitBreakers.set(breakerKey, new CircuitBreaker({
        failureThreshold: handler.retries || 3,
        timeout: handler.timeout || 5000,
        resetTimeout: 30000,
        onFailure: (error: Error) => {
          this.logger.warn(`🔌 Handler circuit breaker opened: ${breakerKey}`, {
            error: error.message
          });
        }
      }));
    }
    
    this.logger.debug(`📋 Handler registered: ${handler.name} for ${eventType}`, {
      priority: handler.priority || 100,
      timeout: handler.timeout || 5000
    });
  }

  /**
   * Traiter les handlers pour un événement
   */
  private async processHandlers<T>(eventType: NotificationEventType, event: T, startTime: number): Promise<void> {
    const handlers = this.handlers.get(eventType) || [];
    
    if (handlers.length === 0) {
      return;
    }

    // Traitement parallèle des handlers
    const handlerPromises = handlers.map(handler => 
      this.executeHandler(eventType, handler, event, startTime)
    );

    await Promise.allSettled(handlerPromises);
  }

  /**
   * Exécuter un handler avec protection circuit breaker
   */
  private async executeHandler<T>(
    eventType: NotificationEventType, 
    handler: EventHandler<T>, 
    event: T, 
    startTime: number
  ): Promise<void> {
    const breakerKey = `${eventType}:${handler.name}`;
    const circuitBreaker = this.circuitBreakers.get(breakerKey);
    
    if (!circuitBreaker) {
      this.logger.error('❌ No circuit breaker found for handler', { breakerKey });
      return;
    }

    const handlerStartTime = Date.now();

    try {
      // Exécution avec circuit breaker
      const result = await circuitBreaker.call(async () => {
        return await handler.handle(event);
      }, `handler-${handler.name}`);

      if (result.success) {
        const processingTime = Date.now() - handlerStartTime;
        this.updateHandlerMetrics(eventType, handler.name, true, processingTime);
        
        this.logger.debug(`✅ Handler executed successfully: ${handler.name}`, {
          eventType,
          processingTime: `${processingTime}ms`
        });
      } else {
        this.updateHandlerMetrics(eventType, handler.name, false, 0);
        this.logger.error(`❌ Handler failed: ${handler.name}`, {
          eventType,
          error: result.error?.message
        });
      }
      
    } catch (error) {
      this.updateHandlerMetrics(eventType, handler.name, false, 0);
      this.logger.error(`❌ Handler execution error: ${handler.name}`, {
        eventType,
        error: (error as Error).message
      });
    }
  }

  /**
   * Mise à jour des métriques d'émission
   */
  private updateEmissionMetrics(eventType: string): void {
    let metrics = this.metrics.get(eventType);
    
    if (!metrics) {
      metrics = {
        eventType,
        totalEmitted: 0,
        totalHandled: 0,
        totalFailed: 0,
        averageProcessingTime: 0,
        handlers: []
      };
    }

    metrics.totalEmitted++;
    metrics.lastEmitted = new Date();
    
    this.metrics.set(eventType, metrics);
  }

  /**
   * Mise à jour des métriques de handler
   */
  private updateHandlerMetrics(eventType: string, handlerName: string, success: boolean, processingTime: number): void {
    const metrics = this.metrics.get(eventType);
    
    if (!metrics) return;

    // Mise à jour des métriques globales
    if (success) {
      metrics.totalHandled++;
    } else {
      metrics.totalFailed++;
    }

    // Mise à jour des métriques du handler
    let handlerMetrics = metrics.handlers.find(h => h.name === handlerName);
    
    if (!handlerMetrics) {
      handlerMetrics = {
        name: handlerName,
        successCount: 0,
        failureCount: 0,
        averageTime: 0,
        lastExecution: new Date()
      };
      metrics.handlers.push(handlerMetrics);
    }

    if (success) {
      handlerMetrics.successCount++;
      // Calcul de la moyenne mobile
      handlerMetrics.averageTime = (handlerMetrics.averageTime * (handlerMetrics.successCount - 1) + processingTime) / handlerMetrics.successCount;
    } else {
      handlerMetrics.failureCount++;
    }
    
    handlerMetrics.lastExecution = new Date();
    
    this.metrics.set(eventType, metrics);
  }

  /**
   * Setup des handlers par défaut du système
   */
  private async setupDefaultHandlers(): Promise<void> {
    // Handler pour les métriques de base
    this.on('notification.created', {
      name: 'basic-metrics-collector',
      priority: 1,
      async handle(event: NotificationCreatedEvent) {
        console.log(`📊 Notification created for channel ${event.channel}`);
      }
    });

    // Handler pour logging structuré des succès
    this.on('notification.sent', {
      name: 'success-logger', 
      priority: 1,
      async handle(event: NotificationSentEvent) {
        console.log(`✅ Notification delivered successfully`, {
          notificationId: event.notificationId,
          channel: event.channel,
          deliveryTime: `${event.deliveryTime}ms`,
          cost: event.cost ? `${event.cost}€` : undefined
        });
      }
    });

    // Handler pour logging des échecs
    this.on('notification.failed', {
      name: 'failure-logger',
      priority: 1,
      async handle(event: NotificationFailedEvent) {
        console.warn(`⚠️ Notification failed`, {
          notificationId: event.notificationId,
          channel: event.channel,
          error: event.error,
          attempts: `${event.attempts}/${event.maxAttempts}`,
          canRetry: event.canRetry
        });
      }
    });
  }

  /**
   * Enregistrer les handlers avancés (appelé depuis le service principal)
   */
  setupAdvancedHandlers(metricsCollector: any): void {
    // Protection contre enregistrement multiple
    if (this.registeredHandlers.has('advanced-handlers-setup')) {
      this.logger.debug('⚠️ Advanced handlers already setup');
      return;
    }
    
    // Import dynamique des handlers avancés
    import('./handlers/business.metrics.handler').then(({ BusinessMetricsHandler }) => {
      const businessHandler = new BusinessMetricsHandler(metricsCollector);
      
      this.on('notification.created', businessHandler);
      this.on('notification.sent', businessHandler);
      this.on('notification.failed', businessHandler);
    });

    import('./handlers/alerting.handler').then(({ AlertingHandler }) => {
      const alertingHandler = new AlertingHandler();
      
      this.on('notification.created', alertingHandler);
      this.on('notification.sent', alertingHandler);
      this.on('notification.failed', alertingHandler);
    });

    this.registeredHandlers.add('advanced-handlers-setup');
    this.logger.info('🔧 Advanced handlers registered successfully');
  }

  /**
   * Enregistrer les handlers business (facturation et rétention)
   */
  setupBusinessHandlers(metricsCollector: any, repository?: any, notificationService?: any): void {
    // Protection contre enregistrement multiple
    if (this.registeredHandlers.has('business-handlers-setup')) {
      this.logger.debug('⚠️ Business handlers already setup');
      return;
    }
    
    this.logger.info('💼 Setting up business handlers...');
    
    // Import dynamique des handlers business
    import('./handlers/invoicing.handler').then(({ InvoicingHandler }) => {
      const invoicingHandler = new InvoicingHandler(metricsCollector, repository);
      
      // InvoicingHandler se déclenche sur les notifications envoyées avec succès
      this.on('notification.sent', invoicingHandler);
      
      this.logger.info('🧾 InvoicingHandler registered');
    }).catch(error => {
      this.logger.warn('⚠️ Failed to load InvoicingHandler', { error: error.message });
    });

    // ✅ CustomerRetentionHandler RÉACTIVÉ avec protections renforcées
    // Import dynamique du CustomerRetentionHandler avec protection anti-boucle
    import('./handlers/customer-retention.handler').then(({ CustomerRetentionHandler }) => {
      const retentionHandler = new CustomerRetentionHandler(metricsCollector, notificationService);

      // CustomerRetentionHandler se déclenche sur les notifications échouées
      this.on('notification.failed', retentionHandler);

      this.logger.info('💼 CustomerRetentionHandler registered with ENHANCED anti-loop protection', {
        features: [
          'Daily SMS limit (2/customer)', 
          '2h cooldown between attempts', 
          'Content validation',
          'No automatic setInterval',
          'Daily cleanup at 6AM'
        ]
      });
    }).catch(error => {
      this.logger.warn('⚠️ Failed to load CustomerRetentionHandler', { error: error.message });
    });

    this.registeredHandlers.add('business-handlers-setup');
    this.logger.info('✅ Business handlers setup completed');
  }

  /**
   * Setup de la collection de métriques périodique
   */
  private setupMetricsCollection(): void {
    // Log des métriques toutes les 5 minutes
    setInterval(() => {
      this.logMetricsSummary();
    }, 5 * 60 * 1000);
  }

  /**
   * Log des métriques globales
   */
  private logMetricsSummary(): void {
    if (this.metrics.size === 0) return;

    this.logger.info('📊 Event Bus Metrics Summary', {
      totalEventTypes: this.metrics.size,
      metrics: Array.from(this.metrics.values()).map(m => ({
        eventType: m.eventType,
        totalEmitted: m.totalEmitted,
        totalHandled: m.totalHandled,
        totalFailed: m.totalFailed,
        successRate: m.totalEmitted > 0 ? ((m.totalHandled / m.totalEmitted) * 100).toFixed(1) + '%' : '0%',
        averageProcessingTime: `${m.averageProcessingTime.toFixed(1)}ms`
      }))
    });
  }

  /**
   * Obtenir les métriques
   */
  getMetrics(): EventMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Obtenir les métriques pour un type d'événement
   */
  getMetricsForEventType(eventType: string): EventMetrics | undefined {
    return this.metrics.get(eventType);
  }

  /**
   * Vérifier l'état de santé de l'EventBus
   */
  getHealthStatus(): {
    isHealthy: boolean;
    eventsProcessed: number;
    failureRate: number;
    activeHandlers: number;
  } {
    const totalEvents = Array.from(this.metrics.values()).reduce((sum, m) => sum + m.totalEmitted, 0);
    const totalFailed = Array.from(this.metrics.values()).reduce((sum, m) => sum + m.totalFailed, 0);
    const failureRate = totalEvents > 0 ? (totalFailed / totalEvents) * 100 : 0;
    const activeHandlers = this.handlers.size;

    return {
      isHealthy: this.isRunning && failureRate < 10, // < 10% failure rate
      eventsProcessed: totalEvents,
      failureRate: Math.round(failureRate * 100) / 100,
      activeHandlers
    };
  }

  /**
   * Arrêt propre de l'EventBus
   */
  async shutdown(): Promise<void> {
    this.logger.info('🛑 Shutting down Modern Event Bus...');
    
    this.isRunning = false;
    this.emitter.removeAllListeners();
    this.handlers.clear();
    
    this.logger.info('✅ Modern Event Bus shut down successfully');
  }
}