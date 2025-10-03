#!/usr/bin/env node

/**
 * 🔍 ANALYSE DES RÈGLES EN BASE DE DONNÉES
 *
 * Script pour récupérer et analyser les vraies données des règles
 * pour comprendre pourquoi MOVING fonctionne mais pas CLEANING/PACKING
 */

const { PrismaClient } = require('@prisma/client');

// Configuration Prisma compatible avec le projet
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Debug: vérifier que Prisma est correctement importé
console.log('🔍 [DEBUG] Prisma client:', typeof prisma);
console.log('🔍 [DEBUG] businessRule method:', typeof prisma?.businessRule);
console.log('🔍 [DEBUG] Prisma methods:', Object.getOwnPropertyNames(prisma).slice(0, 10));

console.log('🔍 [DB-RULES] ═══ ANALYSE DES RÈGLES EN BASE ═══');
console.log('📅 Date:', new Date().toISOString());

async function analyzeRules() {
  try {
    // Connexion déjà établie via la configuration globale
    await prisma.$connect();
    console.log('✅ [DB-RULES] Connexion à la base de données établie');

    // 1. Récupérer toutes les règles actives par service
    console.log('\n🔍 [DB-RULES] ═══ RÈGLES PAR SERVICE TYPE ═══');

    const services = ['MOVING', 'CLEANING', 'PACKING', 'DELIVERY'];

    for (const serviceType of services) {
      console.log(`\n📋 [${serviceType}] Analyse des règles...`);

      const rules = await prisma.rule.findMany({
        where: {
          serviceType: serviceType,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          value: true,
          category: true,
          percentBased: true,
          serviceType: true,
          ruleType: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      console.log(`📊 [${serviceType}] ${rules.length} règles trouvées`);

      if (rules.length > 0) {
        // Analyser les règles problématiques (pourcentages > 100)
        const percentageRules = rules.filter(r => r.percentBased);
        const problematicRules = percentageRules.filter(r => r.value > 100);

        console.log(`🔢 [${serviceType}] ${percentageRules.length} règles en pourcentage`);
        console.log(`⚠️ [${serviceType}] ${problematicRules.length} règles problématiques (> 100%)`);

        if (problematicRules.length > 0) {
          console.log(`❌ [${serviceType}] RÈGLES PROBLÉMATIQUES:`);
          problematicRules.forEach(rule => {
            console.log(`   📝 "${rule.name}"`);
            console.log(`   💰 Valeur: ${rule.value} (${rule.percentBased ? 'pourcentage' : 'fixe'})`);
            console.log(`   🏷️ Category: ${rule.category}, RuleType: ${rule.ruleType}`);
            console.log(`   🆔 ID: ${rule.id}`);
            console.log('');
          });
        }

        // Afficher quelques exemples de règles normales
        const normalRules = rules.filter(r => !r.percentBased || r.value <= 100).slice(0, 3);
        if (normalRules.length > 0) {
          console.log(`✅ [${serviceType}] EXEMPLES DE RÈGLES NORMALES:`);
          normalRules.forEach(rule => {
            console.log(`   📝 "${rule.name}"`);
            console.log(`   💰 Valeur: ${rule.value} (${rule.percentBased ? 'pourcentage' : 'fixe'})`);
          });
        }
      }
    }

    // 2. Analyse spécifique des règles qui causent l'erreur
    console.log('\n🎯 [DB-RULES] ═══ RÈGLES SPÉCIFIQUES PROBLÉMATIQUES ═══');

    const specificRules = await prisma.rule.findMany({
      where: {
        OR: [
          { name: { contains: 'nettoyage complexe' } },
          { name: { contains: 'réservation anticipée' } },
          { name: { contains: 'Surcharge pour nettoyage complexe' } },
          { name: { contains: 'Pourcentage de réduction pour réservation anticipée' } }
        ],
        isActive: true
      },
      select: {
        id: true,
        name: true,
        value: true,
        category: true,
        percentBased: true,
        serviceType: true,
        ruleType: true,
        condition: true
      }
    });

    console.log(`🔍 [DB-RULES] ${specificRules.length} règles spécifiques trouvées`);

    specificRules.forEach(rule => {
      console.log(`\n📝 [DB-RULES] RÈGLE: "${rule.name}"`);
      console.log(`   🆔 ID: ${rule.id}`);
      console.log(`   💰 Valeur: ${rule.value}`);
      console.log(`   📊 PercentBased: ${rule.percentBased}`);
      console.log(`   🏷️ Category: ${rule.category}`);
      console.log(`   🎯 ServiceType: ${rule.serviceType}`);
      console.log(`   📋 RuleType: ${rule.ruleType}`);
      if (rule.condition) {
        console.log(`   ⚙️ Condition: ${JSON.stringify(rule.condition)}`);
      }
    });

    // 3. Compter les règles par service et type
    console.log('\n📊 [DB-RULES] ═══ STATISTIQUES PAR SERVICE ═══');

    const stats = await prisma.rule.groupBy({
      by: ['serviceType', 'percentBased'],
      where: { isActive: true },
      _count: { id: true },
      _avg: { value: true },
      _max: { value: true }
    });

    stats.forEach(stat => {
      console.log(`📈 [${stat.serviceType}] ${stat.percentBased ? 'Pourcentage' : 'Fixe'}: ${stat._count.id} règles`);
      console.log(`   💰 Valeur moyenne: ${stat._avg.value?.toFixed(2)}`);
      console.log(`   🔝 Valeur max: ${stat._max.value}`);
    });

  } catch (error) {
    console.error('❌ [DB-RULES] Erreur:', error.message);
    if (error.stack) {
      console.error('📋 [DB-RULES] Stack:', error.stack.substring(0, 500));
    }
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 [DB-RULES] Connexion fermée');
  }
}

console.log('🚀 [DB-RULES] Démarrage de l\'analyse...');
analyzeRules()
  .then(() => {
    console.log('\n✅ [DB-RULES] Analyse terminée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 [DB-RULES] Erreur fatale:', error.message);
    process.exit(1);
  });