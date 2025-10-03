import { NextRequest, NextResponse } from 'next/server'
import { CatalogueController } from '@/quotation/interfaces/http/controllers/CatalogueController'

export async function GET(
  request: NextRequest,
  { params }: { params: { catalogId: string } }
) {
  const controller = new CatalogueController()
  return await controller.getCatalogue(request, { id: params.catalogId })
}

// Ajouter POST pour éviter les 404s (redirection vers GET)
export async function POST(
  request: NextRequest,
  { params }: { params: { catalogId: string } }
) {
  // Les POST vers cette route sont probablement des erreurs
  // Rediriger vers la méthode GET appropriée
  return NextResponse.json(
    { error: 'Method not allowed. Use GET for catalogue data.' },
    { status: 405 }
  )
}