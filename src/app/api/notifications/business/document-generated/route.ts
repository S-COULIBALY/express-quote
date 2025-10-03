import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * POST /api/notifications/business/document-generated
 * Endpoint pour envoyer des notifications avec documents PDF en pièces jointes
 * 
 * Body: {
 *   email: string,
 *   customerName: string,
 *   bookingId: string,
 *   bookingReference: string,
 *   trigger: string,
 *   reason: string,
 *   generatedDocuments: Array<{type, filename, createdAt}>,
 *   attachments: Array<{filename, content, mimeType, documentId, documentType}>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const {
      email,
      customerName,
      bookingId,
      bookingReference,
      trigger,
      reason,
      generatedDocuments = [],
      attachments = []
    } = data;

    logger.info('📧 Envoi de notification de documents générés', {
      email: email?.replace(/(.{3}).*(@.*)/, '$1***$2'), // Masquer l'email
      bookingId,
      trigger,
      documentsCount: generatedDocuments.length,
      attachmentsCount: attachments.length,
      totalAttachmentSize: attachments.reduce((sum: number, att: any) => 
        sum + (att.content ? att.content.length : 0), 0
      )
    });

    // Valider les données requises
    if (!email || !customerName || !bookingId) {
      return NextResponse.json(
        { success: false, error: 'email, customerName et bookingId sont requis' },
        { status: 400 }
      );
    }

    // Simuler l'envoi d'email avec pièces jointes
    // TODO: Intégrer avec le vrai système de notifications (BullMQ + React Email)
    
    logger.info('📎 Préparation des pièces jointes PDF', {
      attachments: attachments.map((att: any) => ({
        filename: att.filename,
        type: att.documentType,
        size: att.content ? Buffer.from(att.content, 'base64').length : 0
      }))
    });

    // Simuler l'envoi d'email
    await new Promise(resolve => setTimeout(resolve, 100)); // Simule délai d'envoi

    // Simuler l'envoi SMS optionnel
    if (data.customerPhone) {
      logger.info('📱 Envoi SMS de notification de documents', {
        phone: data.customerPhone?.replace(/(.{3}).*(.{2})/, '$1****$2'),
        bookingReference
      });
    }

    const response = {
      success: true,
      messageId: `msg_${Date.now()}`,
      emailSent: true,
      smsSent: !!data.customerPhone,
      attachmentsSent: attachments.length,
      timestamp: new Date().toISOString(),
      message: `Notification de documents envoyée à ${customerName}`,
      details: {
        documentsGenerated: generatedDocuments.map((doc: any) => ({
          type: doc.type,
          filename: doc.filename
        })),
        trigger: trigger,
        reason: reason
      }
    };

    logger.info('✅ Notification de documents envoyée avec succès', {
      messageId: response.messageId,
      attachmentsSent: response.attachmentsSent
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.error('❌ Erreur lors de l\'envoi de notification de documents', error as Error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de l\'envoi de la notification',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}