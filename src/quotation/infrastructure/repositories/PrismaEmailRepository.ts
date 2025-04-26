import { PrismaClient } from '@prisma/client';
import { IEmailRepository } from '../../application/services/EmailService';
import { EmailLog, EmailStatus, EmailAttachment } from '../../domain/entities/EmailLog';
import { Customer } from '../../domain/entities/Customer';
import { Booking } from '../../domain/entities/Booking';
import { Document } from '../../domain/entities/Document';
import { Database } from '../config/database';

export class PrismaEmailRepository implements IEmailRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = Database.getClient();
  }

  /**
   * Enregistre un email en base de données
   */
  async save(email: EmailLog): Promise<EmailLog> {
    try {
      const existingEmail = email.getId() 
        ? await this.prisma.emailLog.findUnique({ where: { id: email.getId() } })
        : null;

      // Préparation des données de base
      const emailData = {
        bookingId: email.getBooking().getId(),
        customerId: email.getCustomer().getId(),
        subject: email.getSubject(),
        text: email.getText(),
        html: email.getHtml() || null,
        status: email.getStatus(),
        errorMessage: email.getErrorMessage() || null,
        sentAt: email.getSentAt() || null,
      };

      // Traitement d'une mise à jour ou d'une création
      if (existingEmail) {
        // Mise à jour d'un email existant
        await this.prisma.emailLog.update({
          where: { id: email.getId() },
          data: emailData
        });
        
        // Mise à jour des pièces jointes si nécessaire
        await this.updateAttachments(email);
        
        return email;
      } else {
        // Création d'un nouvel email
        const id = email.getId() || undefined;
        const createdEmail = await this.prisma.emailLog.create({
          data: {
            ...emailData,
            id
          },
          include: {
            booking: true,
            customer: true,
            attachments: {
              include: {
                document: true
              }
            }
          }
        });

        // Création des pièces jointes
        if (email.getAttachments() && email.getAttachments().length > 0) {
          await this.saveAttachments(createdEmail.id, email.getAttachments());
        }

        // Chargement des entités associées
        const booking = await this.loadBooking(createdEmail.booking);
        const customer = this.mapDbToCustomer(createdEmail.customer);

        // Construction de l'email avec l'ID généré
        return this.mapDbToEmailLog(createdEmail, booking, customer);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'email:', error);
      throw new Error(`Erreur lors de la sauvegarde de l'email: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve un email par son ID
   */
  async findById(id: string): Promise<EmailLog | null> {
    try {
      const email = await this.prisma.emailLog.findUnique({
        where: { id },
        include: {
          booking: true,
          customer: true,
          attachments: {
            include: {
              document: true
            }
          }
        }
      });

      if (!email) {
        return null;
      }

      // Chargement des entités associées
      const booking = await this.loadBooking(email.booking);
      const customer = this.mapDbToCustomer(email.customer);

      return this.mapDbToEmailLog(email, booking, customer);
    } catch (error) {
      console.error(`Erreur lors de la recherche de l'email par ID ${id}:`, error);
      throw new Error(`Erreur lors de la recherche de l'email: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve les emails par ID de réservation
   */
  async findByBookingId(bookingId: string): Promise<EmailLog[]> {
    try {
      const emails = await this.prisma.emailLog.findMany({
        where: { bookingId },
        include: {
          booking: true,
          customer: true,
          attachments: {
            include: {
              document: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Si pas d'emails, retourner un tableau vide
      if (emails.length === 0) {
        return [];
      }

      // Chargement de la réservation (partagée par tous les emails)
      const booking = await this.loadBooking(emails[0].booking);

      return Promise.all(emails.map(async (email) => {
        const customer = this.mapDbToCustomer(email.customer);
        return this.mapDbToEmailLog(email, booking, customer);
      }));
    } catch (error) {
      console.error(`Erreur lors de la recherche des emails par réservation ${bookingId}:`, error);
      throw new Error(`Erreur lors de la recherche des emails: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve les emails par ID de client
   */
  async findByCustomerId(customerId: string): Promise<EmailLog[]> {
    try {
      const emails = await this.prisma.emailLog.findMany({
        where: { customerId },
        include: {
          booking: true,
          customer: true,
          attachments: {
            include: {
              document: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Si pas d'emails, retourner un tableau vide
      if (emails.length === 0) {
        return [];
      }

      // Chargement du client (partagé par tous les emails)
      const customer = this.mapDbToCustomer(emails[0].customer);

      return Promise.all(emails.map(async (email) => {
        const booking = await this.loadBooking(email.booking);
        return this.mapDbToEmailLog(email, booking, customer);
      }));
    } catch (error) {
      console.error(`Erreur lors de la recherche des emails par client ${customerId}:`, error);
      throw new Error(`Erreur lors de la recherche des emails: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve les emails par statut
   */
  async findByStatus(status: EmailStatus): Promise<EmailLog[]> {
    try {
      const emails = await this.prisma.emailLog.findMany({
        where: { status },
        include: {
          booking: true,
          customer: true,
          attachments: {
            include: {
              document: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return Promise.all(emails.map(async (email) => {
        const booking = await this.loadBooking(email.booking);
        const customer = this.mapDbToCustomer(email.customer);
        return this.mapDbToEmailLog(email, booking, customer);
      }));
    } catch (error) {
      console.error(`Erreur lors de la recherche des emails par statut ${status}:`, error);
      throw new Error(`Erreur lors de la recherche des emails: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Met à jour le statut d'un email
   */
  async updateStatus(id: string, status: EmailStatus, errorMessage?: string): Promise<void> {
    try {
      const updateData: any = { status };
      
      if (status === EmailStatus.SENT) {
        updateData.sentAt = new Date();
      }
      
      if (errorMessage) {
        updateData.errorMessage = errorMessage;
      }
      
      await this.prisma.emailLog.update({
        where: { id },
        data: updateData
      });
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du statut de l'email ${id}:`, error);
      throw new Error(`Erreur lors de la mise à jour du statut: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Sauvegarde les pièces jointes d'un email
   */
  private async saveAttachments(emailId: string, attachments: EmailAttachment[]): Promise<void> {
    try {
      for (const attachment of attachments) {
        await this.prisma.emailAttachment.create({
          data: {
            id: attachment.getId() || undefined,
            emailId: emailId,
            documentId: attachment.getDocument()?.getId() || null,
            filename: attachment.getFilename(),
            contentType: attachment.getContentType(),
            content: attachment.getContent() || null
          }
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des pièces jointes:', error);
      throw new Error(`Erreur lors de la sauvegarde des pièces jointes: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Met à jour les pièces jointes d'un email
   */
  private async updateAttachments(email: EmailLog): Promise<void> {
    try {
      // Supprimer toutes les pièces jointes existantes
      await this.prisma.emailAttachment.deleteMany({
        where: { emailId: email.getId() }
      });
      
      // Créer les nouvelles pièces jointes
      if (email.getAttachments() && email.getAttachments().length > 0) {
        await this.saveAttachments(email.getId(), email.getAttachments());
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des pièces jointes:', error);
      throw new Error(`Erreur lors de la mise à jour des pièces jointes: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Charge une réservation à partir des données de la base
   */
  private async loadBooking(bookingData: any): Promise<Booking> {
    try {
      // Import dynamique pour éviter la dépendance circulaire
      const { PrismaBookingRepository } = await import('./PrismaBookingRepository');
      const bookingRepo = new PrismaBookingRepository();
      
      // Chargement de la réservation complète
      const booking = await bookingRepo.findById(bookingData.id);
      
      if (!booking) {
        throw new Error(`Booking with ID ${bookingData.id} not found`);
      }
      
      return booking;
    } catch (error) {
      console.error(`Erreur lors du chargement de la réservation:`, error);
      throw new Error(`Erreur lors du chargement de la réservation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Convertit un objet client de la base de données en entité du domaine
   */
  private mapDbToCustomer(dbCustomer: any): Customer {
    return new Customer(
      dbCustomer.email,
      dbCustomer.firstName,
      dbCustomer.lastName,
      dbCustomer.phone || undefined,
      dbCustomer.id
    );
  }

  /**
   * Charge un document à partir des données de la base
   */
  private async loadDocument(documentData: any): Promise<Document | null> {
    if (!documentData) return null;
    
    try {
      // Import dynamique pour éviter la dépendance circulaire
      const { PrismaDocumentRepository } = await import('./PrismaDocumentRepository');
      const documentRepo = new PrismaDocumentRepository();
      
      // Chargement du document complet
      return documentRepo.findById(documentData.id);
    } catch (error) {
      console.error(`Erreur lors du chargement du document:`, error);
      return null;
    }
  }

  /**
   * Convertit un objet email de la base de données en entité du domaine
   */
  private async mapDbToEmailLog(dbEmail: any, booking: Booking, customer: Customer): Promise<EmailLog> {
    // Création de l'email log
    const emailLog = new EmailLog(
      booking,
      customer,
      dbEmail.subject,
      dbEmail.text,
      dbEmail.html || undefined,
      dbEmail.id,
      dbEmail.status as EmailStatus,
      dbEmail.errorMessage || undefined,
      dbEmail.sentAt || undefined
    );
    
    // Traitement des pièces jointes si elles existent
    if (dbEmail.attachments && dbEmail.attachments.length > 0) {
      for (const attachmentData of dbEmail.attachments) {
        let document: Document | null = null;
        
        if (attachmentData.document) {
          document = await this.loadDocument(attachmentData.document);
        }
        
        const attachment = new EmailAttachment(
          attachmentData.id,
          dbEmail.id,
          attachmentData.filename,
          attachmentData.contentType,
          document || undefined,
          attachmentData.content || undefined
        );
        
        emailLog.addAttachment(attachment);
      }
    }
    
    return emailLog;
  }
} 