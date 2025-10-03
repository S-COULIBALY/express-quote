/**
 * API Routes pour la gestion du catalogue
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

    logger.info('🏗️ Admin CatalogueController initialisé avec architecture DDD');
  }

  return controllerInstance;
}

/**
 * GET /api/admin/catalogue
 * Récupère tous les catalogues
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    logger.info('🔍 GET /api/admin/catalogue - Via CatalogueController DDD');

    const controller = getController();
    return await controller.getAllCatalogues(request);

  } catch (error) {
    logger.error('❌ Erreur dans GET /api/admin/catalogue:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des catalogues',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/catalogue
 * Crée ou exécute des actions sur les catalogues
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    logger.info('📝 POST /api/admin/catalogue - Via CatalogueController DDD');

    const controller = getController();
    return await controller.postCatalogue(request);

  } catch (error) {
    logger.error('❌ Erreur dans POST /api/admin/catalogue:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la création/action du catalogue',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/catalogue
 * Actions en lot via CatalogueController DDD
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    logger.info('🔄 PATCH /api/admin/catalogue - Actions en lot via CatalogueController DDD');

    // Transformer le PATCH en POST avec action bulk_action pour compatibilité
    const body = await request.json();
    const { action, catalogueIds, data } = body;

    // Créer une nouvelle requête avec le format attendu par postCatalogue
    const mockRequest = {
      ...request,
      json: async () => ({
        action: 'bulk_action',
        bulkAction: action, // action spécifique (activate, deactivate, etc.)
        catalogueIds: catalogueIds,
        actionData: data
      })
    } as NextRequest;

    const controller = getController();
    return await controller.postCatalogue(mockRequest);

  } catch (error) {
    logger.error('❌ Erreur dans PATCH /api/admin/catalogue:', error);

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