/**
 * 🏗️ BookingCreationService
 * 
 * Service responsable de la création de réservation après paiement :
 * - Vérification idempotence (PaymentIntent)
 * - Validation prix sécurisé (signature HMAC)
 * - Transaction atomique (Customer → Booking → Transaction → QuoteRequest)
 * - Stockage coordonnées
 * 
 * ⚠️ IMPORTANT : Cette méthode crée uniquement la réservation en base de données.
 * Elle NE DÉCLENCHE PAS les notifications ni l'attribution professionnelle.
 * 
 * Les notifications sont envoyées séparément par BookingPaymentService.confirmPaymentSuccess()
 * avec le trigger PAYMENT_COMPLETED qui envoie l'email 'payment-confirmation'
 * avec les documents PDF (reçu + facture).
 * 
 * ✅ PHASE 3 - Extraction depuis BookingService
 */

import crypto from 'crypto';
import { Booking, BookingStatus } from '../../../domain/entities/Booking';
import { QuoteRequest, QuoteRequestStatus } from '../../../domain/entities/QuoteRequest';
import { IBookingRepository } from '../../../domain/repositories/IBookingRepository';
import { IQuoteRequestRepository } from '../../../domain/repositories/IQuoteRequestRepository';
import { bookingTypeMapper } from './mapping/BookingTypeMapper';
import { bookingCoordinatesService } from './coordination/BookingCoordinatesService';
import { BookingPriceValidationService } from './pricing/BookingPriceValidationService';
import { BookingPriceRecalculationService } from './pricing/BookingPriceRecalculationService';
import { UnifiedDataService, ConfigurationCategory } from '@/quotation/infrastructure/services/UnifiedDataService';
import { PricingFactorsConfigKey } from '@/quotation/domain/configuration/ConfigurationKey';
import { logger } from '@/lib/logger';

export interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

/**
 * Service de création de réservation
 */
export class BookingCreationService {
  private readonly unifiedDataService: UnifiedDataService;
  private readonly priceValidationService: BookingPriceValidationService;
  private readonly priceRecalculationService: BookingPriceRecalculationService;

  constructor(
    private readonly bookingRepository: IBookingRepository,
    private readonly quoteRequestRepository: IQuoteRequestRepository
  ) {
    this.unifiedDataService = UnifiedDataService.getInstance();
    this.priceValidationService = new BookingPriceValidationService();
    this.priceRecalculationService = new BookingPriceRecalculationService();
  }

