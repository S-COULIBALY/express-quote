/**
 * 📡 API DIFFUSION MISES À JOUR ATTRIBUTION EN TEMPS RÉEL
 *
 * POST /api/attribution/broadcast-update
 *
 * Responsabilité :
 * - Diffuse les mises à jour d'attribution aux professionnels connectés
 * - Gère le système de polling pour notifications temps réel
 * - Sauvegarde les événements pour récupération différée
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

interface BroadcastUpdateRequest {
  attributionId: string;
  updateType:
    | "attribution_taken"
    | "attribution_expired"
    | "attribution_cancelled";
  updateData: {
    type: string;
    attributionId: string;
    acceptedBy?: string;
    timestamp: string;
    reason?: string;
  };
  targetAudience: "ALL_PROFESSIONALS" | "PROFESSIONALS_EXCLUDING_ACCEPTED";
  timestamp: string;
}

/**
 * Diffuse une mise à jour d'attribution via système de polling
 */
export async function POST(request: NextRequest) {
  const broadcastLogger = logger.withContext("BroadcastUpdateAPI");

  try {
    broadcastLogger.info("📡 Demande de diffusion mise à jour attribution");

    const body: BroadcastUpdateRequest = await request.json();
    const { attributionId, updateType, updateData, targetAudience } = body;

    // Validation des données
    if (!attributionId || !updateType || !updateData) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Données manquantes: attributionId, updateType, updateData requis",
        },
        { status: 400 },
      );
    }

    broadcastLogger.info("📢 Diffusion mise à jour", {
      attributionId,
      updateType,
      targetAudience,
      timestamp: updateData.timestamp,
    });

    // ÉTAPE 1: Sauvegarder pour système de polling
    const updateSaved = await saveUpdateForPolling(
      attributionId,
      updateType,
      updateData,
      broadcastLogger,
    );

    // ÉTAPE 2: Notifier directement les professionnels connectés (si table sessions existe)
    const notificationsSent = await notifyConnectedProfessionals(
      attributionId,
      updateType,
      updateData,
      targetAudience,
      broadcastLogger,
    );

    // ÉTAPE 3: Marquer l'attribution comme non disponible
    if (updateType === "attribution_taken") {
      await markAttributionAsUnavailable(
        attributionId,
        updateData.acceptedBy,
        broadcastLogger,
      );
    }

    const response = {
      success: true,
      updateId: updateSaved.id,
      attributionId,
      updateType,
      notificationsSent,
      timestamp: new Date().toISOString(),
      message: `Mise à jour ${updateType} diffusée avec succès`,
    };

    broadcastLogger.info("✅ Diffusion terminée", {
      attributionId,
      updateType,
      notificationsSent,
      updateId: updateSaved.id,
    });

    return NextResponse.json(response);
  } catch (error) {
    broadcastLogger.error("❌ Erreur diffusion mise à jour", {
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });

    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne lors de la diffusion",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    );
  }
}

/**
 * Sauvegarde la mise à jour pour système de polling
 */
