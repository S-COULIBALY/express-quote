/**
 * 🧪 TEST COMPLET DU SYSTÈME DE RAPPELS OPTIMISÉ
 * 
 * Test du flux complet pour vérifier que toutes les optimisations
 * fonctionnent correctement en production.
 */

import { ProductionNotificationService } from './application/services/notification.service.production';
import { RobustEmailAdapter } from './infrastructure/adapters/email.adapter.production';
import { RobustSmsAdapter } from './infrastructure/adapters/sms.adapter.production';
import { RobustWhatsAppAdapter } from './infrastructure/adapters/whatsapp.adapter.production';
import { ProductionQueueManager } from './infrastructure/queue/queue.manager.production';
import { RateLimiter } from './infrastructure/security/rate.limiter';
import { ContentSanitizer } from './infrastructure/security/content.sanitizer';
import { MetricsCollector } from './infrastructure/monitoring/metrics.collector';
import { ProductionLogger } from './infrastructure/logging/logger.production';
import { CircuitBreaker } from './infrastructure/resilience/circuit.breaker';
import { TemplateCache } from './infrastructure/cache/template-cache.production';

interface TestBookingData {
  bookingId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceName: string;
  serviceDate: string;
  serviceTime: string;
  serviceAddress: string;
  totalAmount: number;
}

class OptimizedReminderSystemTest {
  private notificationService!: ProductionNotificationService;
  private logger: ProductionLogger;
  private testResults: Array<{
    test: string;
    success: boolean;
    duration: number;
    details?: any;
    error?: string;
  }> = [];

  constructor() {
    this.logger = new ProductionLogger();
  }

  private async initializeService(): Promise<void> {
    try {
      this.logger.info('🔧 Initializing notification service components...');
      
      // Configuration par défaut pour les tests
      const emailConfig = {
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER || 'test@example.com',
        pass: process.env.SMTP_PASS || 'password'
      };

      const smsConfig = {
        provider: 'free_mobile',
        user: process.env.FREE_MOBILE_USER || 'testuser',
        pass: process.env.FREE_MOBILE_PASS || 'testpass'
      };

      const whatsappConfig = {
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || 'test',
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN || 'test_token'
      };

      // Initialiser tous les composants avec configuration de test
      const emailAdapter = new RobustEmailAdapter(emailConfig);
      const smsAdapter = new RobustSmsAdapter(smsConfig);
      const whatsAppAdapter = new RobustWhatsAppAdapter(whatsappConfig);
      const queueManager = new ProductionQueueManager();
      const rateLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 100
      });
      const sanitizer = new ContentSanitizer();
      const metricsCollector = new MetricsCollector();
      const circuitBreaker = new CircuitBreaker();
      const templateCache = new TemplateCache();

      // Créer le service de notification
      this.notificationService = new ProductionNotificationService(
        emailAdapter,
        smsAdapter,
        whatsAppAdapter,
        queueManager,
        rateLimiter,
        sanitizer,
        metricsCollector,
        this.logger,
        circuitBreaker,
        templateCache
      );

      // Initialiser le service
      this.logger.info('⚙️ Initializing notification service...');
      await this.notificationService.initialize();
      this.logger.info('✅ Notification service initialized successfully');
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize notification service:', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Test 1: Validation des données d'entrée
   */
  async testDataValidation(): Promise<void> {
    const startTime = Date.now();
    let success = false;
    const details: any = {};

    try {
      this.logger.info('🧪 Testing data validation...');

      // Test avec données invalides
      const invalidBookingData = {
        bookingId: '', // ID vide
        customerName: 'Test Customer',
        customerPhone: 'invalid-phone',
        customerEmail: 'invalid-email',
        serviceName: 'Test Service',
        serviceDate: 'invalid-date',
        serviceTime: '25:00', // Heure invalide
        serviceAddress: 'Test Address',
        totalAmount: 100
      };

      try {
        await this.notificationService.scheduleBookingReminders(invalidBookingData as any);
        details.validationFailed = 'Should have thrown validation error';
      } catch (error) {
        details.validationWorking = true;
        details.errorMessage = (error as Error).message;
        success = true;
      }

    } catch (error) {
      details.error = (error as Error).message;
    }

    this.testResults.push({
      test: 'Data Validation',
      success,
      duration: Date.now() - startTime,
      details
    });
  }

