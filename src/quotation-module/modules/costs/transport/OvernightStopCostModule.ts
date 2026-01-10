import { QuoteContext, QuoteModule } from '../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';
import { MODULES_CONFIG } from '../../../config/modules.config';

/**
 * OvernightStopCostModule - Calcule le coût d'un arrêt nuit pour longue distance
 *
 * TYPE : C (déclenché par état calculé)
 * PRIORITÉ : 36 (PHASE 3 - Distance & Transport)
 * DÉPENDANCES : distance-calculation, long-distance-threshold
 *
 * RESPONSABILITÉS :
 * - Ajoute le coût d'hébergement équipe si trajet > 1000km ET forceOvernightStop = true
 * - Ajoute le coût de parking sécurisé du camion
 * - Applicable pour les déménagements très longue distance (IDF → Province lointaine)
 *
 * CONDITIONS D'APPLICATION :
 * - Distance > 1000km ET forceOvernightStop === true (les deux conditions requises)
 *
 * TARIFICATION :
 * - Hébergement équipe : 120€ par déménageur (nuit + petit-déjeuner)
 * - Parking sécurisé camion : 50€ (parking gardé ou aire sécurisée)
 * - Indemnité repas équipe : 30€ par déménageur (dîner)
 */
export class OvernightStopCostModule implements QuoteModule {
  readonly id = 'overnight-stop-cost';
  readonly description = 'Calcule le coût d\'un arrêt nuit pour très longue distance (>1000 km)';
  readonly priority = 36; // PHASE 3 - Distance & Transport
  readonly dependencies = ['distance-calculation'];

  /**
   * Le module s'applique si :
   * - Distance > 1000km ET forceOvernightStop === true (les deux conditions requises)
   */
  isApplicable(ctx: QuoteContext): boolean {
    const computed = ctx.computed;
    if (!computed) {
      return false;
    }

    // Vérifier si très longue distance (>1000km)
    const distanceKm = computed.distanceKm || ctx.distance || 0;
    const threshold = MODULES_CONFIG.distance.OVERNIGHT_STOP_THRESHOLD_KM;
    const isVeryLongDistance = distanceKm > threshold;

    // Vérifier si forcé explicitement (scénario FLEX)
    const isForcedByScenario = ctx.forceOvernightStop === true;

    // Les deux conditions doivent être vraies
    return isVeryLongDistance && isForcedByScenario;
  }

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();

    if (!this.isApplicable(ctx)) {
      return ctx;
    }

    // Nombre de déménageurs (par défaut 2 si non calculé)
    const workersCount = computed.workersCount || 2;
    const distanceKm = computed.distanceKm || ctx.distance || 0;
    const threshold = MODULES_CONFIG.distance.OVERNIGHT_STOP_THRESHOLD_KM;
    const config = MODULES_CONFIG.logistics.OVERNIGHT_STOP;

    // Calculer les coûts
    const hotelCost = workersCount * config.HOTEL_COST_PER_WORKER;
    const parkingCost = config.SECURE_PARKING_COST;
    const mealCost = workersCount * config.MEAL_ALLOWANCE_PER_WORKER;
    const totalCost = hotelCost + parkingCost + mealCost;

    // Log des calculs
    console.log(`   💰 CALCUL COÛT ARRÊT NUIT:`);
    console.log(`      Distance: ${distanceKm} km (seuil: ${threshold} km)`);
    console.log(`      Arrêt nuit forcé: Oui (forceOvernightStop = true)`);
    console.log(`      Nombre déménageurs: ${workersCount}`);
    console.log(`      Hébergement: ${workersCount} × ${config.HOTEL_COST_PER_WORKER}€ = ${hotelCost}€`);
    console.log(`      Parking sécurisé: ${parkingCost}€`);
    console.log(`      Repas équipe: ${workersCount} × ${config.MEAL_ALLOWANCE_PER_WORKER}€ = ${mealCost}€`);
    console.log(`      = Total: ${totalCost.toFixed(2)}€`);

    // Ajouter un requirement pour informer le client
    const requirements = [...computed.requirements];
    requirements.push({
      type: 'OVERNIGHT_STOP_REQUIRED',
      severity: 'MEDIUM',
      reason: `Arrêt nuit obligatoire pour un trajet de ${Math.round(distanceKm)} km. ` +
              `L'équipe doit respecter les temps de repos réglementaires (conduite max 9h/jour). ` +
              `Le camion sera stationné dans un parking sécurisé.`,
      moduleId: this.id,
      metadata: {
        distanceKm,
        workersCount,
        threshold,
      }
    });

    return {
      ...ctx,
      computed: {
        ...computed,
        costs: [
          ...computed.costs,
          {
            moduleId: this.id,
            category: 'LOGISTICS', // Hébergement, arrêts, logistique
            label: `Arrêt nuit équipe (${workersCount} pers. + parking sécurisé)`,
            amount: parseFloat(totalCost.toFixed(2)),
            metadata: {
              distanceKm,
              threshold,
              workersCount,
              hotelCost: parseFloat(hotelCost.toFixed(2)),
              parkingCost: parseFloat(parkingCost.toFixed(2)),
              mealCost: parseFloat(mealCost.toFixed(2)),
              hotelCostPerWorker: config.HOTEL_COST_PER_WORKER,
              mealAllowancePerWorker: config.MEAL_ALLOWANCE_PER_WORKER,
              breakdown: {
                hotel: `${workersCount} × ${config.HOTEL_COST_PER_WORKER}€ = ${hotelCost}€`,
                parking: `${parkingCost}€`,
                meals: `${workersCount} × ${config.MEAL_ALLOWANCE_PER_WORKER}€ = ${mealCost}€`,
              }
            }
          }
        ],
        requirements,
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        operationalFlags: [
          ...computed.operationalFlags,
          'OVERNIGHT_STOP_REQUIRED',
        ],
        metadata: {
          ...computed.metadata,
          overnightStopRequired: true,
          overnightStopCost: parseFloat(totalCost.toFixed(2)),
        }
      }
    };
  }
}
