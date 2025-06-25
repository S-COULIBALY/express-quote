export interface WhatsAppConfigDTO {
  apiKey: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookVerifyToken: string;
  isActive: boolean;
  
  sessionTimeout: number;
  sessionAutoReply: string;
  outOfSessionMessage: string;
  
  maxMessagesPerDay: number;
  maxMessagesPerSession: number;
  cooldownPeriod: number;
  
  templates: {
    welcome: string;
    confirmation: string;
    reminder: string;
    followUp: string;
    support: string;
  };
  
  notifyOnNewMessage: boolean;
  notifyOnSessionEnd: boolean;
  notificationEmails: string[];
  
  trackMessageMetrics: boolean;
  trackUserEngagement: boolean;
  generateReports: boolean;
  reportFrequency: 'daily' | 'weekly' | 'monthly';
  
  documents: {
    [key: string]: {
      enabled: boolean;
      caption: string;
    };
  };
  
  recipients: {
    [key: string]: {
      enabled: boolean;
      messageTypes: string[];
    };
  };
}

export interface WhatsAppTemplateDTO {
  name: string;
  content: string;
  variables: string[];
  language: string;
  category: string;
}

export interface WhatsAppDocumentConfigDTO {
  enabled: boolean;
  caption: string;
  type: string;
}

export interface WhatsAppRecipientConfigDTO {
  enabled: boolean;
  messageTypes: string[];
  type: string;
} 