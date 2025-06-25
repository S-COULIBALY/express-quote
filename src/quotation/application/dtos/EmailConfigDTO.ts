export interface EmailConfigDTO {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  emailFrom: string;
  documents: Record<string, DocumentConfigDTO>;
  reminderDays: number[];
  templates: Record<string, string>;
  notificationEmails: string[];
  
  internalTeams: {
    [K in InternalTeamType]: {
      emails: string[];
      phones?: string[];
      config: RecipientConfigDTO;
    };
  };
  externalProviders: ExternalProviderDTO[];
  professionals: ProfessionalDTO[];
}

export type InternalTeamType = 'salesTeam' | 'accounting' | 'professionals' | 'notifications' | 'operations';
export type MessageType = 'quote_request' | 'booking' | 'payment' | 'cancellation' | 'reminder';
export type NotificationChannel = 'email' | 'whatsapp' | 'both';
export type ProfessionalType = 'MOVING' | 'STORAGE' | 'CLEANING' | 'PACKING' | 'INSURANCE';

export interface RecipientConfigDTO {
  enabled: boolean;
  messageTypes: MessageType[];
  channels: NotificationChannel[];
}

export interface ExternalProviderDTO {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  category: string;
  channels: NotificationChannel[];
  messageTypes: MessageType[];
}

export interface ProfessionalDTO {
  id: string;
  companyName: string;
  businessType: ProfessionalType;
  email: string;
  phone: string;
  city?: string;
  verified: boolean;
  config: RecipientConfigDTO;
}

export interface DocumentConfigDTO {
  enabled: boolean;
  filename: string;
  subject: string;
}

export interface EmailTypeConfigDTO {
  internal: string[];
  external: string[];
  includeClient: boolean;
}

// DTOs pour les opérations spécifiques
export interface UpdateExternalProviderDTO {
  id: string;
  name: string;
  email: string;
  category: string;
  isActive: boolean;
}

export interface UpdateEmailTemplateDTO {
  type: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}

export interface SmtpConfigDTO {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
} 