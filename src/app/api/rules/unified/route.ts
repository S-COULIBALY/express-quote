import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { ruleType, serviceType, condition } = await request.json();

    const timestamp = new Date().toISOString();
    const conditionType = condition?.type || 'none';
    const cacheKey = `rules-${ruleType}-${serviceType}-${conditionType}`;

    console.log(`🌐 [API /api/rules/unified] ${timestamp}`, {
      cacheKey,
      ruleType,
      serviceType,
      conditionType,
      headers: {
        referer: request.headers.get('referer'),
        userAgent: request.headers.get('user-agent')?.substring(0, 50)
      }
    });

    // Vérifier que ruleType est une valeur valide de l'enum RuleType
    const validRuleTypes = ['CONSTRAINT', 'BUSINESS', 'PRICING', 'TEMPORAL', 'GEOGRAPHIC', 'VOLUME', 'CUSTOM'];
    if (!validRuleTypes.includes(ruleType)) {
      console.error('❌ Invalid ruleType:', ruleType);
      return NextResponse.json(
        { error: `Invalid ruleType. Expected one of: ${validRuleTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Récupérer toutes les règles actives et valides
    const rules = await prisma.rules.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [
              { validFrom: null },
              { validFrom: { lte: new Date() } }
            ]
          },
          {
            OR: [
              { validTo: null },
              { validTo: { gte: new Date() } }
            ]
          }
        ]
      },
      orderBy: {
        priority: 'asc'
      }
    });
    console.log(`✅ [API /api/rules/unified] ${cacheKey} - Found ${rules.length} rules`);

    return NextResponse.json(rules);
  } catch (error) {
    console.error('Error fetching unified rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rules' },
      { status: 500 }
    );
  }
}
