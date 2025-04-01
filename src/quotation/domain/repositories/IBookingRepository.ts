import { Booking } from '../entities/Booking';
import { BookingStatus } from '../enums/BookingStatus';

export interface IBookingRepository {
    save(booking: Booking): Promise<Booking>;
    findById(id: string): Promise<Booking | null>;
    findByCustomerId(customerId: string): Promise<Booking[]>;
    findByProfessionalId(professionalId: string): Promise<Booking[]>;
    findByStatus(status: BookingStatus): Promise<Booking[]>;
    update(booking: Booking): Promise<Booking>;
    updateStatus(id: string, status: BookingStatus): Promise<void>;
    findAll(): Promise<Booking[]>;
} 