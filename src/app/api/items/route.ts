import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Paramètres de filtrage
    const type = searchParams.get('type')
    const isActive = searchParams.get('is_active')
    const customerId = searchParams.get('customer_id')
    const templateId = searchParams.get('template_id')
    const popular = searchParams.get('popular')
    
    // Paramètres de pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    
    // Construction du filtre WHERE
    const where: any = {}
    
    if (type) {
      // Support pour plusieurs types séparés par des virgules
      const types = type.split(',').map(t => t.trim())
      if (types.length === 1) {
        where.type = types[0]
      } else {
        where.type = { in: types }
      }
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }
    
    if (customerId) {
      where.customerId = customerId
    }
    
    if (templateId) {
      where.templateId = templateId
    }
    
    if (popular !== null) {
      where.popular = popular === 'true'
    }
    
    // Exécution de la requête avec pagination
    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          template: {
            select: { id: true, name: true, price: true }
          },
          customer: {
            select: { id: true, firstName: true, lastName: true }
          }
        },
        orderBy: [
          { popular: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.item.count({ where })
    ])
    
    // Calcul de la pagination
    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1
    
    return Response.json({
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev
      },
      filters: {
        type,
        isActive,
        customerId,
        templateId,
        popular
      }
    })
    
  } catch (error) {
    console.error('Erreur API /api/items:', error)
    return Response.json(
      { error: 'Erreur lors de la récupération des items' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation des champs requis
    const { type, name, price, workers, duration } = body
    
    if (!type || !name || !price || !workers || !duration) {
      return Response.json(
        { error: 'Champs requis manquants: type, name, price, workers, duration' },
        { status: 400 }
      )
    }
    
    // Création de l'item
    const item = await prisma.item.create({
      data: {
        type,
        name,
        description: body.description,
        price: parseFloat(price),
        workers: parseInt(workers),
        duration: parseInt(duration),
        features: body.features || [],
        includedDistance: body.includedDistance ? parseInt(body.includedDistance) : null,
        distanceUnit: body.distanceUnit || 'km',
        includes: body.includes || [],
        categoryId: body.categoryId,
        popular: body.popular || false,
        imagePath: body.imagePath,
        templateId: body.templateId,
        customerId: body.customerId,
        bookingId: body.bookingId
      },
      include: {
        template: true,
        customer: true
      }
    })
    
    return Response.json(item, { status: 201 })
    
  } catch (error) {
    console.error('Erreur création item:', error)
    return Response.json(
      { error: 'Erreur lors de la création de l\'item' },
      { status: 500 }
    )
  }
} 