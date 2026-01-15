import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * GET /api/documents/{id}/download - Télécharge un document PDF
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    logger.info('📥 Téléchargement de document', { documentId: id });

    // Récupérer le document depuis la base de données
    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si le contenu existe
    if (!document.content) {
      return NextResponse.json(
        { success: false, error: 'Contenu du document non disponible' },
        { status: 404 }
      );
    }

    // Retourner le PDF avec les bons headers
    return new NextResponse(document.content, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${document.filename}"`,
        'Content-Length': document.content.length.toString(),
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
