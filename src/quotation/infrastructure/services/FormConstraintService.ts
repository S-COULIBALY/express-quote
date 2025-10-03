/**
 * 🎛️ Service de contraintes de formulaires dynamiques
 *
 * Ce service gère les contraintes des modaux (déménagement et nettoyage)
 * en lisant dynamiquement les règles CONSTRAINT depuis la table Rule.
 *
 * Remplace les contraintes codées en dur dans les formulaires.
 */

import { UnifiedDataService, ServiceType, RuleType, UnifiedRule } from './UnifiedDataService';
import { logger } from '@/lib/logger';

export interface FormConstraint {
  field: string;
  type: 'min' | 'max' | 'required' | 'pattern' | 'range';
  value: number | string | [number, number];
  message: string;
  condition?: Record<string, any>;
  priority: number;
}

export interface ModalConstraints {
  serviceType: ServiceType;
  constraints: FormConstraint[];
  metadata: {
    totalRules: number;
    lastUpdated: Date;
    source: 'database' | 'fallback';
  };
}

/**
 * Service pour les contraintes dynamiques des formulaires
 */
export class FormConstraintService {
  private static instance: FormConstraintService;
  private unifiedDataService: UnifiedDataService;

  private constructor() {
    this.unifiedDataService = UnifiedDataService.getInstance();
  }

  static getInstance(): FormConstraintService {
    if (!FormConstraintService.instance) {
      FormConstraintService.instance = new FormConstraintService();
    }
    return FormConstraintService.instance;
  }

  /**
   * Récupère toutes les contraintes pour un service (déménagement ou nettoyage)
   */
  async getConstraintsForService(serviceType: ServiceType): Promise<ModalConstraints> {
    try {
      logger.info(`🎛️ Chargement des contraintes pour ${serviceType}`);

      const constraintRules = await this.unifiedDataService.getConstraintRules(serviceType);

      if (constraintRules.length === 0) {
        logger.warn(`⚠️ Aucune contrainte trouvée pour ${serviceType}, utilisation du fallback`);
        return this.getFallbackConstraints(serviceType);
      }

      const constraints = this.convertRulesToConstraints(constraintRules);

      logger.info(`✅ ${constraints.length} contraintes chargées pour ${serviceType}`);

      return {
        serviceType,
        constraints,
        metadata: {
          totalRules: constraintRules.length,
          lastUpdated: new Date(),
          source: 'database'
        }
      };

    } catch (error) {
      logger.error(error as Error, `❌ Erreur lors du chargement des contraintes pour ${serviceType}`);
      return this.getFallbackConstraints(serviceType);
    }
  }

  /**
   * Récupère les contraintes pour le modal de déménagement
   */
  async getMovingConstraints(): Promise<ModalConstraints> {
    return this.getConstraintsForService(ServiceType.MOVING);
  }

  /**
   * Récupère les contraintes pour le modal de nettoyage
   */
  async getCleaningConstraints(): Promise<ModalConstraints> {
    return this.getConstraintsForService(ServiceType.CLEANING);
  }

  /**
   * Génère les règles de validation pour un formulaire spécifique
   */
  async generateValidationRules(serviceType: ServiceType): Promise<Record<string, any>> {
    const modalConstraints = await this.getConstraintsForService(serviceType);
    const validationRules: Record<string, any> = {};

    for (const constraint of modalConstraints.constraints) {
      if (!validationRules[constraint.field]) {
        validationRules[constraint.field] = {};
      }

      switch (constraint.type) {
        case 'min':
          validationRules[constraint.field].min = {
            value: constraint.value as number,
            message: constraint.message
          };
          break;

        case 'max':
          validationRules[constraint.field].max = {
            value: constraint.value as number,
            message: constraint.message
          };
          break;

        case 'required':
          validationRules[constraint.field].required = constraint.message;
          break;

        case 'pattern':
          validationRules[constraint.field].pattern = {
            value: new RegExp(constraint.value as string),
            message: constraint.message
          };
          break;

        case 'range':
          const [min, max] = constraint.value as [number, number];
          validationRules[constraint.field].min = {
            value: min,
            message: `Minimum ${min}`
          };
          validationRules[constraint.field].max = {
            value: max,
            message: `Maximum ${max}`
          };
          break;
      }
    }

    logger.info(`📋 Règles de validation générées pour ${serviceType}: ${Object.keys(validationRules).length} champs`);
    return validationRules;
  }

