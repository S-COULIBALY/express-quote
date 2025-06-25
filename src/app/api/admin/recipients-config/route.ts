import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { EmailConfigService } from '@/quotation/application/services/EmailConfigService';
import { WhatsAppConfigService } from '@/quotation/application/services/WhatsAppConfigService';
import { 
  EmailConfigDTO,
  InternalTeamType,
  RecipientConfigDTO,
  ExternalProviderDTO,
  ProfessionalDTO
} from '@/quotation/application/dtos/EmailConfigDTO';

const emailConfigService = container.resolve(EmailConfigService);
const whatsappConfigService = container.resolve(WhatsAppConfigService);

export async function GET() {
  try {
    const emailConfig = await emailConfigService.getEmailConfig();
    const whatsappConfig = await whatsappConfigService.getWhatsAppConfig();

    // Combine email and whatsapp configurations for recipients
    const recipientsConfig = {
      internalTeams: emailConfig.internalTeams,
      externalProviders: emailConfig.externalProviders,
      professionals: emailConfig.professionals,
      clientConfig: {
        enabled: true,
        messageTypes: ['quote_request', 'booking', 'payment', 'cancellation', 'reminder'],
        channels: ['email', 'whatsapp']
      }
    };

    return NextResponse.json(recipientsConfig);
  } catch (error) {
    console.error('Error fetching recipients config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipients configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { action, ...payload } = data;

    let result;

    switch (action) {
      case 'updateInternalTeam':
        const { teamType, config } = payload;
        result = await emailConfigService.updateInternalTeamConfig(
          teamType as InternalTeamType,
          config as RecipientConfigDTO
        );
        
        // Update WhatsApp config if WhatsApp is enabled for this team
        if (config.channels.includes('whatsapp')) {
          await whatsappConfigService.updateRecipientConfig({
            type: teamType,
            enabled: config.enabled,
            messageTypes: config.messageTypes
          });
        }
        break;

      case 'updateExternalProvider':
        result = await emailConfigService.updateExternalProvider(
          payload.provider as ExternalProviderDTO
        );
        
        // Update WhatsApp config if WhatsApp is enabled for this provider
        if (payload.provider.channels.includes('whatsapp')) {
          await whatsappConfigService.updateRecipientConfig({
            type: `provider_${payload.provider.id}`,
            enabled: payload.provider.config.enabled,
            messageTypes: payload.provider.config.messageTypes
          });
        }
        break;

      case 'updateProfessional':
        result = await emailConfigService.updateProfessional(
          payload.professional as ProfessionalDTO
        );
        
        // Update WhatsApp config if WhatsApp is enabled for this professional
        if (payload.professional.config.channels.includes('whatsapp')) {
          await whatsappConfigService.updateRecipientConfig({
            type: `professional_${payload.professional.id}`,
            enabled: payload.professional.config.enabled,
            messageTypes: payload.professional.config.messageTypes
          });
        }
        break;

      case 'deleteExternalProvider':
        result = await emailConfigService.deleteExternalProvider(payload.providerId);
        break;

      case 'deleteProfessional':
        result = await emailConfigService.deleteProfessional(payload.professionalId);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating recipients config:', error);
    return NextResponse.json(
      { error: 'Failed to update recipients configuration' },
      { status: 500 }
    );
  }
} 