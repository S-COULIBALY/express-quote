/**
 * 🔴 Script de test de connexion Redis
 *
 * Teste la connexion Redis et vérifie que les queues BullMQ peuvent être créées
 *
 * Usage: npm run queue:test
 */

import Redis from "ioredis";
import { Queue, QueueEvents } from "bullmq";

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || "0"),
};

async function testRedisConnection() {
  console.log(
    "\n🔴 ═══════════════════════════════════════════════════════════",
  );
  console.log("         TEST DE CONNEXION REDIS");
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log("📋 Configuration Redis:");
  console.log(`   Host: ${REDIS_CONFIG.host}`);
  console.log(`   Port: ${REDIS_CONFIG.port}`);
  console.log(`   DB: ${REDIS_CONFIG.db}`);
  console.log(`   Password: ${REDIS_CONFIG.password ? "***" : "Non défini"}\n`);

  let redis: Redis | null = null;
  const queues: Queue[] = [];
  const queueEvents: QueueEvents[] = [];

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // TEST 1: Connexion Redis de base
    // ═══════════════════════════════════════════════════════════════════════
    console.log("🔴 TEST 1: Connexion Redis de base...");

    redis = new Redis({
      host: REDIS_CONFIG.host,
      port: REDIS_CONFIG.port,
      password: REDIS_CONFIG.password,
      db: REDIS_CONFIG.db,
      maxRetriesPerRequest: null, // BullMQ requirement
      family: 4,
      lazyConnect: true,
    });

    // Tester la connexion
    await redis.connect();
    const pingResult = await redis.ping();

    if (pingResult === "PONG") {
      console.log("   ✅ Connexion Redis réussie !\n");
    } else {
      throw new Error(`Réponse inattendue du ping: ${pingResult}`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TEST 2: Opérations de base (SET/GET)
    // ═══════════════════════════════════════════════════════════════════════
    console.log("🔴 TEST 2: Opérations de base (SET/GET)...");

    const testKey = "express-quote:test:connection";
    const testValue = `test-${Date.now()}`;

    await redis.set(testKey, testValue, "EX", 60); // Expire dans 60 secondes
    const retrievedValue = await redis.get(testKey);

    if (retrievedValue === testValue) {
      console.log("   ✅ SET/GET fonctionnent correctement\n");
    } else {
      throw new Error(
        `Valeur récupérée incorrecte: ${retrievedValue} (attendu: ${testValue})`,
      );
    }

    // Nettoyer la clé de test
    await redis.del(testKey);

    // ═══════════════════════════════════════════════════════════════════════
    // TEST 3: Création de queues BullMQ
    // ═══════════════════════════════════════════════════════════════════════
    console.log("🔴 TEST 3: Création de queues BullMQ...");

    const queueNames = ["email", "sms", "whatsapp", "reminders"];
    const sharedRedisConfig = {
      host: REDIS_CONFIG.host,
      port: REDIS_CONFIG.port,
      password: REDIS_CONFIG.password,
      db: REDIS_CONFIG.db,
      maxRetriesPerRequest: null,
      family: 4,
      lazyConnect: true,
    };

    for (const queueName of queueNames) {
      try {
        const queue = new Queue(queueName, {
          connection: sharedRedisConfig,
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: "exponential", delay: 1000 },
            removeOnComplete: 50,
            removeOnFail: 25,
          },
        });

        const events = new QueueEvents(queueName, {
          connection: sharedRedisConfig,
        });

        queues.push(queue);
        queueEvents.push(events);

        // Vérifier que la queue existe en Redis
        const waiting = await queue.getWaiting();
        const active = await queue.getActive();
        const completed = await queue.getCompleted();
        const failed = await queue.getFailed();

        console.log(`   ✅ Queue "${queueName}" créée:`);
        console.log(`      ⏳ En attente: ${waiting.length}`);
        console.log(`      🔄 Actifs: ${active.length}`);
        console.log(`      ✅ Complétés: ${completed.length}`);
        console.log(`      ❌ Échoués: ${failed.length}`);
      } catch (error) {
        console.error(
          `   ❌ Erreur création queue "${queueName}":`,
          (error as Error).message,
        );
        throw error;
      }
    }
    console.log("");

    // ═══════════════════════════════════════════════════════════════════════
    // TEST 4: Ajout d'un job de test
    // ═══════════════════════════════════════════════════════════════════════
    console.log("🔴 TEST 4: Ajout d'un job de test...");

    const testQueue = queues[0]; // Utiliser la queue email
    const testJob = await testQueue.add(
      "test",
      {
        test: true,
        timestamp: Date.now(),
        message: "Test de connexion Redis",
      },
      {
        removeOnComplete: true,
        removeOnFail: true,
      },
    );

    console.log(`   ✅ Job de test ajouté: ${testJob.id}`);

    // Vérifier que le job est dans la queue
    const waitingJobs = await testQueue.getWaiting();
    const foundJob = waitingJobs.find((job) => job.id === testJob.id);

    if (foundJob) {
      console.log("   ✅ Job trouvé dans la queue\n");
    } else {
      console.log(
        "   ⚠️ Job non trouvé dans waiting (peut être déjà traité)\n",
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TEST 5: Vérification des clés Redis BullMQ
    // ═══════════════════════════════════════════════════════════════════════
    console.log("🔴 TEST 5: Vérification des clés Redis BullMQ...");

    const keys = await redis.keys("bull:*");
    const emailKeys = keys.filter((key) => key.startsWith("bull:email:"));

    console.log(`   📊 Total clés BullMQ: ${keys.length}`);
    console.log(`   📧 Clés queue email: ${emailKeys.length}`);

    if (emailKeys.length > 0) {
      console.log("   ✅ Clés BullMQ détectées dans Redis\n");
    } else {
      console.log(
        "   ⚠️ Aucune clé BullMQ trouvée (normal si aucune queue active)\n",
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TEST 6: Informations serveur Redis
    // ═══════════════════════════════════════════════════════════════════════
    console.log("🔴 TEST 6: Informations serveur Redis...");

    const info = await redis.info("server");
    const lines = info.split("\r\n");
    const redisVersion = lines
      .find((line) => line.startsWith("redis_version:"))
      ?.split(":")[1];
    const uptime = lines
      .find((line) => line.startsWith("uptime_in_seconds:"))
      ?.split(":")[1];

    console.log(`   📦 Version Redis: ${redisVersion || "N/A"}`);
    console.log(
      `   ⏱️ Uptime: ${uptime ? `${Math.floor(parseInt(uptime) / 60)} minutes` : "N/A"}`,
    );
    console.log("");

    // ═══════════════════════════════════════════════════════════════════════
    // RÉSUMÉ FINAL
    // ═══════════════════════════════════════════════════════════════════════
    console.log("═══════════════════════════════════════════════════════════");
    console.log("                    ✅ TOUS LES TESTS RÉUSSIS");
    console.log(
      "═══════════════════════════════════════════════════════════\n",
    );

    console.log("📊 Résumé:");
    console.log(`   ✅ Connexion Redis: OK`);
    console.log(`   ✅ Opérations SET/GET: OK`);
    console.log(`   ✅ Queues BullMQ créées: ${queues.length}`);
    console.log(`   ✅ Job de test ajouté: OK`);
    console.log(`   ✅ Clés Redis détectées: ${keys.length}`);
    console.log("\n🎉 Redis est prêt pour les queues BullMQ !\n");
  } catch (error) {
    console.error(
      "\n❌ ═══════════════════════════════════════════════════════════",
    );
    console.error("                    ERREUR DE CONNEXION");
    console.error(
      "═══════════════════════════════════════════════════════════\n",
    );
    console.error("❌ Erreur:", (error as Error).message);
    console.error("\n💡 Vérifications:");
    console.error("   1. Redis est-il démarré dans Docker ?");
    console.error("      docker ps | grep redis");
    console.error("   2. Le port est-il correct ?");
    console.error(`      Port configuré: ${REDIS_CONFIG.port}`);
    console.error("   3. Les variables d'environnement sont-elles correctes ?");
    console.error("      REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB");
    console.error("   4. Le firewall bloque-t-il la connexion ?");
    console.error("\n🔧 Commandes utiles:");
    console.error("   # Vérifier que Redis tourne");
    console.error("   docker ps");
    console.error("   # Voir les logs Redis");
    console.error("   docker logs <container-redis>");
    console.error("   # Tester la connexion manuellement");
    console.error(
      `   redis-cli -h ${REDIS_CONFIG.host} -p ${REDIS_CONFIG.port} ping\n`,
    );

    process.exit(1);
  } finally {
    // Nettoyage
    console.log("🧹 Nettoyage...");

    // Fermer les queue events
    for (const events of queueEvents) {
      try {
        await events.close();
      } catch (error) {
        // Ignorer les erreurs de fermeture
      }
    }

    // Fermer les queues
    for (const queue of queues) {
      try {
        await queue.close();
      } catch (error) {
        // Ignorer les erreurs de fermeture
      }
    }

    // Fermer Redis
    if (redis) {
      try {
        await redis.quit();
      } catch (error) {
        // Ignorer les erreurs de fermeture
      }
    }

    console.log("✅ Nettoyage terminé\n");
  }
}

// Exécuter le test
testRedisConnection()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erreur fatale:", error);
    process.exit(1);
  });
