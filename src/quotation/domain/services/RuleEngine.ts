import { Money } from "../valueObjects/Money";
import { Rule } from "../valueObjects/Rule";
import { QuoteContext } from "../valueObjects/QuoteContext";
import { RuleExecutionResult } from "../interfaces/RuleExecutionResult";
import { logger } from "../../../lib/logger";
import { calculationDebugLogger } from "../../../lib/calculation-debug-logger";
import { devLog } from "../../../lib/conditional-logger";
import {
  RuleContextEnricher,
  RuleApplicationService,
  RulePriceCalculator
} from "./engine";

/**
 * Moteur d'exécution des règles métier (REFACTORISÉ)
 * Applique les règles sur un prix de base pour obtenir un prix final
 *
 * Délègue les responsabilités à:
 * - RuleContextEnricher: Enrichissement et fusion du contexte
 * - RuleApplicationService: Application des règles
 * - RulePriceCalculator: Calcul du prix final
 *
 * Réduction: 890 lignes → 200 lignes (-77%)
 * execute(): 539 lignes → 50 lignes (-91%)
 */
export class RuleEngine {
  private contextEnricher: RuleContextEnricher;
  private applicationService: RuleApplicationService;
  private priceCalculator: RulePriceCalculator;

  constructor(private rules: Rule[]) {
    // Trier les règles par priorité
    this.rules.sort(this.sortRules);

    // Initialiser les services
    this.contextEnricher = new RuleContextEnricher(this.rules);
    this.applicationService = new RuleApplicationService();
    this.priceCalculator = new RulePriceCalculator();
  }

  /**
   * Exécute toutes les règles applicables sur le prix
   * REFACTORISÉ: Méthode réduite de 539 lignes à ~50 lignes (-91%)
   */
  execute(context: QuoteContext, basePrice: Money): RuleExecutionResult {
    try {
      // Démarrer le logging
      calculationDebugLogger.startRulesEngine(
        this.rules,
        basePrice.getAmount(),
        context.getAllData()
      );

      devLog.debug('RuleEngine',
        `📋 CONTEXTE: ${this.rules.length} règles | Prix base: ${basePrice.getAmount().toFixed(2)}€`
      );

      // Valider le contexte
      try {
        devLog.debug('RuleEngine', "🔍 VALIDATION DU CONTEXTE...");
        context.validate();
        devLog.debug('RuleEngine', "✅ CONTEXTE VALIDÉ");
      } catch (error) {
        devLog.debug('RuleEngine', "❌ ERREUR DE VALIDATION DU CONTEXTE:", error);
        throw error;
      }

      // 1. Enrichir le contexte (délégué à RuleContextEnricher)
      const enrichedContext = this.contextEnricher.enrichContext(context);

      // Mettre à jour le contexte avec les services fusionnés
      if (enrichedContext.allServices && enrichedContext.allServices.length > 0) {
        context.setValue('additionalServices', enrichedContext.allServices);
      }

      // 2. Appliquer les règles (délégué à RuleApplicationService)
      devLog.debug('RuleEngine', "🔄 TRAITEMENT DE CHAQUE RÈGLE...");
      const appliedRules = this.applicationService.applyRules(
        this.rules,
        enrichedContext,
        basePrice
      );

      // 3. Calculer le prix final (délégué à RulePriceCalculator)
      const result = this.priceCalculator.calculateFinalPrice(
        basePrice,
        appliedRules
      );

      // 4. Terminer le logging
      calculationDebugLogger.finishRulesEngine(result);
      devLog.debug('RuleEngine', "==== FIN RULEENGINE.EXECUTE (SUCCÈS) ====\n");

      return result;

    } catch (error) {
      logger.error("Erreur lors de l'exécution du moteur de règles:", error);
      calculationDebugLogger.logError(error as Error);
      devLog.debug('RuleEngine', "❌ ERREUR GÉNÉRALE DANS RULEENGINE.EXECUTE:", error);
      devLog.debug('RuleEngine', "==== FIN RULEENGINE.EXECUTE (ERREUR) ====\n");

      throw new Error(
        `Impossible d'exécuter les règles: ${error instanceof Error ? error.message : "Erreur inconnue"}`
      );
    }
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
    this.rules = this.rules.filter((rule) => !rule.equals(ruleToRemove));
  }

  /**
   * Tri des règles par priorité
   */
  private sortRules = (a: Rule, b: Rule): number => {
    // Priorité spéciale pour la règle de tarif minimum
    if (a.name === "Tarif minimum") return 1;
    if (b.name === "Tarif minimum") return -1;

    // Priorité pour les règles en pourcentage
    if (a.isPercentage() && !b.isPercentage()) return -1;
    if (!a.isPercentage() && b.isPercentage()) return 1;

    return 0;
  };
}
