/**
 * Interface du repository pour les templates de documents
 * Phase 4: Templates avancés et personnalisation
 */

import { Template } from '../entities/Template';

export interface TemplateSearchCriteria {
  documentType?: string;
  isActive?: boolean;
  isDefault?: boolean;
  tags?: string[];
  createdBy?: string;
  nameContains?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'version';
  sortOrder?: 'asc' | 'desc';
}

export interface ITemplateRepository {
  /**
   * Sauvegarde un template
   */
  save(template: Template): Promise<Template>;

  /**
   * Trouve un template par son ID
   */
  findById(id: string): Promise<Template | null>;

  /**
   * Trouve tous les templates selon les critères
   */
  findByCriteria(criteria: TemplateSearchCriteria): Promise<Template[]>;

  /**
   * Trouve le template par défaut pour un type de document
   */
  findDefaultByDocumentType(documentType: string): Promise<Template | null>;

  /**
   * Met à jour un template
   */
  update(template: Template): Promise<Template>;

  /**
   * Supprime un template
   */
  delete(id: string): Promise<boolean>;

  /**
   * Clone un template existant
   */
  clone(id: string, newName: string): Promise<Template>;

  /**
   * Définit un template comme template par défaut pour son type de document
   */
  setAsDefault(id: string): Promise<boolean>;

  /**
   * Active/désactive un template
   */
  setActive(id: string, isActive: boolean): Promise<boolean>;

  /**
   * Compte le nombre de templates selon les critères
   */
  countByCriteria(criteria: TemplateSearchCriteria): Promise<number>;

  /**
   * Récupère tous les types de documents disponibles
   */
  getAvailableDocumentTypes(): Promise<string[]>;

  /**
   * Récupère tous les tags utilisés
   */
  getAllTags(): Promise<string[]>;
}