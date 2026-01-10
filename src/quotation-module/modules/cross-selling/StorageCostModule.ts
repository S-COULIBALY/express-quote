import { QuoteContext, QuoteModule } from '../types/quote-types';
import { createEmptyComputedContext } from '../../core/ComputedContext';
import { MODULES_CONFIG } from '../../config/modules.config';

/**
 * StorageCostModule - Calcule le coût du stockage temporaire si accepté
 *
 * TYPE : C (déclenché par état calculé)
 * PRIORITÉ : 85 (PHASE 8 - Options & Cross-Selling)
 * DÉPENDANCES : storage-requirement
 *
 * RESPONSABILITÉS :
 * - Ajoute le coût du stockage si le client l'a accepté
 * - Basé sur le requirement STORAGE_RECOMMENDED
 */
export class StorageCostModule implements QuoteModule {
  readonly id = 'storage-cost';
  readonly description = 'Calcule le coût du stockage temporaire si accepté';
  readonly priority = 87; // PHASE 8 - Options & Cross-Selling
  readonly dependencies = ['storage-requirement'];

  /**
   * Le module s'applique si stockage recommandé ET accepté par le client
   */
  isApplicable(ctx: QuoteContext): boolean {
    const computed = ctx.computed;
    if (!computed) {
      return false;
    }

    const hasRecommendation = computed.requirements.some(
      req => req.type === 'STORAGE_RECOMMENDED' && req.moduleId === 'storage-requirement'
    );
    const isAccepted = ctx.temporaryStorage === true;

    return hasRecommendation && isAccepted;
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
    const storageCost = adjustedVolume * costPerM3PerMonth * storageDurationMonths;

    // Logs détaillés du calcul
    console.log(`   💰 CALCUL COÛT STOCKAGE TEMPORAIRE:`);
    console.log(`      Volume ajusté: ${adjustedVolume.toFixed(2)} m³`);
    console.log(`      Durée: ${storageDurationDays} jours`);
    console.log(`      Durée en mois: ${storageDurationMonths} mois (arrondi au supérieur, ${daysPerMonth} jours/mois)`);
    console.log(`      Coût par m³ par mois: ${costPerM3PerMonth}€`);
    console.log(`      Calcul: ${adjustedVolume.toFixed(2)} m³ × ${costPerM3PerMonth}€ × ${storageDurationMonths} mois = ${storageCost.toFixed(2)}€`);
    console.log(`      = Coût total: ${storageCost.toFixed(2)}€`);

    return {
      ...ctx,
      computed: {
        ...computed,
        costs: [
          ...computed.costs,
          {
            moduleId: this.id,
            category: 'SERVICE', // Service optionnel client
            label: `Stockage temporaire (${storageDurationDays} jours)`,
            amount: parseFloat(storageCost.toFixed(2)),
            metadata: {
              volume: parseFloat(adjustedVolume.toFixed(2)),
              durationDays: storageDurationDays,
              durationMonths: storageDurationMonths,
              costPerM3PerMonth,
              daysPerMonth,
            }
          }
        ],
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        metadata: {
          ...computed.metadata,
          storageAccepted: true,
          storageCost: parseFloat(storageCost.toFixed(2)),
        }
      }
    };
  }
}

