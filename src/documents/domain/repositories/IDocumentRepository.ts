import { Document, DocumentType } from '../entities/Document';

export interface IDocumentRepository {
  /**
   * Sauvegarde un document
   */
  save(document: Document): Promise<Document>;

  /**
   * Trouve un document par ID
   */
  findById(id: string): Promise<Document | null>;

  /**
   * Trouve tous les documents d'une réservation
   */
  findByBookingId(bookingId: string): Promise<Document[]>;

  /**
   * Trouve tous les documents par type
   */
  findByType(type: DocumentType, bookingId?: string): Promise<Document[]>;

  /**
   * Trouve tous les documents
   */
  findAll(): Promise<Document[]>;

  /**
   * Supprime un document
   */
  delete(id: string): Promise<void>;
} 