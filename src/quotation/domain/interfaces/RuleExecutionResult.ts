/**
 * ============================================================================
 * INTERFACES - RÉSULTAT D'EXÉCUTION DES RÈGLES
 * ============================================================================
 *
 * Interface détaillée et explicite pour le résultat de l'exécution des règles
 */

import { Money } from "../valueObjects/Money";
// Temporary import for backward compatibility
import { Discount } from "../valueObjects/Discount";

/**
 * Type de règle appliquée
 */
export enum AppliedRuleType {
  /** Réduction (diminue le prix) */
  REDUCTION = "REDUCTION",
  /** Surcharge/Majoration (augmente le prix) */
  SURCHARGE = "SURCHARGE",
  /** Contrainte logistique */
  CONSTRAINT = "CONSTRAINT",
  /** Service supplémentaire */
  ADDITIONAL_SERVICE = "ADDITIONAL_SERVICE",
  /** Règle temporelle (week-end, heures de pointe) */
  TEMPORAL = "TEMPORAL",
  /** Équipement spécial (monte-meuble, etc.) */
  EQUIPMENT = "EQUIPMENT",
}

/**
 * Règle appliquée avec détails complets
 */
export interface AppliedRuleDetail {
  /** Identifiant unique de la règle */
  id: string;
  /** Nom de la règle */
  name: string;
  /** Type de règle */
  type: AppliedRuleType;
  /** Valeur (montant ou pourcentage) */
  value: number;
  /** Est-ce un pourcentage ? */
  isPercentage: boolean;
  /** Impact en euros */
  impact: Money;
  /** Description lisible */
  description: string;
  /** Adresse concernée (pickup, delivery, both) */
  address?: "pickup" | "delivery" | "both";
  /** Est consommée par une autre règle ? */
  isConsumed?: boolean;
  /** Contrainte consommée par quelle règle ? */
  consumedBy?: string;
}

/**
 * Coûts détaillés par adresse
 */
export interface AddressCosts {
  /** Contraintes logistiques appliquées */
  constraints: AppliedRuleDetail[];
  /** Services supplémentaires appliqués */
  additionalServices: AppliedRuleDetail[];
  /** Équipements spéciaux appliqués */
  equipment: AppliedRuleDetail[];
  /** Total des coûts pour cette adresse */
  total: Money;
}

/**
 * Résultat détaillé de l'exécution des règles
 */
export interface RuleExecutionResult {
  // ═══════════════════════════════════════════════════════════════════════
  // PRIX
  // ═══════════════════════════════════════════════════════════════════════

  /** Prix de base initial */
  basePrice: Money;

  /** Prix final après application de toutes les règles */
  finalPrice: Money;

  /** Montant total des réductions */
  totalReductions: Money;

  /** Montant total des surcharges */
  totalSurcharges: Money;

  // ═══════════════════════════════════════════════════════════════════════
  // RÈGLES APPLIQUÉES (PAR CATÉGORIE)
  // ═══════════════════════════════════════════════════════════════════════

  /** Toutes les règles appliquées */
  appliedRules: AppliedRuleDetail[];

  /** Réductions appliquées */
  reductions: AppliedRuleDetail[];

  /** Surcharges/Majorations appliquées */
  surcharges: AppliedRuleDetail[];

  /** Contraintes logistiques appliquées */
  constraints: AppliedRuleDetail[];

  /** Services supplémentaires appliqués */
  additionalServices: AppliedRuleDetail[];

  /** Équipements spéciaux appliqués (monte-meuble, etc.) */
  equipment: AppliedRuleDetail[];

  /** Règles temporelles appliquées (week-end, heures de pointe) */
  temporalRules: AppliedRuleDetail[];

  // ═══════════════════════════════════════════════════════════════════════
  // COÛTS PAR ADRESSE
  // ═══════════════════════════════════════════════════════════════════════

  /** Coûts détaillés pour l'adresse de départ (pickup) */
  pickupCosts: AddressCosts;

  /** Coûts détaillés pour l'adresse d'arrivée (delivery) */
  deliveryCosts: AddressCosts;

  /** Coûts globaux (non liés à une adresse spécifique) */
  globalCosts: AddressCosts;

  // ═══════════════════════════════════════════════════════════════════════
  // CONTRAINTES CONSOMMÉES
  // ═══════════════════════════════════════════════════════════════════════

  /** Liste des contraintes consommées (non facturées séparément) */
  consumedConstraints: string[];

  /** Raison de la consommation (ex: "consommées par Monte-meuble") */
  consumptionReason?: string;

