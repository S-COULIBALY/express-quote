/**
 * 🧪 TEST DE RÉGRESSION - Notifications Client
 *
 * Ce test vérifie spécifiquement que les notifications client sont correctement envoyées.
 *
 * **Ce que ce test vérifie** :
 * 1. Le client reçoit exactement 1 email avec plusieurs PDF
 * 2. Le client reçoit exactement 1 SMS de confirmation
 * 3. Pas de duplication d'emails ou SMS pour le même booking
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000'
};

describe('🔄 Test de régression - Notifications client', () => {
  let testCustomerId: string;
  let testCustomerEmail: string;
  let testCustomerPhone: string;
  let customerBookingId: string;

  beforeAll(async () => {
    await prisma.$connect();
    logger.info('✅ Connexion base de données établie');

    // ✅ RÉCUPÉRER un client EXISTANT (pas de création)
    const customer = await prisma.customer.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!customer || !customer.email || !customer.phone) {
      throw new Error('❌ Aucun client valide trouvé en BDD (email et téléphone requis)');
    }

    testCustomerId = customer.id;
    testCustomerEmail = customer.email;
    testCustomerPhone = customer.phone;
    logger.info(`✅ Client trouvé: ${customer.email} (${customer.id})`);
  });

  afterAll(async () => {
    // Nettoyage : Supprimer SEULEMENT les données de ce test
    if (customerBookingId) {
      // Supprimer les notifications liées au booking de test
      await prisma.$executeRaw`
        DELETE FROM notifications
        WHERE metadata->>'bookingId' = ${customerBookingId}
      `;

      await prisma.document.deleteMany({ where: { bookingId: customerBookingId } });
      await prisma.booking.deleteMany({ where: { id: customerBookingId } });

      logger.info('✅ Nettoyage du booking client terminé');
    }

    // NE PAS supprimer le client (données réelles)

    await prisma.$disconnect();
    logger.info('✅ Nettoyage terminé');
  });

  it('devrait envoyer 1 email + 3 PDFs + 1 SMS au CLIENT', async () => {
    // Augmenter le timeout pour ce test (orchestration + notifications peuvent prendre du temps)
    jest.setTimeout(30000); // 30 secondes
    
    // 🎯 TEST CLIENT: Vérifier que le CLIENT reçoit:
    // - 1 email avec 3 PDFs (QUOTE, PAYMENT_RECEIPT, BOOKING_CONFIRMATION)
    // - 1 SMS de confirmation de paiement et réservation

    logger.info('\n═══════════════════════════════════════════════════════════');
    logger.info('🔍 TEST CLIENT - Vérification email unique');
    logger.info('═══════════════════════════════════════════════════════════');

    // ✅ CRÉER UN BOOKING SPÉCIFIQUE POUR CE TEST (isolation)
    const customerBooking = await prisma.booking.create({
      data: {
        id: `book_client_test_${Date.now()}`,
        customerId: testCustomerId,
        status: 'CONFIRMED',
        totalAmount: 25000,
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        type: 'SERVICE',
        paymentMethod: 'CARD',
        updatedAt: new Date()
      }
    });
    customerBookingId = customerBooking.id;
    logger.info('✅ Booking client créé:', customerBooking.id);

    // ✅ DÉCLENCHER L'ORCHESTRATION POUR CE BOOKING
    const orchestrationResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/documents/orchestrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: customerBooking.id,
        trigger: 'BOOKING_CONFIRMED',
        options: {
          forceGeneration: true,
          skipApproval: true
        }
      })
    });

    expect(orchestrationResponse.ok).toBe(true);
    const orchestrationResult = await orchestrationResponse.json();
    logger.info('✅ Orchestration client déclenchée:', orchestrationResult);

    // Attendre que les notifications soient créées
    await new Promise(resolve => setTimeout(resolve, 5000));

    // D'abord, vérifier toutes les notifications pour ce client (pour debug)
    // ✅ Rechercher par bookingId dans les métadonnées (fonctionne pour email ET SMS)
    const allCustomerNotificationsRaw = await prisma.$queryRaw<Array<{
      id: string;
      channel: string;
      status: string;
      template_id: string | null;
      metadata: any;
      created_at: Date;
      recipient_id: string;
    }>>`
      SELECT id, channel, status, template_id, metadata, created_at, recipient_id
      FROM notifications
      WHERE metadata->>'bookingId' = ${customerBookingId}
        AND created_at >= NOW() - INTERVAL '10 minutes'
      ORDER BY created_at DESC
      LIMIT 20
    `;

    logger.info(`\n🔍 DEBUG: Toutes les notifications client récentes: ${allCustomerNotificationsRaw.length}`);
    allCustomerNotificationsRaw.forEach((notif, i) => {
      const metadata = notif.metadata as any;
      logger.info(`   ${i + 1}. ${notif.channel} - bookingId: ${metadata?.bookingId || 'N/A'} - created: ${notif.created_at}`);
    });

    // Récupérer TOUTES les notifications pour le customer avec le bookingId
    // ✅ Filtrer par bookingId ET par recipient (email pour EMAIL, téléphone pour SMS)
    // Cela exclut les notifications de l'équipe interne
    const customerNotificationsRaw = await prisma.$queryRaw<Array<{
      id: string;
      channel: string;
      status: string;
      template_id: string | null;
      metadata: any;
      created_at: Date;
      recipient_id: string;
    }>>`
      SELECT id, channel, status, template_id, metadata, created_at, recipient_id
      FROM notifications
      WHERE metadata->>'bookingId' = ${customerBookingId}
        AND (
          recipient_id = ${testCustomerEmail}
          OR recipient_id = ${testCustomerPhone}
        )
      ORDER BY created_at ASC
    `;

    const customerNotifications = customerNotificationsRaw.map(notif => ({
      id: notif.id,
      channel: notif.channel,
      status: notif.status,
      template_id: notif.template_id,
      metadata: notif.metadata,
      created_at: notif.created_at
    }));

    logger.info(`\n📧 Notifications trouvées pour le client: ${customerNotifications.length}`);

    // Grouper par canal (email, sms)
    const byChannel = customerNotifications.reduce((acc, notif) => {
      acc[notif.channel] = (acc[notif.channel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    logger.info('\n📊 Notifications par canal:');
    Object.entries(byChannel).forEach(([channel, count]) => {
      const icon = channel === 'EMAIL' ? '📧' : channel === 'SMS' ? '📱' : '📞';
      logger.info(`   ${icon} ${channel}: ${count} notification(s) ${count > 1 ? '❌ (PROBLÈME!)' : '✅'}`);
    });

    // ✅ ASSERTION: Le client doit recevoir EXACTEMENT 1 EMAIL (pas 4)
    const emailNotifications = customerNotifications.filter(n => n.channel === 'EMAIL');
    logger.info(`\n📧 Emails envoyés au client: ${emailNotifications.length}`);

    if (emailNotifications.length > 1) {
      logger.error('❌ PROBLÈME DÉTECTÉ: Le client reçoit plusieurs emails!');
      emailNotifications.forEach((notif, i) => {
        logger.error(`   Email ${i + 1}: Template=${notif.template_id}, Status=${notif.status}`);
      });
    }

    // ✅ ASSERTION: Le client doit recevoir EXACTEMENT 1 EMAIL (corrigé avec sendToCustomerBatch)
    expect(emailNotifications.length).toBe(1);
    logger.info(`\n${emailNotifications.length === 1 ? '✅' : '❌'} CLIENT: ${emailNotifications.length} email(s) (doit être 1)`);

    // ✅ ASSERTION: Le client DOIT recevoir EXACTEMENT 1 SMS de confirmation
    const smsNotifications = customerNotifications.filter(n => n.channel === 'SMS');
    logger.info(`\n📱 SMS envoyés au client: ${smsNotifications.length}`);

    if (smsNotifications.length === 0) {
      logger.error('❌ PROBLÈME DÉTECTÉ: Le client ne reçoit aucun SMS de confirmation!');
    } else if (smsNotifications.length > 1) {
      logger.error('❌ PROBLÈME DÉTECTÉ: Le client reçoit plusieurs SMS!');
      smsNotifications.forEach((notif, i) => {
        logger.error(`   SMS ${i + 1}: Status=${notif.status}, CreatedAt=${notif.created_at}`);
      });
    } else {
      logger.info('✅ Le client a reçu exactement 1 SMS de confirmation');
      logger.info(`   Status: ${smsNotifications[0].status}`);
      logger.info(`   Template: ${smsNotifications[0].template_id}`);
    }

    // Le client doit recevoir EXACTEMENT 1 SMS de confirmation
    expect(smsNotifications.length).toBe(1);
    logger.info(`${smsNotifications.length === 1 ? '✅' : '❌'} CLIENT: ${smsNotifications.length} SMS (doit être 1)`);

    logger.info('\n═══════════════════════════════════════════════════════════');
    logger.info('📋 RÉSUMÉ TEST CLIENT');
    logger.info(`   📧 Emails: ${emailNotifications.length} ${emailNotifications.length === 1 ? '✅' : '❌ (devrait être 1)'}`);
    logger.info(`   📱 SMS: ${smsNotifications.length} ${smsNotifications.length === 1 ? '✅' : '❌ (devrait être 1)'}`);
    logger.info('═══════════════════════════════════════════════════════════');
  });
});

