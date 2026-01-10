import { QuoteContext, QuoteModule } from '../types/quote-types';
import { createEmptyComputedContext } from '../../core/ComputedContext';
import { MODULES_CONFIG } from '../../config/modules.config';

/**
 * StorageRequirementModule - Recommande le stockage temporaire si nécessaire
 *
 * TYPE : B (conditionnel métier)
 * PRIORITÉ : 82 (PHASE 8 - Options & Cross-Selling)
 *
 * RESPONSABILITÉS :
 * - Détecte si le stockage temporaire est recommandé
 * - Ajoute un requirement et une proposition cross-selling
 *
 * LOGIQUE MÉTIER :
 * - Stockage recommandé si :
 *   - Délai entre départ et arrivée > 7 jours
 *   - Logement non disponible immédiatement
 *   - Besoin de stockage temporaire déclaré
 */
export class StorageRequirementModule implements QuoteModule {
  readonly id = 'storage-requirement';
  readonly description = 'Recommande le stockage temporaire si nécessaire';
  readonly priority = 84; // PHASE 8 - Options & Cross-Selling

  /**
   * Le module s'applique si stockage recommandé
   */
  isApplicable(ctx: QuoteContext): boolean {
    // Stockage recommandé si besoin déclaré OU durée de stockage spécifiée
    return ctx.temporaryStorage === true || (ctx.storageDurationDays !== undefined && ctx.storageDurationDays > 0);
  }

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();

    if (!this.isApplicable(ctx)) {
      return ctx;
    }

    const config = MODULES_CONFIG.crossSelling;
    const costPerM3PerMonth = config.STORAGE_COST_PER_M3_PER_MONTH;
    const defaultDurationDays = config.STORAGE_DEFAULT_DURATION_DAYS;
    const daysPerMonth = config.DAYS_PER_MONTH;

    const adjustedVolume = computed.adjustedVolume || ctx.estimatedVolume || 0;
    const storageDurationDays = ctx.storageDurationDays || defaultDurationDays;
    const storageDurationMonths = Math.ceil(storageDurationDays / daysPerMonth);

    const reasons: string[] = [];
    if (ctx.temporaryStorage === true) {
      reasons.push('besoin de stockage temporaire');
    }
    if (storageDurationDays > 0) {
      reasons.push(`durée ${storageDurationDays} jours`);
    }

    const estimatedCost = adjustedVolume * costPerM3PerMonth * storageDurationMonths;

    // Ajouter un requirement
    const requirements = [...computed.requirements];
    requirements.push({
      type: 'STORAGE_RECOMMENDED',
      severity: 'MEDIUM',
      reason: `Stockage temporaire recommandé : ${reasons.join(', ')}. ` +
              `Solution sécurisée pour vos biens en attendant la disponibilité du nouveau logement.`,
      moduleId: this.id,
      metadata: {
        reasons,
        volume: adjustedVolume,
        durationDays: storageDurationDays,
        durationMonths: storageDurationMonths,
        costPerM3PerMonth,
      }
    });

    // Ajouter une proposition cross-selling
    const crossSellProposals = [...computed.crossSellProposals];
    crossSellProposals.push({
      id: 'STORAGE_SERVICE',
      label: 'Stockage temporaire',
      reason: `Recommandé pour ${reasons.join(', ')}.`,
      benefit: 'Stockage sécurisé, assurance incluse, accès flexible à vos biens.',
      priceImpact: parseFloat(estimatedCost.toFixed(2)),
      optional: true,
      moduleId: this.id,
      basedOnRequirement: 'STORAGE_RECOMMENDED',
      metadata: {
        reasons,
        volume: adjustedVolume,
        durationDays: storageDurationDays,
        durationMonths: storageDurationMonths,
        costPerM3PerMonth,
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
          storageRecommended: true,
          storageReasons: reasons,
        }
      }
    };
  }
}

