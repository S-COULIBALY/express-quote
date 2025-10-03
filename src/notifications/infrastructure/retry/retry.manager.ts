/**
 * 🔄 GESTIONNAIRE DE RETRY ROBUSTE
 * 
 * Système de retry intelligent avec :
 * - Exponential backoff
 * - Jitter pour éviter thundering herd
 * - Classification des erreurs (retriable/non-retriable)
 * - Métriques de performance
 * - Timeout configurable
 */

export interface RetryConfig {
  /** Nombre maximum de tentatives */
  maxRetries: number;
  
  /** Délai initial en millisecondes */
  initialDelay: number;
  
  /** Délai maximum en millisecondes */
  maxDelay: number;
  
  /** Multiplicateur pour backoff exponentiel */
  backoffMultiplier: number;
  
  /** Ajouter du jitter (randomisation) pour éviter thundering herd */
  enableJitter: boolean;
  
  /** Timeout global pour toutes les tentatives */
  globalTimeout?: number;
  
  /** Callback appelé avant chaque retry */
  onRetry?: (attempt: number, error: Error, nextDelay: number) => void;
  
  /** Fonction pour déterminer si une erreur est retriable */
  isRetriable?: (error: Error) => boolean;
}

export interface RetryResult<T> {
  /** Résultat de l'opération (si succès) */
  result?: T;
  
  /** Erreur finale (si échec) */
  error?: Error;
  
  /** Succès ou échec */
  success: boolean;
  
  /** Nombre de tentatives effectuées */
  attempts: number;
  
  /** Temps total écoulé en millisecondes */
  totalTime: number;
  
  /** Détails de chaque tentative */
  attemptDetails: Array<{
    attempt: number;
    error?: string;
    delay: number;
    timestamp: number;
  }>;
}

/**
 * Erreurs spécifiques au système de retry
 */
export class RetryTimeoutError extends Error {
  constructor(attempts: number, totalTime: number) {
    super(`Retry timeout after ${attempts} attempts (${totalTime}ms)`);
    this.name = 'RetryTimeoutError';
  }
}

export class NonRetriableError extends Error {
  constructor(originalError: Error) {
    super(`Non-retriable error: ${originalError.message}`);
    this.name = 'NonRetriableError';
    this.cause = originalError;
  }
}

/**
 * Gestionnaire de retry avec backoff exponentiel
 */
export class RetryManager {
  private config: Required<RetryConfig>;
  
  constructor(config: Partial<RetryConfig>) {
    // Configuration par défaut
    this.config = {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      enableJitter: true,
      globalTimeout: 300000, // 5 minutes
      onRetry: () => {},
      isRetriable: this.defaultIsRetriable,
      ...config
    } as Required<RetryConfig>;
    
    // Validation de la configuration
    this.validateConfig();
  }
  
  /**
   * Valider la configuration
   */
  private validateConfig(): void {
    if (this.config.maxRetries < 0) {
      throw new Error('maxRetries must be >= 0');
    }
    
    if (this.config.initialDelay < 0) {
      throw new Error('initialDelay must be >= 0');
    }
    
    if (this.config.maxDelay < this.config.initialDelay) {
      throw new Error('maxDelay must be >= initialDelay');
    }
    
    if (this.config.backoffMultiplier <= 0) {
      throw new Error('backoffMultiplier must be > 0');
    }
  }
  
  /**
   * Classification par défaut des erreurs retriables
   */
  private defaultIsRetriable = (error: Error): boolean => {
    // Erreurs de réseau retriables
    const retriableErrors = [
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'EAI_AGAIN',
      'EPIPE',
      'ECONNABORTED'
    ];
    
    // Vérifier le code d'erreur
    if ('code' in error && typeof error.code === 'string') {
      if (retriableErrors.includes(error.code)) {
        return true;
      }
    }
    
    // Erreurs HTTP retriables (5xx)
    if ('status' in error && typeof error.status === 'number') {
      return error.status >= 500 && error.status < 600;
    }
    
    // Messages d'erreur spécifiques
    const retriableMessages = [
      'timeout',
      'connection reset',
      'network error',
      'server error',
      'service unavailable',
      'rate limit',
      'too many requests'
    ];
    
    const errorMessage = error.message.toLowerCase();
    return retriableMessages.some(msg => errorMessage.includes(msg));
  };
  
  /**
   * Calculer le délai pour la prochaine tentative
   */
  private calculateDelay(attempt: number): number {
    let delay = this.config.initialDelay * Math.pow(this.config.backoffMultiplier, attempt);
    
    // Appliquer le maximum
    delay = Math.min(delay, this.config.maxDelay);
    
    // Ajouter du jitter si activé
    if (this.config.enableJitter) {
      // Jitter de ±25%
      const jitterRange = delay * 0.25;
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      delay += jitter;
    }
    
    return Math.max(0, Math.round(delay));
  }
  
