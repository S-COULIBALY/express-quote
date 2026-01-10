import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeRules() {
  try {
    await prisma.$connect();
    console.log('✅ Connecté à la base de données\n');

    const rules = await prisma.rules.findMany({
      where: { isActive: true },
      select: {
        name: true,
        serviceType: true,
        value: true,
        percentBased: true,
        metadata: true,
        category: true,
        ruleType: true
      },
      orderBy: { name: 'asc' }
    });

  console.log('📋 ANALYSE DES MÉTADONNÉES DES RÈGLES:\n');
  console.log(`Total règles actives: ${rules.length}\n`);

    // Grouper par category (du schema, pas metadata)
    const byCategory = rules.reduce((acc, rule) => {
      const category = rule.category || 'UNKNOWN';
      if (!acc[category]) acc[category] = [];
      acc[category].push(rule);
      return acc;
    }, {} as Record<string, any[]>);

    // Afficher par catégorie
    Object.entries(byCategory).forEach(([category, categoryRules]) => {
      console.log(`\n📂 CATÉGORIE: ${category} (${categoryRules.length} règles):`);
      categoryRules.forEach(rule => {
        const metadata = rule.metadata as any;
        const valueDisplay = rule.percentBased ? `${rule.value}%` : `${rule.value}€`;
        console.log(`   - ${rule.name} (${valueDisplay})`);
        console.log(`     → RuleType (schema): ${rule.ruleType || 'N/A'}`);
        console.log(`     → Category (schema): ${rule.category || 'N/A'}`);
        console.log(`     → ServiceType: ${rule.serviceType}`);
        console.log(`     → PercentBased: ${rule.percentBased}`);
        console.log(`     → Metadata: ${JSON.stringify(metadata || {})}`);
      });
    });

    console.log('\n\n📊 RÉSUMÉ PAR CATÉGORIE (schema):');
    Object.entries(byCategory).forEach(([category, categoryRules]) => {
      console.log(`   ${category}: ${categoryRules.length} règles`);
    });

    // Grouper par ruleType
    const byRuleType = rules.reduce((acc, rule) => {
      const ruleType = rule.ruleType || 'UNKNOWN';
      if (!acc[ruleType]) acc[ruleType] = [];
      acc[ruleType].push(rule);
      return acc;
    }, {} as Record<string, any[]>);

    console.log('\n\n📊 RÉSUMÉ PAR RULE TYPE (schema):');
    Object.entries(byRuleType).forEach(([ruleType, typeRules]) => {
      console.log(`   ${ruleType}: ${typeRules.length} règles`);
    });

    await prisma.$disconnect();
    console.log('\n✅ Analyse terminée');
  } catch (error) {
    console.error('❌ Erreur:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

analyzeRules();
