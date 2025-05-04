import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/config/services';
import { logger } from '@/lib/logger';
import { pdfService } from '@/config/services';

const notificationLogger = logger.withContext ? 
  logger.withContext('EmailNotifications') : 
  {
    debug: (msg: string, ...args: any[]) => console.debug('[EmailNotifications]', msg, ...args),
    info: (msg: string, ...args: any[]) => console.info('[EmailNotifications]', msg, ...args),
    warn: (msg: string, ...args: any[]) => console.warn('[EmailNotifications]', msg, ...args),
    error: (msg: string | Error, ...args: any[]) => console.error('[EmailNotifications]', msg, ...args)
  };

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Vérifier les champs obligatoires
    if (!data.type || !data.email || !data.clientName) {
      notificationLogger.warn('Données manquantes pour l\'envoi d\'email', { 
        type: !!data.type, 
        email: !!data.email, 
        clientName: !!data.clientName 
      });
      
      return NextResponse.json(
        { 
          error: 'Données manquantes',
          details: 'Les champs type, email et clientName sont requis' 
        },
        { status: 400 }
      );
    }

    notificationLogger.info(`Préparation d'envoi d'email de type ${data.type} à ${data.email}`);
    
    // Créer des objets mockés pour les méthodes attendues par le service d'email
    const mockQuoteRequest = data.quoteId ? {
      getId: () => data.quoteId,
      getQuoteData: () => ({
        email: data.email,
        firstName: data.clientName.split(' ')[0],
        lastName: data.clientName.split(' ').slice(1).join(' '),
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
          getEmail: () => data.email,
          getFirstName: () => data.clientName.split(' ')[0],
          getLastName: () => data.clientName.split(' ').slice(1).join(' '),
          getPhone: () => data.phone || '',
          getFullName: () => data.clientName
        }),
        getEmail: () => data.email
      }),
      getQuoteRequestId: () => data.quoteId,
      getScheduledDate: () => data.serviceDate ? new Date(data.serviceDate) : new Date(),
      getLocation: () => data.serviceAddress || ''
    };
    
    // Envoyer l'email selon le type
    try {
      switch (data.type) {
        case 'booking_confirmation':
        case 'bookingConfirmation':
          notificationLogger.info(`Envoi de confirmation de réservation à ${data.email}`);
          await emailService.sendBookingConfirmation(mockBooking);
          break;
        
        case 'payment_confirmation':
        case 'paymentConfirmation':
        case 'paymentReceipt':
          if (!data.paymentDetails || !data.paymentDetails.transactionId) {
            notificationLogger.warn('Détails de paiement manquants pour l\'envoi du reçu');
            return NextResponse.json(
              { error: 'Détails de paiement manquants' },
              { status: 400 }
            );
          }
          notificationLogger.info(`Envoi de confirmation de paiement à ${data.email}, transaction: ${data.paymentDetails.transactionId}`);
          await emailService.sendPaymentConfirmation(
            mockBooking,
            data.paymentDetails.transactionId
          );
          break;
        
        case 'quote_confirmation':
        case 'quoteConfirmation':
          if (!mockQuoteRequest) {
            notificationLogger.warn('Données de devis manquantes pour l\'envoi de confirmation');
            return NextResponse.json(
              { error: 'Données de devis manquantes' },
              { status: 400 }
            );
          }
          
          notificationLogger.info(`Envoi de confirmation de devis à ${data.email}`);
          // Pour ce type d'email, nous devons d'abord générer un PDF
          try {
            const pdfPath = await pdfService.generateQuotePDF(mockQuoteRequest);
            await emailService.sendQuoteConfirmation(mockQuoteRequest, pdfPath);
          } catch (pdfError) {
            notificationLogger.error('Erreur lors de la génération du PDF pour le devis:', pdfError);
            // Envoyer quand même l'email sans le PDF
            await emailService.sendQuoteConfirmation(mockQuoteRequest);
          }
          break;
        
        case 'service_confirmation':
        case 'serviceConfirmation':
          notificationLogger.info(`Envoi de confirmation de service à ${data.email}`);
          await emailService.sendBookingConfirmation(mockBooking);
          break;
        
        case 'cancellation':
        case 'cancellationNotification':
          notificationLogger.info(`Envoi de notification d'annulation à ${data.email}`);
          await emailService.sendCancellationNotification(
            mockBooking,
            data.cancellationReason
          );
          break;
        
        default:
          notificationLogger.warn(`Type d'email non reconnu: ${data.type}`);
          return NextResponse.json(
            { error: `Type d'email non reconnu: ${data.type}` },
            { status: 400 }
          );
      }

      notificationLogger.info(`Email de type ${data.type} envoyé avec succès à ${data.email}`);
      
      return NextResponse.json({
        success: true,
        message: `Email de type ${data.type} envoyé avec succès à ${data.email}`
      });
    } catch (emailError) {
      notificationLogger.error('Erreur lors de l\'envoi de l\'email:', emailError);
      
      return NextResponse.json(
        {
          error: 'Échec de l\'envoi de l\'email',
          details: emailError instanceof Error ? emailError.message : String(emailError)
        },
        { status: 500 }
      );
    }
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