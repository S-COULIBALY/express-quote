/**
 * 📄 API Documents - Génération PDF uniquement
 *
 * POST /api/documents/generate
 *
 * Responsabilité UNIQUE :
 * - Valide les données de requête
 * - Génère des PDF via DocumentService
 * - RETOURNE chemins fichiers (pas d'envoi)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DocumentService } from '@/documents/application/services/DocumentService';
import { DocumentType } from '@/documents/domain/entities/Document';
import { logger } from '@/lib/logger';

// Schéma de validation
const GenerateDocumentsSchema = z.object({
  bookingId: z.string().min(1, 'ID de réservation requis'),
  documentTypes: z.array(z.nativeEnum(DocumentType)).optional(),
  trigger: z.string().optional(),
  options: z.object({
    saveToFile: z.boolean().optional().default(true),
    storageSubDir: z.string().optional(),
    additionalData: z.record(z.any()).optional()
  }).optional()
});

/**
 * Génère des documents PDF pour une réservation
 */
export async function POST(request: NextRequest) {
  const requestLogger = logger.withContext('DocumentsAPI');

  try {
    const body = await request.json();

    // Validation des données
    const validatedData = GenerateDocumentsSchema.parse(body);

    requestLogger.info('📄 Demande de génération de documents', {
      bookingId: validatedData.bookingId,
      trigger: validatedData.trigger,
      documentTypes: validatedData.documentTypes
    });

    // Déterminer les types de documents à générer
    const documentTypes = validatedData.documentTypes ||
      DocumentService.getDocumentTypesForTrigger(validatedData.trigger || 'BOOKING_CONFIRMED');

    // Générer les documents
    const documentService = new DocumentService();
    const result = await documentService.generateDocuments({
      bookingId: validatedData.bookingId,
      documentTypes,
      trigger: validatedData.trigger,
      options: validatedData.options
    });

    if (result.success) {
      requestLogger.info('✅ Documents générés avec succès', {
        bookingId: validatedData.bookingId,
        documentsGenerated: result.documents.length,
        totalSize: `${Math.round(result.metadata.totalSize / 1024)}KB`
      });

      return NextResponse.json({
        success: true,
        documents: result.documents.map(doc => ({
          type: doc.type,
          filename: doc.filename,
          path: doc.path,
          size: doc.size,
          mimeType: doc.mimeType
        })),
        metadata: result.metadata
      });

    } else {
      requestLogger.error('❌ Échec génération documents', {
        bookingId: validatedData.bookingId,
        error: result.error
      });

      return NextResponse.json({
        success: false,
        error: result.error || 'Erreur lors de la génération',
        documents: [],
        metadata: result.metadata
      }, { status: 500 });
    }

  } catch (error) {
    requestLogger.error('❌ Erreur API documents', {
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Données invalides',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

/**
 * Récupère les types de documents disponibles
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const trigger = url.searchParams.get('trigger');

  try {
    const documentTypes = trigger
      ? DocumentService.getDocumentTypesForTrigger(trigger)
      : Object.values(DocumentType);

    return NextResponse.json({
      success: true,
      documentTypes,
      trigger: trigger || null
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération des types'
    }, { status: 500 });
  }
}