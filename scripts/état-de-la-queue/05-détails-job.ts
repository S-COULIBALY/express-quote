/**
 * 🔍 Script pour voir les détails d'un job spécifique
 *
 * Affiche toutes les informations d'un job (données, statut, historique, etc.)
 *
 * Usage: npm run queue:job <queueName> <jobId>
 * Exemple: npm run queue:job email 123
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

async function getJobDetails(queueName: string, jobId: string) {
  console.log(
    "\n🔍 ═══════════════════════════════════════════════════════════",
  );
  console.log("         DÉTAILS D'UN JOB");
  console.log("═══════════════════════════════════════════════════════════\n");

  const queue = new Queue(queueName, {
    connection: sharedRedisConfig,
  });

  try {
    const job = await queue.getJob(jobId);

    if (!job) {
      console.error(`❌ Job ${jobId} non trouvé dans la queue ${queueName}`);
      console.error("\n💡 Vérifications:");
      console.error("   1. Le job existe-t-il ?");
      console.error("   2. Le nom de la queue est-il correct ?");
      console.error("   3. Le job a-t-il été supprimé ?\n");
      process.exit(1);
    }

    console.log(`📋 Job ID: ${job.id}`);
    console.log(`📊 Queue: ${queueName.toUpperCase()}`);
    console.log(`📅 Créé: ${new Date(job.timestamp).toLocaleString("fr-FR")}`);
    console.log(`🔄 Tentatives: ${job.attemptsMade}/${job.opts.attempts || 3}`);
    console.log(`⏱️  Délai: ${job.opts.delay || 0}ms`);
    console.log(`🎯 Priorité: ${job.opts.priority || "NORMAL"}`);

    // Statut
    const state = await job.getState();
    console.log(`\n📊 Statut: ${state}`);

    if (state === "failed") {
      console.log(`❌ Raison de l'échec: ${job.failedReason || "N/A"}`);
      if (job.stacktrace && job.stacktrace.length > 0) {
        console.log(`\n📍 Stack trace:`);
        job.stacktrace.forEach((trace, index) => {
          console.log(`   ${index + 1}. ${trace.substring(0, 150)}...`);
        });
      }
    }

    if (state === "completed") {
      const returnValue = job.returnvalue;
      if (returnValue) {
        console.log(`\n✅ Résultat:`);
        console.log(JSON.stringify(returnValue, null, 2));
      }
    }

    // Données du job
    console.log(`\n📦 Données du job:`);
    console.log(JSON.stringify(job.data, null, 2));

    // Progression
    if (job.progress) {
      console.log(`\n📈 Progression: ${job.progress}%`);
    }

    // Dates importantes
    console.log(`\n📅 Dates:`);
    if (job.processedOn) {
      console.log(
        `   Traité: ${new Date(job.processedOn).toLocaleString("fr-FR")}`,
      );
    }
    if (job.finishedOn) {
      console.log(
        `   Terminé: ${new Date(job.finishedOn).toLocaleString("fr-FR")}`,
      );
    }
    if (job.failedReason) {
      console.log(`   Échoué: ${job.failedReason}`);
    }

    // Options
    console.log(`\n⚙️  Options:`);
    console.log(`   Retry: ${job.opts.attempts || 3} tentatives`);
    console.log(`   Backoff: ${JSON.stringify(job.opts.backoff || {})}`);
    console.log(`   Remove on complete: ${job.opts.removeOnComplete || false}`);
    console.log(`   Remove on fail: ${job.opts.removeOnFail || false}`);

    console.log("\n");
  } catch (error) {
    console.error("❌ Erreur:", (error as Error).message);
    process.exit(1);
  } finally {
    await queue.close();
  }
}

// Récupérer les arguments de la ligne de commande
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("❌ Usage: npm run queue:job <queueName> <jobId>");
  console.error("   Exemple: npm run queue:job email 123");
  process.exit(1);
}

const [queueName, jobId] = args;

getJobDetails(queueName, jobId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erreur fatale:", error);
    process.exit(1);
  });
