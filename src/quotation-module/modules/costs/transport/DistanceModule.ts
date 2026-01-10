import { QuoteContext, QuoteModule } from '../../types/quote-types';
import { MODULES_CONFIG } from '../../../config/modules.config';

/**
 * DistanceModule - Récupère la distance du formulaire
 *
 * SIMPLICITÉ TOTALE :
 * - La distance est calculée en temps réel par le formulaire (Google Maps Distance Matrix API)
 * - Elle arrive dans ctx.distance comme n'importe quel autre champ
 * - Ce module la lit et l'injecte dans computed.distanceKm
 * - Si la distance manque, c'est que l'API Google Maps est indisponible → distance par défaut sécuritaire
 */
export class DistanceModule implements QuoteModule {
  readonly id = 'distance-calculation';
  readonly description = 'Récupère la distance calculée par le formulaire';
  readonly priority = 30;

  apply(ctx: QuoteContext): QuoteContext {
    const distanceConfig = MODULES_CONFIG.distance;
    
    // Distance fournie par le formulaire (déjà calculée via Google Maps API)
    const providedDistance = ctx.distance;

    // Validation : distance doit être >= 0 et < MAX_DISTANCE_KM (max France métropolitaine)
    const isValidDistance =
      providedDistance !== undefined &&
      providedDistance !== null &&
      providedDistance >= 0 &&
      providedDistance < distanceConfig.MAX_DISTANCE_KM;

    // Si distance invalide ou manquante : fallback sécuritaire
    const finalDistance = isValidDistance ? providedDistance : distanceConfig.DEFAULT_DISTANCE_KM;
    const distanceSource = isValidDistance ? 'GOOGLE_MAPS_API' : 'DEFAULT_FALLBACK';
    const isLongDistance = finalDistance > distanceConfig.LONG_DISTANCE_THRESHOLD_KM;
    
    // Calcul du temps de trajet estimé
    const estimatedTravelTimeMinutes = Math.round(finalDistance * distanceConfig.TRAVEL_TIME_FACTOR);

    // Logs détaillés du traitement
    console.log(`   🔧 RÉCUPÉRATION DISTANCE:`);
    if (providedDistance !== undefined && providedDistance !== null) {
      console.log(`      Distance fournie: ${providedDistance} km (Google Maps API)`);
    } else {
      console.log(`      Distance fournie: N/A (non disponible)`);
    }
    
    if (isValidDistance) {
      console.log(`      Validation: ${providedDistance} km (0 ≤ distance < ${distanceConfig.MAX_DISTANCE_KM} km) ✅`);
      console.log(`      Distance validée: ${finalDistance} km`);
    } else {
      console.log(`      Validation: ❌ Distance invalide ou manquante`);
      console.log(`      Distance par défaut: ${finalDistance} km (fallback sécuritaire)`);
    }
    
    console.log(`      Source: ${distanceSource}`);
    console.log(`      Calcul temps de trajet: ${finalDistance} km × ${distanceConfig.TRAVEL_TIME_FACTOR} = ${estimatedTravelTimeMinutes} min`);
    console.log(`      Longue distance: ${isLongDistance ? 'Oui' : 'Non'} (${finalDistance} km ${isLongDistance ? '>' : '≤'} ${distanceConfig.LONG_DISTANCE_THRESHOLD_KM} km)`);

    return {
      ...ctx,
      computed: {
        ...ctx.computed,
        costs: ctx.computed?.costs || [],
        adjustments: ctx.computed?.adjustments || [],
        riskContributions: ctx.computed?.riskContributions || [],
        legalImpacts: ctx.computed?.legalImpacts || [],
        insuranceNotes: ctx.computed?.insuranceNotes || [],
        requirements: ctx.computed?.requirements || [],
        crossSellProposals: ctx.computed?.crossSellProposals || [],
        operationalFlags: ctx.computed?.operationalFlags || [],
        activatedModules: [
          ...(ctx.computed?.activatedModules || []),
          this.id
        ],
        metadata: {
          ...(ctx.computed?.metadata || {}),
          distanceSource, // Traçabilité : origine de la distance
          distanceProvided: providedDistance, // Distance brute du formulaire (pour debug)
          distanceValidated: finalDistance, // Distance validée utilisée
          maxDistanceThreshold: distanceConfig.MAX_DISTANCE_KM, // Seuil max utilisé
          longDistanceThreshold: distanceConfig.LONG_DISTANCE_THRESHOLD_KM, // Seuil longue distance utilisé
          travelTimeFactor: distanceConfig.TRAVEL_TIME_FACTOR, // Facteur temps de trajet utilisé
        },
        distanceKm: finalDistance,
        estimatedTravelTimeMinutes,
        isLongDistance
      }
    };
  }
}
