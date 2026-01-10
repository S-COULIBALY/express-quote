import { QuoteContext, QuoteModule } from '../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';
import { MODULES_CONFIG } from '../../../config/modules.config';

/**
 * LaborAccessPenaltyModule - Surcoût main-d'œuvre pour accès difficile
 *
 * TYPE : B (conditionnel métier)
 * PRIORITÉ : 66 (PHASE 6 - Main d'œuvre)
 * DÉPENDANCES : Nécessite LaborBaseModule (priority 62)
 *
 * RESPONSABILITÉS :
 * - Calcule un surcoût pour accès difficile (escaliers, distance portage)
 * - S'applique uniquement si :
 *   - Escaliers : étage > 3 ET pas d'ascenseur ET pas de monte-meubles
 *   - Portage : distance > 30m
 * - Ajoute un coût supplémentaire basé sur la complexité d'accès
 */
export class LaborAccessPenaltyModule implements QuoteModule {
  readonly id = 'labor-access-penalty';
  readonly description = 'Surcoût main-d\'œuvre pour accès difficile';
  readonly priority = 66; // Après LaborBaseModule (62)
  readonly dependencies = ['labor-base'];

  /**
   * Vérifie si un monte-meubles est utilisé (accepté ou facturé)
   */
  private hasFurnitureLift(ctx: QuoteContext): boolean {
    // Vérifier si un coût de monte-meubles existe
    const hasLiftCost = ctx.computed?.costs.some(c => c.moduleId === 'furniture-lift-cost');
    
    // Vérifier si le monte-meubles a été accepté (pas refusé)
    const isLiftAccepted = ctx.refuseLiftDespiteRecommendation === false;
    
    // Vérifier dans les métadonnées
    const isLiftInMetadata = ctx.computed?.metadata?.furnitureLiftAccepted === true;
    
    return hasLiftCost || isLiftAccepted || isLiftInMetadata;
  }

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();
    const config = MODULES_CONFIG.labor.ACCESS_PENALTIES;
    const hasLift = this.hasFurnitureLift(ctx);
    
    let totalPenalty = 0;
    const penaltyDetails: string[] = [];

    // Pénalité pour escaliers au départ
    // Condition : étage > seuil ET pas d'ascenseur ET pas de monte-meubles
    if (ctx.pickupFloor !== undefined && 
        ctx.pickupFloor > config.STAIRS_FLOOR_THRESHOLD && 
        ctx.pickupHasElevator === false &&
        !hasLift) {
      const pickupPenalty = ctx.pickupFloor * config.STAIRS_PER_FLOOR;
      totalPenalty += pickupPenalty;
      penaltyDetails.push(`Départ étage ${ctx.pickupFloor} sans ascenseur ni monte-meubles: +${pickupPenalty.toFixed(2)}€`);
    }

    // Pénalité pour escaliers à l'arrivée
    // Condition : étage > seuil ET pas d'ascenseur ET pas de monte-meubles
    if (ctx.deliveryFloor !== undefined && 
        ctx.deliveryFloor > config.STAIRS_FLOOR_THRESHOLD && 
        ctx.deliveryHasElevator === false &&
        !hasLift) {
      const deliveryPenalty = ctx.deliveryFloor * config.STAIRS_PER_FLOOR;
      totalPenalty += deliveryPenalty;
      penaltyDetails.push(`Arrivée étage ${ctx.deliveryFloor} sans ascenseur ni monte-meubles: +${deliveryPenalty.toFixed(2)}€`);
    }

    // Pénalité pour distance de portage au départ
    // Condition : distance > seuil
    if (ctx.pickupCarryDistance !== undefined && ctx.pickupCarryDistance > config.CARRY_DISTANCE_THRESHOLD) {
      const pickupCarryPenalty = ctx.pickupCarryDistance * config.CARRY_DISTANCE_PER_METER;
      totalPenalty += pickupCarryPenalty;
      penaltyDetails.push(`Portage départ ${ctx.pickupCarryDistance}m: +${pickupCarryPenalty.toFixed(2)}€`);
    }

    // Pénalité pour distance de portage à l'arrivée
    // Condition : distance > seuil
    if (ctx.deliveryCarryDistance !== undefined && ctx.deliveryCarryDistance > config.CARRY_DISTANCE_THRESHOLD) {
      const deliveryCarryPenalty = ctx.deliveryCarryDistance * config.CARRY_DISTANCE_PER_METER;
      totalPenalty += deliveryCarryPenalty;
      penaltyDetails.push(`Portage arrivée ${ctx.deliveryCarryDistance}m: +${deliveryCarryPenalty.toFixed(2)}€`);
    }

    if (totalPenalty <= 0) {
      // Pas de pénalité, le module ne s'applique pas
      return ctx;
    }

    // Log des calculs
    console.log(`   💰 CALCUL SURCOÛT ACCÈS DIFFICILE:`);
    if (hasLift) {
      console.log(`      Monte-meubles utilisé: Oui (pas de pénalité escaliers)`);
    }
    penaltyDetails.forEach((detail, index) => {
      console.log(`      ${index + 1}. ${detail}`);
    });
    console.log(`      = Total: ${totalPenalty.toFixed(2)}€`);

    return {
      ...ctx,
      computed: {
        ...computed,
        costs: [
          ...computed.costs,
          {
            moduleId: this.id,
            category: 'LABOR',
            label: 'Surcoût accès difficile',
            amount: parseFloat(totalPenalty.toFixed(2)),
            metadata: {
              penaltyDetails,
              pickupFloor: ctx.pickupFloor,
              pickupHasElevator: ctx.pickupHasElevator,
              deliveryFloor: ctx.deliveryFloor,
              deliveryHasElevator: ctx.deliveryHasElevator,
              pickupCarryDistance: ctx.pickupCarryDistance,
              deliveryCarryDistance: ctx.deliveryCarryDistance,
            }
          }
        ],
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        metadata: {
          ...computed.metadata,
          laborAccessPenaltyApplied: true,
          totalAccessPenalty: parseFloat(totalPenalty.toFixed(2)),
        }
      }
    };
  }

  /**
   * Le module s'applique si :
   * - Escaliers : étage > seuil ET pas d'ascenseur ET pas de monte-meubles
   * - OU distance portage > seuil
   */
  isApplicable(ctx: QuoteContext): boolean {
    const hasLift = this.hasFurnitureLift(ctx);
    const config = MODULES_CONFIG.labor.ACCESS_PENALTIES;
    
    const hasStairsPickup = ctx.pickupFloor !== undefined && 
                           ctx.pickupFloor > config.STAIRS_FLOOR_THRESHOLD && 
                           ctx.pickupHasElevator === false &&
                           !hasLift;
    const hasStairsDelivery = ctx.deliveryFloor !== undefined && 
                             ctx.deliveryFloor > config.STAIRS_FLOOR_THRESHOLD && 
                             ctx.deliveryHasElevator === false &&
                             !hasLift;
    const hasCarryDistance = (ctx.pickupCarryDistance !== undefined && ctx.pickupCarryDistance > config.CARRY_DISTANCE_THRESHOLD) ||
                            (ctx.deliveryCarryDistance !== undefined && ctx.deliveryCarryDistance > config.CARRY_DISTANCE_THRESHOLD);

    return hasStairsPickup || hasStairsDelivery || hasCarryDistance;
  }
}

