import { loadEnv } from '../utils/envLoader';
import { logger } from '@/lib/logger';

// Charger les variables d'environnement
const env = loadEnv();


/**
 * Valide et formate une clé Stripe
 * @param key La clé Stripe à valider
 * @param prefix Le préfixe attendu (pk_ ou sk_)
 * @param name Nom de la clé pour les logs
 * @param defaultKey Clé par défaut à utiliser si celle fournie est vide
 * @returns La clé validée ou la clé par défaut
 */
const validateStripeKey = (key: string | undefined, prefix: string, name: string, defaultKey: string = ''): string => {
  // Si la clé est vide ou undefined, utiliser la clé par défaut
  if (!key || key.trim() === '') {
    if (defaultKey) {
      console.warn(`${name} non définie dans les variables d'environnement, utilisation de la clé par défaut`);
      return defaultKey;
    } else {
      console.warn(`${name} non définie dans les variables d'environnement`);
      return '';
    }
  }
  
  // Supprimer les espaces inutiles
  key = key.trim();
  
  // Vérifier le format de la clé
  if (!key.startsWith(prefix)) {
    console.warn(`La clé ${name} ne commence pas par ${prefix}`);
  }
  
  // Afficher seulement un fragment de la clé pour la sécurité
  if (key.length > 10) {
    console.info(`${name} chargée: ${key.substring(0, 4)}...${key.slice(-4)}`);
  }
  
  return key;
};

// Obtenir les clés depuis les variables d'environnement en priorité
// Chercher d'abord dans les variables NEXT_PUBLIC_* pour le frontend
const publicKey = validateStripeKey(
  env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || env.STRIPE_PUBLIC_KEY,
  'pk_',
  'STRIPE_PUBLIC_KEY',
);

// Clé secrète utilisée uniquement côté serveur
const secretKey = validateStripeKey(
  env.STRIPE_SECRET_KEY,
  'sk_',
  'STRIPE_SECRET_KEY',
);

// Configuration du webhook (si présent)
const webhookSecret = validateStripeKey(
  env.STRIPE_WEBHOOK_SECRET,
  'whsec_',
  'STRIPE_WEBHOOK_SECRET'
);

// Vérifier si nous sommes en mode de développement
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Configuration Stripe exportée
 */
export const stripeConfig = {
  // Clés API
  publicKey,
  secretKey,
  webhookSecret,
  
  // Paramètres de base
  currency: 'eur',
  locale: 'fr',
  
  // URLs de redirection
  successUrl: `${env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/success?payment_intent={PAYMENT_INTENT_ID}`,
  cancelUrl: `${env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/catalogue`,
  
  // Modes de paiement acceptés
  paymentMethods: ['card'],
  
  // Vérifie si la configuration est valide
  isConfigured: () => Boolean(publicKey && secretKey && publicKey.startsWith('pk_') && secretKey.startsWith('sk_')),
  
  // Utilitaires
  getPublicConfig: () => ({
    publicKey,
    currency: 'eur',
    locale: 'fr',
    isConfigured: Boolean(publicKey && publicKey.startsWith('pk_')),
    paymentMethods: ['card'],
    isDevelopment
  }),
  
  // Fonctions d'aide pour le mode de développement
  isDevelopment,
  getTestData: () => ({
    testCards: {
      success: '4242424242424242',
      decline: '4000000000000002',
      insufficient: '4000000000009995',
      authentication: '4000002500003155'
    }
  })
}; 