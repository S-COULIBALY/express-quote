import { NextRequest, NextResponse } from 'next/server';
import { ConfigurationController } from '@/quotation/interfaces/http/controllers/ConfigurationController';
import { ConfigurationService } from '@/quotation/application/services/ConfigurationService';
import { PrismaConfigurationRepository } from '@/quotation/infrastructure/repositories/PrismaConfigurationRepository';
import { PrismaClient } from '@prisma/client';
import { ConfigurationCategory } from '@/quotation/domain/configuration/ConfigurationKey';

// Instance partagée du contrôleur avec injection de dépendances DDD
let controllerInstance: ConfigurationController | null = null;

function getController(): ConfigurationController {
  if (!controllerInstance) {
    // Injection de dépendances selon l'architecture DDD
    const prisma = new PrismaClient();
    const configurationRepository = new PrismaConfigurationRepository(prisma);
    const configurationService = new ConfigurationService(configurationRepository);

    controllerInstance = new ConfigurationController(configurationService);
  }
  return controllerInstance;
}

export async function GET(request: NextRequest) {
  try {
    const controller = getController();
    const response = await controller.getConfigurations(new NextRequest(request.url, {
      ...request,
      body: JSON.stringify({ category: ConfigurationCategory.SYSTEM_VALUES })
    }));
    return response;
  } catch (error) {
    console.error('Error getting recipients config:', error);
    return NextResponse.json(
      { error: 'Failed to get recipients configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const controller = getController();
    const body = await request.json();
    const response = await controller.setValue(new NextRequest(request.url, {
      ...request,
      body: JSON.stringify({
        ...body,
        category: ConfigurationCategory.SYSTEM_VALUES
      })
    }));
    return response;
  } catch (error) {
    console.error('Error updating recipients config:', error);
    return NextResponse.json(
      { error: 'Failed to update recipients configuration' },
      { status: 500 }
    );
  }
}

