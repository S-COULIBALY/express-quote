import { Injectable } from '@/core/dependency-injection/Injectable';
import { PaymentCommandHandler } from '@/quotation/application/handlers/PaymentCommandHandler';
import {
  CreatePaymentIntentCommand,
  VerifyPaymentCommand,
  CancelPaymentCommand,
  RefundPaymentCommand
} from '@/quotation/application/commands/PaymentCommands';
import { logger } from '@/lib/logger';

/**
 * Adaptateur pour les routes API de paiement
 * Fait le lien entre les API routes et le gestionnaire de commandes du système de paiement
 */
@Injectable()
export class ApiPaymentAdapter {
  private paymentLogger = logger.withContext('ApiPaymentAdapter');

  constructor(private commandHandler: PaymentCommandHandler) {
    this.paymentLogger.info('ApiPaymentAdapter initialisé');
  }

  /**
   * Crée une intention de paiement à partir des données de requête
   */
  async createPaymentIntent(requestData: any) {
    try {
      this.paymentLogger.info('Création d\'une intention de paiement via l\'API', { bookingId: requestData.bookingId });
      
      const command: CreatePaymentIntentCommand = {
        bookingId: requestData.bookingId,
        amount: requestData.amount,
        currency: requestData.currency || 'EUR',
        description: requestData.description,
        metadata: requestData.metadata
      };
      
      return await this.commandHandler.handleCreatePaymentIntent(command);
    } catch (error) {
      this.paymentLogger.error('Erreur lors de la création de l\'intention de paiement via l\'API', error as Error);
      throw error;
    }
  }
  
  /**
   * Vérifie le statut d'un paiement
   */
  async verifyPayment(paymentIntentId: string) {
    try {
      this.paymentLogger.info('Vérification du statut d\'un paiement via l\'API', { paymentIntentId });
      
      const command: VerifyPaymentCommand = {
        paymentIntentId
      };
      
      return await this.commandHandler.handleVerifyPayment(command);
    } catch (error) {
      this.paymentLogger.error('Erreur lors de la vérification du paiement via l\'API', error as Error);
      throw error;
    }
  }
  
  /**
   * Annule une intention de paiement
   */
  async cancelPayment(paymentIntentId: string) {
    try {
      this.paymentLogger.info('Annulation d\'un paiement via l\'API', { paymentIntentId });
      
      const command: CancelPaymentCommand = {
        paymentIntentId
      };
      
      return await this.commandHandler.handleCancelPayment(command);
    } catch (error) {
      this.paymentLogger.error('Erreur lors de l\'annulation du paiement via l\'API', error as Error);
      throw error;
    }
  }
  
  /**
   * Effectue un remboursement
   */
  async refundPayment(requestData: any) {
    try {
      this.paymentLogger.info('Traitement d\'un remboursement via l\'API', { 
        paymentIntentId: requestData.paymentIntentId
      });
      
      const command: RefundPaymentCommand = {
        paymentIntentId: requestData.paymentIntentId,
        amount: requestData.amount,
        reason: requestData.reason
      };
      
      return await this.commandHandler.handleRefundPayment(command);
    } catch (error) {
      this.paymentLogger.error('Erreur lors du remboursement via l\'API', error as Error);
      throw error;
    }
  }
} 