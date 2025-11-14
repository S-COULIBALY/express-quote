import { Rule, RuleApplyResult } from "../../valueObjects/Rule";
import { Money } from "../../valueObjects/Money";
import { EnrichedContext } from "./RuleContextEnricher";
import { calculationDebugLogger } from "../../../../lib/calculation-debug-logger";
import { devLog } from "../../../../lib/conditional-logger";

/**
 * Service d'application des règles
 *
 * Responsabilités:
 * - Vérifier l'applicabilité des règles
 * - Appliquer les règles avec gestion des contraintes consommées
 * - Déterminer l'adresse d'application (pickup, delivery, both)
 */
export class RuleApplicationService {
  /**
   * Applique toutes les règles applicables et retourne les résultats
   * Les règles sont appliquées si leur ID est dans les sélections utilisateur
   */
  applyRules(
    rules: Rule[],
    enrichedContext: EnrichedContext,
    basePrice: Money
  ): AppliedRuleResult[] {
    const appliedRules: AppliedRuleResult[] = [];
    let currentPrice = basePrice.getAmount();

    for (const rule of rules) {
      // Vérifier si la règle doit être ignorée
      // Note: shouldSkipRule() appelle déjà calculationDebugLogger.logRuleSkipped() avec la raison détaillée
      if (this.shouldSkipRule(rule, enrichedContext)) {
        continue;
      }

      // Vérifier l'applicabilité (basée sur les sélections utilisateur)
      const isApplicable = rule.isApplicable(enrichedContext);
      if (!isApplicable) {
        calculationDebugLogger.logRuleEvaluation(rule, enrichedContext, false);
        continue;
      }

      // Appliquer la règle
      const ruleResult = this.applyRule(rule, currentPrice, enrichedContext, basePrice);

      if (ruleResult) {
        appliedRules.push(ruleResult);
        currentPrice = ruleResult.newPrice;
      }
    }

    return appliedRules;
  }

  /**
   * Vérifie si une règle doit être ignorée (contrainte consommée)
   * ✅ AMÉLIORATION: Logging amélioré pour distinguer déclaré vs inféré
   */
  private shouldSkipRule(rule: Rule, context: EnrichedContext): boolean {
    // Vérifier si la contrainte a été consommée par le monte-meuble
    if (context.furniture_lift_required && context.consumed_constraints) {
      const ruleId = rule.id;

      // Si cette règle est la règle du monte-meuble elle-même, ne pas l'ignorer
      if (rule.condition === "furniture_lift_required" ||
          rule.name === "Monte-meuble" ||
          rule.name === "Supplément monte-meuble") {
        return false;
      }

      // Vérifier si l'ID est dans les contraintes consommées
      if (ruleId && context.consumed_constraints.has(ruleId)) {
        // ✅ AMÉLIORATION: Déterminer si la contrainte était déclarée ou inférée
        const wasDeclared = context.declared_constraints?.has(ruleId) || false;
        const wasInferred = context.inferred_constraints?.has(ruleId) || false;
        
        const reason = wasInferred 
          ? `Contrainte consommée par le monte-meuble (inférée automatiquement)`
          : `Contrainte consommée par le monte-meuble (déclarée par le client)`;
        
        calculationDebugLogger.logRuleSkipped(rule, reason);
        return true;
      }

      // Vérifier aussi par le nom de contrainte (fallback)
      const constraintName = this.extractConstraintNameFromCondition(rule.condition);
      if (constraintName && context.consumed_constraints.has(constraintName)) {
        const wasDeclared = context.declared_constraints?.has(constraintName) || false;
        const wasInferred = context.inferred_constraints?.has(constraintName) || false;
        
        const reason = wasInferred 
          ? `Contrainte consommée par le monte-meuble (inférée automatiquement)`
          : `Contrainte consommée par le monte-meuble (déclarée par le client)`;
        
        calculationDebugLogger.logRuleSkipped(rule, reason);
        return true;
      }
    }
    return false;
  }

