import { DocumentService } from './DocumentService';
import { DocumentOrchestrationService, DocumentRecipient } from './DocumentOrchestrationService';
import { Document, DocumentType } from '../../domain/entities/Document';
import { Booking } from '@/quotation/domain/entities/Booking';
import { Customer } from '@/quotation/domain/entities/Customer';
import { InternalStaffMember } from '@/quotation/application/services/InternalStaffService';
import { logger } from '@/lib/logger';

// Structure d'une pièce jointe PDF
export interface PDFAttachment {
  filename: string;
  content: Buffer;
  mimeType: string;
  documentId: string;
  documentType: DocumentType;
}

// Interface pour l'envoi de notifications avec pièces jointes
export interface NotificationWithAttachments {
  email: string;
  customerName: string;
  bookingId: string;
  templateType: 'booking-confirmation' | 'payment-confirmation' | 'document-generated';
  data: any;
  attachments: PDFAttachment[];
}

/**
 * Service spécialisé dans l'envoi de notifications avec documents PDF en pièces jointes
 * Fait le lien entre le système de documents et le système de notifications
 */
export class DocumentNotificationService {
  private notificationLogger = logger.withContext('DocumentNotification');
  private documentService: DocumentService;

  constructor(documentService?: DocumentService) {
    this.documentService = documentService || new DocumentService();
  }

  /**
   * Envoie une notification de confirmation avec les documents générés automatiquement
   */
  async sendBookingConfirmationWithDocuments(
    booking: Booking,
    customer: Customer,
    context: {
      sessionId: string;
      totalAmount: number;
      quoteData: any;
      generatedDocuments?: Document[];
    }
  ): Promise<void> {
    this.notificationLogger.info('📧 Envoi de confirmation avec documents PDF', {
      bookingId: booking.getId(),
      customerEmail: customer.getEmail(),
      documentsCount: context.generatedDocuments?.length || 0
    });

    try {
      // Préparer les pièces jointes PDF
      const attachments = await this.preparePDFAttachments(
        context.generatedDocuments || [],
        booking
      );

      // Préparer les données de notification enrichies
      const notificationData = {
        email: customer.getEmail(),
        customerName: customer.getFullName(),
        bookingId: booking.getId()!,
        bookingReference: `EQ-${booking.getId()!.slice(-8).toUpperCase()}`,
        serviceDate: context.quoteData.scheduledDate || new Date().toISOString().split('T')[0],
        serviceTime: context.quoteData.scheduledTime || '09:00',
        serviceAddress: context.quoteData.locationAddress || context.quoteData.pickupAddress || 'Adresse à définir',
        totalAmount: context.totalAmount,
        customerPhone: customer.getPhone(),
        serviceType: booking.getType(),
        sessionId: context.sessionId,
        deliveryAddress: context.quoteData.deliveryAddress,
        volume: context.quoteData.volume,
        distance: context.quoteData.distance,
        additionalInfo: context.quoteData.additionalInfo,
        // 🆕 Informations sur les documents attachés
        attachedDocuments: attachments.map(att => ({
          filename: att.filename,
          type: att.documentType,
          size: att.content.length
        }))
      };

      // Envoyer via l'API de notifications enrichie
      await this.sendNotificationWithAttachments({
        email: customer.getEmail(),
        customerName: customer.getFullName(),
        bookingId: booking.getId()!,
        templateType: 'booking-confirmation',
        data: notificationData,
        attachments
      });

      this.notificationLogger.info('✅ Notification avec documents envoyée', {
        bookingId: booking.getId(),
        attachments: attachments.length
      });

    } catch (error) {
      this.notificationLogger.error('❌ Erreur lors de l\'envoi avec documents', {
        bookingId: booking.getId(),
        error
      });
      throw error;
    }
  }

