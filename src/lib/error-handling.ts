// ✅ SYSTÈME DE GESTION D'ERREURS AVANCÉ
// Retry automatique, timeouts, fallbacks intelligents, et récupération d'erreurs

export interface ErrorHandlingConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  timeout: number;
  exponentialBackoff: boolean;
  fallbackEnabled: boolean;
  enableLogging: boolean;
}

export interface RetryResult<T> {
  success: boolean;
  data: T | null;
  error: Error | null;
  attempt: number;
  totalDuration: number;
  usedFallback: boolean;
}

export class AdvancedErrorHandler {
  private config: ErrorHandlingConfig;

  constructor(config?: Partial<ErrorHandlingConfig>) {
    this.config = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      timeout: 30000,
      exponentialBackoff: true,
      fallbackEnabled: true,
      enableLogging: true,
      ...config
    };
  }

  // ✅ FONCTION PRINCIPALE - Exécuter avec retry et gestion d'erreurs
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    fallbackOperation?: () => Promise<T> | T
  ): Promise<RetryResult<T>> {
    const startTime = performance.now();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        if (this.config.enableLogging) {
          console.log(`🔄 [ERROR-HANDLER] ${operationName} - Tentative ${attempt}/${this.config.maxRetries}`);
        }

        // Créer une promesse avec timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Timeout après ${this.config.timeout}ms`)), this.config.timeout);
        });

        const result = await Promise.race([operation(), timeoutPromise]);

        // Succès !
        const duration = performance.now() - startTime;
        if (this.config.enableLogging) {
          console.log(`✅ [ERROR-HANDLER] ${operationName} réussi en ${duration.toFixed(2)}ms (tentative ${attempt})`);
        }

        return {
          success: true,
          data: result,
          error: null,
          attempt,
          totalDuration: duration,
          usedFallback: false
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (this.config.enableLogging) {
          console.warn(`⚠️ [ERROR-HANDLER] ${operationName} échec tentative ${attempt}:`, lastError.message);
        }

        // Si c'est la dernière tentative, on ne fait pas de délai
        if (attempt < this.config.maxRetries) {
          const delay = this.calculateDelay(attempt);
          if (this.config.enableLogging) {
            console.log(`⏳ [ERROR-HANDLER] Attente ${delay}ms avant nouvelle tentative...`);
          }
          await this.sleep(delay);
        }
      }
    }

    // Toutes les tentatives ont échoué, essayer le fallback
    if (this.config.fallbackEnabled && fallbackOperation) {
      try {
        if (this.config.enableLogging) {
          console.log(`🔧 [ERROR-HANDLER] ${operationName} - Utilisation du fallback`);
        }

        const fallbackResult = await fallbackOperation();
        const duration = performance.now() - startTime;

        if (this.config.enableLogging) {
          console.log(`✅ [ERROR-HANDLER] ${operationName} fallback réussi en ${duration.toFixed(2)}ms`);
        }

        return {
          success: true,
          data: fallbackResult,
          error: lastError,
          attempt: this.config.maxRetries,
          totalDuration: duration,
          usedFallback: true
        };

      } catch (fallbackError) {
        if (this.config.enableLogging) {
          console.error(`❌ [ERROR-HANDLER] ${operationName} fallback échoué:`, fallbackError);
        }
      }
    }

    // Échec total
    const duration = performance.now() - startTime;
    if (this.config.enableLogging) {
      console.error(`❌ [ERROR-HANDLER] ${operationName} échec total après ${this.config.maxRetries} tentatives`);
    }

    return {
      success: false,
      data: null,
      error: lastError,
      attempt: this.config.maxRetries,
      totalDuration: duration,
      usedFallback: false
    };
  }

  // ✅ CALCULER LE DÉLAI ENTRE LES TENTATIVES
  private calculateDelay(attempt: number): number {
    if (!this.config.exponentialBackoff) {
      return this.config.baseDelay;
    }

    // Exponential backoff avec jitter
    const exponentialDelay = this.config.baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // Ajouter jusqu'à 1 seconde de variabilité
    const finalDelay = Math.min(exponentialDelay + jitter, this.config.maxDelay);

    return Math.floor(finalDelay);
  }

  // ✅ FONCTION UTILITAIRE POUR ATTENDRE
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ✅ VÉRIFIER SI UNE ERREUR EST RÉCUPÉRABLE
  static isRecoverableError(error: Error): boolean {
    const recoverablePatterns = [
      /network/i,
      /timeout/i,
      /fetch/i,
      /connection/i,
      /ECONNRESET/i,
      /ENOTFOUND/i,
      /502/,
      /503/,
      /504/
    ];

    return recoverablePatterns.some(pattern => pattern.test(error.message));
  }

  // ✅ CRÉER UNE ERREUR PERSONNALISÉE AVEC CONTEXTE
  static createContextualError(
    originalError: Error,
    context: string,
    metadata?: Record<string, any>
  ): Error {
    const enhancedError = new Error(`${context}: ${originalError.message}`);
    enhancedError.name = 'ContextualError';
    (enhancedError as any).originalError = originalError;
    (enhancedError as any).context = context;
    (enhancedError as any).metadata = metadata;
    return enhancedError;
  }
}

