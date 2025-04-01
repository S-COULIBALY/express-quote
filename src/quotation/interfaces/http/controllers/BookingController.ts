import { HttpRequest, HttpResponse } from '../types';
import { BookingService } from '../../../application/services/BookingService';
import { CustomerService } from '../../../application/services/CustomerService';
import { BookingStatus } from '../../../domain/enums/BookingStatus';
import { BookingType } from '../../../domain/enums/BookingType';
import { QuoteRequestStatus } from '../../../domain/enums/QuoteRequestStatus';
import { BookingRequestDTO, BookingResponseDTO } from '../dtos/BookingDTO';
import { validate } from '../validators/BookingValidator';

export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly customerService: CustomerService
  ) {}

  /**
   * Crée une demande de devis temporaire
   */
  async createQuoteRequest(req: HttpRequest, res: HttpResponse): Promise<HttpResponse> {
    try {
      const quoteData = req.body;
      
      // Créer la demande de devis
      const quoteRequest = await this.bookingService.createQuoteRequest(quoteData);
      
      // Construire la réponse
      const response = {
        temporaryId: quoteRequest.getTemporaryId(),
        id: quoteRequest.getId(),
        type: quoteRequest.getType(),
        status: quoteRequest.getStatus(),
        expiresAt: quoteRequest.getExpiresAt(),
        data: quoteRequest.getQuoteData()
      };
      
      return res.status(201).json(response);
    } catch (error) {
      console.error('Erreur lors de la création de la demande de devis:', error);
      return res.status(500).json({ 
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }
  }

  /**
   * Finalise une réservation avec les informations client
   */
  async finalizeBooking(req: HttpRequest, res: HttpResponse): Promise<HttpResponse> {
    try {
      const { quoteRequestId, customer } = req.body;
      
      // Finaliser la réservation
      const booking = await this.bookingService.finalizeBooking(quoteRequestId, customer);
      
      // Construire la réponse
      const response = this.buildBookingResponse(booking);
      
      return res.status(201).json(response);
    } catch (error) {
      console.error('Erreur lors de la finalisation de la réservation:', error);
      return res.status(500).json({ 
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }
  }

  /**
   * Traite le paiement d'une réservation
   */
  async processPayment(req: HttpRequest, res: HttpResponse): Promise<HttpResponse> {
    try {
      const { bookingId, paymentData } = req.body;
      
      // Traiter le paiement
      const booking = await this.bookingService.processPayment(bookingId, paymentData);
      
      // Générer et envoyer le devis
      await this.bookingService.generateAndSendQuote(bookingId);
      
      // Construire la réponse
      const response = this.buildBookingResponse(booking);
      
      return res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors du traitement du paiement:', error);
      return res.status(500).json({ 
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }
  }

  /**
   * Créer une nouvelle réservation
   */
  async createBooking(req: HttpRequest, res: HttpResponse): Promise<HttpResponse> {
    try {
      // Valider les données d'entrée
      const errors = validate(req.body);
      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      const bookingData: BookingRequestDTO = req.body;
      
      // Récupérer ou créer le client
      const customer = await this.customerService.findOrCreateCustomer({
        email: bookingData.customer.email,
        firstName: bookingData.customer.firstName,
        lastName: bookingData.customer.lastName,
        phone: bookingData.customer.phone
      });
      
      // Créer la réservation
      const booking = await this.bookingService.createBooking(bookingData, customer);
      
      // Construire la réponse
      const response = this.buildBookingResponse(booking);
      
      return res.status(201).json(response);
    } catch (error) {
      console.error('Erreur lors de la création de la réservation:', error);
      return res.status(500).json({ 
        message: `Erreur lors de la création de la réservation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }
  }

  /**
   * Récupérer plusieurs réservations avec filtres
   */
  async getBookings(req: HttpRequest, res: HttpResponse): Promise<HttpResponse> {
    try {
      const { customerId, professionalId, status, type } = req.query;
      
      let bookings;
      
      // Filtrer selon les paramètres fournis
      if (customerId) {
        bookings = await this.bookingService.findBookingsByCustomer(customerId as string);
      } else if (professionalId) {
        bookings = await this.bookingService.findBookingsByProfessional(professionalId as string);
      } else if (status) {
        bookings = await this.bookingService.findBookingsByStatus(status as BookingStatus);
      } else if (type) {
        bookings = await this.bookingService.findBookingsByType(type as BookingType);
      } else {
        // Par défaut, retourne les réservations confirmées
        bookings = await this.bookingService.findBookingsByStatus(BookingStatus.CONFIRMED);
      }
      
      if (!bookings || bookings.length === 0) {
        return res.status(404).json({ message: 'Aucune réservation trouvée' });
      }
      
      // Pour chaque réservation, récupérer les détails et sérialiser
      const bookingsWithDetails = await Promise.all(
        bookings.map(async (booking) => {
          const { details } = await this.bookingService.getBookingById(booking.getId());
          return this.buildBookingResponse(booking, details);
        })
      );
      
      return res.status(200).json(bookingsWithDetails);
    } catch (error) {
      console.error('Erreur lors de la récupération des réservations:', error);
      return res.status(500).json({ 
        message: `Erreur lors de la récupération des réservations: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }
  }

  /**
   * Récupérer une réservation par ID
   */
  async getBookingById(req: HttpRequest, res: HttpResponse): Promise<HttpResponse> {
    try {
      const { id } = req.params;
      
      // Récupérer la réservation avec ses détails
      const { booking, details } = await this.bookingService.getBookingById(id);
      
      // Construire la réponse
      const response = this.buildBookingResponse(booking, details);
      
      return res.status(200).json(response);
    } catch (error) {
      console.error(`Erreur lors de la récupération de la réservation ${req.params.id}:`, error);
      
      if ((error as Error).message.includes('non trouvée')) {
        return res.status(404).json({ message: `Réservation ${req.params.id} non trouvée` });
      }
      
      return res.status(500).json({ 
        message: `Erreur lors de la récupération de la réservation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }
  }

  /**
   * Mettre à jour une réservation
   */
  async updateBooking(req: HttpRequest, res: HttpResponse): Promise<HttpResponse> {
    try {
      const { id } = req.params;
      const bookingData = req.body;
      
      // Mettre à jour la réservation
      const booking = await this.bookingService.updateBooking(id, bookingData);
      
      // Construire la réponse
      const response = this.buildBookingResponse(booking);
      
      return res.status(200).json(response);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la réservation ${req.params.id}:`, error);
      
      if ((error as Error).message.includes('non trouvée')) {
        return res.status(404).json({ message: `Réservation ${req.params.id} non trouvée` });
      }
      
      return res.status(500).json({ 
        message: `Erreur lors de la mise à jour de la réservation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }
  }

  /**
   * Supprimer une réservation (marquer comme annulée)
   */
  async deleteBooking(req: HttpRequest, res: HttpResponse): Promise<HttpResponse> {
    try {
      const { id } = req.params;
      
      // Supprimer la réservation
      await this.bookingService.deleteBooking(id);
      
      return res.status(204).send();
    } catch (error) {
      console.error(`Erreur lors de la suppression de la réservation ${req.params.id}:`, error);
      
      if ((error as Error).message.includes('non trouvée')) {
        return res.status(404).json({ message: `Réservation ${req.params.id} non trouvée` });
      }
      
      return res.status(500).json({ 
        message: `Erreur lors de la suppression de la réservation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }
  }

  /**
   * Mettre à jour le statut d'une réservation
   */
  async updateBookingStatus(req: HttpRequest, res: HttpResponse): Promise<HttpResponse> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      // Valider le statut
      if (!Object.values(BookingStatus).includes(status)) {
        return res.status(400).json({ message: `Statut invalide: ${status}` });
      }
      
      // Mettre à jour le statut
      const booking = await this.bookingService.updateBooking(id, { status });
      
      // Construire la réponse
      const response = this.buildBookingResponse(booking);
      
      return res.status(200).json(response);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du statut de la réservation ${req.params.id}:`, error);
      
      if ((error as Error).message.includes('non trouvée')) {
        return res.status(404).json({ message: `Réservation ${req.params.id} non trouvée` });
      }
      
      return res.status(500).json({ 
        message: `Erreur lors de la mise à jour du statut: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }
  }

  /**
   * Construire la réponse pour une réservation
   */
  private buildBookingResponse(booking: any, details?: any): BookingResponseDTO {
    return {
      id: booking.getId(),
      type: booking.getType(),
      status: booking.getStatus(),
      customer: {
        id: booking.getCustomer().getId(),
        firstName: booking.getCustomer().getFirstName(),
        lastName: booking.getCustomer().getLastName(),
        email: booking.getCustomer().getEmail(),
        phone: booking.getCustomer().getPhone()
      },
      totalAmount: booking.getTotalAmount().getAmount(),
      createdAt: booking.getCreatedAt(),
      updatedAt: booking.getUpdatedAt(),
      details: details ? {
        ...details,
        // Ajout d'informations spécifiques selon le type
      } : undefined
    };
  }
} 