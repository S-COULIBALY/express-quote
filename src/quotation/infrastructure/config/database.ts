/**
 * Gestionnaire de connexions aux bases de données
 * 
 * Ce fichier est responsable de :
 * - Établir les connexions aux bases de données (PostgreSQL et Redis)
 * - Gérer la configuration des connexions
 * - Fournir une interface unifiée pour accéder aux clients DB
 */

import { Pool } from 'pg';
import Redis from 'ioredis';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'quotation',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || ''
};

const redisConfig: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
};

/**
 * Crée et initialise les connexions aux bases de données
 * 
 * @returns {Object} Objet contenant les clients initialisés
 * - dbClient: Client PostgreSQL pour le stockage persistant des règles
 * - redisClient: Client Redis pour le cache des règles fréquemment utilisées
 * 
 * Usage:
 * const { dbClient, redisClient } = await createConnections();
 */
export async function createConnections() {
  const dbClient = new Pool(dbConfig);
  const redisClient = new Redis(redisConfig);

  return { dbClient, redisClient };
} 