import { NextRequest, NextResponse } from 'next/server';
import { QuoteRequestController } from '@/quotation/interfaces/http/controllers/QuoteRequestController';
import { QuoteRequestService } from '@/quotation/application/services/QuoteRequestService';
import { PrismaQuoteRequestRepository } from '@/quotation/infrastructure/repositories/PrismaQuoteRequestRepository';

/**
 * POST /api/quotesRequest/
 * Crée une nouvelle demande de devis
 */
export async function POST(request: NextRequest) {
    try {
        // Initialiser les dépendances
        const repository = new PrismaQuoteRequestRepository();
        const service = new QuoteRequestService(repository);
        const controller = new QuoteRequestController(service);

        // Lire le body de la requête
        const body = await request.json();

        // Créer les objets HTTP compatibles
        const httpRequest = {
            body,
            params: {},
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
                // Headers seront gérés par NextResponse
                return httpResponse;
            }
        };

        // Appeler le controller
        await controller.createQuoteRequest(httpRequest, httpResponse as any);

        // Retourner la réponse Next.js
        return NextResponse.json(responseData, { status: statusCode });

    } catch (error) {
        console.error('Erreur dans POST /api/quotesRequest:', error);
        return NextResponse.json(
            { 
                error: 'Erreur interne du serveur',
                message: error instanceof Error ? error.message : 'Erreur inconnue'
            },
            { status: 500 }
        );
    }
} 