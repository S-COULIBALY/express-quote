import { QuoteCalculator } from '@/quotation/domain/calculators/MovingQuoteCalculator';
import { ConfigurationService } from '@/quotation/domain/services/ConfigurationService';
import { createMovingRules } from '@/quotation/domain/rules/MovingRules';
import { createPackRules } from '@/quotation/domain/rules/PackRules';
import { createServiceRules } from '@/quotation/domain/rules/ServiceRules';
import { QuoteCalculatorFactory } from '@/quotation/application/factories/QuoteCalculatorFactory';
import { logger } from '@/lib/logger';

/**
 * Service centralisé pour la gestion des calculateurs de devis
 */
export class QuoteCalculatorService {
  private static instance: QuoteCalculatorService;
  private calculator: QuoteCalculator | null = null;
  private isInitializing: boolean = false;
  private initPromise: Promise<QuoteCalculator> | null = null;

  private constructor() {}

  /**
   * Obtient l'instance unique du service (pattern Singleton)
   */
  public static getInstance(): QuoteCalculatorService {
    if (!QuoteCalculatorService.instance) {
      QuoteCalculatorService.instance = new QuoteCalculatorService();
    }
    return QuoteCalculatorService.instance;
  }

  /**
   * Initialise le service au démarrage de l'application
   */
  public initialize(): Promise<QuoteCalculator> {
    if (this.calculator) {
      return Promise.resolve(this.calculator);
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.isInitializing = true;
    
    this.initPromise = QuoteCalculatorFactory.createDefaultCalculator()
      .then(calculator => {
        this.calculator = calculator;
        this.isInitializing = false;
        logger.info('✅ Calculateur initialisé avec succès depuis la BDD');
        console.log("✅ Calculateur initialisé avec succès depuis la BDD");
        return calculator;
      })
      .catch(error => {
        this.isInitializing = false;
        logger.error('❌ Erreur d\'initialisation du calculateur depuis la BDD, utilisation du fallback:', error);
        console.error('❌ Erreur d\'initialisation du calculateur depuis la BDD, utilisation du fallback:', error);
        
        // Utiliser le fallback standardisé
        const fallbackCalculator = this.createFallbackCalculator();
        this.calculator = fallbackCalculator;
        
        return fallbackCalculator;
      });

    return this.initPromise;
  }

  /**
   * Crée un calculateur de fallback avec des règles codées en dur
   * Cette méthode est partagée par toutes les routes qui ont besoin d'un fallback
   */
  public createFallbackCalculator(): QuoteCalculator {
    const configService = new ConfigurationService();
    const movingRulesList = createMovingRules();
    const packRulesList = createPackRules();
    const serviceRulesList = createServiceRules();
    
    const calculator = new QuoteCalculator(
      configService,
      movingRulesList,
      packRulesList,
      serviceRulesList
    );
    
    logger.info('✅ Calculateur de fallback créé avec des règles codées en dur');
    console.log("✅ Calculateur de fallback créé avec des règles codées en dur");
    
    return calculator;
  }

  /**
   * Obtient un calculateur (depuis la BDD ou fallback)
   */
  public async getCalculator(): Promise<QuoteCalculator> {
    if (this.calculator) {
      return this.calculator;
    }
    
    return this.initialize();
  }

  /**
   * Force le rafraîchissement du calculateur
   * Utile après une mise à jour des règles dans la BDD
   */
  public async refreshCalculator(): Promise<QuoteCalculator> {
    this.calculator = null;
    this.initPromise = null;
    return this.initialize();
  }
} 