// ✅ INSTANCES PRÉCONFIGURÉES POUR DIFFÉRENTS USAGES

// Pour les appels API critiques (plus de tentatives)
export const criticalApiErrorHandler = new AdvancedErrorHandler({
  maxRetries: 5,
  baseDelay: 2000,
  maxDelay: 15000,
  timeout: 45000,
  exponentialBackoff: true,
  fallbackEnabled: true,
  enableLogging: true
});

// Pour les appels API rapides (moins de tentatives)
export const quickApiErrorHandler = new AdvancedErrorHandler({
  maxRetries: 2,
  baseDelay: 500,
  maxDelay: 3000,
  timeout: 10000,
  exponentialBackoff: true,
  fallbackEnabled: true,
  enableLogging: true
});

// Pour les opérations de cache (très tolérant aux erreurs)
export const cacheErrorHandler = new AdvancedErrorHandler({
  maxRetries: 1,
  baseDelay: 100,
  maxDelay: 1000,
  timeout: 5000,
  exponentialBackoff: false,
  fallbackEnabled: true,
  enableLogging: false
});

// ✅ FONCTIONS UTILITAIRES POUR L'USAGE COURANT

export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  config?: Partial<ErrorHandlingConfig>,
  fallback?: () => Promise<T> | T
): Promise<RetryResult<T>> {
  const handler = new AdvancedErrorHandler(config);
  return handler.executeWithRetry(operation, operationName, fallback);
}

export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  fallbackData: T,
  operationName: string = 'API Call'
): Promise<T> {
  const result = await quickApiErrorHandler.executeWithRetry(
    apiCall,
    operationName,
    () => fallbackData
  );

  return result.data || fallbackData;
}

export async function criticalApiCall<T>(
  apiCall: () => Promise<T>,
  operationName: string = 'Critical API Call'
): Promise<T> {
  const result = await criticalApiErrorHandler.executeWithRetry(apiCall, operationName);

  if (!result.success) {
    throw AdvancedErrorHandler.createContextualError(
      result.error || new Error('Unknown error'),
      `Critical operation failed: ${operationName}`,
      {
        attempts: result.attempt,
        duration: result.totalDuration,
        usedFallback: result.usedFallback
      }
    );
  }

  return result.data!;
}

// ✅ HOOK REACT POUR LA GESTION D'ERREURS
export function useErrorHandler(config?: Partial<ErrorHandlingConfig>) {
  const handler = new AdvancedErrorHandler(config);

  return {
    executeWithRetry: handler.executeWithRetry.bind(handler),
    safeExecute: async <T>(
      operation: () => Promise<T>,
      fallback: T,
      operationName: string = 'Operation'
    ): Promise<T> => {
      const result = await handler.executeWithRetry(operation, operationName, () => fallback);
      return result.data || fallback;
    }
  };
}