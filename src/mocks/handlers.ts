import { http, HttpResponse } from 'msw'
import { CleaningQuote, QuoteStatus } from '@/types/quote'
import { mockQuotes } from './testData'

interface UpdateQuoteRequest {
  status: QuoteStatus
}

export const handlers = [] 