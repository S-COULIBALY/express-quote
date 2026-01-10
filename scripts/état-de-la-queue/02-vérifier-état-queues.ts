/**
 * 📊 Script pour vérifier l'état des queues Redis/BullMQ
 *
 * Affiche le nombre de jobs en attente, actifs, complétés et échoués
 *
 * Usage: npm run queue:status
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

async function checkQueues() {
  console.log(
    "\n📊 ═══════════════════════════════════════════════════════════",
  );
  console.log("         ÉTAT DES QUEUES BULLMQ");
  console.log("═══════════════════════════════════════════════════════════\n");

  const queueNames = ["email", "sms", "whatsapp", "reminders"];
  const queues: Queue[] = [];
  let totalWaiting = 0;
  let totalActive = 0;
  let totalCompleted = 0;
  let totalFailed = 0;
  let totalDelayed = 0;

  try {
    for (const queueName of queueNames) {
      const queue = new Queue(queueName, {
        connection: sharedRedisConfig,
      });
      queues.push(queue);

      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
      ]);

      const waitingCount = waiting.length;
      const activeCount = active.length;
      const completedCount = completed.length;
      const failedCount = failed.length;
      const delayedCount = delayed.length;

      totalWaiting += waitingCount;
      totalActive += activeCount;
      totalCompleted += completedCount;
      totalFailed += failedCount;
      totalDelayed += delayedCount;

      const icon = waitingCount > 0 ? "⏳" : activeCount > 0 ? "🔄" : "✅";

      console.log(`${icon} Queue: ${queueName.toUpperCase()}`);
      console.log(`   ⏳ En attente: ${waitingCount}`);
      console.log(`   🔄 Actifs: ${activeCount}`);
      console.log(`   ⏰ Différés: ${delayedCount}`);
      console.log(`   ✅ Complétés: ${completedCount}`);
      console.log(`   ❌ Échoués: ${failedCount}`);
      console.log("");
    }

    console.log("═══════════════════════════════════════════════════════════");
    console.log("                    📊 RÉSUMÉ GLOBAL");
    console.log(
      "═══════════════════════════════════════════════════════════\n",
    );

    console.log(`⏳ Jobs en attente: ${totalWaiting}`);
    console.log(`🔄 Jobs actifs: ${totalActive}`);
    console.log(`⏰ Jobs différés: ${totalDelayed}`);
    console.log(`✅ Jobs complétés: ${totalCompleted}`);
    console.log(`❌ Jobs échoués: ${totalFailed}`);
    console.log(
      `📊 Total: ${totalWaiting + totalActive + totalDelayed + totalCompleted + totalFailed}\n`,
    );

    if (totalWaiting > 0) {
      console.log(`⚠️  ${totalWaiting} job(s) en attente de traitement`);
    } else if (totalActive > 0) {
      console.log(`🔄 ${totalActive} job(s) en cours de traitement`);
    } else {
      console.log(`✅ Aucun job en attente - toutes les queues sont vides`);
    }

    console.log("");
  } catch (error) {
    console.error("❌ Erreur:", (error as Error).message);
    process.exit(1);
  } finally {
    // Fermer les queues
    for (const queue of queues) {
      await queue.close();
    }
  }
}

checkQueues()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erreur fatale:", error);
    process.exit(1);
  });
