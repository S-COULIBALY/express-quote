/**
 * API Route pour les statistiques des items
 * Architecture DDD avec ItemController - Migration corrective
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

    logger.info('🏗️ Admin ItemController (stats) initialisé avec architecture DDD');
  }

  return controllerInstance;
}

/**
 * GET /api/admin/items/stats
 * Récupère les statistiques complètes des items
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    logger.info('📊 GET /api/admin/items/stats - Via ItemController DDD corrigé');

    const controller = getController();
    return await controller.getItemStatistics(request);

  } catch (error) {
    logger.error('❌ Erreur dans GET /api/admin/items/stats:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des statistiques',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}