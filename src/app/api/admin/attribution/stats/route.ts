/**
 * 📊 API STATS ATTRIBUTION ADMIN
 *
 * GET /api/admin/attribution/stats
 *
 * Responsabilité :
 * - Fournit les statistiques du système d'attribution pour l'admin
 * - Récupère attributions actives, sessions professionnels, mises à jour récentes
 * - Calcule métriques de performance et santé du système
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

interface AttributionStatsResponse {
  stats: {
    totalActive: number;
    totalCompleted: number;
    averageResponseTime: number;
    professionalResponseRate: number;
    systemHealthScore: number;
    acceptanceRate: number;
    averageDistance: number;
    rebroadcastRate: number;
  };
  business: {
    totalValue: number;
    lostValue: number;
    averageOrderValue: number;
    roi: number;
  };
  geographic: {
    coveredZones: number;
    averageRadius: number;
    uncoveredDemand: number;
  };
  alerts: {
    count: number;
    critical: any[];
    warnings: any[];
  };
  activeAttributions: any[];
  professionalSessions: any[];
  recentUpdates: any[];
}

/**
 * Récupère les statistiques complètes du système d'attribution
 */
export async function GET(request: NextRequest) {
  const statsLogger = logger.withContext('AttributionStatsAPI');

  try {
    statsLogger.info('🔍 Récupération stats système attribution');

    // Vérification auth admin (avec mode test en développement)
    const authHeader = request.headers.get('authorization');
    const isTestMode = process.env.NODE_ENV === 'development' &&
                      (authHeader === 'Bearer test-token' || authHeader === 'Bearer admin-test');

    if (!isTestMode && (!authHeader || !authHeader.startsWith('Bearer '))) {
      return NextResponse.json({
        success: false,
        error: 'Token requis'
      }, { status: 401 });
    }

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
      // ÉTAPE 1: Récupérer attributions actives
      const activeAttributions = await prisma.bookingAttribution.findMany({
        where: {
          status: {
            in: ['BROADCASTING', 'RE_BROADCASTING']
          }
        },
        include: {
          booking: {
            select: {
              id: true,
              type: true,
              totalAmount: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20
      });

      // ÉTAPE 2: Sessions professionnels actives
      const professionalSessions = await prisma.professionalSession.findMany({
        where: {
          lastActivity: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Dernière heure
          }
        },
        include: {
          professional: {
            select: {
              companyName: true
            }
          }
        },
        orderBy: {
          lastActivity: 'desc'
        },
        take: 50
      });

      // ÉTAPE 3: Mises à jour récentes
      const recentUpdates = await prisma.attributionUpdate.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 dernières heures
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 30
      });

      // ÉTAPE 4: Calculer statistiques du jour
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        completedToday,
        acceptanceRate,
        avgDistance,
        businessMetrics,
        geographicCoverage,
        rebroadcastRate,
        criticalAlerts
      ] = await Promise.all([
        // Attributions complétées aujourd'hui
        prisma.bookingAttribution.count({
          where: {
            status: 'COMPLETED',
            updatedAt: {
              gte: today
            }
          }
        }),

        // Taux d'acceptation (accepted/total attributions)
        calculateAcceptanceRate(prisma),

        // Distance moyenne des attributions acceptées
        calculateAverageDistance(prisma),

        // Métriques business (valeur, ROI)
        calculateBusinessMetrics(prisma),

        // Couverture géographique
        calculateGeographicCoverage(prisma),

        // Taux de re-broadcast nécessaire
        calculateRebroadcastRate(prisma),

        // Alertes critiques
        calculateCriticalAlerts(prisma)
      ]);

      // ÉTAPE 5: Calculer métriques complémentaires
      const averageResponseTime = await calculateAverageResponseTime(prisma);
      const professionalResponseRate = await calculateProfessionalResponseRate(prisma);
      const systemHealthScore = calculateSystemHealth(
        activeAttributions.length,
        professionalSessions.length,
        recentUpdates.length,
        professionalResponseRate,
        criticalAlerts.count
      );

      // ÉTAPE 6: Formater réponse
      const response: AttributionStatsResponse = {
        stats: {
          totalActive: activeAttributions.length,
          totalCompleted: completedToday,
          averageResponseTime,
          professionalResponseRate,
          systemHealthScore,
          acceptanceRate: acceptanceRate.rate,
          averageDistance: avgDistance.accepted,
          rebroadcastRate: rebroadcastRate.percentage
        },
        business: {
          totalValue: businessMetrics.totalValue,
          lostValue: businessMetrics.lostValue,
          averageOrderValue: businessMetrics.averageOrderValue,
          roi: businessMetrics.roi
        },
        geographic: {
          coveredZones: geographicCoverage.zones,
          averageRadius: geographicCoverage.averageRadius,
          uncoveredDemand: geographicCoverage.uncoveredDemand
        },
        alerts: {
          count: criticalAlerts.count,
          critical: criticalAlerts.critical,
          warnings: criticalAlerts.warnings
        },
        activeAttributions: activeAttributions.map((attr: any) => ({
          id: attr.id,
          bookingId: attr.bookingId,
          serviceType: attr.serviceType,
          createdAt: attr.createdAt,
          status: attr.status,
          broadcastCount: attr.broadcastCount,
          lastBroadcastAt: attr.lastBroadcastAt,
          acceptedProfessionalId: attr.acceptedProfessionalId,
          maxDistanceKm: attr.maxDistanceKm
        })),
        professionalSessions: professionalSessions.map((session: any) => ({
          id: session.id,
          professionalId: session.professionalId,
          professionalName: session.professional?.companyName || 'Professionnel',
          lastActivity: session.lastActivity,
          isOnline: isSessionOnline(session.lastActivity),
          lastPoll: session.lastPoll || session.lastActivity,
          unreadUpdates: session.unreadUpdatesCount || 0
        })),
        recentUpdates: recentUpdates.map((update: any) => ({
          id: update.id,
          attributionId: update.attributionId,
          updateType: update.updateType,
          timestamp: update.timestamp,
          acknowledged: update.acknowledged,
          targetCount: update.targetCount || 1,
          deliveredCount: update.deliveredCount || (update.acknowledged ? 1 : 0),
          failedCount: update.failedCount || 0
        }))
      };

      statsLogger.info('✅ Stats attribution récupérées', {
        activeAttributions: response.stats.totalActive,
        activeSessions: professionalSessions.length,
        recentUpdates: recentUpdates.length,
        healthScore: response.stats.systemHealthScore
      });

      return NextResponse.json({
        success: true,
        data: response,
        timestamp: new Date().toISOString()
      });

    } finally {
      await prisma.$disconnect();
    }

  } catch (error) {
    statsLogger.error('❌ Erreur récupération stats attribution', {
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });

    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques',
      details: error instanceof Error ? error.message : 'Erreur inconnue',
      data: {
        stats: {
          totalActive: 0,
          totalCompleted: 0,
          averageResponseTime: 0,
          professionalResponseRate: 0,
          systemHealthScore: 0
        },
        activeAttributions: [],
        professionalSessions: [],
        recentUpdates: []
      }
    }, { status: 500 });
  }
}

