import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getGlobalNotificationService } from "@/notifications/interfaces/http/GlobalNotificationService";

/**
 * POST /api/recovery/delayed
 * Déclenche une récupération différée pour un abandon
 * (Appelé par les workers BullMQ via scheduledAt, ou manuellement)
 */
export async function POST(request: NextRequest) {
  try {
    const { eventId, sessionId, stage, data, metadata } = await request.json();

    if (!sessionId || !stage) {
      return NextResponse.json(
        { error: "Session ID et stage requis" },
        { status: 400 },
      );
    }

    logger.info(`Récupération différée déclenchée: ${stage}`, {
      eventId,
      sessionId,
      stage,
      metadata,
    });

    switch (stage) {
      case "form_incomplete":
        await handleFormIncompleteRecovery(sessionId, data);
        break;
      case "form_partial":
        await handleFormPartialDelayedRecovery(sessionId, data);
        break;
      case "quote_created":
        await handleQuoteCreatedRecovery(sessionId, data);
        break;
      case "quote_viewed":
        await handleQuoteViewedRecovery(sessionId, data);
        break;
      case "booking_created":
        await handleBookingCreatedRecovery(sessionId, data);
        break;
      case "payment_page":
        await handlePaymentPageRecovery(sessionId, data);
        break;
      default:
        logger.warn(
          `Type d'abandon non géré pour récupération différée: ${stage}`,
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Erreur lors de la récupération différée:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

async function handleFormIncompleteRecovery(
  sessionId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const formId = data?.formId as string;
  const formData = (data?.formData as Record<string, unknown>) || {};
  const completion = (data?.completion as number) || 0;

  logger.info(`Récupération formulaire incomplet: ${formId} (${completion}%)`);

  await Promise.allSettled([
    sendEmail(formData.email as string | undefined, {
      subject: "Votre demande de devis n'est pas terminée",
      content: `Votre formulaire est complété à ${completion}%. Revenez terminer votre demande de déménagement sur quotin.fr`,
      metadata: { sessionId },
    }),
  ]);
}

async function handleFormPartialDelayedRecovery(
  sessionId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const formId = data?.formId as string;
  const formData = (data?.formData as Record<string, unknown>) || {};
  const completion = (data?.completion as number) || 0;

  logger.info(
    `Récupération différée formulaire partiel: ${formId} (${completion}%)`,
  );

  await Promise.allSettled([
    sendEmail(formData.email as string | undefined, {
      subject: "Votre demande est presque terminée",
      content: `Votre formulaire est complété à ${completion}%. Finalisez-le pour obtenir votre devis de déménagement sur quotin.fr`,
      metadata: { sessionId },
    }),
    sendSMS(formData.phone as string | undefined, {
      content: `Quotin : Votre demande est incomplète (${completion}%). Finalisez-la sur quotin.fr`,
      metadata: { sessionId },
    }),
  ]);
}

async function handleQuoteCreatedRecovery(
  sessionId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const quoteId = data?.quoteId as string;
  const quoteData = (data?.quoteData as Record<string, unknown>) || {};
  const customerInfo =
    (quoteData.customerInfo as Record<string, unknown>) || {};
  const totalPrice = quoteData.totalPrice;
  const name = (customerInfo.firstName as string) || "";

  logger.info(`Récupération devis créé: ${quoteId} (${totalPrice}€)`);

  await Promise.allSettled([
    sendEmail(customerInfo.email as string | undefined, {
      subject: "Votre devis de déménagement vous attend",
      content: `Bonjour ${name},\n\nVotre devis de ${totalPrice}€ est disponible. Consultez-le et réservez votre déménagement sur quotin.fr\n\nCordialement,\nL'équipe Quotin`,
      metadata: { sessionId, quoteId },
    }),
    sendSMS(customerInfo.phone as string | undefined, {
      content: `Quotin : Votre devis de ${totalPrice}€ vous attend. Consultez-le sur quotin.fr`,
      metadata: { sessionId, quoteId },
    }),
  ]);
}

async function handleQuoteViewedRecovery(
  sessionId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const quoteId = data?.quoteId as string;
  const quoteData = (data?.quoteData as Record<string, unknown>) || {};
  const customerInfo =
    (quoteData.customerInfo as Record<string, unknown>) || {};
  const totalPrice = quoteData.totalPrice;
  const name = (customerInfo.firstName as string) || "";

  logger.info(`Récupération devis consulté: ${quoteId} (${totalPrice}€)`);

  await Promise.allSettled([
    sendEmail(customerInfo.email as string | undefined, {
      subject: "Votre devis expire bientôt",
      content: `Bonjour ${name},\n\nVotre devis de ${totalPrice}€ a été consulté mais pas encore confirmé. Réservez maintenant sur quotin.fr\n\nCordialement,\nL'équipe Quotin`,
      priority: "high",
      metadata: { sessionId, quoteId },
    }),
    sendSMS(customerInfo.phone as string | undefined, {
      content: `Quotin : Votre devis de ${totalPrice}€ expire bientôt. Réservez sur quotin.fr`,
      priority: "high",
      metadata: { sessionId, quoteId },
    }),
  ]);
}

async function handleBookingCreatedRecovery(
  sessionId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const bookingId = data?.bookingId as string;
  const bookingData = (data?.bookingData as Record<string, unknown>) || {};
  const customerInfo =
    (bookingData.customerInfo as Record<string, unknown>) || {};
  const totalAmount = bookingData.totalAmount;
  const name = (customerInfo.firstName as string) || "";

  logger.info(`Récupération réservation créée: ${bookingId} (${totalAmount}€)`);

  await Promise.allSettled([
    sendEmail(customerInfo.email as string | undefined, {
      subject: "Votre réservation est en attente de paiement",
      content: `Bonjour ${name},\n\nVotre réservation de déménagement de ${totalAmount}€ est en attente de paiement. Finalisez votre paiement sous 24h pour confirmer votre créneau.\n\nCordialement,\nL'équipe Quotin`,
      priority: "high",
      metadata: { sessionId, bookingId },
    }),
    sendSMS(customerInfo.phone as string | undefined, {
      content: `Quotin : Réservation de ${totalAmount}€ en attente de paiement. Finalisez sous 24h sur quotin.fr`,
      priority: "high",
      metadata: { sessionId, bookingId },
    }),
  ]);
}

async function handlePaymentPageRecovery(
  sessionId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const bookingId = data?.bookingId as string;
  const paymentData = (data?.paymentData as Record<string, unknown>) || {};
  const customerInfo =
    (paymentData.customerInfo as Record<string, unknown>) || {};
  const amount = paymentData.amount;
  const name = (customerInfo.firstName as string) || "";

  logger.info(`Récupération page paiement: ${bookingId} (${amount}€)`);

  await Promise.allSettled([
    sendEmail(customerInfo.email as string | undefined, {
      subject: "Besoin d'aide pour votre paiement ?",
      content: `Bonjour ${name},\n\nVous avez été interrompu lors du paiement de ${amount}€. Notre équipe est disponible pour vous aider.\n\nFinalisez votre paiement sur quotin.fr ou contactez-nous au ${process.env.SUPPORT_PHONE || ""}\n\nCordialement,\nL'équipe Quotin`,
      priority: "high",
      metadata: { sessionId, bookingId },
    }),
    sendSMS(customerInfo.phone as string | undefined, {
      content: `Quotin : Besoin d'aide pour votre paiement de ${amount}€ ? Contactez-nous ou finalisez sur quotin.fr`,
      priority: "high",
      metadata: { sessionId, bookingId },
    }),
  ]);
}

/**
 * Helpers communs — envoient via la queue BullMQ (workers PM2)
 */
async function sendEmail(
  email: string | undefined,
  options: {
    subject: string;
    content: string;
    priority?: "low" | "normal" | "high" | "critical";
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  if (!email) return;
  try {
    const service = await getGlobalNotificationService();
    await service.sendNotification({
      id: `recovery-del-email-${Date.now()}`,
      type: "email",
      recipient: email,
      subject: options.subject,
      content: options.content,
      priority: options.priority ?? "normal",
      metadata: options.metadata,
    });
    logger.info(`Email de récupération différée envoyé à ${email}`);
  } catch (error) {
    logger.error(
      "Erreur lors de l'envoi d'email de récupération différée:",
      error,
    );
  }
}

async function sendSMS(
  phone: string | undefined,
  options: {
    content: string;
    priority?: "low" | "normal" | "high" | "critical";
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  if (!phone) return;
  try {
    const service = await getGlobalNotificationService();
    await service.sendNotification({
      id: `recovery-del-sms-${Date.now()}`,
      type: "sms",
      recipient: phone,
      content: options.content,
      priority: options.priority ?? "normal",
      metadata: options.metadata,
    });
    logger.info(`SMS de récupération différée envoyé à ${phone}`);
  } catch (error) {
    logger.error(
      "Erreur lors de l'envoi de SMS de récupération différée:",
      error,
    );
  }
}
