import { QuoteContext, QuoteModule } from '../types/quote-types';
import { createEmptyComputedContext } from '../../core/ComputedContext';
import { MODULES_CONFIG } from '../../config/modules.config';

/**
 * ReassemblyCostModule - Calcule le coût du service de REMONTAGE de meubles
 *
 * TYPE : C (déclenché par demande client explicite)
 * PRIORITÉ : 86.6 (PHASE 8 - Options & Cross-Selling, juste après DismantlingCost)
 * DÉPENDANCES : Aucune (peut être demandé indépendamment du démontage)
 *
 * RESPONSABILITÉS :
 * - Ajoute le coût du service de remontage UNIQUEMENT
 * - Le démontage est géré par un module séparé (DismantlingCostModule)
 * - Activé si ctx.reassembly === true OU si le scénario force le remontage
 *
 * CAS D'USAGE :
 * - Client qui a acheté des meubles en kit à monter à l'arrivée
 * - Client qui a démonté lui-même mais veut un remontage pro
 * - Suite logique après un démontage professionnel
 */
export class ReassemblyCostModule implements QuoteModule {
  readonly id = 'reassembly-cost';
  readonly description = 'Calcule le coût du service de remontage de meubles';
  readonly priority = 86.6; // PHASE 8 - Options & Cross-Selling (juste après DismantlingCost)

  /**
   * Le module s'applique si le flag reassembly est true OU si bulkyFurniture est true.
   *
   * IMPORTANT : La logique de qui reçoit ce service est gérée en amont par MultiQuoteService :
   * - ECO : Service désactivé via disabledModules (ce module n'est jamais appelé)
   * - STANDARD/FLEX : Le flag est restauré depuis les sélections client si le client a choisi le service
   * - CONFORT/PREMIUM/SECURITY_PLUS/FLEX : Le flag est forcé à true via overrides (service inclus)
   *
   * Note : bulkyFurniture déclenche aussi le remontage car les meubles encombrants
   * nécessitent généralement un remontage après transport.
   */
  isApplicable(ctx: QuoteContext): boolean {
    return ctx.reassembly === true || ctx.bulkyFurniture === true;
  }

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();

    if (!this.isApplicable(ctx)) {
      return ctx;
    }

    const config = MODULES_CONFIG.crossSelling.REASSEMBLY;
    let reassemblyCost = config.BASE_COST;
    const breakdown: Array<{ item: string; cost: number }> = [];
    breakdown.push({ item: 'Coût de base remontage', cost: config.BASE_COST });

    // Ajouter coût pour meubles encombrants
    if (ctx.bulkyFurniture) {
      reassemblyCost += config.COST_PER_BULKY_FURNITURE;
      breakdown.push({ item: 'Meubles encombrants', cost: config.COST_PER_BULKY_FURNITURE });
    }

    // Ajouter coût selon nombre de pièces (plus de pièces = plus de meubles à remonter)
    let complexItemsCount = 0;
    if (ctx.rooms) {
      if (ctx.rooms >= 4) {
        complexItemsCount = 2; // 2 meubles complexes
      } else if (ctx.rooms >= 3) {
        complexItemsCount = 1; // 1 meuble complexe
      }
      if (complexItemsCount > 0) {
        const complexItemsCost = config.COST_PER_COMPLEX_ITEM * complexItemsCount;
        reassemblyCost += complexItemsCost;
        breakdown.push({ item: `Meubles complexes (${complexItemsCount})`, cost: complexItemsCost });
      }
    }

    // Ajouter coût pour piano (remontage spécialisé)
    if (ctx.piano) {
      reassemblyCost += config.PIANO_COST;
      breakdown.push({ item: 'Remontage piano', cost: config.PIANO_COST });
    }

    // Logs détaillés du calcul
    console.log(`   💰 CALCUL COÛT REMONTAGE MEUBLES:`);
    console.log(`      Coût de base: ${config.BASE_COST}€`);
    if (ctx.bulkyFurniture) {
      console.log(`      Meubles encombrants: +${config.COST_PER_BULKY_FURNITURE}€`);
    }
    if (complexItemsCount > 0) {
      console.log(`      Meubles complexes (${complexItemsCount}): ${complexItemsCount} × ${config.COST_PER_COMPLEX_ITEM}€ = ${(complexItemsCount * config.COST_PER_COMPLEX_ITEM).toFixed(2)}€`);
    }
    if (ctx.piano) {
      console.log(`      Remontage piano: +${config.PIANO_COST}€`);
    }
    console.log(`      Calcul: ${breakdown.map(item => `${item.cost}€`).join(' + ')} = ${reassemblyCost.toFixed(2)}€`);
    console.log(`      = Coût total remontage: ${reassemblyCost.toFixed(2)}€`);

    return {
      ...ctx,
      computed: {
        ...computed,
        costs: [
          ...computed.costs,
          {
            moduleId: this.id,
            category: 'SERVICE', // Service optionnel client
            label: 'Service de remontage de meubles',
            amount: parseFloat(reassemblyCost.toFixed(2)),
            metadata: {
              baseCost: config.BASE_COST,
              bulkyFurniture: ctx.bulkyFurniture || false,
              piano: ctx.piano || false,
              rooms: ctx.rooms || 0,
              complexItemsCount,
              breakdown,
              serviceType: 'REASSEMBLY_ONLY', // Indique que c'est le remontage seul
            }
          }
        ],
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        metadata: {
          ...computed.metadata,
          reassemblyCost: parseFloat(reassemblyCost.toFixed(2)),
        }
      }
    };
  }
}
