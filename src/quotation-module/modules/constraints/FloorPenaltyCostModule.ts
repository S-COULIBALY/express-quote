import { QuoteContext } from "../../core/QuoteContext";
import { QuoteModule } from "../../core/QuoteModule";
import { createEmptyComputedContext } from "../../core/ComputedContext";
import { MODULES_CONFIG } from "../../config/modules.config";

/**
 * FloorPenaltyCostModule - Calcule les pénalités d'étage sans ascenseur
 *
 * TYPE : B (conditionnel métier)
 * PRIORITÉ : 54 (PHASE 5 - Après monte-meubles)
 * DÉPENDANCES : monte-meubles-recommendation, furniture-lift-cost (pour vérifier si accepté)
 *
 * LOGIQUE MÉTIER RÉELLE DU DÉMÉNAGEMENT :
 * ═══════════════════════════════════════════════════════════════════════════
 * Le monte-meubles ANNULE les pénalités d'étage :
 * - Source : https://www.nextories.com/blog/2013/10/avantages-monte-meubles/
 *   "Si vous déménagez d'un cinquième étage sans ascenseur, la difficulté
 *    des accès est ANNULÉE par le monte-meubles"
 * - Source : https://demenagementgauvin.com/devis-prix/tarif-monte-meuble/
 *   "L'utilisation d'un monte-meuble permet de faire BAISSER le coût du devis
 *    puisqu'il réduit le nombre de déménageurs nécessaires"
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * CALCUL :
 * - Sans monte-meubles : 50-80€ par étage sans ascenseur (selon marché français)
 * - Avec monte-meubles : pénalités ANNULÉES (0€)
 *
 * Ce module s'exécute APRÈS furniture-lift-cost pour savoir si le monte-meubles
 * a été accepté et donc si les pénalités doivent être annulées.
 */
export class FloorPenaltyCostModule implements QuoteModule {
  readonly id = "floor-penalty-cost";
  readonly description =
    "Calcule les pénalités d'étage (annulées si monte-meubles)";
  readonly priority = 54; // Après furniture-lift-cost (53)
  readonly dependencies = ["monte-meubles-recommendation"];

  /**
   * Vérifie si un monte-meubles est utilisé
   */
  private hasFurnitureLift(ctx: QuoteContext): {
    pickup: boolean;
    delivery: boolean;
  } {
    // Vérifier les checkboxes du formulaire
    const pickupLift = ctx.pickupFurnitureLift === true;
    const deliveryLift = ctx.deliveryFurnitureLift === true;

    // Vérifier aussi si un coût de monte-meubles existe dans computed
    const hasLiftCost =
      ctx.computed?.costs.some((c) => c.moduleId === "furniture-lift-cost") ??
      false;

    // Vérifier dans les métadonnées
    const liftMeta = ctx.computed?.metadata?.furnitureLiftAccepted as
      | { pickup?: boolean; delivery?: boolean }
      | undefined;

    return {
      pickup: pickupLift || (hasLiftCost && liftMeta?.pickup === true),
      delivery: deliveryLift || (hasLiftCost && liftMeta?.delivery === true),
    };
  }

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();
    const config = MODULES_CONFIG.furnitureLift;
    const liftStatus = this.hasFurnitureLift(ctx);

    let totalPenalty = 0;
    const penaltyDetails: string[] = [];
    const compensatedPenalties: string[] = [];

    // Pénalité par étage (basé sur le marché français : 50-80€/étage)
    const penaltyPerFloor = config.FLOOR_PENALTY_PER_FLOOR || 65; // Moyenne

    // Calculer pénalité départ
    if (
      ctx.pickupFloor &&
      ctx.pickupFloor > 0 &&
      ctx.pickupHasElevator === false
    ) {
      const pickupPenalty = ctx.pickupFloor * penaltyPerFloor;

      if (liftStatus.pickup) {
        // Monte-meubles accepté → pénalité ANNULÉE
        compensatedPenalties.push(
          `Départ étage ${ctx.pickupFloor}: ${pickupPenalty.toFixed(2)}€ → 0€ (monte-meubles)`,
        );
      } else {
        // Pas de monte-meubles → pénalité appliquée
        totalPenalty += pickupPenalty;
        penaltyDetails.push(
          `Départ étage ${ctx.pickupFloor} sans ascenseur: +${pickupPenalty.toFixed(2)}€`,
        );
      }
    }

