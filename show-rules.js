const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('\n=== RÈGLES (5 premières) ===');
    const rules = await prisma.rule.findMany({ take: 5 });
    rules.forEach((rule, index) => {
      console.log(`\nRègle #${index + 1}:`);
      console.log(`ID: ${rule.id}`);
      console.log(`Nom: ${rule.name}`);
      console.log(`Description: ${rule.description}`);
      console.log(`ServiceType: ${rule.serviceType}`);
      console.log(`Valeur: ${rule.value}`);
      console.log(`Catégorie: ${rule.category}`);
      console.log(`Actif: ${rule.isActive}`);
    });

    console.log('\n\n=== CONFIGURATIONS (5 premières) ===');
    const configs = await prisma.configuration.findMany({ take: 5 });
    configs.forEach((config, index) => {
      console.log(`\nConfiguration #${index + 1}:`);
      console.log(`ID: ${config.id}`);
      console.log(`Catégorie: ${config.category}`);
      console.log(`Clé: ${config.key}`);
      console.log(`Valeur: ${JSON.stringify(config.value)}`);
      console.log(`Description: ${config.description}`);
      console.log(`Actif: ${config.isActive}`);
    });

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 