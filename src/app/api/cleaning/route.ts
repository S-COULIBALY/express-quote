import { NextResponse } from 'next/server'
import type { CleaningQuote } from '@/types/quote'

// GET /api/cleaning - Récupérer tous les devis de nettoyage
export async function GET() {
  try {
    // TODO: Implémenter la connexion à la base de données
    const quotes = [] // Remplacer par la vraie requête
    return NextResponse.json(quotes)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch cleaning quotes' },
      { status: 500 }
    )
  }
}

interface CreateQuoteRequest extends Omit<CleaningQuote, 'id' | 'createdAt'> {
  propertyType: string
  squareMeters: string
  numberOfRooms: string
  preferredDate: string
}

// POST /api/cleaning - Créer un nouveau devis de nettoyage
export async function POST(request: Request) {
  try {
    const newQuote = await request.json() as CreateQuoteRequest
    
    // TODO: Calculer le prix estimé en fonction des critères
    const estimatedPrice = calculateCleaningPrice(newQuote)
    
    // TODO: Sauvegarder dans la base de données
    // Définir un type explicite pour le statut
    type QuoteStatus = 'pending' | 'paid' | 'completed' | 'cancelled'

    const quote = {
      id: 'temp-id', // Remplacer par l'ID généré
      ...newQuote,
      estimatedPrice,
      status: 'pending' as QuoteStatus,
      createdAt: new Date().toISOString()
    }

    return NextResponse.json(quote, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create cleaning quote' },
      { status: 500 }
    )
  }
}

// Fonction utilitaire pour calculer le prix
function calculateCleaningPrice(data: CreateQuoteRequest): number {
  let basePrice = 0

  // Prix de base selon le type de propriété
  switch (data.propertyType) {
    case 'apartment':
      basePrice = 100
      break
    case 'house':
      basePrice = 150
      break
    case 'office':
      basePrice = 200
      break
    case 'commercial':
      basePrice = 300
      break
  }

  // Ajustements selon la surface et le nombre de pièces
  basePrice += Number(data.squareMeters) * 0.5
  basePrice += Number(data.numberOfRooms) * 20
  basePrice += Number(data.numberOfBathrooms) * 30

  // Multiplicateur selon le type de nettoyage
  switch (data.cleaningType) {
    case 'deep':
      basePrice *= 1.5
      break
    case 'move-in':
      basePrice *= 1.3
      break
    case 'post-construction':
      basePrice *= 1.8
      break
  }

  return Math.round(basePrice)
} 