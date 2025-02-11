import { NextResponse } from 'next/server'
import type { MovingQuote } from '@/types/quote'

// GET /api/moving - Récupérer tous les devis
export async function GET() {
  try {
    // TODO: Implémenter la connexion à la base de données
    const quotes: MovingQuote[] = [] // Remplacer par la vraie requête
    return NextResponse.json(quotes)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    )
  }
}

// POST /api/moving - Créer un nouveau devis
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // TODO: Valider les données et sauvegarder dans la base de données
    const newQuote: MovingQuote = {
      id: Date.now().toString(),
      ...data,
      totalCost: 0 // À calculer selon la logique métier
    }

    return NextResponse.json(newQuote, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create quote' },
      { status: 500 }
    )
  }
} 