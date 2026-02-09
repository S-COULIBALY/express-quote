import { QuoteContext, QuoteModule } from '../types/quote-types';
import { createEmptyComputedContext } from '../../core/ComputedContext';
import { MODULES_CONFIG } from '../../config/modules.config';

/**
 * DismantlingCostModule - Calcule le coût du service de DÉMONTAGE de meubles (sans remontage)
 *
 * TYPE : C (déclenché par demande client explicite)
 * PRIORITÉ : 86.5 (PHASE 8 - Options & Cross-Selling)
 * DÉPENDANCES : Aucune
 *
 * RESPONSABILITÉS :
 * - Ajoute le coût du service de démontage UNIQUEMENT
 * - Le remontage est géré par un module séparé (ReassemblyCostModule)
 * - Activé si ctx.dismantling === true OU si le scénario force le démontage
 *
 * CAS D'USAGE :
 * - Client qui déménage vers un garde-meuble (pas besoin de remontage)
 * - Client qui veut remonter lui-même ses meubles
 * - Déménagement avec aide famille à l'arrivée
 */
export class DismantlingCostModule implements QuoteModule {
  readonly id = 'dismantling-cost';
  readonly description = 'Calcule le coût du service de démontage de meubles (sans remontage)';
  readonly priority = 86.5; // PHASE 8 - Options & Cross-Selling (après CleaningEndCost)

  /**
   * Le module s'applique si le flag dismantling est true OU si bulkyFurniture est true.
   *
   * IMPORTANT : La logique de qui reçoit ce service est gérée en amont par MultiQuoteService :
   * - ECO : Service désactivé via disabledModules (ce module n'est jamais appelé)
   * - STANDARD/FLEX : Le flag est restauré depuis les sélections client si le client a choisi le service
   * - CONFORT/PREMIUM/SECURITY_PLUS/FLEX : Le flag est forcé à true via overrides (service inclus)
   *
   * Note : bulkyFurniture déclenche aussi le démontage car les meubles encombrants
   * nécessitent généralement un démontage pour être transportés.
   */
  isApplicable(ctx: QuoteContext): boolean {
    return ctx.dismantling === true || ctx.bulkyFurniture === true;
  }

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();

    if (!this.isApplicable(ctx)) {
      return ctx;
    }

    const config = MODULES_CONFIG.crossSelling.DISMANTLING;
    let dismantlingCost = config.BASE_COST;
    const breakdown: Array<{ item: string; cost: number }> = [];
    breakdown.push({ item: 'Coût de base démontage', cost: config.BASE_COST });

    // Ajouter coût pour meubles encombrants
    if (ctx.bulkyFurniture) {
      dismantlingCost += config.COST_PER_BULKY_FURNITURE;
      breakdown.push({ item: 'Meubles encombrants', cost: config.COST_PER_BULKY_FURNITURE });
    }

    // Ajouter coût pour piano (démontage spécialisé)
    if (ctx.piano) {
      dismantlingCost += config.PIANO_COST;
      breakdown.push({ item: 'Démontage piano', cost: config.PIANO_COST });
    }

    // Logs détaillés du calcul
    console.log(`   💰 CALCUL COÛT DÉMONTAGE MEUBLES (sans remontage):`);
    console.log(`      Coût de base: ${config.BASE_COST}€`);
    if (ctx.bulkyFurniture) {
      console.log(`      Meubles encombrants: +${config.COST_PER_BULKY_FURNITURE}€`);
    }
    if (ctx.piano) {
      console.log(`      Démontage piano: +${config.PIANO_COST}€`);
    }
    console.log(`      Calcul: ${breakdown.map(item => `${item.cost}€`).join(' + ')} = ${dismantlingCost.toFixed(2)}€`);
    console.log(`      = Coût total démontage: ${dismantlingCost.toFixed(2)}€`);

    return {
      ...ctx,
      computed: {
        ...computed,
        costs: [
          ...computed.costs,
          {
            moduleId: this.id,
            category: 'SERVICE', // Service optionnel client
            label: 'Service de démontage de meubles',
            amount: parseFloat(dismantlingCost.toFixed(2)),
            metadata: {
              baseCost: config.BASE_COST,
              bulkyFurniture: ctx.bulkyFurniture || false,
              piano: ctx.piano || false,
              breakdown,
              serviceType: 'DISMANTLING_ONLY', // Indique que c'est le démontage seul
            }
          }
        ],
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        metadata: {
          ...computed.metadata,
          dismantlingCost: parseFloat(dismantlingCost.toFixed(2)),
          dismantlingOnly: true, // Flag pour indiquer démontage sans remontage
        }
      }
    };
  }
}
