import { PrismaClient, ProfessionalType, BookingType, BookingStatus, TransactionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Création des règles métier
  const rules = await prisma.rule.createMany({
    data: [
      // Règles avec pourcentage
      {
        id: 'rule_volume_small',
        name: 'Réduction pour petit volume',
        description: 'Réduction de 10% pour les déménagements de moins de 10m³',
        type: 'PERCENTAGE',
        value: -10,
        isActive: true
      },
      {
        id: 'rule_volume_large',
        name: 'Réduction pour grand volume',
        description: 'Réduction de 5% pour les déménagements de plus de 50m³',
        type: 'PERCENTAGE',
        value: -5,
        isActive: true
      },
      {
        id: 'rule_weekend',
        name: 'Majoration week-end',
        description: 'Majoration de 25% pour les déménagements le week-end',
        type: 'PERCENTAGE',
        value: 25,
        isActive: true
      },
      {
        id: 'rule_high_season',
        name: 'Majoration haute saison',
        description: 'Majoration de 30% pour les déménagements en haute saison (juin-septembre)',
        type: 'PERCENTAGE',
        value: 30,
        isActive: true
      },
      // Règles d'accès
      {
        id: 'rule_elevator_departure',
        name: 'Location monte-meuble (départ)',
        description: 'Forfait de 100€ pour la location d\'un monte-meuble après le 3ᵉ étage sans ascenseur',
        type: 'FIXED',
        value: 100,
        isActive: true
      },
      {
        id: 'rule_elevator_arrival',
        name: 'Location monte-meuble (arrivée)',
        description: 'Forfait de 100€ pour la location d\'un monte-meuble après le 3ᵉ étage sans ascenseur',
        type: 'FIXED',
        value: 100,
        isActive: true
      },
      {
        id: 'rule_carry_distance_departure',
        name: 'Majoration distance de portage (départ)',
        description: 'Forfait de 30€ pour distance de portage supérieure à 100 mètres',
        type: 'FIXED',
        value: 30,
        isActive: true
      },
      {
        id: 'rule_carry_distance_arrival',
        name: 'Majoration distance de portage (arrivée)',
        description: 'Forfait de 30€ pour distance de portage supérieure à 100 mètres',
        type: 'FIXED',
        value: 30,
        isActive: true
      },
      {
        id: 'rule_stairs_departure',
        name: 'Majoration étages sans ascenseur (départ)',
        description: '5€ par étage jusqu\'au 3ᵉ étage sans ascenseur',
        type: 'PER_UNIT',
        value: 5,
        isActive: true
      },
      {
        id: 'rule_stairs_arrival',
        name: 'Majoration étages sans ascenseur (arrivée)',
        description: '5€ par étage jusqu\'au 3ᵉ étage sans ascenseur',
        type: 'PER_UNIT',
        value: 5,
        isActive: true
      },
      {
        id: 'rule_narrow_stairs_departure',
        name: 'Majoration escaliers étroits (départ)',
        description: 'Forfait de 50€ pour escaliers étroits jusqu\'au 3ᵉ étage sans ascenseur',
        type: 'FIXED',
        value: 50,
        isActive: true
      },
      {
        id: 'rule_narrow_stairs_arrival',
        name: 'Majoration escaliers étroits (arrivée)',
        description: 'Forfait de 50€ pour escaliers étroits jusqu\'au 3ᵉ étage sans ascenseur',
        type: 'FIXED',
        value: 50,
        isActive: true
      },
      // Règles supplémentaires
      {
        id: 'rule_long_distance',
        name: 'Majoration distance longue',
        description: '1.5€/km au-delà de 50 km',
        type: 'PER_UNIT',
        value: 1.5,
        isActive: true
      },
      {
        id: 'rule_fragile_items',
        name: 'Supplément objets fragiles',
        description: 'Forfait de 50€ pour la présence d\'objets fragiles',
        type: 'FIXED',
        value: 50,
        isActive: true
      },
      {
        id: 'rule_night_hours',
        name: 'Majoration horaire',
        description: 'Majoration de 15% pour les déménagements en dehors des heures normales (avant 8h ou après 20h)',
        type: 'PERCENTAGE',
        value: 15,
        isActive: true
      },
      {
        id: 'rule_minimum_price',
        name: 'Tarif minimum',
        description: 'Tarif minimum de 150€',
        type: 'MINIMUM',
        value: 150,
        isActive: true
      }
    ],
    skipDuplicates: true
  });

  // Création des professionnels
  const mover = await prisma.professional.create({
    data: {
      companyName: "Déménagement Express",
      businessType: ProfessionalType.MOVER,
      email: "contact@demenagement-express.fr",
      phone: "0612345678",
      address: "123 rue des Déménageurs",
      city: "Paris",
      postalCode: "75001",
      description: "Spécialiste du déménagement et de l'emballage",
      verified: true,
      verifiedAt: new Date(),
      rating: 4.8,
      availabilities: {
        weekdays: {
          start: "08:00",
          end: "19:00"
        }
      },
      specialties: ["Déménagement", "Emballage", "Manutention"]
    }
  });

  const cleaner = await prisma.professional.create({
    data: {
      companyName: "Nettoyage Pro",
      businessType: ProfessionalType.SERVICE_PROVIDER,
      email: "contact@nettoyage-pro.fr",
      phone: "0623456789",
      address: "456 rue du Nettoyage",
      city: "Paris",
      postalCode: "75002",
      description: "Service de nettoyage professionnel",
      verified: true,
      verifiedAt: new Date(),
      rating: 4.9,
      availabilities: {
        weekdays: {
          start: "09:00",
          end: "18:00"
        },
        saturday: {
          start: "09:00",
          end: "18:00"
        }
      },
      specialties: ["Nettoyage", "Désinfection", "Entretien"]
    }
  });

  // Création des clients
  const client1 = await prisma.customer.create({
    data: {
      email: "jean.dupont@email.com",
      firstName: "Jean",
      lastName: "Dupont",
      phone: "0634567890"
    }
  });

  const client2 = await prisma.customer.create({
    data: {
      email: "marie.martin@email.com",
      firstName: "Marie",
      lastName: "Martin",
      phone: "0645678901"
    }
  });

  const client3 = await prisma.customer.create({
    data: {
      email: "pierre.durand@email.com",
      firstName: "Pierre",
      lastName: "Durand",
      phone: "0656789012"
    }
  });

  // Création des réservations avec leurs relations
  const movingBooking = await prisma.booking.create({
    data: {
      type: BookingType.MOVING_QUOTE,
      status: BookingStatus.DRAFT,
      customerId: client1.id,
      professionalId: mover.id,
      totalAmount: 450.00,
      moving: {
        create: {
          moveDate: new Date("2024-04-15T09:00:00Z"),
          pickupAddress: "123 rue de départ, 75001 Paris",
          deliveryAddress: "456 rue d'arrivée, 75002 Paris",
          distance: 5.5,
          volume: 50,
          pickupFloor: 2,
          deliveryFloor: 3,
          pickupElevator: true,
          deliveryElevator: true,
          propertyType: "Appartement",
          surface: 80,
          rooms: 3,
          occupants: 2,
          pickupCoordinates: { lat: 48.8566, lng: 2.3522 },
          deliveryCoordinates: { lat: 48.8566, lng: 2.3522 },
          packaging: true,
          furniture: true,
          fragile: true,
          storage: false,
          disassembly: true,
          unpacking: true,
          supplies: true,
          fragileItems: true,
          baseCost: 300,
          volumeCost: 100,
          distancePrice: 50,
          optionsCost: 100,
          tollCost: 10,
          fuelCost: 20,
          items: [
            { name: "Cartons", quantity: 20, volume: 20, description: "Cartons standards" },
            { name: "Meubles", quantity: 5, volume: 30, description: "Meubles divers" }
          ]
        }
      }
    }
  });

  // Créer un objet packBooking factice pour éviter les erreurs
  const packBooking = { id: 'dummy-pack-booking-id' };

  const serviceBooking = await prisma.booking.create({
    data: {
      type: BookingType.SERVICE,
      status: BookingStatus.COMPLETED,
      customerId: client3.id,
      professionalId: cleaner.id,
      totalAmount: 150.00,
      service: {
        create: {
          name: "Nettoyage Standard",
          description: "Service de nettoyage standard",
          price: 150.00,
          duration: 3,
          includes: ["Nettoyage des sols", "Dépoussiérage", "Nettoyage des surfaces"],
          scheduledDate: new Date("2024-03-15T10:00:00Z"),
          location: "345 rue du service, 75005 Paris"
        }
      }
    }
  });

  // Création des transactions
  await prisma.transaction.create({
    data: {
      bookingId: packBooking.id,
      amount: 499.99,
      status: TransactionStatus.COMPLETED,
      paymentMethod: "Carte bancaire",
      paymentIntentId: "pi_123456789",
      stripeSessionId: "cs_123456789"
    }
  });

  await prisma.transaction.create({
    data: {
      bookingId: serviceBooking.id,
      amount: 150.00,
      status: TransactionStatus.COMPLETED,
      paymentMethod: "Carte bancaire",
      paymentIntentId: "pi_987654321",
      stripeSessionId: "cs_987654321"
    }
  });

  // Commenté car le schéma a changé et duration/maxVolume ont été retirés
  /*
  // Création d'un pack de déménagement complet
  const packId = 'pack_test_123';
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  
  // Créer un pack sans duration et maxVolume
  await prisma.pack.create({
    data: {
      id: packId,
      name: "Pack Déménagement Complet",
      description: "Notre pack complet inclut tout ce dont vous avez besoin pour votre déménagement",
      price: 1500,
      scheduledDate: tomorrowDate,
      pickupAddress: "123 Rue de Paris, 75001 Paris",
      deliveryAddress: "456 Avenue des Champs-Élysées, 75008 Paris",
      includes: ["Transport", "Chargement", "Déchargement", "Montage/démontage", "Emballage"],
      booking: {
        connect: {
          id: packBooking.id
        }
      }
    }
  });
  */

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 