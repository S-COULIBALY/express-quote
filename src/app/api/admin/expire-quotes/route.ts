import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { QuoteExpirationProcessor } from "@/scripts/expire-quotes";
import { PrismaClient } from "@prisma/client";

/**
 * POST /api/admin/expire-quotes
 * Déclenche manuellement le processus d'expiration des devis
 */
export async function POST(request: NextRequest) {
  console.log("🔄 POST /api/admin/expire-quotes - Déclenchement manuel");

  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const processor = new QuoteExpirationProcessor();

    // Exécuter le processus
    await processor.processExpiredQuotes();

    // Nettoyer les ressources
    await processor.cleanup();

    return NextResponse.json({
      success: true,
      message: "Processus d'expiration des devis terminé avec succès",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Erreur dans processus d'expiration:", error);

    return NextResponse.json(
      {
        error: "Erreur lors du processus d'expiration",
        message: error instanceof Error ? error.message : "Erreur inconnue",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/admin/expire-quotes
 * Récupère les statistiques sur les devis expirés
 */
export async function GET(request: NextRequest) {
  console.log("🔍 GET /api/admin/expire-quotes - Récupération statistiques");

  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const prisma = new PrismaClient();

    // Statistiques des devis expirés
    const stats = await prisma.quoteRequest.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    // Devis expirés récents (dernières 24h)
    const recentExpired = await prisma.quoteRequest.count({
      where: {
        status: "EXPIRED",
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    // Devis sur le point d'expirer (prochaines 24h)
    const soonToExpire = await prisma.quoteRequest.count({
      where: {
        expiresAt: {
          gte: new Date(),
          lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        status: {
          notIn: ["EXPIRED", "CONFIRMED", "CONVERTED_TO_BOOKING"],
        },
      },
    });

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      data: {
        stats,
        recentExpired,
        soonToExpire,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Erreur dans récupération statistiques:", error);

    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des statistiques",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    );
  }
}
