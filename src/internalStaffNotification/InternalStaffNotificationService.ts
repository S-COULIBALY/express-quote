// @ts-nocheck
/**
 * 👥 Service de notification spécialisé pour l'équipe interne
 *
 * Responsabilités :
 * - Identifier les responsables internes éligibles selon le type de service
 * - Générer des documents complets (données non restreintes)
 * - Envoyer notifications via les APIs appropriées
 * - Gérer les préférences de notification par responsable
 */

import { Booking } from '@/quotation/domain/entities/Booking';
import { InternalStaffService, InternalStaffMember } from '@/quotation/application/services/InternalStaffService';
import { logger } from '@/lib/logger';
import { getGlobalNotificationService } from '@/notifications/interfaces/http/GlobalNotificationService';

export interface InternalStaffNotificationData {
  bookingId: string;
  bookingReference: string;
  serviceType: string;
  trigger: string;

  // Données complètes (équipe interne a accès à tout)
  fullBookingData: {
    totalAmount: number;
    scheduledDate: string;
    scheduledTime?: string;
    locationAddress: string;
    deliveryAddress?: string;
    priority: 'normal' | 'high' | 'urgent';
    additionalInfo?: any;
  };

  // Données client complètes
  fullClientData: {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    customerAdditionalInfo?: string;
  };

  // Context
  reason: string;
  confirmationDate?: string;
  paymentDate?: string;
}

export interface NotificationResult {
  success: boolean;
  staffMember: InternalStaffMember;
  messageId?: string;
  error?: string;
}

/**
 * Service spécialisé pour les notifications équipe interne
 */
export class InternalStaffNotificationService {
  private notificationLogger = logger.withContext('InternalStaffNotificationService');
  private internalStaffService: InternalStaffService;
  private baseUrl: string;

  constructor() {
    this.internalStaffService = new InternalStaffService();
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.INTERNAL_API_URL || 'http://localhost:3000';
  }

  /**
   * Envoie des notifications à l'équipe interne avec documents complets
   */
  async sendInternalStaffNotifications(
    booking: Booking,
    trigger: string,
    context?: {
      confirmationDate?: Date;
      paymentDate?: Date;
      additionalInfo?: any;
    }
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    this.notificationLogger.info('👥 Démarrage notifications équipe interne', {
      bookingId: booking.getId(),
      serviceType: booking.getType(),
      trigger
    });

    try {
      // 1. Identifier les responsables éligibles
      const eligibleStaff = await this.getEligibleStaff(booking, trigger);

      if (eligibleStaff.length === 0) {
        this.notificationLogger.warn('⚠️ Aucun responsable interne éligible trouvé', {
          bookingType: booking.getType(),
          trigger
        });
        return results;
      }

      // 2. Générer les documents complets via API
      const documentsResult = await this.generateInternalDocuments(booking, trigger);

      // 3. Préparer les données complètes pour notifications
      const notificationData = this.prepareNotificationData(booking, trigger, context);

      // 4. Envoyer notifications individuelles
      for (const staffMember of eligibleStaff) {
        try {
          const result = await this.sendIndividualNotification(
            staffMember,
            notificationData,
            documentsResult.documents || []
          );

          results.push(result);

          this.notificationLogger.info('✅ Notification interne envoyée', {
            staffName: `${staffMember.firstName} ${staffMember.lastName}`,
            role: staffMember.role,
            email: this.maskEmail(staffMember.email),
            success: result.success
          });

        } catch (staffError) {
          const errorResult: NotificationResult = {
            success: false,
            staffMember,
            error: staffError instanceof Error ? staffError.message : 'Erreur inconnue'
          };

          results.push(errorResult);

          this.notificationLogger.error('❌ Erreur notification responsable interne', {
            staffName: `${staffMember.firstName} ${staffMember.lastName}`,
            role: staffMember.role,
            error: staffError
          });
        }
      }

      this.notificationLogger.info('🎉 Notifications équipe interne terminées', {
        totalStaff: eligibleStaff.length,
        successCount: results.filter(r => r.success).length,
        errorCount: results.filter(r => !r.success).length
      });

    } catch (error) {
      this.notificationLogger.error('❌ Erreur globale notifications internes', {
        bookingId: booking.getId(),
        trigger,
        error
      });
    }

    return results;
  }

