import { http, HttpResponse } from 'msw'
import { CleaningQuote, QuoteStatus } from '@/types/quote'
import { mockQuotes } from './testData'
import { rest } from 'msw'

interface UpdateQuoteRequest {
  status: QuoteStatus
}

export const handlers = [] 