import { rest } from 'msw'
import { CleaningQuote, QuoteStatus } from '@/types/quote'
import { mockQuotes } from './testData'

interface UpdateQuoteRequest {
  status: QuoteStatus
}

export const handlers = [
  rest.get('/api/cleaning', (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockQuotes))
  }),

  rest.put('/api/cleaning/:id', async (req, res, ctx) => {
    const { id } = req.params
    const { status } = await req.json() as UpdateQuoteRequest
    
    const quote = mockQuotes.find(q => q.id === id)
    if (!quote) {
      return res(ctx.status(404))
    }

    quote.status = status
    return res(ctx.status(200), ctx.json(quote))
  }),

  rest.post('/api/cleaning', async (req, res, ctx) => {
    const newQuote = await req.json() as Omit<CleaningQuote, 'id' | 'createdAt'>
    const quote: CleaningQuote = {
      ...newQuote,
      id: Math.random().toString(36).slice(2, 11),
      createdAt: new Date().toISOString()
    }
    mockQuotes.push(quote)
    return res(ctx.status(201), ctx.json(quote))
  })
] 