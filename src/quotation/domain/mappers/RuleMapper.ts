import { IBusinessRule, IPersistedRule, IRuleMapper } from '../interfaces/IRule';
import { Rule } from '../valueObjects/Rule';

export class RuleMapper implements IRuleMapper {
    public toPersistedRule(rule: IBusinessRule): IPersistedRule {
        return {
            name: rule.name,
            type: this.determineType(rule),
            value: this.determineValue(rule),
            condition: rule.condition ? rule.condition.toString() : undefined,
            serviceType: "SERVICE",
            priority: 1
        };
    }

    public toBusinessRule(rule: IPersistedRule): IBusinessRule {
        return new Rule(
            rule.name,
            rule.serviceType.toString(),
            typeof rule.value === 'string' ? parseFloat(rule.value) : rule.value,
            rule.condition ? this.parseCondition(rule.condition) : undefined
        );
    }

    private determineType(rule: IBusinessRule): string {
        if (rule.percentage !== undefined) return 'PERCENTAGE';
        if (rule.amount !== undefined) return 'AMOUNT';
        throw new Error('Rule must have either percentage or amount');
    }

    private determineValue(rule: IBusinessRule): number {
        if (rule.percentage !== undefined) return rule.percentage;
        if (rule.amount !== undefined) return rule.amount;
        throw new Error('Rule must have either percentage or amount');
    }

    private parseCondition(conditionStr: string): (context: any) => boolean {
        try {
            return new Function('context', `return ${conditionStr}`) as (context: any) => boolean;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Invalid condition format: ${message}`);
        }
    }
} 