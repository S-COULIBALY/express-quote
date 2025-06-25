import { NextRequest, NextResponse } from 'next/server';
import { BaseApiController } from '@/quotation/interfaces/http/controllers/BaseApiController';
import { PrismaClient } from '@prisma/client';
import { PrismaConsentRepository } from '@/quotation/infrastructure/repositories/PrismaConsentRepository';
import { ConsentService } from '@/quotation/application/services/ConsentService';
import { ConsentController } from '@/quotation/infrastructure/adapters/controllers/ConsentController';

const controller = BaseApiController.getInstance();

// Initialisation des dépendances
const prisma = new PrismaClient();
const consentRepository = new PrismaConsentRepository(prisma);
const consentService = new ConsentService(consentRepository);
const consentController = new ConsentController(consentService);

/**
 * POST /api/consent - Enregistrer un nouveau consentement
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  controller.logRequest('POST', '/api/consent');
  
  try {
    return await consentController.recordConsent(req);
  } catch (error) {
    return controller.handleError(error, 'POST /api/consent');
  }
}

/**
 * PUT /api/consent - Vérifier un consentement
 */
export async function PUT(req: NextRequest): Promise<NextResponse> {
  controller.logRequest('PUT', '/api/consent');
  
  try {
    return await consentController.verifyConsent(req);
  } catch (error) {
    return controller.handleError(error, 'PUT /api/consent');
  }
}

/**
 * GET /api/consent - Récupérer l'historique des consentements
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  controller.logRequest('GET', '/api/consent');
  
  try {
    const url = new URL(req.url);
    const userIdentifier = url.searchParams.get('userIdentifier');
    const type = url.searchParams.get('type');
    
    if (!userIdentifier || !type) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required parameters: userIdentifier and type' 
        }, 
        { status: 400 }
      );
    }
    
    // Modifier la requête pour le contrôleur existant
    const modifiedReq = {
      ...req,
      json: async () => ({ userIdentifier, type })
    } as NextRequest;
    
    return await consentController.getConsentHistory(modifiedReq);
  } catch (error) {
    return controller.handleError(error, 'GET /api/consent');
  }
} 