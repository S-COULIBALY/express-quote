import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkInternalStaff() {
  console.log(
    "\n📊 Membres de l'équipe interne ACTIFS avec receive_email = true\n",
  );

  const activeStaff = await prisma.internal_staff.findMany({
    where: {
      is_active: true,
      receive_email: true,
    },
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      role: true,
      phone: true,
    },
    orderBy: {
      email: "asc",
    },
  });

  console.log(`Total : ${activeStaff.length} membres\n`);

  activeStaff.forEach((staff, index) => {
    console.log(`${index + 1}. ${staff.first_name} ${staff.last_name}`);
    console.log(`   Email : ${staff.email}`);
    console.log(`   Rôle  : ${staff.role}`);
    console.log(`   Tel   : ${staff.phone || "N/A"}`);
    console.log("");
  });

  // Vérifier les notifications créées pour le dernier booking
  console.log("\n📧 Dernières notifications EMAIL créées:\n");

  const recentNotifications = await prisma.notifications.findMany({
    where: {
      channel: "EMAIL",
      created_at: {
        gte: new Date(Date.now() - 30 * 60 * 1000), // Dernières 30 minutes
      },
    },
    select: {
      id: true,
      recipient_id: true,
      template_id: true,
      status: true,
      created_at: true,
      metadata: true,
    },
    orderBy: {
      created_at: "desc",
    },
    take: 10,
  });

  recentNotifications.forEach((notif, index) => {
    const metadata = notif.metadata as any;
    console.log(`${index + 1}. ${notif.recipient_id}`);
    console.log(`   Template : ${notif.template_id}`);
    console.log(`   Status   : ${notif.status}`);
    console.log(`   BookingId: ${metadata?.bookingId || "N/A"}`);
    console.log(`   Créé     : ${notif.created_at.toLocaleString("fr-FR")}`);
    console.log("");
  });

  // Vérifier les SMS
  console.log("\n📱 SMS créés dans les dernières 30 minutes:\n");

  const recentSMS = await prisma.notifications.findMany({
    where: {
      channel: "SMS",
      created_at: {
        gte: new Date(Date.now() - 30 * 60 * 1000),
      },
    },
    select: {
      id: true,
      recipient_id: true,
      template_id: true,
      status: true,
      created_at: true,
      metadata: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  console.log(`Total SMS : ${recentSMS.length}\n`);

  recentSMS.forEach((sms, index) => {
    const metadata = sms.metadata as any;
    console.log(`${index + 1}. ${sms.recipient_id}`);
    console.log(`   Template : ${sms.template_id}`);
    console.log(`   Status   : ${sms.status}`);
    console.log(`   BookingId: ${metadata?.bookingId || "N/A"}`);
    console.log(`   Créé     : ${sms.created_at.toLocaleString("fr-FR")}`);
    console.log("");
  });

  await prisma.$disconnect();
}

checkInternalStaff().catch(console.error);
