// @ts-nocheck
/**
 * NotificationHealthChecker - Health checks et monitoring
 * 
 * Responsabilité unique : Vérification de l'état de santé des composants
 */

import { RobustEmailAdapter } from '../../../infrastructure/adapters/email.adapter.production';
import { RobustSmsAdapter } from '../../../infrastructure/adapters/sms.adapter.production';
import { RobustWhatsAppAdapter } from '../../../infrastructure/adapters/whatsapp.adapter.production';
import { ProductionQueueManager } from '../../../infrastructure/queue/queue.manager.production';
import { RateLimiter } from '../../../infrastructure/security/rate.limiter';
import { MetricsCollector } from '../../../infrastructure/monitoring/metrics.collector';
import { NotificationRepository } from '../../../infrastructure/repositories/NotificationRepository';
import { TemplateCache } from '../../../infrastructure/cache/template-cache.production';
import { ProductionLogger } from '../../../infrastructure/logging/logger.production';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  details: {
    adapters: Record<string, any>;
    queue: any;
    rateLimiter: any;
    metrics: any;
    repository: any;
    templateCache: any;
  };
  summary: {
    totalComponents: number;
    healthyComponents: number;
    degradedComponents: number;
    unhealthyComponents: number;
  };
}

export class NotificationHealthChecker {
  private logger = new ProductionLogger('NotificationHealthChecker');

  constructor(
    private emailAdapter: RobustEmailAdapter,
    private smsAdapter: RobustSmsAdapter,
    private whatsAppAdapter: RobustWhatsAppAdapter,
    private queueManager: ProductionQueueManager,
    private rateLimiter: RateLimiter,
    private metricsCollector: MetricsCollector,
    private repository: NotificationRepository,
    private templateCache: TemplateCache
  ) {}

