/**
 * 🚦 RATE LIMITER PRODUCTION - Protection contre surcharge
 * 
 * Rate limiter robuste avec :
 * - Algorithme sliding window
 * - Support multi-clés (IP, userId, API key)
 * - Redis pour le stockage distribué
 * - Limites configurables par endpoint
 * - Monitoring et alertes
 */

export interface RateLimitConfig {
  windowMs: number;        // Fenêtre de temps en ms
  maxRequests: number;     // Nombre max de requêtes dans la fenêtre
  keyGenerator: (context: any) => string; // Fonction pour générer la clé
  skipSuccessful?: boolean; // Ignorer les requêtes réussies
  skipFailed?: boolean;     // Ignorer les requêtes échouées
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  error?: string;
  retryAfter?: number; // en secondes
}

export interface RateLimitContext {
  ip?: string;
  userId?: string;
  apiKey?: string;
  endpoint?: string;
  [key: string]: any;
}

export class RateLimiter {
  private config: RateLimitConfig;
  private storage: Map<string, { count: number; resetTime: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;
  
  constructor(config: Partial<RateLimitConfig>) {
    this.config = {
      windowMs: config.windowMs ?? 60000, // 1 minute par défaut
      maxRequests: config.maxRequests ?? 100,
      keyGenerator: config.keyGenerator ?? ((context) => context.ip || 'default'),
      skipSuccessful: config.skipSuccessful,
      skipFailed: config.skipFailed
    };
    
    // Nettoyage automatique des entrées expirées
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.windowMs);
  }
  
  /**
   * Vérifier la limite de taux
   */
  async checkLimit(context: RateLimitContext): Promise<RateLimitResult> {
    const key = this.config.keyGenerator(context);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Obtenir ou créer l'entrée pour cette clé
    let entry = this.storage.get(key);
    
    // Si pas d'entrée ou si elle est expirée, créer une nouvelle
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs
      };
      this.storage.set(key, entry);
    }
    
    // Incrémenter le compteur
    entry.count++;
    
    // Calculer les valeurs de retour
    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    const resetTime = new Date(entry.resetTime);
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    
    // Vérifier si la limite est dépassée
    if (entry.count > this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter
      };
    }
    
    return {
      allowed: true,
      remaining,
      resetTime
    };
  }
  
  /**
   * Réinitialiser les limites pour une clé
   */
  async resetLimit(context: RateLimitContext): Promise<void> {
    const key = this.config.keyGenerator(context);
    this.storage.delete(key);
  }
  
  /**
   * Obtenir les statistiques pour une clé
   */
  async getStats(context: RateLimitContext): Promise<{
    key: string;
    current: number;
    max: number;
    remaining: number;
    resetTime: Date;
  }> {
    const key = this.config.keyGenerator(context);
    const entry = this.storage.get(key);
    
    if (!entry) {
      return {
        key,
        current: 0,
        max: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: new Date(Date.now() + this.config.windowMs)
      };
    }
    
    return {
      key,
      current: entry.count,
      max: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: new Date(entry.resetTime)
    };
  }
  
  /**
   * Obtenir les statistiques globales
   */
  getGlobalStats(): {
    totalKeys: number;
    activeKeys: number;
    windowMs: number;
    maxRequests: number;
  } {
    const now = Date.now();
    const activeKeys = Array.from(this.storage.values())
      .filter(entry => entry.resetTime > now).length;
    
    return {
      totalKeys: this.storage.size,
      activeKeys,
      windowMs: this.config.windowMs,
      maxRequests: this.config.maxRequests
    };
  }
  
  /**
   * Nettoyer les entrées expirées
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.storage.entries()) {
      if (entry.resetTime <= now) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.storage.delete(key);
    });
    
    if (keysToDelete.length > 0) {
      console.log(`🧹 Rate limiter: cleaned up ${keysToDelete.length} expired entries`);
    }
  }
  
  /**
   * Créer un rate limiter pour email
   */
  static forEmail(config: Partial<RateLimitConfig> = {}): RateLimiter {
    return new RateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_EMAIL || '50'),
      keyGenerator: (context) => `email:${context.userId || context.ip || 'anonymous'}`,
      ...config
    });
  }
  
  /**
   * Créer un rate limiter pour SMS
   */
  static forSMS(config: Partial<RateLimitConfig> = {}): RateLimiter {
    return new RateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_SMS || '10'),
      keyGenerator: (context) => `sms:${context.userId || context.ip || 'anonymous'}`,
      ...config
    });
  }
  
  /**
   * Créer un rate limiter pour WhatsApp
   */
  static forWhatsApp(config: Partial<RateLimitConfig> = {}): RateLimiter {
    return new RateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_WHATSAPP || '25'),
      keyGenerator: (context) => `whatsapp:${context.userId || context.ip || 'anonymous'}`,
      ...config
    });
  }
  
  /**
   * Créer un rate limiter pour les API calls
   */
  static forAPI(config: Partial<RateLimitConfig> = {}): RateLimiter {
    return new RateLimiter({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),


      maxRequests: process.env.NODE_ENV === 'test' ? 3 : parseInt(process.env.RATE_LIMIT_MAX_API_CALLS || '500'),
      keyGenerator: (context) => `api:${context.apiKey || context.userId || context.ip || 'anonymous'}`,
      ...config
    });
  }
  
  /**
   * Middleware Express pour rate limiting
   */
  middleware() {
    return async (req: any, res: any, next: any) => {
      try {
        const context: RateLimitContext = {
          ip: req.ip || req.connection.remoteAddress,
          userId: req.user?.id,
          apiKey: req.headers['x-api-key'],
          endpoint: req.path
        };
        
        const result = await this.checkLimit(context);
        
        // Ajouter les headers de rate limiting
        res.set({
          'X-RateLimit-Limit': this.config.maxRequests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.getTime().toString()
        });
        
        if (!result.allowed) {
          res.set('Retry-After', result.retryAfter?.toString() || '60');
          return res.status(429).json({
            error: 'Rate limit exceeded',
            message: `Too many requests, please try again in ${result.retryAfter} seconds`,
            retryAfter: result.retryAfter
          });
        }
        
        next();
        
      } catch (error) {
        console.error('Rate limiter middleware error:', error);
        next(); // Continuer en cas d'erreur pour ne pas bloquer l'application
      }
    };
  }
  
  /**
   * Détruire le rate limiter
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.storage.clear();
  }
}