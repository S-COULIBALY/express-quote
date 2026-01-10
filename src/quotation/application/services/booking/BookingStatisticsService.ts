/**
 * 📊 BookingStatisticsService
 * 
 * Service responsable du calcul des statistiques des réservations :
 * - Statistiques par client
 * - Statistiques par professionnel
 * 
 * ✅ PHASE 3 - Extraction depuis BookingService
 */

import { IBookingRepository } from '../../../domain/repositories/IBookingRepository';
import { logger } from '@/lib/logger';

/**
 * Service de statistiques des réservations
 */
export class BookingStatisticsService {
  constructor(
    private readonly bookingRepository: IBookingRepository
  ) {}

  /**
   * Obtient les statistiques d'un client
   * 
   * @param customerId - L'ID du client
   * @returns Les statistiques du client
   */
  async getCustomerStats(customerId: string) {
    logger.info(`📊 Récupération des statistiques pour le client ${customerId}`);

    const stats = await this.bookingRepository.getBookingStatsByCustomer(customerId);
    logger.info(`✅ Statistiques récupérées pour le client ${customerId}:`, stats);
    
    return stats;
  }

  /**
   * Obtient les statistiques d'un professionnel
   * 
   * @param professionalId - L'ID du professionnel
   * @returns Les statistiques du professionnel
   */
  async getProfessionalStats(professionalId: string) {
    logger.info(`📊 Récupération des statistiques pour le professionnel ${professionalId}`);

    const stats = await this.bookingRepository.getBookingStatsByProfessional(professionalId);
    logger.info(`✅ Statistiques récupérées pour le professionnel ${professionalId}:`, stats);
    
    return stats;
  }
}

