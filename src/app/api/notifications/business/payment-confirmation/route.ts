/**
 * 💰 API Payment Confirmation Notifications
 *
 * POST /api/notifications/business/payment-confirmation
 *
 * Responsabilité :
 * - Valide les données de confirmation de paiement
 * - Envoie des notifications avec PDF en pièces jointes
 * - Délègue la validation au NotificationController
 * - Suit le même pattern que booking-confirmation
 */

import { NextRequest, NextResponse } from 'next/server';
import { NotificationController } from '@/notifications/interfaces/http/NotificationController';
import { logger } from '@/lib/logger';

/**
 * Envoie des notifications de confirmation de paiement avec génération automatique de documents
 */
export async function POST(request: NextRequest) {
  const requestLogger = logger.withContext('PaymentConfirmationAPI');

  try {
    requestLogger.info('💰 Demande de notification payment-confirmation - génération automatique de documents');

    const body = await request.json();

    // NOUVEAU FLUX : Génération automatique des documents puis envoi
    const enrichedBody = await generateDocumentsForPaymentConfirmation(body, requestLogger);

    // Délégation vers le contrôleur avec documents attachés
    const notificationController = new NotificationController();
    const result = await notificationController.handlePaymentConfirmation(enrichedBody);

    if (result.success) {
      requestLogger.info('✅ Notifications payment-confirmation envoyées', {
        bookingId: body.bookingId,
        emailsSent: result.emailsSent,
        smsSent: result.smsSent
      });

      return NextResponse.json(result);
    } else {
      requestLogger.error('❌ Échec notifications payment-confirmation', {
        bookingId: body.bookingId,
        error: result.error
      });

      return NextResponse.json(result, { status: 500 });
    }

  } catch (error) {
    requestLogger.error('❌ Erreur API payment-confirmation', {
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });

    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      emailsSent: 0,
      smsSent: 0
    }, { status: 500 });
  }
}

/**
 * 📄 GÉNÉRATION AUTOMATIQUE DES DOCUMENTS POUR PAIEMENT
 *
 * Génère les documents appropriés via l'API centralisée puis les attache au body.
 */
async function generateDocumentsForPaymentConfirmation(body: any, logger: any): Promise<any> {
  const { bookingId, email, customerName } = body;

  try {
    logger.info('📄 Génération documents client pour paiement', {
      bookingId,
      trigger: 'PAYMENT_COMPLETED'
    });

    // Génération via API centralisée
    const documentsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/documents/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PaymentConfirmationAPI/1.0'
      },
      body: JSON.stringify({
        bookingId: bookingId,
        trigger: 'PAYMENT_COMPLETED',
        targetAudience: 'CUSTOMER', // Spécifique au client
        customerData: {
          email: email,
          name: customerName
        }
      })
    });

    let attachments = [];
    if (documentsResponse.ok) {
      const documentsResult = await documentsResponse.json();
      if (documentsResult.success && documentsResult.documents?.length > 0) {
        attachments = documentsResult.documents.map((doc: any) => ({
          filename: doc.filename,
          path: doc.path || doc.filePath, // Compatibilité avec différents formats
          content: doc.base64Content || doc.content,
          contentType: doc.mimeType || 'application/pdf',
          size: doc.size,
          mimeType: doc.mimeType || 'application/pdf'
        }));

        logger.info('✅ Documents générés pour paiement', {
          bookingId,
          documentsCount: attachments.length,
          totalSize: `${Math.round(attachments.reduce((sum, att) => sum + (att.size || 0), 0) / 1024)}KB`
        });
      }
    } else {
      logger.warn('⚠️ Erreur génération documents paiement, envoi sans pièces jointes', {
        bookingId,
        status: documentsResponse.status
      });
    }

    // Retourner le body enrichi avec les documents
    return {
      ...body,
      attachments
    };

  } catch (error) {
    logger.error('❌ Erreur lors de la génération automatique documents paiement', {
      bookingId,
      error
    });

    // Fallback: retourner le body original sans documents
    return {
      ...body,
      attachments: []
    };
  }
}

/**
 * Récupère les templates disponibles pour payment-confirmation
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const format = url.searchParams.get('format');

  try {
    return NextResponse.json({
      success: true,
      templateType: 'payment-confirmation',
      availableFormats: ['email', 'sms'],
      format: format || 'all',
      description: 'Templates de confirmation de paiement avec PDF'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération des templates'
    }, { status: 500 });
  }
}