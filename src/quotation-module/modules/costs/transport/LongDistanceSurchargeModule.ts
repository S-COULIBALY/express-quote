import { QuoteContext, QuoteModule } from '../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';
import { MODULES_CONFIG } from '../../../config/modules.config';

/**
 * LongDistanceSurchargeModule - Forfait kilométrique longue distance (>50 km)
 *
 * TYPE : B (conditionnel métier)
 * PRIORITÉ : 34 (PHASE 3 - Distance & Transport)
 * DÉPENDANCES : Nécessite LongDistanceThresholdModule (priority 31)
 *
 * ⚠️ IMPORTANT : Ce module n'est PAS un coût carburant supplémentaire !
 * Le carburant est déjà calculé par FuelCostModule (priority 33) pour la distance totale.
 *
 * RESPONSABILITÉS :
 * Ce forfait couvre les coûts d'exploitation longue distance :
 * - Usure accélérée du véhicule (pneus, freins, mécanique)
 * - Indisponibilité prolongée du véhicule pour d'autres missions
 * - Frais annexes (pauses conducteur, péages secondaires, etc.)
 * - Risque accru sur long trajet
 *
 * TARIFICATION PROGRESSIVE :
 * - 0-200 km excédentaire : 0.15€/km
 * - 200-1000 km excédentaire : 0.20€/km
 * - Au-delà de 1000 km : plafond à 1000 km
 */
export class LongDistanceSurchargeModule implements QuoteModule {
  readonly id = 'long-distance-surcharge';
  readonly description = 'Forfait exploitation longue distance (usure, indisponibilité, frais annexes)';
  readonly priority = 34; // Après LongDistanceThresholdModule (31)
  readonly dependencies = ['long-distance-threshold'];

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();
    const distanceKm = computed.distanceKm;
    const isLongDistance = computed.isLongDistance;
    const threshold = MODULES_CONFIG.distance.LONG_DISTANCE_THRESHOLD_KM;
    const maxExcessDistance = MODULES_CONFIG.fuel.LONG_DISTANCE_SURCHARGE.MAX_EXCESS_DISTANCE_KM;
    const progressiveRates = MODULES_CONFIG.fuel.LONG_DISTANCE_SURCHARGE.PROGRESSIVE_RATES;

    if (!distanceKm || !isLongDistance || distanceKm <= threshold) {
      // Pas de longue distance, le module ne s'applique pas
      return ctx;
    }

    // Calcul de la distance excédentaire (avec plafond)
    const rawExcessDistance = distanceKm - threshold;
    const excessDistance = Math.min(rawExcessDistance, maxExcessDistance);
    const wasCapped = rawExcessDistance > maxExcessDistance;

    // Calcul avec tarification progressive
    const calculation = this.calculateProgressiveCost(excessDistance, progressiveRates);

    // Log des calculs
    console.log(`   💰 CALCUL FORFAIT LONGUE DISTANCE:`);
    console.log(`      Distance totale: ${distanceKm} km`);
    console.log(`      Seuil longue distance: ${threshold} km`);
    console.log(`      Distance excédentaire brute: ${rawExcessDistance.toFixed(2)} km`);
    if (wasCapped) {
      console.log(`      ⚠️ Plafond appliqué: ${rawExcessDistance.toFixed(2)} km → ${excessDistance} km (max: ${maxExcessDistance} km)`);
    }
    console.log(`      Distance excédentaire retenue: ${excessDistance.toFixed(2)} km`);
    console.log(`      Tarification progressive:`);
    calculation.breakdown.forEach((tranche, index) => {
      console.log(`         Tranche ${index + 1}: ${tranche.km} km × ${tranche.rate}€/km = ${tranche.cost.toFixed(2)}€`);
    });
    console.log(`      = Total forfait: ${calculation.totalCost.toFixed(2)}€`);

    return {
      ...ctx,
      computed: {
        ...computed,
        costs: [
          ...computed.costs,
          {
            moduleId: this.id,
            category: 'SURCHARGE',
            label: 'Forfait kilométrique longue distance',
            amount: parseFloat(calculation.totalCost.toFixed(2)),
            metadata: {
              distanceKm,
              threshold,
              rawExcessDistance: parseFloat(rawExcessDistance.toFixed(2)),
              excessDistance: parseFloat(excessDistance.toFixed(2)),
              wasCapped,
              maxExcessDistance,
              breakdown: calculation.breakdown.map(t => ({
                km: t.km,
                rate: t.rate,
                cost: parseFloat(t.cost.toFixed(2)),
              })),
              // Explication pour le client
              explanation: 'Couvre usure véhicule, indisponibilité prolongée et frais annexes longue distance',
            }
          }
        ],
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        metadata: {
          ...computed.metadata,
          longDistanceSurchargeApplied: true,
          excessDistanceKm: parseFloat(excessDistance.toFixed(2)),
          longDistanceSurchargeCapped: wasCapped,
        }
      }
    };
  }

  /**
   * Calcule le coût avec tarification progressive
   * @param excessDistance Distance excédentaire (déjà plafonnée)
   * @param rates Tableau des tranches tarifaires (readonly depuis config)
   * @returns Détail du calcul avec breakdown par tranche
   */
  private calculateProgressiveCost(
    excessDistance: number,
    rates: ReadonlyArray<{ readonly maxKm: number; readonly costPerKm: number }>
  ): {
    totalCost: number;
    breakdown: Array<{ km: number; rate: number; cost: number }>;
  } {
    let remainingKm = excessDistance;
    let totalCost = 0;
    const breakdown: Array<{ km: number; rate: number; cost: number }> = [];
    let previousMaxKm = 0;

    for (const rate of rates) {
      if (remainingKm <= 0) break;

      // Calculer la distance dans cette tranche
      const kmInTranche = Math.min(remainingKm, rate.maxKm - previousMaxKm);

      if (kmInTranche > 0) {
        const costInTranche = kmInTranche * rate.costPerKm;
        totalCost += costInTranche;

        breakdown.push({
          km: parseFloat(kmInTranche.toFixed(2)),
          rate: rate.costPerKm,
          cost: parseFloat(costInTranche.toFixed(2)),
        });

        remainingKm -= kmInTranche;
      }

      previousMaxKm = rate.maxKm;
    }

    return {
      totalCost: parseFloat(totalCost.toFixed(2)),
      breakdown,
    };
  }

  /**
   * Le module s'applique toujours (Type A)
   * La dépendance est vérifiée par le moteur via hasDependencies()
   * La vérification de longue distance se fait dans apply()
   */
  // Pas de isApplicable() - Type A (inconditionnel)
}
