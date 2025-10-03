/**
 * API Routes pour la gestion d'un template spécifique
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

    logger.info('🏗️ Admin TemplateController ([id]) initialisé avec architecture DDD');
  }

  return controllerInstance;
}

/**
 * GET /api/admin/templates/[id]
 * Récupère un template spécifique
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    logger.info('🔍 DEBUG: GET /api/admin/templates/[id] - DÉBUT', {
      id: params?.id,
      paramsType: typeof params,
      fullParams: JSON.stringify(params)
    });

    logger.info('🔍 DEBUG: Vérification du controller...');
    const controller = getController();
    logger.info('🔍 DEBUG: Controller récupéré:', !!controller);

    logger.info('🔍 DEBUG: Appel controller.getTemplate...');
    const result = await controller.getTemplate(request, params);
    logger.info('🔍 DEBUG: Résultat controller:', !!result);

    return result;

  } catch (error) {
    logger.error('❌ ERREUR COMPLÈTE dans GET /api/admin/templates/[id]:', {
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : 'Pas de stack',
      params: params,
      id: params?.id
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération du template',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/templates/[id]
 * Met à jour un template spécifique
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    logger.info('📝 PUT /api/admin/templates/[id] - Via TemplateController DDD corrigé', { id: params.id });

    const controller = getController();
    return await controller.updateTemplate(request, params);

  } catch (error) {
    logger.error('❌ Erreur dans PUT /api/admin/templates/[id]:', error);

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
 * DELETE /api/admin/templates/[id]
 * Supprime un template spécifique
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    logger.info('🗑️ DELETE /api/admin/templates/[id] - Via TemplateController DDD corrigé', { id: params.id });

    const controller = getController();
    return await controller.deleteTemplate(request, params);

  } catch (error) {
    logger.error('❌ Erreur dans DELETE /api/admin/templates/[id]:', error);

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

/**
 * PATCH /api/admin/templates/[id]
 * Actions spécifiques sur un template (clone, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    logger.info('🔧 PATCH /api/admin/templates/[id] - Via TemplateController DDD corrigé', { id: params.id });

    const controller = getController();
    return await controller.patchTemplate(request, params);

  } catch (error) {
    logger.error('❌ Erreur dans PATCH /api/admin/templates/[id]:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de l\'action sur le template',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

 