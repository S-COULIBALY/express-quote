import { ServiceType } from '../entities/Service';

export interface IBusinessRule {
    name: string;
    percentage?: number;
    amount?: number;
    condition?: (context: any) => boolean;
}

export interface IPersistedRule {
    id?: number;
    name: string;
    type: string;
    value: number;
    condition?: string;
    activityType?: string;
}

// Alias pour la compatibilité avec le code existant
export type IRule = IPersistedRule;

// Interface pour la conversion entre les deux formats
export interface IRuleMapper {
    toPersistedRule(rule: IBusinessRule): IPersistedRule;
    toBusinessRule(rule: IPersistedRule): IBusinessRule;
} 