/**
 * 💳 BookingPaymentService
 * 
 * Service responsable de la confirmation de paiement :
 * - Mise à jour du statut booking → PAYMENT_COMPLETED
 * - Orchestration documents et notifications via API
 * - Déclenchement attribution professionnelle
 * 
 * ✅ PHASE 3 - Extraction depuis BookingService
 */

import { Booking, BookingStatus } from '../../../domain/entities/Booking';
import { IBookingRepository } from '../../../domain/repositories/IBookingRepository';
import { BookingNotFoundError } from '../../../domain/errors/BookingErrors';
import { BookingAttributionService } from './coordination/BookingAttributionService';
import { logger } from '@/lib/logger';

export interface PaymentData {
  paymentIntentId: string;
  amount: number;
  status: string;
}

/**
 * Service de confirmation de paiement
 */
export class BookingPaymentService {
  constructor(
    private readonly bookingRepository: IBookingRepository,
    private readonly attributionService: BookingAttributionService
  ) {}

  /**
   * ✅ FLUX PRODUCTION PRINCIPAL - Confirme le succès du paiement
   *
   * Ce flux est déclenché par :
   *   1. Webhook Stripe 'payment_intent.succeeded'
   *   2. → /api/webhooks/stripe/route.ts
   *   3. → Cette méthode confirmPaymentSuccess()
   *
   * Actions effectuées :
   *   - Met à jour le statut booking → PAYMENT_COMPLETED
   *   - Génère les documents financiers (reçu, facture)
   *   - Envoie l'email 'payment-confirmation' avec React Email template
   *   - Déclenche l'attribution professionnelle
   *
   * Template email : 'payment-confirmation' (pas 'booking-confirmation')
   * Documents joints : Reçu de paiement + Facture
   *
   * @param bookingId - ID de la réservation à confirmer
   * @param paymentData - Données du paiement Stripe (paymentIntentId, amount, status)
   */
  async confirmPaymentSuccess(
    bookingId: string,
    paymentData: PaymentData
  ): Promise<void> {
    console.log(
      `🔵 [TRACE DEBUT] confirmPaymentSuccess APPELÉ pour booking ${bookingId}`
    );
    logger.info(
      `🔵 [TRACE DEBUT] confirmPaymentSuccess APPELÉ pour booking ${bookingId}`
    );
    logger.info(
      `💳 Confirmation de paiement pour la réservation ${bookingId}`,
      paymentData
    );

    try {
      const booking = await this.bookingRepository.findById(bookingId);
      if (!booking) {
        throw new BookingNotFoundError(bookingId);
      }

      // Mettre à jour le statut de la réservation
      booking.updateStatus(BookingStatus.PAYMENT_COMPLETED);
      await this.bookingRepository.save(booking);

      // 🎯 FLUX PRODUCTION : Orchestration unifiée via DocumentOrchestrationService
      // ✅ Ce code EST UTILISÉ en production après chaque paiement Stripe
      try {
        // Valider les variables d'environnement
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || process.env.INTERNAL_API_URL;
        if (!baseUrl) {
          throw new Error(
            'NEXT_PUBLIC_APP_URL ou INTERNAL_API_URL doit être configuré pour les notifications'
          );
        }

        logger.info(
          '🎼 Étape PAYMENT_COMPLETED: Orchestration documents et notifications via API unifiée...'
        );
        let orchestrationResult = { success: false, distributed: false };
        try {
          const orchestrationResponse = await fetch(
            `${baseUrl}/api/documents/orchestrate`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'BookingService/1.0',
              },
              body: JSON.stringify({
                bookingId: bookingId,
                trigger: 'PAYMENT_COMPLETED', // ✅ Email 'payment-confirmation' + reçu/facture PDF
                options: {
                  forceGeneration: true,
                  skipApproval: true,
                  customOptions: {
                    paymentDate: new Date().toISOString(),
                    paymentIntentId: paymentData.paymentIntentId,
                    paymentMethod: 'Carte bancaire (Stripe)',
                    transactionId: paymentData.paymentIntentId,
                    additionalInfo: paymentData,
                  },
                },
              }),
            }
          );

          if (orchestrationResponse.ok) {
            orchestrationResult = await orchestrationResponse.json();
            logger.info('✅ Orchestration documents PAYMENT_COMPLETED terminée', {
              success: orchestrationResult.success,
              distributed: orchestrationResult.distributed,
              documentsGenerated:
                (orchestrationResult as any).results?.length || 0,
            });
          } else {
            const errorText = await orchestrationResponse.text();
            logger.error(
              '❌ Erreur API orchestration documents PAYMENT_COMPLETED',
              {
                status: orchestrationResponse.status,
                error: errorText,
              }
            );
          }
        } catch (orchestrationError) {
          logger.error(
            '❌ Erreur lors de l\'orchestration documents PAYMENT_COMPLETED',
            {
              error:
                orchestrationError instanceof Error
                  ? orchestrationError.message
                  : 'Erreur inconnue',
              stack:
                orchestrationError instanceof Error
                  ? orchestrationError.stack
                  : undefined,
            }
          );
        }

        logger.info('✅ Flux PAYMENT_COMPLETED terminé', {
          orchestration: orchestrationResult.success,
          documentsDistributed: orchestrationResult.distributed,
        });

        // 🆕 NOUVEAU: Déclencher l'attribution professionnelle après paiement
        try {
          await this.attributionService.triggerAttribution(booking);
          logger.info('✅ Attribution professionnelle déclenchée avec succès');
        } catch (attributionError) {
          logger.error(
            '❌ Erreur lors de l\'attribution professionnelle',
            attributionError as Error
          );
          // L'attribution ne doit pas bloquer le paiement, continuer
        }
      } catch (error) {
        logger.error(
          '❌ Erreur lors de la génération des documents de paiement',
          error as Error
        );
        // L'orchestration via /api/documents/orchestrate gère déjà les notifications
        // Pas de fallback nécessaire
      }

      logger.info(
        `✅ Paiement confirmé avec succès pour la réservation ${bookingId}`
      );
    } catch (error) {
      logger.error(
        `❌ Erreur lors de la confirmation de paiement pour ${bookingId}:`,
        error
      );
      throw error;
    }
  }
}

