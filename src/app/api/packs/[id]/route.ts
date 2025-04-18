import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/packs/[id] - Récupération d'un pack spécifique
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const pack = await prisma.pack.findUnique({
      where: {
        id: params.id
      }
    })

    if (!pack) {
      return NextResponse.json(
        { error: 'Pack non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(pack)
  } catch (error) {
    console.error('Erreur lors de la récupération du pack:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du pack' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/packs/[id] - Mise à jour complète d'un pack
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const data = await request.json()
    
    // Vérifier si le pack existe
    const packExists = await prisma.pack.findUnique({
      where: { id }
    })
    
    if (!packExists) {
      return NextResponse.json(
        { error: 'Pack non trouvé' },
        { status: 404 }
      )
    }
    
    // Validation de base
    if (!data.name || !data.description || data.price === undefined) {
      return NextResponse.json(
        { error: 'Données de pack incomplètes' },
        { status: 400 }
      )
    }
    
    // Mise à jour du pack
    // @ts-ignore - Ignorer les erreurs de type pour la mise à jour
    const updatedPack = await prisma.pack.update({
      where: { id },
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
        popular: data.popular || false
      }
    })
    
    return NextResponse.json(updatedPack)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du pack:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du pack' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/packs/[id] - Mise à jour partielle d'un pack
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const data = await request.json()
    
    // Vérifier si le pack existe
    const packExists = await prisma.pack.findUnique({
      where: { id }
    })
    
    if (!packExists) {
      return NextResponse.json(
        { error: 'Pack non trouvé' },
        { status: 404 }
      )
    }
    
    // Mise à jour partielle du pack
    // @ts-ignore - Ignorer les erreurs de type pour la mise à jour partielle
    const updatedPack = await prisma.pack.update({
      where: { id },
      data
    })
    
    return NextResponse.json(updatedPack)
  } catch (error) {
    console.error('Erreur lors de la mise à jour partielle du pack:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour partielle du pack' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/packs/[id] - Suppression d'un pack
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    
    // Vérifier si le pack existe
    const packExists = await prisma.pack.findUnique({
      where: { id }
    })
    
    if (!packExists) {
      return NextResponse.json(
        { error: 'Pack non trouvé' },
        { status: 404 }
      )
    }
    
    // Suppression logique du pack (mise à jour de isAvailable à false)
    // @ts-ignore - Ignorer les erreurs de type pour la mise à jour
    await prisma.pack.update({
      where: { id },
      data: { isAvailable: false }
    })
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Erreur lors de la suppression du pack:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du pack' },
      { status: 500 }
    )
  }
} 