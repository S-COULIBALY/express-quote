import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkSMS() {
  console.log("\n📱 Vérification des SMS envoyés\n");

  const allSMS = await prisma.notifications.findMany({
    where: {
      channel: "SMS",
    },
    orderBy: {
      created_at: "desc",
    },
    take: 10,
    select: {
      id: true,
      recipient_id: true,
      template_id: true,
      status: true,
      created_at: true,
      metadata: true,
    },
  });

  console.log(`Total SMS trouvés (tous): ${allSMS.length}\n`);

  if (allSMS.length === 0) {
    console.log("❌ Aucun SMS trouvé dans la base de données");
    console.log("\n💡 Si vous avez reçu 4 SMS, ils ont peut-être été :");
    console.log("   1. Envoyés directement sans passer par la BDD (bug)");
    console.log("   2. Nettoyés après envoi (pas normal)");
    console.log("   3. Envoyés depuis un autre booking/test\n");

    // Vérifier les bookings récents
    console.log("\n📋 Bookings récents:\n");

    const recentBookings = await prisma.booking.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        customerId: true,
        status: true,
        type: true,
        createdAt: true,
        Customer: {
          select: {
            email: true,
            phone: true,
          },
        },
      },
    });

    recentBookings.forEach((booking, index) => {
      console.log(`${index + 1}. Booking ${booking.id.substring(0, 16)}...`);
      console.log(`   Status    : ${booking.status}`);
      console.log(`   Type      : ${booking.type}`);
      console.log(`   Client    : ${booking.Customer?.email || "N/A"}`);
      console.log(`   Téléphone : ${booking.Customer?.phone || "N/A"}`);
      console.log(
        `   Créé      : ${booking.createdAt.toLocaleString("fr-FR")}`,
      );
      console.log("");
    });

    await prisma.$disconnect();
    return;
  }

  // Grouper par bookingId
  const smsByBooking = new Map<string, any[]>();

  allSMS.forEach((sms) => {
    const metadata = sms.metadata as any;
    const bookingId = metadata?.bookingId || "SANS_BOOKING";

    if (!smsByBooking.has(bookingId)) {
      smsByBooking.set(bookingId, []);
    }
    smsByBooking.get(bookingId)!.push(sms);
  });

  console.log(`📊 SMS groupés par booking:\n`);

  smsByBooking.forEach((smsGroup, bookingId) => {
    console.log(`\n🔹 Booking: ${bookingId.substring(0, 20)}...`);
    console.log(
      `   Nombre de SMS: ${smsGroup.length} ${smsGroup.length > 1 ? "⚠️ ANORMAL" : "✅"}\n`,
    );

    smsGroup.forEach((sms, index) => {
      console.log(`   ${index + 1}. ${sms.recipient_id}`);
      console.log(`      Template: ${sms.template_id}`);
      console.log(`      Status  : ${sms.status}`);
      console.log(`      Créé    : ${sms.created_at.toLocaleString("fr-FR")}`);
    });
  });

  await prisma.$disconnect();
}

checkSMS().catch(console.error);
