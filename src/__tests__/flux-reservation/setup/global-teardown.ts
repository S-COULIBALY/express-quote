/**
 * 🧹 **NETTOYAGE GLOBAL POUR LES TESTS**
 * 
 * Ce fichier nettoie l'environnement après tous les tests
 * avec la base de données, les services et les mocks.
 */

import { PrismaClient } from '@prisma/client';

// Configuration de la base de données de test
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST || 'postgresql://test:test@localhost:5432/test',
    },
  },
});

/**
 * Nettoyage global après tous les tests
 */
async function globalTeardown() {
  console.log('🧹 Nettoyage global des tests...');
  
  try {
    // 1. Nettoyer la base de données
    await cleanupDatabase();
    
    // 2. Nettoyer les services
    await cleanupServices();
    
    // 3. Nettoyer les mocks
    await cleanupMocks();
    
    // 4. Nettoyer les fichiers temporaires
    await cleanupTempFiles();
    
    // 5. Nettoyer les navigateurs
    await cleanupBrowsers();
    
    console.log('✅ Nettoyage global terminé');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage global:', error);
    throw error;
  }
}

/**
 * Nettoyage de la base de données
 */
async function cleanupDatabase() {
  console.log('🗄️ Nettoyage de la base de données...');
  
  try {
    // Supprimer toutes les données de test
    await prisma.booking.deleteMany({
      where: {
        id: {
          startsWith: 'booking_test_',
        },
      },
    });
    
    await prisma.quoteRequest.deleteMany({
      where: {
        id: {
          startsWith: 'quote_test_',
        },
      },
    });
    
    await prisma.customer.deleteMany({
      where: {
        id: {
          startsWith: 'customer_test_',
        },
      },
    });
    
    await prisma.transaction.deleteMany({
      where: {
        id: {
          startsWith: 'transaction_test_',
        },
      },
    });
    
    await prisma.document.deleteMany({
      where: {
        id: {
          startsWith: 'document_test_',
        },
      },
    });
    
    await prisma.emailLog.deleteMany({
      where: {
        id: {
          startsWith: 'email_test_',
        },
      },
    });
    
    // Supprimer les services de test
    await prisma.catalogSelection.deleteMany({
      where: {
        id: {
          startsWith: 'service_test_',
        },
      },
    });
    
    await prisma.items.deleteMany({
      where: {
        id: {
          startsWith: 'item_test_',
        },
      },
    });
    
    // Supprimer les notifications de test
    await prisma.notifications.deleteMany({
      where: {
        id: {
          startsWith: 'notification_test_',
        },
      },
    });
    
    // Supprimer les attributions de test
    await prisma.booking_attributions.deleteMany({
      where: {
        id: {
          startsWith: 'attribution_test_',
        },
      },
    });
    
    // Supprimer les professionnels de test
    await prisma.Professional.deleteMany({
      where: {
        id: {
          startsWith: 'professional_test_',
        },
      },
    });
    
    console.log('✅ Base de données nettoyée');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage de la base de données:', error);
    throw error;
  }
}

/**
 * Nettoyage des services
 */
async function cleanupServices() {
  console.log('🔧 Nettoyage des services...');
  
  try {
    // Nettoyer les variables d'environnement
    delete process.env.NODE_ENV;
    delete process.env.DATABASE_URL;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_PUBLISHABLE_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    
    // Nettoyer les connexions
    await prisma.$disconnect();
    
    console.log('✅ Services nettoyés');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des services:', error);
    throw error;
  }
}

/**
 * Nettoyage des mocks
 */
async function cleanupMocks() {
  console.log('🎭 Nettoyage des mocks...');
  
  try {
    // Nettoyer les mocks globaux
    if (global.stripeMock) {
      delete global.stripeMock;
    }
    
    if (global.notificationMock) {
      delete global.notificationMock;
    }
    
    if (global.databaseMock) {
      delete global.databaseMock;
    }
    
    if (global.testData) {
      delete global.testData;
    }
    
    // Nettoyer les mocks Jest
    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.resetAllMocks();
    
    console.log('✅ Mocks nettoyés');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des mocks:', error);
    throw error;
  }
}

/**
 * Nettoyage des fichiers temporaires
 */
async function cleanupTempFiles() {
  console.log('📁 Nettoyage des fichiers temporaires...');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Nettoyer les rapports de test
    const reportDir = path.join(__dirname, '../test-results');
    if (fs.existsSync(reportDir)) {
      fs.rmSync(reportDir, { recursive: true, force: true });
    }
    
    // Nettoyer les captures d'écran
    const screenshotDir = path.join(__dirname, '../screenshots');
    if (fs.existsSync(screenshotDir)) {
      fs.rmSync(screenshotDir, { recursive: true, force: true });
    }
    
    // Nettoyer les vidéos
    const videoDir = path.join(__dirname, '../videos');
    if (fs.existsSync(videoDir)) {
      fs.rmSync(videoDir, { recursive: true, force: true });
    }
    
    // Nettoyer les traces
    const traceDir = path.join(__dirname, '../traces');
    if (fs.existsSync(traceDir)) {
      fs.rmSync(traceDir, { recursive: true, force: true });
    }
    
    console.log('✅ Fichiers temporaires nettoyés');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des fichiers temporaires:', error);
    throw error;
  }
}

/**
 * Nettoyage des navigateurs
 */
async function cleanupBrowsers() {
  console.log('🌐 Nettoyage des navigateurs...');
  
  try {
    // Fermer les navigateurs
    if (global.browsers) {
      if (global.browsers.chromium) {
        await global.browsers.chromium.close();
      }
      if (global.browsers.firefox) {
        await global.browsers.firefox.close();
      }
      if (global.browsers.webkit) {
        await global.browsers.webkit.close();
      }
      
      delete global.browsers;
    }
    
    console.log('✅ Navigateurs nettoyés');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des navigateurs:', error);
    throw error;
  }
}

/**
 * Nettoyage des données de test
 */
async function cleanupTestData() {
  console.log('📊 Nettoyage des données de test...');
  
  try {
    // Nettoyer les données de test globales
    if (global.testData) {
      delete global.testData;
    }
    
    // Nettoyer les données de test locales
    if (global.localTestData) {
      delete global.localTestData;
    }
    
    console.log('✅ Données de test nettoyées');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des données de test:', error);
    throw error;
  }
}

/**
 * Nettoyage des connexions
 */
async function cleanupConnections() {
  console.log('🔌 Nettoyage des connexions...');
  
  try {
    // Fermer les connexions à la base de données
    await prisma.$disconnect();
    
    // Fermer les connexions aux services externes
    if (global.stripeConnection) {
      await global.stripeConnection.close();
      delete global.stripeConnection;
    }
    
    if (global.notificationConnection) {
      await global.notificationConnection.close();
      delete global.notificationConnection;
    }
    
    console.log('✅ Connexions nettoyées');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des connexions:', error);
    throw error;
  }
}

/**
 * Nettoyage des logs
 */
async function cleanupLogs() {
  console.log('📝 Nettoyage des logs...');
  
  try {
    // Nettoyer les logs de test
    if (global.testLogs) {
      delete global.testLogs;
    }
    
    // Nettoyer les logs d'erreur
    if (global.errorLogs) {
      delete global.errorLogs;
    }
    
    console.log('✅ Logs nettoyés');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des logs:', error);
    throw error;
  }
}

// Export de la fonction principale
export { globalTeardown };
