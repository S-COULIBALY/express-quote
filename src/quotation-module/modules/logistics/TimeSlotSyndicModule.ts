import { QuoteContext, QuoteModule } from '../types/quote-types';
import { createEmptyComputedContext } from '../../core/ComputedContext';
import { MODULES_CONFIG } from '../../config/modules.config';

/**
 * TimeSlotSyndicModule - Détecte si un créneau syndic est requis
 *
 * TYPE : B (conditionnel métier)
 * PRIORITÉ : 47 (PHASE 4 - Accès & Contraintes Bâtiment)
 *
 * RESPONSABILITÉS :
 * - Détecte si un créneau syndic est requis (copropriété)
 * - Ajoute un requirement et un surcoût pour la contrainte horaire
 * - Contribue au risque (planning serré)
 *
 * LOGIQUE MÉTIER :
 * - Créneau syndic requis si :
 *   - pickupSyndicTimeSlot === true OU deliverySyndicTimeSlot === true
 * - Surcoût pour compenser la contrainte horaire stricte
 * - Augmente le risque opérationnel (moins de flexibilité)
 */
export class TimeSlotSyndicModule implements QuoteModule {
  readonly id = 'time-slot-syndic';
  readonly description = 'Détecte si un créneau syndic est requis';
  readonly priority = 47; // PHASE 4 - Accès & Contraintes Bâtiment

  /**
   * Le module s'applique si un créneau syndic est requis au départ ou à l'arrivée
   */
  isApplicable(ctx: QuoteContext): boolean {
    return ctx.pickupSyndicTimeSlot === true || ctx.deliverySyndicTimeSlot === true;
  }

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();

    if (!this.isApplicable(ctx)) {
      return ctx;
    }

    const locations: string[] = [];
    if (ctx.pickupSyndicTimeSlot === true) {
      locations.push('départ');
    }
    if (ctx.deliverySyndicTimeSlot === true) {
      locations.push('arrivée');
    }

    // Ajouter un requirement
    const requirements = [...computed.requirements];
    requirements.push({
      type: 'SYNDIC_TIME_SLOT_REQUIRED',
      severity: 'MEDIUM',
      reason: `Créneau syndic requis au ${locations.join(' et à l\'')}. ` +
              `Le déménagement doit respecter les horaires stricts de la copropriété. ` +
              `Retard possible = pénalités et surcoûts.`,
      moduleId: this.id,
      metadata: {
        locations,
        pickupSyndicTimeSlot: ctx.pickupSyndicTimeSlot,
        deliverySyndicTimeSlot: ctx.deliverySyndicTimeSlot,
      }
    });

    // Calculer le surcoût
    const logisticsConfig = MODULES_CONFIG.logistics;
    const adminConfig = MODULES_CONFIG.administrative;
    const baseSurcharge = logisticsConfig.SYNDIC_SURCHARGE;
    const multipleLocations = locations.length > 1;
    const multiplier = multipleLocations ? adminConfig.MULTIPLE_LOCATIONS_MULTIPLIER : 1;
    const surchargeAmount = baseSurcharge * multiplier;
    const riskContribution = logisticsConfig.SYNDIC_RISK_CONTRIBUTION;

    // Logs détaillés du calcul
    console.log(`   💰 CALCUL SURCOÛT CRÉNEAU SYNDIC:`);
    console.log(`      Emplacements concernés: ${locations.join(', ')}`);
    console.log(`      Nombre d'emplacements: ${locations.length}`);
    console.log(`      Surcoût de base: ${baseSurcharge}€`);
    if (multipleLocations) {
      console.log(`      Plusieurs emplacements: Oui (×${multiplier})`);
      console.log(`      Calcul: ${baseSurcharge}€ × ${multiplier} = ${surchargeAmount.toFixed(2)}€`);
    } else {
      console.log(`      Plusieurs emplacements: Non`);
      console.log(`      Calcul: ${baseSurcharge}€ × ${multiplier} = ${surchargeAmount.toFixed(2)}€`);
    }
    console.log(`      Contribution au risque: +${riskContribution} points`);
    console.log(`      = Surcoût total: ${surchargeAmount.toFixed(2)}€`);

    return {
      ...ctx,
      computed: {
        ...computed,
        costs: [
          ...computed.costs,
          {
            moduleId: this.id,
            category: 'ADMINISTRATIVE',
            label: `Surcoût créneau syndic (${locations.join(' et ')})`,
            amount: parseFloat(surchargeAmount.toFixed(2)),
            metadata: {
              locations,
              baseSurcharge,
              multipleLocations,
              multiplier: parseFloat(multiplier.toFixed(2)),
              riskContribution,
            }
          }
        ],
        requirements,
        riskContributions: [
          ...computed.riskContributions,
          {
            moduleId: this.id,
            amount: riskContribution,
            reason: `Créneau syndic requis - Contrainte horaire stricte (${locations.join(', ')})`,
            metadata: {
              locations,
            }
          }
        ],
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        operationalFlags: [
          ...computed.operationalFlags,
          'SYNDIC_TIME_SLOT_REQUIRED'
        ],
        metadata: {
          ...computed.metadata,
          syndicTimeSlotRequired: true,
          syndicLocations: locations,
        }
      }
    };
  }
}

