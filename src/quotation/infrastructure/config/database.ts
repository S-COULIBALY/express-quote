/**
 * Gestionnaire de connexion à la base de données via Prisma
 * 
 * Ce fichier est responsable de :
 * - Établir les connexions à la base de données via Prisma
 * - Gérer le cycle de vie du client Prisma
 * - Fournir une interface unifiée pour accéder au client Prisma
 */

import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma client pour gérer les connexions à la base de données
 */
export class Database {
  private static instance: PrismaClient;

  /**
   * Retourne une instance unique du client Prisma
   */
  public static getClient(): PrismaClient {
    if (!Database.instance) {
      Database.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' 
          ? ['query', 'info', 'warn', 'error'] 
          : ['error'],
      });
      
      // Log de connexion réussie
      console.log('Connexion à la base de données établie');
    }
    
    return Database.instance;
  }

  /**
   * Déconnecte le client Prisma de la base de données
   */
  public static async disconnect(): Promise<void> {
    if (Database.instance) {
      await Database.instance.$disconnect();
      console.log('Déconnexion de la base de données effectuée');
      Database.instance = null as unknown as PrismaClient;
    }
  }
} 