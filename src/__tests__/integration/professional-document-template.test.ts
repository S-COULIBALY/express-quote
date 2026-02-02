/**
 * 🧪 TEST - TEMPLATE PROFESSIONAL-DOCUMENT REACT EMAIL
 *
 * Ce test vérifie spécifiquement :
 * 1. professional-document - Template pour responsables internes
 *
 * ✅ Validation :
 * - Tous les champs obligatoires sont fournis
 * - Le rendu React Email fonctionne (bodyLength > 10000)
 * - Le template_id correspond au template React Email
 * - Les template_data contiennent toutes les données
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

const TEST_CONFIG = {
  internalStaff: {
    email: process.env.TEST_EMAIL_STAFF || 'essorr.contact@gmail.com',
    firstName: 'Responsable',
    lastName: 'Test',
    role: 'OPERATIONS',
    department: 'Opérations'
  },
  customer: {
    email: process.env.TEST_EMAIL || 's.coulibaly@outlook.com',
    firstName: 'Client',
    lastName: 'Test',
    phone: process.env.TEST_PHONE || '+33751262080'
  },
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000'
};

describe('📄 Test template professional-document', () => {
  let testCustomerId: string;
  let testInternalStaffId: string;
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
        id: `cust_prof_doc_test_${Date.now()}`,
        email: TEST_CONFIG.customer.email,
        firstName: TEST_CONFIG.customer.firstName,
        lastName: TEST_CONFIG.customer.lastName,
        phone: TEST_CONFIG.customer.phone,
        updatedAt: new Date()
      }
    });
    testCustomerId = customer.id;

    // Créer le membre interne
    const internalStaff = await prisma.internal_staff.upsert({
      where: { email: TEST_CONFIG.internalStaff.email },
      update: {
        first_name: TEST_CONFIG.internalStaff.firstName,
        last_name: TEST_CONFIG.internalStaff.lastName,
        role: TEST_CONFIG.internalStaff.role,
        department: TEST_CONFIG.internalStaff.department,
        is_active: true,
        receive_email: true,
        service_types: [],
        updated_at: new Date()
      },
      create: {
        id: `staff_prof_doc_test_${Date.now()}`,
        email: TEST_CONFIG.internalStaff.email,
        first_name: TEST_CONFIG.internalStaff.firstName,
        last_name: TEST_CONFIG.internalStaff.lastName,
        role: TEST_CONFIG.internalStaff.role,
        department: TEST_CONFIG.internalStaff.department,
        is_active: true,
        receive_email: true,
        service_types: [],
        updated_at: new Date()
      }
    });
    testInternalStaffId = internalStaff.id;

    logger.info('✅ Setup test professional-document terminé');
  });

  afterAll(async () => {
    // Nettoyage
    if (testBookingId) {
      await prisma.document.deleteMany({ where: { bookingId: testBookingId } });
      await prisma.booking.deleteMany({ where: { id: testBookingId } });
    }
    await prisma.notifications.deleteMany({
      where: {
        OR: [
          { recipient_id: TEST_CONFIG.internalStaff.email },
          { recipient_id: TEST_CONFIG.customer.email }
        ]
      }
    });
    await prisma.$disconnect();
  });

  it('devrait envoyer une notification avec template professional-document', async () => {
    // 1. Créer une réservation
    const booking = await prisma.booking.create({
      data: {
        id: `book_prof_doc_test_${Date.now()}`,
        customerId: testCustomerId,
        status: 'CONFIRMED',
        totalAmount: 30000, // 300.00€
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Dans 7 jours
        type: 'SERVICE',
        paymentMethod: 'CARD',
        updatedAt: new Date()
      }
    });
    testBookingId = booking.id;

    // 2. Envoyer notification professional-document
    const { getGlobalNotificationService } = await import('@/notifications/interfaces');
    const notificationService = await getGlobalNotificationService();

    const notificationData = {
      to: TEST_CONFIG.internalStaff.email,
      template: 'professional-document',
      data: {
        // ✅ Données responsable (obligatoires)
        professionalName: `${TEST_CONFIG.internalStaff.firstName} ${TEST_CONFIG.internalStaff.lastName}`,
        role: TEST_CONFIG.internalStaff.role,
        department: TEST_CONFIG.internalStaff.department,

        // ✅ Données intervention (obligatoires)
        bookingId: booking.id,
        bookingReference: booking.id,
        serviceType: 'MOVING' as const,
        serviceName: 'Livraison express',
        totalAmount: booking.totalAmount,
        currency: 'EUR',

        // ✅ Données client (obligatoires)
        customerName: `${TEST_CONFIG.customer.firstName} ${TEST_CONFIG.customer.lastName}`,
        customerEmail: TEST_CONFIG.customer.email,
        customerPhone: TEST_CONFIG.customer.phone,

        // ✅ Données service (obligatoires)
        serviceDate: booking.scheduledDate.toISOString(),
        serviceTime: '09:00',
        serviceAddress: '123 Rue de la Paix, 75001 Paris',

        // ✅ Contexte (obligatoires)
        trigger: 'new_booking',
        reason: 'Nouvelle intervention créée',
        priority: 'MEDIUM' as const,

        // Documents attachés
        attachedDocuments: [
          {
            filename: 'devis.pdf',
            type: 'QUOTE',
            size: 245678,
            url: `${TEST_CONFIG.baseUrl}/documents/devis-${booking.id}.pdf`
          },
          {
            filename: 'contrat.pdf',
            type: 'CONTRACT',
            size: 156432,
            url: `${TEST_CONFIG.baseUrl}/documents/contrat-${booking.id}.pdf`
          }
        ],

        // ✅ URLs (obligatoires)
        viewBookingUrl: `${TEST_CONFIG.baseUrl}/bookings/${booking.id}`,
        planningUrl: `${TEST_CONFIG.baseUrl}/planning`,
        supportUrl: `${TEST_CONFIG.baseUrl}/support`,

        // Info entreprise
        companyName: 'Express Quote SARL',
        supportPhone: '+33123456789',
        supportEmail: 'support@express-quote.fr',

        // Configuration
        unsubscribeUrl: `${TEST_CONFIG.baseUrl}/unsubscribe`,
        preferencesUrl: `${TEST_CONFIG.baseUrl}/preferences`
      }
    };

    try {
      const result = await notificationService.sendEmail(notificationData);
      logger.info('✅ Notification professional-document envoyée', { result });
    } catch (error) {
      logger.warn('⚠️ Erreur envoi notification (peut être normal si service non disponible)', { error });
    }

    // 3. Attendre que la notification soit créée
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. Vérifier la notification
    const notifications = await prisma.notifications.findMany({
      where: {
        recipient_id: TEST_CONFIG.internalStaff.email,
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
    expect(notification.template_id).toBe('professional-document');

    // ✅ Vérifier les données complètes
    const templateData = notification.template_data as any;
    expect(templateData.professionalName).toBeDefined();
    expect(templateData.role).toBe(TEST_CONFIG.internalStaff.role);
    expect(templateData.bookingId).toBe(booking.id);
    expect(templateData.bookingReference).toBe(booking.id);
    expect(templateData.customerName).toBeDefined();
    expect(templateData.customerEmail).toBe(TEST_CONFIG.customer.email);
    expect(templateData.serviceDate).toBeDefined();
    expect(templateData.totalAmount).toBe(booking.totalAmount);
    expect(templateData.trigger).toBe('new_booking');
    expect(templateData.viewBookingUrl).toBeDefined();

    // ✅ CRITIQUE : Vérifier que React Email a généré le HTML complet
    const bodyLength = notification.body?.length || 0;
    logger.info(`📊 [professional-document] bodyLength: ${bodyLength} caractères`);

    // React Email complet doit générer > 10000 caractères
    // Fallback HTML génère 441 caractères
    expect(bodyLength).toBeGreaterThan(10000);

    logger.info('✅ Test professional-document réussi', {
      template_id: notification.template_id,
      bodyLength,
      hasAllFields: true
    });
  }, 30000);
});
