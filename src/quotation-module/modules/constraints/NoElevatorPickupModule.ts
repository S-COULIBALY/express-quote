import { QuoteContext, QuoteModule } from '../types/quote-types';
import { createEmptyComputedContext } from '../../core/ComputedContext';

/**
 * NoElevatorPickupModule - Gère l'absence d'ascenseur au départ
 *
 * TYPE : B (conditionnel métier)
 * PRIORITÉ : 40 (PHASE 4 - Accès & Contraintes Bâtiment)
 *
 * RESPONSABILITÉS :
 * - Détecte l'absence d'ascenseur au départ
 * - Ajoute un requirement pour monte-meubles si étage > 0 ET pas d'ascenseur
 * - Contribue au risque opérationnel
 * - Prépare le contexte pour MonteMeublesRecommendationModule
 */
export class NoElevatorPickupModule implements QuoteModule {
  readonly id = 'no-elevator-pickup';
  readonly description = 'Gère l\'absence d\'ascenseur au départ';
  readonly priority = 40;

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();
    const pickupFloor = ctx.pickupFloor;
    const pickupHasElevator = ctx.pickupHasElevator;

    // Condition : étage > 0 ET pas d'ascenseur
    const hasNoElevator = pickupFloor !== undefined && 
                          pickupFloor > 0 && 
                          pickupHasElevator === false;

    if (!hasNoElevator) {
      // Pas de contrainte, le module ne s'applique pas
      return ctx;
    }

    // Ajouter un requirement pour monte-meubles
    const requirements = [...computed.requirements];
    requirements.push({
      type: 'LIFT_RECOMMENDED',
      severity: 'HIGH',
      reason: `Étage ${pickupFloor} sans ascenseur au départ - Monte-meubles fortement recommandé pour sécurité et efficacité`,
      moduleId: this.id,
      metadata: {
        pickupFloor,
        pickupHasElevator: false,
      }
    });

    // Contribuer au risque
    const riskContributions = [...computed.riskContributions];
    riskContributions.push({
      moduleId: this.id,
      amount: 15, // Contribution au risque (0-100)
      reason: `Manutention manuelle étage ${pickupFloor} sans ascenseur au départ`,
      metadata: {
        pickupFloor,
      }
    });

    return {
      ...ctx,
      computed: {
        ...computed,
        requirements,
        riskContributions,
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        metadata: {
          ...computed.metadata,
          noElevatorPickup: true,
          pickupFloorWithoutElevator: pickupFloor,
        }
      }
    };
  }

  /**
   * Le module s'applique si étage > 0 ET pas d'ascenseur au départ
   */
  isApplicable(ctx: QuoteContext): boolean {
    return ctx.pickupFloor !== undefined && 
           ctx.pickupFloor > 0 && 
           ctx.pickupHasElevator === false;
  }
}

