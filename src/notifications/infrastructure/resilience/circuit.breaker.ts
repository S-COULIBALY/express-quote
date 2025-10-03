/**
 * ⚡ CIRCUIT BREAKER PATTERN
 * 
 * Implémentation du pattern Circuit Breaker pour la résilience :
 * - États : CLOSED (normal), OPEN (échecs), HALF_OPEN (test)
 * - Protection contre les cascades d'échecs
 * - Récupération automatique avec test graduel
 * - Métriques temps réel
 * - Callbacks configurables
 */

export interface CircuitBreakerConfig {
  /** Nombre d'échecs consécutifs avant ouverture */
  failureThreshold: number;
  
  /** Timeout pour les opérations (ms) */
  timeout: number;
  
  /** Temps d'attente avant test de récupération (ms) */
  resetTimeout: number;
  
  /** Callback appelé lors du changement d'état */
  onStateChange?: (oldState: CircuitState, newState: CircuitState, reason: string) => void;
  
  /** Callback appelé lors d'un échec */
  onFailure?: (error: Error) => void;
  
  /** Callback appelé lors d'un succès */
  onSuccess?: () => void;
  
  /** Fonction pour déterminer si une erreur doit compter comme échec */
  isFailure?: (error: Error) => boolean;
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerResult<T> {
  /** Résultat de l'opération (si succès) */
  result?: T;
  
  /** Erreur (si échec) */
  error?: CircuitBreakerError | Error;
  
  /** Succès ou échec */
  success: boolean;
  
  /** État du circuit au moment de l'appel */
  circuitState: CircuitState;
  
  /** Temps d'exécution en millisecondes */
  executionTime: number;
  
  /** Métadonnées du circuit */
  metadata: {
    failures: number;
    successes: number;
    lastFailure?: Date;
    lastSuccess?: Date;
  };
}

/**
 * Erreurs spécifiques au circuit breaker
 */
export class CircuitBreakerError extends Error {
  constructor(
    public type: 'CIRCUIT_OPEN' | 'TIMEOUT' | 'HALF_OPEN_FAILURE',
    message: string,
    public circuitState: CircuitState,
    public metadata?: any
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

/**
 * Métriques du circuit breaker
 */
interface CircuitMetrics {
  /** Nombre d'échecs consécutifs */
  consecutiveFailures: number;
  
  /** Nombre total d'échecs */
  totalFailures: number;
  
  /** Nombre total de succès */
  totalSuccesses: number;
  
  /** Date du dernier échec */
  lastFailure?: Date;
  
  /** Date du dernier succès */
  lastSuccess?: Date;
  
  /** Date d'ouverture du circuit */
  openedAt?: Date;
  
  /** Nombre de fois que le circuit s'est ouvert */
  totalOpens: number;
  
  /** Temps de réponse moyen (ms) */
  averageResponseTime: number;
  
  /** Historique des temps de réponse */
  responseTimeHistory: number[];
}

/**
 * Circuit Breaker avec états et métriques
 */
export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private config: Required<CircuitBreakerConfig>;
  private metrics: CircuitMetrics;
  private stateChangeTime: Date = new Date();
  
  constructor(config: CircuitBreakerConfig) {
    // Configuration par défaut avec spread operator correct
    const defaultConfig = {
      failureThreshold: 5,
      timeout: 10000,
      resetTimeout: 60000,
      onStateChange: () => {},
      onFailure: () => {},
      onSuccess: () => {},
      isFailure: this.defaultIsFailure,
    };
    
    this.config = {
      ...defaultConfig,
      ...config
    } as Required<CircuitBreakerConfig>;
    
    // Initialiser les métriques
    this.metrics = {
      consecutiveFailures: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      totalOpens: 0,
      averageResponseTime: 0,
      responseTimeHistory: []
    };
    
    // Validation de la configuration
    this.validateConfig();
  }
  
  /**
   * Valider la configuration
   */
  private validateConfig(): void {
    if (this.config.failureThreshold <= 0) {
      throw new Error('failureThreshold must be > 0');
    }
    
    if (this.config.timeout <= 0) {
      throw new Error('timeout must be > 0');
    }
    
    if (this.config.resetTimeout <= 0) {
      throw new Error('resetTimeout must be > 0');
    }
  }
  
  /**
   * Classification par défaut des échecs
   */
  private defaultIsFailure = (error: Error): boolean => {
    // Toutes les erreurs sauf timeout du circuit breaker lui-même
    return !(error instanceof CircuitBreakerError);
  };
  
  /**
   * Changer l'état du circuit
   */
  private changeState(newState: CircuitState, reason: string): void {
    if (this.state === newState) return;
    
    const oldState = this.state;
    this.state = newState;
    this.stateChangeTime = new Date();
    
    console.log(`⚡ Circuit breaker state changed: ${oldState} -> ${newState} (${reason})`);
    
    // Callback de changement d'état
    this.config.onStateChange(oldState, newState, reason);
    
    // Actions spécifiques selon le nouvel état
    switch (newState) {
      case 'OPEN':
        this.metrics.openedAt = new Date();
        this.metrics.totalOpens++;
        break;
        
      case 'HALF_OPEN':
        console.log(`🔄 Circuit breaker testing recovery...`);
        break;
        
      case 'CLOSED':
        this.metrics.consecutiveFailures = 0;
        console.log(`✅ Circuit breaker recovered`);
        break;
    }
  }
  
  /**
   * Vérifier si le circuit doit passer en HALF_OPEN
   */
  private shouldTryReset(): boolean {
    if (this.state !== 'OPEN') return false;
    
    const timeSinceOpened = Date.now() - this.stateChangeTime.getTime();
    return timeSinceOpened >= this.config.resetTimeout;
  }
  
  /**
   * Enregistrer un succès
   */
  private recordSuccess(responseTime: number): void {
    this.metrics.consecutiveFailures = 0;
    this.metrics.totalSuccesses++;
    this.metrics.lastSuccess = new Date();
    
    // Mettre à jour les temps de réponse
    this.updateResponseTime(responseTime);
    
    this.config.onSuccess();
    
    // Si on était en HALF_OPEN, revenir à CLOSED
    if (this.state === 'HALF_OPEN') {
      this.changeState('CLOSED', 'Recovery test successful');
    }
  }
  
  /**
   * Enregistrer un échec
   */
  private recordFailure(error: Error): void {
    if (!this.config.isFailure(error)) {
      return; // Ne pas compter comme échec
    }
    
    this.metrics.consecutiveFailures++;
    this.metrics.totalFailures++;
    this.metrics.lastFailure = new Date();
    
    this.config.onFailure(error);
    
    // Vérifier si on doit ouvrir le circuit
    if (this.state === 'CLOSED' && this.metrics.consecutiveFailures >= this.config.failureThreshold) {
      this.changeState('OPEN', `Failure threshold reached (${this.metrics.consecutiveFailures} consecutive failures)`);
    } else if (this.state === 'HALF_OPEN') {
      this.changeState('OPEN', 'Recovery test failed');
    }
  }
  
  /**
   * Mettre à jour les statistiques de temps de réponse
   */
  private updateResponseTime(responseTime: number): void {
    this.metrics.responseTimeHistory.push(responseTime);
    
    // Garder seulement les 100 dernières mesures
    if (this.metrics.responseTimeHistory.length > 100) {
      this.metrics.responseTimeHistory.shift();
    }
    
    // Recalculer la moyenne
    this.metrics.averageResponseTime = 
      this.metrics.responseTimeHistory.reduce((sum, time) => sum + time, 0) / 
      this.metrics.responseTimeHistory.length;
  }
  
  /**
   * Exécuter une opération avec protection du circuit breaker
   */
  async call<T>(operation: () => Promise<T>, operationName?: string): Promise<CircuitBreakerResult<T>> {
    const startTime = Date.now();
    const context = operationName || 'operation';
    
    // Vérifier l'état du circuit
    if (this.state === 'OPEN') {
      if (this.shouldTryReset()) {
        this.changeState('HALF_OPEN', 'Testing recovery after timeout');
      } else {
        return {
          success: false,
          error: new CircuitBreakerError(
            'CIRCUIT_OPEN',
            `Circuit breaker is OPEN for ${context}. Next retry in ${this.getRemainingResetTime()}ms`,
            'OPEN',
            { nextRetryIn: this.getRemainingResetTime() }
          ),
          circuitState: 'OPEN',
          executionTime: 0,
          metadata: this.getMetadata()
        };
      }
    }
    
    try {
      // Exécuter avec timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timeout after ${this.config.timeout}ms`)), this.config.timeout);
      });
      
      const result = await Promise.race([operation(), timeoutPromise]);
      const responseTime = Date.now() - startTime;
      
      // Succès
      this.recordSuccess(responseTime);
      
      return {
        result,
        success: true,
        circuitState: this.state,
        executionTime: responseTime,
        metadata: this.getMetadata()
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const err = error as Error;
      
      // Enregistrer l'échec
      this.recordFailure(err);
      
      // Déterminer le type d'erreur
      const errorType = err.message.includes('timeout') ? 'TIMEOUT' : 'HALF_OPEN_FAILURE';
      
      return {
        success: false,
        error: err instanceof CircuitBreakerError 
          ? err 
          : new CircuitBreakerError(errorType, err.message, this.state),
        circuitState: this.state,
        executionTime: responseTime,
        metadata: this.getMetadata()
      };
    }
  }
  
