import { Booking } from '../../domain/entities/Booking';
import { BookingStatus } from '../../domain/enums/BookingStatus';
import { BookingType } from '../../domain/enums/BookingType';
import { Moving } from '../../domain/entities/Moving';
import { Pack, PackType } from '../../domain/entities/Pack';
import { Service } from '../../domain/entities/Service';
import { Customer } from '../../domain/entities/Customer';
import { Professional } from '../../domain/entities/Professional';
import { IBookingRepository } from '../../domain/repositories/IBookingRepository';
import { IMovingRepository } from '../../domain/repositories/IMovingRepository';
import { IPackRepository } from '../../domain/repositories/IPackRepository';
import { IServiceRepository } from '../../domain/repositories/IServiceRepository';
import { IQuoteRequestRepository } from '../../domain/repositories/IQuoteRequestRepository';
import { Money } from '../../domain/valueObjects/Money';
import { Quote } from '../../domain/entities/Quote';
import { QuoteType, QuoteStatus } from '../../domain/enums/QuoteType';
import { QuoteCalculator } from '../../domain/calculators/MovingQuoteCalculator';
import { QuoteContext } from '../../domain/valueObjects/QuoteContext';
import { QuoteRequest } from '../../domain/entities/QuoteRequest';
import { QuoteRequestStatus } from '../../domain/enums/QuoteRequestStatus';
import { QuoteRequestType } from '../../domain/enums/QuoteRequestType';
import { CustomerService } from './CustomerService';
import { ServiceType } from '../../domain/enums/ServiceType';
import { Address } from '../../domain/valueObjects/Address';
import { ContactInfo } from '../../domain/valueObjects/ContactInfo';
import { StripePaymentService } from '../../infrastructure/services/StripePaymentService';
import { PdfService } from '../../infrastructure/services/PdfService';

export class BookingService {
  constructor(
    private readonly bookingRepository: IBookingRepository,
    private readonly movingRepository: IMovingRepository,
    private readonly packRepository: IPackRepository,
    private readonly serviceRepository: IServiceRepository,
    private readonly quoteCalculator: QuoteCalculator,
    private readonly quoteRequestRepository: IQuoteRequestRepository,
    private readonly customerService: CustomerService,
    private readonly transactionService: any,
    private readonly documentService: any,
    private readonly emailService: any,
    private readonly pdfService: PdfService
  ) {}

  /**
   * Crée une demande de devis temporaire (sans client)
   * @description Première étape du flux de réservation recommandé. Crée une demande de devis
   * sans informations client qui pourra être finalisée ultérieurement avec finalizeBooking.
   * @param dto Données de la demande de devis (type, adresses, volume, etc.)
   * @returns La demande de devis créée
   */
  async createQuoteRequest(dto: any): Promise<QuoteRequest> {
    console.log('🔄 [BookingService] Début createQuoteRequest avec type:', dto.type);
    const { type } = dto;
    
    // Valider le type
    if (!Object.values(QuoteRequestType).includes(type)) {
        throw new Error(`Type de devis invalide: ${type}`);
    }
    
    // Créer la demande de devis
    const quoteRequest = new QuoteRequest(
        type as QuoteRequestType,
        dto // Stocker toutes les données originales
    );
    console.log('📝 [BookingService] QuoteRequest créé:', quoteRequest.getId());
    
    // Sauvegarder la demande
    const savedQuoteRequest = await this.quoteRequestRepository.save(quoteRequest);
    console.log('💾 [BookingService] QuoteRequest sauvegardé avec ID:', savedQuoteRequest.getId());
    
    // Créer l'entité spécifique selon le type (Moving, Pack, Service)
    switch (type) {
        case QuoteRequestType.MOVING:
            await this.createMovingQuote(dto, savedQuoteRequest.getId());
            console.log('🚚 [BookingService] Entité Moving créée pour QuoteRequest:', savedQuoteRequest.getId());
            break;
        case QuoteRequestType.PACK:
            await this.createPackQuote(dto, savedQuoteRequest.getId());
            console.log('📦 [BookingService] Entité Pack créée pour QuoteRequest:', savedQuoteRequest.getId());
            break;
        case QuoteRequestType.SERVICE:
            await this.createServiceQuote(dto, savedQuoteRequest.getId());
            console.log('🛠️ [BookingService] Entité Service créée pour QuoteRequest:', savedQuoteRequest.getId());
            break;
    }
    
    console.log('✅ [BookingService] Fin createQuoteRequest - QuoteRequest créé avec succès:', savedQuoteRequest.getId());
    return savedQuoteRequest;
  }

  /**
   * Crée un devis de déménagement temporaire
   */
  private async createMovingQuote(dto: any, quoteRequestId: string): Promise<Moving> {
    console.log('🔄 [BookingService] Début createMovingQuote pour QuoteRequestId:', quoteRequestId);
    
    const moving = new Moving(
      new Date(dto.moveDate),
      dto.pickupAddress,
      dto.deliveryAddress,
      dto.distance || 0,
      dto.volume || 0,
      quoteRequestId
    );
    
    const result = await this.movingRepository.save(moving);
    console.log('✅ [BookingService] Fin createMovingQuote - Moving créé avec succès:', result.getId());
    return result;
  }

