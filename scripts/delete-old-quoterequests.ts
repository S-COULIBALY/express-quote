import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

/**
 * Script de suppression des anciens QuoteRequest avec formData imbriqué
 *
 * Ce script supprime les QuoteRequest créés AVANT le 2025-11-10,
 * date à laquelle la refactorisation a supprimé formData imbriqué.
 *
 * IMPORTANT : Faire un BACKUP de la base avant d'exécuter !
 */

async function deleteOldQuoteRequests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🗑️  SUPPRESSION DES ANCIENS QUOTEREQUEST AVEC formData');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Date de coupure (avant cette date = anciens avec formData)
  const cutoffDate = new Date('2025-11-10T00:00:00Z');

  console.log(`📅 Date de coupure: ${cutoffDate.toISOString()}`);
  console.log(`   Tous les QuoteRequest AVANT cette date seront supprimés\n`);

  // 1. Compter les QuoteRequest à supprimer
  console.log('🔍 Analyse des QuoteRequest...\n');

  const toDelete = await prisma.quoteRequest.findMany({
    where: {
      createdAt: {
        lt: cutoffDate
      }
    },
    select: {
      id: true,
      temporaryId: true,
      type: true,
      status: true,
      createdAt: true,
      quoteData: true,
      _count: {
        select: {
          bookings: true
        }
      }
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

  const withBookings = toDelete.filter(qr => qr._count.bookings > 0);

  console.log('📊 STATISTIQUES:');
  console.log(`   Total à supprimer: ${total}`);
  console.log(`   Avec formData imbriqué: ${withFormData} (${((withFormData/total)*100).toFixed(1)}%)`);
  console.log('\n   Répartition par status:');
  Object.entries(byStatus).forEach(([status, count]) => {
    console.log(`     - ${status}: ${count}`);
  });

  if (withBookings.length > 0) {
    console.log(`\n⚠️  ATTENTION: ${withBookings.length} QuoteRequest ont des Bookings associés !`);
    console.log('   IDs des QuoteRequest avec Bookings:');
    withBookings.forEach(qr => {
      console.log(`     - ${qr.id} (${qr._count.bookings} booking(s))`);
    });
    console.log('\n❌ OPÉRATION ANNULÉE pour éviter la perte de données critiques.');
    console.log('   Veuillez d\'abord traiter/archiver ces Bookings.\n');
    await prisma.$disconnect();
    return;
  }

  console.log('\n✅ Aucun Booking associé - Suppression possible\n');

  // 2. Demander confirmation
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const confirm = await new Promise<string>((resolve) => {
    rl.question(
      `🚨 CONFIRMATION: Voulez-vous supprimer ${total} QuoteRequest ? (oui/non): `,
      resolve
    );
  });

  rl.close();

  if (confirm.toLowerCase() !== 'oui') {
    console.log('\n❌ Opération annulée par l\'utilisateur.\n');
    await prisma.$disconnect();
    return;
  }

  // 3. Suppression
  console.log('\n🗑️  Suppression en cours...\n');

  try {
    const result = await prisma.quoteRequest.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    });

    console.log(`✅ ${result.count} QuoteRequest supprimés avec succès !\n`);

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
      console.log('\n✅ SUCCÈS: Plus aucun QuoteRequest avec formData imbriqué !\n');
    } else {
      console.log(`\n⚠️  ATTENTION: ${remainingWithFormData} QuoteRequest ont encore formData`);
      console.log('   (probablement créés après la date de coupure)\n');
    }

  } catch (error) {
    console.error('\n❌ ERREUR lors de la suppression:', error);
    throw error;
  }

  await prisma.$disconnect();
}

// Exécution
deleteOldQuoteRequests()
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
