/**
 * 📊 COLLECTEUR DE MÉTRIQUES PRODUCTION - Monitoring Avancé
 * 
 * Collecteur robuste avec :
 * - Métriques temps réel des notifications
 * - Statistiques par canal et fournisseur
 * - Agrégation temporelle (minute, heure, jour)
 * - Export vers systèmes de monitoring
 * - Alertes sur seuils critiques
 */

export interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  tags: Record<string, string>;
  unit?: string;
}

export interface ChannelMetrics {
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
  averageLatency: number;
  errorRate: number;
}

export interface ProviderMetrics {
  provider: string;
  channel: string;
  requests: number;
  successes: number;
  failures: number;
  averageResponseTime: number;
  lastError?: string;
}

export interface SystemMetrics {
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: number;
  activeConnections: number;
  queueSize: number;
}

export class MetricsCollector {
  private metrics: Map<string, MetricData[]> = new Map();
  private channelStats: Map<string, ChannelMetrics> = new Map();
  private providerStats: Map<string, ProviderMetrics> = new Map();
  private startTime: Date = new Date();
  private collectionInterval: NodeJS.Timeout | null = null;
  
  constructor(private config: {
    retentionHours: number;
    collectionIntervalMs: number;
    enableAutoExport: boolean;
  } = {
    retentionHours: parseInt(process.env.METRICS_RETENTION_HOURS || '24'),
    collectionIntervalMs: parseInt(process.env.METRICS_COLLECTION_INTERVAL_MS || '60000'),
    enableAutoExport: process.env.METRICS_AUTO_EXPORT === 'true'
  }) {
    this.initializeChannelStats();
    this.startCollection();
  }
  
  /**
   * Initialiser les statistiques des canaux
   */
  private initializeChannelStats(): void {
    const channels = ['email', 'sms', 'whatsapp'];
    
    channels.forEach(channel => {
      this.channelStats.set(channel, {
        sent: 0,
        delivered: 0,
        failed: 0,
        pending: 0,
        averageLatency: 0,
        errorRate: 0
      });
    });
  }
  
  /**
   * Démarrer la collecte automatique
   */
  private startCollection(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }
    