  /**
   * Crée un devis de pack temporaire
   */
  private async createPackQuote(dto: any, quoteRequestId: string): Promise<Pack> {
    console.log('🔄 [BookingService] Début createPackQuote pour QuoteRequestId:', quoteRequestId);
    
    const pack = new Pack(
      quoteRequestId,
      dto.name || "Pack standard", // Nom du pack
      dto.description || "",
      new Money(dto.price || 0),
      dto.duration || 120, // Durée en minutes
      dto.workers || 2, // Nombre de travailleurs par défaut
      dto.includes || [],
      dto.features || [],
      dto.categoryId,
      dto.content,
      dto.imagePath,
      dto.includedDistance || 0,
      dto.distanceUnit || 'km',
      dto.workersNeeded || 2,
      dto.isAvailable !== false,
      dto.popular === true,
      quoteRequestId, // bookingId
      dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
      dto.pickupAddress,
      dto.deliveryAddress,
      dto.distance,
      dto.additionalInfo
    );
    
    const result = await this.packRepository.save(pack);
    console.log('✅ [BookingService] Fin createPackQuote - Pack créé avec succès:', result.getId());
    return result;
  }

  /**
   * Crée un devis de service temporaire
   */
  private async createServiceQuote(dto: any, quoteRequestId: string): Promise<Service> {
    console.log('🔄 [BookingService] Début createServiceQuote pour QuoteRequestId:', quoteRequestId);
    
    const service = new Service(
      quoteRequestId,
      dto.name || "Service standard",
      dto.description || "",
      new Money(dto.price || 0),
      dto.duration || 60, // durée par défaut de 60 minutes
      dto.workers || 1, // nombre de travailleurs par défaut
      dto.includes || [],
      quoteRequestId, // bookingId
      dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
      dto.location,
      dto.additionalInfo,
      dto.options || {}
    );
    
    const result = await this.serviceRepository.save(service);
    console.log('✅ [BookingService] Fin createServiceQuote - Service créé avec succès:', result.getId());
    return result;
  }

  /**
   * Convertit une demande de devis en devis formel avec les informations client
   * @description Deuxième étape du flux de réservation recommandé. Crée un devis formel 
   * avec les informations client à partir d'une demande de devis anonyme.
   * @param quoteRequestId ID de la demande de devis à convertir
   * @param customerData Données du client (nom, prénom, email, téléphone)
   * @param options Options supplémentaires (option d'assurance)
   * @returns Le devis formel créé
   */
  async createFormalQuote(quoteRequestId: string, customerData: any, options: { hasInsurance?: boolean } = {}): Promise<Quote> {
    console.log('🔄 [BookingService] Début createFormalQuote pour QuoteRequestId:', quoteRequestId);
    console.log('📧 [BookingService] Données client reçues:', JSON.stringify(customerData));
    
    // Vérifier la présence de l'email
    if (!customerData || !customerData.email) {
      console.error('❌ [BookingService] Email client manquant dans:', customerData);
      throw new Error('L\'email du client est obligatoire');
    }
    
    // Récupérer la demande de devis
    const quoteRequest = await this.quoteRequestRepository.findById(quoteRequestId);
    if (!quoteRequest) {
      console.error('❌ [BookingService] Demande de devis non trouvée:', quoteRequestId);
      throw new Error(`Demande de devis non trouvée: ${quoteRequestId}`);
    }
    
    // Vérifier que la demande n'a pas expiré
    if (quoteRequest.isExpired()) {
      console.error('⏰ [BookingService] Demande de devis expirée:', quoteRequestId);
      throw new Error('Cette demande de devis a expiré');
    }
    
    // Créer ou récupérer le client
    console.log('👤 [BookingService] Création/récupération du client:', customerData.email);
    const customer = await this.customerService.findOrCreateCustomer({
      email: customerData.email,
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      phone: customerData.phone
    });
    console.log('👤 [BookingService] Client trouvé/créé:', customer.getId());
    
    // Récupérer les données de devis déjà calculées
    const quoteData = quoteRequest.getQuoteData();
    
    // Créer le devis final
    const quoteType = this.mapQuoteRequestTypeToQuoteType(quoteRequest.getType());
    console.log('📊 [BookingService] Type de devis mappé:', quoteType);
    
    const contactInfo = customer.getContactInfo();
    const quote = new Quote({
      type: quoteType,
      status: QuoteStatus.CONFIRMED,  // Le devis est créé et confirmé
      customer: {
        id: customer.getId(),
        firstName: contactInfo.getFirstName(),
        lastName: contactInfo.getLastName(),
        email: contactInfo.getEmail(),
        phone: contactInfo.getPhone() || ''
      },
      totalAmount: new Money(quoteData.totalAmount || 0),
      createdAt: new Date(),
      updatedAt: new Date(),
      // Option d'assurance
      hasInsurance: options.hasInsurance,
      // Copier les détails spécifiques au type de service
      ...(quoteType === QuoteType.MOVING_QUOTE && {
        moveDate: quoteData.moveDate ? new Date(quoteData.moveDate) : undefined,
        pickupAddress: quoteData.pickupAddress,
        deliveryAddress: quoteData.deliveryAddress,
        distance: quoteData.distance,
        volume: quoteData.volume,
        pickupFloor: quoteData.pickupFloor,
        deliveryFloor: quoteData.deliveryFloor,
        pickupElevator: quoteData.pickupElevator,
        deliveryElevator: quoteData.deliveryElevator,
        packagingOption: quoteData.packagingOption,
        furnitureOption: quoteData.furnitureOption,
        fragileOption: quoteData.fragileOption
      }),
      ...(quoteType === QuoteType.PACK && {
        packId: quoteData.packId,
        packName: quoteData.packName,
        scheduledDate: quoteData.scheduledDate ? new Date(quoteData.scheduledDate) : undefined
      }),
      ...(quoteType === QuoteType.SERVICE && {
        serviceId: quoteData.serviceId,
        serviceName: quoteData.serviceName,
        description: quoteData.description,
        scheduledDate: quoteData.scheduledDate ? new Date(quoteData.scheduledDate) : undefined,
        scheduledTime: quoteData.scheduledTime,
        location: quoteData.location
      })
    });
    
    console.log('💰 [BookingService] Quote formel créé avec montant:', quoteData.totalAmount);
    
    // Mettre à jour le statut de la demande
    await this.quoteRequestRepository.updateStatus(
      quoteRequestId, 
      QuoteRequestStatus.CONFIRMED
    );
    console.log('🔄 [BookingService] Statut du QuoteRequest mis à jour: CONFIRMED');
    
    // Optionnel: Envoyer le devis par email
    if (this.emailService && typeof this.emailService.sendQuote === 'function') {
      try {
        await this.emailService.sendQuote(quote, customer.getContactInfo().getEmail());
        console.log('📧 [BookingService] Email de devis envoyé à:', customer.getContactInfo().getEmail());
      } catch (error) {
        console.error('❌ [BookingService] Erreur lors de l\'envoi du devis par email:', error);
        // Ne pas échouer si l'envoi d'email échoue
      }
    }
    
    console.log('✅ [BookingService] Fin createFormalQuote - Quote créé avec succès');
    return quote;
  }

