import { QuoteContext, QuoteModule } from '../types/quote-types';
import { createEmptyComputedContext } from '../../core/ComputedContext';
import { MODULES_CONFIG } from '../../config/modules.config';

/**
 * NavetteRequiredModule - Détecte si une navette est nécessaire (IDF)
 *
 * TYPE : B (conditionnel métier)
 * PRIORITÉ : 45 (PHASE 4 - Accès & Contraintes Bâtiment)
 *
 * RESPONSABILITÉS :
 * - Détecte si une navette est nécessaire pour les déménagements IDF
 * - Cas typiques : rue étroite, zone piétonne, stationnement impossible
 * - Ajoute un coût de navette et un requirement
 *
 * LOGIQUE MÉTIER :
 * - Navette nécessaire si :
 *   - Rue étroite au départ OU à l'arrivée
 *   - Stationnement impossible (pas d'autorisation de stationnement)
 *   - Zone piétonne ou zone à circulation restreinte
 */
export class NavetteRequiredModule implements QuoteModule {
  readonly id = 'navette-required';
  readonly description = 'Détecte si une navette est nécessaire (IDF)';
  readonly priority = 45; // PHASE 4 - Accès & Contraintes Bâtiment

  /**
   * Le module s'applique si une navette est nécessaire
   */
  isApplicable(ctx: QuoteContext): boolean {
    // Navette nécessaire si rue étroite ou stationnement impossible
    const needsNavettePickup = ctx.pickupStreetNarrow === true || 
                               ctx.pickupParkingAuthorizationRequired === true;
    const needsNavetteDelivery = ctx.deliveryStreetNarrow === true || 
                                 ctx.deliveryParkingAuthorizationRequired === true;

    return needsNavettePickup || needsNavetteDelivery;
  }

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();

    if (!this.isApplicable(ctx)) {
      return ctx;
    }

    const reasons: string[] = [];
    if (ctx.pickupStreetNarrow === true) {
      reasons.push('rue étroite au départ');
    }
    if (ctx.pickupParkingAuthorizationRequired === true) {
      reasons.push('stationnement impossible au départ');
    }
    if (ctx.deliveryStreetNarrow === true) {
      reasons.push('rue étroite à l\'arrivée');
    }
    if (ctx.deliveryParkingAuthorizationRequired === true) {
      reasons.push('stationnement impossible à l\'arrivée');
    }

    // Calculer le coût de la navette
    const navetteConfig = MODULES_CONFIG.logistics.NAVETTE;
    const baseCost = navetteConfig.BASE_COST;
    const distanceFactor = navetteConfig.DISTANCE_FACTOR;
    const distanceKm = computed.distanceKm || 0;
    
    // Pas de seuil : le facteur distance s'applique dès le premier km
    const distanceSurcharge = distanceKm * distanceFactor;
    const navetteCost = baseCost + distanceSurcharge;

    // Logs détaillés du calcul
    console.log(`   💰 CALCUL COÛT NAVETTE LOGISTIQUE:`);
    console.log(`      Raisons: ${reasons.join(', ')}`);
    console.log(`      Distance: ${distanceKm.toFixed(2)} km`);
    console.log(`      Coût de base: ${baseCost}€`);
    console.log(`      Facteur distance: ${distanceFactor}€/km (pas de seuil)`);
    console.log(`      Surcoût distance: ${distanceKm.toFixed(2)} km × ${distanceFactor}€/km = ${distanceSurcharge.toFixed(2)}€`);
    console.log(`      Calcul: ${baseCost}€ + ${distanceSurcharge.toFixed(2)}€ = ${navetteCost.toFixed(2)}€`);
    console.log(`      = Coût total: ${navetteCost.toFixed(2)}€`);

    // Ajouter un requirement
    const requirements = [...computed.requirements];
    requirements.push({
      type: 'NAVETTE_REQUIRED',
      severity: 'MEDIUM',
      reason: `Navette nécessaire : ${reasons.join(', ')}. Le camion stationne à distance et une navette assure le transport des biens.`,
      moduleId: this.id,
      metadata: {
        reasons,
        pickupStreetNarrow: ctx.pickupStreetNarrow,
        deliveryStreetNarrow: ctx.deliveryStreetNarrow,
        pickupParkingAuthorizationRequired: ctx.pickupParkingAuthorizationRequired,
        deliveryParkingAuthorizationRequired: ctx.deliveryParkingAuthorizationRequired,
      }
    });

    return {
      ...ctx,
      computed: {
        ...computed,
        costs: [
          ...computed.costs,
          {
            moduleId: this.id,
            category: 'TRANSPORT',
            label: `Navette logistique (${reasons.join(', ')})`,
            amount: parseFloat(navetteCost.toFixed(2)),
            metadata: {
              reasons,
              baseCost,
              distanceKm: parseFloat(distanceKm.toFixed(2)),
              distanceFactor,
              distanceSurcharge: parseFloat(distanceSurcharge.toFixed(2)),
            }
          }
        ],
        requirements,
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        operationalFlags: [
          ...computed.operationalFlags,
          'NAVETTE_REQUIRED'
        ],
        metadata: {
          ...computed.metadata,
          navetteRequired: true,
          navetteReasons: reasons,
        }
      }
    };
  }
}