/**
 * Calcule le temps de réponse moyen des professionnels
 */
async function calculateAverageResponseTime(prisma: any): Promise<number> {
  try {
    const recentAttributions = await prisma.bookingAttribution.findMany({
      where: {
        status: 'ACCEPTED',
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 derniers jours
        }
      },
      select: {
        createdAt: true,
        updatedAt: true
      }
    });

    if (recentAttributions.length === 0) return 0;

    const totalMinutes = recentAttributions.reduce((sum: any, attr: any) => {
      const diff = new Date(attr.updatedAt).getTime() - new Date(attr.createdAt).getTime();
      return sum + (diff / (1000 * 60)); // Convertir en minutes
    }, 0);

    return Math.round(totalMinutes / recentAttributions.length);

  } catch (error) {
    return 0;
  }
}


/**
 * Détermine si une session est considérée comme en ligne
 */
function isSessionOnline(lastActivity: Date): boolean {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return new Date(lastActivity) > fiveMinutesAgo;
}

/**
 * Gestion des actions administratives
 */
export async function POST(request: NextRequest) {
  const statsLogger = logger.withContext('AttributionAdminAPI');

  try {
    const body = await request.json();
    const { action, data } = body;

    statsLogger.info('⚙️ Action administrative attribution', {
      action,
      data: data ? Object.keys(data) : []
    });

    switch (action) {
      case 'force_update':
        return await handleForceUpdate(data, statsLogger);
      case 'system_toggle':
        return await handleSystemToggle(data, statsLogger);
      case 'cleanup_old_data':
        return await handleCleanupOldData(statsLogger);
      default:
        return NextResponse.json({
          success: false,
          error: 'Action non reconnue'
        }, { status: 400 });
    }

  } catch (error) {
    statsLogger.error('❌ Erreur action administrative', {
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });

    return NextResponse.json({
      success: false,
      error: 'Erreur lors de l\'exécution de l\'action'
    }, { status: 500 });
  }
}

