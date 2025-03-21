import { QuoteContext } from '../../domain/valueObjects/QuoteContext';
import { Quote } from '../../domain/valueObjects/Quote';
import { QuoteFactory } from '../factories/QuoteFactory';
import { QuoteRequestDto, validateQuoteRequest } from '../../interfaces/http/dtos/QuoteRequestDto';
import { ValidationError } from '../../interfaces/http/ValidationError';
import { QuoteAssembler } from '../assemblers/QuoteAssembler';

export class QuoteController {
  constructor(private readonly quoteFactory: QuoteFactory) {}

  async calculateQuote(data: Record<string, any>): Promise<Quote> {
    // 1. Validation des données d'entrée via DTO
    let validatedData: QuoteRequestDto;
    try {
      validatedData = validateQuoteRequest(data);
    } catch (error) {
      throw new ValidationError(error instanceof Error ? error.message : 'Invalid request data');
    }

    // 2. Assemblage du contexte avec les Value Objects
    const contextData = QuoteAssembler.assembleContext(validatedData);

    // 3. Création du contexte métier
    const context = new QuoteContext(contextData);

    // 4. Obtention du calculateur approprié
    const calculator = this.quoteFactory.createCalculator(context.getServiceType());

    // 5. Calcul du devis
    return calculator.calculate(context);
  }
} 