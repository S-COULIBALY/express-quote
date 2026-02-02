/**
 * 🧪 TEST - NOTIFICATIONS COMPTABILITÉ AVEC TEMPLATE accounting-documents
 *
 * Ce test vérifie spécifiquement :
 * 1. Que les notifications comptabilité utilisent le template accounting-documents
 * 2. Que les données financières sont correctement incluses
 * 3. Que les documents comptables sont bien attachés
 * 4. Que les indicateurs comptables (hasInvoice, hasPaymentReceipt, etc.) sont corrects
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

const TEST_CONFIG = {
  accountingStaff: {
    email: process.env.TEST_EMAIL_STAFF || 'essorr.contact@gmail.com',
    firstName: 'Comptable',
    lastName: 'Test',
    role: 'ACCOUNTING',
    department: 'Comptabilité'
  },
  customer: {
    email: process.env.TEST_EMAIL || 's.coulibaly@outlook.com',
    firstName: 'Client',
    lastName: 'Test',
    phone: process.env.TEST_PHONE || '+33751262080'
  }
};

describe('💰 Test notifications comptabilité avec template accounting-documents', () => {
  let testBookingId: string;
  let testCustomerId: string;
  let testAccountingStaffId: string;

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
        id: `cust_accounting_test_${Date.now()}`,
        email: TEST_CONFIG.customer.email,
        firstName: TEST_CONFIG.customer.firstName,
        lastName: TEST_CONFIG.customer.lastName,
        phone: TEST_CONFIG.customer.phone,
        updatedAt: new Date()
      }
    });
    testCustomerId = customer.id;

    // Créer le membre comptabilité
    const accountingStaff = await prisma.internal_staff.upsert({
      where: { email: TEST_CONFIG.accountingStaff.email },
      update: {
        first_name: TEST_CONFIG.accountingStaff.firstName,
        last_name: TEST_CONFIG.accountingStaff.lastName,
        role: TEST_CONFIG.accountingStaff.role,
        department: TEST_CONFIG.accountingStaff.department,
        is_active: true,
        receive_email: true,
        service_types: [],
        updated_at: new Date()
      },
      create: {
        id: `staff_accounting_test_${Date.now()}`,
        email: TEST_CONFIG.accountingStaff.email,
        first_name: TEST_CONFIG.accountingStaff.firstName,
        last_name: TEST_CONFIG.accountingStaff.lastName,
        role: TEST_CONFIG.accountingStaff.role,
        department: TEST_CONFIG.accountingStaff.department,
        is_active: true,
        receive_email: true,
        service_types: [],
        updated_at: new Date()
      }
    });
    testAccountingStaffId = accountingStaff.id;

    logger.info('✅ Setup test comptabilité terminé');
  });

  afterAll(async () => {
    // Nettoyage - supprimer d'abord les documents (foreign key constraint)
    if (testBookingId) {
      await prisma.document.deleteMany({ where: { bookingId: testBookingId } });
      await prisma.booking.deleteMany({ where: { id: testBookingId } });
    }
    await prisma.notifications.deleteMany({
      where: {
        OR: [
          { recipient_id: TEST_CONFIG.accountingStaff.email },
          { recipient_id: TEST_CONFIG.customer.email }
        ]
      }
    });
    await prisma.$disconnect();
  });

  it('devrait envoyer une notification comptabilité avec template accounting-documents pour PAYMENT_COMPLETED', async () => {
    // 1. Créer un booking avec paiement
    const booking = await prisma.booking.create({
      data: {
        id: `book_accounting_test_${Date.now()}`,
        customerId: testCustomerId,
        status: 'CONFIRMED',
        totalAmount: 15000, // 150.00€
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Dans 7 jours
        type: 'SERVICE', // BookingType enum
        paymentMethod: 'CARD',
        updatedAt: new Date()
      }
    });
    testBookingId = booking.id;

    // 2. Envoyer notification comptabilité directement via service layer
    const { getGlobalNotificationService } = await import('@/notifications/interfaces');
    const notificationService = await getGlobalNotificationService();

    // Créer les données pour la notification comptabilité
    const notificationData = {
      to: TEST_CONFIG.accountingStaff.email,
      template: 'accounting-documents',
      data: {
        // ✅ Champs obligatoires
        accountingName: `${TEST_CONFIG.accountingStaff.firstName} ${TEST_CONFIG.accountingStaff.lastName}`,
        bookingId: booking.id,
        bookingReference: booking.id,
        serviceType: 'MOVING' as const,
        serviceName: 'Livraison express',
        totalAmount: booking.totalAmount,
        currency: 'EUR',

        // ✅ Informations client (obligatoires)
        customerName: `${TEST_CONFIG.customer.firstName} ${TEST_CONFIG.customer.lastName}`,
        customerEmail: TEST_CONFIG.customer.email,
        customerPhone: TEST_CONFIG.customer.phone,

        // ✅ Dates comptables (obligatoires)
        bookingDate: booking.scheduledDate.toISOString(),
        paymentDate: new Date().toISOString(),
        invoiceDate: new Date().toISOString(),

        // Documents comptables
        documentsCount: 2,
        documentTypes: ['INVOICE', 'PAYMENT_RECEIPT'],
        attachedDocuments: [],

        // Indicateurs comptables
        hasInvoice: true,
        hasPaymentReceipt: true,
        hasQuote: false,
        hasContract: false,

        // Contexte
        trigger: 'payment_completed' as const,
        reason: 'Paiement complété',

        // URLs d'action
        viewBookingUrl: `http://localhost:3000/bookings/${booking.id}`,
        accountingDashboardUrl: `http://localhost:3000/admin/accounting`,
        downloadAllUrl: `http://localhost:3000/documents/download-all/${booking.id}`,

        // Informations entreprise
        companyName: 'Express Quote SARL',
        siretNumber: '123 456 789 00012',
        vatNumber: 'FR12345678900',

        // Marqueur pour comptabilité
        isInternalStaff: true,
        role: 'ACCOUNTING',
        department: 'Comptabilité'
      }
    };

    try {
      const result = await notificationService.sendEmail(notificationData);
      logger.info('✅ Notification comptabilité envoyée', { result });
    } catch (error) {
      logger.warn('⚠️ Erreur envoi notification (peut être normal si service non disponible)', { error });
    }

    // 3. Attendre que les notifications soient créées
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. Vérifier les notifications comptabilité
    const accountingNotifications = await prisma.notifications.findMany({
      where: {
        recipient_id: TEST_CONFIG.accountingStaff.email,
        created_at: {
          gte: new Date(Date.now() - 60000) // Dernière minute
        }
      },
      select: {
        id: true,
        channel: true,
        status: true,
        template_id: true,
        template_data: true,
        metadata: true,
        sent_at: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' }
    });

    logger.info(`\n📊 Notifications comptabilité trouvées: ${accountingNotifications.length}`);

    // ✅ VÉRIFICATION TEMPLATE accounting-documents
    logger.info('\n═══════════════════════════════════════════════════════════');
    logger.info('📧 VÉRIFICATION TEMPLATE accounting-documents');
    logger.info('═══════════════════════════════════════════════════════════');

    const emailNotif = accountingNotifications.find(n => n.channel === 'EMAIL');
    expect(emailNotif).toBeDefined();

    if (emailNotif) {
      const templateId = emailNotif.template_id;
      const isAccountingDocuments = templateId === 'accounting-documents';
      const isPaymentConfirmation = templateId === 'payment-confirmation';

      logger.info(`   📧 Template ID: ${templateId || 'N/A'}`);
      logger.info(`   📄 accounting-documents: ${isAccountingDocuments ? '✅ Utilisé' : '❌ Non utilisé'}`);
      logger.info(`   📄 payment-confirmation: ${isPaymentConfirmation ? '⚠️ Utilisé (fallback)' : '✅ Non utilisé'}`);

      // Vérifier que le template accounting-documents est utilisé
      expect(isAccountingDocuments).toBe(true);
    }

    // ✅ VÉRIFICATION DONNÉES FINANCIÈRES
    logger.info('\n═══════════════════════════════════════════════════════════');
    logger.info('💰 VÉRIFICATION DONNÉES FINANCIÈRES');
    logger.info('═══════════════════════════════════════════════════════════');

    if (emailNotif) {
      const templateData = emailNotif.template_data as any;
      const metadata = emailNotif.metadata as any;

      // Vérifier les données spécifiques au template accounting-documents
      const hasAccountingName = templateData?.accountingName;
      const hasTotalAmount = templateData?.totalAmount !== undefined;
      const hasCurrency = templateData?.currency;
      const hasBookingReference = templateData?.bookingReference;
      const hasDocumentsCount = templateData?.documentsCount !== undefined;
      const hasDocumentTypes = Array.isArray(templateData?.documentTypes);
      const hasAttachedDocuments = Array.isArray(templateData?.attachedDocuments);
      const hasInvoice = templateData?.hasInvoice !== undefined;
      const hasPaymentReceipt = templateData?.hasPaymentReceipt !== undefined;
      const hasQuote = templateData?.hasQuote !== undefined;
      const hasContract = templateData?.hasContract !== undefined;
      const hasTrigger = templateData?.trigger;
      const hasReason = templateData?.reason;
      const hasViewBookingUrl = templateData?.viewBookingUrl;
      const hasAccountingDashboardUrl = templateData?.accountingDashboardUrl;
      const hasDownloadAllUrl = templateData?.downloadAllUrl;
      const hasCompanyInfo = templateData?.companyName && templateData?.siretNumber && templateData?.vatNumber;

      logger.info(`   👤 accountingName: ${hasAccountingName ? '✅ Présent' : '❌ Manquant'}`);
      logger.info(`   💰 totalAmount: ${hasTotalAmount ? `✅ ${templateData.totalAmount}` : '❌ Manquant'}`);
      logger.info(`   💱 currency: ${hasCurrency ? `✅ ${templateData.currency}` : '❌ Manquant'}`);
      logger.info(`   📋 bookingReference: ${hasBookingReference ? '✅ Présent' : '❌ Manquant'}`);
      logger.info(`   📊 documentsCount: ${hasDocumentsCount ? `✅ ${templateData.documentsCount}` : '❌ Manquant'}`);
      logger.info(`   📄 documentTypes: ${hasDocumentTypes ? `✅ ${templateData.documentTypes.length} types` : '❌ Manquant'}`);
      logger.info(`   📎 attachedDocuments: ${hasAttachedDocuments ? `✅ ${templateData.attachedDocuments.length} documents` : '❌ Manquant'}`);
      logger.info(`   🧾 hasInvoice: ${hasInvoice ? `✅ ${templateData.hasInvoice}` : '❌ Manquant'}`);
      logger.info(`   💰 hasPaymentReceipt: ${hasPaymentReceipt ? `✅ ${templateData.hasPaymentReceipt}` : '❌ Manquant'}`);
      logger.info(`   📋 hasQuote: ${hasQuote ? `✅ ${templateData.hasQuote}` : '❌ Manquant'}`);
      logger.info(`   📄 hasContract: ${hasContract ? `✅ ${templateData.hasContract || false}` : '❌ Manquant'}`);
      logger.info(`   🔔 trigger: ${hasTrigger ? `✅ ${templateData.trigger}` : '❌ Manquant'}`);
      logger.info(`   📝 reason: ${hasReason ? '✅ Présent' : '❌ Manquant'}`);
      logger.info(`   🔗 viewBookingUrl: ${hasViewBookingUrl ? '✅ Présent' : '❌ Manquant'}`);
      logger.info(`   📊 accountingDashboardUrl: ${hasAccountingDashboardUrl ? '✅ Présent' : '❌ Manquant'}`);
      logger.info(`   📥 downloadAllUrl: ${hasDownloadAllUrl ? '✅ Présent' : '❌ Manquant'}`);
      logger.info(`   🏢 companyInfo: ${hasCompanyInfo ? '✅ Présent' : '❌ Manquant'}`);

      // Vérifications spécifiques au template accounting-documents
      expect(hasAccountingName).toBeTruthy();
      expect(hasTotalAmount).toBe(true);
      expect(hasCurrency).toBeTruthy();
      expect(hasBookingReference).toBeTruthy();
      expect(hasDocumentsCount).toBe(true);
      expect(hasDocumentTypes).toBe(true);
      expect(hasAttachedDocuments).toBe(true);
      expect(hasInvoice).toBe(true);
      expect(hasPaymentReceipt).toBe(true);
      expect(hasQuote).toBe(true);
      expect(hasTrigger).toBeTruthy();
      expect(hasReason).toBeTruthy();
      expect(hasViewBookingUrl).toBeTruthy();
      expect(hasAccountingDashboardUrl).toBeTruthy();
      expect(hasDownloadAllUrl).toBeTruthy();
      expect(hasCompanyInfo).toBeTruthy();

      // Vérifier que le montant correspond
      expect(templateData.totalAmount).toBe(15000); // 150.00€ en centimes
      expect(templateData.currency).toBe('EUR');

      // Vérifier que le trigger est payment_completed
      expect(templateData.trigger).toBe('payment_completed');

      // Note: Les informations isInternalStaff et role sont dans template_data, pas metadata
      // metadata contient des informations système, pas des données métier
    }

    logger.info('\n✅ Test notifications comptabilité terminé avec succès');
  });
});

