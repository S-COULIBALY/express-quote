import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDatabase() {
  console.log('🔍 Vérification de la connexion à la base de données...');
  
  try {
    // Tester la connexion
    await prisma.$connect();
    console.log('✅ Connexion à la base de données établie avec succès!');
    
    // Vérifier la table des services
    const servicesCount = await prisma.service.count();
    console.log(`📊 Table 'service': ${servicesCount} enregistrements`);
    
    // Vérifier si la colonne isActive existe
    try {
      const activeServices = await prisma.service.count({
        where: { isActive: true }
      });
      console.log(`📊 Services actifs: ${activeServices} enregistrements`);
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des services actifs:', error);
      console.log('⚠️ La colonne isActive pourrait ne pas exister dans la table service');
    }
    
    // Vérifier les autres tables importantes
    const categoriesCount = await prisma.category.count();
    const packsCount = await prisma.pack.count();
    const configCount = await prisma.configuration.count();
    const rulesCount = await prisma.rule.count();
    
    console.log(`📊 Table 'category': ${categoriesCount} enregistrements`);
    console.log(`📊 Table 'pack': ${packsCount} enregistrements`);
    console.log(`📊 Table 'configuration': ${configCount} enregistrements`);
    console.log(`📊 Table 'rule': ${rulesCount} enregistrements`);
    
    console.log('\n✅ Vérification de la base de données terminée.');
    console.log('Si les nombres correspondent à vos attentes, la base de données est correctement configurée.');
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de la base de données:', error);
    console.log('\n🔧 Conseils de dépannage:');
    console.log('1. Vérifiez que votre fichier .env contient les bonnes informations de connexion.');
    console.log('2. Vérifiez que votre base de données est en cours d\'exécution.');
    console.log('3. Exécutez "npx prisma migrate deploy" pour appliquer les migrations.');
    console.log('4. Exécutez "npx prisma db seed" pour peupler la base de données.');
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la fonction
verifyDatabase()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 