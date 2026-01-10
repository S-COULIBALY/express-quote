import { QuoteContext, QuoteModule } from '../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';
import { MODULES_CONFIG } from '../../../config/modules.config';

/**
 * TollCostModule - Calcule le coût des péages pour longue distance (>50 km)
 *
 * TYPE : B (conditionnel métier)
 * PRIORITÉ : 35 (PHASE 3 - Distance & Transport)
 * DÉPENDANCES : Nécessite LongDistanceThresholdModule (priority 31)
 *
 * RESPONSABILITÉS :
 * - Calcule le coût des péages pour les trajets longue distance
 * - Estimation basée sur la distance (coût moyen péages France)
 * - Obligatoire pour déménagements IDF → Province
 *
 * RECTIFICATIVE : Seuil longue distance = 50 km
 */
export class TollCostModule implements QuoteModule {
  readonly id = 'toll-cost';
  readonly description = 'Calcule le coût des péages pour longue distance (>50 km)';
  readonly priority = 35; // Après LongDistanceThresholdModule (31)
  readonly dependencies = ['long-distance-threshold'];

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();
    const distanceKm = computed.distanceKm;
    const isLongDistance = computed.isLongDistance;

    const distanceConfig = MODULES_CONFIG.distance;
    const tollsConfig = MODULES_CONFIG.tolls;
    const threshold = distanceConfig.LONG_DISTANCE_THRESHOLD_KM;
    const highwayPercentage = tollsConfig.HIGHWAY_PERCENTAGE;
    const tollCostPerKm = tollsConfig.COST_PER_KM;

    if (!distanceKm || !isLongDistance || distanceKm <= threshold) {
      // Pas de longue distance, le module ne s'applique pas
      return ctx;
    }

    // Calcul du coût péages (estimation basée sur distance)
    // Pour un utilitaire, on estime qu'un pourcentage du trajet se fait sur autoroute
    const estimatedHighwayDistance = distanceKm * highwayPercentage;
    const tollCost = estimatedHighwayDistance * tollCostPerKm;

    // Logs détaillés du calcul
    console.log(`   💰 CALCUL COÛT PÉAGES:`);
    console.log(`      Distance totale: ${distanceKm.toFixed(2)} km`);
    console.log(`      Seuil longue distance: ${threshold} km`);
    console.log(`      Pourcentage autoroute: ${(highwayPercentage * 100).toFixed(0)}%`);
    console.log(`      Distance autoroute estimée: ${distanceKm.toFixed(2)} km × ${(highwayPercentage * 100).toFixed(0)}% = ${estimatedHighwayDistance.toFixed(2)} km`);
    console.log(`      Coût péage: ${tollCostPerKm}€/km`);
    console.log(`      Calcul: ${estimatedHighwayDistance.toFixed(2)} km × ${tollCostPerKm}€/km = ${tollCost.toFixed(2)}€`);
    console.log(`      = Coût total: ${tollCost.toFixed(2)}€`);

    return {
      ...ctx,
      computed: {
        ...computed,
        costs: [
          ...computed.costs,
          {
            moduleId: this.id,
            category: 'TRANSPORT',
            label: 'Péages (longue distance)',
            amount: parseFloat(tollCost.toFixed(2)),
            metadata: {
              distanceKm: parseFloat(distanceKm.toFixed(2)),
              estimatedHighwayDistance: parseFloat(estimatedHighwayDistance.toFixed(2)),
              tollCostPerKm,
              highwayPercentage: parseFloat((highwayPercentage * 100).toFixed(0)),
            }
          }
        ],
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        metadata: {
          ...computed.metadata,
          tollCostApplied: true,
          estimatedHighwayDistanceKm: parseFloat(estimatedHighwayDistance.toFixed(2)),
        }
      }
    };
  }

  /**
   * Le module s'applique toujours (Type A)
   * La dépendance est vérifiée par le moteur via hasDependencies()
   * La vérification de longue distance se fait dans apply()
   */
  // Pas de isApplicable() - Type A (inconditionnel)
}

