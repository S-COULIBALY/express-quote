import { QuoteContext, QuoteModule } from '../types/quote-types';
import { createEmptyComputedContext } from '../../core/ComputedContext';
import { MODULES_CONFIG } from '../../config/modules.config';

/**
 * WeekendModule - Applique un surcoût pour les déménagements en week-end
 *
 * TYPE : B (conditionnel métier)
 * PRIORITÉ : 81 (PHASE 8 - Options & Cross-Selling)
 *
 * RESPONSABILITÉS :
 * - Détecte si le déménagement a lieu un samedi ou dimanche
 * - Applique un surcoût pour compenser les heures supplémentaires
 * - Contribue au risque (période de forte demande)
 *
 * LOGIQUE MÉTIER :
 * - Week-end = période de forte demande (disponibilité client)
 * - Surcoût justifié par les heures supplémentaires des déménageurs
 * - Augmente le risque opérationnel (planning serré, fatigue)
 */
export class WeekendModule implements QuoteModule {
  readonly id = 'weekend';
  readonly description = 'Surcoût week-end (samedi ou dimanche)';
  readonly priority = 81; // PHASE 8 - Options & Cross-Selling

  /**
   * Le module s'applique si le déménagement a lieu un samedi (6) ou dimanche (0)
   */
  isApplicable(ctx: QuoteContext): boolean {
    if (!ctx.movingDate) {
      return false;
    }

    const movingDate = new Date(ctx.movingDate);
    const dayOfWeek = movingDate.getDay(); // 0 = dimanche, 6 = samedi

    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();
    
    // Vérifier que le module est applicable avant d'appliquer le surcoût
    if (!this.isApplicable(ctx)) {
      return ctx;
    }

    const config = MODULES_CONFIG.temporal;
    const surchargePercentage = config.WEEKEND_SURCHARGE_PERCENTAGE;
    const riskContribution = config.WEEKEND_RISK_CONTRIBUTION;

    const movingDate = new Date(ctx.movingDate!);
    const dayOfWeek = movingDate.getDay();
    const dayName = dayOfWeek === 0 ? 'dimanche' : 'samedi';

    // Calculer le surcoût basé sur le prix de base actuel
    // On utilise la somme des coûts existants comme base
    const currentBasePrice = computed.costs.reduce((sum, cost) => sum + cost.amount, 0);
    const surchargeAmount = currentBasePrice * surchargePercentage;

    // Logs détaillés du calcul
    console.log(`   💰 CALCUL SURCOÛT WEEK-END:`);
    console.log(`      Jour: ${dayName} (${dayOfWeek === 0 ? 'dimanche' : 'samedi'})`);
    console.log(`      Prix de base: ${currentBasePrice.toFixed(2)}€`);
    console.log(`      Surcoût: ${(surchargePercentage * 100).toFixed(1)}%`);
    console.log(`      Calcul: ${currentBasePrice.toFixed(2)}€ × ${(surchargePercentage * 100).toFixed(1)}% = ${surchargeAmount.toFixed(2)}€`);
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
            category: 'TEMPORAL',
            label: `Surcoût week-end (${dayName})`,
            amount: parseFloat(surchargeAmount.toFixed(2)),
            metadata: {
              dayOfWeek,
              dayName,
              surchargePercentage: parseFloat((surchargePercentage * 100).toFixed(1)),
              basePrice: parseFloat(currentBasePrice.toFixed(2)),
              riskContribution,
            }
          }
        ],
        riskContributions: [
          ...computed.riskContributions,
          {
            moduleId: this.id,
            amount: riskContribution,
            reason: `Déménagement en week-end (${dayName}) - Période de forte demande et heures supplémentaires`,
            metadata: {
              dayOfWeek,
              dayName,
            }
          }
        ],
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        metadata: {
          ...computed.metadata,
          weekendSurchargeApplied: true,
          weekendDay: dayName,
        }
      }
    };
  }
}

