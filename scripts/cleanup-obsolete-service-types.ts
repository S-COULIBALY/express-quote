/**
 * Script de nettoyage des types de services obsolètes
 *
 * Supprime toutes les données avec les types obsolètes :
 * - CLEANING, DELIVERY, PACKING, CLEANING_PREMIUM, SERVICE
 *
 * ⚠️ ATTENTION : Ce script supprime définitivement les données !
 * Utiliser uniquement en développement.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupObsoleteData() {
  console.log("🧹 Début du nettoyage des types de services obsolètes...\n");

  try {
    // 1. Vérifier les données obsolètes
    console.log("📊 Vérification des données obsolètes...");

    const obsoleteQuotes = await prisma.quoteRequest.count({
      where: {
        type: {
          in: [
            "CLEANING",
            "DELIVERY",
            "PACKING",
            "CLEANING_PREMIUM",
            "SERVICE",
          ],
        },
      },
    });

    const obsoleteBookings = await prisma.booking.count({
      where: {
        type: { in: ["PACKING", "SERVICE"] },
      },
    });

    const obsoleteAttributions = await prisma.booking_attributions.count({
      where: {
        service_type: { in: ["CLEANING", "DELIVERY", "PACKING", "SERVICE"] },
      },
    });

    const obsoleteBlacklists = await prisma.professional_blacklists.count({
      where: {
        service_type: { in: ["CLEANING", "DELIVERY", "PACKING", "SERVICE"] },
      },
    });

    const obsoleteProfessionals = await prisma.professional.findMany({
      where: {
        OR: [
          { service_types: { path: ["$"], array_contains: ["CLEANING"] } },
          { service_types: { path: ["$"], array_contains: ["DELIVERY"] } },
          { service_types: { path: ["$"], array_contains: ["PACKING"] } },
          { service_types: { path: ["$"], array_contains: ["SERVICE"] } },
        ],
      },
      select: { id: true, companyName: true, service_types: true },
    });

    console.log(`   QuoteRequests obsolètes: ${obsoleteQuotes}`);
    console.log(`   Bookings obsolètes: ${obsoleteBookings}`);
    console.log(`   Attributions obsolètes: ${obsoleteAttributions}`);
    console.log(`   Blacklists obsolètes: ${obsoleteBlacklists}`);
    console.log(
      `   Professionals avec types obsolètes: ${obsoleteProfessionals.length}\n`,
    );

    if (
      obsoleteQuotes === 0 &&
      obsoleteBookings === 0 &&
      obsoleteAttributions === 0 &&
      obsoleteBlacklists === 0 &&
      obsoleteProfessionals.length === 0
    ) {
      console.log(
        "✅ Aucune donnée obsolète trouvée. Le nettoyage n'est pas nécessaire.\n",
      );
      return;
    }

    // 2. Supprimer les données obsolètes
    console.log("🗑️  Suppression des données obsolètes...\n");

    // Supprimer les attributions obsolètes
    if (obsoleteAttributions > 0) {
      const deletedAttributions = await prisma.booking_attributions.deleteMany({
        where: {
          service_type: { in: ["CLEANING", "DELIVERY", "PACKING", "SERVICE"] },
        },
      });
      console.log(`   ✅ ${deletedAttributions.count} attributions supprimées`);
    }

    // Supprimer les blacklists obsolètes
    if (obsoleteBlacklists > 0) {
      const deletedBlacklists = await prisma.professional_blacklists.deleteMany(
        {
          where: {
            service_type: {
              in: ["CLEANING", "DELIVERY", "PACKING", "SERVICE"],
            },
          },
        },
      );
      console.log(`   ✅ ${deletedBlacklists.count} blacklists supprimées`);
    }

    // Supprimer les bookings obsolètes (cascade supprimera les transactions, documents, etc.)
    // ⚠️ IMPORTANT : Supprimer d'abord les enregistrements liés pour éviter les contraintes FK
    if (obsoleteBookings > 0) {
      // 1. Supprimer les scheduled_reminders liés
      const deletedReminders = await prisma.scheduled_reminders.deleteMany({
        where: {
          Booking: {
            type: { in: ["PACKING", "SERVICE"] },
          },
        },
      });
      console.log(
        `   ✅ ${deletedReminders.count} scheduled_reminders supprimés`,
      );

      // 2. Supprimer les transactions liées
      const deletedTransactions = await prisma.transaction.deleteMany({
        where: {
          Booking: {
            type: { in: ["PACKING", "SERVICE"] },
          },
        },
      });
      console.log(`   ✅ ${deletedTransactions.count} transactions supprimées`);

      // 3. Supprimer les documents liés
      const deletedDocuments = await prisma.document.deleteMany({
        where: {
          Booking: {
            type: { in: ["PACKING", "SERVICE"] },
          },
        },
      });
      console.log(`   ✅ ${deletedDocuments.count} documents supprimés`);

      // 4. Supprimer les payments liés
      const deletedPayments = await prisma.payments.deleteMany({
        where: {
          Booking: {
            type: { in: ["PACKING", "SERVICE"] },
          },
        },
      });
      console.log(`   ✅ ${deletedPayments.count} payments supprimés`);

      // 5. Supprimer les email_logs liés
      const deletedEmailLogs = await prisma.emailLog.deleteMany({
        where: {
          Booking: {
            type: { in: ["PACKING", "SERVICE"] },
          },
        },
      });
      console.log(`   ✅ ${deletedEmailLogs.count} email_logs supprimés`);

      // 6. Supprimer les items liés
      const deletedItems = await prisma.items.deleteMany({
        where: {
          booking_id: {
            in: (
              await prisma.booking.findMany({
                where: { type: { in: ["PACKING", "SERVICE"] } },
                select: { id: true },
              })
            ).map((b) => b.id),
          },
        },
      });
      console.log(`   ✅ ${deletedItems.count} items supprimés`);

      // 7. Enfin, supprimer les bookings
      const deletedBookings = await prisma.booking.deleteMany({
        where: {
          type: { in: ["PACKING", "SERVICE"] },
        },
      });
      console.log(`   ✅ ${deletedBookings.count} bookings supprimés`);
    }

    // Supprimer les quote requests obsolètes
    if (obsoleteQuotes > 0) {
      const deletedQuotes = await prisma.quoteRequest.deleteMany({
        where: {
          type: {
            in: [
              "CLEANING",
              "DELIVERY",
              "PACKING",
              "CLEANING_PREMIUM",
              "SERVICE",
            ],
          },
        },
      });
      console.log(`   ✅ ${deletedQuotes.count} quote requests supprimées`);
    }

    // Nettoyer les service_types des professionals
    if (obsoleteProfessionals.length > 0) {
      console.log(
        `   🔄 Nettoyage des service_types pour ${obsoleteProfessionals.length} professionals...`,
      );

      for (const pro of obsoleteProfessionals) {
        const currentTypes = (pro.service_types as string[]) || [];
        const cleanedTypes = currentTypes.filter(
          (type) =>
            !["CLEANING", "DELIVERY", "PACKING", "SERVICE"].includes(type),
        );

        // Si aucun type ne reste, mettre MOVING par défaut
        const finalTypes = cleanedTypes.length > 0 ? cleanedTypes : ["MOVING"];

        await prisma.professional.update({
          where: { id: pro.id },
          data: { service_types: finalTypes },
        });
      }
      console.log(
        `   ✅ ${obsoleteProfessionals.length} professionals mis à jour`,
      );
    }

    console.log("\n✅ Nettoyage terminé avec succès !\n");
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
cleanupObsoleteData()
  .then(() => {
    console.log("✅ Script terminé");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur fatale:", error);
    process.exit(1);
  });
