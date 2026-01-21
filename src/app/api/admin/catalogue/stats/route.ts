/**
 * API Route pour les statistiques du catalogue
 * Architecture DDD avec CatalogueController - Migration corrective
 */

import { NextRequest, NextResponse } from "next/server";

// Force le rendu dynamique (évite erreur de build Vercel)
export const dynamic = "force-dynamic";
import { CatalogueController } from "@/quotation/interfaces/http/controllers/CatalogueController";
import { CatalogueService } from "@/quotation/application/services/CatalogueService";
import { PrismaCatalogueRepository } from "@/quotation/infrastructure/repositories/PrismaCatalogueRepository";
import { logger } from "@/lib/logger";

// Instance partagée du contrôleur avec injection de dépendances DDD
let controllerInstance: CatalogueController | null = null;

function getController(): CatalogueController {
  if (!controllerInstance) {
    // Injection de dépendances selon l'architecture DDD
    const catalogueRepository = new PrismaCatalogueRepository();
    const catalogueService = new CatalogueService(catalogueRepository);
    controllerInstance = new CatalogueController(catalogueService);

    logger.info(
      "🏗️ Admin CatalogueController (stats) initialisé avec architecture DDD",
    );
  }

  return controllerInstance;
}

/**
 * GET /api/admin/catalogue/stats
 * Récupère les statistiques complètes du catalogue
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    logger.info(
      "📊 GET /api/admin/catalogue/stats - Via CatalogueController DDD corrigé",
    );

    const controller = getController();
    return await controller.getCatalogueStatistics(request);
  } catch (error) {
    logger.error("❌ Erreur dans GET /api/admin/catalogue/stats:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des statistiques",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    );
  }
}
