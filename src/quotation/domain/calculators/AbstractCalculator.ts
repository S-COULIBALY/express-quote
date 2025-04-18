import { ConfigurationService } from '../services/ConfigurationService';
import { QuoteContext } from '../valueObjects/QuoteContext';
import { Money } from '../valueObjects/Money';
import { Rule } from '../valueObjects/Rule';
import { Quote } from '../valueObjects/Quote';
import { RuleEngine } from '../services/RuleEngine';
import { ServiceType } from '../enums/ServiceType';
import { CalculationError } from '../errors/CalculationError';
import { ValidationError } from '../errors/ValidationError';
import { logger } from '../../../lib/logger';

/**
 * Classe abstraite pour les calculateurs de devis
 * Fournit les méthodes communes et la structure pour tous les calculateurs
 */
export abstract class AbstractCalculator {
  protected configService: ConfigurationService;
  protected ruleEngine: RuleEngine;
  
  constructor(
    configService: ConfigurationService,
    rules: Rule[] = []
  ) {
    this.configService = configService;
    this.ruleEngine = new RuleEngine(rules);
  }
  
  /**
   * Méthode principale pour calculer un devis
   * Utilise un template method pattern
   */
  calculate(context: QuoteContext): Quote {
    try {
      // 1. Valider le contexte
      this.validateContext(context);
      
      // 2. Calculer le prix de base
      const basePrice = this.calculateBasePrice(context);
      
      // 3. Appliquer les règles métier (réductions, majorations)
      const result = this.ruleEngine.execute(context, basePrice);
      
      // 4. Créer le devis final
      const quote = new Quote(
        basePrice,
        result.finalPrice,
        result.discounts,
        context.getServiceType()
      );
      
      logger.info('Quote calculated successfully', {
        serviceType: context.getServiceType(),
        basePrice: basePrice.getAmount(),
        finalPrice: result.finalPrice.getAmount(),
        discounts: result.discounts.length
      });
      
      return quote;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof CalculationError) {
        logger.warn(`Quote calculation error: ${error.message}`, {
          serviceType: context.getServiceType(),
          errorType: error.name
        });
        throw error;
      } else {
        logger.error('Unexpected error in quote calculation', error as Error, {
          serviceType: context.getServiceType()
        });
        throw new CalculationError('Une erreur inattendue est survenue lors du calcul du devis');
      }
    }
  }
  
  /**
   * Valide que le contexte contient toutes les données nécessaires
   * @throws {ValidationError} Si le contexte est invalide
   */
  protected validateContext(context: QuoteContext): void {
    // Validation de base - peut être surchargée par les sous-classes
    context.validate();
  }
  
  /**
   * Calcule le prix de base selon le type de service
   * Méthode abstraite à implémenter par les sous-classes
   */
  protected abstract calculateBasePrice(context: QuoteContext): Money;
  
  /**
   * Crée un objet Money à partir d'un montant numérique avec validation
   */
  protected createMoney(amount: number): Money {
    if (isNaN(amount) || amount < 0) {
      throw new CalculationError('Montant invalide pour la création d\'un objet Money');
    }
    return new Money(Math.round(amount));
  }
  
  /**
   * Calculer le coût des travailleurs supplémentaires
   */
  protected calculateExtraWorkersCost(
    workers: number,
    baseWorkers: number,
    pricePerWorker: number,
    duration: number,
    discountRate: number = 0
  ): number {
    if (workers <= baseWorkers) return 0;
    
    const extraWorkers = workers - baseWorkers;
    const baseCost = extraWorkers * pricePerWorker * duration;
    return baseCost * (1 - discountRate);
  }
  
  /**
   * Calculer le coût de la distance supplémentaire
   */
  protected calculateExtraDistanceCost(
    distance: number,
    includedDistance: number,
    pricePerKm: number
  ): number {
    if (distance <= includedDistance) return 0;
    
    const extraDistance = distance - includedDistance;
    return extraDistance * pricePerKm;
  }
} 