import { QuoteContext, QuoteModule } from "../types/quote-types";
import { createEmptyComputedContext } from "../../core/ComputedContext";
import { ACCESS_CONSTRAINTS } from "../../../components/form-generator/components/modal-data";

/**
 * AccessConstraintsPenaltyModule - Applique les pénalités en pourcentage des contraintes d'accès
 *
 * TYPE : B (conditionnel métier)
 * PRIORITÉ : 48 (PHASE 4 - Accès & Contraintes Bâtiment, après les modules spécifiques)
 * DÉPENDANCES : Nécessite un prix de base calculé
 *
 * RESPONSABILITÉS :
 * - Lit les contraintes sélectionnées depuis pickupAccessConstraints / deliveryAccessConstraints
 * - Récupère les pourcentages depuis ACCESS_CONSTRAINTS (modal-data.ts - SOURCE UNIQUE)
 * - Applique les pourcentages au prix de base cumulé
 * - Évite les doublons (contraintes déjà traitées par d'autres modules)
 *
 * CONTRAINTES GÉRÉES PAR D'AUTRES MODULES (exclues du calcul pourcentage):
 * - constraint-1 (rue étroite) → NavetteRequiredModule
 * - constraint-3 (stationnement) → NavetteRequiredModule
 * - constraint-5/6 (ascenseur) → NoElevatorPickupModule/NoElevatorDeliveryModule
 * - constraint-11 (portage) → LaborAccessPenaltyModule
 * - constraint-13 (admin) → fusionné avec constraint-3
 * - constraint-15 (horaires) → TimeSlotSyndicModule
 *
 * CONTRAINTES 2,4,7,8,9,10,12,14,16 GÉRÉES PAR CE MODULE (impacts en pourcentage):
 * - constraint-2 (circulation complexe) +6.5%
 * - constraint-4 (zone piétonne) +8.5%
 * - constraint-7 (ascenseur petit) +7.5% (si non traité par ElevatorSize)
 * - constraint-8 (escalier difficile) +8.5%
 * - constraint-9 (couloirs étroits) +6.5%
 * - constraint-10 (multi-niveaux) +9.5%
 * - constraint-12 (passage indirect) +8.2%
 * - constraint-14 (contrôle accès) +6%
 * - constraint-16 (sol fragile) +5.5%
 */
export class AccessConstraintsPenaltyModule implements QuoteModule {
  readonly id = "access-constraints-penalty";
  readonly description =
    "Applique les pénalités en pourcentage des contraintes d'accès";
  readonly priority = 48; // PHASE 4 - Après NavetteRequired (45), TimeSlotSyndic (47)

  // Contraintes déjà traitées par d'autres modules (exclues du calcul)
  private static readonly EXCLUDED_CONSTRAINTS = [
    "constraint-1", // NavetteRequiredModule (pickupStreetNarrow)
    "constraint-3", // NavetteRequiredModule (parkingAuthorizationRequired)
    "constraint-5", // NoElevatorPickupModule/NoElevatorDeliveryModule
    "constraint-6", // NoElevatorPickupModule/NoElevatorDeliveryModule
    "constraint-11", // LaborAccessPenaltyModule (carryDistance)
    "constraint-13", // Fusionné avec constraint-3
    "constraint-15", // TimeSlotSyndicModule (syndicTimeSlot)
  ];

  /**
   * Le module s'applique s'il y a des contraintes d'accès sélectionnées non exclues
   */
  isApplicable(ctx: QuoteContext): boolean {
    const allConstraints = [
      ...(ctx.pickupAccessConstraints || []),
      ...(ctx.deliveryAccessConstraints || []),
    ];

    // Filtrer les contraintes déjà traitées par d'autres modules
    const applicableConstraints = allConstraints.filter(
      (id) => !AccessConstraintsPenaltyModule.EXCLUDED_CONSTRAINTS.includes(id),
    );

    return applicableConstraints.length > 0;
  }

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();

    if (!this.isApplicable(ctx)) {
      return ctx;
    }

    // Récupérer le prix de base pour appliquer les pourcentages
    const baseCost = computed.costs.reduce((sum, cost) => sum + cost.amount, 0);

