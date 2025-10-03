/**
 * ============================================================================
 * VALIDATION DES CONFIGURATIONS MIGRÉES
 * ============================================================================
 * 
 * 🎯 OBJECTIF :
 * Valider que toutes les configurations ont été correctement migrées
 * en base de données et que les valeurs correspondent à DefaultValues.ts
 * 
 * 📋 VÉRIFICATIONS :
 * 
 * ✅ Existence des configurations en BDD
 * ✅ Correspondance des valeurs avec DefaultValues.ts
 * ✅ Cohérence des catégories
 * ✅ Statut actif des configurations
 * ✅ Complétude de la migration
 * 
 * 🚀 UTILISATION :
 * npx ts-node scripts/validate-migrated-configurations.ts
 */

import { PrismaClient } from '@prisma/client';
import { DefaultValues } from '../src/quotation/domain/configuration/DefaultValues';
import { createDefaultConfigurations } from '../src/quotation/domain/configuration/DefaultConfigurations';
import { 
  ConfigurationCategory, 
  PricingConfigKey, 
  BusinessTypePricingConfigKey 
} from '../src/quotation/domain/configuration/ConfigurationKey';

const prisma = new PrismaClient();

interface ValidationResult {
  success: boolean;
  totalConfigurations: number;
  validatedConfigurations: number;
  missingConfigurations: number;
  inconsistentConfigurations: number;
  errors: string[];
  warnings: string[];
  summary: {
    pricingConfigurations: number;
    businessTypeConfigurations: number;
    otherConfigurations: number;
  };
}

/**
 * Valide toutes les configurations migrées
 */
async function validateMigratedConfigurations(): Promise<ValidationResult> {
  const result: ValidationResult = {
    success: true,
    totalConfigurations: 0,
    validatedConfigurations: 0,
    missingConfigurations: 0,
    inconsistentConfigurations: 0,
    errors: [],
    warnings: [],
    summary: {
      pricingConfigurations: 0,
      businessTypeConfigurations: 0,
      otherConfigurations: 0
    }
  };

  try {
    console.log('🔍 VALIDATION DES CONFIGURATIONS MIGRÉES');
    console.log('=' .repeat(60));

    // 1. Récupérer toutes les configurations attendues
    const expectedConfigurations = createDefaultConfigurations();
    result.totalConfigurations = expectedConfigurations.length;

    console.log(`📊 Total des configurations attendues : ${result.totalConfigurations}`);

    // 2. Récupérer toutes les configurations en BDD
    const dbConfigurations = await prisma.configuration.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { key: 'asc' }]
    });

    console.log(`📊 Total des configurations en BDD : ${dbConfigurations.length}`);

    // 3. Compter les configurations par catégorie en BDD
    for (const config of dbConfigurations) {
      switch (config.category) {
        case ConfigurationCategory.PRICING:
          result.summary.pricingConfigurations++;
          break;
        case ConfigurationCategory.BUSINESS_TYPE_PRICING:
          result.summary.businessTypeConfigurations++;
          break;
        default:
          result.summary.otherConfigurations++;
          break;
      }
    }

    console.log(`📈 Répartition en BDD :`);
    console.log(`   - PRICING : ${result.summary.pricingConfigurations}`);
    console.log(`   - BUSINESS_TYPE_PRICING : ${result.summary.businessTypeConfigurations}`);
    console.log(`   - AUTRES : ${result.summary.otherConfigurations}`);

    // 4. Valider chaque configuration attendue
    for (const expectedConfig of expectedConfigurations) {
      const dbConfig = dbConfigurations.find(
        db => db.category === expectedConfig.category && db.key === expectedConfig.key
      );

      if (!dbConfig) {
        result.errors.push(`❌ Configuration manquante : ${expectedConfig.key} (${expectedConfig.category})`);
        result.missingConfigurations++;
        result.success = false;
        continue;
      }

      if (dbConfig.value !== expectedConfig.value) {
        result.errors.push(
          `❌ Valeur incohérente pour ${expectedConfig.key}: ` +
          `BDD=${dbConfig.value}, Attendu=${expectedConfig.value}`
        );
        result.inconsistentConfigurations++;
        result.success = false;
        continue;
      }

      if (!dbConfig.isActive) {
        result.warnings.push(`⚠️ Configuration inactive : ${expectedConfig.key}`);
      }

      result.validatedConfigurations++;
    }

    // 5. Vérifier les configurations orphelines en BDD
    for (const dbConfig of dbConfigurations) {
      const expectedConfig = expectedConfigurations.find(
        exp => exp.category === dbConfig.category && exp.key === dbConfig.key
      );

      if (!expectedConfig) {
        result.warnings.push(`⚠️ Configuration orpheline en BDD : ${dbConfig.key} (${dbConfig.category})`);
      }
    }

    // 6. Afficher le résumé
    console.log('\n📊 RÉSUMÉ DE LA VALIDATION :');
    console.log('=' .repeat(50));
    console.log(`✅ Configurations validées : ${result.validatedConfigurations}`);
    console.log(`❌ Configurations manquantes : ${result.missingConfigurations}`);
    console.log(`🔄 Configurations incohérentes : ${result.inconsistentConfigurations}`);
    console.log(`⚠️  Avertissements : ${result.warnings.length}`);
    console.log(`❌ Erreurs : ${result.errors.length}`);

    // 7. Afficher les erreurs
    if (result.errors.length > 0) {
      console.log('\n🚨 ERREURS DÉTECTÉES :');
      result.errors.forEach(error => console.log(`   ${error}`));
    }

    // 8. Afficher les avertissements
    if (result.warnings.length > 0) {
      console.log('\n⚠️ AVERTISSEMENTS :');
      result.warnings.forEach(warning => console.log(`   ${warning}`));
    }

  } catch (error) {
    const errorMsg = `❌ Erreur lors de la validation : ${error}`;
    result.errors.push(errorMsg);
    result.success = false;
    console.log(errorMsg);
  }

  return result;
}

