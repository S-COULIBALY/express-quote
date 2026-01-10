/**
 * 🎯 SERVICE DE NOTIFICATION CLIENT
 * 
 * Service dédié aux notifications pour les clients finaux.
 * Gère les emails et SMS de confirmation de réservation pour les clients.
 * 
 * ✅ SÉPARATION DES RESPONSABILITÉS : Ce service est uniquement pour les clients,
 * pas pour l'équipe interne (voir InternalStaffNotificationService).
 */

import { logger } from '@/lib/logger';
import { ProductionNotificationService } from './notification.service.production';
import { getGlobalNotificationService } from '../../interfaces/http/GlobalNotificationService';
import { PhoneNormalizationService } from '@/utils/phone-normalization';

export interface CustomerBookingConfirmationData {
  email: string;
  customerName: string;
  customerPhone?: string;
  bookingId: string;
  bookingReference: string;
  serviceType: string;
  serviceDate: string;
  serviceTime: string;
  serviceAddress: string;
  totalAmount: number;
  depositAmount?: number;
  depositPaid?: boolean;
  attachments?: Array<{
    filename: string;
    content: string; // Base64
    mimeType: string;
    size: number;
  }>;
  attachedDocuments?: Array<{
    type: string;
    filename: string;
    size: number;
  }>;
}

export interface CustomerNotificationResult {
  success: boolean;
  emailJobId?: string;
  smsJobId?: string;
  error?: string;
}

export class CustomerNotificationService {
  private serviceLogger = logger.withContext('CustomerNotificationService');

  /**
   * Obtient le service de notification global (singleton)
   */
  private async getNotificationService(): Promise<ProductionNotificationService> {
    return getGlobalNotificationService();
  }

  /**
   * Envoie une notification de confirmation de réservation au client
   * Inclut : 1 email avec PDFs groupés + 1 SMS de confirmation
   */
  async sendBookingConfirmation(data: CustomerBookingConfirmationData): Promise<CustomerNotificationResult> {
    const traceId = `CustomerNotification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.serviceLogger.info(`🔍 [TRACE ${traceId}] sendBookingConfirmation appelé`, {
      bookingId: data.bookingId,
      customerEmail: data.email?.replace(/(.{3}).*(@.*)/, '$1***$2'),
      hasPhone: !!data.customerPhone,
      attachmentsCount: data.attachments?.length || 0
    });

    try {
      // 1. Normaliser les attachments
      const attachments = await this.normalizeAttachments(data.attachments || []);

      // 2. Déterminer le template (toujours booking-confirmation pour les clients)
      const template = 'booking-confirmation';

      // 3. Préparer les données du template
      const templateData = {
        customerName: data.customerName,
        bookingId: data.bookingId,
        bookingReference: data.bookingReference,
        serviceType: data.serviceType,
        serviceName: `Service ${data.serviceType || 'CUSTOM'}`,
        serviceDate: data.serviceDate,
        serviceTime: data.serviceTime,
        serviceAddress: data.serviceAddress,
        totalAmount: data.totalAmount,
        depositAmount: data.depositAmount || 0,
        depositPaid: data.depositPaid ?? true,
        currency: 'EUR',
        viewBookingUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/bookings/${data.bookingId}`,
        supportUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/contact`,
        companyName: 'Express Quote'
      };

      // 4. Obtenir le service de notification
      const notificationService = await this.getNotificationService();

      // 5. Envoyer l'email
      let emailResult;
      if (data.email) {
        this.serviceLogger.info(`🔍 [TRACE ${traceId}] Envoi email client`, {
          to: data.email.replace(/(.{3}).*(@.*)/, '$1***$2'),
          template,
          attachmentsCount: attachments.length
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
            trigger: 'BOOKING_CONFIRMED',
            source: 'customer-booking-confirmation',
            isInternalStaff: false // ✅ Explicitement false pour les clients
          }
        });

        this.serviceLogger.info(`✅ [TRACE ${traceId}] Email client envoyé`, {
          success: emailResult?.success,
          emailJobId: emailResult?.id
        });
      }

      // 6. Envoyer le SMS (si téléphone fourni)
      let smsResult;
      if (data.customerPhone) {
        // ✅ NORMALISATION E.164 : Convertir le numéro au format international
        // Exemples : "0751262080" → "+33751262080", "0033751262080" → "+33751262080"
        const normalizedPhone = PhoneNormalizationService.normalizeToE164(data.customerPhone);

        if (!normalizedPhone) {
          this.serviceLogger.warn(`⚠️ [TRACE ${traceId}] Numéro de téléphone invalide, SMS ignoré`, {
            originalPhone: data.customerPhone,
            bookingId: data.bookingId
          });
        } else {
          this.serviceLogger.info(`🔍 [TRACE ${traceId}] Envoi SMS client`, {
            phone: `${normalizedPhone.substring(0, 3)}***`,
            originalPhone: `${data.customerPhone.substring(0, 3)}***`,
            normalized: normalizedPhone !== data.customerPhone,
            bookingId: data.bookingId
          });

          smsResult = await notificationService.sendBookingConfirmationSMS(normalizedPhone, {
            customerName: data.customerName,
            bookingId: data.bookingId,
            serviceDate: data.serviceDate,
            serviceTime: data.serviceTime,
            totalAmount: data.totalAmount,
            serviceType: data.serviceType
          });

          this.serviceLogger.info(`✅ [TRACE ${traceId}] SMS client envoyé`, {
            success: smsResult?.success,
            smsJobId: smsResult?.id,
            normalizedPhone: `${normalizedPhone.substring(0, 3)}***`
          });
        }
      }

      const success = (emailResult?.success ?? true) && (smsResult ? smsResult.success : true);

      return {
        success,
        emailJobId: emailResult?.id,
        smsJobId: smsResult?.id
      };

    } catch (error) {
      this.serviceLogger.error(`❌ [TRACE ${traceId}] Erreur sendBookingConfirmation`, {
        bookingId: data.bookingId,
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