  /**
   * Crée une réservation après un paiement réussi (appelé par le webhook Stripe)
   *
   * @param sessionId - PaymentIntent ID de Stripe (utilisé pour idempotence)
   * @param temporaryId - ID temporaire du QuoteRequest
   * @param customerData - Données client (firstName, lastName, email, phone)
   * @returns {Promise<Booking>} La réservation créée avec statut PAYMENT_COMPLETED
   */
  async createAfterPayment(
    sessionId: string,
    temporaryId: string,
    customerData: CustomerData
  ): Promise<Booking> {
    logger.info(`🔄 Création de réservation après paiement confirmé`, {
      sessionId,
      temporaryId,
      customerEmail: customerData.email,
    });

    try {
      // Import Prisma client for atomic transaction
      const { prisma } = await import('@/lib/prisma');

      // 🔒 CHECK IDEMPOTENCE: Vérifier si ce PaymentIntent a déjà été traité
      const existingBooking = await this.checkIdempotence(sessionId);
      if (existingBooking) {
        return existingBooking;
      }

      // 1. Récupérer le QuoteRequest via temporaryId (AVANT transaction pour fail-fast)
      const quoteRequest = await this.getQuoteRequest(temporaryId);

      // 2. 🔒 SÉCURITÉ: Valider le prix sécurisé (AVANT transaction pour fail-fast)
      const priceResult = await this.validatePrice(quoteRequest);

      // 3. Ajouter l'assurance si demandée
      const finalPrice = await this.addInsuranceIfNeeded(
        quoteRequest.getQuoteData(),
        priceResult.price
      );

      if (finalPrice <= 0) {
        throw new Error(`Montant invalide: ${finalPrice} EUR`);
      }

      // 4. Déterminer le type de réservation
      const itemType = bookingTypeMapper.mapServiceTypeToItemType(
        quoteRequest.getType()
      );
      logger.info(`📦 Étape 3: Type item déterminé: ${itemType}`);

      // 🔒 TRANSACTION ATOMIQUE: Toutes les opérations DB dans une seule transaction
      const result = await this.createAtomicTransaction(
        prisma,
        customerData,
        quoteRequest,
        itemType,
        finalPrice,
        sessionId
      );

      logger.info(`🎉 Transaction atomique terminée avec succès`, {
        customerId: result.customerDb.id,
        bookingId: result.bookingDb.id,
        transactionId: result.transactionDb.id,
        quoteRequestId: result.quoteRequestDb.id,
      });

      // 5. Reconstituer l'entité Booking pour le retour (compatibilité)
      const savedBooking = await this.bookingRepository.findById(
        result.bookingDb.id
      );
      if (!savedBooking) {
        throw new Error(
          `Impossible de récupérer le Booking créé: ${result.bookingDb.id}`
        );
      }

      // 6. Stocker les coordonnées (opération non-critique, hors transaction)
      try {
        await bookingCoordinatesService.storeCoordinates(
          savedBooking,
          quoteRequest.getQuoteData()
        );
      } catch (coordError) {
        logger.warn(`⚠️ Échec stockage coordonnées (non bloquant)`, {
          bookingId: savedBooking.getId(),
          error:
            coordError instanceof Error
              ? coordError.message
              : 'Erreur inconnue',
        });
      }

      logger.info(
        `🎉 Réservation créée et confirmée avec succès: ${savedBooking.getId()}`
      );
      return savedBooking;
    } catch (error) {
      logger.error(
        '❌ Erreur lors de la création de réservation après paiement:',
        error
      );
      throw error;
    }
  }

  /**
   * Vérifie l'idempotence via PaymentIntent
   * 
   * @param sessionId - PaymentIntent ID
   * @returns Le booking existant si trouvé, null sinon
   */
  private async checkIdempotence(
    sessionId: string
  ): Promise<Booking | null> {
    logger.info(
      `🔒 Étape 0: Vérification idempotence (PaymentIntent: ${sessionId})`
    );
    const { prisma } = await import('@/lib/prisma');
    const existingTransaction = await prisma.transaction.findFirst({
      where: { paymentIntentId: sessionId },
    });

    if (existingTransaction) {
      logger.warn(
        `⚠️ Transaction déjà traitée pour PaymentIntent ${sessionId} - Skip (idempotence)`,
        {
          existingTransactionId: existingTransaction.id,
          existingBookingId: existingTransaction.bookingId,
        }
      );

      // Récupérer le Booking existant via repository
      const existingBooking = await this.bookingRepository.findById(
        existingTransaction.bookingId
      );
      if (!existingBooking) {
        throw new Error(
          `Booking ${existingTransaction.bookingId} non trouvé (incohérence DB)`
        );
      }
      return existingBooking;
    }

    return null;
  }

  /**
   * Récupère le QuoteRequest via temporaryId
   * 
   * @param temporaryId - ID temporaire du QuoteRequest
   * @returns Le QuoteRequest trouvé
   * @throws Error si non trouvé
   */
  private async getQuoteRequest(temporaryId: string): Promise<QuoteRequest> {
    logger.info(
      `📋 Étape 1: Récupération QuoteRequest (temporaryId: ${temporaryId})`
    );
    const quoteRequest =
      await this.quoteRequestRepository.findByTemporaryId(temporaryId);
    if (!quoteRequest) {
      throw new Error(
        `QuoteRequest non trouvé pour temporaryId: ${temporaryId}`
      );
    }
    logger.info(
      `✅ QuoteRequest trouvé: ${quoteRequest.getId()}, type: ${quoteRequest.getType()}`
    );
    return quoteRequest;
  }

