const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding...');

  // Nettoyage des tables existantes (pour éviter les doublons)
  await cleanup();

  // 1. Création des Packs de déménagement prédéfinis
  console.log('Création des packs de déménagement...');
  const packLocation = await prisma.pack.create({
    data: {
      name: 'Pack Location',
      description: '1 camion de 20 M3 + chauffeur',
      price: 400,
      truckSize: 20,
      moversCount: 0,
      driverIncluded: true
    }
  });

  const packSolo = await prisma.pack.create({
    data: {
      name: 'Pack Solo',
      description: '1 camion de 20 M3 + 2 déménageurs',
      price: 600,
      truckSize: 20,
      moversCount: 2,
      driverIncluded: true
    }
  });

  const packEssentiel = await prisma.pack.create({
    data: {
      name: 'Pack Essentiel',
      description: '1 camion de 20 M3 + 3 déménageurs',
      price: 900,
      truckSize: 20,
      moversCount: 3,
      driverIncluded: true
    }
  });

  // 2. Création des Services additionnels
  console.log('Création des services additionnels...');
  const serviceLivraison = await prisma.service.create({
    data: {
      name: 'Livraison de cartons',
      description: 'Livraison de cartons et fournitures diverses',
      price: 80,
      serviceType: 'livraison',
      peopleCount: 1
    }
  });

  const serviceDemontage = await prisma.service.create({
    data: {
      name: 'Démontage et Emballage',
      description: '1 déménageur pour démontage et emballage',
      price: 300,
      serviceType: 'preparation',
      durationDays: 1,
      peopleCount: 1
    }
  });

  const serviceMontage = await prisma.service.create({
    data: {
      name: 'Montage et Déballage',
      description: '1 déménageur pour montage et déballage',
      price: 300,
      serviceType: 'finalisation',
      durationDays: 1,
      peopleCount: 1
    }
  });

  // 3. Création d'un professionnel
  console.log('Création d\'un professionnel...');
  const professional = await prisma.professional.create({
    data: {
      email: 'pro@exemple.com',
      firstName: 'Jean',
      lastName: 'Déménageur',
      phone: '0612345678',
      serviceType: 'moving'
    }
  });

  // 4. Création d'un client
  console.log('Création d\'un client...');
  const customer = await prisma.customer.create({
    data: {
      email: 'client@exemple.com',
      firstName: 'Marie',
      lastName: 'Dupont',
      phone: '0687654321'
    }
  });

  // 5. Création d'un devis
  console.log('Création d\'un devis...');
  const quote = await prisma.quote.create({
    data: {
      status: 'VALIDATED',
      serviceType: 'moving',
      volume: 25,
      distance: 60,
      basePrice: 270,
      finalPrice: 720
    }
  });

  // 6. Création d'une réservation avec devis
  console.log('Création d\'une réservation avec devis...');
  const bookingQuote = await prisma.booking.create({
    data: {
      status: 'CONFIRMED',
      scheduledDate: new Date(2024, 9, 15), // 15 octobre 2024
      originAddress: '123 Rue du Départ, Paris',
      destAddress: '456 Rue d\'Arrivée, Lyon',
      quoteId: quote.id,
      customerId: customer.id,
      professionalId: professional.id,
      services: {
        create: [
          {
            serviceId: serviceDemontage.id,
            serviceDate: new Date(2024, 9, 14) // 14 octobre 2024 (la veille)
          }
        ]
      }
    }
  });

  // 7. Création d'une réservation avec pack
  console.log('Création d\'une réservation avec pack...');
  const bookingPack = await prisma.booking.create({
    data: {
      status: 'CONFIRMED',
      scheduledDate: new Date(2024, 9, 20), // 20 octobre 2024
      originAddress: '789 Avenue du Départ, Marseille',
      destAddress: '101 Boulevard d\'Arrivée, Nice',
      packId: packSolo.id,
      customerId: customer.id,
      professionalId: professional.id,
      services: {
        create: [
          {
            serviceId: serviceLivraison.id,
            serviceDate: new Date(2024, 9, 18) // 18 octobre 2024 (2 jours avant)
          }
        ]
      }
    }
  });

  // 8. Création d'une réservation pour un service uniquement
  console.log('Création d\'une réservation pour un service uniquement...');
  const bookingService = await prisma.booking.create({
    data: {
      status: 'CONFIRMED',
      scheduledDate: new Date(2024, 9, 25), // 25 octobre 2024
      destAddress: '202 Rue du Service, Lille',
      customerId: customer.id,
      professionalId: professional.id,
      services: {
        create: [
          {
            serviceId: serviceMontage.id,
            serviceDate: new Date(2024, 9, 25) // Même jour
          }
        ]
      }
    }
  });

  console.log('✅ Seeding terminé avec succès!');
}

// Fonction pour nettoyer les tables avant le seeding
async function cleanup() {
  console.log('Nettoyage des tables existantes...');
  
  // L'ordre est important pour respecter les contraintes de clés étrangères
  await prisma.bookingService.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.service.deleteMany();
  await prisma.pack.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.professional.deleteMany();
}

// Exécution du seed
main()
  .catch((e) => {
    console.error('Erreur pendant le seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 