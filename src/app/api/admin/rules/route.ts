import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ServiceType, RuleCategory } from '@/types/rules'

export async function GET(request: Request) {
  try {
    const rules = await prisma.rule.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return NextResponse.json(rules)
  } catch (error) {
    console.error('Error fetching rules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rules' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rule = await prisma.rule.create({
      data: {
        name: body.name,
        description: body.description,
        serviceType: body.serviceType as string,
        category: body.category as string,
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

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const rule = await prisma.rule.update({
      where: {
        id: body.id
      },
      data: {
        name: body.name,
        description: body.description,
        serviceType: body.serviceType as string,
        category: body.category as string,
        value: body.value,
        percentBased: body.percentBased,
        condition: body.condition,
        isActive: body.isActive
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