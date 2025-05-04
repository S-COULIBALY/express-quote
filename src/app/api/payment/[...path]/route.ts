import { NextRequest, NextResponse } from 'next/server';
import { ApiPaymentAdapter } from '@/quotation/infrastructure/adapters/ApiPaymentAdapter';
import { PaymentCommandHandler } from '@/quotation/application/handlers/PaymentCommandHandler';
import { StripePaymentService } from '@/quotation/infrastructure/services/StripePaymentService';
import { stripeConfig } from '@/config/stripe';
import { logger } from '@/lib/logger';

// Initialiser les services et l'adapter
const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
const paymentService = new StripePaymentService(frontendUrl);
const commandHandler = new PaymentCommandHandler(paymentService);
const paymentAdapter = new ApiPaymentAdapter(commandHandler);

const apiLogger = logger.withContext('PaymentAPI');

/**
 * Traitement des requêtes de paiement
 * Route catch-all qui gère toutes les opérations de paiement
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path || [];
    const action = path[0];
    
    if (!action) {
      return NextResponse.json(
        { error: 'Action de paiement non spécifiée' },
        { status: 400 }
      );
    }
    
    apiLogger.info(`Traitement de l'action de paiement: ${action}`);
    const requestData = await request.json();
    
    switch (action) {
      case 'create-intent':
        // Créer une intention de paiement
        const paymentIntent = await paymentAdapter.createPaymentIntent(requestData);
        return NextResponse.json(paymentIntent);
        
      case 'verify':
        // Vérifier un paiement
        if (!requestData.paymentIntentId) {
          return NextResponse.json(
            { error: 'ID de l\'intention de paiement requis' },
            { status: 400 }
          );
        }
        const verificationResult = await paymentAdapter.verifyPayment(requestData.paymentIntentId);
        return NextResponse.json(verificationResult);
        
      case 'cancel':
        // Annuler un paiement
        if (!requestData.paymentIntentId) {
          return NextResponse.json(
            { error: 'ID de l\'intention de paiement requis' },
            { status: 400 }
          );
        }
        const cancellationResult = await paymentAdapter.cancelPayment(requestData.paymentIntentId);
        return NextResponse.json({ success: cancellationResult });
        
      case 'refund':
        // Effectuer un remboursement
        if (!requestData.paymentIntentId) {
          return NextResponse.json(
            { error: 'ID de l\'intention de paiement requis' },
            { status: 400 }
          );
        }
        const refundResult = await paymentAdapter.refundPayment(requestData);
        return NextResponse.json(refundResult);
        
      default:
        return NextResponse.json(
          { error: `Action de paiement non reconnue: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    apiLogger.error('Erreur lors du traitement de la requête de paiement', error as Error);
    return NextResponse.json(
      { 
        error: 'Erreur lors du traitement de la requête de paiement',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * Méthode GET pour récupérer des informations sur un paiement
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path || [];
    const action = path[0];
    const id = path[1];
    
    if (!action) {
      return NextResponse.json(
        { error: 'Action de paiement non spécifiée' },
        { status: 400 }
      );
    }
    
    apiLogger.info(`Récupération d'informations de paiement: ${action}`);
    
    switch (action) {
      case 'verify':
        // Vérifier le statut d'un paiement
        if (!id) {
          return NextResponse.json(
            { error: 'ID de l\'intention de paiement requis' },
            { status: 400 }
          );
        }
        const verificationResult = await paymentAdapter.verifyPayment(id);
        return NextResponse.json(verificationResult);
        
      case 'test-cards':
        // Récupérer les cartes de test (utile pour l'environnement de développement)
        if (stripeConfig.isDevelopment) {
          return NextResponse.json({
            testCards: paymentService.getTestCards()
          });
        }
        return NextResponse.json(
          { error: "Les cartes de test ne sont disponibles qu'en environnement de développement" },
          { status: 403 }
        );
        
      default:
        return NextResponse.json(
          { error: `Action de paiement non reconnue: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    apiLogger.error('Erreur lors de la récupération des informations de paiement', error as Error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des informations de paiement',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
} 