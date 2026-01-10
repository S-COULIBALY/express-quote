/**
 * 🔒 RATE LIMITER - Protection DDoS et abus API
 *
 * Implémente un rate limiting simple en mémoire pour protéger les endpoints critiques
 * Peut être étendu avec Redis pour un partage entre instances
 *
 * Endpoints protégés:
 * - POST /api/price/calculate (scraping tarifs)
 * - POST /api/payment/create-session (abus Stripe)
 * - POST /api/quotesRequest (spam DB)
 * - POST /api/attribution/start (abus Google Maps API)
 */

import { logger } from '@/lib/logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  /**
   * Vérifie si une requête est autorisée
   * @param identifier - Identifiant unique (IP, user ID, etc.)
   * @param windowMs - Fenêtre de temps en millisecondes
   * @param maxRequests - Nombre maximum de requêtes dans la fenêtre
   * @returns { allowed: boolean, remaining: number, resetTime: number }
   */
  check(
    identifier: string,
    windowMs: number,
    maxRequests: number
  ): { allowed: boolean; remaining: number; resetTime: number; current: number } {
    const now = Date.now();
    const entry = this.store.get(identifier);

    // Premier appel ou fenêtre expirée
    if (!entry || now > entry.resetTime) {
      const resetTime = now + windowMs;
      this.store.set(identifier, {
        count: 1,
        resetTime
      });

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime,
        current: 1
      };
    }

    // Limite atteinte
    if (entry.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        current: entry.count
      };
    }

    // Incrémenter le compteur
    entry.count++;
    this.store.set(identifier, entry);

    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetTime: entry.resetTime,
      current: entry.count
    };
  }

  /**
   * Nettoyage des entrées expirées
   */
  private cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`🧹 Rate limiter: ${cleaned} entrées expirées nettoyées`);
    }
  }

  /**
   * Statistiques du rate limiter
   */
  getStats() {
    return {
      totalEntries: this.store.size,
      entries: Array.from(this.store.entries()).map(([key, value]) => ({
        identifier: key,
        count: value.count,
        resetTime: new Date(value.resetTime).toISOString(),
        expiresIn: Math.max(0, value.resetTime - Date.now())
      }))
    };
  }

  /**
   * Réinitialiser le compteur pour un identifiant
   */
  reset(identifier: string) {
    this.store.delete(identifier);
  }

  /**
   * Nettoyage complet (pour tests)
   */
  clear() {
    this.store.clear();
  }

  /**
   * Cleanup on shutdown
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Helper pour extraire l'IP du client (Next.js)
 */
export function getClientIdentifier(req: Request): string {
  // Essayer d'extraire l'IP réelle (derrière proxy/CDN)
  const headers = req.headers;

  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback sur un identifiant unique basé sur les headers
  const userAgent = headers.get('user-agent') || 'unknown';
  return `unknown-${userAgent.slice(0, 50)}`;
}

/**
 * Configuration par défaut du rate limiting
 */
export const RATE_LIMIT_CONFIG = {
  // Endpoints critiques - Limites strictes
  priceCalculate: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_PRICE_CALCULATE || '100')
  },
  paymentSession: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_PAYMENT_SESSION || '50')
  },
  quoteRequest: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_QUOTE_REQUEST || '100')
  },
  attribution: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_ATTRIBUTION || '50')
  },

  // Endpoints généraux - Limites plus souples
  default: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_API_CALLS || '500')
  }
};

/**
 * Middleware Next.js pour rate limiting
 * Utilisation dans une route API:
 *
 * ```typescript
 * import { withRateLimit } from '@/lib/rate-limiter';
 *
 * export const POST = withRateLimit(handler, {
 *   windowMs: 15 * 60 * 1000,
 *   maxRequests: 100
 * });
 * ```
 */
export function withRateLimit(
  handler: (req: Request) => Promise<Response>,
  config: { windowMs: number; maxRequests: number; identifier?: (req: Request) => string }
) {
  return async (req: Request): Promise<Response> => {
    // Extraire l'identifiant (IP ou custom)
    const identifier = config.identifier ? config.identifier(req) : getClientIdentifier(req);

    // Vérifier la limite
    const result = rateLimiter.check(identifier, config.windowMs, config.maxRequests);

    // Ajouter les headers de rate limiting
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    headers.set('X-RateLimit-Remaining', result.remaining.toString());
    headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

    // Limite atteinte
    if (!result.allowed) {
      logger.warn(`🚫 Rate limit atteint pour ${identifier}`, {
        current: result.current,
        limit: config.maxRequests,
        resetTime: new Date(result.resetTime).toISOString()
      });

      headers.set('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000).toString());

      return new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: `Limite de ${config.maxRequests} requêtes atteinte. Réessayez dans ${Math.ceil((result.resetTime - Date.now()) / 1000)}s.`,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          resetTime: new Date(result.resetTime).toISOString()
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // Appeler le handler original
    const response = await handler(req);

    // Ajouter les headers de rate limiting à la réponse
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-RateLimit-Limit', config.maxRequests.toString());
    newHeaders.set('X-RateLimit-Remaining', result.remaining.toString());
    newHeaders.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  };
}