  /**
   * Attendre un délai avec possibilité d'interruption
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Exécuter une opération avec retry
   */
  async execute<T>(
    operation: () => Promise<T>,
    contextInfo?: string
  ): Promise<RetryResult<T>> {
    const startTime = Date.now();
    const attemptDetails: RetryResult<T>['attemptDetails'] = [];
    let lastError: Error | undefined;
    
    // Timeout global
    const globalTimeoutPromise = this.config.globalTimeout 
      ? new Promise<never>((_, reject) => 
          setTimeout(() => reject(new RetryTimeoutError(0, Date.now() - startTime)), this.config.globalTimeout)
        )
      : null;
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      const attemptStartTime = Date.now();
      
      try {
        // Exécuter l'opération avec timeout global
        const operationPromise = operation();
        const result = globalTimeoutPromise 
          ? await Promise.race([operationPromise, globalTimeoutPromise])
          : await operationPromise;
        
        // Succès !
        attemptDetails.push({
          attempt: attempt + 1,
          delay: 0,
          timestamp: attemptStartTime
        });
        
        return {
          result,
          success: true,
          attempts: attempt + 1,
          totalTime: Date.now() - startTime,
          attemptDetails
        };
        
      } catch (error) {
        lastError = error as Error;
        
        // Vérifier si c'est une erreur retriable
        if (!this.config.isRetriable(lastError)) {
          attemptDetails.push({
            attempt: attempt + 1,
            error: lastError.message,
            delay: 0,
            timestamp: attemptStartTime
          });
          
          return {
            error: new NonRetriableError(lastError),
            success: false,
            attempts: attempt + 1,
            totalTime: Date.now() - startTime,
            attemptDetails
          };
        }
        
        // Si c'est la dernière tentative, on s'arrête
        if (attempt === this.config.maxRetries) {
          attemptDetails.push({
            attempt: attempt + 1,
            error: lastError.message,
            delay: 0,
            timestamp: attemptStartTime
          });
          
          break;
        }
        
        // Calculer le délai pour la prochaine tentative
        const nextDelay = this.calculateDelay(attempt);
        
        attemptDetails.push({
          attempt: attempt + 1,
          error: lastError.message,
          delay: nextDelay,
          timestamp: attemptStartTime
        });
        
        // Callback de retry
        this.config.onRetry(attempt + 1, lastError, nextDelay);
        
        console.log(`🔄 Retry attempt ${attempt + 1}/${this.config.maxRetries + 1} for ${contextInfo || 'operation'}: ${lastError.message}. Next attempt in ${nextDelay}ms`);
        
        // Attendre avant la prochaine tentative
        if (globalTimeoutPromise) {
          await Promise.race([this.delay(nextDelay), globalTimeoutPromise]);
        } else {
          await this.delay(nextDelay);
        }
      }
    }
    
    // Échec final
    return {
      error: lastError || new Error('Unknown error'),
      success: false,
      attempts: this.config.maxRetries + 1,
      totalTime: Date.now() - startTime,
      attemptDetails
    };
  }
  
  /**
   * Créer un retry manager avec configuration spécifique pour un type d'erreur
   */
  static forEmailSending(config: Partial<RetryConfig> = {}): RetryManager {
    return new RetryManager({
      maxRetries: 3,
      initialDelay: 2000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      enableJitter: true,
      globalTimeout: 300000, // 5 minutes pour email
      isRetriable: (error: Error) => {
        // Erreurs SMTP spécifiques retriables
        const smtpRetriableMessages = [
          'timeout',
          'connection',
          'network',
          'temporary failure',
          'try again',
          'rate limit',
          '4.', // Codes d'erreur SMTP 4xx (temporaires)
        ];
        
        const errorMessage = error.message.toLowerCase();
        return smtpRetriableMessages.some(msg => errorMessage.includes(msg));
      },
      ...config
    });
  }
  
  /**
   * Créer un retry manager pour SMS
   */
  static forSMS(config: Partial<RetryConfig> = {}): RetryManager {
    return new RetryManager({
      maxRetries: 2,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 3,
      enableJitter: true,
      globalTimeout: 60000, // 1 minute pour SMS
      isRetriable: (error: Error) => {
        // Erreurs SMS spécifiques retriables
        const smsRetriableMessages = [
          'timeout',
          'rate limit',
          'temporary',
          'try again',
          'network',
          'connection',
          '429', // Rate limit HTTP
          '503', // Service temporairement indisponible
          '502', // Bad gateway
        ];
        
        const errorMessage = error.message.toLowerCase();
        return smsRetriableMessages.some(msg => errorMessage.includes(msg));
      },
      ...config
    });
  }
  
  /**
   * Créer un retry manager pour WhatsApp
   */
  static forWhatsApp(config: Partial<RetryConfig> = {}): RetryManager {
    return new RetryManager({
      maxRetries: 3,
      initialDelay: 1500,
      maxDelay: 20000,
      backoffMultiplier: 2.5,
      enableJitter: true,
      globalTimeout: 120000, // 2 minutes pour WhatsApp
      isRetriable: (error: Error) => {
        // Erreurs WhatsApp spécifiques retriables
        const whatsappRetriableMessages = [
          'timeout',
          'rate limit',
          'temporary',
          'try again',
          'network',
          'connection',
          '429', // Rate limit
          '500', // Internal server error
          '502', // Bad gateway
          '503', // Service unavailable
          '80007', // WhatsApp rate limit code
        ];
        
        const errorMessage = error.message.toLowerCase();
        return whatsappRetriableMessages.some(msg => errorMessage.includes(msg));
      },
      ...config
    });
  }
  
  /**
   * Obtenir les statistiques de configuration
   */
  getStats(): {
    config: RetryConfig;
    estimatedMaxTime: number;
    estimatedAverageTime: number;
  } {
    // Calculer le temps maximum théorique
    let maxTime = 0;
    for (let i = 0; i < this.config.maxRetries; i++) {
      maxTime += this.calculateDelay(i);
    }
    
    return {
      config: { ...this.config },
      estimatedMaxTime: Math.min(maxTime, this.config.globalTimeout || Infinity),
      estimatedAverageTime: maxTime * 0.6 // Estimation approximative
    };
  }
}