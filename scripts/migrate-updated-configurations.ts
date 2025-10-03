import { PrismaClient } from '@prisma/client';
import { createDefaultConfigurations } from '../src/quotation/domain/configuration/DefaultConfigurations';
import { DefaultValues } from '../src/quotation/domain/configuration/DefaultValues';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

/**
 * Script pour migrer la base de données avec les configurations mises à jour
 * Utilise les nouvelles valeurs alignées de DefaultValues.ts
 */
async function migrateUpdatedConfigurations() {
  try {
    console.log('🚀 Migration des configurations mises à jour...');
    console.log('📅 Date:', new Date().toISOString());
    console.log('');
    
    // Obtenir les configurations par défaut mises à jour
    const defaultConfigs = createDefaultConfigurations();
    console.log(`📋 ${defaultConfigs.length} configurations à traiter`);
    console.log('');
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const config of defaultConfigs) {
      try {
        // Vérifier si la configuration existe déjà
        const existing = await prisma.configuration.findFirst({
          where: {
            category: config.category,
            key: config.key,
            isActive: true
          }
        });
        
        if (existing) {
          // Comparer les valeurs
          const existingValue = JSON.stringify(existing.value);
          const newValue = JSON.stringify(config.value);
          
          if (existingValue !== newValue) {
            // Désactiver l'ancienne configuration
            await prisma.configuration.update({
              where: { id: existing.id },
              data: { 
                isActive: false,
                validTo: new Date(),
                updatedAt: new Date()
              }
            });
            
            // Créer la nouvelle configuration
            await prisma.configuration.create({
              data: {
                id: uuidv4(),
                category: config.category,
                key: config.key,
                value: config.value,
                description: config.description || null,
                isActive: true,
                validFrom: new Date(),
                validTo: null,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
            
            console.log(`✅ Mis à jour: ${config.category}_${config.key} = ${config.value}`);
            updated++;
          } else {
            console.log(`⏭️  Ignoré (identique): ${config.category}_${config.key}`);
            skipped++;
          }
        } else {
          // Créer la nouvelle configuration
          await prisma.configuration.create({
            data: {
              id: uuidv4(),
              category: config.category,
              key: config.key,
              value: config.value,
              description: config.description || null,
              isActive: true,
              validFrom: new Date(),
              validTo: null,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          
          console.log(`🆕 Créé: ${config.category}_${config.key} = ${config.value}`);
          created++;
        }
      } catch (error) {
        console.error(`❌ Erreur pour ${config.category}_${config.key}:`, error);
        errors++;
      }
    }
    
    console.log('');
    console.log('📊 RÉSUMÉ DE LA MIGRATION:');
    console.log(`   🆕 Créées: ${created}`);
    console.log(`   ✅ Mises à jour: ${updated}`);
    console.log(`   ⏭️  Ignorées: ${skipped}`);
    console.log(`   ❌ Erreurs: ${errors}`);
    console.log(`   📝 Total traité: ${defaultConfigs.length}`);
    
    // Afficher quelques exemples de valeurs importantes
    console.log('');
    console.log('🔍 VALEURS IMPORTANTES ACTUELLES:');
    console.log(`   UNIT_PRICE_PER_M3: ${DefaultValues.UNIT_PRICE_PER_M3}€`);
    console.log(`   UNIT_PRICE_PER_KM: ${DefaultValues.UNIT_PRICE_PER_KM}€`);
    console.log(`   WORKER_PRICE: ${DefaultValues.WORKER_PRICE}€`);
    console.log(`   LIFT_PRICE: ${DefaultValues.LIFT_PRICE}€`);
    console.log(`   INCLUDED_DISTANCE: ${DefaultValues.INCLUDED_DISTANCE}km`);
    console.log(`   EXTRA_KM_PRICE: ${DefaultValues.EXTRA_KM_PRICE}€`);
    console.log(`   FUEL_PRICE_PER_LITER: ${DefaultValues.FUEL_PRICE_PER_LITER}€`);
    console.log(`   VAT_RATE: ${(DefaultValues.VAT_RATE * 100).toFixed(1)}%`);
    
    // Vérifier la cohérence
    console.log('');
    console.log('🔍 VÉRIFICATION DE COHÉRENCE:');
    const dbConfigs = await prisma.configuration.findMany({
      where: { isActive: true },
      select: { category: true, key: true, value: true }
    });
    
    console.log(`   📊 Configurations actives en BDD: ${dbConfigs.length}`);
    
    // Grouper par catégorie
    const byCategory = dbConfigs.reduce((acc, config) => {
      acc[config.category] = (acc[config.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(byCategory).forEach(([category, count]) => {
      console.log(`   • ${category}: ${count} configurations`);
    });
    
    console.log('');
    console.log('🎉 Migration terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Script pour forcer la mise à jour de toutes les configurations
 * (supprime et recrée toutes les configurations)
 */
async function forceUpdateAllConfigurations() {
  try {
    console.log('🔄 Mise à jour forcée de toutes les configurations...');
    console.log('⚠️  ATTENTION: Cette opération va supprimer toutes les configurations existantes !');
    console.log('');
    
    // Supprimer toutes les configurations existantes
    const deletedCount = await prisma.configuration.deleteMany({});
    console.log(`🗑️  ${deletedCount.count} configurations supprimées`);
    
    // Recréer toutes les configurations
    const defaultConfigs = createDefaultConfigurations();
    let created = 0;
    
    for (const config of defaultConfigs) {
      await prisma.configuration.create({
        data: {
          id: uuidv4(),
          category: config.category,
          key: config.key,
          value: config.value,
          description: config.description || null,
          isActive: true,
          validFrom: new Date(),
          validTo: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log(`🆕 ${config.category}_${config.key} = ${config.value}`);
      created++;
    }
    
    console.log('');
    console.log(`✅ ${created} configurations recréées avec succès !`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour forcée:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Script pour vérifier l'état actuel de la base de données
 */
async function checkDatabaseState() {
  try {
    console.log('🔍 Vérification de l\'état actuel de la base de données...');
    console.log('');
    
    const totalConfigs = await prisma.configuration.count();
    const activeConfigs = await prisma.configuration.count({
      where: { isActive: true }
    });
    
    console.log(`📊 Total des configurations: ${totalConfigs}`);
    console.log(`✅ Configurations actives: ${activeConfigs}`);
    console.log(`❌ Configurations inactives: ${totalConfigs - activeConfigs}`);
    
    // Afficher quelques exemples
    const sampleConfigs = await prisma.configuration.findMany({
      where: { isActive: true },
      take: 10,
      select: { category: true, key: true, value: true, updatedAt: true }
    });
    
    console.log('');
    console.log('📋 Exemples de configurations actives:');
    sampleConfigs.forEach(config => {
      console.log(`   • ${config.category}_${config.key}: ${config.value} (${config.updatedAt.toISOString().split('T')[0]})`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution du script
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'migrate':
      migrateUpdatedConfigurations();
      break;
    case 'force':
      forceUpdateAllConfigurations();
      break;
    case 'check':
      checkDatabaseState();
      break;
    default:
      console.log('Usage:');
      console.log('  npm run ts-node scripts/migrate-updated-configurations.ts migrate  # Migration normale');
      console.log('  npm run ts-node scripts/migrate-updated-configurations.ts force    # Mise à jour forcée');
      console.log('  npm run ts-node scripts/migrate-updated-configurations.ts check    # Vérifier l\'état');
      break;
  }
}

export { migrateUpdatedConfigurations, forceUpdateAllConfigurations, checkDatabaseState };
