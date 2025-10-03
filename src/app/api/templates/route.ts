import { NextRequest, NextResponse } from 'next/server';
import { TemplateController } from '@/quotation/interfaces/http/controllers/TemplateController';
import { TemplateService } from '@/quotation/application/services/TemplateService';
import { PrismaTemplateRepository } from '@/quotation/infrastructure/repositories/PrismaTemplateRepository';
import { logger } from '@/lib/logger';

// Instance partagée du contrôleur avec injection de dépendances DDD
let controllerInstance: TemplateController | null = null;

function getController(): TemplateController {
  if (!controllerInstance) {
    // Injection de dépendances selon l'architecture DDD
    const templateRepository = new PrismaTemplateRepository();
    const templateService = new TemplateService(templateRepository);
    controllerInstance = new TemplateController(templateService);

    logger.info('🏗️ TemplateController initialisé avec architecture DDD');
  }

  return controllerInstance;
}

/**
 * GET /api/templates - Récupère les templates avec filtres
 * Migration vers architecture DDD - suppression logique Prisma directe
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    logger.info('🔍 GET /api/templates - Via TemplateController DDD');

    const controller = getController();
    return await controller.getAllTemplates(request);

  } catch (error) {
    logger.error('❌ Erreur dans GET /api/templates:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des templates',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/templates - Crée un template ou exécute une action
 * Migration vers architecture DDD - suppression logique Prisma directe
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    logger.info('📝 POST /api/templates - Via TemplateController DDD');

    const controller = getController();
    return await controller.postTemplate(request);

  } catch (error) {
    logger.error('❌ Erreur dans POST /api/templates:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la création du template',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
} 