/**
 * API pour envoyer des notifications aux responsables internes (professionnels)
 * Avec documents PDF en pièces jointes
 */
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    logger.info('📧 API notification professionnel appelée', {
      recipient: data.professionalEmail?.replace(/(.{3}).*(@.*)/, '$1***$2'),
      role: data.role,
      attachments: data.attachments?.length || 0,
      bookingId: data.bookingId
    });

    // Récupérer le système de notifications
    const notificationSystem = await getNotificationSystem();
    if (!notificationSystem) {
      logger.warn('⚠️ Système de notifications non disponible');
      return NextResponse.json(
        { success: false, error: 'Système de notifications indisponible' },
        { status: 503 }
      );
    }

    // Préparer les pièces jointes (conversion base64 vers Buffer)
    const attachments = data.attachments?.map((att: any) => ({
      filename: att.filename,
      content: Buffer.from(att.content, 'base64'),
      contentType: att.mimeType || 'application/pdf'
    })) || [];

    // Envoyer l'email au responsable avec template spécialisé
    const result = await notificationSystem.sendEmail({
      to: data.professionalEmail,
      subject: `📋 Nouvelle intervention ${data.serviceType} - ${data.bookingReference}`,
      template: 'ProfessionalDocument', // Template React Email à créer
      data: {
        // Données responsable
        professionalName: data.professionalName,
        role: data.role,
        department: data.department,
        
        // Données intervention
        bookingId: data.bookingId,
        bookingReference: data.bookingReference,
        serviceType: data.serviceType,
        totalAmount: data.totalAmount,
        
        // Données client
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        
        // Données service
        serviceDate: data.serviceDate,
        serviceTime: data.serviceTime,
        serviceAddress: data.serviceAddress,
        
        // Contexte
        trigger: data.trigger,
        reason: data.reason,
        
        // Documents
        attachedDocuments: data.attachedDocuments,
        
        // URLs utiles
        viewBookingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/bookings/${data.bookingId}`,
        planningUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/planning`,
        
        // Informations entreprise
        companyName: 'Express Quote',
        supportPhone: process.env.SUPPORT_PHONE || '01 23 45 67 89',
        supportEmail: process.env.SUPPORT_EMAIL || 'support@expressquote.fr'
      },
      attachments: attachments
    });

    logger.info('✅ Notification professionnel envoyée avec succès', {
      recipient: data.professionalEmail?.replace(/(.{3}).*(@.*)/, '$1***$2'),
      messageId: result?.messageId,
      attachments: attachments.length
    });

    return NextResponse.json({
      success: true,
      messageId: result?.messageId || 'sent',
      attachments: attachments.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Erreur lors de l\'envoi de notification professionnel:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Récupère le système de notifications
 */
async function getNotificationSystem() {
  try {
    const { default: NotificationSystem } = await import('@/notifications');
    return await NotificationSystem.initialize();
  } catch (error) {
    console.warn('⚠️ Système de notifications non disponible:', error);
    return null;
  }
}