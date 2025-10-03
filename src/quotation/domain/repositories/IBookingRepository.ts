import { Booking } from '../entities/Booking';
import { BookingStatus } from '../enums/BookingStatus';
import { BookingSearchCriteriaVO } from '../valueObjects/BookingSearchCriteria';

export interface BookingSearchResult {
    bookings: Booking[];
    totalCount: number;
    hasMore: boolean;
    offset: number;
    limit: number;
}

export interface IBookingRepository {
    save(booking: Booking): Promise<Booking>;
    findById(id: string): Promise<Booking | null>;
    findByCustomerId(customerId: string): Promise<Booking[]>;
    findByProfessionalId(professionalId: string): Promise<Booking[]>;
    findByStatus(status: BookingStatus): Promise<Booking[]>;
    update(booking: Booking): Promise<Booking>;
    updateStatus(id: string, status: BookingStatus): Promise<void>;
    findAll(): Promise<Booking[]>;
    
    // Nouvelles méthodes pour la recherche
    search(criteria: BookingSearchCriteriaVO): Promise<BookingSearchResult>;
    findByDateRange(startDate: Date, endDate: Date): Promise<Booking[]>;
    findByScheduledDateRange(startDate: Date, endDate: Date): Promise<Booking[]>;
    findByAmountRange(minAmount: number, maxAmount: number): Promise<Booking[]>;
    findByLocationSearch(locationQuery: string): Promise<Booking[]>;
    count(criteria?: BookingSearchCriteriaVO): Promise<number>;
    
    // Nouvelles méthodes pour l'annulation et la suppression
    softDelete(id: string): Promise<void>;
    hardDelete(id: string): Promise<void>;
    cancel(id: string, reason?: string): Promise<void>;
    restore(id: string): Promise<void>;
    
    // Méthodes d'existence et validation
    exists(id: string): Promise<boolean>;
    isOwnedByCustomer(id: string, customerId: string): Promise<boolean>;
    isOwnedByProfessional(id: string, professionalId: string): Promise<boolean>;
    canBeModified(id: string): Promise<boolean>;
    canBeCancelled(id: string): Promise<boolean>;
    canBeDeleted(id: string): Promise<boolean>;
    
    // Méthodes de statistiques
    getBookingStatsByCustomer(customerId: string): Promise<{
        total: number;
        byStatus: Record<BookingStatus, number>;
        totalAmount: number;
    }>;
    
    getBookingStatsByProfessional(professionalId: string): Promise<{
        total: number;
        byStatus: Record<BookingStatus, number>;
        totalAmount: number;
    }>;
} 