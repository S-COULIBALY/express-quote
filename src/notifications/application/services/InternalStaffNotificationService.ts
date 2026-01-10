/**
 * 👥 SERVICE DE NOTIFICATION ÉQUIPE INTERNE
 * 
 * Service dédié aux notifications pour l'équipe interne.
 * Gère les emails de documents professionnels pour les membres du staff.
 * 
 * ✅ SÉPARATION DES RESPONSABILITÉS : Ce service est uniquement pour l'équipe interne,
 * pas pour les clients (voir CustomerNotificationService).
 */

import { logger } from '@/lib/logger';
import { ProductionNotificationService } from './notification.service.production';
import { getGlobalNotificationService } from '../../interfaces/http/GlobalNotificationService';

export interface InternalStaffBookingConfirmationData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string;
  staffMemberId: string;
  bookingId: string;
  bookingReference: string;
  serviceType: string;
  serviceDate: string;
  serviceTime: string;
  serviceAddress: string;
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  attachments: Array<{
    filename: string;
    content: string; // Base64
    mimeType: string;
    size: number;
  }>;
  trigger?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface InternalStaffNotificationResult {
  success: boolean;
  emailJobId?: string;
  error?: string;
}

export class InternalStaffNotificationService {
  private serviceLogger = logger.withContext('InternalStaffNotificationService');

  /**
   * Obtient le service de notification global (singleton)
   */
  private async getNotificationService(): Promise<ProductionNotificationService> {
    return getGlobalNotificationService();
  }

  /**
   * Envoie une notification de confirmation de réservation à un membre de l'équipe interne
   * Inclut : 1 email avec PDFs groupés (PAS de SMS)
   */
  async sendBookingConfirmation(data: InternalStaffBookingConfirmationData): Promise<InternalStaffNotificationResult> {
    const traceId = `InternalStaffNotification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.serviceLogger.info(`🔍 [TRACE ${traceId}] sendBookingConfirmation appelé`, {
      bookingId: data.bookingId,
      staffEmail: data.email?.replace(/(.{3}).*(@.*)/, '$1***$2'),
      staffName: `${data.firstName} ${data.lastName}`,
      role: data.role,
      attachmentsCount: data.attachments?.length || 0
    });

    try {
      // 1. Normaliser les attachments
      const attachments = await this.normalizeAttachments(data.attachments || []);

      // 2. Déterminer le template (toujours professional-document pour l'équipe interne)
      const template = 'professional-document';

      // 3. Préparer les données du template
      const templateData = {
        professionalName: `${data.firstName} ${data.lastName}`.trim() || data.email,
        role: data.role || 'OPERATIONS_MANAGER',
        department: data.department || 'Operations',
        bookingId: data.bookingId,
        bookingReference: data.bookingReference || data.bookingId || `EQ-${Date.now()}`,
        serviceType: (data.serviceType || 'CUSTOM') as 'MOVING' | 'CLEANING' | 'DELIVERY' | 'CUSTOM',
        serviceName: data.serviceType || 'Service Express Quote',
        totalAmount: data.totalAmount,
        currency: 'EUR',
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone || '',
        serviceDate: data.serviceDate,
        serviceTime: data.serviceTime || '09:00',
        serviceAddress: data.serviceAddress || 'Adresse à préciser',
        trigger: data.trigger || 'BOOKING_CONFIRMED',
        reason: `Réservation confirmée (${data.trigger || 'BOOKING_CONFIRMED'})`,
        priority: (data.priority || 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        attachedDocuments: attachments.map((att: any) => ({
          filename: att.filename,
          type: att.contentType === 'application/pdf' ? 'PDF' : 'OTHER',
          size: att.size || 0
        })),
        viewBookingUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/bookings/${data.bookingId}`,
        planningUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/planning`,
        supportUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/contact`,
        companyName: 'Express Quote',
        supportPhone: process.env.SUPPORT_PHONE || '01 23 45 67 89',
        supportEmail: process.env.SUPPORT_EMAIL || 'support@expressquote.fr'
      };

      // 4. Obtenir le service de notification
      const notificationService = await this.getNotificationService();

      // 5. Envoyer l'email (PAS de SMS pour l'équipe interne)
      let emailResult;
      if (data.email) {
        this.serviceLogger.info(`🔍 [TRACE ${traceId}] Envoi email équipe interne`, {
          to: data.email.replace(/(.{3}).*(@.*)/, '$1***$2'),
          template,
          attachmentsCount: attachments.length,
          staffName: `${data.firstName} ${data.lastName}`
        });

        emailResult = await notificationService.sendEmail({
          to: data.email,
          template: template,
          data: templateData,
          attachments,
          priority: 'HIGH',
          metadata: {
            bookingId: data.bookingId,
            bookingReference: data.bookingReference,
            trigger: data.trigger || 'BOOKING_CONFIRMED',
            source: 'internal-staff-booking-confirmation',
            isInternalStaff: true, // ✅ Explicitement true pour l'équipe interne
            staffMemberId: data.staffMemberId,
            role: data.role,
            department: data.department
          }
        });

        this.serviceLogger.info(`✅ [TRACE ${traceId}] Email équipe interne envoyé`, {
          success: emailResult?.success,
          emailJobId: emailResult?.id
        });
      }

      const success = emailResult?.success ?? false;

      return {
        success,
        emailJobId: emailResult?.id
      };

    } catch (error) {
      this.serviceLogger.error(`❌ [TRACE ${traceId}] Erreur sendBookingConfirmation`, {
        bookingId: data.bookingId,
        staffEmail: data.email,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Normalise les attachments pour le format attendu par le service de notification
   */
  private async normalizeAttachments(attachments: Array<{
    filename: string;
    content: string;
    mimeType?: string;
    size?: number;
  }>): Promise<Array<{
    filename: string;
    content: string;
    contentType: string;
    size: number;
  }>> {
    return attachments.map(att => ({
      filename: att.filename,
      content: att.content,
      contentType: att.mimeType || 'application/pdf',
      size: att.size || Buffer.from(att.content, 'base64').length
    }));
  }
}

