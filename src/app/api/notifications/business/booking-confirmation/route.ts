/**
 * 📅 API CONFIRMATION DE RÉSERVATION - Système enrichi avec pièces jointes
 * Route métier pour les confirmations de réservation avec support des PDFs
 * ✅ INTÉGRÉ AVEC SYSTÈME DE QUEUE BULLMQ
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getGlobalNotificationService } from '@/notifications/interfaces/http/GlobalNotificationService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    logger.info('📧 API Confirmation de réservation - génération automatique de documents', {
      bookingId: body.bookingId,
      customerEmail: body.customerEmail?.replace(/(.{3}).*(@.*)/, '$1***$2')
    });

    // NOUVEAU FLUX : Toujours générer les documents puis envoyer
    return await handleBookingConfirmationWithAttachments(body);
  } catch (error) {
    logger.error('❌ Erreur dans la route booking-confirmation', error as Error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors du traitement de la confirmation',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * Traite les confirmations de réservation avec pièces jointes PDF
 * ✅ Utilise le système de queue BullMQ pour traitement asynchrone
 */
async function handleBookingConfirmationWithAttachments(data: any) {
  const {
    email: emailField,
    customerEmail: customerEmailField, // ✅ Accepter les deux noms de champ
    customerName,
    bookingId,
    bookingReference,
    serviceDate,
    serviceTime,
    serviceAddress,
    totalAmount,
    customerPhone,
    serviceType,
    sessionId,
    viewBookingUrl,
    supportUrl,
    attachments = [],
    attachedDocuments = []
  } = data;

  // ✅ CORRIGÉ: Accepter "email" ou "customerEmail" (compatibilité)
  const email = emailField || customerEmailField;

  logger.info('📎 Envoi confirmation avec pièces jointes via queue', {
    email: email?.replace(/(.{3}).*(@.*)/, '$1***$2'),
    bookingId,
    attachmentsCount: attachments.length,
    totalAttachmentSize: attachments.reduce((sum: number, att: any) =>
      sum + (att.content ? Buffer.from(att.content, 'base64').length : 0), 0
    )
  });

  try {
    // ✅ Obtenir le service de notification avec queue
    const notificationService = await getGlobalNotificationService();

    // Préparer les pièces jointes pour le service
  const processedAttachments = attachments.map((att: any) => ({
    filename: att.filename,
      content: att.content ? Buffer.from(att.content, 'base64') : undefined,
      path: att.path, // Si le fichier est déjà sur le disque
      contentType: att.mimeType || att.contentType || 'application/pdf',
      size: att.content ? Buffer.from(att.content, 'base64').length : att.size
    })).filter((att: any) => att.content || att.path); // Filtrer les attachments valides

    // ✅ Ajouter à la queue email avec pièces jointes
    logger.info('📧 Ajout email de confirmation à la queue', {
      to: email?.replace(/(.{3}).*(@.*)/, '$1***$2'),
      attachmentsCount: processedAttachments.length
    });

    const emailResult = await notificationService.sendEmail({
    to: email,
      template: 'booking-confirmation',
      data: {
        customerName,
        customerPhone,
        bookingReference: bookingReference || `EQ-${bookingId?.slice(-8).toUpperCase()}`,
        serviceType: serviceType || 'CUSTOM',
        serviceName: serviceType || 'Service Express Quote',
        serviceDate: serviceDate || new Date().toISOString().split('T')[0],
        serviceTime: serviceTime || '09:00',
        primaryAddress: serviceAddress || 'Adresse à définir',
        totalAmount,
        viewBookingUrl: viewBookingUrl || `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${bookingId}`,
        supportUrl: supportUrl || `${process.env.NEXT_PUBLIC_APP_URL}/contact`,
        companyName: 'Express Quote'
      },
      attachments: processedAttachments,
      priority: 'HIGH',
      metadata: {
        bookingId,
        sessionId,
        source: 'booking-confirmation-api',
        documentsAttached: attachedDocuments.map((doc: any) => ({
          type: doc.type,
          filename: doc.filename
        }))
      }
  });

    // ✅ Ajouter à la queue SMS si numéro disponible
    let smsResult = null;
  if (customerPhone) {
      logger.info('📱 Ajout SMS de confirmation à la queue', {
        phone: customerPhone?.replace(/(.{3}).*(.{2})/, '$1****$2')
      });

      try {
        // Utiliser sendBookingConfirmationSMS qui génère le message optimisé
        smsResult = await notificationService.sendBookingConfirmationSMS(customerPhone, {
          customerName,
          bookingId: bookingId || bookingReference || 'N/A',
          serviceDate: serviceDate || new Date().toISOString().split('T')[0],
          serviceTime: serviceTime || '09:00',
          totalAmount: totalAmount || 0,
          serviceType: serviceType || 'CUSTOM'
        });
      } catch (smsError) {
        logger.error('❌ Erreur lors de l\'ajout SMS à la queue', {
          error: smsError instanceof Error ? smsError.message : 'Erreur inconnue',
          bookingId
        });
        // Ne pas faire échouer si SMS échoue
      }
  }

  const response = {
    success: true,
      emailQueued: emailResult.success,
      smsQueued: smsResult?.success || false,
      emailJobId: emailResult.id,
      smsJobId: smsResult?.id || null,
      attachmentsQueued: processedAttachments.length,
    timestamp: new Date().toISOString(),
      message: `Notifications ajoutées à la queue pour ${customerName}`,
    details: {
      bookingReference,
      serviceDate,
      serviceTime,
      serviceAddress,
      totalAmount,
      documentsAttached: attachedDocuments.map((doc: any) => ({
        type: doc.type,
        filename: doc.filename
      }))
    }
  };

    logger.info('✅ Confirmations ajoutées à la queue avec succès', {
      emailJobId: emailResult.id,
      smsJobId: smsResult?.id,
      attachmentsQueued: processedAttachments.length
  });

  return NextResponse.json(response);

  } catch (error) {
    logger.error('❌ Erreur lors de l\'ajout des notifications à la queue', {
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : undefined,
      bookingId,
      email: email?.replace(/(.{3}).*(@.*)/, '$1***$2')
    });

    // Fallback : retourner une réponse partielle si au moins l'email a été ajouté
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de l\'ajout des notifications à la queue',
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      bookingId,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}