/**
 * 📄 DocumentService - Génération PDF uniquement
 *
 * Responsabilité UNIQUE :
 * - Génère des PDF selon les triggers
 * - Stocke sur disque
 * - RETOURNE chemins fichiers (pas d'envoi)
 *
 * NE FAIT PAS :
 * - Envoi d'emails
 * - Gestion des notifications
 * - Templates React Email
 */

import { PdfGeneratorService } from '../../infrastructure/services/PdfGeneratorService';
import { RetryableDocumentService } from '../../infrastructure/services/RetryableDocumentService';
import { StorageService } from '../../infrastructure/services/StorageService';
import { Document, DocumentType } from '../../domain/entities/Document';
import { Booking } from '@/quotation/domain/entities/Booking';
import { logger } from '@/lib/logger';

// Types pour la génération de documents
export interface DocumentGenerationRequest {
  bookingId: string;
  documentTypes: DocumentType[];
  trigger?: string;
  options?: {
    saveToFile?: boolean;
    storageSubDir?: string;
    additionalData?: Record<string, any>;
  };
}

export interface GeneratedDocument {
  type: DocumentType;
  filename: string;
  path: string;
  size: number;
  mimeType: string;
}

export interface DocumentGenerationResult {
  success: boolean;
  documents: GeneratedDocument[];
  error?: string;
  metadata: {
    bookingId: string;
    trigger?: string;
    generatedAt: Date;
    totalFiles: number;
    totalSize: number;
  };
}

/**
 * Service de génération de documents PDF
 * Responsabilité unique : créer des PDF et les stocker
 */
export class DocumentService {
  private documentLogger = logger.withContext('DocumentService');
  private pdfService: RetryableDocumentService;
  private storageService: StorageService;

  constructor() {
    this.pdfService = new RetryableDocumentService();
    this.storageService = new StorageService(
      process.env.PDF_STORAGE_PATH || './storage/documents'
    );
  }

  /**
   * Génère des documents PDF pour une réservation
   */
  async generateDocuments(request: DocumentGenerationRequest): Promise<DocumentGenerationResult> {
    const startTime = Date.now();

    this.documentLogger.info('📄 Génération de documents PDF', {
      bookingId: request.bookingId,
      documentTypes: request.documentTypes,
      trigger: request.trigger
    });

    try {
      // Récupérer les données de la réservation
      const booking = await this.getBookingData(request.bookingId);

      const generatedDocuments: GeneratedDocument[] = [];
      let totalSize = 0;

      // Générer chaque type de document
      for (const documentType of request.documentTypes) {
        try {
          const document = await this.generateSingleDocument(
            documentType,
            booking,
            request.trigger,
            request.options
          );

          generatedDocuments.push(document);
          totalSize += document.size;

          this.documentLogger.info('✅ Document généré', {
            type: documentType,
            filename: document.filename,
            size: `${Math.round(document.size / 1024)}KB`
          });

        } catch (error) {
          this.documentLogger.error('❌ Erreur génération document', {
            type: documentType,
            bookingId: request.bookingId,
            error: error instanceof Error ? error.message : 'Erreur inconnue'
          });
          // Continue avec les autres documents
        }
      }

      const result: DocumentGenerationResult = {
        success: generatedDocuments.length > 0,
        documents: generatedDocuments,
        metadata: {
          bookingId: request.bookingId,
          trigger: request.trigger,
          generatedAt: new Date(),
          totalFiles: generatedDocuments.length,
          totalSize
        }
      };

      const duration = Date.now() - startTime;
      this.documentLogger.info('🎉 Génération documents terminée', {
        documentsGenerated: generatedDocuments.length,
        totalSize: `${Math.round(totalSize / 1024)}KB`,
        duration: `${duration}ms`
      });

      return result;

    } catch (error) {
      this.documentLogger.error('❌ Erreur génération documents', {
        bookingId: request.bookingId,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });

      return {
        success: false,
        documents: [],
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        metadata: {
          bookingId: request.bookingId,
          trigger: request.trigger,
          generatedAt: new Date(),
          totalFiles: 0,
          totalSize: 0
        }
      };
    }
  }

