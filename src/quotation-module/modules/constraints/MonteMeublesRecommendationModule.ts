import { QuoteContext, QuoteModule } from '../types/quote-types';
import { createEmptyComputedContext } from '../../core/ComputedContext';
import { MODULES_CONFIG } from '../../config/modules.config';

/**
 * MonteMeublesRecommendationModule - Recommande le monte-meubles si nécessaire
 *
 * TYPE : B (conditionnel métier)
 * PRIORITÉ : 50 (PHASE 5 - Monte-meubles CRITIQUE)
 *
 * RESPONSABILITÉS :
 * - Recommande le monte-meubles si étage > 0 ET pas d'ascenseur adapté (pickup OU delivery)
 * - Ajoute un requirement avec sévérité graduée :
 *   - MEDIUM : étage 1-2 sans ascenseur adapté
 *   - HIGH : étage ≥ 3 sans ascenseur adapté
 *   - CRITICAL : étage ≥ 5 sans ascenseur adapté
 * - Prépare le contexte pour les modules de conséquence en cas de refus
 */
export class MonteMeublesRecommendationModule implements QuoteModule {
  readonly id = 'monte-meubles-recommendation';
  readonly description = 'Recommande le monte-meubles si nécessaire';
  readonly priority = 50;

  /**
   * Détermine la sévérité de la recommandation en fonction de l'étage le plus élevé
   */
  private getSeverity(pickupFloor?: number, deliveryFloor?: number): 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const maxFloor = Math.max(pickupFloor || 0, deliveryFloor || 0);
    const floorThresholds = MODULES_CONFIG.furnitureLift.FLOOR_THRESHOLDS;

