// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { logger } from '@/lib/logger';
import { abandonTracker } from '@/lib/abandonTracking';
import { incentiveSystem } from '@/lib/incentiveSystem';
import { abandonAnalytics } from '@/lib/abandonAnalytics';
import { BookingService } from '@/quotation/application/services/BookingService';
import { CustomerService } from '@/quotation/application/services/CustomerService';
import { PrismaBookingRepository } from '@/quotation/infrastructure/repositories/PrismaBookingRepository';
import { PrismaCustomerRepository } from '@/quotation/infrastructure/repositories/PrismaCustomerRepository';
import { PrismaMovingRepository } from '@/quotation/infrastructure/repositories/PrismaMovingRepository';
import { PrismaItemRepository } from '@/quotation/infrastructure/repositories/PrismaItemRepository';
import { PrismaQuoteRequestRepository } from '@/quotation/infrastructure/repositories/PrismaQuoteRequestRepository';

// Stripe client pour récupérer les détails complets
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-08-27.basil'
});

// Import du système de notifications
let notificationSystemPromise: Promise<any> | null = null;

async function getNotificationSystem() {
  if (!notificationSystemPromise) {
    try {
      const { default: NotificationSystem } = await import('@/notifications');
      notificationSystemPromise = NotificationSystem.initialize();
    } catch (error) {
      console.warn('⚠️ Système de notifications non disponible:', error);
      return null;
    }
  }
  
  try {
    return await notificationSystemPromise;
  } catch (error) {
    console.warn('⚠️ Erreur initialisation notifications:', error);
    return null;
  }
}

const prisma = new PrismaClient();

// Instance partagée du BookingService pour le webhook
let bookingServiceInstance: BookingService | null = null;

function getBookingService(): BookingService {
  if (!bookingServiceInstance) {
    // Injection de dépendances selon l'architecture DDD
    const bookingRepository = new PrismaBookingRepository();
    const customerRepository = new PrismaCustomerRepository();
    const quoteRequestRepository = new PrismaQuoteRequestRepository();

    const customerService = new CustomerService(customerRepository);
    bookingServiceInstance = new BookingService(
      bookingRepository,
      customerRepository,
      quoteRequestRepository,
      customerService
    );

    logger.info('🏗️ BookingService initialisé pour webhook Stripe');
  }
  
  return bookingServiceInstance;
}

/**
 * Webhook Stripe pour gérer les événements de paiement
 * Déclenche la récupération automatique en cas d'échec
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = headers().get('stripe-signature') || '';

    // 🔒 SÉCURITÉ: Vérification de la signature Stripe
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    // Si STRIPE_WEBHOOK_SECRET est configuré, vérifier la signature (RECOMMANDÉ)
    if (endpointSecret && endpointSecret.trim() !== '') {
      try {
        event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
        logger.info('✅ Signature Stripe vérifiée');
      } catch (err) {
        const error = err as Error;
        logger.error('❌ SÉCURITÉ: Signature Stripe invalide', {
          error: error.message,
          signature: signature.substring(0, 20) + '...'
        });
        return NextResponse.json(
          { error: 'Signature invalide' },
          { status: 400 }
        );
      }
    } else {
      // ⚠️ MODE DÉVELOPPEMENT: Accepter sans vérification (NON RECOMMANDÉ EN PRODUCTION)
      logger.warn('⚠️ STRIPE_WEBHOOK_SECRET non configuré - webhook accepté sans vérification de signature');
      logger.warn('⚠️ CONFIGUREZ STRIPE_WEBHOOK_SECRET pour activer la sécurité en production');
      event = JSON.parse(body);
    }

    logger.info(`📥 Webhook Stripe reçu: ${event.type}`, {
      eventId: event.id,
      objectId: event.data.object.id
    });

    // Traitement selon le type d'événement
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event);
        break;

      case 'checkout.session.expired':
        await handleCheckoutExpired(event);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event);
        break;

      case 'payment_method.attached':
        await handlePaymentMethodAttached(event);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event);
        break;

      default:
        logger.info(`Type d'événement non traité: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    logger.error('Erreur webhook Stripe:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * Gérer la finalisation du checkout (paiement réussi)
 * 🎯 C'est ici que le Booking est créé APRÈS confirmation du paiement
 */
