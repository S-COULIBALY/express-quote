import { QuoteContext, QuoteModule } from '../types/quote-types';
import { createEmptyComputedContext } from '../../core/ComputedContext';
import { MODULES_CONFIG } from '../../config/modules.config';

/**
 * CleaningEndCostModule - Calcule le coût du nettoyage de fin de chantier si accepté
 *
 * TYPE : C (déclenché par état calculé) ou A (demande explicite cross-selling)
 * PRIORITÉ : 86 (PHASE 8 - Options & Cross-Selling)
 * DÉPENDANCES : aucune (peut être activé directement via cross-selling)
 *
 * RESPONSABILITÉS :
 * - Ajoute le coût du nettoyage si :
 *   1. Le client a sélectionné le service dans le catalogue cross-selling
 *   2. OU le service est recommandé ET accepté par le client
 */
export class CleaningEndCostModule implements QuoteModule {
  readonly id = 'cleaning-end-cost';
  readonly description = 'Calcule le coût du nettoyage de fin de chantier si accepté';
  readonly priority = 86; // PHASE 8 - Options & Cross-Selling
  readonly dependencies: string[] = []; // Pas de dépendance stricte

  /**
   * Le module s'applique si le flag cleaningEnd est true dans le contexte.
   *
   * IMPORTANT : La logique de qui reçoit ce service est gérée en amont par MultiQuoteService :
   * - ECO : Service désactivé via disabledModules (ce module n'est jamais appelé)
   * - STANDARD/FLEX : Le flag est restauré depuis les sélections client si le client a choisi le service
   * - PREMIUM/SECURITY_PLUS : Le flag est forcé à true via overrides (service inclus dans la formule)
   * - CONFORT : N'inclut PAS le nettoyage (uniquement emballage + démontage/remontage)
   *
   * Donc ici, on vérifie simplement si cleaningEnd === true.
   */
  isApplicable(ctx: QuoteContext): boolean {
    return ctx.cleaningEnd === true;
  }

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();

    if (!this.isApplicable(ctx)) {
      return ctx;
    }

    const costPerM2 = MODULES_CONFIG.crossSelling.CLEANING_COST_PER_M2;
    // Surface déduite du volume (m³ → m², hauteur sous plafond ~2.5 m)
    const surface = (ctx.estimatedVolume != null && ctx.estimatedVolume > 0)
      ? Math.round(ctx.estimatedVolume / 2.5)
      : 0;
    const cleaningCost = surface * costPerM2;

    // Logs détaillés du calcul
    console.log(`   💰 CALCUL COÛT NETTOYAGE FIN DE CHANTIER:`);
    console.log(`      Surface: ${surface.toFixed(2)} m²`);
    console.log(`      Coût par m²: ${costPerM2}€`);
    console.log(`      Calcul: ${surface.toFixed(2)} m² × ${costPerM2}€ = ${cleaningCost.toFixed(2)}€`);
    console.log(`      = Coût total: ${cleaningCost.toFixed(2)}€`);

    return {
      ...ctx,
      computed: {
        ...computed,
        costs: [
          ...computed.costs,
          {
            moduleId: this.id,
            category: 'SERVICE', // Service optionnel client
            label: 'Nettoyage de fin de chantier',
            amount: parseFloat(cleaningCost.toFixed(2)),
            metadata: {
              surface: parseFloat(surface.toFixed(2)),
              surfaceUsed: parseFloat(surface.toFixed(2)),
              costPerM2,
            }
          }
        ],
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        metadata: {
          ...computed.metadata,
          cleaningEndAccepted: true,
          cleaningEndCost: parseFloat(cleaningCost.toFixed(2)),
        }
      }
    };
  }
}

