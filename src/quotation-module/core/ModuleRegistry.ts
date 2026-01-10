/**
 * ModuleRegistry - Registre central de tous les modules disponibles
 *
 * RÈGLE CRITIQUE : Chaque module apparaît UNE SEULE FOIS
 * Organisation : Par PHASE (1-9), pas par Type (A/B/C)
 */

import { QuoteModule } from './QuoteModule';

// PHASE 1 - Normalisation & Préparation (10-19)
import { InputSanitizationModule } from '../modules/normalization/InputSanitizationModule';
import { DateValidationModule } from '../modules/normalization/DateValidationModule';
import { AddressNormalizationModule } from '../modules/normalization/AddressNormalizationModule';

// PHASE 2 - Volume & Charge (20-29)
import { VolumeEstimationModule } from '../modules/base/VolumeEstimationModule';
import { VolumeUncertaintyRiskModule } from '../modules/base/VolumeUncertaintyRiskModule';

// PHASE 3 - Distance & Transport (30-39)
import { DistanceModule } from '../modules/costs/transport/DistanceModule';
import { LongDistanceThresholdModule } from '../modules/costs/transport/LongDistanceThresholdModule';
import { FuelCostModule } from '../modules/costs/transport/FuelCostModule';
import { LongDistanceSurchargeModule } from '../modules/costs/transport/LongDistanceSurchargeModule';
import { TollCostModule } from '../modules/costs/transport/TollCostModule';
import { OvernightStopCostModule } from '../modules/costs/transport/OvernightStopCostModule';

// PHASE 4 - Accès & Contraintes Bâtiment (40-49)
import { NoElevatorPickupModule } from '../modules/constraints/NoElevatorPickupModule';
import { NoElevatorDeliveryModule } from '../modules/constraints/NoElevatorDeliveryModule';
import { NavetteRequiredModule } from '../modules/logistics/NavetteRequiredModule';
import { TrafficIdfModule } from '../modules/logistics/TrafficIdfModule';
import { TimeSlotSyndicModule } from '../modules/logistics/TimeSlotSyndicModule';
import { LoadingTimeEstimationModule } from '../modules/logistics/LoadingTimeEstimationModule';

// PHASE 5 - Monte-meubles CRITIQUE (50-59)
import { MonteMeublesRecommendationModule } from '../modules/constraints/MonteMeublesRecommendationModule';
import { MonteMeublesRefusalImpactModule } from '../modules/constraints/MonteMeublesRefusalImpactModule';
import { FurnitureLiftCostModule } from '../modules/constraints/FurnitureLiftCostModule';
import { ManualHandlingRiskCostModule } from '../modules/costs/risk/ManualHandlingRiskCostModule';

// PHASE 6 - Main d'œuvre (60-69)
import { VehicleSelectionModule } from '../modules/costs/vehicle/VehicleSelectionModule';
import { WorkersCalculationModule } from '../modules/costs/labor/WorkersCalculationModule';
import { LaborBaseModule } from '../modules/costs/labor/LaborBaseModule';
import { LaborAccessPenaltyModule } from '../modules/costs/labor/LaborAccessPenaltyModule';
import { CrewFlexibilityModule } from '../modules/costs/labor/CrewFlexibilityModule';

// PHASE 7 - Assurance & Risque (70-79)
import { DeclaredValueValidationModule } from '../modules/risk/DeclaredValueValidationModule';
import { InsurancePremiumModule } from '../modules/risk/InsurancePremiumModule';
import { HighValueItemHandlingModule } from '../modules/risk/HighValueItemHandlingModule';
import { CoOwnershipRulesModule } from '../modules/legal/CoOwnershipRulesModule';
import { NeighborhoodDamageRiskModule } from '../modules/legal/NeighborhoodDamageRiskModule';
import { PublicDomainOccupationModule } from '../modules/legal/PublicDomainOccupationModule';

// PHASE 8 - Options & Cross-Selling (80-89)
import { EndOfMonthModule } from '../modules/temporal/EndOfMonthModule';
import { WeekendModule } from '../modules/temporal/WeekendModule';
import { PackingRequirementModule } from '../modules/cross-selling/PackingRequirementModule';
import { CleaningEndRequirementModule } from '../modules/cross-selling/CleaningEndRequirementModule';
import { StorageRequirementModule } from '../modules/cross-selling/StorageRequirementModule';
import { PackingCostModule } from '../modules/cross-selling/PackingCostModule';
import { CleaningEndCostModule } from '../modules/cross-selling/CleaningEndCostModule';
import { StorageCostModule } from '../modules/cross-selling/StorageCostModule';
import { DismantlingCostModule } from '../modules/cross-selling/DismantlingCostModule';
import { ReassemblyCostModule } from '../modules/cross-selling/ReassemblyCostModule';
import { SuppliesCostModule } from '../modules/cross-selling/SuppliesCostModule';

