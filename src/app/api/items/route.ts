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
      where.is_active = isActive === 'true'
    }

    if (customerId) {
      where.customer_id = customerId
    }

    if (templateId) {
      where.template_id = templateId
    }
    
    if (popular !== null) {
      where.popular = popular === 'true'
    }
    
    // Exécution de la requête avec pagination
    const [items, total] = await Promise.all([
      prisma.items.findMany({
        where,
        include: {
          templates: {
            select: { id: true, name: true, price: true }
          },
          Customer: {
            select: { id: true, firstName: true, lastName: true }
          }
        },
        orderBy: [
          { popular: 'desc' },
          { created_at: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.items.count({ where })
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
    const item = await prisma.items.create({
      data: {
        id: crypto.randomUUID(),
        type,
        name,
        description: body.description,
        price: parseFloat(price),
        workers: parseInt(workers),
        duration: parseInt(duration),
        features: body.features || [],
        included_distance: body.includedDistance ? parseInt(body.includedDistance) : null,
        distance_unit: body.distanceUnit || 'km',
        includes: body.includes || [],
        category_id: body.categoryId,
        popular: body.popular || false,
        image_path: body.imagePath,
        template_id: body.templateId,
        customer_id: body.customerId,
        booking_id: body.bookingId,
        updated_at: new Date()
      },
      include: {
        templates: true,
        Customer: true
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