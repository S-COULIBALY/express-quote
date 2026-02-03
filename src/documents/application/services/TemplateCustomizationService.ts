/**
 * Service de personnalisation avancée des templates
 * Phase 4: Templates avancés et personnalisation
 */

import { Template, TemplateField, TemplateSection, TemplateBranding } from '../../domain/entities/Template';
import { TemplateService } from './TemplateService';
import { logger } from '@/lib/logger';

export interface CustomizationProfile {
  id: string;
  name: string;
  description: string;
  branding: TemplateBranding;
  defaultFields: Record<string, any>;
  rules: CustomizationRule[];
  isActive: boolean;
}

export interface CustomizationRule {
  id: string;
  condition: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  };
  action: {
    type: 'show_field' | 'hide_field' | 'set_value' | 'change_style' | 'add_section';
    target: string;
    parameters: Record<string, any>;
  };
}

export interface DynamicContent {
  fieldId: string;
  content: string | number | Date;
  format?: {
    type: 'currency' | 'date' | 'number' | 'text';
    locale?: string;
    options?: Record<string, any>;
  };
}

export interface TemplatePersonalization {
  customBranding?: Partial<TemplateBranding>;
  fieldValues: Record<string, any>;
  dynamicContent: DynamicContent[];
  hiddenFields?: string[];
  customStyles?: Record<string, any>;
  conditionalSections?: {
    sectionId: string;
    condition: boolean;
    reason?: string;
  }[];
}

export class TemplateCustomizationService {
  private templateService: TemplateService;

  constructor() {
    this.templateService = new TemplateService();
  }

  /**
   * Applique une personnalisation complète à un template
   */
  async applyPersonalization(
    templateId: string,
    personalization: TemplatePersonalization,
    profileId?: string
  ): Promise<Template> {
    try {
      logger.info('🎨 Application de personnalisation au template', {
        templateId,
        profileId,
        fieldCount: Object.keys(personalization.fieldValues).length,
        hasCustomBranding: !!personalization.customBranding,
        hiddenFieldsCount: personalization.hiddenFields?.length || 0
      });

      // Récupérer le template de base
      const baseTemplate = await this.templateService.getTemplateById(templateId);
      if (!baseTemplate) {
        throw new Error(`Template ${templateId} non trouvé`);
      }

      // Appliquer le profil de personnalisation si fourni
      let personalizedTemplate = baseTemplate;
      if (profileId) {
        const profile = await this.getCustomizationProfile(profileId);
        if (profile && profile.isActive) {
          personalizedTemplate = await this.applyCustomizationProfile(personalizedTemplate, profile);
        }
      }

      // Appliquer le branding personnalisé
      if (personalization.customBranding) {
        personalizedTemplate = this.applyCustomBranding(personalizedTemplate, personalization.customBranding);
      }

      // Traiter les sections conditionnelles
      if (personalization.conditionalSections) {
        personalizedTemplate = this.processConditionalSections(personalizedTemplate, personalization.conditionalSections);
      }

      // Appliquer les champs masqués
      if (personalization.hiddenFields && personalization.hiddenFields.length > 0) {
        personalizedTemplate = this.hideFields(personalizedTemplate, personalization.hiddenFields);
      }

      // Traiter le contenu dynamique
      if (personalization.dynamicContent.length > 0) {
        personalizedTemplate = await this.processDynamicContent(personalizedTemplate, personalization.dynamicContent);
      }

      // Marquer comme personnalisé
      const finalTemplate = new Template(
        personalizedTemplate.id,
        personalizedTemplate.name,
        personalizedTemplate.documentType,
        personalizedTemplate.description,
        personalizedTemplate.layout,
        personalizedTemplate.sections,
        personalizedTemplate.branding,
        personalizedTemplate.isDefault,
        personalizedTemplate.isActive,
        personalizedTemplate.version,
        personalizedTemplate.createdAt,
        personalizedTemplate.updatedAt,
        personalizedTemplate.createdBy,
        personalizedTemplate.tags,
        {
          ...personalizedTemplate.metadata,
          personalized: true,
          personalizationApplied: new Date().toISOString(),
          fieldValues: personalization.fieldValues
        }
      );

      logger.info('✅ Personnalisation appliquée avec succès', {
        templateId: finalTemplate.id,
        sectionsCount: finalTemplate.sections.length,
        fieldsCount: finalTemplate.getAllFields().length
      });

      return finalTemplate;

    } catch (error) {
      logger.error('❌ Erreur lors de l\'application de la personnalisation', error as Error);
      throw error;
    }
  }