  // ═══════════════════════════════════════════════════════════════════════
  // MÉTADONNÉES
  // ═══════════════════════════════════════════════════════════════════════

  /** Nombre total de règles évaluées */
  totalRulesEvaluated: number;

  /** Nombre de règles applicables */
  totalRulesApplied: number;

  /** Monte-meuble requis ? */
  furnitureLiftRequired: boolean;

  /** Raison du monte-meuble */
  furnitureLiftReason?: string;

  /** Prix minimum appliqué ? */
  minimumPriceApplied: boolean;

  /** Montant du prix minimum si appliqué */
  minimumPriceAmount?: Money;
}

/**
 * Builder pour construire progressivement un RuleExecutionResult
 */
export class RuleExecutionResultBuilder {
  private result: Partial<RuleExecutionResult>;

  constructor(basePrice: Money) {
    this.result = {
      basePrice,
      finalPrice: basePrice,
      totalReductions: new Money(0),
      totalSurcharges: new Money(0),
      appliedRules: [],
      reductions: [],
      surcharges: [],
      constraints: [],
      additionalServices: [],
      equipment: [],
      temporalRules: [],
      pickupCosts: this.createEmptyAddressCosts(),
      deliveryCosts: this.createEmptyAddressCosts(),
      globalCosts: this.createEmptyAddressCosts(),
      consumedConstraints: [],
      totalRulesEvaluated: 0,
      totalRulesApplied: 0,
      furnitureLiftRequired: false,
      minimumPriceApplied: false,
    };
  }

  private createEmptyAddressCosts(): AddressCosts {
    return {
      constraints: [],
      additionalServices: [],
      equipment: [],
      total: new Money(0),
    };
  }

  setFinalPrice(price: Money): this {
    this.result.finalPrice = price;
    return this;
  }

  addAppliedRule(rule: AppliedRuleDetail): this {
    this.result.appliedRules!.push(rule);
    this.result.totalRulesApplied!++;

    // Catégoriser selon le type
    switch (rule.type) {
      case AppliedRuleType.REDUCTION:
        this.result.reductions!.push(rule);
        this.result.totalReductions = this.result.totalReductions!.add(
          rule.impact,
        );
        break;
      case AppliedRuleType.SURCHARGE:
        this.result.surcharges!.push(rule);
        this.result.totalSurcharges = this.result.totalSurcharges!.add(
          rule.impact,
        );
        break;
      case AppliedRuleType.CONSTRAINT:
        this.result.constraints!.push(rule);
        this.addToAddressCosts(rule, "constraints");
        break;
      case AppliedRuleType.ADDITIONAL_SERVICE:
        this.result.additionalServices!.push(rule);
        this.addToAddressCosts(rule, "additionalServices");
        break;
      case AppliedRuleType.EQUIPMENT:
        this.result.equipment!.push(rule);
        this.addToAddressCosts(rule, "equipment");
        break;
      case AppliedRuleType.TEMPORAL:
        this.result.temporalRules!.push(rule);
        break;
    }

    return this;
  }

  private addToAddressCosts(
    rule: AppliedRuleDetail,
    category: "constraints" | "additionalServices" | "equipment",
  ): void {
    if (rule.address === "pickup") {
      this.result.pickupCosts![category].push(rule);
      this.result.pickupCosts!.total = this.result.pickupCosts!.total.add(
        rule.impact,
      );
    } else if (rule.address === "delivery") {
      this.result.deliveryCosts![category].push(rule);
      this.result.deliveryCosts!.total = this.result.deliveryCosts!.total.add(
        rule.impact,
      );
    } else {
      this.result.globalCosts![category].push(rule);
      this.result.globalCosts!.total = this.result.globalCosts!.total.add(
        rule.impact,
      );
    }
  }

  setConsumedConstraints(constraints: string[], reason?: string): this {
    this.result.consumedConstraints = constraints;
    this.result.consumptionReason = reason;
    return this;
  }

  setFurnitureLift(required: boolean, reason?: string): this {
    this.result.furnitureLiftRequired = required;
    this.result.furnitureLiftReason = reason;
    return this;
  }

  setMinimumPrice(applied: boolean, amount?: Money): this {
    this.result.minimumPriceApplied = applied;
    this.result.minimumPriceAmount = amount;
    return this;
  }

  setTotalRulesEvaluated(count: number): this {
    this.result.totalRulesEvaluated = count;
    return this;
  }

  build(): RuleExecutionResult {
    return this.result as RuleExecutionResult;
  }
}
