import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DocumentType } from '@prisma/client';
import { logger } from '@/lib/logger';

/**
 * GET /api/documents - Recherche de documents
 * Query params: bookingId, type, limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');
    const type = searchParams.get('type') as DocumentType | null;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    logger.info('🔍 Recherche de documents', { bookingId, type, limit, offset });

    const documents = await prisma.document.findMany({
      where: {
        ...(bookingId ? { bookingId } : {}),
        ...(type ? { type } : {})
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: {
        documents: documents.map(doc => ({
          id: doc.id,
          type: doc.type,
          filename: doc.filename,
          bookingId: doc.bookingId,
          createdAt: doc.createdAt
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
