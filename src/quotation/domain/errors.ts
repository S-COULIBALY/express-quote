export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class QuoteCalculationError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class RuleError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidContextError extends ValidationError {
  constructor(message: string) {
    super(message);
  }
} 