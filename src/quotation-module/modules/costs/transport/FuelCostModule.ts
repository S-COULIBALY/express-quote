import { QuoteContext, QuoteModule } from '../../types/quote-types';
import { MODULES_CONFIG } from '../../../config/modules.config';

/**
 * FuelCostModule - Calcule le coût carburant basé sur la distance
 *
 * DÉPENDANCES :
 * - Nécessite que DistanceModule ait été exécuté avant (priority 30)
 * - Lit computed.distanceKm
 */
export class FuelCostModule implements QuoteModule {
  readonly id = 'fuel-cost';
  readonly description = 'Calcule le coût carburant pour le trajet';
  readonly priority = 33; // Après DistanceModule (30)
  readonly dependencies = ['distance-calculation'];

  apply(ctx: QuoteContext): QuoteContext {
    // Vérification des prérequis : distance doit être calculée
    const distanceKm = ctx.computed?.distanceKm;

    if (!distanceKm || distanceKm <= 0) {
      // Pas de distance valide, le module ne s'applique pas
      return ctx;
    }

    // Calcul du coût carburant
    const fuelConfig = MODULES_CONFIG.fuel;
    const fuelPricePerLiter = fuelConfig.PRICE_PER_LITER;
    const vehicleConsumption = fuelConfig.VEHICLE_CONSUMPTION_L_PER_100KM;
    
    const fuelConsumptionLiters = (distanceKm / 100) * vehicleConsumption;
    const fuelCost = fuelConsumptionLiters * fuelPricePerLiter;

    // Logs détaillés du calcul
    console.log(`   💰 CALCUL COÛT CARBURANT:`);
    console.log(`      Distance: ${distanceKm.toFixed(2)} km`);
    console.log(`      Consommation véhicule: ${vehicleConsumption} L/100km`);
    console.log(`      Calcul consommation: ${distanceKm.toFixed(2)} km / 100 × ${vehicleConsumption} L/100km = ${fuelConsumptionLiters.toFixed(2)} L`);
    console.log(`      Prix carburant: ${fuelPricePerLiter}€/L`);
    console.log(`      Calcul coût: ${fuelConsumptionLiters.toFixed(2)} L × ${fuelPricePerLiter}€/L = ${fuelCost.toFixed(2)}€`);
    console.log(`      = Coût total: ${fuelCost.toFixed(2)}€`);

    return {
      ...ctx,
      computed: {
        ...ctx.computed,
        costs: [
          ...(ctx.computed?.costs || []),
          {
            moduleId: this.id,
            category: 'TRANSPORT',
            label: 'Coût carburant',
            amount: parseFloat(fuelCost.toFixed(2)),
            metadata: {
              distanceKm: parseFloat(distanceKm.toFixed(2)),
              fuelConsumptionLiters: parseFloat(fuelConsumptionLiters.toFixed(2)),
              fuelPricePerLiter,
              vehicleConsumption,
            }
          }
        ],
        adjustments: ctx.computed?.adjustments || [],
        riskContributions: ctx.computed?.riskContributions || [],
        legalImpacts: ctx.computed?.legalImpacts || [],
        insuranceNotes: ctx.computed?.insuranceNotes || [],
        requirements: ctx.computed?.requirements || [],
        crossSellProposals: ctx.computed?.crossSellProposals || [],
        operationalFlags: ctx.computed?.operationalFlags || [],
        activatedModules: [
          ...(ctx.computed?.activatedModules || []),
          this.id
        ],
        metadata: ctx.computed?.metadata || {}
      }
    };
  }

  /**
   * Le module s'applique toujours (Type A)
   * La dépendance est vérifiée par le moteur via hasDependencies()
   * La vérification de distanceKm se fait dans apply()
   */
  // Pas de isApplicable() - Type A (inconditionnel)
}
