import { NextRequest, NextResponse } from 'next/server';
import { QuoteRequestController } from '@/quotation/interfaces/http/controllers/QuoteRequestController';
import { QuoteRequestService } from '@/quotation/application/services/QuoteRequestService';
import { PrismaQuoteRequestRepository } from '@/quotation/infrastructure/repositories/PrismaQuoteRequestRepository';

/**
 * POST /api/quotesRequest/[temporaryId]/calculate
 * Calcule le prix pour une demande de devis
 * 
 * Endpoint critique pour l'intégration avec le QuoteCalculator
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { temporaryId: string } }
) {
    console.log(`🧮 POST /api/quotesRequest/${params.temporaryId}/calculate - Début calcul prix`);
    
    try {
        // Initialiser les dépendances
        const repository = new PrismaQuoteRequestRepository();
        const service = new QuoteRequestService(repository);
        
        console.log('✅ Service prêt');
        const controller = new QuoteRequestController(service);

        // Lire le body de la requête (données optionnelles pour le calcul)
        let body = {};
        try {
            body = await request.json();
            console.log('📄 Données de calcul reçues:', Object.keys(body));
        } catch (error) {
            // Pas de body ou body vide - normal pour ce endpoint
            console.log('ℹ️ Aucune donnée additionnelle pour le calcul');
        }

        // Créer les objets HTTP compatibles
        const httpRequest = {
            body,
            params: { temporaryId: params.temporaryId },
            query: {},
            headers: Object.fromEntries(request.headers.entries())
        };

        let statusCode = 200;
        let responseData: any = {};

        const httpResponse = {
            status: (code: number) => {
                statusCode = code;
                return httpResponse;
            },
            json: (data: any) => {
                responseData = data;
                return httpResponse;
            },
            send: (data: any) => {
                responseData = data;
                return httpResponse;
            },
            header: (name: string, value: string) => {
                return httpResponse;
            }
        };

        // Appeler le controller pour le calcul
        console.log(`🎯 Appel du controller pour calcul: ${params.temporaryId}`);
        await controller.calculateQuotePrice(httpRequest, httpResponse as any);

        console.log(`✅ Calcul terminé avec status: ${statusCode}`);
        
        // Log du résultat pour debug
        if (responseData.success && responseData.data?.calculation) {
            const calc = responseData.data.calculation;
            console.log(`💰 Prix calculé: ${calc.totalPrice?.amount}€ (base: ${calc.basePrice?.amount}€)`);
        }

        // Retourner la réponse Next.js
        return NextResponse.json(responseData, { status: statusCode });

    } catch (error) {
        console.error(`❌ Erreur dans calcul prix ${params.temporaryId}:`, error);
        
        // Log détaillé de l'erreur pour debug
        if (error instanceof Error) {
            console.error('Details:', {
                name: error.name,
                message: error.message,
                stack: error.stack?.substring(0, 500)
            });
        }
        
        return NextResponse.json(
            { 
                error: 'Erreur de calcul',
                message: 'Impossible de calculer le prix pour cette demande',
                temporaryId: params.temporaryId,
                details: error instanceof Error ? error.message : 'Erreur inconnue'
            },
            { status: 500 }
        );
    }
} 