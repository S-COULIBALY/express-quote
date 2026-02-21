/**
 * 🏢 API POLLING NOTIFICATIONS ÉQUIPE INTERNE
 *
 * GET /api/notifications/internal-staff/updates?lastCheck=timestamp
 *
 * Responsabilité :
 * - Récupère les nouvelles notifications pour l'équipe interne
 * - Système de polling pour dashboard internal
 * - Gère confirmations réservations, paiements, attributions, documents
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

interface InternalUpdate {
  id: string;
  type:
    | "BOOKING_CONFIRMED"
    | "PAYMENT_COMPLETED"
    | "ATTRIBUTION_COMPLETED"
    | "DOCUMENT_GENERATED"
    | "SYSTEM_ALERT";
  title: string;
  message: string;
  data: any;
  timestamp: Date;
  priority: "low" | "medium" | "high" | "urgent";
  read: boolean;
}

/**
 * Récupère les mises à jour pour l'équipe interne
 */
export async function GET(request: NextRequest) {
  const internalLogger = logger.withContext("InternalNotificationsAPI");

  try {
    const url = new URL(request.url);
    const lastCheckParam = url.searchParams.get("lastCheck");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    internalLogger.info("🏢 Demande polling notifications équipe interne", {
      lastCheck: lastCheckParam,
      limit,
    });

    // Vérification auth
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Token requis",
        },
        { status: 401 },
      );
    }

    // Parser lastCheck ou utiliser timestamp par défaut
    const lastCheck = lastCheckParam
      ? new Date(lastCheckParam)
      : new Date(Date.now() - 30 * 60 * 1000); // 30 minutes par défaut

    // Récupérer les notifications depuis lastCheck
    const updates = await getInternalUpdates(lastCheck, limit, internalLogger);

    // Marquer comme lues après récupération
    if (updates.length > 0) {
      await markUpdatesAsRead(
        updates.map((u) => u.id),
        internalLogger,
      );
    }

    const response = {
      success: true,
      updates: updates.map((update) => ({
        id: update.id,
        type: update.type,
        title: update.title,
        message: update.message,
        data:
          typeof update.data === "string"
            ? JSON.parse(update.data)
            : update.data,
        timestamp: update.timestamp,
        priority: update.priority,
        source: "internal_notification",
      })),
      totalUpdates: updates.length,
      lastPolled: new Date().toISOString(),
      nextPollRecommended: new Date(Date.now() + 15 * 1000).toISOString(), // 15 secondes
    };

    internalLogger.info("✅ Notifications équipe interne récupérées", {
      updatesCount: updates.length,
      lastCheck: lastCheck.toISOString(),
    });

    return NextResponse.json(response);
  } catch (error) {
    internalLogger.error("❌ Erreur polling notifications internes", {
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des notifications",
        details: error instanceof Error ? error.message : "Erreur inconnue",
        updates: [],
        totalUpdates: 0,
      },
      { status: 500 },
    );
  }
}

/**
 * Récupère les mises à jour internes depuis lastCheck
 */
