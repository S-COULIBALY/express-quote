/**
 * Configuration centralisée du système de devis
 * 
 * Ce fichier joue un rôle crucial dans l'application :
 * - Centralise toutes les configurations dans un seul endroit
 * - Gère les variables d'environnement avec des valeurs par défaut
 * - Assure la portabilité entre différents environnements
 */

import dotenv from 'dotenv';

// Charge les variables d'environnement depuis le fichier .env
// Permet de ne pas exposer les informations sensibles dans le code
dotenv.config();

interface Config {
  api: {
    port: number;
    environment: 'development' | 'production' | 'test';
  };
  cache: {
    defaultTTL: number;
    prefix: string;
  };
  rules: {
    versionCheck: {
      enabled: boolean;
      interval: number;
    };
  };
}

export const config: Config = {
  /**
   * Configuration PostgreSQL
   * Stockage persistant pour :
   * - Les règles métier de calcul des devis
   * - L'historique des versions des règles
   * - Les données de base du système
   */
  database: {
    host: process.env.DB_HOST || 'localhost',     // Hôte de la BDD, par défaut localhost
    port: parseInt(process.env.DB_PORT || '5432'), // Port PostgreSQL standard
    name: process.env.DB_NAME || 'quotation_db',   // Nom de la base de données
    user: process.env.DB_USER || 'postgres',       // Utilisateur PostgreSQL
    password: process.env.DB_PASSWORD              // Mot de passe (requis)
  },

  /**
   * Configuration Redis
   * Système de cache pour :
   * - Optimiser les performances
   * - Réduire la charge sur PostgreSQL
   * - Stocker temporairement les règles fréquemment utilisées
   */
  redis: {
    host: process.env.REDIS_HOST || 'localhost',   // Hôte Redis, par défaut localhost
    port: parseInt(process.env.REDIS_PORT || '6379'), // Port Redis standard
    password: process.env.REDIS_PASSWORD           // Mot de passe Redis (optionnel)
  },

  /**
   * Configuration API
   * Paramètres du serveur web pour :
   * - Exposer les endpoints de calcul de devis
   * - Gérer les différents environnements (dev/prod)
   * - Configurer le comportement de l'API
   */
  api: {
    port: parseInt(process.env.API_PORT || '3000'),
    environment: (process.env.NODE_ENV || 'development') as Config['api']['environment']
  },

  cache: {
    defaultTTL: 3600, // 1 heure
    prefix: 'quote:'
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableDebug: process.env.NODE_ENV === 'development'
  },

  rules: {
    versionCheck: {
      enabled: true,
      interval: 300 // 5 minutes
    }
  }
}; 