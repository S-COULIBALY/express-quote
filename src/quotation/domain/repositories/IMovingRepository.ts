import { Moving } from '../entities/Moving';

export interface IMovingRepository {
    findAll(): Promise<Moving[]>;
    findById(id: string): Promise<Moving | null>;
    findByBookingId(bookingId: string): Promise<Moving | null>;
    save(moving: Moving): Promise<Moving>;
    update(id: string, moving: Moving): Promise<Moving>;
    delete(id: string): Promise<boolean>;
} 