  /**
   * Envoie une notification spécialisée pour informer de nouveaux documents générés
   */
  async sendDocumentGenerationNotification(
    booking: Booking,
    customer: Customer,
    documents: Document[],
    context?: {
      trigger?: string;
      reason?: string;
    }
  ): Promise<void> {
    this.notificationLogger.info('📄 Envoi de notification de génération de documents', {
      bookingId: booking.getId(),
      documentsCount: documents.length,
      trigger: context?.trigger
    });

    try {
      const attachments = await this.preparePDFAttachments(documents, booking);

      const notificationData = {
        email: customer.getEmail(),
        customerName: customer.getFullName(),
        bookingId: booking.getId()!,
        bookingReference: `EQ-${booking.getId()!.slice(-8).toUpperCase()}`,
        serviceType: booking.getType(),
        trigger: context?.trigger || 'manual',
        reason: context?.reason || 'Documents générés automatiquement',
        generatedDocuments: documents.map(doc => ({
          type: doc.getType(),
          filename: doc.getFilename(),
          createdAt: doc.getCreatedAt()
        }))
      };

      await this.sendNotificationWithAttachments({
        email: customer.getEmail(),
        customerName: customer.getFullName(),
        bookingId: booking.getId()!,
        templateType: 'document-generated',
        data: notificationData,
        attachments
      });

    } catch (error) {
      this.notificationLogger.error('❌ Erreur lors de l\'envoi de notification de documents', {
        error
      });
      throw error;
    }
  }

  /**
   * Envoie une notification de paiement avec reçu en pièce jointe
   */
  async sendPaymentConfirmationWithReceipt(
    booking: Booking,
    customer: Customer,
    paymentData: {
      amount: number;
      paymentMethod: string;
      paymentDate: Date;
      paymentIntentId: string;
    },
    receiptDocument: Document
  ): Promise<void> {
    this.notificationLogger.info('💳 Envoi de confirmation de paiement avec reçu', {
      bookingId: booking.getId(),
      amount: paymentData.amount
    });

    try {
      const attachments = await this.preparePDFAttachments([receiptDocument], booking);

      const notificationData = {
        email: customer.getEmail(),
        customerName: customer.getFullName(),
        bookingId: booking.getId()!,
        bookingReference: `EQ-${booking.getId()!.slice(-8).toUpperCase()}`,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        paymentDate: paymentData.paymentDate.toISOString(),
        paymentIntentId: paymentData.paymentIntentId,
        receiptFilename: receiptDocument.getFilename()
      };

      await this.sendNotificationWithAttachments({
        email: customer.getEmail(),
        customerName: customer.getFullName(),
        bookingId: booking.getId()!,
        templateType: 'payment-confirmation',
        data: notificationData,
        attachments
      });

    } catch (error) {
      this.notificationLogger.error('❌ Erreur lors de l\'envoi de confirmation de paiement', {
        error
      });
      throw error;
    }
  }

  /**
   * Prépare les pièces jointes PDF à partir des documents
   */
  private async preparePDFAttachments(
    documents: Document[],
    booking: Booking
  ): Promise<PDFAttachment[]> {
    const attachments: PDFAttachment[] = [];

    for (const document of documents) {
      try {
        const pdfContent = document.getContent();
        
        attachments.push({
          filename: document.getFilename(),
          content: pdfContent,
          mimeType: 'application/pdf',
          documentId: document.getId(),
          documentType: document.getType()
        });

        this.notificationLogger.info('📎 Pièce jointe préparée', {
          filename: document.getFilename(),
          size: pdfContent.length,
          type: document.getType()
        });

      } catch (error) {
        this.notificationLogger.error('❌ Erreur lors de la préparation de pièce jointe', {
          documentId: document.getId(),
          error
        });
        // Continue avec les autres documents même si un échoue
      }
    }

    return attachments;
  }

  /**
   * Envoie une notification avec pièces jointes via l'API
   */
  private async sendNotificationWithAttachments(
    notification: NotificationWithAttachments
  ): Promise<void> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.INTERNAL_API_URL || 'http://localhost:3000';
    
    // Convertir les buffers en base64 pour l'envoi HTTP
    const attachmentsBase64 = notification.attachments.map(att => ({
      filename: att.filename,
      content: att.content.toString('base64'),
      mimeType: att.mimeType,
      documentId: att.documentId,
      documentType: att.documentType
    }));

    const requestBody = {
      ...notification.data,
      templateType: notification.templateType,
      attachments: attachmentsBase64
    };

    this.notificationLogger.info('🚀 Envoi de notification avec pièces jointes', {
      endpoint: `${baseUrl}/api/notifications/business/${notification.templateType}`,
      attachments: attachmentsBase64.length,
      totalSize: notification.attachments.reduce((sum, att) => sum + att.content.length, 0)
    });

