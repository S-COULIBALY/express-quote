import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkBookingSMS() {
  console.log("🔍 Vérification des SMS pour le booking récent...\n");

  // Trouver le booking récent
  const booking = await prisma.booking.findFirst({
    where: {
      customerId: "76644352-35fa-4515-8a3d-18ae9276b664",
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
  });

  if (!booking) {
    console.log("❌ Aucun booking trouvé pour ce customer");
    await prisma.$disconnect();
    return;
  }

  console.log("📋 Booking trouvé:");
  console.log(`   ID: ${booking.id}`);
  console.log(`   Status: ${booking.status}`);
  console.log(`   Customer Email: ${booking.Customer?.email}`);
  console.log(`   Customer Phone: ${booking.Customer?.phone}`);
  console.log(`   Créé: ${booking.createdAt}`);
  console.log("");

  // Chercher TOUTES les notifications pour ce booking
  const allNotifications = await prisma.notifications.findMany({
    where: {
      metadata: {
        path: ["bookingId"],
        equals: booking.id,
      },
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
    orderBy: { created_at: "asc" },
  });

  console.log(
    `📨 Toutes les notifications pour ce booking (${allNotifications.length}):`,
  );

  if (allNotifications.length === 0) {
    console.log("   ❌ Aucune notification trouvée !");
  } else {
    allNotifications.forEach((n, index) => {
      console.log(`\n   [${index + 1}] ID: ${n.id}`);
      console.log(`       Canal: ${n.channel}`);
      console.log(`       Status: ${n.status}`);
      console.log(`       Destinataire: ${n.recipient_id}`);
      console.log(`       Sujet: ${n.subject || "N/A"}`);
      console.log(`       Créé: ${n.created_at}`);
      console.log(`       Envoyé: ${n.sent_at || "Non envoyé"}`);
      console.log(`       Échoué: ${n.failed_at || "N/A"}`);
      console.log(`       Erreur: ${n.last_error || "Aucune"}`);
      console.log(`       Source: ${(n.metadata as any)?.source || "N/A"}`);
    });
  }

  // Résumé par canal
  const smsNotifications = allNotifications.filter((n) => n.channel === "SMS");
  const emailNotifications = allNotifications.filter(
    (n) => n.channel === "EMAIL",
  );
  const whatsappNotifications = allNotifications.filter(
    (n) => n.channel === "WHATSAPP",
  );

  console.log("\n📊 RÉSUMÉ PAR CANAL:");
  console.log(`   📧 Email: ${emailNotifications.length}`);
  console.log(`   📱 SMS: ${smsNotifications.length}`);
  console.log(`   💬 WhatsApp: ${whatsappNotifications.length}`);

  console.log("\n🔍 DÉTAILS SMS:");
  if (smsNotifications.length === 0) {
    console.log("   ❌ AUCUN SMS TROUVÉ - C'EST LE PROBLÈME !");
    console.log(
      "   ℹ️  Le numéro dans Customer est: " + booking.Customer?.phone,
    );
    console.log("   ℹ️  Format attendu: +33751262080 (E.164)");
    console.log("   ℹ️  Format actuel: " + booking.Customer?.phone);

    if (booking.Customer?.phone && !booking.Customer.phone.startsWith("+")) {
      console.log("   ⚠️  CAUSE PROBABLE: Le numéro n'est pas au format E.164");
      console.log(
        "   ✅  SOLUTION: Normaliser le numéro lors de la création du customer",
      );
    }
  } else {
    smsNotifications.forEach((sms) => {
      console.log(`   - Status: ${sms.status}`);
      console.log(`     Destinataire: ${sms.recipient_id}`);
      console.log(`     Source: ${(sms.metadata as any)?.source || "N/A"}`);
    });
  }

  await prisma.$disconnect();
}

checkBookingSMS().catch(console.error);
