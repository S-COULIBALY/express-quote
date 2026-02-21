import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ConfigurationController } from "@/quotation/interfaces/http/controllers/ConfigurationController";
import { ConfigurationService } from "@/quotation/application/services/ConfigurationService";
import { PrismaConfigurationRepository } from "@/quotation/infrastructure/repositories/PrismaConfigurationRepository";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

// Instance partagée du contrôleur avec injection de dépendances DDD
let controllerInstance: ConfigurationController | null = null;

function getController(): ConfigurationController {
  if (!controllerInstance) {
    // Injection de dépendances selon l'architecture DDD
    const configurationRepository = new PrismaConfigurationRepository(prisma);
    const configurationService = new ConfigurationService(
      configurationRepository,
    );

    controllerInstance = new ConfigurationController(configurationService);

    logger.info("ConfigurationController DDD initialisé pour /cache");
  }
  return controllerInstance;
}

/**
 * DELETE /api/admin/configuration/cache
 * Vide le cache des configurations (via contrôleur DDD)
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const controller = getController();
    return await controller.clearCache();
  } catch (error) {
    logger.error("Erreur lors du vidage du cache:", error as Error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne du serveur",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    );
  }
}