    const response = await fetch(`${baseUrl}/api/notifications/business/${notification.templateType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DocumentNotificationService/1.0'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    this.notificationLogger.info('✅ Notification envoyée avec succès', {
      success: result.success,
      messageId: result.messageId
    });
  }

  /**
   * 🆕 Envoie un document aux responsables internes (professionnels)
   */
  async sendDocumentToProfessional(
    booking: Booking,
    staffMember: InternalStaffMember,
    documents: Document[],
    context: {
      trigger: string;
      reason: string;
      staffRole: string;
      department?: string;
    }
  ): Promise<void> {
    this.notificationLogger.info('👔 Envoi de document au responsable interne', {
      bookingId: booking.getId(),
      staffName: `${staffMember.firstName} ${staffMember.lastName}`,
      role: staffMember.role,
      documentsCount: documents.length
    });

    try {
      const attachments = await this.preparePDFAttachments(documents, booking);
      
      // Récupérer les données de la réservation pour le contexte
      const customer = booking.getCustomer();
      
      const notificationData = {
        // Données responsable
        professionalEmail: staffMember.email,
        professionalName: `${staffMember.firstName} ${staffMember.lastName}`,
        role: staffMember.role,
        department: staffMember.department,
        
        // Données réservation
        bookingId: booking.getId()!,
        bookingReference: `EQ-${booking.getId()!.slice(-8).toUpperCase()}`,
        serviceType: booking.getType(),
        totalAmount: booking.getTotalAmount().getAmount(),
        
        // Données client
        customerName: customer.getFullName(),
        customerEmail: customer.getEmail(),
        customerPhone: customer.getPhone(),
        
        // Données service (si disponibles)
        serviceDate: 'À planifier', // TODO: extraire depuis booking data
        serviceTime: 'À définir',
        serviceAddress: 'Voir détails du devis',
        
        // Contexte
        trigger: context.trigger,
        reason: context.reason,
        
        // Documents attachés
        attachedDocuments: attachments.map(att => ({
          filename: att.filename,
          type: att.documentType,
          size: att.content.length
        }))
      };

      // Envoyer via une API spécialisée pour les professionnels
      await this.sendProfessionalNotificationWithAttachments({
        email: staffMember.email,
        professionalName: `${staffMember.firstName} ${staffMember.lastName}`,
        bookingId: booking.getId()!,
        templateType: 'professional-document',
        data: notificationData,
        attachments
      });

      this.notificationLogger.info('✅ Document envoyé au responsable', {
        staffName: `${staffMember.firstName} ${staffMember.lastName}`,
        attachments: attachments.length
      });

    } catch (error) {
      this.notificationLogger.error('❌ Erreur lors de l\'envoi au responsable', {
        staffMember: `${staffMember.firstName} ${staffMember.lastName}`,
        error
      });
      throw error;
    }
  }

  /**
   * 🆕 Envoie des documents à la comptabilité
   */
  async sendDocumentToAccounting(
    booking: Booking,
    staffMember: InternalStaffMember,
    documents: Document[],
    context: {
      trigger: string;
      reason: string;
      department: string;
    }
  ): Promise<void> {
    this.notificationLogger.info('💰 Envoi de documents à la comptabilité', {
      bookingId: booking.getId(),
      staffName: `${staffMember.firstName} ${staffMember.lastName}`,
      documentsCount: documents.length
    });

    try {
      const attachments = await this.preparePDFAttachments(documents, booking);
      
      const customer = booking.getCustomer();
      
      const notificationData = {
        // Données comptable
        accountingEmail: staffMember.email,
        accountingName: `${staffMember.firstName} ${staffMember.lastName}`,
        
        // Données réservation/facturation
        bookingId: booking.getId()!,
        bookingReference: `EQ-${booking.getId()!.slice(-8).toUpperCase()}`,
        serviceType: booking.getType(),
        totalAmount: booking.getTotalAmount().getAmount(),
        currency: booking.getTotalAmount().getCurrency(),
        
        // Données client pour facturation
        customerName: customer.getFullName(),
        customerEmail: customer.getEmail(),
        customerPhone: customer.getPhone(),
        
        // Dates importantes
        bookingDate: booking.getCreatedAt(),
        paymentDate: new Date(), // TODO: utiliser vraie date de paiement
        
        // Documents comptables
        documentsCount: documents.length,
        documentTypes: documents.map(doc => doc.getType()),
        attachedDocuments: attachments.map(att => ({
          filename: att.filename,
          type: att.documentType,
          size: att.content.length
        })),
        
        // Contexte
        trigger: context.trigger,
        reason: context.reason
      };

      // Envoyer via une API spécialisée pour la comptabilité
      await this.sendAccountingNotificationWithAttachments({
        email: staffMember.email,
        accountingName: `${staffMember.firstName} ${staffMember.lastName}`,
        bookingId: booking.getId()!,
        templateType: 'accounting-documents',
        data: notificationData,
        attachments
      });

      this.notificationLogger.info('✅ Documents envoyés à la comptabilité', {
        staffName: `${staffMember.firstName} ${staffMember.lastName}`,
        attachments: attachments.length
      });

    } catch (error) {
      this.notificationLogger.error('❌ Erreur lors de l\'envoi à la comptabilité', {
        staffMember: `${staffMember.firstName} ${staffMember.lastName}`,
        error
      });
      throw error;
    }
  }

  /**
   * 🆕 Envoie une notification aux professionnels avec pièces jointes
   */
  private async sendProfessionalNotificationWithAttachments(
    notification: {
      email: string;
      professionalName: string;
      bookingId: string;
      templateType: string;
      data: any;
      attachments: PDFAttachment[];
    }
  ): Promise<void> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.INTERNAL_API_URL || 'http://localhost:3000';
    
    // Convertir les buffers en base64
    const attachmentsBase64 = notification.attachments.map(att => ({
      filename: att.filename,
      content: att.content.toString('base64'),
      mimeType: att.mimeType,
      documentId: att.documentId,
      documentType: att.documentType
    }));

    const requestBody = {
      ...notification.data,
      templateType: notification.templateType,
      attachments: attachmentsBase64,
      recipientType: 'professional'
    };

    this.notificationLogger.info('🚀 Envoi de notification professionnel', {
      endpoint: `${baseUrl}/api/notifications/business/professional-document`,
      recipient: notification.email.replace(/(.{3}).*(@.*)/, '$1***$2'),
      attachments: attachmentsBase64.length
    });

    const response = await fetch(`${baseUrl}/api/notifications/business/professional-document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DocumentNotificationService-Professional/1.0'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    this.notificationLogger.info('✅ Notification professionnel envoyée', {
      success: result.success,
      messageId: result.messageId
    });
  }

  /**
   * 🆕 Envoie une notification à la comptabilité avec pièces jointes
   */
  private async sendAccountingNotificationWithAttachments(
    notification: {
      email: string;
      accountingName: string;
      bookingId: string;
      templateType: string;
      data: any;
      attachments: PDFAttachment[];
    }
  ): Promise<void> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.INTERNAL_API_URL || 'http://localhost:3000';
    
    // Convertir les buffers en base64
    const attachmentsBase64 = notification.attachments.map(att => ({
      filename: att.filename,
      content: att.content.toString('base64'),
      mimeType: att.mimeType,
      documentId: att.documentId,
      documentType: att.documentType
    }));

    const requestBody = {
      ...notification.data,
      templateType: notification.templateType,
      attachments: attachmentsBase64,
      recipientType: 'accounting'
    };

    this.notificationLogger.info('🚀 Envoi de notification comptabilité', {
      endpoint: `${baseUrl}/api/notifications/business/accounting-documents`,
      recipient: notification.email.replace(/(.{3}).*(@.*)/, '$1***$2'),
      attachments: attachmentsBase64.length
    });

    const response = await fetch(`${baseUrl}/api/notifications/business/accounting-documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DocumentNotificationService-Accounting/1.0'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    this.notificationLogger.info('✅ Notification comptabilité envoyée', {
      success: result.success,
      messageId: result.messageId
    });
  }

  /**
   * Obtient la liste des types de documents à attacher pour différents événements
   */
  static getDocumentTypesForNotification(notificationType: string): DocumentType[] {
    switch (notificationType) {
      case 'booking-confirmation':
        return [
          DocumentType.QUOTE, // Modifié selon le nouveau flux
          DocumentType.CONTRACT
        ];
      
      case 'payment-confirmation':
        return [
          DocumentType.PAYMENT_RECEIPT,
          DocumentType.INVOICE
        ];

      case 'professional-document':
        return [
          DocumentType.QUOTE,
          DocumentType.BOOKING_CONFIRMATION
        ];

      case 'accounting-documents':
        return [
          DocumentType.QUOTE,
          DocumentType.INVOICE,
          DocumentType.PAYMENT_RECEIPT
        ];

      case 'delivery-preparation':
        return [
          DocumentType.DELIVERY_NOTE,
          DocumentType.INVENTORY_LIST
        ];

      default:
        return [];
    }
  }
}