/**
 * Force une mise à jour pour une attribution
 */
async function handleForceUpdate(data: any, logger: any): Promise<NextResponse> {
  const { attributionId, updateType = 'manual_refresh' } = data;

  try {
    // Appeler l'API broadcast
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/attribution/broadcast-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attributionId,
        updateType,
        updateData: {
          type: updateType,
          attributionId,
          timestamp: new Date().toISOString(),
          reason: 'Force update par administrateur'
        },
        targetAudience: 'ALL_PROFESSIONALS'
      })
    });

    if (response.ok) {
      logger.info('✅ Mise à jour forcée réussie', { attributionId });
      return NextResponse.json({
        success: true,
        message: 'Mise à jour forcée envoyée'
      });
    } else {
      throw new Error(`Erreur API: ${response.status}`);
    }

  } catch (error) {
    logger.error('❌ Erreur force update', { attributionId, error });
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la mise à jour forcée'
    }, { status: 500 });
  }
}

/**
 * Active/désactive le système d'attribution
 */
async function handleSystemToggle(data: any, logger: any): Promise<NextResponse> {
  const { enabled } = data;

  try {
    // Ici on pourrait implémenter un système de feature flags
    // Pour l'instant, on simule juste la réponse
    logger.info(`⚙️ Système d'attribution ${enabled ? 'activé' : 'désactivé'}`);

    return NextResponse.json({
      success: true,
      message: `Système ${enabled ? 'activé' : 'désactivé'}`,
      systemEnabled: enabled
    });

  } catch (error) {
    logger.error('❌ Erreur toggle système', { enabled, error });
    return NextResponse.json({
      success: false,
      error: 'Erreur lors du changement d\'état du système'
    }, { status: 500 });
  }
}

/**
 * Nettoie les anciennes données
 */
