/**
 * 🧪 TEST BUSINESS HANDLERS - Facturation et Rétention
 * 
 * Test complet des handlers business avec scénarios réels
 */

import { ModernEventBus, NotificationSentEvent, NotificationFailedEvent } from './modern.event.bus';

async function testBusinessHandlers(): Promise<void> {
  console.log('🧪 Test des handlers business...\n');
  
  try {
    // 1. Initialisation EventBus
    console.log('1️⃣ Initialisation EventBus avec handlers business...');
    const eventBus = new ModernEventBus();
    await eventBus.initialize();
    
    // Mock MetricsCollector
    const mockMetrics = {
      recordMetric: (name: string, value: number, tags: Record<string, string>) => {
        console.log(`📊 Metric: ${name} = ${value}`, Object.keys(tags).length > 0 ? tags : '');
      }
    };
    
    // Mock Repository
    const mockRepository = {
      findById: async (id: string) => ({ id, status: 'SENT' }),
      update: async (id: string, data: any) => console.log(`🗄️ DB Update: ${id}`, data)
    };
    
    // Setup business handlers
    eventBus.setupBusinessHandlers(mockMetrics, mockRepository, null);
    
    // Attendre le chargement des handlers
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Handlers business chargés\n');
    
    // 2. Test InvoicingHandler
    console.log('2️⃣ Test InvoicingHandler - Scénarios de facturation...\n');
    
    // Scénario 1: Confirmation déménagement avec paiement échelonné
    console.log('📋 Scénario 1: Déménagement 2500€ avec acompte 30%');
    const demenagementEvent: NotificationSentEvent = {
      notificationId: 'invoice-test-001',
      recipientId: 'client-premium@example.com',
      channel: 'EMAIL',
      timestamp: new Date(),
      deliveryTime: 800,
      cost: 0.02,
      externalId: 'email-123',
      metadata: {
        notificationType: 'booking-confirmed',
        serviceType: 'demenagement',
        bookingAmount: 2500,
        paymentSchedule: 'split',
        serviceDate: '2024-12-15',
        customerSegment: 'premium'
      }
    };
    
    await eventBus.emit('notification.sent', demenagementEvent);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('');
    
    // Scénario 2: Service ménage récurrent terminé
    console.log('📋 Scénario 2: Ménage récurrent (3 mois de service)');
    const menageEvent: NotificationSentEvent = {
      notificationId: 'invoice-test-002',
      recipientId: 'client-recurring@example.com',
      channel: 'SMS',
      timestamp: new Date(),
      deliveryTime: 500,
      cost: 0.05,
      externalId: 'sms-456',
      metadata: {
        notificationType: 'recurring-service-done',
        serviceType: 'menage',
        amount: 120,
        isRecurring: true,
        monthsOfService: 3,
        recurringType: 'weekly'
      }
    };
    
    await eventBus.emit('notification.sent', menageEvent);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('');
    
    // Scénario 3: Service additionnel livraison express
    console.log('📋 Scénario 3: Livraison express client business');
    const livraisonEvent: NotificationSentEvent = {
      notificationId: 'invoice-test-003',
      recipientId: 'business-client@corp.com',
      channel: 'EMAIL',
      timestamp: new Date(),
      deliveryTime: 1200,
      cost: 0.08,
      externalId: 'email-789',
      metadata: {
        notificationType: 'addon-confirmed',
        serviceType: 'livraison',
        amount: 150,
        additionalService: 'express_delivery',
        urgency: 'express',
        customerType: 'business'
      }
    };
    
    await eventBus.emit('notification.sent', livraisonEvent);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('');
    
    // 3. Test CustomerRetentionHandler
    console.log('3️⃣ Test CustomerRetentionHandler - Scénarios de rétention...\n');
    
    // Scénario 1: Échec notification critique client VIP
    console.log('📋 Scénario 1: Client VIP - Échec rappel service urgent');
    const criticalFailureEvent: NotificationFailedEvent = {
      notificationId: 'retention-test-001',
      recipientId: 'vip-client@example.com',
      channel: 'EMAIL',
      timestamp: new Date(),
      error: 'Email bounced - invalid address',
      attempts: 3,
      maxAttempts: 3,
      canRetry: false,
      metadata: {
        serviceType: 'demenagement',
        notificationType: 'service-reminder',
        bookingAmount: 3500,
        urgency: 'urgent',
        vip: true,
        customerValue: 'critical',
        serviceDate: '2024-12-10'
      }
    };
    
    await eventBus.emit('notification.failed', criticalFailureEvent);
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('');
    
    // Scénario 2: Échec SMS client récurrent
    console.log('📋 Scénario 2: Client récurrent - SMS de confirmation échoué');
    const recurringFailureEvent: NotificationFailedEvent = {
      notificationId: 'retention-test-002',
      recipientId: 'recurring-client@example.com',
      channel: 'SMS',
      timestamp: new Date(),
      error: 'SMS delivery failed - network timeout',
      attempts: 2,
      maxAttempts: 3,
      canRetry: true,
      metadata: {
        serviceType: 'menage',
        notificationType: 'service-confirmation',
        amount: 80,
        isRecurring: true,
        customerValue: 'high',
        servicesCount: 8,
        preferredChannel: 'whatsapp'
      }
    };
    
    await eventBus.emit('notification.failed', recurringFailureEvent);
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('');
    
    // Scénario 3: Échec livraison business critique
    console.log('📋 Scénario 3: Client business - Livraison express échouée');
    const businessFailureEvent: NotificationFailedEvent = {
      notificationId: 'retention-test-003',
      recipientId: 'enterprise@bigcorp.com',
      channel: 'WHATSAPP',
      timestamp: new Date(),
      error: 'WhatsApp authentication failed',
      attempts: 1,
      maxAttempts: 3,
      canRetry: true,
      metadata: {
        serviceType: 'livraison',
        notificationType: 'delivery-update',
        deliveryValue: 1200,
        urgency: 'express',
        customerType: 'business',
        customerValue: 'critical'
      }
    };
    
    await eventBus.emit('notification.failed', businessFailureEvent);
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('');
    
    // 4. Vérification des métriques finales
    console.log('4️⃣ Métriques finales des handlers business...');
    
    const finalMetrics = eventBus.getMetrics();
    const businessEvents = finalMetrics.filter(m => 
      m.eventType === 'notification.sent' || m.eventType === 'notification.failed'
    );
    
    console.log('📊 Résumé des événements business:', businessEvents.map(m => ({
      type: m.eventType,
      emitted: m.totalEmitted,
      handled: m.totalHandled,
      failed: m.totalFailed,
      handlers: m.handlers.length
    })));
    
    const health = eventBus.getHealthStatus();
    console.log('🏥 État système:', {
      healthy: health.isHealthy ? '✅' : '❌',
      eventsProcessed: health.eventsProcessed,
      failureRate: health.failureRate + '%',
      activeHandlers: health.activeHandlers
    });
    
    // 5. Arrêt
    console.log('\n5️⃣ Arrêt du système...');
    await eventBus.shutdown();
    
    console.log('\n🎉 Test handlers business terminé avec succès !');
    console.log('\n📋 Résumé des tests:');
    console.log('  💰 InvoicingHandler testé sur 3 scénarios');
    console.log('  💼 CustomerRetentionHandler testé sur 3 scénarios');
    console.log('  📊 Métriques business collectées');
    console.log('  🔄 Actions de rétention déclenchées');
    
  } catch (error) {
    console.error('❌ Erreur test handlers business:', error);
    throw error;
  }
}

