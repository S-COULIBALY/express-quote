import { QuoteContext, QuoteModule } from '../types/quote-types';
import { createEmptyComputedContext } from '../../core/ComputedContext';

/**
 * CoOwnershipRulesModule - Gère les règles spécifiques aux copropriétés
 *
 * TYPE : B (conditionnel métier)
 * PRIORITÉ : 75 (PHASE 7 - Assurance & Risque)
 *
 * RESPONSABILITÉS :
 * - Détecte si le déménagement concerne une copropriété
 * - Applique les règles spécifiques (horaires, autorisations, responsabilités)
 * - Ajoute des requirements et contribue au risque
 *
 * LOGIQUE MÉTIER :
 * - Copropriété détectée si :
 *   - Créneau syndic requis (pickupSyndicTimeSlot OU deliverySyndicTimeSlot)
 *   - OU étage > 0 avec ascenseur (indicateur de copropriété)
 * - Règles spécifiques : horaires stricts, autorisations, responsabilité voisinage
 */
export class CoOwnershipRulesModule implements QuoteModule {
  readonly id = 'co-ownership-rules';
  readonly description = 'Gère les règles spécifiques aux copropriétés';
  readonly priority = 75; // PHASE 7 - Assurance & Risque

  private static readonly RISK_CONTRIBUTION = 8; // Contribution au risque (0-100)

  /**
   * Le module s'applique si copropriété détectée
   */
  isApplicable(ctx: QuoteContext): boolean {
    // Copropriété détectée si créneau syndic OU (étage > 0 avec ascenseur)
    const hasSyndicTimeSlot = ctx.pickupSyndicTimeSlot === true || ctx.deliverySyndicTimeSlot === true;
    const pickupCoOwnership = ctx.pickupFloor !== undefined && 
                              ctx.pickupFloor > 0 && 
                              ctx.pickupHasElevator === true;
    const deliveryCoOwnership = ctx.deliveryFloor !== undefined && 
                               ctx.deliveryFloor > 0 && 
                               ctx.deliveryHasElevator === true;
    const hasCoOwnershipIndicators = pickupCoOwnership || deliveryCoOwnership;

    return hasSyndicTimeSlot || hasCoOwnershipIndicators;
  }

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();

    if (!this.isApplicable(ctx)) {
      return ctx;
    }

    const indicators: string[] = [];
    if (ctx.pickupSyndicTimeSlot === true) {
      indicators.push('créneau syndic au départ');
    }
    if (ctx.deliverySyndicTimeSlot === true) {
      indicators.push('créneau syndic à l\'arrivée');
    }
    if (ctx.pickupFloor !== undefined && ctx.pickupFloor > 0 && ctx.pickupHasElevator === true) {
      indicators.push(`copropriété au départ (étage ${ctx.pickupFloor})`);
    }
    if (ctx.deliveryFloor !== undefined && ctx.deliveryFloor > 0 && ctx.deliveryHasElevator === true) {
      indicators.push(`copropriété à l'arrivée (étage ${ctx.deliveryFloor})`);
    }

    // Ajouter un requirement
    const requirements = [...computed.requirements];
    requirements.push({
      type: 'CO_OWNERSHIP_RULES',
      severity: 'MEDIUM',
      reason: `Copropriété détectée : ${indicators.join(', ')}. ` +
              `Règles spécifiques applicables : respect des horaires, autorisations nécessaires, ` +
              `responsabilité en cas de dommages aux parties communes ou au voisinage.`,
      moduleId: this.id,
      metadata: {
        indicators,
        pickupSyndicTimeSlot: ctx.pickupSyndicTimeSlot,
        deliverySyndicTimeSlot: ctx.deliverySyndicTimeSlot,
        pickupFloor: ctx.pickupFloor,
        deliveryFloor: ctx.deliveryFloor,
      }
    });

    // Ajouter un impact juridique
    const legalImpacts = [...computed.legalImpacts];
    legalImpacts.push({
      moduleId: this.id,
      severity: 'INFO',
      type: 'REGULATORY',
      message: `Règles de copropriété applicables : Le déménagement doit respecter les règles de la copropriété ` +
               `(horaires, autorisations, responsabilité). En cas de dommages aux parties communes ou au voisinage, ` +
               `la responsabilité de l'entreprise peut être engagée.`,
      metadata: {
        indicators,
        coOwnershipDetected: true,
      }
    });

    return {
      ...ctx,
      computed: {
        ...computed,
        requirements,
        legalImpacts,
        riskContributions: [
          ...computed.riskContributions,
          {
            moduleId: this.id,
            amount: CoOwnershipRulesModule.RISK_CONTRIBUTION,
            reason: `Copropriété détectée - Règles spécifiques et responsabilité accrue`,
            metadata: {
              indicators,
            }
          }
        ],
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        metadata: {
          ...computed.metadata,
          coOwnershipDetected: true,
          coOwnershipIndicators: indicators,
        }
      }
    };
  }
}

