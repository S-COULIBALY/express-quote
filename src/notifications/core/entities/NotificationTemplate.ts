// =============================================================================
// 📄 ENTITÉ TEMPLATE DE NOTIFICATION - Gestion des Templates
// =============================================================================
//
// Utilité:
// - Gestion centralisée des templates de notification (email, SMS, WhatsApp)
// - Support multi-langues avec fallback automatique
// - Templates React Email pour emails modernes et responsives
// - Validation et prévisualisation avant envoi
// - Versioning des templates pour A/B testing
// - Cache intelligent pour performance optimale
//
// Architecture:
// - Templates typés avec validation Zod
// - Système de variables avec auto-complétion
// - Compilation et rendu React Email intégré
// - Fallback text automatique depuis HTML
// - Gestion des assets et images
// =============================================================================

import { z } from 'zod';

/**
 * 🎨 Types de templates supportés
 * 
 * Utilité:
 * - Classification des templates selon leur utilisation
 * - Routage automatique vers les bons renderers
 * - Optimisations spécifiques par type de média
 * - Validation du contenu selon les contraintes de chaque canal
 */
export enum TemplateType {
  EMAIL_HTML = 'EMAIL_HTML',     // Templates React Email → HTML
  EMAIL_TEXT = 'EMAIL_TEXT',     // Templates texte pur pour emails
  SMS = 'SMS',                   // Messages SMS (160 caractères)
  WHATSAPP = 'WHATSAPP',         // Messages WhatsApp (templates Meta)
  PUSH = 'PUSH',                 // Notifications push mobile
  WEBHOOK = 'WEBHOOK'            // Payload JSON pour webhooks
}

/**
 * 🌍 Langues supportées avec codes ISO
 * 
 * Utilité:
 * - Support multi-langues pour Express Quote
 * - Fallback automatique vers français si traduction manquante
 * - Expansion future vers nouveaux marchés
 */
export enum SupportedLanguage {
  FR = 'fr',  // Français (principal)
  EN = 'en',  // Anglais (international)
  ES = 'es',  // Espagnol (expansion)
  IT = 'it',  // Italien (expansion)
  DE = 'de'   // Allemand (expansion)
}

/**
 * 📊 Catégories de templates par contexte métier
 * 
 * Utilité:
 * - Organisation logique des templates
 * - Contrôles d'accès par catégorie
 * - Analytics groupés par type de communication
 * - Configuration RGPD différenciée (marketing vs transactionnel)
 */
export enum TemplateCategory {
  TRANSACTIONAL = 'TRANSACTIONAL',  // Emails transactionnels (booking, payment)
  MARKETING = 'MARKETING',           // Communications commerciales
  SYSTEM = 'SYSTEM',                 // Notifications système/erreurs
  REMINDER = 'REMINDER'              // Rappels et relances
}

/**
 * 🔧 Configuration de variable de template
 * 
 * Utilité:
 * - Définition typée des variables disponibles
 * - Validation à l'exécution avec Zod
 * - Auto-complétion dans l'interface d'admin
 * - Documentation automatique des templates
 */
export interface TemplateVariable {
  /** Nom de la variable (ex: 'booking.id') */
  name: string;
  
  /** Type de données attendu */
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  
  /** Description pour l'interface admin */
  description: string;
  
  /** Variable obligatoire ou optionnelle */
  required: boolean;
  
  /** Valeur par défaut si optionnelle */
  defaultValue?: any;
  
  /** Exemple de valeur pour la documentation */
  example?: any;
  
  /** Schema Zod pour validation avancée */
  validationSchema?: z.ZodSchema;
}

/**
 * 🎨 Contenu de template avec versioning
 * 
 * Utilité:
 * - Stockage du contenu brut (React JSX, texte, etc.)
 * - Versioning pour A/B testing et rollback
 * - Métadonnées de compilation et de rendu
 * - Tracking des performances par version
 */
export interface TemplateContent {
  /** Version du template (semantic versioning) */
  version: string;
  
  /** Sujet/titre du template */
  subject: string;
  
  /** Corps principal du template */
  body: string;
  
  /** Template compilé (HTML pour emails) */
  compiledBody?: string;
  
  /** Version texte auto-générée ou manuelle */
  textBody?: string;
  
  /** Métadonnées de compilation */
  compilationMetadata?: {
    compiledAt: Date;
    compiler: string;
    compilerVersion: string;
    sourceHash: string;
  };
  
  /** Assets utilisés (images, CSS) */
  assets?: TemplateAsset[];
  
  /** Preview data pour tests */
  previewData?: Record<string, any>;
}

/**
 * 🖼️ Asset de template (images, fichiers CSS)
 * 
 * Utilité:
 * - Gestion des images et styles des templates email
 * - CDN et optimisation automatique des assets
 * - Fallback pour clients email sans support images
 * - Tracking des performances de chargement
 */
export interface TemplateAsset {
  /** ID unique de l'asset */
  id: string;
  
  /** Type d'asset */
  type: 'image' | 'css' | 'font' | 'video';
  
  /** URL publique de l'asset */
  url: string;
  
  /** URL de fallback si indisponible */
  fallbackUrl?: string;
  
  /** Texte alternatif pour images */
  altText?: string;
  
  /** Métadonnées techniques */
  metadata?: {
    size: number;
    mimeType: string;
    dimensions?: { width: number; height: number };
    optimized?: boolean;
  };
}

/**
 * 📈 Métriques de performance d'un template
 * 
 * Utilité:
 * - Optimisation continue des templates
 * - A/B testing avec métriques objectives
 * - Détection des templates problématiques
 * - ROI des communications marketing
 */
export interface TemplateMetrics {
  /** Nombre total d'utilisations */
  totalUsage: number;
  
  /** Taux de succès d'envoi */
  deliveryRate: number;
  
  /** Taux d'ouverture (emails) */
  openRate?: number;
  
  /** Taux de clic */
  clickRate?: number;
  
  /** Temps moyen de compilation */
  avgCompilationTime: number;
  
  /** Taux d'erreur de rendu */
  renderErrorRate: number;
  
  /** Score de performance global */
  performanceScore: number;
  
  /** Dernière mise à jour des métriques */
  lastUpdated: Date;
}

/**
 * 📋 Schema Zod pour validation des templates
 * 
 * Utilité:
 * - Validation stricte des données de template
 * - Prévention des erreurs de compilation
 * - Interface typée pour TypeScript
 * - Validation côté client et serveur
 */
const TemplateVariableSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['string', 'number', 'boolean', 'date', 'object', 'array']),
  description: z.string().min(1).max(500),
  required: z.boolean(),
  defaultValue: z.any().optional(),
  example: z.any().optional(),
  validationSchema: z.any().optional()
});

const TemplateContentSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Format semver requis'),
  subject: z.string().min(1).max(200),
  body: z.string().min(1),
  compiledBody: z.string().optional(),
  textBody: z.string().optional(),
  compilationMetadata: z.object({
    compiledAt: z.date(),
    compiler: z.string(),
    compilerVersion: z.string(),
    sourceHash: z.string()
  }).optional(),
  assets: z.array(z.object({
    id: z.string(),
    type: z.enum(['image', 'css', 'font', 'video']),
    url: z.string().url(),
    fallbackUrl: z.string().url().optional(),
    altText: z.string().optional(),
    metadata: z.record(z.any()).optional()
  })).optional(),
  previewData: z.record(z.any()).optional()
});

/**
 * 📄 ENTITÉ PRINCIPALE - NotificationTemplate
 * 
 * Cette classe encapsule toute la logique métier d'un template
 * de notification dans Express Quote. Elle gère la compilation,
 * le rendu, la validation, et les métriques de performance.
 * 
 * Responsabilités:
 * - Stocker et valider le contenu des templates
 * - Compiler les templates React Email en HTML
 * - Générer les versions texte automatiquement
 * - Gérer les variables et leur validation
 * - Calculer et suivre les métriques de performance
 * - Fournir des prévisualisations pour l'interface admin
 */
export class NotificationTemplate {
  // Propriétés principales (immutables après création)
  private readonly _id: string;
  private readonly _name: string;
  private readonly _type: TemplateType;
  private readonly _category: TemplateCategory;
  private readonly _createdAt: Date;
  
  // Configuration mutable
  private _description: string;
  private _isActive: boolean;
  private _variables: Map<string, TemplateVariable>;
  private _content: Map<SupportedLanguage, TemplateContent>;
  private _defaultLanguage: SupportedLanguage;
  
  // Métadonnées et performance
  private _metrics: TemplateMetrics;
  private _lastModified: Date;
  private _modifiedBy?: string;
  private _tags: Set<string>;
  
  /**
   * 🏗️ Constructeur avec validation complète
   */
  constructor(
    id: string,
    name: string,
    type: TemplateType,
    category: TemplateCategory,
    description: string,
    options: {
      isActive?: boolean;
      defaultLanguage?: SupportedLanguage;
      tags?: string[];
    } = {}
  ) {
    // Validation des paramètres
    this.validateConstructorParams(id, name, description);
    
    // Propriétés immutables
    this._id = id;
    this._name = name;
    this._type = type;
    this._category = category;
    this._createdAt = new Date();
    
    // Configuration par défaut
    this._description = description;
    this._isActive = options.isActive ?? true;
    this._defaultLanguage = options.defaultLanguage ?? SupportedLanguage.FR;
    
    // Collections mutables
    this._variables = new Map();
    this._content = new Map();
    this._tags = new Set(options.tags || []);
    
    // Métadonnées
    this._metrics = this.initializeMetrics();
    this._lastModified = this._createdAt;
  }
  
  // =============================================================================
  // 📖 PROPRIÉTÉS DE LECTURE (Getters)
  // =============================================================================
  
  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get type(): TemplateType { return this._type; }
  get category(): TemplateCategory { return this._category; }
  get description(): string { return this._description; }
  get isActive(): boolean { return this._isActive; }
  get createdAt(): Date { return this._createdAt; }
  get lastModified(): Date { return this._lastModified; }
  get modifiedBy(): string | undefined { return this._modifiedBy; }
  get defaultLanguage(): SupportedLanguage { return this._defaultLanguage; }
  get metrics(): TemplateMetrics { return { ...this._metrics }; }
  get tags(): ReadonlySet<string> { return this._tags; }
  get availableLanguages(): SupportedLanguage[] { return Array.from(this._content.keys()); }
  get variables(): ReadonlyMap<string, TemplateVariable> { return this._variables; }
  
  // =============================================================================
  // 🎯 GESTION DU CONTENU PAR LANGUE
  // =============================================================================
  
  /**
   * 📝 Ajouter/modifier le contenu pour une langue
   */
  setContent(language: SupportedLanguage, content: TemplateContent, modifiedBy?: string, skipCompilation?: boolean): void {
    // Validation du contenu
    const validationResult = TemplateContentSchema.safeParse(content);
    if (!validationResult.success) {
      throw new Error(`Contenu invalide: ${validationResult.error.message}`);
    }

    // Validation spécifique par type
    this.validateContentByType(content);

    // Stockage du contenu
    this._content.set(language, { ...content });
    this._lastModified = new Date();
    this._modifiedBy = modifiedBy;

    // ✅ Compilation automatique si nécessaire (sauf si skipCompilation=true pour lazy loading)
    if (this._type === TemplateType.EMAIL_HTML && !skipCompilation) {
      this.compileEmailTemplate(language, content);
    }
  }
  
  /**
   * 📖 Récupérer le contenu pour une langue avec fallback
   */
  getContent(language: SupportedLanguage): TemplateContent | null {
    // Essayer la langue demandée
    let content = this._content.get(language);
    if (content) {
      return { ...content };
    }
    
    // Fallback vers la langue par défaut
    content = this._content.get(this._defaultLanguage);
    if (content) {
      return { ...content };
    }
    
    // Fallback vers la première langue disponible
    const firstLanguage = this.availableLanguages[0];
    if (firstLanguage) {
      content = this._content.get(firstLanguage);
      if (content) {
        return { ...content };
      }
    }
    
    return null;
  }
  
  /**
   * 🗑️ Supprimer le contenu d'une langue
   */
  removeContent(language: SupportedLanguage): boolean {
    if (language === this._defaultLanguage && this._content.size === 1) {
      throw new Error('Impossible de supprimer la dernière langue disponible');
    }
    
    const deleted = this._content.delete(language);
    if (deleted) {
      this._lastModified = new Date();
    }
    
    return deleted;
  }
  
  // =============================================================================
  // 🔧 GESTION DES VARIABLES
  // =============================================================================
  
  /**
   * ➕ Ajouter une variable de template
   */
  addVariable(variable: TemplateVariable): void {
    // Validation de la variable
    const validationResult = TemplateVariableSchema.safeParse(variable);
    if (!validationResult.success) {
      throw new Error(`Variable invalide: ${validationResult.error.message}`);
    }
    
    // Vérifier les conflits de noms
    if (this._variables.has(variable.name)) {
      throw new Error(`Variable '${variable.name}' existe déjà`);
    }
    
    this._variables.set(variable.name, { ...variable });
    this._lastModified = new Date();
  }
  
  /**
   * 🔄 Modifier une variable existante
   */
  updateVariable(name: string, updates: Partial<TemplateVariable>): void {
    const existingVariable = this._variables.get(name);
    if (!existingVariable) {
      throw new Error(`Variable '${name}' introuvable`);
    }
    
    const updatedVariable = { ...existingVariable, ...updates };
    
    // Validation de la variable mise à jour
    const validationResult = TemplateVariableSchema.safeParse(updatedVariable);
    if (!validationResult.success) {
      throw new Error(`Variable mise à jour invalide: ${validationResult.error.message}`);
    }
    
    this._variables.set(name, updatedVariable);
    this._lastModified = new Date();
  }
  
