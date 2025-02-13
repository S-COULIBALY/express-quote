import { NextResponse } from 'next/server'
import type { MovingQuote, QuoteStatus } from '@/types/quote'

interface UpdateQuoteRequest {
  status: QuoteStatus
  preferredDate?: string
  preferredTime?: string
  totalCost?: number
}

// GET /api/moving/[id] - Récupérer un devis spécifique
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const quote = await getQuoteFromDB(id)

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(quote)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
      { status: 500 }
    )
  }
}

// PATCH /api/moving/[id] - Mettre à jour un devis
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const updates = await request.json() as UpdateQuoteRequest
    const updatedQuote = await updateQuoteInDB(id, updates)

    return NextResponse.json(updatedQuote)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update quote' },
      { status: 500 }
    )
  }
}

// DELETE /api/moving/[id] - Supprimer un devis
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    await deleteQuoteFromDB(id)

    return NextResponse.json(
      { message: 'Quote deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete quote' },
      { status: 500 }
    )
  }
}

async function getQuoteFromDB(id: string): Promise<MovingQuote | null> {
  // TODO: Implémenter la récupération depuis la base de données
  return {
    id,
    status: 'pending',
    pickupAddress: '123 Rue du Départ',
    deliveryAddress: '456 Rue d\'Arrivée',
    preferredDate: '2024-04-01',
    preferredTime: 'morning',
    volume: '30',
    options: {
      packing: false,
      assembly: false,
      insurance: true
    },
    estimatedPrice: 500,
    createdAt: new Date().toISOString()
  }
}

async function updateQuoteInDB(id: string, updates: UpdateQuoteRequest): Promise<MovingQuote> {
  const quote = await getQuoteFromDB(id)
  if (!quote) {
    throw new Error('Quote not found')
  }
  return { ...quote, ...updates }
}

async function deleteQuoteFromDB(id: string): Promise<void> {
  // TODO: Implémenter la suppression dans la base de données
  console.log('Deleting quote:', id)
} 