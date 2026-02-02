import { PrismaClient, ProfessionalType, BookingType, BookingStatus, TransactionStatus, DocumentType, EmailStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { initializeSystem } from '../scripts/init-system';

const prisma = new PrismaClient();

// Fonction principale de seeding
async function main() {
  console.log('🧹 Nettoyage de la base de données...');
  
  // Nettoyage des tables existantes
  await prisma.emailAttachment.deleteMany({});
  await prisma.emailLog.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.moving.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.quoteRequest.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.pack.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.professional.deleteMany({});
  await prisma.rules.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.configuration.deleteMany({});

  // Création des catégories
  console.log('🏷️ Création des catégories...');
  const categories = await Promise.all([
    prisma.category.create({
      data: { id: 'cat-demenagement', name: 'Déménagement', description: 'Services de déménagement', icon: 'truck-moving' }
    }),
    prisma.category.create({
      data: { id: 'cat-nettoyage', name: 'Nettoyage', description: 'Services de nettoyage', icon: 'broom' }
    })
  ]);
  console.log(`  ✓ ${categories.length} catégories créées`);

  // Création des professionnels
  console.log('👷 Création des professionnels...');
  const professionals = await Promise.all([
    prisma.professional.create({
      data: {
        companyName: 'Déménagements Express',
        businessType: ProfessionalType.MOVING_COMPANY,
        email: 'contact@demenagements-express.fr',
        phone: '0601020304',
        address: '15 rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
        verified: true,
        rating: 4.8,
        servicedAreas: ['Paris', 'Ile-de-France']
      }
    }),
    // ✅ Second professionnel déménagement (2026-02: seul MOVING_COMPANY actif)
    prisma.professional.create({
      data: {
        companyName: 'Déménagement Premium',
        businessType: ProfessionalType.MOVING_COMPANY,
        email: 'contact@demenagement-premium.fr',
        phone: '0602030405',
        address: '25 avenue des Champs-Élysées',
        city: 'Paris',
        postalCode: '75008',
        verified: true,
        rating: 4.6
      }
    })
  ]);
  console.log(`  ✓ ${professionals.length} professionnels créés`);

  // Création des clients
  console.log('👤 Création des clients...');
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        email: 'jean.dupont@example.com',
        firstName: 'Jean',
        lastName: 'Dupont',
        phone: '0601020304'
      }
    }),
    prisma.customer.create({
      data: {
        email: 'marie.martin@example.com',
        firstName: 'Marie',
        lastName: 'Martin',
        phone: '0602030405'
      }
    })
  ]);
  console.log(`  ✓ ${customers.length} clients créés`);

  // Création des services (6)
  console.log('🔧 Création des services...');
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Nettoyage Standard',
        description: 'Service de nettoyage standard pour appartements et maisons',
        price: 150.00,
        duration: 3,
        workers: 2,
        includes: ['Nettoyage des sols', 'Dépoussiérage', 'Nettoyage des sanitaires'],
        features: ['Garantie satisfaction', 'Produits écologiques'],
        categoryId: 'cat-nettoyage',
        isActive: true
      }
    }),
    prisma.service.create({
      data: {
        name: 'Nettoyage Premium',
        description: 'Service de nettoyage complet pour appartements et maisons',
        price: 250.00,
        duration: 5,
        workers: 3,
        includes: ['Nettoyage des sols', 'Dépoussiérage', 'Nettoyage des sanitaires', 'Nettoyage des vitres'],
        features: ['Garantie satisfaction', 'Produits écologiques', 'Intervention sous 24h'],
        categoryId: 'cat-nettoyage',
        isActive: true
      }
    }),
    prisma.service.create({
      data: {
        name: 'Emballage Standard',
        description: 'Service d\'emballage pour protéger vos biens lors du déménagement',
        price: 200.00,
        duration: 4,
        workers: 2,
        includes: ['Fourniture de cartons', 'Emballage des objets fragiles', 'Étiquetage'],
        features: ['Garantie casse', 'Matériel fourni'],
        categoryId: 'cat-demenagement',
        isActive: true
      }
    }),
    prisma.service.create({
      data: {
        name: 'Montage de meubles',
        description: 'Montage et installation de meubles',
        price: 120.00,
        duration: 2,
        workers: 1,
        includes: ['Montage', 'Installation', 'Évacuation des emballages'],
        features: ['Garantie montage', 'Outillage professionnel'],
        categoryId: 'cat-demenagement',
        isActive: true
      }
    }),
    prisma.service.create({
      data: {
        name: 'Déménagement Express',
        description: 'Service de déménagement rapide pour petits volumes',
        price: 180.00,
        duration: 3,
        workers: 2,
        includes: ['Chargement', 'Transport', 'Déchargement'],
        features: ['Rapidité', 'Flexibilité'],
        categoryId: 'cat-demenagement',
        isActive: true
      }
    }),
    prisma.service.create({
      data: {
        name: 'Transport spécial',
        description: 'Transport d\'objets volumineux ou fragiles',
        price: 220.00,
        duration: 3,
        workers: 2,
        includes: ['Emballage spécial', 'Transport sécurisé', 'Manutention adaptée'],
        features: ['Assurance tous risques', 'Personnel spécialisé'],
        categoryId: 'cat-demenagement',
        isActive: true
      }
    })
  ]);
  console.log(`  ✓ ${services.length} services créés`);

  // Création des packs (6)
  console.log('📦 Création des packs...');
  const packs = await Promise.all([
    prisma.pack.create({
      data: {
        name: 'Pack Déménagement Studio',
        description: 'Pack complet pour déménager un studio',
        price: 399.99,
        duration: 3,
        workers: 2,
        includes: ['Transport', 'Chargement', 'Déchargement'],
        features: ['Garantie casse', 'Assurance incluse'],
        includedDistance: 30,
        distanceUnit: 'km',
        workersNeeded: 2,
        categoryId: 'cat-demenagement',
        isAvailable: true,
        popular: true
      }
    }),
    prisma.pack.create({
      data: {
        name: 'Pack Déménagement 2 Pièces',
        description: 'Pack complet pour déménager un appartement 2 pièces',
        price: 599.99,
        duration: 4,
        workers: 2,
        includes: ['Transport', 'Chargement', 'Déchargement', 'Démontage/Remontage basique'],
        features: ['Garantie casse', 'Assurance incluse', 'Fourniture de couvertures'],
        includedDistance: 40,
        distanceUnit: 'km',
        workersNeeded: 2,
        categoryId: 'cat-demenagement',
        isAvailable: true,
        popular: true
      }
    }),
    prisma.pack.create({
      data: {
        name: 'Pack Déménagement 3-4 Pièces',
        description: 'Pack complet pour déménager un appartement 3-4 pièces',
        price: 899.99,
        duration: 6,
        workers: 3,
        includes: ['Transport', 'Chargement', 'Déchargement', 'Démontage/Remontage complet'],
        features: ['Garantie casse', 'Assurance incluse', 'Fourniture de cartons'],
        includedDistance: 50,
        distanceUnit: 'km',
        workersNeeded: 3,
        categoryId: 'cat-demenagement',
        isAvailable: true
      }
    }),
    prisma.pack.create({
      data: {
        name: 'Pack Emballage Complet',
        description: 'Service d\'emballage professionnel pour tous vos biens',
        price: 350.00,
        duration: 5,
        workers: 2,
        includes: ['Fourniture de cartons', 'Papier bulle', 'Adhésif', 'Marqueurs'],
        features: ['Garantie casse', 'Emballage spécial objets fragiles'],
        includedDistance: 0,
        distanceUnit: 'km',
        workersNeeded: 2,
        categoryId: 'cat-demenagement',
        isAvailable: true
      }
    }),
    prisma.pack.create({
    data: {
        name: 'Pack Nettoyage Fin de Bail',
        description: 'Nettoyage complet pour restitution de logement',
        price: 299.99,
        duration: 4,
        workers: 2,
        includes: ['Nettoyage complet', 'Détartrage', 'Récurage'],
        features: ['Garantie satisfaction', 'Produits professionnels'],
        includedDistance: 0,
        distanceUnit: 'km',
        workersNeeded: 2,
        categoryId: 'cat-nettoyage',
        isAvailable: true
      }
    }),
    prisma.pack.create({
      data: {
        name: 'Pack Premium Tout-en-Un',
        description: 'Pack complet incluant déménagement, emballage et nettoyage',
        price: 1299.99,
        duration: 8,
        workers: 4,
        includes: ['Transport', 'Emballage/Déballage', 'Démontage/Remontage', 'Nettoyage complet'],
        features: ['Garantie satisfaction', 'Service VIP', 'Coordinateur dédié'],
        includedDistance: 60,
        distanceUnit: 'km',
        workersNeeded: 4,
        categoryId: 'cat-demenagement',
        isAvailable: true,
        popular: true
      }
    })
  ]);
  console.log(`  ✓ ${packs.length} packs créés`);

  // Création des demandes de devis
  console.log('📝 Création des demandes de devis...');
  const quoteRequests = await Promise.all([
    prisma.quoteRequest.create({
    data: {
        type: 'MOVING',
        status: 'DRAFT',
        quoteData: {
          clientName: 'Alexandre Dubois',
          email: 'alexandre.dubois@example.com',
          phone: '0601020304',
          details: {
            moveDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            pickupAddress: '12 rue du Commerce, 75015 Paris',
            deliveryAddress: '8 avenue des Ternes, 75017 Paris'
          }
        },
        temporaryId: `temp-${randomUUID().substring(0, 8)}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    }),
    prisma.quoteRequest.create({
      data: {
        type: 'PACK',
        status: 'SUBMITTED',
        quoteData: {
          clientName: 'Camille Martin',
          email: 'camille.martin@example.com',
          phone: '0602030405',
          details: {
            packType: 'Déménagement Studio',
            preferredDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
          }
        },
        temporaryId: `temp-${randomUUID().substring(0, 8)}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    })
  ]);
  console.log(`  ✓ ${quoteRequests.length} demandes de devis créées`);

  // Création des réservations
  console.log('📅 Création des réservations...');
  const now = Date.now();
  const threeDaysLater = now + 3 * 24 * 60 * 60 * 1000;
  
  // Création de la réservation (anciennement Pack - maintenant MOVING_QUOTE)
  const bookingPack = await prisma.booking.create({
    data: {
      type: BookingType.MOVING_QUOTE,
      status: BookingStatus.CONFIRMED,
      customerId: customers[0].id,
      professionalId: professionals[0].id,
      totalAmount: packs[0].price,
      paymentMethod: 'Carte bancaire'
    }
  });
  
  // Association avec le pack après création
  await prisma.booking.update({
    where: { id: bookingPack.id },
    data: {
      // @ts-ignore - Le champ existe dans le schéma Prisma mais n'est pas reconnu par TypeScript
      packId: packs[0].id,
      scheduledDate: new Date(threeDaysLater)
    }
  });
  
  // Création de la réservation (anciennement Service - maintenant MOVING_QUOTE)
  const bookingService = await prisma.booking.create({
    data: {
      type: BookingType.MOVING_QUOTE,
      status: BookingStatus.PAYMENT_COMPLETED,
      customerId: customers[1].id,
      professionalId: professionals[1].id,
      totalAmount: services[0].price,
      paymentMethod: 'Virement bancaire'
    }
  });
  
  // Association avec le service après création
  await prisma.booking.update({
    where: { id: bookingService.id },
    data: {
      // @ts-ignore - Le champ existe dans le schéma Prisma mais n'est pas reconnu par TypeScript
      serviceId: services[0].id,
      scheduledDate: new Date(threeDaysLater + 5 * 24 * 60 * 60 * 1000)
    }
  });
  
  const bookings = [bookingPack, bookingService];
  console.log(`  ✓ ${bookings.length} réservations créées`);

  // Création d'un déménagement
  console.log('🚚 Création des déménagements...');
  const moving = await prisma.moving.create({
    data: {
      bookingId: bookings[0].id,
      moveDate: new Date(threeDaysLater),
      pickupAddress: '15 rue du Faubourg Saint-Honoré, 75008 Paris',
      deliveryAddress: '7 rue des Rosiers, 75004 Paris',
      distance: 5.2,
      volume: 20,
      pickupFloor: 3,
      deliveryFloor: 1,
      pickupElevator: true,
      deliveryElevator: false,
      propertyType: 'Appartement',
      rooms: 2,
      occupants: 2
    }
  });
  console.log(`  ✓ 1 déménagement créé`);

  // Création des transactions
  console.log('💰 Création des transactions...');
  const transactions = await Promise.all([
    prisma.transaction.create({
    data: {
        bookingId: bookings[0].id,
        amount: bookings[0].totalAmount,
        currency: 'EUR',
      status: TransactionStatus.COMPLETED,
        paymentMethod: 'Carte bancaire',
        paymentIntentId: `pi_${randomUUID().substring(0, 16)}`,
        stripeSessionId: `sess_${randomUUID().substring(0, 16)}`
      }
    }),
    prisma.transaction.create({
    data: {
        bookingId: bookings[1].id,
        amount: bookings[1].totalAmount,
        currency: 'EUR',
      status: TransactionStatus.COMPLETED,
        paymentMethod: 'Virement bancaire',
        paymentIntentId: `pi_${randomUUID().substring(0, 16)}`,
        stripeSessionId: `sess_${randomUUID().substring(0, 16)}`
      }
    })
  ]);
  console.log(`  ✓ ${transactions.length} transactions créées`);

  // Création des documents
  console.log('📄 Création des documents...');
  const documents = await Promise.all([
    prisma.document.create({
      data: {
        bookingId: bookings[0].id,
        type: DocumentType.BOOKING_CONFIRMATION,
        filename: 'confirmation_reservation.pdf',
        content: Buffer.from('Contenu factice de la confirmation de réservation')
      }
    }),
    prisma.document.create({
      data: {
        bookingId: bookings[1].id,
        type: DocumentType.INVOICE,
        filename: 'facture.pdf',
        content: Buffer.from('Contenu factice de la facture')
      }
    })
  ]);
  console.log(`  ✓ ${documents.length} documents créés`);

  // Création des emails
  console.log('📧 Création des emails...');
  const emails = await Promise.all([
    prisma.emailLog.create({
      data: {
        bookingId: bookings[0].id,
        customerId: customers[0].id,
        subject: 'Confirmation de votre réservation',
        text: 'Votre réservation a été confirmée...',
        html: '<p>Votre réservation a été confirmée...</p>',
        status: EmailStatus.SENT,
        sentAt: new Date()
      }
    }),
    prisma.emailLog.create({
    data: {
        bookingId: bookings[1].id,
        customerId: customers[1].id,
        subject: 'Votre facture',
        text: 'Veuillez trouver ci-joint votre facture...',
        html: '<p>Veuillez trouver ci-joint votre facture...</p>',
        status: EmailStatus.SENT,
        sentAt: new Date()
      }
    })
  ]);
  console.log(`  ✓ ${emails.length} emails créés`);

  // Création des pièces jointes
  console.log('📎 Création des pièces jointes...');
  const emailAttachments = await Promise.all([
    prisma.emailAttachment.create({
      data: {
        emailId: emails[0].id,
        documentId: documents[0].id,
        filename: 'confirmation_reservation.pdf',
        contentType: 'application/pdf'
      }
    }),
    prisma.emailAttachment.create({
      data: {
        emailId: emails[1].id,
        documentId: documents[1].id,
        filename: 'facture.pdf',
        contentType: 'application/pdf'
      }
    })
  ]);
  console.log(`  ✓ ${emailAttachments.length} pièces jointes créées`);

  // Initialisation des configurations par défaut et des règles métier
  await initializeSystem();

  console.log('✅ Seed terminé avec succès!');
}

// Exécuter le script principal et gérer les erreurs
main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 