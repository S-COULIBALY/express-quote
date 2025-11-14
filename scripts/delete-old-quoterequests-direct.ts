import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteDirectly() {
  console.log('🗑️  SUPPRESSION EN COURS...\n');

  const cutoffDate = new Date('2025-11-10T00:00:00Z');

  try {
    await prisma.$transaction(async (tx) => {
      // Récupérer les IDs
      const quotesToDelete = await tx.quoteRequest.findMany({
        where: { createdAt: { lt: cutoffDate } },
        select: { id: true, Booking: { select: { id: true } } }
      });

      const bookingIds = quotesToDelete.flatMap(q => q.Booking.map(b => b.id));
      console.log(`📦 ${quotesToDelete.length} QuoteRequest, ${bookingIds.length} Bookings\n`);

      if (bookingIds.length > 0) {
        // Supprimer attributions
        const attrIds = (await tx.booking_attributions.findMany({
          where: { booking_id: { in: bookingIds } },
          select: { id: true }
        })).map(a => a.id);

        if (attrIds.length > 0) {
          await tx.attribution_responses.deleteMany({ where: { attribution_id: { in: attrIds } } });
          await tx.attribution_eligibilities.deleteMany({ where: { attribution_id: { in: attrIds } } });
        }

        await tx.booking_attributions.deleteMany({ where: { booking_id: { in: bookingIds } } });
        await tx.scheduled_reminders.deleteMany({ where: { booking_id: { in: bookingIds } } });
        await tx.payments.deleteMany({ where: { booking_id: { in: bookingIds } } });
        await tx.items.deleteMany({ where: { booking_id: { in: bookingIds } } });
        await tx.moving.deleteMany({ where: { bookingId: { in: bookingIds } } });

        const emailIds = (await tx.emailLog.findMany({
          where: { bookingId: { in: bookingIds } },
          select: { id: true }
        })).map(e => e.id);

        if (emailIds.length > 0) {
          await tx.emailAttachment.deleteMany({ where: { emailId: { in: emailIds } } });
        }

        await tx.emailLog.deleteMany({ where: { bookingId: { in: bookingIds } } });
        await tx.document.deleteMany({ where: { bookingId: { in: bookingIds } } });
        await tx.transaction.deleteMany({ where: { bookingId: { in: bookingIds } } });
        await tx.booking.deleteMany({ where: { id: { in: bookingIds } } });
      }

      const result = await tx.quoteRequest.deleteMany({
        where: { createdAt: { lt: cutoffDate } }
      });

      console.log(`✅ ${result.count} QuoteRequest supprimés\n`);
    });

    // Vérification
    const remaining = await prisma.quoteRequest.findMany();
    const withFormData = remaining.filter(q => {
      const qd = q.quoteData as any;
      return qd && 'formData' in qd;
    }).length;

    console.log(`📊 Restants: ${remaining.length}, avec formData: ${withFormData}\n`);

    if (withFormData === 0) {
      console.log('✅ SUCCÈS: Plus aucun formData imbriqué !\n');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }

  await prisma.$disconnect();
}

deleteDirectly().catch(console.error);
