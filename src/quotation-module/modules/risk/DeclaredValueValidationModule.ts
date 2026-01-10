import { QuoteContext, QuoteModule } from '../types/quote-types';

/**
 * DeclaredValueValidationModule - Valide la valeur déclarée des biens
 *
 * TYPE : B (conditionnel - si valeur déclarée fournie)
 * PRIORITÉ : 70 (PHASE 7 - Assurance & Risque)
 *
 * RESPONSABILITÉS :
 * - Valide que la valeur déclarée est dans les limites acceptables
 * - Contribue au score de risque si valeur élevée
 * - Ajoute des notes d'assurance si nécessaire
 */
export class DeclaredValueValidationModule implements QuoteModule {
  readonly id = 'declared-value-validation';
  readonly description = "Valide la valeur déclarée des biens";
  readonly priority = 70;

  /**
   * Le module s'applique uniquement si une valeur déclarée est fournie
   */
  isApplicable(ctx: QuoteContext): boolean {
    return ctx.declaredValue !== undefined && ctx.declaredValue !== null;
  }

  apply(ctx: QuoteContext): QuoteContext {
    // Validation de la valeur déclarée
    const declaredValue = ctx.declaredValue || 0;
    const maxAllowedValue = 50000; // Plafond standard d'assurance
    const minAllowedValue = 0;

    // Vérifications de la valeur déclarée
    const isValidValue = 
      declaredValue >= minAllowedValue && 
      declaredValue <= maxAllowedValue;

    // Calcul du risque selon la valeur déclarée
    const riskScore = this.calculateRiskScore(declaredValue);

    // Construire les impacts légaux et notes d'assurance
    const legalImpacts = [];
    const insuranceNotes = [];

    if (!isValidValue) {
      if (declaredValue < minAllowedValue) {
        legalImpacts.push({
          moduleId: this.id,
          severity: 'WARNING' as const,
          type: 'REGULATORY' as const,
          message: `Valeur déclarée invalide (${declaredValue} €). Minimum requis : ${minAllowedValue} €`,
          metadata: { declaredValue, minAllowedValue }
        });
      } else if (declaredValue > maxAllowedValue) {
        legalImpacts.push({
          moduleId: this.id,
          severity: 'WARNING' as const,
          type: 'INSURANCE_CAP' as const,
          message: `Valeur déclarée (${declaredValue} €) dépasse le plafond standard (${maxAllowedValue} €). Assurance plafonnée à ${maxAllowedValue} €`,
          metadata: { declaredValue, maxAllowedValue }
        });
        insuranceNotes.push(`Assurance plafonnée à ${maxAllowedValue} € (valeur déclarée : ${declaredValue} €)`);
      }
    }

    // Ajouter une contribution au risque si valeur élevée
    const riskContribution = riskScore > 3 ? {
      moduleId: this.id,
      amount: (riskScore - 3) * 5, // 5 points par niveau au-delà de 3
      reason: `Valeur déclarée élevée (${declaredValue} €)`,
      metadata: { declaredValue, riskScore }
    } : null;

    return {
      ...ctx,
      computed: {
        ...ctx.computed,
        // Contribuer au score de risque si nécessaire
        riskContributions: [
          ...(ctx.computed?.riskContributions || []),
          ...(riskContribution ? [riskContribution] : [])
        ],
        // Ajouter les impacts légaux
        legalImpacts: [
          ...(ctx.computed?.legalImpacts || []),
          ...legalImpacts
        ],
        // Ajouter les notes d'assurance
        insuranceNotes: [
          ...(ctx.computed?.insuranceNotes || []),
          ...insuranceNotes
        ],
        // Préserver les autres champs
        costs: ctx.computed?.costs || [],
        adjustments: ctx.computed?.adjustments || [],
        requirements: ctx.computed?.requirements || [],
        crossSellProposals: ctx.computed?.crossSellProposals || [],
        operationalFlags: ctx.computed?.operationalFlags || [],
        activatedModules: [
          ...(ctx.computed?.activatedModules || []),
          this.id // String uniquement
        ],
        metadata: {
          ...(ctx.computed?.metadata || {}),
          declaredValueValid: isValidValue,
          declaredValueRiskScore: riskScore,
          }
        }
    };
  }

  /**
   * Calcule un score de risque selon la valeur déclarée
   */
  private calculateRiskScore(declaredValue: number): number {
    // Calcul progressif du score de risque
    if (declaredValue <= 5000) return 1;
    if (declaredValue <= 15000) return 2;
    if (declaredValue <= 30000) return 3;
    if (declaredValue <= 50000) return 4;
    return 5; // Au-delà du plafond standard
  }
}