  /**
   * Valide le prix sécurisé avec signature HMAC
   * 
   * @param quoteRequest - Le QuoteRequest
   * @returns Le résultat de validation avec le prix validé
   */
  private async validatePrice(quoteRequest: QuoteRequest): Promise<{
    price: number;
    source: string;
  }> {
    logger.info(
      '🔒 Validation du prix sécurisé avant création réservation (après paiement)'
    );

    const quoteData = quoteRequest.getQuoteData();
    const result = await this.priceValidationService.validateSecuredPrice(
      quoteData,
      quoteRequest.getType(),
      (qd, st) =>
        this.priceRecalculationService.recalculate(qd, st)
    );

    logger.info(`💰 Prix validé: ${result.price}€ (source: ${result.source})`);
    return {
      price: result.price,
      source: result.source,
    };
  }

  /**
   * Ajoute les options d'assurance si demandées
   * 
   * ✅ SYSTÈME MODERNE : Support des options
   * - fragileProtection : +29€ (Protection objets fragiles)
   * - insurancePremium : Prime d'assurance valeur déclarée (calculée côté frontend)
   * 
   * @param quoteData - Les données du devis
   * @param basePrice - Le prix de base (scénario sélectionné)
   * @returns Le prix final avec options d'assurance si applicable
   */
  private async addInsuranceIfNeeded(
    quoteData: any,
    basePrice: number
  ): Promise<number> {
    // ✅ PRIORITÉ 1: Utiliser le prix total avec options si déjà calculé (frontend)
    if (quoteData.totalPrice && quoteData.totalPrice > basePrice) {
      const optionsAmount = quoteData.totalPrice - basePrice;
      logger.info(
        `✅ Prix total avec options utilisé: ${quoteData.totalPrice}€ (base: ${basePrice}€, options: +${optionsAmount}€)`
      );
      return quoteData.totalPrice;
    }

    // ✅ PRIORITÉ 2: Calculer les options modernes (fragileProtection + insurancePremium)
    let optionsTotal = 0;

    // Protection objets fragiles (+29€)
    if (quoteData.fragileProtection || quoteData.fragileProtectionAmount > 0) {
      const fragileAmount = quoteData.fragileProtectionAmount || 29;
      optionsTotal += fragileAmount;
      logger.info(`✅ Protection objets fragiles ajoutée: +${fragileAmount}€`);
    }

    // Assurance valeur déclarée (prime calculée côté frontend)
    if (quoteData.insurancePremium && quoteData.insurancePremium > 0) {
      optionsTotal += quoteData.insurancePremium;
      logger.info(`✅ Assurance valeur déclarée ajoutée: +${quoteData.insurancePremium}€`);
    }

    if (optionsTotal > 0) {
      const finalPrice = basePrice + optionsTotal;
      logger.info(
        `✅ Options d'assurance ajoutées: +${optionsTotal}€ (prix final: ${finalPrice}€)`
      );
      return finalPrice;
    }

    logger.info(`💰 Étape 2: Montant final calculé: ${basePrice} EUR (aucune option d'assurance)`);
    return basePrice;
  }

