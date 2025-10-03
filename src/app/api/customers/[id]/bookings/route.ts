import { NextRequest, NextResponse } from 'next/server';
import { CustomerController } from '@/quotation/interfaces/http/controllers/CustomerController';
import { CustomerService } from '@/quotation/application/services/CustomerService';
import { PrismaCustomerRepository } from '@/quotation/infrastructure/repositories/PrismaCustomerRepository';
import { PrismaBookingRepository } from '@/quotation/infrastructure/repositories/PrismaBookingRepository';

/**
 * GET /api/customers/[id]/bookings
 * Récupère les réservations d'un client
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    console.log(`📅 GET /api/customers/${params.id}/bookings - Début récupération réservations`);
    
    try {
        // Initialiser les dépendances
        const customerRepository = new PrismaCustomerRepository();
        const bookingRepository = new PrismaBookingRepository();
        
        const service = new CustomerService(customerRepository, bookingRepository);
        const controller = new CustomerController(service);

        // Créer les objets HTTP compatibles
        const httpRequest = {
            body: {},
            params: { id: params.id },
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

        // Appeler le controller
        console.log(`🎯 Appel du controller pour récupérer les réservations: ${params.id}`);
        await controller.getCustomerBookings(httpRequest, httpResponse as any);

        console.log(`✅ Réservations récupérées avec status: ${statusCode}`);
        
        // Log du résultat pour debug
        if (responseData.success && responseData.data) {
            console.log(`📊 Réservations trouvées: ${responseData.data.count} pour client ${params.id}`);
        }

        // Retourner la réponse Next.js
        return NextResponse.json(responseData, { status: statusCode });

    } catch (error) {
        console.error(`❌ Erreur dans récupération réservations ${params.id}:`, error);
        
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
                error: 'Erreur lors de la récupération des réservations',
                message: 'Impossible de récupérer les réservations pour ce client',
                customerId: params.id,
                details: error instanceof Error ? error.message : 'Erreur inconnue'
            },
            { status: 500 }
        );
    }
} 