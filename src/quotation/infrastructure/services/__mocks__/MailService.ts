/**
 * Mock du service d'envoi d'emails
 */

class MailService {
  private static emailsSent: Array<{
    to: string;
    subject: string;
    template: string;
    data: any;
  }> = [];

  /**
   * Envoie un email en utilisant un template
   */
  async sendEmailWithTemplate(
    to: string, 
    subject: string, 
    template: string, 
    data: any
  ): Promise<boolean> {
    console.log(`[MOCK MailService] Envoi d'email simulé à ${to} avec sujet: ${subject}`);
    
    // Enregistrer l'email pour les tests
    MailService.emailsSent.push({
      to,
      subject,
      template,
      data
    });
    
    return true;
  }

  /**
   * Envoie un email de confirmation de réservation
   */
  async sendBookingConfirmation(
    customerEmail: string, 
    bookingId: string, 
    bookingDetails: any
  ): Promise<boolean> {
    return this.sendEmailWithTemplate(
      customerEmail,
      'Confirmation de votre réservation',
      'booking-confirmation',
      {
        bookingId,
        ...bookingDetails
      }
    );
  }

  /**
   * Envoie une notification de nouvelle réservation au professionnel
   */
  async sendProfessionalNotification(
    professionalEmail: string,
    bookingId: string,
    bookingDetails: any
  ): Promise<boolean> {
    return this.sendEmailWithTemplate(
      professionalEmail,
      'Nouvelle réservation disponible',
      'professional-notification',
      {
        bookingId,
        ...bookingDetails
      }
    );
  }

  /**
   * Récupère tous les emails envoyés (pour les tests)
   */
  static getEmailsSent(): Array<{
    to: string;
    subject: string;
    template: string;
    data: any;
  }> {
    return [...MailService.emailsSent];
  }

  /**
   * Réinitialise les emails enregistrés (pour les tests)
   */
  static resetMock(): void {
    MailService.emailsSent = [];
  }
}

// Exporter le service pour la compatibilité avec Jest
module.exports = { MailService };
// Pour assurer la compatibilité des imports nommés
export { MailService }; 