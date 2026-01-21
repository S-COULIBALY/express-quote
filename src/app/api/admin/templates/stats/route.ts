/**
 * API Route pour les statistiques des templates
 * Architecture DDD avec TemplateController - Migration corrective
 */

import { NextRequest, NextResponse } from "next/server";

// Force le rendu dynamique (évite erreur de build Vercel)
export const dynamic = "force-dynamic";
import { TemplateController } from "@/quotation/interfaces/http/controllers/TemplateController";
import { TemplateService } from "@/quotation/application/services/TemplateService";
import { PrismaTemplateRepository } from "@/quotation/infrastructure/repositories/PrismaTemplateRepository";
import { logger } from "@/lib/logger";

// Instance partagée du contrôleur avec injection de dépendances DDD
let controllerInstance: TemplateController | null = null;

function getController(): TemplateController {
  if (!controllerInstance) {
    // Injection de dépendances selon l'architecture DDD
    const templateRepository = new PrismaTemplateRepository();
    const templateService = new TemplateService(templateRepository);
    controllerInstance = new TemplateController(templateService);

    logger.info(
      "🏗️ Admin TemplateController (stats) initialisé avec architecture DDD",
    );
  }

  return controllerInstance;
}

/**
 * GET /api/admin/templates/stats
 * Récupère les statistiques complètes des templates
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    logger.info(
      "📊 GET /api/admin/templates/stats - Via TemplateController DDD corrigé",
    );

    const controller = getController();
    return await controller.getTemplateStatistics(request);
  } catch (error) {
    logger.error("❌ Erreur dans GET /api/admin/templates/stats:", error);

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
