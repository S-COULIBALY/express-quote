import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rules } from '@prisma/client'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 🔓 AUTHENTIFICATION DÉSACTIVÉE TEMPORAIREMENT
    const data = await request.json()

    // ✅ Support des nouveaux champs unifiés
    const updateData: any = {
      name: data.name,
      description: data.description,
      serviceType: data.serviceType,
      value: data.value,
      percentBased: data.percentBased,
      condition: data.condition ? (typeof data.condition === 'string' ? data.condition : JSON.stringify(data.condition)) : null,
      isActive: data.isActive
    }

    // ✅ Nouveaux champs optionnels
    if (data.ruleType !== undefined) updateData.ruleType = data.ruleType
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.validFrom !== undefined) updateData.validFrom = new Date(data.validFrom)
    if (data.validTo !== undefined) updateData.validTo = data.validTo ? new Date(data.validTo) : null
    if (data.tags !== undefined) updateData.tags = data.tags
    if (data.configKey !== undefined) updateData.configKey = data.configKey
    if (data.metadata !== undefined) updateData.metadata = data.metadata

    const rule = await prisma.rules.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: rule,
      message: 'Règle mise à jour avec succès'
    })
  } catch (error) {
    console.error('Error updating rule:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update rule',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 🔓 AUTHENTIFICATION DÉSACTIVÉE TEMPORAIREMENT
    // ✅ Suppression douce - désactiver au lieu de supprimer
    const rule = await prisma.rules.update({
      where: { id: params.id },
      data: {
        isActive: false,
        metadata: {
          deletedAt: new Date().toISOString(),
          deletedBy: 'admin-interface'
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: { id: rule.id },
      message: 'Règle désactivée avec succès'
    })
  } catch (error) {
    console.error('Error deleting rule:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete rule',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
} 