async function handleCheckoutCompleted(event: any): Promise<void> {
  try {
    const session = event.data.object;

    logger.info('💳 Checkout completed:', {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      amount: session.amount_total / 100,
      metadata: session.metadata
    });

    // Récupérer les métadonnées
    const {
      temporaryId,
      customerFirstName,
      customerLastName,
      customerEmail,
      customerPhone,
      quoteType,
      amount
    } = session.metadata;

    // Validation: vérifier que le paiement est bien réussi
    if (session.payment_status !== 'paid') {
      logger.warn(`⚠️ Paiement non confirmé (status: ${session.payment_status})`);
      return;
    }

    // Validation: temporaryId requis
    if (!temporaryId) {
      logger.error('❌ temporaryId manquant dans les métadonnées Stripe');
      return;
    }

    // Appeler /api/bookings/finalize pour créer le Booking
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/bookings/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.id,
        temporaryId,
        paymentIntentId: session.payment_intent,
        paymentStatus: session.payment_status,
        amount: session.amount_total / 100,
        customerData: {
          firstName: customerFirstName,
          lastName: customerLastName,
          email: customerEmail,
          phone: customerPhone
        },
        quoteType,
        metadata: session.metadata
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      logger.error('❌ Erreur création Booking:', errorData);
      throw new Error(`Échec création Booking: ${errorData.error}`);
    }

    const bookingData = await response.json();

    logger.info('✅ Booking créé avec succès:', {
      bookingId: bookingData.data?.id,
      temporaryId,
      sessionId: session.id
    });

    // 📧 Les notifications sont envoyées dans createBookingAfterPayment:
    // - Email client (confirmation + reçu)
    // - Email professionnel (nouvelle mission)
    // - Notification admin (monitoring)

  } catch (error) {
    logger.error('❌ Erreur handleCheckoutCompleted:', error);
    throw error;
  }
}

/**
 * Gérer les échecs de paiement
 */
async function handlePaymentFailed(event: any): Promise<void> {
  try {
    const paymentIntent = event.data.object;
    const bookingId = paymentIntent.metadata?.bookingId;
    
    if (!bookingId) {
      logger.warn('Booking ID manquant dans les métadonnées du paiement');
      return;
    }

    // Récupérer la réservation
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { Customer: true }
    });

    if (!booking) {
      logger.warn(`Réservation non trouvée: ${bookingId}`);
      return;
    }

    // Mettre à jour le statut de la réservation
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'PAYMENT_FAILED' }
    });

    // Enregistrer la transaction échouée
    await prisma.transaction.create({
      data: {
        bookingId,
        amount: paymentIntent.amount / 100, // Convertir centimes en euros
        currency: paymentIntent.currency,
        status: 'FAILED',
        paymentIntentId: paymentIntent.id,
        errorMessage: paymentIntent.last_payment_error?.message || 'Échec de paiement'
      }
    });

    // Tracking d'abandon
    await abandonTracker.trackPaymentFailure(bookingId, {
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      errorCode: paymentIntent.last_payment_error?.code,
      errorMessage: paymentIntent.last_payment_error?.message,
      paymentMethod: paymentIntent.payment_method_types?.[0]
    });

    // Analytics
    await abandonAnalytics.recordAbandonEvent({
      id: `payment_failed_${bookingId}`,
      sessionId: booking.customer.id,
      stage: 'payment_failed',
      timestamp: new Date(),
      timeSpent: 0,
      data: {
        bookingId,
        amount: paymentIntent.amount / 100,
        errorCode: paymentIntent.last_payment_error?.code
      },
      userAgent: 'stripe-webhook',
      recoveryAttempts: 0,
      isRecovered: false,
      metadata: {
        bookingId,
        priceAtAbandon: paymentIntent.amount / 100,
        contactInfo: {
          hasEmail: !!booking.customer.email,
          hasPhone: !!booking.customer.phone
        }
      }
    });

    // Déclencher la récupération d'urgence
    await triggerPaymentFailureRecovery(booking, paymentIntent);

    logger.info(`💳 Échec de paiement traité pour la réservation ${bookingId}`);

  } catch (error) {
    logger.error('Erreur lors du traitement d\'échec de paiement:', error);
  }
}

/**
 * Gérer les paiements annulés
 */
async function handlePaymentCanceled(event: any): Promise<void> {
  try {
    const paymentIntent = event.data.object;
    const bookingId = paymentIntent.metadata?.bookingId;
    
    if (!bookingId) return;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { Customer: true }
    });

    if (!booking) return;

    // Mettre à jour le statut
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'PAYMENT_FAILED' }
    });

    // Tracking d'abandon
    await abandonTracker.trackPaymentAbandon(bookingId, {
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      reason: 'user_canceled'
    });

    // Déclencher la récupération
    await triggerPaymentCancelRecovery(booking, paymentIntent);

    logger.info(`🚫 Paiement annulé traité pour la réservation ${bookingId}`);

  } catch (error) {
    logger.error('Erreur lors du traitement d\'annulation de paiement:', error);
  }
}

/**
 * Gérer les sessions checkout expirées
 */