    // Calculer pénalité arrivée
    if (
      ctx.deliveryFloor &&
      ctx.deliveryFloor > 0 &&
      ctx.deliveryHasElevator === false
    ) {
      const deliveryPenalty = ctx.deliveryFloor * penaltyPerFloor;

      if (liftStatus.delivery) {
        // Monte-meubles accepté → pénalité ANNULÉE
        compensatedPenalties.push(
          `Arrivée étage ${ctx.deliveryFloor}: ${deliveryPenalty.toFixed(2)}€ → 0€ (monte-meubles)`,
        );
      } else {
        // Pas de monte-meubles → pénalité appliquée
        totalPenalty += deliveryPenalty;
        penaltyDetails.push(
          `Arrivée étage ${ctx.deliveryFloor} sans ascenseur: +${deliveryPenalty.toFixed(2)}€`,
        );
      }
    }

    // Si aucune pénalité et aucune compensation, le module ne fait rien
    if (totalPenalty === 0 && compensatedPenalties.length === 0) {
      return ctx;
    }

    // Logs détaillés
    console.log(`   💰 CALCUL PÉNALITÉS D'ÉTAGE:`);
    console.log(`      Tarif: ${penaltyPerFloor}€/étage sans ascenseur`);

    if (compensatedPenalties.length > 0) {
      console.log(`      ✅ PÉNALITÉS ANNULÉES PAR MONTE-MEUBLES:`);
      compensatedPenalties.forEach((detail) => {
        console.log(`         ${detail}`);
      });
    }

    if (penaltyDetails.length > 0) {
      console.log(`      ⚠️ PÉNALITÉS APPLIQUÉES (pas de monte-meubles):`);
      penaltyDetails.forEach((detail) => {
        console.log(`         ${detail}`);
      });
    }

    console.log(`      = Total pénalités: ${totalPenalty.toFixed(2)}€`);

    // Ajouter le coût si > 0
    const newCosts = [...computed.costs];
    if (totalPenalty > 0) {
      newCosts.push({
        moduleId: this.id,
        category: "LABOR",
        label: "Pénalités étage sans ascenseur",
        amount: parseFloat(totalPenalty.toFixed(2)),
        metadata: {
          penaltyPerFloor,
          penaltyDetails,
          compensatedPenalties,
          pickupFloor: ctx.pickupFloor,
          pickupHasElevator: ctx.pickupHasElevator,
          pickupFurnitureLift: liftStatus.pickup,
          deliveryFloor: ctx.deliveryFloor,
          deliveryHasElevator: ctx.deliveryHasElevator,
          deliveryFurnitureLift: liftStatus.delivery,
        },
      });
    }

    return {
      ...ctx,
      computed: {
        ...computed,
        costs: newCosts,
        activatedModules: [...computed.activatedModules, this.id],
        metadata: {
          ...computed.metadata,
          floorPenaltyApplied: totalPenalty > 0,
          floorPenaltyAmount: totalPenalty,
          floorPenaltyCompensated: compensatedPenalties.length > 0,
          floorPenaltyDetails: {
            penaltyDetails,
            compensatedPenalties,
          },
        },
      },
    };
  }

  /**
   * Le module s'applique si au moins une adresse a un étage > 0 sans ascenseur
   */
  isApplicable(ctx: QuoteContext): boolean {
    const hasPickupStairs =
      ctx.pickupFloor !== undefined &&
      ctx.pickupFloor > 0 &&
      ctx.pickupHasElevator === false;

    const hasDeliveryStairs =
      ctx.deliveryFloor !== undefined &&
      ctx.deliveryFloor > 0 &&
      ctx.deliveryHasElevator === false;

    return hasPickupStairs || hasDeliveryStairs;
  }
}
