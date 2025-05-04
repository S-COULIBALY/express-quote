import Stripe from 'stripe';
import { Injectable } from '@/core/dependency-injection/Injectable';
import { IPaymentService } from '@/quotation/domain/services/IPaymentService';
import { Money } from '@/quotation/domain/valueObjects/Money';
import { stripeConfig } from '@/config/stripe';
import { logger } from '@/lib/logger';

/**
 * Service d'infrastructure pour gérer les paiements via Stripe
 */
@Injectable()
export class StripePaymentService implements IPaymentService {
  private stripe: Stripe;
  private frontendUrl: string;
  private paymentLogger = logger.withContext('StripePayment');

  /**
   * Constructeur avec injection des dépendances
   */
  constructor(frontendUrl: string) {
    if (!stripeConfig.isConfigured()) {
      this.paymentLogger.warn('Stripe non configuré correctement. Les paiements ne fonctionneront pas.');
    }
    
    this.stripe = new Stripe(stripeConfig.secretKey, {
      apiVersion: '2022-11-15'
    });
    
    this.frontendUrl = frontendUrl;
    this.paymentLogger.info('Service de paiement Stripe initialisé');
  }

  /**
   * Crée une session de paiement Stripe
   */
  async createCheckoutSession(
    bookingId: string,
    customerEmail: string,
    amount: Money,
    description: string
  ): Promise<{ sessionId: string; url: string }> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: amount.getCurrency().toLowerCase(),
              product_data: {
                name: description,
              },
              unit_amount: Math.round(amount.getAmount() * 100), // Conversion en centimes
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${this.frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.frontendUrl}/payment/cancel`,
        customer_email: customerEmail,
        metadata: {
          bookingId,
        },
      });

      return {
        sessionId: session.id,
        url: session.url as string,
      };
    } catch (error) {
      console.error('Erreur lors de la création de la session Stripe:', error);
      throw new Error(`Erreur lors de la création de la session Stripe: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Vérifie le statut d'une session Stripe
   */
  async checkSessionStatus(sessionId: string): Promise<{
    status: 'paid' | 'unpaid' | 'pending';
    paymentIntentId?: string;
  }> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);

      return {
        status: session.payment_status as 'paid' | 'unpaid' | 'pending',
        paymentIntentId: session.payment_intent as string | undefined,
      };
    } catch (error) {
      console.error('Erreur lors de la vérification de la session Stripe:', error);
      throw new Error(`Erreur lors de la vérification de la session Stripe: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Effectue un remboursement
   */
  async createRefund(paymentIntentId: string, amount?: number): Promise<{ id: string }> {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };

      // Si un montant est spécifié, l'ajouter aux paramètres
      if (amount) {
        refundParams.amount = Math.round(amount * 100); // Conversion en centimes
      }

      const refund = await this.stripe.refunds.create(refundParams);

      return {
        id: refund.id,
      };
    } catch (error) {
      console.error('Erreur lors du remboursement Stripe:', error);
      throw new Error(`Erreur lors du remboursement Stripe: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Crée un webhook pour gérer les événements Stripe
   */
  createWebhookEvent(rawBody: string, signature: string, webhookSecret: string): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement webhook:', error);
      throw new Error(`Erreur webhook: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Crée une intention de paiement pour Stripe Elements
   */
  async createPaymentIntent(
    bookingId: string,
    amount: Money,
    description?: string
  ): Promise<{ clientSecret: string; id: string }> {
    try {
      this.paymentLogger.debug(`Création d'une intention de paiement pour la réservation ${bookingId}`);
      
      // Vérifier que le montant est valide
      if (amount.getAmount() <= 0) {
        throw new Error(`Montant invalide: ${amount.getAmount()} ${amount.getCurrency()}`);
      }
      
      // Créer l'intention de paiement
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount.getAmount() * 100), // Convertir en centimes
        currency: amount.getCurrency().toLowerCase(),
        description: description || `Réservation #${bookingId}`,
        metadata: {
          bookingId,
          amountOriginal: String(amount.getAmount()),
          source: 'express-quote'
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });
      
      this.paymentLogger.info(`Intention de paiement créée: ${paymentIntent.id}`);

      return {
        clientSecret: paymentIntent.client_secret || '',
        id: paymentIntent.id,
      };
    } catch (error) {
      this.paymentLogger.error('Erreur lors de la création de l\'intention de paiement', error as Error);
      throw error;
    }
  }

  /**
   * Vérifie le statut d'une intention de paiement
   */
  async checkPaymentIntentStatus(paymentIntentId: string): Promise<{
    status: 'succeeded' | 'processing' | 'requires_payment_method' | 'requires_confirmation' | 'canceled' | 'requires_action';
    amount?: number;
    bookingId?: string;
    customerEmail?: string;
    metadata?: Record<string, string>;
  }> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['customer']
      });

      return {
        status: paymentIntent.status as any,
        amount: paymentIntent.amount ? paymentIntent.amount / 100 : undefined,
        bookingId: paymentIntent.metadata?.bookingId,
        customerEmail: typeof paymentIntent.customer === 'object' && paymentIntent.customer && 'email' in paymentIntent.customer && typeof paymentIntent.customer.email === 'string' ? paymentIntent.customer.email : undefined,
        metadata: paymentIntent.metadata as Record<string, string> || {}
      };
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'intention de paiement Stripe:', error);
      throw new Error(
        `Erreur lors de la vérification de l'intention de paiement Stripe: ${
          error instanceof Error ? error.message : 'Erreur inconnue'
        }`
      );
    }
  }

  /**
   * Récupère les informations complètes d'une session de paiement Stripe
   * @param sessionId ID de la session Stripe à récupérer
   * @returns La session complète avec toutes ses informations (métadonnées, statut, etc.)
   */
  async retrieveCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    try {
      return await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent', 'line_items', 'customer']
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de la session Stripe:', error);
      throw new Error(
        `Erreur lors de la récupération de la session Stripe: ${
          error instanceof Error ? error.message : 'Erreur inconnue'
        }`
      );
    }
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<any> {
    try {
      this.paymentLogger.debug(`Récupération de l'intention de paiement ${paymentIntentId}`);
      
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      this.paymentLogger.debug(`Statut de l'intention de paiement: ${paymentIntent.status}`);
      
      return paymentIntent;
    } catch (error) {
      this.paymentLogger.error(`Erreur lors de la récupération de l'intention de paiement ${paymentIntentId}`, error as Error);
      throw error;
    }
  }

  async verifyPaymentIntent(paymentIntentId: string): Promise<boolean> {
    try {
      const paymentIntent = await this.retrievePaymentIntent(paymentIntentId);
      
      // Vérifier si le paiement est complet
      const isSuccessful = paymentIntent.status === 'succeeded';
      
      if (isSuccessful) {
        this.paymentLogger.info(`Paiement vérifié avec succès: ${paymentIntentId}`);
      } else {
        this.paymentLogger.warn(`Vérification du paiement échouée: ${paymentIntentId}, statut: ${paymentIntent.status}`);
      }
      
      return isSuccessful;
    } catch (error) {
      this.paymentLogger.error(`Erreur lors de la vérification du paiement ${paymentIntentId}`, error as Error);
      return false;
    }
  }
  
  async cancelPaymentIntent(paymentIntentId: string): Promise<boolean> {
    try {
      this.paymentLogger.debug(`Annulation de l'intention de paiement ${paymentIntentId}`);
      
      await this.stripe.paymentIntents.cancel(paymentIntentId);
      
      this.paymentLogger.info(`Intention de paiement annulée: ${paymentIntentId}`);
      
      return true;
    } catch (error) {
      this.paymentLogger.error(`Erreur lors de l'annulation de l'intention de paiement ${paymentIntentId}`, error as Error);
      return false;
    }
  }
  
  // Méthode utilitaire pour récupérer les données de test
  getTestCards() {
    return stripeConfig.isDevelopment ? stripeConfig.getTestData().testCards : null;
  }
} 