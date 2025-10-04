import { DefaultValues } from "./DefaultValues";
import { createDefaultConfigurations } from "./DefaultConfigurations";
import {
  PricingConfigKey,
  BusinessRulesConfigKey,
  BusinessTypePricingConfigKey,
} from "./ConfigurationKey";

/**
 * Script de validation pour s'assurer que DefaultValues.ts et DefaultConfigurations.ts
 * sont parfaitement synchronisés et cohérents.
 */

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalConfigurations: number;
    validatedConfigurations: number;
    missingConfigurations: number;
  };
}

/**
 * Valide que toutes les configurations par défaut utilisent DefaultValues
 */
export function validateDefaultConfigurationsConsistency(): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    summary: {
      totalConfigurations: 0,
      validatedConfigurations: 0,
      missingConfigurations: 0,
    },
  };

  try {
    // 1. Valider les valeurs de DefaultValues
    const defaultValuesValidation = DefaultValues.validateValues();
    if (!defaultValuesValidation.isValid) {
      result.errors.push(...defaultValuesValidation.errors);
      result.isValid = false;
    }

    // 2. Récupérer toutes les configurations créées
    const configurations = createDefaultConfigurations();
    result.summary.totalConfigurations = configurations.length;

    // 3. ✅ Mapper les valeurs attendues depuis DefaultValues (APRÈS NETTOYAGE)
    const expectedPricingValues = {
      // Distance & Prix par km
      [PricingConfigKey.UNIT_PRICE_PER_KM]: DefaultValues.UNIT_PRICE_PER_KM,
      [PricingConfigKey.INCLUDED_DISTANCE]: DefaultValues.INCLUDED_DISTANCE,

      // Taux horaire générique
      [PricingConfigKey.SERVICE_WORKER_PRICE_PER_HOUR]:
        DefaultValues.SERVICE_WORKER_PRICE_PER_HOUR,

      // Fiscalité
      [PricingConfigKey.VAT_RATE]: DefaultValues.VAT_RATE,
      [PricingConfigKey.DEPOSIT_PERCENTAGE]: DefaultValues.DEPOSIT_PERCENTAGE,

      // Transport partagé
      [PricingConfigKey.FUEL_CONSUMPTION_PER_100KM]:
        DefaultValues.FUEL_CONSUMPTION_PER_100KM,
      [PricingConfigKey.FUEL_PRICE_PER_LITER]:
        DefaultValues.FUEL_PRICE_PER_LITER,
      [PricingConfigKey.TOLL_COST_PER_KM]: DefaultValues.TOLL_COST_PER_KM,
      [PricingConfigKey.HIGHWAY_RATIO]: DefaultValues.HIGHWAY_RATIO,

      // Multiplicateurs & Réductions
      [PricingConfigKey.HOURLY_RATE_MULTIPLIER]:
        DefaultValues.HOURLY_RATE_MULTIPLIER,
      [PricingConfigKey.DAILY_RATE_MULTIPLIER]:
        DefaultValues.DAILY_RATE_MULTIPLIER,
      [PricingConfigKey.WEEKLY_RATE_MULTIPLIER]:
        DefaultValues.WEEKLY_RATE_MULTIPLIER,
      [PricingConfigKey.EXTRA_DAY_DISCOUNT_RATE]:
        DefaultValues.EXTRA_DAY_DISCOUNT_RATE,
      [PricingConfigKey.EXTRA_WORKER_DISCOUNT_RATE]:
        DefaultValues.EXTRA_WORKER_DISCOUNT_RATE,
      [PricingConfigKey.VOLUME_DISCOUNT_THRESHOLD_M3]:
        DefaultValues.VOLUME_DISCOUNT_THRESHOLD_M3,
      [PricingConfigKey.VOLUME_DISCOUNT_RATE]:
        DefaultValues.VOLUME_DISCOUNT_RATE,
      [PricingConfigKey.FREE_DELIVERY_DISTANCE_KM]:
        DefaultValues.FREE_DELIVERY_DISTANCE_KM,

      // Équipement & Matériel
      [PricingConfigKey.EQUIPMENT_RENTAL_DAILY]:
        DefaultValues.EQUIPMENT_RENTAL_DAILY,
      [PricingConfigKey.MATERIAL_COST_PER_M3]:
        DefaultValues.MATERIAL_COST_PER_M3,
      [PricingConfigKey.PROTECTIVE_EQUIPMENT_COST]:
        DefaultValues.PROTECTIVE_EQUIPMENT_COST,

      // Opérationnel
      [PricingConfigKey.MAX_WORKERS_PER_VEHICLE]:
        DefaultValues.MAX_WORKERS_PER_VEHICLE,
      [PricingConfigKey.MAX_VOLUME_PER_VEHICLE_M3]:
        DefaultValues.MAX_VOLUME_PER_VEHICLE_M3,
      [PricingConfigKey.STANDARD_SERVICE_DURATION_HOURS]:
        DefaultValues.STANDARD_SERVICE_DURATION_HOURS,
      [PricingConfigKey.OVERTIME_RATE_MULTIPLIER]:
        DefaultValues.OVERTIME_RATE_MULTIPLIER,
      [PricingConfigKey.HOURS_PER_DAY]: DefaultValues.HOURS_PER_DAY,

      // Assurance
      [PricingConfigKey.INSURANCE_PRICE_HT]: DefaultValues.INSURANCE_PRICE_HT,
      [PricingConfigKey.INSURANCE_PRICE_TTC]: DefaultValues.INSURANCE_PRICE_TTC,
      [PricingConfigKey.INSURANCE_COVERAGE_MINIMUM]:
        DefaultValues.INSURANCE_COVERAGE_MINIMUM,

      // Qualité & Sécurité
      [PricingConfigKey.QUALITY_GUARANTEE_DAYS]:
        DefaultValues.QUALITY_GUARANTEE_DAYS,
      [PricingConfigKey.SAFETY_EQUIPMENT_REQUIRED]:
        DefaultValues.SAFETY_EQUIPMENT_REQUIRED ? 1 : 0,

      // Professionnels
      [PricingConfigKey.PROFESSIONAL_DEFAULT_SEARCH_RADIUS_KM]:
        DefaultValues.PROFESSIONAL_DEFAULT_SEARCH_RADIUS_KM,

      // Auto-détection
      [PricingConfigKey.FURNITURE_LIFT_FLOOR_THRESHOLD]:
        DefaultValues.FURNITURE_LIFT_FLOOR_THRESHOLD,
      [PricingConfigKey.FURNITURE_LIFT_SURCHARGE]:
        DefaultValues.FURNITURE_LIFT_SURCHARGE,
      [PricingConfigKey.LONG_CARRYING_DISTANCE_THRESHOLD]:
        DefaultValues.LONG_CARRYING_DISTANCE_THRESHOLD,
      [PricingConfigKey.LONG_CARRYING_DISTANCE_SURCHARGE]:
        DefaultValues.LONG_CARRYING_DISTANCE_SURCHARGE,
    };

    // NOTE: Les règles métier sont maintenant commentées dans DefaultValues.ts
    // Elles ne sont plus validées pour l'instant
    const expectedBusinessRulesValues = {};

    // Configurations TARIFS PAR TYPE DE SERVICE MÉTIER
    const expectedBusinessTypePricingValues = {
      // DÉMÉNAGEMENT
      [BusinessTypePricingConfigKey.MOVING_BASE_PRICE_PER_M3]:
        DefaultValues.MOVING_BASE_PRICE_PER_M3,
      [BusinessTypePricingConfigKey.MOVING_WORKER_PRICE]:
        DefaultValues.MOVING_WORKER_PRICE,
      [BusinessTypePricingConfigKey.MOVING_WORKER_HOUR_RATE]:
        DefaultValues.MOVING_WORKER_HOUR_RATE,
      [BusinessTypePricingConfigKey.MOVING_EXTRA_HOUR_RATE]:
        DefaultValues.MOVING_EXTRA_HOUR_RATE,
      [BusinessTypePricingConfigKey.MOVING_LIFT_PRICE]:
        DefaultValues.MOVING_LIFT_PRICE,
      [BusinessTypePricingConfigKey.MOVING_VEHICLE_FLAT_FEE]:
        DefaultValues.MOVING_VEHICLE_FLAT_FEE,

      // NETTOYAGE
      [BusinessTypePricingConfigKey.CLEANING_PRICE_PER_M2]:
        DefaultValues.CLEANING_PRICE_PER_M2,
      [BusinessTypePricingConfigKey.CLEANING_WORKER_PRICE]:
        DefaultValues.CLEANING_WORKER_PRICE,
      [BusinessTypePricingConfigKey.CLEANING_WORKER_HOUR_RATE]:
        DefaultValues.CLEANING_WORKER_HOUR_RATE,
      [BusinessTypePricingConfigKey.CLEANING_EXTRA_HOUR_RATE]:
        DefaultValues.CLEANING_EXTRA_HOUR_RATE,
      [BusinessTypePricingConfigKey.CLEANING_MINIMUM_PRICE]:
        DefaultValues.CLEANING_MINIMUM_PRICE,

      // LIVRAISON
      [BusinessTypePricingConfigKey.DELIVERY_BASE_PRICE]:
        DefaultValues.DELIVERY_BASE_PRICE,
      [BusinessTypePricingConfigKey.DELIVERY_PRICE_PER_KM]:
        DefaultValues.DELIVERY_PRICE_PER_KM,
      [BusinessTypePricingConfigKey.DELIVERY_WORKER_HOUR_RATE]:
        DefaultValues.DELIVERY_WORKER_HOUR_RATE,
      [BusinessTypePricingConfigKey.DELIVERY_EXTRA_HOUR_RATE]:
        DefaultValues.DELIVERY_EXTRA_HOUR_RATE,
      [BusinessTypePricingConfigKey.DELIVERY_WEIGHT_SURCHARGE]:
        DefaultValues.DELIVERY_WEIGHT_SURCHARGE,

      // TRANSPORT
      [BusinessTypePricingConfigKey.TRANSPORT_BASE_PRICE]:
        DefaultValues.TRANSPORT_BASE_PRICE,
      [BusinessTypePricingConfigKey.TRANSPORT_PRICE_PER_KM]:
        DefaultValues.TRANSPORT_PRICE_PER_KM,
      [BusinessTypePricingConfigKey.TRANSPORT_WORKER_HOUR_RATE]:
        DefaultValues.TRANSPORT_WORKER_HOUR_RATE,
      [BusinessTypePricingConfigKey.TRANSPORT_EXTRA_HOUR_RATE]:
        DefaultValues.TRANSPORT_EXTRA_HOUR_RATE,
      [BusinessTypePricingConfigKey.TRANSPORT_VOLUME_SURCHARGE]:
        DefaultValues.TRANSPORT_VOLUME_SURCHARGE,

      // EMBALLAGE
      [BusinessTypePricingConfigKey.PACKING_PRICE_PER_M3]:
        DefaultValues.PACKING_PRICE_PER_M3,
      [BusinessTypePricingConfigKey.PACKING_WORKER_PRICE]:
        DefaultValues.PACKING_WORKER_PRICE,
      [BusinessTypePricingConfigKey.PACKING_WORKER_HOUR_RATE]:
        DefaultValues.PACKING_WORKER_HOUR_RATE,
      [BusinessTypePricingConfigKey.PACKING_EXTRA_HOUR_RATE]:
        DefaultValues.PACKING_EXTRA_HOUR_RATE,
      [BusinessTypePricingConfigKey.PACKING_MATERIAL_COST]:
        DefaultValues.PACKING_MATERIAL_COST,

      // STOCKAGE
      [BusinessTypePricingConfigKey.STORAGE_PRICE_PER_M3_PER_MONTH]:
        DefaultValues.STORAGE_PRICE_PER_M3_PER_MONTH,
      [BusinessTypePricingConfigKey.STORAGE_WORKER_HOUR_RATE]:
        DefaultValues.STORAGE_WORKER_HOUR_RATE,
      [BusinessTypePricingConfigKey.STORAGE_EXTRA_HOUR_RATE]:
        DefaultValues.STORAGE_EXTRA_HOUR_RATE,
      [BusinessTypePricingConfigKey.STORAGE_MINIMUM_DURATION_MONTHS]:
        DefaultValues.STORAGE_MINIMUM_DURATION_MONTHS,
      [BusinessTypePricingConfigKey.STORAGE_ACCESS_FEE]:
        DefaultValues.STORAGE_ACCESS_FEE,
    };

    // 4. Valider chaque configuration
    for (const config of configurations) {
      let expectedValue: any = undefined;

      if (config.category === "PRICING") {
        expectedValue = expectedPricingValues[config.key as PricingConfigKey];
      } else if (config.category === "BUSINESS_TYPE_PRICING") {
        expectedValue =
          expectedBusinessTypePricingValues[
            config.key as BusinessTypePricingConfigKey
          ];
      }
      // Les règles métier ne sont plus validées pour l'instant

      if (expectedValue !== undefined) {
        if (config.value === expectedValue) {
          result.summary.validatedConfigurations++;
        } else {
          result.errors.push(
            `❌ Incohérence pour ${config.key}: ` +
              `DefaultConfigurations=${config.value}, DefaultValues=${expectedValue}`,
          );
          result.isValid = false;
        }
      } else {
        result.warnings.push(
          `⚠️ Configuration ${config.key} non trouvée dans DefaultValues`,
        );
      }
    }

    // 5. Vérifier les configurations manquantes
    const allExpectedKeys = [
      ...Object.keys(expectedPricingValues),
      ...Object.keys(expectedBusinessTypePricingValues),
    ];
    const actualKeys = configurations.map((c) => c.key);

    for (const expectedKey of allExpectedKeys) {
      if (!actualKeys.includes(expectedKey)) {
        result.errors.push(
          `❌ Configuration manquante dans DefaultConfigurations: ${expectedKey}`,
        );
        result.summary.missingConfigurations++;
        result.isValid = false;
      }
    }
  } catch (error) {
    result.errors.push(`❌ Erreur lors de la validation: ${error}`);
    result.isValid = false;
  }

  return result;
}

