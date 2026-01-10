import { QuoteContext, QuoteModule } from '../types/quote-types';
import { createEmptyComputedContext } from '../../core/ComputedContext';
import { MODULES_CONFIG } from '../../config/modules.config';

/**
 * PackingRequirementModule - Recommande le service d'emballage si nécessaire
 *
 * TYPE : B (conditionnel métier)
 * PRIORITÉ : 80 (PHASE 8 - Options & Cross-Selling)
 *
 * RESPONSABILITÉS :
 * - Détecte si l'emballage professionnel est recommandé
 * - Ajoute un requirement et une proposition cross-selling
 *
 * LOGIQUE MÉTIER :
 * - Emballage recommandé si :
 *   - Volume élevé (>40 m³)
 *   - Biens fragiles (artwork, piano)
 *   - Longue distance (risque de casse)
 */
export class PackingRequirementModule implements QuoteModule {
  readonly id = 'packing-requirement';
  readonly description = 'Recommande le service d\'emballage si nécessaire';
  readonly priority = 82; // PHASE 8 - Options & Cross-Selling

  /**
   * Le module s'applique si emballage recommandé
   */
  isApplicable(ctx: QuoteContext): boolean {
    const computed = ctx.computed;
    const adjustedVolume = computed?.adjustedVolume || ctx.estimatedVolume || 0;
    const volumeThreshold = MODULES_CONFIG.crossSelling.PACKING_VOLUME_THRESHOLD;
    
    const hasHighVolume = adjustedVolume > volumeThreshold;
    const hasFragileItems = ctx.artwork === true || ctx.piano === true;
    const isLongDistance = computed?.isLongDistance === true;

    return hasHighVolume || hasFragileItems || isLongDistance;
  }

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();

    if (!this.isApplicable(ctx)) {
      return ctx;
    }

    const volumeThreshold = MODULES_CONFIG.crossSelling.PACKING_VOLUME_THRESHOLD;
    const costPerM3 = MODULES_CONFIG.crossSelling.PACKING_COST_PER_M3;
    const adjustedVolume = computed.adjustedVolume || ctx.estimatedVolume || 0;
    const reasons: string[] = [];
    
    if (adjustedVolume > volumeThreshold) {
      reasons.push(`volume élevé (${adjustedVolume.toFixed(1)} m³)`);
    }
    if (ctx.artwork === true) {
      reasons.push('œuvres d\'art');
    }
    if (ctx.piano === true) {
      reasons.push('piano');
    }
    if (computed.isLongDistance === true) {
      reasons.push('longue distance');
    }

    const estimatedCost = adjustedVolume * costPerM3;

    // Ajouter un requirement
    const requirements = [...computed.requirements];
    requirements.push({
      type: 'PACKING_RECOMMENDED',
      severity: 'MEDIUM',
      reason: `Emballage professionnel recommandé : ${reasons.join(', ')}. ` +
              `Protection optimale de vos biens pendant le transport.`,
      moduleId: this.id,
      metadata: {
        reasons,
        volume: adjustedVolume,
      }
    });

    // Ajouter une proposition cross-selling
    const crossSellProposals = [...computed.crossSellProposals];
    crossSellProposals.push({
      id: 'PACKING_SERVICE',
      label: 'Service d\'emballage professionnel',
      reason: `Recommandé pour ${reasons.join(', ')}.`,
      benefit: 'Protection maximale de vos biens, matériel professionnel, assurance complémentaire incluse.',
      priceImpact: parseFloat(estimatedCost.toFixed(2)),
      optional: true,
      moduleId: this.id,
      basedOnRequirement: 'PACKING_RECOMMENDED',
      metadata: {
        reasons,
        volume: adjustedVolume,
        costPerM3,
      }
    });

    return {
      ...ctx,
      computed: {
        ...computed,
        requirements,
        crossSellProposals,
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        metadata: {
          ...computed.metadata,
          packingRecommended: true,
          packingReasons: reasons,
        }
      }
    };
  }
}

