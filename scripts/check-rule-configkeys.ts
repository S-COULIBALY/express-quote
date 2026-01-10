import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkConfigKeys() {
  const rules = await prisma.rules.findMany({
    where: {
      serviceType: 'MOVING',
      isActive: true
    },
    select: {
      id: true,
      name: true,
      configKey: true,
      condition: true
    },
    take: 10
  });

  console.log('📋 RÈGLES MOVING (10 premiers):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const rule of rules) {
    console.log(`📌 ${rule.name}`);
    console.log(`   UUID: ${rule.id}`);
    console.log(`   configKey: ${rule.configKey || 'null'}`);
    console.log(`   condition: ${JSON.stringify(rule.condition)}`);
    console.log('');
  }

  await prisma.$disconnect();
}

checkConfigKeys();
