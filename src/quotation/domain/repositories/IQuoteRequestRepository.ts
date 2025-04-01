import { QuoteRequest } from '../entities/QuoteRequest';
import { QuoteRequestStatus } from '../enums/QuoteRequestStatus';

export interface IQuoteRequestRepository {
    save(quoteRequest: QuoteRequest): Promise<QuoteRequest>;
    findByTemporaryId(temporaryId: string): Promise<QuoteRequest | null>;
    findById(id: string): Promise<QuoteRequest | null>;
    updateStatus(id: string, status: QuoteRequestStatus): Promise<void>;
    findExpired(): Promise<QuoteRequest[]>;
    findAll(): Promise<QuoteRequest[]>;
} 