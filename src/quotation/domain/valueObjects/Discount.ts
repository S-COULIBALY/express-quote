/**
 * ============================================================================
 * FICHIER DE COMPATIBILITÉ - À SUPPRIMER APRÈS MIGRATION
 * ============================================================================
 *
 * Ce fichier réexporte AppliedRule sous l'ancien nom Discount
 * pour maintenir la compatibilité pendant la migration.
 *
 * @deprecated Utiliser AppliedRule directement
 */

export {
  AppliedRule as Discount,
  RuleValueType as DiscountType,
} from "./AppliedRule";

// Réexporter aussi la classe pour les imports existants
export { AppliedRule, RuleValueType } from "./AppliedRule";