  /**
   * ❌ Supprimer une variable
   */
  removeVariable(name: string): boolean {
    const deleted = this._variables.delete(name);
    if (deleted) {
      this._lastModified = new Date();
    }
    return deleted;
  }
  
  /**
   * ✅ Valider les variables fournies contre le schema
   */
  validateVariables(variables: Record<string, any>): {
    valid: boolean;
    errors: string[];
    missingRequired: string[];
  } {
    const errors: string[] = [];
    const missingRequired: string[] = [];
    
    // Vérifier les variables obligatoires
    for (const [name, variable] of this._variables) {
      if (variable.required && !(name in variables)) {
        missingRequired.push(name);
        continue;
      }
      
      // Valider le type et le schema si fourni
      const value = variables[name];
      if (value !== undefined && variable.validationSchema) {
        const result = variable.validationSchema.safeParse(value);
        if (!result.success) {
          errors.push(`Variable '${name}': ${result.error.message}`);
        }
      }
    }
    
    return {
      valid: errors.length === 0 && missingRequired.length === 0,
      errors,
      missingRequired
    };
  }
  
  // =============================================================================
  // 🎨 COMPILATION ET RENDU
  // =============================================================================
  
  /**
   * 🔧 Compiler le template avec variables
   */
  async render(
    language: SupportedLanguage,
    variables: Record<string, any>
  ): Promise<{
    subject: string;
    body: string;
    textBody?: string;
    metadata: {
      templateId: string;
      language: SupportedLanguage;
      version: string;
      renderTime: Date;
      variablesUsed: string[];
    };
  }> {
    // Récupérer le contenu
    const content = this.getContent(language);
    if (!content) {
      throw new Error(`Contenu indisponible pour la langue '${language}'`);
    }
    
    // Valider les variables
    const validation = this.validateVariables(variables);
    if (!validation.valid) {
      throw new Error(
        `Variables invalides: ${validation.errors.join(', ')}. ` +
        `Variables manquantes: ${validation.missingRequired.join(', ')}`
      );
    }
    
    // Enrichir avec les valeurs par défaut
    const enrichedVariables = this.enrichWithDefaults(variables);
    
    // Rendu selon le type de template
    let renderedSubject: string;
    let renderedBody: string;
    let renderedTextBody: string | undefined;
    
    switch (this._type) {
      case TemplateType.EMAIL_HTML:
        ({ subject: renderedSubject, body: renderedBody, textBody: renderedTextBody } = 
          await this.renderEmailTemplate(content, enrichedVariables));
        break;
        
      case TemplateType.EMAIL_TEXT:
      case TemplateType.SMS:
      case TemplateType.WHATSAPP:
        ({ subject: renderedSubject, body: renderedBody } = 
          this.renderTextTemplate(content, enrichedVariables));
        break;
        
      default:
        throw new Error(`Type de template non supporté: ${this._type}`);
    }
    
    // Incrémenter les métriques d'usage
    this._metrics.totalUsage++;
    this._metrics.lastUpdated = new Date();
    
    return {
      subject: renderedSubject,
      body: renderedBody,
      textBody: renderedTextBody,
      metadata: {
        templateId: this._id,
        language,
        version: content.version,
        renderTime: new Date(),
        variablesUsed: Object.keys(enrichedVariables)
      }
    };
  }
  
  /**
   * 📧 Compiler template React Email en HTML
   */
  private async compileEmailTemplate(language: SupportedLanguage, content: TemplateContent): Promise<void> {
    try {
      const compilationStart = Date.now();

      // Vérifier si c'est un template React Email
      if (this._type === TemplateType.EMAIL_HTML && this.isReactEmailTemplate()) {
        // ✅ FIX: Normaliser l'ID en retirant le suffixe -email pour le renderer
        const normalizedId = this._id.replace(/-email$/, '');

        // ✅ CRITICAL: Utiliser le wrapper server-only pour éviter que Next.js
        // essaie d'inclure react-dom/server dans le bundle client
        const { hasReactEmailTemplate, renderReactEmailTemplate } =
          require('../../infrastructure/templates/react-email.renderer.server');

        // ✅ Utiliser l'ID normalisé pour chercher le template React Email
        if (hasReactEmailTemplate(normalizedId)) {
          // Compiler avec React Email
          const compiled = renderReactEmailTemplate(normalizedId, content.previewData || {});
          const sourceHash = this.generateHash(compiled.html);

          const compilationTime = Date.now() - compilationStart;

          // Mise à jour du contenu avec compilation React Email
          const updatedContent: TemplateContent = {
            ...content,
            compiledBody: compiled.html,
            textBody: compiled.text,
            subject: compiled.subject,
            compilationMetadata: {
              compiledAt: new Date(),
              compiler: 'react-email',
              compilerVersion: '1.2.1',
              sourceHash
            }
          };

          this._content.set(language, updatedContent);

          // Mise à jour des métriques
          this._metrics.avgCompilationTime =
            (this._metrics.avgCompilationTime + compilationTime) / 2;

          return;
        }
      }
      
      // Fallback vers compilation basique
      const compiledBody = content.body;
      const sourceHash = this.generateHash(content.body);
      
      const compilationTime = Date.now() - compilationStart;
      
      const updatedContent: TemplateContent = {
        ...content,
        compiledBody,
        compilationMetadata: {
          compiledAt: new Date(),
          compiler: 'html-basic',
          compilerVersion: '1.0.0',
          sourceHash
        }
      };
      
      this._content.set(language, updatedContent);
      
      this._metrics.avgCompilationTime = 
        (this._metrics.avgCompilationTime + compilationTime) / 2;
      
    } catch (error) {
      this._metrics.renderErrorRate++;
      throw new Error(`Erreur de compilation: ${error}`);
    }
  }

  /**
   * 🔍 Vérifier si c'est un template React Email
   */
  private isReactEmailTemplate(): boolean {
    const reactEmailTemplates = [
      'quote-confirmation',
      'booking-confirmation',
      'payment-confirmation',
      'service-reminder',
      'professional-attribution',
      'accounting-documents'
    ];

    // ✅ FIX: Supporter aussi les IDs avec suffixe -email (ex: 'service-reminder-email')
    // Cela permet aux templates créés par les factories de fonctionner correctement
    const normalizedId = this._id.replace(/-email$/, '');

    return reactEmailTemplates.includes(this._id) || reactEmailTemplates.includes(normalizedId);
  }
  
