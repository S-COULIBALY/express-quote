import { NextRequest, NextResponse } from 'next/server'
import { UnifiedDataService, ServiceType } from '@/quotation/infrastructure/services/UnifiedDataService'
import { ConstraintTransformerService } from '@/quotation/domain/configuration'

// ✅ API CONTRAINTES NETTOYAGE (REFACTORISÉ)
// Utilise ConstraintTransformerService pour transformation centralisée

export async function GET(request: NextRequest) {
  try {
    console.log('🧽 [API] /api/constraints/cleaning - Récupération contraintes nettoyage')

    // ✅ RÉCUPÉRER & TRANSFORMER (REFACTORISÉ)
    const unifiedService = UnifiedDataService.getInstance()
    const allBusinessRules = await unifiedService.getBusinessRules(ServiceType.CLEANING)

    if (!allBusinessRules || allBusinessRules.length === 0) {
      throw new Error('Aucune règle métier trouvée pour CLEANING')
    }

    // ✅ UTILISER ConstraintTransformerService pour transformation API
    // Remplace ~80 lignes de logique de mapping et transformation
    const response = ConstraintTransformerService.transformRulesToApiFormat(
      allBusinessRules,
      'CLEANING'
    )

    console.log(`✅ [API] ${response.data.meta.totalConstraints} contraintes + ${response.data.meta.totalServices} services`)

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('❌ [API] Erreur /api/constraints/cleaning:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur récupération contraintes nettoyage',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
