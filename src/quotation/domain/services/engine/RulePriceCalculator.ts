import { Money } from "../../valueObjects/Money";
import { AppliedRule, RuleValueType } from "../../valueObjects/AppliedRule";
import {
  RuleExecutionResult,
  RuleExecutionResultBuilder,
  AppliedRuleDetail,
  AppliedRuleType,
} from "../../interfaces/RuleExecutionResult";
import { AppliedRuleResult } from "./RuleApplicationService";
import { devLog } from "../../../../lib/conditional-logger";

/**
 * Service de calcul du prix final
 *
 * Responsabilités:
 * - Calculer le prix final avec toutes les règles appliquées
 * - Gérer le prix minimum
 * - Construire le résultat final avec RuleExecutionResultBuilder
 */
export class RulePriceCalculator {
  /**
   * Calcule le prix final et construit le résultat complet
   */
  calculateFinalPrice(
    basePrice: Money,
    appliedRules: AppliedRuleResult[]
  ): RuleExecutionResult {
    const builder = new RuleExecutionResultBuilder(basePrice);

    let totalImpact = 0;
    let minimumPrice: number | null = null;
    const discounts: AppliedRule[] = [];

    // Traiter chaque règle appliquée
    for (const appliedRule of appliedRules) {
      // Gérer les règles de prix minimum
      if (appliedRule.isMinimumPrice) {
        minimumPrice = appliedRule.minimumPrice || null;
        continue;
      }

      // Accumuler l'impact total
      totalImpact += appliedRule.impact;

      // Créer AppliedRule pour compatibilité
      const rule = appliedRule.rule;
      const isReduction = appliedRule.originalImpact ? appliedRule.originalImpact < 0 : appliedRule.impact < 0;
      const absoluteImpact = Math.abs(appliedRule.originalImpact || appliedRule.impact);

      const valueType = rule.isPercentage()
        ? RuleValueType.PERCENTAGE
        : RuleValueType.FIXED;

      const appliedRuleObj = new AppliedRule(
        rule.name,
        valueType,
        Math.abs(rule.value),
        undefined, // code
        undefined, // expirationDate
        isReduction, // isReductionFlag
      );

      discounts.push(appliedRuleObj);

      // Ajouter au Builder
      const ruleType = this.determineRuleType(rule);

      const appliedRuleDetail: AppliedRuleDetail = {
        id: rule.id || "unknown",
        name: rule.name,
        type: ruleType,
        value: Math.abs(rule.value),
        isPercentage: rule.isPercentage(),
        impact: new Money(absoluteImpact),
        description: rule.name,
        address: appliedRule.address,
        isConsumed: false,
      };

      // Si la règle s'applique aux deux adresses, l'ajouter deux fois
      if (appliedRule.address === "both") {
        builder.addAppliedRule({
          ...appliedRuleDetail,
          address: "pickup",
        });
        builder.addAppliedRule({
          ...appliedRuleDetail,
          address: "delivery",
        });
      } else {
        builder.addAppliedRule(appliedRuleDetail);
      }
    }

    // Calculer le prix final
    const calculatedPrice = basePrice.getAmount() + totalImpact;
    let finalPrice = calculatedPrice;

    // Vérifier le prix minimum
    if (minimumPrice !== null && calculatedPrice < minimumPrice) {
      devLog.debug('RuleEngine',
        `⚠️ [RulePriceCalculator] PRIX FINAL (${calculatedPrice}) INFÉRIEUR AU MINIMUM (${minimumPrice}) - AJUSTEMENT`
      );
      finalPrice = minimumPrice;
      builder.setMinimumPrice(true, new Money(minimumPrice));
    } else if (finalPrice < 0) {
      devLog.debug('RuleEngine', "⚠️ [RulePriceCalculator] PRIX NÉGATIF DÉTECTÉ - Ajustement à 0");
      finalPrice = 0;
    }

    // Arrondir à 2 décimales
    const roundedFinalPrice = Math.round(finalPrice * 100) / 100;

    builder.setFinalPrice(new Money(roundedFinalPrice));

    // Ajouter les contraintes consommées si disponibles
    if (appliedRules.length > 0) {
      const firstRule = appliedRules[0];

      if (firstRule.pickupDetection?.furnitureLiftRequired) {
        builder.setAddressFurnitureLift(
          "pickup",
          true,
          firstRule.pickupDetection.furnitureLiftReason
        );
        builder.setAddressConsumedConstraints(
          "pickup",
          firstRule.pickupDetection.consumedConstraints || [],
          "Consommées par le Monte-meuble (départ)"
        );
      }

      if (firstRule.deliveryDetection?.furnitureLiftRequired) {
        builder.setAddressFurnitureLift(
          "delivery",
          true,
          firstRule.deliveryDetection.furnitureLiftReason
        );
        builder.setAddressConsumedConstraints(
          "delivery",
          firstRule.deliveryDetection.consumedConstraints || [],
          "Consommées par le Monte-meuble (arrivée)"
        );
      }

      // Informations globales sur le monte-meuble
      const furnitureLiftRequired =
        firstRule.pickupDetection?.furnitureLiftRequired ||
        firstRule.deliveryDetection?.furnitureLiftRequired;

      if (furnitureLiftRequired) {
        const furnitureLiftReason =
          firstRule.pickupDetection?.furnitureLiftReason ||
          firstRule.deliveryDetection?.furnitureLiftReason;

        builder.setFurnitureLift(furnitureLiftRequired, furnitureLiftReason);

        // Ajouter toutes les contraintes consommées (global)
        const allConsumedConstraints = new Set<string>([
          ...(firstRule.pickupDetection?.consumedConstraints || []),
          ...(firstRule.deliveryDetection?.consumedConstraints || []),
        ]);

        if (allConsumedConstraints.size > 0) {
          builder.setConsumedConstraints(
            Array.from(allConsumedConstraints),
            "Consommées par le Monte-meuble"
          );
        }
      }
    }

    // Construire le résultat
    const result = builder.build();

    // Compatibilité: ajouter la propriété discounts
    (result as any).discounts = discounts;

    // Logging du résultat
    devLog.debug('RuleEngine', "✅ [RulePriceCalculator] CALCUL TERMINÉ");
    devLog.debug('RuleEngine', "💰 PRIX FINAL:", roundedFinalPrice);
    devLog.debug('RuleEngine', "📋 RÈGLES APPLIQUÉES:", discounts.length);

    if (discounts.length > 0) {
      const surcharges = discounts.filter((d) => d.getAmount().getAmount() > 0);
      const reductions = discounts.filter((d) => d.getAmount().getAmount() < 0);

      if (surcharges.length > 0) {
        devLog.debug('RuleEngine', "📈 SURCHARGES APPLIQUÉES:", surcharges.length);
      }

      if (reductions.length > 0) {
        devLog.debug('RuleEngine', "📉 RÉDUCTIONS APPLIQUÉES:", reductions.length);
      }
    }

    return result;
  }