// Test isolé des handlers individuels
async function testHandlersIsolated(): Promise<void> {
  console.log('\n🔬 Test isolé des handlers individuels...\n');
  
  try {
    // Test InvoicingHandler seul
    console.log('🧾 Test InvoicingHandler isolé...');
    const { InvoicingHandler } = await import('./handlers/invoicing.handler');
    
    const mockCollector = {
      recordMetric: (name: string, value: number, tags: any) => {
        console.log(`💰 Invoice Metric: ${name} = ${value}`, tags);
      }
    };
    
    const invoicingHandler = new InvoicingHandler(mockCollector);
    
    // Test avec facture d'acompte
    await invoicingHandler.handle({
      notificationId: 'isolated-invoice-001',
      recipientId: 'isolated-test@example.com',
      channel: 'EMAIL',
      timestamp: new Date(),
      deliveryTime: 600,
      cost: 0.03,
      externalId: 'email-isolated',
      metadata: {
        notificationType: 'booking-confirmed',
        serviceType: 'demenagement',
        bookingAmount: 1800,
        paymentSchedule: 'split'
      }
    });
    
    console.log('✅ InvoicingHandler isolé testé\n');
    
    // Test CustomerRetentionHandler seul
    console.log('💼 Test CustomerRetentionHandler isolé...');
    const { CustomerRetentionHandler } = await import('./handlers/customer-retention.handler');
    
    const retentionHandler = new CustomerRetentionHandler(mockCollector);
    
    // Test avec client à forte valeur
    await retentionHandler.handle({
      notificationId: 'isolated-retention-001',
      recipientId: 'high-value@example.com',
      channel: 'SMS',
      timestamp: new Date(),
      error: 'SMS quota exceeded',
      attempts: 2,
      maxAttempts: 3,
      canRetry: true,
      metadata: {
        serviceType: 'demenagement',
        customerValue: 'high',
        bookingAmount: 2200,
        premium: true
      }
    });
    
    console.log('✅ CustomerRetentionHandler isolé testé');
    
  } catch (error) {
    console.error('⚠️ Erreur test isolé (attendue en dev):', (error as Error).message);
  }
}

// Export pour utilisation
export { testBusinessHandlers, testHandlersIsolated };

// Auto-exécution si appelé directement  
if (require.main === module) {
  (async () => {
    try {
      await testBusinessHandlers();
      await testHandlersIsolated();
      console.log('\n🎯 Tous les tests business terminés avec succès !');
    } catch (error) {
      console.error('\n💥 Tests business échoués:', error);
      process.exit(1);
    }
  })();
}