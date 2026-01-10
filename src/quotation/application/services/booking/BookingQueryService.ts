/**
 * 🔍 BookingQueryService
 * 
 * Service responsable de la recherche et lecture des réservations :
 * - Recherche avec critères
 * - Récupération par ID
 * - Récupération par client/professionnel
 * - Vérification d'existence
 * - Comptage
 * 
 * ✅ PHASE 3 - Extraction depuis BookingService
 */

import { Booking } from '../../../domain/entities/Booking';
import { IBookingRepository, BookingSearchResult } from '../../../domain/repositories/IBookingRepository';
import { BookingSearchCriteriaVO, BookingSearchCriteria } from '../../../domain/valueObjects/BookingSearchCriteria';
import { BookingNotFoundError } from '../../../domain/errors/BookingErrors';
import { logger } from '@/lib/logger';

/**
 * Service de recherche et lecture des réservations
 */
export class BookingQueryService {
  constructor(
    private readonly bookingRepository: IBookingRepository
  ) {}

  /**
   * Recherche des réservations selon des critères
   * 
   * @param criteria - Les critères de recherche
   * @returns Les résultats de recherche
   */
  async search(criteria: BookingSearchCriteria): Promise<BookingSearchResult> {
    logger.info('🔍 Recherche de réservations avec critères:', criteria);

    const searchCriteria = BookingSearchCriteriaVO.create(criteria);
    const result = await this.bookingRepository.search(searchCriteria);

    logger.info(`✅ ${result.bookings.length} réservations trouvées sur ${result.totalCount} total`);
    return result;
  }

  /**
   * Obtient les détails d'une réservation par ID
   * 
   * @param id - L'ID de la réservation
   * @returns La réservation trouvée
   * @throws BookingNotFoundError si la réservation n'existe pas
   */
  async getById(id: string): Promise<Booking> {
    logger.info(`🔍 Récupération de la réservation ${id}`);

    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new BookingNotFoundError(id);
    }

    return booking;
  }

  /**
   * Obtient toutes les réservations d'un client
   * 
   * @param customerId - L'ID du client
   * @returns La liste des réservations du client
   */
  async getByCustomer(customerId: string): Promise<Booking[]> {
    logger.info(`📋 Récupération des réservations pour le client ${customerId}`);

    const bookings = await this.bookingRepository.findByCustomerId(customerId);
    logger.info(`✅ ${bookings.length} réservations trouvées pour le client ${customerId}`);
    
    return bookings;
  }

  /**
   * Obtient toutes les réservations d'un professionnel
   * 
   * @param professionalId - L'ID du professionnel
   * @returns La liste des réservations du professionnel
   */
  async getByProfessional(professionalId: string): Promise<Booking[]> {
    logger.info(`📋 Récupération des réservations pour le professionnel ${professionalId}`);

    const bookings = await this.bookingRepository.findByProfessionalId(professionalId);
    logger.info(`✅ ${bookings.length} réservations trouvées pour le professionnel ${professionalId}`);
    
    return bookings;
  }

  /**
   * Vérifie si une réservation existe
   * 
   * @param id - L'ID de la réservation
   * @returns true si la réservation existe, false sinon
   */
  async exists(id: string): Promise<boolean> {
    return await this.bookingRepository.exists(id);
  }

  /**
   * Compte le nombre de réservations selon des critères
   * 
   * @param criteria - Les critères de recherche (optionnel)
   * @returns Le nombre de réservations
   */
  async count(criteria?: BookingSearchCriteria): Promise<number> {
    if (!criteria) {
      return await this.bookingRepository.count();
    }

    const searchCriteria = BookingSearchCriteriaVO.create(criteria);
    return await this.bookingRepository.count(searchCriteria);
  }

  /**
   * Vérifie si une réservation appartient à un client
   * 
   * @param bookingId - L'ID de la réservation
   * @param customerId - L'ID du client
   * @returns true si la réservation appartient au client, false sinon
   */
  async isOwnedByCustomer(bookingId: string, customerId: string): Promise<boolean> {
    return await this.bookingRepository.isOwnedByCustomer(bookingId, customerId);
  }

  /**
   * Vérifie si une réservation appartient à un professionnel
   * 
   * @param bookingId - L'ID de la réservation
   * @param professionalId - L'ID du professionnel
   * @returns true si la réservation appartient au professionnel, false sinon
   */
  async isOwnedByProfessional(bookingId: string, professionalId: string): Promise<boolean> {
    return await this.bookingRepository.isOwnedByProfessional(bookingId, professionalId);
  }
}