  /**
   * 📧 Rendu d'un template email avec React Email
   */
  private async renderEmailTemplate(
    content: TemplateContent,
    variables: Record<string, any>
  ): Promise<{ subject: string; body: string; textBody?: string }> {
    // 🔍 DEBUG: Pour les templates React Email, on doit re-rendre avec les vraies données
    if (this.isReactEmailTemplate()) {
      // ✅ FIX: Normaliser l'ID en retirant le suffixe -email pour le renderer
      const normalizedId = this._id.replace(/-email$/, '');

      console.log('[NotificationTemplate] Rendering React Email template with real data');
      console.log('[NotificationTemplate] Template ID (original):', this._id);
      console.log('[NotificationTemplate] Template ID (normalized):', normalizedId);
      console.log('[NotificationTemplate] Variables keys:', Object.keys(variables));

      try {
        // ✅ CRITICAL: Utiliser le wrapper server-only pour éviter que Next.js
        // essaie d'inclure react-dom/server dans le bundle client
        const { hasReactEmailTemplate, renderReactEmailTemplate } =
          require('../../infrastructure/templates/react-email.renderer.server');

        // ✅ Utiliser l'ID normalisé pour chercher le template React Email
        if (hasReactEmailTemplate(normalizedId)) {
          // ✅ FIX: RE-RENDRE le template avec les VRAIES données (ASYNCHRONE)
          // Note: Pas besoin de pre-compiler, le renderer le fait à la volée
          console.log('[NotificationTemplate] ========== APPEL RENDERER ==========');
          console.log('[NotificationTemplate] Calling renderReactEmailTemplate with:', normalizedId);

          const compiled = renderReactEmailTemplate(normalizedId, variables);

          console.log('[NotificationTemplate] ========== RÉSULTAT RENDERER ==========');
          console.log('[NotificationTemplate] Compiled object:', {
            hasHtml: !!compiled?.html,
            htmlType: typeof compiled?.html,
            htmlLength: compiled?.html?.length,
            htmlIsString: typeof compiled?.html === 'string',
            htmlPreview: typeof compiled?.html === 'string' ? compiled.html.substring(0, 150) : 'NOT A STRING',
            hasText: !!compiled?.text,
            textLength: compiled?.text?.length,
            hasSubject: !!compiled?.subject,
            subjectValue: compiled?.subject
          });

          if (compiled && compiled.html && typeof compiled.html === 'string') {
            console.log('[NotificationTemplate] ✅ RETURNING React Email HTML (length:', compiled.html.length, ')');
            return {
              subject: compiled.subject,
              body: compiled.html,
              textBody: compiled.text
            };
          } else {
            console.error('[NotificationTemplate] ❌ React Email renderer returned INVALID result!');
            console.error('[NotificationTemplate] compiled:', JSON.stringify(compiled, null, 2));
          }
        } else {
          console.warn(`[NotificationTemplate] React Email template '${normalizedId}' not found in renderer`);
        }
      } catch (error) {
        console.error('[NotificationTemplate] Error rendering React Email:', error);
        // Fallback vers l'ancien système
      }
    }

    // Fallback: utiliser le HTML pré-compilé avec interpolation
    const subject = this.interpolateString(content.subject, variables);
    const body = content.compiledBody || content.body;
    const textBody = content.textBody || this.htmlToText(body);

    return {
      subject,
      body: this.interpolateString(body, variables),
      textBody: this.interpolateString(textBody, variables)
    };
  }
  
  /**
   * 📝 Rendu d'un template texte simple
   */
  private renderTextTemplate(
    content: TemplateContent,
    variables: Record<string, any>
  ): { subject: string; body: string } {
    return {
      subject: this.interpolateString(content.subject, variables),
      body: this.interpolateString(content.body, variables)
    };
  }
  
  // =============================================================================
  // 🛠️ MÉTHODES UTILITAIRES
  // =============================================================================
  