    if (baseCost <= 0) {
      console.log(
        `   ⚠️ AccessConstraintsPenaltyModule: Pas de prix de base, module ignoré`,
      );
      return ctx;
    }

    // Collecter toutes les contraintes (pickup + delivery)
    const pickupConstraints = ctx.pickupAccessConstraints || [];
    const deliveryConstraints = ctx.deliveryAccessConstraints || [];

    // Créer un map pour éviter les doublons (même contrainte sur pickup ET delivery)
    const constraintPenalties: Map<
      string,
      { percent: number; name: string; locations: string[] }
    > = new Map();

    // Traiter les contraintes pickup
    for (const constraintId of pickupConstraints) {
      if (
        AccessConstraintsPenaltyModule.EXCLUDED_CONSTRAINTS.includes(
          constraintId,
        )
      )
        continue;

      const constraint = ACCESS_CONSTRAINTS.find((c) => c.id === constraintId);
      if (!constraint) continue;

      const existing = constraintPenalties.get(constraintId);
      if (existing) {
        existing.locations.push("départ");
      } else {
        constraintPenalties.set(constraintId, {
          percent: constraint.value,
          name: constraint.name,
          locations: ["départ"],
        });
      }
    }

    // Traiter les contraintes delivery
    for (const constraintId of deliveryConstraints) {
      if (
        AccessConstraintsPenaltyModule.EXCLUDED_CONSTRAINTS.includes(
          constraintId,
        )
      )
        continue;

      const constraint = ACCESS_CONSTRAINTS.find((c) => c.id === constraintId);
      if (!constraint) continue;

      const existing = constraintPenalties.get(constraintId);
      if (existing) {
        existing.locations.push("arrivée");
      } else {
        constraintPenalties.set(constraintId, {
          percent: constraint.value,
          name: constraint.name,
          locations: ["arrivée"],
        });
      }
    }

    if (constraintPenalties.size === 0) {
      return ctx;
    }

    // Calculer le surcoût total
    let totalPenalty = 0;
    const penaltyDetails: Array<{
      id: string;
      name: string;
      percent: number;
      amount: number;
      locations: string[];
    }> = [];

    console.log(`   💰 CALCUL PÉNALITÉS CONTRAINTES D'ACCÈS:`);
    console.log(`      Prix de base: ${baseCost.toFixed(2)}€`);

    for (const [constraintId, penalty] of constraintPenalties) {
      // Si la contrainte s'applique aux deux adresses, doubler le pourcentage
      const multiplier = penalty.locations.length > 1 ? 1.5 : 1; // +50% si les deux adresses
      const effectivePercent = penalty.percent * multiplier;
      const penaltyAmount = (baseCost * effectivePercent) / 100;

      totalPenalty += penaltyAmount;
      penaltyDetails.push({
        id: constraintId,
        name: penalty.name,
        percent: effectivePercent,
        amount: penaltyAmount,
        locations: penalty.locations,
      });

      console.log(
        `      • ${penalty.name} (${penalty.locations.join(" + ")}): +${effectivePercent.toFixed(1)}% = ${penaltyAmount.toFixed(2)}€`,
      );
    }

    console.log(`      = Total pénalités: ${totalPenalty.toFixed(2)}€`);

    return {
      ...ctx,
      computed: {
        ...computed,
        costs: [
          ...computed.costs,
          {
            moduleId: this.id,
            category: "LOGISTICS",
            label: `Surcoût contraintes d'accès (${penaltyDetails.length} contrainte${penaltyDetails.length > 1 ? "s" : ""})`,
            amount: parseFloat(totalPenalty.toFixed(2)),
            metadata: {
              baseCost: parseFloat(baseCost.toFixed(2)),
              penaltyDetails,
              totalPercent: penaltyDetails.reduce(
                (sum, p) => sum + p.percent,
                0,
              ),
            },
          },
        ],
        activatedModules: [...computed.activatedModules, this.id],
        metadata: {
          ...computed.metadata,
          accessConstraintsPenaltyApplied: true,
          accessConstraintsPenaltyDetails: penaltyDetails,
        },
      },
    };
  }
}
