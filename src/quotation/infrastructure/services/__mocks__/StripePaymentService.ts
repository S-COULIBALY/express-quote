/**
 * Mock du service de paiement Stripe pour les tests d'intégration
 * 
 * Ce mock simule le comportement du service Stripe sans faire d'appels réseau
 */

class StripePaymentService {
  /**
   * Crée une session de paiement Stripe simulée
   */
  async createCheckoutSession(booking: any, customer: any, items: any[], metadata: any = {}) {
    console.log('[MockStripe] Creating checkout session for booking', booking?.id);
    
    const sessionId = 'cs_test_' + Math.random().toString(36).substring(2, 8);
    
    // Stocker les informations pour une utilisation ultérieure dans le test
    const storedSession = {
      id: sessionId,
      bookingId: booking?.id || 'unknown_booking',
      customerId: customer?.id || 'unknown_customer',
      createdAt: new Date(),
      items: items || [],
      metadata: {
        ...metadata,
        bookingId: booking?.id,
      },
      status: 'created',
      paymentStatus: 'awaiting_payment'
    };
    
    // Ajouter à notre "base de données" en mémoire pour les tests
    StripePaymentService.sessions[sessionId] = storedSession;
    
    return {
      id: sessionId,
      url: `https://checkout.stripe.com/pay/${sessionId}`,
      status: 'created',
      metadata: storedSession.metadata
    };
  }
  
  /**
   * Vérifie la signature d'un webhook Stripe simulé
   */
  verifySignature(signature: string, body: string) {
    // En test, accepter toutes les signatures qui commencent par sig_
    return signature && signature.startsWith('sig_');
  }
  
  /**
   * Traite un paiement Stripe simulé
   */
  async processPayment(sessionId: string, bookingId: string) {
    console.log('[MockStripe] Processing payment', { sessionId, bookingId });
    
    // Vérifier que la session existe
    const session = StripePaymentService.sessions[sessionId];
    
    if (!session && sessionId && bookingId) {
      // Simuler une session même si elle n'a pas été créée précédemment
      return {
        success: true,
        paymentIntent: {
          id: 'pi_' + Math.random().toString(36).substring(2, 8),
          status: 'succeeded',
          amount: 1000,
          currency: 'eur',
          created: new Date().getTime() / 1000,
          metadata: {
            bookingId
          }
        },
      };
    }
    
    if (session) {
      // Mettre à jour le statut de la session
      session.status = 'completed';
      session.paymentStatus = 'paid';
      
      return {
        success: true,
        paymentIntent: {
          id: 'pi_' + Math.random().toString(36).substring(2, 8),
          status: 'succeeded',
          amount: 1000,
          currency: 'eur',
          created: new Date().getTime() / 1000,
          metadata: session.metadata
        },
      };
    }
    
    throw new Error('Session not found');
  }
  
  // Base de données en mémoire pour les tests
  static sessions: Record<string, any> = {};
  
  // Réinitialiser l'état du mock
  static resetMock() {
    StripePaymentService.sessions = {};
  }
}

// Exporter le service pour la compatibilité avec Jest
module.exports = { StripePaymentService };
// Pour assurer la compatibilité des imports nommés
export { StripePaymentService }; 