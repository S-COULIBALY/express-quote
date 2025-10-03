import { Injectable } from '@/core/dependency-injection/Injectable';
import { IPaymentService } from '../../domain/services/IPaymentService';
import { Money } from '@/quotation/domain/valueObjects/Money';
import { 
  CreatePaymentIntentCommand,
  VerifyPaymentCommand, 
  CancelPaymentCommand,
  RefundPaymentCommand,
  PaymentIntentResult,
  PaymentStatusResult,
  RefundResult
} from '../commands/PaymentCommands';
import { logger } from '@/lib/logger';

/**
 * Gestionnaire des commandes liées au paiement
 */
@Injectable()
export class PaymentCommandHandler {
  private paymentLogger = logger.withContext('PaymentCommandHandler');

  // Map pour stocker les intentions de paiement actives par ID de réservation
  private activePaymentIntents = new Map<string, { clientSecret: string, createdAt: number }>();
  
  // Durée de validité d'une intention de paiement en millisecondes (15 minutes)
  private PAYMENT_INTENT_EXPIRY = 15 * 60 * 1000;

  constructor(private paymentService: IPaymentService) {
    this.paymentLogger.info('PaymentCommandHandler initialisé');
  }

  /**
   * Gère la commande de création d'une intention de paiement
   */
  async handleCreatePaymentIntent(command: CreatePaymentIntentCommand): Promise<PaymentIntentResult> {
    try {
      this.paymentLogger.info('Traitement de la commande CreatePaymentIntent', { bookingId: command.bookingId });

      // Vérifier si une intention de paiement existe déjà et est toujours valide
      const existingIntent = this.activePaymentIntents.get(command.bookingId);
      const now = Date.now();
      
      if (existingIntent && (now - existingIntent.createdAt) < this.PAYMENT_INTENT_EXPIRY) {
        this.paymentLogger.info('Réutilisation d\'une intention de paiement existante', { bookingId: command.bookingId });
        return {
          clientSecret: existingIntent.clientSecret,
          id: command.bookingId, // Note: Ceci n'est pas l'ID réel de l'intention chez Stripe
          amount: command.amount
        };
      }

      // S'assurer que le montant est valide
      if (!command.amount || command.amount <= 0) {
        throw new Error(`Montant invalide: ${command.amount}. Le montant doit être un nombre positif.`);
      }

      // Créer une nouvelle intention de paiement
      const moneyAmount = new Money(command.amount, command.currency || 'EUR');
      
      const result = await this.paymentService.createPaymentIntent(
        command.bookingId,
        moneyAmount,
        command.description || `Paiement pour réservation #${command.bookingId}`
      );

      // Stocker l'intention de paiement pour une utilisation ultérieure
      this.activePaymentIntents.set(command.bookingId, {
        clientSecret: result.clientSecret,
        createdAt: now
      });

      this.paymentLogger.info('Intention de paiement créée avec succès', { 
        bookingId: command.bookingId,
        paymentIntentId: result.id
      });

      return {
        clientSecret: result.clientSecret,
        id: result.id,
        amount: command.amount
      };
    } catch (error) {
      this.paymentLogger.error('Erreur lors de la création de l\'intention de paiement', error as Error);
      throw error;
    }
  }

  /**
   * Gère la commande de vérification de statut de paiement
   */
  async handleVerifyPayment(command: VerifyPaymentCommand): Promise<PaymentStatusResult> {
    try {
      this.paymentLogger.info('Vérification du statut du paiement', { paymentIntentId: command.paymentIntentId });
      
      const status = await this.paymentService.checkPaymentIntentStatus(command.paymentIntentId);
      
      this.paymentLogger.info('Statut du paiement récupéré', { 
        paymentIntentId: command.paymentIntentId,
        status: status.status
      });
      
      return status;
    } catch (error) {
      this.paymentLogger.error('Erreur lors de la vérification du statut de paiement', error as Error);
      throw error;
    }
  }

  /**
   * Gère la commande d'annulation d'une intention de paiement
   */
  async handleCancelPayment(command: CancelPaymentCommand): Promise<boolean> {
    try {
      this.paymentLogger.info('Annulation du paiement', { paymentIntentId: command.paymentIntentId });
      
      const result = await this.paymentService.cancelPaymentIntent(command.paymentIntentId);
      
      this.paymentLogger.info('Paiement annulé avec succès', { 
        paymentIntentId: command.paymentIntentId,
        result
      });
      
      return result;
    } catch (error) {
      this.paymentLogger.error('Erreur lors de l\'annulation du paiement', error as Error);
      throw error;
    }
  }

  /**
   * Gère la commande de remboursement
   */
  async handleRefundPayment(command: RefundPaymentCommand): Promise<RefundResult> {
    try {
      this.paymentLogger.info('Traitement du remboursement', { 
        paymentIntentId: command.paymentIntentId,
        amount: command.amount
      });
      
      const result = await this.paymentService.createRefund(command.paymentIntentId, command.amount);
      
      this.paymentLogger.info('Remboursement effectué avec succès', { 
        paymentIntentId: command.paymentIntentId,
        refundId: result.id
      });
      
      return {
        id: result.id,
        amount: command.amount,
        status: 'succeeded'
      };
    } catch (error) {
      this.paymentLogger.error('Erreur lors du remboursement', error as Error);
      throw error;
    }
  }
} 