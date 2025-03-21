import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Début de la création des données...');

  // Suppression des données existantes
  await prisma.bookingService.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.pack.deleteMany({});
  await prisma.quote.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.professional.deleteMany({});
  await prisma.businessRule.deleteMany({});

  console.log('Données existantes supprimées.');

  // Création des packs
  const packLocation = await prisma.pack.create({
    data: {
      name: 'Pack Location',
      description: '1 camion de 20 M3 + chauffeur',
      price: 400,
      truckSize: 20,
      moversCount: 0,
      driverIncluded: true,
      active: true,
    },
  });

  const packSolo = await prisma.pack.create({
    data: {
      name: 'Pack Solo',
      description: '1 camion de 20 M3 + 2 déménageurs',
      price: 600,
      truckSize: 20, 
      moversCount: 2,
      driverIncluded: false,
      active: true,
    },
  });

  const packEssentiel = await prisma.pack.create({
    data: {
      name: 'Pack Essentiel',
      description: '1 camion de 20 M3 + 3 déménageurs',
      price: 900,
      truckSize: 20,
      moversCount: 3,
      driverIncluded: false,
      active: true,
    },
  });

  console.log('Packs créés.');

  // Création des services
  const serviceLivraison = await prisma.service.create({
    data: {
      name: 'Livraison de cartons',
      description: 'Livraison de cartons et fournitures diverses',
      price: 80,
      serviceType: 'DELIVERY',
      active: true,
    },
  });

  const serviceDemontage = await prisma.service.create({
    data: {
      name: 'Démontage + Emballage',
      description: '1 déménageur pour démonter et emballer vos affaires',
      price: 300,
      serviceType: 'DISMANTLING',
      durationDays: 1,
      peopleCount: 1,
      active: true,
    },
  });

  const serviceMontage = await prisma.service.create({
    data: {
      name: 'Montage + Déballage',
      description: '1 déménageur pour monter et déballer vos affaires',
      price: 300,
      serviceType: 'ASSEMBLY',
      durationDays: 1,
      peopleCount: 1,
      active: true,
    },
  });

  console.log('Services créés.');

  // Création de clients
  const client1 = await prisma.customer.create({
    data: {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@example.com',
      phone: '0123456789',
    },
  });

  const client2 = await prisma.customer.create({
    data: {
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'marie.martin@example.com',
      phone: '0987654321',
    },
  });

  console.log('Clients créés.');

  // Création de professionnels
  const pro1 = await prisma.professional.create({
    data: {
      firstName: 'Pierre',
      lastName: 'Dubois',
      email: 'pierre.dubois@example.com',
      phone: '0654321987',
      serviceType: 'MOVING',
    },
  });

  const pro2 = await prisma.professional.create({
    data: {
      firstName: 'Sophie',
      lastName: 'Leroy',
      email: 'sophie.leroy@example.com',
      phone: '0698765432',
      serviceType: 'ASSEMBLY',
    },
  });

  console.log('Professionnels créés.');

  // Création d'un devis
  const quote1 = await prisma.quote.create({
    data: {
      status: 'ACCEPTED',
      serviceType: 'MOVING',
      volume: 25,
      distance: 60,
      basePrice: 250,
      finalPrice: 350,
    },
  });

  console.log('Devis créés.');

  // Création d'une réservation avec pack
  const bookingPack = await prisma.booking.create({
    data: {
      status: 'SCHEDULED',
      scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Dans 7 jours
      originAddress: '123 rue de Paris, 75001 Paris',
      destAddress: '456 avenue des Champs-Élysées, 75008 Paris',
      pack: {
        connect: { id: packSolo.id },
      },
      customer: {
        connect: { id: client1.id },
      },
      professional: {
        connect: { id: pro1.id },
      },
    },
  });

  // Création d'une réservation avec devis
  const bookingQuote = await prisma.booking.create({
    data: {
      status: 'SCHEDULED',
      scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Dans 14 jours
      originAddress: '789 boulevard Saint-Germain, 75006 Paris',
      destAddress: '101 rue de Rivoli, 75001 Paris',
      quote: {
        connect: { id: quote1.id },
      },
      customer: {
        connect: { id: client2.id },
      },
      professional: {
        connect: { id: pro1.id },
      },
    },
  });

  // Ajout d'un service à une réservation
  const bookingService = await prisma.bookingService.create({
    data: {
      booking: {
        connect: { id: bookingPack.id },
      },
      service: {
        connect: { id: serviceLivraison.id },
      },
      serviceDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Dans 3 jours
      address: '123 rue de Paris, 75001 Paris',
    },
  });

  console.log('Réservations créées.');

  console.log('Données de test créées avec succès !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 