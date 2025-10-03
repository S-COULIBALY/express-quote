
/**
 * 🌟 SERVICE NOTIFICATION SINGLETON GLOBAL - Module Level
 * 
 * Service singleton au niveau module pour éviter complètement
 * les problèmes de multiple instances et connexions DB
 */

import { ProductionNotificationService } from '../../application/services/notification.service.production';
import { RobustEmailAdapter } from '../../infrastructure/adapters/email.adapter.production';
import { RobustSmsAdapter } from '../../infrastructure/adapters/sms.adapter.production';
import { RobustWhatsAppAdapter } from '../../infrastructure/adapters/whatsapp.adapter.production';
import { ProductionQueueManager } from '../../infrastructure/queue/queue.manager.production';
import { RateLimiter } from '../../infrastructure/security/rate.limiter';
import { ContentSanitizer } from '../../infrastructure/security/content.sanitizer';
import { MetricsCollector } from '../../infrastructure/monitoring/metrics.collector';
import { ProductionLogger } from '../../infrastructure/logging/logger.production';
import { CircuitBreaker } from '../../infrastructure/resilience/circuit.breaker';
import { TemplateCache } from '../../infrastructure/cache/template-cache.production';

// Instance singleton GLOBALE au niveau module
let globalService: ProductionNotificationService | null = null;
let initPromise: Promise<ProductionNotificationService> | null = null;
let isInitializing = false;

/**
 * Obtient l'instance singleton globale du service de notification
 * Avec protection complète contre les race conditions et multiple instances
 */
export async function getGlobalNotificationService(): Promise<ProductionNotificationService> {
  // Retour immédiat si déjà initialisé
  if (globalService) {
    console.log('♻️ Reusing existing global notification service');
    return globalService;
  }

  // Si déjà en cours d'initialisation, attendre
  if (initPromise) {
    console.log('⏳ Waiting for ongoing initialization...');
    return initPromise;
  }

  // Protection supplémentaire contre les races
  if (isInitializing) {
    console.log('🔄 Already initializing, waiting...');
    await new Promise(resolve => setTimeout(resolve, 100));
    return getGlobalNotificationService();
  }

  // Démarrer l'initialisation
  isInitializing = true;
  console.log('🚀 Initializing GLOBAL MODULE-LEVEL notification service...');
  
  initPromise = createNotificationService();
  
  try {
    globalService = await initPromise;
    console.log('✅ Global module-level service initialized successfully');
    return globalService;
  } catch (error) {
    console.error('❌ Failed to initialize global service:', error);
    // Reset en cas d'erreur
    globalService = null;
    initPromise = null;
    throw error;
  } finally {
    isInitializing = false;
  }
}

/**
 * Crée et initialise le service de notification
 */
async function createNotificationService(): Promise<ProductionNotificationService> {
  // Création des adaptateurs avec configuration minimale
  const emailAdapter = new RobustEmailAdapter();
  const smsAdapter = new RobustSmsAdapter();
  const whatsAppAdapter = new RobustWhatsAppAdapter();
  const queueManager = new ProductionQueueManager();
  const rateLimiter = RateLimiter.forAPI();
  const sanitizer = new ContentSanitizer();
  const metricsCollector = new MetricsCollector();
  const logger = new ProductionLogger();
  const circuitBreaker = CircuitBreaker.forExternalAPI();
  const templateCache = new TemplateCache();

  // Configuration des adaptateurs
  try {
    await emailAdapter.configure({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        password: process.env.SMTP_PASSWORD || ''
      },
      from: process.env.SMTP_FROM || process.env.EMAIL_FROM,
      replyTo: process.env.SMTP_REPLY_TO || process.env.EMAIL_REPLY_TO
    });
    console.log('✅ Email adapter configured');
  } catch (error) {
    console.log('⚠️ Email adapter configuration skipped:', (error as Error).message);
  }

  // Configuration SMS avec provider configurable par variable d'environnement
  const smsProvider = (process.env.SMS_PROVIDER as 'free_mobile' | 'twilio' | 'vonage' | 'brevo') || 'free_mobile';
  console.log(`🔧 Configuring SMS with provider: ${smsProvider}`);
  
  try {
    const smsConfig: any = { provider: smsProvider };
    
    switch (smsProvider) {
      case 'free_mobile':
        smsConfig.freeMobile = {
          user: process.env.FREE_MOBILE_USER || '',
          pass: process.env.FREE_MOBILE_PASS || ''
        };
        break;
        
      case 'twilio':
        smsConfig.twilio = {
          accountSid: process.env.TWILIO_ACCOUNT_SID || '',
          authToken: process.env.TWILIO_AUTH_TOKEN || '',
          phoneNumber: process.env.TWILIO_PHONE_NUMBER || ''
        };
        break;
        
      case 'vonage':
        smsConfig.vonage = {
          apiKey: process.env.VONAGE_API_KEY || '',
          apiSecret: process.env.VONAGE_API_SECRET || '',
          phoneNumber: process.env.VONAGE_PHONE_NUMBER || ''
        };
        break;
        
      case 'brevo':
        smsConfig.brevo = {
          apiKey: process.env.BREVO_SMS_API_KEY || '',
          sender: process.env.BREVO_SMS_SENDER || ''
        };
        break;
        
      default:
        throw new Error(`Unsupported SMS provider: ${smsProvider}`);
    }
    
    await smsAdapter.configure(smsConfig);
    console.log(`✅ SMS adapter configured with ${smsProvider}`);
  } catch (error) {
    console.log('⚠️ SMS adapter configuration skipped:', (error as Error).message);
  }

  // WhatsApp optionnel
  const whatsappToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (whatsappToken && whatsappToken !== 'your_access_token_here' && whatsappToken.length > 20) {
    try {
      await whatsAppAdapter.configure({
        accessToken: whatsappToken,
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
        verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || ''
      });
      console.log('✅ WhatsApp adapter configured');
    } catch (error) {
      console.log('⚠️ WhatsApp adapter skipped:', (error as Error).message);
    }
  } else {
    console.log('ℹ️ WhatsApp adapter skipped (no valid token)');
  }

  // Création du service
  const service = new ProductionNotificationService(
    emailAdapter,
    smsAdapter,
    whatsAppAdapter,
    queueManager,
    rateLimiter,
    sanitizer,
    metricsCollector,
    logger,
    circuitBreaker,
    templateCache
  );

  // Initialisation
  await service.initialize();
  
  return service;
}

/**
 * Force la réinitialisation du service (pour les tests)
 */
export async function resetGlobalNotificationService(): Promise<void> {
  console.log('🔄 Resetting global notification service...');
  
  if (globalService) {
    try {
      // Tentative de nettoyage propre
      await globalService.cleanup?.();
    } catch (error) {
      console.log('⚠️ Service cleanup warning:', (error as Error).message);
    }
  }
  
  globalService = null;
  initPromise = null;
  isInitializing = false;
  
  console.log('✅ Global service reset completed');
}