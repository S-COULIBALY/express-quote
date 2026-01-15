import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * GET /api/documents/{id} - Récupère un document par ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    logger.info('🔍 Récupération de document', { documentId: id });

    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: document.id,
        type: document.type,
        filename: document.filename,
        bookingId: document.bookingId,
        createdAt: document.createdAt
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
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    logger.info('🗑️ Suppression de document', { documentId: id });

    const document = await prisma.document.delete({
      where: { id }
    });

    if (!document) {
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
