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
 * GET /api/documents/{id}/download - Télécharge un document PDF
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    logger.info('📥 Téléchargement de document', { documentId: id });

    const documentService = getDocumentService();
    const document = await documentService.getDocument(id);

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer le contenu du document
    const pdfBuffer = document.getContent();
    const filename = document.getFilename();

    // Retourner le PDF avec les bons headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    logger.error('❌ Erreur lors du téléchargement de document', error as Error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors du téléchargement de document',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}