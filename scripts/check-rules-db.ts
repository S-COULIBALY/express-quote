import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const allRules = await prisma.rules.findMany({
    orderBy: [
      { serviceType: 'asc' },
      { name: 'asc' }
    ]
  });

  console.log('📊 Total des règles:', allRules.length);
  console.log('');

  const grouped = allRules.reduce((acc, rule) => {
    if (!acc[rule.serviceType]) {
      acc[rule.serviceType] = [];
    }
    acc[rule.serviceType].push(rule);
    return acc;
  }, {} as Record<string, any[]>);

  Object.entries(grouped).forEach(([serviceType, rules]) => {
    console.log('ServiceType:', serviceType, '(', rules.length, 'regles)');
    rules.forEach(rule => {
      const category = (rule.metadata as any)?.category_frontend || 'N/A';
      console.log('   -', rule.name, '(category:', category, ', ruleType:', rule.ruleType, ')');
    });
    console.log('');
  });

  const serviceTypes = Object.keys(grouped);
  console.log('ServiceTypes existants:', serviceTypes);
  console.log('');

  const expectedTypes = ['MOVING', 'CLEANING', 'DELIVERY', 'PACKING', 'MOVING_PREMIUM', 'CLEANING_PREMIUM'];
  console.log('Verification des types attendus:');
  expectedTypes.forEach(type => {
    const exists = serviceTypes.includes(type);
    const count = grouped[type]?.length || 0;
    console.log('  ', exists ? 'OK' : 'MANQUANT', type, ':', count, 'regles');
  });

  await prisma.$disconnect();
}

main().catch(console.error);
