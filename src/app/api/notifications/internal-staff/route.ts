/**
 * 👥 API pour déclencher les notifications équipe interne
 * POST /api/notifications/internal-staff
 *
 * Responsabilité :
 * - Interface REST pour le service InternalStaffNotificationService
 * - Valide les données d'entrée
 * - Déclenche les notifications avec documents complets
 */

import { NextRequest, NextResponse } from 'next/server';
import { InternalStaffNotificationService } from '@/internalStaffNotification/InternalStaffNotificationService';
import { BookingService } from '@/quotation/application/services/BookingService';
import { logger } from '@/lib/logger';

export interface InternalStaffNotificationRequest {
  bookingId: string;
  trigger: string;
  context?: {
    confirmationDate?: string;
    paymentDate?: string;
    additionalInfo?: any;
  };
}

/**
 * Déclenche les notifications pour l'équipe interne
 */
export async function POST(request: NextRequest) {
  const requestLogger = logger.withContext('InternalStaffNotificationAPI');

  try {
    requestLogger.info('👥 Demande de notification équipe interne');

    const body: InternalStaffNotificationRequest = await request.json();

    // Validation des données requises
    const { bookingId, trigger } = body;
    if (!bookingId || !trigger) {
      return NextResponse.json(
        {
          success: false,
          error: 'Données manquantes (bookingId et trigger requis)'
        },
        { status: 400 }
      );
    }

    // Récupérer la réservation
    const bookingService = new BookingService(
      null, null, null, null, null, null, null, null, null, null, null, null
    );

    const booking = await bookingService.findById(bookingId);
    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: `Réservation non trouvée: ${bookingId}`
        },
        { status: 404 }
      );
    }

    // Préparer le contexte
    const context = body.context ? {
      confirmationDate: body.context.confirmationDate ? new Date(body.context.confirmationDate) : undefined,
      paymentDate: body.context.paymentDate ? new Date(body.context.paymentDate) : undefined,
      additionalInfo: body.context.additionalInfo
    } : undefined;

    requestLogger.info('✅ Validation réussie', {
      bookingId,
      trigger,
      serviceType: booking.getType(),
      hasContext: !!context
    });

    // Déclencher les notifications
    const notificationService = new InternalStaffNotificationService();
    const results = await notificationService.sendInternalStaffNotifications(
      booking,
      trigger,
      context
    );

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    requestLogger.info('🎉 Notifications équipe interne terminées', {
      bookingId,
      trigger,
      totalStaff: results.length,
      successCount,
      errorCount
    });

    return NextResponse.json({
      success: true,
      bookingId,
      trigger,
      results: {
        total: results.length,
        successful: successCount,
        errors: errorCount,
        details: results.map(r => ({
          staffMember: {
            name: `${r.staffMember.firstName} ${r.staffMember.lastName}`,
            role: r.staffMember.role,
            email: r.staffMember.email.replace(/(.{3}).*(@.*)/, '$1***$2')
          },
          success: r.success,
          messageId: r.messageId,
          error: r.error
        }))
      },
      message: `Notifications envoyées à ${successCount}/${results.length} responsables`
    });

  } catch (error) {
    requestLogger.error('❌ Erreur notification équipe interne', {
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

/**
 * Récupère les informations sur le service de notification interne
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      service: 'Internal Staff Notification API',
      version: '1.0',
      features: [
        'Notifications automatiques équipe interne',
        'Documents complets avec données non restreintes',
        'Sélection intelligente selon type de service',
        'Support comptabilité et responsables spécialisés',
        'Utilisation des APIs de génération et notification'
      ],
      triggers: [
        'BOOKING_CONFIRMED',
        'PAYMENT_COMPLETED',
        'SERVICE_STARTED',
        'BOOKING_CANCELLED'
      ],
      recipients: [
        'Responsables par type de service',
        'OPERATIONS_MANAGER (toujours)',
        'ADMIN (toujours)',
        'ACCOUNTING (selon trigger)'
      ]
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération des informations'
    }, { status: 500 });
  }
}