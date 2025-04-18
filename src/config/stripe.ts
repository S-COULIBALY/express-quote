import { loadEnv } from '../utils/envLoader';

// Charger les variables d'environnement
const env = loadEnv();

// Fonction de validation des clés Stripe
const validateStripeKey = (key: string, prefix: string): string => {
  if (!key) return '';
  
  // Supprimer les espaces inutiles
  key = key.trim();
  
  // Vérifier le format de la clé
  if (!key.startsWith(prefix)) {
    console.warn(`Avertissement: La clé Stripe ne commence pas par ${prefix}`);
  }
  
  console.log(`Clé Stripe validée: ${key.substring(0, 7)}...${key.slice(-4)}`);
  return key;
};

// Utiliser les clés Stripe de test standard
// Note: Ces clés sont des clés de test publiques Stripe 
// qui peuvent être utilisées pour le développement
const publicKey = validateStripeKey(
  env.STRIPE_PUBLIC_KEY || 'pk_test_51RAsKtCOry8lH7zkJuUb3n9FaytLOeevwa7bE9wQfpHEXFBvD9oS5BvSQeihtb8R2geZ4zu0ir7qQaCuUVAi0asE00y1UnfYd3',
  'pk_'
);

// Clé secrète utilisée uniquement côté serveur
const secretKey = validateStripeKey(
  env.STRIPE_SECRET_KEY || 'sk_test_51RAsKtC0ry81H7zkL3OToE1BN9yMC34yQnOs9kW6RmJ1yWiaQD6X8FcQ8zsiWnb34KX2QUNRacTT7U7biEpXiBh200b5FK7V9B',
  'sk_'
);

// Configuration Stripe
export const stripeConfig = {
  publicKey,
  secretKey,
  webhookSecret: env.STRIPE_WEBHOOK_SECRET || '',
  currency: 'eur',
  isConfigured: () => Boolean(publicKey && secretKey && publicKey.startsWith('pk_') && secretKey.startsWith('sk_')),
  paymentMethods: ['card'],
  successUrl: `${env.NEXT_PUBLIC_BASE_URL || ''}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
  cancelUrl: `${env.NEXT_PUBLIC_BASE_URL || ''}/payment/cancel`,
}; 