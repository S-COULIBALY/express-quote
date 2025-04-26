/**
 * Mock du service d'email pour les tests
 */

class EmailService {
  async sendBookingConfirmation(booking: any, customer: any) {
    return Promise.resolve(true);
  }

  async sendProfessionalNotification(booking: any, serviceDetails: any) {
    return Promise.resolve(true);
  }

  async sendPaymentConfirmation(booking: any, customer: any, paymentDetails: any) {
    return Promise.resolve(true);
  }
}

export default EmailService; 