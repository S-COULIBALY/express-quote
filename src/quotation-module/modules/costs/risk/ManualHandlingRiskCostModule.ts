import { QuoteContext, QuoteModule } from '../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';
import { MODULES_CONFIG } from '../../../config/modules.config';

/**
 * ManualHandlingRiskCostModule - Surcoût risque manutention si refus monte-meubles
 *
 * TYPE : C (déclenché par état calculé)
 * PRIORITÉ : 55 (PHASE 5 - Monte-meubles CRITIQUE)
 * DÉPENDANCES : Nécessite MonteMeublesRefusalImpactModule (priority 52)
 *
 * RESPONSABILITÉS :
 * - Calcule un surcoût pour le risque de manutention manuelle
 * - S'applique si monte-meubles recommandé mais refusé
 * - Compense le risque accru de dommages et de blessures
 */
export class ManualHandlingRiskCostModule implements QuoteModule {
  readonly id = 'manual-handling-risk-cost';
  readonly description = 'Surcoût risque manutention si refus monte-meubles';
  readonly priority = 55; // Après MonteMeublesRefusalImpactModule (52)
  readonly dependencies = ['monte-meubles-refusal-impact'];

  /**
   * TYPE C : Le module s'applique uniquement si :
   * 1. Monte-meubles recommandé (vérifié via dépendance + requirements)
   * 2. Refusé explicitement par l'utilisateur
   *
   * isApplicable() est vérifié APRÈS que les dépendances aient été satisfaites,
   * ce qui permet d'accéder aux requirements calculés par MonteMeublesRecommendationModule.
   */
  isApplicable(ctx: QuoteContext): boolean {
    const computed = ctx.computed;
    if (!computed) {
      return false;
    }

    // Vérifier si monte-meubles recommandé
    const hasRecommendation = computed.requirements.some(
      req => req.type === 'LIFT_RECOMMENDED' && req.moduleId === 'monte-meubles-recommendation'
    );

    // Vérifier si refusé par l'utilisateur
    const isRefused = ctx.refuseLiftDespiteRecommendation === true;

    return hasRecommendation && isRefused;
  }

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();
    
    // isApplicable() a déjà vérifié les conditions, on peut procéder directement
    const config = MODULES_CONFIG.furnitureLift.MANUAL_HANDLING_RISK;
    const estimatedLiftCost = MODULES_CONFIG.furnitureLift.ESTIMATED_COSTS.LIFT;

    // Calculer le surcoût basé sur les étages concernés
    let pickupFloors = 0;
    let deliveryFloors = 0;
    
    if (ctx.pickupFloor !== undefined && ctx.pickupFloor > 0 && ctx.pickupHasElevator === false) {
      pickupFloors = ctx.pickupFloor;
    }
    if (ctx.deliveryFloor !== undefined && ctx.deliveryFloor > 0 && ctx.deliveryHasElevator === false) {
      deliveryFloors = ctx.deliveryFloor;
    }

    const totalFloors = pickupFloors + deliveryFloors;
    const baseCost = config.BASE_COST;
    const costPerFloor = config.COST_PER_FLOOR;
    const floorsCost = totalFloors * costPerFloor;
    const riskCost = baseCost + floorsCost;
    const economyIfLiftAccepted = riskCost - estimatedLiftCost;

    // Logs détaillés du calcul
    console.log(`   💰 CALCUL SURCOÛT RISQUE MANUTENTION:`);
    console.log(`      Monte-meubles recommandé mais refusé par le client`);
    if (pickupFloors > 0) {
      console.log(`      Départ: Étage ${ctx.pickupFloor} sans ascenseur`);
    }
    if (deliveryFloors > 0) {
      console.log(`      Arrivée: Étage ${ctx.deliveryFloor} sans ascenseur`);
    }
    console.log(`      Total étages: ${totalFloors}`);
    console.log(`      Coût de base: ${baseCost}€`);
    console.log(`      Coût par étage: ${costPerFloor}€`);
    console.log(`      Calcul: ${baseCost}€ + (${totalFloors} × ${costPerFloor}€) = ${riskCost.toFixed(2)}€`);
    console.log(`      Coût estimé monte-meubles: ${estimatedLiftCost}€`);
    if (economyIfLiftAccepted > 0) {
      console.log(`      Économie si monte-meubles accepté: ${economyIfLiftAccepted.toFixed(2)}€`);
    } else {
      console.log(`      ⚠️ Surcoût supérieur au monte-meubles de ${Math.abs(economyIfLiftAccepted).toFixed(2)}€`);
    }
    console.log(`      = Surcoût final: ${riskCost.toFixed(2)}€`);

    return {
      ...ctx,
      computed: {
        ...computed,
        costs: [
          ...computed.costs,
          {
            moduleId: this.id,
            category: 'RISK',
            label: `Surcoût risque manutention manuelle (refus monte-meubles) - ${economyIfLiftAccepted > 0 ? `Vous auriez économisé ${economyIfLiftAccepted.toFixed(2)} € avec le monte-meubles` : 'Coût supérieur au monte-meubles'}`,
            amount: parseFloat(riskCost.toFixed(2)),
            metadata: {
              baseRiskCost: baseCost,
              pickupFloors,
              deliveryFloors,
              totalFloors,
              riskCostPerFloor: costPerFloor,
              floorsCost: parseFloat(floorsCost.toFixed(2)),
              pickupFloor: ctx.pickupFloor,
              deliveryFloor: ctx.deliveryFloor,
              estimatedLiftCost,
              economyIfLiftAccepted: parseFloat(economyIfLiftAccepted.toFixed(2)),
              explanation: `Ce surcoût de ${riskCost.toFixed(2)} € est dû au refus du monte-meubles recommandé. ` +
                          `Le monte-meubles vous aurait coûté ${estimatedLiftCost} €, soit ${economyIfLiftAccepted.toFixed(2)} € de moins. ` +
                          `De plus, vous auriez bénéficié d'une couverture assurance complète et d'une responsabilité complète.`,
            }
          }
        ],
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        metadata: {
          ...computed.metadata,
          manualHandlingRiskCostApplied: true,
          totalRiskFloors: totalFloors,
        }
      }
    };
  }
}

