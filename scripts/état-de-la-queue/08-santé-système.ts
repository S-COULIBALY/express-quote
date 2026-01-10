/**
 * 🏥 Script de vérification de santé globale du système de queues
 *
 * Vérifie que tout fonctionne correctement et détecte les problèmes potentiels
 *
 * Usage: npm run queue:health
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

interface HealthCheck {
  component: string;
  status: "healthy" | "degraded" | "critical";
  message: string;
  details?: any;
}

async function healthCheck() {
  console.log(
    "\n🏥 ═══════════════════════════════════════════════════════════",
  );
  console.log("         VÉRIFICATION DE SANTÉ DU SYSTÈME");
  console.log("═══════════════════════════════════════════════════════════\n");

  const checks: HealthCheck[] = [];
  let redis: Redis | null = null;
  const queues: Queue[] = [];

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // CHECK 1: Connexion Redis
    // ═══════════════════════════════════════════════════════════════════════
    console.log("🔴 Vérification connexion Redis...");

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
      const pingResult = await redis.ping();

      if (pingResult === "PONG") {
        checks.push({
          component: "Redis Connection",
          status: "healthy",
          message: "Connexion Redis réussie",
        });
        console.log("   ✅ Connexion Redis: OK\n");
      } else {
        throw new Error("Ping échoué");
      }
    } catch (error) {
      checks.push({
        component: "Redis Connection",
        status: "critical",
        message: `Connexion Redis échouée: ${(error as Error).message}`,
      });
      console.log("   ❌ Connexion Redis: ÉCHEC\n");
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CHECK 2: Queues accessibles
    // ═══════════════════════════════════════════════════════════════════════
    console.log("📊 Vérification accessibilité des queues...");

    const queueNames = ["email", "sms", "whatsapp", "reminders"];
    let queuesAccessible = 0;

    for (const queueName of queueNames) {
      try {
        const queue = new Queue(queueName, {
          connection: sharedRedisConfig,
        });
        queues.push(queue);

        // Tester l'accès
        await queue.getWaiting();
        queuesAccessible++;
      } catch (error) {
        checks.push({
          component: `Queue ${queueName}`,
          status: "critical",
          message: `Queue inaccessible: ${(error as Error).message}`,
        });
      }
    }

    if (queuesAccessible === queueNames.length) {
      checks.push({
        component: "Queues Access",
        status: "healthy",
        message: `Toutes les ${queueNames.length} queues sont accessibles`,
      });
      console.log(
        `   ✅ Queues accessibles: ${queuesAccessible}/${queueNames.length}\n`,
      );
    } else {
      checks.push({
        component: "Queues Access",
        status: "degraded",
        message: `${queuesAccessible}/${queueNames.length} queues accessibles`,
      });
      console.log(
        `   ⚠️  Queues accessibles: ${queuesAccessible}/${queueNames.length}\n`,
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CHECK 3: Workers actifs
    // ═══════════════════════════════════════════════════════════════════════
    console.log("👷 Vérification workers actifs...");

    if (redis) {
      let totalWorkers = 0;
      for (const queueName of queueNames) {
        const workersKey = `bull:${queueName}:workers`;
        const workers = await redis.smembers(workersKey);
        totalWorkers += workers.length;
      }

      if (totalWorkers > 0) {
        checks.push({
          component: "Workers",
          status: "healthy",
          message: `${totalWorkers} worker(s) actif(s)`,
          details: { workerCount: totalWorkers },
        });
        console.log(`   ✅ Workers actifs: ${totalWorkers}\n`);
      } else {
        checks.push({
          component: "Workers",
          status: "critical",
          message: "Aucun worker actif détecté",
        });
        console.log("   ❌ Workers actifs: 0 (CRITIQUE)\n");
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CHECK 4: Backlog
    // ═══════════════════════════════════════════════════════════════════════
    console.log("⏳ Vérification backlog...");

    let totalWaiting = 0;
    let totalActive = 0;

    // Recréer les queues si nécessaire
    const queuesForBacklog: Queue[] = [];
    for (const queueName of queueNames) {
      const queue = new Queue(queueName, {
        connection: sharedRedisConfig,
      });
      queuesForBacklog.push(queue);
    }

    for (const queue of queuesForBacklog) {
      const [waiting, active] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
      ]);
      totalWaiting += waiting.length;
      totalActive += active.length;
    }

    // Fermer les queues temporaires
    for (const queue of queuesForBacklog) {
      await queue.close();
    }

    if (totalWaiting === 0) {
      checks.push({
        component: "Backlog",
        status: "healthy",
        message: "Aucun backlog",
      });
      console.log("   ✅ Backlog: Aucun\n");
    } else if (totalWaiting < 50) {
      checks.push({
        component: "Backlog",
        status: "healthy",
        message: `${totalWaiting} jobs en attente (normal)`,
      });
      console.log(`   ✅ Backlog: ${totalWaiting} jobs (normal)\n`);
    } else if (totalWaiting < 200) {
      checks.push({
        component: "Backlog",
        status: "degraded",
        message: `${totalWaiting} jobs en attente (backlog modéré)`,
      });
      console.log(`   ⚠️  Backlog: ${totalWaiting} jobs (modéré)\n`);
    } else {
      checks.push({
        component: "Backlog",
        status: "critical",
        message: `${totalWaiting} jobs en attente (backlog critique)`,
      });
      console.log(`   🚨 Backlog: ${totalWaiting} jobs (CRITIQUE)\n`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CHECK 5: Taux d'échec
    // ═══════════════════════════════════════════════════════════════════════
    console.log("❌ Vérification taux d'échec...");

    let totalCompleted = 0;
    let totalFailed = 0;

    // Recréer les queues si nécessaire
    const queuesForStats: Queue[] = [];
    for (const queueName of queueNames) {
      const queue = new Queue(queueName, {
        connection: sharedRedisConfig,
      });
      queuesForStats.push(queue);
    }

    for (const queue of queuesForStats) {
      const [completed, failed] = await Promise.all([
        queue.getCompleted(),
        queue.getFailed(),
      ]);
      totalCompleted += completed.length;
      totalFailed += failed.length;
    }

    // Fermer les queues temporaires
    for (const queue of queuesForStats) {
      await queue.close();
    }

    const totalProcessed = totalCompleted + totalFailed;
    const failureRate =
      totalProcessed > 0 ? (totalFailed / totalProcessed) * 100 : 0;

    if (failureRate === 0) {
      checks.push({
        component: "Failure Rate",
        status: "healthy",
        message: "Aucun échec",
      });
      console.log("   ✅ Taux d'échec: 0%\n");
    } else if (failureRate < 1) {
      checks.push({
        component: "Failure Rate",
        status: "healthy",
        message: `Taux d'échec: ${failureRate.toFixed(2)}% (excellent)`,
      });
      console.log(
        `   ✅ Taux d'échec: ${failureRate.toFixed(2)}% (excellent)\n`,
      );
    } else if (failureRate < 5) {
      checks.push({
        component: "Failure Rate",
        status: "degraded",
        message: `Taux d'échec: ${failureRate.toFixed(2)}% (acceptable)`,
      });
      console.log(
        `   ⚠️  Taux d'échec: ${failureRate.toFixed(2)}% (acceptable)\n`,
      );
    } else {
      checks.push({
        component: "Failure Rate",
        status: "critical",
        message: `Taux d'échec: ${failureRate.toFixed(2)}% (CRITIQUE)`,
      });
      console.log(
        `   🚨 Taux d'échec: ${failureRate.toFixed(2)}% (CRITIQUE)\n`,
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CHECK 6: Jobs bloqués
    // ═══════════════════════════════════════════════════════════════════════
    console.log("🔒 Vérification jobs bloqués...");

    let stuckJobs = 0;
    const now = Date.now();
    const stuckThreshold = 5 * 60 * 1000; // 5 minutes

    // Recréer les queues si nécessaire
    const queuesForStuck: Queue[] = [];
    for (const queueName of queueNames) {
      const queue = new Queue(queueName, {
        connection: sharedRedisConfig,
      });
      queuesForStuck.push(queue);
    }

    for (const queue of queuesForStuck) {
      const activeJobs = await queue.getActive();
      for (const job of activeJobs) {
        if (job.processedOn) {
          const processingTime = now - job.processedOn;
          if (processingTime > stuckThreshold) {
            stuckJobs++;
          }
        }
      }
    }

    // Fermer les queues temporaires
    for (const queue of queuesForStuck) {
      await queue.close();
    }

    if (stuckJobs === 0) {
      checks.push({
        component: "Stuck Jobs",
        status: "healthy",
        message: "Aucun job bloqué",
      });
      console.log("   ✅ Jobs bloqués: Aucun\n");
    } else {
      checks.push({
        component: "Stuck Jobs",
        status: "critical",
        message: `${stuckJobs} job(s) bloqué(s) (>5min)`,
      });
      console.log(`   🚨 Jobs bloqués: ${stuckJobs} (CRITIQUE)\n`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RÉSUMÉ FINAL
    // ═══════════════════════════════════════════════════════════════════════
    console.log("═══════════════════════════════════════════════════════════");
    console.log("                    📊 RÉSUMÉ DE SANTÉ");
    console.log(
      "═══════════════════════════════════════════════════════════\n",
    );

    const healthyCount = checks.filter((c) => c.status === "healthy").length;
    const degradedCount = checks.filter((c) => c.status === "degraded").length;
    const criticalCount = checks.filter((c) => c.status === "critical").length;

    for (const check of checks) {
      const icon =
        check.status === "healthy"
          ? "✅"
          : check.status === "degraded"
            ? "⚠️"
            : "🚨";
      console.log(`${icon} ${check.component}: ${check.message}`);
    }

    console.log(
      "\n═══════════════════════════════════════════════════════════",
    );
    console.log(`   ✅ Healthy: ${healthyCount}`);
    console.log(`   ⚠️  Degraded: ${degradedCount}`);
    console.log(`   🚨 Critical: ${criticalCount}`);
    console.log(
      "═══════════════════════════════════════════════════════════\n",
    );

    // Statut global
    if (criticalCount > 0) {
      console.log("🚨 STATUT GLOBAL: CRITIQUE");
      console.log("   Action immédiate requise !\n");
      process.exit(1);
    } else if (degradedCount > 0) {
      console.log("⚠️  STATUT GLOBAL: DÉGRADÉ");
      console.log("   Surveillance recommandée\n");
      process.exit(0);
    } else {
      console.log("✅ STATUT GLOBAL: SAIN");
      console.log("   Tous les systèmes fonctionnent correctement\n");
      process.exit(0);
    }
  } catch (error) {
    console.error(
      "❌ Erreur lors de la vérification:",
      (error as Error).message,
    );
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

    // Fermer Redis
    if (redis) {
      try {
        await redis.quit();
      } catch (error) {
        // Ignorer les erreurs de fermeture
      }
    }
  }
}

healthCheck()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erreur fatale:", error);
    process.exit(1);
  });
