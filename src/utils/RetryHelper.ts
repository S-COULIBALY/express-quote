import { logger } from '@/lib/logger';

/**
 * Configuration des options de nouvelle tentative
 */
export interface RetryOptions {
  /** Nombre maximum de tentatives (incluant la première tentative) */
  maxAttempts?: number;
  /** Délai initial entre les tentatives (en ms) */
  initialDelayMs?: number;
  /** Facteur de backoff pour augmenter le délai exponentiellement */
  backoffFactor?: number;
  /** Délai maximum entre les tentatives (en ms) */
  maxDelayMs?: number;
  /** Fonction pour déterminer si l'erreur est rétryable */
  isRetryableError?: (error: any) => boolean;
  /** Contexte pour les logs */
  context?: string;
}

/**
 * Classe helper pour exécuter des opérations avec mécanisme de nouvelle tentative
 */
export class RetryHelper {
  private retryLogger = logger.withContext('RetryHelper');
  private context: string;

  constructor(private options: RetryOptions = {}) {
    // Valeurs par défaut
    this.options.maxAttempts = this.options.maxAttempts || 3;
    this.options.initialDelayMs = this.options.initialDelayMs || 1000;
    this.options.backoffFactor = this.options.backoffFactor || 2;
    this.options.maxDelayMs = this.options.maxDelayMs || 30000;
    this.options.isRetryableError = this.options.isRetryableError || (() => true);
    this.context = this.options.context || 'default';
  }

  /**
   * Exécute une opération avec mécanisme de nouvelle tentative
   * @param operation Fonction à exécuter
   * @param operationName Nom de l'opération pour les logs
   * @returns Résultat de l'opération
   */
  async execute<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    let attempt = 1;
    let delay = this.options.initialDelayMs!;
    let lastError: any;

    while (attempt <= this.options.maxAttempts!) {
      try {
        if (attempt > 1) {
          this.retryLogger.info(`${this.context}: Tentative ${attempt}/${this.options.maxAttempts} pour ${operationName}`);
        }
        
        const result = await operation();
        
        if (attempt > 1) {
          this.retryLogger.info(`${this.context}: Succès à la tentative ${attempt}/${this.options.maxAttempts} pour ${operationName}`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt === this.options.maxAttempts || !this.options.isRetryableError!(error)) {
          // Si c'est la dernière tentative ou l'erreur n'est pas retryable, on abandonne
          this.retryLogger.error(`${this.context}: Échec définitif (${attempt}/${this.options.maxAttempts}) pour ${operationName}:`, error);
          break;
        }
        
        // Calcul du délai avec backoff exponentiel
        delay = Math.min(delay * this.options.backoffFactor!, this.options.maxDelayMs!);
        
        this.retryLogger.warn(
          `${this.context}: Échec de la tentative ${attempt}/${this.options.maxAttempts} pour ${operationName}, nouvelle tentative dans ${delay}ms:`,
          error
        );
        
        // Attendre avant la nouvelle tentative
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      }
    }
    
    // Si on arrive ici, c'est que toutes les tentatives ont échoué
    throw lastError;
  }

  /**
   * Fonction pour déterminer si une erreur est due à un problème réseau
   * @param error Erreur à analyser
   * @returns true si l'erreur est liée au réseau
   */
  static isNetworkError(error: any): boolean {
    if (!error) return false;
    
    const errorString = error.toString().toLowerCase();
    const errorMessage = error.message ? error.message.toLowerCase() : '';
    
    return (
      errorString.includes('network') ||
      errorString.includes('connection') ||
      errorString.includes('timeout') ||
      errorString.includes('econnrefused') ||
      errorString.includes('econnreset') ||
      errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT'
    );
  }

  /**
   * Fonction pour déterminer si une erreur est due à une surcharge de service
   * @param error Erreur à analyser
   * @returns true si l'erreur est liée à une surcharge
   */
  static isThrottlingError(error: any): boolean {
    if (!error) return false;
    
    // Codes d'erreurs HTTP liés à la surcharge
    const throttleCodes = [429, 503, 504];
    
    const errorString = error.toString().toLowerCase();
    const statusCode = error.statusCode || (error.response ? error.response.status : null);
    
    return (
      throttleCodes.includes(statusCode) ||
      errorString.includes('rate limit') ||
      errorString.includes('throttl') ||
      errorString.includes('too many requests') ||
      errorString.includes('quota exceeded')
    );
  }

  /**
   * Fonction pour déterminer si une erreur est temporaire et peut être retentée
   * @param error Erreur à analyser
   * @returns true si l'erreur est temporaire
   */
  static isRetryableError(error: any): boolean {
    return RetryHelper.isNetworkError(error) || 
           RetryHelper.isThrottlingError(error) || 
           RetryHelper.isTransientError(error);
  }

  /**
   * Fonction pour déterminer si une erreur est transitoire
   * @param error Erreur à analyser
   * @returns true si l'erreur est transitoire
   */
  static isTransientError(error: any): boolean {
    if (!error) return false;
    
    // Codes d'erreur HTTP transitoires
    const transientCodes = [408, 500, 502, 503, 504];
    
    const statusCode = error.statusCode || (error.response ? error.response.status : null);
    const errorString = error.toString().toLowerCase();
    
    return (
      transientCodes.includes(statusCode) ||
      errorString.includes('temporary') ||
      errorString.includes('timeout') ||
      errorString.includes('transient')
    );
  }
} 