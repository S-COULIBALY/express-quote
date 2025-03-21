import { Quote } from '../valueObjects/Quote';
import { QuoteContext } from '../valueObjects/QuoteContext';
import { Money } from '../valueObjects/Money';

export interface IQuoteCalculator {
  calculate(context: QuoteContext): Promise<Quote>;
  getBasePrice(context: QuoteContext): Money;
} 