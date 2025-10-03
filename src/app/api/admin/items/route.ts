/**
 * API Routes pour la gestion des items de services
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

    logger.info('🏗️ Admin ItemController initialisé avec architecture DDD');
  }

  return controllerInstance;
}

/**
 * GET /api/admin/items
 * Récupère la liste des items selon les critères
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    logger.info('🔍 GET /api/admin/items - Via ItemController DDD');

    const controller = getController();
    return await controller.getAllItems(request);

  } catch (error) {
    logger.error('❌ Erreur dans GET /api/admin/items:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des items',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/items
 * Crée un nouvel item ou exécute des actions
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    logger.info('📝 POST /api/admin/items - Via ItemController DDD');

    const controller = getController();
    return await controller.postItem(request);

  } catch (error) {
    logger.error('❌ Erreur dans POST /api/admin/items:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la création/action de l\'item',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/items
 * Actions en lot via ItemController DDD (bulk_action)
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    logger.info('🔄 PATCH /api/admin/items - Actions en lot via ItemController DDD');

    // Transformer le PATCH en POST avec action bulk_action pour compatibilité
    const body = await request.json();
    const { action, itemIds, data } = body;

    // Créer une nouvelle requête avec le format attendu par postItem
    const mockRequest = {
      ...request,
      json: async () => ({
        action: 'bulk_action',
        bulkAction: action, // action spécifique (activate, deactivate, etc.)
        itemIds: itemIds,
        actionData: data
      })
    } as NextRequest;

    const controller = getController();
    return await controller.postItem(mockRequest);

  } catch (error) {
    logger.error('❌ Erreur dans PATCH /api/admin/items:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de l\'action en lot',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
} 