  /**
   * Crée la transaction atomique (Customer → Booking → Transaction → QuoteRequest)
   * 
   * @param prisma - Client Prisma
   * @param customerData - Données client
   * @param quoteRequest - Le QuoteRequest
   * @param itemType - Le type d'item
   * @param finalPrice - Le prix final
   * @param sessionId - PaymentIntent ID
   * @returns Le résultat de la transaction
   */
  private async createAtomicTransaction(
    prisma: any,
    customerData: CustomerData,
    quoteRequest: QuoteRequest,
    itemType: any,
    finalPrice: number,
    sessionId: string
  ) {
    logger.info(
      `🔒 Étape 4: Début transaction atomique (Customer → Booking → Transaction)`
    );

    return await prisma.$transaction(
      async (tx: any) => {
        console.log(
          '═══════════════════════════════════════════════════════════════'
        );
        console.log(
          `📋 [TRANSACTION ATOMIQUE] Création Customer → Booking → Transaction`
        );
        console.log(
          '═══════════════════════════════════════════════════════════════'
        );

        // ÉTAPE 1: UPSERT Customer (gestion doublons email)
        logger.info(
          `📋 [ATOMIC] Étape 1/4: Upsert Customer (email: ${customerData.email})`
        );
        console.log(
          '📋 [TRACE UTILISATEUR] customerData:',
          JSON.stringify(customerData, null, 2)
        );

        const customerDb = await tx.customer.upsert({
          where: { email: customerData.email },
          create: {
            id: crypto.randomUUID(),
            email: customerData.email,
            firstName: customerData.firstName,
            lastName: customerData.lastName,
            phone: customerData.phone || '',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          update: {
            // Si customer existe, juste mettre à jour le timestamp
            updatedAt: new Date(),
          },
        });

        logger.info(`✅ [ATOMIC] Customer upsert: ${customerDb.id}`, {
          email: customerDb.email,
          phone: customerDb.phone,
          existed: customerDb.createdAt < customerDb.updatedAt,
        });

        // ÉTAPE 2: Créer Booking
        logger.info(`🏗️ [ATOMIC] Étape 2/4: Création Booking (type: ${itemType})`);

        // Mapper ItemType vers BookingType pour Prisma
        const bookingType = bookingTypeMapper.mapItemTypeToBookingType(itemType);
        logger.info(`🔄 [ATOMIC] Type mappé: ${itemType} → ${bookingType}`);

        const quoteData = quoteRequest.getQuoteData();
        const bookingDb = await tx.booking.create({
          data: {
            id: crypto.randomUUID(),
            type: bookingType,
            status: BookingStatus.PAYMENT_COMPLETED, // Statut direct (paiement déjà validé)
            customerId: customerDb.id,
            quoteRequestId: quoteRequest.getId()!,
            totalAmount: finalPrice,
            // ✅ CORRECTION: Copier les adresses depuis quoteData pour l'attribution professionnelle (camelCase Prisma)
            pickupAddress: quoteData.pickupAddress || quoteData.locationAddress || null,
            locationAddress: quoteData.locationAddress || quoteData.pickupAddress || null,
            deliveryAddress: quoteData.deliveryAddress || null,
            scheduledDate: quoteData.scheduledDate ? new Date(quoteData.scheduledDate) : null,
            additionalInfo: {
              quoteData: quoteRequest.getQuoteData(), // Stocker quoteData dans additionalInfo (JSON)
              createdAt: new Date().toISOString(),
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        logger.info(
          `✅ [ATOMIC] Booking créé: ${bookingDb.id}, status: ${bookingDb.status}`
        );

        // ÉTAPE 3: Créer Transaction avec PaymentIntentId (clé idempotence)
        logger.info(
          `💳 [ATOMIC] Étape 3/4: Création Transaction (PaymentIntent: ${sessionId})`
        );

        const transactionDb = await tx.transaction.create({
          data: {
            id: crypto.randomUUID(),
            bookingId: bookingDb.id,
            amount: finalPrice,
            currency: 'EUR',
            status: 'COMPLETED',
            paymentMethod: 'card',
            paymentIntentId: sessionId, // 🔒 Clé pour idempotence
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        logger.info(
          `✅ [ATOMIC] Transaction créée: ${transactionDb.id}, PaymentIntent: ${transactionDb.paymentIntentId}`
        );

        // ÉTAPE 4: Mettre à jour statut QuoteRequest
        logger.info(
          `📝 [ATOMIC] Étape 4/4: Mise à jour QuoteRequest → CONFIRMED`
        );

        const quoteRequestDb = await tx.quoteRequest.update({
          where: { id: quoteRequest.getId()! },
          data: {
            status: QuoteRequestStatus.CONFIRMED,
            updatedAt: new Date(),
          },
        });

        logger.info(
          `✅ [ATOMIC] QuoteRequest mis à jour: ${quoteRequestDb.id}, status: ${quoteRequestDb.status}`
        );

        console.log(
          '═══════════════════════════════════════════════════════════════'
        );
        console.log(`✅ [TRANSACTION ATOMIQUE] Terminée avec succès`);
        console.log(
          '═══════════════════════════════════════════════════════════════'
        );

        return {
          customerDb,
          bookingDb,
          transactionDb,
          quoteRequestDb,
        };
      },
      {
        timeout: 10000, // 10 secondes timeout
        maxWait: 5000, // 5 secondes max d'attente pour acquérir le lock
      }
    );
  }
}

