import { rest } from 'msw'
import { CleaningQuote, QuoteStatus } from '@/types/quote'
import { mockQuotes } from './testData'

export const handlers = [
  rest.get('/api/cleaning', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockQuotes))
  }),

  rest.put('/api/cleaning/:id', (req, res, ctx) => {
    const { id } = req.params
    const { status } = req.body as { status: QuoteStatus }
    
    const quote = mockQuotes.find(q => q.id === id)
    if (!quote) {
      return res(ctx.status(404))
    }

    quote.status = status
    return res(ctx.status(200), ctx.json(quote))
  }),

  rest.post('/api/cleaning', (req, res, ctx) => {
    const newQuote = req.body as Omit<CleaningQuote, 'id' | 'createdAt'>
    const quote: CleaningQuote = {
      ...newQuote,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    }
    mockQuotes.push(quote)
    return res(ctx.status(201), ctx.json(quote))
  })
] 