  /**
   * Accepte un devis et prépare le paiement
   * @description Troisième étape du flux de réservation recommandé. Marque le devis comme 
   * accepté et prépare la session de paiement.
   * @param quoteId ID du devis à accepter
   * @param paymentMethod Méthode de paiement choisie
   * @returns Informations de la session de paiement
   */
  async acceptQuoteAndInitiatePayment(quoteId: string, paymentMethod: string): Promise<any> {
    console.log('🔄 [BookingService] Début acceptQuoteAndInitiatePayment pour QuoteId:', quoteId);
    
    // Dans une implémentation complète, nous aurions un repository pour Quote
    // Pour le moment, nous allons utiliser le quoteRequestId comme quoteId
    // et récupérer les données à partir de la demande de devis
    const quoteRequestId = quoteId; // Simplification
    
    // Récupérer la demande de devis
    const quoteRequest = await this.quoteRequestRepository.findById(quoteRequestId);
    if (!quoteRequest) {
      console.error('❌ [BookingService] Demande de devis/Quote non trouvé:', quoteRequestId);
      throw new Error(`Devis non trouvé: ${quoteId}`);
    }
    
    // Vérifier que la demande n'a pas expiré
    if (quoteRequest.isExpired()) {
      console.error('⏰ [BookingService] Devis expiré:', quoteRequestId);
      throw new Error('Ce devis a expiré');
    }
    
    // Récupérer les données du devis
    const quoteData = quoteRequest.getQuoteData();
    
    // Créer une session de paiement via Stripe
    try {
      // Initialiser le service de paiement
      const stripePaymentService = new StripePaymentService(
        process.env.STRIPE_SECRET_KEY || '',
        process.env.FRONTEND_URL || ''
      );
      
      // Créer la session de paiement
      const paymentSession = await stripePaymentService.createCheckoutSession(
        quoteRequestId,
        quoteData.email || '',
        new Money(quoteData.totalAmount || 0),
        `Paiement pour devis #${quoteId}`
      );
      
      console.log('💳 [BookingService] Session de paiement créée:', paymentSession.sessionId);
      
      // Mettre à jour le statut de la demande
      await this.quoteRequestRepository.updateStatus(
        quoteRequestId, 
        QuoteRequestStatus.CONVERTED
      );
      console.log('🔄 [BookingService] Statut du QuoteRequest mis à jour: CONVERTED');
      
      console.log('✅ [BookingService] Fin acceptQuoteAndInitiatePayment');
      
      return {
        sessionId: paymentSession.sessionId,
        url: paymentSession.url
      };
    } catch (error) {
      console.error('❌ [BookingService] Erreur lors de la création de la session de paiement:', error);
      throw new Error(`Erreur lors de l'initialisation du paiement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Crée une réservation après confirmation du paiement
   * @description Quatrième étape du flux de réservation recommandé. Crée la réservation 
   * finale uniquement après confirmation du paiement.
   * @param sessionId ID de la session de paiement
   * @returns La réservation créée
   */
  async createBookingAfterPayment(sessionId: string): Promise<Booking> {
    console.log('🔄 [BookingService] Début createBookingAfterPayment pour sessionId:', sessionId);
    
    try {
      // Vérifier le statut du paiement
      const stripePaymentService = new StripePaymentService(
        process.env.STRIPE_SECRET_KEY || '',
        process.env.FRONTEND_URL || ''
      );
      
      const sessionStatus = await stripePaymentService.checkSessionStatus(sessionId);
      
      if (sessionStatus.status !== 'paid') {
        console.error('❌ [BookingService] Paiement non complété:', sessionId);
        throw new Error(`Paiement non complété: ${sessionId}`);
      }
      
      // Récupérer les informations de session complètes pour obtenir les métadonnées
      const session = await stripePaymentService.retrieveCheckoutSession(sessionId);
      const quoteRequestId = session.metadata?.quoteRequestId;
      
      if (!quoteRequestId) {
        console.error('❌ [BookingService] Métadonnées incomplètes dans la session de paiement');
        throw new Error('Impossible de récupérer l\'ID de la demande de devis');
      }
      
      // Récupérer la demande de devis
      const quoteRequest = await this.quoteRequestRepository.findById(quoteRequestId);
      if (!quoteRequest) {
        console.error('❌ [BookingService] Demande de devis non trouvée:', quoteRequestId);
        throw new Error(`Demande de devis non trouvée: ${quoteRequestId}`);
      }
      
      // Récupérer les données du devis
      const quoteData = quoteRequest.getQuoteData();
      
      // Récupérer ou créer le client
      const customerData = {
        email: quoteData.email,
        firstName: quoteData.firstName,
        lastName: quoteData.lastName,
        phone: quoteData.phone
      };
      
      console.log('👤 [BookingService] Récupération du client:', customerData.email);
      const customer = await this.customerService.findOrCreateCustomer(customerData);
      console.log('👤 [BookingService] Client récupéré:', customer.getId());
      
      // Créer le devis final avec statut COMPLETED
      const quoteType = this.mapQuoteRequestTypeToQuoteType(quoteRequest.getType());
      const contactInfo = customer.getContactInfo();
      const quote = new Quote({
        type: quoteType,
        status: QuoteStatus.COMPLETED,
        customer: {
          id: customer.getId(),
          firstName: contactInfo.getFirstName(),
          lastName: contactInfo.getLastName(),
          email: contactInfo.getEmail(),
          phone: contactInfo.getPhone() || ''
        },
        totalAmount: new Money(quoteData.totalAmount || 0)
      });
      
      // Récupérer la méthode de paiement depuis les détails de la session
      const paymentMethod = session.payment_method_types?.[0] || 'card';
      
      // Créer la réservation avec statut PAYMENT_COMPLETED
      const booking = Booking.fromQuoteRequest(
        quoteRequest,
        customer,
        quote,
        new Money(quoteData.totalAmount || 0),
        paymentMethod
      );
      
      // Mettre à jour le statut de la réservation directement à PAYMENT_COMPLETED
      booking.updateStatus(BookingStatus.PAYMENT_COMPLETED);
      
      // Sauvegarder la réservation
      const savedBooking = await this.bookingRepository.save(booking);
      console.log('💾 [BookingService] Booking sauvegardé avec ID:', savedBooking.getId());
      
      // Créer l'entité spécifique selon le type
      switch (quoteRequest.getType()) {
        case QuoteRequestType.MOVING:
          await this.createMoving(quoteData, savedBooking.getId());
          console.log('🚚 [BookingService] Entité Moving créée');
          break;
        case QuoteRequestType.PACK:
          await this.createPack(quoteData, savedBooking.getId());
          console.log('📦 [BookingService] Entité Pack créée');
          break;
        case QuoteRequestType.SERVICE:
          await this.createService(quoteData, savedBooking.getId());
          console.log('🛠️ [BookingService] Entité Service créée');
          break;
      }
      
      console.log('✅ [BookingService] Fin createBookingAfterPayment - Booking créé avec succès');
      return savedBooking;
    } catch (error) {
      console.error('❌ [BookingService] Erreur lors de la création de la réservation après paiement:', error);
      throw new Error(`Erreur lors de la création de la réservation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Convertit une demande de devis en réservation avec les informations client
   * @description Deuxième étape du flux de réservation recommandé. Finalise la demande de devis
   * en y ajoutant les informations client et crée une réservation complète.
   * @param quoteRequestId ID de la demande de devis à finaliser
   * @param customerData Données du client (nom, prénom, email, téléphone)
   * @returns La réservation créée
   */
  async finalizeBooking(quoteRequestId: string, customerData: any): Promise<Booking> {
    console.log('🔄 [BookingService] Début finalizeBooking pour QuoteRequestId:', quoteRequestId);
    
    // Récupérer la demande de devis
    const quoteRequest = await this.quoteRequestRepository.findById(quoteRequestId);
    if (!quoteRequest) {
        console.error('❌ [BookingService] Demande de devis non trouvée:', quoteRequestId);
        throw new Error(`Demande de devis non trouvée: ${quoteRequestId}`);
    }
    console.log('📋 [BookingService] QuoteRequest récupéré:', quoteRequestId);
    
    // Vérifier que la demande n'a pas expiré
    if (quoteRequest.isExpired()) {
        console.error('⏰ [BookingService] Demande de devis expirée:', quoteRequestId);
        throw new Error('Cette demande de devis a expiré');
    }
    
    // Créer ou récupérer le client
    console.log('👤 [BookingService] Recherche ou création du client:', customerData.email);
    const customer = await this.customerService.findOrCreateCustomer({
      email: customerData.email,
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      phone: customerData.phone
    });
    console.log('👤 [BookingService] Client trouvé/créé:', customer.getId());
    
    // Récupérer les données de devis
    const quoteData = quoteRequest.getQuoteData();
    
    // Créer le devis final
    const quoteType = this.mapQuoteRequestTypeToQuoteType(quoteRequest.getType());
    console.log('📊 [BookingService] Type de devis mappé:', quoteType);
    
    // Vérification défensive du client
    if (!customer) {
      console.error('❌ [BookingService] Impossible de créer/récupérer le client');
      throw new Error('Impossible de créer ou récupérer le client. Données client insuffisantes ou invalides.');
    }
    
    const contactInfo = customer.getContactInfo();
    const quote = new Quote({
      type: quoteType,
      status: QuoteStatus.CONFIRMED,
      customer: {
        id: customer.getId(),
        firstName: contactInfo.getFirstName(),
        lastName: contactInfo.getLastName(),
        email: contactInfo.getEmail(),
        phone: contactInfo.getPhone() || ''
      },
      totalAmount: new Money(quoteData.totalAmount || 0)
    });
    console.log('💰 [BookingService] Quote créé avec montant:', quoteData.totalAmount);
    
    // Créer la réservation
    const booking = Booking.fromQuoteRequest(
      quoteRequest,
      customer,
      quote,
      new Money(quoteData.totalAmount || 0),
      quoteData.paymentMethod
    );
    console.log('📝 [BookingService] Booking créé à partir du QuoteRequest');
    
    // Mettre à jour le statut de la demande
    await this.quoteRequestRepository.updateStatus(
      quoteRequestId, 
      QuoteRequestStatus.CONVERTED
    );
    console.log('🔄 [BookingService] Statut du QuoteRequest mis à jour: CONVERTED');
    
    // Sauvegarder la réservation
    const savedBooking = await this.bookingRepository.save(booking);
    console.log('✅ [BookingService] Fin finalizeBooking - Booking sauvegardé avec ID:', savedBooking.getId());
    
    return savedBooking;
  }

  /**
   * Traite le paiement d'une réservation
   */
  async processPayment(bookingId: string, paymentData: any): Promise<Booking> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
        throw new Error(`Réservation non trouvée: ${bookingId}`);
    }
    
    // Mettre à jour le statut
    booking.updateStatus(BookingStatus.PAYMENT_PROCESSING);
    await this.bookingRepository.updateStatus(bookingId, BookingStatus.PAYMENT_PROCESSING);
    
    // TODO: Logique de paiement avec Stripe ou autre
    
    // Simuler un paiement réussi
    booking.updateStatus(BookingStatus.PAYMENT_COMPLETED);
    await this.bookingRepository.updateStatus(bookingId, BookingStatus.PAYMENT_COMPLETED);
    
    return booking;
  }

  /**
   * Génère et envoie le devis en PDF
   */
  async generateAndSendQuote(bookingId: string): Promise<void> {
    try {
      const { booking, details } = await this.getBookingById(bookingId);
      
      if (!booking) {
        throw new Error(`Réservation non trouvée avec l'ID: ${bookingId}`);
      }
      
      // Récupérer les informations du client
      const customer = booking.getCustomer();
      if (!customer) {
        throw new Error(`Aucun client associé à la réservation ${bookingId}`);
      }
      
      const contactInfo = customer.getContactInfo();
      const email = contactInfo.getEmail();
      
      if (!email) {
        throw new Error(`Aucune adresse email trouvée pour le client de la réservation ${bookingId}`);
      }
      
      // Générer le PDF du devis
      let pdfPath: string;
      if (booking.getQuoteRequestId()) {
        // Si nous avons une demande de devis associée, générer le PDF à partir de celle-ci
        const quoteRequest = await this.quoteRequestRepository.findById(booking.getQuoteRequestId());
        if (quoteRequest) {
          pdfPath = await this.pdfService.generateQuotePDF(quoteRequest);
        } else {
          // Fallback: générer le PDF de réservation
          pdfPath = await this.pdfService.generateBookingPDF(booking);
        }
      } else {
        // Aucune demande de devis associée, générer le PDF de réservation
        pdfPath = await this.pdfService.generateBookingPDF(booking);
      }
      
      // Envoyer le PDF par email
      await this.emailService.sendQuoteConfirmation(
        booking.getQuoteRequestId() 
          ? await this.quoteRequestRepository.findById(booking.getQuoteRequestId())
          : null,
        pdfPath
      );
      
      console.log(`PDF généré et envoyé pour la réservation ${bookingId} à ${email}`);
      
      return;
    } catch (error) {
      console.error(`Erreur lors de la génération et de l'envoi du devis:`, error);
      throw new Error(
        `Échec de la génération et de l'envoi du devis: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Helper pour mapper les types
  private mapQuoteRequestTypeToQuoteType(type: QuoteRequestType): QuoteType {
    switch (type) {
      case QuoteRequestType.MOVING:
        return QuoteType.MOVING_QUOTE;
      case QuoteRequestType.PACK:
        return QuoteType.PACK;
      case QuoteRequestType.SERVICE:
        return QuoteType.SERVICE;
      default:
        throw new Error(`Type de demande de devis non supporté: ${type}`);
    }
  }

  /**
   * Récupération d'une réservation par ID avec ses détails spécifiques
   */
  async getBookingById(id: string): Promise<{ booking: Booking, details: Moving | Pack | Service | null }> {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new Error(`Réservation non trouvée: ${id}`);
    }
    
    let details: Moving | Pack | Service | null = null;
    
    // Récupérer les détails spécifiques selon le type
    switch (booking.getType()) {
      case BookingType.MOVING_QUOTE:
        details = await this.movingRepository.findByBookingId(booking.getId());
        break;
      case BookingType.PACK:
        details = await this.packRepository.findById(booking.getId());
        break;
      case BookingType.SERVICE:
        details = await this.serviceRepository.findById(booking.getId());
        break;
    }
    
    return { booking, details };
  }

  /**
   * Mise à jour d'une réservation
   */
  async updateBooking(id: string, dto: any): Promise<Booking> {
    const { booking } = await this.getBookingById(id);
    
    // Mettre à jour l'entité spécifique selon le type
    switch (booking.getType()) {
      case BookingType.MOVING_QUOTE:
        if (dto.moveDate || dto.pickupAddress || dto.deliveryAddress) {
          const moving = await this.movingRepository.findByBookingId(id);
          if (moving) {
            // Créer une nouvelle instance avec les données mises à jour
            const updatedMoving = new Moving(
              dto.moveDate || moving.getMoveDate(),
              dto.pickupAddress || moving.getPickupAddress(),
              dto.deliveryAddress || moving.getDeliveryAddress(),
              dto.distance || moving.getDistance(),
              dto.volume || moving.getVolume(),
              moving.getBookingId()
            );
            
            await this.movingRepository.update(moving.getId(), updatedMoving);
          }
        }
        break;
      case BookingType.PACK:
        // Mise à jour de Pack
        if (dto.scheduledDate || dto.pickupAddress || dto.deliveryAddress) {
          // Logique similaire pour Pack
        }
        break;
      case BookingType.SERVICE:
        // Mise à jour de Service
        if (dto.scheduledDate || dto.location) {
          // Logique similaire pour Service
        }
        break;
    }
    
    // Si le statut est mis à jour
    if (dto.status && dto.status !== booking.getStatus()) {
      await this.bookingRepository.updateStatus(id, dto.status);
    }
    
    // Récupérer la réservation mise à jour
    return this.bookingRepository.findById(id) as Promise<Booking>;
  }

  /**
   * Suppression d'une réservation
   */
  async deleteBooking(id: string): Promise<boolean> {
    const { booking, details } = await this.getBookingById(id);
    
    // Supprimer l'entité spécifique selon le type
    switch (booking.getType()) {
      case BookingType.MOVING_QUOTE:
        if (details) {
          await this.movingRepository.delete((details as Moving).getId());
        }
        break;
      case BookingType.PACK:
        if (details) {
          await this.packRepository.delete((details as Pack).getId());
        }
        break;
      case BookingType.SERVICE:
        if (details) {
          await this.serviceRepository.delete((details as Service).getId());
        }
        break;
    }
    
    // Mettre à jour le statut de la réservation à CANCELED
    await this.bookingRepository.updateStatus(id, BookingStatus.CANCELED);
    
    return true;
  }

  /**
   * Création d'un déménagement
   */
  private async createMoving(dto: any, bookingId: string): Promise<Moving> {
    console.log('🔄 [BookingService] Début createMoving pour BookingId:', bookingId);
    
    const moving = new Moving(
      new Date(dto.moveDate),
      dto.pickupAddress,
      dto.deliveryAddress,
      dto.distance || 0,
      dto.volume || 0,
      bookingId
    );
    
    const result = await this.movingRepository.save(moving);
    console.log('✅ [BookingService] Fin createMoving - Moving créé avec ID:', result.getId());
    return result;
  }

  /**
   * Création d'un pack
   */
  private async createPack(dto: any, bookingId: string): Promise<Pack> {
    console.log('🔄 [BookingService] Début createPack pour BookingId:', bookingId);
    
    const pack = new Pack(
      bookingId,
      dto.name || "Pack standard", // Nom du pack
      dto.description || "",
      new Money(dto.price || 0),
      dto.duration || 120, // Durée en minutes
      dto.workers || 2, // Nombre de travailleurs par défaut
      dto.includes || [],
      dto.features || [],
      dto.categoryId,
      dto.content,
      dto.imagePath,
      dto.includedDistance || 0,
      dto.distanceUnit || 'km',
      dto.workersNeeded || 2,
      dto.isAvailable !== false,
      dto.popular === true,
      bookingId, // bookingId
      dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
      dto.pickupAddress || "",
      dto.deliveryAddress || "",
      dto.distance || 0,
      dto.additionalInfo
    );
    
    const result = await this.packRepository.save(pack);
    console.log('✅ [BookingService] Fin createPack - Pack créé avec ID:', result.getId());
    return result;
  }

  /**
   * Création d'un service
   */
  private async createService(dto: any, bookingId: string): Promise<Service> {
    console.log('🔄 [BookingService] Début createService pour BookingId:', bookingId);
    
    const service = new Service(
      bookingId,
      dto.name || "Service standard",
      dto.description || "",
      new Money(dto.price || 0),
      dto.duration || 60, // durée par défaut de 60 minutes
      dto.workers || 1, // nombre de travailleurs par défaut
      dto.includes || [],
      bookingId, // bookingId
      dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
      dto.location || "",
      dto.additionalInfo,
      dto.options || {}
    );
    
    const result = await this.serviceRepository.save(service);
    console.log('✅ [BookingService] Fin createService - Service créé avec ID:', result.getId());
    return result;
  }

  /**
   * Trouve les réservations par client
   */
  async findBookingsByCustomer(customerId: string): Promise<Booking[]> {
    try {
      return this.bookingRepository.findByCustomerId(customerId);
    } catch (error) {
      console.error(`Erreur lors de la recherche des réservations par client ${customerId}:`, error);
      throw new Error(`Erreur lors de la recherche des réservations: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve les réservations par professionnel
   */
  async findBookingsByProfessional(professionalId: string): Promise<Booking[]> {
    try {
      return this.bookingRepository.findByProfessionalId(professionalId);
    } catch (error) {
      console.error(`Erreur lors de la recherche des réservations par professionnel ${professionalId}:`, error);
      throw new Error(`Erreur lors de la recherche des réservations: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve les réservations par statut
   */
  async findBookingsByStatus(status: BookingStatus): Promise<Booking[]> {
    try {
      return this.bookingRepository.findByStatus(status);
    } catch (error) {
      console.error(`Erreur lors de la recherche des réservations par statut ${status}:`, error);
      throw new Error(`Erreur lors de la recherche des réservations: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve les réservations par type
   */
  async findBookingsByType(type: BookingType): Promise<Booking[]> {
    try {
      // Si le repository n'a pas de méthode spécifique pour filtrer par type,
      // nous allons récupérer toutes les réservations et filtrer en mémoire
      const allBookings = await this.bookingRepository.findAll();
      return allBookings.filter(booking => booking.getType() === type);
    } catch (error) {
      console.error(`Erreur lors de la recherche des réservations par type ${type}:`, error);
      throw new Error(`Erreur lors de la recherche des réservations: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Traite le callback de paiement Stripe après une transaction réussie
   */
  async handlePaymentCallback(sessionId: string): Promise<Booking> {
    try {
      console.log(`Traitement du callback de paiement pour la session ${sessionId}`);
      
      // Récupérer les détails de la session de paiement depuis Stripe
      const stripePaymentService = new StripePaymentService(
        process.env.STRIPE_SECRET_KEY || '',
        process.env.FRONTEND_URL || ''
      );
      
      const sessionStatus = await stripePaymentService.checkSessionStatus(sessionId);
      
      if (sessionStatus.status !== 'paid') {
        throw new Error(`Session de paiement non payée: ${sessionId}`);
      }
      
      // Dans une implémentation réelle, nous utiliserions une méthode spécifique pour trouver la réservation
      // Pour le moment, nous allons simuler cette fonctionnalité en utilisant les méthodes existantes
      
      // Récupérer toutes les réservations et trouver celle qui correspond
      const allBookings = await this.bookingRepository.findAll();
      const booking = allBookings.find(booking => {
        // Simuler la recherche par sessionId - en réalité, vous pourriez avoir un champ dédié
        // ou une relation avec les transactions de paiement
        // @ts-ignore - Dans un cas réel, nous aurions une propriété pour stocker le sessionId
        return booking.paymentSessionId === sessionId || 
               // Vérifier aussi dans les métadonnées si disponibles
               (booking as any).metadata?.sessionId === sessionId;
      });
      
      if (!booking) {
        throw new Error(`Réservation introuvable pour la session de paiement ${sessionId}`);
      }
      
      // Mettre à jour le statut de la réservation
      booking.updateStatus(BookingStatus.PAYMENT_COMPLETED);
      await this.bookingRepository.updateStatus(booking.getId(), BookingStatus.PAYMENT_COMPLETED);
      
      console.log(`Paiement confirmé pour la réservation ${booking.getId()}`);
      
      return booking;
    } catch (error) {
      console.error('Erreur lors du traitement du callback de paiement:', error);
      throw new Error(`Erreur lors du traitement du callback de paiement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Crée une réservation en suivant le flux recommandé de manière fluide
   * @description Méthode de commodité optimisée qui enchaîne les étapes du flux de réservation
   * @param quoteData Données du devis (type, adresses, volume, etc.)
   * @param customerData Données du client (nom, prénom, email, téléphone)
   * @param paymentData Données de paiement (optionnel, pour flux express)
   * @returns Les informations appropriées selon l'étape atteinte
   */
  async createReservation(quoteData: any, customerData: any, paymentData?: any): Promise<any> {
    console.log('🔄 [BookingService] Début createReservation (flux combiné) avec type:', quoteData.type);
    
    try {
      // Étape 1: Créer une demande de devis
      const quoteRequest = await this.createQuoteRequest(quoteData);
      console.log('📝 [BookingService] QuoteRequest créé dans createReservation, ID:', quoteRequest.getId());
      
      // Si aucune donnée client n'est fournie, retourner juste la demande de devis
      if (!customerData) {
        return { quoteRequestId: quoteRequest.getId() };
      }
      
      // Étape 2: Créer un devis formel
      const quote = await this.createFormalQuote(quoteRequest.getId(), customerData);
      
      // Si aucune donnée de paiement n'est fournie, retourner le devis
      if (!paymentData) {
        return { quote, quoteRequestId: quoteRequest.getId() };
      }
      
      // Étape 3: Accepter le devis et initialiser le paiement
      const paymentSession = await this.acceptQuoteAndInitiatePayment(
        quoteRequest.getId(), // Nous utilisons l'ID de la demande comme ID du devis pour simplifier
        paymentData.paymentMethod || 'card'
      );
      
      // Si demandé, simuler un paiement réussi (utile pour les tests ou les flux express)
      if (paymentData.simulatePayment) {
        // Étape 4: Créer la réservation après paiement
        const booking = await this.createBookingAfterPayment(paymentSession.sessionId);
        return { booking, paymentCompleted: true };
      }
      
      // Sinon, retourner les informations de paiement pour redirection
      return { 
        quoteRequestId: quoteRequest.getId(),
        paymentSession,
        paymentCompleted: false
      };
    } catch (error) {
      console.error('❌ [BookingService] Erreur dans createReservation:', error);
      throw new Error(`Erreur lors de la création de la réservation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Gère l'échec d'un paiement
   * @param sessionId ID de la session de paiement ayant échoué
   * @returns La réservation mise à jour avec le statut PAYMENT_FAILED
   */
  async handlePaymentFailure(sessionId: string): Promise<Booking | null> {
    console.log('🔄 [BookingService] Traitement d\'un échec de paiement pour la session:', sessionId);
    
    try {
      // Récupérer les détails de la session
      const stripePaymentService = new StripePaymentService(
        process.env.STRIPE_SECRET_KEY || '',
        process.env.FRONTEND_URL || ''
      );
      
      const session = await stripePaymentService.retrieveCheckoutSession(sessionId);
      const bookingId = session.metadata?.bookingId;
      
      if (!bookingId) {
        console.error('❌ [BookingService] Impossible de trouver l\'ID de réservation dans les métadonnées');
        return null;
      }
      
      // Trouver la réservation correspondante
      const booking = await this.bookingRepository.findById(bookingId);
      if (!booking) {
        console.error('❌ [BookingService] Réservation non trouvée:', bookingId);
        return null;
      }
      
      // Mettre à jour le statut de la réservation
      booking.updateStatus(BookingStatus.PAYMENT_FAILED);
      await this.bookingRepository.updateStatus(bookingId, BookingStatus.PAYMENT_FAILED);
      
      // Enregistrer les détails de l'échec si disponibles
      if (session.payment_intent) {
        // TODO: Sauvegarder les détails de l'échec dans un log ou dans la réservation
        console.log(`❌ [BookingService] Échec de paiement pour l'intention: ${session.payment_intent}`);
      }
      
      // Envoyer une notification au client si nécessaire
      if (this.emailService && typeof this.emailService.sendPaymentFailedNotification === 'function') {
        try {
          const customer = booking.getCustomer();
          if (customer) {
            await this.emailService.sendPaymentFailedNotification(
              customer.getContactInfo().getEmail(), 
              { bookingId, sessionId }
            );
            console.log('📧 [BookingService] Notification d\'échec de paiement envoyée');
          }
        } catch (emailError) {
          console.error('❌ [BookingService] Erreur lors de l\'envoi de la notification:', emailError);
        }
      }
      
      console.log('✅ [BookingService] Fin du traitement d\'échec de paiement - Booking mis à jour');
      return booking;
    } catch (error) {
      console.error('❌ [BookingService] Erreur lors du traitement de l\'échec de paiement:', error);
      return null;
    }
  }
} 