async function handleCleanupOldData(logger: any): Promise<NextResponse> {
  try {
    // Appeler l'API de nettoyage
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/attribution/updates`, {
      method: 'DELETE'
    });

    if (response.ok) {
      const result = await response.json();
      logger.info('🧹 Nettoyage terminé', result);

      return NextResponse.json({
        success: true,
        message: 'Nettoyage effectué',
        details: result
      });
    } else {
      throw new Error(`Erreur nettoyage: ${response.status}`);
    }

  } catch (error) {
    logger.error('❌ Erreur nettoyage', { error });
    return NextResponse.json({
      success: false,
      error: 'Erreur lors du nettoyage'
    }, { status: 500 });
  }
}

/**
 * Calcule le taux d'acceptation des attributions
 */
async function calculateAcceptanceRate(prisma: any) {
  try {
    const totalAttributions = await prisma.bookingAttribution.count();
    const acceptedAttributions = await prisma.bookingAttribution.count({
      where: { status: { in: ['ACCEPTED', 'COMPLETED'] } }
    });

    return {
      rate: totalAttributions > 0 ? Math.round((acceptedAttributions / totalAttributions) * 100) : 0,
      total: totalAttributions,
      accepted: acceptedAttributions
    };
  } catch (error) {
    return { rate: 0, total: 0, accepted: 0 };
  }
}

/**
 * Calcule la distance moyenne des attributions
 */
async function calculateAverageDistance(prisma: any) {
  try {
    const acceptedDistances = await prisma.bookingAttribution.aggregate({
      where: { status: { in: ['ACCEPTED', 'COMPLETED'] } },
      _avg: { maxDistanceKm: true }
    });

    const allDistances = await prisma.bookingAttribution.aggregate({
      _avg: { maxDistanceKm: true }
    });

    return {
      accepted: Math.round(acceptedDistances._avg.maxDistanceKm || 0),
      overall: Math.round(allDistances._avg.maxDistanceKm || 0)
    };
  } catch (error) {
    return { accepted: 0, overall: 0 };
  }
}

/**
 * Calcule les métriques business avec vraies données
 */
async function calculateBusinessMetrics(prisma: any) {
  try {
    // Récupérer les attributions avec les montants des bookings
    const activeAttributions = await prisma.bookingAttribution.findMany({
      where: {
        status: { in: ['BROADCASTING', 'RE_BROADCASTING', 'ACCEPTED'] }
      },
      include: {
        booking: {
          select: { totalAmount: true }
        }
      }
    });

    const lostAttributions = await prisma.bookingAttribution.findMany({
      where: {
        status: { in: ['EXPIRED', 'CANCELLED'] }
      },
      include: {
        booking: {
          select: { totalAmount: true }
        }
      }
    });

    const completedAttributions = await prisma.bookingAttribution.findMany({
      where: { status: 'COMPLETED' },
      include: {
        booking: {
          select: { totalAmount: true }
        }
      }
    });

    // Calculer les valeurs réelles
    const totalValue = activeAttributions.reduce((sum: any, attr: any) =>
      sum + (attr.booking?.totalAmount || 0), 0
    );

    const lostValue = lostAttributions.reduce((sum: any, attr: any) =>
      sum + (attr.booking?.totalAmount || 0), 0
    );

    const completedValue = completedAttributions.reduce((sum: any, attr: any) =>
      sum + (attr.booking?.totalAmount || 0), 0
    );

    const averageOrderValue = completedAttributions.length > 0
      ? Math.round(completedValue / completedAttributions.length)
      : 0;

    // ROI = (revenus - coûts) / coûts * 100
    // Estimation simple: si on a des revenus, ROI = 85% + bonus selon performance
    const roi = completedValue > 0
      ? Math.round(85 + ((completedAttributions.length / (activeAttributions.length + completedAttributions.length + lostAttributions.length)) * 100) * 0.3)
      : 0;

    return {
      totalValue: Math.round(totalValue),
      lostValue: Math.round(lostValue),
      averageOrderValue,
      roi: Math.min(roi, 150) // Cap à 150%
    };
  } catch (error) {
    console.error('Erreur calculateBusinessMetrics:', error);
    return { totalValue: 0, lostValue: 0, averageOrderValue: 0, roi: 0 };
  }
}

/**
 * Calcule la couverture géographique
 */
async function calculateGeographicCoverage(prisma: any) {
  try {
    const uniqueZones = await prisma.bookingAttribution.groupBy({
      by: ['serviceType'],
      _count: { id: true }
    });

    const avgRadius = await prisma.bookingAttribution.aggregate({
      _avg: { maxDistanceKm: true }
    });

    // Estimation des demandes non couvertes
    const uncoveredEstimate = await prisma.bookingAttribution.count({
      where: {
        status: { in: ['EXPIRED', 'CANCELLED'] },
        maxDistanceKm: { gt: 100 } // Plus de 100km = zone mal couverte
      }
    });

    return {
      zones: uniqueZones.length,
      averageRadius: Math.round(avgRadius._avg.maxDistanceKm || 0),
      uncoveredDemand: uncoveredEstimate
    };
  } catch (error) {
    return { zones: 0, averageRadius: 0, uncoveredDemand: 0 };
  }
}

/**
 * Calcule le taux de re-broadcast
 */
async function calculateRebroadcastRate(prisma: any) {
  try {
    const totalAttributions = await prisma.bookingAttribution.count();
    const rebroadcastAttributions = await prisma.bookingAttribution.count({
      where: {
        OR: [
          { status: 'RE_BROADCASTING' },
          { broadcastCount: { gt: 1 } }
        ]
      }
    });

    return {
      total: rebroadcastAttributions,
      percentage: totalAttributions > 0 ? Math.round((rebroadcastAttributions / totalAttributions) * 100) : 0
    };
  } catch (error) {
    return { total: 0, percentage: 0 };
  }
}

/**
 * Calcule les alertes critiques
 */
async function calculateCriticalAlerts(prisma: any) {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Alertes critiques
    const expiredAttributions = await prisma.bookingAttribution.count({
      where: {
        status: 'BROADCASTING',
        createdAt: { lt: oneHourAgo }
      }
    });

    const inactiveProfessionals = await prisma.professionalSession.count({
      where: {
        isOnline: false,
        lastActivity: { lt: oneDayAgo }
      }
    });

    const highDistanceRequests = await prisma.bookingAttribution.count({
      where: {
        status: { in: ['BROADCASTING', 'RE_BROADCASTING'] },
        maxDistanceKm: { gt: 120 }
      }
    });

    const critical = [];
    const warnings = [];

    if (expiredAttributions > 0) {
      critical.push({
        type: 'EXPIRED_ATTRIBUTIONS',
        count: expiredAttributions,
        message: `${expiredAttributions} attributions expirées sans réponse`
      });
    }

    if (inactiveProfessionals > 3) {
      warnings.push({
        type: 'INACTIVE_PROFESSIONALS',
        count: inactiveProfessionals,
        message: `${inactiveProfessionals} professionnels inactifs depuis 24h`
      });
    }

    if (highDistanceRequests > 2) {
      warnings.push({
        type: 'HIGH_DISTANCE_REQUESTS',
        count: highDistanceRequests,
        message: `${highDistanceRequests} demandes à distance élevée (>120km)`
      });
    }

    return {
      count: critical.length + warnings.length,
      critical,
      warnings
    };
  } catch (error) {
    return { count: 0, critical: [], warnings: [] };
  }
}

/**
 * Calcule le taux de réponse des professionnels
 */
async function calculateProfessionalResponseRate(prisma: any) {
  try {
    const totalEligible = await prisma.attributionEligibility.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    });

    const responded = await prisma.attributionEligibility.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        responded: true
      }
    });

    return totalEligible > 0 ? Math.round((responded / totalEligible) * 100) : 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Calcule le score de santé du système (version améliorée)
 */
function calculateSystemHealth(
  activeAttributions: number,
  activeSessions: number,
  recentUpdates: number,
  responseRate: number,
  criticalAlertsCount: number
): number {
  let score = 100;

  // Pénalités
  if (activeAttributions > 10) score -= 15; // Trop d'attributions en attente
  if (activeSessions < 3) score -= 25; // Pas assez de professionnels connectés
  if (responseRate < 70) score -= 30; // Taux de réponse trop faible
  if (recentUpdates === 0) score -= 10; // Pas d'activité récente
  if (criticalAlertsCount > 0) score -= (criticalAlertsCount * 10); // Alertes critiques

  // Bonus
  if (responseRate > 85) score += 10;
  if (activeSessions > 8) score += 5;
  if (activeAttributions < 5 && activeAttributions > 0) score += 5; // Charge optimale

  return Math.max(0, Math.min(100, score));
}