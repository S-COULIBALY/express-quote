/**
 * GET /api/quotation/quote/{quoteId}/contract
 *
 * Génère les données contractuelles formatées pour la signature
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

  devLog.info('API_QUOTATION_CONTRACT', '🚀 [ROUTE] Demande données contrat', {
    quoteId,
    timestamp: new Date().toISOString(),
  });

  const controller = new QuoteController();
  const response = await controller.getContractData(quoteId);

  const duration = Date.now() - startTime;

  // Cloner la réponse pour logger le contenu
  const clonedResponse = response.clone();
  const responseData = await clonedResponse.json();

  devLog.info('API_QUOTATION_CONTRACT', '✅ [ROUTE] Données contrat terminées', {
    quoteId,
    duration: `${duration}ms`,
    status: response.status,
    success: responseData.success,
    legalImpactsCount: responseData.legalImpacts?.length || 0,
    insurancePremium: responseData.insurance?.premium,
  });

  return response;
}

