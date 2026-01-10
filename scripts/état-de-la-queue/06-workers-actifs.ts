/**
 * 👷 Script pour vérifier les workers actifs
 *
 * Affiche les workers qui traitent actuellement des jobs
 *
 * Usage: npm run queue:workers
 */

import Redis from "ioredis";
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

async function checkWorkers() {
  console.log(
    "\n👷 ═══════════════════════════════════════════════════════════",
  );
  console.log("         WORKERS ACTIFS");
  console.log("═══════════════════════════════════════════════════════════\n");

  const queueNames = ["email", "sms", "whatsapp", "reminders"];
  const queues: Queue[] = [];
  let redis: Redis | null = null;

  try {
    redis = new Redis({
      host: REDIS_CONFIG.host,
      port: REDIS_CONFIG.port,
      password: REDIS_CONFIG.password,
      db: REDIS_CONFIG.db,
      maxRetriesPerRequest: null,
      family: 4,
      lazyConnect: false,
    });

    // Vérifier si déjà connecté
    if (redis.status !== "ready" && redis.status !== "connecting") {
      await redis.connect();
    }

    for (const queueName of queueNames) {
      const queue = new Queue(queueName, {
        connection: sharedRedisConfig,
      });
      queues.push(queue);

      // Récupérer les workers actifs depuis Redis
      const workersKey = `bull:${queueName}:workers`;
      const workers = await redis.smembers(workersKey);

      // Récupérer les jobs actifs
      const activeJobs = await queue.getActive();

      console.log(`📡 Queue: ${queueName.toUpperCase()}`);
      console.log(`   👷 Workers actifs: ${workers.length}`);
      console.log(`   🔄 Jobs en cours: ${activeJobs.length}`);

      if (workers.length > 0) {
        console.log(`   📋 Workers:`);
        for (const worker of workers) {
          console.log(`      - ${worker}`);
        }
      }

      if (activeJobs.length > 0) {
        console.log(`   📋 Jobs en cours:`);
        for (const job of activeJobs.slice(0, 5)) {
          // Afficher max 5 jobs
          const jobData = job.data as any;
          console.log(
            `      - Job ${job.id}: ${jobData.recipient || jobData.recipient_id || "N/A"}`,
          );
        }
        if (activeJobs.length > 5) {
          console.log(`      ... et ${activeJobs.length - 5} autre(s) job(s)`);
        }
      }

      console.log("");
    }

    // Vérification globale
    let totalWorkers = 0;
    let totalActiveJobs = 0;

    for (const queueName of queueNames) {
      const workersKey = `bull:${queueName}:workers`;
      const workers = await redis.smembers(workersKey);
      totalWorkers += workers.length;

      const queue = new Queue(queueName, {
        connection: sharedRedisConfig,
      });
      const activeJobs = await queue.getActive();
      totalActiveJobs += activeJobs.length;
      await queue.close();
    }

    console.log("═══════════════════════════════════════════════════════════");
    console.log("                    📊 RÉSUMÉ GLOBAL");
    console.log(
      "═══════════════════════════════════════════════════════════\n",
    );

    console.log(`👷 Total workers actifs: ${totalWorkers}`);
    console.log(`🔄 Total jobs en cours: ${totalActiveJobs}\n`);

    if (totalWorkers === 0) {
      console.log("⚠️  Aucun worker actif détecté !");
      console.log("   💡 Vérifiez que les workers sont démarrés\n");
    } else {
      console.log(
        `✅ ${totalWorkers} worker(s) actif(s) - système opérationnel\n`,
      );
    }
  } catch (error) {
    console.error("❌ Erreur:", (error as Error).message);
    process.exit(1);
  } finally {
    // Fermer les queues
    for (const queue of queues) {
      await queue.close();
    }

    // Fermer Redis
    if (redis) {
      await redis.quit();
    }
  }
}

checkWorkers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erreur fatale:", error);
    process.exit(1);
  });
