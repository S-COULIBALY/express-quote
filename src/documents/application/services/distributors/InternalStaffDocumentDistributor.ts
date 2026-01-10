/**
 * InternalStaffDocumentDistributor - Distribution de documents à l'équipe interne
 * 
 * Responsabilité unique : Envoi de documents groupés à l'équipe interne via API
 */

import { Document } from '../../../domain/entities/Document';
import { Booking } from '@/quotation/domain/entities/Booking';
import { QuoteRequest } from '@/quotation/domain/entities/QuoteRequest';
import { DocumentTrigger } from '../DocumentOrchestrationService';
import { logger } from '@/lib/logger';

export class InternalStaffDocumentDistributor {
  private logger = logger.withContext('InternalStaffDocumentDistributor');

  /**
   * Distribue des documents groupés à l'équipe interne
   */
  async distribute(
    documents: Document[],
    entity: Booking | QuoteRequest,
    trigger: DocumentTrigger
  ): Promise<void> {
    // Pour QUOTE_CREATED, on n'envoie pas à l'équipe interne
    if (entity instanceof QuoteRequest) {
      return;
    }

    const booking = entity as Booking;

    try {
      // Identifier les responsables éligibles
      const { InternalStaffService } = await import('@/quotation/application/services/InternalStaffService');
      const internalStaffService = new InternalStaffService();

      const serviceStaff = await internalStaffService.getStaffForBooking(booking.getType());

      let accountingStaff: any[] = [];
      if (trigger === DocumentTrigger.PAYMENT_COMPLETED) {
        accountingStaff = await internalStaffService.getAccountingStaff();
      }

      const allStaff = [...serviceStaff, ...accountingStaff];
      const uniqueStaff = allStaff.filter((staff, index, array) =>
        array.findIndex(s => s.id === staff.id) === index
      );

      if (uniqueStaff.length === 0) {
        this.logger.warn('Aucun responsable interne éligible trouvé');
        return;
      }

      // Préparer les données
      const customer = booking.getCustomer();
      const scheduledDate = booking.getScheduledDate() || new Date();
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.INTERNAL_API_URL || 'http://localhost:3000';

      const locationAddress = (() => {
        const quote = booking.getQuote();
        return (quote as any)?.pickupAddress || booking.getLocation() || 'Adresse à préciser';
      })();

      const deliveryAddress = (() => {
        const quote = booking.getQuote();
        return (quote as any)?.deliveryAddress || undefined;
      })();

      const serviceDate = scheduledDate.toISOString().split('T')[0];
      const serviceTime = scheduledDate.toTimeString().slice(0, 5) || '09:00';
      const serviceAddress = locationAddress || deliveryAddress || 'Adresse à préciser';

      // Préparer tous les attachments en un seul tableau
      const attachments = [];

      for (const document of documents) {
        const pdfContent = document.getContent();
        const pdfSize = pdfContent.length;

        if (pdfSize === 0 || pdfSize <= 361) {
          this.logger.warn('PDF vide ou suspect, ignoré', {
            filename: document.getFilename(),
            size: pdfSize
          });
          continue;
        }

        const base64Content = pdfContent.toString('base64');
        const decodedSize = Buffer.from(base64Content, 'base64').length;

        if (decodedSize !== pdfSize) {
          this.logger.error('Erreur conversion base64, ignoré', {
            filename: document.getFilename()
          });
          continue;
        }

        attachments.push({
          filename: document.getFilename(),
          content: base64Content,
          mimeType: 'application/pdf',
          size: pdfSize
        });
      }

      if (attachments.length === 0) {
        this.logger.error('Aucun document valide à envoyer');
        throw new Error('Aucun document valide disponible');
      }

      // Créer notificationData avec tous les attachments
      const notificationData = {
        bookingId: booking.getId()!,
        bookingReference: `EQ-${booking.getId()?.slice(-8).toUpperCase()}`,
        serviceType: booking.getType() || 'CUSTOM',
        trigger: trigger.toString(),

        serviceDate,
        serviceTime,
        serviceAddress,

        totalAmount: booking.getTotalAmount().getAmount(),
        scheduledDate: scheduledDate.toISOString(),
        scheduledTime: serviceTime,
        locationAddress,
        deliveryAddress,

        customerName: customer.getFullName(),
        customerEmail: customer.getContactInfo().getEmail(),
        customerPhone: customer.getPhone(),

        ...(trigger === DocumentTrigger.PAYMENT_COMPLETED ? {
          amount: booking.getTotalAmount().getAmount(),
          currency: 'EUR',
          paymentMethod: 'card',
          transactionId: `txn_${booking.getId()?.slice(-8)}_${Date.now()}`,
          paymentDate: new Date().toISOString(),
          serviceName: `Service ${booking.getType() || 'CUSTOM'}`,
          viewBookingUrl: `${baseUrl}/bookings/${booking.getId()}`,
          downloadInvoiceUrl: `${baseUrl}/documents/${documents[0].getId()}/download`,
          supportUrl: `${baseUrl}/contact`
        } : {}),

        attachments
      };

      // Déterminer l'API selon le trigger
      let apiEndpoint: string;
      if (trigger === DocumentTrigger.PAYMENT_COMPLETED) {
        apiEndpoint = `${baseUrl}/api/notifications/business/payment-confirmation`;
      } else {
        apiEndpoint = `${baseUrl}/api/notifications/business/internal-staff-booking-confirmation`;
      }

      // Envoyer à chaque membre du staff
      const results = await Promise.allSettled(
        uniqueStaff.map(async (staffMember) => {
          try {
            const response = await fetch(apiEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'DocumentOrchestrationService/1.0'
              },
              body: JSON.stringify({
                email: staffMember.email,
                staffMemberId: staffMember.id,
                firstName: staffMember.firstName,
                lastName: staffMember.lastName,
                role: staffMember.role,
                department: staffMember.department,
                bookingId: notificationData.bookingId,
                bookingReference: notificationData.bookingReference,
                serviceType: notificationData.serviceType,
                serviceDate: notificationData.serviceDate,
                serviceTime: notificationData.serviceTime,
                serviceAddress: notificationData.serviceAddress,
                totalAmount: notificationData.totalAmount,
                customerName: notificationData.customerName,
                customerEmail: notificationData.customerEmail,
                customerPhone: notificationData.customerPhone,
                attachments: notificationData.attachments,
                trigger: notificationData.trigger,
                priority: 'MEDIUM'
              })
            });

            if (!response.ok) {
              throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            await response.json();

            return { success: true, staffMember };

          } catch (error) {
            this.logger.error('Erreur notification responsable interne', {
              staffName: `${staffMember.firstName} ${staffMember.lastName}`,
              error: error instanceof Error ? error.message : 'Erreur inconnue'
            });
            return { success: false, staffMember, error };
          }
        })
      );

      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;

      if (successCount < uniqueStaff.length) {
        this.logger.warn('Certaines notifications équipe interne ont échoué', {
          totalStaff: uniqueStaff.length,
          successCount
        });
      }

    } catch (error) {
      this.logger.error('Erreur globale notifications groupées internes', {
        bookingId: booking.getId(),
        documentsCount: documents.length,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      throw error;
    }
  }
}

