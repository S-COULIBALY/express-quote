import { NextResponse } from "next/server";
import { UnifiedDataService } from "@/quotation/infrastructure/services/UnifiedDataService";
import { logger } from "@/lib/logger";

/**
 * POST /api/admin/refresh-cache
 * Rafraîchit le cache unifié des règles et configurations
 */
export async function POST() {
  try {
    logger.info("🔄 Demande de rafraîchissement du cache unifié");

    const unifiedService = UnifiedDataService.getInstance();
    await unifiedService.clearAllCaches();

    logger.info("✅ Cache unifié rafraîchi avec succès via endpoint admin");

    return NextResponse.json({
      success: true,
      message: "Cache unifié rafraîchi avec succès",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(
      error as Error,
      "❌ Erreur lors du rafraîchissement du cache unifié",
    );
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors du rafraîchissement du cache unifié",
        error: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
