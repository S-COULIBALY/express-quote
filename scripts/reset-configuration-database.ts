/**
 * ============================================================================
 * RÉINITIALISATION COMPLÈTE DE LA BASE DE DONNÉES CONFIGURATION
 * ============================================================================
 * 
 * 🎯 OBJECTIF :
 * Vider complètement la table Configuration et recréer toutes les données
 * à partir de DefaultValues.ts et DefaultConfigurations.ts
 * 
 * ⚠️ ATTENTION : Ce script est pour le mode DÉVELOPPEMENT uniquement !
 * 
 * 🚀 UTILISATION :
 * npx ts-node scripts/reset-configuration-database.ts
 */

import { PrismaClient } from '@prisma/client';
import { createDefaultConfigurations } from '../src/quotation/domain/configuration/DefaultConfigurations';
import { ConfigurationCategory } from '../src/quotation/domain/configuration/ConfigurationKey';

const prisma = new PrismaClient();

interface ResetResult {
  success: boolean;
  deletedCount: number;
  createdCount: number;
  errors: string[];
}

/**
 * Détermine le businessType à partir de la clé et de la catégorie
 */
function getBusinessTypeFromKey(key: string, category: string): string | null {
  // Pour les configurations PRICING (génériques)
  if (category === 'PRICING') {
    return 'GENERIC';
  }
  
  // Pour les configurations BUSINESS_TYPE_PRICING
  if (category === 'BUSINESS_TYPE_PRICING') {
    if (key.startsWith('MOVING_')) return 'DÉMÉNAGEMENT';
    if (key.startsWith('CLEANING_')) return 'NETTOYAGE';
    if (key.startsWith('DELIVERY_')) return 'LIVRAISON';
    if (key.startsWith('TRANSPORT_')) return 'TRANSPORT';
    if (key.startsWith('PACKING_')) return 'EMBALLAGE';
    if (key.startsWith('STORAGE_')) return 'STOCKAGE';
  }
  
  // Pour les autres catégories
  if (['SYSTEM_VALUES', 'TECHNICAL_LIMITS', 'INSURANCE_CONFIG', 'SERVICE_PARAMS'].includes(category)) {
    return 'SYSTEM';
  }
  
  return null;
}

/**
 * Réinitialise complètement la base de données Configuration
 */
