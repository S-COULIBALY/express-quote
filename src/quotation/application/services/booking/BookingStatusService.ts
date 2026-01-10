/**
 * 🔄 BookingStatusService
 * 
 * Service responsable de la validation des transitions de statut des réservations.
 * Implémente une machine à états pour garantir la cohérence des transitions.
 * 
 * ✅ PHASE 1 - Extraction depuis BookingService
 */

import { BookingStatus } from '../../../domain/entities/Booking';
import { BookingInvalidStatusTransitionError } from '../../../domain/errors/BookingErrors';

/**
 * Service de validation des transitions de statut
 */
export class BookingStatusService {
  /**
   * Définit les transitions valides pour chaque statut
   */
  private readonly validTransitions: Record<
    BookingStatus,
    BookingStatus[]
  > = {
    [BookingStatus.DRAFT]: [BookingStatus.CONFIRMED, BookingStatus.CANCELED],
    [BookingStatus.CONFIRMED]: [
      BookingStatus.AWAITING_PAYMENT,
      BookingStatus.CANCELED,
    ],
    [BookingStatus.AWAITING_PAYMENT]: [
      BookingStatus.PAYMENT_PROCESSING,
      BookingStatus.CANCELED,
    ],
    [BookingStatus.PAYMENT_PROCESSING]: [
      BookingStatus.PAYMENT_COMPLETED,
      BookingStatus.PAYMENT_FAILED,
    ],
    [BookingStatus.PAYMENT_FAILED]: [
      BookingStatus.AWAITING_PAYMENT,
      BookingStatus.CANCELED,
    ],
    [BookingStatus.PAYMENT_COMPLETED]: [
      BookingStatus.COMPLETED,
      BookingStatus.CANCELED,
    ],
    [BookingStatus.CANCELED]: [], // Aucune transition possible depuis CANCELED
    [BookingStatus.COMPLETED]: [], // Aucune transition possible depuis COMPLETED
  };

  /**
   * Valide une transition de statut
   * 
   * @param currentStatus - Le statut actuel
   * @param newStatus - Le nouveau statut souhaité
   * @throws BookingInvalidStatusTransitionError si la transition n'est pas valide
   */
  validateStatusTransition(
    currentStatus: BookingStatus,
    newStatus: BookingStatus
  ): void {
    const allowedTransitions = this.validTransitions[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      throw new BookingInvalidStatusTransitionError(
        'unknown',
        currentStatus,
        newStatus
      );
    }
  }

  /**
   * Vérifie si une transition est possible
   * 
   * @param currentStatus - Le statut actuel
   * @param newStatus - Le nouveau statut souhaité
   * @returns true si la transition est valide, false sinon
   */
  canTransitionTo(
    currentStatus: BookingStatus,
    newStatus: BookingStatus
  ): boolean {
    const allowedTransitions = this.validTransitions[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }

  /**
   * Retourne la liste des transitions valides depuis un statut
   * 
   * @param currentStatus - Le statut actuel
   * @returns La liste des statuts vers lesquels on peut transitionner
   */
  getValidTransitions(currentStatus: BookingStatus): BookingStatus[] {
    return this.validTransitions[currentStatus] || [];
  }

  /**
   * Vérifie si un statut est terminal (aucune transition possible)
   * 
   * @param status - Le statut à vérifier
   * @returns true si le statut est terminal, false sinon
   */
  isTerminalStatus(status: BookingStatus): boolean {
    return this.validTransitions[status]?.length === 0;
  }
}

/**
 * Instance singleton du service de statut
 */
export const bookingStatusService = new BookingStatusService();

