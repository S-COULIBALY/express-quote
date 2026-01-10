/**
 * 🧪 **SETUP - Tests d'Intégration**
 * 
 * Configuration globale pour les tests d'intégration
 */

// Charger les variables d'environnement depuis .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Charger .env.local si disponible
config({ path: resolve(process.cwd(), '.env.local') });

// Configuration des timeouts globaux
jest.setTimeout(60000); // 60 secondes par défaut

// Configuration des variables d'environnement de test
process.env.NODE_ENV = 'test';

// Vérification des variables d'environnement requises
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'NEXT_PUBLIC_APP_URL'
];

const missingEnvVars = REQUIRED_ENV_VARS.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.warn(`⚠️ Variables d'environnement manquantes: ${missingEnvVars.join(', ')}`);
  console.warn('⚠️ Certains tests peuvent échouer sans ces configurations');
}

// Configuration globale avant tous les tests
beforeAll(async () => {
  console.log('🧪 Démarrage des tests d\'intégration...');
  console.log(`📋 Environnement: ${process.env.NODE_ENV}`);
  console.log(`📋 Base de données: ${process.env.DATABASE_URL ? '✅ Configurée' : '❌ Non configurée'}`);
  console.log(`📋 Redis: ${process.env.REDIS_URL ? '✅ Configuré' : '❌ Non configuré'}`);
  console.log(`📋 Stripe: ${process.env.STRIPE_SECRET_KEY ? '✅ Configuré' : '❌ Non configuré'}`);
  console.log(`📋 SMTP: ${process.env.SMTP_HOST ? '✅ Configuré' : '❌ Non configuré'}`);
});

// Nettoyage après tous les tests
afterAll(async () => {
  console.log('🧪 Fin des tests d\'intégration');
});

