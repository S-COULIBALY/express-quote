/**
 * st
 * 
 * Génère 6 variantes de devis parallèles avec différentes stratégies marketing
 * 
 * Rate limit: 50 requêtes / 15 minutes
 */

import { NextRequest } from 'next/server';
import { QuoteController } from '@/quotation-module/interfaces/http/controllers/QuoteController';
import { withRateLimit } from '@/lib/rate-limiter';
import { devLog } from '@/lib/conditional-logger';

async function handler(request: Request) {
  const startTime = Date.now();
  devLog.info('API_QUOTATION_MULTI_OFFERS', '🚀 [ROUTE] Début calcul multi-offres', {
    timestamp: new Date().toISOString(),
    method: 'POST',
    url: '/api/quotation/multi-offers'
  });

  try {
    const controller = new QuoteController();
    const response = await controller.generateMultiOffers(request as NextRequest);

    const duration = Date.now() - startTime;

    // Cloner la réponse pour pouvoir la lire et la retourner
    const clonedResponse = response.clone();
    const responseData = await clonedResponse.json();

    // Log du retour API avec les prix par scénario
    devLog.info('API_QUOTATION_MULTI_OFFERS', '✅ [ROUTE] Calcul multi-offres terminé', {
      duration: `${duration}ms`,
      status: response.status,
      success: responseData.success,
      quotesCount: responseData.quotes?.length || 0,
    });

    // Log détaillé des prix par scénario
    if (responseData.quotes && responseData.quotes.length > 0) {
      devLog.info('API_QUOTATION_MULTI_OFFERS', '💰 [ROUTE] PRIX RETOURNÉS AU FRONTEND', {
        quotes: responseData.quotes.map((q: any) => ({
          scenarioId: q.scenarioId,
          label: q.label,
          finalPrice: `${q.finalPrice?.toFixed(2) || q.context?.pricing?.finalPrice?.toFixed(2) || 0} €`,
          basePrice: `${q.basePrice?.toFixed(2) || q.context?.pricing?.basePrice?.toFixed(2) || 0} €`,
          marginRate: `${((q.marginRate || q.context?.pricing?.marginRate || 0.30) * 100).toFixed(1)}%`,
        })),
        comparison: responseData.comparison ? {
          cheapest: `${responseData.comparison.cheapest?.scenarioId} - ${responseData.comparison.cheapest?.price?.toFixed(2)} €`,
          recommended: `${responseData.comparison.recommended?.scenarioId} - ${responseData.comparison.recommended?.price?.toFixed(2)} €`,
          priceRange: `${responseData.comparison.priceRange?.toFixed(2)} €`,
        } : 'N/A',
      });
    }

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    devLog.error('API_QUOTATION_MULTI_OFFERS', '❌ [ROUTE] Erreur calcul multi-offres', {
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      duration: `${duration}ms`
    });
    throw error;
  }
}

// 🔒 Appliquer rate limiting: 50 requêtes / 15 minutes
export const POST = withRateLimit(handler, {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50, // 50 requêtes max
});

