import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/services - Récupération de tous les services
 */
export async function GET() {
  console.log('🔍 API SERVICES: Début de la requête GET')
  
  try {
    console.log('🔍 API SERVICES: Tentative de récupération des services')
    
    // Version simplifiée sans filtre pour tester
    const services = await prisma.service.findMany({
      take: 100 // Limiter à 100 services pour éviter des problèmes de performance
    }).catch(error => {
      console.error('🔍 API SERVICES: Erreur Prisma:', error)
      throw error;
    });
    
    console.log(`🔍 API SERVICES: ${services.length} services trouvés`)
    // Log détaillé pour debugging
    if (services.length > 0) {
      console.log('🔍 API SERVICES: Premier service:', JSON.stringify(services[0]))
    }
    
    // Retourner les services
    return NextResponse.json(services)
  } catch (error) {
    console.error('🔍 API SERVICES: Erreur complète:', error)
    
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des services' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/services - Création d'un nouveau service
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Validation de base
    if (!data.name || !data.description || data.price === undefined || !data.duration) {
      return NextResponse.json(
        { error: 'Données de service incomplètes' },
        { status: 400 }
      )
    }
    
    // Création du service
    const service = await prisma.service.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        duration: data.duration,
        workers: data.workers || 1,
        categoryId: data.categoryId,
        includes: data.includes || [],
        features: data.features || [],
        imagePath: data.imagePath,
        isActive: true,
      }
    })
    
    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du service:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du service' },
      { status: 500 }
    )
  }
} 