  /**
   * Obtenir le temps restant avant tentative de reset (ms)
   */
  private getRemainingResetTime(): number {
    if (this.state !== 'OPEN') return 0;
    
    const timeSinceOpened = Date.now() - this.stateChangeTime.getTime();
    return Math.max(0, this.config.resetTimeout - timeSinceOpened);
  }
  
  /**
   * Obtenir les métadonnées actuelles
   */
  private getMetadata() {
    return {
      failures: this.metrics.consecutiveFailures,
      successes: this.metrics.totalSuccesses,
      lastFailure: this.metrics.lastFailure,
      lastSuccess: this.metrics.lastSuccess
    };
  }
  
  /**
   * Obtenir l'état actuel du circuit
   */
  getState(): CircuitState {
    return this.state;
  }
  
  /**
   * Obtenir les métriques complètes
   */
  getMetrics(): CircuitMetrics & { state: CircuitState; stateChangeTime: Date } {
    return {
      ...this.metrics,
      state: this.state,
      stateChangeTime: this.stateChangeTime
    };
  }
  
  /**
   * Obtenir les statistiques de santé
   */
  getHealthStats(): {
    isHealthy: boolean;
    successRate: number;
    averageResponseTime: number;
    state: CircuitState;
    uptime: number;
    totalOperations: number;
  } {
    const totalOperations = this.metrics.totalSuccesses + this.metrics.totalFailures;
    const successRate = totalOperations > 0 ? this.metrics.totalSuccesses / totalOperations : 1;
    
    return {
      isHealthy: this.state === 'CLOSED' && successRate > 0.95,
      successRate,
      averageResponseTime: this.metrics.averageResponseTime,
      state: this.state,
      uptime: Date.now() - this.stateChangeTime.getTime(),
      totalOperations
    };
  }
  
