import { DefaultValues } from './DefaultValues';
import { createDefaultConfigurations } from './DefaultConfigurations';
import { PricingConfigKey, BusinessRulesConfigKey } from './ConfigurationKey';

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
      missingConfigurations: 0
    }
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

    // 3. Mapper les valeurs attendues depuis DefaultValues
    const expectedPricingValues = {
      [PricingConfigKey.MOVING_BASE_PRICE_PER_M3]: DefaultValues.MOVING_BASE_PRICE_PER_M3,
      [PricingConfigKey.MOVING_DISTANCE_PRICE_PER_KM]: DefaultValues.MOVING_DISTANCE_PRICE_PER_KM,
      [PricingConfigKey.FUEL_CONSUMPTION_PER_100KM]: DefaultValues.FUEL_CONSUMPTION_PER_100KM,
      [PricingConfigKey.FUEL_PRICE_PER_LITER]: DefaultValues.FUEL_PRICE_PER_LITER,
      [PricingConfigKey.TOLL_COST_PER_KM]: DefaultValues.TOLL_COST_PER_KM,
      [PricingConfigKey.HIGHWAY_RATIO]: DefaultValues.HIGHWAY_RATIO,
      [PricingConfigKey.PACK_WORKER_PRICE]: DefaultValues.PACK_WORKER_PRICE,
      [PricingConfigKey.PACK_INCLUDED_DISTANCE]: DefaultValues.PACK_INCLUDED_DISTANCE,
      [PricingConfigKey.PACK_EXTRA_KM_PRICE]: DefaultValues.PACK_EXTRA_KM_PRICE,
      [PricingConfigKey.PACK_EXTRA_DAY_DISCOUNT_RATE]: DefaultValues.PACK_EXTRA_DAY_DISCOUNT_RATE,
      [PricingConfigKey.PACK_WORKER_DISCOUNT_RATE_1_DAY]: DefaultValues.PACK_WORKER_DISCOUNT_RATE_1_DAY,
      [PricingConfigKey.PACK_WORKER_DISCOUNT_RATE_MULTI_DAYS]: DefaultValues.PACK_WORKER_DISCOUNT_RATE_MULTI_DAYS,
      [PricingConfigKey.PACK_LIFT_PRICE]: DefaultValues.PACK_LIFT_PRICE,
      [PricingConfigKey.SERVICE_WORKER_PRICE_PER_HOUR]: DefaultValues.SERVICE_WORKER_PRICE_PER_HOUR,
      [PricingConfigKey.SERVICE_WORKER_DISCOUNT_RATE_SHORT]: DefaultValues.SERVICE_WORKER_DISCOUNT_RATE_SHORT,
      [PricingConfigKey.SERVICE_WORKER_DISCOUNT_RATE_LONG]: DefaultValues.SERVICE_WORKER_DISCOUNT_RATE_LONG,
      [PricingConfigKey.SERVICE_EXTRA_HOUR_RATE]: DefaultValues.SERVICE_EXTRA_HOUR_RATE,
    };

    const expectedBusinessRulesValues = {
      [BusinessRulesConfigKey.MOVING_EARLY_BOOKING_DAYS]: DefaultValues.MOVING_EARLY_BOOKING_DAYS,
      [BusinessRulesConfigKey.MOVING_EARLY_BOOKING_DISCOUNT]: DefaultValues.MOVING_EARLY_BOOKING_DISCOUNT,
      [BusinessRulesConfigKey.MOVING_WEEKEND_SURCHARGE]: DefaultValues.MOVING_WEEKEND_SURCHARGE,
      [BusinessRulesConfigKey.SERVICE_EARLY_BOOKING_DAYS]: DefaultValues.SERVICE_EARLY_BOOKING_DAYS,
      [BusinessRulesConfigKey.SERVICE_EARLY_BOOKING_DISCOUNT]: DefaultValues.SERVICE_EARLY_BOOKING_DISCOUNT,
      [BusinessRulesConfigKey.SERVICE_WEEKEND_SURCHARGE]: DefaultValues.SERVICE_WEEKEND_SURCHARGE,
      [BusinessRulesConfigKey.PACK_EARLY_BOOKING_DAYS]: DefaultValues.PACK_EARLY_BOOKING_DAYS,
      [BusinessRulesConfigKey.PACK_EARLY_BOOKING_DISCOUNT]: DefaultValues.PACK_EARLY_BOOKING_DISCOUNT,
      [BusinessRulesConfigKey.PACK_WEEKEND_SURCHARGE]: DefaultValues.PACK_WEEKEND_SURCHARGE,
      [BusinessRulesConfigKey.PACK_URGENT_BOOKING_SURCHARGE]: DefaultValues.PACK_URGENT_BOOKING_SURCHARGE,
    };

    // 4. Valider chaque configuration
    for (const config of configurations) {
      const expectedValue = config.category === 'PRICING' 
        ? expectedPricingValues[config.key as PricingConfigKey]
        : expectedBusinessRulesValues[config.key as BusinessRulesConfigKey];

      if (expectedValue !== undefined) {
        if (config.value === expectedValue) {
          result.summary.validatedConfigurations++;
        } else {
          result.errors.push(
            `❌ Incohérence pour ${config.key}: ` +
            `DefaultConfigurations=${config.value}, DefaultValues=${expectedValue}`
          );
          result.isValid = false;
        }
      } else {
        result.warnings.push(`⚠️ Configuration ${config.key} non trouvée dans DefaultValues`);
      }
    }

    // 5. Vérifier les configurations manquantes
    const allExpectedKeys = [...Object.keys(expectedPricingValues), ...Object.keys(expectedBusinessRulesValues)];
    const actualKeys = configurations.map(c => c.key);
    
    for (const expectedKey of allExpectedKeys) {
      if (!actualKeys.includes(expectedKey)) {
        result.errors.push(`❌ Configuration manquante dans DefaultConfigurations: ${expectedKey}`);
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
  console.log('\n🔍 VALIDATION DES CONFIGURATIONS PAR DÉFAUT');
  console.log('=' .repeat(50));

  const result = validateDefaultConfigurationsConsistency();

  // Résumé
  console.log('\n📊 RÉSUMÉ:');
  console.log(`Total configurations: ${result.summary.totalConfigurations}`);
  console.log(`Configurations validées: ${result.summary.validatedConfigurations}`);
  console.log(`Configurations manquantes: ${result.summary.missingConfigurations}`);

  // Erreurs
  if (result.errors.length > 0) {
    console.log('\n🚨 ERREURS:');
    result.errors.forEach(error => console.log(error));
  }

  // Avertissements
  if (result.warnings.length > 0) {
    console.log('\n⚠️ AVERTISSEMENTS:');
    result.warnings.forEach(warning => console.log(warning));
  }

  // Résultat final
  console.log('\n' + '='.repeat(50));
  if (result.isValid) {
    console.log('✅ VALIDATION RÉUSSIE - Toutes les configurations sont cohérentes !');
  } else {
    console.log('❌ VALIDATION ÉCHOUÉE - Des incohérences ont été détectées !');
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  printValidationReport();
} 