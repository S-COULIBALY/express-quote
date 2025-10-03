import { NextRequest, NextResponse } from 'next/server';
import { container } from 'tsyringe';
import { WhatsAppConfigService } from '@/quotation/application/services/WhatsAppConfigService';
import {
  WhatsAppConfigDTO,
  DocumentConfigDTO,
  TemplateConfigDTO,
  SessionConfigDTO,
  AnalyticsConfigDTO
} from '@/quotation/application/dtos/WhatsAppConfigDTO';
import '@/quotation/application/container';

// Logger simplifié
const logger = {
  info: (msg: string, ...args: any[]) => console.info('[WhatsAppConfigAPI]', msg, ...args),
  error: (msg: string | Error, ...args: any[]) => console.error('[WhatsAppConfigAPI]', msg, ...args)
};

// GET - Récupérer la configuration actuelle
export async function GET() {
  try {
    const whatsappConfigService = container.resolve(WhatsAppConfigService);
    const config = await whatsappConfigService.getWhatsAppConfig();
    
    return NextResponse.json(config);
  } catch (error) {
    logger.error('Erreur lors de la récupération de la configuration:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération de la configuration',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// POST - Mettre à jour la configuration complète
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data) {
      return NextResponse.json(
        { error: 'Aucune donnée fournie' },
        { status: 400 }
      );
    }
    
    const whatsappConfigService = container.resolve(WhatsAppConfigService);
    const updatedConfig = await whatsappConfigService.updateWhatsAppConfig(data as WhatsAppConfigDTO);
    
    return NextResponse.json({
      success: true,
      message: 'Configuration WhatsApp sauvegardée avec succès',
      config: updatedConfig
    });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour de la configuration:', error);
    
    return NextResponse.json(
      {
        error: 'Erreur lors de la mise à jour de la configuration',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour une partie spécifique de la configuration
export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    const whatsappConfigService = container.resolve(WhatsAppConfigService);
    
    if (!data.operation) {
      return NextResponse.json(
        { error: 'Opération non spécifiée' },
        { status: 400 }
      );
    }

    let result;
    
    switch (data.operation) {
      case 'updateTemplate':
        result = await whatsappConfigService.updateTemplate(data.template as TemplateConfigDTO);
        break;

      case 'updateDocumentConfig':
        result = await whatsappConfigService.updateDocumentConfig(data.document as DocumentConfigDTO);
        break;

      case 'updateSessionConfig':
        result = await whatsappConfigService.updateSessionConfig(data.session as SessionConfigDTO);
        break;

      case 'updateAnalyticsConfig':
        result = await whatsappConfigService.updateAnalyticsConfig(data.analytics as AnalyticsConfigDTO);
        break;

      case 'testConnection':
        result = await whatsappConfigService.testConnection(data.credentials);
        break;
        
      default:
        return NextResponse.json(
          { error: 'Opération non reconnue' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour partielle:', error);
    
    return NextResponse.json(
      {
        error: 'Erreur lors de la mise à jour',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 