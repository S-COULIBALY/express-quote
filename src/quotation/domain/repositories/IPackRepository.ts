import { Pack } from '../entities/Pack';

export interface IPackRepository {
  findAll(): Promise<Pack[]>;
  findById(id: string): Promise<Pack | null>;
  findByBookingId(bookingId: string): Promise<Pack | null>;
  save(pack: Pack): Promise<Pack>;
  update(id: string, pack: Pack): Promise<Pack>;
  delete(id: string): Promise<boolean>;
} 