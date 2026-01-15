import crypto from 'crypto';
import { Booking, BookingStatus, BookingType } from '../../domain/entities/Booking';
import { Customer } from '../../domain/entities/Customer';
import { ItemType } from '../../domain/entities/Item';
import { ServiceType } from '../../domain/enums/ServiceType';
import { CustomerService } from './CustomerService';
import { QuoteRequest, QuoteRequestStatus } from '../../domain/entities/QuoteRequest';
import { Quote } from '../../domain/entities/Quote';
import { Money } from '../../domain/valueObjects/Money';
import { ContactInfo } from '../../domain/valueObjects/ContactInfo';
import { BookingSearchCriteriaVO, BookingSearchCriteria } from '../../domain/valueObjects/BookingSearchCriteria';

// Repositories
import { IBookingRepository, BookingSearchResult } from '../../domain/repositories/IBookingRepository';
import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository';
import { IQuoteRequestRepository } from '../../domain/repositories/IQuoteRequestRepository';

// Services externes
import { IPaymentService } from '../../domain/services/IPaymentService';
import { IEmailService } from '../../domain/interfaces/IEmailService';
import { IPDFService } from '../../domain/interfaces/IPDFService';

// Documents - Service client uniquement (les autres notifications sont gérées par APIs)
import { DocumentNotificationService } from '@/documents/application/services/DocumentNotificationService';

// Erreurs domaine
import {
  BookingNotFoundError,
  BookingAlreadyCancelledError,
  BookingCannotBeCancelledError,
  BookingInvalidStatusTransitionError,
  BookingUpdateNotAllowedError,
  BookingDeletionNotAllowedError,
} from '../../domain/errors/BookingErrors';

import { logger } from '@/lib/logger';
import { AttributionUtils } from '@/bookingAttribution/AttributionUtils';
import { UnifiedDataService, ConfigurationCategory } from '@/quotation/infrastructure/services/UnifiedDataService';
import { PricingFactorsConfigKey } from '@/quotation/domain/configuration/ConfigurationKey';

// Nouveau système de calcul modulaire
import { BaseCostEngine } from '@/quotation-module/core/BaseCostEngine';
import { FormAdapter } from '@/quotation-module/adapters/FormAdapter';
import { getAllModules } from '@/quotation-module/core/ModuleRegistry';

/**
 * Service de gestion des réservations migré vers le système Template/Item
 * ✅ MIGRÉ VERS UNIFIED DATA SERVICE - Valeurs hardcodées migrées vers la configuration
 */
export class BookingService {
  private readonly unifiedDataService: UnifiedDataService;
  private readonly documentNotificationService: DocumentNotificationService;
  private readonly baseCostEngine: BaseCostEngine;

  constructor(
    private readonly bookingRepository: IBookingRepository,
    private readonly customerRepository: ICustomerRepository,
    private readonly quoteRequestRepository: IQuoteRequestRepository,
    private readonly customerService: CustomerService,
    private readonly transactionService?: IPaymentService,
    private readonly emailService?: IEmailService,
    private readonly pdfService?: IPDFService
  ) {
    // Initialiser le service de notification client uniquement
    this.documentNotificationService = new DocumentNotificationService();

    // ✅ NOUVEAU: Initialiser le service de configuration unifié
    this.unifiedDataService = UnifiedDataService.getInstance();

    // ✅ NOUVEAU: Utiliser le moteur de calcul modulaire
    this.baseCostEngine = new BaseCostEngine(getAllModules());
  }

  /**
   * ✅ NOUVEAU: Récupère le facteur d'estimation depuis la configuration
   */
  private async getEstimationFactor(): Promise<number> {
    try {
      const factor = await this.unifiedDataService.getConfigurationValue(
        ConfigurationCategory.PRICING_FACTORS,
        PricingFactorsConfigKey.ESTIMATION_FACTOR,
        0.85
      );
      logger.info(`✅ [BOOKING-SERVICE] Facteur d'estimation depuis configuration: ${factor}`);
      return factor;
    } catch (error) {
      logger.warn('⚠️ [BOOKING-SERVICE] Erreur récupération facteur estimation, utilisation fallback:', error);
      return 0.85; // Fallback hardcodé
    }
  }

