import { Entity } from './Entity';
import { Money } from '../valueObjects/Money';

/**
 * Entité Catalogue (CatalogSelection)
 * Représente un élément du catalogue public
 */
export class Catalogue extends Entity {
  private createdAt: Date;
  private updatedAt: Date;

  constructor(
    id: string,
    private itemId: string | null,
    private category: 'DEMENAGEMENT' | 'MENAGE' | 'TRANSPORT' | 'LIVRAISON',
    private subcategory: string | null,
    private displayOrder: number,
    private isActive: boolean,
    private isFeatured: boolean,
    private isPopular: boolean,
    private customPrice: Money | null,
    private customDescription: string | null,
    private tags: string[],
    private metadata: Record<string, any> | null,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id);
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  // Getters
  getItemId(): string | null {
    return this.itemId;
  }

  getCategory(): string {
    return this.category;
  }

  getSubcategory(): string | null {
    return this.subcategory;
  }

  getDisplayOrder(): number {
    return this.displayOrder;
  }

  isActiveCatalog(): boolean {
    return this.isActive;
  }

  isFeaturedCatalog(): boolean {
    return this.isFeatured;
  }

  isPopularCatalog(): boolean {
    return this.isPopular;
  }

  getCustomPrice(): Money | null {
    return this.customPrice;
  }

  getCustomDescription(): string | null {
    return this.customDescription;
  }

  getTags(): string[] {
    return [...this.tags];
  }

  getMetadata(): Record<string, any> | null {
    return this.metadata ? { ...this.metadata } : null;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Méthodes utilitaires
  private markAsUpdated(): void {
    this.updatedAt = new Date();
  }

  // Méthodes métier
  activate(): void {
    this.isActive = true;
    this.markAsUpdated();
  }

  deactivate(): void {
    this.isActive = false;
    this.markAsUpdated();
  }

  setFeatured(featured: boolean): void {
    this.isFeatured = featured;
    this.markAsUpdated();
  }

  setPopular(popular: boolean): void {
    this.isPopular = popular;
    this.markAsUpdated();
  }

  updateDisplayOrder(order: number): void {
    if (order < 0) {
      throw new Error('L\'ordre d\'affichage doit être positif');
    }
    this.displayOrder = order;
    this.markAsUpdated();
  }

  updateCategory(category: 'DEMENAGEMENT' | 'MENAGE' | 'TRANSPORT' | 'LIVRAISON'): void {
    this.category = category;
    this.markAsUpdated();
  }

  updateSubcategory(subcategory: string | null): void {
    this.subcategory = subcategory;
    this.markAsUpdated();
  }

  setCustomPrice(price: Money | null): void {
    this.customPrice = price;
    this.markAsUpdated();
  }

  setCustomDescription(description: string | null): void {
    this.customDescription = description;
    this.markAsUpdated();
  }

  addTag(tag: string): void {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.markAsUpdated();
    }
  }

  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index > -1) {
      this.tags.splice(index, 1);
      this.markAsUpdated();
    }
  }

  updateTags(tags: string[]): void {
    this.tags = [...tags];
    this.markAsUpdated();
  }

  updateMetadata(metadata: Record<string, any> | null): void {
    this.metadata = metadata;
    this.markAsUpdated();
  }

  // Validation
  validate(): void {
    if (!this.category) {
      throw new Error('La catégorie est obligatoire');
    }

    if (this.displayOrder < 0) {
      throw new Error('L\'ordre d\'affichage doit être positif');
    }

    if (this.customPrice && this.customPrice.getAmount() < 0) {
      throw new Error('Le prix personnalisé doit être positif');
    }
  }

  // Helper pour vérifier si l'élément est visible publiquement
  isPubliclyVisible(): boolean {
    return this.isActive;
  }

  // Helper pour les catégories
  static getValidCategories(): string[] {
    return ['DEMENAGEMENT', 'MENAGE', 'TRANSPORT', 'LIVRAISON'];
  }

  static isValidCategory(category: string): boolean {
    return this.getValidCategories().includes(category);
  }
}