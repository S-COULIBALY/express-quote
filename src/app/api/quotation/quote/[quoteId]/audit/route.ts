/**
 * GET /api/quotation/quote/{quoteId}/audit
 *
 * Génère un audit juridique complet avec traçabilité
 */

import { NextRequest } from 'next/server';
import { QuoteController } from '@/quotation-module/interfaces/http/controllers/QuoteController';
import { devLog } from '@/lib/conditional-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { quoteId: string } }
) {
  const startTime = Date.now();
  const { quoteId } = await params;

  devLog.info('API_QUOTATION_AUDIT', '🚀 [ROUTE] Demande audit juridique', {
    quoteId,
    timestamp: new Date().toISOString(),
  });

  const controller = new QuoteController();
  const response = await controller.getLegalAudit(quoteId);

  const duration = Date.now() - startTime;

  // Cloner la réponse pour logger le contenu
  const clonedResponse = response.clone();
  const responseData = await clonedResponse.json();

  devLog.info('API_QUOTATION_AUDIT', '✅ [ROUTE] Audit juridique terminé', {
    quoteId,
    duration: `${duration}ms`,
    status: response.status,
    success: responseData.success,
    decisionsCount: responseData.decisions?.length || 0,
    riskScore: responseData.riskScore,
    manualReviewRequired: responseData.manualReviewRequired,
  });

  return response;
}

