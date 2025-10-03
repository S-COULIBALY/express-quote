import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

/**
 * POST /api/analytics/abandon
 * Enregistre un événement d'abandon
 */
export async function POST(request: NextRequest) {
  try {
    const abandonEvent = await request.json();
    
    // Validation des données
    if (!abandonEvent.sessionId || !abandonEvent.stage) {
      return NextResponse.json(
        { error: 'Session ID et stage requis' },
        { status: 400 }
      );
    }

    // Enrichir avec des métadonnées serveur
    const enrichedEvent = {
      ...abandonEvent,
      ipAddress: getClientIP(request),
      serverTimestamp: new Date(),
      userAgent: request.headers.get('user-agent') || 'unknown'
    };

    // Enregistrer dans la base de données
    await prisma.abandonEvent.create({
      data: {
        id: abandonEvent.id,
        sessionId: abandonEvent.sessionId,
        userId: abandonEvent.userId,
        stage: abandonEvent.stage,
        timestamp: new Date(abandonEvent.timestamp),
        timeSpent: abandonEvent.timeSpent,
        data: abandonEvent.data,
        metadata: abandonEvent.metadata,
        userAgent: enrichedEvent.userAgent,
        ipAddress: enrichedEvent.ipAddress,
        recoveryAttempts: abandonEvent.recoveryAttempts || 0,
        isRecovered: abandonEvent.isRecovered || false
      }
    });

    // Déclencher le processus de récupération
    await triggerRecoveryProcess(enrichedEvent);

    // Logger l'événement
    logger.warn(`🚨 Abandon enregistré: ${abandonEvent.stage}`, {
      sessionId: abandonEvent.sessionId,
      stage: abandonEvent.stage,
      timeSpent: abandonEvent.timeSpent
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Erreur lors de l\'enregistrement de l\'abandon:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/abandon
 * Récupère les statistiques d'abandon
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const stage = searchParams.get('stage');
    const days = parseInt(searchParams.get('days') || '7');

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    // Construire les filtres
    const where: any = {
      timestamp: { gte: dateFrom }
    };

    if (sessionId) where.sessionId = sessionId;
    if (stage) where.stage = stage;

    // Récupérer les événements
    const events = await prisma.abandonEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    // Calculer les statistiques
    const stats = await calculateAbandonStats(where, dateFrom);

    return NextResponse.json({
      success: true,
      data: {
        events,
        stats
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des abandons:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * Déclencher le processus de récupération
 */
async function triggerRecoveryProcess(event: any): Promise<void> {
  try {
    // Récupération immédiate pour certains types
    if (shouldTriggerImmediateRecovery(event)) {
      await scheduleImmediateRecovery(event);
    }

    // Récupération différée selon le stage
    await scheduleDelayedRecovery(event);

  } catch (error) {
    logger.error('Erreur lors du déclenchement de la récupération:', error);
  }
}

/**
 * Vérifier si une récupération immédiate est nécessaire
 */
function shouldTriggerImmediateRecovery(event: any): boolean {
  const immediateStages = ['form_partial', 'quote_with_contact', 'payment_abandoned'];
  return immediateStages.includes(event.stage);
}

/**
 * Planifier une récupération immédiate
 */
async function scheduleImmediateRecovery(event: any): Promise<void> {
  try {
    // Envoyer une notification immédiate selon le type
    const recoveryData = {
      sessionId: event.sessionId,
      stage: event.stage,
      data: event.data,
      metadata: event.metadata
    };

    // Appeler le service de récupération
    await fetch('/api/recovery/immediate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recoveryData)
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération immédiate:', error);
  }
}

/**
 * Planifier une récupération différée
 */
async function scheduleDelayedRecovery(event: any): Promise<void> {
  try {
    // Programmer selon le stage
    const delays = {
      'catalog_early': 0, // Pas de récupération
      'form_incomplete': 15 * 60 * 1000, // 15 minutes
      'form_partial': 5 * 60 * 1000, // 5 minutes
      'quote_created': 30 * 60 * 1000, // 30 minutes
      'quote_viewed': 60 * 60 * 1000, // 1 heure
      'quote_with_contact': 15 * 60 * 1000, // 15 minutes
      'booking_created': 30 * 60 * 1000, // 30 minutes
      'payment_page': 10 * 60 * 1000, // 10 minutes
      'payment_abandoned': 5 * 60 * 1000, // 5 minutes
      'payment_failed': 1 * 60 * 1000, // 1 minute
    };

    const delay = delays[event.stage as keyof typeof delays] || 0;

    if (delay > 0) {
      // En production, utiliser une queue comme Redis ou un job scheduler
      setTimeout(async () => {
        await sendDelayedRecovery(event);
      }, delay);
    }

  } catch (error) {
    logger.error('Erreur lors de la planification de récupération:', error);
  }
}

/**
 * Envoyer une récupération différée
 */
async function sendDelayedRecovery(event: any): Promise<void> {
  try {
    // Vérifier si l'utilisateur n'a pas déjà récupéré
    const latestEvent = await prisma.abandonEvent.findFirst({
      where: { sessionId: event.sessionId },
      orderBy: { timestamp: 'desc' }
    });

    if (latestEvent?.isRecovered) {
      logger.info('Récupération annulée - utilisateur déjà récupéré');
      return;
    }

    // Envoyer la récupération
    await fetch('/api/recovery/delayed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: event.id,
        sessionId: event.sessionId,
        stage: event.stage,
        data: event.data,
        metadata: event.metadata
      })
    });

  } catch (error) {
    logger.error('Erreur lors de l\'envoi de récupération différée:', error);
  }
}

/**
 * Calculer les statistiques d'abandon
 */
async function calculateAbandonStats(where: any, dateFrom: Date) {
  try {
    // Grouper par stage
    const abandonsByStage = await prisma.abandonEvent.groupBy({
      by: ['stage'],
      where,
      _count: { id: true },
      _avg: { timeSpent: true }
    });

    // Taux de récupération
    const totalAbandons = await prisma.abandonEvent.count({ where });
    const recoveredAbandons = await prisma.abandonEvent.count({
      where: { ...where, isRecovered: true }
    });

    const recoveryRate = totalAbandons > 0 ? (recoveredAbandons / totalAbandons) * 100 : 0;

    // Abandons par heure
    const hourlyAbandons = await prisma.abandonEvent.groupBy({
      by: ['timestamp'],
      where,
      _count: { id: true }
    });

    // Top des pages d'abandon
    const topAbandonPages = await prisma.abandonEvent.groupBy({
      by: ['metadata'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });

    return {
      totalAbandons,
      recoveredAbandons,
      recoveryRate: Math.round(recoveryRate * 100) / 100,
      abandonsByStage: abandonsByStage.map(item => ({
        stage: item.stage,
        count: item._count.id,
        avgTimeSpent: Math.round(item._avg.timeSpent || 0)
      })),
      hourlyAbandons: hourlyAbandons.map(item => ({
        hour: item.timestamp,
        count: item._count.id
      })),
      topAbandonPages
    };

  } catch (error) {
    logger.error('Erreur lors du calcul des statistiques:', error);
    return {
      totalAbandons: 0,
      recoveredAbandons: 0,
      recoveryRate: 0,
      abandonsByStage: [],
      hourlyAbandons: [],
      topAbandonPages: []
    };
  }
}

/**
 * Obtenir l'IP du client
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const host = request.headers.get('host');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (real) {
    return real;
  }

  return 'unknown';
} 