/**
 * Affiche les détails des configurations par catégorie
 */
async function displayConfigurationDetails(): Promise<void> {
  console.log('\n🔍 DÉTAILS DES CONFIGURATIONS PAR CATÉGORIE :');
  console.log('=' .repeat(70));

  // Configurations PRICING
  const pricingConfigs = await prisma.configuration.findMany({
    where: { 
      category: ConfigurationCategory.PRICING,
      isActive: true 
    },
    orderBy: { key: 'asc' }
  });

  console.log(`\n📋 CONFIGURATIONS PRICING (${pricingConfigs.length}) :`);
  for (const config of pricingConfigs) {
    console.log(`   ${config.key}: ${config.value}`);
  }

  // Configurations BUSINESS_TYPE_PRICING
  const businessTypeConfigs = await prisma.configuration.findMany({
    where: { 
      category: ConfigurationCategory.BUSINESS_TYPE_PRICING,
      isActive: true 
    },
    orderBy: { key: 'asc' }
  });

  console.log(`\n🏢 CONFIGURATIONS BUSINESS_TYPE_PRICING (${businessTypeConfigs.length}) :`);
  for (const config of businessTypeConfigs) {
    console.log(`   ${config.key}: ${config.value}`);
  }
}

/**
 * Valide la cohérence avec DefaultValues.ts
 */
async function validateDefaultValuesConsistency(): Promise<void> {
  console.log('\n🔍 VALIDATION DE LA COHÉRENCE AVEC DefaultValues.ts :');
  console.log('=' .repeat(70));

  // Valider les valeurs de DefaultValues
  const validation = DefaultValues.validateValues();
  
  if (validation.isValid) {
    console.log('✅ DefaultValues.ts : Toutes les valeurs sont valides');
  } else {
    console.log('❌ DefaultValues.ts : Erreurs détectées :');
    validation.errors.forEach(error => console.log(`   ${error}`));
  }

  // Vérifier que toutes les propriétés de DefaultValues sont en BDD
  const allValues = DefaultValues.getAllValues();
  const dbConfigs = await prisma.configuration.findMany({
    where: { isActive: true }
  });

  let missingInDB = 0;
  for (const [key, value] of Object.entries(allValues)) {
    const dbConfig = dbConfigs.find(db => db.key === key);
    if (!dbConfig) {
      console.log(`⚠️ Propriété ${key} de DefaultValues.ts non trouvée en BDD`);
      missingInDB++;
    } else if (dbConfig.value !== value) {
      console.log(`❌ Incohérence ${key}: DefaultValues=${value}, BDD=${dbConfig.value}`);
    }
  }

  if (missingInDB === 0) {
    console.log('✅ Toutes les propriétés de DefaultValues.ts sont présentes en BDD');
  } else {
    console.log(`⚠️ ${missingInDB} propriétés de DefaultValues.ts manquantes en BDD`);
  }
}

/**
 * Fonction principale
 */
async function main(): Promise<void> {
  try {
    // 1. Valider les configurations migrées
    const result = await validateMigratedConfigurations();

    // 2. Afficher les détails si la validation a réussi
    if (result.success) {
      await displayConfigurationDetails();
      await validateDefaultValuesConsistency();
      
      console.log('\n🎉 VALIDATION TERMINÉE AVEC SUCCÈS !');
      console.log('=' .repeat(60));
      console.log(`✅ ${result.validatedConfigurations} configurations validées`);
      console.log(`📊 Total des configurations en BDD : ${result.summary.pricingConfigurations + result.summary.businessTypeConfigurations + result.summary.otherConfigurations}`);
    } else {
      console.log('\n❌ VALIDATION ÉCHOUÉE !');
      console.log('=' .repeat(50));
      console.log(`❌ ${result.errors.length} erreurs détectées`);
      console.log(`⚠️ ${result.warnings.length} avertissements`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Erreur fatale :', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Erreur non gérée :', error);
    process.exit(1);
  });
}

export { validateMigratedConfigurations, displayConfigurationDetails, validateDefaultValuesConsistency };