async function handleCheckoutExpired(event: any): Promise<void> {
  try {
    const session = event.data.object;
    const bookingId = session.metadata?.bookingId;
    
    if (!bookingId) return;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { Customer: true }
    });

    if (!booking) return;

    // Mettre à jour le statut
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'PAYMENT_FAILED' }
    });

    // Tracking d'abandon
    await abandonTracker.trackPaymentAbandon(bookingId, {
      amount: session.amount_total / 100,
      currency: session.currency,
      reason: 'session_expired'
    });

    // Déclencher la récupération
    await triggerSessionExpiredRecovery(booking, session);

    logger.info(`⏰ Session checkout expirée traitée pour la réservation ${bookingId}`);

  } catch (error) {
    logger.error('Erreur lors du traitement de session expirée:', error);
  }
}

/**
 * Gérer les paiements réussis
 * 🎯 Créer le Booking APRÈS confirmation du paiement (nouveau flux)
 */
async function handlePaymentSucceeded(event: any): Promise<void> {
  try {
    const paymentIntent = event.data.object;
    const { temporaryId, bookingId } = paymentIntent.metadata || {};

    logger.info('💳 PaymentIntent succeeded:', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      temporaryId,
      bookingId,
      metadata: paymentIntent.metadata
    });

    // CAS 1: Nouveau flux - temporaryId présent → créer le Booking
    if (temporaryId) {
      // ✅ VÉRIFICATION: Vérifier si le booking existe déjà (créé par checkout.session.completed)
      const existingBooking = await prisma.booking.findFirst({
        where: {
          transactions: {
            some: {
              paymentIntentId: paymentIntent.id
            }
          }
        },
        include: {
          transactions: true
        }
      });

      if (existingBooking) {
        logger.info('✅ Booking déjà créé via checkout.session.completed, ignorer payment_intent.succeeded', {
          bookingId: existingBooking.id,
          paymentIntentId: paymentIntent.id
        });
        return;
      }

      logger.info('🆕 Nouveau flux détecté - création du Booking après paiement');

      // 🔒 VALIDATION SÉCURITÉ: Recalculer le prix côté serveur et vérifier le montant payé
      const {
        serverCalculatedPrice,
        depositAmount,
        calculationId,
        quoteType: paymentIntentQuoteType
      } = paymentIntent.metadata;

      // Si le prix serveur est présent dans les metadata, valider le montant
      if (serverCalculatedPrice && depositAmount) {
        const expectedAmount = Math.round(parseFloat(depositAmount) * 100); // En centimes
        const actualAmount = paymentIntent.amount;
        const difference = Math.abs(actualAmount - expectedAmount);

        // Tolérance de 1€ pour arrondis (100 centimes)
        if (difference > 100) {
          logger.error('🚨 ALERTE SÉCURITÉ: Montant payé différent du montant attendu', {
            temporaryId,
            expectedAmount: expectedAmount / 100,
            actualAmount: actualAmount / 100,
            difference: difference / 100,
            paymentIntentId: paymentIntent.id,
            calculationId
          });

          // ⚠️ BLOQUER LA CRÉATION DU BOOKING
          throw new Error(
            `Montant invalide: attendu ${expectedAmount / 100}€, reçu ${actualAmount / 100}€. ` +
            `Différence: ${difference / 100}€. PaymentIntent: ${paymentIntent.id}`
          );
        }

        logger.info('✅ Montant validé', {
          expectedAmount: expectedAmount / 100,
          actualAmount: actualAmount / 100,
          difference: difference / 100
        });
      } else {
        logger.warn('⚠️ Prix serveur absent des metadata - impossible de valider le montant', {
          temporaryId,
          paymentIntentId: paymentIntent.id
        });
      }

      // ✅ CORRECTION: Récupérer le PaymentIntent complet avec TOUTES les données
      // ⚠️ NOTE: charges.data.payment_method ne peut PAS être expansé (erreur Stripe)
      // On récupère les données depuis latest_charge et payment_method directement
      const fullPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntent.id, {
        expand: [
          'charges.data.billing_details',
          'charges.data.payment_method_details',
          'payment_method',                    // ✅ PaymentMethod attaché au PaymentIntent
          'latest_charge',                     // ✅ Charge la plus récente
          'latest_charge.billing_details'      // ✅ Billing details de la charge
          // ❌ 'charges.data.payment_method' - NE PEUT PAS ÊTRE EXPANSÉ
        ]
      }) as any;
      
      console.log('🔍 [WEBHOOK] PaymentIntent récupéré:', {
        id: fullPaymentIntent.id,
        payment_method: fullPaymentIntent.payment_method,
        has_charges: !!fullPaymentIntent.charges?.data?.length,
        latest_charge: fullPaymentIntent.latest_charge ? {
          id: fullPaymentIntent.latest_charge.id,
          billing_details: fullPaymentIntent.latest_charge.billing_details,
          payment_method: fullPaymentIntent.latest_charge.payment_method
        } : null
      });

      // ✅ CORRECTION: Récupérer les infos client depuis MULTIPLES sources
      // 1. latest_charge.billing_details (le plus récent et fiable)
      const latestCharge = fullPaymentIntent.latest_charge;
      let latestChargeBillingDetails: { name?: string; email?: string; phone?: string } = {};
      if (latestCharge && typeof latestCharge === 'object' && 'billing_details' in latestCharge) {
        latestChargeBillingDetails = (latestCharge as any).billing_details || {};
      }
      
      // 2. charges.data[0].billing_details (première charge)
      const charge = fullPaymentIntent.charges?.data?.[0];
      const billingDetails = charge?.billing_details || {};
      
      // 3. PaymentMethod attaché au PaymentIntent (peut être expansé)
      const paymentMethod = fullPaymentIntent.payment_method;
      let paymentMethodBillingDetails: { name?: string; email?: string; phone?: string } = {};
      if (paymentMethod && typeof paymentMethod === 'object' && 'billing_details' in paymentMethod) {
        paymentMethodBillingDetails = (paymentMethod as any).billing_details || {};
      }
      
      // 4. Si latest_charge a un payment_method ID, on peut le récupérer séparément
      let latestChargePaymentMethodBillingDetails: { name?: string; email?: string; phone?: string } = {};
      if (latestCharge && typeof latestCharge === 'object' && 'payment_method' in latestCharge) {
        const latestChargePaymentMethodId = (latestCharge as any).payment_method;
        // Si c'est un ID (string), on peut le récupérer séparément si nécessaire
        // Pour l'instant, on utilise les autres sources
      }

      // ✅ Combiner les sources par ordre de priorité (le plus récent en premier)
      const combinedBillingDetails = {
        name: latestChargeBillingDetails.name || 
              paymentMethodBillingDetails.name || 
              billingDetails.name || '',
        email: latestChargeBillingDetails.email || 
               paymentMethodBillingDetails.email || 
               billingDetails.email || '',
        phone: latestChargeBillingDetails.phone || 
               paymentMethodBillingDetails.phone || 
               billingDetails.phone || ''
      };
      
      console.log('🔍 [WEBHOOK] Billing details récupérés depuis toutes les sources:', {
        latestCharge: latestChargeBillingDetails,
        paymentMethod: paymentMethodBillingDetails,
        charge: billingDetails,
        combined: combinedBillingDetails
      });

      const customerName = combinedBillingDetails.name || '';
      const [firstName, ...lastNameParts] = customerName.split(' ').filter(Boolean);
      const lastName = lastNameParts.join(' ') || '';

      // Fallback sur metadata si pas de billing_details
      const {
        customerFirstName,
        customerLastName,
        customerEmail,
        customerPhone,
        quoteType,
        amount
      } = paymentIntent.metadata;

      // Log détaillé pour tracer l'origine des données utilisateur
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('📋 [TRACE UTILISATEUR] Données client récupérées depuis Stripe');
      console.log('═══════════════════════════════════════════════════════════════');
      logger.info('📋 [TRACE UTILISATEUR] Données client récupérées depuis Stripe:', {
        source: 'payment_intent.succeeded webhook',
        paymentIntentId: paymentIntent.id,
        chargeBillingDetails: {
          name: billingDetails.name,
          email: billingDetails.email,
          phone: billingDetails.phone,
          address: billingDetails.address,
          exists: !!charge
        },
        paymentMethodBillingDetails: {
          name: paymentMethodBillingDetails.name,
          email: paymentMethodBillingDetails.email,
          phone: paymentMethodBillingDetails.phone,
          exists: !!paymentMethod
        },
        combined: {
          name: combinedBillingDetails.name,
          email: combinedBillingDetails.email,
          phone: combinedBillingDetails.phone,
          isEmpty: !combinedBillingDetails.name && !combinedBillingDetails.email && !combinedBillingDetails.phone
        },
        metadata: {
          customerFirstName,
          customerLastName,
          customerEmail,
          customerPhone,
          hasMetadata: !!(customerFirstName || customerLastName || customerEmail || customerPhone)
        },
        extracted: {
          firstName: firstName || customerFirstName || 'Client',
          lastName: lastName || customerLastName || 'Anonymous',
          email: combinedBillingDetails.email || customerEmail || 'noreply@example.com',
          phone: combinedBillingDetails.phone || customerPhone || '',
          phoneIsEmpty: !(combinedBillingDetails.phone || customerPhone)
        },
        warning: !(combinedBillingDetails.phone || customerPhone) ? '⚠️ Téléphone manquant - utilisation de valeur par défaut' : null
      });
      
      // Log console pour visibilité immédiate
      console.log('📋 [TRACE UTILISATEUR] Données extraites:', {
        firstName: firstName || customerFirstName || 'Client',
        lastName: lastName || customerLastName || 'Anonymous',
        email: combinedBillingDetails.email || customerEmail || 'noreply@example.com',
        phone: combinedBillingDetails.phone || customerPhone || '',
        phoneIsEmpty: !(combinedBillingDetails.phone || customerPhone),
        sources: {
          latestCharge: latestChargeBillingDetails,
          paymentMethod: paymentMethodBillingDetails,
          charge: billingDetails
        },
        metadata: {
          customerFirstName,
          customerLastName,
          customerEmail,
          customerPhone
        },
        warning: !(combinedBillingDetails.email || customerEmail) ? '⚠️ Email manquant' : null,
        warningPhone: !(combinedBillingDetails.phone || customerPhone) ? '⚠️ Téléphone manquant' : null
      });

      // Appeler /api/bookings/finalize pour créer le Booking
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/bookings/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: paymentIntent.id, // PaymentIntent ID utilisé comme sessionId
          paymentIntentId: paymentIntent.id,
          temporaryId,
          paymentStatus: 'paid',
          amount: paymentIntent.amount / 100, // ⚠️ ATTENTION: C'est l'ACOMPTE, pas le prix total!
          customerData: {
            firstName: firstName || customerFirstName || 'Client',
            lastName: lastName || customerLastName || 'Anonymous',
            email: combinedBillingDetails.email || customerEmail || 'noreply@example.com',
            phone: combinedBillingDetails.phone || customerPhone || ''
          },
          quoteType,
          metadata: paymentIntent.metadata
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error('❌ Erreur création Booking:', errorData);
        throw new Error(`Échec création Booking: ${errorData.error}`);
      }

      const bookingData = await response.json();

      // La structure de réponse est : { success: true, data: { success: true, data: { id: ... } } }
      // ou : { success: true, data: { id: ... } }
      const bookingId = bookingData.data?.data?.id || bookingData.data?.id;
      const bookingTotalAmount = bookingData.data?.data?.totalAmount || bookingData.data?.totalAmount;

      logger.info('✅ Booking créé avec succès:', {
        bookingId: bookingId,
        bookingTotalAmount,
        temporaryId,
        paymentIntentId: paymentIntent.id
      });

      // 🔒 VALIDATION FINALE: Vérifier que le prix total du Booking correspond au prix serveur
      if (serverCalculatedPrice && bookingTotalAmount) {
        const expectedTotal = parseFloat(serverCalculatedPrice);
        const actualTotal = parseFloat(bookingTotalAmount);
        const priceDifference = Math.abs(expectedTotal - actualTotal);
        const tolerance = expectedTotal * 0.01; // 1% de tolérance

        if (priceDifference > tolerance) {
          logger.error('🚨 ALERTE SÉCURITÉ: Prix total du Booking diverge du prix serveur', {
            temporaryId,
            bookingId,
            expectedTotal,
            actualTotal,
            difference: priceDifference.toFixed(2),
            differencePercent: ((priceDifference / expectedTotal) * 100).toFixed(2) + '%',
            paymentIntentId: paymentIntent.id,
            calculationId
          });

          // ⚠️ NE PAS bloquer (le paiement est déjà validé) mais ALERTER
          // TODO: Envoyer une notification à l'admin pour investigation manuelle
        } else {
          logger.info('✅ Prix total du Booking validé', {
            expectedTotal,
            actualTotal,
            difference: priceDifference.toFixed(2)
          });
        }
      } else {
        logger.warn('⚠️ Impossible de valider le prix total - données manquantes', {
          serverCalculatedPrice,
          bookingTotalAmount
        });
      }

      return;
    }

    // CAS 2: Ancien flux - bookingId présent → mettre à jour le Booking existant
    if (!bookingId) {
      logger.warn('⚠️ Ni temporaryId ni bookingId dans les métadonnées');
      return;
    }

    // Récupérer la réservation avec les détails du client
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        Customer: true,
        quoteRequest: {
          select: {
            id: true,
            type: true,
            temporaryId: true
          }
        }
      }
    });

    if (!booking) {
      logger.warn(`Réservation non trouvée pour paiement réussi: ${bookingId}`);
      return;
    }

    // Mettre à jour le statut de la réservation
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'PAYMENT_COMPLETED' }
    });

    // Enregistrer la transaction réussie
    await prisma.transaction.upsert({
      where: { paymentIntentId: paymentIntent.id },
      update: { status: 'COMPLETED' },
      create: {
        bookingId,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: 'COMPLETED',
        paymentIntentId: paymentIntent.id,
        paymentMethod: paymentIntent.payment_method_types?.[0]
      }
    });

    // Marquer les abandons antérieurs comme récupérés
    await abandonAnalytics.recordRecoveryEvent(
      `payment_failed_${bookingId}`,
      'payment_retry',
      'stripe_retry',
      true,
      0
    );

    // 🚀 UTILISER BOOKINGSERVICE POUR GÉRER LE PAIEMENT AVEC DOCUMENTORCHESTRATIONSERVICE
    try {
      const bookingService = getBookingService();
      await bookingService.confirmPaymentSuccess(bookingId, {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convertir centimes en euros
        status: 'completed'
      });

      logger.info('🎉 Paiement traité via BookingService avec génération de documents');
    } catch (serviceError) {
      logger.warn('⚠️ Erreur lors du traitement via BookingService, fallback vers notifications directes:', serviceError);

      // Fallback : utiliser l'ancien système si BookingService échoue
      try {
        await sendPaymentConfirmationNotifications(booking, paymentIntent);
        logger.info('✅ Fallback notifications envoyées');
      } catch (fallbackError) {
        logger.error('❌ Même le fallback a échoué:', fallbackError);
      }
    }

    logger.info(`✅ Paiement réussi traité pour la réservation ${bookingId}`);

  } catch (error) {
    logger.error('Erreur lors du traitement de paiement réussi:', error);
  }
}

