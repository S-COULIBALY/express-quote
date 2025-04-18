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
import { packRules } from '../../domain/valueObjects/packRules';
import { serviceRules } from '../../domain/valueObjects/serviceRules';
import { movingRules } from '../../domain/services/rules/movingRules';
import { StripePaymentService } from '../../infrastructure/services/StripePaymentService';

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
    private readonly emailService: any
  ) {}

  /**
   * Crée une demande de devis temporaire (sans client)
   */
  async createQuoteRequest(dto: any): Promise<QuoteRequest> {
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
    
    // Sauvegarder la demande
    const savedQuoteRequest = await this.quoteRequestRepository.save(quoteRequest);
    
    // Créer l'entité spécifique selon le type (Moving, Pack, Service)
    switch (type) {
        case QuoteRequestType.MOVING:
            await this.createMovingQuote(dto, savedQuoteRequest.getId());
            break;
        case QuoteRequestType.PACK:
            await this.createPackQuote(dto, savedQuoteRequest.getId());
            break;
        case QuoteRequestType.SERVICE:
            await this.createServiceQuote(dto, savedQuoteRequest.getId());
            break;
    }
    
    return savedQuoteRequest;
  }

  /**
   * Crée un devis de déménagement temporaire
   */
  private async createMovingQuote(dto: any, quoteRequestId: string): Promise<Moving> {
    const moving = new Moving(
      new Date(dto.moveDate),
      dto.pickupAddress,
      dto.deliveryAddress,
      dto.distance || 0,
      dto.volume || 0,
      quoteRequestId
    );
    
    return this.movingRepository.save(moving);
  }

  /**
   * Crée un devis de pack temporaire
   */
  private async createPackQuote(dto: any, quoteRequestId: string): Promise<Pack> {
    const pack = new Pack(
      quoteRequestId,
      dto.name,
      dto.type ? dto.type as PackType : PackType.STANDARD,
      dto.description,
      new Money(dto.price || 0),
      dto.includes || [],
      quoteRequestId,
      dto.customOptions || {}
    );
    
    return this.packRepository.save(pack);
  }

  /**
   * Crée un devis de service temporaire
   */
  private async createServiceQuote(dto: any, quoteRequestId: string): Promise<Service> {
    const service = new Service(
      quoteRequestId,
      ServiceType.MOVING,
      dto.description || "",
      dto.duration || 60, // durée par défaut de 60 minutes
      new Money(dto.price || 0),
      dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
      quoteRequestId
    );
    
    return this.serviceRepository.save(service);
  }

  /**
   * Convertit une demande de devis en réservation avec les informations client
   */
  async finalizeBooking(quoteRequestId: string, customerData: any): Promise<Booking> {
    // Récupérer la demande de devis
    const quoteRequest = await this.quoteRequestRepository.findById(quoteRequestId);
    if (!quoteRequest) {
        throw new Error(`Demande de devis non trouvée: ${quoteRequestId}`);
    }
    
    // Vérifier que la demande n'a pas expiré
    if (quoteRequest.isExpired()) {
        throw new Error('Cette demande de devis a expiré');
    }
    
    // Créer ou récupérer le client
    const customer = await this.customerService.findOrCreateCustomer({
      email: customerData.email,
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      phone: customerData.phone
    });
    
    // Récupérer les données de devis
    const quoteData = quoteRequest.getQuoteData();
    
    // Créer le devis final
    const quoteType = this.mapQuoteRequestTypeToQuoteType(quoteRequest.getType());
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
    
    // Créer la réservation
    const booking = Booking.fromQuoteRequest(
      quoteRequest,
      customer,
      quote,
      new Money(quoteData.totalAmount || 0),
      quoteData.paymentMethod
    );
    
    // Mettre à jour le statut de la demande
    await this.quoteRequestRepository.updateStatus(
      quoteRequestId, 
      QuoteRequestStatus.CONVERTED
    );
    
    // Sauvegarder la réservation
    return this.bookingRepository.save(booking);
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
    const { booking, details } = await this.getBookingById(bookingId);
    
    // TODO: Logique de génération du PDF
    
    // TODO: Logique d'envoi par email
    
    console.log(`PDF généré et envoyé pour la réservation ${bookingId}`);
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
   * Création unifiée d'une réservation basée sur son type (CREATION DIRECTE)
   */
  async createBooking(dto: any, customer: Customer, professional?: Professional): Promise<Booking> {
    const { type } = dto;
    
    // Validation du type de réservation
    if (!Object.values(BookingType).includes(type)) {
      throw new Error(`Type de réservation invalide: ${type}`);
    }
    
    // Calculer le devis et le montant total selon le type de réservation
    let totalAmount = new Money(0);
    const contactInfo = customer.getContactInfo();
    let quoteProps: any = {
      type: type === BookingType.MOVING_QUOTE ? QuoteType.MOVING_QUOTE : 
            type === BookingType.PACK ? QuoteType.PACK : QuoteType.SERVICE,
      status: QuoteStatus.DRAFT,
      customer: {
        id: customer.getId(),
        firstName: contactInfo.getFirstName(),
        lastName: contactInfo.getLastName(),
        email: contactInfo.getEmail(),
        phone: contactInfo.getPhone() || ''
      }
    };
    
    // Création du contexte selon le type de réservation
    let context: QuoteContext;
    
    switch (type) {
      case BookingType.MOVING_QUOTE:
        // Contexte pour déménagement
        context = new QuoteContext({
          serviceType: ServiceType.MOVING,
        volume: dto.volume || 0,
        distance: dto.distance || 0,
          pickupAddress: new Address(
            dto.pickupAddress,
            dto.pickupCity,
            dto.pickupPostalCode,
            dto.pickupCountry,
            dto.pickupFloor || 0,
            dto.pickupElevator || false,
            dto.pickupCarryDistance || 0,
            dto.pickupCoordinates
          ),
          deliveryAddress: new Address(
            dto.deliveryAddress,
            dto.deliveryCity,
            dto.deliveryPostalCode,
            dto.deliveryCountry,
            dto.deliveryFloor || 0,
            dto.deliveryElevator || false,
            dto.deliveryCarryDistance || 0,
            dto.deliveryCoordinates
          ),
          contactInfo: new ContactInfo(
            dto.firstName,
            dto.lastName,
            dto.email,
            dto.phone
          ),
          preferredDate: new Date(dto.moveDate),
          options: {
            packaging: dto.packaging || false,
            furniture: dto.furniture || false,
            fragile: dto.fragile || false,
            storage: dto.storage || false,
            disassembly: dto.disassembly || false,
            unpacking: dto.unpacking || false,
            supplies: dto.supplies || false,
            fragileItems: dto.fragileItems || false
          }
        });
        break;
      
      case BookingType.PACK:
        // Contexte pour pack
        context = new QuoteContext({
          serviceType: ServiceType.PACK,
          basePrice: dto.price || 0,
          duration: dto.duration || 1,
          workers: dto.workers || 2,
          distance: dto.distance || 0,
          bookingDate: new Date(),
          serviceDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
          address: new Address(
            dto.address,
            dto.city,
            dto.postalCode,
            dto.country,
            dto.floor || 0,
            dto.elevator || false,
            dto.carryDistance || 0,
            dto.coordinates
          ),
          contactInfo: new ContactInfo(
            dto.firstName,
            dto.lastName,
            dto.email,
            dto.phone
          ),
          options: dto.options || {}
        });
        break;
        
      case BookingType.SERVICE:
        // Contexte pour service
        context = new QuoteContext({
          serviceType: ServiceType.SERVICE,
          basePrice: dto.price || 0,
          duration: dto.duration || 1,
          defaultDuration: dto.defaultDuration || 1,
          workers: dto.workers || 1,
          defaultWorkers: dto.defaultWorkers || 1,
          bookingDate: new Date(),
          serviceDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
          address: new Address(
            dto.address,
            dto.city,
            dto.postalCode,
            dto.country,
            dto.floor || 0,
            dto.elevator || false,
            dto.carryDistance || 0,
            dto.coordinates
          ),
          contactInfo: new ContactInfo(
            dto.firstName,
            dto.lastName,
            dto.email,
            dto.phone
          ),
          options: dto.options || {}
        });
        break;
        
      default:
        throw new Error(`Type de réservation non supporté: ${type}`);
    }
    
    // Utiliser le calculateur unifié avec le contexte adapté au type
    const calculatedQuote = await this.quoteCalculator.calculate(context);
    totalAmount = calculatedQuote.getTotalPrice();
    quoteProps = { ...quoteProps, totalAmount: calculatedQuote.getTotalPrice() };
    
    // Créer la réservation principale
    const quote = new Quote(quoteProps);
    const booking = new Booking(
      type,
      customer,
      quote,
      totalAmount,
      dto.paymentMethod,
      professional
    );
    
    // Sauvegarder la réservation
    const savedBooking = await this.bookingRepository.save(booking);
    
    // Créer et sauvegarder l'entité spécifique selon le type
    switch (type) {
      case BookingType.MOVING_QUOTE:
        await this.createMoving(dto, savedBooking.getId());
        break;
      case BookingType.PACK:
        await this.createPack(dto, savedBooking.getId());
        break;
      case BookingType.SERVICE:
        await this.createService(dto, savedBooking.getId());
        break;
    }
    
    return savedBooking;
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
    const moving = new Moving(
      new Date(dto.moveDate),
      dto.pickupAddress,
      dto.deliveryAddress,
      dto.distance || 0,
      dto.volume || 0,
      bookingId
    );
    
    return this.movingRepository.save(moving);
  }

  /**
   * Création d'un pack
   */
  private async createPack(dto: any, bookingId: string): Promise<Pack> {
    const pack = new Pack(
      bookingId,
      dto.name,
      dto.type ? dto.type as PackType : PackType.STANDARD,
      dto.description,
      new Money(dto.price || 0),
      dto.includes || [],
      bookingId,
      dto.pickupAddress || "",
      dto.deliveryAddress || "",
      dto.distance || 0,
      dto.includedDistance || 20,
      dto.customOptions || {}
    );
    
    return this.packRepository.save(pack);
  }

  /**
   * Création d'un service
   */
  private async createService(dto: any, bookingId: string): Promise<Service> {
    const service = new Service(
      bookingId,
      dto.serviceType || ServiceType.SERVICE,
      dto.description || "",
      dto.duration || 60, // durée par défaut de 60 minutes
      new Money(dto.price || 0),
      dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
      bookingId
    );
    
    return this.serviceRepository.save(service);
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
} 