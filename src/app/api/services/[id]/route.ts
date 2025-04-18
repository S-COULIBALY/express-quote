import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/services/[id] - Récupération d'un service spécifique
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const service = await prisma.service.findUnique({
      where: {
        id: params.id
      }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(service)
  } catch (error) {
    console.error('Erreur lors de la récupération du service:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du service' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/services/[id] - Mise à jour complète d'un service
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const data = await request.json()
    
    // Vérifier si le service existe
    const serviceExists = await prisma.service.findUnique({
      where: { id }
    })
    
    if (!serviceExists) {
      return NextResponse.json(
        { error: 'Service non trouvé' },
        { status: 404 }
      )
    }
    
    // Validation de base
    if (!data.name || !data.description || data.price === undefined || !data.duration) {
      return NextResponse.json(
        { error: 'Données de service incomplètes' },
        { status: 400 }
      )
    }
    
    // Mise à jour du service
    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        duration: data.duration,
        workers: data.workers || 1,
        categoryId: data.categoryId,
        includes: data.includes || [],
        features: data.features || [],
        imagePath: data.imagePath
      }
    })
    
    return NextResponse.json(updatedService)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du service:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du service' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/services/[id] - Mise à jour partielle d'un service
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const data = await request.json()
    
    // Vérifier si le service existe
    const serviceExists = await prisma.service.findUnique({
      where: { id }
    })
    
    if (!serviceExists) {
      return NextResponse.json(
        { error: 'Service non trouvé' },
        { status: 404 }
      )
    }
    
    // Mise à jour partielle du service
    const updatedService = await prisma.service.update({
      where: { id },
      data
    })
    
    return NextResponse.json(updatedService)
  } catch (error) {
    console.error('Erreur lors de la mise à jour partielle du service:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour partielle du service' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/services/[id] - Suppression d'un service
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    
    // Vérifier si le service existe
    const serviceExists = await prisma.service.findUnique({
      where: { id }
    })
    
    if (!serviceExists) {
      return NextResponse.json(
        { error: 'Service non trouvé' },
        { status: 404 }
      )
    }
    
    // Suppression logique du service (mise à jour de isActive à false)
    await prisma.service.update({
      where: { id },
      data: { isActive: false }
    })
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Erreur lors de la suppression du service:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du service' },
      { status: 500 }
    )
  }
} 