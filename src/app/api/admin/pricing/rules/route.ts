import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ServiceType } from '@/quotation/domain/enums/ServiceType';
import { RuleCategory } from '@prisma/client';

/**
 * GET /api/admin/pricing/rules
 * API dédiée au pricing centralisé - format optimisé pour useCentralizedPricing
 * 
 * Query params optionnels:
 * - serviceType: MOVING, CLEANING, PACKING, DELIVERY
 * - category: BUSINESS_RULES, PRICING, REDUCTION, SURCHARGE, LIMITS, SERVICE_PARAMS
 * - active: true, false
 */
export async function GET(request: NextRequest) {
    console.log('📋 GET /api/admin/pricing/rules - Récupération règles pricing centralisé');
    
    try {
        // Extraire les paramètres de requête
        const { searchParams } = new URL(request.url);
        const serviceType = searchParams.get('serviceType');
        const category = searchParams.get('category');
        const active = searchParams.get('active');
        
        console.log('🔍 Filtres:', { serviceType, category, active });

        // Construire la requête Prisma
        const whereClause: any = {};
        
        if (serviceType) {
            whereClause.serviceType = serviceType;
        }
        
        if (category) {
            whereClause.category = mapCentralizedCategoryToAdmin(category) as RuleCategory;
        }
        
        if (active !== null) {
            whereClause.isActive = active === 'true';
        } else {
            // Par défaut, récupérer seulement les règles actives
            whereClause.isActive = true;
        }

        // Récupérer les règles depuis la base de données
        const rules = await prisma.rules.findMany({
            where: whereClause,
            orderBy: [
                { serviceType: 'asc' },
                { category: 'asc' },
                { createdAt: 'desc' }
            ]
        });

        // Transformer les données pour le format pricing centralisé
        const adaptedRules = rules.map(rule => ({
            id: rule.id,
            name: rule.name,
            category: mapRuleCategoryToCentralized(rule.category),
            serviceType: rule.serviceType,
            value: rule.value,
            type: rule.percentBased ? 'percentage' : 'fixed',
            condition: rule.condition || '',
            description: rule.description || rule.name,
            isActive: rule.isActive,
            priority: 1, // Valeur par défaut - pourrait être ajoutée au schema plus tard
            createdAt: rule.createdAt,
            updatedAt: rule.updatedAt
        }));

        // Extraire les catégories uniques
        const categories = [...new Set(adaptedRules.map(rule => rule.category))];

        // Statistiques
        const stats = {
            totalRules: adaptedRules.length,
            activeRules: adaptedRules.filter(rule => rule.isActive).length,
            rulesByService: adaptedRules.reduce((acc, rule) => {
                acc[rule.serviceType] = (acc[rule.serviceType] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
            rulesByCategory: adaptedRules.reduce((acc, rule) => {
                acc[rule.category] = (acc[rule.category] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        };

        const response = {
            success: true,
            message: 'Règles de pricing récupérées avec succès',
            data: {
                rules: adaptedRules,
                categories,
                stats,
                lastUpdated: new Date(),
                totalCount: adaptedRules.length
            }
        };

        console.log(`✅ ${adaptedRules.length} règles récupérées pour le pricing centralisé`);
        
        return NextResponse.json(response, {
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur récupération règles pricing:', error);
        
        return NextResponse.json(
            { 
                success: false,
                error: 'Erreur de récupération des règles pricing',
                message: 'Impossible de récupérer les règles de tarification centralisée',
                details: error instanceof Error ? error.message : 'Erreur inconnue'
            },
            { 
                status: 500,
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            }
        );
    }
}

/**
 * POST /api/admin/pricing/rules
 * Créer une nouvelle règle de pricing (format centralisé)
 */
export async function POST(request: NextRequest) {
    console.log('📝 POST /api/admin/pricing/rules - Création règle pricing');
    
    try {
        const body = await request.json();
        
        // Validation des données requises
        if (!body.name || !body.serviceType || !body.category || body.value === undefined) {
            return NextResponse.json(
                { 
                    success: false,
                    error: 'Données manquantes',
                    message: 'Nom, type de service, catégorie et valeur sont requis'
                },
                { 
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8'
                    }
                }
            );
        }

        // Transformer les données du format centralisé vers le format admin
        const ruleData: any = {
            name: body.name,
            description: body.description || body.name,
            serviceType: body.serviceType,
            category: mapCentralizedCategoryToAdmin(body.category) as RuleCategory,
            value: parseFloat(body.value),
            percentBased: body.type === 'percentage',
            condition: body.condition || null,
            isActive: body.isActive !== undefined ? body.isActive : true
        };

        // Créer la règle en base
        const rule = await prisma.rules.create({
            data: ruleData
        });

        // Retourner la règle créée au format centralisé
        const adaptedRule = {
            id: rule.id,
            name: rule.name,
            category: mapRuleCategoryToCentralized(rule.category),
            serviceType: rule.serviceType,
            value: rule.value,
            type: rule.percentBased ? 'percentage' : 'fixed',
            condition: rule.condition || '',
            description: rule.description || rule.name,
            isActive: rule.isActive,
            priority: 1,
            createdAt: rule.createdAt,
            updatedAt: rule.updatedAt
        };

        console.log('✅ Règle créée:', adaptedRule);
        
        return NextResponse.json({
            success: true,
            message: 'Règle créée avec succès',
            data: adaptedRule
        }, {
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur création règle pricing:', error);
        
        return NextResponse.json(
            { 
                success: false,
                error: 'Erreur de création de règle',
                message: 'Impossible de créer la règle de pricing',
                details: error instanceof Error ? error.message : 'Erreur inconnue'
            },
            { 
                status: 500,
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            }
        );
    }
}

/**
 * PUT /api/admin/pricing/rules
 * Modifier une règle existante (format centralisé)
 */
export async function PUT(request: NextRequest) {
    console.log('✏️ PUT /api/admin/pricing/rules - Modification règle pricing');
    
    try {
        const body = await request.json();
        
        if (!body.id) {
            return NextResponse.json(
                { 
                    success: false,
                    error: 'ID manquant',
                    message: 'ID de la règle requis pour la modification'
                },
                { 
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8'
                    }
                }
            );
        }

        // Transformer les données du format centralisé vers le format admin
        const updateData: any = {
            name: body.name,
            description: body.description || body.name,
            serviceType: body.serviceType,
            category: mapCentralizedCategoryToAdmin(body.category) as RuleCategory,
            value: parseFloat(body.value),
            percentBased: body.type === 'percentage',
            condition: body.condition || null,
            isActive: body.isActive
        };

        // Mettre à jour la règle
        const rule = await prisma.rules.update({
            where: { id: body.id },
            data: updateData
        });

        // Retourner la règle modifiée au format centralisé
        const adaptedRule = {
            id: rule.id,
            name: rule.name,
            category: mapRuleCategoryToCentralized(rule.category),
            serviceType: rule.serviceType,
            value: rule.value,
            type: rule.percentBased ? 'percentage' : 'fixed',
            condition: rule.condition || '',
            description: rule.description || rule.name,
            isActive: rule.isActive,
            priority: 1,
            createdAt: rule.createdAt,
            updatedAt: rule.updatedAt
        };

        console.log('✅ Règle modifiée:', adaptedRule);
        
        return NextResponse.json({
            success: true,
            message: 'Règle modifiée avec succès',
            data: adaptedRule
        }, {
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur modification règle pricing:', error);
        
        return NextResponse.json(
            { 
                success: false,
                error: 'Erreur de modification de règle',
                message: 'Impossible de modifier la règle de pricing',
                details: error instanceof Error ? error.message : 'Erreur inconnue'
            },
            { 
                status: 500,
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            }
        );
    }
}

/**
 * DELETE /api/admin/pricing/rules
 * Supprimer une règle (format centralisé)
 */
export async function DELETE(request: NextRequest) {
    console.log('🗑️ DELETE /api/admin/pricing/rules - Suppression règle pricing');
    
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        if (!id) {
            return NextResponse.json(
                { 
                    success: false,
                    error: 'ID manquant',
                    message: 'ID de la règle requis pour la suppression'
                },
                { 
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8'
                    }
                }
            );
        }

        // Supprimer la règle
        await prisma.rules.delete({
            where: { id }
        });

        console.log('✅ Règle supprimée:', id);
        
        return NextResponse.json({
            success: true,
            message: 'Règle supprimée avec succès'
        }, {
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur suppression règle pricing:', error);
        
        return NextResponse.json(
            { 
                success: false,
                error: 'Erreur de suppression de règle',
                message: 'Impossible de supprimer la règle de pricing',
                details: error instanceof Error ? error.message : 'Erreur inconnue'
            },
            { 
                status: 500,
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            }
        );
    }
}

/**
 * Mapper les catégories admin vers le format centralisé
 */
function mapRuleCategoryToCentralized(adminCategory: string): string {
    const categoryMap: Record<string, string> = {
        'REDUCTION': 'temporal',
        'SURCHARGE': 'temporal', 
        'MINIMUM': 'logistics',
        'MAXIMUM': 'logistics',
        'FIXED': 'general',
        'PERCENTAGE': 'general'
    };
    
    return categoryMap[adminCategory] || 'general';
}

/**
 * Mapper les catégories centralisées vers le format admin
 */
function mapCentralizedCategoryToAdmin(centralizedCategory: string): string {
    const categoryMap: Record<string, string> = {
        'temporal': 'SURCHARGE',
        'general': 'FIXED',
        'volume': 'PERCENTAGE',
        'logistics': 'MINIMUM',
        'options': 'MAXIMUM'
    };
    
    return categoryMap[centralizedCategory] || 'SURCHARGE';
} 