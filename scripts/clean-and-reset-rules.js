#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanRules() {
  console.log('🧹 ═══ NETTOYAGE COMPLET DES RÈGLES BDD ═══\n');

  try {
    // 1. Compter les règles existantes
    const ruleCount = await prisma.rule.count();
    console.log(`📊 Règles existantes en BDD: ${ruleCount}`);

    if (ruleCount === 0) {
      console.log('✅ Aucune règle à supprimer');
      return;
    }

    // 2. Supprimer TOUTES les règles
    console.log('🗑️ Suppression de toutes les règles...');
    const deleteResult = await prisma.rule.deleteMany({});

    console.log(`✅ ${deleteResult.count} règles supprimées avec succès`);

    // 3. Vérification
    const remainingCount = await prisma.rule.count();
    console.log(`📊 Règles restantes: ${remainingCount}`);

    if (remainingCount === 0) {
      console.log('🎉 BDD complètement nettoyée !');
      console.log('\n📋 Prochaines étapes:');
      console.log('   1. Les modaux utiliseront les données hardcodées (fallback)');
      console.log('   2. Amélioration des contraintes CLEANING');
      console.log('   3. Recherche de valeurs réalistes');
      console.log('   4. Migration contrôlée vers BDD');
    } else {
      console.log('⚠️ Attention: Des règles persistent encore');
    }

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanRules();