/**
 * 🧪 TEST - TEMPLATES BOOKING & PAYMENT REACT EMAIL
 *
 * Ce test vérifie spécifiquement :
 * 1. booking-confirmation - Template de confirmation de réservation
 * 2. payment-confirmation - Template de confirmation de paiement
 *
 * ✅ Validation :
 * - Tous les champs obligatoires sont fournis
 * - Le rendu React Email fonctionne (bodyLength > 10000)
 * - Les template_id correspondent aux templates React Email
 * - Les template_data contiennent toutes les données
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

const TEST_CONFIG = {
  customer: {
    email: process.env.TEST_EMAIL || 's.coulibaly@outlook.com',
    firstName: 'Client',
    lastName: 'Test Booking',
    phone: process.env.TEST_PHONE || '+33751262080'
  },
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000'
};

describe('📦 Test templates booking-confirmation et payment-confirmation', () => {
  let testCustomerId: string;
  let testBookingId: string;

  beforeAll(async () => {
    // Créer le client de test
    const customer = await prisma.customer.upsert({
      where: { email: TEST_CONFIG.customer.email },
      update: {
        firstName: TEST_CONFIG.customer.firstName,
        lastName: TEST_CONFIG.customer.lastName,
        phone: TEST_CONFIG.customer.phone,
        updatedAt: new Date()
      },
      create: {
        id: `cust_booking_payment_test_${Date.now()}`,
        email: TEST_CONFIG.customer.email,
        firstName: TEST_CONFIG.customer.firstName,
        lastName: TEST_CONFIG.customer.lastName,
        phone: TEST_CONFIG.customer.phone,
        updatedAt: new Date()
      }
    });
    testCustomerId = customer.id;

    logger.info('✅ Setup test booking-payment templates terminé');
  });

  afterAll(async () => {
    // Nettoyage
    if (testBookingId) {
      await prisma.document.deleteMany({ where: { bookingId: testBookingId } });
      await prisma.booking.deleteMany({ where: { id: testBookingId } });
    }
    await prisma.notifications.deleteMany({
      where: {
        recipient_id: TEST_CONFIG.customer.email
      }
    });
    await prisma.$disconnect();
  });

  it('devrait envoyer une notification avec template booking-confirmation', async () => {
    // 1. Créer une réservation confirmée
    const booking = await prisma.booking.create({
      data: {
        id: `book_confirmation_test_${Date.now()}`,
        customerId: testCustomerId,
        status: 'CONFIRMED',
        totalAmount: 25000, // 250.00€
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Dans 7 jours
        type: 'SERVICE',
        paymentMethod: 'CARD',
        updatedAt: new Date()
      }
    });
    testBookingId = booking.id;

    // 2. Envoyer notification via service
    const { getGlobalNotificationService } = await import('@/notifications/interfaces');
    const notificationService = await getGlobalNotificationService();

    const serviceDate = booking.scheduledDate;
    const serviceTime = '09:00';

    const notificationData = {
      to: TEST_CONFIG.customer.email,
      template: 'booking-confirmation',
      data: {
        // ✅ Informations client (obligatoires)
        customerName: `${TEST_CONFIG.customer.firstName} ${TEST_CONFIG.customer.lastName}`,
        customerEmail: TEST_CONFIG.customer.email,
        customerPhone: TEST_CONFIG.customer.phone,

        // ✅ Informations de réservation (obligatoires)
        bookingId: booking.id,
        bookingReference: booking.id,
        serviceType: 'DELIVERY' as const,
        serviceName: 'Livraison express',

        // ✅ Planning (obligatoires)
        serviceDate: serviceDate.toISOString(),
        serviceTime: serviceTime,
        estimatedDuration: 2, // 2 heures
        endTime: '11:00',

        // ✅ Adresses
        serviceAddress: '123 Rue de la Paix, 75001 Paris',
        pickupAddress: '123 Rue de la Paix, 75001 Paris',
        deliveryAddress: '456 Avenue des Champs, 75008 Paris',

        // ✅ Équipe et logistique (obligatoires)
        teamSize: 2,
        teamLeader: {
          name: 'Jean Dupont',
          phone: '+33612345678',
          photo: 'https://example.com/team/jean.jpg'
        },
        vehicleInfo: {
          type: 'Camion 12m³',
          licensePlate: 'AB-123-CD'
        },

        // ✅ Équipement (obligatoire)
        equipment: ['Cartons', 'Couvertures', 'Diable'],
        suppliedMaterials: ['Cartons de déménagement', 'Ruban adhésif'],
        clientMustProvide: ['Accès ascenseur', 'Badge parking'],

        // ✅ Pricing (obligatoires)
        totalAmount: booking.totalAmount,
        paymentStatus: 'PAID' as const,
        paymentMethod: 'Carte bancaire',
        currency: 'EUR',

        // ✅ Instructions (obligatoires)
        preparationInstructions: [
          'Préparer les cartons',
          'Libérer l\'accès ascenseur',
          'Badge parking disponible'
        ],
        accessInstructions: 'Code porte: 1234A - Bâtiment A, 3ème étage',
        specialRequirements: 'Objets fragiles à manipuler avec précaution',

        // ✅ Contacts d'urgence (obligatoires)
        teamLeaderContact: '+33612345678',
        emergencyContact: '+33123456789',
        supportPhone: '+33123456789',

        // ✅ URLs d'action (obligatoires)
        modifyUrl: `${TEST_CONFIG.baseUrl}/bookings/${booking.id}/modify`,
        cancelUrl: `${TEST_CONFIG.baseUrl}/bookings/${booking.id}/cancel`,
        trackingUrl: `${TEST_CONFIG.baseUrl}/bookings/${booking.id}/track`,

        // Configuration
        companyName: 'Express Quote SARL',
        companyPhone: '+33123456789',
        companyEmail: 'contact@express-quote.fr'
      }
    };

    try {
      const result = await notificationService.sendEmail(notificationData);
      logger.info('✅ Notification booking-confirmation envoyée', { result });
    } catch (error) {
      logger.warn('⚠️ Erreur envoi notification (peut être normal si service non disponible)', { error });
    }

    // 3. Attendre que la notification soit créée
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. Vérifier la notification
    const notifications = await prisma.notifications.findMany({
      where: {
        recipient_id: TEST_CONFIG.customer.email,
        created_at: {
          gte: new Date(Date.now() - 60000) // Dernière minute
        }
      },
      orderBy: { created_at: 'desc' },
      take: 1
    });

    expect(notifications.length).toBeGreaterThan(0);
    const notification = notifications[0];

    // ✅ Vérifier le template_id
    expect(notification.template_id).toBe('booking-confirmation');

    // ✅ Vérifier les données complètes
    const templateData = notification.template_data as any;
    expect(templateData.customerName).toBeDefined();
    expect(templateData.bookingId).toBe(booking.id);
    expect(templateData.serviceDate).toBeDefined();
    expect(templateData.totalAmount).toBe(booking.totalAmount);
    expect(templateData.teamSize).toBe(2);
    expect(templateData.equipment).toBeInstanceOf(Array);
    expect(templateData.preparationInstructions).toBeInstanceOf(Array);

    // ✅ CRITIQUE : Vérifier que React Email a généré le HTML complet
    const bodyLength = notification.body?.length || 0;
    logger.info(`📊 [booking-confirmation] bodyLength: ${bodyLength} caractères`);

    // React Email complet doit générer > 10000 caractères
    // Fallback HTML génère 441 caractères
    expect(bodyLength).toBeGreaterThan(10000);

    logger.info('✅ Test booking-confirmation réussi', {
      template_id: notification.template_id,
      bodyLength,
      hasAllFields: true
    });
  }, 30000);

  it('devrait envoyer une notification avec template payment-confirmation', async () => {
    // 1. Utiliser la réservation existante ou en créer une nouvelle
    if (!testBookingId) {
      const booking = await prisma.booking.create({
        data: {
          id: `book_payment_test_${Date.now()}`,
          customerId: testCustomerId,
          status: 'CONFIRMED',
          totalAmount: 35000, // 350.00€
          scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          type: 'SERVICE',
          paymentMethod: 'CARD',
          updatedAt: new Date()
        }
      });
      testBookingId = booking.id;
    }

    const booking = await prisma.booking.findUnique({
      where: { id: testBookingId }
    });

    if (!booking) {
      throw new Error('Booking non trouvé');
    }

    // 2. Envoyer notification de paiement
    const { getGlobalNotificationService } = await import('@/notifications/interfaces');
    const notificationService = await getGlobalNotificationService();

    const paymentDate = new Date();
    const transactionId = `pi_${Date.now()}`;
    const invoiceNumber = `INV-${Date.now()}`;

    const notificationData = {
      to: TEST_CONFIG.customer.email,
      template: 'payment-confirmation',
      data: {
        // ✅ Informations client (obligatoires)
        customerName: `${TEST_CONFIG.customer.firstName} ${TEST_CONFIG.customer.lastName}`,
        customerEmail: TEST_CONFIG.customer.email,
        customerPhone: TEST_CONFIG.customer.phone,

        // ✅ Informations de paiement (obligatoires)
        amount: booking.totalAmount,
        currency: 'EUR',
        paymentMethod: 'Carte bancaire',
        transactionId: transactionId,
        paymentDate: paymentDate.toISOString(),

        // ✅ Informations de réservation (obligatoires)
        bookingId: booking.id,
        bookingReference: booking.id,
        serviceType: 'DELIVERY' as const,
        serviceName: 'Livraison express',
        serviceDate: booking.scheduledDate.toISOString(),
        serviceTime: '09:00',

        // ✅ Informations de facturation
        invoiceNumber: invoiceNumber,
        invoiceUrl: `${TEST_CONFIG.baseUrl}/invoices/${invoiceNumber}`,

        // ✅ URLs d'action (obligatoires)
        viewBookingUrl: `${TEST_CONFIG.baseUrl}/bookings/${booking.id}`,
        downloadInvoiceUrl: `${TEST_CONFIG.baseUrl}/invoices/${invoiceNumber}/download`,
        supportUrl: `${TEST_CONFIG.baseUrl}/support`,

        // Configuration
        companyName: 'Express Quote SARL',
        companyAddress: '123 Avenue des Devis, 75001 Paris',
        companyPhone: '+33123456789',
        companyEmail: 'contact@express-quote.fr',

        // Politiques
        refundPolicy: 'Remboursement possible jusqu\'à 48h avant la prestation',
        cancellationPolicy: 'Annulation gratuite jusqu\'à 24h avant la prestation',

        // Contexte
        trigger: 'payment_completed'
      }
    };

    try {
      const result = await notificationService.sendEmail(notificationData);
      logger.info('✅ Notification payment-confirmation envoyée', { result });
    } catch (error) {
      logger.warn('⚠️ Erreur envoi notification (peut être normal si service non disponible)', { error });
    }

    // 3. Attendre que la notification soit créée
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. Vérifier la notification
    const notifications = await prisma.notifications.findMany({
      where: {
        recipient_id: TEST_CONFIG.customer.email,
        template_id: 'payment-confirmation',
        created_at: {
          gte: new Date(Date.now() - 60000)
        }
      },
      orderBy: { created_at: 'desc' },
      take: 1
    });

    expect(notifications.length).toBeGreaterThan(0);
    const notification = notifications[0];

    // ✅ Vérifier le template_id
    expect(notification.template_id).toBe('payment-confirmation');

    // ✅ Vérifier les données complètes
    const templateData = notification.template_data as any;
    expect(templateData.customerName).toBeDefined();
    expect(templateData.amount).toBe(booking.totalAmount);
    expect(templateData.transactionId).toBe(transactionId);
    expect(templateData.paymentDate).toBeDefined();
    expect(templateData.bookingReference).toBe(booking.id);
    expect(templateData.invoiceNumber).toBe(invoiceNumber);
    expect(templateData.viewBookingUrl).toBeDefined();

    // ✅ CRITIQUE : Vérifier que React Email a généré le HTML complet
    const bodyLength = notification.body?.length || 0;
    logger.info(`📊 [payment-confirmation] bodyLength: ${bodyLength} caractères`);

    // React Email complet doit générer > 10000 caractères
    expect(bodyLength).toBeGreaterThan(10000);

    logger.info('✅ Test payment-confirmation réussi', {
      template_id: notification.template_id,
      bodyLength,
      hasAllFields: true
    });
  }, 30000);
});
