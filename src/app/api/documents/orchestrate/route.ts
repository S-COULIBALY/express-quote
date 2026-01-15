/**
 * 🎼 API ORCHESTRATION DOCUMENTS - Point d'entrée unifié
 *
 * POST /api/documents/orchestrate
 *
 * Responsabilités :
 * - Point d'entrée unique pour génération + distribution de documents
 * - Utilise DocumentOrchestrationService avec règles métier
 * - Toutes les notifications passent par des APIs avec BullMQ
 * - Intégration dans BookingService et autres services métier
 *
 * ✅ FLUX UNIFIÉ :
 * 1. Génère les documents selon les règles métier
 * 2. Distribue automatiquement via APIs de notification (BullMQ)
 * 3. Retourne les résultats de génération et distribution
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DocumentOrchestrationService, DocumentTrigger } from '@/documents/application/services/DocumentOrchestrationService';
import { logger } from '@/lib/logger';
import { PrismaBookingRepository } from '@/quotation/infrastructure/repositories/PrismaBookingRepository';
import { PrismaQuoteRequestRepository } from '@/quotation/infrastructure/repositories/PrismaQuoteRequestRepository';

// Schéma de validation - bookingId ou quoteRequestId selon le trigger
const OrchestrateDocumentsSchema = z.object({
  bookingId: z.string().optional(),
  quoteRequestId: z.string().optional(),
  trigger: z.string().min(1, 'Trigger requis'),
  options: z.object({
    forceGeneration: z.boolean().optional().default(false),
    skipApproval: z.boolean().optional().default(true),
    customOptions: z.record(z.any()).optional()
  }).optional()
}).refine(
  (data) => {
    // Pour QUOTE_CREATED, quoteRequestId est requis
    if (data.trigger === 'QUOTE_CREATED') {
      return !!data.quoteRequestId;
    }
    // Pour les autres triggers, bookingId est requis
    return !!data.bookingId;
  },
  {
    message: 'bookingId requis (sauf pour QUOTE_CREATED qui nécessite quoteRequestId)',
    path: ['bookingId']
  }
);

/**
 * Orchestre la génération et distribution de documents
 * ✅ Point d'entrée unifié pour le système de notification
 */
export async function POST(request: NextRequest) {
  const requestLogger = logger.withContext('DocumentsOrchestrationAPI');

  try {
    const body = await request.json();
    const validatedData = OrchestrateDocumentsSchema.parse(body);

    requestLogger.info('🎼 Démarrage orchestration documents', {
      bookingId: validatedData.bookingId,
      quoteRequestId: validatedData.quoteRequestId,
      trigger: validatedData.trigger
    });

    // Convertir le trigger string en DocumentTrigger enum
    const triggerMap: Record<string, DocumentTrigger> = {
      'BOOKING_CONFIRMED': DocumentTrigger.BOOKING_CONFIRMED,
      'PAYMENT_COMPLETED': DocumentTrigger.PAYMENT_COMPLETED,
      'QUOTE_CREATED': DocumentTrigger.QUOTE_CREATED,
      'QUOTE_ACCEPTED': DocumentTrigger.QUOTE_ACCEPTED,
      'BOOKING_SCHEDULED': DocumentTrigger.BOOKING_SCHEDULED,
      'SERVICE_STARTED': DocumentTrigger.SERVICE_STARTED,
      'SERVICE_COMPLETED': DocumentTrigger.SERVICE_COMPLETED,
      'BOOKING_CANCELLED': DocumentTrigger.BOOKING_CANCELLED,
      'BOOKING_MODIFIED': DocumentTrigger.BOOKING_MODIFIED
    };

    const documentTrigger = triggerMap[validatedData.trigger];
    if (!documentTrigger) {
      return NextResponse.json({
        success: false,
        error: `Trigger invalide: ${validatedData.trigger}`
      }, { status: 400 });
    }

    // Récupérer booking ou quoteRequest selon le trigger
    let booking = null;
    let quoteRequest = null;

    if (validatedData.trigger === 'QUOTE_CREATED' && validatedData.quoteRequestId) {
      const quoteRequestRepository = new PrismaQuoteRequestRepository();
      quoteRequest = await quoteRequestRepository.findById(validatedData.quoteRequestId);
      
      if (!quoteRequest) {
        return NextResponse.json({
          success: false,
          error: `QuoteRequest non trouvé: ${validatedData.quoteRequestId}`
        }, { status: 404 });
      }
    } else if (validatedData.bookingId) {
      const bookingRepository = new PrismaBookingRepository();
      booking = await bookingRepository.findById(validatedData.bookingId);
      
      if (!booking) {
        return NextResponse.json({
          success: false,
          error: `Réservation non trouvée: ${validatedData.bookingId}`
        }, { status: 404 });
      }
    } else {
      // Pour les triggers système (SYSTEM_MAINTENANCE, SYSTEM_UPDATE, etc.), pas besoin de booking
      // Ils seront gérés différemment
    }

    // Utiliser l'orchestrateur pour génération + distribution
    const orchestrator = new DocumentOrchestrationService();

    // Vérifier qu'on a un booking ou quoteRequest valide
    const entity = booking || quoteRequest;
    if (!entity) {
      return NextResponse.json({
        success: false,
        error: 'Aucune réservation ou demande de devis trouvée'
      }, { status: 404 });
    }

    const results = await orchestrator.handleTrigger(
      documentTrigger,
      entity as any, // Cast temporaire pour compatibilité de type
      {
        forceGeneration: validatedData.options?.forceGeneration || false,
        skipApproval: validatedData.options?.skipApproval !== false,
        customOptions: validatedData.options?.customOptions
      }
    );

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    requestLogger.info('✅ Orchestration terminée', {
      bookingId: validatedData.bookingId,
      quoteRequestId: validatedData.quoteRequestId,
      trigger: validatedData.trigger,
      successCount,
      errorCount,
      totalDocuments: results.length
    });

    return NextResponse.json({
      success: successCount > 0,
      distributed: true, // Indique que la distribution a été effectuée via APIs BullMQ
      results: results,
      metadata: {
        bookingId: validatedData.bookingId,
        quoteRequestId: validatedData.quoteRequestId,
        trigger: validatedData.trigger,
        generatedAt: new Date(),
        successCount,
        errorCount,
        totalDocuments: results.length
      }
    });

  } catch (error) {
    requestLogger.error('❌ Erreur orchestration documents', {
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : undefined
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
      error: 'Erreur lors de l\'orchestration',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