  /**
   * Valide une valeur selon les contraintes
   */
  async validateField(serviceType: ServiceType, field: string, value: any): Promise<{ valid: boolean; errors: string[] }> {
    const modalConstraints = await this.getConstraintsForService(serviceType);
    const fieldConstraints = modalConstraints.constraints.filter(c => c.field === field);

    const errors: string[] = [];

    for (const constraint of fieldConstraints) {
      switch (constraint.type) {
        case 'min':
          if (typeof value === 'number' && value < (constraint.value as number)) {
            errors.push(constraint.message);
          }
          break;

        case 'max':
          if (typeof value === 'number' && value > (constraint.value as number)) {
            errors.push(constraint.message);
          }
          break;

        case 'required':
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            errors.push(constraint.message);
          }
          break;

        case 'pattern':
          if (typeof value === 'string' && !new RegExp(constraint.value as string).test(value)) {
            errors.push(constraint.message);
          }
          break;

        case 'range':
          const [min, max] = constraint.value as [number, number];
          if (typeof value === 'number' && (value < min || value > max)) {
            errors.push(constraint.message);
          }
          break;
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ========================================
  // MÉTHODES PRIVÉES
  // ========================================

  /**
   * Convertit les règles UnifiedRule en contraintes de formulaire
   */
  private convertRulesToConstraints(rules: UnifiedRule[]): FormConstraint[] {
    return rules.map(rule => {
      // Analyse du nom de la règle pour déterminer le type de contrainte
      const constraint: FormConstraint = {
        field: this.extractFieldFromRule(rule),
        type: this.extractConstraintType(rule),
        value: rule.value,
        message: rule.description || `Contrainte: ${rule.name}`,
        priority: rule.priority
      };

      // Ajouter les conditions si elles existent
      if (rule.condition) {
        constraint.condition = rule.condition;
      }

      return constraint;
    }).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Extrait le nom du champ depuis une règle
   */
  private extractFieldFromRule(rule: UnifiedRule): string {
    // Utiliser le configKey ou analyser le nom
    if (rule.configKey) {
      // Exemple: MOVING_VOLUME_MIN → volume
      const parts = rule.configKey.toLowerCase().split('_');
      if (parts.length >= 2) {
        return parts[1]; // volume, distance, workers, etc.
      }
    }

    // Fallback: analyser le nom de la règle
    const name = rule.name.toLowerCase();
    if (name.includes('volume')) return 'volume';
    if (name.includes('distance')) return 'distance';
    if (name.includes('worker') || name.includes('ouvrier')) return 'workers';
    if (name.includes('floor') || name.includes('étage')) return 'floor';
    if (name.includes('surface') || name.includes('m²')) return 'squareMeters';
    if (name.includes('room') || name.includes('pièce')) return 'numberOfRooms';

    // Fallback par défaut
    return 'general';
  }

  /**
   * Extrait le type de contrainte depuis une règle
   */
  private extractConstraintType(rule: UnifiedRule): FormConstraint['type'] {
    const name = rule.name.toLowerCase();
    const configKey = rule.configKey?.toLowerCase() || '';

    if (name.includes('minimum') || configKey.includes('min')) return 'min';
    if (name.includes('maximum') || configKey.includes('max')) return 'max';
    if (name.includes('require') || name.includes('obligatoire')) return 'required';
    if (name.includes('pattern') || name.includes('format')) return 'pattern';
    if (name.includes('range') || name.includes('plage')) return 'range';

    // Par défaut, traiter comme une limite minimum ou maximum selon la catégorie
    switch (rule.category) {
      case 'MINIMUM':
        return 'min';
      case 'MAXIMUM':
        return 'max';
      default:
        return 'min';
    }
  }

  /**
   * Contraintes de fallback en cas de problème avec la BDD
   */
  private getFallbackConstraints(serviceType: ServiceType): ModalConstraints {
    logger.warn(`🔄 Utilisation des contraintes de fallback pour ${serviceType}`);

    const constraints: FormConstraint[] = [];

    switch (serviceType) {
      case ServiceType.MOVING:
        constraints.push(
          {
            field: 'volume',
            type: 'min',
            value: 1,
            message: 'Le volume minimum est de 1 m³',
            priority: 10
          },
          {
            field: 'volume',
            type: 'max',
            value: 200,
            message: 'Le volume maximum est de 200 m³',
            priority: 20
          },
          {
            field: 'distance',
            type: 'min',
            value: 1,
            message: 'La distance minimum est de 1 km',
            priority: 30
          },
          {
            field: 'workers',
            type: 'min',
            value: 1,
            message: 'Au minimum 1 déménageur requis',
            priority: 40
          },
          {
            field: 'workers',
            type: 'max',
            value: 10,
            message: 'Maximum 10 déménageurs',
            priority: 50
          }
        );
        break;

      case ServiceType.CLEANING:
        constraints.push(
          {
            field: 'squareMeters',
            type: 'min',
            value: 10,
            message: 'Surface minimum de 10 m²',
            priority: 10
          },
          {
            field: 'squareMeters',
            type: 'max',
            value: 500,
            message: 'Surface maximum de 500 m²',
            priority: 20
          },
          {
            field: 'numberOfRooms',
            type: 'min',
            value: 1,
            message: 'Au minimum 1 pièce',
            priority: 30
          },
          {
            field: 'numberOfRooms',
            type: 'max',
            value: 20,
            message: 'Maximum 20 pièces',
            priority: 40
          }
        );
        break;

      default:
        logger.warn(`⚠️ Aucune contrainte de fallback définie pour ${serviceType}`);
    }

    return {
      serviceType,
      constraints,
      metadata: {
        totalRules: constraints.length,
        lastUpdated: new Date(),
        source: 'fallback'
      }
    };
  }
}