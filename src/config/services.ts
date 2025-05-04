import { PDFService } from '@/quotation/infrastructure/adapters/PDFService';
import { EmailService } from '@/quotation/infrastructure/adapters/EmailService';
import { logger } from '@/lib/logger';

// Logger
const servicesLogger = logger.withContext ? 
  logger.withContext('Services') : 
  {
    debug: (msg: string, ...args: any[]) => console.debug('[Services]', msg, ...args),
    info: (msg: string, ...args: any[]) => console.info('[Services]', msg, ...args),
    warn: (msg: string, ...args: any[]) => console.warn('[Services]', msg, ...args),
    error: (msg: string | Error, ...args: any[]) => console.error('[Services]', msg, ...args)
  };

// Configuration email
const emailConfig = {
  host: process.env.SMTP_HOST || 'localhost',
  port: Number(process.env.SMTP_PORT) || 25,
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASSWORD || '',
  from: process.env.EMAIL_FROM || 'noreply@example.com',
  isDev: process.env.NODE_ENV !== 'production'
};

// Configuration PDF
const pdfConfig = {
  outputDir: process.env.PDF_OUTPUT_DIR || './storage/pdfs'
};

// Création des instances avec gestion d'erreurs
let pdfServiceInstance: PDFService;
try {
  pdfServiceInstance = new PDFService(pdfConfig.outputDir);
  servicesLogger.info('Service PDF initialisé avec succès');
} catch (error) {
  servicesLogger.error('Erreur lors de l\'initialisation du service PDF:', error);
  // Initialiser avec les valeurs par défaut si une erreur se produit
  pdfServiceInstance = new PDFService('./storage/pdfs');
}

let emailServiceInstance: EmailService;
try {
  emailServiceInstance = new EmailService(
    emailConfig.host,
    emailConfig.port,
    emailConfig.user,
    emailConfig.pass,
    emailConfig.from,
    emailConfig.isDev
  );
  servicesLogger.info('Service Email initialisé avec succès');
} catch (error) {
  servicesLogger.error('Erreur lors de l\'initialisation du service Email:', error);
  // Initialiser en mode développement si une erreur se produit
  emailServiceInstance = new EmailService(
    'localhost',
    25,
    '',
    '',
    'noreply@example.com',
    true
  );
}

// Exporter les instances uniques
export const pdfService = pdfServiceInstance;
export const emailService = emailServiceInstance;

// Helper pour adapter l'emailUtils au nouveau service d'email (compatibilité)
export const emailServiceAdapter = {
  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    attachments?: Array<{ filename: string; content: Buffer }>;
  }) {
    // Cette fonction simule l'envoi d'un email pour maintenir la compatibilité
    // avec les parties de l'application qui utilisent encore l'ancien email utils
    servicesLogger.info(`Envoi d'email via l'adaptateur à ${options.to}: ${options.subject}`);
    return Promise.resolve();
  }
}; 