    this.collectionInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.cleanupOldMetrics();
    }, this.config.collectionIntervalMs);
    
    console.log(`📊 Metrics collector started (interval: ${this.config.collectionIntervalMs}ms)`);
  }
  
  /**
   * Démarrer un timer pour mesurer la durée
   */
  startTimer(metricName: string): { end(): number } {
    const startTime = Date.now();
    
    return {
      end: (): number => {
        const duration = Date.now() - startTime;
        this.recordMetric(metricName, duration, {}, 'ms');
        return duration;
      }
    };
  }

  /**
   * Incrémenter un compteur
   */
  increment(metricName: string, value: number = 1, tags: Record<string, string> = {}): void {
    this.recordMetric(metricName, value, tags);
  }

  /**
   * Enregistrer une métrique gauge (valeur instantanée)
   */
  gauge(metricName: string, value: number, tags: Record<string, string> = {}): void {
    this.recordMetric(metricName, value, tags, 'gauge');
  }

  /**
   * Obtenir toutes les métriques par nom (pour les tests)
   */
  getMetrics(): Record<string, number> {
    const result: Record<string, number> = {};
    
    for (const [name, metricArray] of this.metrics.entries()) {
      if (metricArray.length > 0) {
        // Prendre la dernière valeur
        result[name] = metricArray[metricArray.length - 1].value;
      }
    }
    
    return result;
  }

  /**
   * Générer un rapport de métriques (pour les tests)
   */
  generateReport(): {
    summary: {
      totalEmails: number;
      successRate: number;
    };
  } {
    const metrics = this.getMetrics();
    const sent = metrics['email.sent.total'] || 0;
    const failed = metrics['email.failed.total'] || 0;
    const total = sent + failed;
    
    return {
      summary: {
        totalEmails: total,
        successRate: total > 0 ? sent / total : 0
      }
    };
  }

  /**
   * Enregistrer une métrique
   */
  recordMetric(name: string, value: number, tags: Record<string, string> = {}, unit?: string): void {
    const metric: MetricData = {
      name,
      value,
      timestamp: new Date(),
      tags,
      unit
    };
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name)!.push(metric);
    
    // Log pour debug
    console.log(`📈 Metric recorded: ${name}=${value}${unit || ''} ${JSON.stringify(tags)}`);
  }
  
  /**
   * Enregistrer l'envoi d'une notification
   */
  recordNotificationSent(channel: string, provider: string, success: boolean, latencyMs: number): void {
    const stats = this.channelStats.get(channel);
    if (stats) {
      if (success) {
        stats.sent++;
        stats.delivered++;
      } else {
        stats.failed++;
      }
      
      // Calculer la latence moyenne
      const totalRequests = stats.sent + stats.failed;
      stats.averageLatency = ((stats.averageLatency * (totalRequests - 1)) + latencyMs) / totalRequests;
      
      // Calculer le taux d'erreur
      stats.errorRate = stats.failed / totalRequests;
      
      this.channelStats.set(channel, stats);
    }
    
    // Statistiques par fournisseur
    const providerKey = `${channel}-${provider}`;
    let providerStats = this.providerStats.get(providerKey);
    
    if (!providerStats) {
      providerStats = {
        provider,
        channel,
        requests: 0,
        successes: 0,
        failures: 0,
        averageResponseTime: 0
      };
    }
    
    providerStats.requests++;
    if (success) {
      providerStats.successes++;
    } else {
      providerStats.failures++;
    }
    
    // Mettre à jour le temps de réponse moyen
    providerStats.averageResponseTime = 
      ((providerStats.averageResponseTime * (providerStats.requests - 1)) + latencyMs) / providerStats.requests;
    
    this.providerStats.set(providerKey, providerStats);
    
    // Enregistrer les métriques individuelles
    this.recordMetric('notification.sent', 1, { channel, provider, success: success.toString() });
    this.recordMetric('notification.latency', latencyMs, { channel, provider }, 'ms');
  }
  
  /**
   * Enregistrer une erreur de notification
   */
  recordNotificationError(channel: string, provider: string, error: string): void {
    const providerKey = `${channel}-${provider}`;
    const providerStats = this.providerStats.get(providerKey);
    
    if (providerStats) {
      providerStats.lastError = error;
      this.providerStats.set(providerKey, providerStats);
    }
    
    this.recordMetric('notification.error', 1, { channel, provider, error_type: this.categorizeError(error) });
  }
  
  /**
   * Catégoriser les erreurs
   */
  private categorizeError(error: string): string {
    const errorLower = error.toLowerCase();
    
    if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
      return 'timeout';
    } else if (errorLower.includes('network') || errorLower.includes('connection')) {
      return 'network';
    } else if (errorLower.includes('auth') || errorLower.includes('unauthorized')) {
      return 'authentication';
    } else if (errorLower.includes('rate') || errorLower.includes('limit')) {
      return 'rate_limit';
    } else if (errorLower.includes('invalid') || errorLower.includes('bad request')) {
      return 'validation';
    } else {
      return 'unknown';
    }
  }
  
  /**
   * Collecter les métriques système
   */
  private collectSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    const uptime = Date.now() - this.startTime.getTime();
    
    this.recordMetric('system.memory.used', memUsage.heapUsed, {}, 'bytes');
    this.recordMetric('system.memory.total', memUsage.heapTotal, {}, 'bytes');
    this.recordMetric('system.uptime', uptime, {}, 'ms');
    
    // CPU usage approximation
    const cpuUsage = process.cpuUsage();
    this.recordMetric('system.cpu.user', cpuUsage.user, {}, 'microseconds');
    this.recordMetric('system.cpu.system', cpuUsage.system, {}, 'microseconds');
  }
  
  /**
   * Nettoyer les anciennes métriques
   */
  private cleanupOldMetrics(): void {
    const cutoffTime = new Date(Date.now() - (this.config.retentionHours * 60 * 60 * 1000));
    
    let cleanedCount = 0;
    
    for (const [name, metrics] of this.metrics.entries()) {
      const filteredMetrics = metrics.filter(metric => metric.timestamp > cutoffTime);
      
      if (filteredMetrics.length !== metrics.length) {
        cleanedCount += metrics.length - filteredMetrics.length;
        this.metrics.set(name, filteredMetrics);
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old metrics`);
    }
  }
  
  /**
   * Obtenir les statistiques par canal
   */
  getChannelStats(channel?: string): Map<string, ChannelMetrics> | ChannelMetrics | undefined {
    if (channel) {
      return this.channelStats.get(channel);
    }
    return this.channelStats;
  }
  
  /**
   * Obtenir les statistiques par fournisseur
   */
  getProviderStats(provider?: string): ProviderMetrics[] {
    if (provider) {
      return Array.from(this.providerStats.values()).filter(stats => stats.provider === provider);
    }
    return Array.from(this.providerStats.values());
  }
  
  /**
   * Obtenir les métriques système
   */
  getSystemMetrics(): SystemMetrics {
    const memUsage = process.memoryUsage();
    const uptime = Date.now() - this.startTime.getTime();
    
    return {
      uptime,
      memoryUsage: memUsage,
      cpuUsage: 0, // Approximation simple
      activeConnections: 0, // À implémenter
      queueSize: 0 // À obtenir du queue manager
    };
  }
  
  /**
   * Obtenir un résumé des métriques
   */
  getMetricsSummary(timeRangeMinutes: number = 60): {
    channels: Record<string, ChannelMetrics>;
    providers: ProviderMetrics[];
    system: SystemMetrics;
    alerts: string[];
  } {
    const alerts: string[] = [];
    
    // Vérifier les seuils d'alerte
    for (const [channel, stats] of this.channelStats.entries()) {
      if (stats.errorRate > 0.1) { // Plus de 10% d'erreurs
        alerts.push(`High error rate for ${channel}: ${(stats.errorRate * 100).toFixed(1)}%`);
      }
      
      if (stats.averageLatency > 5000) { // Plus de 5 secondes
        alerts.push(`High latency for ${channel}: ${stats.averageLatency.toFixed(0)}ms`);
      }
    }
    
    return {
      channels: Object.fromEntries(this.channelStats),
      providers: this.getProviderStats(),
      system: this.getSystemMetrics(),
      alerts
    };
  }
  
  /**
   * Exporter les métriques au format Prometheus
   */
  exportPrometheusMetrics(): string {
    let output = '';
    
    for (const [name, metrics] of this.metrics.entries()) {
      if (metrics.length === 0) continue;
      
      const latestMetric = metrics[metrics.length - 1];
      const metricName = name.replace(/\./g, '_');
      
      output += `# TYPE ${metricName} gauge\n`;
      
      const tagsStr = Object.entries(latestMetric.tags)
        .map(([key, value]) => `${key}="${value}"`)
        .join(',');
      
      output += `${metricName}{${tagsStr}} ${latestMetric.value}\n`;
    }
    
    return output;
  }
  
  /**
   * Exporter les métriques au format JSON
   */
  exportJsonMetrics(): any {
    return {
      timestamp: new Date().toISOString(),
      channels: Object.fromEntries(this.channelStats),
      providers: Object.fromEntries(this.providerStats),
      system: this.getSystemMetrics(),
      metrics: Object.fromEntries(
        Array.from(this.metrics.entries()).map(([name, data]) => [
          name,
          data.slice(-10) // Garder seulement les 10 dernières valeurs
        ])
      )
    };
  }
  
  /**
   * Réinitialiser toutes les métriques
   */
  reset(): void {
    this.metrics.clear();
    this.channelStats.clear();
    this.providerStats.clear();
    this.initializeChannelStats();
    this.startTime = new Date();
    
    console.log('🔄 Metrics collector reset');
  }
  
  /**
   * Arrêter la collecte
   */
  stop(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
    
    console.log('⏹️ Metrics collector stopped');
  }
  
  /**
   * Obtenir le statut du collecteur
   */
  getStatus(): {
    running: boolean;
    uptime: number;
    totalMetrics: number;
    channels: string[];
    providers: string[];
  } {
    return {
      running: this.collectionInterval !== null,
      uptime: Date.now() - this.startTime.getTime(),
      totalMetrics: Array.from(this.metrics.values()).reduce((sum, metrics) => sum + metrics.length, 0),
      channels: Array.from(this.channelStats.keys()),
      providers: Array.from(new Set(Array.from(this.providerStats.values()).map(p => p.provider)))
    };
  }
}