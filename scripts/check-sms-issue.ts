import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkSMSIssue() {
  console.log("🔍 Investigation du problème SMS pour 0751262080...\n");

  // 1. Vérifier les clients avec ce numéro
  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        { phone: { contains: "751262080" } },
        { phone: { contains: "669444719" } },
      ],
    },
    select: {
      id: true,
      email: true,
      phone: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  console.log("📱 Customers trouvés:");
  if (customers.length === 0) {
    console.log("   ❌ Aucun customer trouvé avec ces numéros");
  } else {
    customers.forEach((c) => {
      console.log(`   - ID: ${c.id}`);
      console.log(`     Email: ${c.email}`);
      console.log(`     Phone: ${c.phone}`);
      console.log(`     Créé: ${c.createdAt}`);
      console.log("");
    });
  }

  // 2. Vérifier les notifications SMS
  const notifications = await prisma.notifications.findMany({
    where: {
      OR: [
        { recipient_id: { contains: "751262080" } },
        { recipient_id: { contains: "669444719" } },
      ],
    },
    select: {
      id: true,
      channel: true,
      status: true,
      recipient_id: true,
      subject: true,
      created_at: true,
      sent_at: true,
      failed_at: true,
      last_error: true,
      metadata: true,
    },
    orderBy: { created_at: "desc" },
    take: 10,
  });

  console.log("\n📨 Notifications trouvées:");
  if (notifications.length === 0) {
    console.log("   ❌ Aucune notification trouvée pour ces numéros");
  } else {
    notifications.forEach((n) => {
      console.log(`   - ID: ${n.id}`);
      console.log(`     Canal: ${n.channel}`);
      console.log(`     Status: ${n.status}`);
      console.log(`     Destinataire: ${n.recipient_id}`);
      console.log(`     Sujet: ${n.subject || "N/A"}`);
      console.log(`     Créé: ${n.created_at}`);
      console.log(`     Envoyé: ${n.sent_at || "Non envoyé"}`);
      console.log(`     Échoué: ${n.failed_at || "N/A"}`);
      console.log(`     Erreur: ${n.last_error || "Aucune"}`);
      console.log(`     Metadata: ${JSON.stringify(n.metadata)}`);
      console.log("");
    });
  }

  // 3. Vérifier les réservations récentes avec paiement
  const recentBookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 dernières heures
      },
    },
    include: {
      Customer: {
        select: {
          email: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  console.log("\n📋 Réservations récentes (24h):");
  if (recentBookings.length === 0) {
    console.log("   ❌ Aucune réservation récente trouvée");
  } else {
    recentBookings.forEach((b) => {
      console.log(`   - Booking ID: ${b.id}`);
      console.log(`     Status: ${b.status}`);
      console.log(`     Customer Email: ${b.Customer?.email || "N/A"}`);
      console.log(`     Customer Phone: ${b.Customer?.phone || "N/A"}`);
      console.log(`     Créé: ${b.createdAt}`);
      console.log("");
    });
  }

  await prisma.$disconnect();
}

checkSMSIssue().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exit(1);
});