  /**
   * Identifie les responsables internes éligibles
   */
  private async getEligibleStaff(booking: Booking, trigger: string): Promise<InternalStaffMember[]> {
    // Responsables selon le type de service
    const serviceStaff = await this.internalStaffService.getStaffForBooking(booking.getType());

    // Ajouter comptabilité pour les triggers de paiement
    let accountingStaff: InternalStaffMember[] = [];
    if (trigger === 'PAYMENT_COMPLETED') {
      accountingStaff = await this.internalStaffService.getAccountingStaff();
    }

    // Combiner et dédupliquer
    const allStaff = [...serviceStaff, ...accountingStaff];
    const uniqueStaff = allStaff.filter((staff, index, array) =>
      array.findIndex(s => s.id === staff.id) === index
    );

    this.notificationLogger.info('👥 Responsables identifiés', {
      serviceStaff: serviceStaff.length,
      accountingStaff: accountingStaff.length,
      uniqueTotal: uniqueStaff.length,
      trigger
    });

    return uniqueStaff;
  }

  /**
   * Génère les documents complets via l'API
   */
  private async generateInternalDocuments(booking: Booking, trigger: string): Promise<{ success: boolean; documents?: any[] }> {
    try {
      this.notificationLogger.info('📄 Génération documents pour équipe interne', {
        bookingId: booking.getId(),
        trigger
      });

      const documentsResponse = await fetch(`${this.baseUrl}/api/documents/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'InternalStaffNotificationService/1.0'
        },
        body: JSON.stringify({
          bookingId: booking.getId(),
          trigger: trigger,
          targetAudience: 'INTERNAL_STAFF' // Indique que c'est pour l'équipe interne
        })
      });

      if (!documentsResponse.ok) {
        throw new Error(`Erreur génération documents: ${documentsResponse.status}`);
      }

      const result = await documentsResponse.json();

      this.notificationLogger.info('✅ Documents générés avec succès', {
        documentsCount: result.documents?.length || 0,
        success: result.success
      });

      return result;

    } catch (error) {
      this.notificationLogger.error('❌ Erreur génération documents internes', {
        bookingId: booking.getId(),
        trigger,
        error
      });

      return { success: false };
    }
  }

  /**
   * Prépare les données complètes pour notifications
   */
  private prepareNotificationData(
    booking: Booking,
    trigger: string,
    context?: any
  ): InternalStaffNotificationData {
    const customer = booking.getCustomer();
    const scheduledDate = booking.getScheduledDate() || new Date();

    return {
      bookingId: booking.getId()!,
      bookingReference: booking.getReference() || `EQ-${booking.getId()?.slice(-8).toUpperCase()}`,
      serviceType: booking.getType() || 'CUSTOM',
      trigger,

      // Données booking complètes (accès total pour équipe interne)
      fullBookingData: {
        totalAmount: booking.getTotalAmount().getAmount(),
        scheduledDate: scheduledDate.toISOString(),
        scheduledTime: '09:00', // TODO: extraire du booking
        locationAddress: booking.getLocationAddress() || 'Adresse à préciser',
        deliveryAddress: booking.getDeliveryAddress(),
        priority: this.determinePriority(scheduledDate),
        additionalInfo: booking.getAdditionalInfo()
      },

      // Données client complètes (accès total pour équipe interne)
      fullClientData: {
        customerName: `${customer.getFirstName()} ${customer.getLastName()}`,
        customerEmail: customer.getContactInfo().getEmail(),
        customerPhone: customer.getPhone(),
        customerAdditionalInfo: context?.additionalInfo
      },

      // Context
      reason: `Notification équipe interne suite à: ${trigger}`,
      confirmationDate: context?.confirmationDate?.toISOString(),
      paymentDate: context?.paymentDate?.toISOString()
    };
  }

  /**
   * Envoie une notification individuelle via le système de queue
   * ✅ INTÉGRÉ AVEC SYSTÈME DE QUEUE BULLMQ
   */
  private async sendIndividualNotification(
    staffMember: InternalStaffMember,
    notificationData: InternalStaffNotificationData,
    documents: any[]
  ): Promise<NotificationResult> {
    try {
      // ✅ Obtenir le service de notification avec queue
      const notificationService = await getGlobalNotificationService();

      // Préparer les pièces jointes pour le service
      const attachments = documents.map(doc => ({
        filename: doc.filename,
        content: doc.base64Content ? Buffer.from(doc.base64Content, 'base64') : doc.content,
        path: doc.path, // Si le fichier est déjà sur le disque
        contentType: doc.mimeType || 'application/pdf',
        size: doc.size
      })).filter(att => att.content || att.path); // Filtrer les attachments valides

      // Déterminer le template selon le trigger
      const template = this.getTemplateForTrigger(notificationData.trigger);

      this.notificationLogger.info('📧 Ajout notification équipe interne à la queue', {
        staffEmail: this.maskEmail(staffMember.email),
        role: staffMember.role,
        template,
        attachmentsCount: attachments.length
      });

      // ✅ Ajouter à la queue email avec pièces jointes
      const result = await notificationService.sendEmail({
        to: staffMember.email,
        template: template,
        data: {
          // Destinataire
          professionalName: `${staffMember.firstName} ${staffMember.lastName}`,
          role: staffMember.role,
          department: staffMember.department,

          // Données booking (accès complet)
          bookingId: notificationData.bookingId,
          bookingReference: notificationData.bookingReference,
          serviceType: notificationData.serviceType,
          totalAmount: notificationData.fullBookingData.totalAmount,
          serviceDate: notificationData.fullBookingData.scheduledDate,
          serviceTime: notificationData.fullBookingData.scheduledTime,
          serviceAddress: notificationData.fullBookingData.locationAddress,
          deliveryAddress: notificationData.fullBookingData.deliveryAddress,
          priority: notificationData.fullBookingData.priority,

          // Données client (accès complet)
          customerName: notificationData.fullClientData.customerName,
          customerEmail: notificationData.fullClientData.customerEmail,
          customerPhone: notificationData.fullClientData.customerPhone,
          customerAdditionalInfo: notificationData.fullClientData.customerAdditionalInfo,

          // Context
          trigger: notificationData.trigger,
          reason: notificationData.reason,
          confirmationDate: notificationData.confirmationDate,
          paymentDate: notificationData.paymentDate,
          isInternalStaff: true // Flag pour template spécialisé
        },
        attachments: attachments,
        priority: this.getPriorityForTrigger(notificationData.trigger),
        metadata: {
          bookingId: notificationData.bookingId,
          staffMemberId: staffMember.id,
          role: staffMember.role,
          department: staffMember.department,
          trigger: notificationData.trigger,
          source: 'internal-staff-notification'
        }
      });

      return {
        success: result.success,
        staffMember,
        messageId: result.id,
        error: result.error
      };

    } catch (error) {
      this.notificationLogger.error('❌ Erreur lors de l\'ajout notification équipe interne à la queue', {
        staffEmail: this.maskEmail(staffMember.email),
        role: staffMember.role,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined
      });

      return {
        success: false,
        staffMember,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Détermine le template selon le trigger
   */
  private getTemplateForTrigger(trigger: string): string {
    switch (trigger) {
      case 'BOOKING_CONFIRMED':
        return 'professional-document';
      case 'PAYMENT_COMPLETED':
        return 'accounting-documents';
      case 'SERVICE_STARTED':
        return 'professional-document';
      default:
        return 'professional-document';
    }
  }

  /**
   * Détermine la priorité selon le trigger
   */
  private getPriorityForTrigger(trigger: string): 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW' {
    switch (trigger) {
      case 'PAYMENT_COMPLETED':
        return 'HIGH'; // Paiements sont prioritaires
      case 'SERVICE_STARTED':
        return 'URGENT'; // Services en cours sont urgents
      default:
        return 'NORMAL';
    }
  }

  /**
   * Détermine l'endpoint API selon le trigger
   */
  private getNotificationEndpoint(trigger: string): string {
    switch (trigger) {
      case 'BOOKING_CONFIRMED':
        return 'booking-confirmation';
      case 'PAYMENT_COMPLETED':
        return 'payment-confirmation';
      case 'SERVICE_STARTED':
        return 'service-reminder';
      default:
        return 'booking-confirmation'; // Fallback
    }
  }

  /**
   * Détermine la priorité selon la date de service
   */
  private determinePriority(serviceDate: Date): 'normal' | 'high' | 'urgent' {
    const hoursUntilService = (serviceDate.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilService < 24) return 'urgent';
    if (hoursUntilService < 72) return 'high';
    return 'normal';
  }

  /**
   * Masque l'email pour les logs
   */
  private maskEmail(email: string): string {
    return email.replace(/(.{3}).*(@.*)/, '$1***$2');
  }
}

export default InternalStaffNotificationService;