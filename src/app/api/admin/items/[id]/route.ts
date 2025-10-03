/**
 * API Routes pour la gestion d'un item spécifique
 * Architecture DDD avec ItemController - Migration vers DDD
 */

import { NextRequest, NextResponse } from 'next/server';
import { ItemController } from '@/quotation/interfaces/http/controllers/ItemController';
import { ItemService } from '@/quotation/application/services/ItemService';
import { PrismaItemRepository } from '@/quotation/infrastructure/repositories/PrismaItemRepository';
import { logger } from '@/lib/logger';

// Instance partagée du contrôleur avec injection de dépendances DDD
let controllerInstance: ItemController | null = null;

function getController(): ItemController {
  if (!controllerInstance) {
    // Injection de dépendances selon l'architecture DDD
    const itemRepository = new PrismaItemRepository();
    const itemService = new ItemService(itemRepository);
    controllerInstance = new ItemController(itemService);

    logger.info('🏗️ Admin ItemController ([id]) initialisé avec architecture DDD');
  }

  return controllerInstance;
}

/**
 * GET /api/admin/items/[id]
 * Récupère un item spécifique
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    logger.info('🔍 DEBUG: GET /api/admin/items/[id] - DÉBUT', {
      id: params?.id,
      paramsType: typeof params,
      fullParams: JSON.stringify(params)
    });

    logger.info('🔍 DEBUG: Vérification du controller...');
    const controller = getController();
    logger.info('🔍 DEBUG: Controller récupéré:', !!controller);

    logger.info('🔍 DEBUG: Appel controller.getItem...');
    const result = await controller.getItem(request, params);
    logger.info('🔍 DEBUG: Résultat controller:', !!result);

    return result;

  } catch (error) {
    logger.error('❌ ERREUR COMPLÈTE dans GET /api/admin/items/[id]:', {
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : 'Pas de stack',
      params: params,
      id: params?.id
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération de l\'item',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/items/[id]
 * Met à jour un item spécifique
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    logger.info('📝 PUT /api/admin/items/[id] - Via ItemController DDD corrigé', { id: params.id });

    const controller = getController();
    return await controller.updateItem(request, params);

  } catch (error) {
    logger.error('❌ Erreur dans PUT /api/admin/items/[id]:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la mise à jour de l\'item',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/items/[id]
 * Supprime un item spécifique
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    logger.info('🗑️ DELETE /api/admin/items/[id] - Via ItemController DDD corrigé', { id: params.id });

    const controller = getController();
    return await controller.deleteItem(request, params);

  } catch (error) {
    logger.error('❌ Erreur dans DELETE /api/admin/items/[id]:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la suppression de l\'item',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
} 