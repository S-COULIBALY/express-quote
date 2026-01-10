/**
 * 📊 Script pour analyser pourquoi seulement certaines notifications ont été reçues
 *
 * Vérifie :
 * - Les notifications en base de données
 * - Le statut réel des notifications
 * - Les templates envoyés vs reçus
 *
 * Usage: npx ts-node scripts/état-de-la-queue/09-analyse-notifications-reçues.ts
 *
 * ⚠️ IMPORTANT : Lancer ce script IMMÉDIATEMENT après les tests,
 *    AVANT que jest.setup.js ne nettoie la base de données !
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function analyzeNotifications() {
  console.log(
    "\n📊 ═══════════════════════════════════════════════════════════",
  );
  console.log("         ANALYSE DES NOTIFICATIONS REÇUES");
  console.log("═══════════════════════════════════════════════════════════\n");

  try {
    // 1. Récupérer les notifications récentes (dernières 30 minutes)
    // ⚠️ Augmenter la fenêtre si les tests prennent plus de temps
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const notifications = await prisma.notifications.findMany({
      where: {
        created_at: { gte: thirtyMinutesAgo },
      },
      orderBy: { created_at: "desc" },
    });

    console.log(`📋 Notifications trouvées: ${notifications.length}\n`);

    if (notifications.length === 0) {
      console.log(
        "⚠️  Aucune notification trouvée dans les 30 dernières minutes",
      );
      console.log(
        "   Les notifications ont peut-être été nettoyées par les tests",
      );
      console.log(
        "   💡 Conseil : Lancer ce script IMMÉDIATEMENT après les tests\n",
      );
      return;
    }

    // 2. Analyser par canal
    const byChannel: Record<string, any[]> = {};
    const byStatus: Record<string, number> = {};
    const byTemplate: Record<string, number> = {};

    notifications.forEach((n) => {
      // Par canal
      if (!byChannel[n.channel]) {
        byChannel[n.channel] = [];
      }
      byChannel[n.channel].push(n);

      // Par statut
      byStatus[n.status] = (byStatus[n.status] || 0) + 1;

      // Par template
      if (n.template_id) {
        byTemplate[n.template_id] = (byTemplate[n.template_id] || 0) + 1;
      }
    });

    console.log("📊 RÉSUMÉ PAR CANAL:");
    console.log(
      "═══════════════════════════════════════════════════════════\n",
    );

    for (const [channel, notifs] of Object.entries(byChannel)) {
      console.log(`📧 ${channel}: ${notifs.length} notification(s)`);

      const sent = notifs.filter(
        (n) => n.status === "SENT" || n.status === "DELIVERED",
      ).length;
      const failed = notifs.filter((n) => n.status === "FAILED").length;
      const pending = notifs.filter(
        (n) => n.status === "PENDING" || n.status === "SENDING",
      ).length;

      console.log(`   ✅ Envoyées: ${sent}`);
      console.log(`   ❌ Échouées: ${failed}`);
      console.log(`   ⏳ En attente: ${pending}`);
      console.log("");
    }

    console.log("📊 RÉSUMÉ PAR STATUT:");
    console.log(
      "═══════════════════════════════════════════════════════════\n",
    );

    for (const [status, count] of Object.entries(byStatus)) {
      const icon =
        status === "SENT" || status === "DELIVERED"
          ? "✅"
          : status === "FAILED"
            ? "❌"
            : status === "PENDING"
              ? "⏳"
              : "🔄";
      console.log(`${icon} ${status}: ${count}`);
    }

    console.log("\n📊 RÉSUMÉ PAR TEMPLATE:");
    console.log(
      "═══════════════════════════════════════════════════════════\n",
    );

    for (const [template, count] of Object.entries(byTemplate)) {
      console.log(`📄 ${template}: ${count}`);
    }

    // 3. Détails des notifications EMAIL
    console.log("\n📧 DÉTAILS DES NOTIFICATIONS EMAIL:");
    console.log(
      "═══════════════════════════════════════════════════════════\n",
    );

    const emailNotifications = notifications.filter(
      (n) => n.channel === "EMAIL",
    );

    for (const notif of emailNotifications) {
      console.log(`📧 ID: ${notif.id}`);
      console.log(`   Template: ${notif.template_id || "N/A"}`);
      console.log(`   Destinataire: ${notif.recipient_id}`);
      console.log(`   Statut: ${notif.status}`);
      console.log(`   Créée: ${notif.created_at.toLocaleString("fr-FR")}`);

      if (notif.sent_at) {
        console.log(`   ✅ Envoyée: ${notif.sent_at.toLocaleString("fr-FR")}`);
      }

      if (notif.failed_at) {
        console.log(
          `   ❌ Échouée: ${notif.failed_at.toLocaleString("fr-FR")}`,
        );
        console.log(`   Erreur: ${notif.last_error || "N/A"}`);
      }

      if (notif.delivered_at) {
        console.log(
          `   📬 Livrée: ${notif.delivered_at.toLocaleString("fr-FR")}`,
        );
      }

      console.log(`   Tentatives: ${notif.attempts || 0}`);
      console.log("");
    }

    // 4. Statistiques détaillées
    console.log("\n📊 STATISTIQUES DÉTAILLÉES:");
    console.log(
      "═══════════════════════════════════════════════════════════\n",
    );

    const sentNotifications = notifications.filter(
      (n) => n.status === "SENT" || n.status === "DELIVERED",
    );
    const failedNotifications = notifications.filter(
      (n) => n.status === "FAILED",
    );
    const pendingNotifications = notifications.filter(
      (n) => n.status === "PENDING" || n.status === "SENDING",
    );

    console.log(`✅ Notifications envoyées: ${sentNotifications.length}`);
    console.log(`❌ Notifications échouées: ${failedNotifications.length}`);
    console.log(`⏳ Notifications en attente: ${pendingNotifications.length}`);
    console.log(`📊 Total: ${notifications.length}`);

    if (failedNotifications.length > 0) {
      console.log("\n❌ NOTIFICATIONS ÉCHOUÉES:");
      failedNotifications.forEach((n) => {
        console.log(
          `   - ${n.template_id || "N/A"}: ${n.last_error || "Erreur inconnue"}`,
        );
      });
    }

    // 5. Analyse des notifications non reçues
    console.log("\n🔍 ANALYSE DES NOTIFICATIONS NON REÇUES:");
    console.log(
      "═══════════════════════════════════════════════════════════\n",
    );

    const expectedTemplates = [
      "reminder-7d",
      "reminder-24h",
      "reminder-1h",
      "service-reminder",
    ];
    const receivedTemplates = emailNotifications
      .filter((n) => n.status === "SENT" || n.status === "DELIVERED")
      .map((n) => n.template_id)
      .filter(Boolean);

    const missingTemplates = expectedTemplates.filter(
      (t) => !receivedTemplates.includes(t),
    );

    if (missingTemplates.length > 0) {
      console.log("❌ Templates attendus mais non reçus:");
      missingTemplates.forEach((t) => {
        const notif = emailNotifications.find((n) => n.template_id === t);
        if (notif) {
          console.log(
            `   - ${t}: Statut = ${notif.status}, Erreur = ${notif.last_error || "N/A"}`,
          );
        } else {
          console.log(`   - ${t}: Notification non trouvée en base`);
        }
      });
    } else {
      console.log("✅ Tous les templates attendus ont été envoyés");
    }

    // 6. Recommandations
    console.log("\n💡 RECOMMANDATIONS:");
    console.log(
      "═══════════════════════════════════════════════════════════\n",
    );

    if (failedNotifications.length > 0) {
      console.log("⚠️  Des notifications ont échoué :");
      console.log(
        "   1. Vérifier les logs SMTP pour voir les erreurs détaillées",
      );
      console.log(
        "   2. Vérifier la configuration SMTP (host, port, credentials)",
      );
      console.log("   3. Vérifier que le serveur SMTP est accessible");
    }

    if (pendingNotifications.length > 0) {
      console.log("⏳ Des notifications sont en attente :");
      console.log("   1. Attendre que les workers les traitent");
      console.log(
        "   2. Vérifier que les workers sont actifs (script 06-workers-actifs.ts)",
      );
      console.log(
        "   3. Vérifier l'état des queues (script 02-vérifier-état-queues.ts)",
      );
    }

    if (sentNotifications.length < emailNotifications.length) {
      console.log("📧 Certaines notifications ne sont pas encore envoyées :");
      console.log("   1. Vérifier le dossier spam de la boîte de réception");
      console.log("   2. Vérifier les logs SMTP pour confirmer l'envoi");
      console.log("   3. Vérifier les métriques de l'adapter email");
    }

    console.log("\n");
  } catch (error) {
    console.error("❌ Erreur lors de l'analyse:", (error as Error).message);
    console.error("   Stack:", (error as Error).stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeNotifications()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erreur fatale:", error);
    process.exit(1);
  });
