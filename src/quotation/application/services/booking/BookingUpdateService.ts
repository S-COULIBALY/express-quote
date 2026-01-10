/**
 * ✏️ BookingUpdateService
 * 
 * Service responsable de la mise à jour et annulation des réservations :
 * - Mise à jour de réservation
 * - Suppression de réservation
 * - Annulation de réservation
 * 
 * ✅ PHASE 3 - Extraction depuis BookingService
 */

import { Booking, BookingStatus } from '../../../domain/entities/Booking';
import { IBookingRepository } from '../../../domain/repositories/IBookingRepository';
import {
  BookingNotFoundError,
  BookingAlreadyCancelledError,
  BookingCannotBeCancelledError,
  BookingUpdateNotAllowedError,
  BookingDeletionNotAllowedError,
} from '../../../domain/errors/BookingErrors';
import { bookingStatusService } from './BookingStatusService';
import { logger } from '@/lib/logger';

/**
 * Service de mise à jour et annulation des réservations
 */
export class BookingUpdateService {
  constructor(
    private readonly bookingRepository: IBookingRepository
  ) {}

  /**
   * Met à jour une réservation existante
   * 
   * @param id - L'ID de la réservation
   * @param updateData - Les données à mettre à jour
   * @returns La réservation mise à jour
   * @throws BookingNotFoundError si la réservation n'existe pas
   * @throws BookingUpdateNotAllowedError si la réservation ne peut pas être modifiée
   */
  async update(id: string, updateData: any): Promise<Booking> {
    logger.info(`✏️ Mise à jour de la réservation ${id}`, updateData);

    const existingBooking = await this.bookingRepository.findById(id);
    if (!existingBooking) {
      throw new BookingNotFoundError(id);
    }

    // Vérifier si la réservation peut être modifiée
    const canBeModified = await this.bookingRepository.canBeModified(id);
    if (!canBeModified) {
      throw new BookingUpdateNotAllowedError(
        id,
        'Booking is in a state that cannot be modified'
      );
    }

    // Vérifier les transitions de statut valides
    if (updateData.status && updateData.status !== existingBooking.getStatus()) {
      bookingStatusService.validateStatusTransition(
        existingBooking.getStatus(),
        updateData.status
      );
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
   * 
   * @param id - L'ID de la réservation
   * @throws BookingNotFoundError si la réservation n'existe pas
   * @throws BookingDeletionNotAllowedError si la réservation ne peut pas être supprimée
   */
  async delete(id: string): Promise<void> {
    logger.info(`🗑️ Suppression de la réservation ${id}`);

    const existingBooking = await this.bookingRepository.findById(id);
    if (!existingBooking) {
      throw new BookingNotFoundError(id);
    }

    // Vérifier si la réservation peut être supprimée
    const canBeDeleted = await this.bookingRepository.canBeDeleted(id);
    if (!canBeDeleted) {
      throw new BookingDeletionNotAllowedError(
        id,
        'Booking cannot be deleted due to business rules'
      );
    }

    await this.bookingRepository.delete(id);
    logger.info(`✅ Réservation ${id} supprimée avec succès`);
  }

  /**
   * Annule une réservation (soft delete)
   * 
   * @param id - L'ID de la réservation
   * @param reason - La raison de l'annulation (optionnel)
   * @throws BookingNotFoundError si la réservation n'existe pas
   * @throws BookingAlreadyCancelledError si la réservation est déjà annulée
   * @throws BookingCannotBeCancelledError si la réservation ne peut pas être annulée
   */
  async cancel(id: string, reason?: string): Promise<void> {
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
      throw new BookingCannotBeCancelledError(
        id,
        'Booking cannot be cancelled at this stage'
      );
    }

    // Effectuer l'annulation en mettant à jour le statut
    existingBooking.updateStatus(BookingStatus.CANCELED);
    await this.bookingRepository.save(existingBooking);
    
    logger.info(`✅ Réservation ${id} annulée avec succès`);
  }
}

