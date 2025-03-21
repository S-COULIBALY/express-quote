import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { EmailStatus } from '@prisma/client';
import { getStoredPdf } from './pdf';

/**
 * Interface pour les pièces jointes d'email
 */
interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

/**
 * Interface pour les paramètres d'envoi d'email
 */
interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: EmailAttachment[];
  bookingId?: string; // ID de la réservation associée, optionnel
}

/**
 * Crée un transporteur SMTP pour l'envoi d'emails
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || 'user@example.com',
      pass: process.env.EMAIL_PASSWORD || 'password',
    },
  });
}

/**
 * Envoie un email avec les paramètres fournis
 * @param params Les paramètres d'envoi d'email
 * @returns Promise<void>
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  const { to, subject, text, html, attachments = [], bookingId } = params;

  try {
    // Créer le transporteur SMTP
    const transporter = createTransporter();

    // Envoyer l'email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Express Déménagement <contact@express-demenagement.fr>',
      to,
      subject,
      text,
      html: html || text, // Fallback à text si html n'est pas fourni
      attachments: attachments.map(attachment => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
      })),
    });

    console.log('Email envoyé:', info.messageId);

    // Si un bookingId est fourni, enregistrer le log d'email
    if (bookingId) {
      await logEmailSent(bookingId, to, subject, text, html, attachments);
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    
    // Si un bookingId est fourni, enregistrer l'échec d'envoi d'email
    if (bookingId) {
      await logEmailError(bookingId, to, subject, text, error);
    }
    
    throw error;
  }
}

/**
 * Enregistre un email envoyé avec succès dans la base de données
 */
async function logEmailSent(
  bookingId: string, 
  recipient: string, 
  subject: string, 
  content: string, 
  html?: string,
  attachments?: EmailAttachment[]
): Promise<void> {
  try {
    // Créer l'entrée de log d'email
    const emailLog = await prisma.emailLog.create({
      data: {
        recipient,
        subject,
        content: html || content,
        status: EmailStatus.SENT,
        sentAt: new Date(),
        booking: {
          connect: { id: bookingId }
        }
      }
    });

    // Si des pièces jointes sont présentes, les enregistrer
    if (attachments && attachments.length > 0) {
      const attachmentPromises = attachments.map(attachment => {
        return prisma.emailAttachment.create({
          data: {
            filename: attachment.filename,
            emailLog: {
              connect: { id: emailLog.id }
            }
          }
        });
      });

      await Promise.all(attachmentPromises);
    }

    console.log(`Log d'email créé pour la réservation ${bookingId}`);
  } catch (error) {
    console.error(`Erreur lors de l'enregistrement du log d'email:`, error);
  }
}

/**
 * Enregistre un échec d'envoi d'email dans la base de données
 */
async function logEmailError(
  bookingId: string, 
  recipient: string, 
  subject: string, 
  content: string, 
  error: any
): Promise<void> {
  try {
    await prisma.emailLog.create({
      data: {
        recipient,
        subject,
        content,
        status: EmailStatus.FAILED,
        errorMessage: error.message || 'Erreur inconnue',
        booking: {
          connect: { id: bookingId }
        }
      }
    });

    console.log(`Log d'échec d'email créé pour la réservation ${bookingId}`);
  } catch (logError) {
    console.error(`Erreur lors de l'enregistrement du log d'échec d'email:`, logError);
  }
}

/**
 * Envoie un email de confirmation de réservation avec PDF en pièce jointe
 * @param bookingId ID de la réservation
 * @param email Email du destinataire
 * @param firstName Prénom du destinataire
 * @param pdfAttachment Pièce jointe PDF (optionnel, sera récupérée depuis la BDD si non fournie)
 * @returns Promise<void>
 */
