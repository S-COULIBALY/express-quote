const { PrismaClient } = require('@prisma/client');

// Créer une instance de client Prisma
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('=== VÉRIFICATION DE LA CONNEXION À LA BASE DE DONNÉES ===');
  
  try {
    console.log('Tentative de connexion à la base de données...');
    await prisma.$connect();
    console.log('✅ Connexion à la base de données réussie!');
  } catch (error) {
    console.error('❌ Échec de la connexion à la base de données:', error);
    process.exit(1);
  }
  
  console.log('\n=== VÉRIFICATION DES DONNÉES DE RÈGLES (RULES) ===');
  try {
    const rulesCount = await prisma.rule.count();
    console.log(`Nombre total de règles: ${rulesCount}`);
    
    if (rulesCount > 0) {
      const allRules = await prisma.rule.findMany();
      console.log('Première règle:');
      console.log(allRules[0]);
      
      console.log('\nDécompte des règles par serviceType:');
      const serviceTypes = [...new Set(allRules.map(rule => rule.serviceType))];
      for (const type of serviceTypes) {
        const count = allRules.filter(rule => rule.serviceType === type).length;
        console.log(`- ${type}: ${count} règles`);
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des règles:', error);
  }
  
  console.log('\n=== VÉRIFICATION DES DONNÉES DE CONFIGURATION ===');
  try {
    let configExists = true;
    try {
      // Tester si la table configuration existe
      await prisma.configuration.findFirst();
    } catch (error) {
      configExists = false;
      console.log('❌ La table configuration n\'existe pas ou n\'est pas accessible');
    }
    
    if (configExists) {
      const configCount = await prisma.configuration.count();
      console.log(`Nombre total de configurations: ${configCount}`);
      
      if (configCount > 0) {
        const allConfigs = await prisma.configuration.findMany();
        console.log('Première configuration:');
        console.log(allConfigs[0]);
        
        console.log('\nDécompte des configurations par catégorie:');
        const categories = [...new Set(allConfigs.map(config => config.category))];
        for (const category of categories) {
          const count = allConfigs.filter(config => config.category === category).length;
          console.log(`- ${category}: ${count} configurations`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des configurations:', error);
  }
  
  console.log('\n=== VÉRIFICATION DES DONNÉES DE PACKS ET SERVICES ===');
  try {
    const packCount = await prisma.pack.count();
    const serviceCount = await prisma.service.count();
    
    console.log(`Nombre total de packs: ${packCount}`);
    console.log(`Nombre total de services: ${serviceCount}`);
    
    if (packCount > 0) {
      const firstPack = await prisma.pack.findFirst();
      console.log('\nPremier pack:');
      console.log(firstPack);
    }
    
    if (serviceCount > 0) {
      const firstService = await prisma.service.findFirst();
      console.log('\nPremier service:');
      console.log(firstService);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des packs et services:', error);
  }
  
  // Fermer la connexion
  await prisma.$disconnect();
}

// Exécuter le script
main()
  .catch(e => {
    console.error('Erreur lors de l\'exécution du script:', e);
    process.exit(1);
  }); 