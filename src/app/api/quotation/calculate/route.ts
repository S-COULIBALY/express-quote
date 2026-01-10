/**
 * POST /api/quotation/calculate
 * 
 * Calcule un devis unique avec le moteur modulaire
 * 
 * Rate limit: 100 requêtes / 15 minutes
 */

import { NextRequest } from 'next/server';
import { QuoteController } from '@/quotation-module/interfaces/http/controllers/QuoteController';
import { withRateLimit, RATE_LIMIT_CONFIG } from '@/lib/rate-limiter';
import { devLog } from '@/lib/conditional-logger';

async function handler(request: Request) {
  const startTime = Date.now();
  devLog.info('API_QUOTATION_CALCULATE', '🚀 [ROUTE] Début calcul devis', {
    timestamp: new Date().toISOString(),
    method: 'POST',
    url: '/api/quotation/calculate'
  });

  try {
    const controller = new QuoteController();
    const response = await controller.calculateQuote(request as NextRequest);

    const duration = Date.now() - startTime;

    // Cloner la réponse pour pouvoir la lire et la retourner
    const clonedResponse = response.clone();
    const responseData = await clonedResponse.json();

    // Log du retour API avec le prix calculé
    devLog.info('API_QUOTATION_CALCULATE', '✅ [ROUTE] Calcul devis terminé', {
      duration: `${duration}ms`,
      status: response.status,
      success: responseData.success,
    });

    // Log détaillé du prix
    if (responseData.success && responseData.pricing) {
      devLog.info('API_QUOTATION_CALCULATE', '💰 [ROUTE] PRIX RETOURNÉ AU FRONTEND', {
        quoteId: responseData.quoteId,
        finalPrice: `${responseData.pricing.finalPrice?.toFixed(2)} €`,
        basePrice: `${responseData.pricing.basePrice?.toFixed(2)} €`,
        totalCosts: `${responseData.pricing.totalCosts?.toFixed(2)} €`,
        marginRate: `${((responseData.pricing.marginRate || 0.30) * 100).toFixed(1)}%`,
        costsBreakdown: responseData.pricing.breakdown?.costsByCategory,
      });
    }

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    devLog.error('API_QUOTATION_CALCULATE', '❌ [ROUTE] Erreur calcul devis', {
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      duration: `${duration}ms`
    });
    throw error;
  }
}

// 🔒 Appliquer rate limiting: 100 requêtes / 15 minutes
export const POST = withRateLimit(handler, RATE_LIMIT_CONFIG.priceCalculate);

