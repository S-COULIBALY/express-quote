import { NextResponse } from 'next/server'

// GET /api/moving/[id] - Récupérer un devis spécifique
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    // TODO: Récupérer le devis depuis la base de données
    const quote = {
      id,
      // autres données du devis
    }

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

// PUT /api/moving/[id] - Mettre à jour un devis
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const data = await request.json()

    // TODO: Mettre à jour le devis dans la base de données
    const updatedQuote = {
      id,
      ...data,
      updatedAt: new Date().toISOString()
    }

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
    await deleteMovingQuote(id)

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

async function deleteMovingQuote(id: string): Promise<void> {
  console.log('Deleting moving quote:', id)
} 