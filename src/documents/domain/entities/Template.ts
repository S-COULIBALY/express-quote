/**
 * Template - Entité pour la gestion des templates de documents personnalisés
 * Phase 4: Templates avancés et personnalisation
 */

export enum TemplateFormat {
  A4 = 'A4',
  A5 = 'A5',
  LETTER = 'LETTER',
  CUSTOM = 'CUSTOM'
}

export enum TemplateOrientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape'
}

export enum TemplateFieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  CURRENCY = 'currency',
  IMAGE = 'image',
  SIGNATURE = 'signature',
  TABLE = 'table',
  CHECKBOX = 'checkbox',
  BARCODE = 'barcode',
  QR_CODE = 'qr_code'
}

export interface TemplateField {
  id: string;
  type: TemplateFieldType;
  label: string;
  required: boolean;
  defaultValue?: any;
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    format?: string;
  };
  style?: {
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    color?: string;
    alignment?: 'left' | 'center' | 'right';
    width?: number;
    height?: number;
  };
  position?: {
    x: number;
    y: number;
    page?: number;
  };
}

export interface TemplateSection {
  id: string;
  name: string;
  fields: TemplateField[];
  repeatable: boolean;
  conditional?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  };
}

export interface TemplateLayout {
  format: TemplateFormat;
  orientation: TemplateOrientation;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  customDimensions?: {
    width: number;
    height: number;
  };
  header?: {
    height: number;
    showOnFirstPage: boolean;
    showOnAllPages: boolean;
  };
  footer?: {
    height: number;
    showOnFirstPage: boolean;
    showOnAllPages: boolean;
  };
}

export interface TemplateBranding {
  logo?: {
    url: string;
    width: number;
    height: number;
    position: { x: number; y: number };
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  fonts: {
    primary: string;
    secondary: string;
    sizes: {
      title: number;
      subtitle: number;
      body: number;
      caption: number;
    };
  };
  watermark?: {
    text: string;
    opacity: number;
    rotation: number;
  };
}

export class Template {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly documentType: string,
    public readonly description: string,
    public readonly layout: TemplateLayout,
    public readonly sections: TemplateSection[],
    public readonly branding: TemplateBranding,
    public readonly isDefault: boolean = false,
    public readonly isActive: boolean = true,
    public readonly version: string = '1.0.0',
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly createdBy?: string,
    public readonly tags: string[] = [],
    public readonly metadata?: Record<string, any>
  ) {}

  /**
   * Clone un template pour créer une nouvelle version
   */
  clone(newName?: string): Template {
    return new Template(
      `${this.id}_clone_${Date.now()}`,
      newName || `${this.name} (Copie)`,
      this.documentType,
      this.description,
      { ...this.layout },
      this.sections.map(section => ({ ...section })),
      { ...this.branding },
      false, // La copie n'est jamais par défaut
      true,
      '1.0.0', // Nouvelle version
      new Date(),
      new Date(),
      this.createdBy,
      [...this.tags],
      { ...this.metadata }
    );
  }

  /**
   * Valide la structure du template
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validation des champs requis
    if (!this.name.trim()) errors.push('Le nom du template est requis');
    if (!this.documentType) errors.push('Le type de document est requis');
    if (this.sections.length === 0) errors.push('Au moins une section est requise');

    // Validation des sections
    this.sections.forEach((section, sIndex) => {
      if (!section.name.trim()) {
        errors.push(`Section ${sIndex + 1}: Le nom est requis`);
      }
      
      section.fields.forEach((field, fIndex) => {
        if (!field.label.trim()) {
          errors.push(`Section "${section.name}", champ ${fIndex + 1}: Le label est requis`);
        }
        if (!field.id.trim()) {
          errors.push(`Section "${section.name}", champ ${fIndex + 1}: L'ID est requis`);
        }
      });
    });

    // Validation des couleurs du branding
    const colorRegex = /^#[0-9A-F]{6}$/i;
    Object.entries(this.branding.colors).forEach(([key, color]) => {
      if (!colorRegex.test(color)) {
        errors.push(`Couleur "${key}" invalide: ${color}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Extrait tous les champs du template
   */
  getAllFields(): TemplateField[] {
    return this.sections.flatMap(section => section.fields);
  }

  /**
   * Trouve un champ par son ID
   */
  findField(fieldId: string): TemplateField | undefined {
    return this.getAllFields().find(field => field.id === fieldId);
  }
}