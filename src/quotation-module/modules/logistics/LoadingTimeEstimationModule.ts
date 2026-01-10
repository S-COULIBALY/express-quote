import { QuoteContext, QuoteModule } from '../types/quote-types';
import { createEmptyComputedContext } from '../../core/ComputedContext';

/**
 * LoadingTimeEstimationModule - Estime le temps de chargement/déchargement
 *
 * TYPE : A (systématique)
 * PRIORITÉ : 68 (PHASE 6 - Main d'œuvre, après WorkersCalculationModule)
 * DÉPENDANCES : Nécessite VolumeEstimationModule et WorkersCalculationModule
 *
 * RESPONSABILITÉS :
 * - Estime le temps de chargement au départ
 * - Estime le temps de déchargement à l'arrivée
 * - Calcule le temps total de manutention
 * - Utilisé pour la planification et le calcul des coûts
 *
 * LOGIQUE MÉTIER :
 * - Temps de chargement = f(volume, nombre de déménageurs, contraintes d'accès)
 * - Base : ~15 min/m³ par déménageur
 * - Ajustements selon contraintes (escaliers, portage, etc.)
 *
 * NOTE : Déplacé en PHASE 6 (priorité 68) car dépend de workers-calculation (priorité 61)
 */
export class LoadingTimeEstimationModule implements QuoteModule {
  readonly id = 'loading-time-estimation';
  readonly description = 'Estime le temps de chargement et déchargement';
  readonly priority = 68; // PHASE 6 - Main d'œuvre (après workers-calculation:61)
  readonly dependencies = ['volume-estimation', 'workers-calculation'];

  private static readonly BASE_MINUTES_PER_M3_PER_WORKER = 15; // Minutes par m³ par déménageur
  private static readonly FLOOR_PENALTY_MINUTES = 5; // Minutes supplémentaires par étage sans ascenseur
  private static readonly CARRY_DISTANCE_PENALTY_PER_METER = 0.5; // Minutes par mètre de portage

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();

    const adjustedVolume = computed.adjustedVolume || 0;
    const workersCount = computed.workersCount || 2;

    if (adjustedVolume <= 0 || workersCount <= 0) {
      // Pas de volume ou déménageurs, estimation impossible
      return ctx;
    }

    // Temps de base de chargement (départ)
    const baseLoadingTimeMinutes = (adjustedVolume / workersCount) * LoadingTimeEstimationModule.BASE_MINUTES_PER_M3_PER_WORKER;

    // Ajustements pour contraintes d'accès au départ
    let pickupPenaltyMinutes = 0;
    if (ctx.pickupFloor && ctx.pickupFloor > 0 && !ctx.pickupHasElevator) {
      pickupPenaltyMinutes += ctx.pickupFloor * LoadingTimeEstimationModule.FLOOR_PENALTY_MINUTES;
    }
    if (ctx.pickupCarryDistance && ctx.pickupCarryDistance > 0) {
      pickupPenaltyMinutes += ctx.pickupCarryDistance * LoadingTimeEstimationModule.CARRY_DISTANCE_PENALTY_PER_METER;
    }

    const loadingTimeMinutes = Math.ceil(baseLoadingTimeMinutes + pickupPenaltyMinutes);

    // Temps de déchargement (arrivée) - généralement similaire au chargement
    let deliveryPenaltyMinutes = 0;
    if (ctx.deliveryFloor && ctx.deliveryFloor > 0 && !ctx.deliveryHasElevator) {
      deliveryPenaltyMinutes += ctx.deliveryFloor * LoadingTimeEstimationModule.FLOOR_PENALTY_MINUTES;
    }
    if (ctx.deliveryCarryDistance && ctx.deliveryCarryDistance > 0) {
      deliveryPenaltyMinutes += ctx.deliveryCarryDistance * LoadingTimeEstimationModule.CARRY_DISTANCE_PENALTY_PER_METER;
    }

    const unloadingTimeMinutes = Math.ceil(baseLoadingTimeMinutes + deliveryPenaltyMinutes);

    // Temps total de manutention
    const totalHandlingTimeMinutes = loadingTimeMinutes + unloadingTimeMinutes;

    return {
      ...ctx,
      computed: {
        ...computed,
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        metadata: {
          ...computed.metadata,
          loadingTimeMinutes,
          unloadingTimeMinutes,
          totalHandlingTimeMinutes,
          baseLoadingTimeMinutes: Math.ceil(baseLoadingTimeMinutes),
          pickupPenaltyMinutes: Math.ceil(pickupPenaltyMinutes),
          deliveryPenaltyMinutes: Math.ceil(deliveryPenaltyMinutes),
        }
      }
    };
  }
}

