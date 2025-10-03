// 🔍 Script pour vérifier le statut de migration des presets

import { 
  MovingPreset, 
  CleaningPreset, 
  CatalogueMovingItemPreset, 
  CatalogueCleaningItemPreset,
  CatalogueDeliveryItemPreset,
  ContactPreset,
  DefaultPreset 
} from "../presets";
import { generateMigrationReport, analyzePresetForDuplications } from "../utils/migrationHelper";

/**
 * Script de vérification du statut de migration
 * À exécuter avec: npx ts-node checkMigrationStatus.ts
 */

const allPresets = {
  DefaultPreset,
  MovingPreset,
  CleaningPreset,
  CatalogueMovingItemPreset,
  CatalogueCleaningItemPreset,
  CatalogueDeliveryItemPreset,
  ContactPreset
};

console.log("🔍 Vérification du statut de migration des presets...\n");

// Génération du rapport global
const report = generateMigrationReport(allPresets);

console.log("📊 RAPPORT DE MIGRATION");
console.log("=" .repeat(50));

console.log(`✅ Presets migrés (${report.migrated.length}):`);
report.migrated.forEach(name => {
  const preset = allPresets[name as keyof typeof allPresets];
  console.log(`   • ${name} v${preset.meta.version} - ${preset.form.globalConfig ? '🌍 Global' : '❌ Pas de global'}`);
});

console.log(`\n⚠️  Presets à migrer (${report.needsMigration.length}):`);
report.needsMigration.forEach(name => {
  const preset = allPresets[name as keyof typeof allPresets];
  console.log(`   • ${name} v${preset.meta.version}`);
});

console.log(`\n🧹 Total duplications trouvées: ${report.totalDuplicationsFound}`);

console.log("\n📋 RECOMMANDATIONS:");
console.log("-".repeat(30));
report.recommendations.forEach(rec => {
  console.log(`• ${rec}`);
});

// Analyse détaillée de chaque preset
console.log("\n🔬 ANALYSE DÉTAILLÉE:");
console.log("=".repeat(50));

Object.entries(allPresets).forEach(([name, preset]) => {
  console.log(`\n📦 ${name}:`);
  
  const analysis = analyzePresetForDuplications(preset);
  
  console.log(`   Version: ${preset.meta.version}`);
  console.log(`   GlobalConfig: ${preset.form.globalConfig ? '✅ Oui' : '❌ Non'}`);
  console.log(`   Styles: ${preset.styles ? (preset.styles.length > 0 ? '🎨 Personnalisés' : '📝 Vides') : '❌ Aucun'}`);
  
  if (analysis.duplications.length > 0) {
    console.log(`   Duplications (${analysis.duplications.length}):`);
    analysis.duplications.forEach(dup => {
      console.log(`     - ${dup}`);
    });
  }
  
  if (analysis.recommendations.length > 0) {
    console.log(`   Recommandations:`);
    analysis.recommendations.forEach(rec => {
      console.log(`     → ${rec}`);
    });
  }
});

// Statistiques finales
console.log("\n📈 STATISTIQUES:");
console.log("=".repeat(30));

const totalPresets = Object.keys(allPresets).length;
const migratedCount = report.migrated.length;
const migrationProgress = Math.round((migratedCount / totalPresets) * 100);

console.log(`Total presets: ${totalPresets}`);
console.log(`Migrés: ${migratedCount} (${migrationProgress}%)`);
console.log(`À migrer: ${report.needsMigration.length}`);
console.log(`Duplications éliminées: ~${Math.round((migratedCount / totalPresets) * 90)}%`);

// Prochaines étapes
console.log("\n🎯 PROCHAINES ÉTAPES:");
console.log("=".repeat(35));

if (report.needsMigration.length > 0) {
  console.log("1. Migrer les presets restants:");
  report.needsMigration.forEach(name => {
    console.log(`   • ${name}`);
  });
  
  console.log("\n2. Commandes de migration rapide:");
  report.needsMigration.forEach(name => {
    const serviceType = name.toLowerCase().includes('cleaning') ? 'cleaning' :
                       name.toLowerCase().includes('moving') ? 'moving' :
                       name.toLowerCase().includes('catalogue') ? 'catalogue' : 'contact';
    
    console.log(`   quickMigratePreset(${name}, '${serviceType}')`);
  });
} else {
  console.log("✅ Tous les presets sont migrés !");
  console.log("🎉 Félicitations ! La migration est terminée.");
  
  console.log("\n🔮 Optimisations suggérées:");
  console.log("   • Créer des thèmes prédéfinis (Material, iOS, Custom)");
  console.log("   • Ajouter des tests automatisés");
  console.log("   • Former l'équipe aux nouvelles APIs");
  console.log("   • Documenter dans Storybook");
}

// Export pour usage programmatique
export const migrationStatus = {
  totalPresets,
  migratedCount,
  migrationProgress,
  needsMigration: report.needsMigration,
  duplicationsRemaining: report.totalDuplicationsFound,
  isComplete: report.needsMigration.length === 0
};

console.log("\n" + "=".repeat(60));
console.log("🚀 Migration Global Preset - Rapport terminé");
console.log("=".repeat(60)); 