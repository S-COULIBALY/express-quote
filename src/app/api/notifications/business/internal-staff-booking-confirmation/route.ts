/**
 * 👥 API CONFIRMATION DE RÉSERVATION - ÉQUIPE INTERNE
 * Route métier dédiée aux notifications équipe interne avec support des PDFs
 * ✅ SÉPARATION DES RESPONSABILITÉS : Uniquement pour l'équipe interne
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { InternalStaffNotificationService } from '@/notifications/application/services/InternalStaffNotificationService';

const internalStaffNotificationService = new InternalStaffNotificationService();

export async function POST(request: NextRequest) {
  const traceId = `InternalStaffAPI_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  try {
    const body = await request.json();

    logger.info(`🔍 [TRACE ${traceId}] POST /api/notifications/business/internal-staff-booking-confirmation`, {
      bookingId: body.bookingId,
      staffEmail: body.email?.replace(/(.{3}).*(@.*)/, '$1***$2'),
      staffName: `${body.firstName || ''} ${body.lastName || ''}`,
      role: body.role,
      attachments: body.attachments?.length || 0
    });

    // Valider les données requises
    if (!body.email || !body.bookingId || !body.staffMemberId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email, bookingId et staffMemberId sont requis'
        },
        { status: 400 }
      );
    }

    // Appeler le service équipe interne
    const result = await internalStaffNotificationService.sendBookingConfirmation({
      email: body.email,
      firstName: body.firstName || 'Équipe',
      lastName: body.lastName || 'Interne',
      role: body.role || 'OPERATIONS_MANAGER',
      department: body.department || 'Operations',
      staffMemberId: body.staffMemberId,
      bookingId: body.bookingId,
      bookingReference: body.bookingReference || body.bookingId,
      serviceType: body.serviceType || 'CUSTOM',
      serviceDate: body.serviceDate || new Date().toISOString().split('T')[0],
      serviceTime: body.serviceTime || '09:00',
      serviceAddress: body.serviceAddress || 'Adresse à préciser',
      totalAmount: body.totalAmount || 0,
      customerName: body.customerName || 'Client',
      customerEmail: body.customerEmail || body.email,
      customerPhone: body.customerPhone,
      attachments: body.attachments || [],
      trigger: body.trigger || 'BOOKING_CONFIRMED',
      priority: body.priority || 'MEDIUM'
    });

    logger.info(`✅ [TRACE ${traceId}] internal-staff-booking-confirmation terminé`, {
      success: result.success,
      emailJobId: result.emailJobId
    });

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Notification équipe interne ajoutée à la queue' : 'Échec envoi confirmation équipe',
      emailJobId: result.emailJobId || null,
      error: result.error || null
    }, { status: result.success ? 200 : 500 });

  } catch (error) {
    logger.error(`❌ [TRACE ${traceId}] Erreur dans internal-staff-booking-confirmation`, error as Error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors du traitement de la confirmation équipe interne',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

