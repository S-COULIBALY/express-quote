import { PrismaClient } from '@prisma/client';
import { movingConstraintsFallback, movingServicesFallback } from '../src/data/fallbacks/movingFallback';
import { cleaningConstraintsFallback, cleaningServicesFallback } from '../src/data/fallbacks/cleaningFallback';

const prisma = new PrismaClient();

async function compareFallbacks() {
  try {
    console.log('🔍 Comparaison des fallbacks avec la BDD...\n');
    console.log('='.repeat(70));

    // MOVING
    console.log('\n📦 MOVING');
    console.log('-'.repeat(70));

    const movingRulesDB = await prisma.rules.findMany({
      where: {
        serviceType: 'MOVING',
        isActive: true
      }
    });

    const movingFallbackTotal = movingConstraintsFallback.length + movingServicesFallback.length;

    console.log(`BDD:      ${movingRulesDB.length} règles actives`);
    console.log(`Fallback: ${movingFallbackTotal} règles (${movingConstraintsFallback.length} contraintes + ${movingServicesFallback.length} services)`);

    if (movingRulesDB.length !== movingFallbackTotal) {
      console.log(`⚠️  DIFFÉRENCE: ${Math.abs(movingRulesDB.length - movingFallbackTotal)} règles`);
    } else {
      console.log('✅ Nombre de règles identique');
    }

    // Vérifier si les IDs correspondent
    const movingDBIds = new Set(movingRulesDB.map(r => r.id));
    const movingFallbackIds = new Set([
      ...movingConstraintsFallback.map(c => c.id),
      ...movingServicesFallback.map(s => s.id)
    ]);

    const missingInFallback = movingRulesDB.filter(r => !movingFallbackIds.has(r.id));
    const extraInFallback = [...movingConstraintsFallback, ...movingServicesFallback].filter(
      f => !movingDBIds.has(f.id)
    );

    if (missingInFallback.length > 0) {
      console.log(`\n❌ Règles en BDD mais pas dans fallback (${missingInFallback.length}):`);
      missingInFallback.forEach(r => console.log(`   - ${r.name} (${r.id})`));
    }

    if (extraInFallback.length > 0) {
      console.log(`\n❌ Règles dans fallback mais pas en BDD (${extraInFallback.length}):`);
      extraInFallback.forEach(r => console.log(`   - ${r.name} (${r.id})`));
    }

    // CLEANING
    console.log('\n📦 CLEANING');
    console.log('-'.repeat(70));

    const cleaningRulesDB = await prisma.rules.findMany({
      where: {
        serviceType: 'CLEANING',
        isActive: true
      }
    });

    const cleaningFallbackTotal = cleaningConstraintsFallback.length + cleaningServicesFallback.length;

    console.log(`BDD:      ${cleaningRulesDB.length} règles actives`);
    console.log(`Fallback: ${cleaningFallbackTotal} règles (${cleaningConstraintsFallback.length} contraintes + ${cleaningServicesFallback.length} services)`);

    if (cleaningRulesDB.length !== cleaningFallbackTotal) {
      console.log(`⚠️  DIFFÉRENCE: ${Math.abs(cleaningRulesDB.length - cleaningFallbackTotal)} règles`);
    } else {
      console.log('✅ Nombre de règles identique');
    }

    // Vérifier si les IDs correspondent
    const cleaningDBIds = new Set(cleaningRulesDB.map(r => r.id));
    const cleaningFallbackIds = new Set([
      ...cleaningConstraintsFallback.map(c => c.id),
      ...cleaningServicesFallback.map(s => s.id)
    ]);

    const missingInFallbackCleaning = cleaningRulesDB.filter(r => !cleaningFallbackIds.has(r.id));
    const extraInFallbackCleaning = [...cleaningConstraintsFallback, ...cleaningServicesFallback].filter(
      f => !cleaningDBIds.has(f.id)
    );

    if (missingInFallbackCleaning.length > 0) {
      console.log(`\n❌ Règles en BDD mais pas dans fallback (${missingInFallbackCleaning.length}):`);
      missingInFallbackCleaning.forEach(r => console.log(`   - ${r.name} (${r.id})`));
    }

    if (extraInFallbackCleaning.length > 0) {
      console.log(`\n❌ Règles dans fallback mais pas en BDD (${extraInFallbackCleaning.length}):`);
      extraInFallbackCleaning.forEach(r => console.log(`   - ${r.name} (${r.id})`));
    }

    // RÉSUMÉ
    console.log('\n' + '='.repeat(70));
    console.log('📊 RÉSUMÉ');
    console.log('='.repeat(70));

    const needsUpdate =
      movingRulesDB.length !== movingFallbackTotal ||
      cleaningRulesDB.length !== cleaningFallbackTotal ||
      missingInFallback.length > 0 ||
      extraInFallback.length > 0 ||
      missingInFallbackCleaning.length > 0 ||
      extraInFallbackCleaning.length > 0;

    if (needsUpdate) {
      console.log('⚠️  Les fallbacks ne sont PAS à jour avec la BDD');
      console.log('💡 Exécutez: npm run generate:fallbacks');
    } else {
      console.log('✅ Les fallbacks sont à jour avec la BDD');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

compareFallbacks();
