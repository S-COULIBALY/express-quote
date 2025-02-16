import { http, HttpResponse } from 'msw'
import { CleaningQuote, QuoteStatus } from '@/types/quote'
import { mockQuotes } from './testData'

interface UpdateQuoteRequest {
  status: QuoteStatus
}

export const handlers = [
  http.get('/api/cleaning', () => {
    return HttpResponse.json(mockQuotes)
  }),

  http.put('/api/cleaning/:id', async ({ params, request }) => {
    const { id } = params
    const { status } = await request.json() as UpdateQuoteRequest
    
    const quote = mockQuotes.find(q => q.id === id)
    if (!quote) {
      return new HttpResponse(null, { status: 404 })
    }

    quote.status = status
    return HttpResponse.json(quote)
  }),

  http.post('/api/cleaning', async ({ request }) => {
    const newQuote = await request.json() as Omit<CleaningQuote, 'id' | 'createdAt'>
    const quote: CleaningQuote = {
      ...newQuote,
      id: Math.random().toString(36).slice(2, 11),
      createdAt: new Date().toISOString()
    }
    mockQuotes.push(quote)
    return HttpResponse.json(quote, { status: 201 })
  })
] 