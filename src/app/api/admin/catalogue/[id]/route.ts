/**
 * API Routes pour la gestion d'un catalogue spécifique
 * Architecture DDD avec CatalogueController - Migration vers DDD
 */

import { NextRequest, NextResponse } from 'next/server';
import { CatalogueController } from '@/quotation/interfaces/http/controllers/CatalogueController';
import { CatalogueService } from '@/quotation/application/services/CatalogueService';
import { PrismaCatalogueRepository } from '@/quotation/infrastructure/repositories/PrismaCatalogueRepository';
import { logger } from '@/lib/logger';

// Instance partagée du contrôleur avec injection de dépendances DDD
let controllerInstance: CatalogueController | null = null;

function getController(): CatalogueController {
  if (!controllerInstance) {
    // Injection de dépendances selon l'architecture DDD
    const catalogueRepository = new PrismaCatalogueRepository();
    const catalogueService = new CatalogueService(catalogueRepository);
    controllerInstance = new CatalogueController(catalogueService);

    logger.info('🏗️ Admin CatalogueController ([id]) initialisé avec architecture DDD');
  }

  return controllerInstance;
}

/**
 * GET /api/admin/catalogue/[id]
 * Récupère un catalogue spécifique
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    logger.info('🔍 DEBUG: GET /api/admin/catalogue/[id] - DÉBUT', {
      id: params?.id,
      paramsType: typeof params,
      fullParams: JSON.stringify(params)
    });

    logger.info('🔍 DEBUG: Vérification du controller...');
    const controller = getController();
    logger.info('🔍 DEBUG: Controller récupéré:', !!controller);

    logger.info('🔍 DEBUG: Appel controller.getCatalogue...');
    const result = await controller.getCatalogue(request, params);
    logger.info('🔍 DEBUG: Résultat controller:', !!result);

    return result;

  } catch (error) {
    logger.error('❌ ERREUR COMPLÈTE dans GET /api/admin/catalogue/[id]:', {
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : 'Pas de stack',
      params: params,
      id: params?.id
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération du catalogue',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/catalogue/[id]
 * Met à jour un catalogue spécifique
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    logger.info('📝 PUT /api/admin/catalogue/[id] - Via CatalogueController DDD corrigé', { id: params.id });

    const controller = getController();
    return await controller.updateCatalogue(request, params);

  } catch (error) {
    logger.error('❌ Erreur dans PUT /api/admin/catalogue/[id]:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la mise à jour du catalogue',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/catalogue/[id]
 * Supprime un catalogue spécifique
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    logger.info('🗑️ DELETE /api/admin/catalogue/[id] - Via CatalogueController DDD corrigé', { id: params.id });

    const controller = getController();
    return await controller.deleteCatalogue(request, params);

  } catch (error) {
    logger.error('❌ Erreur dans DELETE /api/admin/catalogue/[id]:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la suppression du catalogue',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/catalogue/[id]
 * Actions spécifiques sur un catalogue (clone, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    logger.info('🔧 PATCH /api/admin/catalogue/[id] - Via CatalogueController DDD corrigé', { id: params.id });

    const controller = getController();
    return await controller.patchCatalogue(request, params);

  } catch (error) {
    logger.error('❌ Erreur dans PATCH /api/admin/catalogue/[id]:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de l\'action sur le catalogue',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}