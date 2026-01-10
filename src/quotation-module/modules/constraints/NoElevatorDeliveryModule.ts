import { QuoteContext, QuoteModule } from '../types/quote-types';
import { createEmptyComputedContext } from '../../core/ComputedContext';

/**
 * NoElevatorDeliveryModule - Gère l'absence d'ascenseur à l'arrivée
 *
 * TYPE : B (conditionnel métier)
 * PRIORITÉ : 41 (PHASE 4 - Accès & Contraintes Bâtiment)
 *
 * RESPONSABILITÉS :
 * - Détecte l'absence d'ascenseur à l'arrivée
 * - Ajoute un requirement pour monte-meubles si étage > 0 ET pas d'ascenseur
 * - Contribue au risque opérationnel
 * - Prépare le contexte pour MonteMeublesRecommendationModule
 */
export class NoElevatorDeliveryModule implements QuoteModule {
  readonly id = 'no-elevator-delivery';
  readonly description = 'Gère l\'absence d\'ascenseur à l\'arrivée';
  readonly priority = 41;

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();
    const deliveryFloor = ctx.deliveryFloor;
    const deliveryHasElevator = ctx.deliveryHasElevator;

    // Condition : étage > 0 ET pas d'ascenseur
    const hasNoElevator = deliveryFloor !== undefined && 
                          deliveryFloor > 0 && 
                          deliveryHasElevator === false;

    if (!hasNoElevator) {
      // Pas de contrainte, le module ne s'applique pas
      return ctx;
    }

    // Ajouter un requirement pour monte-meubles
    const requirements = [...computed.requirements];
    requirements.push({
      type: 'LIFT_RECOMMENDED',
      severity: 'HIGH',
      reason: `Étage ${deliveryFloor} sans ascenseur à l'arrivée - Monte-meubles fortement recommandé pour sécurité et efficacité`,
      moduleId: this.id,
      metadata: {
        deliveryFloor,
        deliveryHasElevator: false,
      }
    });

    // Contribuer au risque
    const riskContributions = [...computed.riskContributions];
    riskContributions.push({
      moduleId: this.id,
      amount: 15, // Contribution au risque (0-100)
      reason: `Manutention manuelle étage ${deliveryFloor} sans ascenseur à l'arrivée`,
      metadata: {
        deliveryFloor,
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
          noElevatorDelivery: true,
          deliveryFloorWithoutElevator: deliveryFloor,
        }
      }
    };
  }

  /**
   * Le module s'applique si étage > 0 ET pas d'ascenseur à l'arrivée
   */
  isApplicable(ctx: QuoteContext): boolean {
    return ctx.deliveryFloor !== undefined && 
           ctx.deliveryFloor > 0 && 
           ctx.deliveryHasElevator === false;
  }
}

