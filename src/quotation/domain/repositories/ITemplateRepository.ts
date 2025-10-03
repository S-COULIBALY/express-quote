import { Template } from '../entities/Template';

export interface ITemplateRepository {
  findAll(): Promise<Template[]>;
  findById(id: string): Promise<Template | null>;
  findByServiceType(serviceType: string): Promise<Template[]>;
  save(template: Template): Promise<Template>;
  update(id: string, template: Template): Promise<Template>;
  delete(id: string): Promise<boolean>;
  findWithItems(id: string): Promise<Template | null>;
} 