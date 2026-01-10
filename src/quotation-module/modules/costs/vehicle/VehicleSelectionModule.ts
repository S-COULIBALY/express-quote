import { QuoteContext, QuoteModule } from '../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';
import { MODULES_CONFIG } from '../../../config/modules.config';

/**
 * VehicleSelectionModule - Sélectionne le véhicule approprié selon le volume
 *
 * TYPE : A (systématique)
 * PRIORITÉ : 60 (PHASE 6 - Main d'œuvre)
 * DÉPENDANCES : Nécessite que le volume soit calculé (VolumeEstimationModule)
 *
 * RESPONSABILITÉS :
 * - Détermine le type de véhicule selon le volume (≤12 m³, ≤20 m³, ≤30 m³)
 * - Calcule le nombre de véhicules nécessaires selon la capacité
 * - Calcule le coût de location des véhicules
 */
export class VehicleSelectionModule implements QuoteModule {
  readonly id = 'vehicle-selection';
  readonly description = "Sélectionne le véhicule approprié selon le volume";
  readonly priority = 60;
  readonly dependencies = ['volume-estimation'];

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();
    const vehicleConfig = MODULES_CONFIG.vehicle;
    
    // Vérifier que le volume est disponible
    const adjustedVolume = computed.adjustedVolume;
    if (!adjustedVolume || adjustedVolume <= 0) {
      // Volume non calculé, utiliser un véhicule par défaut
      const defaultVehicleType = vehicleConfig.DEFAULT_VEHICLE_TYPE;
      const defaultCost = vehicleConfig.VEHICLE_COSTS[defaultVehicleType];
      
      return {
        ...ctx,
        computed: {
          ...computed,
          vehicleCount: 1,
          vehicleTypes: [defaultVehicleType],
          costs: [
            ...computed.costs,
            {
              moduleId: this.id,
              label: `Location véhicule ${defaultVehicleType} (défaut)`,
              amount: defaultCost,
              category: 'VEHICLE',
              metadata: { vehicleType: defaultVehicleType }
            }
          ],
          activatedModules: [
            ...computed.activatedModules,
            this.id
          ]
        }
      };
    }

    // Calculer la sélection optimale de véhicules
    const vehicleSelection = this.calculateOptimalVehicleSelection(adjustedVolume);
    const totalVehicleCost = vehicleSelection.totalCost;

    // Logs détaillés du calcul
    console.log(`   💰 CALCUL COÛT VÉHICULE:`);
    console.log(`      Volume ajusté: ${adjustedVolume.toFixed(2)} m³`);
    console.log(`      Sélection optimale:`);
    
    // Véhicule principal
    console.log(`         Véhicule principal: ${vehicleSelection.primary.type} (${vehicleSelection.primary.capacity} m³)`);
    console.log(`            Volume utilisé: ${vehicleSelection.primary.volumeUsed.toFixed(2)} m³`);
    console.log(`            Coût: ${vehicleSelection.primary.cost}€`);
    
    // Véhicule complémentaire si nécessaire
    if (vehicleSelection.secondary) {
      console.log(`         Véhicule complémentaire: ${vehicleSelection.secondary.type} (${vehicleSelection.secondary.capacity} m³)`);
      console.log(`            Volume restant: ${vehicleSelection.secondary.volumeUsed.toFixed(2)} m³`);
      console.log(`            Capacité la plus proche: ${vehicleSelection.secondary.capacity} m³`);
      console.log(`            Coût: ${vehicleSelection.secondary.cost}€`);
    }
    
    console.log(`      Calcul: ${vehicleSelection.primary.cost}€${vehicleSelection.secondary ? ` + ${vehicleSelection.secondary.cost}€` : ''} = ${totalVehicleCost.toFixed(2)}€`);
    console.log(`      = Coût total: ${totalVehicleCost.toFixed(2)}€`);