  /**
   * 🔤 Interpolation de variables dans string
   */
  private interpolateString(template: string, variables: Record<string, any>): string {
    // CORRECTION: Regex améliorée pour capturer toutes les clés possibles
    // Supporte: customer.name, booking.id, user.profile.name, etc.
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const trimmedKey = key.trim();
      const value = this.getNestedValue(variables, trimmedKey);
      return value !== undefined ? String(value) : match;
    });
  }
  
  /**
   * 🗂️ Récupération de valeur nested (ex: user.profile.name)
   */
  private getNestedValue(obj: any, path: string): any {
    // CORRECTION: Gérer les clés avec des points comme 'customer.name'
    // D'abord essayer d'accéder directement à la clé
    if (obj && typeof obj === 'object' && path in obj) {
      return obj[path];
    }
    
    // Ensuite essayer l'accès nested pour les vraies propriétés nested
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  /**
   * 🔧 Enrichissement avec valeurs par défaut
   */
  private enrichWithDefaults(variables: Record<string, any>): Record<string, any> {
    const enriched = { ...variables };
    
    for (const [name, variable] of this._variables) {
      if (!(name in enriched) && variable.defaultValue !== undefined) {
        enriched[name] = variable.defaultValue;
      }
    }
    
    return enriched;
  }
  
  /**
   * 📄 Conversion HTML vers texte (simplifié)
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }
  
  /**
   * 🔐 Génération de hash pour contenu
   */
  private generateHash(content: string): string {
    // Simulation simple - en production utiliser crypto
    return Buffer.from(content).toString('base64').slice(0, 16);
  }
  
  /**
   * ✅ Validation des paramètres du constructeur
   */
  private validateConstructorParams(id: string, name: string, description: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error('ID du template requis');
    }
    
    if (!name || name.trim().length === 0) {
      throw new Error('Nom du template requis');
    }
    
    if (name.length > 100) {
      throw new Error('Nom du template trop long (max 100 caractères)');
    }
    
    if (description.length > 1000) {
      throw new Error('Description trop longue (max 1000 caractères)');
    }
  }
  
  /**
   * ✅ Validation spécifique par type de template
   */
  private validateContentByType(content: TemplateContent): void {
    switch (this._type) {
      case TemplateType.SMS:
        if (content.body.length > 160) {
          throw new Error('Corps SMS trop long (max 160 caractères)');
        }
        break;
        
      case TemplateType.EMAIL_HTML:
        if (!content.body.includes('<html') && !content.body.includes('<div')) {
          console.warn('Template HTML ne contient pas de balises HTML');
        }
        break;
        
      case TemplateType.WHATSAPP:
        if (content.body.length > 4096) {
          throw new Error('Message WhatsApp trop long (max 4096 caractères)');
        }
        break;
    }
  }
  
  /**
   * 📊 Initialisation des métriques
   */
  private initializeMetrics(): TemplateMetrics {
    return {
      totalUsage: 0,
      deliveryRate: 0,
      avgCompilationTime: 0,
      renderErrorRate: 0,
      performanceScore: 100,
      lastUpdated: new Date()
    };
  }
  
  // =============================================================================
  // 📊 GESTION DES MÉTRIQUES
  // =============================================================================
  
  /**
   * 📈 Mettre à jour les métriques de performance
   */
  updateMetrics(updates: Partial<TemplateMetrics>): void {
    this._metrics = {
      ...this._metrics,
      ...updates,
      lastUpdated: new Date()
    };
    
    // Recalculer le score de performance global
    this.recalculatePerformanceScore();
  }
  
  /**
   * 🎯 Calculer le score de performance global (0-100)
   */
  private recalculatePerformanceScore(): void {
    const deliveryScore = this._metrics.deliveryRate * 40;
    const speedScore = Math.max(0, 100 - (this._metrics.avgCompilationTime / 100)) * 30;
    const reliabilityScore = Math.max(0, 100 - (this._metrics.renderErrorRate * 10)) * 30;
    
    this._metrics.performanceScore = Math.round(deliveryScore + speedScore + reliabilityScore);
  }
  
  // =============================================================================
  // 🔄 GESTION DES TAGS ET MÉTADONNÉES
  // =============================================================================
  
  /**
   * 🏷️ Ajouter des tags
   */
  addTags(...tags: string[]): void {
    for (const tag of tags) {
      this._tags.add(tag.toLowerCase());
    }
    this._lastModified = new Date();
  }
  
  /**
   * 🗑️ Supprimer des tags
   */
  removeTags(...tags: string[]): void {
    for (const tag of tags) {
      this._tags.delete(tag.toLowerCase());
    }
    this._lastModified = new Date();
  }
  
  /**
   * 🔍 Vérifier la présence d'un tag
   */
  hasTag(tag: string): boolean {
    return this._tags.has(tag.toLowerCase());
  }
  
  // =============================================================================
  // 🔄 SÉRIALISATION ET PERSISTENCE
  // =============================================================================
  
  /**
   * 📋 Export pour sauvegarde
   */
  toJSON(): any {
    return {
      id: this._id,
      name: this._name,
      type: this._type,
      category: this._category,
      description: this._description,
      isActive: this._isActive,
      defaultLanguage: this._defaultLanguage,
      createdAt: this._createdAt.toISOString(),
      lastModified: this._lastModified.toISOString(),
      modifiedBy: this._modifiedBy,
      variables: Array.from(this._variables.entries()).map(([varName, variable]) => ({
        ...variable,
        name: varName
      })),
      content: Object.fromEntries(
        Array.from(this._content.entries()).map(([lang, content]) => [
          lang,
          {
            ...content,
            compilationMetadata: content.compilationMetadata ? {
              ...content.compilationMetadata,
              compiledAt: content.compilationMetadata.compiledAt.toISOString()
            } : undefined
          }
        ])
      ),
      metrics: {
        ...this._metrics,
        lastUpdated: this._metrics.lastUpdated.toISOString()
      },
      tags: Array.from(this._tags)
    };
  }
  
  /**
   * 🔄 Import depuis JSON
   */
  static fromJSON(json: any): NotificationTemplate {
    const template = new NotificationTemplate(
      json.id,
      json.name,
      json.type,
      json.category,
      json.description,
      {
        isActive: json.isActive,
        defaultLanguage: json.defaultLanguage,
        tags: json.tags
      }
    );
    
    // Restaurer les propriétés privées
    template._lastModified = new Date(json.lastModified);
    template._modifiedBy = json.modifiedBy;
    
    // Restaurer les variables
    for (const variable of json.variables) {
      template._variables.set(variable.name, variable);
    }
    
    // Restaurer le contenu
    for (const [lang, rawContent] of Object.entries(json.content as Record<string, Record<string, unknown>>)) {
      const content = rawContent as {
        subject: string;
        body: string;
        compilationMetadata?: { compiledAt: string; [key: string]: unknown };
        [key: string]: unknown;
      };
      template._content.set(lang as SupportedLanguage, {
        ...content,
        compilationMetadata: content.compilationMetadata ? {
          ...content.compilationMetadata,
          compiledAt: new Date(content.compilationMetadata.compiledAt)
        } : undefined
      } as TemplateContent);
    }
    
    // Restaurer les métriques
    template._metrics = {
      ...json.metrics,
      lastUpdated: new Date(json.metrics.lastUpdated)
    };
    
    return template;
  }
}

// =============================================================================
// 🏭 FACTORY ET TEMPLATES PRÉDÉFINIS
// =============================================================================

/**
 * 🏭 Factory pour créer des templates Express Quote
 */
export class NotificationTemplateFactory {
  /**
   * 📧 Template de confirmation de réservation
   */
  static createBookingConfirmationTemplate(): NotificationTemplate {
    const template = new NotificationTemplate(
      'booking-confirmation-email',
      'Confirmation de réservation',
      TemplateType.EMAIL_HTML,
      TemplateCategory.TRANSACTIONAL,
      'Email de confirmation envoyé après validation d\'une réservation'
    );
    
    // Ajouter les variables
    template.addVariable({
      name: 'customer.name',
      type: 'string',
      description: 'Nom du client',
      required: true,
      example: 'Jean Dupont'
    });
    
    template.addVariable({
      name: 'booking.id',
      type: 'string',
      description: 'ID de la réservation',
      required: true,
      example: 'BK-123456'
    });
    
    template.addVariable({
      name: 'booking.service',
      type: 'string',
      description: 'Type de service',
      required: true,
      example: 'Déménagement'
    });
    
    template.addVariable({
      name: 'booking.date',
      type: 'date',
      description: 'Date du rendez-vous',
      required: true,
      example: '2025-03-15'
    });
    
    template.addVariable({
      name: 'booking.price',
      type: 'number',
      description: 'Prix total de la prestation',
      required: true,
      example: 450
    });
    
    // Contenu français
    template.setContent(SupportedLanguage.FR, {
      version: '1.0.0',
      subject: '✅ Confirmation de réservation {{booking.id}} - Express Quote',
      body: `
        <h1>Bonjour {{customer.name}},</h1>
        <p>Votre réservation <strong>{{booking.id}}</strong> est confirmée !</p>
        
        <div style="background:#f5f5f5; padding:20px; margin:20px 0;">
          <h2>Détails de votre réservation :</h2>
          <p><strong>Service :</strong> {{booking.service}}</p>
          <p><strong>Date :</strong> {{booking.date}}</p>
          <p><strong>Prix :</strong> {{booking.price}}€</p>
        </div>
        
        <p>Nous vous remercions de votre confiance.</p>
        <p>L'équipe Express Quote</p>
      `,
      textBody: `
        Bonjour {{customer.name}},
        
        Votre réservation {{booking.id}} est confirmée !
        
        Service : {{booking.service}}
        Date : {{booking.date}}
        Prix : {{booking.price}}€
        
        Merci de votre confiance.
        L'équipe Express Quote
      `
    });
    
    template.addTags('booking', 'confirmation', 'transactional');
    
    return template;
  }
  