  /**
   * Détermine le type d'une règle appliquée
   */
  private determineRuleType(rule: any): AppliedRuleType {
    const name = rule.name.toLowerCase();

    // Vérifier si c'est une réduction
    if (rule.value < 0) {
      return AppliedRuleType.REDUCTION;
    }

    // Règle temporelle
    if (
      name.includes("weekend") ||
      name.includes("week-end") ||
      name.includes("samedi") ||
      name.includes("dimanche") ||
      name.includes("férié") ||
      name.includes("nuit")
    ) {
      return AppliedRuleType.TEMPORAL;
    }

    // Logique basée sur metadata (prioritaire)
    if (rule.metadata) {
      if (rule.metadata.display?.group === "equipment") {
        return AppliedRuleType.EQUIPMENT;
      }

      if (rule.metadata.category_frontend === "constraint") {
        return AppliedRuleType.CONSTRAINT;
      }

      if (rule.metadata.category_frontend === "service") {
        return AppliedRuleType.ADDITIONAL_SERVICE;
      }
    }

    // Fallback
    if (rule.isPercentage()) {
      return AppliedRuleType.CONSTRAINT;
    }

    if (name.includes("monte-meuble") || name.includes("monte meuble")) {
      return AppliedRuleType.EQUIPMENT;
    }

    return AppliedRuleType.ADDITIONAL_SERVICE;
  }
}
