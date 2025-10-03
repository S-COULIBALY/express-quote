/**
 * Service de retry pour la génération de documents
 *
 * Utilité :
 * - Gestion des échecs de génération PDF avec retry automatique
 * - Logging détaillé pour debugging en production
 * - Circuit breaker pour éviter les surcharges
 * - Monitoring des performances et erreurs
 */

import { logger } from '@/lib/logger';
import { PdfGeneratorService } from './PdfGeneratorService';

/**
 * Configuration du retry
 */
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitterMax: number;
}

/**
 * Configuration du circuit breaker
 */
interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringWindow: number;
}

/**
 * Métrics de performance
 */
interface DocumentMetrics {
  totalAttempts: number;
  successCount: number;
  failureCount: number;
  averageGenerationTime: number;
  lastFailureTime?: Date;
  circuitBreakerState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

/**
 * Service de génération de documents avec retry et monitoring
 */
export class RetryableDocumentService {
  private retryLogger = logger.withContext('RetryableDocumentService');
  private pdfService: PdfGeneratorService;

  private retryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2,
    jitterMax: 500 // 500ms max jitter
  };

  private circuitBreakerConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    recoveryTimeout: 60000, // 1 minute
    monitoringWindow: 300000 // 5 minutes
  };

  private metrics: DocumentMetrics = {
    totalAttempts: 0,
    successCount: 0,
    failureCount: 0,
    averageGenerationTime: 0,
    circuitBreakerState: 'CLOSED'
  };

  private recentFailures: Date[] = [];

  constructor(pdfService?: PdfGeneratorService) {
    this.pdfService = pdfService || new PdfGeneratorService();
  }

  /**
   * Génère un document avec retry automatique
   */
  async generateWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    documentId?: string
  ): Promise<T> {
    const startTime = Date.now();

    // Vérifier le circuit breaker
    if (this.isCircuitBreakerOpen()) {
      this.retryLogger.error('🚫 Circuit breaker ouvert - Opération refusée', {
        operationName,
        documentId,
        circuitBreakerState: this.metrics.circuitBreakerState,
        recentFailures: this.recentFailures.length
      });
      throw new Error('Circuit breaker ouvert - Service temporairement indisponible');
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        this.retryLogger.info(`🔄 Tentative ${attempt}/${this.retryConfig.maxAttempts}`, {
          operationName,
          documentId,
          attempt
        });

        const result = await operation();

        // Succès - mettre à jour les métriques
        const duration = Date.now() - startTime;
        this.updateSuccessMetrics(duration);

        this.retryLogger.info('✅ Opération réussie', {
          operationName,
          documentId,
          attempt,
          duration: `${duration}ms`,
          totalAttempts: this.metrics.totalAttempts,
          successRate: `${((this.metrics.successCount / this.metrics.totalAttempts) * 100).toFixed(1)}%`
        });

        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        this.retryLogger.warn(`⚠️ Échec tentative ${attempt}/${this.retryConfig.maxAttempts}`, {
          operationName,
          documentId,
          attempt,
          error: lastError.message,
          stack: lastError.stack?.substring(0, 200)
        });

        // Si c'est la dernière tentative, pas de retry
        if (attempt === this.retryConfig.maxAttempts) {
          break;
        }

        // Calculer le délai avec backoff exponentiel et jitter
        const delay = this.calculateRetryDelay(attempt);

        this.retryLogger.info(`⏳ Attente avant retry`, {
          operationName,
          documentId,
          nextAttempt: attempt + 1,
          delay: `${delay}ms`
        });

        await this.sleep(delay);
      }
    }

    // Échec final - mettre à jour les métriques
    this.updateFailureMetrics();
    this.updateCircuitBreaker();

    const totalDuration = Date.now() - startTime;

    this.retryLogger.error('❌ Échec définitif après tous les retries', {
      operationName,
      documentId,
      totalAttempts: this.retryConfig.maxAttempts,
      totalDuration: `${totalDuration}ms`,
      finalError: lastError?.message,
      circuitBreakerState: this.metrics.circuitBreakerState,
      failureRate: `${((this.metrics.failureCount / this.metrics.totalAttempts) * 100).toFixed(1)}%`
    });

    throw new Error(`Échec de l'opération ${operationName} après ${this.retryConfig.maxAttempts} tentatives: ${lastError?.message}`);
  }

  /**
   * Génère une facture avec retry
   */
  async generateInvoiceWithRetry(
    invoiceNumber: string,
    customerName: string,
    customerEmail: string,
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>,
    totalAmount: number,
    additionalInfo?: string
  ): Promise<Buffer> {
    return this.generateWithRetry(
      () => this.pdfService.generateInvoice(
        invoiceNumber,
        customerName,
        customerEmail,
        items,
        totalAmount,
        additionalInfo
      ),
      'generateInvoice',
      invoiceNumber
    );
  }

  /**
   * Génère une confirmation de réservation avec retry
   */
  async generateBookingConfirmationWithRetry(
    bookingId: string,
    customerName: string,
    serviceType: string,
    serviceDate: Date | string | undefined,
    totalAmount: number,
    professionalName?: string,
    additionalInfo?: string
  ): Promise<Buffer> {
    return this.generateWithRetry(
      () => this.pdfService.generateBookingConfirmation(
        bookingId,
        customerName,
        serviceType,
        serviceDate,
        totalAmount,
        professionalName,
        additionalInfo
      ),
      'generateBookingConfirmation',
      bookingId
    );
  }

  /**
   * Génère un devis avec retry
   */
  async generateQuoteWithRetry(
    quoteId: string,
    customerName: string,
    customerEmail: string,
    serviceType: string,
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>,
    totalAmount: number,
    validUntil?: Date,
    additionalInfo?: string
  ): Promise<Buffer> {
    return this.generateWithRetry(
      () => this.pdfService.generateQuote(
        quoteId,
        customerName,
        customerEmail,
        serviceType,
        items,
        totalAmount,
        validUntil,
        additionalInfo
      ),
      'generateQuote',
      quoteId
    );
  }

  /**
   * Calcule le délai de retry avec backoff exponentiel et jitter
   */
  private calculateRetryDelay(attempt: number): number {
    const exponentialDelay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
    const cappedDelay = Math.min(exponentialDelay, this.retryConfig.maxDelay);
    const jitter = Math.random() * this.retryConfig.jitterMax;

    return Math.floor(cappedDelay + jitter);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Met à jour les métriques de succès
   */
  private updateSuccessMetrics(duration: number): void {
    this.metrics.totalAttempts++;
    this.metrics.successCount++;

    // Mise à jour de la moyenne de temps de génération
    const newCount = this.metrics.successCount;
    this.metrics.averageGenerationTime =
      (this.metrics.averageGenerationTime * (newCount - 1) + duration) / newCount;

    // Fermer le circuit breaker si ouvert
    if (this.metrics.circuitBreakerState === 'HALF_OPEN') {
      this.metrics.circuitBreakerState = 'CLOSED';
      this.retryLogger.info('🔄 Circuit breaker fermé après succès', {
        successRate: `${((this.metrics.successCount / this.metrics.totalAttempts) * 100).toFixed(1)}%`
      });
    }
  }

  /**
   * Met à jour les métriques d'échec
   */
  private updateFailureMetrics(): void {
    this.metrics.totalAttempts++;
    this.metrics.failureCount++;
    this.metrics.lastFailureTime = new Date();

    // Ajouter à la liste des échecs récents
    this.recentFailures.push(new Date());
    this.cleanupOldFailures();
  }

  /**
   * Met à jour l'état du circuit breaker
   */
  private updateCircuitBreaker(): void {
    const recentFailureCount = this.recentFailures.length;

    if (recentFailureCount >= this.circuitBreakerConfig.failureThreshold) {
      if (this.metrics.circuitBreakerState === 'CLOSED') {
        this.metrics.circuitBreakerState = 'OPEN';
        this.retryLogger.error('🔴 Circuit breaker ouvert', {
          recentFailures: recentFailureCount,
          threshold: this.circuitBreakerConfig.failureThreshold,
          recoveryTimeout: `${this.circuitBreakerConfig.recoveryTimeout}ms`
        });

        // Programmer la tentative de récupération
        setTimeout(() => {
          if (this.metrics.circuitBreakerState === 'OPEN') {
            this.metrics.circuitBreakerState = 'HALF_OPEN';
            this.retryLogger.info('🟡 Circuit breaker en mode half-open');
          }
        }, this.circuitBreakerConfig.recoveryTimeout);
      }
    }
  }

  /**
   * Vérifie si le circuit breaker est ouvert
   */
  private isCircuitBreakerOpen(): boolean {
    return this.metrics.circuitBreakerState === 'OPEN';
  }

  /**
   * Nettoie les échecs anciens de la fenêtre de monitoring
   */
  private cleanupOldFailures(): void {
    const cutoffTime = new Date(Date.now() - this.circuitBreakerConfig.monitoringWindow);
    this.recentFailures = this.recentFailures.filter(failureTime => failureTime > cutoffTime);
  }

  /**
   * Obtient les métriques actuelles
   */
  public getMetrics(): DocumentMetrics & {
    recentFailuresCount: number;
    successRate: number;
  } {
    this.cleanupOldFailures();

    return {
      ...this.metrics,
      recentFailuresCount: this.recentFailures.length,
      successRate: this.metrics.totalAttempts > 0
        ? (this.metrics.successCount / this.metrics.totalAttempts) * 100
        : 0
    };
  }

  /**
   * Reset les métriques (pour les tests ou maintenance)
   */
  public resetMetrics(): void {
    this.metrics = {
      totalAttempts: 0,
      successCount: 0,
      failureCount: 0,
      averageGenerationTime: 0,
      circuitBreakerState: 'CLOSED'
    };
    this.recentFailures = [];

    this.retryLogger.info('🔄 Métriques réinitialisées');
  }

  /**
   * Met à jour la configuration de retry
   */
  public updateRetryConfig(newConfig: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...newConfig };
    this.retryLogger.info('⚙️ Configuration de retry mise à jour', { newConfig });
  }

  /**
   * Met à jour la configuration du circuit breaker
   */
  public updateCircuitBreakerConfig(newConfig: Partial<CircuitBreakerConfig>): void {
    this.circuitBreakerConfig = { ...this.circuitBreakerConfig, ...newConfig };
    this.retryLogger.info('⚙️ Configuration circuit breaker mise à jour', { newConfig });
  }
}

export default RetryableDocumentService;