  /**
   * Forcer la fermeture du circuit (pour les tests ou maintenance)
   */
  forceClose(reason: string = 'Manual override'): void {
    this.changeState('CLOSED', reason);
    this.metrics.consecutiveFailures = 0;
  }
  
  /**
   * Forcer l'ouverture du circuit (pour maintenance)
   */
  forceOpen(reason: string = 'Manual override'): void {
    this.changeState('OPEN', reason);
  }
  
  /**
   * Réinitialiser toutes les métriques
   */
  reset(): void {
    console.log('🔄 Resetting circuit breaker metrics...');
    
    this.metrics = {
      consecutiveFailures: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      totalOpens: 0,
      averageResponseTime: 0,
      responseTimeHistory: []
    };
    
    this.changeState('CLOSED', 'Manual reset');
  }
  
  /**
   * Créer un circuit breaker configuré pour SMTP
   */
  static forSMTP(config: Partial<CircuitBreakerConfig> = {}): CircuitBreaker {
    return new CircuitBreaker({
      failureThreshold: 3,
      timeout: 30000, // 30s pour SMTP
      resetTimeout: 300000, // 5 minutes
      isFailure: (error: Error) => {
        // Ne pas compter les erreurs d'auth comme des échecs du service
        const authErrors = ['auth', 'authentication', 'credential', 'unauthorized'];
        const errorMessage = error.message.toLowerCase();
        return !authErrors.some(auth => errorMessage.includes(auth));
      },
      ...config
    });
  }
  
  /**
   * Créer un circuit breaker configuré pour SMS
   */
  static forSMS(config: Partial<CircuitBreakerConfig> = {}): CircuitBreaker {
    return new CircuitBreaker({
      failureThreshold: 3,
      timeout: 15000, // 15s pour SMS
      resetTimeout: 180000, // 3 minutes
      isFailure: (error: Error) => {
        // Ne pas compter les erreurs d'auth et de validation comme des échecs du service
        const nonServiceErrors = ['auth', 'authentication', 'credential', 'unauthorized', 'invalid phone', 'validation'];
        const errorMessage = error.message.toLowerCase();
        return !nonServiceErrors.some(err => errorMessage.includes(err));
      },
      ...config
    });
  }
  
  /**
   * Créer un circuit breaker configuré pour WhatsApp
   */
  static forWhatsApp(config: Partial<CircuitBreakerConfig> = {}): CircuitBreaker {
    return new CircuitBreaker({
      failureThreshold: 4,
      timeout: 25000, // 25s pour WhatsApp
      resetTimeout: 240000, // 4 minutes
      isFailure: (error: Error) => {
        // Ne pas compter les erreurs d'auth, de template et de validation comme des échecs du service
        const nonServiceErrors = [
          'auth', 'authentication', 'access token', 'unauthorized',
          'template', 'parameter', 'invalid phone', 'validation',
          '190', // Invalid access token
          '132000', '132001' // Template errors
        ];
        const errorMessage = error.message.toLowerCase();
        return !nonServiceErrors.some(err => errorMessage.includes(err));
      },
      ...config
    });
  }
  
  /**
   * Créer un circuit breaker configuré pour APIs externes
   */
  static forExternalAPI(config: Partial<CircuitBreakerConfig> = {}): CircuitBreaker {
    return new CircuitBreaker({
      failureThreshold: 5,
      timeout: 10000, // 10s pour APIs
      resetTimeout: 120000, // 2 minutes
      ...config
    });
  }

  /**
   * Circuit breaker configuré pour les opérations de base de données
   */
  static forDatabase(config: Partial<CircuitBreakerConfig> = {}): CircuitBreaker {
    return new CircuitBreaker({
      failureThreshold: 3,
      timeout: 5000, // 5s pour la DB
      resetTimeout: 60000, // 1 minute
      isFailure: (error: Error) => {
        // Échecs temporaires qui justifient l'ouverture du circuit
        return error.message.includes('ECONNREFUSED') ||
               error.message.includes('ETIMEDOUT') ||
               error.message.includes('Connection') ||
               error.message.includes('timeout');
      },
      ...config
    });
  }
}