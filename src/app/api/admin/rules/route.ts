import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ServiceType, RuleCategory } from '@prisma/client'

// Types pour la réponse standardisée
interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Types pour les statistiques
interface RuleStatistics {
  total: number
  byCategory: Record<string, number>
  byServiceType: Record<string, number>
  byRuleType: Record<string, number>
  active: number
  inactive: number
}

// Mapping entre les anciens et nouveaux types de services
const SERVICE_TYPE_MAPPING = {
  // Ancien ServiceType → Nouveau système
  MOVING: 'DEMENAGEMENT',
  PACKING: 'DEMENAGEMENT', 
  CLEANING: 'MENAGE',
  DELIVERY: 'LIVRAISON',
  PACK: 'DEMENAGEMENT',
  SERVICE: 'MENAGE'
} as const

// Mapping inverse pour la compatibilité
const REVERSE_SERVICE_TYPE_MAPPING = {
  DEMENAGEMENT: 'MOVING',
  MENAGE: 'CLEANING', 
  TRANSPORT: 'DELIVERY',
  LIVRAISON: 'DELIVERY'
} as const

// Types enrichis avec support des règles unifiées
interface EnrichedRule {
  id: string
  name: string
  description: string | null
  serviceType: ServiceType
  category: RuleCategory
  value: number
  percentBased: boolean
  type: 'fixed' | 'percentage' // Nouveau format

  // ✅ NOUVEAUX CHAMPS UNIFIÉS
  ruleType: string // CONSTRAINT, BUSINESS, TEMPORAL, etc.
  priority: number
  validFrom: Date
  validTo: Date | null
  tags: string[]
  configKey: string | null
  metadata: any

  condition?: any // Support JSON complet
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  // Intégration catalogue
  catalogCategory?: string
  linkedItems?: number // Nombre d'items liés
}

async function calculateStatistics(): Promise<RuleStatistics> {
  const [total, byCategory, byServiceType, byRuleType, active] = await Promise.all([
    prisma.rules.count(),
    prisma.rules.groupBy({
      by: ['category'],
      _count: true,
    }),
    prisma.rules.groupBy({
      by: ['serviceType'],
      _count: true,
    }),
    // ✅ NOUVEAU - Statistiques par type de règle
    prisma.rules.groupBy({
      by: ['ruleType'],
      _count: true,
    }),
     prisma.rules.count({ where: { isActive: true } })
  ])

  return {
    total,
    byCategory: Object.fromEntries(
      byCategory.map(item => [item.category, item._count])
    ),
    byServiceType: Object.fromEntries(
      byServiceType.map(item => [item.serviceType, item._count])
    ),
    // ✅ NOUVEAU - Statistiques par ruleType
    byRuleType: Object.fromEntries(
      byRuleType.map(item => [item.ruleType, item._count])
    ),
    active,
    inactive: total - active
  }
}