  /**
   * 💳 Template de confirmation de paiement
   */
  static createPaymentConfirmationTemplate(): NotificationTemplate {
    const template = new NotificationTemplate(
      'payment-confirmation-email',
      'Confirmation de paiement',
      TemplateType.EMAIL_HTML,
      TemplateCategory.TRANSACTIONAL,
      'Email de confirmation envoyé après paiement réussi'
    );
    
    // Variables de paiement
    template.addVariable({
      name: 'customer.name',
      type: 'string',
      description: 'Nom du client',
      required: true,
      example: 'Marie Martin'
    });
    
    template.addVariable({
      name: 'payment.amount',
      type: 'number',
      description: 'Montant du paiement',
      required: true,
      example: 299.99
    });
    
    template.addVariable({
      name: 'payment.method',
      type: 'string',
      description: 'Méthode de paiement',
      required: true,
      example: 'Carte bancaire'
    });
    
    template.addVariable({
      name: 'booking.id',
      type: 'string',
      description: 'ID de la réservation',
      required: true,
      example: 'BK-789012'
    });
    
    // Contenu français
    template.setContent(SupportedLanguage.FR, {
      version: '1.0.0',
      subject: '💳 Paiement confirmé {{payment.amount}}€ - Réservation {{booking.id}}',
      body: `
        <h1>Paiement confirmé !</h1>
        <p>Bonjour {{customer.name}},</p>
        <p>Nous avons bien reçu votre paiement de <strong>{{payment.amount}}€</strong>.</p>
        
        <div style="background:#e8f5e8; padding:20px; margin:20px 0; border-left:4px solid #4CAF50;">
          <h2>Détails du paiement :</h2>
          <p><strong>Montant :</strong> {{payment.amount}}€</p>
          <p><strong>Méthode :</strong> {{payment.method}}</p>
          <p><strong>Réservation :</strong> {{booking.id}}</p>
        </div>
        
        <p>Votre réservation est maintenant confirmée et payée.</p>
        <p>Merci de votre confiance !</p>
      `
    });
    
    template.addTags('payment', 'confirmation', 'transactional');
    
    return template;
  }
  
  /**
   * ⏰ Template de rappel de rendez-vous (SMS)
   */
  static createAppointmentReminderTemplate(): NotificationTemplate {
    const template = new NotificationTemplate(
      'appointment-reminder-sms',
      'Rappel de rendez-vous',
      TemplateType.SMS,
      TemplateCategory.REMINDER,
      'SMS de rappel envoyé 24h avant le rendez-vous'
    );
    
    // Variables de rappel
    template.addVariable({
      name: 'customer.name',
      type: 'string',
      description: 'Prénom du client',
      required: true,
      example: 'Pierre'
    });
    
    template.addVariable({
      name: 'appointment.service',
      type: 'string',
      description: 'Service réservé',
      required: true,
      example: 'Nettoyage'
    });
    
    template.addVariable({
      name: 'appointment.time',
      type: 'string',
      description: 'Heure du rendez-vous',
      required: true,
      example: '14h30'
    });
    
    // Contenu SMS (court)
    template.setContent(SupportedLanguage.FR, {
      version: '1.0.0',
      subject: 'Rappel RDV Express Quote',
      body: 'Bonjour {{customer.name}}, rappel RDV {{appointment.service}} demain à {{appointment.time}}. Express Quote'
    });
    
    template.addTags('reminder', 'appointment', 'sms');
    
    return template;
  }


  /**
   * 📧 Template de confirmation de devis (Email HTML)
   */
  static createQuoteConfirmationEmailTemplate(): NotificationTemplate {
    const template = new NotificationTemplate(
      'quote-confirmation-email',
      'Confirmation de devis par email',
      TemplateType.EMAIL_HTML,
      TemplateCategory.TRANSACTIONAL,
      'Email de confirmation de devis avec template React Email'
    );
    
    // Variables pour le template React Email
    template.addVariable({
      name: 'customerName',
      type: 'string',
      description: 'Nom du client',
      required: true,
      example: 'Jean Dupont'
    });
    
    template.addVariable({
      name: 'quoteReference',
      type: 'string',
      description: 'Référence du devis',
      required: true,
      example: 'Q-123456'
    });
    
    template.addVariable({
      name: 'serviceName',
      type: 'string',
      description: 'Nom du service',
      required: true,
      example: 'Déménagement complet'
    });
    
    template.addVariable({
      name: 'totalAmount',
      type: 'number',
      description: 'Montant total',
      required: true,
      example: 850
    });
    
    template.addVariable({
      name: 'viewQuoteUrl',
      type: 'string',
      description: 'URL pour voir le devis',
      required: true,
      example: 'https://express-quote.com/quote/Q-123456'
    });
    
    // Contenu HTML basique (fallback)
    // ✅ LAZY COMPILATION: Skip compilation at initialization to avoid Jest ES modules error
    template.setContent(SupportedLanguage.FR, {
      version: '1.0.0',
      subject: 'Confirmation de votre devis - {{quoteReference}}',
      body: `
        <h1>Confirmation de devis</h1>
        <p>Bonjour {{customerName}},</p>
        <p>Votre devis {{quoteReference}} a été créé avec succès.</p>
        <p>Service: {{serviceName}}</p>
        <p>Montant: {{totalAmount}}€</p>
        <p>L'équipe Express Quote</p>
      `
    }, undefined, true); // skipCompilation = true

    template.addTags('quote', 'confirmation', 'email');

    return template;
  }

  /**
   * 📧 Template de confirmation de réservation (Email HTML)
   */
  static createBookingConfirmationEmailTemplate(): NotificationTemplate {
    const template = new NotificationTemplate(
      'booking-confirmation-email',
      'Confirmation de réservation par email',
      TemplateType.EMAIL_HTML,
      TemplateCategory.TRANSACTIONAL,
      'Email de confirmation de réservation avec template React Email'
    );
    
    // Variables pour le template React Email
    template.addVariable({
      name: 'customerName',
      type: 'string',
      description: 'Nom du client',
      required: true,
      example: 'Jean Dupont'
    });
    
    template.addVariable({
      name: 'bookingReference',
      type: 'string',
      description: 'Référence de réservation',
      required: true,
      example: 'BK-123456'
    });
    
    template.addVariable({
      name: 'serviceName',
      type: 'string',
      description: 'Nom du service',
      required: true,
      example: 'Déménagement complet'
    });
    
    template.addVariable({
      name: 'serviceDate',
      type: 'string',
      description: 'Date du service',
      required: true,
      example: '15/09/2025'
    });
    
    template.addVariable({
      name: 'serviceTime',
      type: 'string',
      description: 'Heure du service',
      required: true,
      example: '14:00'
    });
    
    template.addVariable({
      name: 'totalAmount',
      type: 'number',
      description: 'Montant total',
      required: true,
      example: 850
    });
    
    // Contenu HTML basique (fallback)
    // ✅ LAZY COMPILATION: Skip compilation at initialization to avoid Jest ES modules error
    template.setContent(SupportedLanguage.FR, {
      version: '1.0.0',
      subject: 'Confirmation de votre réservation - {{bookingReference}}',
      body: `
        <h1>Confirmation de réservation</h1>
        <p>Bonjour {{customerName}},</p>
        <p>Votre réservation {{bookingReference}} est confirmée.</p>
        <p>Service: {{serviceName}}</p>
        <p>Date: {{serviceDate}} à {{serviceTime}}</p>
        <p>Montant: {{totalAmount}}€</p>
        <p>L'équipe Express Quote</p>
      `
    }, undefined, true); // skipCompilation = true

    template.addTags('booking', 'confirmation', 'email');

    return template;
  }

