/**
 * 🌍 **CONFIGURATION GLOBALE POUR LES TESTS**
 * 
 * Ce fichier configure l'environnement global pour tous les tests
 * avec la base de données, les services et les mocks.
 */

import { chromium, FullConfig } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

// Configuration de la base de données de test
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST || 'postgresql://test:test@localhost:5432/test',
    },
  },
});

// Configuration globale
async function globalSetup(config: FullConfig) {
  console.log('🌍 Configuration globale des tests...');
  
  try {
    // 1. Configuration de la base de données
    await setupDatabase();
    
    // 2. Configuration des services
    await setupServices();
    
    // 3. Configuration des mocks
    await setupMocks();
    
    // 4. Configuration des données de test
    await setupTestData();
    
    // 5. Configuration des navigateurs
    await setupBrowsers();
    
    console.log('✅ Configuration globale terminée');
  } catch (error) {
    console.error('❌ Erreur lors de la configuration globale:', error);
    throw error;
  }
}

/**
 * Configuration de la base de données de test
 */
async function setupDatabase() {
  console.log('🗄️ Configuration de la base de données...');
  
  try {
    // Nettoyer la base de données
    await prisma.booking.deleteMany();
    await prisma.quoteRequest.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.document.deleteMany();
    await prisma.emailLog.deleteMany();
    
    // Créer les données de base
    await createBaseData();
    
    console.log('✅ Base de données configurée');
  } catch (error) {
    console.error('❌ Erreur configuration base de données:', error);
    throw error;
  }
}

/**
 * Créer les données de base pour les tests
 */
async function createBaseData() {
  // Créer des clients de test
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        id: 'customer_test_1',
        email: 'test1@example.com',
        firstName: 'Jean',
        lastName: 'Dupont',
        phone: '+33123456789',
      },
    }),
    prisma.customer.create({
      data: {
        id: 'customer_test_2',
        email: 'test2@example.com',
        firstName: 'Marie',
        lastName: 'Martin',
        phone: '+33987654321',
      },
    }),
  ]);
  
  // Créer des services de test
  const services = await Promise.all([
    prisma.catalogSelection.create({
      data: {
        id: 'service_test_1',
        category: 'MENAGE',
        subcategory: 'nettoyage-standard',
        displayOrder: 1,
        isActive: true,
        marketingTitle: 'Nettoyage Standard',
        marketingDescription: 'Service de nettoyage standard',
        marketingPrice: 120,
        originalPrice: 150,
      },
    }),
    prisma.catalogSelection.create({
      data: {
        id: 'service_test_2',
        category: 'DEMENAGEMENT',
        subcategory: 'demenagement-standard',
        displayOrder: 2,
        isActive: true,
        marketingTitle: 'Déménagement Standard',
        marketingDescription: 'Service de déménagement standard',
        marketingPrice: 350,
        originalPrice: 400,
      },
    }),
  ]);
  
  // Créer des items de test
  const items = await Promise.all([
    prisma.items.create({
      data: {
        id: 'item_test_1',
        type: 'MENAGE',
        name: 'Nettoyage 2h',
        description: 'Service de nettoyage de 2 heures',
        price: 120,
        workers: 1,
        duration: 120,
        features: ['nettoyage', 'aspirateur', 'produits'],
        isActive: true,
        status: 'ACTIVE',
      },
    }),
    prisma.items.create({
      data: {
        id: 'item_test_2',
        type: 'DEMENAGEMENT',
        name: 'Déménagement Standard',
        description: 'Service de déménagement standard',
        price: 350,
        workers: 2,
        duration: 240,
        features: ['emballage', 'transport', 'déballage'],
        isActive: true,
        status: 'ACTIVE',
      },
    }),
  ]);
  
  console.log('✅ Données de base créées');
}

/**
 * Configuration des services
 */
async function setupServices() {
  console.log('🔧 Configuration des services...');
  
  // Configuration des variables d'environnement
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
  process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY_TEST;
  process.env.STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY_TEST;
  process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET_TEST;
  
  console.log('✅ Services configurés');
}

/**
 * Configuration des mocks
 */
async function setupMocks() {
  console.log('🎭 Configuration des mocks...');
  
  // Mock des services Stripe
  global.stripeMock = {
    createPaymentIntent: jest.fn(() => Promise.resolve({
      id: 'pi_test_123',
      client_secret: 'pi_test_123_secret',
      status: 'requires_payment_method',
    })),
    confirmPayment: jest.fn(() => Promise.resolve({
      id: 'pi_test_123',
      status: 'succeeded',
    })),
  };
  
  // Mock des services de notification
  global.notificationMock = {
    sendEmail: jest.fn(() => Promise.resolve({ success: true })),
    sendSMS: jest.fn(() => Promise.resolve({ success: true })),
    sendWhatsApp: jest.fn(() => Promise.resolve({ success: true })),
  };
  
  // Mock des services de base de données
  global.databaseMock = {
    booking: {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    customer: {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    },
    quoteRequest: {
      create: jest.fn(),
      findByTemporaryId: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    },
  };
  
  console.log('✅ Mocks configurés');
}

/**
 * Configuration des données de test
 */
async function setupTestData() {
  console.log('📊 Configuration des données de test...');
  
  // Données de test pour les réservations
  global.testData = {
    customers: [
      {
        id: 'customer_test_1',
        email: 'test1@example.com',
        firstName: 'Jean',
        lastName: 'Dupont',
        phone: '+33123456789',
      },
      {
        id: 'customer_test_2',
        email: 'test2@example.com',
        firstName: 'Marie',
        lastName: 'Martin',
        phone: '+33987654321',
      },
    ],
    services: [
      {
        id: 'service_test_1',
        type: 'nettoyage',
        name: 'Nettoyage Standard',
        price: 120,
        duration: 120,
        workers: 1,
      },
      {
        id: 'service_test_2',
        type: 'demenagement',
        name: 'Déménagement Standard',
        price: 350,
        duration: 240,
        workers: 2,
      },
    ],
    reservations: [
      {
        id: 'booking_test_1',
        type: 'SERVICE',
        status: 'DRAFT',
        customerId: 'customer_test_1',
        totalAmount: 120,
        scheduledDate: new Date('2024-02-15'),
      },
      {
        id: 'booking_test_2',
        type: 'SERVICE',
        status: 'CONFIRMED',
        customerId: 'customer_test_2',
        totalAmount: 350,
        scheduledDate: new Date('2024-02-20'),
      },
    ],
  };
  
  console.log('✅ Données de test configurées');
}

/**
 * Configuration des navigateurs
 */
async function setupBrowsers() {
  console.log('🌐 Configuration des navigateurs...');
  
  // Configuration des navigateurs de test
  global.browsers = {
    chromium: await chromium.launch({
      headless: process.env.CI === 'true',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }),
  };
  
  console.log('✅ Navigateurs configurés');
}

/**
 * Nettoyage global
 */
async function globalTeardown() {
  console.log('🧹 Nettoyage global...');
  
  try {
    // Nettoyer la base de données
    await prisma.booking.deleteMany();
    await prisma.quoteRequest.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.document.deleteMany();
    await prisma.emailLog.deleteMany();
    
    // Fermer les connexions
    await prisma.$disconnect();
    
    // Fermer les navigateurs
    if (global.browsers) {
      await global.browsers.chromium.close();
    }
    
    console.log('✅ Nettoyage global terminé');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage global:', error);
  }
}

// Export des fonctions
export { globalSetup, globalTeardown };
