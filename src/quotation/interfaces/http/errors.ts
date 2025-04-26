export class QuoteCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuoteCalculationError';
  }
} 