/**
 * API pour envoyer des notifications à la comptabilité
 * Avec documents comptables PDF en pièces jointes
 */
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    logger.info('💰 API notification comptabilité appelée', {
      recipient: data.accountingEmail?.replace(/(.{3}).*(@.*)/, '$1***$2'),
      attachments: data.attachments?.length || 0,
      bookingId: data.bookingId,
      amount: data.totalAmount
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

    // Déterminer le type de notification comptable selon les documents
    const hasInvoice = data.documentTypes?.includes('INVOICE');
    const hasPaymentReceipt = data.documentTypes?.includes('PAYMENT_RECEIPT');
    const hasQuote = data.documentTypes?.includes('QUOTE');
    
    let subject = '📊 Nouveaux documents comptables';
    if (hasPaymentReceipt) {
      subject = `💳 Paiement confirmé - ${data.bookingReference} - ${data.totalAmount}€`;
    } else if (hasInvoice) {
      subject = `🧾 Nouvelle facture - ${data.bookingReference} - ${data.totalAmount}€`;
    } else if (hasQuote) {
      subject = `📋 Nouveau devis confirmé - ${data.bookingReference}`;
    }

    // Envoyer l'email comptable avec template spécialisé
    const result = await notificationSystem.sendEmail({
      to: data.accountingEmail,
      subject: subject,
      template: 'AccountingDocuments', // Template React Email à créer
      data: {
        // Données comptable
        accountingName: data.accountingName,
        
        // Données financières
        bookingId: data.bookingId,
        bookingReference: data.bookingReference,
        serviceType: data.serviceType,
        totalAmount: data.totalAmount,
        currency: data.currency || 'EUR',
        
        // Données client
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        
        // Dates comptables
        bookingDate: data.bookingDate,
        paymentDate: data.paymentDate,
        
        // Documents comptables
        documentsCount: data.documentsCount,
        documentTypes: data.documentTypes,
        attachedDocuments: data.attachedDocuments,
        
        // Contexte
        trigger: data.trigger,
        reason: data.reason,
        
        // Indicateurs comptables
        hasInvoice,
        hasPaymentReceipt,
        hasQuote,
        
        // URLs utiles
        viewBookingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/bookings/${data.bookingId}`,
        accountingDashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/accounting`,
        downloadAllUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/bookings/${data.bookingId}/documents/download`,
        
        // Informations entreprise
        companyName: 'Express Quote',
        companyAddress: process.env.COMPANY_ADDRESS || '123 Avenue des Services, 75001 Paris',
        companyPhone: process.env.COMPANY_PHONE || '01 23 45 67 89',
        siretNumber: process.env.SIRET_NUMBER || 'XXX XXX XXX XXXXX',
        vatNumber: process.env.VAT_NUMBER || 'FR XX XXX XXX XXX'
      },
      attachments: attachments
    });

    logger.info('✅ Notification comptabilité envoyée avec succès', {
      recipient: data.accountingEmail?.replace(/(.{3}).*(@.*)/, '$1***$2'),
      messageId: result?.messageId,
      attachments: attachments.length,
      amount: data.totalAmount
    });

    return NextResponse.json({
      success: true,
      messageId: result?.messageId || 'sent',
      attachments: attachments.length,
      amount: data.totalAmount,
      documentsCount: data.documentsCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Erreur lors de l\'envoi de notification comptabilité:', error);
    
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