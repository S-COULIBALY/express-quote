import { PrismaClient } from '@prisma/client';
import { createDefaultConfigurations } from '../src/quotation/domain/configuration/DefaultConfigurations';
import { DefaultValues } from '../src/quotation/domain/configuration/DefaultValues';

const prisma = new PrismaClient();

/**
 * Script pour initialiser ou mettre à jour la base de données
 * avec les configurations par défaut de DefaultValues.ts
 */
async function initializeDefaultConfigurations() {
  try {
    console.log('🚀 Initialisation des configurations par défaut...');
    
    // Obtenir les configurations par défaut
    const defaultConfigs = createDefaultConfigurations();
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const config of defaultConfigs) {
      // Vérifier si la configuration existe déjà
      const existing = await prisma.configuration.findUnique({
        where: {
          category_key: {
            category: config.category,
            key: config.key
          }
        }
      });
      
      if (existing) {
        // Comparer les valeurs
        const existingValue = JSON.stringify(existing.value);
        const newValue = JSON.stringify(config.value);
        
        if (existingValue !== newValue) {
          // Mettre à jour avec la nouvelle valeur
          await prisma.configuration.update({
            where: {
              category_key: {
                category: config.category,
                key: config.key
              }
            },
            data: {
              value: config.value,
              description: config.description,
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
            category: config.category,
            key: config.key,
            value: config.value,
            description: config.description || null,
            isActive: config.isActive,
            validFrom: config.validFrom,
            validTo: config.validTo,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        console.log(`🆕 Créé: ${config.category}_${config.key} = ${config.value}`);
        created++;
      }
    }
    
    console.log('\n📊 RÉSUMÉ:');
    console.log(`   🆕 Créées: ${created}`);
    console.log(`   ✅ Mises à jour: ${updated}`);
    console.log(`   ⏭️  Ignorées: ${skipped}`);
    console.log(`   📝 Total: ${defaultConfigs.length}`);
    
    // Afficher quelques exemples de valeurs importantes
    console.log('\n🔍 VALEURS IMPORTANTES:');
    console.log(`   MOVING_BASE_PRICE_PER_M3: ${DefaultValues.MOVING_BASE_PRICE_PER_M3}€`);
    console.log(`   PACK_INCLUDED_DISTANCE: ${DefaultValues.PACK_INCLUDED_DISTANCE}km`);
    console.log(`   PACK_EXTRA_KM_PRICE: ${DefaultValues.PACK_EXTRA_KM_PRICE}€`);
    console.log(`   PACK_LIFT_PRICE: ${DefaultValues.PACK_LIFT_PRICE}€`);
    
    console.log('\n✅ Initialisation terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Script pour forcer la mise à jour de toutes les configurations
 * (même si elles existent déjà)
 */
async function forceUpdateConfigurations() {
  try {
    console.log('🔄 Mise à jour forcée de toutes les configurations...');
    
    const defaultConfigs = createDefaultConfigurations();
    let updated = 0;
    
    for (const config of defaultConfigs) {
      await prisma.configuration.upsert({
        where: {
          category_key: {
            category: config.category,
            key: config.key
          }
        },
        update: {
          value: config.value,
          description: config.description,
          updatedAt: new Date()
        },
        create: {
          category: config.category,
          key: config.key,
          value: config.value,
          description: config.description || null,
          isActive: config.isActive,
          validFrom: config.validFrom,
          validTo: config.validTo,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log(`🔄 ${config.category}_${config.key} = ${config.value}`);
      updated++;
    }
    
    console.log(`\n✅ ${updated} configurations mises à jour avec succès !`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour forcée:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution du script
if (require.main === module) {
  const args = process.argv.slice(2);
  const forceUpdate = args.includes('--force');
  
  if (forceUpdate) {
    forceUpdateConfigurations();
  } else {
    initializeDefaultConfigurations();
  }
}

export { initializeDefaultConfigurations, forceUpdateConfigurations }; 