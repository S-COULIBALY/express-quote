import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fetchAllRules() {
  try {
    const rules = await prisma.rules.findMany({
      where: { isActive: true },
      orderBy: [
        { serviceType: 'asc' },
        { name: 'asc' }
      ]
    });

    console.log('\n========================================');
    console.log(`📋 TOTAL: ${rules.length} règles actives`);
    console.log('========================================\n');

    // Grouper par serviceType
    const byService = rules.reduce((acc, rule) => {
      if (!acc[rule.serviceType]) acc[rule.serviceType] = [];
      acc[rule.serviceType].push(rule);
      return acc;
    }, {} as Record<string, any[]>);

    for (const [serviceType, serviceRules] of Object.entries(byService)) {
      console.log(`\n🏷️  ${serviceType} (${serviceRules.length} règles)`);
      console.log('='.repeat(80));

      for (let i = 0; i < serviceRules.length; i++) {
        const rule = serviceRules[i];
        console.log(`\n${i + 1}. ${rule.name}`);
        console.log(`   ID: ${rule.id}`);
        console.log(`   configKey: ${rule.configKey || 'NULL'}`);
        console.log(`   ruleType: ${rule.ruleType}`);
        console.log(`   percentBased: ${rule.percentBased}`);
        console.log(`   value: ${rule.value}`);
        console.log(`   condition: ${JSON.stringify(rule.condition, null, 2)}`);
        console.log(`   metadata: ${JSON.stringify(rule.metadata, null, 2)}`);
        console.log(`   tags: ${JSON.stringify(rule.tags)}`);
      }
    }

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fetchAllRules();
