/**
 * AdministrationDocumentDistributor - Distribution de documents à l'administration/comptabilité
 * 
 * Responsabilité unique : Envoi de documents à l'administration et la comptabilité
 */

import { Document } from '../../../domain/entities/Document';
import { Booking } from '@/quotation/domain/entities/Booking';
import { QuoteRequest } from '@/quotation/domain/entities/QuoteRequest';
import { DocumentRecipient, DocumentTrigger } from '../DocumentOrchestrationService';
import { logger } from '@/lib/logger';

export class AdministrationDocumentDistributor {
  private logger = logger.withContext('AdministrationDocumentDistributor');

  /**
   * Distribue des documents à l'administration ou la comptabilité
   */
  async distribute(
    documents: Document[],
    entity: Booking | QuoteRequest,
    recipient: DocumentRecipient,
    trigger: DocumentTrigger
  ): Promise<void> {
    // Pour QUOTE_CREATED, on n'envoie pas à l'administration
    if (entity instanceof QuoteRequest) {
      return;
    }

    const booking = entity as Booking;

    // Pour l'instant, on utilise la méthode standard document par document
    for (const document of documents) {
      await this.distributeSingle(document, booking, recipient, trigger);
    }
  }

  /**
   * Distribue un document unique à l'administration
   */
  private async distributeSingle(
    document: Document,
    booking: Booking,
    recipient: DocumentRecipient,
    trigger: DocumentTrigger
  ): Promise<void> {
    try {
      if (recipient === DocumentRecipient.ACCOUNTING) {
        // Comptabilité → Récupérer les membres de la comptabilité et envoyer les notifications
        const { InternalStaffService } = await import('@/quotation/application/services/InternalStaffService');
        const internalStaffService = new InternalStaffService();
        const accountingStaff = await internalStaffService.getAccountingStaff();

        if (accountingStaff.length === 0) {
          this.logger.warn('Aucun membre de la comptabilité trouvé');
          return;
        }

        // Préparer les données du booking
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

        // Préparer l'attachment du document
        const pdfContent = document.getContent();
        const pdfSize = pdfContent.length;

        if (pdfSize === 0 || pdfSize <= 361) {
          this.logger.warn('PDF vide ou suspect, ignoré', {
            filename: document.getFilename(),
            size: pdfSize
          });
          return;
        }

        const base64Content = pdfContent.toString('base64');
        const attachments = [{
          filename: document.getFilename(),
          content: base64Content,
          mimeType: 'application/pdf',
          size: pdfSize
        }];

        // Envoyer à chaque membre de la comptabilité
        for (const staff of accountingStaff) {
          const response = await fetch(`${baseUrl}/api/notifications/business/internal-staff-booking-confirmation`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'DocumentOrchestrationService/1.0'
            },
            body: JSON.stringify({
              email: staff.email,
              firstName: staff.firstName || 'Équipe',
              lastName: staff.lastName || 'Comptabilité',
              role: staff.role || 'ACCOUNTANT',
              department: 'Accounting',
              staffMemberId: staff.id,
              bookingId: booking.getId(),
              bookingReference: `EQ-${booking.getId()?.slice(-8).toUpperCase()}`,
              serviceType: booking.getType() || 'CUSTOM',
              serviceDate,
              serviceTime,
              serviceAddress,
              totalAmount: booking.getTotalAmount().getAmount(),
              customerName: customer.getFullName(),
              customerEmail: customer.getContactInfo().getEmail(),
              customerPhone: customer.getPhone(),
              attachments,
              trigger: trigger.toString(),
              priority: 'MEDIUM'
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            this.logger.error(`Erreur envoi à ${staff.email}`, {
              status: response.status,
              error: errorText
            });
            continue;
          }

          await response.json();
        }

      } else {
        // ADMIN → Fallback email d'administration
        const adminEmail = process.env.ADMIN_EMAIL;

        if (!adminEmail) {
          this.logger.warn('ADMIN_EMAIL non configuré');
          return;
        }

        // TODO: Implémenter l'envoi direct via service email avec template admin
      }
    } catch (error) {
      this.logger.error('Erreur lors de l\'envoi à l\'administration', {
        recipient,
        documentType: document.getType(),
        error
      });
    }
  }
}

