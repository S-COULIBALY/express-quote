import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/packs - Récupération de tous les packs
 */
export async function GET() {
  try {
    // @ts-ignore - Ignorer les erreurs de type pour la requête
    const packs = await prisma.pack.findMany({
      where: {
        isAvailable: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(packs)
  } catch (error) {
    console.error('Erreur lors de la récupération des packs:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des packs' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/packs - Création d'un nouveau pack
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Validation de base
    if (!data.name || !data.description || data.price === undefined) {
      return NextResponse.json(
        { error: 'Données de pack incomplètes' },
        { status: 400 }
      )
    }
    
    // Création du pack avec les données validées
    // @ts-ignore - Ignorer les erreurs de type qui peuvent survenir
    const pack = await prisma.pack.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        duration: data.duration || 1,
        workers: data.workers || 1,
        includes: data.includes || [],
        features: data.features || [],
        includedDistance: data.includedDistance || 0,
        distanceUnit: data.distanceUnit || 'km',
        workersNeeded: data.workersNeeded || 1,
        categoryId: data.categoryId,
        content: data.content,
        imagePath: data.imagePath,
        isAvailable: true,
        popular: data.popular || false
      }
    })
    
    return NextResponse.json(pack, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du pack:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du pack' },
      { status: 500 }
    )
  }
} 