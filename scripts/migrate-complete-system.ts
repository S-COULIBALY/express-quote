/**
 * ============================================================================
 * MIGRATION COMPLÈTE DU SYSTÈME DE CONFIGURATION
 * ============================================================================
 * 
 * 🎯 OBJECTIF :
 * Orchestrer la migration complète du système de configuration :
 * 1. Migration de la base de données (ajout du champ businessType)
 * 2. Migration des configurations (ajout des nouvelles configurations)
 * 3. Validation de la migration
 * 
 * 🚀 UTILISATION :
 * npx ts-node scripts/migrate-complete-system.ts
 */

import { applyDatabaseMigration } from './apply-database-migration';
import { migrateBusinessTypeConfigurations } from './migrate-business-type-configurations';
import { validateMigratedConfigurations } from './validate-migrated-configurations';

interface MigrationSummary {
  databaseMigration: boolean;
  configurationMigration: boolean;
  validation: boolean;
  totalConfigurations: number;
  errors: string[];
}

/**
 * Exécute la migration complète du système
 */
async function migrateCompleteSystem(): Promise<MigrationSummary> {
  const summary: MigrationSummary = {
    databaseMigration: false,
    configurationMigration: false,
    validation: false,
    totalConfigurations: 0,
    errors: []
  };

  try {
    console.log('🚀 MIGRATION COMPLÈTE DU SYSTÈME DE CONFIGURATION');
    console.log('=' .repeat(70));
    console.log('📅 Date :', new Date().toISOString());
    console.log('');

    // ÉTAPE 1 : Migration de la base de données
    console.log('📋 ÉTAPE 1/3 : MIGRATION BASE DE DONNÉES');
    console.log('-' .repeat(50));
    try {
      await applyDatabaseMigration();
      summary.databaseMigration = true;
      console.log('✅ Migration base de données : SUCCÈS');
    } catch (error) {
      const errorMsg = `❌ Migration base de données : ÉCHEC - ${error}`;
      summary.errors.push(errorMsg);
      console.log(errorMsg);
      throw error;
    }

    console.log('');

    // ÉTAPE 2 : Migration des configurations
    console.log('📋 ÉTAPE 2/3 : MIGRATION DES CONFIGURATIONS');
    console.log('-' .repeat(50));
    try {
      const migrationResult = await migrateBusinessTypeConfigurations();
      summary.configurationMigration = migrationResult.success;
      summary.totalConfigurations = migrationResult.created + migrationResult.updated;
      
      if (migrationResult.success) {
        console.log('✅ Migration configurations : SUCCÈS');
        console.log(`   - ${migrationResult.created} configurations créées`);
        console.log(`   - ${migrationResult.updated} configurations mises à jour`);
      } else {
        const errorMsg = `❌ Migration configurations : ÉCHEC - ${migrationResult.errors.length} erreurs`;
        summary.errors.push(errorMsg);
        console.log(errorMsg);
        migrationResult.errors.forEach(error => console.log(`   ${error}`));
        throw new Error('Migration des configurations échouée');
      }
    } catch (error) {
      const errorMsg = `❌ Migration configurations : ÉCHEC - ${error}`;
      summary.errors.push(errorMsg);
      console.log(errorMsg);
      throw error;
    }

    console.log('');

    // ÉTAPE 3 : Validation de la migration
    console.log('📋 ÉTAPE 3/3 : VALIDATION DE LA MIGRATION');
    console.log('-' .repeat(50));
    try {
      const validationResult = await validateMigratedConfigurations();
      summary.validation = validationResult.success;
      
      if (validationResult.success) {
        console.log('✅ Validation migration : SUCCÈS');
        console.log(`   - ${validationResult.validatedConfigurations} configurations validées`);
      } else {
        const errorMsg = `❌ Validation migration : ÉCHEC - ${validationResult.errors.length} erreurs`;
        summary.errors.push(errorMsg);
        console.log(errorMsg);
        validationResult.errors.forEach(error => console.log(`   ${error}`));
        throw new Error('Validation de la migration échouée');
      }
    } catch (error) {
      const errorMsg = `❌ Validation migration : ÉCHEC - ${error}`;
      summary.errors.push(errorMsg);
      console.log(errorMsg);
      throw error;
    }

    console.log('');

    // RÉSUMÉ FINAL
    console.log('🎉 MIGRATION COMPLÈTE TERMINÉE AVEC SUCCÈS !');
    console.log('=' .repeat(70));
    console.log('📊 RÉSUMÉ FINAL :');
    console.log(`   ✅ Migration base de données : ${summary.databaseMigration ? 'SUCCÈS' : 'ÉCHEC'}`);
    console.log(`   ✅ Migration configurations : ${summary.configurationMigration ? 'SUCCÈS' : 'ÉCHEC'}`);
    console.log(`   ✅ Validation migration : ${summary.validation ? 'SUCCÈS' : 'ÉCHEC'}`);
    console.log(`   📈 Total configurations traitées : ${summary.totalConfigurations}`);
    console.log(`   ❌ Erreurs : ${summary.errors.length}`);

    if (summary.errors.length > 0) {
      console.log('\n🚨 ERREURS DÉTECTÉES :');
      summary.errors.forEach(error => console.log(`   ${error}`));
    }

    return summary;

  } catch (error) {
    console.log('\n❌ MIGRATION COMPLÈTE ÉCHOUÉE !');
    console.log('=' .repeat(50));
    console.log(`❌ Erreur : ${error}`);
    console.log(`❌ Erreurs totales : ${summary.errors.length}`);
    
    if (summary.errors.length > 0) {
      console.log('\n🚨 ERREURS DÉTECTÉES :');
      summary.errors.forEach(error => console.log(`   ${error}`));
    }

    throw error;
  }
}

/**
 * Fonction principale
 */
async function main(): Promise<void> {
  try {
    const summary = await migrateCompleteSystem();
    
    if (summary.databaseMigration && summary.configurationMigration && summary.validation) {
      console.log('\n🎉 TOUTES LES MIGRATIONS ONT RÉUSSI !');
      console.log('Le système de configuration est maintenant prêt à être utilisé.');
      process.exit(0);
    } else {
      console.log('\n❌ CERTAINES MIGRATIONS ONT ÉCHOUÉ !');
      console.log('Veuillez corriger les erreurs avant de continuer.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erreur fatale :', error);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Erreur non gérée :', error);
    process.exit(1);
  });
}

export { migrateCompleteSystem };
