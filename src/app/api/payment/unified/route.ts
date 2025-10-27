import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

// Interface unifiée pour les données de paiement
interface UnifiedPaymentData {
  bookingId: string
  serviceType: 'moving' | 'cleaning' | 'catalog' | 'transport' | 'delivery' | 'pack' | 'service'
  amount: number
  currency: string
  customerInfo: {
    name?: string
    email?: string
    phone?: string
    address?: string
  }
  serviceDetails: {
    date: string
    time?: string
    description: string
    location?: string
    pickupAddress?: string
    deliveryAddress?: string
  }
  metadata?: Record<string, any>
}

// Interface pour la réponse de paiement
interface PaymentResponse {
  success: boolean
  paymentIntentId?: string
  clientSecret?: string
  error?: string
  redirectUrl?: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: UnifiedPaymentData = await request.json()
    const paymentLogger = logger.withContext('UnifiedPayment')
    
    paymentLogger.info(`Traitement paiement unifié pour ${body.serviceType}`, {
      bookingId: body.bookingId,
      amount: body.amount,
      serviceType: body.serviceType
    })

    // Validation des données
    if (!body.bookingId || !body.serviceType || !body.amount) {
      return NextResponse.json({
        success: false,
        error: 'Données de paiement incomplètes'
      }, { status: 400 })
    }

    // Simulation du processus de paiement
    // Dans un vrai environnement, intégrer avec Stripe/PayPal/etc.
    const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const clientSecret = `${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 9)}`

    // Log des détails du service
    paymentLogger.info('Détails du service pour paiement', {
      serviceType: body.serviceType,
      serviceDetails: body.serviceDetails,
      customerInfo: body.customerInfo
    })

    // Générer la réponse selon le type de service
    const response: PaymentResponse = {
      success: true,
      paymentIntentId,
      clientSecret,
      redirectUrl: getSuccessRedirectUrl(body.serviceType, body.bookingId, paymentIntentId)
    }

    // Mettre à jour le statut de la réservation (simulation)
    await updateBookingStatus(body.bookingId, 'payment_processing', {
      paymentIntentId,
      amount: body.amount,
      serviceType: body.serviceType
    })

    paymentLogger.info('Paiement unifié traité avec succès', {
      paymentIntentId,
      bookingId: body.bookingId
    })

    return NextResponse.json(response)

  } catch (error) {
    logger.error('Erreur lors du traitement du paiement unifié: ' + (error as Error).message)
    
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const paymentIntentId = searchParams.get('payment_intent_id')
    
    if (!paymentIntentId) {
      return NextResponse.json({
        success: false,
        error: 'ID d\'intention de paiement manquant'
      }, { status: 400 })
    }

    // Simulation de la vérification du statut de paiement
    const status = await verifyPaymentStatus(paymentIntentId)
    
    return NextResponse.json({
      success: true,
      paymentIntentId,
      status,
      amount: 0, // Récupérer depuis la DB
      currency: 'EUR'
    })

  } catch (error) {
    logger.error('Erreur lors de la vérification du paiement unifié: ' + (error as Error).message)
    
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la vérification'
    }, { status: 500 })
  }
}

// Fonction pour générer l'URL de redirection de succès
function getSuccessRedirectUrl(serviceType: string, bookingId: string, paymentIntentId: string): string {
  // Toutes les redirections utilisent maintenant la page unifiée /success/[id]
  return `/success/${bookingId}?payment_intent=${paymentIntentId}`
}

// Fonction pour mettre à jour le statut de réservation (simulation)
async function updateBookingStatus(
  bookingId: string, 
  status: string, 
  paymentData: Record<string, any>
): Promise<void> {
  // Simulation - dans un vrai environnement, mettre à jour la DB
  logger.info(`Mise à jour du statut de réservation: ${bookingId} -> ${status}`)
  
  // Ici on pourrait :
  // - Mettre à jour Prisma
  // - Envoyer des notifications
  // - Déclencher des webhooks
  // - etc.
}

// Fonction pour vérifier le statut de paiement (simulation)
async function verifyPaymentStatus(paymentIntentId: string): Promise<string> {
  // Simulation - dans un vrai environnement, vérifier avec Stripe/PayPal
  logger.info(`Vérification du statut de paiement: ${paymentIntentId}`)
  
  // Simuler différents statuts selon l'ID
  if (paymentIntentId.includes('failed')) {
    return 'failed'
  } else if (paymentIntentId.includes('pending')) {
    return 'processing'
  } else {
    return 'succeeded'
  }
} 