  /**
   * Génère un seul document PDF
   */
  private async generateSingleDocument(
    documentType: DocumentType,
    booking: any,
    trigger?: string,
    options?: any
  ): Promise<GeneratedDocument> {
    let pdfBuffer: Buffer;
    let filename: string;

    // Générer le PDF selon le type
    switch (documentType) {
      case DocumentType.INVOICE:
        filename = `facture_${booking.reference || booking.id.slice(-8)}.pdf`;
        pdfBuffer = await this.pdfService.generateInvoiceWithRetry(
          booking.reference || booking.id,
          booking.customer.firstName + ' ' + booking.customer.lastName,
          booking.customer.email,
          this.mapBookingToInvoiceItems(booking),
          booking.totalAmount,
          `Facture générée suite à : ${trigger || 'paiement confirmé'}`
        );
        break;

      case DocumentType.PAYMENT_RECEIPT:
        filename = `recu_paiement_${booking.reference || booking.id.slice(-8)}.pdf`;
        pdfBuffer = await this.pdfService.generatePaymentReceiptWithRetry(
          booking.reference || booking.id,
          booking.customer.firstName + ' ' + booking.customer.lastName,
          booking.customer.email,
          booking.totalAmount,
          'Carte bancaire (Stripe)',
          new Date(),
          booking.reference,
          `Reçu généré suite à : ${trigger || 'paiement confirmé'}`
        );
        break;

      case DocumentType.BOOKING_CONFIRMATION:
        filename = `confirmation_${booking.reference || booking.id.slice(-8)}.pdf`;
        pdfBuffer = await this.pdfService.generateBookingConfirmationWithRetry(
          booking.id,
          booking.customer.firstName + ' ' + booking.customer.lastName,
          booking.serviceType || 'Service Express Quote',
          booking.scheduledDate,
          booking.totalAmount,
          booking.professional?.name,
          `Confirmation générée suite à : ${trigger || 'réservation confirmée'}`
        );
        break;

      default:
        throw new Error(`Type de document non supporté: ${documentType}`);
    }

    // Sauvegarder le fichier
    const subDirectory = `bookings/${booking.id.slice(0, 8)}`;
    const filePath = await this.storageService.saveFile(
      pdfBuffer,
      filename,
      subDirectory
    );

    return {
      type: documentType,
      filename,
      path: filePath,
      size: pdfBuffer.length,
      mimeType: 'application/pdf'
    };
  }

  /**
   * Récupère les données de réservation (à adapter selon votre architecture)
   */
  private async getBookingData(bookingId: string): Promise<any> {
    // À implémenter selon votre repository
    // Pour l'instant, simulation
    return {
      id: bookingId,
      reference: `EQ-${bookingId.slice(-8).toUpperCase()}`,
      customer: {
        firstName: 'Client',
        lastName: 'Test',
        email: 'client@example.com'
      },
      totalAmount: 350.00,
      serviceType: 'Déménagement',
      scheduledDate: new Date(),
      professional: null
    };
  }

  /**
   * Mappe une réservation vers des items de facture
   */
  private mapBookingToInvoiceItems(booking: any): Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }> {
    return [{
      description: booking.serviceType || 'Service Express Quote',
      quantity: 1,
      unitPrice: booking.totalAmount,
      total: booking.totalAmount
    }];
  }

  /**
   * Détermine quels documents générer selon le trigger
   */
  static getDocumentTypesForTrigger(trigger: string): DocumentType[] {
    switch (trigger) {
      case 'PAYMENT_COMPLETED':
        return [
          DocumentType.INVOICE,
          DocumentType.PAYMENT_RECEIPT,
          DocumentType.BOOKING_CONFIRMATION
        ];

      case 'BOOKING_CONFIRMED':
        return [
          DocumentType.BOOKING_CONFIRMATION
        ];

      case 'QUOTE_CREATED':
        return [
          DocumentType.QUOTE
        ];

      default:
        return [DocumentType.BOOKING_CONFIRMATION];
    }
  }
}

export default DocumentService;