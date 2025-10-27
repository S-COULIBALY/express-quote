import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ServiceType } from '@prisma/client'

export async function GET(
  request: Request,
  { params }: { params: { serviceType: ServiceType } }
) {
  try {
    const rules = await prisma.rules.findMany({
      where: {
        serviceType: params.serviceType,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return NextResponse.json(rules)
  } catch (error) {
    console.error('Error fetching rules by service type:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rules' },
      { status: 500 }
    )
  }
} 