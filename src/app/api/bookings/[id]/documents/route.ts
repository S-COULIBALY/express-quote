import { NextRequest, NextResponse } from 'next/server';
import { DocumentService } from '@/documents/application/services/DocumentService';
import { DocumentOrchestrationService, DocumentTrigger } from '@/documents/application/services/DocumentOrchestrationService';
import { DocumentType } from '@/documents/domain/entities/Document';
import { PrismaDocumentRepository } from '@/documents/infrastructure/repositories/PrismaDocumentRepository';
import { logger } from '@/lib/logger';

// Instance partagée des services
let documentServiceInstance: DocumentService | null = null;
let orchestratorInstance: DocumentOrchestrationService | null = null;
let documentRepositoryInstance: PrismaDocumentRepository | null = null;

function getServices() {
  if (!documentServiceInstance || !orchestratorInstance) {
    documentServiceInstance = new DocumentService();
    orchestratorInstance = new DocumentOrchestrationService(documentServiceInstance);
  }
  if (!documentRepositoryInstance) {
    documentRepositoryInstance = new PrismaDocumentRepository();
  }
  return { 
    documentService: documentServiceInstance, 
    orchestrator: orchestratorInstance,
    documentRepository: documentRepositoryInstance
  };
}

/**
 * GET /api/bookings/{id}/documents - Récupère tous les documents d'une réservation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: bookingId } = params;
    logger.info('🔍 Récupération des documents de la réservation', { bookingId });

    const { documentRepository } = getServices();
    const documents = await documentRepository.findByBookingId(bookingId);

    return NextResponse.json({
      success: true,
      data: {
        bookingId,
        documents: documents.map(doc => ({
          id: doc.getId(),
          type: doc.getType(),
          filename: doc.getFilename(),
          createdAt: doc.getCreatedAt(),
          downloadUrl: `/api/documents/${doc.getId()}/download`
        })),
        count: documents.length
      }
    });

  } catch (error) {
    logger.error('❌ Erreur lors de la récupération des documents', error as Error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la récupération des documents',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings/{id}/documents - Génère un nouveau document pour une réservation
 * Body: { type: DocumentType, options?: any, trigger?: DocumentTrigger }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: bookingId } = params;
    const { type, options = {}, trigger } = await request.json();

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Le type de document est requis' },
        { status: 400 }
      );
    }

    logger.info('🔄 Génération de document pour réservation', {
      bookingId,
      type,
      options,
      trigger
    });

    // TODO: Récupérer la réservation via BookingService
    // const bookingService = getBookingService();
    // const booking = await bookingService.getBookingById(bookingId);

    const { orchestrator } = getServices();
    
    // Simulation de génération de document
    return NextResponse.json({
      success: true,
      message: 'Document généré avec succès (simulation)',
      data: {
        documentId: `doc_${Date.now()}`,
        type: type,
        bookingId: bookingId,
        filename: `${type.toLowerCase()}_${bookingId.substring(0, 8)}_${new Date().toISOString().split('T')[0]}.pdf`,
        downloadUrl: `/api/documents/doc_${Date.now()}/download`,
        createdAt: new Date().toISOString(),
        trigger: trigger || 'manual'
      }
    });

  } catch (error) {
    logger.error('❌ Erreur lors de la génération de document', error as Error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la génération de document',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}