import { NextRequest, NextResponse } from 'next/server';
import { CustomerController } from '@/quotation/interfaces/http/controllers/CustomerController';
import { CustomerService } from '@/quotation/application/services/CustomerService';
import { PrismaCustomerRepository } from '@/quotation/infrastructure/repositories/PrismaCustomerRepository';
import { PrismaBookingRepository } from '@/quotation/infrastructure/repositories/PrismaBookingRepository';

/**
 * GET /api/customers/search
 * Recherche des clients selon des critères
 * 
 * Paramètres de requête supportés:
 * - email: Recherche par email (partiel)
 * - firstName: Recherche par prénom (partiel)
 * - lastName: Recherche par nom (partiel)
 * - phone: Recherche par téléphone (partiel)
 * - limit: Limite de résultats (défaut: 50)
 * - offset: Décalage pour pagination (défaut: 0)
 */
export async function GET(request: NextRequest) {
    console.log('🔍 GET /api/customers/search - Début recherche clients');
    
    try {
        // Initialiser les dépendances
        const customerRepository = new PrismaCustomerRepository();
        const bookingRepository = new PrismaBookingRepository();
        
        const service = new CustomerService(customerRepository, bookingRepository);
        const controller = new CustomerController(service);

        // Extraire les paramètres de recherche de l'URL
        const url = new URL(request.url);
        const query: Record<string, string> = {};
        
        // Convertir les paramètres de recherche
        url.searchParams.forEach((value, key) => {
            query[key] = value;
        });

        console.log('📝 Paramètres de recherche:', query);

        // Créer les objets HTTP compatibles
        const httpRequest = {
            body: {},
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

        // Appeler le controller
        console.log('🎯 Appel du controller pour recherche clients');
        await controller.searchCustomers(httpRequest, httpResponse as any);

        console.log(`✅ Recherche terminée avec status: ${statusCode}`);
        
        // Log du résultat pour debug
        if (responseData.success && responseData.data) {
            console.log(`📊 Clients trouvés: ${responseData.data.count}`);
        }

        // Retourner la réponse Next.js
        return NextResponse.json(responseData, { status: statusCode });

    } catch (error) {
        console.error('❌ Erreur dans recherche clients:', error);
        
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
                error: 'Erreur lors de la recherche',
                message: 'Impossible de rechercher les clients',
                details: error instanceof Error ? error.message : 'Erreur inconnue'
            },
            { status: 500 }
        );
    }
} 