/**
 * Gérer les méthodes de paiement attachées
 */
async function handlePaymentMethodAttached(event: any): Promise<void> {
  try {
    const paymentMethod = event.data.object;
    
    logger.info(`💳 Méthode de paiement attachée: ${paymentMethod.type}`, {
      paymentMethodId: paymentMethod.id,
      customerId: paymentMethod.customer
    });

    // Potentiellement déclencher des actions spécifiques
    // Par exemple, proposer des offres pour fidéliser
    
  } catch (error) {
    logger.error('Erreur lors du traitement de méthode de paiement:', error);
  }
}

/**
 * Gérer les suppressions d'abonnement
 */
async function handleSubscriptionDeleted(event: any): Promise<void> {
  try {
    const subscription = event.data.object;
    
    logger.info(`🔚 Abonnement supprimé: ${subscription.id}`, {
      customerId: subscription.customer,
      reason: subscription.cancellation_details?.reason
    });

    // Déclencher la récupération d'abonnement
    await triggerSubscriptionRecovery(subscription);
    
  } catch (error) {
    logger.error('Erreur lors du traitement de suppression d\'abonnement:', error);
  }
}

/**
 * Déclencher la récupération d'urgence pour échec de paiement
 */
async function triggerPaymentFailureRecovery(booking: any, paymentIntent: any): Promise<void> {
  try {
    const customer = booking.customer;
    const amount = paymentIntent.amount / 100;
    const errorMessage = paymentIntent.last_payment_error?.message || 'Échec de paiement';

    // Évaluer les incentives d'urgence
    const incentives = await incentiveSystem.evaluateIncentives({
      trigger: 'payment_abandoned',
      userId: customer.id,
      bookingId: booking.id,
      originalAmount: amount,
      serviceType: booking.type,
      customerSegment: 'payment_failed'
    });

    // Ancien système de notification supprimé
    logger.info('💳 Paiement échoué - notification non envoyée (ancien système supprimé)', { 
      bookingId, 
      amount,
      errorMessage 
    });

    // Programmer des tentatives de récupération
    await schedulePaymentRecoverySequence(booking, amount, errorMessage);

    logger.info(`🚨 Récupération d'urgence déclenchée pour échec de paiement: ${booking.id}`);

  } catch (error) {
    logger.error('Erreur lors du déclenchement de récupération d\'échec:', error);
  }
}