  /**
   * Applique une règle et retourne le résultat
   */
  private applyRule(
    rule: Rule,
    currentPrice: number,
    context: EnrichedContext,
    basePrice: Money
  ): AppliedRuleResult | null {
    try {
      // Arrondir pour éviter les erreurs de précision
      const roundedPrice = Math.round(currentPrice * 100) / 100;

      const ruleResult: RuleApplyResult = rule.apply(
        new Money(roundedPrice),
        context,
        basePrice
      );

      // Règle de prix minimum
      if (ruleResult.minimumPrice !== undefined) {
        calculationDebugLogger.logRuleSkipped(
          rule,
          `Règle de prix minimum: ${ruleResult.minimumPrice}€`
        );
        return {
          rule,
          isMinimumPrice: true,
          minimumPrice: ruleResult.minimumPrice,
          impact: 0,
          newPrice: currentPrice,
          address: 'none',
          pickupDetection: (context as any).pickupDetection,
          deliveryDetection: (context as any).deliveryDetection
        };
      }

      // Règle normale avec impact
      if (ruleResult.isApplied && ruleResult.impact !== 0) {
        const address = this.determineAddress(rule, context);
        const multiplier = address === 'both' ? 2 : 1;
        const totalImpact = Math.round(ruleResult.impact * multiplier * 100) / 100;
        const newPrice = Math.round((currentPrice + totalImpact) * 100) / 100;

        // Logger l'application
        if (multiplier === 2) {
          const doubledResult = {
            ...ruleResult,
            impact: totalImpact,
            price: newPrice,
            newPrice: new Money(newPrice),
          };
          calculationDebugLogger.logRuleApplication(
            rule,
            currentPrice,
            doubledResult,
            context
          );
        } else {
          calculationDebugLogger.logRuleApplication(
            rule,
            currentPrice,
            ruleResult,
            context
          );
        }

        return {
          rule,
          isMinimumPrice: false,
          impact: totalImpact,
          newPrice,
          address,
          originalImpact: ruleResult.impact,
          pickupDetection: (context as any).pickupDetection,
          deliveryDetection: (context as any).deliveryDetection
        };
      }

      return null;
    } catch (error) {
      devLog.error(`Erreur lors de l'application de la règle ${rule.name}:`, error);
      return null;
    }
  }

  /**
   * Détermine l'adresse concernée par une règle (pickup, delivery, both, none)
   * Utilise le champ scope pour l'affichage et le contexte
   */
  private determineAddress(
    rule: Rule,
    contextData: Record<string, unknown>
  ): 'pickup' | 'delivery' | 'both' | 'none' {
    // Le scope est utilisé pour catégoriser l'affichage frontend
    // mais pas pour filtrer l'application des règles
    if (rule.scope) {
      switch (rule.scope) {
        case 'PICKUP': return 'pickup';
        case 'DELIVERY': return 'delivery';
        case 'BOTH': return 'both';
        case 'GLOBAL': return 'none';
        default: break;
      }
    }

    return "both";
  }

  /**
   * Extrait le nom de contrainte d'une condition de règle
   */
  private extractConstraintNameFromCondition(condition: any): string | null {
    if (typeof condition === "string") {
      return condition;
    }

    if (typeof condition === "object" && condition !== null) {
      const type = condition.type;

      // Vehicle Access
      if (type === "vehicle_access") {
        if (condition.zone === "pedestrian") return "pedestrian_zone";
        if (condition.road === "narrow") return "narrow_inaccessible_street";
        if (condition.parking === "difficult") return "difficult_parking";
        if (condition.parking === "limited") return "limited_parking";
        if (condition.traffic === "complex") return "complex_traffic";
      }

      // Building
      if (type === "building") {
        if (condition.elevator === "unavailable") return "elevator_unavailable";
        if (condition.elevator === "small") return "elevator_unsuitable_size";
        if (condition.elevator === "forbidden") return "elevator_forbidden_moving";
        if (condition.stairs === "difficult") return "difficult_stairs";
        if (condition.corridors === "narrow") return "narrow_corridors";
      }

      // Distance
      if (type === "distance") {
        if (condition.carrying === "long") return "long_carrying_distance";
        if (condition.access === "indirect") return "indirect_exit";
        if (condition.access === "multilevel") return "complex_multilevel_access";
      }

      // Security
      if (type === "security") {
        if (condition.access === "strict") return "access_control";
        if (condition.permit === "required") return "administrative_permit";
        if (condition.time === "restricted") return "time_restrictions";
        if (condition.floor === "fragile") return "fragile_floor";
      }

      // Equipment
      if (type === "equipment") {
        if (condition.lift === "required") return "furniture_lift_required";
      }

      // Service
      if (type === "service") {
        if (condition.handling === "bulky") return "bulky_furniture";
        if (condition.handling === "disassembly") return "furniture_disassembly";
        if (condition.handling === "reassembly") return "furniture_reassembly";
        if (condition.handling === "piano") return "transport_piano";
        if (condition.packing === "departure") return "professional_packing_departure";
        if (condition.packing === "arrival") return "professional_unpacking_arrival";
        if (condition.packing === "supplies") return "packing_supplies";
        if (condition.packing === "artwork") return "artwork_packing";
        if (condition.protection === "fragile") return "fragile_valuable_items";
        if (condition.protection === "heavy") return "heavy_items";
        if (condition.protection === "insurance") return "additional_insurance";
        if (condition.protection === "inventory") return "photo_inventory";
        if (condition.storage === "temporary") return "temporary_storage_service";
        if (condition.cleaning === "post_move") return "post_move_cleaning";
        if (condition.admin === "management") return "administrative_management";
        if (condition.transport === "animals") return "animal_transport";
      }
    }

    return null;
  }
}

export interface AppliedRuleResult {
  rule: Rule;
  isMinimumPrice: boolean;
  minimumPrice?: number;
  impact: number;
  newPrice: number;
  address: 'pickup' | 'delivery' | 'both' | 'none';
  originalImpact?: number;
  pickupDetection?: any;
  deliveryDetection?: any;
}