    // Construire le label et les types de véhicules
    const vehicleTypes = [vehicleSelection.primary.type];
    if (vehicleSelection.secondary) {
      vehicleTypes.push(vehicleSelection.secondary.type);
    }
    const vehicleCount = vehicleTypes.length;
    const label = vehicleSelection.secondary 
      ? `Location véhicules ${vehicleSelection.primary.type} + ${vehicleSelection.secondary.type}`
      : `Location véhicule ${vehicleSelection.primary.type}`;

    return {
      ...ctx,
      computed: {
        ...computed,
        // Utiliser la structure standard
        vehicleCount,
        vehicleTypes,
        // Utiliser costs comme tableau
        costs: [
          ...computed.costs,
          {
            moduleId: this.id,
            label,
            amount: parseFloat(totalVehicleCost.toFixed(2)),
            category: 'VEHICLE',
            metadata: {
              primaryVehicle: vehicleSelection.primary.type,
              primaryVehicleCost: vehicleSelection.primary.cost,
              primaryVehicleCapacity: vehicleSelection.primary.capacity,
              primaryVolumeUsed: vehicleSelection.primary.volumeUsed,
              secondaryVehicle: vehicleSelection.secondary?.type || null,
              secondaryVehicleCost: vehicleSelection.secondary?.cost || null,
              secondaryVehicleCapacity: vehicleSelection.secondary?.capacity || null,
              secondaryVolumeUsed: vehicleSelection.secondary?.volumeUsed || null,
              totalCost: totalVehicleCost,
              volumeUsed: parseFloat(adjustedVolume.toFixed(2)),
            }
          }
        ],
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        metadata: {
          ...computed.metadata,
          selectedVehicleType: vehicleSelection.primary.type,
          vehicleSelectionCriteria: this.getSelectionCriteria(adjustedVolume),
        }
      }
    };
  }

  /**
   * Calcule la sélection optimale de véhicules
   * 
   * STRATÉGIE :
   * 1. Détermine le véhicule principal selon le volume total
   * 2. Si le volume dépasse la capacité, calcule le volume restant
   * 3. Sélectionne le véhicule avec la capacité la plus proche pour le volume restant
   */
  private calculateOptimalVehicleSelection(adjustedVolume: number): {
    primary: { type: string; capacity: number; cost: number; volumeUsed: number };
    secondary?: { type: string; capacity: number; cost: number; volumeUsed: number };
    totalCost: number;
  } {
    const vehicleConfig = MODULES_CONFIG.vehicle;
    
    // 1. Déterminer le véhicule principal
    const primaryType = this.determineVehicleType(adjustedVolume);
    const primaryCapacity = vehicleConfig.VEHICLE_CAPACITIES[primaryType];
    const primaryCost = vehicleConfig.VEHICLE_COSTS[primaryType];
    
    // 2. Calculer le volume utilisé par le véhicule principal
    const primaryVolumeUsed = Math.min(adjustedVolume, primaryCapacity);
    const remainingVolume = Math.max(0, adjustedVolume - primaryCapacity);
    
    // 3. Si volume restant, sélectionner le véhicule optimal
    let secondary: { type: string; capacity: number; cost: number; volumeUsed: number } | undefined;
    
    if (remainingVolume > 0) {
      const secondaryType = this.findBestVehicleForVolume(remainingVolume);
      const secondaryCapacity = vehicleConfig.VEHICLE_CAPACITIES[secondaryType];
      const secondaryCost = vehicleConfig.VEHICLE_COSTS[secondaryType];
      
      secondary = {
        type: secondaryType,
        capacity: secondaryCapacity,
        cost: secondaryCost,
        volumeUsed: remainingVolume,
      };
    }
    
    // 4. Calculer le coût total
    const totalCost = primaryCost + (secondary ? secondary.cost : 0);
    
    return {
      primary: {
        type: primaryType,
        capacity: primaryCapacity,
        cost: primaryCost,
        volumeUsed: primaryVolumeUsed,
      },
      secondary,
      totalCost,
    };
  }

  /**
   * Détermine le type de véhicule requis selon le volume
   * 
   * LOGIQUE SIMPLIFIÉE :
   * - CAMION_12M3 (80€) si volume ≤ 12 m³
   * - CAMION_20M3 (250€) si volume ≤ 20 m³ (défaut)
   * - CAMION_30M3 (350€) si volume ≤ 30 m³
   */
  private determineVehicleType(adjustedVolume: number): 'CAMION_12M3' | 'CAMION_20M3' | 'CAMION_30M3' {
    const thresholds = MODULES_CONFIG.vehicle.VOLUME_THRESHOLDS;
    
    if (adjustedVolume <= thresholds.CAMION_12M3) {
      return 'CAMION_12M3';
    } else if (adjustedVolume <= thresholds.CAMION_20M3) {
      return 'CAMION_20M3';
    } else {
      return 'CAMION_30M3';
    }
  }

  /**
   * Trouve le véhicule avec la capacité la plus proche pour un volume donné
   * 
   * STRATÉGIE : 
   * 1. Priorité : Capacité supérieure ou égale la plus proche (peut contenir le volume)
   * 2. Fallback : Si aucune capacité suffisante, prendre la plus grande disponible
   * 
   * Exemples :
   * - Volume 5 m³ → CAMION_12M3 (12 ≥ 5, distance 7)
   * - Volume 15 m³ → CAMION_20M3 (20 ≥ 15, distance 5) et non CAMION_12M3 (12 < 15, insuffisant)
   * - Volume 25 m³ → CAMION_30M3 (30 ≥ 25, distance 5)
   */
  private findBestVehicleForVolume(volume: number): 'CAMION_12M3' | 'CAMION_20M3' | 'CAMION_30M3' {
    const vehicleConfig = MODULES_CONFIG.vehicle;
    const capacities = vehicleConfig.VEHICLE_CAPACITIES;
    
    // 1. Filtrer les véhicules avec capacité suffisante (≥ volume)
    const sufficientVehicles: Array<{ type: 'CAMION_12M3' | 'CAMION_20M3' | 'CAMION_30M3'; capacity: number; distance: number }> = [];
    
    if (capacities.CAMION_12M3 >= volume) {
      sufficientVehicles.push({
        type: 'CAMION_12M3',
        capacity: capacities.CAMION_12M3,
        distance: capacities.CAMION_12M3 - volume, // Distance positive (sur-capacité)
      });
    }
    if (capacities.CAMION_20M3 >= volume) {
      sufficientVehicles.push({
        type: 'CAMION_20M3',
        capacity: capacities.CAMION_20M3,
        distance: capacities.CAMION_20M3 - volume,
      });
    }
    if (capacities.CAMION_30M3 >= volume) {
      sufficientVehicles.push({
        type: 'CAMION_30M3',
        capacity: capacities.CAMION_30M3,
        distance: capacities.CAMION_30M3 - volume,
      });
    }
    
    // 2. Si des véhicules suffisants existent, choisir celui avec la distance minimale (sur-capacité minimale)
    if (sufficientVehicles.length > 0) {
      // Trier par distance croissante (sur-capacité minimale)
      sufficientVehicles.sort((a, b) => a.distance - b.distance);
      return sufficientVehicles[0].type;
    }
    
    // 3. Fallback : Si aucun véhicule suffisant (cas théorique), prendre le plus grand
    return 'CAMION_30M3';
  }

  /**
   * Retourne le critère de sélection utilisé (pour métadonnées)
   */
  private getSelectionCriteria(adjustedVolume: number): string {
    const thresholds = MODULES_CONFIG.vehicle.VOLUME_THRESHOLDS;
    
    if (adjustedVolume <= thresholds.CAMION_12M3) {
      return `volume ≤ ${thresholds.CAMION_12M3} m³`;
    } else if (adjustedVolume <= thresholds.CAMION_20M3) {
      return `volume ≤ ${thresholds.CAMION_20M3} m³`;
    } else {
      return `volume ≤ ${thresholds.CAMION_30M3} m³`;
    }
  }
}