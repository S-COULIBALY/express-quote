/**
 * Interface pour le repository des professionnels
 * Migration vers le système Template/Item
 */
export default interface IProfessionalRepository {
  findAll(): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  create(professional: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
}

export type { IProfessionalRepository }; 