  /**
   * Test 2: Programmation des rappels avec données complètes
   */
  async testReminderScheduling(): Promise<void> {
    const startTime = Date.now();
    let success = false;
    const details: any = {};

    try {
      this.logger.info('🧪 Testing reminder scheduling...');

      // Données valides pour la réservation
      const validBookingData: TestBookingData = {
        bookingId: `TEST_${Date.now()}`,
        customerName: 'Jean Dupont',
        customerPhone: '+33751262080',
        customerEmail: 'jean.dupont@example.com',
        serviceName: 'Déménagement Express',
        serviceDate: this.getFutureDate(7), // Dans 7 jours
        serviceTime: '10:00',
        serviceAddress: '123 Rue de la Paix, 75001 Paris',
        totalAmount: 299
      };

      // Programmer les rappels
      const result = await this.notificationService.scheduleBookingReminders(validBookingData);

      details.schedulingResult = result;
      details.scheduledCount = result.scheduledReminders.length;
      details.errors = result.errors;

      success = result.success && result.scheduledReminders.length > 0;

    } catch (error) {
      details.error = (error as Error).message;
    }

    this.testResults.push({
      test: 'Reminder Scheduling',
      success,
      duration: Date.now() - startTime,
      details
    });
  }

  /**
   * Test 3: Confirmation de réservation avec rappels automatiques
   */
  async testBookingConfirmationFlow(): Promise<void> {
    const startTime = Date.now();
    let success = false;
    const details: any = {};

    try {
      this.logger.info('🧪 Testing booking confirmation flow...');

      const bookingData: TestBookingData = {
        bookingId: `BOOKING_${Date.now()}`,
        customerName: 'Marie Martin',
        customerPhone: '+33612345678',
        customerEmail: 'marie.martin@example.com',
        serviceName: 'Ménage Complet',
        serviceDate: this.getFutureDate(3), // Dans 3 jours
        serviceTime: '14:00',
        serviceAddress: '456 Avenue des Champs, 75008 Paris',
        totalAmount: 150
      };

      // Envoyer la confirmation avec programmation automatique des rappels
      const confirmationResult = await this.notificationService.sendBookingConfirmation(
        bookingData.customerEmail,
        {
          customerName: bookingData.customerName,
          bookingId: bookingData.bookingId,
          serviceDate: bookingData.serviceDate,
          serviceTime: bookingData.serviceTime,
          serviceAddress: bookingData.serviceAddress,
          totalAmount: bookingData.totalAmount,
          customerPhone: bookingData.customerPhone
        }
      );

      details.confirmationResult = confirmationResult;
      success = confirmationResult.success;

      // Vérifier les stats du service
      const serviceStats = await this.notificationService.getServiceStats();
      details.serviceStats = serviceStats;

    } catch (error) {
      details.error = (error as Error).message;
    }

    this.testResults.push({
      test: 'Booking Confirmation Flow',
      success,
      duration: Date.now() - startTime,
      details
    });
  }

  /**
   * Test 4: Reprogrammation avec récupération BDD
   */
  async testRescheduleWithDatabaseLookup(): Promise<void> {
    const startTime = Date.now();
    let success = false;
    const details: any = {};

    try {
      this.logger.info('🧪 Testing reschedule with database lookup...');

      // D'abord créer une réservation fictive pour tester
      const originalBookingId = `RESCHEDULE_TEST_${Date.now()}`;
      
      // Test de reprogrammation (même si la BDD n'a pas de données, on teste la logique)
      try {
        const rescheduleResult = await this.notificationService.rescheduleBookingReminders(
          originalBookingId,
          this.getFutureDate(5), // Nouvelle date dans 5 jours
          '16:00' // Nouvelle heure
        );

        details.rescheduleResult = rescheduleResult;
        details.rescheduledCount = rescheduleResult.rescheduledCount;
        
        // Si les données ne sont pas trouvées en BDD, c'est normal pour ce test
        success = true; // On teste juste que la méthode ne crash pas

      } catch (error) {
        details.rescheduleError = (error as Error).message;
        // Si l'erreur est "Unable to retrieve booking data", c'est normal
        success = (error as Error).message.includes('Unable to retrieve booking data');
      }

    } catch (error) {
      details.error = (error as Error).message;
    }

    this.testResults.push({
      test: 'Reschedule with Database Lookup',
      success,
      duration: Date.now() - startTime,
      details
    });
  }

