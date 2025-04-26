import { IRule, RuleType } from '../../domain/interfaces/IRule';
import { ServiceType } from '../../domain/enums/ServiceType';

export interface IPersistedRule {
  id: string;
  name: string;
  description?: string;
  type: string;
  value: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convertit une règle persistée en règle de domaine
 */
export function convertToRule(persistedRule: IPersistedRule): IRule {
  return {
    id: persistedRule.id || crypto.randomUUID(),
    name: persistedRule.name,
    type: persistedRule.type as RuleType,
    value: persistedRule.value,
    condition: createConditionFunction(persistedRule.condition),
    serviceType: persistedRule.serviceType,
    priority: persistedRule.priority
  };
}

/**
 * Convertit une règle de domaine en règle persistée
 */
export function convertToPersistedRule(rule: IRule): IPersistedRule {
  return {
    id: rule.id,
    name: rule.name,
    type: rule.type,
    value: rule.value,
    condition: typeof rule.condition === 'function' ? 
      rule.condition.toString() : undefined,
    serviceType: rule.serviceType,
    priority: rule.priority
  };
}

/**
 * Crée une fonction de condition à partir d'une chaîne JSON
 */
function createConditionFunction(conditionStr?: string): (context: any) => boolean {
  if (!conditionStr) {
    // Retourne une fonction qui accepte toujours si pas de condition
    return () => true;
  }

  try {
    // Tente de parser la condition
    const conditionObj = JSON.parse(conditionStr);
    
    return (context: any) => {
      try {
        // Évalue la condition basée sur l'objet condition et le contexte
        return evaluateCondition(conditionObj, context);
      } catch (error) {
        console.error('Erreur lors de l\'évaluation de la condition:', error);
        return false;
      }
    };
  } catch (error) {
    console.error('Erreur lors du parsing de la condition:', error);
    return () => false;
  }
}

/**
 * Évalue une condition en fonction du contexte
 */
function evaluateCondition(condition: any, context: any): boolean {
  // Si c'est une condition de comparaison simple
  if (condition.field && condition.operator && condition.value !== undefined) {
    const fieldValue = getNestedPropertyValue(context, condition.field);
    
    switch (condition.operator) {
      case '==': return fieldValue == condition.value;
      case '===': return fieldValue === condition.value;
      case '!=': return fieldValue != condition.value;
      case '!==': return fieldValue !== condition.value;
      case '>': return fieldValue > condition.value;
      case '>=': return fieldValue >= condition.value;
      case '<': return fieldValue < condition.value;
      case '<=': return fieldValue <= condition.value;
      case 'includes': return Array.isArray(fieldValue) && fieldValue.includes(condition.value);
      case 'startsWith': return typeof fieldValue === 'string' && fieldValue.startsWith(condition.value);
      case 'endsWith': return typeof fieldValue === 'string' && fieldValue.endsWith(condition.value);
      default: return false;
    }
  } 
  // Si c'est une condition 'AND'
  else if (condition.AND && Array.isArray(condition.AND)) {
    return condition.AND.every((subCond: any) => evaluateCondition(subCond, context));
  } 
  // Si c'est une condition 'OR'
  else if (condition.OR && Array.isArray(condition.OR)) {
    return condition.OR.some((subCond: any) => evaluateCondition(subCond, context));
  } 
  // Si c'est une condition 'NOT'
  else if (condition.NOT) {
    return !evaluateCondition(condition.NOT, context);
  }
  
  return false;
}

/**
 * Récupère la valeur d'une propriété imbriquée dans un objet
 */
function getNestedPropertyValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

/**
 * Utilitaire pour convertir un ensemble de règles
 */
export function convertToRules(persistedRules: IPersistedRule[]): IRule[] {
  return persistedRules.map(convertToRule);
} 