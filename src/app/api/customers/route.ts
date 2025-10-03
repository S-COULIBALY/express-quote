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
function createHttpObjects(request: NextRequest, body?: any) {
    const url = new URL(request.url);
    const query: Record<string, string> = {};
    
    // Convertir les paramètres de recherche
    url.searchParams.forEach((value, key) => {
        query[key] = value;
    });

    const httpRequest = {
        body: body || {},
        params: {},
        query,
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
 * GET /api/customers/
 * Récupère tous les clients avec pagination
 */
export async function GET(request: NextRequest) {
    try {
        const controller = await initializeController();
        const { httpRequest, httpResponse, getResponse } = createHttpObjects(request);

        await controller.getAllCustomers(httpRequest, httpResponse as any);

        const { statusCode, responseData } = getResponse();
        return NextResponse.json(responseData, { status: statusCode });

    } catch (error) {
        console.error('Erreur dans GET /api/customers:', error);
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
 * POST /api/customers/
 * Crée un nouveau client
 */
export async function POST(request: NextRequest) {
    try {
        const controller = await initializeController();
        const body = await request.json();
        const { httpRequest, httpResponse, getResponse } = createHttpObjects(request, body);

        await controller.createCustomer(httpRequest, httpResponse as any);

        const { statusCode, responseData } = getResponse();
        return NextResponse.json(responseData, { status: statusCode });

    } catch (error) {
        console.error('Erreur dans POST /api/customers:', error);
        return NextResponse.json(
            { 
                error: 'Erreur interne du serveur',
                message: error instanceof Error ? error.message : 'Erreur inconnue'
            },
            { status: 500 }
        );
    }
} 