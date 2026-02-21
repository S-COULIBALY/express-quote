import type { PrismaClient } from "@prisma/client";
import { PDFService } from "@/quotation/infrastructure/adapters/PDFService";
import { logger } from "@/lib/logger";
import { prisma as prismaSingleton } from "@/lib/prisma";

// Logger
const servicesLogger = logger.withContext
  ? logger.withContext("Services")
  : {
      debug: (msg: string, ...args: any[]) =>
        console.debug("[Services]", msg, ...args),
      info: (msg: string, ...args: any[]) =>
        console.info("[Services]", msg, ...args),
      warn: (msg: string, ...args: any[]) =>
        console.warn("[Services]", msg, ...args),
      error: (msg: string | Error, ...args: any[]) =>
        console.error("[Services]", msg, ...args),
    };

// Configuration email
const emailConfig = {
  host: process.env.SMTP_HOST || "localhost",
  port: Number(process.env.SMTP_PORT) || 25,
  user: process.env.SMTP_USER || "",
  pass: process.env.SMTP_PASSWORD || "",
  from: process.env.EMAIL_FROM || "noreply@example.com",
  isDev: process.env.NODE_ENV !== "production",
};

// Configuration PDF
const pdfConfig = {
  outputDir: process.env.PDF_OUTPUT_DIR || "./storage/pdfs",
};

// Création des instances avec gestion d'erreurs
let pdfServiceInstance: PDFService;
try {
  pdfServiceInstance = new PDFService(pdfConfig.outputDir);
  servicesLogger.info("Service PDF initialisé avec succès");
} catch (error) {
  servicesLogger.error(
    "Erreur lors de l'initialisation du service PDF:",
    error,
  );
  // Initialiser avec les valeurs par défaut si une erreur se produit
  pdfServiceInstance = new PDFService("./storage/pdfs");
}

// L'ancien EmailService a été remplacé par le nouveau système de notifications
// Utiliser le nouveau EmailAdapter dans src/notifications/infrastructure/adapters/
const emailServiceInstance: any = null; // Temporaire pour compatibilité

// Créer l'instance Prisma
let prismaInstance: PrismaClient;
try {
  prismaInstance = prismaSingleton;
  servicesLogger.info("PrismaClient initialisé avec succès");
} catch (error) {
  servicesLogger.error(
    "Erreur lors de l'initialisation de PrismaClient:",
    error,
  );
  prismaInstance = prismaSingleton;
}

// Services de configuration et distribution email (désactivés temporairement)
// Ces services dépendaient de l'ancien EmailService - à migrer vers le nouveau système
const emailConfigServiceInstance: any = null;
const emailDistributionServiceInstance: any = null;
servicesLogger.warn(
  "Services EmailConfig et EmailDistribution désactivés - en attente de migration",
);

// Exporter les instances uniques
export const prisma = prismaInstance;
export const pdfService = pdfServiceInstance;

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
    servicesLogger.info(
      `Envoi d'email via l'adaptateur à ${options.to}: ${options.subject}`,
    );
    return Promise.resolve();
  },
};

// Services de notification (stubs temporaires pour compatibilité)
export const notificationMetricsService = {
  getMetrics: () => ({ recentEvents: [] }),
  getMetricsForPeriod: (start: Date, end: Date) => ({ recentEvents: [] }),
  getErrorRate: (channel: string) => 0,
  getReadRate: (channel: string) => 0,
};

export const notificationOrchestratorService = {
  getSuccessRates: () => ({ email: 100, whatsapp: 100, overall: 100 }),
  getRetryStatistics: () => ({
    totalRetries: 0,
    successfulRetries: 0,
    failedRetries: 0,
  }),
};

// WhatsApp service (stub temporaire pour compatibilité)
export const whatsAppService = {
  sendMessage: async (to: string, message: string) => {
    servicesLogger.info(`WhatsApp message à ${to}: ${message}`);
    return Promise.resolve({ success: true, messageId: "stub" });
  },
  handleWebhook: async (data: any) => {
    servicesLogger.info("WhatsApp webhook reçu");
    return Promise.resolve();
  },
  verifyWebhook: (
    mode: string,
    token: string,
    challenge: string,
  ): string | null => {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    if (mode === "subscribe" && token === verifyToken) {
      servicesLogger.info("WhatsApp webhook vérifié avec succès");
      return challenge;
    }
    servicesLogger.warn("WhatsApp webhook verification échouée");
    return null;
  },
};
