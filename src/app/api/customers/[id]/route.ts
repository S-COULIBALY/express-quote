import { NextRequest, NextResponse } from 'next/server';
import { CustomerController } from '@/quotation/interfaces/http/controllers/CustomerController';
import { CustomerService } from '@/quotation/application/services/CustomerService';
import { PrismaCustomerRepository } from '@/quotation/infrastructure/repositories/PrismaCustomerRepository';
import { PrismaBookingRepository } from '@/quotation/infrastructure/repositories/PrismaBookingRepository';

/**
 * Initialise le controller avec ses dépendances
 */
async function initializeController(): Promise<CustomerController> {
    const customerRepository = new PrismaCustomerRepository();
    const bookingRepository = new PrismaBookingRepository();
    
    const service = new CustomerService(customerRepository, bookingRepository);
    return new CustomerController(service);
}

/**
 * Crée les objets HTTP compatibles pour le controller
 */
function createHttpObjects(request: NextRequest, customerId: string, body?: any) {
    const httpRequest = {
        body: body || {},
        params: { id: customerId },
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
 * GET /api/customers/[id]
 * Récupère un client par son ID
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const controller = await initializeController();
        const { httpRequest, httpResponse, getResponse } = createHttpObjects(request, params.id);

        await controller.getCustomerById(httpRequest, httpResponse as any);

        const { statusCode, responseData } = getResponse();
        return NextResponse.json(responseData, { status: statusCode });

    } catch (error) {
        console.error(`Erreur dans GET /api/customers/${params.id}:`, error);
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
 * PUT /api/customers/[id]
 * Met à jour un client existant
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const controller = await initializeController();
        const body = await request.json();
        const { httpRequest, httpResponse, getResponse } = createHttpObjects(request, params.id, body);

        await controller.updateCustomer(httpRequest, httpResponse as any);

        const { statusCode, responseData } = getResponse();
        return NextResponse.json(responseData, { status: statusCode });

    } catch (error) {
        console.error(`Erreur dans PUT /api/customers/${params.id}:`, error);
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
 * DELETE /api/customers/[id]
 * Supprime un client (seulement si aucune réservation active)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const controller = await initializeController();
        const { httpRequest, httpResponse, getResponse } = createHttpObjects(request, params.id);

        await controller.deleteCustomer(httpRequest, httpResponse as any);

        const { statusCode, responseData } = getResponse();
        return NextResponse.json(responseData, { status: statusCode });

    } catch (error) {
        console.error(`Erreur dans DELETE /api/customers/${params.id}:`, error);
        return NextResponse.json(
            { 
                error: 'Erreur interne du serveur',
                message: error instanceof Error ? error.message : 'Erreur inconnue'
            },
            { status: 500 }
        );
    }
} 