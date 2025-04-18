import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkServices() {
  try {
    console.log('Vérification des services dans la base de données...');
    
    const services = await prisma.service.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`Total de services actifs: ${services.length}`);
    
    if (services.length > 0) {
      console.log('\nListe des services:');
      services.forEach((service, index) => {
        console.log(`\n--- Service ${index + 1} ---`);
        console.log(`ID: ${service.id}`);
        console.log(`Nom: ${service.name}`);
        console.log(`Description: ${service.description}`);
        console.log(`Prix: ${service.price}€`);
        console.log(`Durée: ${service.duration} heures`);
        console.log(`Travailleurs: ${service.workers}`);
        console.log(`Catégorie: ${service.categoryId || 'Non définie'}`);
        console.log(`Actif: ${service.isActive}`);
      });
    } else {
      console.log('\nAucun service actif trouvé dans la base de données.');
      console.log('\nConseils de dépannage:');
      console.log('1. Vérifiez que le script de seed a été exécuté: npx prisma db seed');
      console.log('2. Vérifiez que les services ont bien le champ isActive = true');
      console.log('3. Vérifiez la connexion à la base de données dans votre fichier .env');
    }
  } catch (error) {
    console.error('Erreur lors de la vérification des services:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution de la fonction principale
checkServices().catch(e => {
  console.error(e);
  process.exit(1);
}); 