/**
 * Retourne tous les modules disponibles triés par priorité
 *
 * IMPORTANT : Cette fonction doit retourner TOUS les modules du système.
 * Chaque module n'apparaît qu'une seule fois.
 *
 * @returns Tableau de tous les modules disponibles
 */
export function getAllModules(): QuoteModule[] {
  return [
    // ============================================================================
    // PHASE 1 - Normalisation & Préparation (10-19)
    // ============================================================================
    new InputSanitizationModule(), // 10
    new DateValidationModule(), // 11
    new AddressNormalizationModule(), // 12

    // ============================================================================
    // PHASE 2 - Volume & Charge (20-29)
    // ============================================================================
    new VolumeEstimationModule(), // 20
    new VolumeUncertaintyRiskModule(), // 24

    // ============================================================================
    // PHASE 3 - Distance & Transport (30-39)
    // ============================================================================
    new DistanceModule(), // 30
    new LongDistanceThresholdModule(), // 31
    new FuelCostModule(), // 33
    new LongDistanceSurchargeModule(), // 34 - Forfait exploitation longue distance
    new TollCostModule(), // 35
    new OvernightStopCostModule(), // 36

    // ============================================================================
    // PHASE 4 - Accès & Contraintes Bâtiment (40-49)
    // ============================================================================
    new NoElevatorPickupModule(), // 40
    new NoElevatorDeliveryModule(), // 41
    new NavetteRequiredModule(), // 45
    new TrafficIdfModule(), // 46
    new TimeSlotSyndicModule(), // 47

    // ============================================================================
    // PHASE 5 - Monte-meubles CRITIQUE (50-59)
    // ============================================================================
    new MonteMeublesRecommendationModule(), // 50
    new MonteMeublesRefusalImpactModule(), // 52
    new FurnitureLiftCostModule(), // 53
    new ManualHandlingRiskCostModule(), // 55

    // ============================================================================
    // PHASE 6 - Main d'œuvre (60-69)
    // ============================================================================
    new VehicleSelectionModule(), // 60
    new WorkersCalculationModule(), // 61
    new LaborBaseModule(), // 62
    new LaborAccessPenaltyModule(), // 66
    new CrewFlexibilityModule(), // 67
    new LoadingTimeEstimationModule(), // 68 - Déplacé ici car dépend de workers-calculation

    // ============================================================================
    // PHASE 7 - Assurance & Risque (70-79)
    // ============================================================================
    new DeclaredValueValidationModule(), // 70
    new InsurancePremiumModule(), // 71
    new HighValueItemHandlingModule(), // 73
    new CoOwnershipRulesModule(), // 75
    new NeighborhoodDamageRiskModule(), // 76
    new PublicDomainOccupationModule(), // 77

    // ============================================================================
    // PHASE 8 - Options & Cross-Selling (80-89)
    // ============================================================================
    // Modules temporels
    new EndOfMonthModule(), // 80
    new WeekendModule(), // 81
    // Modules Requirements (déclarent des besoins métier)
    new PackingRequirementModule(), // 82
    new CleaningEndRequirementModule(), // 83
    new StorageRequirementModule(), // 84
    // Modules Cross-Selling (transforment requirements en propositions)
    new PackingCostModule(), // 85
    new CleaningEndCostModule(), // 86
    new DismantlingCostModule(), // 86.5 - Démontage seul
    new ReassemblyCostModule(), // 86.6 - Remontage seul
    new StorageCostModule(), // 87

    // ============================================================================
    // PHASE 9 - Finalisation (90-99)
    // ============================================================================
    new SuppliesCostModule(), // 90 - Fournitures cross-selling (prix fixes)
  ];
}

/**
 * Retourne les modules d'une phase spécifique
 *
 * @param phase Numéro de la phase (1-9)
 * @returns Modules de la phase demandée
 */
export function getModulesByPhase(phase: number): QuoteModule[] {
  const allModules = getAllModules();
  const phaseStart = phase * 10;
  const phaseEnd = phaseStart + 10;

  return allModules.filter(
    (module) => module.priority >= phaseStart && module.priority < phaseEnd
  );
}

/**
 * Retourne un module par son ID
 *
 * @param id ID du module
 * @returns Module trouvé ou undefined
 */
export function getModuleById(id: string): QuoteModule | undefined {
  const allModules = getAllModules();
  return allModules.find((module) => module.id === id);
}

/**
 * Statistiques du registre
 */
export function getRegistryStats() {
  const allModules = getAllModules();

  return {
    total: allModules.length,
    byPhase: {
      phase1: getModulesByPhase(1).length,
      phase2: getModulesByPhase(2).length,
      phase3: getModulesByPhase(3).length,
      phase4: getModulesByPhase(4).length,
      phase5: getModulesByPhase(5).length,
      phase6: getModulesByPhase(6).length,
      phase7: getModulesByPhase(7).length,
      phase8: getModulesByPhase(8).length,
      phase9: getModulesByPhase(9).length,
    },
  };
}
