import { NextRequest, NextResponse } from 'next/server';
import { DocumentService } from '@/documents/application/services/DocumentService';
import { DocumentOrchestrationService } from '@/documents/application/services/DocumentOrchestrationService';
import { logger } from '@/lib/logger';

// Instance partagée des services
let documentServiceInstance: DocumentService | null = null;
let orchestratorInstance: DocumentOrchestrationService | null = null;

function getServices() {
  if (!documentServiceInstance || !orchestratorInstance) {
    documentServiceInstance = new DocumentService();
    orchestratorInstance = new DocumentOrchestrationService(documentServiceInstance);
  }
  return { documentService: documentServiceInstance, orchestrator: orchestratorInstance };
}

/**
 * PUT /api/documents/{id}/regenerate - Régénère un document existant
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { options = {} } = await request.json();
    
    logger.info('🔄 Régénération de document', { documentId: id, options });

    const { documentService, orchestrator } = getServices();
    
    // Récupérer le document existant
    const existingDocument = await documentService.getDocument(id);
    
    if (!existingDocument) {
      return NextResponse.json(
        { success: false, error: 'Document non trouvé' },
        { status: 404 }
      );
    }

    // TODO: Récupérer la réservation associée
    // const booking = await bookingService.getBookingById(existingDocument.getBooking().getId());
    
    // Pour l'instant, simulation de régénération
    return NextResponse.json({
      success: true,
      message: 'Document régénéré avec succès (simulation)',
      data: {
        documentId: id,
        type: existingDocument.getType(),
        filename: existingDocument.getFilename(),
        version: 2, // Nouvelle version
        regeneratedAt: new Date().toISOString(),
        downloadUrl: `/api/documents/${id}/download`
      }
    });

  } catch (error) {
    logger.error('❌ Erreur lors de la régénération de document', error as Error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la régénération de document',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}