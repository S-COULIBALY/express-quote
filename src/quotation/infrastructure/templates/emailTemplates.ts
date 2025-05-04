/**
 * Templates d'emails pour l'application
 * Ces templates utilisent un format simple basé sur des données typées
 */

// Types pour les données utilisées dans les templates
export interface QuoteConfirmationData {
  clientName: string;
  quoteId: string;
  serviceType: string;
  amount: number;
  tax: number;
  total: number;
  scheduledDate?: string;
  location?: string;
}

export interface BookingConfirmationData {
  clientName: string;
  bookingId: string;
  scheduledDate: string;
  location: string;
}

export interface PaymentConfirmationData {
  clientName: string;
  bookingId: string;
  transactionId: string;
  amount: number;
  paymentDate: string;
}

export interface CancellationNotificationData {
  clientName: string;
  bookingId: string;
  scheduledDate: string;
  reason?: string;
}

export interface AppointmentReminderData {
  clientName: string;
  bookingId: string;
  scheduledDate: string;
  location: string;
  daysUntilAppointment: number;
}

// Template de confirmation de devis
export function quoteConfirmationTemplate(data: QuoteConfirmationData): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
      <h2 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Votre devis est prêt</h2>
      <p>Bonjour ${data.clientName},</p>
      <p>Nous avons le plaisir de vous confirmer que votre devis pour nos services de nettoyage est maintenant disponible.</p>
      <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
        <h3 style="margin-top: 0; color: #333;">Détails du devis :</h3>
        <p><strong>Numéro de devis :</strong> ${data.quoteId}</p>
        <p><strong>Type de service :</strong> ${data.serviceType}</p>
        <p><strong>Prix HT :</strong> ${data.amount.toFixed(2)} €</p>
        <p><strong>TVA (${(data.tax / data.amount * 100).toFixed(2)}%) :</strong> ${data.tax.toFixed(2)} €</p>
        <p><strong>Prix total :</strong> ${data.total.toFixed(2)} €</p>
        ${data.scheduledDate ? `<p><strong>Date prévue :</strong> ${data.scheduledDate}</p>` : ''}
        ${data.location ? `<p><strong>Adresse :</strong> ${data.location}</p>` : ''}
      </div>
      <p>Vous trouverez ci-joint une copie PDF de votre devis. Pour accepter ce devis et confirmer votre réservation, merci de nous contacter ou de vous connecter à votre espace client.</p>
      <p>Ce devis est valable pour une durée de 30 jours à compter de la date d'émission.</p>
      <p>Nous vous remercions de votre confiance et restons à votre disposition pour toute information complémentaire.</p>
      <p style="margin-top: 20px;">Cordialement,<br>L'équipe de service</p>
    </div>
  `;
}

// Template de confirmation de réservation
export function bookingConfirmationTemplate(data: BookingConfirmationData): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
      <h2 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Confirmation de votre réservation</h2>
      <p>Bonjour ${data.clientName},</p>
      <p>Nous avons le plaisir de vous confirmer que votre réservation a bien été enregistrée.</p>
      <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
        <h3 style="margin-top: 0; color: #333;">Détails de votre réservation :</h3>
        <p><strong>Numéro de réservation :</strong> ${data.bookingId}</p>
        <p><strong>Date de service :</strong> ${data.scheduledDate}</p>
        <p><strong>Adresse :</strong> ${data.location}</p>
      </div>
      <p>Nous vous remercions de votre confiance et nous nous réjouissons de vous accueillir prochainement.</p>
      <p>Si vous avez des questions ou souhaitez modifier votre réservation, n'hésitez pas à nous contacter.</p>
      <p style="margin-top: 20px;">Cordialement,<br>L'équipe de service</p>
    </div>
  `;
}

// Template de confirmation de paiement
export function paymentConfirmationTemplate(data: PaymentConfirmationData): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
      <h2 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Confirmation de votre paiement</h2>
      <p>Bonjour ${data.clientName},</p>
      <p>Nous vous remercions pour votre paiement. Votre transaction a été traitée avec succès.</p>
      <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
        <h3 style="margin-top: 0; color: #333;">Détails du paiement :</h3>
        <p><strong>Numéro de réservation :</strong> ${data.bookingId}</p>
        <p><strong>Transaction ID :</strong> ${data.transactionId}</p>
        <p><strong>Montant payé :</strong> ${data.amount} €</p>
        <p><strong>Date de paiement :</strong> ${data.paymentDate}</p>
      </div>
      <p>Vous trouverez ci-joint un reçu de votre paiement.</p>
      <p>Nous vous remercions de votre confiance et restons à votre disposition pour toute question.</p>
      <p style="margin-top: 20px;">Cordialement,<br>L'équipe de service</p>
    </div>
  `;
}

// Template de notification d'annulation
export function cancellationNotificationTemplate(data: CancellationNotificationData): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
      <h2 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Annulation de votre réservation</h2>
      <p>Bonjour ${data.clientName},</p>
      <p>Nous vous informons que votre réservation a été annulée.</p>
      <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
        <h3 style="margin-top: 0; color: #333;">Détails de la réservation annulée :</h3>
        <p><strong>Numéro de réservation :</strong> ${data.bookingId}</p>
        <p><strong>Date prévue :</strong> ${data.scheduledDate}</p>
        ${data.reason ? `<p><strong>Motif d'annulation :</strong> ${data.reason}</p>` : ''}
      </div>
      <p>Si vous avez des questions ou si vous souhaitez prévoir une nouvelle réservation, n'hésitez pas à nous contacter.</p>
      <p>Nous vous remercions de votre compréhension.</p>
      <p style="margin-top: 20px;">Cordialement,<br>L'équipe de service</p>
    </div>
  `;
}

// Template de rappel de rendez-vous
export function appointmentReminderTemplate(data: AppointmentReminderData): string {
  const timeMessage = data.daysUntilAppointment === 0 
    ? 'aujourd\'hui' 
    : data.daysUntilAppointment === 1 
      ? 'demain' 
      : `dans ${data.daysUntilAppointment} jours`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
      <h2 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Rappel : Votre rendez-vous approche</h2>
      <p>Bonjour ${data.clientName},</p>
      <p>Nous vous rappelons que votre rendez-vous est prévu ${timeMessage}.</p>
      <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
        <h3 style="margin-top: 0; color: #333;">Détails de votre rendez-vous :</h3>
        <p><strong>Numéro de réservation :</strong> ${data.bookingId}</p>
        <p><strong>Date :</strong> ${data.scheduledDate}</p>
        <p><strong>Adresse :</strong> ${data.location}</p>
      </div>
      <p>Si vous avez des questions ou si vous devez modifier votre rendez-vous, veuillez nous contacter dès que possible.</p>
      <p>Nous nous réjouissons de vous accueillir prochainement.</p>
      <p style="margin-top: 20px;">Cordialement,<br>L'équipe de service</p>
    </div>
  `;
} 