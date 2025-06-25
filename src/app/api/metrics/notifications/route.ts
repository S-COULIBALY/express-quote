import { NextRequest, NextResponse } from 'next/server';
import { notificationMetricsService } from '@/config/services';
import { notificationOrchestratorService } from '@/config/services';
import { logger } from '@/lib/logger';

const metricsLogger = logger.withContext('NotificationMetricsAPI');

/**
 * Endpoint pour récupérer les métriques de notification
 * GET /api/metrics/notifications
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period');
    const channel = searchParams.get('channel');
    const category = searchParams.get('category');

    // Récupérer les métriques
    const metrics = notificationMetricsService.getMetrics();
    
    // Calculer des statistiques supplémentaires
    const successRates = notificationOrchestratorService.getSuccessRates();
    const retryStats = notificationOrchestratorService.getRetryStatistics();
    
    // Filtrer les métriques si nécessaire
    let filteredMetrics = { ...metrics };
    
    if (period) {
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'hour':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          filteredMetrics = notificationMetricsService.getMetricsForPeriod(startDate, now);
          break;
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          filteredMetrics = notificationMetricsService.getMetricsForPeriod(startDate, now);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filteredMetrics = notificationMetricsService.getMetricsForPeriod(startDate, now);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filteredMetrics = notificationMetricsService.getMetricsForPeriod(startDate, now);
          break;
      }
    }
    
    // Préparer la réponse
    const response = {
      metrics: filteredMetrics,
      stats: {
        successRates,
        retryStats,
        errorRate: {
          email: notificationMetricsService.getErrorRate('email'),
          whatsapp: notificationMetricsService.getErrorRate('whatsapp'),
          overall: notificationMetricsService.getErrorRate('both')
        },
        readRate: {
          email: notificationMetricsService.getReadRate('email'),
          whatsapp: notificationMetricsService.getReadRate('whatsapp'),
          overall: notificationMetricsService.getReadRate('both')
        }
      },
      timestamp: new Date()
    };
    
    // Limiter les événements récents à 10 si on ne demande pas un format détaillé
    if (!searchParams.get('detailed')) {
      response.metrics.recentEvents = response.metrics.recentEvents.slice(0, 10);
    }
    
    metricsLogger.info('Métriques de notification récupérées avec succès');
    return NextResponse.json(response);
  } catch (error) {
    metricsLogger.error('Erreur lors de la récupération des métriques de notification:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des métriques' },
      { status: 500 }
    );
  }
}

/**
 * Endpoint pour réinitialiser les métriques
 * POST /api/metrics/notifications/reset
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Vérifier l'autorisation (utilisez votre propre logique d'authentification)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }
    
    const resetType = body.resetType || 'none';
    
    // Pour l'instant, nous ne réinitialisons pas réellement les métriques
    // Cette fonctionnalité pourrait être implémentée dans le NotificationMetricsService
    
    metricsLogger.info(`Tentative de réinitialisation des métriques: ${resetType}`);
    
    return NextResponse.json(
      { message: 'Opération non implémentée pour le moment' },
      { status: 501 }
    );
    
  } catch (error) {
    metricsLogger.error('Erreur lors de la réinitialisation des métriques:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la réinitialisation des métriques' },
      { status: 500 }
    );
  }
} 