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
   * Envoie une notification individuelle via l'API appropriée
   */
  private async sendIndividualNotification(
    staffMember: InternalStaffMember,
    notificationData: InternalStaffNotificationData,
    documents: any[]
  ): Promise<NotificationResult> {
    try {
      // Déterminer l'API selon le trigger
      const apiEndpoint = this.getNotificationEndpoint(notificationData.trigger);

      // Préparer les pièces jointes
      const attachments = documents.map(doc => ({
        filename: doc.filename,
        content: doc.base64Content || doc.content,
        contentType: doc.mimeType || 'application/pdf',
        size: doc.size
      }));

      // Payload spécifique pour équipe interne
      const requestBody = {
        // Destinataire
        email: staffMember.email,
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

        // Données client (accès complet)
        customerName: notificationData.fullClientData.customerName,
        customerEmail: notificationData.fullClientData.customerEmail,
        customerPhone: notificationData.fullClientData.customerPhone,

        // Context
        trigger: notificationData.trigger,
        reason: notificationData.reason,
        isInternalStaff: true, // Flag pour template spécialisé

        // Documents
        attachments
      };

      const response = await fetch(`${this.baseUrl}/api/notifications/business/${apiEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'InternalStaffNotificationService/1.0'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      return {
        success: true,
        staffMember,
        messageId: result.messageId || result.id
      };

    } catch (error) {
      return {
        success: false,
        staffMember,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
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