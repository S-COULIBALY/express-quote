/**
 * Utilitaire pour charger les variables d'environnement
 * Cela permet d'avoir des valeurs par défaut et de centraliser l'accès aux variables d'environnement
 */
export function loadEnv() {
  return {
    // Variables d'environnement Next.js
    NODE_ENV: process.env.NODE_ENV || 'development',
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    
    // Variables pour Stripe
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
} 