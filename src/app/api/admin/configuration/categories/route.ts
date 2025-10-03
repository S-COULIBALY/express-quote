import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ConfigurationController } from '@/quotation/interfaces/http/controllers/ConfigurationController';
import { ConfigurationService } from '@/quotation/application/services/ConfigurationService';
import { PrismaConfigurationRepository } from '@/quotation/infrastructure/repositories/PrismaConfigurationRepository';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

// Instance partagée du contrôleur avec injection de dépendances DDD
let controllerInstance: ConfigurationController | null = null;

function getController(): ConfigurationController {
  if (!controllerInstance) {
    // Injection de dépendances selon l'architecture DDD
    const prisma = new PrismaClient();
    const configurationRepository = new PrismaConfigurationRepository(prisma);
    const configurationService = new ConfigurationService(configurationRepository);

    controllerInstance = new ConfigurationController(configurationService);

    logger.info('ConfigurationController DDD initialisé pour /categories');
  }
  return controllerInstance;
}

/**
 * GET /api/admin/configuration/categories
 * Récupère toutes les catégories de configuration disponibles (via contrôleur DDD)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const controller = getController();
    const result = await controller.getCategories();
    return result;

  } catch (error) {
    logger.error('Erreur lors de la récupération des catégories:', error as Error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur interne du serveur',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}