/**
 * Service de gestion des templates de documents
 * Phase 4: Templates avancés et personnalisation
 */

import { Template, TemplateLayout, TemplateSection, TemplateBranding, TemplateFormat, TemplateOrientation } from '../../domain/entities/Template';
import { ITemplateRepository, TemplateSearchCriteria } from '../../domain/repositories/ITemplateRepository';
import { DocumentType } from '../../domain/entities/Document';
import { PrismaTemplateRepository } from '../../infrastructure/repositories/PrismaTemplateRepository';
import { logger } from '@/lib/logger';

export interface TemplateCreationRequest {
  name: string;
  documentType: string;
  description: string;
  layout?: Partial<TemplateLayout>;
  sections: TemplateSection[];
  branding?: Partial<TemplateBranding>;
  isDefault?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface TemplateCustomizationOptions {
  branding?: Partial<TemplateBranding>;
  layout?: Partial<TemplateLayout>;
  fields?: Record<string, any>; // Valeurs des champs pour ce document spécifique
  hideEmptyFields?: boolean;
  customStyles?: Record<string, any>;
}

export class TemplateService {
  private templateRepository: ITemplateRepository;

  constructor() {
    this.templateRepository = new PrismaTemplateRepository();
  }

  /**
   * Crée un nouveau template
   */
  async createTemplate(request: TemplateCreationRequest): Promise<Template> {
    try {
      logger.info('📄 Création d\'un nouveau template', {
        name: request.name,
        documentType: request.documentType,
        sectionsCount: request.sections.length
      });

      // Génération de l'ID unique
      const templateId = `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Layout par défaut si non fourni
      const defaultLayout: TemplateLayout = {
        format: TemplateFormat.A4,
        orientation: TemplateOrientation.PORTRAIT,
        margins: { top: 50, right: 50, bottom: 50, left: 50 },
        header: { height: 80, showOnFirstPage: true, showOnAllPages: true },
        footer: { height: 60, showOnFirstPage: true, showOnAllPages: true }
      };

      // Branding par défaut si non fourni
      const defaultBranding: TemplateBranding = {
        colors: {
          primary: '#2563eb',
          secondary: '#64748b',
          accent: '#f59e0b',
          text: '#1e293b',
          background: '#ffffff'
        },
        fonts: {
          primary: 'Helvetica',
          secondary: 'Helvetica',
          sizes: { title: 24, subtitle: 18, body: 12, caption: 10 }
        }
      };

      const template = new Template(
        templateId,
        request.name,
        request.documentType,
        request.description,
        { ...defaultLayout, ...request.layout },
        request.sections,
        { ...defaultBranding, ...request.branding },
        request.isDefault || false,
        true,
        '1.0.0',
        new Date(),
        new Date(),
        undefined, // createdBy sera ajouté par le repository
        request.tags || [],
        request.metadata || {}
      );

      // Validation du template
      const validation = template.validate();
      if (!validation.isValid) {
        throw new Error(`Template invalide: ${validation.errors.join(', ')}`);
      }

      const savedTemplate = await this.templateRepository.save(template);

      logger.info('✅ Template créé avec succès', {
        id: savedTemplate.id,
        name: savedTemplate.name
      });

      return savedTemplate;

    } catch (error) {
      logger.error('❌ Erreur lors de la création du template', error as Error);
      throw error;
    }
  }

  /**
   * Récupère un template par son ID
   */
  async getTemplateById(id: string): Promise<Template | null> {
    try {
      return await this.templateRepository.findById(id);
    } catch (error) {
      logger.error('❌ Erreur lors de la récupération du template', error as Error);
      throw error;
    }
  }

  /**
   * Récupère le template par défaut pour un type de document
   */
  async getDefaultTemplate(documentType: string): Promise<Template | null> {
    try {
      return await this.templateRepository.findDefaultByDocumentType(documentType);
    } catch (error) {
      logger.error('❌ Erreur lors de la récupération du template par défaut', error as Error);
      throw error;
    }
  }

  /**
   * Recherche des templates selon des critères
   */
  async searchTemplates(criteria: TemplateSearchCriteria): Promise<Template[]> {
    try {
      return await this.templateRepository.findByCriteria(criteria);
    } catch (error) {
      logger.error('❌ Erreur lors de la recherche de templates', error as Error);
      throw error;
    }
  }

  /**
   * Clone un template existant
   */
  async cloneTemplate(id: string, newName: string): Promise<Template> {
    try {
      logger.info('📋 Clonage du template', { originalId: id, newName });

      const clonedTemplate = await this.templateRepository.clone(id, newName);

      logger.info('✅ Template cloné avec succès', {
        originalId: id,
        clonedId: clonedTemplate.id,
        newName
      });

      return clonedTemplate;

    } catch (error) {
      logger.error('❌ Erreur lors du clonage du template', error as Error);
      throw error;
    }
  }

  /**
   * Met à jour un template
   */
  async updateTemplate(template: Template): Promise<Template> {
    try {
      logger.info('📝 Mise à jour du template', { id: template.id, name: template.name });

      // Validation avant mise à jour
      const validation = template.validate();
      if (!validation.isValid) {
        throw new Error(`Template invalide: ${validation.errors.join(', ')}`);
      }

      const updatedTemplate = await this.templateRepository.update(template);

      logger.info('✅ Template mis à jour avec succès', { id: updatedTemplate.id });

      return updatedTemplate;

    } catch (error) {
      logger.error('❌ Erreur lors de la mise à jour du template', error as Error);
      throw error;
    }
  }

  /**
   * Définit un template comme template par défaut
   */
  async setAsDefault(id: string): Promise<boolean> {
    try {
      logger.info('⭐ Définition du template par défaut', { id });

      const success = await this.templateRepository.setAsDefault(id);

      if (success) {
        logger.info('✅ Template défini comme par défaut', { id });
      }

      return success;

    } catch (error) {
      logger.error('❌ Erreur lors de la définition du template par défaut', error as Error);
      throw error;
    }
  }

  /**
   * Active/désactive un template
   */
  async setTemplateActive(id: string, isActive: boolean): Promise<boolean> {
    try {
      logger.info('🔄 Modification du statut du template', { id, isActive });

      const success = await this.templateRepository.setActive(id, isActive);

      if (success) {
        logger.info('✅ Statut du template modifié', { id, isActive });
      }

      return success;

    } catch (error) {
      logger.error('❌ Erreur lors de la modification du statut', error as Error);
      throw error;
    }
  }

  /**
   * Supprime un template
   */
  async deleteTemplate(id: string): Promise<boolean> {
    try {
      logger.info('🗑️ Suppression du template', { id });

      const success = await this.templateRepository.delete(id);

      if (success) {
        logger.info('✅ Template supprimé avec succès', { id });
      }

      return success;

    } catch (error) {
      logger.error('❌ Erreur lors de la suppression du template', error as Error);
      throw error;
    }
  }

  /**
   * Applique des options de personnalisation à un template
   */
  async customizeTemplate(template: Template, options: TemplateCustomizationOptions): Promise<Template> {
    try {
      logger.info('🎨 Personnalisation du template', {
        templateId: template.id,
        hasCustomBranding: !!options.branding,
        hasCustomLayout: !!options.layout,
        hasFieldValues: !!options.fields
      });

      // Clone le template pour éviter de modifier l'original
      let customizedTemplate = template.clone();

      // Application du branding personnalisé
      if (options.branding) {
        customizedTemplate = new Template(
          customizedTemplate.id,
          customizedTemplate.name,
          customizedTemplate.documentType,
          customizedTemplate.description,
          customizedTemplate.layout,
          customizedTemplate.sections,
          { ...customizedTemplate.branding, ...options.branding },
          customizedTemplate.isDefault,
          customizedTemplate.isActive,
          customizedTemplate.version,
          customizedTemplate.createdAt,
          customizedTemplate.updatedAt,
          customizedTemplate.createdBy,
          customizedTemplate.tags,
          { ...customizedTemplate.metadata, customized: true }
        );
      }

      // Application du layout personnalisé
      if (options.layout) {
        customizedTemplate = new Template(
          customizedTemplate.id,
          customizedTemplate.name,
          customizedTemplate.documentType,
          customizedTemplate.description,
          { ...customizedTemplate.layout, ...options.layout },
          customizedTemplate.sections,
          customizedTemplate.branding,
          customizedTemplate.isDefault,
          customizedTemplate.isActive,
          customizedTemplate.version,
          customizedTemplate.createdAt,
          customizedTemplate.updatedAt,
          customizedTemplate.createdBy,
          customizedTemplate.tags,
          { ...customizedTemplate.metadata, customized: true }
        );
      }

      logger.info('✅ Template personnalisé avec succès', { templateId: template.id });

      return customizedTemplate;

    } catch (error) {
      logger.error('❌ Erreur lors de la personnalisation du template', error as Error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques des templates
   */
  async getTemplateStatistics(): Promise<{
    total: number;
    byDocumentType: Record<string, number>;
    activeCount: number;
    inactiveCount: number;
    defaultCount: number;
  }> {
    try {
      const allTemplates = await this.templateRepository.findByCriteria({});
      
      const stats = {
        total: allTemplates.length,
        byDocumentType: {} as Record<string, number>,
        activeCount: 0,
        inactiveCount: 0,
        defaultCount: 0
      };

      allTemplates.forEach(template => {
        // Comptage par type de document
        if (!stats.byDocumentType[template.documentType]) {
          stats.byDocumentType[template.documentType] = 0;
        }
        stats.byDocumentType[template.documentType]++;

        // Comptage des statuts
        if (template.isActive) stats.activeCount++;
        else stats.inactiveCount++;
        
        if (template.isDefault) stats.defaultCount++;
      });

      return stats;

    } catch (error) {
      logger.error('❌ Erreur lors du calcul des statistiques', error as Error);
      throw error;
    }
  }

  /**
   * Créer les templates par défaut pour tous les types de documents
   */
  async createDefaultTemplates(): Promise<Template[]> {
    try {
      logger.info('🏗️ Création des templates par défaut');

      const defaultTemplates: Template[] = [];
      const documentTypes = Object.values(DocumentType);

      for (const docType of documentTypes) {
        const existingDefault = await this.getDefaultTemplate(docType);
        
        if (!existingDefault) {
          const template = await this.createTemplate({
            name: `Template par défaut ${docType}`,
            documentType: docType,
            description: `Template standard pour les documents de type ${docType}`,
            sections: this.getDefaultSectionsForDocumentType(docType),
            isDefault: true,
            tags: ['default', docType.toLowerCase()]
          });
          
          defaultTemplates.push(template);
        }
      }

      logger.info('✅ Templates par défaut créés', { count: defaultTemplates.length });

      return defaultTemplates;

    } catch (error) {
      logger.error('❌ Erreur lors de la création des templates par défaut', error as Error);
      throw error;
    }
  }

  /**
   * Récupère les sections par défaut pour un type de document
   */
  private getDefaultSectionsForDocumentType(documentType: string): TemplateSection[] {
    // Sections par défaut basées sur le type de document
    const commonSections: TemplateSection[] = [
      {
        id: 'header',
        name: 'En-tête',
        fields: [
          {
            id: 'company_logo',
            type: 'image' as any,
            label: 'Logo de l\'entreprise',
            required: false,
            style: { width: 150, height: 50 },
            position: { x: 50, y: 50 }
          },
          {
            id: 'document_title',
            type: 'text' as any,
            label: 'Titre du document',
            required: true,
            style: { fontSize: 24, fontWeight: 'bold' },
            position: { x: 50, y: 120 }
          }
        ],
        repeatable: false
      },
      {
        id: 'customer_info',
        name: 'Informations client',
        fields: [
          {
            id: 'customer_name',
            type: 'text' as any,
            label: 'Nom du client',
            required: true,
            position: { x: 50, y: 180 }
          },
          {
            id: 'customer_address',
            type: 'text' as any,
            label: 'Adresse du client',
            required: false,
            position: { x: 50, y: 200 }
          }
        ],
        repeatable: false
      }
    ];

    // Sections spécifiques selon le type de document
    switch (documentType) {
      case DocumentType.QUOTE:
        return [
          ...commonSections,
          {
            id: 'quote_details',
            name: 'Détails du devis',
            fields: [
              {
                id: 'quote_number',
                type: 'text' as any,
                label: 'Numéro de devis',
                required: true,
                position: { x: 50, y: 250 }
              },
              {
                id: 'quote_date',
                type: 'date' as any,
                label: 'Date du devis',
                required: true,
                position: { x: 300, y: 250 }
              },
              {
                id: 'services_table',
                type: 'table' as any,
                label: 'Services',
                required: true,
                position: { x: 50, y: 300 }
              },
              {
                id: 'total_amount',
                type: 'currency' as any,
                label: 'Montant total',
                required: true,
                style: { fontSize: 16, fontWeight: 'bold' },
                position: { x: 400, y: 500 }
              }
            ],
            repeatable: false
          }
        ];
        
      case DocumentType.INVOICE:
        return [
          ...commonSections,
          {
            id: 'invoice_details',
            name: 'Détails de la facture',
            fields: [
              {
                id: 'invoice_number',
                type: 'text' as any,
                label: 'Numéro de facture',
                required: true,
                position: { x: 50, y: 250 }
              },
              {
                id: 'invoice_date',
                type: 'date' as any,
                label: 'Date de facturation',
                required: true,
                position: { x: 300, y: 250 }
              },
              {
                id: 'due_date',
                type: 'date' as any,
                label: 'Date d\'échéance',
                required: true,
                position: { x: 450, y: 250 }
              }
            ],
            repeatable: false
          }
        ];
        
      default:
        return commonSections;
    }
  }
}