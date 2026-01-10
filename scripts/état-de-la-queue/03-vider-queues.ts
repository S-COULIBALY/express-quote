/**
 * 🧹 Script pour vider toutes les queues Redis/BullMQ
 *
 * Supprime tous les jobs (waiting, active, completed, failed, delayed)
 *
 * ⚠️ ATTENTION: Cette opération est irréversible !
 *
 * Usage: npm run queue:clear
 */

import { Queue } from "bullmq";

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || "0"),
};

const sharedRedisConfig = {
  host: REDIS_CONFIG.host,
  port: REDIS_CONFIG.port,
  password: REDIS_CONFIG.password,
  db: REDIS_CONFIG.db,
  maxRetriesPerRequest: null,
  family: 4,
  lazyConnect: true,
};

async function clearQueues() {
  console.log(
    "\n🧹 ═══════════════════════════════════════════════════════════",
  );
  console.log("         VIDAGE DES QUEUES BULLMQ");
  console.log("═══════════════════════════════════════════════════════════\n");

  const queueNames = ["email", "sms", "whatsapp", "reminders"];
  const queues: Queue[] = [];

  try {
    for (const queueName of queueNames) {
      console.log(`🧹 Nettoyage de la queue: ${queueName.toUpperCase()}...`);

      const queue = new Queue(queueName, {
        connection: sharedRedisConfig,
      });
      queues.push(queue);

      // Récupérer les comptes avant nettoyage
      const [
        waitingBefore,
        activeBefore,
        completedBefore,
        failedBefore,
        delayedBefore,
      ] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
      ]);

      const totalBefore =
        waitingBefore.length +
        activeBefore.length +
        completedBefore.length +
        failedBefore.length +
        delayedBefore.length;

      if (totalBefore === 0) {
        console.log(`   ✅ Queue déjà vide\n`);
        continue;
      }

      console.log(
        `   📊 Avant: ${waitingBefore.length} waiting, ${activeBefore.length} active, ${completedBefore.length} completed, ${failedBefore.length} failed, ${delayedBefore.length} delayed`,
      );

      // Nettoyer tous les types de jobs
      // Utiliser obliterate pour supprimer complètement la queue
      await queue.obliterate({ force: true });

      // Vérifier après nettoyage
      const [
        waitingAfter,
        activeAfter,
        completedAfter,
        failedAfter,
        delayedAfter,
      ] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
      ]);

      const totalAfter =
        waitingAfter.length +
        activeAfter.length +
        completedAfter.length +
        failedAfter.length +
        delayedAfter.length;

      console.log(
        `   ✅ Après: ${waitingAfter.length} waiting, ${activeAfter.length} active, ${completedAfter.length} completed, ${failedAfter.length} failed, ${delayedAfter.length} delayed`,
      );
      console.log(`   🗑️  ${totalBefore - totalAfter} job(s) supprimé(s)\n`);
    }

    console.log("═══════════════════════════════════════════════════════════");
    console.log("                    ✅ VIDAGE TERMINÉ");
    console.log(
      "═══════════════════════════════════════════════════════════\n",
    );

    // Vérification finale
    console.log("📊 Vérification finale...\n");

    let totalRemaining = 0;
    for (const queueName of queueNames) {
      const queue = new Queue(queueName, {
        connection: sharedRedisConfig,
      });

      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
      ]);

      const remaining =
        waiting.length +
        active.length +
        completed.length +
        failed.length +
        delayed.length;
      totalRemaining += remaining;

      if (remaining > 0) {
        console.log(`   ⚠️  ${queueName}: ${remaining} job(s) restant(s)`);
      } else {
        console.log(`   ✅ ${queueName}: Queue vide`);
      }

      await queue.close();
    }

    if (totalRemaining === 0) {
      console.log("\n🎉 Toutes les queues sont maintenant vides !\n");
    } else {
      console.log(`\n⚠️  ${totalRemaining} job(s) restant(s) au total\n`);
    }
  } catch (error) {
    console.error("\n❌ Erreur lors du vidage:", (error as Error).message);
    console.error("   Stack:", (error as Error).stack);
    process.exit(1);
  } finally {
    // Fermer les queues
    for (const queue of queues) {
      try {
        await queue.close();
      } catch (error) {
        // Ignorer les erreurs de fermeture
      }
    }
  }
}

clearQueues()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erreur fatale:", error);
    process.exit(1);
  });
