import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// ✅ API UNIFIÉE POUR TOUTES LES CONTRAINTES
// Endpoint central qui gère tous les types de contraintes: déménagement, nettoyage, etc.

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceType = searchParams.get('serviceType')?.toUpperCase()
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const format = searchParams.get('format') || 'default'

    console.log(`🔄 [API-UNIFIED] Récupération contraintes - Service: ${serviceType || 'ALL'}, Format: ${format}`)

    // Si aucun type spécifié, retourner tous les types
    const whereClause = serviceType ? { serviceType, isActive: !includeInactive } : { isActive: !includeInactive }

    const rules = await prisma.rule.findMany({
      where: whereClause,
      orderBy: [
        { serviceType: 'asc' },
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    // Transformer selon le format demandé
    if (format === 'grouped') {
      return NextResponse.json(await formatGroupedResponse(rules))
    } else if (format === 'summary') {
      return NextResponse.json(await formatSummaryResponse(rules))
    } else {
      return NextResponse.json(await formatDefaultResponse(rules, serviceType))
    }

  } catch (error) {
    console.error('❌ [API-UNIFIED] Erreur contraintes unifiées:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur récupération contraintes unifiées',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// ✅ FORMAT PAR DÉFAUT - Compatible avec les modaux existants
async function formatDefaultResponse(rules: any[], serviceType?: string | null) {
  const constraints = rules.map(rule => {
    const condition = rule.condition ? JSON.parse(rule.condition as string) : {}

    return {
      id: condition.originalId || rule.id,
      name: rule.name,
      description: rule.description,
      category: condition.category || 'other',
      serviceType: rule.serviceType,
      impact: condition.impact || (rule.category === 'FIXED' ? 'SERVICE' : 'SURCHARGE'),
      value: rule.value,
      autoDetection: condition.autoDetection || false,
      isActive: rule.isActive,
      type: condition.impact === 'SERVICE' ? 'service' : 'constraint',
      conditions: condition.conditions || null,
      icon: getIconForCategory(condition.category || 'other', rule.serviceType),
      categoryLabel: getCategoryLabel(condition.category || 'other'),
      ruleId: rule.id,
      ruleCategory: rule.category
    }
  })

  const constraintsOnly = constraints.filter(c => c.type === 'constraint')
  const servicesOnly = constraints.filter(c => c.type === 'service')

  return {
    success: true,
    data: {
      constraints: constraintsOnly,
      services: servicesOnly,
      allItems: constraints,
      meta: {
        totalConstraints: constraintsOnly.length,
        totalServices: servicesOnly.length,
        serviceType: serviceType || 'ALL',
        serviceName: getServiceName(serviceType),
        source: 'database',
        totalRulesInDB: rules.length
      }
    },
    timestamp: new Date().toISOString()
  }
}

// ✅ FORMAT GROUPÉ - Par type de service
async function formatGroupedResponse(rules: any[]) {
  const groupedByService = rules.reduce((acc, rule) => {
    const serviceType = rule.serviceType
    if (!acc[serviceType]) {
      acc[serviceType] = []
    }
    acc[serviceType].push(rule)
    return acc
  }, {} as Record<string, any[]>)

  const grouped: Record<string, any> = {}

  for (const [serviceType, serviceRules] of Object.entries(groupedByService)) {
    const defaultFormat = await formatDefaultResponse(serviceRules, serviceType)
    grouped[serviceType.toLowerCase()] = defaultFormat.data
  }

  return {
    success: true,
    data: grouped,
    meta: {
      totalServices: Object.keys(grouped).length,
      totalRules: rules.length,
      format: 'grouped'
    },
    timestamp: new Date().toISOString()
  }
}

// ✅ FORMAT RÉSUMÉ - Statistiques uniquement
async function formatSummaryResponse(rules: any[]) {
  const stats = rules.reduce((acc, rule) => {
    const serviceType = rule.serviceType
    if (!acc[serviceType]) {
      acc[serviceType] = { total: 0, active: 0, inactive: 0 }
    }
    acc[serviceType].total++
    if (rule.isActive) {
      acc[serviceType].active++
    } else {
      acc[serviceType].inactive++
    }
    return acc
  }, {} as Record<string, any>)

  return {
    success: true,
    data: {
      summary: stats,
      overall: {
        totalRules: rules.length,
        totalServices: Object.keys(stats).length,
        totalActive: rules.filter(r => r.isActive).length,
        totalInactive: rules.filter(r => !r.isActive).length
      }
    },
    meta: {
      format: 'summary'
    },
    timestamp: new Date().toISOString()
  }
}

// ✅ FONCTIONS UTILITAIRES
function getIconForCategory(category: string, serviceType: string): string {
  if (serviceType === 'MOVING') {
    const iconMap: Record<string, string> = {
      'elevator': '🏢',
      'access': '📏',
      'street': '🚛',
      'administrative': '🛡️',
      'services': '🔧'
    }
    return iconMap[category] || '📋'
  } else if (serviceType === 'CLEANING') {
    const iconMap: Record<string, string> = {
      'access': '🏢',
      'work_conditions': '⚠️',
      'time_constraints': '🕐',
      'site_conditions': '🔧',
      'equipment': '🛠️'
    }
    return iconMap[category] || '🧽'
  }
  return '📋'
}

function getCategoryLabel(category: string): string {
  const labelMap: Record<string, string> = {
    'elevator': 'building',
    'access': 'distance',
    'street': 'vehicle',
    'administrative': 'security',
    'services': 'handling',
    'work_conditions': 'conditions',
    'time_constraints': 'time',
    'site_conditions': 'site',
    'equipment': 'equipment'
  }
  return labelMap[category] || 'other'
}

function getServiceName(serviceType?: string | null): string {
  const nameMap: Record<string, string> = {
    'MOVING': 'Déménagement',
    'CLEANING': 'Nettoyage'
  }
  return serviceType ? nameMap[serviceType] || serviceType : 'Tous services'
}