  /**
   * Effectuer un health check complet
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const healthCheckResults = {
      adapters: {} as Record<string, any>,
      queue: null as any,
      rateLimiter: null as any,
      metrics: null as any,
      repository: null as any,
      templateCache: null as any
    };

    let healthyCount = 0;
    let degradedCount = 0;
    let unhealthyCount = 0;

    try {
      // 1. Vérifier les adaptateurs
      try {
        const emailHealth = this.emailAdapter.getHealthStatus();
        healthCheckResults.adapters.email = {
          isHealthy: emailHealth.isHealthy,
          circuitState: emailHealth.circuitState,
          successRate: emailHealth.successRate,
          averageResponseTime: emailHealth.averageResponseTime,
          lastError: emailHealth.lastError,
          lastSuccess: emailHealth.lastSuccess
        };
        
        if (emailHealth.isHealthy) healthyCount++;
        else if (emailHealth.circuitState === 'HALF_OPEN') degradedCount++;
        else unhealthyCount++;
      } catch (error) {
        healthCheckResults.adapters.email = {
          isHealthy: false,
          error: (error as Error).message
        };
        unhealthyCount++;
      }

      try {
        const smsHealth = this.smsAdapter.getHealthStatus();
        healthCheckResults.adapters.sms = {
          isHealthy: smsHealth.isHealthy,
          circuitState: smsHealth.circuitState,
          successRate: smsHealth.successRate,
          averageResponseTime: smsHealth.averageResponseTime,
          lastError: smsHealth.lastError,
          lastSuccess: smsHealth.lastSuccess
        };
        
        if (smsHealth.isHealthy) healthyCount++;
        else if (smsHealth.circuitState === 'HALF_OPEN') degradedCount++;
        else unhealthyCount++;
      } catch (error) {
        healthCheckResults.adapters.sms = {
          isHealthy: false,
          error: (error as Error).message
        };
        unhealthyCount++;
      }

      try {
        const whatsAppHealth = this.whatsAppAdapter.getHealthStatus();
        healthCheckResults.adapters.whatsapp = {
          isHealthy: whatsAppHealth.isHealthy,
          circuitState: whatsAppHealth.circuitState,
          successRate: whatsAppHealth.successRate,
          averageResponseTime: whatsAppHealth.averageResponseTime,
          lastError: whatsAppHealth.lastError,
          lastSuccess: whatsAppHealth.lastSuccess
        };
        
        if (whatsAppHealth.isHealthy) healthyCount++;
        else if (whatsAppHealth.circuitState === 'HALF_OPEN') degradedCount++;
        else unhealthyCount++;
      } catch (error) {
        healthCheckResults.adapters.whatsapp = {
          isHealthy: false,
          error: (error as Error).message
        };
        unhealthyCount++;
      }

      // 2. Vérifier la queue
      try {
        const queueStats = await this.queueManager.getGlobalStats();
        healthCheckResults.queue = {
          isHealthy: true,
          stats: queueStats
        };
        healthyCount++;
      } catch (error) {
        healthCheckResults.queue = {
          isHealthy: false,
          error: (error as Error).message
        };
        unhealthyCount++;
      }

      // 3. Vérifier le rate limiter
      try {
        const rateLimiterStatus = this.rateLimiter.getStatus();
        healthCheckResults.rateLimiter = {
          isHealthy: true,
          status: rateLimiterStatus
        };
        healthyCount++;
      } catch (error) {
        healthCheckResults.rateLimiter = {
          isHealthy: false,
          error: (error as Error).message
        };
        unhealthyCount++;
      }

      // 4. Vérifier les métriques
      try {
        const metricsSummary = this.metricsCollector.getMetricsSummary();
        healthCheckResults.metrics = {
          isHealthy: true,
          summary: metricsSummary
        };
        healthyCount++;
      } catch (error) {
        healthCheckResults.metrics = {
          isHealthy: false,
          error: (error as Error).message
        };
        unhealthyCount++;
      }

      // 5. Vérifier le repository
      try {
        await this.repository.findById('health-check-test');
        healthCheckResults.repository = {
          isHealthy: true
        };
        healthyCount++;
      } catch (error) {
        // Si l'erreur est "not found", c'est OK (la connexion fonctionne)
        if ((error as Error).message.includes('not found') || (error as Error).message.includes('Not found')) {
          healthCheckResults.repository = {
            isHealthy: true
          };
          healthyCount++;
        } else {
          healthCheckResults.repository = {
            isHealthy: false,
            error: (error as Error).message
          };
          unhealthyCount++;
        }
      }

      // 6. Vérifier le cache de templates
      try {
        const cacheStatus = this.templateCache.getStatus();
        healthCheckResults.templateCache = {
          isHealthy: true,
          status: cacheStatus
        };
        healthyCount++;
      } catch (error) {
        healthCheckResults.templateCache = {
          isHealthy: false,
          error: (error as Error).message
        };
        unhealthyCount++;
      }

    } catch (error) {
      this.logger.error('Erreur lors du health check global', { error: (error as Error).message });
    }

    // Déterminer le statut global
    const totalComponents = healthyCount + degradedCount + unhealthyCount;
    let globalStatus: 'healthy' | 'degraded' | 'unhealthy';

    if (unhealthyCount === 0 && degradedCount === 0) {
      globalStatus = 'healthy';
    } else if (unhealthyCount === 0 && degradedCount > 0) {
      globalStatus = 'degraded';
    } else if (healthyCount > unhealthyCount) {
      globalStatus = 'degraded';
    } else {
      globalStatus = 'unhealthy';
    }

    const result: HealthCheckResult = {
      status: globalStatus,
      timestamp: new Date(),
      details: healthCheckResults,
      summary: {
        totalComponents,
        healthyComponents: healthyCount,
        degradedComponents: degradedCount,
        unhealthyComponents: unhealthyCount
      }
    };

    this.logger.info(`Health check completed - Status: ${globalStatus}`, {
      healthy: healthyCount,
      degraded: degradedCount,
      unhealthy: unhealthyCount,
      total: totalComponents
    });

    return result;
  }

  /**
   * Obtenir les statistiques du service
   */
  async getServiceStats(): Promise<any> {
    const queueStats = await this.queueManager.getGlobalStats();
    const metricsStats = this.metricsCollector.getMetricsSummary();
    
    return {
      queues: queueStats,
      metrics: metricsStats,
      templates: {
        total: 0 // Sera rempli par TemplateService
      }
    };
  }
}