/**
 * Déclencher la récupération pour paiement annulé
 */
async function triggerPaymentCancelRecovery(booking: any, paymentIntent: any): Promise<void> {
  try {
    const customer = booking.customer;
    const amount = paymentIntent.amount / 100;

    // Notification plus douce pour annulation
    const notification = {
      id: `cancel_recovery_${booking.id}`,
      type: 'payment_recovery' as const,
      priority: 'high' as const,
      channels: ['email', 'sms'] as const,
      recipient: {
        email: customer.email,
        phone: customer.phone,
        userId: customer.id
      },
      content: {
        title: 'Reprenez votre réservation',
        message: `Votre réservation de ${amount}€ vous attend. Finalisez-la maintenant.`,
        actionText: 'Finaliser le paiement',
        actionUrl: `/payment/${booking.id}`,
        incentive: 'Assistance gratuite disponible'
      },
      metadata: { bookingId: booking.id, amount }
    };

    // Ancien système de notification supprimé

    logger.info(`🔄 Récupération déclenchée pour paiement annulé: ${booking.id}`);

  } catch (error) {
    logger.error('Erreur lors du déclenchement de récupération d\'annulation:', error);
  }
}

/**
 * Déclencher la récupération pour session expirée
 */
async function triggerSessionExpiredRecovery(booking: any, session: any): Promise<void> {
  try {
    const customer = booking.customer;
    const amount = session.amount_total / 100;

    // Notification avec urgence pour session expirée
    const notification = {
      id: `expired_recovery_${booking.id}`,
      type: 'payment_recovery' as const,
      priority: 'urgent' as const,
      channels: ['email', 'sms', 'push'] as const,
      recipient: {
        email: customer.email,
        phone: customer.phone,
        userId: customer.id
      },
      content: {
        title: 'Session expirée - Reprenez votre paiement',
        message: `Votre session de paiement de ${amount}€ a expiré. Créez un nouveau lien de paiement.`,
        actionText: 'Nouveau paiement',
        actionUrl: `/payment/${booking.id}`,
        deadline: '2 heures'
      },
      metadata: { bookingId: booking.id, amount }
    };

    // Ancien système de notification supprimé

    logger.info(`⏰ Récupération déclenchée pour session expirée: ${booking.id}`);

  } catch (error) {
    logger.error('Erreur lors du déclenchement de récupération de session:', error);
  }
}

