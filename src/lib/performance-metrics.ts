// ✅ SYSTÈME DE MÉTRIQUES DE PERFORMANCE POUR LES MODAUX
// Mesure les temps de chargement, cache hits/miss, et performances globales

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  source: 'cache' | 'api' | 'fallback';
  success: boolean;
  details?: Record<string, any>;
}

interface ModalPerformanceStats {
  averageLoadTime: number;
  cacheHitRate: number;
  apiSuccessRate: number;
  totalRequests: number;
  lastRequest: PerformanceMetric | null;
}

class PerformanceTracker {
  private metrics = new Map<string, PerformanceMetric[]>();
  private activeTimers = new Map<string, number>();

  // Démarrer une mesure
  startTimer(metricName: string): void {
    this.activeTimers.set(metricName, performance.now());
  }

  // Terminer une mesure et l'enregistrer
  endTimer(
    metricName: string,
    source: 'cache' | 'api' | 'fallback',
    success: boolean,
    details?: Record<string, any>
  ): PerformanceMetric {
    const startTime = this.activeTimers.get(metricName);
    if (!startTime) {
      console.warn(`⚠️ [METRICS] Timer ${metricName} not found`);
      return {
        name: metricName,
        duration: -1,
        timestamp: Date.now(),
        source,
        success,
        details
      };
    }

    const duration = performance.now() - startTime;
    const metric: PerformanceMetric = {
      name: metricName,
      duration,
      timestamp: Date.now(),
      source,
      success,
      details
    };

    // Stocker la métrique
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }
    this.metrics.get(metricName)!.push(metric);

    // Nettoyer le timer actif
    this.activeTimers.delete(metricName);

    console.log(`📊 [METRICS] ${metricName}: ${duration.toFixed(2)}ms (${source})`);
    return metric;
  }

  // Obtenir les statistiques pour un modal
  getStats(modalName: string): ModalPerformanceStats {
    const modalMetrics = this.metrics.get(modalName) || [];

    if (modalMetrics.length === 0) {
      return {
        averageLoadTime: 0,
        cacheHitRate: 0,
        apiSuccessRate: 0,
        totalRequests: 0,
        lastRequest: null
      };
    }

    const totalDuration = modalMetrics.reduce((sum, m) => sum + m.duration, 0);
    const cacheHits = modalMetrics.filter(m => m.source === 'cache').length;
    const apiRequests = modalMetrics.filter(m => m.source === 'api').length;
    const apiSuccesses = modalMetrics.filter(m => m.source === 'api' && m.success).length;

    return {
      averageLoadTime: totalDuration / modalMetrics.length,
      cacheHitRate: modalMetrics.length > 0 ? (cacheHits / modalMetrics.length) * 100 : 0,
      apiSuccessRate: apiRequests > 0 ? (apiSuccesses / apiRequests) * 100 : 0,
      totalRequests: modalMetrics.length,
      lastRequest: modalMetrics[modalMetrics.length - 1]
    };
  }

  // Obtenir toutes les métriques
  getAllStats(): Record<string, ModalPerformanceStats> {
    const allStats: Record<string, ModalPerformanceStats> = {};

    for (const metricName of this.metrics.keys()) {
      allStats[metricName] = this.getStats(metricName);
    }

    return allStats;
  }

  // Afficher un rapport détaillé
  printReport(): void {
    const allStats = this.getAllStats();

    console.group('📊 [METRICS] Rapport de performance des modaux');

    for (const [modalName, stats] of Object.entries(allStats)) {
      console.group(`🎯 ${modalName}`);
      console.log(`Temps moyen: ${stats.averageLoadTime.toFixed(2)}ms`);
      console.log(`Taux de cache: ${stats.cacheHitRate.toFixed(1)}%`);
      console.log(`Succès API: ${stats.apiSuccessRate.toFixed(1)}%`);
      console.log(`Total requêtes: ${stats.totalRequests}`);

      if (stats.lastRequest) {
        console.log(`Dernière requête: ${stats.lastRequest.duration.toFixed(2)}ms (${stats.lastRequest.source})`);
      }

      console.groupEnd();
    }

    console.groupEnd();
  }

  // Nettoyer les anciennes métriques (garde les 50 dernières par modal)
  cleanup(): void {
    for (const [metricName, metrics] of this.metrics.entries()) {
      if (metrics.length > 50) {
        this.metrics.set(metricName, metrics.slice(-50));
      }
    }
  }
}

// Instance singleton du tracker
export const performanceTracker = new PerformanceTracker();

// ✅ HOOKS POUR L'UTILISATION DANS LES MODAUX
export function useModalPerformance(modalName: string) {
  return {
    // Démarrer une mesure
    startMeasure: () => performanceTracker.startTimer(modalName),

    // Terminer une mesure
    endMeasure: (source: 'cache' | 'api' | 'fallback', success: boolean, details?: Record<string, any>) =>
      performanceTracker.endTimer(modalName, source, success, details),

    // Obtenir les stats du modal
    getStats: () => performanceTracker.getStats(modalName),

    // Afficher le rapport
    printReport: () => performanceTracker.printReport()
  };
}

// ✅ FONCTION UTILITAIRE POUR MESURER AUTOMATIQUEMENT LES APPELS API
export async function measureApiCall<T>(
  modalName: string,
  apiCall: () => Promise<T>,
  source: 'cache' | 'api' | 'fallback'
): Promise<{ result: T | null; metric: PerformanceMetric }> {
  performanceTracker.startTimer(modalName);

  try {
    const result = await apiCall();
    const metric = performanceTracker.endTimer(modalName, source, true, {
      resultType: typeof result,
      hasData: !!result
    });

    return { result, metric };
  } catch (error) {
    const metric = performanceTracker.endTimer(modalName, source, false, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return { result: null, metric };
  }
}

// Nettoyage automatique toutes les 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    performanceTracker.cleanup();
  }, 5 * 60 * 1000);
}