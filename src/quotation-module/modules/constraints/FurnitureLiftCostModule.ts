import { QuoteContext, QuoteModule } from '../types/quote-types';
import { createEmptyComputedContext } from '../../core/ComputedContext';
import { MODULES_CONFIG } from '../../config/modules.config';

/**
 * FurnitureLiftCostModule - Calcule le coût du monte-meubles
 *
 * TYPE : A (basé sur les checkbox du formulaire par adresse)
 * PRIORITÉ : 53 (PHASE 5 - Monte-meubles CRITIQUE)
 * DÉPENDANCES : Aucune
 *
 * RESPONSABILITÉS :
 * - Ajoute le coût du monte-meubles selon les checkbox par adresse :
 *   - pickupFurnitureLift : Monte-meubles pour l'adresse de départ
 *   - deliveryFurnitureLift : Monte-meubles pour l'adresse d'arrivée
 *
 * LOGIQUE DE SEUILS (gérée côté frontend) :
 * - HIGH (≥3) : Coché par défaut, décochable avec avertissement
 * - CRITICAL (≥5) : Coché et non décochable par le client
 *
 * TARIFICATION :
 * - Coût de base : 250€ (installation + opérateur) par adresse
 * - Double monte-meubles : +250€ (si pickup ET delivery)
 */
export class FurnitureLiftCostModule implements QuoteModule {
  readonly id = 'furniture-lift-cost';
  readonly description = 'Calcule le coût du monte-meubles';
  readonly priority = 53; // PHASE 5 - Monte-meubles CRITIQUE
  readonly dependencies: string[] = [];

  /**
   * Le module s'applique si au moins une checkbox monte-meubles est cochée
   */
  isApplicable(ctx: QuoteContext): boolean {
    return ctx.pickupFurnitureLift === true || ctx.deliveryFurnitureLift === true;
  }

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();

    if (!this.isApplicable(ctx)) {
      return ctx;
    }

    const config = MODULES_CONFIG.furnitureLift;
    const needsLiftPickup = ctx.pickupFurnitureLift === true;
    const needsLiftDelivery = ctx.deliveryFurnitureLift === true;

    // Calculer le coût du monte-meubles
    let liftCost = config.BASE_LIFT_COST;
    const details: string[] = [];

    // Surcoût si double monte-meubles (pickup ET delivery)
    if (needsLiftPickup && needsLiftDelivery) {
      liftCost += config.DOUBLE_LIFT_SURCHARGE;
      details.push(`+${config.DOUBLE_LIFT_SURCHARGE}€ (double installation)`);
    }

    // Log des calculs
    console.log(`   💰 CALCUL COÛT MONTE-MEUBLES:`);
    console.log(`      Mode: Checkbox par adresse (formulaire)`);
    console.log(`      Coût de base: ${config.BASE_LIFT_COST}€`);
    if (needsLiftPickup) {
      console.log(`      ✓ Départ: Étage ${ctx.pickupFloor ?? 'N/A'} - Monte-meubles demandé`);
    }
    if (needsLiftDelivery) {
      console.log(`      ✓ Arrivée: Étage ${ctx.deliveryFloor ?? 'N/A'} - Monte-meubles demandé`);
    }
    if (needsLiftPickup && needsLiftDelivery) {
      console.log(`      Double installation: +${config.DOUBLE_LIFT_SURCHARGE}€`);
    }
    console.log(`      = Total: ${liftCost.toFixed(2)}€`);

    // Construire le label avec détails
    let label = 'Location monte-meubles';
    if (needsLiftPickup && needsLiftDelivery) {
      label = 'Location monte-meubles (départ + arrivée)';
    } else if (needsLiftPickup) {
      label = 'Location monte-meubles (départ)';
    } else if (needsLiftDelivery) {
      label = 'Location monte-meubles (arrivée)';
    }

    return {
      ...ctx,
      computed: {
        ...computed,
        costs: [
          ...computed.costs,
          {
            moduleId: this.id,
            category: 'EQUIPMENT', // Équipement spécialisé (monte-meubles)
            label,
            amount: parseFloat(liftCost.toFixed(2)),
            metadata: {
              baseCost: config.BASE_LIFT_COST,
              needsLiftPickup,
              needsLiftDelivery,
              pickupFloor: ctx.pickupFloor,
              deliveryFloor: ctx.deliveryFloor,
              doubleInstallation: needsLiftPickup && needsLiftDelivery,
              doubleInstallationSurcharge: needsLiftPickup && needsLiftDelivery ? config.DOUBLE_LIFT_SURCHARGE : 0,
              details,
            }
          }
        ],
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        metadata: {
          ...computed.metadata,
          furnitureLiftAccepted: true,
          furnitureLiftCost: parseFloat(liftCost.toFixed(2)),
          pickupFurnitureLift: needsLiftPickup,
          deliveryFurnitureLift: needsLiftDelivery,
        }
      }
    };
  }
}
