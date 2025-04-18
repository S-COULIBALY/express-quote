import Stripe from 'stripe';
import { Money } from '../../domain/valueObjects/Money';

/**
 * Service d'infrastructure pour gérer les paiements via Stripe
 */
export class StripePaymentService {
  private stripe: Stripe;
  private frontendUrl: string;

  /**
   * Constructeur avec injection des dépendances
   */
  constructor(apiKey: string, frontendUrl: string) {
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2025-03-31.basil',
    });
    this.frontendUrl = frontendUrl;
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
    description: string
  ): Promise<{ id: string; clientSecret: string }> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount.getAmount() * 100), // Conversion en centimes
        currency: amount.getCurrency().toLowerCase(),
        description,
        metadata: {
          bookingId,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret as string,
      };
    } catch (error) {
      console.error('Erreur lors de la création de l\'intention de paiement Stripe:', error);
      throw new Error(
        `Erreur lors de la création de l'intention de paiement Stripe: ${
          error instanceof Error ? error.message : 'Erreur inconnue'
        }`
      );
    }
  }

  /**
   * Vérifie le statut d'une intention de paiement
   */
  async checkPaymentIntentStatus(paymentIntentId: string): Promise<{
    status: 'succeeded' | 'processing' | 'requires_payment_method' | 'requires_confirmation' | 'canceled' | 'requires_action';
    amount?: number;
  }> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        status: paymentIntent.status as any,
        amount: paymentIntent.amount ? paymentIntent.amount / 100 : undefined,
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
} 