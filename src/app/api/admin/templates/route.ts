/**
 * API Routes pour la gestion des templates de services
 * Architecture DDD avec TemplateController - Migration corrective
 */

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

    logger.info('🏗️ Admin TemplateController initialisé avec architecture DDD');
  }

  return controllerInstance;
}

/**
 * GET /api/admin/templates
 * Récupère la liste des templates selon les critères
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    logger.info('🔍 GET /api/admin/templates - Via TemplateController DDD corrigé');

    const controller = getController();
    return await controller.getAllTemplates(request);

  } catch (error) {
    logger.error('❌ Erreur dans GET /api/admin/templates:', error);

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
 * POST /api/admin/templates
 * Crée un nouveau template ou exécute des actions
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    logger.info('📝 POST /api/admin/templates - Via TemplateController DDD corrigé');

    const controller = getController();
    return await controller.postTemplate(request);

  } catch (error) {
    logger.error('❌ Erreur dans POST /api/admin/templates:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la création/action du template',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}