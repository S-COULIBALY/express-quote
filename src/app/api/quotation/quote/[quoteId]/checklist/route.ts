/**
 * GET /api/quotation/quote/{quoteId}/checklist
 *
 * Génère une checklist terrain formatée pour l'équipe de déménagement
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

  devLog.info('API_QUOTATION_CHECKLIST', '🚀 [ROUTE] Demande checklist terrain', {
    quoteId,
    timestamp: new Date().toISOString(),
  });

  const controller = new QuoteController();
  const response = await controller.getTerrainChecklist(quoteId);

  const duration = Date.now() - startTime;

  // Cloner la réponse pour logger le contenu
  const clonedResponse = response.clone();
  const responseData = await clonedResponse.json();

  devLog.info('API_QUOTATION_CHECKLIST', '✅ [ROUTE] Checklist terrain terminée', {
    quoteId,
    duration: `${duration}ms`,
    status: response.status,
    success: responseData.success,
    itemsCount: responseData.items?.length || 0,
  });

  return response;
}

