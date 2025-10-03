import { Catalogue } from '../entities/Catalogue';

export interface ICatalogueRepository {
  findAll(): Promise<Catalogue[]>;
  findById(id: string): Promise<Catalogue | null>;
  findByCategory(category: string): Promise<Catalogue[]>;
  findBySubcategory(category: string, subcategory: string): Promise<Catalogue[]>;
  findFeatured(): Promise<Catalogue[]>;
  findPopular(): Promise<Catalogue[]>;
  findActive(): Promise<Catalogue[]>;
  findByItemId(itemId: string): Promise<Catalogue[]>;
  findByTags(tags: string[]): Promise<Catalogue[]>;
  save(catalogue: Catalogue): Promise<Catalogue>;
  delete(id: string): Promise<boolean>;
  getNextDisplayOrder(category: string): Promise<number>;
  reorderCategory(category: string, catalogueIds: string[]): Promise<void>;
}