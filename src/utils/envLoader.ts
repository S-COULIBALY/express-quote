/**
 * Utilitaire pour charger les variables d'environnement
 * Cela permet d'avoir des valeurs par défaut et de centraliser l'accès aux variables d'environnement
 */
export function loadEnv() {
  // Déboguer le chargement des variables d'environnement
  console.log('Chargement des variables d\'environnement:', {
    hasStripePublicKey: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || process.env.STRIPE_PUBLIC_KEY),
    stripePublicKeyLength: (process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || process.env.STRIPE_PUBLIC_KEY)?.length || 0,
    hasStripeSecretKey: Boolean(process.env.STRIPE_SECRET_KEY),
    stripeSecretKeyLength: process.env.STRIPE_SECRET_KEY?.length || 0,
    nextPublicBaseUrl: process.env.NEXT_PUBLIC_BASE_URL
  });

  const env = {
    // Variables d'environnement Next.js
    NODE_ENV: process.env.NODE_ENV || 'development',
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    
    // Variables pour Stripe
    NEXT_PUBLIC_STRIPE_PUBLIC_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '',
    STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY || '',
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
    
    // Variables pour l'envoi d'emails
    EMAIL_FROM: process.env.EMAIL_FROM || 'contact@express-quote.com',
    EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST || '',
    EMAIL_SERVER_PORT: Number(process.env.EMAIL_SERVER_PORT) || 587,
    EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER || '',
    EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD || '',
  };

  // Vérifier si les clés Stripe sont présentes
  if (!env.STRIPE_PUBLIC_KEY && !env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY) {
    console.warn('⚠️ STRIPE_PUBLIC_KEY manquante. Le paiement ne fonctionnera pas correctement.');
  }
  
  if (!env.STRIPE_SECRET_KEY) {
    console.warn('⚠️ STRIPE_SECRET_KEY manquante. Le paiement ne fonctionnera pas correctement.');
  }

  return env;
} 