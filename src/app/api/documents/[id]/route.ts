import { NextRequest, NextResponse } from 'next/server';
import { DocumentService } from '@/documents/application/services/DocumentService';
import { logger } from '@/lib/logger';

// Instance partagée du DocumentService - instanciation simple
let documentServiceInstance: DocumentService | null = null;

function getDocumentService(): DocumentService {
  if (!documentServiceInstance) {
    documentServiceInstance = new DocumentService();
  }
  return documentServiceInstance;
}

/**
 * GET /api/documents/{id} - Récupère un document par ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    logger.info('🔍 Récupération de document', { documentId: id });

    const documentService = getDocumentService();
    const document = await documentService.getDocument(id);

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: document.getId(),
        type: document.getType(),
        filename: document.getFilename(),
        bookingId: document.getBooking().getId(),
        createdAt: document.getCreatedAt()
      }
    });

  } catch (error) {
    logger.error('❌ Erreur lors de la récupération de document', error as Error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la récupération de document',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents/{id} - Supprime un document
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    logger.info('🗑️ Suppression de document', { documentId: id });

    const documentService = getDocumentService();
    const success = await documentService.deleteDocument(id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Impossible de supprimer le document' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document supprimé avec succès'
    });

  } catch (error) {
    logger.error('❌ Erreur lors de la suppression de document', error as Error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la suppression de document',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}