  /**
   * Applique un profil de personnalisation
   */
  private async applyCustomizationProfile(template: Template, profile: CustomizationProfile): Promise<Template> {
    logger.info('📋 Application du profil de personnalisation', {
      templateId: template.id,
      profileId: profile.id,
      rulesCount: profile.rules.length
    });

    let customizedTemplate = template;

    // Appliquer le branding du profil
    customizedTemplate = this.applyCustomBranding(customizedTemplate, profile.branding);

    // Appliquer les règles de personnalisation
    for (const rule of profile.rules) {
      customizedTemplate = await this.applyCustomizationRule(customizedTemplate, rule, profile.defaultFields);
    }

    return customizedTemplate;
  }

  /**
   * Applique une règle de personnalisation
   */
  private async applyCustomizationRule(
    template: Template,
    rule: CustomizationRule,
    defaultFields: Record<string, any>
  ): Promise<Template> {
    // Évaluer la condition
    const conditionMet = this.evaluateCondition(rule.condition, defaultFields);

    if (!conditionMet) {
      return template; // Ne pas appliquer la règle
    }

    logger.info('🔄 Application de la règle de personnalisation', {
      ruleId: rule.id,
      actionType: rule.action.type,
      target: rule.action.target
    });

    switch (rule.action.type) {
      case 'hide_field':
        return this.hideFields(template, [rule.action.target]);

      case 'show_field':
        return this.showField(template, rule.action.target);

      case 'set_value':
        return this.setFieldValue(template, rule.action.target, rule.action.parameters.value);

      case 'change_style':
        return this.changeFieldStyle(template, rule.action.target, rule.action.parameters);

      case 'add_section':
        return this.addSection(template, rule.action.parameters);

      default:
        logger.warn('⚠️ Action de règle non reconnue', { actionType: rule.action.type });
        return template;
    }
  }

