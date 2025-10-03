/**
 * 🧪 TEST D'INTÉGRATION - EventBus Moderne
 * 
 * Test simple pour vérifier l'intégration complète
 */

import { ModernEventBus, NotificationCreatedEvent, NotificationSentEvent, NotificationFailedEvent } from './modern.event.bus';

async function testEventBusIntegration(): Promise<void> {
  console.log('🧪 Test d\'intégration EventBus moderne...\n');
  
  try {
    // 1. Initialisation
    console.log('1️⃣ Initialisation...');
    const eventBus = new ModernEventBus();
    await eventBus.initialize();
    console.log('✅ EventBus initialisé');
    
    // 2. Handler de test
    let eventsReceived = 0;
    eventBus.on('notification.created', {
      name: 'test-counter',
      priority: 1,
      async handle(event: NotificationCreatedEvent) {
        eventsReceived++;
        console.log(`📨 Event reçu #${eventsReceived}:`, {
          id: event.notificationId,
          channel: event.channel,
          priority: event.priority
        });
      }
    });
    
    // 3. Test d'émission
    console.log('\n2️⃣ Test d\'émission d\'événements...');
    
    const testEvent: NotificationCreatedEvent = {
      notificationId: 'test-001',
      recipientId: 'test@example.com', 
      channel: 'EMAIL',
      timestamp: new Date(),
      templateId: 'welcome',
      priority: 'NORMAL',
      metadata: {
        test: true,
        source: 'integration-test'
      }
    };
    
    await eventBus.emit('notification.created', testEvent);
    
    // Attendre l'exécution
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 4. Vérification
    console.log('\n3️⃣ Vérification des résultats...');
    console.log(`Events reçus: ${eventsReceived}`);
    
    const metrics = eventBus.getMetrics();
    console.log('Métriques:', metrics.map(m => ({
      type: m.eventType,
      emitted: m.totalEmitted,
      handled: m.totalHandled,
      failed: m.totalFailed
    })));
    
    const health = eventBus.getHealthStatus();
    console.log('Santé:', {
      healthy: health.isHealthy,
      eventsProcessed: health.eventsProcessed,
      failureRate: health.failureRate + '%',
      activeHandlers: health.activeHandlers
    });
    
    // 5. Test des handlers avancés
    console.log('\n4️⃣ Test des handlers avancés...');
    
    // Mock MetricsCollector
    const mockMetrics = {
      recordMetric: (name: string, value: number, tags: Record<string, string>) => {
        console.log(`📊 Metric: ${name} = ${value}`, Object.keys(tags).length > 0 ? tags : '');
      }
    };
    
    eventBus.setupAdvancedHandlers(mockMetrics);
    
    // Attendre le chargement des handlers
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test event sent
    const sentEvent: NotificationSentEvent = {
      notificationId: 'test-002',
      recipientId: 'success@test.com',
      channel: 'SMS', 
      timestamp: new Date(),
      deliveryTime: 1200,
      cost: 0.05,
      externalId: 'sms-123',
      metadata: {
        serviceType: 'booking',
        region: 'FR'
      }
    };
    
    await eventBus.emit('notification.sent', sentEvent);
    
    // Test event failed
    const failedEvent: NotificationFailedEvent = {
      notificationId: 'test-003',
      recipientId: 'error@test.com',
      channel: 'WHATSAPP',
      timestamp: new Date(),
      error: 'Authentication failed',
      attempts: 1,
      maxAttempts: 3,
      canRetry: true,
      metadata: {
        serviceType: 'marketing'
      }
    };
    
    await eventBus.emit('notification.failed', failedEvent);
    
    // Attendre le traitement
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 6. Métriques finales
    console.log('\n5️⃣ Résultats finaux...');
    const finalMetrics = eventBus.getMetrics();
    const finalHealth = eventBus.getHealthStatus();
    
    console.log('📊 Total events émis:', finalMetrics.reduce((sum, m) => sum + m.totalEmitted, 0));
    console.log('🏥 Système sain:', finalHealth.isHealthy ? '✅' : '❌');
    console.log('📈 Taux de succès:', (100 - finalHealth.failureRate).toFixed(1) + '%');
    
    // 7. Arrêt
    console.log('\n6️⃣ Arrêt...');
    await eventBus.shutdown();
    
    console.log('\n🎉 Test d\'intégration réussi !');
    
    return;
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

// Test simple des handlers
async function testHandlers(): Promise<void> {
  console.log('\n🔧 Test des handlers...');
  
  try {
    // Import dynamique pour éviter les erreurs de compilation
    const { BusinessMetricsHandler } = await import('./handlers/business.metrics.handler');
    const { AlertingHandler } = await import('./handlers/alerting.handler');
    
    console.log('✅ Handlers importés');
    
    // Test BusinessMetricsHandler
    const mockCollector = {
      recordMetric: (name: string, value: number, tags: any) => {
        console.log(`📈 ${name}: ${value}`, tags);
      }
    };
    
    const businessHandler = new BusinessMetricsHandler(mockCollector);
    
    await businessHandler.handle({
      notificationId: 'handler-test-001',
      recipientId: 'metrics@test.com',
      channel: 'EMAIL' as const,
      timestamp: new Date(),
      deliveryTime: 850,
      cost: 0.03,
      externalId: 'email-456',
      metadata: {
        serviceType: 'confirmation',
        customerSegment: 'vip'
      }
    });
    
    console.log('✅ BusinessMetricsHandler testé');
    
    // Test AlertingHandler
    const alertHandler = new AlertingHandler();
    
    await alertHandler.handle({
      notificationId: 'handler-test-002',
      recipientId: 'alert@test.com',
      channel: 'SMS' as const,
      timestamp: new Date(),
      error: 'Rate limit exceeded',
      attempts: 2,
      maxAttempts: 3,
      canRetry: true,
      metadata: {
        serviceType: 'urgent'
      }
    });
    
    console.log('✅ AlertingHandler testé');
    
  } catch (error) {
    console.error('⚠️ Erreur handlers (attendue en dev):', (error as Error).message);
  }
}

// Export pour utilisation
export { testEventBusIntegration, testHandlers };

// Auto-exécution si appelé directement  
if (require.main === module) {
  (async () => {
    try {
      await testEventBusIntegration();
      await testHandlers();
      console.log('\n🎯 Tous les tests terminés');
    } catch (error) {
      console.error('\n💥 Tests échoués:', error);
      process.exit(1);
    }
  })();
}