/**
 * 📈 Script pour afficher des statistiques détaillées des queues
 *
 * Affiche des métriques avancées : taux de succès, temps de traitement, etc.
 *
 * Usage: npm run queue:stats
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

async function getDetailedStats() {
  console.log(
    "\n📈 ═══════════════════════════════════════════════════════════",
  );
  console.log("         STATISTIQUES DÉTAILLÉES DES QUEUES");
  console.log("═══════════════════════════════════════════════════════════\n");

  const queueNames = ["email", "sms", "whatsapp", "reminders"];
  const queues: Queue[] = [];

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

      const total =
        waiting.length +
        active.length +
        completed.length +
        failed.length +
        delayed.length;
      const processed = completed.length + failed.length;
      const successRate =
        processed > 0
          ? ((completed.length / processed) * 100).toFixed(2)
          : total > 0
            ? "N/A (en attente)"
            : "100.00";

      // Calculer les temps de traitement moyens (si disponibles)
      let avgProcessingTime = 0;
      if (completed.length > 0) {
        const recentCompleted = completed.slice(0, 10); // Analyser les 10 derniers
        let totalTime = 0;
        let count = 0;

        for (const job of recentCompleted) {
          if (job.processedOn && job.finishedOn) {
            const processingTime = job.finishedOn - job.processedOn;
            totalTime += processingTime;
            count++;
          }
        }

        if (count > 0) {
          avgProcessingTime = totalTime / count;
        }
      }

      console.log(`📊 Queue: ${queueName.toUpperCase()}`);
      console.log(`   ⏳ En attente: ${waiting.length}`);
      console.log(`   🔄 Actifs: ${active.length}`);
      console.log(`   ⏰ Différés: ${delayed.length}`);
      console.log(`   ✅ Complétés: ${completed.length}`);
      console.log(`   ❌ Échoués: ${failed.length}`);
      console.log(`   📊 Total: ${total}`);
      console.log(`   📈 Taux de succès: ${successRate}%`);

      if (avgProcessingTime > 0) {
        console.log(
          `   ⏱️  Temps traitement moyen: ${Math.round(avgProcessingTime)}ms`,
        );
      }

      // Afficher les 5 derniers jobs complétés
      if (completed.length > 0) {
        console.log(`   📋 5 derniers jobs complétés:`);
        for (const job of completed.slice(0, 5)) {
          const jobData = job.data as any;
          const recipient = jobData.recipient || jobData.recipient_id || "N/A";
          const processingTime =
            job.processedOn && job.finishedOn
              ? `${job.finishedOn - job.processedOn}ms`
              : "N/A";
          console.log(`      - ${job.id}: ${recipient} (${processingTime})`);
        }
      }

      // Afficher les jobs échoués récents
      if (failed.length > 0) {
        console.log(`   ❌ Jobs échoués récents:`);
        for (const job of failed.slice(0, 3)) {
          const jobData = job.data as any;
          const recipient = jobData.recipient || jobData.recipient_id || "N/A";
          console.log(`      - ${job.id}: ${recipient}`);
          if (job.failedReason) {
            console.log(
              `        Erreur: ${job.failedReason.substring(0, 100)}...`,
            );
          }
        }
      }

      console.log("");
    }

    // Statistiques globales
    let globalWaiting = 0;
    let globalActive = 0;
    let globalCompleted = 0;
    let globalFailed = 0;
    let globalDelayed = 0;

    for (const queue of queues) {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
      ]);

      globalWaiting += waiting.length;
      globalActive += active.length;
      globalCompleted += completed.length;
      globalFailed += failed.length;
      globalDelayed += delayed.length;
    }

    const globalTotal =
      globalWaiting +
      globalActive +
      globalCompleted +
      globalFailed +
      globalDelayed;
    const globalProcessed = globalCompleted + globalFailed;
    const globalSuccessRate =
      globalProcessed > 0
        ? ((globalCompleted / globalProcessed) * 100).toFixed(2)
        : globalTotal > 0
          ? "N/A (en attente)"
          : "100.00";

    console.log("═══════════════════════════════════════════════════════════");
    console.log("                    📊 STATISTIQUES GLOBALES");
    console.log(
      "═══════════════════════════════════════════════════════════\n",
    );

    console.log(`⏳ Jobs en attente: ${globalWaiting}`);
    console.log(`🔄 Jobs actifs: ${globalActive}`);
    console.log(`⏰ Jobs différés: ${globalDelayed}`);
    console.log(`✅ Jobs complétés: ${globalCompleted}`);
    console.log(`❌ Jobs échoués: ${globalFailed}`);
    console.log(`📊 Total: ${globalTotal}`);
    console.log(`📈 Taux de succès global: ${globalSuccessRate}%\n`);

    // Recommandations
    if (globalFailed > 0) {
      const failureRate = ((globalFailed / globalTotal) * 100).toFixed(2);
      console.log(`⚠️  Taux d'échec: ${failureRate}%`);
      if (parseFloat(failureRate) > 5) {
        console.log("   🚨 Taux d'échec élevé - action requise !");
      }
    }

    if (globalWaiting > 50) {
      console.log(`⚠️  ${globalWaiting} jobs en attente - backlog important`);
      console.log("   💡 Considérez augmenter le nombre de workers");
    }

    if (globalActive === 0 && globalWaiting > 0) {
      console.log("⚠️  Jobs en attente mais aucun worker actif !");
      console.log("   🚨 Vérifiez que les workers sont démarrés");
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

getDetailedStats()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erreur fatale:", error);
    process.exit(1);
  });
