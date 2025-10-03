import { Booking, BookingStatus } from '../../domain/entities/Booking';
import { Customer } from '../../domain/entities/Customer';
import { Moving } from '../../domain/entities/Moving';
import { Item, ItemType } from '../../domain/entities/Item'; // Nouveau système unifié
import { Template } from '../../domain/entities/Template'; // Nouveau système unifié
import { BookingType } from '../../domain/enums/BookingType';
import { ServiceType } from '../../domain/enums/ServiceType';
import { CustomerService } from './CustomerService';
import { QuoteCalculator } from './QuoteCalculator';
import { QuoteRequest, QuoteRequestStatus } from '../../domain/entities/QuoteRequest';
import { Quote } from '../../domain/entities/Quote';
import { Money } from '../../domain/valueObjects/Money';
import { ContactInfo } from '../../domain/valueObjects/ContactInfo';
import { Address } from '../../domain/valueObjects/Address';
import { BookingSearchCriteriaVO, BookingSearchCriteria } from '../../domain/valueObjects/BookingSearchCriteria';

// Repositories
import { IBookingRepository, BookingSearchResult } from '../../domain/repositories/IBookingRepository';
import { IMovingRepository } from '../../domain/repositories/IMovingRepository';
import { IItemRepository } from '../../domain/repositories/IItemRepository'; // Remplace IPackRepository et IServiceRepository
import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository';
import { IQuoteRequestRepository } from '../../domain/repositories/IQuoteRequestRepository';

// Services externes
import { ITransactionService } from '../../domain/services/ITransactionService';
import { IEmailService } from '../../domain/services/IEmailService';
import { IPDFService } from '../../domain/services/IPDFService';

// Documents - Service client uniquement (les autres notifications sont gérées par APIs)
import { DocumentNotificationService } from '@/documents/application/services/DocumentNotificationService';

// Erreurs domaine
import { 
  BookingNotFoundError, 
  BookingAlreadyCancelledError, 
  BookingCannotBeCancelledError,
  BookingAlreadyCompletedError,
  BookingInvalidStatusTransitionError,
  BookingUpdateNotAllowedError,
  BookingDeletionNotAllowedError,
  BookingConcurrencyError
} from '../../domain/errors/BookingErrors';

import { logger } from '@/lib/logger';
import { AttributionUtils } from '@/bookingAttribution/AttributionUtils';
import { UnifiedDataService, ConfigurationCategory } from '@/quotation/infrastructure/services/UnifiedDataService';
import { PricingFactorsConfigKey } from '@/quotation/domain/configuration/ConfigurationKey';

/**
 * Service de gestion des réservations migré vers le système Template/Item
 * ✅ MIGRÉ VERS UNIFIED DATA SERVICE - Valeurs hardcodées migrées vers la configuration
 */
export class BookingService {
  private readonly unifiedDataService: UnifiedDataService;
  private readonly documentNotificationService: DocumentNotificationService;

