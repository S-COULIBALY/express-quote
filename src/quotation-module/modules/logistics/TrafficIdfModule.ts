import { QuoteContext, QuoteModule } from '../types/quote-types';
import { createEmptyComputedContext } from '../../core/ComputedContext';
import { MODULES_CONFIG } from '../../config/modules.config';

/**
 * TrafficIdfModule - Détecte si le trafic IDF impacte le déménagement
 *
 * TYPE : B (conditionnel métier)
 * PRIORITÉ : 46 (PHASE 4 - Accès & Contraintes Bâtiment)
 *
 * RESPONSABILITÉS :
 * - Détecte les heures de pointe IDF (7h-9h, 17h-19h)
 * - Détecte les jours de forte circulation (vendredi après-midi)
 * - Applique un surcoût pour compenser les retards et la consommation accrue
 *
 * LOGIQUE MÉTIER :
 * - Heures de pointe : 7h-9h (matin) et 17h-19h (soir) → surcoût 1%
 * - Vendredi après-midi : trafic dense (départs en week-end) → surcoût 2% (prioritaire)
 * - Si les deux conditions sont vraies, le vendredi après-midi est prioritaire (2%)
 */
export class TrafficIdfModule implements QuoteModule {
  readonly id = 'traffic-idf';
  readonly description = 'Détecte si le trafic IDF impacte le déménagement';
  readonly priority = 46; // PHASE 4 - Accès & Contraintes Bâtiment

  /**
   * Le module s'applique si le déménagement a lieu pendant les heures de pointe ou vendredi après-midi
   */
  isApplicable(ctx: QuoteContext): boolean {
    if (!ctx.movingDate) {
      return false;
    }

    const movingDate = new Date(ctx.movingDate);
    // Utiliser getUTCHours() pour être cohérent avec les dates ISO (UTC)
    // En production, on pourrait convertir en heure locale IDF si nécessaire
    const hour = movingDate.getUTCHours();
    const dayOfWeek = movingDate.getUTCDay(); // 0 = dimanche, 5 = vendredi

    const rushHours = MODULES_CONFIG.logistics.RUSH_HOURS;
    const fridayAfternoon = MODULES_CONFIG.logistics.FRIDAY_AFTERNOON;

    // Heures de pointe : 7h-9h (matin) et 17h-19h (soir)
    const isRushHour = (hour >= rushHours.MORNING_START && hour < rushHours.MORNING_END) ||
                       (hour >= rushHours.EVENING_START && hour < rushHours.EVENING_END);

    // Vendredi après-midi : 14h-19h
    const isFridayAfternoon = dayOfWeek === 5 && hour >= fridayAfternoon.START && hour < fridayAfternoon.END;

    return isRushHour || isFridayAfternoon;
  }

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();

    if (!this.isApplicable(ctx) || !ctx.movingDate) {
      return ctx;
    }

    const movingDate = new Date(ctx.movingDate);
    const hour = movingDate.getUTCHours();
    const dayOfWeek = movingDate.getUTCDay();
    const dayName = movingDate.toLocaleDateString('fr-FR', { weekday: 'long' });

    const rushHours = MODULES_CONFIG.logistics.RUSH_HOURS;
    const fridayAfternoon = MODULES_CONFIG.logistics.FRIDAY_AFTERNOON;
    const trafficConfig = MODULES_CONFIG.logistics.TRAFFIC_IDF;

    const isRushHour = (hour >= rushHours.MORNING_START && hour < rushHours.MORNING_END) ||
                       (hour >= rushHours.EVENING_START && hour < rushHours.EVENING_END);
    const isFridayAfternoon = dayOfWeek === 5 && hour >= fridayAfternoon.START && hour < fridayAfternoon.END;

    // Déterminer le surcoût et la raison
    // PRIORITÉ : Vendredi après-midi (2%) est prioritaire sur heures de pointe (1%)
    let surchargePercentage = 0;
    let reason = '';

    if (isFridayAfternoon) {
      surchargePercentage = trafficConfig.FRIDAY_AFTERNOON_SURCHARGE;
      reason = `Vendredi après-midi (trafic dense - départs en week-end)`;
    } else if (isRushHour) {
      surchargePercentage = trafficConfig.RUSH_HOUR_SURCHARGE;
      const period = hour >= rushHours.MORNING_START && hour < rushHours.MORNING_END ? 'matin' : 'soir';
      reason = `Heures de pointe ${period} (${hour}h-${hour + 1}h)`;
    }

    // Calculer le surcoût basé sur les coûts de transport existants
    const transportCosts = computed.costs
      .filter(c => c.category === 'TRANSPORT')
      .reduce((sum, c) => sum + c.amount, 0);

    const surchargeAmount = transportCosts * surchargePercentage;

    // Log des calculs
    console.log(`   💰 CALCUL SURCOÛT TRAFIC IDF:`);
    console.log(`      Date: ${dayName} ${hour}h`);
    console.log(`      Heure de pointe: ${isRushHour ? 'Oui' : 'Non'}`);
    console.log(`      Vendredi après-midi: ${isFridayAfternoon ? 'Oui' : 'Non'}`);
    console.log(`      Coûts transport: ${transportCosts.toFixed(2)}€`);
    console.log(`      Surcoût appliqué: ${(surchargePercentage * 100).toFixed(1)}% (${reason})`);
    console.log(`      = ${transportCosts.toFixed(2)}€ × ${(surchargePercentage * 100).toFixed(1)}% = ${surchargeAmount.toFixed(2)}€`);

    return {
      ...ctx,
      computed: {
        ...computed,
        costs: [
          ...computed.costs,
          {
            moduleId: this.id,
            category: 'TRANSPORT',
            label: `Surcoût trafic IDF (${reason})`,
            amount: parseFloat(surchargeAmount.toFixed(2)),
            metadata: {
              hour,
              dayOfWeek,
              dayName,
              isRushHour,
              isFridayAfternoon,
              surchargePercentage: surchargePercentage * 100,
              transportCosts,
            }
          }
        ],
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        operationalFlags: [
          ...computed.operationalFlags,
          'TRAFFIC_IDF_IMPACT'
        ],
        metadata: {
          ...computed.metadata,
          trafficIdfImpact: true,
          trafficReason: reason,
        }
      }
    };
  }
}

