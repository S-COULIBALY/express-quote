/**
 * Mocks des services utilisés dans les tests
 */

// Mock pour le service d'email
export const mockEmailService = {
  sendBookingConfirmation: jest.fn().mockResolvedValue(true),
  sendProfessionalNotification: jest.fn().mockResolvedValue(true),
  sendPaymentConfirmation: jest.fn().mockResolvedValue(true),
};

// Mock pour le service de paiement Stripe
export const mockStripePaymentService = {
  createCheckoutSession: jest.fn().mockResolvedValue({
    id: 'cs_test_123456',
    url: 'https://checkout.stripe.com/pay/cs_test_123456',
  }),
  verifySignature: jest.fn().mockReturnValue(true),
  processPayment: jest.fn().mockResolvedValue({
    success: true,
    paymentIntent: {
      id: 'pi_123456',
      status: 'succeeded',
    },
  }),
};

// Fonction pour réinitialiser tous les mocks
export function resetAllMocks() {
  mockEmailService.sendBookingConfirmation.mockClear();
  mockEmailService.sendProfessionalNotification.mockClear();
  mockEmailService.sendPaymentConfirmation.mockClear();
  
  mockStripePaymentService.createCheckoutSession.mockClear();
  mockStripePaymentService.verifySignature.mockClear();
  mockStripePaymentService.processPayment.mockClear();
} 