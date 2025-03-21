const { PrismaClient, BookingType, BookingStatus } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Clean up existing data
  console.log('Cleaning up existing data...');
  await prisma.emailAttachment.deleteMany({});
  await prisma.emailLog.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.customer.deleteMany({});
  console.log('Database cleaned');

  // Create customers
  const customer1 = await prisma.customer.create({
    data: {
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+33612345678'
    }
  });

  const customer2 = await prisma.customer.create({
    data: {
      email: 'jane.smith@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+33698765432'
    }
  });

  const customer3 = await prisma.customer.create({
    data: {
      email: 'marc.dubois@example.com',
      firstName: 'Marc',
      lastName: 'Dubois',
      phone: '+33645781236'
    }
  });

  const customer4 = await prisma.customer.create({
    data: {
      email: 'sophie.martin@example.com',
      firstName: 'Sophie',
      lastName: 'Martin',
      phone: '+33678901234'
    }
  });

  console.log('Created customers:', customer1.id, customer2.id, customer3.id, customer4.id);

  // ---- PACKS (6) ----
  const packData = [
    {
      packId: 'pack-essential',
      packName: 'Pack Essentiel',
      description: 'Service de déménagement de base pour appartement ou petit logement',
      totalAmount: 299.99,
      customerId: customer1.id,
      scheduledDate: new Date('2025-05-20T14:00:00Z'),
      location: '123 Avenue de Paris, 75001 Paris',
      items: JSON.stringify({
        truckSize: 12,
        moversCount: 2,
        driverIncluded: true
      })
    },
    {
      packId: 'pack-confort',
      packName: 'Pack Confort',
      description: 'Déménagement avec emballage partiel inclus pour appartement familial',
      totalAmount: 499.99,
      customerId: customer2.id,
      scheduledDate: new Date('2025-06-15T09:00:00Z'),
      location: '45 Rue de Lyon, 75012 Paris',
      items: JSON.stringify({
        truckSize: 20,
        moversCount: 3,
        driverIncluded: true,
        packingService: true
      })
    },
    {
      packId: 'pack-premium',
      packName: 'Pack Premium',
      description: 'Service tout inclus avec emballage/déballage et installation',
      totalAmount: 899.99,
      customerId: customer3.id,
      scheduledDate: new Date('2025-07-10T08:00:00Z'),
      location: '78 Boulevard Haussmann, 75008 Paris',
      items: JSON.stringify({
        truckSize: 25,
        moversCount: 4,
        driverIncluded: true,
        packingService: true,
        unpacking: true,
        insurance: true
      })
    },
    {
      packId: 'pack-express',
      packName: 'Pack Express',
      description: 'Déménagement express en 24h avec service prioritaire',
      totalAmount: 599.99,
      customerId: customer4.id,
      scheduledDate: new Date('2025-04-25T07:00:00Z'),
      location: '12 Rue du Commerce, 75015 Paris',
      items: JSON.stringify({
        truckSize: 15,
        moversCount: 3,
        driverIncluded: true,
        express: true
      })
    },
    {
      packId: 'pack-international',
      packName: 'Pack International',
      description: 'Déménagement vers l\'étranger avec gestion administrative',
      totalAmount: 1499.99,
      customerId: customer1.id,
      scheduledDate: new Date('2025-08-05T10:00:00Z'),
      location: '3 Lexington Avenue, New York, USA',
      items: JSON.stringify({
        truckSize: 30,
        moversCount: 4,
        driverIncluded: true,
        packingService: true,
        customsClearance: true,
        internationalInsurance: true
      })
    },
    {
      packId: 'pack-etudiant',
      packName: 'Pack Étudiant',
      description: 'Solution économique pour studio ou petite surface',
      totalAmount: 199.99,
      customerId: customer2.id,
      scheduledDate: new Date('2025-09-01T13:00:00Z'),
      location: '25 Rue des Écoles, 75005 Paris',
      items: JSON.stringify({
        truckSize: 8,
        moversCount: 2,
        driverIncluded: true,
        studentDiscount: true
      })
    }
  ];

  // Créer les packs
  for (const pack of packData) {
    await prisma.booking.create({
      data: {
        type: BookingType.PACK,
        status: BookingStatus.CONFIRMED,
        ...pack
      }
    });
  }

  console.log('Created 6 packs');

  // ---- SERVICES (6) ----
  const serviceData = [
    {
      serviceId: 'service-montage',
      serviceName: 'Montage de meubles',
      description: 'Montage et installation de meubles en kit',
      totalAmount: 149.50,
      customerId: customer3.id,
      scheduledDate: new Date('2025-04-18T14:00:00Z'),
      scheduledTime: '14:00 - 17:00',
      location: '56 Rue de Sèvres, 75007 Paris',
      items: JSON.stringify({
        serviceType: 'INSTALLATION',
        durationHours: 3,
        peopleCount: 2,
        tools: true
      })
    },
    {
      serviceId: 'service-peinture',
      serviceName: 'Peinture d\'intérieur',
      description: 'Service de peinture pour appartement jusqu\'à 80m²',
      totalAmount: 599.99,
      customerId: customer4.id,
      scheduledDate: new Date('2025-05-05T09:00:00Z'),
      scheduledTime: '09:00 - 18:00',
      location: '34 Avenue Foch, 75116 Paris',
      items: JSON.stringify({
        serviceType: 'RENOVATION',
        durationDays: 2,
        peopleCount: 3,
        paintsIncluded: true,
        squareMeters: 80
      })
    },
    {
      serviceId: 'service-nettoyage',
      serviceName: 'Nettoyage de fin de bail',
      description: 'Nettoyage professionnel pour restitution de caution',
      totalAmount: 249.99,
      customerId: customer1.id,
      scheduledDate: new Date('2025-05-30T10:00:00Z'),
      scheduledTime: '10:00 - 15:00',
      location: '9 Rue de Vaugirard, 75006 Paris',
      items: JSON.stringify({
        serviceType: 'CLEANING',
        durationHours: 5,
        peopleCount: 2,
        productsIncluded: true,
        squareMeters: 60
      })
    },
    {
      serviceId: 'service-emballage',
      serviceName: 'Emballage professionnel',
      description: 'Service d\'emballage sécurisé pour objets fragiles',
      totalAmount: 199.50,
      customerId: customer2.id,
      scheduledDate: new Date('2025-06-10T13:00:00Z'),
      scheduledTime: '13:00 - 19:00',
      location: '17 Rue Oberkampf, 75011 Paris',
      items: JSON.stringify({
        serviceType: 'PACKING',
        durationHours: 6,
        peopleCount: 2,
        materialsIncluded: true,
        specialItems: true
      })
    },
    {
      serviceId: 'service-piano',
      serviceName: 'Transport de piano',
      description: 'Transport spécialisé pour piano droit ou à queue',
      totalAmount: 399.99,
      customerId: customer3.id,
      scheduledDate: new Date('2025-07-15T11:00:00Z'),
      scheduledTime: '11:00 - 13:00',
      location: '28 Boulevard des Italiens, 75009 Paris',
      items: JSON.stringify({
        serviceType: 'SPECIAL_TRANSPORT',
        durationHours: 2,
        peopleCount: 4,
        insurance: true,
        pianoType: 'grand'
      })
    },
    {
      serviceId: 'service-installation-elec',
      serviceName: 'Installation électrique',
      description: 'Installation et mise aux normes d\'équipements électriques',
      totalAmount: 349.75,
      customerId: customer4.id,
      scheduledDate: new Date('2025-08-20T09:00:00Z'),
      scheduledTime: '09:00 - 17:00',
      location: '5 Rue de Rivoli, 75004 Paris',
      items: JSON.stringify({
        serviceType: 'ELECTRICAL',
        durationHours: 8,
        peopleCount: 2,
        certified: true,
        warranty: '2 years'
      })
    }
  ];

  // Créer les services
  for (const service of serviceData) {
    await prisma.booking.create({
      data: {
        type: BookingType.SERVICE,
        status: BookingStatus.CONFIRMED,
        ...service
      }
    });
  }

  console.log('Created 6 services');

  // ---- DEVIS PERSONNALISÉS (2) ----
  const movingQuote1 = await prisma.booking.create({
    data: {
      type: BookingType.MOVING_QUOTE,
      status: BookingStatus.CONFIRMED,
      customerId: customer1.id,
      totalAmount: 1500.0,
      moveDate: new Date('2025-04-15T10:00:00Z'),
      pickupAddress: '123 Rue de Paris, 75001 Paris',
      deliveryAddress: '456 Avenue des Champs-Élysées, 75008 Paris',
      distance: 5.2,
      volume: 25,
      items: JSON.stringify([
        { name: 'Sofa', quantity: 1 },
        { name: 'Bed', quantity: 2 },
        { name: 'Table', quantity: 1 },
        { name: 'Chairs', quantity: 4 }
      ])
    }
  });

  const movingQuote2 = await prisma.booking.create({
    data: {
      type: BookingType.MOVING_QUOTE,
      status: BookingStatus.PAYMENT_COMPLETED,
      customerId: customer2.id,
      totalAmount: 2899.0,
      moveDate: new Date('2025-05-10T08:00:00Z'),
      pickupAddress: '28 Rue Saint-Dominique, 75007 Paris',
      deliveryAddress: '15 Boulevard Saint-Germain, 75005 Paris',
      distance: 3.5,
      volume: 45,
      items: JSON.stringify([
        { name: 'Large Sofa', quantity: 2 },
        { name: 'King Bed', quantity: 1 },
        { name: 'Queen Bed', quantity: 1 },
        { name: 'Dining Table', quantity: 1 },
        { name: 'Chairs', quantity: 8 },
        { name: 'Bookshelf', quantity: 3 },
        { name: 'Wardrobe', quantity: 2 },
        { name: 'Piano', quantity: 1 }
      ])
    }
  });

  console.log('Created 2 custom quotes:', movingQuote1.id, movingQuote2.id);

  // Create a transaction for the pack
  const transaction1 = await prisma.transaction.create({
    data: {
      bookingId: movingQuote2.id,
      amount: 2899.0,
      currency: 'EUR',
      status: 'COMPLETED',
      paymentMethod: 'card',
      paymentIntentId: 'pi_test_123456',
      stripeSessionId: 'cs_test_abcdef'
    }
  });

  console.log('Created transaction:', transaction1.id);

  // Create a document
  const document = await prisma.document.create({
    data: {
      bookingId: movingQuote2.id,
      type: 'BOOKING_CONFIRMATION',
      filename: 'confirmation_quote_123.pdf',
      content: Buffer.from('Sample PDF content') // In real app, this would be actual PDF content
    }
  });

  console.log('Created document:', document.id);

  // Create an email log
  const emailLog = await prisma.emailLog.create({
    data: {
      customerId: customer2.id,
      bookingId: movingQuote2.id,
      subject: 'Confirmation de votre devis personnalisé',
      text: 'Votre devis personnalisé a été confirmé et payé. Merci de votre confiance.',
      html: '<p>Votre devis personnalisé a été confirmé et payé. <strong>Merci de votre confiance</strong>.</p>',
      status: 'SENT',
      sentAt: new Date(),
      attachments: {
        create: {
          documentId: document.id,
          filename: 'confirmation.pdf',
          contentType: 'application/pdf'
        }
      }
    }
  });

  console.log('Created email log:', emailLog.id);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
