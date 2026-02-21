import { redis } from "./redis";

/**
 * Cache serveur Redis — remplace ClientCache (in-memory) pour les caches partagés
 * entre instances Vercel.
 *
 * API async volontairement identique à ClientCache pour faciliter la migration.
 */
export class ServerCache<T> {
  private readonly prefix: string;
  private readonly defaultTtlMs: number;

  constructor(ttlMs: number, namespace: string) {
    this.defaultTtlMs = ttlMs;
    this.prefix = `cache:${namespace}:`;
  }

  private key(k: string): string {
    return `${this.prefix}${k}`;
  }

  async get(key: string): Promise<T | null> {
    try {
      const raw = await redis.get(this.key(key));
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, data: T, ttlMs?: number): Promise<void> {
    const ttlSec = Math.ceil((ttlMs ?? this.defaultTtlMs) / 1000);
    try {
      await redis.setex(this.key(key), ttlSec, JSON.stringify(data));
    } catch {
      // Pas bloquant : la requête suivante ira en base
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      return (await redis.exists(this.key(key))) === 1;
    } catch {
      return false;
    }
  }

  async invalidate(key: string): Promise<void> {
    try {
      await redis.del(this.key(key));
    } catch {
      // ignore
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await redis.keys(`${this.prefix}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch {
      // ignore
    }
  }

  async size(): Promise<number> {
    try {
      const keys = await redis.keys(`${this.prefix}*`);
      return keys.length;
    } catch {
      return 0;
    }
  }

  // Redis gère le TTL nativement — cleanup() n'a rien à faire
  cleanup(): void {}
}
