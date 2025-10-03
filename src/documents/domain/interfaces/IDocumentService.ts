import { Document } from '../entities/Document';
import { Booking } from '@/quotation/domain/entities/Booking';
import { 
  DocumentGenerationRequest,
  DocumentGenerationResult,
  BulkDocumentRequest,
  DocumentSearchCriteria
} from '../../application/services/DocumentService';

/**
 * Interface du service de documents pour l'injection de dépendances
 */
export interface IDocumentService {
  // Génération de documents
  generateDocument(request: DocumentGenerationRequest): Promise<DocumentGenerationResult>;
  generateBulkDocuments(request: BulkDocumentRequest): Promise<DocumentGenerationResult[]>;
  
  // Méthodes de convenance
  generateBookingConfirmation(booking: Booking, options?: {
    template?: string;
    logoPath?: string;
  }): Promise<DocumentGenerationResult>;
  
  generateInvoice(booking: Booking, options?: {
    template?: string;
    logoPath?: string;
    invoiceNumber?: string;
  }): Promise<DocumentGenerationResult>;
  
  generateContract(booking: Booking, options?: {
    template?: string;
    logoPath?: string;
    termsAndConditions?: string;
  }): Promise<DocumentGenerationResult>;
  
  // Gestion des documents
  searchDocuments(criteria: DocumentSearchCriteria): Promise<Document[]>;
  getDocument(documentId: string): Promise<Document | null>;
  deleteDocument(documentId: string): Promise<boolean>;
}