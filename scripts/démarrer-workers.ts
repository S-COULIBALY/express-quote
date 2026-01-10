/**
 * 🚀 Script pour démarrer les workers BullMQ
 *
 * Initialise le service de notifications et démarre tous les workers
 * pour traiter les jobs dans les queues
 *
 * Usage: ts-node scripts/démarrer-workers.ts
 */

import { getGlobalNotificationService } from "../src/notifications/interfaces/http/GlobalNotificationService";

async function startWorkers() {
  console.log(
    "\n🚀 ═══════════════════════════════════════════════════════════",
  );
  console.log("         DÉMARRAGE DES WORKERS BULLMQ");
  console.log("═══════════════════════════════════════════════════════════\n");

  try {
    console.log("📡 Connexion à Redis...");
    console.log("   Host:", process.env.REDIS_HOST || "localhost");
    console.log("   Port:", process.env.REDIS_PORT || "6379");
    console.log("");

    console.log("🔧 Initialisation du service de notifications...");
    const service = await getGlobalNotificationService();

    console.log("✅ Service de notifications initialisé");
    console.log("✅ Workers créés pour les queues suivantes:");
    console.log("   📧 EMAIL");
    console.log("   📱 SMS");
    console.log("   💬 WHATSAPP");
    console.log("   ⏰ REMINDERS");
    console.log("");

    console.log("🎉 Les workers sont maintenant actifs et traitent les jobs !");
    console.log("");
    console.log("💡 Pour vérifier l'état des workers:");
    console.log("   ts-node scripts/état-de-la-queue/06-workers-actifs.ts");
    console.log("");
    console.log("💡 Pour vérifier l'état des queues:");
    console.log(
      "   ts-node scripts/état-de-la-queue/02-vérifier-état-queues.ts",
    );
    console.log("");
    console.log(
      "⚠️  Note: Ce script initialise le service mais ne le maintient pas actif.",
    );
    console.log(
      "   Les workers resteront actifs tant que l'application Next.js tourne.",
    );
    console.log(
      "   Pour un processus dédié, utilisez un gestionnaire de processus (PM2, etc.)",
    );
    console.log("");

    // Garder le processus actif pour que les workers continuent de tourner
    console.log("⏳ Workers en cours d'exécution... (Ctrl+C pour arrêter)");
    console.log("");

    // Vérifier périodiquement l'état des queues
    setInterval(async () => {
      try {
        const queues = ["email", "sms", "whatsapp", "reminders"];
        let totalWaiting = 0;
        for (const queueName of queues) {
          const queue = service["queueManager"]["queues"].get(queueName);
          if (queue) {
            const waiting = await queue.getWaitingCount();
            totalWaiting += waiting;
          }
        }
        if (totalWaiting > 0) {
          console.log(
            `📊 ${new Date().toLocaleTimeString()} - Jobs en attente: ${totalWaiting}`,
          );
        }
      } catch (error) {
        // Ignorer les erreurs de vérification
      }
    }, 10000); // Vérifier toutes les 10 secondes

    // Attendre indéfiniment pour garder les workers actifs
    process.on("SIGINT", () => {
      console.log("\n\n🛑 Arrêt des workers...");
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      console.log("\n\n🛑 Arrêt des workers...");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Erreur lors du démarrage des workers:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
      console.error("   Stack:", error.stack);
    }
    process.exit(1);
  }
}

// Démarrer les workers
startWorkers().catch((error) => {
  console.error("❌ Erreur fatale:", error);
  process.exit(1);
});
