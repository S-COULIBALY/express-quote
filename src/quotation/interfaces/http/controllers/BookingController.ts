import { HttpRequest, HttpResponse } from '../types';
import { BookingService } from '../../../application/services/BookingService';
import { CustomerService } from '../../../application/services/CustomerService';
import { BookingStatus } from '../../../domain/enums/BookingStatus';
import { BookingType } from '../../../domain/enums/BookingType';
import { QuoteRequestStatus } from '../../../domain/enums/QuoteRequestStatus';
import { BookingRequestDTO, BookingResponseDTO } from '../dtos/BookingDTO';
import { validate } from '../validators/BookingValidator';
import { ServiceType } from '../../../domain/enums/ServiceType';

// Import les classes nécessaires pour le calcul de prix
// Chemin à ajuster selon la structure réelle du projet
import { QuoteCalculatorFactory } from '../../../application/factories/QuoteCalculatorFactory';
import { QuoteContext } from '../../../domain/valueObjects/QuoteContext';

export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly customerService: CustomerService
  ) {}

  /**
   * Crée une demande de devis temporaire
   * @description Première étape du flux de réservation recommandé. Cette méthode crée une demande de devis
   * sans informations client qui pourra être finalisée ultérieurement avec finalizeBooking.
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
   * @description Deuxième étape du flux de réservation recommandé. Cette méthode finalise une demande
   * de devis existante en y ajoutant les informations client pour créer une réservation complète.
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
   * @description Troisième étape du flux de réservation recommandé. Cette méthode traite
   * le paiement d'une réservation finalisée et génère les documents associés.
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
   * Crée une réservation complète en utilisant le flux recommandé
   * @description Cette méthode utilise le flux recommandé en deux étapes (createQuoteRequest puis finalizeBooking)
   * via la méthode createReservation du BookingService. Si des informations client sont fournies, la réservation
   * est complétée immédiatement. Sinon, une demande de devis temporaire est créée, à finaliser ultérieurement.
   */
  async createBooking(req: HttpRequest, res: HttpResponse): Promise<HttpResponse> {
    try {
      console.log('📌 CTRL - Données reçues du router:', JSON.stringify(req.body, null, 2));
      
      // Valider les données d'entrée
      const errors = validate(req.body);
      if (errors.length > 0) {
        console.error('❌ CTRL - Erreurs de validation:', errors);
        return res.status(400).json({ errors });
      }

      // Utiliser any pour éviter les problèmes de typage avec le DTO
      const bookingData: any = req.body;
      
      // Recalculer le prix côté serveur (sécurité)
      if (bookingData.type === 'service' && bookingData.calculatedPrice) {
        try {
          // Simulation d'un recalcul simplifié
          console.log('🔒 CTRL - Vérification du prix pour sécurité');
          
          // Calcul manuel pour vérification (méthode simplifiée)
          const basePrice = bookingData.basePrice || 0;
          const serviceDuration = bookingData.defaultDuration || 1;
          const serviceWorkers = bookingData.defaultWorkers || 1;
          
          const heuresSupp = Math.max(0, bookingData.duration - serviceDuration);
          const prixHeuresSupp = heuresSupp * (basePrice / serviceDuration);
          
          const travailleursSupp = Math.max(0, bookingData.workers - serviceWorkers);
          const prixTravailleursSupp = travailleursSupp * 50 * bookingData.duration;
          
          const serverCalculatedPrice = basePrice + prixHeuresSupp + prixTravailleursSupp;
          
          // Logguer les calculs pour debugging
          console.log('💲 CTRL - Calcul manuel du prix:', {
            basePrice,
            heuresSupp,
            prixHeuresSupp,
            travailleursSupp,
            prixTravailleursSupp,
            total: serverCalculatedPrice
          });
          
          // Compare avec le prix envoyé par le client
          if (Math.abs(bookingData.calculatedPrice - serverCalculatedPrice) > 1) {
            console.warn('⚠️ CTRL - Différence de prix détectée!', {
              prixClient: bookingData.calculatedPrice,
              prixServeur: serverCalculatedPrice,
              différence: serverCalculatedPrice - bookingData.calculatedPrice
            });
            
            // Remplacer par le prix serveur
            bookingData.calculatedPrice = serverCalculatedPrice;
            console.log('✅ CTRL - Prix recalculé appliqué:', serverCalculatedPrice);
          }
        } catch (error) {
          console.error('❌ CTRL - Erreur lors de la vérification du prix:', error);
          // Continue with the client price if calculation fails
          console.warn('⚠️ CTRL - Conservation du prix client:', bookingData.calculatedPrice);
        }
      }
      
      let result;
      
      // Si des informations client sont fournies, utiliser le flux createReservation (deux étapes en une)
      if (bookingData.customer) {
        console.log('ℹ️ CTRL - Données client reçues - Utilisation du flux recommandé createReservation');
        
        // Extraire les données client et du devis
        const { customer, ...quoteData } = bookingData;
        
        // Utiliser la méthode recommandée qui crée une demande puis la finalise
        result = await this.bookingService.createReservation(quoteData, customer);
        
        if (result.booking) {
          console.log('✅ CTRL - Réservation créée avec le flux recommandé, ID:', result.booking.getId());
          
          // Construire la réponse pour une réservation complète
          const response = this.buildBookingResponse(result.booking);
          return res.status(201).json(response);
        } else {
          console.log('✅ CTRL - Processus de réservation initié, ID de demande:', result.quoteRequestId);
          
          // Retourner les informations de processus de réservation
          return res.status(201).json({
            message: "Processus de réservation initié avec succès",
            quoteRequestId: result.quoteRequestId,
            paymentSession: result.paymentSession,
            paymentCompleted: result.paymentCompleted
          });
        }
      } else {
        console.log('ℹ️ CTRL - Aucune donnée client fournie - création d\'une demande de devis temporaire');
        
        // Créer une demande de devis temporaire en utilisant createQuoteRequest
        const quoteRequest = await this.bookingService.createQuoteRequest(bookingData);
        
        console.log('✅ CTRL - Demande de devis temporaire créée, ID:', quoteRequest.getId());
        
        // Préparer une réponse spéciale pour une demande de devis
        return res.status(201).json({
          message: "Demande de devis créée avec succès. Utilisez finalizeBooking pour compléter la réservation avec les données client.",
          quoteRequestId: quoteRequest.getId(),
          expiresAt: quoteRequest.getExpiresAt(),
          status: quoteRequest.getStatus()
        });
      }
    } catch (error) {
      console.error('❌ CTRL - Erreur complète lors de la création de la réservation:', error);
      return res.status(500).json({ 
        message: `Erreur lors de la création de la réservation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }
  }

  /**
   * Crée une réservation en une seule étape (méthode de commodité)
   * @description Cette méthode crée une réservation complète en une seule étape en combinant
   * la création d'une demande de devis et sa finalisation. Elle applique le flux recommandé
   * en utilisant la méthode createReservation en interne.
   */
  async createOneStepBooking(req: HttpRequest, res: HttpResponse): Promise<HttpResponse> {
    try {
      const { quoteData, customerData } = req.body;
      
      if (!quoteData || !customerData) {
        return res.status(400).json({
          message: "Les données du devis (quoteData) et du client (customerData) sont requises"
        });
      }
      
      // Utiliser la méthode createReservation qui implémente le flux recommandé
      const booking = await this.bookingService.createReservation(quoteData, customerData);
      
      // Construire la réponse
      const response = this.buildBookingResponse(booking);
      
      return res.status(201).json(response);
    } catch (error) {
      console.error('Erreur lors de la création de la réservation en une étape:', error);
      return res.status(500).json({ 
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
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