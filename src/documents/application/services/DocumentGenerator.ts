/**
 * DocumentGenerator - Génération de documents
 * 
 * Responsabilité unique : Génération de documents PDF via DocumentService
 */

import type { PrismaClient } from '@prisma/client';
import { prisma as prismaInstance } from '@/lib/prisma';
import { DocumentService } from './DocumentService';
import { Document, DocumentType } from '../../domain/entities/Document';
import { Booking } from '@/quotation/domain/entities/Booking';
import { QuoteRequest } from '@/quotation/domain/entities/QuoteRequest';
import { DocumentRule } from './DocumentRuleEngine';
import { DocumentRecipient } from './DocumentOrchestrationService';
import { logger } from '@/lib/logger';

export interface GenerationOptions {
  trigger?: any;
  saveToFile?: boolean;
  storageSubDir?: string;
  additionalData?: any;
  forceGeneration?: boolean;
  skipApproval?: boolean;
}

export class DocumentGenerator {
  private logger = logger.withContext('DocumentGenerator');

  constructor(private documentService: DocumentService) {}

  /**
   * Génère un document pour un Booking ou QuoteRequest
   */
  async generateDocument(
    documentType: DocumentType,
    entity: Booking | QuoteRequest,
    options?: GenerationOptions
  ): Promise<{ success: boolean; document?: Document; error?: string }> {
    try {
      const isQuoteRequest = entity instanceof QuoteRequest;
      
      if (isQuoteRequest && documentType === DocumentType.QUOTE) {
        return await this.generateQuoteFromQuoteRequest(entity as QuoteRequest, options);
      }

      if (isQuoteRequest) {
        return {
          success: false,
          error: 'Ce type de document nécessite un Booking, pas un QuoteRequest'
        };
      }

      const booking = entity as Booking;
      const triggerString = options?.trigger?.toString() || 
                           (options?.trigger ? String(options.trigger) : 'BOOKING_CONFIRMED');
      
      const result = await this.documentService.generateDocuments({
        bookingId: booking.getId()!,
        documentTypes: [documentType],
        trigger: triggerString,
        options: {
          saveToFile: options?.saveToFile !== false,
          storageSubDir: options?.storageSubDir,
          additionalData: options?.additionalData || {}
        }
      });

      if (!result.success || result.documents.length === 0) {
        return {
          success: false,
          error: result.error || 'Aucun document généré'
        };
      }

      const generatedDoc = result.documents[0];
      const fs = await import('fs');
      const path = await import('path');
      
      let pdfBuffer: Buffer;
      const filePath = generatedDoc.path;
      
      if (filePath && fs.existsSync(filePath)) {
        pdfBuffer = fs.readFileSync(filePath);
      } else {
        const storagePath = process.env.PDF_STORAGE_PATH || './storage/documents';
        const fullPath = path.isAbsolute(filePath) ? filePath : path.join(storagePath, filePath);
        
        if (fs.existsSync(fullPath)) {
          pdfBuffer = fs.readFileSync(fullPath);
        } else {
          throw new Error(`Fichier PDF non trouvé: ${filePath} (tentative: ${fullPath})`);
        }
      }
      
      const document = new Document(
        booking,
        documentType,
        generatedDoc.filename,
        pdfBuffer
      );

      // Sauvegarder le document en BDD via Prisma
      const { PrismaClient } = await import('@prisma/client');
      const prisma = prismaInstance; // Utiliser l'instance singleton de Prisma

      try {
        const documentId = `doc_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        await prisma.document.create({
          data: {
            id: documentId,
            bookingId: booking.getId()!,
            type: documentType as any,
            filename: generatedDoc.filename,
            content: pdfBuffer
          }
        });

        if (pdfBuffer.length === 0 || pdfBuffer.length <= 361) {
          this.logger.error('PDF généré vide ou suspect', {
            documentId,
            documentType,
            filename: generatedDoc.filename,
            size: pdfBuffer.length,
            bookingId: booking.getId(),
            filePath: generatedDoc.path
          });
          throw new Error(`PDF généré vide ou suspect (${pdfBuffer.length} octets) pour ${generatedDoc.filename}`);
        }
        
      } catch (dbError) {
        this.logger.error('Document généré mais échec sauvegarde BDD', {
          documentType,
          filename: generatedDoc.filename,
          error: dbError instanceof Error ? dbError.message : 'Erreur inconnue'
        });
      } finally {
        // $disconnect() supprimé - singleton géré par lib/prisma
}

      return {
        success: true,
        document
      };

    } catch (error) {
      this.logger.error('Erreur lors de la génération de document', {
        documentType,
        entityId: entity.getId(),
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Génère un devis PDF directement depuis un QuoteRequest
   */
  async generateQuoteFromQuoteRequest(
    quoteRequest: QuoteRequest,
    options?: GenerationOptions
  ): Promise<{ success: boolean; document?: Document; error?: string }> {
    try {
      const quoteData = quoteRequest.getQuoteData();
      const quoteId = quoteRequest.getId() || quoteRequest.getTemporaryId();
      
      const customerInfo = quoteData.additionalInfo || quoteData.customerData || {};
      const customerName = customerInfo.name || `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim() || 'Client';
      const customerEmail = customerInfo.email || '';
      const totalAmount = quoteData.calculatedPrice?.totalPrice || quoteData.totalPrice || 0;
      
      const { RetryableDocumentService } = await import('../../infrastructure/services/RetryableDocumentService');
      const retryableService = new RetryableDocumentService();
      const crypto = await import('crypto');
      
      const pdfBuffer = await retryableService.generateQuoteWithRetry(
        quoteId,
        customerName,
        customerEmail,
        quoteRequest.getType(),
        quoteData.items || [],
        totalAmount,
        quoteRequest.getExpiresAt(),
        `Devis généré automatiquement`
      );

      const { StorageService } = await import('../../infrastructure/services/StorageService');
      const storageService = new StorageService(process.env.PDF_STORAGE_PATH || './storage/documents');
      const filename = `devis_${quoteId.slice(-8)}.pdf`;
      const subDirectory = `quotes/${quoteId.slice(0, 8)}`;
      await storageService.saveFile(pdfBuffer, filename, subDirectory);

      // Créer un Booking temporaire minimal pour Document
      const { Booking, BookingType } = await import('@/quotation/domain/entities/Booking');
      const { Customer } = await import('@/quotation/domain/entities/Customer');
      const { Quote } = await import('@/quotation/domain/entities/Quote');
      const { Money } = await import('@/quotation/domain/valueObjects/Money');
      const { ContactInfo } = await import('@/quotation/domain/valueObjects/ContactInfo');

      const contactInfo = new ContactInfo(
        customerInfo.firstName || customerName.split(' ')[0] || 'Client',
        customerInfo.lastName || customerName.split(' ').slice(1).join(' ') || '',
        customerEmail,
        customerInfo.phone || ''
      );
      const customer = new Customer(crypto.randomUUID(), contactInfo);

      const { QuoteType } = await import('@/quotation/domain/enums/QuoteType');
      // Seul MOVING_QUOTE est actif (services PACKING, SERVICE abandonnés)
      const quoteType = QuoteType.MOVING_QUOTE;
      const bookingType = BookingType.MOVING_QUOTE;
      
      const tempQuote = new Quote({
        id: quoteId,
        type: quoteType,
        status: 'PENDING' as any,
        customer: {
          id: customer.getId()!,
          firstName: contactInfo.getFirstName(),
          lastName: contactInfo.getLastName(),
          email: contactInfo.getEmail(),
          phone: contactInfo.getPhone()
        },
        totalAmount: new Money(totalAmount, 'EUR'),
        createdAt: quoteRequest.getCreatedAt(),
        updatedAt: quoteRequest.getUpdatedAt(),
        hasInsurance: quoteData.hasInsurance || false
      });
      
      const tempBooking = new Booking(
        bookingType,
        customer,
        tempQuote,
        new Money(totalAmount, 'EUR')
      );

      const document = new Document(
        tempBooking,
        DocumentType.QUOTE,
        filename,
        pdfBuffer
      );

      return {
        success: true,
        document
      };

    } catch (error) {
      this.logger.error('Erreur génération devis depuis QuoteRequest', {
        quoteRequestId: quoteRequest.getId() || quoteRequest.getTemporaryId(),
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Génère plusieurs documents en batch selon les règles
   * Retourne un Map organisé par destinataire
   */
  async generateBatch(
    rules: DocumentRule[],
    entity: Booking | QuoteRequest,
    options?: GenerationOptions
  ): Promise<Map<DocumentRecipient, Document[]>> {
    const generatedDocuments = new Map<DocumentRecipient, Document[]>();

    for (const rule of rules) {
      try {
        const result = await this.generateDocument(rule.documentType, entity, {
          ...options,
          trigger: rule.trigger
        });

        if (result.success && result.document) {
          for (const recipient of rule.recipients) {
            if (!generatedDocuments.has(recipient)) {
              generatedDocuments.set(recipient, []);
            }
            generatedDocuments.get(recipient)!.push(result.document!);
          }
        }

      } catch (error) {
        this.logger.error('Erreur lors du traitement de la règle', {
          documentType: rule.documentType,
          trigger: rule.trigger,
          error
        });
      }
    }

    return generatedDocuments;
  }
}

