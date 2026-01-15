import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🎯 Création d\'un item personnalisé:', body)
    
    // Validation des champs requis
    const { catalogId, formData } = body
    
    if (!catalogId || !formData) {
      return NextResponse.json(
        { error: 'catalogId et formData sont requis' },
        { status: 400 }
      )
    }
    
    // Récupérer la sélection catalogue
    const catalogSelection = await prisma.catalogSelection.findUnique({
      where: { id: catalogId },
      include: {
        items: {
          include: {
            templates: true
          }
        }
      }
    })

    if (!catalogSelection || !catalogSelection.items) {
      return NextResponse.json(
        { error: 'Sélection catalogue ou item non trouvé' },
        { status: 404 }
      )
    }

    const baseItem = catalogSelection.items
    
    // Calculer le prix personnalisé
    const personalizedPrice = await calculatePersonalizedPrice(baseItem, formData)
    
    // Générer une description personnalisée
    const personalizedDescription = generatePersonalizedDescription(baseItem, formData)
    
    // Créer l'item personnalisé
    const personalizedItem = await prisma.items.create({
      data: {
        id: uuidv4(),
        type: baseItem.type,
        template_id: baseItem.template_id,
        parent_item_id: baseItem.id, // Référence vers l'item du catalogue
        customer_id: formData.customerId || null,
        booking_id: formData.bookingId || null,

        // Données personnalisées
        name: formData.serviceName || catalogSelection.marketingTitle || baseItem.name,
        description: personalizedDescription,
        price: personalizedPrice,
        workers: formData.workers || baseItem.workers,
        duration: calculateDuration(baseItem, formData),
        features: mergeFeatures(baseItem.features, formData.features),
        includes: mergeIncludes(baseItem.includes, formData.includes),

        // Champs spécifiques selon le type
        included_distance: formData.includedDistance || baseItem.included_distance,
        distance_unit: formData.distanceUnit || baseItem.distance_unit,

        // Métadonnées
        status: formData.customerId ? 'CONFIRMED' : 'QUOTE_REQUEST',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      include: {
        templates: true,
        items: true,
        Customer: true,
        Booking: true
      }
    })
    
    console.log('✅ Item personnalisé créé:', personalizedItem.id)
    
    // Retourner l'item avec les données de traçabilité
    return NextResponse.json({
      item: personalizedItem,
      traceability: {
        catalogId: catalogId,
        baseItemId: baseItem.id,
        templateId: baseItem.template_id,
        marketingPrice: catalogSelection.marketingPrice,
        originalPrice: catalogSelection.originalPrice,
        personalizedPrice: personalizedPrice,
        customizations: extractCustomizations(baseItem, formData)
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Erreur création item personnalisé:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création de l\'item personnalisé',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// Fonction pour calculer le prix personnalisé
async function calculatePersonalizedPrice(baseItem: any, formData: any): Promise<number> {
  let price = baseItem.price
  
  // Ajustement selon le volume (pour déménagement)
  if (formData.volume && baseItem.type === 'DEMENAGEMENT') {
    const baseVolume = 20 // Volume de base estimé
    if (formData.volume > baseVolume) {
      price += (formData.volume - baseVolume) * 15 // 15€ par m³ supplémentaire
    }
  }
  
  // Ajustement selon le nombre de déménageurs
  if (formData.workers && formData.workers !== baseItem.workers) {
    const workerDiff = formData.workers - baseItem.workers
    price += workerDiff * 40 * (formData.duration || baseItem.duration) / 60 // 40€/h par déménageur
  }
  
  // Ajustement selon la distance
  if (formData.distance && baseItem.includedDistance) {
    const extraDistance = Math.max(0, formData.distance - baseItem.includedDistance)
    price += extraDistance * 0.5 // 0.5€ par km supplémentaire
  }
  
  // Ajustement selon la surface (pour ménage)
  if (formData.surface && baseItem.type === 'MENAGE') {
    const baseSurface = 50 // Surface de base estimée
    if (formData.surface > baseSurface) {
      price += (formData.surface - baseSurface) * 0.8 // 0.8€ par m² supplémentaire
    }
  }
  
  // Options supplémentaires
  if (formData.options) {
    const optionPrices: Record<string, number> = {
      packing: 150,
      assembly: 80,
      disassembly: 60,
      insurance: 45,
      storage: 100,
      deepCleaning: 50,
      windows: 30,
      fridge: 25,
      oven: 20,
      cabinets: 35
    }
    
    Object.entries(formData.options).forEach(([option, selected]) => {
      if (selected && optionPrices[option]) {
        price += optionPrices[option]
      }
    })
  }
  
  return Math.round(price * 100) / 100 // Arrondir à 2 décimales
}

// Fonction pour générer une description personnalisée
function generatePersonalizedDescription(baseItem: any, formData: any): string {
  const parts = [baseItem.description || '']
  
  if (formData.volume) {
    parts.push(`Volume estimé : ${formData.volume} m³`)
  }
  
  if (formData.surface) {
    parts.push(`Surface : ${formData.surface} m²`)
  }
  
  if (formData.workers && formData.workers !== baseItem.workers) {
    parts.push(`${formData.workers} déménageurs`)
  }
  
  if (formData.distance) {
    parts.push(`Distance : ${formData.distance} km`)
  }
  
  if (formData.specialRequests) {
    parts.push(`Demandes spéciales : ${formData.specialRequests}`)
  }
  
  return parts.filter(Boolean).join(' • ')
}

// Fonction pour calculer la durée ajustée
function calculateDuration(baseItem: any, formData: any): number {
  let duration = baseItem.duration
  
  // Ajustement selon le volume
  if (formData.volume && baseItem.type === 'DEMENAGEMENT') {
    const baseVolume = 20
    if (formData.volume > baseVolume) {
      duration += (formData.volume - baseVolume) * 10 // 10 minutes par m³ supplémentaire
    }
  }
  
  // Ajustement selon la surface
  if (formData.surface && baseItem.type === 'MENAGE') {
    const baseSurface = 50
    if (formData.surface > baseSurface) {
      duration += (formData.surface - baseSurface) * 2 // 2 minutes par m² supplémentaire
    }
  }
  
  return duration
}

// Fonction pour fusionner les caractéristiques
function mergeFeatures(baseFeatures: string[], customFeatures?: string[]): string[] {
  const features = [...baseFeatures]
  
  if (customFeatures) {
    customFeatures.forEach(feature => {
      if (!features.includes(feature)) {
        features.push(feature)
      }
    })
  }
  
  return features
}

// Fonction pour fusionner les inclusions
function mergeIncludes(baseIncludes: string[], customIncludes?: string[]): string[] {
  const includes = [...baseIncludes]
  
  if (customIncludes) {
    customIncludes.forEach(include => {
      if (!includes.includes(include)) {
        includes.push(include)
      }
    })
  }
  
  return includes
}

// Fonction pour extraire les personnalisations
function extractCustomizations(baseItem: any, formData: any): Record<string, any> {
  const customizations: Record<string, any> = {}
  
  if (formData.workers !== baseItem.workers) {
    customizations.workers = {
      base: baseItem.workers,
      custom: formData.workers,
      difference: formData.workers - baseItem.workers
    }
  }
  
  if (formData.volume) {
    customizations.volume = formData.volume
  }
  
  if (formData.surface) {
    customizations.surface = formData.surface
  }
  
  if (formData.distance) {
    customizations.distance = formData.distance
  }
  
  if (formData.options) {
    customizations.options = formData.options
  }
  
  if (formData.specialRequests) {
    customizations.specialRequests = formData.specialRequests
  }
  
  return customizations
} 