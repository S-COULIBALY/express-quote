/**
 * 🔄 API POLLING MISES À JOUR ATTRIBUTION
 *
 * GET /api/attribution/updates?professionalId=xxx&lastCheck=timestamp
 *
 * Responsabilité :
 * - Permet aux clients de récupérer les mises à jour depuis leur dernière vérification
 * - Système de polling pour notifications temps réel côté client
 * - Marque les mises à jour comme acquittées après lecture
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

interface AttributionUpdate {
  id: string;
  attributionId: string;
  updateType: string;
  updateData: any;
  timestamp: Date;
  acknowledged: boolean;
}

/**
 * Récupère les mises à jour d'attribution pour un professionnel
 */
export async function GET(request: NextRequest) {
  const pollingLogger = logger.withContext('AttributionPollingAPI');

  try {
    const url = new URL(request.url);
    const professionalId = url.searchParams.get('professionalId');
    const lastCheckParam = url.searchParams.get('lastCheck');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    pollingLogger.info('🔄 Demande polling mises à jour', {
      professionalId: professionalId?.slice(0, 8) + '***',
      lastCheck: lastCheckParam,
      limit
    });

    // Validation paramètres
    if (!professionalId) {
      return NextResponse.json({
        success: false,
        error: 'professionalId requis'
      }, { status: 400 });
    }

    // Parser lastCheck ou utiliser timestamp par défaut
    const lastCheck = lastCheckParam
      ? new Date(lastCheckParam)
      : new Date(Date.now() - 60 * 60 * 1000); // 1 heure par défaut

    // Récupérer les mises à jour depuis lastCheck
    const updates = await getAttributionUpdates(professionalId, lastCheck, limit, pollingLogger);

    // Récupérer les notifications directes pour ce professionnel
    const notifications = await getProfessionalNotifications(professionalId, lastCheck, pollingLogger);

    // Marquer comme acquittées
    if (updates.length > 0) {
      await acknowledgeUpdates(updates.map(u => u.id), pollingLogger);
    }

    if (notifications.length > 0) {
      await markNotificationsAsRead(notifications.map(n => n.id), pollingLogger);
    }

    const response = {
      success: true,
      updates: updates.map(update => ({
        id: update.id,
        attributionId: update.attributionId,
        type: update.updateType,
        data: typeof update.updateData === 'string'
          ? JSON.parse(update.updateData)
          : update.updateData,
        timestamp: update.timestamp,
        source: 'attribution_update'
      })),
      notifications: notifications.map(notif => ({
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        data: typeof notif.data === 'string'
          ? JSON.parse(notif.data)
          : notif.data,
        timestamp: notif.createdAt,
        source: 'direct_notification'
      })),
      totalUpdates: updates.length + notifications.length,
      lastPolled: new Date().toISOString(),
      nextPollRecommended: new Date(Date.now() + 30 * 1000).toISOString() // 30 secondes
    };

    pollingLogger.info('✅ Mises à jour récupérées', {
      professionalId: professionalId.slice(0, 8) + '***',
      updatesCount: updates.length,
      notificationsCount: notifications.length,
      totalSent: response.totalUpdates
    });

    return NextResponse.json(response);

  } catch (error) {
    pollingLogger.error('❌ Erreur polling mises à jour', {
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });

    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération des mises à jour',
      details: error instanceof Error ? error.message : 'Erreur inconnue',
      updates: [],
      notifications: [],
      totalUpdates: 0
    }, { status: 500 });
  }
}

/**
 * Récupère les mises à jour d'attribution depuis lastCheck
 */
