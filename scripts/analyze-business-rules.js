#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeRules() {
  console.log('🔍 ═══ ANALYSE DES RÈGLES MÉTIER EN BASE ═══\n');

  try {
    const allRules = await prisma.rule.findMany({
      where: { isActive: true },
      orderBy: [
        { serviceType: 'asc' },
        { percentBased: 'desc' },
        { name: 'asc' }
      ]
    });

    console.log(`📊 Total des règles actives: ${allRules.length}\n`);

    // Grouper par serviceType
    const rulesByService = {};
    allRules.forEach(rule => {
      if (!rulesByService[rule.serviceType]) {
        rulesByService[rule.serviceType] = [];
      }
      rulesByService[rule.serviceType].push(rule);
    });

    // Analyser chaque service
    for (const [serviceType, rules] of Object.entries(rulesByService)) {
      console.log(`🎯 ═══ SERVICE: ${serviceType} (${rules.length} règles) ═══`);

      let totalPercentage = 0;
      let totalFixed = 0;

      rules.forEach((rule, index) => {
        const sign = rule.value >= 0 ? '+' : '';
        const unit = rule.percentBased ? '%' : '€';

        console.log(`   ${index + 1}. ${rule.name}`);
        console.log(`      └─ Valeur: ${sign}${rule.value}${unit} (${rule.percentBased ? 'PERCENTAGE' : 'FIXED'})`);
        console.log(`      └─ Catégorie: ${rule.category}`);
        console.log(`      └─ Condition: ${rule.condition || 'always'}`);

        if (rule.percentBased) {
          totalPercentage += rule.value;
        } else {
          totalFixed += rule.value;
        }
      });

      console.log(`\n   📈 IMPACT TOTAL ${serviceType}:`);
      console.log(`      └─ Pourcentages cumulés: +${totalPercentage}%`);
      console.log(`      └─ Montants fixes: ${totalFixed >= 0 ? '+' : ''}${totalFixed}€`);

      // Vérification cohérence
      if (totalPercentage > 100) {
        console.log(`      ⚠️  ATTENTION: Pourcentage total > 100% (${totalPercentage}%)`);
      }
      if (totalPercentage > 50) {
        console.log(`      ⚠️  ATTENTION: Pourcentage élevé (${totalPercentage}%)`);
      }

      console.log('');
    }

    // Analyse globale
    console.log('🔍 ═══ ANALYSE GLOBALE ═══');

    const percentRules = allRules.filter(r => r.percentBased);
    const fixedRules = allRules.filter(r => !r.percentBased);

    console.log(`📊 Règles pourcentage: ${percentRules.length}`);
    console.log(`💰 Règles fixes: ${fixedRules.length}`);

    if (percentRules.length > 0) {
      const maxPercent = Math.max(...percentRules.map(r => r.value));
      const minPercent = Math.min(...percentRules.map(r => r.value));
      console.log(`📈 Pourcentage max: ${maxPercent}%`);
      console.log(`📉 Pourcentage min: ${minPercent}%`);
    }

    if (fixedRules.length > 0) {
      const maxFixed = Math.max(...fixedRules.map(r => r.value));
      const minFixed = Math.min(...fixedRules.map(r => r.value));
      console.log(`💰 Montant fixe max: ${maxFixed}€`);
      console.log(`💸 Montant fixe min: ${minFixed}€`);
    }

    // Comparaison avec les valeurs attendues
    console.log('\n🔍 ═══ COMPARAISON AVEC VALEURS ATTENDUES ═══');

    const expectedValues = {
      'MOVING': {
        percentageRules: 4,
        fixedRules: 3,
        totalPercentage: 43 // 10 + 15 + 10 + 8
      },
      'CLEANING': {
        percentageRules: 2,
        fixedRules: 0,
        totalPercentage: 99 // 33 + 66
      },
      'DELIVERY': {
        percentageRules: 0,
        fixedRules: 3,
        totalFixed: 55 // 20 + 20 + 15
      }
    };

    for (const [service, expected] of Object.entries(expectedValues)) {
      const actualRules = rulesByService[service] || [];
      const actualPercent = actualRules.filter(r => r.percentBased);
      const actualFixed = actualRules.filter(r => !r.percentBased);

      console.log(`\n📋 ${service}:`);
      console.log(`   Règles % attendues: ${expected.percentageRules || 0}, trouvées: ${actualPercent.length}`);
      console.log(`   Règles fixes attendues: ${expected.fixedRules || 0}, trouvées: ${actualFixed.length}`);

      if (expected.totalPercentage) {
        const actualTotalPercent = actualPercent.reduce((sum, r) => sum + r.value, 0);
        console.log(`   Total % attendu: ${expected.totalPercentage}%, trouvé: ${actualTotalPercent}%`);

        if (actualTotalPercent !== expected.totalPercentage) {
          console.log(`   ❌ DIFFÉRENCE: ${actualTotalPercent - expected.totalPercentage}%`);
        } else {
          console.log(`   ✅ CONFORME`);
        }
      }

      if (expected.totalFixed) {
        const actualTotalFixed = actualFixed.reduce((sum, r) => sum + r.value, 0);
        console.log(`   Total fixe attendu: ${expected.totalFixed}€, trouvé: ${actualTotalFixed}€`);

        if (actualTotalFixed !== expected.totalFixed) {
          console.log(`   ❌ DIFFÉRENCE: ${actualTotalFixed - expected.totalFixed}€`);
        } else {
          console.log(`   ✅ CONFORME`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeRules();