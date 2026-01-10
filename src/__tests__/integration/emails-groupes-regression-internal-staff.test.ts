/**
 * 🧪 TEST DE RÉGRESSION - Emails Groupés Équipe Interne
 *
 * Ce test vérifie spécifiquement que le problème des emails multiples
 * identiques pour l'équipe interne a été résolu.
 *
 * **Problème corrigé** :
 * - AVANT : 4 emails identiques par membre (1 PDF chacun)
 * - APRÈS : 1 email par membre (4 PDF groupés)
 *
 * **Ce que ce test vérifie** :
 * 1. Un seul email envoyé par membre de l'équipe interne
 * 2. Plusieurs PDF dans cet email unique (≥3 PDF)
 * 3. Les types de documents corrects (QUOTE, BOOKING_CONFIRMATION, DELIVERY_NOTE, CONTRACT)
 * 4. Pas de duplication d'emails pour le même booking
 *
 * **Référence** : CORRECTIONS_APPLIQUEES.md - Correction 5 (Problème 3)
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000'
};

describe('🔄 Test de régression - Emails groupés équipe interne', () => {
  let testCustomerId: string;
  let testBookingId: string;
  let activeStaffMembers: Array<{ id: string; email: string; first_name: string; last_name: string }>;

  beforeAll(async () => {
    await prisma.$connect();
    logger.info('✅ Connexion base de données établie');

    // ✅ RÉCUPÉRER les membres d'équipe EXISTANTS (pas de création)
    activeStaffMembers = await prisma.internal_staff.findMany({
      where: {
        is_active: true,
        receive_email: true
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true
      }
    });

    if (activeStaffMembers.length === 0) {
      throw new Error('❌ Aucun membre d\'équipe interne actif trouvé en BDD');
    }

    logger.info(`✅ ${activeStaffMembers.length} membres d'équipe trouvés:`, {
      emails: activeStaffMembers.map(s => s.email)
    });

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
    logger.info(`✅ Client trouvé: ${customer.email} (${customer.id})`);
  });

  afterAll(async () => {
    // Nettoyage : Supprimer SEULEMENT les données de ce test
    if (testBookingId) {
      // Supprimer les notifications liées au booking de test
      await prisma.$executeRaw`
        DELETE FROM notifications
        WHERE metadata->>'bookingId' = ${testBookingId}
      `;

      await prisma.document.deleteMany({ where: { bookingId: testBookingId } });
      await prisma.booking.deleteMany({ where: { id: testBookingId } });

      logger.info('✅ Nettoyage du booking de test:', testBookingId);
    }

    // NE PAS supprimer le client ni les membres d'équipe (données réelles)

    await prisma.$disconnect();
    logger.info('✅ Nettoyage terminé');
  });

  it('devrait envoyer UN SEUL email avec PLUSIEURS PDF à chaque membre de l\'équipe interne', async () => {
    // Étape 1 : Créer un booking
    const booking = await prisma.booking.create({
      data: {
        id: `book_regression_${Date.now()}`,
        customerId: testCustomerId,
        status: 'CONFIRMED',
        totalAmount: 25000, // 250€
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        type: 'SERVICE', // ✅ Type valide selon le schéma Prisma
        paymentMethod: 'CARD',
        updatedAt: new Date()
      }
    });
    testBookingId = booking.id;

    logger.info('✅ Booking créé:', booking.id);

    // Étape 2 : Déclencher l'orchestration
    const orchestrationResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/documents/orchestrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: booking.id,
        trigger: 'BOOKING_CONFIRMED',
        options: {
          forceGeneration: true,
          skipApproval: true
        }
      })
    });

    if (!orchestrationResponse.ok) {
      const errorText = await orchestrationResponse.text();
      logger.error('❌ Erreur orchestration:', {
        status: orchestrationResponse.status,
        statusText: orchestrationResponse.statusText,
        error: errorText
      });
      throw new Error(`Orchestration failed: ${orchestrationResponse.status} - ${errorText}`);
    }
    const orchestrationResult = await orchestrationResponse.json();
    logger.info('✅ Orchestration déclenchée:', orchestrationResult);

    // Attendre que les notifications soient créées et traitées
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 secondes pour laisser le temps aux workers

    // Étape 3 : Vérifier les notifications pour TOUS les membres de l'équipe interne
    const staffEmails = activeStaffMembers.map(s => s.email);

    // ✅ CORRECTION : Utiliser une requête SQL raw pour filtrer par bookingId dans les métadonnées
    // Prisma a des limitations avec les filtres JSON complexes, donc on utilise $queryRaw
    // Construire la condition OR pour chaque email de l'équipe (similaire au test client)
    const emailConditions = staffEmails.map(email => Prisma.sql`recipient_id = ${email}`).reduce(
      (acc, condition, index) => 
        index === 0 ? condition : Prisma.sql`${acc} OR ${condition}`
    );
    
    const internalNotificationsRaw = await prisma.$queryRaw<Array<{
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
      WHERE metadata->>'bookingId' = ${testBookingId}
        AND (${emailConditions})
      ORDER BY created_at DESC
    `;

    const internalNotifications = internalNotificationsRaw.map(notif => ({
      id: notif.id,
      channel: notif.channel,
      status: notif.status,
      recipient_id: notif.recipient_id,
      template_id: notif.template_id,
      metadata: notif.metadata,
      created_at: notif.created_at
    }));

    logger.info(`📧 Notifications trouvées pour ${activeStaffMembers.length} membres: ${internalNotifications.length}`);

    // ✅ TEST CRITIQUE 1 : Un seul email par membre
    const emailNotifications = internalNotifications.filter(n => n.channel === 'EMAIL');

    logger.info('\n═══════════════════════════════════════════════════════════');
    logger.info('🔍 TEST RÉGRESSION - EMAILS MULTIPLES (PROBLÈME 3)');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info(`📧 Total emails trouvés: ${emailNotifications.length}`);
    logger.info(`👥 Membres d'équipe actifs: ${activeStaffMembers.length}`);

    // Grouper par destinataire
    const emailsByRecipient = new Map<string, typeof emailNotifications>();
    emailNotifications.forEach(notif => {
      const existing = emailsByRecipient.get(notif.recipient_id) || [];
      emailsByRecipient.set(notif.recipient_id, [...existing, notif]);
    });

    logger.info('\n📊 Emails par membre:');
    emailsByRecipient.forEach((emails, recipient) => {
      const staffMember = activeStaffMembers.find(s => s.email === recipient);
      logger.info(`   ${staffMember?.first_name} ${staffMember?.last_name} (${recipient}): ${emails.length} email(s) ${emails.length === 1 ? '✅' : '❌'}`);
    });

    // ✅ ASSERTION : Chaque membre doit avoir exactement 1 email
    expect(emailNotifications.length).toBe(activeStaffMembers.length);
    emailsByRecipient.forEach((emails) => {
      expect(emails.length).toBe(1); // Exactement 1 email par membre
    });

    logger.info('\n✅ SUCCÈS: UN SEUL email par membre (pas de duplication)');

    if (emailNotifications.length !== activeStaffMembers.length) {
      logger.error(`❌ RÉGRESSION DÉTECTÉE: ${emailNotifications.length} emails au lieu de ${activeStaffMembers.length}`);
      throw new Error(`RÉGRESSION: ${emailNotifications.length} emails au lieu de ${activeStaffMembers.length}`);
    }

    // ✅ TEST CRITIQUE 2 : Plusieurs PDF dans CHAQUE email
    logger.info('\n📎 Vérification des PDF dans chaque email:');

    emailsByRecipient.forEach((emails, recipient) => {
      const email = emails[0];
      const metadata = email.metadata as any;
      const attachments = metadata?.attachments || [];

      const staffMember = activeStaffMembers.find(s => s.email === recipient);
      logger.info(`\n  ${staffMember?.first_name} ${staffMember?.last_name}:`);
      logger.info(`    📎 ${attachments.length} PDF(s)`);

      // Vérifier que chaque membre a au moins 3 PDF
      expect(attachments.length).toBeGreaterThanOrEqual(3);

      if (attachments.length < 3) {
        logger.error(`    ❌ Seulement ${attachments.length} PDF au lieu de ≥3`);
      }
    });

    // Pour le reste du test, on prend le premier email comme référence
    const emailNotif = emailNotifications[0];
    const emailMetadata = emailNotif.metadata as any;
    const attachments = emailMetadata?.attachments || [];

    logger.info('\n═══════════════════════════════════════════════════════════');
    logger.info('📎 VÉRIFICATION PDF GROUPÉS');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info(`📄 Nombre de PDF dans l'email: ${attachments.length}`);

    // Pour BOOKING_CONFIRMED, on attend 4 documents : QUOTE, BOOKING_CONFIRMATION, DELIVERY_NOTE, CONTRACT
    expect(attachments.length).toBeGreaterThanOrEqual(3);
    logger.info(`✅ SUCCÈS: ${attachments.length} PDF groupés dans un seul email`);

    if (attachments.length < 3) {
      logger.error(`❌ PROBLÈME: Seulement ${attachments.length} PDF trouvé(s) au lieu de ≥3`);
      throw new Error(`Seulement ${attachments.length} PDF au lieu de ≥3`);
    }

    // ✅ TEST CRITIQUE 3 : Vérifier les types de documents
    logger.info('\n📋 Liste des PDF attachés:');
    attachments.forEach((att: any, index: number) => {
      logger.info(`   ${index + 1}. ${att.filename} (${att.size || 'taille inconnue'} octets)`);
    });

    const pdfFilenames = attachments.map((att: any) => att.filename).join(', ');
    logger.info(`\n📄 Fichiers: ${pdfFilenames}`);

    // Vérifier qu'il y a bien différents types de documents
    const hasQuote = attachments.some((att: any) =>
      att.filename?.toLowerCase().includes('quote') || att.filename?.toLowerCase().includes('devis')
    );
    const hasBookingConfirmation = attachments.some((att: any) =>
      att.filename?.toLowerCase().includes('booking') ||
      att.filename?.toLowerCase().includes('confirmation') ||
      att.filename?.toLowerCase().includes('confirmation_')
    );
    const hasDeliveryNote = attachments.some((att: any) =>
      att.filename?.toLowerCase().includes('delivery') ||
      att.filename?.toLowerCase().includes('bon') ||
      att.filename?.toLowerCase().includes('livraison')
    );
    const hasContract = attachments.some((att: any) =>
      att.filename?.toLowerCase().includes('contract') || att.filename?.toLowerCase().includes('contrat')
    );

    logger.info('\n📄 Types de documents détectés:');
    logger.info(`   QUOTE: ${hasQuote ? '✅' : '⚠️'}`);
    logger.info(`   BOOKING_CONFIRMATION: ${hasBookingConfirmation ? '✅' : '⚠️'}`);
    logger.info(`   DELIVERY_NOTE: ${hasDeliveryNote ? '✅' : '⚠️'}`);
    logger.info(`   CONTRACT: ${hasContract ? '✅' : '⚠️'}`);

    // Au moins 2 types différents doivent être présents
    const typesCount = [hasQuote, hasBookingConfirmation, hasDeliveryNote, hasContract].filter(Boolean).length;
    expect(typesCount).toBeGreaterThanOrEqual(2);
    logger.info(`\n✅ ${typesCount} types de documents différents trouvés`);

    logger.info('\n═══════════════════════════════════════════════════════════');
    logger.info('✅ TEST DE RÉGRESSION RÉUSSI');
    logger.info('   - 1 seul email par membre');
    logger.info(`   - ${attachments.length} PDF groupés`);
    logger.info(`   - ${typesCount} types de documents`);
    logger.info('   - Problème 3 corrigé avec succès');
    logger.info('═══════════════════════════════════════════════════════════');
  }, 30000); // Timeout de 30 secondes pour laisser le temps aux workers de traiter les notifications

  it('devrait générer les 4 documents attendus pour BOOKING_CONFIRMED', async () => {
    // Vérifier que les documents ont bien été générés
    const documents = await prisma.document.findMany({
      where: {
        bookingId: testBookingId
      },
      select: {
        id: true,
        type: true,
        filename: true,
        content: true,
        createdAt: true
      }
    });

    logger.info(`\n📄 Documents générés: ${documents.length}`);
    documents.forEach(doc => {
      const size = doc.content.length;
      logger.info(`   - ${doc.type}: ${doc.filename} (${size} octets)`);
    });

    // Pour BOOKING_CONFIRMED, on attend 4 documents minimum
    // QUOTE, BOOKING_CONFIRMATION, DELIVERY_NOTE, CONTRACT
    expect(documents.length).toBeGreaterThanOrEqual(4);

    const documentTypes = documents.map(d => d.type);
    expect(documentTypes).toContain('QUOTE');
    expect(documentTypes).toContain('BOOKING_CONFIRMATION');
    expect(documentTypes).toContain('DELIVERY_NOTE');
    expect(documentTypes).toContain('CONTRACT');

    logger.info('✅ Tous les types de documents requis sont générés');
  });

  it('ne devrait pas créer de notifications dupliquées pour le même booking', async () => {
    // Attendre un peu pour s'assurer qu'aucune notification supplémentaire n'est créée
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Récupérer toutes les notifications pour ce booking
    // Note : Utiliser une requête raw SQL car Prisma a des limitations avec les filtres JSON complexes
    const allNotifications = await prisma.$queryRaw<Array<{
      id: string;
      channel: string;
      recipient_id: string;
      created_at: Date;
    }>>`
      SELECT id, channel, recipient_id, created_at
      FROM notifications
      WHERE metadata->>'bookingId' = ${testBookingId}
    `;

    logger.info(`\n📊 Total notifications pour ce booking: ${allNotifications.length}`);

    // Grouper par destinataire et canal
    const notificationsByRecipientAndChannel = new Map<string, number>();

    allNotifications.forEach(notif => {
      const key = `${notif.recipient_id}_${notif.channel}`;
      notificationsByRecipientAndChannel.set(key, (notificationsByRecipientAndChannel.get(key) || 0) + 1);
    });

    logger.info('\n📋 Notifications par destinataire et canal:');
    notificationsByRecipientAndChannel.forEach((count, key) => {
      logger.info(`   ${key}: ${count}`);
    });

    // Vérifier qu'il n'y a pas de doublons (max 1 email par destinataire)
    notificationsByRecipientAndChannel.forEach((count, key) => {
      if (key.includes('EMAIL')) {
        expect(count).toBe(1);
      }
    });

    logger.info('✅ Aucune duplication de notifications détectée');
  });
});

