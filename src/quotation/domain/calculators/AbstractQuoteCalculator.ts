import { IQuoteCalculator } from '../interfaces/IQuoteCalculator';
import { QuoteContext } from '../valueObjects/QuoteContext';
import { Quote } from '../valueObjects/Quote';
import { Money } from '../valueObjects/Money';
import { Rule } from '../valueObjects/Rule';
import { Discount } from '../valueObjects/Discount';
import { RuleEngine } from '../services/RuleEngine';
import { ValidationError } from '../../interfaces/http/ValidationError';
import { QuoteCalculationError } from '../../interfaces/http/errors';

export abstract class AbstractQuoteCalculator implements IQuoteCalculator {
  protected ruleEngine: RuleEngine;

  constructor(rules: Rule[]) {
    // Validation des règles
    if (!Array.isArray(rules)) {
      throw new ValidationError('Rules must be an array');
    }
    if (rules.some(rule => !(rule instanceof Rule))) {
      throw new ValidationError('All rules must be instances of Rule');
    }
    this.ruleEngine = new RuleEngine(rules);
  }

  abstract getBasePrice(context: QuoteContext): Money;

  protected validateContext(context: QuoteContext): void {
    if (!context) {
      throw new ValidationError('Context is required');
    }
    if (!(context instanceof QuoteContext)) {
      throw new ValidationError('Invalid context type');
    }
    // La validation des données spécifiques est déjà effectuée dans le constructeur de QuoteContext
  }

  protected validateMoney(amount: Money): void {
    if (!(amount instanceof Money)) {
      throw new ValidationError('Amount must be an instance of Money');
    }
    if (amount.getAmount() < 0) {
      throw new ValidationError('Amount cannot be negative');
    }
  }

  async calculate(context: QuoteContext): Promise<Quote> {
    // 1. Validation du contexte
    this.validateContext(context);
    
    // 2. Calcul et validation du prix de base
    const basePrice = this.getBasePrice(context);
    this.validateMoney(basePrice);
    
    // 3. Application des règles et validation du prix final
    const ruleResult = this.ruleEngine.execute(context, basePrice);
    this.validateMoney(ruleResult.finalPrice);
    
    // 4. Création du devis (le constructeur de Quote validera ses propres paramètres)
    return new Quote(
      basePrice,
      ruleResult.finalPrice,
      ruleResult.discounts,
      context
    );
  }
} 