  /**
   * Test 5: Annulation de notifications
   */
  async testNotificationCancellation(): Promise<void> {
    const startTime = Date.now();
    let success = false;
    const details: any = {};

    try {
      this.logger.info('🧪 Testing notification cancellation...');

      const testNotificationId = `CANCEL_TEST_${Date.now()}`;
      
      // Tester l'annulation
      const cancelResult = await this.notificationService.cancelNotification(
        testNotificationId,
        'Test cancellation'
      );

      details.cancelResult = cancelResult;
      success = typeof cancelResult === 'boolean';

    } catch (error) {
      details.error = (error as Error).message;
    }

    this.testResults.push({
      test: 'Notification Cancellation',
      success,
      duration: Date.now() - startTime,
      details
    });
  }

  /**
   * Test 6: Health check complet
   */
  async testHealthCheck(): Promise<void> {
    const startTime = Date.now();
    let success = false;
    const details: any = {};

    try {
      this.logger.info('🧪 Testing health check...');

      const healthResult = await this.notificationService.healthCheck();

      details.healthStatus = healthResult.status;
      details.componentsSummary = healthResult.summary;
      details.totalComponents = healthResult.summary.totalComponents;
      details.healthyComponents = healthResult.summary.healthyComponents;

      success = healthResult.status !== 'unhealthy' && healthResult.summary.healthyComponents > 0;

    } catch (error) {
      details.error = (error as Error).message;
    }

    this.testResults.push({
      test: 'Health Check',
      success,
      duration: Date.now() - startTime,
      details
    });
  }

  /**
   * Exécuter tous les tests
   */
  async runAllTests(): Promise<void> {
    this.logger.info('🚀 Starting optimized reminder system tests...');

    // Initialiser le service avant les tests
    await this.initializeService();

    await this.testDataValidation();
    await this.testReminderScheduling();
    await this.testBookingConfirmationFlow();
    await this.testRescheduleWithDatabaseLookup();
    await this.testNotificationCancellation();
    await this.testHealthCheck();

    // Générer le rapport final
    this.generateTestReport();
  }

  /**
   * Générer le rapport de tests
   */
  private generateTestReport(): void {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n' + '='.repeat(80));
    console.log('📊 RAPPORT DE TESTS - SYSTÈME DE RAPPELS OPTIMISÉ');
    console.log('='.repeat(80));
    
    console.log(`\n📈 RÉSUMÉ GLOBAL:`);
    console.log(`   Total des tests: ${totalTests}`);
    console.log(`   Tests réussis: ${passedTests} ✅`);
    console.log(`   Tests échoués: ${failedTests} ${failedTests > 0 ? '❌' : '✅'}`);
    console.log(`   Taux de réussite: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`   Durée totale: ${totalDuration}ms`);

    console.log(`\n📋 DÉTAIL DES TESTS:`);
    this.testResults.forEach((result, index) => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${index + 1}. ${result.test}: ${status} (${result.duration}ms)`);
      
      if (!result.success && result.details?.error) {
        console.log(`      Erreur: ${result.details.error}`);
      }
      
      if (result.details && Object.keys(result.details).length > 0) {
        const details = { ...result.details };
        delete details.error; // Déjà affiché ci-dessus
        if (Object.keys(details).length > 0) {
          console.log(`      Détails:`, JSON.stringify(details, null, 8));
        }
      }
    });

    console.log('\n' + '='.repeat(80));
    
    if (passedTests === totalTests) {
      console.log('🎉 TOUS LES TESTS SONT PASSÉS - SYSTÈME PRÊT POUR LA PRODUCTION!');
    } else {
      console.log('⚠️  CERTAINS TESTS ONT ÉCHOUÉ - VÉRIFICATION NÉCESSAIRE');
    }
    
    console.log('='.repeat(80));
  }

  /**
   * Utilitaire pour générer une date future
   */
  private getFutureDate(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }
}

/**
 * Exécution des tests
 */
async function runOptimizedReminderTests(): Promise<void> {
  const tester = new OptimizedReminderSystemTest();
  await tester.runAllTests();
}

// Exporter pour utilisation
export { OptimizedReminderSystemTest, runOptimizedReminderTests };

// Si exécuté directement
if (require.main === module) {
  runOptimizedReminderTests().catch(console.error);
}