import { Money } from '../valueObjects/Money';
import { Rule } from '../valueObjects/Rule';
import { QuoteContext } from '../valueObjects/QuoteContext';
import { Discount, DiscountType } from '../valueObjects/Discount';

interface RuleExecutionResult {
  finalPrice: Money;
  discounts: Discount[];
}

export class RuleEngine {
  constructor(private rules: Rule[]) {}

  execute(context: QuoteContext, basePrice: Money): RuleExecutionResult {
    let finalPrice = basePrice;
    const discounts: Discount[] = [];
    
    console.log('Base Price:', basePrice.getAmount());

    // Étape 1: Calculer l'impact total des règles en pourcentage sur le prix de base
    let totalPercentageImpact = 0;
    
    // Collecter tous les pourcentages applicables
    for (const rule of this.rules) {
      if (rule.percentage !== undefined) {
        // Appliquer la règle et récupérer directement l'impact
        const result = rule.apply(basePrice, context);
        
        if (result.isApplied) {
          console.log(`Rule ${rule.name} applied:`, {
            ruleType: 'percentage',
            percentage: rule.percentage,
            impact: result.impact
          });
          
          // Ajouter l'impact au total au lieu du pourcentage
          totalPercentageImpact += result.impact;
          
          // Si c'est une réduction (pourcentage négatif), l'ajouter aux réductions
          if (rule.percentage < 0) {
            discounts.push(new Discount(
              rule.name,
              DiscountType.PERCENTAGE,
              Math.abs(rule.percentage),
              rule.name,
              undefined,
              undefined
            ));
          }
        } else {
          console.log(`Rule ${rule.name} not applied (condition not met)`);
        }
      }
    }
    
    // Appliquer l'impact total des pourcentages
    finalPrice = basePrice.add(new Money(Math.round(totalPercentageImpact)));
    
    console.log('Price after percentage adjustments:', finalPrice.getAmount());
    
    // Étape 2: Appliquer les règles à montant fixe
    for (const rule of this.rules) {
      if (rule.amount !== undefined) {
        // Appliquer la règle et récupérer directement l'impact
        const result = rule.apply(finalPrice, context);
        
        if (result.isApplied) {
          const previousPrice = finalPrice.getAmount();
          finalPrice = result.newPrice;
          
          console.log(`Rule ${rule.name} applied:`, {
            ruleType: 'fixed',
            previousPrice: previousPrice,
            newPrice: finalPrice.getAmount(),
            impact: result.impact
          });
          
          // Si c'est une réduction (impact négatif), l'ajouter aux réductions
          if (result.impact < 0) {
            discounts.push(new Discount(
              rule.name,
              DiscountType.FIXED,
              Math.abs(result.impact),
              rule.name,
              undefined,
              undefined
            ));
          }
        } else {
          console.log(`Rule ${rule.name} not applied (condition not met)`);
        }
      }
    }
    
    console.log('Final Price:', finalPrice.getAmount());
    
    return { finalPrice, discounts };
  }

  getRules(): Rule[] {
    return [...this.rules];
  }

  addRule(rule: Rule): void {
    this.rules.push(rule);
  }

  removeRule(ruleToRemove: Rule): void {
    this.rules = this.rules.filter(rule => !rule.equals(ruleToRemove));
  }
} 