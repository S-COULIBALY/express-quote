/**
 * ❌ Script pour lister les jobs échoués avec leurs erreurs
 *
 * Affiche tous les jobs échoués avec leurs messages d'erreur pour faciliter le débogage
 *
 * Usage: npm run queue:failed
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

async function listFailedJobs() {
  console.log(
    "\n❌ ═══════════════════════════════════════════════════════════",
  );
  console.log("         JOBS ÉCHOUÉS - ANALYSE DES ERREURS");
  console.log("═══════════════════════════════════════════════════════════\n");

  const queueNames = ["email", "sms", "whatsapp", "reminders"];
  const queues: Queue[] = [];
  let totalFailed = 0;

  try {
    for (const queueName of queueNames) {
      const queue = new Queue(queueName, {
        connection: sharedRedisConfig,
      });
      queues.push(queue);

      const failedJobs = await queue.getFailed(0, 100); // Limiter à 100 jobs

      if (failedJobs.length === 0) {
        console.log(`✅ Queue ${queueName.toUpperCase()}: Aucun job échoué\n`);
        continue;
      }

      totalFailed += failedJobs.length;

      console.log(
        `❌ Queue ${queueName.toUpperCase()}: ${failedJobs.length} job(s) échoué(s)\n`,
      );

      for (let i = 0; i < Math.min(failedJobs.length, 20); i++) {
        // Afficher max 20 jobs
        const job = failedJobs[i];
        const jobData = job.data as any;

        console.log(`   📋 Job #${i + 1}: ${job.id}`);
        console.log(
          `      📅 Créé: ${new Date(job.timestamp).toLocaleString("fr-FR")}`,
        );
        console.log(
          `      🔄 Tentatives: ${job.attemptsMade}/${job.opts.attempts || 3}`,
        );
        console.log(
          `      📧 Destinataire: ${jobData.recipient || jobData.recipient_id || "N/A"}`,
        );
        console.log(
          `      📡 Canal: ${jobData.type || jobData.channel || queueName.toUpperCase()}`,
        );

        if (job.failedReason) {
          console.log(`      ❌ Erreur: ${job.failedReason}`);
        }

        if (job.stacktrace && job.stacktrace.length > 0) {
          const firstTrace = job.stacktrace[0];
          console.log(
            `      📍 Stack trace: ${firstTrace.substring(0, 200)}...`,
          );
        }

        console.log("");
      }

      if (failedJobs.length > 20) {
        console.log(
          `   ... et ${failedJobs.length - 20} autre(s) job(s) échoué(s)\n`,
        );
      }
    }

    console.log("═══════════════════════════════════════════════════════════");
    console.log("                    📊 RÉSUMÉ");
    console.log(
      "═══════════════════════════════════════════════════════════\n",
    );

    console.log(`❌ Total jobs échoués: ${totalFailed}\n`);

    if (totalFailed === 0) {
      console.log("🎉 Aucun job échoué - système en bonne santé !\n");
    } else {
      console.log("⚠️  Des jobs ont échoué - vérifiez les erreurs ci-dessus\n");
      console.log("💡 Actions possibles:");
      console.log("   1. Vérifier les logs du serveur");
      console.log("   2. Vérifier la configuration (SMTP, WhatsApp, SMS)");
      console.log("   3. Relancer les jobs échoués si nécessaire");
      console.log("   4. Nettoyer les jobs échoués: npm run queue:clear\n");
    }
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

listFailedJobs()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erreur fatale:", error);
    process.exit(1);
  });
