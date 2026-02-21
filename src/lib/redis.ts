import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var redisClient: Redis | undefined;
}

function createRedisClient(): Redis {
  let host = process.env.REDIS_HOST || "localhost";
  let port = parseInt(process.env.REDIS_PORT || "6379");
  let password = process.env.REDIS_PASSWORD || undefined;
  let db = parseInt(process.env.REDIS_DB || "0");

  if (process.env.REDIS_URL) {
    try {
      const url = new URL(process.env.REDIS_URL);
      host = url.hostname;
      port = parseInt(url.port) || 6379;
      password = url.password || undefined;
      const dbMatch = url.pathname.match(/^\/(\d+)/);
      db = dbMatch ? parseInt(dbMatch[1]) : 0;
    } catch {
      console.warn(
        "⚠️ [Redis] REDIS_URL invalide, utilisation des variables individuelles",
      );
    }
  }

  const client = new Redis({
    host,
    port,
    password,
    db,
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    lazyConnect: true,
  });

  client.on("error", (err) => {
    console.error("❌ [Redis] Erreur client:", err.message);
  });

  return client;
}

export const redis: Redis = global.redisClient ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  global.redisClient = redis;
}
