import { Money } from './Money';
import { QuoteContext } from './QuoteContext';

// Création de l'interface IBusinessRule qui manquait
export interface IBusinessRule {
  apply(basePrice: Money, context?: QuoteContext): RuleApplicationResult;
}

export interface RuleApplicationResult {
    newPrice: Money;
    impact: number;
    isApplied: boolean;
}

export class Rule implements IBusinessRule {
    constructor(
        public readonly name: string,
        public readonly percentage?: number,
        public readonly amount?: number,
        public readonly condition?: (context: any) => boolean
    ) {
        this.validate();
    }

    private validate(): void {
        if (!this.name || this.name.trim().length === 0) {
            throw new Error('Rule name is required');
        }

        if (this.percentage !== undefined && this.amount !== undefined) {
            throw new Error('Rule cannot have both percentage and amount');
        }

        if (this.percentage !== undefined && (this.percentage < -100 || this.percentage > 100)) {
            throw new Error('Percentage must be between -100 and 100');
        }

        if (this.amount !== undefined && this.amount < 0) {
            throw new Error('Amount cannot be negative');
        }
    }

    public apply(basePrice: Money, context?: QuoteContext): RuleApplicationResult {
        if (!context) {
            return { newPrice: basePrice, impact: 0, isApplied: false };
        }

        try {
            // Vérifier si la condition existe et est satisfaite
            if (this.condition) {
                try {
                    if (!this.condition(context)) {
                        return { newPrice: basePrice, impact: 0, isApplied: false };
                    }
                } catch (error) {
                    console.error(`Error evaluating condition for rule ${this.name}:`, error);
                    return { newPrice: basePrice, impact: 0, isApplied: false };
                }
            }

            if (this.percentage !== undefined) {
                // Pour les règles en pourcentage, on calcule l'impact sur le prix de base
                const impact = Math.round(basePrice.getAmount() * (this.percentage / 100));
                return { 
                    newPrice: basePrice.add(new Money(impact)), 
                    impact: impact, 
                    isApplied: true 
                };
            }

            if (this.amount !== undefined) {
                let appliedAmount = this.amount;

                // Cas spéciaux nécessitant un calcul du montant
                switch (this.name) {
                    case 'pickup_floor_charge':
                    case 'delivery_floor_charge':
                        const floor = this.name.startsWith('pickup') ? 
                            context.getValue<number>('pickupFloor') ?? 0 :
                            context.getValue<number>('deliveryFloor') ?? 0;
                        const hasElevator = context.getValue<boolean>(
                            this.name.startsWith('pickup') ? 'pickupElevator' : 'deliveryElevator'
                        ) ?? false;
                        
                        if (!hasElevator && floor > 0) {
                            appliedAmount = this.amount * Math.min(floor, 3);
                        } else {
                            appliedAmount = 0;
                        }
                        break;

                    case 'long_distance':
                        const distance = context.getValue<number>('distance') ?? 0;
                        if (distance > 50) {
                            appliedAmount = this.amount * (distance - 50);
                        } else {
                            appliedAmount = 0;
                        }
                        break;
                        
                    case 'Tarif minimum':
                        const currentPrice = basePrice.getAmount();
                        if (currentPrice < this.amount) {
                            appliedAmount = this.amount - currentPrice;
                        } else {
                            appliedAmount = 0;
                        }
                        break;
                }

                return {
                    newPrice: basePrice.add(new Money(appliedAmount)),
                    impact: appliedAmount,
                    isApplied: appliedAmount !== 0
                };
            }

            return { newPrice: basePrice, impact: 0, isApplied: false };
        } catch (error) {
            console.error(`Error applying rule ${this.name}:`, error);
            return { newPrice: basePrice, impact: 0, isApplied: false };
        }
    }

    public equals(other: Rule): boolean {
        return this.name === other.name &&
            this.percentage === other.percentage &&
            this.amount === other.amount;
    }
}