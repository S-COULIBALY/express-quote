/**
 * ============================================================================
 * CONSTRAINT TRANSFORMER SERVICE - Transformation des règles métier
 * ============================================================================
 *
 * 🎯 OBJECTIF :
 * Centraliser la transformation des règles métier depuis la BDD vers
 * les différents formats utilisés dans l'application (modaux, APIs, admin).
 *
 * 📋 FONCTIONNALITÉS :
 * - Transformation règles BDD → Format modal UI
 * - Transformation règles BDD → Format API REST
 * - Séparation contraintes vs services
 * - Enrichissement avec icônes via ConstraintIconService
 *
 * 🔧 UTILISATION :
 * ```typescript
 * const modalData = ConstraintTransformerService.transformRulesToModalFormat(
 *   businessRules,
 *   'MOVING'
 * );
 * // Returns: { constraints: [...], services: [...], allItems: [...] }
 * ```
 */

import { ConstraintIconService, ServiceType, ItemType } from './ConstraintIconService';

// Interface pour une règle métier depuis la BDD
export interface BusinessRule {
  id: string;
  name: string;
  description?: string;
  category: string;
  value: number;
  configKey?: string;
  serviceType?: string;
  isActive?: boolean;
  condition?: any;
}

// Interface pour une contrainte/service dans le format modal
export interface ModalConstraint {
  id: string;
  name: string;
  description?: string;
  category: string;
  type: ItemType;
  value?: number;
  impact?: string;
  icon: string;
  categoryLabel?: string;
  ruleId?: string;
  ruleCategory?: string;
  autoDetection?: boolean;
}

// Interface pour le résultat de transformation
export interface TransformedData {
  constraints: ModalConstraint[];
  services: ModalConstraint[];
  allItems: ModalConstraint[];
  meta: {
    totalConstraints: number;
    totalServices: number;
    serviceType: string;
    serviceName: string;
    source: string;
  };
}

export class ConstraintTransformerService {
  /**
   * Transformer les règles BDD vers le format modal
   */
  static transformRulesToModalFormat(
    businessRules: BusinessRule[],
    serviceType: ServiceType
  ): TransformedData {
    const serviceName = serviceType === 'MOVING' ? 'Déménagement' : 'Nettoyage';

    // Séparer contraintes et services
    const constraints: ModalConstraint[] = [];
    const services: ModalConstraint[] = [];

    for (const rule of businessRules) {
      // Déterminer le type (constraint ou service)
      const itemType = ConstraintIconService.classifyRule(
        rule.name,
        rule.category,
        serviceType
      );

      // Obtenir l'icône appropriée
      const icon = ConstraintIconService.getIconForRule(
        rule.name,
        serviceType,
        itemType
      );

      // Créer l'objet transformé
      const transformed: ModalConstraint = {
        id: rule.configKey || rule.id,
        name: rule.name,
        description: rule.description || `${itemType === 'constraint' ? 'Contrainte' : 'Service'}: ${rule.name}`,
        category: rule.category.toLowerCase(),
        type: itemType,
        value: rule.value,
        icon: icon,
        categoryLabel: ConstraintIconService.getCategoryLabel(rule.category.toLowerCase(), serviceType),
        ruleId: rule.id,
        ruleCategory: rule.category,
        autoDetection: rule.condition?.autoDetection || false
      };

      // Impact pour affichage (optionnel)
      if (itemType === 'constraint' && rule.value > 0) {
        transformed.impact = `+${rule.value}€`;
      } else if (itemType === 'service' && rule.value > 0) {
        transformed.impact = `+${rule.value}€`;
      }

      // Ajouter dans la bonne catégorie
      if (itemType === 'constraint') {
        constraints.push(transformed);
      } else {
        services.push(transformed);
      }
    }

    return {
      constraints,
      services,
      allItems: [...constraints, ...services],
      meta: {
        totalConstraints: constraints.length,
        totalServices: services.length,
        serviceType,
        serviceName,
        source: 'database'
      }
    };
  }

  /**
   * Transformer les règles BDD vers le format API
   * (Similar au format modal mais avec quelques différences)
   */
  static transformRulesToApiFormat(
    businessRules: BusinessRule[],
    serviceType: ServiceType
  ): any {
    const modalFormat = this.transformRulesToModalFormat(businessRules, serviceType);

    return {
      success: true,
      data: modalFormat,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Séparer les règles en contraintes et services avec filtrage avancé
   */
  static separateConstraintsAndServices(
    businessRules: BusinessRule[],
    serviceType: ServiceType
  ): { constraints: BusinessRule[]; services: BusinessRule[] } {
    const constraints: BusinessRule[] = [];
    const services: BusinessRule[] = [];

    for (const rule of businessRules) {
      const itemType = ConstraintIconService.classifyRule(
        rule.name,
        rule.category,
        serviceType
      );

      if (itemType === 'constraint') {
        constraints.push(rule);
      } else {
        services.push(rule);
      }
    }

    return { constraints, services };
  }

  /**
   * Enrichir une règle avec son icône
   */
  static enrichRuleWithIcon(
    rule: BusinessRule,
    serviceType: ServiceType
  ): BusinessRule & { icon: string } {
    const itemType = ConstraintIconService.classifyRule(
      rule.name,
      rule.category,
      serviceType
    );

    const icon = ConstraintIconService.getIconForRule(
      rule.name,
      serviceType,
      itemType
    );

    return {
      ...rule,
      icon
    };
  }

  /**
   * Grouper les contraintes par catégorie
   */
  static groupByCategory(
    constraints: ModalConstraint[]
  ): Record<string, ModalConstraint[]> {
    return constraints.reduce((groups, constraint) => {
      const category = constraint.category || 'other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(constraint);
      return groups;
    }, {} as Record<string, ModalConstraint[]>);
  }

  /**
   * Filtrer les contraintes actives uniquement
   */
  static filterActiveRules(businessRules: BusinessRule[]): BusinessRule[] {
    return businessRules.filter(rule => rule.isActive !== false);
  }

  /**
   * Trier les contraintes par valeur (impact) décroissant
   */
  static sortByImpact(constraints: ModalConstraint[]): ModalConstraint[] {
    return [...constraints].sort((a, b) => (b.value || 0) - (a.value || 0));
  }

  /**
   * Rechercher des contraintes par mots-clés
   */
  static searchConstraints(
    constraints: ModalConstraint[],
    query: string
  ): ModalConstraint[] {
    const lowerQuery = query.toLowerCase();
    return constraints.filter(c =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.description?.toLowerCase().includes(lowerQuery)
    );
  }
}
