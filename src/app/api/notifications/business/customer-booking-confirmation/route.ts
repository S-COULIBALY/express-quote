/**
 * 🎯 API CONFIRMATION DE RÉSERVATION - CLIENT
 * Route métier dédiée aux notifications client avec support des PDFs
 * ✅ SÉPARATION DES RESPONSABILITÉS : Uniquement pour les clients
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { CustomerNotificationService } from '@/notifications/application/services/CustomerNotificationService';

const customerNotificationService = new CustomerNotificationService();

export async function POST(request: NextRequest) {
  const traceId = `CustomerAPI_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  try {
    const body = await request.json();

    logger.info(`🔍 [TRACE ${traceId}] POST /api/notifications/business/customer-booking-confirmation`, {
      bookingId: body.bookingId,
      customerEmail: body.email?.replace(/(.{3}).*(@.*)/, '$1***$2'),
      customerPhone: body.customerPhone ? `${body.customerPhone.substring(0, 3)}***` : 'N/A',
      attachments: body.attachments?.length || 0
    });

    // Valider les données requises
    if (!body.email || !body.bookingId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email et bookingId sont requis'
        },
        { status: 400 }
      );
    }

    // Appeler le service client
    const result = await customerNotificationService.sendBookingConfirmation({
      email: body.email,
      customerName: body.customerName || 'Client',
      customerPhone: body.customerPhone,
      bookingId: body.bookingId,
      bookingReference: body.bookingReference || body.bookingId,
      serviceType: body.serviceType || 'CUSTOM',
      serviceDate: body.serviceDate || new Date().toISOString().split('T')[0],
      serviceTime: body.serviceTime || '09:00',
      serviceAddress: body.serviceAddress || 'Adresse à préciser',
      totalAmount: body.totalAmount || 0,
      depositAmount: body.depositAmount || 0,
      depositPaid: body.depositPaid ?? true,
      attachments: body.attachments || [],
      attachedDocuments: body.attachedDocuments || []
    });

    logger.info(`✅ [TRACE ${traceId}] customer-booking-confirmation terminé`, {
      success: result.success,
      emailJobId: result.emailJobId,
      smsJobId: result.smsJobId
    });

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Notifications client ajoutées à la queue' : 'Échec envoi confirmation client',
      emailJobId: result.emailJobId || null,
      smsJobId: result.smsJobId || null,
      error: result.error || null
    }, { status: result.success ? 200 : 500 });

  } catch (error) {
    logger.error(`❌ [TRACE ${traceId}] Erreur dans customer-booking-confirmation`, error as Error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors du traitement de la confirmation client',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

