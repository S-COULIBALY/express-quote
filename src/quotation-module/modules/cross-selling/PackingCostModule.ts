import { QuoteContext, QuoteModule } from '../types/quote-types';
import { createEmptyComputedContext } from '../../core/ComputedContext';
import { MODULES_CONFIG } from '../../config/modules.config';

/**
 * PackingCostModule - Calcule le coût du service d'emballage si accepté
 *
 * TYPE : C (déclenché par état calculé) ou A (demande explicite cross-selling)
 * PRIORITÉ : 85 (PHASE 8 - Options & Cross-Selling)
 * DÉPENDANCES : aucune (peut être activé directement via cross-selling)
 *
 * RESPONSABILITÉS :
 * - Ajoute le coût du service d'emballage si :
 *   1. Le client a sélectionné le service dans le catalogue cross-selling
 *   2. OU le service est recommandé ET accepté par le client
 */
export class PackingCostModule implements QuoteModule {
  readonly id = 'packing-cost';
  readonly description = 'Calcule le coût du service d\'emballage si accepté';
  readonly priority = 85; // PHASE 8 - Options & Cross-Selling
  readonly dependencies: string[] = []; // Pas de dépendance stricte

  /**
   * Le module s'applique si le flag packing est true dans le contexte.
   *
   * IMPORTANT : La logique de qui reçoit ce service est gérée en amont par MultiQuoteService :
   * - ECO : Service désactivé via disabledModules (ce module n'est jamais appelé)
   * - STANDARD/FLEX : Le flag est restauré depuis les sélections client si le client a choisi le service
   * - CONFORT/PREMIUM/SECURITY_PLUS : Le flag est forcé à true via overrides (service inclus dans la formule)
   *
   * Donc ici, on vérifie simplement si packing === true.
   */
  isApplicable(ctx: QuoteContext): boolean {
    return ctx.packing === true;
  }

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();

    if (!this.isApplicable(ctx)) {
      return ctx;
    }

    const costPerM3 = MODULES_CONFIG.crossSelling.PACKING_COST_PER_M3;
    const adjustedVolume = computed.adjustedVolume || ctx.estimatedVolume || 0;
    const packingCost = adjustedVolume * costPerM3;

    // Logs détaillés du calcul
    console.log(`   💰 CALCUL COÛT EMBALLAGE PROFESSIONNEL:`);
    console.log(`      Volume ajusté: ${adjustedVolume.toFixed(2)} m³`);
    console.log(`      Coût par m³: ${costPerM3}€`);
    console.log(`      Calcul: ${adjustedVolume.toFixed(2)} m³ × ${costPerM3}€ = ${packingCost.toFixed(2)}€`);
    console.log(`      = Coût total: ${packingCost.toFixed(2)}€`);

    return {
      ...ctx,
      computed: {
        ...computed,
        costs: [
          ...computed.costs,
          {
            moduleId: this.id,
            category: 'SERVICE', // Service optionnel client
            label: 'Service d\'emballage professionnel',
            amount: parseFloat(packingCost.toFixed(2)),
            metadata: {
              volume: parseFloat(adjustedVolume.toFixed(2)),
              volumeUsed: parseFloat(adjustedVolume.toFixed(2)),
              costPerM3,
            }
          }
        ],
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        metadata: {
          ...computed.metadata,
          packingAccepted: true,
          packingCost: parseFloat(packingCost.toFixed(2)),
        }
      }
    };
  }
}