async function enrichRule(rule: any): Promise<EnrichedRule> {
  // Calculer le nombre d'items liés via le mapping de service
  const catalogCategory = SERVICE_TYPE_MAPPING[rule.serviceType as keyof typeof SERVICE_TYPE_MAPPING]

  let linkedItems = 0
  if (catalogCategory) {
    linkedItems = await prisma.catalogSelection.count({
      where: {
        category: catalogCategory as any,
        isActive: true
      }
    })
  }

  // ✅ Support des conditions JSON et String legacy
  let parsedCondition
  if (rule.condition) {
    try {
      parsedCondition = typeof rule.condition === 'string'
        ? JSON.parse(rule.condition)
        : rule.condition
    } catch {
      // Fallback pour anciennes conditions string
      parsedCondition = {
        type: 'LEGACY',
        expression: rule.condition
      }
    }
  }

  return {
    ...rule,
    type: rule.percentBased ? 'percentage' : 'fixed',
    condition: parsedCondition,
    catalogCategory,
    linkedItems,
    // ✅ Support des nouveaux champs avec fallbacks
    ruleType: rule.ruleType || 'CONSTRAINT',
    priority: rule.priority || 100,
    validFrom: rule.validFrom || rule.createdAt,
    validTo: rule.validTo || null,
    tags: rule.tags || [],
    configKey: rule.configKey || null,
    metadata: rule.metadata || {}
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    // 🔓 AUTHENTIFICATION DÉSACTIVÉE TEMPORAIREMENT
    const { searchParams } = new URL(request.url)
    const serviceType = searchParams.get('serviceType')
    const category = searchParams.get('category')
    const ruleType = searchParams.get('ruleType') // ✅ NOUVEAU
    const includeStats = searchParams.get('stats') === 'true'

    // Construction de la requête avec filtres étendus
    const whereClause: any = {
      isActive: true
    }

    if (serviceType && Object.values(ServiceType).includes(serviceType as ServiceType)) {
      whereClause.serviceType = serviceType as ServiceType
    }

    if (category && Object.values(RuleCategory).includes(category as RuleCategory)) {
      whereClause.category = category as RuleCategory
    }

    // ✅ NOUVEAU - Filtrage par type de règle
    if (ruleType) {
      const validRuleTypes = ['CONSTRAINT', 'BUSINESS', 'PRICING', 'TEMPORAL', 'GEOGRAPHIC', 'VOLUME', 'CUSTOM']
      if (validRuleTypes.includes(ruleType)) {
        whereClause.ruleType = ruleType
      }
    }

    const rules = await prisma.rules.findMany({
      where: whereClause,
      orderBy: [
        { ruleType: 'asc' }, // ✅ NOUVEAU - Tri par type de règle en premier
        { priority: 'asc' },  // ✅ NOUVEAU - Puis par priorité
        { category: 'asc' },
        { serviceType: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Enrichissement des règles avec les données du catalogue
    const enrichedRules = await Promise.all(
      rules.map(rule => enrichRule(rule))
    )

    const response: ApiResponse<EnrichedRule[]> = {
      success: true,
      data: enrichedRules,
      message: `${enrichedRules.length} règles récupérées avec succès`
    }

    // Ajout des statistiques si demandées
    if (includeStats) {
      const statistics = await calculateStatistics()
      ;(response as any).statistics = statistics
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erreur lors de la récupération des règles:', error)
    
    const response: ApiResponse<never> = {
      success: false,
      error: 'Erreur lors de la récupération des règles',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 🔓 AUTHENTIFICATION DÉSACTIVÉE TEMPORAIREMENT
    const body = await request.json()

    // ✅ Validation étendue avec nouveaux champs
    if (!body.name || !body.serviceType || !body.category || body.value === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Données manquantes',
        message: 'Les champs name, serviceType, category et value sont requis'
      }, { status: 400 })
    }

    // Validation des enums
    if (!Object.values(ServiceType).includes(body.serviceType)) {
      return NextResponse.json({
        success: false,
        error: 'ServiceType invalide',
        message: `ServiceType doit être l'une des valeurs: ${Object.values(ServiceType).join(', ')}`
      }, { status: 400 })
    }

    if (!Object.values(RuleCategory).includes(body.category)) {
      return NextResponse.json({
        success: false,
        error: 'RuleCategory invalide',
        message: `RuleCategory doit être l'une des valeurs: ${Object.values(RuleCategory).join(', ')}`
      }, { status: 400 })
    }

    // ✅ Validation du nouveau ruleType
    const validRuleTypes = ['CONSTRAINT', 'BUSINESS', 'PRICING', 'TEMPORAL', 'GEOGRAPHIC', 'VOLUME', 'CUSTOM']
    const ruleType = body.ruleType || 'CONSTRAINT'
    if (!validRuleTypes.includes(ruleType)) {
      return NextResponse.json({
        success: false,
        error: 'RuleType invalide',
        message: `RuleType doit être l'une des valeurs: ${validRuleTypes.join(', ')}`
      }, { status: 400 })
    }

    // Gestion de la compatibilité type → percentBased
    let percentBased = body.percentBased
    if (body.type) {
      percentBased = body.type === 'percentage'
    }

    const rule = await prisma.rules.create({
      data: {
        name: body.name,
        description: body.description || null,
        serviceType: body.serviceType as ServiceType,
        category: body.category as RuleCategory,
        value: Number(body.value),
        percentBased: percentBased ?? true,
        condition: body.condition ? (typeof body.condition === 'string' ? body.condition : JSON.stringify(body.condition)) : null,
        isActive: body.isActive ?? true,
        // ✅ NOUVEAUX CHAMPS UNIFIÉS
        ruleType: ruleType,
        priority: body.priority ? Number(body.priority) : 100,
        validFrom: body.validFrom ? new Date(body.validFrom) : new Date(),
        validTo: body.validTo ? new Date(body.validTo) : null,
        tags: body.tags || [],
        configKey: body.configKey || null,
        metadata: body.metadata || {}
      } as any
    })

    const enrichedRule = await enrichRule(rule)

    return NextResponse.json({
      success: true,
      data: enrichedRule,
      message: 'Règle créée avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la création de la règle:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la création de la règle',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    // 🔓 AUTHENTIFICATION DÉSACTIVÉE TEMPORAIREMENT
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json({
        success: false,
        error: 'ID manquant',
        message: 'L\'ID de la règle est requis pour la mise à jour'
      }, { status: 400 })
    }

    // Vérification de l'existence de la règle
    const existingRule = await prisma.rules.findUnique({
      where: { id: body.id }
    })

    if (!existingRule) {
      return NextResponse.json({
        success: false,
        error: 'Règle non trouvée',
        message: 'La règle spécifiée n\'existe pas'
      }, { status: 404 })
    }

    // Validation des enums si fournis
    if (body.serviceType && !Object.values(ServiceType).includes(body.serviceType)) {
      return NextResponse.json({
        success: false,
        error: 'ServiceType invalide',
        message: `ServiceType doit être l'une des valeurs: ${Object.values(ServiceType).join(', ')}`
      }, { status: 400 })
    }

    if (body.category && !Object.values(RuleCategory).includes(body.category)) {
      return NextResponse.json({
        success: false,
        error: 'RuleCategory invalide',
        message: `RuleCategory doit être l'une des valeurs: ${Object.values(RuleCategory).join(', ')}`
      }, { status: 400 })
    }

    // Gestion de la compatibilité type → percentBased
    let percentBased = body.percentBased
    if (body.type) {
      percentBased = body.type === 'percentage'
    }

    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.serviceType !== undefined) updateData.serviceType = body.serviceType
    if (body.category !== undefined) updateData.category = body.category
    if (body.value !== undefined) updateData.value = Number(body.value)
    if (percentBased !== undefined) updateData.percentBased = percentBased
    if (body.condition !== undefined) updateData.condition = body.condition ? (typeof body.condition === 'string' ? body.condition : JSON.stringify(body.condition)) : null
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    // ✅ NOUVEAUX CHAMPS UNIFIÉS
    if (body.ruleType !== undefined) {
      const validRuleTypes = ['CONSTRAINT', 'BUSINESS', 'PRICING', 'TEMPORAL', 'GEOGRAPHIC', 'VOLUME', 'CUSTOM']
      if (validRuleTypes.includes(body.ruleType)) {
        updateData.ruleType = body.ruleType
      }
    }
    if (body.priority !== undefined) updateData.priority = Number(body.priority)
    if (body.validFrom !== undefined) updateData.validFrom = new Date(body.validFrom)
    if (body.validTo !== undefined) updateData.validTo = body.validTo ? new Date(body.validTo) : null
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.configKey !== undefined) updateData.configKey = body.configKey
    if (body.metadata !== undefined) updateData.metadata = body.metadata

    const rule = await prisma.rules.update({
      where: { id: body.id },
      data: updateData
    })

    const enrichedRule = await enrichRule(rule)

    return NextResponse.json({
      success: true,
      data: enrichedRule,
      message: 'Règle mise à jour avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la règle:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la mise à jour de la règle',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    // 🔓 AUTHENTIFICATION DÉSACTIVÉE TEMPORAIREMENT
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID manquant',
        message: 'L\'ID de la règle est requis pour la suppression'
      }, { status: 400 })
    }

    // Vérification de l'existence de la règle
    const existingRule = await prisma.rules.findUnique({
      where: { id }
    })

    if (!existingRule) {
      return NextResponse.json({
        success: false,
        error: 'Règle non trouvée',
        message: 'La règle spécifiée n\'existe pas'
      }, { status: 404 })
    }

    // Suppression douce (désactivation) plutôt que suppression physique
    const rule = await prisma.rules.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({
      success: true,
      data: { id: rule.id },
      message: 'Règle désactivée avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la suppression de la règle:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la suppression de la règle',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
} 