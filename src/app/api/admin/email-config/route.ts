import { NextRequest, NextResponse } from 'next/server';
import { container } from 'tsyringe';
import { EmailConfigService } from '@/quotation/application/services/EmailConfigService';
import { 
  ExternalProviderDTO, 
  UpdateEmailTemplateDTO, 
  EmailConfigDTO,
  DocumentConfigDTO
} from '@/quotation/application/dtos/EmailConfigDTO';
import '../../../../lib/container';

// Logger simplifié
const logger = {
  info: (msg: string, ...args: any[]) => console.info('[EmailConfigAPI]', msg, ...args),
  error: (msg: string | Error, ...args: any[]) => console.error('[EmailConfigAPI]', msg, ...args)
};

// GET - Récupérer la configuration actuelle
export async function GET() {
  try {
    const emailConfigService = container.resolve(EmailConfigService);
    const config = await emailConfigService.getEmailConfig();
    
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
    
    const emailConfigService = container.resolve(EmailConfigService);
    const updatedConfig = await emailConfigService.updateEmailConfig(data as EmailConfigDTO);
    
    return NextResponse.json({
      success: true,
      message: 'Configuration sauvegardée avec succès',
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
    const emailConfigService = container.resolve(EmailConfigService);
    
    if (!data.operation) {
      return NextResponse.json(
        { error: 'Opération non spécifiée' },
        { status: 400 }
      );
    }

    let result;
    
    switch (data.operation) {
      case 'addExternalProvider':
        result = await emailConfigService.addExternalProvider(data.provider as ExternalProviderDTO);
        break;
        
      case 'updateExternalProvider':
        result = await emailConfigService.updateExternalProvider(data.provider as ExternalProviderDTO);
        break;
        
      case 'deleteExternalProvider':
        await emailConfigService.deleteExternalProvider(data.providerId);
        result = { success: true };
        break;
        
      case 'updateTemplate':
        result = await emailConfigService.updateTemplate(data.template as UpdateEmailTemplateDTO);
        break;

      case 'updateDocumentConfig':
        result = await emailConfigService.updateDocumentConfig(data.document as DocumentConfigDTO);
        break;

      case 'updateReminderDays':
        result = await emailConfigService.updateReminderDays(data.days as number[]);
        break;

      case 'testSmtpConnection':
        result = await emailConfigService.testSmtpConnection(data.smtpConfig);
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