import { NextRequest, NextResponse } from 'next/server';
import { DocumentService } from '@/documents/application/services/DocumentService';
import { DocumentType } from '@/documents/domain/entities/Document';
import { logger } from '@/lib/logger';

// Instance partagée du DocumentService - instanciation simple
let documentServiceInstance: DocumentService | null = null;

function getDocumentService(): DocumentService {
  if (!documentServiceInstance) {
    // Instanciation simple sans IoC - le service configure ses dépendances
    documentServiceInstance = new DocumentService();
    logger.info('🏗️ DocumentService initialisé (module autonome)');
  }
  
  return documentServiceInstance;
}

/**
 * GET /api/documents - Recherche de documents
 * Query params: bookingId, type, limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');
    const type = searchParams.get('type') as DocumentType;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    logger.info('🔍 Recherche de documents', { bookingId, type, limit, offset });

    const documentService = getDocumentService();
    const documents = await documentService.searchDocuments({
      bookingId: bookingId || undefined,
      type: type || undefined,
      limit,
      offset
    });

    return NextResponse.json({
      success: true,
      data: {
        documents: documents.map(doc => ({
          id: doc.getId(),
          type: doc.getType(),
          filename: doc.getFilename(),
          bookingId: doc.getBooking().getId(),
          createdAt: doc.getCreatedAt()
        })),
        count: documents.length
      }
    });

  } catch (error) {
    logger.error('❌ Erreur lors de la recherche de documents', error as Error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la recherche de documents',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/documents - Génération manuelle d'un document
 * Body: { bookingId: string, type: DocumentType, options?: any }
 */
export async function POST(request: NextRequest) {
  try {
    const { bookingId, type, options = {} } = await request.json();

    if (!bookingId || !type) {
      return NextResponse.json(
        { success: false, error: 'bookingId et type sont requis' },
        { status: 400 }
      );
    }

    logger.info('🔄 Génération manuelle de document', { bookingId, type, options });

    // TODO: Récupérer la réservation via BookingService
    // Pour l'instant, simulation de succès avec l'orchestrateur
    
    return NextResponse.json({
      success: true,
      message: 'Document généré avec succès (simulation)',
      data: {
        documentId: `doc_${Date.now()}`,
        type: type,
        bookingId: bookingId,
        filename: `${type.toLowerCase()}_${bookingId.substring(0, 8)}_${new Date().toISOString().split('T')[0]}.pdf`,
        downloadUrl: `/api/documents/doc_${Date.now()}/download`,
        createdAt: new Date().toISOString()
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