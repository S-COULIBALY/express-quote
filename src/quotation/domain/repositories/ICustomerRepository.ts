import { Customer } from '../entities/Customer';

export interface ICustomerRepository {
  findAll(): Promise<Customer[]>;
  findById(id: string): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  save(customer: Customer): Promise<Customer>;
  update(id: string, customer: Customer): Promise<Customer>;
  delete(id: string): Promise<boolean>;
} 