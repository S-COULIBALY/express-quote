import { AbstractQuoteCalculator } from './AbstractQuoteCalculator';
import { QuoteContext } from '../valueObjects/QuoteContext';
import { Money } from '../valueObjects/Money';
import { Rule } from '../valueObjects/Rule';
import { QuoteCalculationError } from '../../interfaces/http/errors';
import { Quote } from '../valueObjects/Quote';
import { ServiceType } from '../entities/Service';
import { Discount, DiscountType } from '../valueObjects/Discount';
import { CleaningFrequency } from '../valueObjects/types/CleaningTypes';

export class CleaningQuoteCalculator extends AbstractQuoteCalculator {
  private readonly BASE_PRICE_PER_M2 = 2; // Prix de base par m²
  private readonly ROOM_EXTRA_PRICE = 10; // Prix supplémentaire par pièce

  constructor(rules: Rule[]) {
    super(rules);
  }

  getBasePrice(context: QuoteContext): Money {
    if (context.getServiceType() !== ServiceType.CLEANING) {
      throw new QuoteCalculationError('Invalid context type for cleaning quote');
    }

    // Calcul du prix de base selon la surface
    const squareMeters = context.getValue<number>('squareMeters') || 0;
    let basePrice = squareMeters * this.BASE_PRICE_PER_M2;
    
    // Ajout du prix par pièce
    const numberOfRooms = context.getValue<number>('numberOfRooms') || 0;
    basePrice += numberOfRooms * this.ROOM_EXTRA_PRICE;

    return new Money(basePrice);
  }

  private getApplicableDiscounts(context: QuoteContext): Discount[] {
    const discounts: Discount[] = [];
    const frequency = context.getValue<CleaningFrequency>('frequency');
    const squareMeters = context.getValue<number>('squareMeters') || 0;

    // Réductions selon la fréquence
    if (frequency === CleaningFrequency.WEEKLY) {
      discounts.push(new Discount(
        'weekly_frequency',
        DiscountType.PERCENTAGE,
        20,
        'Réduction fréquence hebdomadaire',
        undefined,
        undefined
      ));
    } else if (frequency === CleaningFrequency.BIWEEKLY) {
      discounts.push(new Discount(
        'biweekly_frequency',
        DiscountType.PERCENTAGE,
        15,
        'Réduction fréquence bi-mensuelle',
        undefined,
        undefined
      ));
    } else if (frequency === CleaningFrequency.MONTHLY) {
      discounts.push(new Discount(
        'monthly_frequency',
        DiscountType.PERCENTAGE,
        10,
        'Réduction fréquence mensuelle',
        undefined,
        undefined
      ));
    }

    // Réduction grande surface
    if (squareMeters > 150) {
      discounts.push(new Discount(
        'large_surface',
        DiscountType.PERCENTAGE,
        10,
        'Réduction grande surface',
        undefined,
        undefined
      ));
    }

    return discounts;
  }

  async calculate(context: QuoteContext): Promise<Quote> {
    // 1. Vérification du type de service
    if (context.getServiceType() !== ServiceType.CLEANING) {
      throw new QuoteCalculationError('Invalid context type for cleaning quote');
    }

    // 2. Calculer le prix de base
    let currentPrice = this.getBasePrice(context);
    
    // 3. Identifier les réductions applicables
    const discounts = this.getApplicableDiscounts(context);
    
    // 4. Appliquer les règles (réductions, majorations, etc.)
    const ruleResult = this.ruleEngine.execute(context, currentPrice);
    
    // 5. Retourner le devis final avec toutes les réductions (règles et discounts)
    return new Quote(
      this.getBasePrice(context), // Prix de base sans aucune modification
      ruleResult.finalPrice, // Prix final après application des règles
      [...discounts, ...ruleResult.discounts], // Combine toutes les réductions
      context
    );
  }
} 