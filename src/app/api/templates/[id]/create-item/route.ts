import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: templateId } = params
    const body = await request.json()
    
    // Vérifier que le template existe
    const template = await prisma.template.findUnique({
      where: { id: templateId }
    })
    
    if (!template) {
      return Response.json(
        { error: 'Template non trouvé' },
        { status: 404 }
      )
    }
    
    // Validation du customerId requis
    if (!body.customerId) {
      return Response.json(
        { error: 'customerId est requis pour créer un item' },
        { status: 400 }
      )
    }
    
    // Créer l'item basé sur le template
    const newItem = await prisma.item.create({
      data: {
        // Copier les propriétés du template
        type: template.type,
        name: body.name || template.name,
        description: body.description || template.description,
        price: body.price ? parseFloat(body.price) : template.price,
        workers: body.workers ? parseInt(body.workers) : template.workers,
        duration: body.duration ? parseInt(body.duration) : template.duration,
        features: body.features || template.features,
        includedDistance: body.includedDistance ? parseInt(body.includedDistance) : template.includedDistance,
        distanceUnit: body.distanceUnit || template.distanceUnit,
        includes: body.includes || template.includes,
        categoryId: body.categoryId || template.categoryId,
        imagePath: body.imagePath || template.imagePath,
        
        // Propriétés spécifiques à l'item
        customerId: body.customerId,
        templateId: templateId,
        bookingId: body.bookingId,
        
        // Propriétés par défaut
        popular: false,
        isActive: true
      },
      include: {
        template: {
          select: { id: true, name: true, price: true }
        },
        customer: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    })
    
    return Response.json({
      message: 'Item créé avec succès à partir du template',
      item: newItem,
      templateUsed: {
        id: template.id,
        name: template.name
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Erreur POST /api/templates/[id]/create-item:', error)
    return Response.json(
      { error: 'Erreur lors de la création de l\'item à partir du template' },
      { status: 500 }
    )
  }
}

// Endpoint pour prévisualiser ce qui sera créé
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: templateId } = params
    
    // Récupérer le template
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: {
        _count: {
          select: { items: true }
        }
      }
    })
    
    if (!template) {
      return Response.json(
        { error: 'Template non trouvé' },
        { status: 404 }
      )
    }
    
    // Retourner les données qui seront utilisées pour créer l'item
    return Response.json({
      template,
      preview: {
        type: template.type,
        name: template.name,
        description: template.description,
        price: template.price,
        workers: template.workers,
        duration: template.duration,
        features: template.features,
        includedDistance: template.includedDistance,
        distanceUnit: template.distanceUnit,
        includes: template.includes,
        categoryId: template.categoryId,
        imagePath: template.imagePath,
        note: 'Ces valeurs peuvent être modifiées lors de la création de l\'item'
      },
      usage: {
        timesUsed: template._count.items,
        lastUsed: null // Sera calculé côté client si nécessaire
      }
    })
    
  } catch (error) {
    console.error('Erreur GET /api/templates/[id]/create-item:', error)
    return Response.json(
      { error: 'Erreur lors de la récupération du template' },
      { status: 500 }
    )
  }
} 