/**
 * Déclencher la récupération d'abonnement
 */
async function triggerSubscriptionRecovery(subscription: any): Promise<void> {
  try {
    // Récupérer le client
    const customerId = subscription.customer;
    
    // Créer une offre de retour
    const notification = {
      id: `subscription_recovery_${subscription.id}`,
      type: 'incentive_offer' as const,
      priority: 'medium' as const,
      channels: ['email', 'whatsapp'] as const,
      recipient: {
        userId: customerId
      },
      content: {
        title: 'Nous vous manquons déjà !',
        message: 'Revenez avec une offre spéciale de 3 mois gratuits.',
        actionText: 'Réactiver mon abonnement',
        incentive: '3 mois gratuits'
      },
      schedule: {
        delay: 24 * 60 * 60 * 1000 // 24 heures
      }
    };

    // Ancien système de notification supprimé

    logger.info(`🔄 Récupération d'abonnement déclenchée: ${subscription.id}`);

  } catch (error) {
    logger.error('Erreur lors du déclenchement de récupération d\'abonnement:', error);
  }
}

/**
 * Programmer une séquence de récupération de paiement
 */
async function schedulePaymentRecoverySequence(booking: any, amount: number, errorMessage: string): Promise<void> {
  try {
    const customer = booking.customer;
    const recoverySteps = [
      {
        delay: 5 * 60 * 1000, // 5 minutes
        type: 'immediate_help',
        channels: ['email', 'sms'],
        message: 'Besoin d\'aide avec votre paiement ? Notre équipe est disponible.'
      },
      {
        delay: 30 * 60 * 1000, // 30 minutes
        type: 'alternative_payment',
        channels: ['email', 'call'],
        message: 'Essayez un autre moyen de paiement ou contactez-nous.'
      },
      {
        delay: 2 * 60 * 60 * 1000, // 2 heures
        type: 'manager_outreach',
        channels: ['call', 'email'],
        message: 'Notre responsable vous contactera pour résoudre le problème.'
      },
      {
        delay: 24 * 60 * 60 * 1000, // 24 heures
        type: 'final_offer',
        channels: ['email', 'sms'],
        message: 'Dernière chance : finalisez avec une remise exceptionnelle.'
      }
    ];

    for (const step of recoverySteps) {
      setTimeout(async () => {
        const notification = {
          id: `recovery_${step.type}_${booking.id}`,
          type: 'payment_recovery' as const,
          priority: 'high' as const,
          channels: step.channels as any,
          recipient: {
            email: customer.email,
            phone: customer.phone,
            userId: customer.id
          },
          content: {
            title: 'Assistance paiement',
            message: step.message,
            actionText: 'Réessayer le paiement',
            actionUrl: `/payment/${booking.id}`,
            incentive: step.type === 'final_offer' ? '15% de réduction' : undefined
          },
          metadata: { bookingId: booking.id, amount, step: step.type }
        };

        // Ancien système de notification supprimé
        
        // Enregistrer la tentative de récupération
        await abandonAnalytics.recordRecoveryEvent(
          `payment_failed_${booking.id}`,
          step.type,
          step.channels[0],
          false,
          5 // Coût approximatif
        );
      }, step.delay);
    }

    logger.info(`📅 Séquence de récupération programmée pour: ${booking.id}`);

  } catch (error) {
    logger.error('Erreur lors de la programmation de séquence de récupération:', error);
  }
}

