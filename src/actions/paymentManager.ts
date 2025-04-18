'use server'

import { StripePaymentService } from '@/quotation/infrastructure/services/StripePaymentService';
import { stripeConfig } from '@/config/stripe';
import { Money } from '@/quotation/domain/valueObjects/Money';
import { getCurrentBooking } from './bookingManager';

// Map pour stocker les intentions de paiement actives par ID de réservation
// afin d'éviter la création de multiples intentions
const activePaymentIntents = new Map<string, { clientSecret: string, createdAt: number }>();

// Durée de validité d'une intention de paiement en millisecondes (15 minutes)
const PAYMENT_INTENT_EXPIRY = 15 * 60 * 1000;

/**
 * Crée une intention de paiement pour Stripe et renvoie un secret client
 * Réutilise une intention existante si elle est toujours valide
 */
export async function createPaymentIntent(
  bookingId?: string, 
  amount?: number,
  description?: string
): Promise<{ clientSecret: string; amount: number }> {
  try {
    // Utiliser le booking de la session si aucun ID n'est fourni
    if (!bookingId) {
      const currentBooking = await getCurrentBooking();
      if (!currentBooking) {
        throw new Error('Réservation introuvable');
      }
      bookingId = currentBooking.id;
      
      // Si aucun montant n'est fourni, calculer un acompte de 30%
      if (!amount) {
        amount = currentBooking.totalTTC * 0.3;
        description = description || `Acompte de réservation #${currentBooking.id}`;
      }
    }
    
    if (!amount) {
      throw new Error('Montant non spécifié');
    }
    
    if (!stripeConfig.isConfigured()) {
      throw new Error("Stripe n'est pas configuré. Vérifiez vos variables d'environnement.");
    }
    
    // Vérifier si une intention de paiement existe déjà et est toujours valide
    const existingIntent = activePaymentIntents.get(bookingId);
    const now = Date.now();
    
    if (existingIntent && (now - existingIntent.createdAt) < PAYMENT_INTENT_EXPIRY) {
      console.log(`Réutilisation d'une intention de paiement existante pour la réservation ${bookingId}`);
      return {
        clientSecret: existingIntent.clientSecret,
        amount: amount
      };
    }
    
    // Sinon, créer une nouvelle intention de paiement
    console.log(`Création d'une nouvelle intention de paiement pour la réservation ${bookingId}`);
    
    // Initialiser le service de paiement Stripe
    const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const stripePaymentService = new StripePaymentService(stripeConfig.secretKey, frontendUrl);
    
    // Convertir le montant en objet Money
    const moneyAmount = new Money(amount, stripeConfig.currency);
    
    // Créer l'intention de paiement
    const paymentIntent = await stripePaymentService.createPaymentIntent(
      bookingId,
      moneyAmount,
      description || `Paiement pour réservation #${bookingId}`
    );
    
    console.log(`Intention de paiement créée pour la réservation ${bookingId}:`, paymentIntent.id);
    
    // Stocker l'intention de paiement pour une utilisation ultérieure
    activePaymentIntents.set(bookingId, {
      clientSecret: paymentIntent.clientSecret,
      createdAt: now
    });
    
    return {
      clientSecret: paymentIntent.clientSecret,
      amount: amount
    };
  } catch (error) {
    console.error('Erreur lors de la création de l\'intention de paiement:', error);
    throw new Error(error instanceof Error ? error.message : 'Une erreur est survenue');
  }
}

/**
 * Vérifie le statut d'une intention de paiement
 */
export async function checkPaymentIntentStatus(paymentIntentId: string): Promise<{
  status: 'succeeded' | 'processing' | 'requires_payment_method' | 'requires_confirmation' | 'canceled' | 'requires_action';
  amount?: number;
}> {
  if (!stripeConfig.isConfigured()) {
    throw new Error("Stripe n'est pas configuré. Vérifiez vos variables d'environnement.");
  }
  
  try {
    const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const stripePaymentService = new StripePaymentService(stripeConfig.secretKey, frontendUrl);
    
    return await stripePaymentService.checkPaymentIntentStatus(paymentIntentId);
  } catch (error) {
    console.error('Erreur lors de la vérification du statut de paiement:', error);
    throw new Error(error instanceof Error ? error.message : 'Une erreur est survenue');
  }
} 