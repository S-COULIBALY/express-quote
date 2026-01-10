import { QuoteContext, QuoteModule } from '../types/quote-types';
import { createEmptyComputedContext } from '../../core/ComputedContext';
import { MODULES_CONFIG } from '../../config/modules.config';

/**
 * EndOfMonthModule - Applique un surcoût pour les déménagements en fin de mois
 *
 * TYPE : B (conditionnel métier)
 * PRIORITÉ : 80 (PHASE 8 - Options & Cross-Selling)
 *
 * RESPONSABILITÉS :
 * - Détecte si le déménagement a lieu en fin de mois (jour >= 25)
 * - Applique un surcoût pour compenser la demande accrue
 * - Contribue au risque (période de forte demande)
 *
 * LOGIQUE MÉTIER :
 * - Fin de mois = période de forte demande (changements de logement)
 * - Surcoût justifié par la rareté des créneaux disponibles
 * - Augmente le risque opérationnel (planning serré)
 */
export class EndOfMonthModule implements QuoteModule {
  readonly id = 'end-of-month';
  readonly description = 'Surcoût fin de mois (jour >= 25)';
  readonly priority = 80; // PHASE 8 - Options & Cross-Selling

  /**
   * Le module s'applique si le déménagement a lieu en fin de mois (jour >= 25)
   */
  isApplicable(ctx: QuoteContext): boolean {
    if (!ctx.movingDate) {
      return false;
    }

    const threshold = MODULES_CONFIG.temporal.END_OF_MONTH_THRESHOLD_DAY;
    const movingDate = new Date(ctx.movingDate);
    const dayOfMonth = movingDate.getDate();

    return dayOfMonth >= threshold;
  }

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();
    
    // Vérifier que le module est applicable avant d'appliquer le surcoût
    if (!this.isApplicable(ctx)) {
      return ctx;
    }

    const config = MODULES_CONFIG.temporal;
    const surchargePercentage = config.END_OF_MONTH_SURCHARGE_PERCENTAGE;
    const riskContribution = config.END_OF_MONTH_RISK_CONTRIBUTION;

    const movingDate = new Date(ctx.movingDate!);
    const dayOfMonth = movingDate.getDate();
    const monthName = movingDate.toLocaleDateString('fr-FR', { month: 'long' });

    // Calculer le surcoût basé sur le prix de base actuel
    // On utilise la somme des coûts existants comme base
    const currentBasePrice = computed.costs.reduce((sum, cost) => sum + cost.amount, 0);
    const surchargeAmount = currentBasePrice * surchargePercentage;

    // Logs détaillés du calcul
    console.log(`   💰 CALCUL SURCOÛT FIN DE MOIS:`);
    console.log(`      Date: ${dayOfMonth} ${monthName}`);
    console.log(`      Seuil: jour >= ${config.END_OF_MONTH_THRESHOLD_DAY}`);
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
            label: `Surcoût fin de mois (${dayOfMonth} ${monthName})`,
            amount: parseFloat(surchargeAmount.toFixed(2)),
            metadata: {
              dayOfMonth,
              month: monthName,
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
            reason: `Déménagement en fin de mois (${dayOfMonth} ${monthName}) - Période de forte demande`,
            metadata: {
              dayOfMonth,
              month: monthName,
            }
          }
        ],
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        metadata: {
          ...computed.metadata,
          endOfMonthSurchargeApplied: true,
          endOfMonthDay: dayOfMonth,
        }
      }
    };
  }
}

