import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Rule } from '@prisma/client'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const rule = await prisma.rule.update({
      where: { id: params.id },
      data: {
        name: data.name,
        description: data.description,
        serviceType: data.serviceType,
        value: data.value,
        percentBased: data.percentBased,
        condition: data.condition,
        isActive: data.isActive
      }
    })
    return NextResponse.json(rule)
  } catch (error) {
    console.error('Error updating rule:', error)
    return NextResponse.json(
      { error: 'Failed to update rule' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.rule.delete({
      where: { id: params.id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting rule:', error)
    return NextResponse.json(
      { error: 'Failed to delete rule' },
      { status: 500 }
    )
  }
} 