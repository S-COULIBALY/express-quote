import {
  PrismaClient,
  ProfessionalType,
  BookingType,
  BookingStatus,
  TransactionStatus,
  DocumentType,
  EmailStatus,
} from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

// Fonction principale de seeding
async function main() {
  console.log("🧹 Nettoyage de la base de données...");

  // Nettoyage des tables existantes (ordre respectant les FK)
  await prisma.emailAttachment.deleteMany({});
  await prisma.emailLog.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.moving.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.quoteRequest.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.professional.deleteMany({});
  await prisma.configuration.deleteMany({});

  // Création des professionnels
  console.log("👷 Création des professionnels...");
  const professionals = await Promise.all([
    prisma.professional.create({
      data: {
        companyName: "Déménagements Express",
        businessType: ProfessionalType.MOVING_COMPANY,
        email: "contact@demenagements-express.fr",
        phone: "0601020304",
        address: "15 rue de la Paix",
        city: "Paris",
        postalCode: "75001",
        verified: true,
        rating: 4.8,
        servicedAreas: ["Paris", "Ile-de-France"],
      },
    }),
    prisma.professional.create({
      data: {
        companyName: "Déménagement Premium",
        businessType: ProfessionalType.MOVING_COMPANY,
        email: "contact@demenagement-premium.fr",
        phone: "0602030405",
        address: "25 avenue des Champs-Élysées",
        city: "Paris",
        postalCode: "75008",
        verified: true,
        rating: 4.6,
      },
    }),
  ]);
  console.log(`  ✓ ${professionals.length} professionnels créés`);

  // Création des clients
  console.log("👤 Création des clients...");
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        email: "jean.dupont@example.com",
        firstName: "Jean",
        lastName: "Dupont",
        phone: "0601020304",
      },
    }),
    prisma.customer.create({
      data: {
        email: "marie.martin@example.com",
        firstName: "Marie",
        lastName: "Martin",
        phone: "0602030405",
      },
    }),
  ]);
  console.log(`  ✓ ${customers.length} clients créés`);

  // Création des demandes de devis
  console.log("📝 Création des demandes de devis...");
  const quoteRequests = await Promise.all([
    prisma.quoteRequest.create({
      data: {
        type: "MOVING",
        status: "DRAFT",
        quoteData: {
          clientName: "Alexandre Dubois",
          email: "alexandre.dubois@example.com",
          phone: "0601020304",
          serviceType: "MOVING",
          estimatedVolume: 25,
          pickupAddress: "12 rue du Commerce, 75015 Paris",
          deliveryAddress: "8 avenue des Ternes, 75017 Paris",
          moveDate: new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        temporaryId: `temp-${randomUUID().substring(0, 8)}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.quoteRequest.create({
      data: {
        type: "MOVING",
        status: "SUBMITTED",
        quoteData: {
          clientName: "Camille Martin",
          email: "camille.martin@example.com",
          phone: "0602030405",
          serviceType: "MOVING",
          estimatedVolume: 15,
          pickupAddress: "5 boulevard Haussmann, 75009 Paris",
          deliveryAddress: "20 rue de Rivoli, 75004 Paris",
          moveDate: new Date(
            Date.now() + 21 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        temporaryId: `temp-${randomUUID().substring(0, 8)}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);
  console.log(`  ✓ ${quoteRequests.length} demandes de devis créées`);

  // Création des réservations
  console.log("📅 Création des réservations...");
  const now = Date.now();
  const threeDaysLater = now + 3 * 24 * 60 * 60 * 1000;

  const booking1 = await prisma.booking.create({
    data: {
      id: randomUUID(),
      type: BookingType.MOVING_QUOTE,
      status: BookingStatus.CONFIRMED,
      customerId: customers[0].id,
      professionalId: professionals[0].id,
      totalAmount: 899.99,
      paymentMethod: "Carte bancaire",
      scheduledDate: new Date(threeDaysLater),
      pickupAddress: "15 rue du Faubourg Saint-Honoré, 75008 Paris",
      deliveryAddress: "7 rue des Rosiers, 75004 Paris",
      distance: 5.2,
      updatedAt: new Date(),
    },
  });

  const booking2 = await prisma.booking.create({
    data: {
      id: randomUUID(),
      type: BookingType.MOVING_QUOTE,
      status: BookingStatus.PAYMENT_COMPLETED,
      customerId: customers[1].id,
      professionalId: professionals[1].id,
      totalAmount: 599.99,
      paymentMethod: "Virement bancaire",
      scheduledDate: new Date(threeDaysLater + 5 * 24 * 60 * 60 * 1000),
      pickupAddress: "5 boulevard Haussmann, 75009 Paris",
      deliveryAddress: "20 rue de Rivoli, 75004 Paris",
      distance: 3.8,
      updatedAt: new Date(),
    },
  });

  const bookings = [booking1, booking2];
  console.log(`  ✓ ${bookings.length} réservations créées`);

  // Création d'un déménagement
  console.log("🚚 Création des déménagements...");
  await prisma.moving.create({
    data: {
      bookingId: bookings[0].id,
      moveDate: new Date(threeDaysLater),
      pickupAddress: "15 rue du Faubourg Saint-Honoré, 75008 Paris",
      deliveryAddress: "7 rue des Rosiers, 75004 Paris",
      distance: 5.2,
      volume: 20,
      pickupFloor: 3,
      deliveryFloor: 1,
      pickupElevator: true,
      deliveryElevator: false,
      propertyType: "Appartement",
      rooms: 2,
      occupants: 2,
    },
  });
  console.log(`  ✓ 1 déménagement créé`);

  // Création des transactions
  console.log("💰 Création des transactions...");
  const transactions = await Promise.all([
    prisma.transaction.create({
      data: {
        bookingId: bookings[0].id,
        amount: bookings[0].totalAmount,
        currency: "EUR",
        status: TransactionStatus.COMPLETED,
        paymentMethod: "Carte bancaire",
        paymentIntentId: `pi_${randomUUID().substring(0, 16)}`,
        stripeSessionId: `sess_${randomUUID().substring(0, 16)}`,
      },
    }),
    prisma.transaction.create({
      data: {
        bookingId: bookings[1].id,
        amount: bookings[1].totalAmount,
        currency: "EUR",
        status: TransactionStatus.COMPLETED,
        paymentMethod: "Virement bancaire",
        paymentIntentId: `pi_${randomUUID().substring(0, 16)}`,
        stripeSessionId: `sess_${randomUUID().substring(0, 16)}`,
      },
    }),
  ]);
  console.log(`  ✓ ${transactions.length} transactions créées`);

  // Création des documents
  console.log("📄 Création des documents...");
  const documents = await Promise.all([
    prisma.document.create({
      data: {
        bookingId: bookings[0].id,
        type: DocumentType.BOOKING_CONFIRMATION,
        filename: "confirmation_reservation.pdf",
        content: Buffer.from(
          "Contenu factice de la confirmation de réservation",
        ),
      },
    }),
    prisma.document.create({
      data: {
        bookingId: bookings[1].id,
        type: DocumentType.INVOICE,
        filename: "facture.pdf",
        content: Buffer.from("Contenu factice de la facture"),
      },
    }),
  ]);
  console.log(`  ✓ ${documents.length} documents créés`);

  // Création des emails
  console.log("📧 Création des emails...");
  const emails = await Promise.all([
    prisma.emailLog.create({
      data: {
        bookingId: bookings[0].id,
        customerId: customers[0].id,
        subject: "Confirmation de votre réservation",
        text: "Votre réservation a été confirmée...",
        html: "<p>Votre réservation a été confirmée...</p>",
        status: EmailStatus.SENT,
        sentAt: new Date(),
      },
    }),
    prisma.emailLog.create({
      data: {
        bookingId: bookings[1].id,
        customerId: customers[1].id,
        subject: "Votre facture",
        text: "Veuillez trouver ci-joint votre facture...",
        html: "<p>Veuillez trouver ci-joint votre facture...</p>",
        status: EmailStatus.SENT,
        sentAt: new Date(),
      },
    }),
  ]);
  console.log(`  ✓ ${emails.length} emails créés`);

  // Création des pièces jointes
  console.log("📎 Création des pièces jointes...");
  const emailAttachments = await Promise.all([
    prisma.emailAttachment.create({
      data: {
        emailId: emails[0].id,
        documentId: documents[0].id,
        filename: "confirmation_reservation.pdf",
        contentType: "application/pdf",
      },
    }),
    prisma.emailAttachment.create({
      data: {
        emailId: emails[1].id,
        documentId: documents[1].id,
        filename: "facture.pdf",
        contentType: "application/pdf",
      },
    }),
  ]);
  console.log(`  ✓ ${emailAttachments.length} pièces jointes créées`);

  console.log("✅ Seed terminé avec succès!");
}

// Exécuter le script principal et gérer les erreurs
main()
  .catch((e) => {
    console.error("❌ Erreur lors du seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