  /**
   * 📧 Template de confirmation de paiement (Email HTML)
   */
  static createPaymentConfirmationEmailTemplate(): NotificationTemplate {
    const template = new NotificationTemplate(
      'payment-confirmation-email',
      'Confirmation de paiement par email',
      TemplateType.EMAIL_HTML,
      TemplateCategory.TRANSACTIONAL,
      'Email de confirmation de paiement avec template React Email'
    );
    
    // Variables pour le template React Email
    template.addVariable({
      name: 'customerName',
      type: 'string',
      description: 'Nom du client',
      required: true,
      example: 'Jean Dupont'
    });
    
    template.addVariable({
      name: 'paymentReference',
      type: 'string',
      description: 'Référence de paiement',
      required: true,
      example: 'PAY-123456'
    });
    
    template.addVariable({
      name: 'paymentAmount',
      type: 'number',
      description: 'Montant du paiement',
      required: true,
      example: 850
    });
    
    template.addVariable({
      name: 'paymentMethod',
      type: 'string',
      description: 'Méthode de paiement',
      required: true,
      example: 'Carte bancaire'
    });
    
    template.addVariable({
      name: 'bookingReference',
      type: 'string',
      description: 'Référence de réservation',
      required: true,
      example: 'BK-123456'
    });
    
    // Contenu HTML basique (fallback)
    // ✅ LAZY COMPILATION: Skip compilation at initialization to avoid Jest ES modules error
    template.setContent(SupportedLanguage.FR, {
      version: '1.0.0',
      subject: 'Confirmation de paiement - {{paymentReference}}',
      body: `
        <h1>Confirmation de paiement</h1>
        <p>Bonjour {{customerName}},</p>
        <p>Votre paiement {{paymentReference}} a été confirmé.</p>
        <p>Montant: {{paymentAmount}}€</p>
        <p>Méthode: {{paymentMethod}}</p>
        <p>Réservation: {{bookingReference}}</p>
        <p>L'équipe Express Quote</p>
      `
    }, undefined, true); // skipCompilation = true

    template.addTags('payment', 'confirmation', 'email');

    return template;
  }

  /**
   * 💰 Template de documents comptables (Email)
   */
  static createAccountingDocumentsEmailTemplate(): NotificationTemplate {
    const template = new NotificationTemplate(
      'accounting-documents-email',
      'Notification de documents comptables',
      TemplateType.EMAIL_HTML,
      TemplateCategory.TRANSACTIONAL,
      'Email de notification pour documents comptables avec détails financiers'
    );

    // Variables principales
    template.addVariable({
      name: 'accountingName',
      type: 'string',
      description: 'Nom du comptable',
      required: true,
      example: 'Marie Durand'
    });

    template.addVariable({
      name: 'bookingReference',
      type: 'string',
      description: 'Référence de réservation',
      required: true,
      example: 'BK-123456'
    });

    template.addVariable({
      name: 'totalAmount',
      type: 'number',
      description: 'Montant total',
      required: true,
      example: 15000
    });

    template.addVariable({
      name: 'currency',
      type: 'string',
      description: 'Devise',
      required: false,
      example: 'EUR'
    });

    template.addVariable({
      name: 'documentsCount',
      type: 'number',
      description: 'Nombre de documents',
      required: true,
      example: 2
    });

    template.addVariable({
      name: 'hasInvoice',
      type: 'boolean',
      description: 'Présence d\'une facture',
      required: true,
      example: true
    });

    template.addVariable({
      name: 'hasPaymentReceipt',
      type: 'boolean',
      description: 'Présence d\'un reçu de paiement',
      required: true,
      example: true
    });

    template.addVariable({
      name: 'hasQuote',
      type: 'boolean',
      description: 'Présence d\'un devis',
      required: true,
      example: false
    });

    template.addVariable({
      name: 'trigger',
      type: 'string',
      description: 'Déclencheur de la notification',
      required: true,
      example: 'payment_completed'
    });

    template.addVariable({
      name: 'reason',
      type: 'string',
      description: 'Raison de la notification',
      required: true,
      example: 'Paiement complété'
    });

    template.addVariable({
      name: 'viewBookingUrl',
      type: 'string',
      description: 'URL pour voir la réservation',
      required: true,
      example: 'http://localhost:3000/bookings/123'
    });

    template.addVariable({
      name: 'accountingDashboardUrl',
      type: 'string',
      description: 'URL du dashboard comptable',
      required: true,
      example: 'http://localhost:3000/admin/accounting'
    });

    template.addVariable({
      name: 'downloadAllUrl',
      type: 'string',
      description: 'URL pour télécharger tous les documents',
      required: true,
      example: 'http://localhost:3000/documents/download-all/123'
    });

    // Contenu HTML basique (fallback)
    template.setContent(SupportedLanguage.FR, {
      version: '1.0.0',
      subject: 'Documents comptables - {{bookingReference}}',
      body: `
        <h1>Nouveaux documents comptables</h1>
        <p>Bonjour {{accountingName}},</p>
        <p>{{documentsCount}} document(s) comptable(s) ont été générés.</p>
        <p>Référence: {{bookingReference}}</p>
        <p>Montant: {{totalAmount}} {{currency}}</p>
        <p>Raison: {{reason}}</p>
        <p><a href="{{viewBookingUrl}}">Voir la réservation</a></p>
        <p>L'équipe Express Quote</p>
      `
    }, undefined, true); // skipCompilation = true

    template.addTags('accounting', 'documents', 'email', 'internal');

    return template;
  }

