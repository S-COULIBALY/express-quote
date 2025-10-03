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
 * GET /api/templates/[id] - Récupère un template spécifique
 * Migration vers architecture DDD - suppression logique Prisma directe
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    logger.info('🔍 GET /api/templates/[id] - Via TemplateController DDD', { id: params.id });

    const controller = getController();
    return await controller.getTemplate(request, params);

  } catch (error) {
    logger.error('❌ Erreur dans GET /api/templates/[id]:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération du template',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/templates/[id] - Met à jour un template
 * Migration vers architecture DDD - suppression logique Prisma directe
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    logger.info('📝 PUT /api/templates/[id] - Via TemplateController DDD', { id: params.id });

    const controller = getController();
    return await controller.updateTemplate(request, params);

  } catch (error) {
    logger.error('❌ Erreur dans PUT /api/templates/[id]:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la mise à jour du template',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/templates/[id] - Supprime un template
 * Migration vers architecture DDD - suppression logique Prisma directe
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    logger.info('🗑️ DELETE /api/templates/[id] - Via TemplateController DDD', { id: params.id });

    const controller = getController();
    return await controller.deleteTemplate(request, params);

  } catch (error) {
    logger.error('❌ Erreur dans DELETE /api/templates/[id]:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la suppression du template',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
} 