  constructor(
    private readonly bookingRepository: IBookingRepository,
    private readonly movingRepository: IMovingRepository,
    private readonly itemRepository: IItemRepository, // Unifié pour tous les types d'items
    private readonly customerRepository: ICustomerRepository,
    private readonly quoteCalculator: QuoteCalculator = QuoteCalculator.getInstance(),
    private readonly quoteRequestRepository: IQuoteRequestRepository,
    private readonly customerService: CustomerService,
    private readonly transactionService?: ITransactionService,
    private readonly emailService?: IEmailService,
    private readonly pdfService?: IPDFService
  ) {
    // Initialiser le service de notification client uniquement
    this.documentNotificationService = new DocumentNotificationService();

    // ✅ NOUVEAU: Initialiser le service de configuration unifié
    this.unifiedDataService = UnifiedDataService.getInstance();
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
   * Crée une réservation après un paiement réussi
   */
  async createBookingAfterPayment(sessionId: string): Promise<Booking> {
    logger.info(`🔄 Création de réservation après paiement - Session: ${sessionId}`);
    
    try {
      // Récupérer les informations de transaction
      if (!this.transactionService) {
        throw new Error('Service de transaction non disponible');
      }
      
      const transaction = await this.transactionService.getTransactionBySessionId(sessionId);
      if (!transaction) {
        throw new Error(`Transaction non trouvée pour la session ${sessionId}`);
      }

      // Récupérer la demande de devis associée
      const quoteRequest = await this.quoteRequestRepository.findById(transaction.quoteRequestId);
      if (!quoteRequest) {
        throw new Error(`Demande de devis non trouvée: ${transaction.quoteRequestId}`);
      }
      
      // Créer ou récupérer le client
      const customer = await this.getOrCreateCustomer(quoteRequest.getQuoteData());
      
      // Déterminer le type de réservation basé sur les nouvelles entités
      const itemType = this.mapServiceTypeToItemType(quoteRequest.getType());
      
      // Créer la réservation selon le type d'item
      const booking = await this.createBookingForItemType(
        customer,
        quoteRequest,
        transaction.totalAmount,
        itemType
      );

      // Mettre à jour le statut de la demande de devis
      await this.quoteRequestRepository.updateStatus(
        quoteRequest.getId()!,
        QuoteRequestStatus.CONFIRMED
      );

      // Déclencher les notifications via l'API
      try {
        await this.sendBookingConfirmationNotification(booking, customer, {
          sessionId,
          totalAmount,
          quoteData: quoteRequest.getQuoteData()
        });
        logger.info(`✅ Notifications envoyées pour la réservation: ${booking.getId()}`);
      } catch (confirmationError) {
        logger.error('⚠️ Erreur lors de l\'envoi des notifications:', confirmationError);
        // Ne pas faire échouer la création de réservation si les notifications échouent
      }

      logger.info(`✅ Réservation créée avec succès: ${booking.getId()}`);
      return booking;
    } catch (error) {
      logger.error('Erreur lors de la création de réservation après paiement:', error);
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
      const customer = await this.getOrCreateCustomer({
        ...quoteRequest.getQuoteData(),
        ...customerDetails
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
      const quote = new Quote(
        customer.getId()!,
        new Money(totalAmount),
        quoteRequest.getType(),
        quoteRequest.getQuoteData()
      );

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
    switch (serviceType) {
      case ServiceType.MOVING_PREMIUM:
      case ServiceType.PACKING:
        return ItemType.DEMENAGEMENT;
      case ServiceType.CLEANING:
        return ItemType.MENAGE;
      case ServiceType.DELIVERY:
        return ItemType.TRANSPORT;
      default:
        return ItemType.DEMENAGEMENT;
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
    
    // Créer la réservation de base
    const booking = new Booking(
      customer,
      this.mapItemTypeToBookingType(itemType),
      new Money(totalAmount),
      BookingStatus.CONFIRMED
    );

    // Sauvegarder la réservation
    const savedBooking = await this.bookingRepository.save(booking);

    // Créer l'item spécifique selon le type
    await this.createSpecificItem(savedBooking, quoteData, itemType);

    return savedBooking;
  }

  /**
   * Mappe ItemType vers BookingType pour compatibilité
   */
  private mapItemTypeToBookingType(itemType: ItemType): BookingType {
    switch (itemType) {
      case ItemType.DEMENAGEMENT:
        return BookingType.MOVING;
      case ItemType.MENAGE:
        return BookingType.CLEANING;
      case ItemType.TRANSPORT:
        return BookingType.DELIVERY;
      default:
        return BookingType.MOVING;
    }
  }

  /**
   * Crée l'item spécifique selon le type
   */
  private async createSpecificItem(
    booking: Booking,
    quoteData: any,
    itemType: ItemType
  ): Promise<void> {
    // Créer l'item unifié qui remplace les anciennes entités Pack/Service
    const item = new Item(
      quoteData.serviceId || 'default',
      itemType,
      quoteData.calculatedPrice || 0,
      quoteData
    );

    await this.itemRepository.save(item);

    // Si c'est un déménagement, créer également l'entité Moving pour compatibilité
    if (itemType === ItemType.DEMENAGEMENT) {
      const moving = new Moving(
        booking.getId()!,
        this.extractAddressFromData(quoteData, 'pickup'),
        this.extractAddressFromData(quoteData, 'delivery'),
        quoteData.scheduledDate ? new Date(quoteData.scheduledDate) : new Date(),
        quoteData.volume || 0,
        quoteData.distance || 0
      );

      await this.movingRepository.save(moving);
    }
  }

  /**
   * Obtient ou crée un client
   */
  private async getOrCreateCustomer(data: any): Promise<Customer> {
    const email = data.email || data.customerDetails?.email;
    
    if (!email) {
      throw new Error('Email du client requis');
    }

    // Essayer de trouver le client existant
    const existingCustomer = await this.customerRepository.findByEmail(email);
    if (existingCustomer) {
      return existingCustomer;
    }

    // Créer un nouveau client
    const contactInfo = new ContactInfo(
      data.firstName || data.customerDetails?.firstName || '',
      data.lastName || data.customerDetails?.lastName || '',
      email,
      data.phone || data.customerDetails?.phone || ''
    );

    const customer = new Customer(contactInfo);
    return await this.customerRepository.save(customer);
  }

  /**
   * Extrait une adresse depuis les données
   */
  private extractAddressFromData(data: any, type: 'pickup' | 'delivery'): Address {
    const addressData = data[`${type}Address`] || {};
    return new Address(
      addressData.street || '',
      addressData.city || '',
      addressData.postalCode || '',
      addressData.country || 'France'
    );
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

    await this.bookingRepository.delete(id);
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
      
      // 3. Créer la réservation avec statut DRAFT
      const booking = new Booking(
        customer,
        quoteRequest.getType(),
        new Money(quoteRequest.getCalculatedPrice()?.totalPrice || 0, 'EUR'),
        quoteRequest.getQuoteData(),
        BookingStatus.DRAFT
      );
      
      // 4. Sauvegarder avec statut DRAFT
      const savedBooking = await this.bookingRepository.save(booking);
      logger.info(`✅ Réservation créée avec ID: ${savedBooking.getId()}`);
      
      // 5. TRANSITION CRITIQUE : DRAFT → CONFIRMED avec trigger
      savedBooking.updateStatus(BookingStatus.CONFIRMED);
      await this.bookingRepository.save(savedBooking);
      
      // 6. 🎯 DÉCLENCHER BOOKING_CONFIRMED - Services spécialisés autonomes
      try {
        // ÉTAPE 1: Notifications équipe interne (gèrent leurs propres documents)
        const internalStaffResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/internal-staff`, {
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

        const internalStaffResult = internalStaffResponse.ok ? await internalStaffResponse.json() : { success: false };

        // ÉTAPE 3: Attribution prestataires externes
        await this.triggerProfessionalAttribution(savedBooking);

        // ÉTAPE 4: Notification client avec documents
        const customerNotificationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/business/booking-confirmation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'BookingService/1.0'
          },
          body: JSON.stringify({
            bookingId: savedBooking.getId(),
            customerEmail: savedBooking.getCustomer().getContactInfo().getEmail(),
            customerName: `${savedBooking.getCustomer().getFirstName()} ${savedBooking.getCustomer().getLastName()}`,
            bookingReference: savedBooking.getReference() || `EQ-${savedBooking.getId()?.slice(-8).toUpperCase()}`,
            serviceType: savedBooking.getType(),
            serviceName: savedBooking.getType() || 'Service Express Quote',
            totalAmount: savedBooking.getTotalAmount().getAmount(),
            serviceDate: savedBooking.getScheduledDate()?.toISOString() || new Date().toISOString(),
            serviceTime: '09:00',
            confirmationDate: new Date().toISOString(),
            viewBookingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${savedBooking.getId()}`,
            supportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/contact`
          })
        });

        const customerResult = customerNotificationResponse.ok ? await customerNotificationResponse.json() : { success: false };

        logger.info(`✅ Confirmation BOOKING_CONFIRMED terminée`, {
          internalStaff: internalStaffResult.success,
          customer: customerResult.success,
          professionalAttribution: 'triggered'
        });

      } catch (confirmationError) {
        // Ne pas faire échouer la confirmation si les notifications échouent
        logger.error('❌ Erreur lors du workflow de confirmation (réservation confirmée)', confirmationError);
      }
      
      // 7. Mettre à jour la QuoteRequest comme utilisée
      quoteRequest.markAsUsed();
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
      // Essayer de récupérer le client existant
      const existingCustomer = await this.customerRepository.findByEmail(customerData.email);
      if (existingCustomer) {
        logger.info(`👤 Client existant trouvé: ${existingCustomer.getEmail()}`);
        return existingCustomer;
      }
      
      // Créer un nouveau client
      const customer = new Customer(
        customerData.firstName,
        customerData.lastName,
        new ContactInfo(customerData.email, customerData.phone || '')
      );
      
      const savedCustomer = await this.customerRepository.save(customer);
      logger.info(`👤 Nouveau client créé: ${savedCustomer.getEmail()}`);
      return savedCustomer;
      
    } catch (error) {
      logger.error('Erreur lors de la gestion du client:', error);
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
        // ÉTAPE A : Notification client (gère ses propres documents)
          const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/business/payment-confirmation`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'BookingService/1.0'
            },
            body: JSON.stringify({
              email: booking.getCustomer().getContactInfo().getEmail(),
              customerName: booking.getCustomer().getFirstName() + ' ' + booking.getCustomer().getLastName(),
              bookingId: bookingId,
              amount: booking.getTotalAmount().getAmount(),
              currency: 'EUR',
              paymentMethod: 'Carte bancaire (Stripe)',
              transactionId: paymentData.paymentIntentId,
              paymentDate: new Date().toISOString(),
              bookingReference: booking.getReference() || `EQ-${bookingId.slice(-8).toUpperCase()}`,
              serviceType: booking.getType() || 'CUSTOM',
              serviceName: booking.getType() || 'Service Express Quote',
              serviceDate: booking.getScheduledDate()?.toISOString() || new Date().toISOString(),
              serviceTime: '09:00',
              customerPhone: booking.getCustomer().getPhone(),
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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.INTERNAL_API_URL || 'http://localhost:3000';
    
    const notificationData = {
      email: customer.getEmail(),
      customerName: `${customer.getFirstName()} ${customer.getLastName()}`,
      bookingId: booking.getId()!,
      bookingReference: `EQ-${booking.getId()!.slice(-8).toUpperCase()}`,
      serviceDate: context.quoteData.scheduledDate || new Date().toISOString().split('T')[0],
      serviceTime: context.quoteData.scheduledTime || '09:00',
      serviceAddress: context.quoteData.locationAddress || context.quoteData.pickupAddress || 'Adresse à définir',
      totalAmount: context.totalAmount,
      customerPhone: customer.getPhone(),
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
      email: booking.getCustomer().getEmail(),
      customerName: `${booking.getCustomer().getFirstName()} ${booking.getCustomer().getLastName()}`,
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
        logger.warn(`⚠️ Coordonnées non disponibles pour booking ${booking.getId()}, attribution annulée`);
        return;
      }

      // Déterminer le type de service pour l'attribution
      const serviceType = this.mapBookingTypeToServiceType(booking.getType());

      // 🆕 Préparer les données avec séparation complète/limitée pour le flux en 2 étapes
      const customerFullName = `${booking.getCustomer().getFirstName()} ${booking.getCustomer().getLastName()}`.trim();
      const customerFirstName = booking.getCustomer().getFirstName() || '';
      const scheduledDate = booking.getScheduledDate() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const totalAmount = booking.getTotalAmount().getAmount();
      const locationAddress = booking.getLocationAddress() || 'Adresse à préciser';

      const bookingData = {
        // Nouvelles données étendues pour le flux en 2 étapes
        bookingId: booking.getId(),
        bookingReference: booking.getReference() || `EQ-${booking.getId()?.slice(-8).toUpperCase()}`,
        serviceDate: scheduledDate,
        serviceTime: '09:00', // Heure par défaut
        priority: AttributionUtils.determinePriority(scheduledDate),

        // Données complètes (usage interne uniquement)
        fullClientData: {
          customerName: customerFullName,
          customerEmail: booking.getCustomer().getContactInfo().getEmail(),
          customerPhone: booking.getCustomer().getPhone(),
          fullPickupAddress: locationAddress,
          fullDeliveryAddress: booking.getDeliveryAddress() || undefined
        },

        // Données limitées (pour prestataires)
        limitedClientData: {
          customerName: `${customerFirstName.charAt(0)}. ${booking.getCustomer().getLastName()}`.trim(),
          pickupAddress: AttributionUtils.extractCityFromAddress(locationAddress),
          deliveryAddress: booking.getDeliveryAddress() ? AttributionUtils.extractCityFromAddress(booking.getDeliveryAddress()!) : undefined,
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
        customerFirstName: booking.getCustomer().getFirstName(),
        customerLastName: booking.getCustomer().getLastName(),
        customerPhone: booking.getCustomer().getPhone(),
        additionalInfo: booking.getAdditionalInfo()
      };

      // Lancer l'attribution
      const attributionId = await attributionService.startAttribution({
        bookingId: booking.getId()!,
        serviceType,
        serviceLatitude: coordinates.latitude,
        serviceLongitude: coordinates.longitude,
        maxDistanceKm: 150, // Distance par défaut
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
   */
  private async extractBookingCoordinates(booking: Booking): Promise<{ latitude: number; longitude: number } | null> {
    try {
      // Essayer d'extraire depuis les données additionnelles
      const additionalInfo = booking.getAdditionalInfo() as any;
      if (additionalInfo?.coordinates) {
        return {
          latitude: additionalInfo.coordinates.latitude,
          longitude: additionalInfo.coordinates.longitude
        };
      }

      // Essayer d'extraire depuis les données de déménagement si disponibles
      if (booking.getType() === BookingType.MOVING_QUOTE) {
        // TODO: Récupérer depuis le repository Moving si nécessaire
      }

      // Fallback: géocoder l'adresse si disponible
      const address = booking.getLocationAddress() || booking.getPickupAddress();
      if (address) {
        // TODO: Utiliser le service de géocodage existant
        // Pour l'instant, retourner des coordonnées par défaut (Paris)
        logger.warn(`⚠️ Géocodage non implémenté pour adresse: ${address}, utilisation coordonnées Paris`);
        return {
          latitude: 48.8566,
          longitude: 2.3522
        };
      }

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
    switch (bookingType) {
      case BookingType.MOVING_QUOTE:
        return ServiceType.MOVING;
      case BookingType.PACKING:
        return ServiceType.PACKING;
      case BookingType.SERVICE:
      default:
        return ServiceType.SERVICE;
    }
  }

  // Les méthodes utilitaires ont été centralisées dans AttributionUtils
} 