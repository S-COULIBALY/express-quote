/**
 * Index des templates React Email
 * 
 * Utilité :
 * - Point d'entrée centralisé pour tous les templates
 * - Export typé des composants et interfaces
 * - Configuration commune des templates
 * - Utilitaires de rendu et test
 * 
 * Templates disponibles :
 * - QuoteConfirmation : Confirmation de demande de devis
 * - BookingConfirmation : Confirmation de réservation
 * - ServiceReminder : Rappel de service à venir
 * - Layout : Composant de base réutilisable
 */

// Export des templates principaux
export { QuoteConfirmation, type QuoteConfirmationData } from './emails/QuoteConfirmation';
export { BookingConfirmation, type BookingConfirmationData } from './emails/BookingConfirmation';
export { PaymentConfirmation, type PaymentConfirmationData } from './emails/PaymentConfirmation';
export { ServiceReminder, type ServiceReminderData } from './emails/ServiceReminder';
export { Reminder24hEmail, type Reminder24hData } from './emails/Reminder24h';
export { Reminder7dEmail, type Reminder7dData } from './emails/Reminder7d';
export { Reminder1hEmail, type Reminder1hData } from './emails/Reminder1h';

// 🆕 Nouveaux templates pour les responsables internes
export { ProfessionalDocument } from './emails/ProfessionalDocument';
export { AccountingDocuments } from './emails/AccountingDocuments';

// 🆕 Templates pour l'attribution de missions aux professionnels
export { default as ProfessionalAttribution } from './emails/ProfessionalAttribution';
export { default as MissionAcceptedConfirmation } from './emails/MissionAcceptedConfirmation';

// Export du layout et composants utilitaires
export {
  Layout,
  Title,
  Subtitle,
  Paragraph,
  SmallText,
  PrimaryButton,
  SecondaryButton,
  Card,
  Separator,
  type LayoutProps
} from './components/Layout';

/**
 * Union des types de données pour tous les templates
 */
export type EmailTemplateData = 
  | QuoteConfirmationData 
  | BookingConfirmationData 
  | PaymentConfirmationData
  | ServiceReminderData
  | Reminder24hData
  | Reminder7dData
  | Reminder1hData;

/**
 * Types de templates disponibles
 */
export type EmailTemplateType = 
  | 'quote-confirmation'
  | 'booking-confirmation'
  | 'payment-confirmation'
  | 'service-reminder'
  | 'reminder-24h'
  | 'reminder-7d'
  | 'reminder-1h'
  | 'professional-attribution'
  | 'mission-accepted-confirmation';

/**
 * Interface commune pour tous les templates
 */
export interface EmailTemplate {
  type: EmailTemplateType;
  name: string;
  description: string;
  component: React.ComponentType<any>;
}

/**
 * Registry des templates disponibles
 */
export const EMAIL_TEMPLATES: Record<EmailTemplateType, EmailTemplate> = {
  'quote-confirmation': {
    type: 'quote-confirmation',
    name: 'Confirmation de devis',
    description: 'Email envoyé après la soumission d\'une demande de devis',
    component: QuoteConfirmation
  },
  
  'booking-confirmation': {
    type: 'booking-confirmation',
    name: 'Confirmation de réservation',
    description: 'Email envoyé après la validation d\'une réservation',
    component: BookingConfirmation
  },
  
  'payment-confirmation': {
    type: 'payment-confirmation',
    name: 'Confirmation de paiement',
    description: 'Email envoyé après la confirmation d\'un paiement',
    component: PaymentConfirmation
  },
  
  'service-reminder': {
    type: 'service-reminder',
    name: 'Rappel de service',
    description: 'Email de rappel envoyé avant l\'intervention',
    component: ServiceReminder
  },
  
  'reminder-24h': {
    type: 'reminder-24h',
    name: 'Rappel 24h avant service',
    description: 'Email de rappel important envoyé 24h avant l\'intervention',
    component: Reminder24hEmail
  },
  
  'reminder-7d': {
    type: 'reminder-7d',
    name: 'Rappel 7 jours avant service',
    description: 'Email de rappel préventif envoyé 7 jours avant l\'intervention',
    component: Reminder7dEmail
  },
  
  'reminder-1h': {
    type: 'reminder-1h',
    name: 'Rappel 1h avant service',
    description: 'Email de rappel urgent envoyé 1 heure avant l\'intervention',
    component: Reminder1hEmail
  },
  
  'professional-attribution': {
    type: 'professional-attribution',
    name: 'Attribution de mission',
    description: 'Email envoyé aux professionnels pour proposer une nouvelle mission',
    component: ProfessionalAttribution
  },
  
  'mission-accepted-confirmation': {
    type: 'mission-accepted-confirmation',
    name: 'Confirmation d\'acceptation de mission',
    description: 'Email de confirmation envoyé après l\'acceptation d\'une mission',
    component: MissionAcceptedConfirmation
  }
};

/**
 * Configuration par défaut pour les templates
 */
export const DEFAULT_EMAIL_CONFIG = {
  brandName: 'Express Quote',
  brandLogo: 'https://express-quote.com/assets/logo.png',
  brandColor: '#007ee6',
  brandUrl: 'https://express-quote.com',
  supportEmail: 'support@express-quote.com',
  companyAddress: 'Express Quote, 123 Avenue des Devis, 75001 Paris, France',
  lang: 'fr' as const,
  currency: 'EUR' as const,
  darkModeSupported: true
};

/**
 * Récupère un template par son type
 */
export function getEmailTemplate(type: EmailTemplateType): EmailTemplate | undefined {
  return EMAIL_TEMPLATES[type];
}

/**
 * Liste tous les types de templates disponibles
 */
export function getAvailableTemplateTypes(): EmailTemplateType[] {
  return Object.keys(EMAIL_TEMPLATES) as EmailTemplateType[];
}

/**
 * Valide qu'un type de template existe
 */
export function isValidTemplateType(type: string): type is EmailTemplateType {
  return type in EMAIL_TEMPLATES;
}

/**
 * Utilitaire pour merger la configuration par défaut avec des options personnalisées
 */
export function mergeEmailConfig<T extends Record<string, any>>(
  customConfig: Partial<T> = {}
): T & typeof DEFAULT_EMAIL_CONFIG {
  return {
    ...DEFAULT_EMAIL_CONFIG,
    ...customConfig
  } as T & typeof DEFAULT_EMAIL_CONFIG;
}

// Imports React pour TypeScript
import * as React from 'react';

// Imports des composants pour le registre
import { QuoteConfirmation } from './emails/QuoteConfirmation';
import { BookingConfirmation } from './emails/BookingConfirmation';
import { PaymentConfirmation } from './emails/PaymentConfirmation';
import { ServiceReminder } from './emails/ServiceReminder';
import { Reminder24hEmail } from './emails/Reminder24h';
import { Reminder7dEmail } from './emails/Reminder7d';
import { Reminder1hEmail } from './emails/Reminder1h';