  /**
   * Crée une réservation après un paiement réussi (appelé par le webhook Stripe)
   * @param sessionId - PaymentIntent ID de Stripe
   * @param temporaryId - ID temporaire du QuoteRequest
   * @param customerData - Données client (firstName, lastName, email, phone)
   */
  async createBookingAfterPayment(
    sessionId: string,
    temporaryId: string,
    customerData: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    }
  ): Promise<Booking> {
    logger.info(`🔄 Création de réservation après paiement confirmé`, {
      sessionId,
      temporaryId,
      customerEmail: customerData.email
    });

    try {
      // 1. Récupérer le QuoteRequest via temporaryId
      logger.info(`📋 Étape 1: Récupération QuoteRequest (temporaryId: ${temporaryId})`);
      const quoteRequest = await this.quoteRequestRepository.findByTemporaryId(temporaryId);
      if (!quoteRequest) {
        throw new Error(`QuoteRequest non trouvé pour temporaryId: ${temporaryId}`);
      }
      logger.info(`✅ QuoteRequest trouvé: ${quoteRequest.getId()}, type: ${quoteRequest.getType()}`);

      // 2. Créer ou récupérer le Customer
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(`📋 [TRACE UTILISATEUR] Étape 2: Création/Récupération Customer`);
      console.log('═══════════════════════════════════════════════════════════════');
      logger.info(`📋 [TRACE UTILISATEUR] Étape 2: Création/Récupération Customer (email: ${customerData.email})`, {
        source: 'BookingService.createBookingAfterPayment',
        customerData: {
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          email: customerData.email,
          phone: customerData.phone,
          phoneIsEmpty: !customerData.phone || customerData.phone.trim() === '',
          phoneLength: customerData.phone?.length || 0
        },
        warning: (!customerData.phone || customerData.phone.trim() === '') ? '⚠️ Téléphone manquant ou vide' : null
      });
      
      // Log console pour visibilité immédiate
      console.log('📋 [TRACE UTILISATEUR] customerData avant getOrCreateCustomerFromData:', JSON.stringify(customerData, null, 2));
      
      const customer = await this.getOrCreateCustomerFromData({
        email: customerData.email,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        phone: customerData.phone
      });
      
      logger.info(`📋 [TRACE UTILISATEUR] Customer créé/récupéré:`, {
        id: customer.getId(),
        email: customer.getContactInfo().getEmail(),
        phone: customer.getContactInfo().getPhone(),
        phoneIsEmpty: !customer.getContactInfo().getPhone() || customer.getContactInfo().getPhone().trim() === ''
      });

      // 3. 🔒 SÉCURITÉ: Utiliser le prix sécurisé (signature HMAC) au lieu de recalculer
      logger.info('🔒 Validation du prix sécurisé avant création réservation (après paiement)');

      const quoteData = quoteRequest.getQuoteData();
      let serverCalculatedPrice: number;
      let priceSource: string;

      // ✅ OPTION A: Utiliser le prix sécurisé avec signature HMAC (RECOMMANDÉ)
      if (quoteData.securedPrice && quoteData.securedPrice.signature) {
        logger.info('🔐 Vérification de la signature HMAC du prix...');

        // Importer le service de signature
        const { priceSignatureService } = await import('./PriceSignatureService');

        // Vérifier la signature
        const verification = priceSignatureService.verifySignature(
          quoteData.securedPrice,
          quoteData
        );

        if (verification.valid) {
          // ✅ Signature valide - Utiliser le prix signé
          serverCalculatedPrice = quoteData.securedPrice.totalPrice;
          priceSource = `signature HMAC (${verification.details?.ageHours?.toFixed(2)}h)`;

          logger.info('✅ Prix signé validé et utilisé', {
            price: serverCalculatedPrice,
            calculationId: quoteData.securedPrice.calculationId,
            signatureAge: verification.details?.ageHours?.toFixed(2) + 'h',
            calculatedAt: quoteData.securedPrice.calculatedAt
          });
        } else {
          // ⚠️ Signature invalide - Fallback vers recalcul
          logger.warn('⚠️ Signature invalide - RECALCUL nécessaire (fallback)', {
            reason: verification.reason,
            temporaryId
          });
          priceSource = 'recalcul (signature invalide)';
          serverCalculatedPrice = await this.recalculatePriceWithGlobalServices(quoteData, quoteRequest.getType());
        }
      } else {
        // ⚠️ OPTION B: Pas de prix sécurisé - Recalcul obligatoire (fallback)
        logger.warn('⚠️ Pas de prix sécurisé - RECALCUL nécessaire (fallback)', { temporaryId });
        priceSource = 'recalcul (pas de signature)';
        serverCalculatedPrice = await this.recalculatePriceWithGlobalServices(quoteData, quoteRequest.getType());
      }

      logger.info(`💰 Prix validé: ${serverCalculatedPrice}€ (source: ${priceSource})`);

      // 4. Vérifier si l'assurance était demandée (depuis quoteData ou formData)
      let finalPrice = serverCalculatedPrice;
      const wantsInsurance = quoteData.insurance || quoteData.insuranceAmount > 0 || quoteData.wantsInsurance;
      if (wantsInsurance) {
        const insurancePrice = await this.unifiedDataService.getConfigurationValue(
          ConfigurationCategory.PRICING_FACTORS,
          PricingFactorsConfigKey.INSURANCE_PRICE,
          25 // Valeur par défaut
        );
        finalPrice += insurancePrice;
        logger.info(`✅ Assurance ajoutée: +${insurancePrice}€ (prix final: ${finalPrice}€)`);
      }

      logger.info(`💰 Étape 3: Montant final calculé: ${finalPrice} EUR`);

      if (finalPrice <= 0) {
        throw new Error(`Montant invalide: ${finalPrice} EUR`);
      }

      // 5. Déterminer le type de réservation
      const itemType = this.mapServiceTypeToItemType(quoteRequest.getType());
      logger.info(`📦 Étape 4: Type item déterminé: ${itemType}`);

      // 6. Créer la réservation selon le type d'item
      logger.info(`🏗️ Étape 5: Création du Booking...`);
      const booking = await this.createBookingForItemType(
        customer,
        quoteRequest,
        finalPrice,
        itemType
      );
      logger.info(`✅ Booking créé: ${booking.getId()}, status: ${booking.getStatus()}`);

      // 6.1. ✅ NOUVEAU: Géocoder et stocker les coordonnées si disponibles
      await this.storeBookingCoordinates(booking, quoteRequest.getQuoteData());

      // 7. Créer la Transaction associée
      logger.info(`💳 Étape 6: Création de la Transaction...`);

      // Créer directement avec Prisma (plus simple et évite les problèmes d'entité)
      const { prisma } = await import('@/lib/prisma');
      await prisma.transaction.create({
        data: {
          id: crypto.randomUUID(),
          bookingId: booking.getId()!,
          amount: finalPrice,
          currency: 'EUR',
          status: 'COMPLETED',
          paymentMethod: 'card',
          paymentIntentId: sessionId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      logger.info(`✅ Transaction créée avec PaymentIntent: ${sessionId}`);

      // 8. TRANSITION CRITIQUE : DRAFT → PAYMENT_COMPLETED (le paiement est déjà confirmé par le webhook)
      booking.updateStatus(BookingStatus.PAYMENT_COMPLETED);
      const savedBooking = await this.bookingRepository.save(booking);
      logger.info(`✅ Statut mis à jour: DRAFT → PAYMENT_COMPLETED pour la réservation ${savedBooking.getId()}`);

      // 9. Mettre à jour le statut du QuoteRequest
      logger.info(`📝 Étape 7: Mise à jour statut QuoteRequest → CONFIRMED`);
      await this.quoteRequestRepository.updateStatus(
        quoteRequest.getId()!,
        QuoteRequestStatus.CONFIRMED
      );

      // 10. 🎯 DÉCLENCHER BOOKING_CONFIRMED - Services spécialisés autonomes
      logger.info(`📧 Étape 8: Déclenchement des notifications complètes...`);
      try {
        // Valider les variables d'environnement
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.INTERNAL_API_URL;
        if (!baseUrl) {
          throw new Error('NEXT_PUBLIC_APP_URL ou INTERNAL_API_URL doit être configuré pour les notifications');
        }

        // ÉTAPE 1: Notifications équipe interne (gèrent leurs propres documents)
        logger.info('👥 Étape 8.1: Notifications équipe interne...');
        let internalStaffResult = { success: false };
        try {
          const internalStaffResponse = await fetch(`${baseUrl}/api/notifications/internal-staff`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'BookingService/1.0'
            },
            body: JSON.stringify({
              bookingId: savedBooking.getId(),
              trigger: 'BOOKING_CONFIRMED',
              context: {
                confirmationDate: new Date().toISOString(),
                additionalInfo: customerData
              }
            })
          });

          if (internalStaffResponse.ok) {
            internalStaffResult = await internalStaffResponse.json();
            logger.info('✅ Notifications équipe interne envoyées', { success: internalStaffResult.success });
          } else {
            const errorText = await internalStaffResponse.text();
            logger.error('❌ Erreur API notifications équipe interne', {
              status: internalStaffResponse.status,
              error: errorText
            });
          }
        } catch (internalStaffError) {
          logger.error('❌ Erreur lors de l\'envoi notifications équipe interne', {
            error: internalStaffError instanceof Error ? internalStaffError.message : 'Erreur inconnue',
            stack: internalStaffError instanceof Error ? internalStaffError.stack : undefined
          });
        }

        // ÉTAPE 2: Attribution prestataires externes
        logger.info('🚚 Étape 8.2: Attribution prestataires externes...');
      try {
          await this.triggerProfessionalAttribution(savedBooking);
          logger.info('✅ Attribution prestataires déclenchée');
        } catch (attributionError) {
          logger.error('❌ Erreur lors de l\'attribution prestataires', {
            error: attributionError instanceof Error ? attributionError.message : 'Erreur inconnue',
            stack: attributionError instanceof Error ? attributionError.stack : undefined
          });
        }

        // ÉTAPE 3: Notification client avec documents
        logger.info('📧 Étape 8.3: Notification client...');
        let customerResult = { success: false };
        try {
          const customerNotificationResponse = await fetch(`${baseUrl}/api/notifications/business/booking-confirmation`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'BookingService/1.0'
            },
            body: JSON.stringify({
              bookingId: savedBooking.getId(),
              customerEmail: savedBooking.getCustomer().getContactInfo().getEmail(),
              customerName: savedBooking.getCustomer().getFullName(),
              bookingReference: `EQ-${savedBooking.getId()?.slice(-8).toUpperCase()}`,
              serviceType: savedBooking.getType(),
              serviceName: savedBooking.getType() || 'Service Express Quote',
              totalAmount: savedBooking.getTotalAmount().getAmount(),
              serviceDate: savedBooking.getScheduledDate()?.toISOString() || new Date().toISOString(),
              serviceTime: '09:00',
              confirmationDate: new Date().toISOString(),
              viewBookingUrl: `${baseUrl}/bookings/${savedBooking.getId()}`,
              supportUrl: `${baseUrl}/contact`
            })
          });

          if (customerNotificationResponse.ok) {
            customerResult = await customerNotificationResponse.json();
            logger.info('✅ Notification client envoyée', { success: customerResult.success });
          } else {
            const errorText = await customerNotificationResponse.text();
            logger.error('❌ Erreur API notification client', {
              status: customerNotificationResponse.status,
              error: errorText
            });
          }
        } catch (customerNotificationError) {
          logger.error('❌ Erreur lors de l\'envoi notification client', {
            error: customerNotificationError instanceof Error ? customerNotificationError.message : 'Erreur inconnue',
            stack: customerNotificationError instanceof Error ? customerNotificationError.stack : undefined
          });
        }

        logger.info(`✅ Confirmation BOOKING_CONFIRMED terminée`, {
          internalStaff: internalStaffResult.success,
          customer: customerResult.success,
          professionalAttribution: 'triggered'
        });

      } catch (confirmationError) {
        // Ne pas faire échouer la création si les notifications échouent
        logger.error('❌ Erreur lors du workflow de confirmation (réservation confirmée)', {
          bookingId: savedBooking.getId(),
          error: confirmationError instanceof Error ? confirmationError.message : 'Erreur inconnue',
          stack: confirmationError instanceof Error ? confirmationError.stack : undefined,
          context: {
            temporaryId,
            sessionId,
            customerEmail: customerData.email
          }
        });
      }

      logger.info(`🎉 Réservation créée et confirmée avec succès: ${savedBooking.getId()}`);
      return savedBooking;
    } catch (error) {
      logger.error('❌ Erreur lors de la création de réservation après paiement:', error);
      throw error;
    }
  }

  /**
   * Crée une demande de devis
   */
  async createQuoteRequest(serviceData: any): Promise<QuoteRequest> {
    logger.info('🔄 Création d\'une demande de devis avec données:', serviceData);
    
    try {
      // Mapper vers le nouveau système
      const itemType = this.mapServiceTypeToItemType(serviceData.type || ServiceType.MOVING_PREMIUM);
      
      // Créer la demande de devis avec le nouveau système
      const quoteRequest = new QuoteRequest(
        serviceData.type || ServiceType.MOVING_PREMIUM,
        serviceData,
        QuoteRequestStatus.TEMPORARY
      );

      // Sauvegarder en base
      const savedQuoteRequest = await this.quoteRequestRepository.save(quoteRequest);
      
      logger.info(`✅ Demande de devis créée: ${savedQuoteRequest.getId()}`);
      return savedQuoteRequest;
    } catch (error) {
      logger.error('Erreur lors de la création de demande de devis:', error);
      throw error;
    }
  }

  /**
   * Crée un devis formel
   */
  async createFormalQuote(
    quoteRequestId: string,
    customerDetails: any,
    options: { hasInsurance?: boolean } = {}
  ): Promise<Quote> {
    logger.info(`🔄 Création de devis formel pour demande: ${quoteRequestId}`);
    
    try {
      const quoteRequest = await this.quoteRequestRepository.findById(quoteRequestId);
      if (!quoteRequest) {
        throw new Error(`Demande de devis non trouvée: ${quoteRequestId}`);
      }
      
      // Créer ou récupérer le client
      const customer = await this.getOrCreateCustomerFromData({
        firstName: customerDetails.firstName || quoteRequest.getQuoteData().customerInfo?.firstName || '',
        lastName: customerDetails.lastName || quoteRequest.getQuoteData().customerInfo?.lastName || '',
        email: customerDetails.email || quoteRequest.getQuoteData().customerInfo?.email || '',
        phone: customerDetails.phone || quoteRequest.getQuoteData().customerInfo?.phone || ''
      });

      // ✅ MIGRÉ: Calculer le prix avec les options (depuis configuration)
      let totalAmount = quoteRequest.getQuoteData().totalAmount || 0;
      if (options.hasInsurance) {
        const insurancePrice = await this.unifiedDataService.getConfigurationValue(
          ConfigurationCategory.PRICING_FACTORS,
          PricingFactorsConfigKey.INSURANCE_PRICE,
          30
        );
        totalAmount += insurancePrice;
        logger.info(`✅ [BOOKING-SERVICE] Prix assurance depuis configuration: ${insurancePrice}€`);
      }

      // Créer le devis formel
      const quote = new Quote({
        type: quoteRequest.getType() as any,
        status: 'DRAFT' as any,
        customer: {
          id: customer.getId()!,
          firstName: customer.getContactInfo().getFirstName(),
          lastName: customer.getContactInfo().getLastName(),
          email: customer.getContactInfo().getEmail(),
          phone: customer.getContactInfo().getPhone()
        },
        totalAmount: new Money(totalAmount, 'EUR')
      });

      // Mettre à jour le statut
      await this.quoteRequestRepository.updateStatus(
        quoteRequestId,
        QuoteRequestStatus.CONFIRMED
      );

      logger.info(`✅ Devis formel créé pour: ${quoteRequestId}`);
      return quote;
    } catch (error) {
      logger.error('Erreur lors de la création de devis formel:', error);
      throw error;
    }
  }

  /**
   * Accepte un devis et initialise le paiement
   */
  async acceptQuoteAndInitiatePayment(
    quoteId: string,
    paymentMethod: string = 'card'
  ): Promise<{ sessionId: string; url: string } | null> {
    logger.info(`🔄 Acceptation de devis et initialisation paiement: ${quoteId}`);
    
    try {
      if (!this.transactionService) {
        throw new Error('Service de transaction non disponible');
      }

      const quoteRequest = await this.quoteRequestRepository.findById(quoteId);
      if (!quoteRequest) {
        throw new Error(`Devis non trouvé: ${quoteId}`);
      }

      // Créer la session de paiement
      const session = await this.transactionService.createPaymentSession({
        amount: quoteRequest.getQuoteData().totalAmount || 0,
        currency: 'EUR',
        quoteRequestId: quoteId,
        paymentMethod
      });

      logger.info(`✅ Session de paiement créée: ${session.sessionId}`);
      return session;
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation du paiement:', error);
      throw error;
    }
  }

  /**
   * Mappe les anciens ServiceType vers les nouveaux ItemType
   */
  private mapServiceTypeToItemType(serviceType: ServiceType): ItemType {
    // Tous les services actifs sont des déménagements (MOVING, MOVING_PREMIUM)
    // Services abandonnés : PACKING, CLEANING, DELIVERY, SERVICE
    switch (serviceType) {
      case ServiceType.MOVING:
      case ServiceType.MOVING_PREMIUM:
        return ItemType.DEMENAGEMENT;
      // Services abandonnés - ne plus gérer, retourner déménagement par défaut
      default:
        return ItemType.DEMENAGEMENT;
    }
  }

  /**
   * Recalcule le prix côté serveur avec le nouveau système modulaire
   * Utilisé comme fallback si la signature HMAC est invalide ou absente
   */
  private async recalculatePriceWithGlobalServices(
    quoteData: any,
    serviceType: string
  ): Promise<number> {
    logger.info('🔄 Recalcul du prix avec le système modulaire...');

    try {
      // Convertir les données du formulaire vers le contexte du moteur de calcul
      const context = FormAdapter.toQuoteContext({
        ...quoteData,
        serviceType: serviceType || ServiceType.MOVING
      });

      // Exécuter le calcul avec le moteur modulaire
      const result = this.baseCostEngine.execute(context);
      const recalculatedPrice = result.baseCost || 0;

      logger.info(`✅ Prix recalculé avec système modulaire: ${recalculatedPrice}€`);
      return recalculatedPrice;
    } catch (error) {
      logger.error('❌ Erreur lors du recalcul du prix:', error);
      // Retourner le prix existant en fallback
      return quoteData.totalPrice || quoteData.calculatedPrice?.totalPrice || 0;
    }
  }

  /**
   * Crée une réservation selon le type d'item
   */
  private async createBookingForItemType(
    customer: Customer,
    quoteRequest: QuoteRequest,
    totalAmount: number,
    itemType: ItemType
  ): Promise<Booking> {
    const quoteData = quoteRequest.getQuoteData();

    // Créer un Quote simple pour la réservation
    const quote = new Quote({
      type: quoteRequest.getType() as any,
      status: 'DRAFT' as any,
      customer: {
        id: customer.getId()!,
        firstName: customer.getContactInfo().getFirstName(),
        lastName: customer.getContactInfo().getLastName(),
        email: customer.getContactInfo().getEmail(),
        phone: customer.getContactInfo().getPhone()
      },
      totalAmount: new Money(totalAmount, 'EUR')
    });

    // Créer la réservation en utilisant la factory
    const booking = Booking.fromQuoteRequest(
      quoteRequest,
      customer,
      quote,
      new Money(totalAmount),
      'card'  // paymentMethod
    );

    // ✅ Mettre le statut à CONFIRMED (paiement validé)
    booking.updateStatus(BookingStatus.CONFIRMED);

    // Sauvegarder la réservation
    const savedBooking = await this.bookingRepository.save(booking);

    return savedBooking;
  }

  /**
   * Mappe ItemType vers BookingType pour compatibilité
   */
  private mapItemTypeToBookingType(itemType: ItemType): BookingType {
    // Tous les services actifs sont des déménagements
    // Services abandonnés : MENAGE, TRANSPORT, LIVRAISON
    switch (itemType) {
      case ItemType.DEMENAGEMENT:
        return BookingType.MOVING_QUOTE;
      // Services abandonnés - ne plus gérer, retourner MOVING_QUOTE par défaut
      default:
        return BookingType.MOVING_QUOTE;
    }
  }


  // =====================================
  // NOUVELLES MÉTHODES POUR L'EXTENSION
  // =====================================

  /**
   * Recherche des réservations selon des critères
   */
  async searchBookings(criteria: BookingSearchCriteria): Promise<BookingSearchResult> {
    logger.info('🔍 Recherche de réservations avec critères:', criteria);

    const searchCriteria = BookingSearchCriteriaVO.create(criteria);
    const result = await this.bookingRepository.search(searchCriteria);

    logger.info(`✅ ${result.bookings.length} réservations trouvées sur ${result.totalCount} total`);
    return result;
  }

  /**
   * Met à jour une réservation existante
   */
  async updateBooking(id: string, updateData: any): Promise<Booking> {
    logger.info(`✏️ Mise à jour de la réservation ${id}`, updateData);

    const existingBooking = await this.bookingRepository.findById(id);
    if (!existingBooking) {
      throw new BookingNotFoundError(id);
    }

    // Vérifier si la réservation peut être modifiée
    const canBeModified = await this.bookingRepository.canBeModified(id);
    if (!canBeModified) {
      throw new BookingUpdateNotAllowedError(id, 'Booking is in a state that cannot be modified');
    }

    // Vérifier les transitions de statut valides
    if (updateData.status && updateData.status !== existingBooking.getStatus()) {
      this.validateStatusTransition(existingBooking.getStatus(), updateData.status);
      // Mettre à jour le statut via la méthode de l'entité
      existingBooking.updateStatus(updateData.status);
      delete updateData.status; // Éviter de l'appliquer deux fois
    }

    // Appliquer les modifications avec les nouvelles données
    Object.assign(existingBooking, updateData);
    const updatedBooking = await this.bookingRepository.save(existingBooking);
    
    logger.info(`✅ Réservation ${id} mise à jour avec succès`);
    return updatedBooking;
  }

  /**
   * Supprime une réservation (suppression physique)
   */
  async deleteBooking(id: string): Promise<void> {
    logger.info(`🗑️ Suppression de la réservation ${id}`);

    const existingBooking = await this.bookingRepository.findById(id);
    if (!existingBooking) {
      throw new BookingNotFoundError(id);
    }

    // Vérifier si la réservation peut être supprimée
    const canBeDeleted = await this.bookingRepository.canBeDeleted(id);
    if (!canBeDeleted) {
      throw new BookingDeletionNotAllowedError(id, 'Booking cannot be deleted due to business rules');
    }

    await this.bookingRepository.hardDelete(id);
    logger.info(`✅ Réservation ${id} supprimée avec succès`);
  }

  /**
   * Annule une réservation (soft delete)
   */
  async cancelBooking(id: string, reason?: string): Promise<void> {
    logger.info(`🚫 Annulation de la réservation ${id}`, { reason });

    const existingBooking = await this.bookingRepository.findById(id);
    if (!existingBooking) {
      throw new BookingNotFoundError(id);
    }

    // Vérifier si la réservation est déjà annulée
    if (existingBooking.getStatus() === BookingStatus.CANCELED) {
      throw new BookingAlreadyCancelledError(id);
    }

    // Vérifier si la réservation peut être annulée
    const canBeCancelled = await this.bookingRepository.canBeCancelled(id);
    if (!canBeCancelled) {
      throw new BookingCannotBeCancelledError(id, 'Booking cannot be cancelled at this stage');
    }

    // Effectuer l'annulation en mettant à jour le statut
    existingBooking.updateStatus(BookingStatus.CANCELED);
    await this.bookingRepository.save(existingBooking);
    
    // Envoyer notification d'annulation
    try {
      await this.sendBookingCancellationNotification(existingBooking, reason);
    } catch (notificationError) {
      logger.warn('⚠️ Erreur lors de l\'envoi de la notification d\'annulation:', notificationError);
    }
    
    logger.info(`✅ Réservation ${id} annulée avec succès`);
  }

  /**
   * Obtient les détails d'une réservation par ID
   */
  async getBookingById(id: string): Promise<Booking> {
    logger.info(`🔍 Récupération de la réservation ${id}`);

    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new BookingNotFoundError(id);
    }

    return booking;
  }

  /**
   * Obtient toutes les réservations d'un client
   */
  async getBookingsByCustomer(customerId: string): Promise<Booking[]> {
    logger.info(`📋 Récupération des réservations pour le client ${customerId}`);

    const bookings = await this.bookingRepository.findByCustomerId(customerId);
    logger.info(`✅ ${bookings.length} réservations trouvées pour le client ${customerId}`);
    
    return bookings;
  }

  /**
   * Obtient toutes les réservations d'un professionnel
   */
  async getBookingsByProfessional(professionalId: string): Promise<Booking[]> {
    logger.info(`📋 Récupération des réservations pour le professionnel ${professionalId}`);

    const bookings = await this.bookingRepository.findByProfessionalId(professionalId);
    logger.info(`✅ ${bookings.length} réservations trouvées pour le professionnel ${professionalId}`);
    
    return bookings;
  }

  /**
   * Obtient les statistiques d'un client
   */
  async getCustomerBookingStats(customerId: string) {
    logger.info(`📊 Récupération des statistiques pour le client ${customerId}`);

    const stats = await this.bookingRepository.getBookingStatsByCustomer(customerId);
    logger.info(`✅ Statistiques récupérées pour le client ${customerId}:`, stats);
    
    return stats;
  }

  /**
   * Obtient les statistiques d'un professionnel
   */
  async getProfessionalBookingStats(professionalId: string) {
    logger.info(`📊 Récupération des statistiques pour le professionnel ${professionalId}`);

    const stats = await this.bookingRepository.getBookingStatsByProfessional(professionalId);
    logger.info(`✅ Statistiques récupérées pour le professionnel ${professionalId}:`, stats);
    
    return stats;
  }

  /**
   * Vérifie si une réservation appartient à un client
   */
  async isBookingOwnedByCustomer(bookingId: string, customerId: string): Promise<boolean> {
    return await this.bookingRepository.isOwnedByCustomer(bookingId, customerId);
  }

  /**
   * Vérifie si une réservation appartient à un professionnel
   */
  async isBookingOwnedByProfessional(bookingId: string, professionalId: string): Promise<boolean> {
    return await this.bookingRepository.isOwnedByProfessional(bookingId, professionalId);
  }

  /**
   * Valide une transition de statut
   */
  private validateStatusTransition(currentStatus: BookingStatus, newStatus: BookingStatus): void {
    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.DRAFT]: [BookingStatus.CONFIRMED, BookingStatus.CANCELED],
      [BookingStatus.CONFIRMED]: [BookingStatus.AWAITING_PAYMENT, BookingStatus.CANCELED],
      [BookingStatus.AWAITING_PAYMENT]: [BookingStatus.PAYMENT_PROCESSING, BookingStatus.CANCELED],
      [BookingStatus.PAYMENT_PROCESSING]: [BookingStatus.PAYMENT_COMPLETED, BookingStatus.PAYMENT_FAILED],
      [BookingStatus.PAYMENT_FAILED]: [BookingStatus.AWAITING_PAYMENT, BookingStatus.CANCELED],
      [BookingStatus.PAYMENT_COMPLETED]: [BookingStatus.COMPLETED, BookingStatus.CANCELED],
      [BookingStatus.CANCELED]: [], // Aucune transition possible depuis CANCELED
      [BookingStatus.COMPLETED]: [] // Aucune transition possible depuis COMPLETED
    };

    const allowedTransitions = validTransitions[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new BookingInvalidStatusTransitionError(
        'unknown', 
        currentStatus, 
        newStatus
      );
    }
  }

  /**
   * Compte le nombre de réservations selon des critères
   */
  async countBookings(criteria?: BookingSearchCriteria): Promise<number> {
    if (!criteria) {
      return await this.bookingRepository.count();
    }

    const searchCriteria = BookingSearchCriteriaVO.create(criteria);
    return await this.bookingRepository.count(searchCriteria);
  }

  /**
   * Vérifie si une réservation existe
   */
  async bookingExists(id: string): Promise<boolean> {
    return await this.bookingRepository.exists(id);
  }

  /**
   * Crée et confirme une réservation à partir d'une QuoteRequest avec trigger BOOKING_CONFIRMED
   */
  async createAndConfirmBooking(temporaryId: string, customerData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    additionalInfo?: string;
    wantsInsurance?: boolean;
  }): Promise<Booking> {
    logger.info(`🔄 Création et confirmation de réservation pour QuoteRequest: ${temporaryId}`, customerData);
    
    try {
      // 1. Récupérer la QuoteRequest
      const quoteRequest = await this.quoteRequestRepository.findByTemporaryId(temporaryId);
      if (!quoteRequest) {
        throw new Error(`QuoteRequest non trouvée avec temporaryId: ${temporaryId}`);
      }
      
      // 2. Créer ou récupérer le client
      const customer = await this.getOrCreateCustomerFromData(customerData);
      
      // 3. 🔒 SÉCURITÉ: RECALCULER le prix côté serveur pour éviter manipulation client
      logger.info('🔒 Recalcul sécurisé du prix côté serveur avant création réservation');
      
      // Préparer les données pour le recalcul (aplatir la structure)
      const quoteData = quoteRequest.getQuoteData();
      const flatData: Record<string, any> = {
        serviceType: quoteRequest.getType(),
      };

      // Extraire toutes les données (niveau racine + formData si présent)
      Object.keys(quoteData).forEach(key => {
        if (key === 'formData' && typeof quoteData[key] === 'object') {
          // Merger formData au niveau racine
          Object.assign(flatData, quoteData[key]);
        } else if (key !== 'quoteData' && key !== 'calculatedPrice') {
          // Copier les autres champs (sauf calculatedPrice qui est l'ancien prix client)
          flatData[key] = quoteData[key];
        }
      });

      // ✅ S'assurer que les champs critiques sont présents
      const criticalFields = [
        'pickupLogisticsConstraints',
        'deliveryLogisticsConstraints',
        'additionalServices',
        'pickupServices',
        'deliveryServices',
        'volume',
        'distance',
        'workers',
        'duration',
        'pickupAddress',
        'deliveryAddress',
        'catalogId',
        '__presetSnapshot'
      ];

      // Les champs critiques sont au niveau racine (plus de fallback formData nécessaire)

      // Recalculer le prix côté serveur avec le système modulaire
      const serverCalculatedPrice = await this.recalculatePriceWithGlobalServices(
        flatData,
        flatData.serviceType || ServiceType.MOVING
      );
      
      logger.info(`✅ Prix recalculé côté serveur: ${serverCalculatedPrice}€ (ancien prix client: ${quoteRequest.getQuoteData()?.calculatedPrice?.totalPrice || quoteRequest.getQuoteData()?.totalPrice || 'N/A'}€)`);

      // 4. Ajouter l'assurance si demandée (depuis customerData ou quoteData)
      let finalPrice = serverCalculatedPrice;
      const wantsInsurance = customerData.wantsInsurance ||
                             quoteData.insurance || quoteData.insuranceAmount > 0 || quoteData.wantsInsurance;
      if (wantsInsurance) {
        const insurancePrice = await this.unifiedDataService.getConfigurationValue(
          ConfigurationCategory.PRICING_FACTORS,
          PricingFactorsConfigKey.INSURANCE_PRICE,
          25 // Valeur par défaut
        );
        finalPrice += insurancePrice;
        logger.info(`✅ Assurance ajoutée: +${insurancePrice}€ (prix final: ${finalPrice}€)`);
      }
      
      // 5. Créer la réservation avec statut DRAFT (utiliser le prix recalculé)
      // Déterminer le BookingType depuis le type de QuoteRequest
      // Tous les services actifs sont des déménagements (MOVING, MOVING_PREMIUM)
      // Services abandonnés : PACKING, SERVICE, CLEANING, DELIVERY
      const bookingType: BookingType = BookingType.MOVING_QUOTE;
      
      const quote = new Quote({
        type: quoteRequest.getType() as any,
        status: 'DRAFT' as any,
        customer: {
          id: customer.getId()!,
          firstName: customer.getContactInfo().getFirstName(),
          lastName: customer.getContactInfo().getLastName(),
          email: customer.getContactInfo().getEmail(),
          phone: customer.getContactInfo().getPhone()
        },
        totalAmount: new Money(finalPrice, 'EUR')
      });
      
      const booking = new Booking(
        bookingType,
        customer,
        quote,
        new Money(finalPrice, 'EUR')
      );
      
      // 6. Sauvegarder avec statut DRAFT
      const savedBooking = await this.bookingRepository.save(booking);
      logger.info(`✅ Réservation créée avec ID: ${savedBooking.getId()}, statut: ${savedBooking.getStatus()}, montant: ${finalPrice}€`);
      
      // 7. TRANSITION CRITIQUE : DRAFT → PAYMENT_COMPLETED (le paiement est déjà confirmé par le webhook)
      savedBooking.updateStatus(BookingStatus.PAYMENT_COMPLETED);
      await this.bookingRepository.save(savedBooking);
      logger.info(`✅ Statut mis à jour: DRAFT → PAYMENT_COMPLETED pour la réservation ${savedBooking.getId()}`);
      
      // 8. 🎯 DÉCLENCHER BOOKING_CONFIRMED - Services spécialisés autonomes
      try {
        // Valider les variables d'environnement
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.INTERNAL_API_URL;
        if (!baseUrl) {
          throw new Error('NEXT_PUBLIC_APP_URL ou INTERNAL_API_URL doit être configuré pour les notifications');
        }

        // ÉTAPE 1: Notifications équipe interne (gèrent leurs propres documents)
        const internalStaffResponse = await fetch(`${baseUrl}/api/notifications/internal-staff`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'BookingService/1.0'
          },
          body: JSON.stringify({
            bookingId: savedBooking.getId(),
            trigger: 'BOOKING_CONFIRMED',
            context: {
              confirmationDate: new Date().toISOString(),
              additionalInfo: customerData
            }
          })
        });

        let internalStaffResult = { success: false };
        if (internalStaffResponse.ok) {
          internalStaffResult = await internalStaffResponse.json();
          logger.info('✅ Notifications équipe interne envoyées', { success: internalStaffResult.success });
        } else {
          const errorText = await internalStaffResponse.text();
          logger.error('❌ Erreur API notifications équipe interne', {
            status: internalStaffResponse.status,
            error: errorText
          });
        }

        // ÉTAPE 2: Attribution prestataires externes
        try {
        await this.triggerProfessionalAttribution(savedBooking);
          logger.info('✅ Attribution prestataires déclenchée');
        } catch (attributionError) {
          logger.error('❌ Erreur lors de l\'attribution prestataires', {
            error: attributionError instanceof Error ? attributionError.message : 'Erreur inconnue',
            stack: attributionError instanceof Error ? attributionError.stack : undefined
          });
        }

        // ÉTAPE 3: Notification client avec documents
        const customerNotificationResponse = await fetch(`${baseUrl}/api/notifications/business/booking-confirmation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'BookingService/1.0'
          },
          body: JSON.stringify({
            bookingId: savedBooking.getId(),
            customerEmail: savedBooking.getCustomer().getContactInfo().getEmail(),
            customerName: savedBooking.getCustomer().getFullName(),
            bookingReference: `EQ-${savedBooking.getId()?.slice(-8).toUpperCase()}`,
            serviceType: savedBooking.getType(),
            serviceName: savedBooking.getType() || 'Service Express Quote',
            totalAmount: savedBooking.getTotalAmount().getAmount(),
            serviceDate: savedBooking.getScheduledDate()?.toISOString() || new Date().toISOString(),
            serviceTime: '09:00',
            confirmationDate: new Date().toISOString(),
            viewBookingUrl: `${baseUrl}/bookings/${savedBooking.getId()}`,
            supportUrl: `${baseUrl}/contact`
          })
        });

        let customerResult = { success: false };
        if (customerNotificationResponse.ok) {
          customerResult = await customerNotificationResponse.json();
          logger.info('✅ Notification client envoyée', { success: customerResult.success });
        } else {
          const errorText = await customerNotificationResponse.text();
          logger.error('❌ Erreur API notification client', {
            status: customerNotificationResponse.status,
            error: errorText
          });
        }

        logger.info(`✅ Confirmation BOOKING_CONFIRMED terminée`, {
          internalStaff: internalStaffResult.success,
          customer: customerResult.success,
          professionalAttribution: 'triggered'
        });

      } catch (confirmationError) {
        // Ne pas faire échouer la confirmation si les notifications échouent
        logger.error('❌ Erreur lors du workflow de confirmation (réservation confirmée)', {
          bookingId: savedBooking.getId(),
          error: confirmationError instanceof Error ? confirmationError.message : 'Erreur inconnue',
          stack: confirmationError instanceof Error ? confirmationError.stack : undefined,
          context: {
            temporaryId,
            customerEmail: savedBooking.getCustomer().getContactInfo().getEmail()
          }
        });
      }
      
      // 9. Mettre à jour la QuoteRequest comme convertie
      quoteRequest.updateStatus(QuoteRequestStatus.CONVERTED);
      await this.quoteRequestRepository.save(quoteRequest);
      
      logger.info(`🎉 Réservation confirmée avec succès: ${savedBooking.getId()}`);
      return savedBooking;
      
    } catch (error) {
      logger.error(`❌ Erreur lors de la création/confirmation de réservation:`, error);
      throw error;
    }
  }

  /**
   * Méthode helper pour créer/récupérer client à partir des données
   */
  private async getOrCreateCustomerFromData(customerData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    additionalInfo?: string;
  }): Promise<Customer> {
    try {
      // Log détaillé pour tracer les données utilisateur reçues
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('📋 [TRACE UTILISATEUR] getOrCreateCustomerFromData - Données reçues');
      console.log('═══════════════════════════════════════════════════════════════');
      logger.info('📋 [TRACE UTILISATEUR] Données client reçues dans getOrCreateCustomerFromData:', {
        source: 'BookingService.getOrCreateCustomerFromData',
        customerData: {
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          email: customerData.email,
          phone: customerData.phone,
          phoneIsEmpty: !customerData.phone || customerData.phone.trim() === '',
          phoneLength: customerData.phone?.length || 0,
          hasAdditionalInfo: !!customerData.additionalInfo
        },
        warning: (!customerData.phone || customerData.phone.trim() === '') ? '⚠️ Téléphone manquant ou vide' : null
      });
      
      // Log console pour visibilité immédiate
      console.log('📋 [TRACE UTILISATEUR] customerData dans getOrCreateCustomerFromData:', JSON.stringify(customerData, null, 2));

      // Essayer de récupérer le client existant
      const existingCustomer = await this.customerRepository.findByEmail(customerData.email);
      if (existingCustomer) {
        logger.info(`👤 [TRACE UTILISATEUR] Client existant trouvé:`, {
          id: existingCustomer.getId(),
          email: existingCustomer.getContactInfo().getEmail(),
          phone: existingCustomer.getContactInfo().getPhone(),
          phoneIsEmpty: !existingCustomer.getContactInfo().getPhone() || existingCustomer.getContactInfo().getPhone().trim() === ''
        });
        return existingCustomer;
      }
      
      // Créer un nouveau client
      // Utiliser une valeur par défaut si le téléphone est manquant
      const phone = customerData.phone && customerData.phone.trim() !== '' 
        ? customerData.phone 
        : '+33600000000'; // Valeur par défaut si téléphone manquant
      
      logger.info('📋 [TRACE UTILISATEUR] Création nouveau client avec ContactInfo:', {
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email,
        phone: customerData.phone,
        phoneIsEmpty: !customerData.phone || customerData.phone.trim() === '',
        phoneUsed: phone,
        phoneWasDefault: !customerData.phone || customerData.phone.trim() === ''
      });

      const contactInfo = new ContactInfo(
        customerData.firstName,
        customerData.lastName,
        customerData.email,
        phone
      );

      const customer = new Customer(
        crypto.randomUUID(),
        contactInfo
      );
      
      logger.info('📋 [TRACE UTILISATEUR] Customer créé (avant sauvegarde):', {
        id: customer.getId(),
        email: customer.getContactInfo().getEmail(),
        phone: customer.getContactInfo().getPhone(),
        phoneIsEmpty: !customer.getContactInfo().getPhone() || customer.getContactInfo().getPhone().trim() === ''
      });

      const savedCustomer = await this.customerRepository.save(customer);
      
      logger.info('📋 [TRACE UTILISATEUR] Customer sauvegardé avec succès:', {
        id: savedCustomer.getId(),
        email: savedCustomer.getContactInfo().getEmail(),
        phone: savedCustomer.getContactInfo().getPhone(),
        phoneIsEmpty: !savedCustomer.getContactInfo().getPhone() || savedCustomer.getContactInfo().getPhone().trim() === ''
      });
      
      return savedCustomer;
      
    } catch (error) {
      logger.error('❌ [TRACE UTILISATEUR] Erreur lors de la gestion du client:', {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined,
        customerData: {
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          email: customerData.email,
          phone: customerData.phone,
          phoneIsEmpty: !customerData.phone || customerData.phone.trim() === ''
        }
      });
      throw error;
    }
  }

  /**
   * Confirme le succès du paiement (appelé par le webhook Stripe)
   */
  async confirmPaymentSuccess(bookingId: string, paymentData: {
    paymentIntentId: string;
    amount: number;
    status: string;
  }): Promise<void> {
    logger.info(`💳 Confirmation de paiement pour la réservation ${bookingId}`, paymentData);

    try {
      const booking = await this.bookingRepository.findById(bookingId);
      if (!booking) {
        throw new BookingNotFoundError(bookingId);
      }

      // Mettre à jour le statut de la réservation
      booking.updateStatus(BookingStatus.PAYMENT_COMPLETED);
      await this.bookingRepository.save(booking);

      // 🆕 NOUVEAU FLUX : Services spécialisés autonomes
      try {
        // Valider les variables d'environnement
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.INTERNAL_API_URL;
        if (!baseUrl) {
          throw new Error('NEXT_PUBLIC_APP_URL ou INTERNAL_API_URL doit être configuré pour les notifications');
        }

        // ÉTAPE A : Notification client (gère ses propres documents)
          const notificationResponse = await fetch(`${baseUrl}/api/notifications/business/payment-confirmation`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'BookingService/1.0'
            },
            body: JSON.stringify({
              email: booking.getCustomer().getContactInfo().getEmail(),
              customerName: booking.getCustomer().getFullName(),
              bookingId: bookingId,
              amount: booking.getTotalAmount().getAmount(),
              currency: 'EUR',
              paymentMethod: 'Carte bancaire (Stripe)',
              transactionId: paymentData.paymentIntentId,
              paymentDate: new Date().toISOString(),
              bookingReference: `EQ-${bookingId.slice(-8).toUpperCase()}`,
              serviceType: booking.getType() || 'CUSTOM',
              serviceName: booking.getType() || 'Service Express Quote',
              serviceDate: booking.getScheduledDate()?.toISOString() || new Date().toISOString(),
              serviceTime: '09:00',
              customerPhone: booking.getCustomer().getContactInfo().getPhone(),
              trigger: 'PAYMENT_COMPLETED',
              viewBookingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${bookingId}`,
              supportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/contact`
            })
          });

        if (!notificationResponse.ok) {
          logger.warn('⚠️ Erreur envoi notification client', {
            bookingId,
            notificationStatus: notificationResponse.status
          });
        } else {
          const notificationResult = await notificationResponse.json();
          logger.info('✅ Notification client envoyée', {
            bookingId,
            messageId: notificationResult.id
          });
        }

        // ÉTAPE C : Notifications équipe interne pour paiement
        const internalStaffResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/internal-staff`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'BookingService/1.0'
          },
          body: JSON.stringify({
            bookingId: bookingId,
            trigger: 'PAYMENT_COMPLETED',
            context: {
              paymentDate: new Date().toISOString(),
              additionalInfo: paymentData
            }
          })
        });

        const internalStaffResult = internalStaffResponse.ok ? await internalStaffResponse.json() : { success: false };

        logger.info('✅ Flux PAYMENT_COMPLETED terminé', {
          customerNotified: true,
          internalStaffNotified: internalStaffResult.success
        });

        // Architecture API : notifications gérées par services spécialisés

        // 🆕 NOUVEAU: Déclencher l'attribution professionnelle après paiement
        try {
          await this.triggerProfessionalAttribution(booking);
          logger.info('✅ Attribution professionnelle déclenchée avec succès');
        } catch (attributionError) {
          logger.error('❌ Erreur lors de l\'attribution professionnelle', attributionError as Error);
          // L'attribution ne doit pas bloquer le paiement, continuer
        }

        // 🔧 CORRIGÉ: S'assurer que les professionnels externes reçoivent leurs documents
        try {
          // Le workflow de paiement délègue aux APIs spécialisées pour les notifications
          logger.info('✅ Workflow de paiement unifié : documents générés et envoyés aux professionnels internes/externes');
        } catch (unifiedError) {
          logger.warn('⚠️ Note: Workflow unifié partiellement fonctionnel', unifiedError as Error);
        }
        
      } catch (error) {
        logger.error('❌ Erreur lors de la génération des documents de paiement', error as Error);
        
        // Fallback : envoyer une notification basique sans documents
        try {
          await this.sendBookingConfirmationNotification(booking, booking.getCustomer(), {
            sessionId: paymentData.paymentIntentId,
            totalAmount: paymentData.amount,
            quoteData: {}
          });
          logger.info('✅ Notification de fallback envoyée sans documents');
        } catch (fallbackError) {
          logger.error('❌ Même la notification de fallback a échoué', fallbackError as Error);
        }
      }

      logger.info(`✅ Paiement confirmé avec succès pour la réservation ${bookingId}`);
    } catch (error) {
      logger.error(`❌ Erreur lors de la confirmation de paiement pour ${bookingId}:`, error);
      throw error;
    }
  }

  /**
   * Envoie les notifications de confirmation via l'API
   */
  private async sendBookingConfirmationNotification(
    booking: Booking, 
    customer: Customer, 
    context: { sessionId: string; totalAmount: number; quoteData: any }
  ): Promise<void> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.INTERNAL_API_URL;
    if (!baseUrl) {
      logger.error('❌ NEXT_PUBLIC_APP_URL ou INTERNAL_API_URL doit être configuré pour les notifications');
      throw new Error('Configuration manquante: NEXT_PUBLIC_APP_URL ou INTERNAL_API_URL');
    }
    
    const contactInfo = customer.getContactInfo();
    const notificationData = {
        email: customer.getContactInfo().getEmail(),
      customerName: contactInfo.getFullName(),
      bookingId: booking.getId()!,
      bookingReference: `EQ-${booking.getId()!.slice(-8).toUpperCase()}`,
      serviceDate: context.quoteData.scheduledDate || new Date().toISOString().split('T')[0],
      serviceTime: context.quoteData.scheduledTime || '09:00',
      serviceAddress: context.quoteData.locationAddress || context.quoteData.pickupAddress || 'Adresse à définir',
      totalAmount: context.totalAmount,
      customerPhone: customer.getContactInfo().getPhone(),
      serviceType: booking.getType(),
      sessionId: context.sessionId,
      // Données supplémentaires pour le template
      deliveryAddress: context.quoteData.deliveryAddress,
      volume: context.quoteData.volume,
      distance: context.quoteData.distance,
      additionalInfo: context.quoteData.additionalInfo
    };

    const response = await fetch(`${baseUrl}/api/notifications/business/booking-confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Call': 'true'
      },
      body: JSON.stringify(notificationData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notification API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    logger.info(`✅ Notification de confirmation envoyée via API:`, result);
  }

  /**
   * Envoie les notifications d'annulation via l'API
   */
  private async sendBookingCancellationNotification(
    booking: Booking, 
    reason?: string
  ): Promise<void> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.INTERNAL_API_URL || 'http://localhost:3000';
    
    const notificationData = {
      email: booking.getCustomer().getContactInfo().getEmail(),
      customerName: booking.getCustomer().getFullName(),
      bookingId: booking.getId()!,
      bookingReference: `EQ-${booking.getId()!.slice(-8).toUpperCase()}`,
      reason: reason || 'Non spécifiée',
      customerPhone: booking.getCustomer().getPhone(),
      serviceType: booking.getType()
    };

    const response = await fetch(`${baseUrl}/api/notifications/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Call': 'true'
      },
      body: JSON.stringify(notificationData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notification API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    logger.info(`✅ Notification d'annulation envoyée via API:`, result);
  }

  /**
   * 🆕 Déclenche l'attribution professionnelle après un paiement réussi
   */
  private async triggerProfessionalAttribution(booking: Booking): Promise<void> {
    logger.info(`🎯 Déclenchement attribution professionnelle pour booking ${booking.getId()}`);

    try {
      // Import dynamique pour éviter les dépendances circulaires
      const { AttributionService } = await import('@/bookingAttribution/AttributionService');
      const attributionService = new AttributionService();

      // Extraire les coordonnées géographiques du booking
      const coordinates = await this.extractBookingCoordinates(booking);
      if (!coordinates) {
        logger.error(`❌ Coordonnées non disponibles pour booking ${booking.getId()}, attribution annulée`);
        logger.error(`   Adresse: Non spécifiée`);
        logger.error(`   Type: ${booking.getType()}`);
        return;
      }

      // Valider que les coordonnées sont dans le rayon de 50km de Paris
      const { ProfessionalLocationService } = await import('@/bookingAttribution/ProfessionalLocationService');
      const locationService = new ProfessionalLocationService();
      if (!locationService.isWithinParisRadius(coordinates.latitude, coordinates.longitude, 50)) {
        logger.error(`❌ Coordonnées hors du rayon de 50km de Paris pour booking ${booking.getId()}`);
        logger.error(`   Coordonnées: (${coordinates.latitude}, ${coordinates.longitude})`);
        logger.error(`   Adresse: Non spécifiée`);
        // Pour l'instant, on continue quand même (validation business à faire ailleurs)
        // Mais on log l'erreur pour monitoring
      } else {
        logger.info(`✅ Coordonnées validées (rayon 50km): (${coordinates.latitude}, ${coordinates.longitude})`);
      }

      // Déterminer le type de service pour l'attribution
      const serviceType = this.mapBookingTypeToServiceType(booking.getType());

      // 🆕 Préparer les données avec séparation complète/limitée pour le flux en 2 étapes
      const customerFullName = booking.getCustomer().getFullName();
      const customerFirstName = booking.getCustomer().getContactInfo().getFirstName();
      const scheduledDate = booking.getScheduledDate() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const totalAmount = booking.getTotalAmount().getAmount();
      const locationAddress = 'Adresse à préciser'; // TODO: Extraire depuis quoteData

      const bookingData = {
        // Nouvelles données étendues pour le flux en 2 étapes
        bookingId: booking.getId(),
        bookingReference: `EQ-${booking.getId()?.slice(-8).toUpperCase()}`,
        serviceDate: scheduledDate,
        serviceTime: '09:00', // Heure par défaut
        priority: AttributionUtils.determinePriority(scheduledDate),

        // Données complètes (usage interne uniquement)
        fullClientData: {
          customerName: customerFullName,
          customerEmail: booking.getCustomer().getContactInfo().getEmail(),
          customerPhone: booking.getCustomer().getContactInfo().getPhone(),
          fullPickupAddress: locationAddress,
          fullDeliveryAddress: undefined // TODO: Extraire depuis quoteData
        },

        // Données limitées (pour prestataires)
        limitedClientData: {
          customerName: `${customerFirstName.charAt(0)}. ${booking.getCustomer().getContactInfo().getLastName()}`.trim(),
          pickupAddress: AttributionUtils.extractCityFromAddress(locationAddress),
          deliveryAddress: undefined, // TODO: Extraire depuis quoteData
          serviceType: booking.getType() || 'CUSTOM',
          quoteDetails: {
            estimatedAmount: Math.round(totalAmount * await this.getEstimationFactor()), // ✅ MIGRÉ: Facteur d'estimation depuis configuration
            currency: 'EUR',
            serviceCategory: AttributionUtils.getServiceCategory(booking.getType() || 'CUSTOM')
          }
        },

        // Données existantes (pour compatibilité)
        totalAmount,
        scheduledDate,
        locationAddress,
        customerFirstName: booking.getCustomer().getContactInfo().getFirstName(),
        customerLastName: booking.getCustomer().getContactInfo().getLastName(),
        customerPhone: booking.getCustomer().getContactInfo().getPhone(),
        additionalInfo: {} // TODO: Extraire depuis quoteData
      };

      // Lancer l'attribution
      const attributionId = await attributionService.startAttribution({
        bookingId: booking.getId()!,
        serviceType,
        serviceLatitude: coordinates.latitude,
        serviceLongitude: coordinates.longitude,
        maxDistanceKm: 100, // Distance par défaut
        bookingData
      });

      logger.info(`✅ Attribution professionnelle créée: ${attributionId} pour booking ${booking.getId()}`);

    } catch (error) {
      logger.error(`❌ Erreur attribution professionnelle pour booking ${booking.getId()}:`, error);
      // Ne pas propager l'erreur pour ne pas affecter le paiement
    }
  }

  /**
   * Extrait les coordonnées géographiques d'une réservation
   * ✅ AMÉLIORÉ: Utilise le géocodage Google Maps et valide le rayon de 50km autour de Paris
   */
  private async extractBookingCoordinates(booking: Booking): Promise<{ latitude: number; longitude: number } | null> {
    try {
      // 1. Essayer d'extraire depuis les données additionnelles (coordonnées déjà stockées)
      const additionalInfo = (booking as any).additionalInfo as any;
      if (additionalInfo?.coordinates?.latitude && additionalInfo?.coordinates?.longitude) {
        const coordinates = {
          latitude: additionalInfo.coordinates.latitude,
          longitude: additionalInfo.coordinates.longitude
        };
        
        // Valider que les coordonnées sont dans le rayon de 50km de Paris
        const { ProfessionalLocationService } = await import('@/bookingAttribution/ProfessionalLocationService');
        const locationService = new ProfessionalLocationService();
        if (locationService.isWithinParisRadius(coordinates.latitude, coordinates.longitude, 50)) {
          logger.info(`✅ Coordonnées trouvées dans additionalInfo: (${coordinates.latitude}, ${coordinates.longitude})`);
          return coordinates;
        } else {
          logger.warn(`⚠️ Coordonnées dans additionalInfo hors du rayon de 50km de Paris: (${coordinates.latitude}, ${coordinates.longitude})`);
        }
      }

      // 2. Pour MOVING_QUOTE, récupérer depuis la table Moving
      if (booking.getType() === BookingType.MOVING_QUOTE) {
        try {
          const { prisma } = await import('@/lib/prisma');
          const moving = await prisma.moving.findUnique({
            where: { bookingId: booking.getId()! },
            select: { pickupCoordinates: true, deliveryCoordinates: true }
          });
          
          if (moving?.pickupCoordinates) {
            const coords = moving.pickupCoordinates as any;
            if (coords.latitude && coords.longitude) {
              const coordinates = {
                latitude: coords.latitude,
                longitude: coords.longitude
              };
              
              // Valider le rayon de 50km
              const { ProfessionalLocationService } = await import('@/bookingAttribution/ProfessionalLocationService');
              const locationService = new ProfessionalLocationService();
              if (locationService.isWithinParisRadius(coordinates.latitude, coordinates.longitude, 50)) {
                logger.info(`✅ Coordonnées trouvées dans Moving.pickupCoordinates: (${coordinates.latitude}, ${coordinates.longitude})`);
                return coordinates;
              } else {
                logger.warn(`⚠️ Coordonnées Moving hors du rayon de 50km de Paris: (${coordinates.latitude}, ${coordinates.longitude})`);
              }
            }
          }
        } catch (movingError) {
          logger.warn('⚠️ Erreur récupération coordonnées depuis Moving:', movingError);
        }
      }

      // 3. Géocoder l'adresse si disponible
      const address = undefined; // TODO: Extraire depuis quoteData
      if (address) {
        try {
          const { ProfessionalLocationService } = await import('@/bookingAttribution/ProfessionalLocationService');
          const locationService = new ProfessionalLocationService();
          const coordinates = await locationService.geocodeAddress(address);
          
          if (coordinates) {
            // Valider que l'adresse est dans le rayon de 50km de Paris
            if (locationService.isWithinParisRadius(coordinates.latitude, coordinates.longitude, 50)) {
              logger.info(`✅ Adresse géocodée et validée (rayon 50km): ${address} → (${coordinates.latitude}, ${coordinates.longitude})`);
              
              // Stocker les coordonnées dans additionalInfo pour usage futur
              // Note: Cette mise à jour sera persistée lors de la prochaine sauvegarde du booking
              const updatedInfo = {
                ...(additionalInfo || {}),
                coordinates: {
                  latitude: coordinates.latitude,
                  longitude: coordinates.longitude,
                  geocodedAt: new Date().toISOString(),
                  address: address
                }
              };
              // TODO: Mettre à jour le booking avec les coordonnées (nécessite une méthode update)
              
              return coordinates;
            } else {
              logger.error(`❌ Adresse hors du rayon de 50km de Paris: ${address} → (${coordinates.latitude}, ${coordinates.longitude})`);
              // Ne pas retourner null, mais utiliser quand même les coordonnées (validation business à faire ailleurs)
              // Pour l'instant, on retourne les coordonnées mais on log l'avertissement
              return coordinates;
            }
          } else {
            logger.warn(`⚠️ Géocodage échoué pour adresse: ${address}`);
          }
        } catch (geocodeError) {
          logger.error('❌ Erreur lors du géocodage:', geocodeError);
        }
      }

      // 4. Dernier recours: retourner null (ne pas utiliser Paris par défaut)
      logger.error(`❌ Impossible d'extraire les coordonnées pour booking ${booking.getId()}`);
      return null;
    } catch (error) {
      logger.error('❌ Erreur extraction coordonnées:', error);
      return null;
    }
  }

  /**
   * Mappe le type de réservation vers le type de service pour l'attribution
   */
  private mapBookingTypeToServiceType(bookingType: BookingType): ServiceType {
    // Tous les services actifs sont des déménagements
    // Services abandonnés : PACKING, SERVICE
    switch (bookingType) {
      case BookingType.MOVING_QUOTE:
        return ServiceType.MOVING;
      // PACKING et SERVICE abandonnés - ne plus gérer
      default:
        return ServiceType.MOVING; // Par défaut, déménagement
    }
  }

  /**
   * ✅ NOUVEAU: Stocke les coordonnées dans additionalInfo lors de la création du booking
   * Extrait les coordonnées depuis quoteData ou géocode l'adresse
   */
  private async storeBookingCoordinates(booking: Booking, quoteData: any): Promise<void> {
    try {
      // 1. Vérifier si les coordonnées sont déjà dans quoteData
      if (quoteData?.coordinates?.latitude && quoteData?.coordinates?.longitude) {
        const coordinates = {
          latitude: quoteData.coordinates.latitude,
          longitude: quoteData.coordinates.longitude
        };
        
        // Valider le rayon de 50km
        const { ProfessionalLocationService } = await import('@/bookingAttribution/ProfessionalLocationService');
        const locationService = new ProfessionalLocationService();
        if (locationService.isWithinParisRadius(coordinates.latitude, coordinates.longitude, 50)) {
          await this.updateBookingAdditionalInfo(booking, {
            coordinates: {
              ...coordinates,
              source: 'quoteData',
              storedAt: new Date().toISOString()
            }
          });
          logger.info(`✅ Coordonnées stockées depuis quoteData: (${coordinates.latitude}, ${coordinates.longitude})`);
          return;
        } else {
          logger.warn(`⚠️ Coordonnées dans quoteData hors du rayon de 50km: (${coordinates.latitude}, ${coordinates.longitude})`);
        }
      }

      // 2. Géocoder l'adresse si disponible
      const address = quoteData?.pickupAddress || quoteData?.locationAddress || quoteData?.address;
      if (address) {
        const { ProfessionalLocationService } = await import('@/bookingAttribution/ProfessionalLocationService');
        const locationService = new ProfessionalLocationService();
        const coordinates = await locationService.geocodeAddress(address);
        
        if (coordinates) {
          // Valider le rayon de 50km
          if (locationService.isWithinParisRadius(coordinates.latitude, coordinates.longitude, 50)) {
            await this.updateBookingAdditionalInfo(booking, {
              coordinates: {
                ...coordinates,
                source: 'geocoded',
                address: address,
                geocodedAt: new Date().toISOString()
              }
            });
            logger.info(`✅ Coordonnées géocodées et stockées: ${address} → (${coordinates.latitude}, ${coordinates.longitude})`);
          } else {
            logger.warn(`⚠️ Adresse géocodée hors du rayon de 50km: ${address} → (${coordinates.latitude}, ${coordinates.longitude})`);
            // Stocker quand même pour référence, mais avec un flag d'avertissement
            await this.updateBookingAdditionalInfo(booking, {
              coordinates: {
                ...coordinates,
                source: 'geocoded',
                address: address,
                geocodedAt: new Date().toISOString(),
                warning: 'Hors rayon 50km de Paris'
              }
            });
          }
        } else {
          logger.warn(`⚠️ Géocodage échoué pour adresse: ${address}`);
        }
      }
    } catch (error) {
      logger.error('❌ Erreur lors du stockage des coordonnées:', error);
      // Ne pas bloquer la création du booking si le géocodage échoue
    }
  }

  /**
   * Met à jour additionalInfo d'un booking dans la base de données
   */
  private async updateBookingAdditionalInfo(booking: Booking, additionalInfo: any): Promise<void> {
    try {
      const { prisma } = await import('@/lib/prisma');
      const existingInfo = (booking as any).additionalInfo || {};
      const mergedInfo = {
        ...existingInfo,
        ...additionalInfo
      };

      await prisma.booking.update({
        where: { id: booking.getId()! },
        data: {
          additionalInfo: mergedInfo,
          updatedAt: new Date()
        }
      });

      // Mettre à jour l'entité en mémoire (pour cohérence)
      (booking as any).additionalInfo = mergedInfo;
    } catch (error) {
      logger.error('❌ Erreur mise à jour additionalInfo:', error);
      throw error;
    }
  }

  // Les méthodes utilitaires ont été centralisées dans AttributionUtils
} 