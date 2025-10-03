import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

    logger.info('ConfigurationController DDD initialisé pour /[category]/[key]');
  }
  return controllerInstance;
}

/**
 * GET /api/admin/configuration/[category]/[key]
 * Récupère la valeur d'une configuration spécifique (via contrôleur DDD)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { category: string; key: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Appeler directement le service sans passer par handleRequest
    const controller = getController();
    const configService = controller['configurationService'];

    // Récupérer toutes les configurations de la catégorie
    const configurations = await configService.getConfigurations(params.category as any);

    // Trouver la configuration spécifique par clé
    const specificConfig = configurations.find(config => config.key === params.key);

    if (!specificConfig) {
      return controller['errorResponse'](new Error('Configuration non trouvée'), 'Configuration non trouvée', 404);
    }

    // Utiliser le format standardisé du BaseApiController
    return controller['successResponse']({
      configuration: {
        id: specificConfig.getId(),
        category: specificConfig.category,
        key: specificConfig.key,
        value: specificConfig.value,
        description: specificConfig.description,
        isActive: specificConfig.isActive,
        validFrom: specificConfig.validFrom,
        validTo: specificConfig.validTo,
        updatedAt: specificConfig.updatedAt
      },
      retrievedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération de la valeur:', error as Error);

    // Utiliser le format standardisé du BaseApiController
    const controller = getController();
    return controller['errorResponse'](error, 'Erreur lors de la récupération de la valeur', 500);
  }
}

/**
 * PUT /api/admin/configuration/[category]/[key]
 * Met à jour la valeur d'une configuration spécifique (via contrôleur DDD)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { category: string; key: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Lire le body de la requête
    const body = await request.json();

    // Appeler directement le service sans passer par handleRequest
    const controller = getController();
    const configService = controller['configurationService'];

    // Utiliser la méthode setValue du service directement
    const configuration = await configService.setValue(
      params.category as any,
      params.key,
      body.value,
      body.description,
      body.validFrom ? new Date(body.validFrom) : undefined,
      body.validTo ? new Date(body.validTo) : undefined
    );

    // Utiliser le format standardisé du BaseApiController
    return controller['successResponse']({
      configuration: {
        id: configuration.getId(),
        category: configuration.category,
        key: configuration.key,
        value: configuration.value,
        description: configuration.description,
        isActive: configuration.isActive,
        validFrom: configuration.validFrom,
        validTo: configuration.validTo,
        updatedAt: configuration.updatedAt
      },
      updatedAt: new Date().toISOString(),
      message: `Configuration ${params.category}.${params.key} mise à jour avec succès`
    });

  } catch (error) {
    logger.error('Erreur lors de la mise à jour de la valeur:', error as Error);

    // Utiliser le format standardisé du BaseApiController
    const controller = getController();
    return controller['errorResponse'](error, 'Erreur lors de la mise à jour de la valeur', 500);
  }
}

/**
 * DELETE /api/admin/configuration/[category]/[key]
 * Désactive une configuration spécifique (via contrôleur DDD)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { category: string; key: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Appeler directement le service sans passer par handleRequest
    const controller = getController();
    const configService = controller['configurationService'];

    // Utiliser la méthode deactivateConfiguration du service directement
    await configService.deactivateConfiguration(
      params.category as any,
      params.key
    );

    // Utiliser le format standardisé du BaseApiController
    return controller['successResponse']({
      message: `Configuration ${params.category}.${params.key} désactivée avec succès`,
      deactivatedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Erreur lors de la désactivation:', error as Error);

    // Utiliser le format standardisé du BaseApiController
    const controller = getController();
    return controller['errorResponse'](error, 'Erreur lors de la désactivation', 500);
  }
}