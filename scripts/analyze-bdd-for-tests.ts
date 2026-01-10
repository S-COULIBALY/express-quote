import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("📊 ANALYSE BDD POUR TESTS:\n");

  // 1. Vérifier APIs utilisées
  console.log("1️⃣ APIs de notifications existantes:");
  const notifApis = [
    "/api/notifications/business/booking-confirmation",
    "/api/notifications/business/payment-confirmation",
    "/api/notifications/business/external-professional-attribution",
    "/api/notifications/business/service-reminder",
    "/api/notifications/internal-staff",
    "/api/documents/orchestrate",
  ];
  notifApis.forEach((api) => console.log(`   - ${api}`));

  // 2. Statuts NotificationStatus
  console.log("\n2️⃣ Statuts NotificationStatus valides:");
  const validStatuses = [
    "PENDING",
    "SCHEDULED",
    "SENDING",
    "SENT",
    "DELIVERED",
    "READ",
    "FAILED",
    "CANCELLED",
    "EXPIRED",
    "RETRYING",
  ];
  console.log(`   ${validStatuses.join(", ")}`);

  // 3. Statuts Booking
  const bookings = await prisma.booking.findMany({
    select: { status: true },
    distinct: ["status"],
  });
  console.log("\n3️⃣ Statuts Booking en BDD:");
  console.log(`   ${bookings.map((b) => b.status).join(", ")}`);

  // 4. Canaux de notification
  const channels = await prisma.notifications.findMany({
    select: { channel: true },
    distinct: ["channel"],
    take: 10,
  });
  console.log("\n4️⃣ Canaux de notification utilisés:");
  console.log(`   ${channels.map((c) => c.channel).join(", ") || "Aucun"}`);

  // 5. Templates utilisés
  const templates = await prisma.notifications.findMany({
    where: { template_id: { not: null } },
    select: { template_id: true },
    distinct: ["template_id"],
    take: 20,
  });
  console.log("\n5️⃣ Templates de notification:");
  console.log(
    `   ${templates.map((t) => t.template_id).join(", ") || "Aucun"}`,
  );

  // 6. Internal staff count
  const staffCount = await prisma.internal_staff.count({
    where: { is_active: true },
  });
  console.log(`\n6️⃣ Équipe interne active: ${staffCount} membres`);

  // 7. Professionals count
  const proCount = await prisma.professional.count({
    where: { is_available: true, verified: true },
  });
  console.log(`\n7️⃣ Professionnels disponibles: ${proCount}`);

  // 8. Vérifier si /api/attribution/start existe
  console.log("\n8️⃣ API attribution:");
  console.log("   ⚠️  /api/attribution/start n'existe probablement PAS");
  console.log("   ✅ Utiliser AttributionNotificationService directement");

  // 9. Vérifier les statuts d'attribution
  const attributions = await prisma.booking_attributions.findMany({
    select: { status: true },
    distinct: ["status"],
    take: 10,
  });
  console.log("\n9️⃣ Statuts d'attribution en BDD:");
  console.log(`   ${attributions.map((a) => a.status).join(", ") || "Aucun"}`);

  await prisma.$disconnect();
}

main().catch(console.error);
