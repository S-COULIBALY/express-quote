import { Item } from '../entities/Item';

export interface IItemRepository {
  /**
   * Sauvegarde un item
   */
  save(item: Item): Promise<Item>;

  /**
   * Trouve un item par ID
   */
  findById(id: string): Promise<Item | null>;

  /**
   * Trouve tous les items d'une réservation
   */
  findByBookingId(bookingId: string): Promise<Item[]>;

  /**
   * Trouve tous les items d'un client
   */
  findByCustomerId(customerId: string): Promise<Item[]>;

  /**
   * Trouve tous les items basés sur un template
   */
  findByTemplateId(templateId: string): Promise<Item[]>;

  /**
   * Trouve tous les items actifs
   */
  findActive(): Promise<Item[]>;

  /**
   * Met à jour un item
   */
  update(id: string, item: Partial<Item>): Promise<Item>;

  /**
   * Supprime un item
   */
  delete(id: string): Promise<boolean>;

  /**
   * Trouve tous les items
   */
  findAll(): Promise<Item[]>;
} 