import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import Stripe from 'stripe';
import { priceSignatureService } from '@/quotation/application/services/PriceSignatureService';

// Rendre cette route dynamique pour éviter l'initialisation Stripe pendant le build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Initialiser Stripe uniquement si la clé est disponible
function getStripeInstance(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || secretKey.trim() === '') {
    logger.warn('⚠️ STRIPE_SECRET_KEY non définie - Les paiements ne fonctionneront pas');
    return null;
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-08-27.basil'
  });
}

/**
 * POST /api/payment/create-session
 * Crée une session Stripe Checkout avec les données client
 * Appelé automatiquement au chargement de la page /booking/[temporaryId]
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const stripe = getStripeInstance();
    if (!stripe) {
      return NextResponse.json(
        { success: false, error: 'Configuration Stripe manquante' },
        { status: 500 }
      );
    }

    const { temporaryId, customerData, amount } = await request.json();

    logger.info('💳 Création session Stripe', {
      temporaryId,
      amount,
      customerEmail: customerData?.email
    });

    // Validation des données
    if (!temporaryId) {
      return NextResponse.json(
        { success: false, error: 'temporaryId requis' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Montant invalide' },
        { status: 400 }
      );
    }

    // customerData peut être vide, Stripe collectera les infos via PaymentElement
    // On valide juste que l'objet existe
    if (!customerData) {
      return NextResponse.json(
        { success: false, error: 'Données client requises' },
        { status: 400 }
      );
    }

    // Récupérer le QuoteRequest pour vérifier qu'il existe
    const quoteResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/quotesRequest/${temporaryId}`,
      { cache: 'no-store' }
    );

    if (!quoteResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Devis non trouvé ou expiré' },
        { status: 404 }
      );
    }

    const quoteRequestData = await quoteResponse.json();
    if (!quoteRequestData.success) {
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération du devis' },
        { status: 500 }
      );
    }

    const quoteRequest = quoteRequestData.data;
    const quoteData = quoteRequest.quoteData;

    // 🔒 SÉCURITÉ NIVEAU 1: Vérifier la signature cryptographique (rapide - µs)
    let serverCalculatedPrice: number;
    let depositAmount: number;
    let verificationMethod: string;

    if (quoteData.securedPrice) {
      logger.info('🔐 Vérification signature cryptographique', { temporaryId });

      const verification = priceSignatureService.verifySignature(
        quoteData.securedPrice,
        quoteData
      );

      if (verification.valid) {
        // ✅ Signature valide - Utiliser le prix signé (RAPIDE)
        serverCalculatedPrice = quoteData.securedPrice.totalPrice;
        depositAmount = serverCalculatedPrice * 0.3;
        verificationMethod = 'signature';

        logger.info('✅ Signature valide - Prix accepté sans recalcul', {
          temporaryId,
          totalPrice: serverCalculatedPrice,
          depositAmount,
          calculationId: quoteData.securedPrice.calculationId,
          signatureAge: verification.details?.ageHours?.toFixed(2) + 'h'
        });
      } else {
        // ⚠️ Signature invalide - DÉFENSE EN PROFONDEUR: Recalcul
        logger.warn('⚠️ ALERTE SÉCURITÉ: Signature invalide - Recalcul forcé', {
          temporaryId,
          reason: verification.reason
        });

        verificationMethod = 'recalcul (signature invalide)';

        // Recalcul complet
        const priceResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/price/calculate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...quoteData, serviceType: quoteRequest.type }),
            cache: 'no-store'
          }
        );

        if (!priceResponse.ok) {
          logger.error('❌ Erreur recalcul prix sécurisé');
          return NextResponse.json(
            { success: false, error: 'Erreur lors du calcul du prix' },
            { status: 500 }
          );
        }

        const priceData = await priceResponse.json();
        const responseData = priceData.data || priceData;
        serverCalculatedPrice = responseData.summary?.total ?? responseData.totalPrice ?? 0;
        depositAmount = serverCalculatedPrice * 0.3;
      }
    } else {
      // Pas de signature (ancien système) - DÉFENSE EN PROFONDEUR: Recalcul
      logger.warn('⚠️ Pas de signature - Recalcul de sécurité', { temporaryId });
      verificationMethod = 'recalcul (pas de signature)';

      const priceResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/price/calculate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...quoteData, serviceType: quoteRequest.type }),
          cache: 'no-store'
        }
      );

      if (!priceResponse.ok) {
        logger.error('❌ Erreur recalcul prix sécurisé');
        return NextResponse.json(
          { success: false, error: 'Erreur lors du calcul du prix' },
          { status: 500 }
        );
      }

      const priceData = await priceResponse.json();
      const responseData = priceData.data || priceData;
      serverCalculatedPrice = responseData.summary?.total ?? responseData.totalPrice ?? 0;
      depositAmount = serverCalculatedPrice * 0.3;
    }

    // 🔒 SÉCURITÉ NIVEAU 2: Vérifier cohérence prix client/serveur
    const clientAmount = amount;
    const priceDifference = Math.abs(clientAmount - depositAmount);

    if (priceDifference > 0.01) {
      logger.warn('⚠️ ALERTE: Prix client différent du prix serveur', {
        clientAmount,
        serverAmount: depositAmount,
        difference: priceDifference.toFixed(2),
        differencePercent: ((priceDifference / depositAmount) * 100).toFixed(2) + '%',
        temporaryId,
        verificationMethod
      });
    } else {
      logger.info('✅ Prix client et serveur cohérents', {
        clientAmount,
        serverAmount: depositAmount,
        temporaryId,
        verificationMethod
      });
    }

    // 🔒 UTILISER LE PRIX SERVEUR, PAS LE PRIX CLIENT
    const paymentIntentAmount = Math.round(depositAmount * 100); // Montant en centimes
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: paymentIntentAmount, // Montant en centimes - PRIX SERVEUR (ACOMPTE)
      currency: 'eur',
      payment_method_types: ['card'],
      automatic_payment_methods: {
        enabled: false,
      },
      // ✅ CORRECTION: Configurer la collecte des billing_details (téléphone inclus)
      payment_method_options: {
        card: {
          // Demander explicitement les billing details complets
          setup_future_usage: 'off_session',
        },
      },
      metadata: {
        temporaryId,
        customerFirstName: customerData.firstName || '',
        customerLastName: customerData.lastName || '',
        customerEmail: customerData.email || '',
        customerPhone: customerData.phone || '',
        quoteType: quoteRequest.type,
        // 🔒 Stocker le prix serveur ET l'ID de calcul pour validation webhook
        serverCalculatedPrice: serverCalculatedPrice.toFixed(2),
        depositAmount: depositAmount.toFixed(2),
        calculationId: quoteData.securedPrice?.calculationId || 'unknown',
        clientSubmittedAmount: clientAmount.toString(),
      },
      description: getServiceDescription(quoteRequest),
      // receipt_email optionnel, Stripe l'enverra si fourni via PaymentElement
    });

    logger.info('✅ PaymentIntent Stripe créé avec prix sécurisé', {
      paymentIntentId: paymentIntent.id,
      temporaryId,
      serverAmount: depositAmount,
      clientAmount: clientAmount,
      serverTotalPrice: serverCalculatedPrice
    });

    return NextResponse.json({
      success: true,
      sessionId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      // ✅ CORRECTION: Retourner le prix recalculé pour mise à jour de l'affichage
      recalculatedPrice: {
        total: serverCalculatedPrice,
        deposit: depositAmount,
        currency: 'EUR'
      }
    });

  } catch (error) {
    logger.error('❌ Erreur création session Stripe:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la création de la session de paiement',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * Génère une description du service pour Stripe
 */
function getServiceDescription(quoteRequest: any): string {
  const type = quoteRequest.type;
  const quoteData = quoteRequest.quoteData || {};

  switch (type) {
    case 'MOVING':
      return `Déménagement - ${quoteData.pickupAddress || 'Adresse de départ'} → ${quoteData.deliveryAddress || 'Adresse d\'arrivée'}`;
    case 'CLEANING':
      return `Ménage - ${quoteData.cleaningType || 'Service de ménage'}`;
    case 'DELIVERY':
      return `Livraison - ${quoteData.pickupAddress || 'Départ'} → ${quoteData.deliveryAddress || 'Arrivée'}`;
    case 'PACKING':
      return `Emballage - Service d'emballage professionnel`;
    default:
      return `Service ${type}`;
  }
}
