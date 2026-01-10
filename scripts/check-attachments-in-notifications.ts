import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAttachments() {
  console.log("\n📎 Vérification des pièces jointes dans les notifications\n");

  const notifications = await prisma.notifications.findMany({
    where: {
      channel: "EMAIL",
      created_at: {
        gte: new Date(Date.now() - 60 * 60 * 1000), // Dernière heure
      },
    },
    orderBy: {
      created_at: "desc",
    },
    take: 5,
  });

  console.log(`Total notifications trouvées: ${notifications.length}\n`);

  notifications.forEach((notif, index) => {
    const metadata = notif.metadata as any;
    const attachments = metadata?.attachments || [];

    console.log(`\n${index + 1}. Notification ${notif.id.substring(0, 8)}...`);
    console.log(`   Destinataire : ${notif.recipient_id}`);
    console.log(`   Template     : ${notif.template_id}`);
    console.log(`   Status       : ${notif.status}`);
    console.log(`   BookingId    : ${metadata?.bookingId || "N/A"}`);
    console.log(
      `   Créé         : ${notif.created_at.toLocaleString("fr-FR")}`,
    );
    console.log(`\n   📎 Pièces jointes : ${attachments.length}`);

    if (attachments.length > 0) {
      attachments.forEach((att: any, attIndex: number) => {
        console.log(`      ${attIndex + 1}. ${att.filename || "Sans nom"}`);
        console.log(`         Type    : ${att.mimeType || "N/A"}`);
        console.log(`         Taille  : ${att.size || "N/A"} octets`);
        console.log(
          `         Content : ${att.content ? `${att.content.substring(0, 50)}...` : "MANQUANT ❌"}`,
        );
      });
    } else {
      console.log("      ⚠️ Aucune pièce jointe trouvée !");
    }
  });

  await prisma.$disconnect();
}

checkAttachments().catch(console.error);
