import { NextRequest, NextResponse } from 'next/server';
import { container } from 'tsyringe';
import { NotificationOrchestratorService } from '@/quotation/application/services/NotificationOrchestratorService';
import { logger } from '@/lib/logger';

const notificationLogger = logger.withContext ? 
  logger.withContext('NotificationController') : 
  {
    debug: (msg: string, ...args: any[]) => console.debug('[NotificationController]', msg, ...args),
    info: (msg: string, ...args: any[]) => console.info('[NotificationController]', msg, ...args),
    warn: (msg: string, ...args: any[]) => console.warn('[NotificationController]', msg, ...args),
    error: (msg: string | Error, ...args: any[]) => console.error('[NotificationController]', msg, ...args)
  };

export class NotificationController {
  static async handleNotification(request: NextRequest): Promise<NextResponse> {
    try {
      const data = await request.json();

      // Validation des champs obligatoires
      if (!data.type || !data.channels || !Array.isArray(data.channels) || data.channels.length === 0) {
        notificationLogger.warn('Données manquantes pour l\'envoi de notifications', { 
          type: !!data.type, 
          channels: !!data.channels && Array.isArray(data.channels)
        });
        return NextResponse.json(
          { error: 'Données manquantes', details: 'Les champs type et channels sont requis' },
          { status: 400 }
        );
      }

      // Validation des destinataires
      if (!data.email && !data.phone && data.channels.includes('both')) {
        notificationLogger.warn('Aucun destinataire spécifié pour la notification', {
          channelsBoth: data.channels.includes('both'),
          hasEmail: !!data.email,
          hasPhone: !!data.phone
        });
        return NextResponse.json(
          { error: 'Aucun destinataire spécifié', details: 'Au moins une adresse email ou un numéro de téléphone est requis' },
          { status: 400 }
        );
      }

      // Validation des canaux
      const validChannels = ['email', 'whatsapp', 'both'];
      const invalidChannels = data.channels.filter((channel: string) => !validChannels.includes(channel));
      if (invalidChannels.length > 0) {
        notificationLogger.warn('Canaux de notification invalides', { invalidChannels });
        return NextResponse.json(
          { error: 'Canaux invalides', details: `Canaux invalides: ${invalidChannels.join(', ')}. Valeurs acceptées: ${validChannels.join(', ')}` },
          { status: 400 }
        );
      }

      // Mapping des données API vers le domaine
      const mockQuoteRequest = data.quoteId ? {
        getId: () => data.quoteId,
        getClientPhone: () => data.phone,
        getQuoteData: () => ({
          email: data.email,
          firstName: data.clientName?.split(' ')[0] || 'Client',
          lastName: data.clientName?.split(' ').slice(1).join(' ') || '',
          price: data.amount || 0,
          type: data.serviceType || 'SERVICE',
          scheduledDate: data.serviceDate,
          location: data.serviceAddress
        })
      } : null;
      const mockBooking = {
        getId: () => data.bookingId || 'temp-' + Date.now(),
        getCustomer: () => ({
          getId: () => 'temp-customer',
          getContactInfo: () => ({
            getEmail: () => data.email || '',
            getPhone: () => data.phone,
            getFirstName: () => data.clientName?.split(' ')[0] || 'Client',
            getLastName: () => data.clientName?.split(' ').slice(1).join(' ') || '',
            getFullName: () => data.clientName || 'Client'
          }),
          getEmail: () => data.email || ''
        }),
        getQuoteRequestId: () => data.quoteId,
        getScheduledDate: () => data.serviceDate ? new Date(data.serviceDate) : new Date(),
        getLocation: () => data.serviceAddress || ''
      };

      // Déterminer le type de message à envoyer
      let messageType: 'quote_request' | 'booking' | 'payment' | 'cancellation' | 'reminder';
      let targetData: any;
      switch (data.type) {
        case 'booking_confirmation':
        case 'bookingConfirmation':
          messageType = 'booking';
          targetData = mockBooking;
          break;
        case 'payment_confirmation':
        case 'paymentConfirmation':
        case 'paymentReceipt':
          messageType = 'payment';
          targetData = mockBooking;
          break;
        case 'quote_confirmation':
        case 'quoteConfirmation':
          messageType = 'quote_request';
          targetData = mockQuoteRequest;
          break;
        case 'service_confirmation':
        case 'serviceConfirmation':
          messageType = 'booking';
          targetData = mockBooking;
          break;
        case 'cancellation':
        case 'cancellationNotification':
          messageType = 'cancellation';
          targetData = mockBooking;
          break;
        case 'reminder':
        case 'appointmentReminder':
          messageType = 'reminder';
          targetData = mockBooking;
          break;
        default:
          notificationLogger.warn(`Type de notification non reconnu: ${data.type}`);
          return NextResponse.json(
            { error: `Type de notification non reconnu: ${data.type}` },
            { status: 400 }
          );
      }

      // Configurer les templates pour les deux canaux
      const template = {
        email: data.emailTemplate,
        whatsapp: data.whatsappTemplate ? {
          name: data.whatsappTemplate,
          parameters: data.whatsappParameters || [],
          language: { code: data.whatsappLanguage || 'fr' }
        } : undefined
      };

      // Appel à l'orchestrateur
      const notificationOrchestrator = container.resolve(NotificationOrchestratorService);
      let result;
      if (data.useFallback) {
        result = await notificationOrchestrator.sendWithFallback({
          messageType,
          data: targetData,
          preferredChannel: data.preferredChannel || 'email',
          template,
          metadata: data.metadata || {}
        });
      } else {
        result = await notificationOrchestrator.sendNotifications({
          messageType,
          data: targetData,
          channels: data.channels,
          template,
          metadata: data.metadata || {}
        });
      }

      notificationLogger.info(`Notifications de type ${data.type} envoyées avec succès`, { result });
      return NextResponse.json({
        success: true,
        results: result,
        message: `Notifications de type ${data.type} envoyées avec succès`
      });
    } catch (error) {
      notificationLogger.error('Erreur lors du traitement de la demande:', error);
      return NextResponse.json(
        {
          error: 'Une erreur est survenue lors du traitement de la demande',
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }
  }
} 