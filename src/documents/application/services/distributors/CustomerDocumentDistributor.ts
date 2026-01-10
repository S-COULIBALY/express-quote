/**
 * CustomerDocumentDistributor - Distribution de documents aux clients
 * 
 * Responsabilité unique : Envoi de documents groupés aux clients via API
 */

import { Document } from '../../../domain/entities/Document';
import { Booking } from '@/quotation/domain/entities/Booking';
import { QuoteRequest } from '@/quotation/domain/entities/QuoteRequest';
import { DocumentTrigger } from '../DocumentOrchestrationService';
import { logger } from '@/lib/logger';

export class CustomerDocumentDistributor {
  private logger = logger.withContext('CustomerDocumentDistributor');

  /**
   * Distribue des documents groupés au client
   */
  async distribute(
    documents: Document[],
    entity: Booking | QuoteRequest,
    trigger: DocumentTrigger
  ): Promise<void> {
    if (documents.length === 0) {
      this.logger.warn('Aucun document à envoyer au client');
      return;
    }

    const isQuoteRequest = entity instanceof QuoteRequest;

    try {
      let customerEmail: string;
      let customerName: string;
      let customerPhone: string | undefined;
      let entityId: string;
      let entityReference: string;
      let serviceType: string;
      let totalAmount: number;
      let serviceDate: string | undefined;
      let serviceTime: string | undefined;
      let serviceAddress: string | undefined;

      if (isQuoteRequest) {
        const quoteRequest = entity as QuoteRequest;
        const quoteData = quoteRequest.getQuoteData();
        const customerInfo = quoteData.additionalInfo || quoteData.customerData || {};
        customerEmail = customerInfo.email || '';
        customerName = customerInfo.name || `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim() || 'Client';
        customerPhone = customerInfo.phone;
        entityId = quoteRequest.getId() || quoteRequest.getTemporaryId();
        entityReference = `QUOTE-${entityId.slice(-8).toUpperCase()}`;
        serviceType = quoteRequest.getType();
        totalAmount = quoteData.calculatedPrice?.totalPrice || quoteData.totalPrice || 0;
        serviceDate = undefined;
        serviceTime = undefined;
        serviceAddress = undefined;
      } else {
        const booking = entity as Booking;
        const customer = booking.getCustomer();
        if (!customer) {
          throw new Error('Client manquant dans le booking');
        }
        customerEmail = customer.getContactInfo().getEmail();
        customerName = customer.getFullName();
        customerPhone = customer.getPhone();
        entityId = booking.getId()!;
        entityReference = `EQ-${entityId.slice(-8).toUpperCase()}`;
        serviceType = booking.getType();
        totalAmount = booking.getTotalAmount().getAmount();
        serviceDate = booking.getScheduledDate()?.toISOString().split('T')[0];
        serviceTime = booking.getScheduledDate()?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) || '09:00';
        const quote = booking.getQuote();
        serviceAddress = (quote as any)?.pickupAddress || (quote as any)?.deliveryAddress || booking.getLocation() || 'Adresse à préciser';
      }

      if (!customerEmail) {
        throw new Error('Email client manquant');
      }

      // Préparer tous les attachments (PDFs)
      const attachments = documents.map(doc => {
        const content = doc.getContent();
        const pdfSize = content.length;
        
        if (pdfSize === 0 || pdfSize <= 361) {
          this.logger.error('PDF vide ou suspect détecté', {
            filename: doc.getFilename(),
            size: pdfSize
          });
          throw new Error(`PDF vide ou suspect (${pdfSize} octets) pour ${doc.getFilename()}`);
        }

        const base64Content = typeof content === 'string'
          ? content
          : Buffer.from(content).toString('base64');

        return {
          filename: doc.getFilename(),
          content: base64Content,
          mimeType: 'application/pdf',
          size: pdfSize
        };
      });

      // Construire l'URL de l'API client
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.INTERNAL_API_URL || 'http://localhost:3000';
      const apiEndpoint = `${baseUrl}/api/notifications/business/customer-booking-confirmation`;

      // Envoyer 1 email avec tous les PDFs groupés
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DocumentOrchestrationService/1.0'
        },
        body: JSON.stringify({
          email: customerEmail,
          customerName: customerName,
          customerPhone: customerPhone,
          bookingId: isQuoteRequest ? undefined : entityId,
          bookingReference: entityReference,
          serviceType: serviceType,
          serviceDate: serviceDate || new Date().toISOString().split('T')[0],
          serviceTime: serviceTime || '09:00',
          serviceAddress: serviceAddress || 'Adresse à définir',
          totalAmount: totalAmount,
          depositAmount: 0,
          depositPaid: false,
          attachments: attachments,
          attachedDocuments: documents.map(doc => ({
            type: doc.getType(),
            filename: doc.getFilename(),
            size: doc.getContent().length
          }))
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Échec envoi notification client');
      }

    } catch (error) {
      this.logger.error('Erreur envoi groupé client', {
        entityId: isQuoteRequest ? (entity as QuoteRequest).getId() : (entity as Booking).getId(),
        documentsCount: documents.length,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}

