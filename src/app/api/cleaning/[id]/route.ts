import { NextResponse } from 'next/server'
import type { CleaningQuote, QuoteStatus } from '@/types/quote'

interface UpdateQuoteRequest {
  status: QuoteStatus
  preferredDate?: string
  preferredTime?: string
}

// GET /api/cleaning/[id] - Récupérer un devis de nettoyage spécifique
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const quote = await getQuoteFromDB(params.id)

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

// PATCH /api/cleaning/[id] - Mettre à jour un devis
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json() as UpdateQuoteRequest
    const updatedQuote = await updateQuoteInDB(params.id, updates)

    return NextResponse.json(updatedQuote)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update quote' },
      { status: 500 }
    )
  }
}

// DELETE /api/cleaning/[id] - Supprimer un devis
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await deleteQuoteFromDB(params.id)

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

async function getQuoteFromDB(id: string): Promise<CleaningQuote | null> {
  // TODO: Implémenter la récupération depuis la base de données
  return {
    id,
    propertyType: 'apartment',
    squareMeters: '80',
    numberOfRooms: '3',
    numberOfBathrooms: '1',
    cleaningType: 'standard',
    frequency: 'one-time',
    preferredDate: '2024-04-01',
    preferredTime: '09:00',
    status: 'pending',
    estimatedPrice: 250,
    createdAt: new Date().toISOString(),
    options: {
      windows: false,
      deepCleaning: false,
      carpets: false,
      furniture: false,
      appliances: false
    },
    specialRequests: '' // Ajout si c'est un champ requis
  }
}

async function updateQuoteInDB(id: string, updates: UpdateQuoteRequest): Promise<CleaningQuote> {
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