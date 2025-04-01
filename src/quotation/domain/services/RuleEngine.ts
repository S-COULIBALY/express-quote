import { Money } from '../valueObjects/Money';
import { Rule } from '../valueObjects/Rule';
import { QuoteContext } from '../valueObjects/QuoteContext';
import { Discount, DiscountType } from '../valueObjects/Discount';

interface RuleExecutionResult {
  finalPrice: Money;
  discounts: Discount[];
  appliedRules?: string[]; // Pour le logging
}

export class RuleEngine {
  constructor(private rules: Rule[]) {
    // Trier les règles par priorité - les règles de tarif minimum doivent être appliquées en dernier
    this.rules.sort((a, b) => {
      // Priorité spéciale pour la règle de tarif minimum
      if (a.name.includes('minimum')) return 1;
      if (b.name.includes('minimum')) return -1;
      return 0;
    });
  }

  execute(context: QuoteContext, basePrice: Money): RuleExecutionResult {
    // Validation du contexte
    this.validateContext(context);
    
    let finalPrice = basePrice;
    const discounts: Discount[] = [];
    const appliedRules: string[] = [];
    
    console.log('Base Price:', basePrice.getAmount());
    console.log('Context:', JSON.stringify(context.toDTO(), null, 2));

    // Étape 1: Calculer l'impact total des règles en pourcentage sur le prix de base
    let totalPercentageImpact = 0;
    
    // Collecter tous les pourcentages applicables
    for (const rule of this.rules) {
      if (rule.percentage !== undefined) {
        try {
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
            appliedRules.push(rule.name);
            
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
        } catch (error) {
          console.error(`Error applying percentage rule ${rule.name}:`, error);
          // Continue avec les autres règles même si celle-ci a échoué
        }
      }
    }
    
    // Appliquer l'impact total des pourcentages
    finalPrice = basePrice.add(new Money(Math.round(totalPercentageImpact)));
    
    console.log('Price after percentage adjustments:', finalPrice.getAmount());
    
    // Étape 2: Appliquer les règles à montant fixe
    for (const rule of this.rules) {
      if (rule.amount !== undefined) {
        try {
          // Appliquer la règle et récupérer directement l'impact
          const result = rule.apply(finalPrice, context);
          
          if (result.isApplied) {
            const previousPrice = finalPrice.getAmount();
            finalPrice = result.newPrice;
            appliedRules.push(rule.name);
            
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
        } catch (error) {
          console.error(`Error applying fixed amount rule ${rule.name}:`, error);
          // Continue avec les autres règles même si celle-ci a échoué
        }
      }
    }
    
    console.log('Final Price:', finalPrice.getAmount());
    console.log('Applied Rules:', appliedRules);
    console.log('Discounts:', discounts);
    
    return { finalPrice, discounts, appliedRules };
  }

  // Validation du contexte pour s'assurer que les champs nécessaires sont présents
  private validateContext(context: QuoteContext): void {
    // Vérifier les champs obligatoires pour tous les types de devis
    const requiredFields = ['volume', 'distance'];
    
    for (const field of requiredFields) {
      if (context.getValue(field) === undefined) {
        throw new Error(`Missing required field in context: ${field}`);
      }
    }
    
    // Vérification des types de données
    const volume = context.getValue<number>('volume');
    const distance = context.getValue<number>('distance');
    
    if (typeof volume !== 'number' || isNaN(volume)) {
      throw new Error('Volume must be a valid number');
    }
    
    if (typeof distance !== 'number' || isNaN(distance)) {
      throw new Error('Distance must be a valid number');
    }
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