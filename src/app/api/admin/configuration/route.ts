import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ProfessionalAuthService } from '@/lib/auth/ProfessionalAuthService';
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

    logger.info('ConfigurationController DDD initialisé avec injection de dépendances');
  }
  return controllerInstance;
}

/**
 * GET /api/admin/configuration
 * Récupère les configurations (toutes ou par catégorie via contrôleur DDD)
 */
export async function GET(request: NextRequest) {
  try {
    // 🔓 AUTHENTIFICATION DÉSACTIVÉE TEMPORAIREMENT
    logger.info('🔍 CRUD: Accès direct autorisé (authentification bypass)');

    const url = new URL(request.url);
    const category = url.searchParams.get('category');

    const controller = getController();

    if (category) {
      // Si une catégorie est spécifiée, récupérer les configurations de cette catégorie
      return await controller.getConfigurations(request);
    } else {
      // Sinon, récupérer toutes les configurations par catégorie
      const configService = controller['configurationService'];
      const allCategories = Object.values(require('@/quotation/domain/configuration/ConfigurationKey').ConfigurationCategory);

      const configurations: any = {};

      for (const cat of allCategories) {
        try {
          configurations[cat] = await configService.getConfigurations(cat);
        } catch (error) {
          logger.warn(`Erreur lors de la récupération de la catégorie ${cat}:`, error as Error);
          configurations[cat] = [];
        }
      }

      // Utiliser la méthode standardisée du contrôleur pour cohérence
      return controller['successResponse']({
        configurations,
        totalCategories: allCategories.length,
        retrievedAt: new Date().toISOString()
      });
    }

  } catch (error) {
    logger.error('Erreur lors de la récupération des configurations:', error as Error);
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

/**
 * POST /api/admin/configuration
 * Définit une valeur de configuration (via contrôleur DDD)
 */
export async function POST(request: NextRequest) {
  try {
    // 🔓 AUTHENTIFICATION DÉSACTIVÉE TEMPORAIREMENT

    const controller = getController();
    return await controller.setValue(request);

  } catch (error) {
    logger.error('Erreur lors de la définition de la configuration:', error as Error);
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

/**
 * DELETE /api/admin/configuration
 * Désactive une configuration (via contrôleur DDD)
 */
export async function DELETE(request: NextRequest) {
  try {
    // 🔓 AUTHENTIFICATION DÉSACTIVÉE TEMPORAIREMENT

    const controller = getController();
    return await controller.deactivateConfiguration(request);

  } catch (error) {
    logger.error('Erreur lors de la désactivation de la configuration:', error as Error);
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