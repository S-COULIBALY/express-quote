import { NextRequest, NextResponse } from 'next/server';
import { QuoteCalculator } from '@/quotation/application/services/QuoteCalculator';
import { QuoteContext } from '@/quotation/domain/valueObjects/QuoteContext';
import { ServiceType } from '@/quotation/domain/enums/ServiceType';

/**
 * TEST /api/price/calculate/test
 * Route de test simplifiée pour diagnostiquer les problèmes
 */
export async function POST(request: NextRequest) {
    console.log('🧪 TEST Route - Début du test de calcul');
    
    try {
        // Test basique de l'enum ServiceType
        console.log('📋 Test ServiceType:', {
            MOVING_PREMIUM: ServiceType.MOVING_PREMIUM,
            CLEANING: ServiceType.CLEANING,
            DELIVERY: ServiceType.DELIVERY,
            PACKING: ServiceType.PACKING
        });

        // Test d'instanciation du QuoteCalculator
        console.log('🔧 Test instanciation QuoteCalculator...');
        const calculator = QuoteCalculator.getInstance();
        console.log('✅ QuoteCalculator instancié:', !!calculator);

        // Test de création de contexte
        console.log('📝 Test création QuoteContext...');
        const context = new QuoteContext(ServiceType.MOVING_PREMIUM);
        context.setValue('volume', 30);
        context.setValue('distance', 50);
        context.setValue('defaultPrice', 500);
        console.log('✅ QuoteContext créé:', context.getAllData());

        // Test du calcul de devis
        console.log('💰 Test calcul de devis...');
        const quote = await calculator.calculateQuote(ServiceType.MOVING_PREMIUM, context);
        console.log('✅ Devis calculé:', {
            basePrice: quote.getBasePrice().getAmount(),
            totalPrice: quote.getTotalPrice().getAmount(),
            discounts: quote.getDiscounts().length
        });

        return NextResponse.json({
            success: true,
            message: 'Test réussi',
            data: {
                serviceType: ServiceType.MOVING_PREMIUM,
                basePrice: quote.getBasePrice().getAmount(),
                totalPrice: quote.getTotalPrice().getAmount(),
                discountsCount: quote.getDiscounts().length,
                context: context.getAllData()
            }
        });

    } catch (error) {
        console.error('❌ Erreur dans la route de test:', error);
        
        if (error instanceof Error) {
            console.error('Details:', {
                name: error.name,
                message: error.message,
                stack: error.stack?.substring(0, 1000)
            });
        }
        
        return NextResponse.json({
            success: false,
            error: 'Test échoué',
            message: error instanceof Error ? error.message : 'Erreur inconnue',
            details: error instanceof Error ? error.stack?.substring(0, 500) : 'Pas de détails'
        }, { status: 500 });
    }
}