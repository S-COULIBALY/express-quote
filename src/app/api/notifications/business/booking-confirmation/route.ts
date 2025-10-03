/**
 * 📅 API CONFIRMATION DE RÉSERVATION - Système enrichi avec pièces jointes
 * Route métier pour les confirmations de réservation avec support des PDFs
 */

import { NextRequest, NextResponse } from 'next/server';
// import { POST as mainPost } from '../../route'; // Temporairement désactivé
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    logger.info('📧 API Confirmation de réservation - génération automatique de documents', {
      bookingId: body.bookingId,
      customerEmail: body.customerEmail?.replace(/(.{3}).*(@.*)/, '$1***$2')
    });

    // NOUVEAU FLUX : Toujours générer les documents puis envoyer
    return await handleBookingConfirmationWithAutoGeneration(body);
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
 */
async function handleBookingConfirmationWithAttachments(data: any) {
  const {
    email,
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
    attachments = [],
    attachedDocuments = []
  } = data;

  logger.info('📎 Envoi confirmation avec pièces jointes', {
    email: email?.replace(/(.{3}).*(@.*)/, '$1***$2'),
    bookingId,
    attachmentsCount: attachments.length,
    totalAttachmentSize: attachments.reduce((sum: number, att: any) =>
      sum + (att.content ? Buffer.from(att.content, 'base64').length : 0), 0
    )
  });

  // TODO: Intégrer avec le vrai système de notifications (BullMQ + React Email)
  // Pour l'instant, simulation de l'envoi

  // Préparer les pièces jointes
  const processedAttachments = attachments.map((att: any) => ({
    filename: att.filename,
    content: Buffer.from(att.content, 'base64'),
    contentType: att.mimeType || 'application/pdf',
    documentType: att.documentType
  }));

  logger.info('📧 Envoi d\'email de confirmation enrichi', {
    to: email,
    subject: `Confirmation de réservation ${bookingReference}`,
    attachments: processedAttachments.length,
    documentsIncluded: attachedDocuments.map((doc: any) => doc.type)
  });

  // Simuler l'envoi d'email
  await new Promise(resolve => setTimeout(resolve, 150));

  // Simuler l'envoi SMS
  if (customerPhone) {
    logger.info('📱 Envoi SMS de confirmation', {
      phone: customerPhone?.replace(/(.{3}).*(.{2})/, '$1****$2'),
      bookingReference
    });
  }

  const response = {
    success: true,
    messageId: `confirmation_${Date.now()}`,
    emailSent: true,
    smsSent: !!customerPhone,
    attachmentsSent: processedAttachments.length,
    timestamp: new Date().toISOString(),
    message: `Confirmation de réservation envoyée à ${customerName}`,
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

  logger.info('✅ Confirmation enrichie envoyée avec succès', {
    messageId: response.messageId,
    attachmentsSent: response.attachmentsSent
  });

  return NextResponse.json(response);
}