import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { RuleCategory } from '@/types/rules'
import { Prisma } from '@prisma/client'

export async function GET(
  request: Request,
  { params }: { params: { category: RuleCategory } }
) {
  try {
    const rules = await prisma.rule.findMany({
      where: {
        category: params.category,
        isActive: true
      } as Prisma.RuleWhereInput,
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(rules)
  } catch (error) {
    console.error('Error fetching rules by category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rules by category' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { category: RuleCategory } }
) {
  try {
    const body = await request.json()
    const rule = await prisma.rule.create({
      data: {
        name: body.name,
        description: body.description,
        serviceType: body.serviceType,
        category: params.category,
        value: body.value,
        percentBased: body.percentBased,
        condition: body.condition,
        isActive: body.isActive
      }
    })

    return NextResponse.json(rule)
  } catch (error) {
    console.error('Error creating rule:', error)
    return NextResponse.json(
      { error: 'Failed to create rule' },
      { status: 500 }
    )
  }
} 