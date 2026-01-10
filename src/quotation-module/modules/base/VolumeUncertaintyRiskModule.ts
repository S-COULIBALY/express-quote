import { QuoteContext, QuoteModule } from '../types/quote-types';

/**
 * VolumeUncertaintyRiskModule - Calcule le risque d'incertitude sur le volume
 *
 * TYPE : C (dépendant d'état - nécessite que le volume soit calculé)
 * PRIORITÉ : 24 (PHASE 2 - Volume & Charge)
 * DÉPENDANCES : Nécessite VolumeEstimationModule (priority 20)
 *
 * RESPONSABILITÉS :
 * - Évalue le risque lié à l'incertitude sur le volume
 * - Contribue au score de risque global
 */
export class VolumeUncertaintyRiskModule implements QuoteModule {
  readonly id = 'volume-uncertainty-risk';
  readonly description = "Calcule le risque d'incertitude sur le volume";
  readonly priority = 24;
  readonly dependencies = ['volume-estimation'];

  /**
   * TYPE C : Le module s'applique uniquement si :
   * 1. Le volume de base a été calculé (vérifié via dépendance + computed.baseVolume)
   *
   * isApplicable() est vérifié APRÈS que les dépendances aient été satisfaites,
   * ce qui permet d'accéder au volume calculé par VolumeEstimationModule.
   */
  isApplicable(ctx: QuoteContext): boolean {
    return !!ctx.computed?.baseVolume && ctx.computed.baseVolume > 0;
  }

  apply(ctx: QuoteContext): QuoteContext {
    const baseVolume = ctx.computed?.baseVolume || 0;
    const adjustedVolume = ctx.computed?.adjustedVolume || 0;
    const volumeConfidence = ctx.volumeConfidence || 'MEDIUM';
    
    // Différence entre volume de base et volume ajusté (reflète l'incertitude)
    const volumeDiffPercentage = baseVolume > 0 
      ? Math.abs((adjustedVolume - baseVolume) / baseVolume * 100)
      : 0;

    // Calcul du score de risque selon la confiance et la différence
    let riskScore = 0;
    
    // Risque basé sur la confiance déclarée
    if (volumeConfidence === 'LOW') {
      riskScore = 15; // Risque élevé si confiance faible
    } else if (volumeConfidence === 'MEDIUM') {
      riskScore = 8; // Risque moyen si confiance moyenne
    } else {
      riskScore = 3; // Risque faible si confiance élevée
    }

    // Ajustement selon la différence entre base et ajusté
    if (volumeDiffPercentage > 30) {
      riskScore += 10; // +10 si grande différence
    } else if (volumeDiffPercentage > 15) {
      riskScore += 5; // +5 si différence moyenne
    }

    // Plafonner à 30 points de risque maximum
    riskScore = Math.min(riskScore, 30);

    return {
      ...ctx,
      computed: {
        ...ctx.computed,
        // Contribuer au score de risque global
        riskContributions: [
          ...(ctx.computed?.riskContributions || []),
        { 
            moduleId: this.id,
            amount: riskScore,
            reason: `Incertitude sur le volume (confiance: ${volumeConfidence}, écart: ${volumeDiffPercentage.toFixed(1)}%)`,
            metadata: {
              volumeConfidence,
              volumeDiffPercentage: parseFloat(volumeDiffPercentage.toFixed(2)),
            baseVolume,
              adjustedVolume,
            }
          }
        ],
        // Préserver les autres champs
        costs: ctx.computed?.costs || [],
        adjustments: ctx.computed?.adjustments || [],
        legalImpacts: ctx.computed?.legalImpacts || [],
        insuranceNotes: ctx.computed?.insuranceNotes || [],
        requirements: ctx.computed?.requirements || [],
        crossSellProposals: ctx.computed?.crossSellProposals || [],
        operationalFlags: ctx.computed?.operationalFlags || [],
        activatedModules: [
          ...(ctx.computed?.activatedModules || []),
          this.id // String uniquement
        ],
        metadata: {
          ...(ctx.computed?.metadata || {}),
          volumeUncertaintyRisk: riskScore,
          volumeDiffPercentage: parseFloat(volumeDiffPercentage.toFixed(2)),
          }
        }
    };
  }
}