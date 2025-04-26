import { ServiceType } from '../enums/ServiceType';
import { QuoteContext } from '../valueObjects/QuoteContext';
import { Money } from '../valueObjects/Money';

/**
 * Type de règle métier
 */
export enum RuleType {
    PRICE_MODIFIER = 'PRICE_MODIFIER',
    DISCOUNT = 'DISCOUNT',
    VALIDATION = 'VALIDATION',
    INFORMATION = 'INFORMATION'
}

/**
 * Interface pour une règle métier dans le domaine
 */
export interface IRule {
    id: number;
    name: string;
    description: string;
    serviceType: string;
    value: number;
    isActive: boolean;
}

/**
 * Interface pour une règle business avec pourcentage ou montant
 */
export interface IBusinessRule {
    name: string;
    percentage?: number;
    amount?: number;
    condition?: string | ((context: any) => boolean);
}

/**
 * Interface pour une règle persistée en base de données
 */
export interface IPersistedRule {
    id?: string;
    name: string;
    type: string;
    value: string | number;
    condition?: string;
    serviceType: ServiceType;
    priority: number;
}

// Alias pour la compatibilité avec le code existant
export type IRuleAlias = IPersistedRule;

// Interface pour la conversion entre les deux formats
export interface IRuleMapper {
    toPersistedRule(rule: IBusinessRule): IPersistedRule;
    toBusinessRule(rule: IPersistedRule): IBusinessRule;
} 