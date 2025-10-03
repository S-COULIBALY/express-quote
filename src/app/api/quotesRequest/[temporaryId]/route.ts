import { NextRequest, NextResponse } from 'next/server';
import { QuoteRequestController } from '@/quotation/interfaces/http/controllers/QuoteRequestController';
import { QuoteRequestService } from '@/quotation/application/services/QuoteRequestService';
import { PrismaQuoteRequestRepository } from '@/quotation/infrastructure/repositories/PrismaQuoteRequestRepository';

/**
 * Initialise le controller avec ses dépendances
 */
async function initializeController(): Promise<QuoteRequestController> {
    const repository = new PrismaQuoteRequestRepository();
    const service = new QuoteRequestService(repository);
    return new QuoteRequestController(service);
}

/**
 * Crée les objets HTTP compatibles pour le controller
 */
function createHttpObjects(request: NextRequest, temporaryId: string, body?: any) {
    const httpRequest = {
        body: body || {},
        params: { temporaryId },
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

    return { httpRequest, httpResponse, getResponse: () => ({ statusCode, responseData }) };
}

/**
 * GET /api/quotesRequest/[temporaryId]
 * Récupère une demande de devis par son ID temporaire
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { temporaryId: string } }
) {
    console.log(`🔍 GET /api/quotesRequest/${params.temporaryId} - Début récupération`);
    
    try {
        const controller = await initializeController();
        const { httpRequest, httpResponse, getResponse } = createHttpObjects(request, params.temporaryId);

        await controller.getQuoteRequest(httpRequest, httpResponse as any);

        const { statusCode, responseData } = getResponse();
        
        // Log du résultat pour debug
        if (responseData.success && responseData.data) {
            console.log(`📊 QuoteRequest récupéré: ${responseData.data.id} (${responseData.data.status})`);
        }
        
        console.log(`✅ Récupération terminée avec status: ${statusCode}`);
        return NextResponse.json(responseData, { status: statusCode });

    } catch (error) {
        console.error(`❌ Erreur dans récupération ${params.temporaryId}:`, error);
        
        return NextResponse.json(
            { 
                error: 'Erreur de récupération',
                message: 'Impossible de récupérer la demande de devis',
                temporaryId: params.temporaryId,
                details: error instanceof Error ? error.message : 'Erreur inconnue'
            },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/quotesRequest/[temporaryId]
 * Met à jour une demande de devis existante
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { temporaryId: string } }
) {
    try {
        const controller = await initializeController();
        const body = await request.json();
        const { httpRequest, httpResponse, getResponse } = createHttpObjects(request, params.temporaryId, body);

        await controller.updateQuoteRequest(httpRequest, httpResponse as any);

        const { statusCode, responseData } = getResponse();
        return NextResponse.json(responseData, { status: statusCode });

    } catch (error) {
        console.error(`Erreur dans PUT /api/quotesRequest/${params.temporaryId}:`, error);
        return NextResponse.json(
            { 
                error: 'Erreur interne du serveur',
                message: error instanceof Error ? error.message : 'Erreur inconnue'
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/quotesRequest/[temporaryId]
 * Supprime une demande de devis
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { temporaryId: string } }
) {
    try {
        const controller = await initializeController();
        const { httpRequest, httpResponse, getResponse } = createHttpObjects(request, params.temporaryId);

        await controller.deleteQuoteRequest(httpRequest, httpResponse as any);

        const { statusCode, responseData } = getResponse();
        return NextResponse.json(responseData, { status: statusCode });

    } catch (error) {
        console.error(`Erreur dans DELETE /api/quotesRequest/${params.temporaryId}:`, error);
        return NextResponse.json(
            { 
                error: 'Erreur interne du serveur',
                message: error instanceof Error ? error.message : 'Erreur inconnue'
            },
            { status: 500 }
        );
    }
} 