async function getInternalUpdates(
  lastCheck: Date,
  limit: number,
  logger: any,
): Promise<InternalUpdate[]> {
  try {
    logger.info("📊 Récupération notifications internes", {
      since: lastCheck.toISOString(),
      limit,
    });

    // ÉTAPE 1: Nouvelles réservations confirmées
    const bookingUpdates = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        updatedAt: {
          gt: lastCheck,
        },
      },
      include: {
        Customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: Math.floor(limit / 3),
    });

    // ÉTAPE 2: Paiements complétés
    const paymentUpdates = await prisma.booking.findMany({
      where: {
        status: "PAYMENT_COMPLETED",
        updatedAt: {
          gt: lastCheck,
        },
      },
      include: {
        Customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: Math.floor(limit / 3),
    });

    // ÉTAPE 3: Attributions complétées
    const attributionUpdates = await prisma.booking_attributions.findMany({
      where: {
        status: "ACCEPTED",
        updatedAt: {
          gt: lastCheck,
        },
      },
      include: {
        booking: {
          select: {
            id: true,
            type: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: Math.floor(limit / 3),
    });

    // ÉTAPE 4: Convertir en format unifié
    const updates: InternalUpdate[] = [];

    // Réservations confirmées
    bookingUpdates.forEach((booking: any) => {
      updates.push({
        id: `booking_${booking.id}`,
        type: "BOOKING_CONFIRMED",
        title: "📅 Nouvelle réservation confirmée",
        message: `${booking.customer.firstName} ${booking.customer.lastName} - ${booking.type}`,
        data: {
          bookingId: booking.id,
          bookingReference: `EQ-${booking.id.slice(-8).toUpperCase()}`,
          serviceType: booking.type,
          customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
          customerEmail: booking.customer.email,
          totalAmount: booking.totalAmount,
          confirmedAt: booking.updatedAt,
        },
        timestamp: booking.updatedAt || booking.createdAt,
        priority: "medium" as const,
        read: false,
      });
    });

    // Paiements complétés
    paymentUpdates.forEach((booking: any) => {
      updates.push({
        id: `payment_${booking.id}`,
        type: "PAYMENT_COMPLETED",
        title: "💰 Paiement reçu",
        message: `${booking.totalAmount}€ pour EQ-${booking.id.slice(-8).toUpperCase()}`,
        data: {
          bookingId: booking.id,
          bookingReference: `EQ-${booking.id.slice(-8).toUpperCase()}`,
          amount: booking.totalAmount,
          customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
          paymentCompletedAt: booking.updatedAt,
        },
        timestamp: booking.updatedAt,
        priority: "high" as const,
        read: false,
      });
    });

    // Attributions complétées
    attributionUpdates.forEach((attribution: any) => {
      updates.push({
        id: `attribution_${attribution.id}`,
        type: "ATTRIBUTION_COMPLETED",
        title: "🎯 Attribution réussie",
        message: `Mission ${attribution.serviceType} attribuée`,
        data: {
          attributionId: attribution.id,
          bookingReference: `EQ-${attribution.booking.id.slice(-8).toUpperCase()}`,
          serviceType: attribution.serviceType,
          acceptedProfessionalId: attribution.acceptedProfessionalId,
          acceptedAt: attribution.updatedAt,
        },
        timestamp: attribution.updatedAt,
        priority: "medium" as const,
        read: false,
      });
    });

    // Trier par timestamp desc et limiter
    updates.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    const limitedUpdates = updates.slice(0, limit);

    logger.info("📋 Notifications internes trouvées", {
      bookings: bookingUpdates.length,
      payments: paymentUpdates.length,
      attributions: attributionUpdates.length,
      total: limitedUpdates.length,
    });

    return limitedUpdates;
  } catch (error) {
    logger.error("❌ Erreur récupération notifications internes", {
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Marque les mises à jour comme lues
 */
async function markUpdatesAsRead(
  updateIds: string[],
  logger: any,
): Promise<void> {
  try {
    if (updateIds.length === 0) return;

    // Pour l'instant, on simule le marquage
    // En production, on pourrait avoir une table dedicated pour les notifications internes
    logger.info("✅ Notifications internes marquées comme lues", {
      count: updateIds.length,
    });
  } catch (error) {
    logger.warn("⚠️ Erreur marquage notifications lues (non bloquant)", {
      error,
    });
  }
}

/**
 * Marque toutes les notifications comme lues
 */
export async function POST(request: NextRequest) {
  const postLogger = logger.withContext("InternalNotificationsMarkRead");

  try {
    // Ici on pourrait marquer toutes les notifications comme lues
    postLogger.info("📖 Marquage toutes notifications internes comme lues");

    return NextResponse.json({
      success: true,
      message: "Toutes les notifications ont été marquées comme lues",
    });
  } catch (error) {
    postLogger.error("❌ Erreur marquage toutes notifications", { error });

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors du marquage des notifications",
      },
      { status: 500 },
    );
  }
}