  /**
   * 📧 Template de rappel de service (Email)
   */
  static createServiceReminderEmailTemplate(): NotificationTemplate {
    const template = new NotificationTemplate(
      'service-reminder-email',
      'Rappel de service par email',
      TemplateType.EMAIL_HTML,
      TemplateCategory.REMINDER,
      'Email de rappel envoyé 24h avant le service avec instructions détaillées'
    );
    
    // Variables de rappel
    template.addVariable({
      name: 'customerName',
      type: 'string',
      description: 'Nom du client',
      required: true,
      example: 'Jean Dupont'
    });
    
    template.addVariable({
      name: 'bookingReference',
      type: 'string',
      description: 'Référence de réservation',
      required: true,
      example: 'BK-123456'
    });
    
    template.addVariable({
      name: 'serviceName',
      type: 'string',
      description: 'Nom du service',
      required: true,
      example: 'Déménagement complet'
    });
    
    template.addVariable({
      name: 'serviceDate',
      type: 'string',
      description: 'Date du service',
      required: true,
      example: '15/09/2025'
    });
    
    template.addVariable({
      name: 'serviceTime',
      type: 'string',
      description: 'Heure du service',
      required: true,
      example: '14:00'
    });
    
    template.addVariable({
      name: 'primaryAddress',
      type: 'string',
      description: 'Adresse principale',
      required: true,
      example: '123 Rue de la Paix, 75001 Paris'
    });
    
    template.addVariable({
      name: 'finalChecklist',
      type: 'array',
      description: 'Liste de vérification finale',
      required: false,
      example: ['Emballer les objets fragiles', 'Préparer les clés']
    });
    
    template.addVariable({
      name: 'hoursUntilService',
      type: 'number',
      description: 'Heures jusqu\'au service',
      required: true,
      example: 24
    });
    
    // Contenu email HTML simple
    // ✅ LAZY COMPILATION: Skip compilation at initialization to avoid Jest ES modules error
    template.setContent(SupportedLanguage.FR, {
      version: '1.0.0',
      subject: 'Rappel de votre service Express Quote - {{serviceDate}}',
      body: `
        <h1>Rappel de Service Express Quote</h1>

        <p>Bonjour {{customerName}},</p>

        <p>Nous vous rappelons votre service prévu très bientôt.</p>

        <h2>Détails de votre service :</h2>
        <ul>
          <li><strong>Réservation :</strong> {{bookingReference}}</li>
          <li><strong>Service :</strong> {{serviceName}}</li>
          <li><strong>Date :</strong> {{serviceDate}}</li>
          <li><strong>Heure :</strong> {{serviceTime}}</li>
          <li><strong>Adresse :</strong> {{primaryAddress}}</li>
        </ul>

        <h2>Checklist de préparation :</h2>
        <p>{{finalChecklist}}</p>

        <p>Nous avons hâte de vous servir ! Notre équipe sera ponctuelle et professionnelle.</p>

        <p>Besoin d'aide ? Contactez-nous au 01 23 45 67 89 ou par email à contact@express-quote.fr</p>

        <p>L'équipe Express Quote</p>
      `
    }, undefined, true); // skipCompilation = true

    template.addTags('reminder', 'service', 'email');

    return template;
  }

  /**
   * 📧 Template d'attribution de mission au professionnel (Email HTML)
   */
  static createProfessionalAttributionEmailTemplate(): NotificationTemplate {
    const template = new NotificationTemplate(
      'professional-attribution',
      'Attribution de mission professionnel',
      TemplateType.EMAIL_HTML,
      TemplateCategory.TRANSACTIONAL,
      'Email envoyé aux professionnels pour les informer d\'une nouvelle mission disponible'
    );

    // Variables pour le template React Email
    template.addVariable({
      name: 'professionalEmail',
      type: 'string',
      description: 'Email du professionnel',
      required: true,
      example: 'pro@example.com'
    });

    template.addVariable({
      name: 'attributionId',
      type: 'string',
      description: 'ID d\'attribution',
      required: true,
      example: 'attr_123456'
    });

    template.addVariable({
      name: 'serviceType',
      type: 'string',
      description: 'Type de service',
      required: true,
      example: 'MOVING'
    });

    template.addVariable({
      name: 'totalAmount',
      type: 'number',
      description: 'Montant total',
      required: true,
      example: 150
    });

    template.addVariable({
      name: 'scheduledDate',
      type: 'string',
      description: 'Date prévue',
      required: true,
      example: '2025-11-26'
    });

    template.addVariable({
      name: 'scheduledTime',
      type: 'string',
      description: 'Heure prévue',
      required: true,
      example: '09:00'
    });

    template.addVariable({
      name: 'locationCity',
      type: 'string',
      description: 'Ville',
      required: true,
      example: 'Paris'
    });

    template.addVariable({
      name: 'acceptUrl',
      type: 'string',
      description: 'URL pour accepter',
      required: true,
      example: 'https://express-quote.com/professional/accept/attr_123456'
    });

    template.addVariable({
      name: 'refuseUrl',
      type: 'string',
      description: 'URL pour refuser',
      required: true,
      example: 'https://express-quote.com/professional/refuse/attr_123456'
    });

    // Contenu HTML basique (fallback)
    // ✅ LAZY COMPILATION: Skip compilation at initialization to avoid Jest ES modules error
    template.setContent(SupportedLanguage.FR, {
      version: '1.0.0',
      subject: '🎯 Nouvelle mission {{serviceType}} - {{totalAmount}}€ à {{locationCity}}',
      body: `
        <h1>Nouvelle mission disponible</h1>
        <p>Une nouvelle mission vient d'être publiée dans votre secteur.</p>
        <h2>Détails de la mission :</h2>
        <ul>
          <li><strong>Type :</strong> {{serviceType}}</li>
          <li><strong>Montant :</strong> {{totalAmount}}€</li>
          <li><strong>Date :</strong> {{scheduledDate}} à {{scheduledTime}}</li>
          <li><strong>Localisation :</strong> {{locationCity}}</li>
        </ul>
        <p>
          <a href="{{acceptUrl}}">Accepter la mission</a> |
          <a href="{{refuseUrl}}">Refuser</a>
        </p>
        <p>L'équipe Express Quote</p>
      `
    }, undefined, true); // skipCompilation = true

    template.addTags('professional', 'attribution', 'email');

    return template;
  }

}

// =============================================================================
// 📝 EXEMPLE D'UTILISATION COMPLÈTE
// =============================================================================
/*
import { 
  NotificationTemplate,
  NotificationTemplateFactory,
  TemplateType,
  SupportedLanguage 
} from './NotificationTemplate';

// 1. Création via factory
const bookingTemplate = NotificationTemplateFactory.createBookingConfirmationTemplate();

// 2. Rendu avec variables
const variables = {
  'customer.name': 'Jean Dupont',
  'booking.id': 'BK-123456',
  'booking.service': 'Déménagement Paris → Lyon',
  'booking.date': '15 mars 2025',
  'booking.price': 850
};

const rendered = await bookingTemplate.render(SupportedLanguage.FR, variables);

console.log('Sujet:', rendered.subject);
console.log('HTML:', rendered.body);
console.log('Texte:', rendered.textBody);

// 3. Template personnalisé
const customTemplate = new NotificationTemplate(
  'promo-newsletter',
  'Newsletter promotionnelle',
  TemplateType.EMAIL_HTML,
  TemplateCategory.MARKETING,
  'Newsletter mensuelle avec offres spéciales'
);

customTemplate.addVariable({
  name: 'user.firstName',
  type: 'string',
  description: 'Prénom utilisateur',
  required: true
});

customTemplate.setContent(SupportedLanguage.FR, {
  version: '2.1.0',
  subject: '🎉 Offres spéciales {{user.firstName}} - Express Quote',
  body: '<h1>Bonjour {{user.firstName}},</h1><p>Découvrez nos offres du mois...</p>'
});

// 4. Métriques et performance
customTemplate.updateMetrics({
  deliveryRate: 0.96,
  openRate: 0.24,
  clickRate: 0.08
});

console.log('Score performance:', customTemplate.metrics.performanceScore);

// 5. Sérialisation
const json = customTemplate.toJSON();
const restored = NotificationTemplate.fromJSON(json);
*/
