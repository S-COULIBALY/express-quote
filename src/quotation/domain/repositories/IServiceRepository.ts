import { Service } from '../entities/Service';

export interface IServiceRepository {
  findAll(): Promise<Service[]>;
  findById(id: string): Promise<Service | null>;
  findByBookingId(bookingId: string): Promise<Service | null>;
  save(service: Service): Promise<Service>;
  update(id: string, service: Service): Promise<Service>;
  delete(id: string): Promise<boolean>;
} 