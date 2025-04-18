import { Money } from '../valueObjects/Money';
import { Rule } from '../valueObjects/Rule';
import { QuoteContext } from '../valueObjects/QuoteContext';
import { Discount, DiscountType } from '../valueObjects/Discount';
import { logger } from '../../../lib/logger';

interface RuleExecutionResult {
  finalPrice: Money;
  discounts: Discount[];
  appliedRules?: string[]; // Pour le logging
}

/**
 * Moteur d'exécution des règles métier
 * Applique les règles sur un prix de base pour obtenir un prix final
 */
export class RuleEngine {
  constructor(private rules: Rule[]) {
    // Trier les règles par priorité - les règles de tarif minimum doivent être appliquées en dernier
    this.rules.sort((a, b) => {
      // Priorité spéciale pour la règle de tarif minimum
      if (a.name === 'Tarif minimum') return 1;
      if (b.name === 'Tarif minimum') return -1;
      
      // Priorité pour les règles en pourcentage par rapport aux règles en montant fixe
      if (a.isPercentage() && !b.isPercentage()) return -1;
      if (!a.isPercentage() && b.isPercentage()) return 1;
      
      return 0;
    });
  }

  /**
   * Exécute toutes les règles applicables sur le prix
   */
  execute(
    context: QuoteContext,
    basePrice: Money
  ): RuleExecutionResult {
    console.log("\n==== DÉBUT RULEENGINE.EXECUTE ====");
    console.log("📋 CONTEXTE:", context.getAllData());
    console.log("💰 PRIX DE BASE:", basePrice.getAmount());
    console.log("📋 NOMBRE DE RÈGLES À VÉRIFIER:", this.rules.length);
    
    try {
      // Valider le contexte
      try {
        console.log("🔍 VALIDATION DU CONTEXTE...");
        context.validate();
        console.log("✅ CONTEXTE VALIDÉ");
      } catch (error) {
        console.log("❌ ERREUR DE VALIDATION DU CONTEXTE:", error);
        throw error;
      }
      
      // Préparer les variables de résultat
      const discounts: Discount[] = [];
      let finalPrice = basePrice;
      const appliedRules: string[] = [];
      
      console.log("🔄 TRAITEMENT DE CHAQUE RÈGLE...");
      
      // Traiter chaque règle
      try {
        for (const rule of this.rules) {
          console.log("🔍 VÉRIFICATION DE LA RÈGLE:", rule.name);
          
          try {
            // Vérifier si la règle est applicable
            const isApplicable = rule.isApplicable(context);
            console.log("🔍 RÈGLE APPLICABLE?", isApplicable);
            
            if (isApplicable) {
              console.log("✅ RÈGLE APPLICABLE - Application en cours...");
              
              try {
                // Appliquer la règle
                const ruleResult = rule.apply(basePrice, context);
                
                if (ruleResult.isApplied) {
                  // Créer un Discount à partir du résultat
                  let discountType = rule.isPercentage() ? DiscountType.PERCENTAGE : DiscountType.FIXED;
                  let impactValue = Math.abs(ruleResult.impact);
                  
                  // S'assurer que le pourcentage ne dépasse pas 100%
                  if (discountType === DiscountType.PERCENTAGE && impactValue > 100) {
                    console.log("⚠️ POURCENTAGE > 100%, CONVERSION EN MONTANT FIXE");
                    discountType = DiscountType.FIXED;
                  }
                  
                  const discount = new Discount(
                    rule.name,
                    discountType,
                    impactValue
                  );
                  
                  console.log("💰 RÉDUCTION APPLIQUÉE:", discount.getAmount().getAmount());
                  
                  // Ajouter la réduction
                  discounts.push(discount);
                  appliedRules.push(rule.name);
                  
                  // Si c'est une règle de pourcentage, l'appliquer immédiatement
                  if (discount.getType() === DiscountType.PERCENTAGE) {
                    console.log("📊 RÈGLE DE POURCENTAGE - Application immédiate");
                    finalPrice = new Money(
                      finalPrice.getAmount() - discount.getAmount().getAmount()
                    );
                  }
                }
              } catch (applyError) {
                console.log("❌ ERREUR LORS DE L'APPLICATION DE LA RÈGLE:", applyError);
                if (applyError instanceof Error) {
                  console.log("📋 TYPE D'ERREUR:", applyError.constructor.name);
                  console.log("📋 MESSAGE:", applyError.message);
                  console.log("📋 STACK:", applyError.stack);
                }
                
                // Erreur spécifique à vérifier
                if (applyError instanceof Error && 
                    (applyError.message.includes('is not a function') || 
                     applyError.message.includes('is not defined'))) {
                  console.log("🚨 ERREUR D'OPÉRATION DÉTECTÉE - Opération non supportée");
                  throw new Error('Opération non supportée');
                }
                
                throw applyError;
              }
            }
          } catch (ruleError) {
            console.log("❌ ERREUR SPÉCIFIQUE À UNE RÈGLE:", ruleError);
            throw ruleError;
          }
        }
        
        // Appliquer les réductions fixes après les pourcentages
        console.log("🔄 APPLICATION DES RÉDUCTIONS FIXES...");
        try {
          for (const discount of discounts) {
            if (discount.getType() !== DiscountType.PERCENTAGE) {
              console.log("💰 APPLICATION D'UNE RÉDUCTION FIXE:", discount.getAmount().getAmount());
              finalPrice = new Money(
                finalPrice.getAmount() - discount.getAmount().getAmount()
              );
            }
          }
        } catch (fixedError) {
          console.log("❌ ERREUR LORS DE L'APPLICATION DES RÉDUCTIONS FIXES:", fixedError);
          throw fixedError;
        }
        
        // Vérifier que le prix final n'est pas négatif
        console.log("🔍 VÉRIFICATION DU PRIX FINAL...");
        if (finalPrice.getAmount() < 0) {
          console.log("⚠️ PRIX NÉGATIF DÉTECTÉ - Ajustement à 0");
          finalPrice = new Money(0);
        }
        
        console.log("✅ EXECUTION TERMINÉE - Résultat:");
        console.log("💰 PRIX FINAL:", finalPrice.getAmount());
        console.log("📋 RÉDUCTIONS APPLIQUÉES:", discounts.length);
        console.log("==== FIN RULEENGINE.EXECUTE (SUCCÈS) ====\n");
        
        return {
          finalPrice,
          discounts,
          appliedRules
        };
      } catch (rulesError) {
        console.log("❌ ERREUR PENDANT LE TRAITEMENT DES RÈGLES:", rulesError);
        if (rulesError instanceof Error) {
          console.log("📋 TYPE D'ERREUR:", rulesError.constructor.name);
          console.log("📋 MESSAGE:", rulesError.message);
          console.log("📋 STACK:", rulesError.stack);
          
          // Si c'est l'erreur "Opération non supportée", la propager
          if (rulesError.message.includes('Opération non supportée')) {
            console.log("🚨 PROPAGATION DE L'ERREUR 'Opération non supportée'");
          }
        }
        throw rulesError;
      }
    } catch (error) {
      console.log("❌ ERREUR GÉNÉRALE DANS RULEENGINE.EXECUTE:", error);
      if (error instanceof Error) {
        console.log("📋 TYPE D'ERREUR:", error.constructor.name);
        console.log("📋 MESSAGE:", error.message);
        console.log("📋 STACK:", error.stack);
      }
      console.log("==== FIN RULEENGINE.EXECUTE (ERREUR) ====\n");
      throw error;
    }
  }

  /**
   * Validation du contexte pour s'assurer que les champs nécessaires sont présents
   */
  private validateContext(context: QuoteContext): void {
    // Utilise la validation intégrée dans QuoteContext
    context.validate();
  }

  /**
   * Récupérer toutes les règles
   */
  getRules(): Rule[] {
    return [...this.rules];
  }

  /**
   * Ajouter une règle
   */
  addRule(rule: Rule): void {
    this.rules.push(rule);
  }

  /**
   * Supprimer une règle
   */
  removeRule(ruleToRemove: Rule): void {
    this.rules = this.rules.filter(rule => !rule.equals(ruleToRemove));
  }
} 