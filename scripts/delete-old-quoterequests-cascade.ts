import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

/**
 * Script de suppression EN CASCADE des anciens QuoteRequest avec formData imbriqué
 *
 * Ce script supprime les QuoteRequest créés AVANT le 2025-11-10 et TOUTES les données associées:
 * - Bookings
 * - Transactions
 * - EmailLogs
 * - Documents
 * - Moving
 * - items
 * - booking_attributions
 * - scheduled_reminders
 * - etc.
 *
 * ⚠️ SUPPRESSION DÉFINITIVE - FAIRE UN BACKUP AVANT !
 */

async function deleteOldQuoteRequestsCascade() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🗑️  SUPPRESSION CASCADE DES ANCIENS QUOTEREQUEST');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Date de coupure (avant cette date = anciens avec formData)
  const cutoffDate = new Date('2025-11-10T00:00:00Z');

  console.log(`📅 Date de coupure: ${cutoffDate.toISOString()}`);
  console.log(`   Tous les QuoteRequest AVANT cette date seront supprimés\n`);
  console.log(`⚠️  MODE CASCADE: Toutes les données associées seront également supprimées!\n`);

  // 1. Analyser les QuoteRequest à supprimer
  console.log('🔍 Analyse des QuoteRequest et données associées...\n');

  const toDelete = await prisma.quoteRequest.findMany({
    where: {
      createdAt: {
        lt: cutoffDate
      }
    },
    include: {
      Booking: {
        include: {
          Transaction: true,
          EmailLog: true,
          Document: true,
          Moving: true,
          items: true,
          booking_attributions: true,
          scheduled_reminders: true,
          payments: true
        }
      },
      CatalogSelection: true
    }
  });

  const total = toDelete.length;
  const withFormData = toDelete.filter(qr => {
    const quoteData = qr.quoteData as any;
    return quoteData && 'formData' in quoteData;
  }).length;

  const byStatus = toDelete.reduce((acc, qr) => {
    acc[qr.status] = (acc[qr.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Compter les données associées
  let totalBookings = 0;
  let totalTransactions = 0;
  let totalEmailLogs = 0;
  let totalDocuments = 0;
  let totalMovings = 0;
  let totalItems = 0;
  let totalAttributions = 0;
  let totalReminders = 0;
  let totalPayments = 0;

  toDelete.forEach(qr => {
    totalBookings += qr.Booking.length;
    qr.Booking.forEach(booking => {
      totalTransactions += booking.Transaction.length;
      totalEmailLogs += booking.EmailLog.length;
      totalDocuments += booking.Document.length;
      if (booking.Moving) totalMovings++;
      totalItems += booking.items.length;
      totalAttributions += booking.booking_attributions.length;
      totalReminders += booking.scheduled_reminders.length;
      totalPayments += booking.payments.length;
    });
  });

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 STATISTIQUES DE SUPPRESSION');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('QuoteRequest:');
  console.log(`   Total à supprimer: ${total}`);
  console.log(`   Avec formData imbriqué: ${withFormData} (${((withFormData/total)*100).toFixed(1)}%)`);
  console.log('\n   Répartition par status:');
  Object.entries(byStatus).forEach(([status, count]) => {
    console.log(`     - ${status}: ${count}`);
  });

  console.log('\nDonnées associées qui seront AUSSI supprimées:');
  console.log(`   📦 Bookings: ${totalBookings}`);
  console.log(`   💳 Transactions: ${totalTransactions}`);
  console.log(`   📧 EmailLogs: ${totalEmailLogs}`);
  console.log(`   📄 Documents: ${totalDocuments}`);
  console.log(`   🚚 Movings: ${totalMovings}`);
  console.log(`   📋 Items: ${totalItems}`);
  console.log(`   👥 Attributions: ${totalAttributions}`);
  console.log(`   ⏰ Reminders: ${totalReminders}`);
  console.log(`   💰 Payments: ${totalPayments}`);

  const totalAssociated = totalBookings + totalTransactions + totalEmailLogs +
                         totalDocuments + totalMovings + totalItems +
                         totalAttributions + totalReminders + totalPayments;

  console.log(`\n   🔢 TOTAL DONNÉES ASSOCIÉES: ${totalAssociated}`);
  console.log(`   🗑️  TOTAL GÉNÉRAL (QuoteRequest + Associées): ${total + totalAssociated}\n`);

  // 2. Demander confirmation RENFORCÉE
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('⚠️⚠️⚠️  ATTENTION SUPPRESSION DÉFINITIVE  ⚠️⚠️⚠️\n');

  const confirm1 = await new Promise<string>((resolve) => {
    rl.question(
      `🚨 Êtes-vous SÛR de vouloir supprimer ${total} QuoteRequest + ${totalAssociated} données associées ? (SUPPRIMER/annuler): `,
      resolve
    );
  });

  if (confirm1.toUpperCase() !== 'SUPPRIMER') {
    console.log('\n❌ Opération annulée par l\'utilisateur.\n');
    rl.close();
    await prisma.$disconnect();
    return;
  }

  const confirm2 = await new Promise<string>((resolve) => {
    rl.question(
      `\n🚨 DERNIÈRE CONFIRMATION: Avez-vous fait un BACKUP de la base ? (OUI/non): `,
      resolve
    );
  });

  rl.close();

  if (confirm2.toUpperCase() !== 'OUI') {
    console.log('\n❌ Opération annulée - Veuillez faire un backup avant de continuer.\n');
    await prisma.$disconnect();
    return;
  }

  // 3. Suppression EN CASCADE
  console.log('\n🗑️  Suppression en cours (cela peut prendre du temps)...\n');

  let deletedCount = {
    quoteRequests: 0,
    bookings: 0,
    transactions: 0,
    emailLogs: 0,
    documents: 0,
    emailAttachments: 0,
    movings: 0,
    items: 0,
    attributions: 0,
    attributionEligibilities: 0,
    attributionResponses: 0,
    reminders: 0,
    payments: 0
  };

  try {
    // Utiliser une transaction pour garantir la cohérence
    await prisma.$transaction(async (tx) => {
      console.log('📦 Étape 1/13: Suppression des attribution_responses...');
      const bookingIds = toDelete.flatMap(qr => qr.Booking.map(b => b.id));

      if (bookingIds.length > 0) {
        const attributionIds = (await tx.booking_attributions.findMany({
          where: { booking_id: { in: bookingIds } },
          select: { id: true }
        })).map(a => a.id);

        if (attributionIds.length > 0) {
          const { count: responses } = await tx.attribution_responses.deleteMany({
            where: { attribution_id: { in: attributionIds } }
          });
          deletedCount.attributionResponses = responses;
          console.log(`   ✅ ${responses} attribution_responses supprimés`);

          console.log('📦 Étape 2/13: Suppression des attribution_eligibilities...');
          const { count: eligibilities } = await tx.attribution_eligibilities.deleteMany({
            where: { attribution_id: { in: attributionIds } }
          });
          deletedCount.attributionEligibilities = eligibilities;
          console.log(`   ✅ ${eligibilities} attribution_eligibilities supprimés`);
        }

        console.log('📦 Étape 3/13: Suppression des booking_attributions...');
        const { count: attributions } = await tx.booking_attributions.deleteMany({
          where: { booking_id: { in: bookingIds } }
        });
        deletedCount.attributions = attributions;
        console.log(`   ✅ ${attributions} booking_attributions supprimés`);

        console.log('📦 Étape 4/13: Suppression des scheduled_reminders...');
        const { count: reminders } = await tx.scheduled_reminders.deleteMany({
          where: { booking_id: { in: bookingIds } }
        });
        deletedCount.reminders = reminders;
        console.log(`   ✅ ${reminders} scheduled_reminders supprimés`);

        console.log('📦 Étape 5/13: Suppression des payments...');
        const { count: payments } = await tx.payments.deleteMany({
          where: { booking_id: { in: bookingIds } }
        });
        deletedCount.payments = payments;
        console.log(`   ✅ ${payments} payments supprimés`);

        console.log('📦 Étape 6/13: Suppression des items...');
        const { count: items } = await tx.items.deleteMany({
          where: { booking_id: { in: bookingIds } }
        });
        deletedCount.items = items;
        console.log(`   ✅ ${items} items supprimés`);

        console.log('📦 Étape 7/13: Suppression des Moving...');
        const { count: movings } = await tx.moving.deleteMany({
          where: { bookingId: { in: bookingIds } }
        });
        deletedCount.movings = movings;
        console.log(`   ✅ ${movings} Moving supprimés`);

        console.log('📦 Étape 8/13: Suppression des EmailAttachments...');
        const emailLogIds = (await tx.emailLog.findMany({
          where: { bookingId: { in: bookingIds } },
          select: { id: true }
        })).map(e => e.id);

        if (emailLogIds.length > 0) {
          const { count: attachments } = await tx.emailAttachment.deleteMany({
            where: { emailId: { in: emailLogIds } }
          });
          deletedCount.emailAttachments = attachments;
          console.log(`   ✅ ${attachments} EmailAttachments supprimés`);
        }

        console.log('📦 Étape 9/13: Suppression des EmailLogs...');
        const { count: emailLogs } = await tx.emailLog.deleteMany({
          where: { bookingId: { in: bookingIds } }
        });
        deletedCount.emailLogs = emailLogs;
        console.log(`   ✅ ${emailLogs} EmailLogs supprimés`);

        console.log('📦 Étape 10/13: Suppression des Documents...');
        const { count: documents } = await tx.document.deleteMany({
          where: { bookingId: { in: bookingIds } }
        });
        deletedCount.documents = documents;
        console.log(`   ✅ ${documents} Documents supprimés`);

        console.log('📦 Étape 11/13: Suppression des Transactions...');
        const { count: transactions } = await tx.transaction.deleteMany({
          where: { bookingId: { in: bookingIds } }
        });
        deletedCount.transactions = transactions;
        console.log(`   ✅ ${transactions} Transactions supprimés`);

        console.log('📦 Étape 12/13: Suppression des Bookings...');
        const { count: bookings } = await tx.booking.deleteMany({
          where: { id: { in: bookingIds } }
        });
        deletedCount.bookings = bookings;
        console.log(`   ✅ ${bookings} Bookings supprimés`);
      }

      console.log('📦 Étape 13/13: Suppression des QuoteRequests...');
      const { count: quoteRequests } = await tx.quoteRequest.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      });
      deletedCount.quoteRequests = quoteRequests;
      console.log(`   ✅ ${quoteRequests} QuoteRequests supprimés`);
    });

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ SUPPRESSION TERMINÉE AVEC SUCCÈS');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('Récapitulatif des suppressions:');
    console.log(`   QuoteRequests: ${deletedCount.quoteRequests}`);
    console.log(`   Bookings: ${deletedCount.bookings}`);
    console.log(`   Transactions: ${deletedCount.transactions}`);
    console.log(`   EmailLogs: ${deletedCount.emailLogs}`);
    console.log(`   EmailAttachments: ${deletedCount.emailAttachments}`);
    console.log(`   Documents: ${deletedCount.documents}`);
    console.log(`   Movings: ${deletedCount.movings}`);
    console.log(`   Items: ${deletedCount.items}`);
    console.log(`   Attributions: ${deletedCount.attributions}`);
    console.log(`   Attribution Eligibilities: ${deletedCount.attributionEligibilities}`);
    console.log(`   Attribution Responses: ${deletedCount.attributionResponses}`);
    console.log(`   Reminders: ${deletedCount.reminders}`);
    console.log(`   Payments: ${deletedCount.payments}`);

    const totalDeleted = Object.values(deletedCount).reduce((sum, count) => sum + count, 0);
    console.log(`\n   🗑️  TOTAL SUPPRIMÉ: ${totalDeleted} enregistrements\n`);

    // 4. Vérification post-suppression
    console.log('🔍 Vérification post-suppression...\n');

    const remaining = await prisma.quoteRequest.findMany({
      select: {
        id: true,
        createdAt: true,
        quoteData: true
      }
    });

    const remainingWithFormData = remaining.filter(qr => {
      const quoteData = qr.quoteData as any;
      return quoteData && 'formData' in quoteData;
    }).length;

    console.log('📊 APRÈS SUPPRESSION:');
    console.log(`   QuoteRequest restants: ${remaining.length}`);
    console.log(`   Avec formData imbriqué: ${remainingWithFormData}`);

    if (remainingWithFormData === 0) {
      console.log('\n✅ SUCCÈS TOTAL: Plus aucun QuoteRequest avec formData imbriqué !');
      console.log('   Vous pouvez maintenant procéder au nettoyage du code.\n');
    } else {
      console.log(`\n⚠️  ATTENTION: ${remainingWithFormData} QuoteRequest ont encore formData`);
      console.log('   (probablement créés après la date de coupure)\n');
    }

  } catch (error) {
    console.error('\n❌ ERREUR lors de la suppression:', error);
    console.error('\n⚠️  La transaction a été annulée - aucune donnée n\'a été supprimée.');
    throw error;
  }

  await prisma.$disconnect();
}

// Exécution
deleteOldQuoteRequestsCascade()
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