export async function sendBookingConfirmationEmail(
  bookingId: string,
  email: string,
  firstName: string,
  pdfAttachment?: Buffer
): Promise<void> {
  // Récupérer le PDF depuis la base de données si non fourni
  let pdfBuffer = pdfAttachment;
  if (!pdfBuffer) {
    pdfBuffer = await getStoredPdf(bookingId);
    if (!pdfBuffer) {
      console.error(`Aucun PDF trouvé pour la réservation ${bookingId}`);
    }
  }

  // Construire les versions texte et HTML de l'email
  const subject = `Confirmation de votre réservation #${bookingId.slice(0, 8)}`;
  
  // Version texte simple
  const text = `
Bonjour ${firstName},

Nous vous confirmons que votre réservation #${bookingId.slice(0, 8)} a bien été enregistrée et payée.

Vous trouverez en pièce jointe un récapitulatif complet de votre réservation.

Si vous avez des questions, n'hésitez pas à nous contacter.

Merci de votre confiance,

L'équipe Express Déménagement
Tél: 01 23 45 67 89
Email: contact@express-demenagement.fr
`;

  // Version HTML formatée
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 20px; }
    .header h1 { color: #2563eb; margin-bottom: 5px; }
    .content { background-color: #f9fafb; padding: 20px; border-radius: 5px; }
    .footer { margin-top: 20px; font-size: 12px; color: #6b7280; text-align: center; }
    .button { display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; 
              text-decoration: none; border-radius: 5px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Express Déménagement</h1>
      <p>Confirmation de réservation</p>
    </div>
    
    <div class="content">
      <p>Bonjour ${firstName},</p>
      
      <p>Nous vous confirmons que votre réservation <strong>#${bookingId.slice(0, 8)}</strong> a bien été enregistrée et payée.</p>
      
      <p>Vous trouverez en pièce jointe un récapitulatif complet de votre réservation.</p>
      
      <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
    </div>
    
    <div class="footer">
      <p>
        <strong>Express Déménagement</strong><br>
        123 Avenue de la République, 75011 Paris<br>
        Tél: 01 23 45 67 89<br>
        Email: contact@express-demenagement.fr
      </p>
      <p>&copy; ${new Date().getFullYear()} Express Déménagement. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>
`;

  // Préparer les attachements
  const attachments: EmailAttachment[] = [];
  
  if (pdfBuffer) {
    attachments.push({
      filename: `reservation-${bookingId.slice(0, 8)}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf'
    });
  }

  // Envoyer l'email
  await sendEmail({
    to: email,
    subject,
    text,
    html,
    attachments,
    bookingId // Pour le logging
  });
}

export function generateBookingConfirmationEmail({
  customerName,
  bookingId,
  bookingType,
  scheduledDate,
  price,
  deposit,
}: {
  customerName: string;
  bookingId: string;
  bookingType: 'quote' | 'pack' | 'service';
  scheduledDate: Date;
  price: number;
  deposit: number;
}): string {
  // Formatter la date pour l'affichage
  const formattedDate = new Date(scheduledDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Déterminer le type de réservation pour l'affichage
  let bookingTypeDisplay = '';
  switch (bookingType) {
    case 'quote':
      bookingTypeDisplay = 'Devis personnalisé';
      break;
    case 'pack':
      bookingTypeDisplay = 'Pack de déménagement';
      break;
    case 'service':
      bookingTypeDisplay = 'Service à la carte';
      break;
  }

  // Générer le HTML de l'email
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background-color: #0A9669; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Confirmation de Réservation</h1>
      </div>
      
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <p>Bonjour ${customerName},</p>
        
        <p>Nous vous remercions pour votre réservation. Voici un récapitulatif :</p>
        
        <div style="background-color: #f7f7f7; padding: 15px; margin: 15px 0; border-radius: 5px;">
          <p><strong>Numéro de réservation :</strong> ${bookingId}</p>
          <p><strong>Type de service :</strong> ${bookingTypeDisplay}</p>
          <p><strong>Date prévue :</strong> ${formattedDate}</p>
          <p><strong>Montant total :</strong> ${price.toFixed(2)} €</p>
          <p><strong>Acompte versé :</strong> ${deposit.toFixed(2)} €</p>
          <p><strong>Reste à payer :</strong> ${(price - deposit).toFixed(2)} €</p>
        </div>
        
        <p>Vous trouverez en pièce jointe le détail complet de votre réservation.</p>
        
        <p>Notre équipe vous contactera prochainement pour confirmer les détails de votre réservation et vous fournir toutes les informations nécessaires.</p>
        
        <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
        
        <p>Cordialement,</p>
        <p><strong>L'équipe Express Quote</strong></p>
      </div>
      
      <div style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>Ce message est envoyé automatiquement, merci de ne pas y répondre directement.</p>
        <p>© ${new Date().getFullYear()} Express Quote - Tous droits réservés</p>
      </div>
    </div>
  `;
} 