async function resetConfigurationDatabase(): Promise<ResetResult> {
  const result: ResetResult = {
    success: true,
    deletedCount: 0,
    createdCount: 0,
    errors: []
  };

  try {
    console.log('🚀 RÉINITIALISATION COMPLÈTE DE LA BASE DE DONNÉES CONFIGURATION');
    console.log('=' .repeat(70));
    console.log('⚠️  ATTENTION : Ce script va SUPPRIMER TOUTES les configurations existantes !');
    console.log('');

    // 1. Compter les configurations existantes
    const existingCount = await prisma.configuration.count();
    console.log(`📊 Configurations existantes : ${existingCount}`);

    // 2. Supprimer TOUTES les configurations
    console.log('\n🗑️  SUPPRESSION DE TOUTES LES CONFIGURATIONS...');
    const deleteResult = await prisma.configuration.deleteMany({});
    result.deletedCount = deleteResult.count;
    console.log(`✅ ${result.deletedCount} configurations supprimées`);

    // 3. Récupérer toutes les configurations par défaut
    console.log('\n📋 CRÉATION DES NOUVELLES CONFIGURATIONS...');
    const configurations = createDefaultConfigurations();
    console.log(`📊 Total des configurations à créer : ${configurations.length}`);

    // 4. Créer toutes les nouvelles configurations
    for (const config of configurations) {
      try {
        await prisma.configuration.create({
          data: {
            id: `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            category: config.category,
            key: config.key,
            value: config.value,
            description: config.description,
            businessType: getBusinessTypeFromKey(config.key, config.category),
            isActive: true,
            validFrom: new Date(),
            validTo: null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        result.createdCount++;
        console.log(`✅ Créé : ${config.key} = ${config.value}`);
      } catch (error) {
        const errorMsg = `❌ Erreur pour ${config.key}: ${error}`;
        result.errors.push(errorMsg);
        console.log(errorMsg);
        result.success = false;
      }
    }

    // 5. Afficher le résumé
    console.log('\n📊 RÉSUMÉ DE LA RÉINITIALISATION :');
    console.log('=' .repeat(50));
    console.log(`🗑️  Configurations supprimées : ${result.deletedCount}`);
    console.log(`✅ Configurations créées : ${result.createdCount}`);
    console.log(`❌ Erreurs : ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\n🚨 ERREURS DÉTECTÉES :');
      result.errors.forEach(error => console.log(`   ${error}`));
    }

    // 6. Vérifier la cohérence finale
    const finalCount = await prisma.configuration.count({
      where: { isActive: true }
    });
    console.log(`\n📈 Total des configurations actives en BDD : ${finalCount}`);

    // 7. Afficher les statistiques par catégorie
    const pricingCount = await prisma.configuration.count({
      where: { 
        category: ConfigurationCategory.PRICING,
        isActive: true 
      }
    });
    
    const businessTypeCount = await prisma.configuration.count({
      where: { 
        category: ConfigurationCategory.BUSINESS_TYPE_PRICING,
        isActive: true 
      }
    });

    const systemCount = await prisma.configuration.count({
      where: { 
        category: ConfigurationCategory.SYSTEM_VALUES,
        isActive: true 
      }
    });

    console.log(`\n📊 CONFIGURATIONS PAR CATÉGORIE :`);
    console.log(`   - PRICING : ${pricingCount}`);
    console.log(`   - BUSINESS_TYPE_PRICING : ${businessTypeCount}`);
    console.log(`   - SYSTEM_VALUES : ${systemCount}`);

    // 8. Afficher les statistiques par businessType
    const businessTypeStats = await prisma.configuration.groupBy({
      by: ['businessType'],
      _count: {
        id: true
      },
      where: {
        isActive: true
      }
    });

    console.log(`\n📊 CONFIGURATIONS PAR BUSINESS TYPE :`);
    businessTypeStats.forEach(stat => {
      console.log(`   - ${stat.businessType || 'NULL'}: ${stat._count.id} configurations`);
    });

  } catch (error) {
    const errorMsg = `❌ Erreur lors de la réinitialisation : ${error}`;
    result.errors.push(errorMsg);
    result.success = false;
    console.log(errorMsg);
  }

  return result;
}

/**
 * Affiche les détails des configurations créées
 */
async function displayCreatedConfigurations(): Promise<void> {
  console.log('\n🔍 DÉTAILS DES CONFIGURATIONS CRÉÉES :');
  console.log('=' .repeat(70));

  // Afficher les configurations PRICING
  const pricingConfigs = await prisma.configuration.findMany({
    where: { 
      category: ConfigurationCategory.PRICING,
      isActive: true 
    },
    orderBy: { key: 'asc' }
  });

  console.log(`\n📋 CONFIGURATIONS PRICING (${pricingConfigs.length}) :`);
  for (const config of pricingConfigs) {
    console.log(`   ${config.key}: ${config.value} (${config.businessType})`);
  }

  // Afficher les configurations BUSINESS_TYPE_PRICING
  const businessTypeConfigs = await prisma.configuration.findMany({
    where: { 
      category: ConfigurationCategory.BUSINESS_TYPE_PRICING,
      isActive: true 
    },
    orderBy: [{ businessType: 'asc' }, { key: 'asc' }]
  });

  console.log(`\n🏢 CONFIGURATIONS BUSINESS_TYPE_PRICING (${businessTypeConfigs.length}) :`);
  for (const config of businessTypeConfigs) {
    console.log(`   ${config.key}: ${config.value} (${config.businessType})`);
  }
}

/**
 * Fonction principale
 */
async function main(): Promise<void> {
  try {
    // 1. Réinitialiser la base de données
    const result = await resetConfigurationDatabase();

    // 2. Afficher les détails si la réinitialisation a réussi
    if (result.success) {
      await displayCreatedConfigurations();
      
      console.log('\n🎉 RÉINITIALISATION TERMINÉE AVEC SUCCÈS !');
      console.log('=' .repeat(70));
      console.log(`🗑️  ${result.deletedCount} configurations supprimées`);
      console.log(`✅ ${result.createdCount} configurations créées`);
      console.log(`📊 Total : ${result.createdCount} configurations actives`);
      console.log('');
      console.log('✅ La base de données est maintenant propre et cohérente');
      console.log('✅ Toutes les configurations sont alignées avec DefaultValues.ts');
      console.log('✅ Le système est prêt pour les tests et le développement');
    } else {
      console.log('\n❌ RÉINITIALISATION ÉCHOUÉE !');
      console.log('=' .repeat(50));
      console.log(`❌ ${result.errors.length} erreurs détectées`);
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

export { resetConfigurationDatabase, displayCreatedConfigurations };