async function getAttributionUpdates(
  professionalId: string,
  lastCheck: Date,
  limit: number,
  logger: any
): Promise<AttributionUpdate[]> {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    logger.info('📊 Récupération mises à jour attribution', {
      professionalId: professionalId.slice(0, 8) + '***',
      since: lastCheck.toISOString(),
      limit
    });

    // Récupérer toutes les mises à jour non expirées depuis lastCheck
    const updates = await prisma.attributionUpdate.findMany({
      where: {
        timestamp: {
          gt: lastCheck
        },
        expiresAt: {
          gt: new Date() // Non expirées
        },
        acknowledged: false
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit
    });

    // Filtrer celles qui concernent des attributions visibles par ce professionnel
    const relevantUpdates = await filterRelevantUpdates(updates, professionalId, logger);

    logger.info('📋 Mises à jour trouvées', {
      total: updates.length,
      relevant: relevantUpdates.length,
      professionalId: professionalId.slice(0, 8) + '***'
    });

    return relevantUpdates;

  } catch (error) {
    logger.error('❌ Erreur récupération updates', {
      professionalId: professionalId.slice(0, 8) + '***',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Filtre les mises à jour pertinentes pour un professionnel
 */
async function filterRelevantUpdates(
  updates: any[],
  professionalId: string,
  logger: any
): Promise<AttributionUpdate[]> {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    if (updates.length === 0) return [];

    // Récupérer les attributions auxquelles ce professionnel était éligible
    const attributionIds = updates.map(u => u.attributionId);

    const eligibleAttributions = await prisma.attributionEligibility.findMany({
      where: {
        professionalId,
        attributionId: {
          in: attributionIds
        }
      },
      select: {
        attributionId: true
      }
    });

    const eligibleIds = new Set(eligibleAttributions.map(ea => ea.attributionId));

    // Filtrer uniquement les mises à jour pertinentes
    const relevantUpdates = updates.filter(update => {
      const updateData = typeof update.updateData === 'string'
        ? JSON.parse(update.updateData)
        : update.updateData;

      // Inclure si :
      // 1. Le professionnel était éligible pour cette attribution
      // 2. OU si c'est une mise à jour générale (expiration, annulation)
      return eligibleIds.has(update.attributionId) ||
             ['attribution_expired', 'attribution_cancelled'].includes(update.updateType);
    });

    logger.info('🎯 Filtrage mises à jour', {
      total: updates.length,
      eligible: eligibleIds.size,
      relevant: relevantUpdates.length
    });

    return relevantUpdates;

  } catch (error) {
    logger.warn('⚠️ Erreur filtrage (retour complet)', { error });
    return updates; // Fallback: retourner toutes les mises à jour
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Récupère les notifications directes pour un professionnel
 */
async function getProfessionalNotifications(
  professionalId: string,
  lastCheck: Date,
  logger: any
): Promise<any[]> {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const notifications = await prisma.professionalNotification.findMany({
      where: {
        professionalId,
        createdAt: {
          gt: lastCheck
        },
        read: false
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Limite pour notifications directes
    });

    logger.info('🔔 Notifications directes trouvées', {
      count: notifications.length,
      professionalId: professionalId.slice(0, 8) + '***'
    });

    return notifications;

  } catch (error) {
    logger.warn('⚠️ Erreur notifications directes (non bloquant)', { error });
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Marque les mises à jour comme acquittées
 */
async function acknowledgeUpdates(updateIds: string[], logger: any): Promise<void> {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    if (updateIds.length === 0) return;

    await prisma.attributionUpdate.updateMany({
      where: {
        id: {
          in: updateIds
        }
      },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date()
      }
    });

    logger.info('✅ Mises à jour acquittées', {
      count: updateIds.length
    });

  } catch (error) {
    logger.warn('⚠️ Erreur acquittement (non bloquant)', { error });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Marque les notifications comme lues
 */
async function markNotificationsAsRead(notificationIds: string[], logger: any): Promise<void> {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    if (notificationIds.length === 0) return;

    await prisma.professionalNotification.updateMany({
      where: {
        id: {
          in: notificationIds
        }
      },
      data: {
        read: true,
        readAt: new Date()
      }
    });

    logger.info('✅ Notifications marquées comme lues', {
      count: notificationIds.length
    });

  } catch (error) {
    logger.warn('⚠️ Erreur marquage lecture (non bloquant)', { error });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Nettoyage automatique des anciennes mises à jour
 */
export async function DELETE(request: NextRequest) {
  const cleanupLogger = logger.withContext('AttributionCleanupAPI');

  try {
    const url = new URL(request.url);
    const olderThan = url.searchParams.get('olderThan') || '1h';

    // Convertir en millisecondes
    const cleanupTime = olderThan === '1h'
      ? Date.now() - 60 * 60 * 1000
      : Date.now() - 24 * 60 * 60 * 1000;

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // Supprimer mises à jour expirées ou acquittées anciennes
    const deletedUpdates = await prisma.attributionUpdate.deleteMany({
      where: {
        OR: [
          {
            expiresAt: {
              lt: new Date()
            }
          },
          {
            acknowledged: true,
            acknowledgedAt: {
              lt: new Date(cleanupTime)
            }
          }
        ]
      }
    });

    // Supprimer anciennes notifications lues
    const deletedNotifications = await prisma.professionalNotification.deleteMany({
      where: {
        read: true,
        readAt: {
          lt: new Date(cleanupTime)
        }
      }
    });

    await prisma.$disconnect();

    cleanupLogger.info('🧹 Nettoyage terminé', {
      deletedUpdates: deletedUpdates.count,
      deletedNotifications: deletedNotifications.count,
      olderThan
    });

    return NextResponse.json({
      success: true,
      deletedUpdates: deletedUpdates.count,
      deletedNotifications: deletedNotifications.count,
      cleanupTime: new Date().toISOString()
    });

  } catch (error) {
    cleanupLogger.error('❌ Erreur nettoyage', { error });

    return NextResponse.json({
      success: false,
      error: 'Erreur lors du nettoyage'
    }, { status: 500 });
  }
}