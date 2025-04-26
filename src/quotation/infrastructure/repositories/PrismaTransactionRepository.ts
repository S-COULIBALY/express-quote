import { PrismaClient } from '@prisma/client';
import { ITransactionRepository } from '../../application/services/TransactionService';
import { Transaction, TransactionStatus } from '../../domain/entities/Transaction';
import { Booking } from '../../domain/entities/Booking';
import { Money } from '../../domain/valueObjects/Money';
import { Database } from '../config/database';

export class PrismaTransactionRepository implements ITransactionRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = Database.getClient();
  }

  /**
   * Enregistre une transaction en base de données
   */
  async save(transaction: Transaction): Promise<Transaction> {
    try {
      const existingTransaction = transaction.getId() 
        ? await this.prisma.transaction.findUnique({ where: { id: transaction.getId() } })
        : null;

      const transactionData = {
        bookingId: transaction.getBooking().getId(),
        amount: transaction.getAmount().getAmount(),
        currency: transaction.getAmount().getCurrency(),
        status: transaction.getStatus(),
        paymentMethod: transaction.getPaymentMethod() || null,
        paymentIntentId: transaction.getPaymentIntentId() || null,
        stripeSessionId: transaction.getStripeSessionId() || null,
        errorMessage: transaction.getErrorMessage() || null,
      };

      if (existingTransaction) {
        // Mise à jour d'une transaction existante
        await this.prisma.transaction.update({
          where: { id: transaction.getId() },
          data: transactionData
        });
        return transaction;
      } else {
        // Création d'une nouvelle transaction
        const id = transaction.getId() || undefined;
        const createdTransaction = await this.prisma.transaction.create({
          data: {
            ...transactionData,
            id
          },
          include: {
            booking: {
              include: {
                customer: true,
                professional: true
              }
            }
          }
        });

        // Chargement de la réservation associée
        const booking = await this.loadBooking(createdTransaction.booking);

        // Construction de la transaction avec l'ID généré
        return new Transaction(
          booking,
          new Money(createdTransaction.amount, createdTransaction.currency),
          createdTransaction.status as TransactionStatus,
          createdTransaction.paymentMethod || undefined,
          createdTransaction.paymentIntentId || undefined,
          createdTransaction.stripeSessionId || undefined,
          createdTransaction.errorMessage || undefined,
          createdTransaction.id
        );
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la transaction:', error);
      throw new Error(`Erreur lors de la sauvegarde de la transaction: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve une transaction par son ID
   */
  async findById(id: string): Promise<Transaction | null> {
    try {
      const transaction = await this.prisma.transaction.findUnique({
        where: { id },
        include: {
          booking: {
            include: {
              customer: true,
              professional: true
            }
          }
        }
      });

      if (!transaction) {
        return null;
      }

      // Chargement de la réservation associée
      const booking = await this.loadBooking(transaction.booking);

      return new Transaction(
        booking,
        new Money(transaction.amount, transaction.currency),
        transaction.status as TransactionStatus,
        transaction.paymentMethod || undefined,
        transaction.paymentIntentId || undefined,
        transaction.stripeSessionId || undefined,
        transaction.errorMessage || undefined,
        transaction.id
      );
    } catch (error) {
      console.error(`Erreur lors de la recherche de la transaction par ID ${id}:`, error);
      throw new Error(`Erreur lors de la recherche de la transaction: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve les transactions par ID de réservation
   */
  async findByBookingId(bookingId: string): Promise<Transaction[]> {
    try {
      const transactions = await this.prisma.transaction.findMany({
        where: { bookingId },
        include: {
          booking: {
            include: {
              customer: true,
              professional: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const result: Transaction[] = [];
      
      for (const transaction of transactions) {
        const booking = await this.loadBooking(transaction.booking);
        
        result.push(new Transaction(
          booking,
          new Money(transaction.amount, transaction.currency),
          transaction.status as TransactionStatus,
          transaction.paymentMethod || undefined,
          transaction.paymentIntentId || undefined,
          transaction.stripeSessionId || undefined,
          transaction.errorMessage || undefined,
          transaction.id
        ));
      }

      return result;
    } catch (error) {
      console.error(`Erreur lors de la recherche des transactions par réservation ${bookingId}:`, error);
      throw new Error(`Erreur lors de la recherche des transactions: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Met à jour le statut d'une transaction
   */
  async updateStatus(id: string, status: TransactionStatus, errorMessage?: string): Promise<void> {
    try {
      await this.prisma.transaction.update({
        where: { id },
        data: { 
          status,
          errorMessage: errorMessage || null
        }
      });
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du statut de la transaction ${id}:`, error);
      throw new Error(`Erreur lors de la mise à jour du statut: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Charge une réservation à partir des données de la base
   */
  private async loadBooking(bookingData: any): Promise<Booking> {
    try {
      // Import dynamique pour éviter la dépendance circulaire
      const { PrismaBookingRepository } = await import('./PrismaBookingRepository');
      const bookingRepo = new PrismaBookingRepository();
      
      // Chargement de la réservation complète
      const booking = await bookingRepo.findById(bookingData.id);
      
      if (!booking) {
        throw new Error(`Booking with ID ${bookingData.id} not found`);
      }
      
      return booking;
    } catch (error) {
      console.error(`Erreur lors du chargement de la réservation:`, error);
      throw new Error(`Erreur lors du chargement de la réservation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }
} 