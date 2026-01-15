// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import { IDocumentRepository } from '../../domain/repositories/IDocumentRepository';
import { Document, DocumentType } from '../../domain/entities/Document';
import { Booking } from '@/quotation/domain/entities/Booking';
import { Database } from '@/quotation/infrastructure/config/database';

export class PrismaDocumentRepository implements IDocumentRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = Database.getClient();
  }

  /**
   * Enregistre un document en base de données
   */
  async save(document: Document): Promise<Document> {
    try {
      const existingDocument = document.getId() 
        ? await this.prisma.document.findUnique({ where: { id: document.getId() } })
        : null;

      const documentData = {
        bookingId: document.getBooking().getId(),
        type: document.getType(),
        filename: document.getFilename(),
        content: document.getContent(),
      };

      if (existingDocument) {
        // Mise à jour d'un document existant
        await this.prisma.document.update({
          where: { id: document.getId() },
          data: documentData
        });
        return document;
      } else {
        // Création d'un nouveau document
        const id = document.getId() || undefined;
        const createdDocument = await this.prisma.document.create({
          data: {
            ...documentData,
            id
          },
          include: {
            booking: {
              include: {
                customer: true,
                professional: true
              }
            }
          }
        });

        // Chargement de la réservation associée
        const booking = await this.loadBooking(createdDocument.booking);

        // Construction du document avec l'ID généré
        return new Document(
          booking,
          createdDocument.type as DocumentType,
          createdDocument.filename,
          createdDocument.content,
          createdDocument.id
        );
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du document:', error);
      throw new Error(`Erreur lors de la sauvegarde du document: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve un document par son ID
   */
  async findById(id: string): Promise<Document | null> {
    try {
      const document = await this.prisma.document.findUnique({
        where: { id },
        include: {
          booking: {
            include: {
              customer: true,
              professional: true
            }
          }
        }
      });

      if (!document) {
        return null;
      }

      // Chargement de la réservation associée
      const booking = await this.loadBooking(document.booking);

      return new Document(
        booking,
        document.type as DocumentType,
        document.filename,
        document.content,
        document.id
      );
    } catch (error) {
      console.error(`Erreur lors de la recherche du document par ID ${id}:`, error);
      throw new Error(`Erreur lors de la recherche du document: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve les documents par ID de réservation
   */
  async findByBookingId(bookingId: string): Promise<Document[]> {
    try {
      const documents = await this.prisma.document.findMany({
        where: { bookingId },
        include: {
          booking: {
            include: {
              customer: true,
              professional: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Chargement de la réservation
      const booking = documents.length > 0 
        ? await this.loadBooking(documents[0].booking)
        : null;

      if (!booking) {
        return [];
      }

      return documents.map(doc => new Document(
        booking,
        doc.type as DocumentType,
        doc.filename,
        doc.content,
        doc.id
      ));
    } catch (error) {
      console.error(`Erreur lors de la recherche des documents par réservation ${bookingId}:`, error);
      throw new Error(`Erreur lors de la recherche des documents: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve les documents par type
   */
  async findByType(type: DocumentType, bookingId?: string): Promise<Document[]> {
    try {
      const whereClause: any = { type };
      
      if (bookingId) {
        whereClause.bookingId = bookingId;
      }
      
      const documents = await this.prisma.document.findMany({
        where: whereClause,
        include: {
          booking: {
            include: {
              customer: true,
              professional: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const result: Document[] = [];
      
      for (const doc of documents) {
        const booking = await this.loadBooking(doc.booking);
        
        result.push(new Document(
          booking,
          doc.type as DocumentType,
          doc.filename,
          doc.content,
          doc.id
        ));
      }

      return result;
    } catch (error) {
      console.error(`Erreur lors de la recherche des documents par type ${type}:`, error);
      throw new Error(`Erreur lors de la recherche des documents: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Charge une réservation à partir des données de la base
   */
  private async loadBooking(bookingData: any): Promise<Booking> {
    try {
      // Import dynamique pour éviter la dépendance circulaire
      // TODO: Implémenter le chargement de Booking depuis le repository approprié
      // Pour l'instant, on utilise Prisma directement
      const bookingData = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          customer: true,
          professional: true
        }
      });
      
      if (!bookingData) {
        throw new Error(`Booking ${bookingId} not found`);
      }
      
      // Chargement de la réservation complète via le repository
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
} 