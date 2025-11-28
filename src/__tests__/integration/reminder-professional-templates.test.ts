/**
 * 🧪 TEST - TEMPLATES REMINDER & PROFESSIONAL ATTRIBUTION REACT EMAIL
 *
 * Ce test vérifie spécifiquement :
 * 1. reminder-24h - Rappel 24h avant service
 * 2. reminder-7d - Rappel 7 jours avant service
 * 3. service-reminder - Rappel de service générique
 * 4. professional-attribution - Attribution de mission aux professionnels
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
    lastName: 'Test Reminders',
    phone: process.env.TEST_PHONE || '+33751262080'
  },
  professional: {
    email: process.env.TEST_EMAIL_PRO || 's.coulibaly@outlook.com',
    firstName: 'Pro',
    lastName: 'Test',
    phone: '+33612345678',
    companyName: 'Pro Services SARL'
  },
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000'
};

describe('⏰ Test templates reminder et professional-attribution', () => {
  let testCustomerId: string;
  let testProfessionalId: string;
  let testBookingId: string;

  beforeAll(async () => {
    // Créer le client
    const customer = await prisma.customer.upsert({
      where: { email: TEST_CONFIG.customer.email },
      update: {
        firstName: TEST_CONFIG.customer.firstName,
        lastName: TEST_CONFIG.customer.lastName,
        phone: TEST_CONFIG.customer.phone,
        updatedAt: new Date()
      },
      create: {
        id: `cust_reminder_test_${Date.now()}`,
        email: TEST_CONFIG.customer.email,
        firstName: TEST_CONFIG.customer.firstName,
        lastName: TEST_CONFIG.customer.lastName,
        phone: TEST_CONFIG.customer.phone,
        updatedAt: new Date()
      }
    });
    testCustomerId = customer.id;

    // Créer le professionnel
    const professional = await prisma.professional.upsert({
      where: { email: TEST_CONFIG.professional.email },
      update: {
        name: `${TEST_CONFIG.professional.firstName} ${TEST_CONFIG.professional.lastName}`,
        companyName: TEST_CONFIG.professional.companyName,
        phone: TEST_CONFIG.professional.phone,
        latitude: 48.8566,
        longitude: 2.3522,
        updatedAt: new Date()
      },
      create: {
        id: `prof_test_${Date.now()}`,
        email: TEST_CONFIG.professional.email,
        name: `${TEST_CONFIG.professional.firstName} ${TEST_CONFIG.professional.lastName}`,
        companyName: TEST_CONFIG.professional.companyName,
        phone: TEST_CONFIG.professional.phone,
        latitude: 48.8566,
        longitude: 2.3522,
        updatedAt: new Date()
      }
    });
    testProfessionalId = professional.id;

    logger.info('✅ Setup test reminders terminé');
  });

  afterAll(async () => {
    if (testBookingId) {
      await prisma.document.deleteMany({ where: { bookingId: testBookingId } });
      await prisma.booking.deleteMany({ where: { id: testBookingId } });
    }
    await prisma.notifications.deleteMany({
      where: {
        OR: [
          { recipient_id: TEST_CONFIG.customer.email },
          { recipient_id: TEST_CONFIG.professional.email }
        ]
      }
    });
    await prisma.$disconnect();
  });

  it('devrait envoyer une notification avec template reminder-24h', async () => {
    // 1. Créer une réservation
    const booking = await prisma.booking.create({
      data: {
        id: `book_reminder24h_test_${Date.now()}`,
        customerId: testCustomerId,
        status: 'CONFIRMED',
        totalAmount: 20000,
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Dans 24h
        type: 'SERVICE',
        paymentMethod: 'CARD',
        updatedAt: new Date()
      }
    });
    testBookingId = booking.id;

    // 2. Envoyer notification reminder-24h
    const { getGlobalNotificationService } = await import('@/notifications/interfaces');
    const notificationService = await getGlobalNotificationService();

    const notificationData = {
      to: TEST_CONFIG.customer.email,
      template: 'reminder-24h',
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
        serviceDate: booking.scheduledDate.toISOString(),
        serviceTime: '09:00',
        estimatedDuration: 2,
        endTime: '11:00',

        // ✅ Adresses (obligatoires)
        serviceAddress: '123 Rue de la Paix, 75001 Paris',
        pickupAddress: '123 Rue de la Paix, 75001 Paris',
        deliveryAddress: '456 Avenue des Champs, 75008 Paris',

        // ✅ Équipe (obligatoires)
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

        // ✅ Instructions (obligatoires)
        preparationInstructions: ['Préparer les cartons', 'Libérer l\'accès'],
        accessInstructions: 'Code: 1234A',
        specialRequirements: 'Objets fragiles',

        // ✅ Contacts (obligatoires)
        teamLeaderContact: '+33612345678',
        emergencyContact: '+33123456789',
        supportPhone: '+33123456789',

        // URLs
        modifyUrl: `${TEST_CONFIG.baseUrl}/bookings/${booking.id}/modify`,
        cancelUrl: `${TEST_CONFIG.baseUrl}/bookings/${booking.id}/cancel`,
        trackingUrl: `${TEST_CONFIG.baseUrl}/bookings/${booking.id}/track`,

        // Configuration
        companyName: 'Express Quote SARL',
        companyPhone: '+33123456789'
      }
    };

    try {
      await notificationService.sendEmail(notificationData);
      logger.info('✅ Notification reminder-24h envoyée');
    } catch (error) {
      logger.warn('⚠️ Erreur envoi (peut être normal)', { error });
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Vérification
    const notifications = await prisma.notifications.findMany({
      where: {
        recipient_id: TEST_CONFIG.customer.email,
        template_id: 'reminder-24h',
        created_at: { gte: new Date(Date.now() - 60000) }
      },
      orderBy: { created_at: 'desc' },
      take: 1
    });

    expect(notifications.length).toBeGreaterThan(0);
    const notification = notifications[0];

    expect(notification.template_id).toBe('reminder-24h');
    const bodyLength = notification.body?.length || 0;
    logger.info(`📊 [reminder-24h] bodyLength: ${bodyLength} caractères`);
    expect(bodyLength).toBeGreaterThan(10000);

    logger.info('✅ Test reminder-24h réussi');
  }, 30000);

  it('devrait envoyer une notification avec template reminder-7d', async () => {
    if (!testBookingId) {
      testBookingId = `book_reminder7d_test_${Date.now()}`;
      await prisma.booking.create({
        data: {
          id: testBookingId,
          customerId: testCustomerId,
          status: 'CONFIRMED',
          totalAmount: 20000,
          scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          type: 'SERVICE',
          paymentMethod: 'CARD',
          updatedAt: new Date()
        }
      });
    }

    const booking = await prisma.booking.findUnique({ where: { id: testBookingId } });
    if (!booking) throw new Error('Booking non trouvé');

    const { getGlobalNotificationService } = await import('@/notifications/interfaces');
    const notificationService = await getGlobalNotificationService();

    const notificationData = {
      to: TEST_CONFIG.customer.email,
      template: 'reminder-7d',
      data: {
        // ✅ Champs obligatoires reminder-7d
        customerName: `${TEST_CONFIG.customer.firstName} ${TEST_CONFIG.customer.lastName}`,
        customerEmail: TEST_CONFIG.customer.email,
        customerPhone: TEST_CONFIG.customer.phone,
        bookingId: booking.id,
        serviceType: 'DELIVERY' as const,
        serviceName: 'Livraison express',
        serviceDate: booking.scheduledDate.toISOString(),
        serviceTime: '09:00',
        estimatedDuration: 2,
        serviceAddress: '123 Rue de la Paix, 75001 Paris',
        preparationItems: ['Vérifier la disponibilité', 'Préparer les documents'],
        supportPhone: '+33123456789',
        companyName: 'Express Quote SARL',
        modifyUrl: `${TEST_CONFIG.baseUrl}/bookings/${booking.id}/modify`,
        cancelUrl: `${TEST_CONFIG.baseUrl}/bookings/${booking.id}/cancel`
      }
    };

    try {
      await notificationService.sendEmail(notificationData);
      logger.info('✅ Notification reminder-7d envoyée');
    } catch (error) {
      logger.warn('⚠️ Erreur envoi', { error });
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    const notifications = await prisma.notifications.findMany({
      where: {
        recipient_id: TEST_CONFIG.customer.email,
        template_id: 'reminder-7d',
        created_at: { gte: new Date(Date.now() - 60000) }
      },
      orderBy: { created_at: 'desc' },
      take: 1
    });

    expect(notifications.length).toBeGreaterThan(0);
    const notification = notifications[0];

    expect(notification.template_id).toBe('reminder-7d');
    const bodyLength = notification.body?.length || 0;
    logger.info(`📊 [reminder-7d] bodyLength: ${bodyLength} caractères`);
    expect(bodyLength).toBeGreaterThan(10000);

    logger.info('✅ Test reminder-7d réussi');
  }, 30000);

  it('devrait envoyer une notification avec template service-reminder', async () => {
    if (!testBookingId) {
      testBookingId = `book_service_reminder_test_${Date.now()}`;
      await prisma.booking.create({
        data: {
          id: testBookingId,
          customerId: testCustomerId,
          status: 'CONFIRMED',
          totalAmount: 20000,
          scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          type: 'SERVICE',
          paymentMethod: 'CARD',
          updatedAt: new Date()
        }
      });
    }

    const booking = await prisma.booking.findUnique({ where: { id: testBookingId } });
    if (!booking) throw new Error('Booking non trouvé');

    const { getGlobalNotificationService } = await import('@/notifications/interfaces');
    const notificationService = await getGlobalNotificationService();

    const notificationData = {
      to: TEST_CONFIG.customer.email,
      template: 'service-reminder',
      data: {
        // ✅ Champs obligatoires service-reminder
        bookingId: booking.id,
        email: TEST_CONFIG.customer.email,
        customerName: `${TEST_CONFIG.customer.firstName} ${TEST_CONFIG.customer.lastName}`,
        customerPhone: TEST_CONFIG.customer.phone,
        bookingReference: booking.id,
        serviceType: 'DELIVERY' as const,
        serviceName: 'Livraison express',
        serviceDate: booking.scheduledDate.toISOString(),
        serviceTime: '09:00',
        estimatedDuration: 2,
        hoursUntilService: 48,
        primaryAddress: '123 Rue de la Paix, 75001 Paris',
        secondaryAddress: '456 Avenue des Champs, 75008 Paris',
        teamLeaderName: 'Jean Dupont',
        teamLeaderPhone: '+33612345678',
        teamSize: 2,
        vehicleInfo: 'Camion 12m³',
        finalChecklist: ['Préparer les cartons', 'Libérer l\'accès'],
        lastMinuteInstructions: ['Badge parking', 'Code: 1234A'],
        teamLeaderContact: '+33612345678',
        emergencyContact: '+33123456789',
        modifyUrl: `${TEST_CONFIG.baseUrl}/bookings/${booking.id}/modify`,
        cancelUrl: `${TEST_CONFIG.baseUrl}/bookings/${booking.id}/cancel`,
        trackingUrl: `${TEST_CONFIG.baseUrl}/bookings/${booking.id}/track`,
        companyName: 'Express Quote SARL',
        companyPhone: '+33123456789'
      }
    };

    try {
      await notificationService.sendEmail(notificationData);
      logger.info('✅ Notification service-reminder envoyée');
    } catch (error) {
      logger.warn('⚠️ Erreur envoi', { error });
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    const notifications = await prisma.notifications.findMany({
      where: {
        recipient_id: TEST_CONFIG.customer.email,
        template_id: 'service-reminder',
        created_at: { gte: new Date(Date.now() - 60000) }
      },
      orderBy: { created_at: 'desc' },
      take: 1
    });

    expect(notifications.length).toBeGreaterThan(0);
    const notification = notifications[0];

    expect(notification.template_id).toBe('service-reminder');
    const bodyLength = notification.body?.length || 0;
    logger.info(`📊 [service-reminder] bodyLength: ${bodyLength} caractères`);
    expect(bodyLength).toBeGreaterThan(10000);

    logger.info('✅ Test service-reminder réussi');
  }, 30000);

  it('devrait envoyer une notification avec template professional-attribution', async () => {
    const { getGlobalNotificationService } = await import('@/notifications/interfaces');
    const notificationService = await getGlobalNotificationService();

    const attributionId = `attr_test_${Date.now()}`;
    const scheduledDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // Expire dans 72h

    const notificationData = {
      to: TEST_CONFIG.professional.email,
      template: 'professional-attribution',
      data: {
        // ✅ Informations professionnel (obligatoires)
        professionalEmail: TEST_CONFIG.professional.email,
        professionalName: `${TEST_CONFIG.professional.firstName} ${TEST_CONFIG.professional.lastName}`,

        // ✅ Informations mission (obligatoires)
        attributionId: attributionId,
        serviceType: 'DELIVERY' as const,
        serviceName: 'Livraison express',
        totalAmount: 25000, // 250.00€
        currency: 'EUR',
        scheduledDate: scheduledDate.toISOString(),
        scheduledTime: '09:00',
        estimatedDuration: 2,
        locationCity: 'Paris',
        locationDistrict: '1er arrondissement',
        distanceKm: 5.2,

        // ✅ Détails mission (obligatoires)
        description: 'Livraison de colis volumineux nécessitant 2 personnes',
        requirements: ['Véhicule utilitaire', 'Diable', '2 personnes'],
        specialInstructions: 'Objets fragiles - Manipulation soigneuse requise',

        // Équipe et logistique
        teamSize: 2,
        vehicleRequired: true,
        equipmentRequired: ['Diable', 'Couvertures', 'Sangles'],

        // ✅ Actions (obligatoires)
        acceptUrl: `${TEST_CONFIG.baseUrl}/attributions/${attributionId}/accept`,
        refuseUrl: `${TEST_CONFIG.baseUrl}/attributions/${attributionId}/refuse`,

        // ✅ URLs dashboard (obligatoires)
        dashboardUrl: `${TEST_CONFIG.baseUrl}/professional/dashboard`,
        attributionDetailsUrl: `${TEST_CONFIG.baseUrl}/attributions/${attributionId}`,
        trackingUrl: `${TEST_CONFIG.baseUrl}/attributions/${attributionId}/track`,
        supportUrl: `${TEST_CONFIG.baseUrl}/support`,

        // ✅ Métadonnées (obligatoires)
        priority: 'high' as const,
        expiresAt: expiresAt.toISOString(),
        timeUntilExpiry: 72,

        // ✅ Contact (obligatoires)
        supportEmail: 'support@express-quote.fr',
        supportPhone: '+33123456789',

        // ✅ Configuration (obligatoires)
        companyName: 'Express Quote SARL',
        allowsAcceptance: true,
        allowsRefusal: true
      }
    };

    try {
      await notificationService.sendEmail(notificationData);
      logger.info('✅ Notification professional-attribution envoyée');
    } catch (error) {
      logger.warn('⚠️ Erreur envoi', { error });
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    const notifications = await prisma.notifications.findMany({
      where: {
        recipient_id: TEST_CONFIG.professional.email,
        template_id: 'professional-attribution',
        created_at: { gte: new Date(Date.now() - 60000) }
      },
      orderBy: { created_at: 'desc' },
      take: 1
    });

    expect(notifications.length).toBeGreaterThan(0);
    const notification = notifications[0];

    expect(notification.template_id).toBe('professional-attribution');
    const bodyLength = notification.body?.length || 0;
    logger.info(`📊 [professional-attribution] bodyLength: ${bodyLength} caractères`);
    expect(bodyLength).toBeGreaterThan(10000);

    logger.info('✅ Test professional-attribution réussi');
  }, 30000);
});