    if (maxFloor >= floorThresholds.CRITICAL) {
      return 'CRITICAL';
    }
    if (maxFloor >= floorThresholds.HIGH) {
      return 'HIGH';
    }
    return 'MEDIUM';
  }

  /**
   * Vérifie si l'ascenseur est inadapté (absent ou trop petit)
   */
  private isElevatorInadequate(hasElevator?: boolean, elevatorSize?: 'SMALL' | 'STANDARD' | 'LARGE'): boolean {
    // Pas d'ascenseur = inadapté
    if (hasElevator === false) {
      return true;
    }
    // Ascenseur petit = inadapté pour les meubles
    if (hasElevator === true && elevatorSize === 'SMALL') {
      return true;
    }
    return false;
  }

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();

    // Condition : étage > 0 ET pas d'ascenseur adapté (pickup OU delivery)
    const needsLiftPickup = ctx.pickupFloor !== undefined &&
                            ctx.pickupFloor > 0 &&
                            this.isElevatorInadequate(ctx.pickupHasElevator, ctx.pickupElevatorSize);

    const needsLiftDelivery = ctx.deliveryFloor !== undefined &&
                              ctx.deliveryFloor > 0 &&
                              this.isElevatorInadequate(ctx.deliveryHasElevator, ctx.deliveryElevatorSize);

    const needsLift = needsLiftPickup || needsLiftDelivery;

    if (!needsLift) {
      // Pas besoin de monte-meubles, le module ne s'applique pas
      return ctx;
    }

    // Déterminer la sévérité en fonction de l'étage le plus élevé
    const maxFloor = Math.max(ctx.pickupFloor || 0, ctx.deliveryFloor || 0);
    const severity = this.getSeverity(
      needsLiftPickup ? ctx.pickupFloor : undefined,
      needsLiftDelivery ? ctx.deliveryFloor : undefined
    );

    const floorThresholds = MODULES_CONFIG.furnitureLift.FLOOR_THRESHOLDS;
    const estimatedCosts = MODULES_CONFIG.furnitureLift.ESTIMATED_COSTS;
    const economy = estimatedCosts.RISK_SURCHARGE - estimatedCosts.LIFT;

    // Logs détaillés de la recommandation
    console.log(`   🔧 RECOMMANDATION MONTE-MEUBLES:`);
    console.log(`      Analyse:`);
    if (needsLiftPickup) {
      const elevatorInfo = ctx.pickupHasElevator === false ? 'absent' : 
                          (ctx.pickupElevatorSize === 'SMALL' ? 'trop petit (SMALL)' : 'adapté');
      console.log(`         Départ: Étage ${ctx.pickupFloor}, ascenseur: ${elevatorInfo}`);
    }
    if (needsLiftDelivery) {
      const elevatorInfo = ctx.deliveryHasElevator === false ? 'absent' : 
                          (ctx.deliveryElevatorSize === 'SMALL' ? 'trop petit (SMALL)' : 'adapté');
      console.log(`         Arrivée: Étage ${ctx.deliveryFloor}, ascenseur: ${elevatorInfo}`);
    }
    console.log(`      Détection: Monte-meubles nécessaire (étage > 0 sans ascenseur adapté)`);
    console.log(`      Calcul sévérité:`);
    console.log(`         Étage max: ${maxFloor}`);
    console.log(`         Seuil HIGH: ≥ ${floorThresholds.HIGH} → ${maxFloor >= floorThresholds.HIGH ? 'HIGH' : 'Non'}`);
    console.log(`         Seuil CRITICAL: ≥ ${floorThresholds.CRITICAL} → ${maxFloor >= floorThresholds.CRITICAL ? 'CRITICAL' : 'Non'}`);
    console.log(`      Sévérité: ${severity} (étage ${maxFloor} ${severity === 'CRITICAL' ? '≥' : severity === 'HIGH' ? '≥' : '<'} ${severity === 'CRITICAL' ? floorThresholds.CRITICAL : floorThresholds.HIGH})`);
    console.log(`      Calcul économie:`);
    console.log(`         Coût monte-meubles: ${estimatedCosts.LIFT}€`);
    console.log(`         Surcoût risque sans monte-meubles: ${estimatedCosts.RISK_SURCHARGE}€`);
    console.log(`         Économie: ${estimatedCosts.RISK_SURCHARGE}€ - ${estimatedCosts.LIFT}€ = ${economy}€`);
    console.log(`      = Recommandation: ${severity === 'CRITICAL' ? '🚨 CRITIQUE' : severity === 'HIGH' ? '⚠️ FORTEMENT RECOMMANDÉ' : '💡 RECOMMANDÉ'}`);

    // Construire le message de recommandation avec gradation
    const reasons: string[] = [];
    if (needsLiftPickup) {
      reasons.push(`Étage ${ctx.pickupFloor} sans ascenseur adapté au départ`);
    }
    if (needsLiftDelivery) {
      reasons.push(`Étage ${ctx.deliveryFloor} sans ascenseur adapté à l'arrivée`);
    }

    // Message adapté selon la sévérité
    let severityPrefix = '';
    let severityWarning = '';
    if (severity === 'CRITICAL') {
      severityPrefix = '🚨 CRITIQUE : ';
      severityWarning = 'À cette hauteur, le portage manuel est EXTRÊMEMENT DANGEREUX et quasi-impossible pour les meubles lourds. ';
    } else if (severity === 'HIGH') {
      severityPrefix = '⚠️ FORTEMENT RECOMMANDÉ : ';
      severityWarning = 'À partir du 3ème étage, le risque de casse et de blessure augmente significativement. ';
    } else {
      severityPrefix = '💡 RECOMMANDÉ : ';
      severityWarning = '';
    }

    const recommendationReason = `${severityPrefix}Monte-meubles ${severity === 'CRITICAL' ? 'OBLIGATOIRE' : 'recommandé'} : ${reasons.join(', ')}. ` +
                                 `${severityWarning}` +
                                 `💰 Investissement intelligent : Vous économisez 150 € (surcoût risque 500 € vs monte-meubles 350 €), ` +
                                 `couverture assurance complète (100%), et responsabilité complète. ` +
                                 `❌ Sans monte-meubles : couverture assurance réduite de 50%, responsabilité limitée, et surcoût de 500 €.`;

    // Ajouter un requirement avec sévérité graduée
    const requirements = [...computed.requirements];
    requirements.push({
      type: 'LIFT_RECOMMENDED',
      severity,
      reason: recommendationReason,
      moduleId: this.id,
      metadata: {
        needsLiftPickup,
        needsLiftDelivery,
        pickupFloor: ctx.pickupFloor,
        deliveryFloor: ctx.deliveryFloor,
        maxFloor: Math.max(ctx.pickupFloor || 0, ctx.deliveryFloor || 0),
        severityLevel: severity,
      }
    });

    // Ajouter une proposition cross-selling explicite pour inciter le client
    const estimatedLiftCost = estimatedCosts.LIFT;
    const estimatedRiskSurcharge = estimatedCosts.RISK_SURCHARGE;

    // Label adapté selon la sévérité
    let crossSellLabel = 'Location monte-meubles (recommandé)';
    if (severity === 'CRITICAL') {
      crossSellLabel = '🚨 Location monte-meubles (OBLIGATOIRE)';
    } else if (severity === 'HIGH') {
      crossSellLabel = '⚠️ Location monte-meubles (fortement recommandé)';
    }

    const crossSellProposals = [...computed.crossSellProposals];
    crossSellProposals.push({
      id: 'MONTE_MEUBLES',
      label: crossSellLabel,
      reason: `${severityPrefix}${reasons.join(' et ')}`,
      benefit: `💰 Investissement intelligent : Économisez ${economy} € (surcoût risque ${estimatedRiskSurcharge} € vs monte-meubles ${estimatedLiftCost} €), ` +
               `couverture assurance complète (100% au lieu de 50%), responsabilité complète, et réduction du risque de casse de 70%`,
      priceImpact: estimatedLiftCost,
      optional: severity !== 'CRITICAL', // Non optionnel si CRITICAL
      moduleId: this.id,
      basedOnRequirement: 'LIFT_RECOMMENDED',
      metadata: {
        estimatedLiftCost,
        estimatedRiskSurcharge,
        economy,
        coverageBenefit: 'Couverture assurance complète (100%)',
        liabilityBenefit: 'Responsabilité complète',
        safetyBenefit: 'Réduction risque casse de 70%',
        severity,
        maxFloor: Math.max(ctx.pickupFloor || 0, ctx.deliveryFloor || 0),
      }
    });

    return {
      ...ctx,
      computed: {
        ...computed,
        requirements,
        crossSellProposals,
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        metadata: {
          ...computed.metadata,
          monteMeublesRecommended: true,
          monteMeublesReason: recommendationReason,
          monteMeublesSeverity: severity,
          floorThresholds: {
            high: floorThresholds.HIGH,
            critical: floorThresholds.CRITICAL,
          },
          estimatedCosts: {
            lift: estimatedLiftCost,
            riskSurcharge: estimatedRiskSurcharge,
            economy,
          },
          maxFloor,
        }
      }
    };
  }

  /**
   * Le module s'applique si étage > 0 ET pas d'ascenseur adapté (pickup OU delivery)
   * Ascenseur inadapté = absent OU petit (SMALL)
   */
  isApplicable(ctx: QuoteContext): boolean {
    const needsLiftPickup = ctx.pickupFloor !== undefined &&
                            ctx.pickupFloor > 0 &&
                            this.isElevatorInadequate(ctx.pickupHasElevator, ctx.pickupElevatorSize);

    const needsLiftDelivery = ctx.deliveryFloor !== undefined &&
                              ctx.deliveryFloor > 0 &&
                              this.isElevatorInadequate(ctx.deliveryHasElevator, ctx.deliveryElevatorSize);

    return needsLiftPickup || needsLiftDelivery;
  }
}

