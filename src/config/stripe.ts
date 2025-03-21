import { loadEnv } from '../utils/envLoader';

// Charger les variables d'environnement
const env = loadEnv();

export const stripeConfig = {
  publicKey: env.STRIPE_PUBLIC_KEY || '',
  secretKey: env.STRIPE_SECRET_KEY || '',
  webhookSecret: env.STRIPE_WEBHOOK_SECRET || '',
  currency: 'eur',
  isConfigured: () => Boolean(env.STRIPE_PUBLIC_KEY && env.STRIPE_SECRET_KEY),
  paymentMethods: ['card'],
  successUrl: `${env.NEXT_PUBLIC_BASE_URL || ''}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
  cancelUrl: `${env.NEXT_PUBLIC_BASE_URL || ''}/payment/cancel`,
}; 