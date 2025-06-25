// Fichier de configuration des destinataires d'emails
// Ce fichier permet de définir les destinataires internes et externes pour chaque type d'email

import { 
  InternalTeamType, 
  MessageType, 
  NotificationChannel, 
  RecipientConfigDTO, 
  ExternalProviderDTO, 
  ProfessionalDTO 
} from '@/quotation/application/dtos/EmailConfigDTO';

/**
 * Type pour un prestataire externe
 */
export interface ExternalProvider {
  id: string;
  name: string;
  email: string;
  category: string;
}

// Configuration par défaut pour les équipes internes
const defaultInternalTeams: Record<InternalTeamType, {
  emails: string[];
  phones?: string[];
  config: RecipientConfigDTO;
}> = {
  salesTeam: {
    emails: (process.env.SALES_TEAM_EMAIL || 'commercial@express-quote.com').split(',').map(e => e.trim()),
    phones: (process.env.SALES_TEAM_PHONE || '').split(',').map(p => p.trim()),
    config: {
      enabled: true,
      messageTypes: ['quote_request', 'booking', 'payment', 'cancellation'],
      channels: ['email', 'whatsapp']
    }
  },
  accounting: {
    emails: (process.env.ACCOUNTING_EMAIL || 'comptabilite@express-quote.com').split(',').map(e => e.trim()),
    config: {
      enabled: true,
      messageTypes: ['payment', 'cancellation'],
      channels: ['email']
    }
  },
  professionals: {
    emails: (process.env.PROFESSIONALS_EMAIL || 'demenageurs@express-quote.com').split(',').map(e => e.trim()),
    phones: (process.env.PROFESSIONALS_PHONE || '').split(',').map(p => p.trim()),
    config: {
      enabled: true,
      messageTypes: ['booking', 'cancellation'],
      channels: ['email', 'whatsapp']
    }
  },
  notifications: {
    emails: (process.env.NOTIFICATIONS_EMAIL || 'notifications@express-quote.com').split(',').map(e => e.trim()),
    config: {
      enabled: true,
      messageTypes: ['quote_request', 'booking', 'payment', 'cancellation', 'reminder'],
      channels: ['email']
    }
  },
  operations: {
    emails: (process.env.OPERATIONS_EMAIL || 'operations@express-quote.com').split(',').map(e => e.trim()),
    phones: (process.env.OPERATIONS_PHONE || '').split(',').map(p => p.trim()),
    config: {
      enabled: true,
      messageTypes: ['booking', 'cancellation', 'reminder'],
      channels: ['email', 'whatsapp']
    }
  }
};

// Configuration par défaut pour les prestataires externes
const defaultExternalProviders: ExternalProviderDTO[] = [];

// Configuration par défaut pour les professionnels
const defaultProfessionals: ProfessionalDTO[] = [];

// Configuration des jours de rappel
const defaultReminderDays = [7, 3, 1]; // Rappels 7 jours, 3 jours et 1 jour avant le rendez-vous

export const emailRecipientsConfig = {
  internalTeams: defaultInternalTeams,
  externalProviders: defaultExternalProviders,
  professionals: defaultProfessionals,
  reminderDays: defaultReminderDays
};

/**
 * Configuration des destinataires d'emails par type
 */
export const emailRecipients = {
  // Adresses génériques pour les services internes
  internal: {
    // Équipe commerciale
    salesTeam: (process.env.SALES_TEAM_EMAIL || 'commercial@express-quote.com').split(',').map(e => e.trim()),
    // Comptabilité
    accounting: (process.env.ACCOUNTING_EMAIL || 'comptabilite@express-quote.com').split(',').map(e => e.trim()),
    // Professionnels (déménageurs)
    professionals: (process.env.PROFESSIONALS_EMAIL || 'demenageurs@express-quote.com').split(',').map(e => e.trim()),
    // Adresse pour les notifications générales internes
    notifications: (process.env.NOTIFICATIONS_EMAIL || 'notifications@express-quote.com').split(',').map(e => e.trim()),
  },

  // Prestataires externes
  externalProviders: [] as ExternalProvider[],

  // Configuration des destinataires par type d'email
  emailTypes: {
    // Emails envoyés lors de la demande de devis
    quoteRequest: {
      internal: ['salesTeam'],
      external: [] as string[],
      includeClient: true,
    },
    
    // Emails envoyés lors de la confirmation de devis formalisé
    quoteConfirmation: {
      internal: ['salesTeam', 'accounting'],
      external: [] as string[],
      includeClient: true,
    },
    
    // Emails envoyés lors de la confirmation de réservation
    bookingConfirmation: {
      internal: ['salesTeam', 'professionals'],
      external: [] as string[],
      includeClient: true,
    },
    
    // Emails envoyés lors de la confirmation de paiement
    paymentConfirmation: {
      internal: ['salesTeam', 'accounting'],
      external: [] as string[],
      includeClient: true, 
    },
    
    // Emails envoyés lors de l'annulation
    cancellationNotification: {
      internal: ['salesTeam', 'professionals', 'accounting'],
      external: [] as string[],
      includeClient: true,
    },
    
    // Emails de rappel avant le rendez-vous
    appointmentReminder: {
      internal: ['professionals'],
      external: [] as string[],
      includeClient: true,
    }
  },
  
  // Configuration des jours de rappel avant rendez-vous
  reminderDays: [7, 3, 1], // Rappels 7 jours, 3 jours et 1 jour avant le rendez-vous
};

/**
 * Convertit un tableau de clés internes en adresses email réelles
 * @param internalKeys Liste des clés des destinataires internes
 * @returns Liste des adresses email
 */
export function getInternalEmails(internalKeys: string[]): string[] {
  return internalKeys.flatMap(key => {
    // @ts-ignore - contournement pour la vérification de type
    const emails = emailRecipients.internal[key] || [];
    return Array.isArray(emails) ? emails : [emails];
  }).filter(email => email !== '');
}

/**
 * Récupère les adresses email des prestataires externes
 * @param providerIds Liste des IDs des prestataires externes
 * @returns Liste des adresses email
 */
export function getExternalEmails(providerIds: string[]): string[] {
  return providerIds
    .map(id => emailRecipients.externalProviders.find(p => p.id === id)?.email || '')
    .filter(email => email !== '');
} 