import { Money } from '../valueObjects/Money';
import { Rule, RuleApplyResult } from '../valueObjects/Rule';
import { QuoteContext } from '../valueObjects/QuoteContext';
import { Discount, DiscountType } from '../valueObjects/Discount';
import { logger } from '../../../lib/logger';
import { calculationDebugLogger } from '../../../lib/calculation-debug-logger';

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
    
    // Démarrer le logging détaillé du moteur de règles
    calculationDebugLogger.startRulesEngine(this.rules, basePrice.getAmount(), context.getAllData());
    
    // ✨ OPTIMISATION: Analyser les contraintes consommées UNE SEULE FOIS
    const contextData = context.getAllData();
    const furnitureLiftAnalysis = this.analyzeFurnitureLiftRequirement(contextData);
    
    // ✨ AFFICHAGE OPTIMISÉ: Contexte des contraintes consommées (une seule fois)
    if (furnitureLiftAnalysis.required && furnitureLiftAnalysis.consumedConstraints.size > 0) {
      console.log('\n🏗️ [CONTEXTE] MONTE-MEUBLE REQUIS');
      console.log(`   📦 Contraintes consommées: [${Array.from(furnitureLiftAnalysis.consumedConstraints).map(c => `'${c}'`).join(', ')}]`);
      console.log(`   ℹ️  Les règles liées à ces contraintes seront automatiquement ignorées\n`);
    }
    
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
      const basePriceAmount = basePrice.getAmount(); // Prix de base constant
      let totalImpact = 0; // Accumuler tous les impacts
    const appliedRules: string[] = [];
      let minimumPrice: number | null = null; // Stocker le prix minimum
      
      console.log("🔄 TRAITEMENT DE CHAQUE RÈGLE...");
      
      // Traiter chaque règle
      try {
        for (const rule of this.rules) {
          // ✨ OPTIMISATION: Vérification rapide des contraintes consommées
          if (furnitureLiftAnalysis.required && this.isRuleConstraintConsumed(rule, furnitureLiftAnalysis.consumedConstraints)) {
            calculationDebugLogger.logRuleSkipped(rule, "Contrainte consommée par le monte-meuble");
            continue;
          }
          
          try {
            // Vérifier si la règle est applicable
            const isApplicable = rule.isApplicable(contextData);
            
            if (isApplicable) {
              // Application de la règle - les détails sont loggés par calculationDebugLogger
              
              try {
                // ✅ CORRECTION: Toujours appliquer les règles sur le prix de base
                const currentPrice = basePriceAmount + totalImpact;

                // Appliquer la règle sur le prix de base (pour les pourcentages)
                const ruleResult: RuleApplyResult = rule.apply(new Money(currentPrice), contextData, basePrice);

                // Vérifier si la règle définit un prix minimum
                if (ruleResult.minimumPrice !== undefined) {
                  console.log("⚠️ RÈGLE DÉFINIT UN PRIX MINIMUM:", ruleResult.minimumPrice);
                  minimumPrice = ruleResult.minimumPrice;
                  calculationDebugLogger.logRuleSkipped(rule, `Règle de prix minimum: ${ruleResult.minimumPrice}€`);
                  // Ne pas ajouter de réduction pour les règles de prix minimum
                  continue;
                }

                // Pour les règles normales avec un impact
                if (ruleResult.isApplied && ruleResult.impact !== 0) {
                  // Accumuler l'impact au lieu de remplacer le prix
                  totalImpact += ruleResult.impact;

                  // Logger l'application de la règle (format Option D)
                  calculationDebugLogger.logRuleApplication(rule, currentPrice, ruleResult, contextData);
        
                  // Déterminer le type de réduction
                  const discountType = rule.isPercentage() ? 
                    DiscountType.PERCENTAGE : 
                    DiscountType.FIXED;
                  
                  // Créer un objet Discount avec l'impact absolu
                  try {
                    // Déterminer si c'est une réduction (impact négatif) ou une surcharge (impact positif)
                    const isReduction = ruleResult.impact < 0;
                    const absoluteImpact = Math.abs(ruleResult.impact);
                    
                    // ✅ CORRECTION: Utiliser la valeur originale de la règle directement
                    const discountValue = Math.abs(rule.value);
                    
                    const discount = new Discount(
                      rule.name,
                      discountType,
                      discountValue,
                      undefined, // code
                      undefined, // expirationDate
                      isReduction // isReductionFlag
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
                  calculationDebugLogger.logRuleSkipped(rule, `Règle sans impact: isApplied=${ruleResult.isApplied}, impact=${ruleResult.impact}`);
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
            } else {
              // Logger l'évaluation pour les règles non applicables seulement
              calculationDebugLogger.logRuleEvaluation(rule, contextData, false);
            }
          } catch (ruleError) {
            console.log("❌ ERREUR SPÉCIFIQUE À UNE RÈGLE:", ruleError);
            calculationDebugLogger.logRuleEvaluation(rule, context.getAllData(), false, ruleError);
            throw ruleError;
          }
        }
        
        // Calculer le prix final = prix de base + tous les impacts
        let finalPrice = basePriceAmount + totalImpact;

        // Vérifier que le prix final n'est pas inférieur au prix minimum
        console.log("🔍 VÉRIFICATION DU PRIX FINAL...");
        const priceBeforeMinimumCheck = finalPrice;
        if (minimumPrice !== null && finalPrice < minimumPrice) {
          console.log(`⚠️ PRIX FINAL (${finalPrice}) INFÉRIEUR AU MINIMUM (${minimumPrice}) - AJUSTEMENT`);
          finalPrice = minimumPrice;
          calculationDebugLogger.logMinimumPriceCheck(priceBeforeMinimumCheck, minimumPrice, finalPrice);
        }
        // Vérifier que le prix final n'est pas négatif
        else if (finalPrice < 0) {
          console.log("⚠️ PRIX NÉGATIF DÉTECTÉ - Ajustement à 0");
          finalPrice = 0;
      } else if (minimumPrice !== null) {
          calculationDebugLogger.logMinimumPriceCheck(priceBeforeMinimumCheck, minimumPrice, finalPrice);
        }

        console.log("✅ EXECUTION TERMINÉE - Résultat:");
        console.log("💰 PRIX FINAL:", finalPrice);
        console.log("📋 RÈGLES APPLIQUÉES:", discounts.length);
        if (discounts.length > 0) {
          // Séparer les surcharges des réductions
          const surcharges = discounts.filter(d => d.getAmount().getAmount() > 0);
          const reductions = discounts.filter(d => d.getAmount().getAmount() < 0);
          
          if (surcharges.length > 0) {
            console.log("📈 SURCHARGES APPLIQUÉES:", surcharges.length);
            console.log("📈 DÉTAIL DES SURCHARGES:", surcharges.map(d => ({
            nom: d.getName(),
            type: d.getType() === DiscountType.PERCENTAGE ? 'pourcentage' : 'montant fixe',
            valeur: d.getAmount().getAmount()
          })));
          }
          
          if (reductions.length > 0) {
            console.log("📉 RÉDUCTIONS APPLIQUÉES:", reductions.length);
            console.log("📉 DÉTAIL DES RÉDUCTIONS:", reductions.map(d => ({
              nom: d.getName(),
              type: d.getType() === DiscountType.PERCENTAGE ? 'pourcentage' : 'montant fixe',
              valeur: Math.abs(d.getAmount().getAmount()) // Afficher en valeur absolue pour les réductions
            })));
          }
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
      throw new Error(`Impossible d'exécuter les règles: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
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

  // ============================================================================
  // MÉTHODES UTILITAIRES POUR L'OPTIMISATION DES LOGS
  // ============================================================================
  
  /**
   * Analyse si le monte-meuble est requis et quelles contraintes sont consommées
   * (Réutilise la logique de Rule.analyzeFurnitureLiftRequirement)
   */
  private analyzeFurnitureLiftRequirement(context: any): { required: boolean; consumedConstraints: Set<string> } {
    const consumedConstraints = new Set<string>();
    let required = false;
    
    // Récupérer les données d'étage et d'ascenseur
    const pickupFloor = parseInt(context.pickupFloor || '0');
    const deliveryFloor = parseInt(context.deliveryFloor || '0');
    const pickupElevator = context.pickupElevator;
    const deliveryElevator = context.deliveryElevator;
    
    // Vérifier si le monte-meuble est explicitement requis
    if (this.hasLogisticsConstraint(context, 'furniture_lift_required')) {
      required = true;
      consumedConstraints.add('furniture_lift_required');
    }
    
    // Logique d'activation automatique du monte-meuble
    const hasNoElevator = !pickupElevator || pickupElevator === 'no' || !deliveryElevator || deliveryElevator === 'no';
    const hasSmallElevator = pickupElevator === 'small' || deliveryElevator === 'small';
    const hasElevatorProblems = this.hasLogisticsConstraint(context, 'elevator_unavailable') ||
                               this.hasLogisticsConstraint(context, 'elevator_unsuitable_size') ||
                               this.hasLogisticsConstraint(context, 'elevator_forbidden_moving');
    
    const maxFloor = Math.max(pickupFloor, deliveryFloor);
    
    // CAS 1: Étage élevé (> 3) sans ascenseur fonctionnel
    if (maxFloor > 3 && (hasNoElevator || hasElevatorProblems)) {
      required = true;
      if (hasElevatorProblems) {
        if (this.hasLogisticsConstraint(context, 'elevator_unavailable')) consumedConstraints.add('elevator_unavailable');
        if (this.hasLogisticsConstraint(context, 'elevator_unsuitable_size')) consumedConstraints.add('elevator_unsuitable_size');
        if (this.hasLogisticsConstraint(context, 'elevator_forbidden_moving')) consumedConstraints.add('elevator_forbidden_moving');
      }
    }
    
    // CAS 2: Contraintes d'accès difficile + objets lourds/encombrants
    const hasAccessConstraints = this.hasLogisticsConstraint(context, 'difficult_stairs') ||
                                this.hasLogisticsConstraint(context, 'narrow_corridors') ||
                                this.hasLogisticsConstraint(context, 'indirect_exit') ||
                                this.hasLogisticsConstraint(context, 'complex_multilevel_access');
    
    const hasHeavyItems = this.hasLogisticsConstraint(context, 'bulky_furniture');
    
    if (maxFloor >= 1 && hasAccessConstraints && hasHeavyItems) {
      required = true;
      
      // Marquer les contraintes comme consommées
      if (this.hasLogisticsConstraint(context, 'difficult_stairs')) consumedConstraints.add('difficult_stairs');
      if (this.hasLogisticsConstraint(context, 'narrow_corridors')) consumedConstraints.add('narrow_corridors');
      if (this.hasLogisticsConstraint(context, 'indirect_exit')) consumedConstraints.add('indirect_exit');
      if (this.hasLogisticsConstraint(context, 'complex_multilevel_access')) consumedConstraints.add('complex_multilevel_access');
      if (this.hasLogisticsConstraint(context, 'bulky_furniture')) consumedConstraints.add('bulky_furniture');
    }
    
    // CAS 3: Ascenseur small + contraintes + objets lourds
    if (hasSmallElevator && hasAccessConstraints && hasHeavyItems && maxFloor >= 1) {
      required = true;
      
      // Marquer les contraintes comme consommées (même logique que CAS 2)
      if (this.hasLogisticsConstraint(context, 'difficult_stairs')) consumedConstraints.add('difficult_stairs');
      if (this.hasLogisticsConstraint(context, 'narrow_corridors')) consumedConstraints.add('narrow_corridors');
      if (this.hasLogisticsConstraint(context, 'indirect_exit')) consumedConstraints.add('indirect_exit');
      if (this.hasLogisticsConstraint(context, 'complex_multilevel_access')) consumedConstraints.add('complex_multilevel_access');
      if (this.hasLogisticsConstraint(context, 'bulky_furniture')) consumedConstraints.add('bulky_furniture');
    }
    
    return { required, consumedConstraints };
  }
  
  /**
   * Vérifie si une règle doit être ignorée car sa contrainte est consommée par le monte-meuble
   */
  private isRuleConstraintConsumed(rule: any, consumedConstraints: Set<string>): boolean {
    // Si cette règle est la règle du monte-meuble elle-même, ne pas l'ignorer
    if (rule.condition === 'furniture_lift_required' || rule.name === 'Monte-meuble') {
      return false;
    }
    
    // Vérifier si la condition de cette règle correspond à une contrainte consommée
    if (consumedConstraints.has(rule.condition)) {
      return true;
    }
    
    // Cas spéciaux pour les règles qui vérifient des variables booléennes
    const constraintMappings: Record<string, string> = {
      'difficult_stairs': 'difficult_stairs',
      'narrow_corridors': 'narrow_corridors', 
      'indirect_exit': 'indirect_exit',
      'complex_multilevel_access': 'complex_multilevel_access',
      'bulky_furniture': 'bulky_furniture',
      'elevator_unavailable': 'elevator_unavailable',
      'elevator_unsuitable_size': 'elevator_unsuitable_size',
      'elevator_forbidden_moving': 'elevator_forbidden_moving'
    };
    
    // Vérifier si la condition correspond à une contrainte mappée qui est consommée
    const mappedConstraint = constraintMappings[rule.condition];
    if (mappedConstraint && consumedConstraints.has(mappedConstraint)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Vérifie si une contrainte logistique est présente dans le contexte
   */
  private hasLogisticsConstraint(context: any, constraint: string): boolean {
    const pickupConstraints = context.pickupLogisticsConstraints || [];
    const deliveryConstraints = context.deliveryLogisticsConstraints || [];
    
    return pickupConstraints.includes(constraint) || deliveryConstraints.includes(constraint);
  }

  /**
   * Compte combien de fois une contrainte logistique est présente (pickup + delivery)
   */
  private countLogisticsConstraint(context: any, constraint: string): number {
    const pickupConstraints = context.pickupLogisticsConstraints || [];
    const deliveryConstraints = context.deliveryLogisticsConstraints || [];
    
    let count = 0;
    if (pickupConstraints.includes(constraint)) count++;
    if (deliveryConstraints.includes(constraint)) count++;
    
    return count;
  }
} 