/**
 * Affiche le rapport de validation dans la console
 */
export function printValidationReport(): void {
  console.log("\n🔍 VALIDATION DES CONFIGURATIONS PAR DÉFAUT");
  console.log("=".repeat(50));

  const result = validateDefaultConfigurationsConsistency();

  // Résumé
  console.log("\n📊 RÉSUMÉ:");
  console.log(`Total configurations: ${result.summary.totalConfigurations}`);
  console.log(
    `Configurations validées: ${result.summary.validatedConfigurations}`,
  );
  console.log(
    `Configurations manquantes: ${result.summary.missingConfigurations}`,
  );

  // Erreurs
  if (result.errors.length > 0) {
    console.log("\n🚨 ERREURS:");
    result.errors.forEach((error) => console.log(error));
  }

  // Avertissements
  if (result.warnings.length > 0) {
    console.log("\n⚠️ AVERTISSEMENTS:");
    result.warnings.forEach((warning) => console.log(warning));
  }

  // Résultat final
  console.log("\n" + "=".repeat(50));
  if (result.isValid) {
    console.log(
      "✅ VALIDATION RÉUSSIE - Toutes les configurations sont cohérentes !",
    );
  } else {
    console.log("❌ VALIDATION ÉCHOUÉE - Des incohérences ont été détectées !");
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  printValidationReport();
}
