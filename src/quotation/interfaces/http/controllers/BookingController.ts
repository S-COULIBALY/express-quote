import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '../../../application/services/BookingService';
import { CustomerService } from '../../../application/services/CustomerService';
import { BookingStatus } from '../../../domain/enums/BookingStatus';
import { BookingType } from '../../../domain/enums/BookingType';
import { BookingSearchCriteria } from '../../../domain/valueObjects/BookingSearchCriteria';
import { BookingSearchResult } from '../../../domain/repositories/IBookingRepository';
import { 
  BookingNotFoundError, 
  BookingAlreadyCancelledError,
  BookingCannotBeCancelledError,
  BookingUpdateNotAllowedError,
  BookingDeletionNotAllowedError
} from '../../../domain/errors/BookingErrors';
import { logger } from '@/lib/logger';
import { BaseApiController } from './BaseApiController';

/**
 * Contrôleur DDD pour la gestion des réservations
 * Orchestre les appels au BookingService en respectant l'architecture DDD
 */
export class BookingController extends BaseApiController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly customerService: CustomerService
  ) {
    super();
  }

  /**
   * POST /api/bookings/finalize - Finalise une réservation après paiement Stripe confirmé
   * ⚠️ Appelé UNIQUEMENT par le webhook Stripe (checkout.session.completed)
   */
  async finalizeBooking(request: NextRequest): Promise<NextResponse> {
    return this.handleRequest(request, async (data) => {
      // ✅ LOG DÉTAILLÉ: Données reçues du webhook Stripe
      logger.info('📥 ÉTAPE 1 (FINALIZE BOOKING): Données reçues du webhook Stripe:', {
        sessionId: data.sessionId,
        temporaryId: data.temporaryId,
        paymentIntentId: data.paymentIntentId,
        paymentStatus: data.paymentStatus,
        amount: data.amount,
        customerData: {
          firstName: data.customerData?.firstName,
          lastName: data.customerData?.lastName,
          email: data.customerData?.email,
          phone: data.customerData?.phone
        }
      });

      // Validation: Paiement doit être confirmé
      if (data.paymentStatus !== 'succeeded' && data.paymentStatus !== 'paid') {
        throw new Error(`Paiement non confirmé (status: ${data.paymentStatus})`);
      }

      // Validation: temporaryId requis
      if (!data.temporaryId) {
        throw new Error('temporaryId manquant');
      }

      // Validation: sessionId requis
      if (!data.sessionId) {
        throw new Error('sessionId manquant');
      }

      // Créer le Booking APRÈS paiement confirmé
      const booking = await this.bookingService.createBookingAfterPayment(
        data.sessionId,
        data.temporaryId,
        data.customerData
      );

      logger.info('✅ Booking créé après paiement confirmé:', {
        bookingId: booking.getId(),
        temporaryId: data.temporaryId,
        sessionId: data.sessionId
      });

      // 📧 NOTIFICATIONS envoyées ici dans createBookingAfterPayment:
      // - Email client (confirmation + reçu)
      // - Email professionnel (nouvelle mission)
      // - Notification admin (monitoring)

      return this.buildBookingResponse(booking, {
        message: '🎉 Réservation confirmée! Documents envoyés par email.'
      });
    });
  }

  /**
   * Méthode privée: Construction de réponse standardisée pour un Booking
   */
  private buildBookingResponse(booking: any, additionalData?: any) {
    return {
      success: true,
      data: {
        id: booking.getId(),
        type: booking.getType(),
        status: booking.getStatus(),
        customer: {
          id: booking.getCustomer().getId(),
          firstName: booking.getCustomer().getContactInfo().getFirstName(),
          lastName: booking.getCustomer().getContactInfo().getLastName(),
          email: booking.getCustomer().getEmail()
        },
        totalAmount: booking.getTotalAmount().getAmount(),
        createdAt: booking.getCreatedAt(),
        ...additionalData
      }
    };
  }

  /**
   * Méthode privée: Gestion centralisée des erreurs Booking
   */
  private handleBookingError(error: unknown): NextResponse {
    if (error instanceof BookingNotFoundError) {
      return NextResponse.json(
        { success: false, error: 'Réservation non trouvée' },
        { status: 404 }
      );
    }
    if (error instanceof BookingUpdateNotAllowedError) {
      return NextResponse.json(
        { success: false, error: 'Modification non autorisée' },
        { status: 422 }
      );
    }
    if (error instanceof BookingAlreadyCancelledError) {
      return NextResponse.json(
        { success: false, error: 'Cette réservation est déjà annulée' },
        { status: 422 }
      );
    }
    if (error instanceof BookingCannotBeCancelledError) {
      return NextResponse.json(
        { success: false, error: 'Cette réservation ne peut plus être annulée' },
        { status: 422 }
      );
    }
    if (error instanceof BookingDeletionNotAllowedError) {
      return NextResponse.json(
        { success: false, error: 'Suppression non autorisée' },
        { status: 422 }
      );
    }
    throw error;
  }

  /**
   * GET /api/bookings - Recherche des réservations avec critères
   */
  async searchBookings(request: NextRequest): Promise<NextResponse> {
    return this.handleRequest(request, async () => {
      const { searchParams } = new URL(request.url);
      
      const criteria: BookingSearchCriteria = {
        customerId: searchParams.get('customerId') || undefined,
        professionalId: searchParams.get('professionalId') || undefined,
        status: searchParams.get('status') as BookingStatus || undefined,
        type: searchParams.get('type') as BookingType || undefined,
        dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
        dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
        offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
      };
      
      logger.info('🔍 Recherche de réservations', { criteria });
      
      const result = await this.bookingService.searchBookings(criteria);
      
      return {
        success: true,
        data: {
          bookings: result.bookings.map(booking => ({
            id: booking.getId(),
            type: booking.getType(),
            status: booking.getStatus(),
            customer: {
              id: booking.getCustomer().getId(),
              firstName: booking.getCustomer().getContactInfo().getFirstName(),
              lastName: booking.getCustomer().getContactInfo().getLastName(),
              email: booking.getCustomer().getEmail()
            },
            totalAmount: booking.getTotalAmount().getAmount(),
            createdAt: booking.getCreatedAt()
          })),
          totalCount: result.totalCount,
          hasMore: result.hasMore
        }
      };
    });
  }

  /**
   * GET /api/bookings/{id} - Récupère une réservation par ID
   */
  async getBookingById(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    return this.handleRequest(request, async () => {
      const { id } = params;
      logger.info('🔍 Récupération d\'une réservation', { id });
      
      try {
        const booking = await this.bookingService.getBookingById(id);

        return this.buildBookingResponse(booking, {
          phone: booking.getCustomer().getContactInfo().getPhone(),
          updatedAt: booking.getUpdatedAt()
        });
      } catch (error) {
        return this.handleBookingError(error);
      }
    });
  }

  /**
   * PUT /api/bookings/{id} - Met à jour une réservation
   */
  async updateBooking(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    return this.handleRequest(request, async (data) => {
      const { id } = params;
      logger.info('🔄 Mise à jour d\'une réservation', { id, data });
      
      try {
        const booking = await this.bookingService.updateBooking(id, data);

        return this.buildBookingResponse(booking, {
          updatedAt: booking.getUpdatedAt()
        });
      } catch (error) {
        return this.handleBookingError(error);
      }
    });
  }

  /**
   * DELETE /api/bookings/{id} - Supprime une réservation
   */
  async deleteBooking(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    return this.handleRequest(request, async () => {
      const { id } = params;
      logger.info('🗑️ Suppression d\'une réservation', { id });
      
      try {
        await this.bookingService.deleteBooking(id);

        return {
          success: true,
          message: 'Réservation supprimée avec succès'
        };
      } catch (error) {
        return this.handleBookingError(error);
      }
    });
  }

  /**
   * POST /api/bookings/{id}/cancel - Annule une réservation
   */
  async cancelBooking(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    return this.handleRequest(request, async (data) => {
      const { id } = params;
      const { reason } = data || {};
      logger.info('🚫 Annulation d\'une réservation', { id, reason });
      
      try {
        await this.bookingService.cancelBooking(id, reason);

        return {
          success: true,
          message: 'Réservation annulée avec succès',
          cancelledAt: new Date().toISOString()
        };
      } catch (error) {
        return this.handleBookingError(error);
      }
    });
  }

  /**
   * GET /api/bookings/customer/{customerId} - Réservations d'un client
   */
  async getBookingsByCustomer(request: NextRequest, { params }: { params: { customerId: string } }): Promise<NextResponse> {
    return this.handleRequest(request, async () => {
      const { customerId } = params;
      logger.info('📋 Récupération des réservations d\'un client', { customerId });
      
      const bookings = await this.bookingService.getBookingsByCustomer(customerId);
      
      return {
        success: true,
        data: {
          customerId,
          count: bookings.length,
          bookings: bookings.map(booking => ({
            id: booking.getId(),
            type: booking.getType(),
            status: booking.getStatus(),
            totalAmount: booking.getTotalAmount().getAmount(),
            createdAt: booking.getCreatedAt(),
            updatedAt: booking.getUpdatedAt()
          }))
        }
      };
    });
  }

  /**
   * GET /api/bookings/professional/{professionalId} - Réservations d'un professionnel
   */
  async getBookingsByProfessional(request: NextRequest, { params }: { params: { professionalId: string } }): Promise<NextResponse> {
    return this.handleRequest(request, async () => {
      const { professionalId } = params;
      logger.info('📋 Récupération des réservations d\'un professionnel', { professionalId });
      
      const bookings = await this.bookingService.getBookingsByProfessional(professionalId);
      
      return {
        success: true,
        data: {
          professionalId,
          count: bookings.length,
          bookings: bookings.map(booking => ({
            id: booking.getId(),
            type: booking.getType(),
            status: booking.getStatus(),
            customer: {
              id: booking.getCustomer().getId(),
              firstName: booking.getCustomer().getContactInfo().getFirstName(),
              lastName: booking.getCustomer().getContactInfo().getLastName()
            },
            totalAmount: booking.getTotalAmount().getAmount(),
            createdAt: booking.getCreatedAt()
          }))
        }
      };
    });
  }

  /**
   * GET /api/bookings/stats/customer/{customerId} - Statistiques client
   */
  async getCustomerBookingStats(request: NextRequest, { params }: { params: { customerId: string } }): Promise<NextResponse> {
    return this.handleRequest(request, async () => {
      const { customerId } = params;
      logger.info('📊 Récupération des statistiques client', { customerId });
      
      const stats = await this.bookingService.getCustomerBookingStats(customerId);
      
      return {
        success: true,
        data: {
          customerId,
          stats
        }
      };
    });
  }

  /**
   * GET /api/bookings/stats/professional/{professionalId} - Statistiques professionnel
   */
  async getProfessionalBookingStats(request: NextRequest, { params }: { params: { professionalId: string } }): Promise<NextResponse> {
    return this.handleRequest(request, async () => {
      const { professionalId } = params;
      logger.info('📊 Récupération des statistiques professionnel', { professionalId });
      
      const stats = await this.bookingService.getProfessionalBookingStats(professionalId);
      
      return {
        success: true,
        data: {
          professionalId,
          stats
        }
      };
    });
  }

  /**
   * GET /api/bookings/count - Compte le nombre de réservations
   */
  async countBookings(request: NextRequest): Promise<NextResponse> {
    return this.handleRequest(request, async () => {
      const { searchParams } = new URL(request.url);
      
      let criteria: BookingSearchCriteria | undefined;
      if (searchParams.has('status') || searchParams.has('type') || searchParams.has('customerId')) {
        criteria = {
          status: searchParams.get('status') as BookingStatus || undefined,
          type: searchParams.get('type') as BookingType || undefined,
          customerId: searchParams.get('customerId') || undefined
        };
      }
      
      const count = await this.bookingService.countBookings(criteria);
      
      return {
        success: true,
        data: {
          count,
          criteria: criteria || 'all'
        }
      };
    });
  }

  /**
   * POST /api/bookings/{id}/services - Ajouter un service à une réservation
   */
  async addServiceToBooking(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    return this.handleRequest(request, async (data) => {
      const { id } = params;
      logger.info(`🔧 Ajout de service à la réservation ${id}`, data);
      
      try {
        const booking = await this.bookingService.getBookingById(id);
        
        // Valider les données du service
        const { serviceId, serviceName, servicePrice, serviceData } = data;
        if (!serviceId || !serviceName || !servicePrice) {
          return NextResponse.json(
            { success: false, error: 'serviceId, serviceName et servicePrice sont requis' },
            { status: 400 }
          );
        }

        // Logique d'ajout de service (à implémenter dans BookingService)
        const serviceRecord = {
          id: `service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          bookingId: id,
          serviceId,
          serviceName,
          servicePrice,
          serviceData: serviceData || {},
          createdAt: new Date().toISOString()
        };

        // Mettre à jour le montant total de la réservation
        const currentAmount = booking.getTotalAmount().getAmount();
        const newAmount = currentAmount + servicePrice;
        await this.bookingService.updateBooking(id, { totalAmount: newAmount });

        return {
          success: true,
          data: {
            service: serviceRecord,
            booking: {
              id: booking.getId(),
              totalAmount: newAmount,
              status: booking.getStatus()
            },
            message: 'Service ajouté avec succès'
          }
        };
      } catch (error) {
        return this.handleBookingError(error);
      }
    });
  }

  /**
   * GET /api/bookings/{id}/services - Récupérer les services d'une réservation
   */
  async getBookingServices(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    return this.handleRequest(request, async () => {
      const { id } = params;
      logger.info(`🔍 Récupération des services pour la réservation ${id}`);

      try {
        const booking = await this.bookingService.getBookingById(id);

        // Pour l'instant, retourner les services stockés dans additionalInfo
        // En production, il faudrait une table services séparée
        const services = []; // À implémenter selon le schéma DB

        return {
          success: true,
          data: {
            bookingId: id,
            services,
            totalServices: services.length,
            message: 'Services récupérés avec succès'
          }
        };
      } catch (error) {
        return this.handleBookingError(error);
      }
    });
  }
} 