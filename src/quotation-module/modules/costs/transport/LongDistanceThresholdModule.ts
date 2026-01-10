import { QuoteContext, QuoteModule } from '../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';

/**
 * LongDistanceThresholdModule - Détecte si le déménagement est longue distance (>50 km)
 *
 * TYPE : B (conditionnel métier)
 * PRIORITÉ : 31 (PHASE 3 - Distance & Transport)
 * DÉPENDANCES : Nécessite que DistanceModule ait été exécuté (priority 30)
 *
 * RESPONSABILITÉS :
 * - Détecte si distance > 50 km (seuil longue distance)
 * - Active le flag isLongDistance dans computed
 * - Prépare le contexte pour les modules longue distance (péages, ajustements carburant)
 *
 * RECTIFICATIVE : Seuil longue distance = 50 km (au lieu de 200 km)
 */
export class LongDistanceThresholdModule implements QuoteModule {
  readonly id = 'long-distance-threshold';
  readonly description = 'Détecte si le déménagement est longue distance (>50 km)';
  readonly priority = 31; // Après DistanceModule (30)
  readonly dependencies = ['distance-calculation'];

  private static readonly LONG_DISTANCE_THRESHOLD_KM = 50; // Rectificative : 50 km

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();
    const distanceKm = computed.distanceKm;

    if (!distanceKm || distanceKm <= 0) {
      // Pas de distance valide, le module ne s'applique pas
      return ctx;
    }

    const isLongDistance = distanceKm > LongDistanceThresholdModule.LONG_DISTANCE_THRESHOLD_KM;

    return {
      ...ctx,
      computed: {
        ...computed,
        isLongDistance,
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        metadata: {
          ...computed.metadata,
          longDistanceThreshold: LongDistanceThresholdModule.LONG_DISTANCE_THRESHOLD_KM,
          longDistanceDetected: isLongDistance,
        },
        operationalFlags: isLongDistance
          ? [...computed.operationalFlags, 'LONG_DISTANCE']
          : computed.operationalFlags,
      }
    };
  }

  /**
   * Le module s'applique toujours (Type A)
   * La dépendance est vérifiée par le moteur via hasDependencies()
   * La vérification de distanceKm se fait dans apply()
   */
  // Pas de isApplicable() - Type A (inconditionnel)
}

