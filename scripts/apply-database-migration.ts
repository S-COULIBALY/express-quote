/**
 * ============================================================================
 * APPLICATION DE LA MIGRATION BASE DE DONNÉES
 * ============================================================================
 * 
 * 🎯 OBJECTIF :
 * Appliquer la migration pour ajouter le champ businessType au modèle Configuration
 * et mettre à jour les configurations existantes.
 * 
 * 🚀 UTILISATION :
 * npx ts-node scripts/apply-database-migration.ts
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

/**
 * Applique la migration SQL pour ajouter le champ businessType
 */
async function applyDatabaseMigration(): Promise<void> {
  try {
    console.log('🚀 DÉBUT DE LA MIGRATION BASE DE DONNÉES');
    console.log('=' .repeat(60));

    // 1. Lire le fichier de migration SQL
    const migrationPath = join(__dirname, '../prisma/migrations/add_business_type_to_configuration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration SQL chargée :');
    console.log(migrationSQL);

    // 2. Exécuter la migration SQL
    console.log('\n🔄 Exécution de la migration...');
    
    // Diviser le SQL en commandes individuelles
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    for (const command of commands) {
      if (command.trim()) {
        console.log(`   Exécution : ${command.substring(0, 50)}...`);
        await prisma.$executeRawUnsafe(command);
      }
    }

    console.log('✅ Migration SQL appliquée avec succès !');

    // 3. Vérifier que le champ a été ajouté
    const testQuery = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Configuration' 
      AND column_name = 'businessType'
    `;

    if (Array.isArray(testQuery) && testQuery.length > 0) {
      console.log('✅ Champ businessType ajouté avec succès !');
    } else {
      throw new Error('❌ Le champ businessType n\'a pas été ajouté');
    }

    // 4. Vérifier les index
    const indexQuery = await prisma.$queryRaw`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'Configuration' 
      AND indexname LIKE '%business_type%'
    `;

    console.log('📊 Index créés :');
    if (Array.isArray(indexQuery)) {
      indexQuery.forEach((index: any) => {
        console.log(`   - ${index.indexname}`);
      });
    }

    // 5. Afficher les statistiques des configurations
    const configStats = await prisma.configuration.groupBy({
      by: ['businessType'],
      _count: {
        id: true
      },
      where: {
        isActive: true
      }
    });

    console.log('\n📊 STATISTIQUES DES CONFIGURATIONS PAR BUSINESS TYPE :');
    configStats.forEach(stat => {
      console.log(`   ${stat.businessType || 'NULL'}: ${stat._count.id} configurations`);
    });

    console.log('\n🎉 MIGRATION BASE DE DONNÉES TERMINÉE AVEC SUCCÈS !');

  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Fonction principale
 */
async function main(): Promise<void> {
  try {
    await applyDatabaseMigration();
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

export { applyDatabaseMigration };