async function saveUpdateForPolling(
  attributionId: string,
  updateType: string,
  updateData: any,
  logger: any,
): Promise<{ id: string }> {
  try {
    logger.info("💾 Sauvegarde mise à jour pour polling", {
      attributionId,
      updateType,
    });

    const savedUpdate = await prisma.attributionUpdate.create({
      data: {
        attributionId,
        updateType,
        updateData: JSON.stringify(updateData),
        timestamp: new Date(),
        acknowledged: false,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });

    logger.info("✅ Mise à jour sauvegardée", {
      updateId: savedUpdate.id,
      expiresAt: savedUpdate.expiresAt,
    });

    return { id: savedUpdate.id };
  } catch (error) {
    logger.error("❌ Erreur sauvegarde polling", {
      attributionId,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Notifie les professionnels connectés directement
 */
async function notifyConnectedProfessionals(
  attributionId: string,
  updateType: string,
  updateData: any,
  targetAudience: string,
  logger: any,
): Promise<number> {
  try {
    logger.info("👥 Notification professionnels connectés", {
      attributionId,
      updateType,
      targetAudience,
    });

    // Récupérer les professionnels à notifier
    const whereClause: any = {
      lastActivity: {
        gte: new Date(Date.now() - 30 * 60 * 1000), // Actifs dans les 30 dernières minutes
      },
    };

    // Si attribution prise, exclure celui qui l'a acceptée
    if (
      targetAudience === "PROFESSIONALS_EXCLUDING_ACCEPTED" &&
      updateData.acceptedBy
    ) {
      whereClause.professionalId = {
        not: updateData.acceptedBy,
      };
    }

    const activeSessions = await prisma.professionalSession.findMany({
      where: whereClause,
      select: {
        professionalId: true,
        sessionId: true,
        lastActivity: true,
      },
    });

    // Créer notifications individuelles pour chaque professionnel actif
    if (activeSessions.length > 0) {
      await prisma.professionalNotification.createMany({
        data: activeSessions.map((session: any) => ({
          professionalId: session.professionalId,
          type: updateType,
          title: getNotificationTitle(updateType),
          message: getNotificationMessage(updateType, updateData),
          data: JSON.stringify({
            attributionId,
            updateType,
            ...updateData,
          }),
          read: false,
          createdAt: new Date(),
        })),
      });
    }

    logger.info("✅ Notifications directes envoyées", {
      attributionId,
      notificationsSent: activeSessions.length,
    });

    return activeSessions.length;
  } catch (error) {
    logger.warn("⚠️ Erreur notifications directes (non bloquant)", {
      attributionId,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
    return 0; // Non bloquant
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Marque l'attribution comme non disponible
 */
async function markAttributionAsUnavailable(
  attributionId: string,
  acceptedBy: string | undefined,
  logger: any,
): Promise<void> {
  try {
    logger.info("🔒 Marquage attribution comme prise", {
      attributionId,
      acceptedBy,
    });

    await prisma.attribution.update({
      where: { id: attributionId },
      data: {
        status: "ACCEPTED",
        acceptedBy: acceptedBy || null,
        acceptedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    logger.info("✅ Attribution marquée comme prise", {
      attributionId,
      acceptedBy,
    });
  } catch (error) {
    logger.error("❌ Erreur marquage attribution", {
      attributionId,
      acceptedBy,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
    // Non bloquant
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Génère le titre de notification selon le type
 */
function getNotificationTitle(updateType: string): string {
  switch (updateType) {
    case "attribution_taken":
      return "🚫 Mission attribuée";
    case "attribution_expired":
      return "⏰ Mission expirée";
    case "attribution_cancelled":
      return "❌ Mission annulée";
    default:
      return "📢 Mise à jour mission";
  }
}

/**
 * Génère le message de notification selon le type
 */
function getNotificationMessage(updateType: string, updateData: any): string {
  switch (updateType) {
    case "attribution_taken":
      return "Cette mission a été acceptée par un autre professionnel.";
    case "attribution_expired":
      return "Le délai de réponse pour cette mission est expiré.";
    case "attribution_cancelled":
      return `Mission annulée. Raison: ${updateData.reason || "Non spécifiée"}`;
    default:
      return "Une mise à jour est disponible pour cette mission.";
  }
}

/**
 * Récupère les types de mises à jour disponibles
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      availableUpdateTypes: [
        "attribution_taken",
        "attribution_expired",
        "attribution_cancelled",
      ],
      targetAudiences: [
        "ALL_PROFESSIONALS",
        "PROFESSIONALS_EXCLUDING_ACCEPTED",
      ],
      pollingEndpoint: "/api/attribution/updates",
      description:
        "API de diffusion des mises à jour d'attribution en temps réel",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des informations",
      },
      { status: 500 },
    );
  }
}
