import { ServiceType } from '../../domain/entities/Service';
import { IQuoteCalculator } from '../../domain/interfaces/IQuoteCalculator';
import { CleaningQuoteCalculator } from '../../domain/calculators/CleaningQuoteCalculator';
import { MovingQuoteCalculator } from '../../domain/calculators/MovingQuoteCalculator';
import { Rule } from '../../domain/valueObjects/Rule';

export class QuoteFactory {
  private readonly calculators = new Map<ServiceType, IQuoteCalculator>();

  constructor(rules: Rule[]) {
    this.calculators.set(ServiceType.CLEANING, new CleaningQuoteCalculator(rules));
    this.calculators.set(ServiceType.MOVING, new MovingQuoteCalculator(rules));
  }

  createCalculator(serviceType: ServiceType): IQuoteCalculator {
    const calculator = this.calculators.get(serviceType);
    if (!calculator) {
      throw new Error(`No calculator found for service type: ${serviceType}`);
    }
    return calculator;
  }
} 




