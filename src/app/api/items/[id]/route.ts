import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        template: true,
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        variants: {
          select: { id: true, name: true, price: true, customerId: true }
        }
      }
    })
    
    if (!item) {
      return Response.json(
        { error: 'Item non trouvé' },
        { status: 404 }
      )
    }
    
    return Response.json(item)
    
  } catch (error) {
    console.error('Erreur GET /api/items/[id]:', error)
    return Response.json(
      { error: 'Erreur lors de la récupération de l\'item' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    // Vérifier que l'item existe
    const existingItem = await prisma.item.findUnique({
      where: { id }
    })
    
    if (!existingItem) {
      return Response.json(
        { error: 'Item non trouvé' },
        { status: 404 }
      )
    }
    
    // Mise à jour de l'item
    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        price: body.price ? parseFloat(body.price) : undefined,
        workers: body.workers ? parseInt(body.workers) : undefined,
        duration: body.duration ? parseInt(body.duration) : undefined,
        features: body.features,
        includedDistance: body.includedDistance ? parseInt(body.includedDistance) : undefined,
        distanceUnit: body.distanceUnit,
        includes: body.includes,
        categoryId: body.categoryId,
        popular: body.popular,
        imagePath: body.imagePath,
        isActive: body.isActive,
        updatedAt: new Date()
      },
      include: {
        template: true,
        customer: true
      }
    })
    
    return Response.json(updatedItem)
    
  } catch (error) {
    console.error('Erreur PUT /api/items/[id]:', error)
    return Response.json(
      { error: 'Erreur lors de la mise à jour de l\'item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Vérifier que l'item existe
    const existingItem = await prisma.item.findUnique({
      where: { id }
    })
    
    if (!existingItem) {
      return Response.json(
        { error: 'Item non trouvé' },
        { status: 404 }
      )
    }
    
    // Supprimer l'item
    await prisma.item.delete({
      where: { id }
    })
    
    return Response.json({ 
      message: 'Item supprimé avec succès',
      deletedId: id 
    })
    
  } catch (error) {
    console.error('Erreur DELETE /api/items/[id]:', error)
    return Response.json(
      { error: 'Erreur lors de la suppression de l\'item' },
      { status: 500 }
    )
  }
} 