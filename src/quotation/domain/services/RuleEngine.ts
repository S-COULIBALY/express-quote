import { Money } from '../valueObjects/Money';
import { Rule, RuleApplyResult } from '../valueObjects/Rule';
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
      let finalPrice = basePrice.getAmount(); // Utiliser directement le montant pour plus de clarté
    const appliedRules: string[] = [];
      let minimumPrice: number | null = null; // Stocker le prix minimum
      
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
                // Stocker le prix avant application de la règle
                const priceBeforeRule = finalPrice;
                
                // Appliquer la règle
                const ruleResult: RuleApplyResult = rule.apply(new Money(finalPrice), context);
                
                // Vérifier si la règle définit un prix minimum
                if (ruleResult.minimumPrice !== undefined) {
                  console.log("⚠️ RÈGLE DÉFINIT UN PRIX MINIMUM:", ruleResult.minimumPrice);
                  minimumPrice = ruleResult.minimumPrice;
                  // Ne pas ajouter de réduction pour les règles de prix minimum
                  continue;
                }
                
                // Pour les règles normales avec un impact
                if (ruleResult.isApplied && ruleResult.impact !== 0) {
                  // Calculer le nouveau prix final
                  finalPrice = ruleResult.newPrice.getAmount();
                  
                  const absoluteImpact = Math.abs(ruleResult.impact);
                  console.log(`💰 RÈGLE "${rule.name}" APPLIQUÉE:`, {
                    prixAvant: priceBeforeRule,
                    prixAprès: finalPrice,
                    impact: ruleResult.impact,
                    réduction: absoluteImpact
        });
        
                  // Déterminer le type de réduction
                  const discountType = rule.isPercentage() ? 
                    DiscountType.PERCENTAGE : 
                    DiscountType.FIXED;
                  
                  // Créer un objet Discount avec l'impact absolu
                  try {
                    const discount = new Discount(
            rule.name,
                      discountType,
                      // Si c'est un pourcentage, utiliser directement un pourcentage sûr (valeur absolue du pourcentage)
                      // plutôt que l'impact calculé qui peut être trop grand comme valeur
                      discountType === DiscountType.PERCENTAGE ? Math.min(Math.abs(ruleResult.impact / priceBeforeRule * 100), 100) : absoluteImpact
                    );
    
                    // Ajouter la réduction
                    discounts.push(discount);
                    appliedRules.push(rule.name);
                  } catch (discountError) {
                    console.log("❌ ERREUR LORS DE LA CRÉATION DU DISCOUNT:", discountError);
                    throw discountError;
                  }
                } else {
                  console.log(`ℹ️ RÈGLE "${rule.name}" SANS IMPACT:`, {
                    isApplied: ruleResult.isApplied,
                    impact: ruleResult.impact
                  });
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
        
        // Vérifier que le prix final n'est pas inférieur au prix minimum
        console.log("🔍 VÉRIFICATION DU PRIX FINAL...");
        if (minimumPrice !== null && finalPrice < minimumPrice) {
          console.log(`⚠️ PRIX FINAL (${finalPrice}) INFÉRIEUR AU MINIMUM (${minimumPrice}) - AJUSTEMENT`);
          finalPrice = minimumPrice;
        }
        // Vérifier que le prix final n'est pas négatif
        else if (finalPrice < 0) {
          console.log("⚠️ PRIX NÉGATIF DÉTECTÉ - Ajustement à 0");
          finalPrice = 0;
      }
      
        console.log("✅ EXECUTION TERMINÉE - Résultat:");
        console.log("💰 PRIX FINAL:", finalPrice);
        console.log("📋 RÉDUCTIONS APPLIQUÉES:", discounts.length);
        if (discounts.length > 0) {
          console.log("📋 DÉTAIL DES RÉDUCTIONS:", discounts.map(d => ({
            nom: d.getName(),
            type: d.getType() === DiscountType.PERCENTAGE ? 'pourcentage' : 'montant fixe',
            valeur: d.getAmount().getAmount()
          })));
        }
        console.log("==== FIN RULEENGINE.EXECUTE (SUCCÈS) ====\n");
        
        return {
          finalPrice: new Money(finalPrice),
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