  /**
   * Évalue une condition de règle
   */
  private evaluateCondition(condition: any, fieldValues: Record<string, any>): boolean {
    const fieldValue = fieldValues[condition.field];

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      default:
        return false;
    }
  }

  /**
   * Applique un branding personnalisé
   */
  private applyCustomBranding(template: Template, customBranding: Partial<TemplateBranding>): Template {
    const newBranding: TemplateBranding = {
      ...template.branding,
      ...customBranding,
      colors: { ...template.branding.colors, ...customBranding.colors },
      fonts: { ...template.branding.fonts, ...customBranding.fonts }
    };

    return new Template(
      template.id,
      template.name,
      template.documentType,
      template.description,
      template.layout,
      template.sections,
      newBranding,
      template.isDefault,
      template.isActive,
      template.version,
      template.createdAt,
      template.updatedAt,
      template.createdBy,
      template.tags,
      template.metadata
    );
  }

  /**
   * Masque des champs spécifiques
   */
  private hideFields(template: Template, fieldsToHide: string[]): Template {
    const updatedSections = template.sections.map(section => ({
      ...section,
      fields: section.fields.filter(field => !fieldsToHide.includes(field.id))
    }));

    return new Template(
      template.id,
      template.name,
      template.documentType,
      template.description,
      template.layout,
      updatedSections,
      template.branding,
      template.isDefault,
      template.isActive,
      template.version,
      template.createdAt,
      template.updatedAt,
      template.createdBy,
      template.tags,
      template.metadata
    );
  }

  /**
   * Affiche un champ (utile si précédemment masqué)
   */
  private showField(template: Template, fieldId: string): Template {
    // Pour l'instant, on retourne le template tel quel
    // Dans une implémentation plus avancée, on pourrait réintégrer des champs précédemment masqués
    return template;
  }

  /**
   * Définit la valeur par défaut d'un champ
   */
  private setFieldValue(template: Template, fieldId: string, value: any): Template {
    const updatedSections = template.sections.map(section => ({
      ...section,
      fields: section.fields.map(field => 
        field.id === fieldId ? { ...field, defaultValue: value } : field
      )
    }));

    return new Template(
      template.id,
      template.name,
      template.documentType,
      template.description,
      template.layout,
      updatedSections,
      template.branding,
      template.isDefault,
      template.isActive,
      template.version,
      template.createdAt,
      template.updatedAt,
      template.createdBy,
      template.tags,
      template.metadata
    );
  }

  /**
   * Change le style d'un champ
   */
  private changeFieldStyle(template: Template, fieldId: string, styleParameters: Record<string, any>): Template {
    const updatedSections = template.sections.map(section => ({
      ...section,
      fields: section.fields.map(field => 
        field.id === fieldId 
          ? { ...field, style: { ...field.style, ...styleParameters } }
          : field
      )
    }));

    return new Template(
      template.id,
      template.name,
      template.documentType,
      template.description,
      template.layout,
      updatedSections,
      template.branding,
      template.isDefault,
      template.isActive,
      template.version,
      template.createdAt,
      template.updatedAt,
      template.createdBy,
      template.tags,
      template.metadata
    );
  }

  /**
   * Ajoute une section au template
   */
  private addSection(template: Template, sectionParameters: Record<string, any>): Template {
    const newSection: TemplateSection = {
      id: `section_${Date.now()}`,
      name: sectionParameters.name || 'Nouvelle section',
      fields: sectionParameters.fields || [],
      repeatable: sectionParameters.repeatable || false,
      conditional: sectionParameters.conditional
    };

    const updatedSections = [...template.sections, newSection];

    return new Template(
      template.id,
      template.name,
      template.documentType,
      template.description,
      template.layout,
      updatedSections,
      template.branding,
      template.isDefault,
      template.isActive,
      template.version,
      template.createdAt,
      template.updatedAt,
      template.createdBy,
      template.tags,
      template.metadata
    );
  }

  /**
   * Traite les sections conditionnelles
   */
  private processConditionalSections(
    template: Template,
    conditionalSections: { sectionId: string; condition: boolean; reason?: string }[]
  ): Template {
    const updatedSections = template.sections.filter(section => {
      const conditional = conditionalSections.find(cs => cs.sectionId === section.id);
      return conditional ? conditional.condition : true; // Garder la section par défaut
    });

    return new Template(
      template.id,
      template.name,
      template.documentType,
      template.description,
      template.layout,
      updatedSections,
      template.branding,
      template.isDefault,
      template.isActive,
      template.version,
      template.createdAt,
      template.updatedAt,
      template.createdBy,
      template.tags,
      template.metadata
    );
  }

  /**
   * Traite le contenu dynamique
   */
  private async processDynamicContent(template: Template, dynamicContent: DynamicContent[]): Promise<Template> {
    const updatedSections = template.sections.map(section => ({
      ...section,
      fields: section.fields.map(field => {
        const dynamicField = dynamicContent.find(dc => dc.fieldId === field.id);
        if (dynamicField) {
          let processedContent = dynamicField.content;

          // Formater le contenu selon le type
          if (dynamicField.format) {
            processedContent = this.formatContent(dynamicField.content, dynamicField.format);
          }

          return { ...field, defaultValue: processedContent };
        }
        return field;
      })
    }));

    return new Template(
      template.id,
      template.name,
      template.documentType,
      template.description,
      template.layout,
      updatedSections,
      template.branding,
      template.isDefault,
      template.isActive,
      template.version,
      template.createdAt,
      template.updatedAt,
      template.createdBy,
      template.tags,
      template.metadata
    );
  }

  /**
   * Formate le contenu selon le type spécifié
   */
  private formatContent(content: any, format: DynamicContent['format']): string {
    if (!format) return String(content);

    const locale = format.locale || 'fr-FR';

    switch (format.type) {
      case 'currency':
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: 'EUR',
          ...format.options
        }).format(Number(content));

      case 'date':
        return new Intl.DateTimeFormat(locale, format.options).format(new Date(content));

      case 'number':
        return new Intl.NumberFormat(locale, format.options).format(Number(content));

      case 'text':
      default:
        return String(content);
    }
  }

  /**
   * Récupère un profil de personnalisation
   * TODO: Implémenter avec un repository dédié
   */
  private async getCustomizationProfile(profileId: string): Promise<CustomizationProfile | null> {
    // Pour l'instant, retourner un profil d'exemple
    // Dans une implémentation complète, ceci ferait appel à un CustomizationProfileRepository
    
    const exampleProfile: CustomizationProfile = {
      id: profileId,
      name: 'Profil Entreprise Premium',
      description: 'Personnalisation avancée pour les entreprises premium',
      branding: {
        colors: {
          primary: '#1f2937',
          secondary: '#374151',
          accent: '#f59e0b',
          text: '#111827',
          background: '#ffffff'
        },
        fonts: {
          primary: 'Inter',
          secondary: 'Inter',
          sizes: { title: 28, subtitle: 20, body: 12, caption: 10 }
        }
      },
      defaultFields: {},
      rules: [],
      isActive: true
    };

    return exampleProfile;
  }

  /**
   * Génère un aperçu du template personnalisé
   */
  async generatePreview(templateId: string, personalization: TemplatePersonalization): Promise<{
    previewUrl: string;
    fieldsCount: number;
    sectionsCount: number;
    estimatedSize: string;
  }> {
    try {
      logger.info('👀 Génération d\'aperçu du template personnalisé', { templateId });

      const personalizedTemplate = await this.applyPersonalization(templateId, personalization);

      // Simuler la génération d'aperçu
      const previewUrl = ''; // API templates supprimée (2026-02)
      const fieldsCount = personalizedTemplate.getAllFields().length;
      const sectionsCount = personalizedTemplate.sections.length;
      const estimatedSize = `${Math.ceil(fieldsCount * 0.5)}KB`; // Estimation simplifiée

      return {
        previewUrl,
        fieldsCount,
        sectionsCount,
        estimatedSize
      };

    } catch (error) {
      logger.error('❌ Erreur lors de la génération d\'aperçu', error as Error);
      throw error;
    }
  }
}