/**
 * Envoie les notifications de confirmation de paiement
 */
async function sendPaymentConfirmationNotifications(booking: any, paymentIntent: any): Promise<void> {
  console.log(`💳 Envoi notifications de confirmation de paiement pour réservation ${booking.id}`);
  
  try {
    // Récupérer le système de notifications
    const notificationSystem = await getNotificationSystem();
    if (!notificationSystem) {
      console.warn('⚠️ Système de notifications non disponible');
      return;
    }

    // Préparer les données pour les notifications
    const paymentData = {
      customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
      customerEmail: booking.customer.email,
      customerPhone: booking.customer.phone,
      amount: paymentIntent.amount / 100, // Stripe en centimes
      currency: paymentIntent.currency,
      paymentMethod: getPaymentMethodDisplayName(paymentIntent.payment_method_types?.[0]),
      transactionId: paymentIntent.id,
      paymentDate: new Date().toISOString(),
      bookingId: booking.id,
      bookingReference: `EQ-${booking.id.slice(-8).toUpperCase()}`,
      serviceType: booking.quoteRequest?.type || 'SERVICE',
      serviceName: getServiceDisplayName(booking.quoteRequest?.type || 'SERVICE'),
      serviceDate: booking.scheduledDate ? booking.scheduledDate.toISOString().split('T')[0] : null,
      serviceTime: booking.scheduledDate ? booking.scheduledDate.toTimeString().slice(0, 5) : null,
      invoiceNumber: `INV-${booking.id.slice(-8).toUpperCase()}-${new Date().getFullYear()}`
    };

    // 1. Email de confirmation avec template React
    await notificationSystem.sendEmail({
      to: booking.customer.email,
      subject: `Paiement confirmé - ${paymentData.bookingReference}`,
      template: 'PaymentConfirmation',
      data: {
        ...paymentData,
        viewBookingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${booking.id}`,
        downloadInvoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${booking.id}/invoice`,
        supportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/support`,
        companyName: 'Express Quote',
        companyAddress: process.env.COMPANY_ADDRESS || '123 Avenue des Services, 75001 Paris',
        companyPhone: process.env.SUPPORT_PHONE || '01 23 45 67 89',
        companyEmail: process.env.SUPPORT_EMAIL || 'support@expressquote.fr',
        refundPolicy: 'Remboursement possible sous 14 jours selon nos conditions générales',
        cancellationPolicy: 'Annulation gratuite jusqu\'à 24h avant le service'
      }
    });

    // 2. WhatsApp si numéro disponible
    if (booking.customer.phone) {
      await notificationSystem.sendWhatsApp({
        to: booking.customer.phone,
        template: 'payment_confirmation',
        variables: {
          client_name: paymentData.customerName,
          amount: paymentData.amount,
          booking_id: paymentData.bookingReference,
          service_date: paymentData.serviceDate || 'À définir'
        }
      });
    }

    // 3. SMS de confirmation
    if (booking.customer.phone) {
      await notificationSystem.sendSMS({
        to: booking.customer.phone,
        message: `✅ Paiement de ${paymentData.amount}€ confirmé ! Votre service du ${paymentData.serviceDate || 'date à définir'} est validé. Facture par email.`
      });
    }

    // 4. Génération et envoi de la facture PDF
    try {
      const documentService = await import('@/documents/application/services/DocumentService');
      const docService = new documentService.DocumentService();
      
      const invoiceBuffer = await docService.generateDocument({
        type: 'INVOICE',
        bookingId: booking.id,
        customerEmail: booking.customer.email,
        additionalData: {
          invoiceNumber: paymentData.invoiceNumber,
          paymentInfo: {
            transactionId: paymentData.transactionId,
            paymentMethod: paymentData.paymentMethod,
            amount: paymentData.amount,
            paymentDate: paymentData.paymentDate
          }
        }
      });

      // Envoyer la facture par email
      await notificationSystem.sendEmail({
        to: booking.customer.email,
        subject: `Facture - ${paymentData.bookingReference}`,
        text: 'Veuillez trouver en pièce jointe votre facture de paiement.',
        attachments: [{
          filename: `facture_${paymentData.bookingReference}.pdf`,
          content: invoiceBuffer,
          contentType: 'application/pdf'
        }]
      });
    } catch (pdfError) {
      console.warn('⚠️ Erreur génération facture PDF:', pdfError);
    }

    console.log(`✅ Notifications de confirmation de paiement envoyées pour réservation ${booking.id}`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi des notifications de paiement:', error);
    throw error;
  }
}

/**
 * Obtient le nom d'affichage de la méthode de paiement
 */
function getPaymentMethodDisplayName(paymentMethod: string): string {
  switch (paymentMethod) {
    case 'card': return 'Carte bancaire';
    case 'sepa_debit': return 'Prélèvement SEPA';
    case 'paypal': return 'PayPal';
    case 'apple_pay': return 'Apple Pay';
    case 'google_pay': return 'Google Pay';
    default: return 'Paiement en ligne';
  }
}

/**
 * Obtient le nom d'affichage du service
 */
function getServiceDisplayName(serviceType: string): string {
  switch (serviceType) {
    case 'MOVING': return 'Déménagement';
    case 'PACK': return 'Emballage';
    case 'SERVICE': return 'Service à domicile';
    case 'DELIVERY': return 'Livraison';
    default: return 'Service Express Quote';
  }
} 