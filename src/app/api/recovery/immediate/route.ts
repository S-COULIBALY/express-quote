import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getGlobalNotificationService } from "@/notifications/interfaces/http/GlobalNotificationService";

/**
 * POST /api/recovery/immediate
 * Déclenche une récupération immédiate pour un abandon
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionId, stage, data, metadata } = await request.json();

    if (!sessionId || !stage) {
      return NextResponse.json(
        { error: "Session ID et stage requis" },
        { status: 400 },
      );
    }

    logger.info(`Récupération immédiate déclenchée: ${stage}`, {
      sessionId,
      stage,
      metadata,
    });

    switch (stage) {
      case "form_partial":
        await handleFormPartialRecovery(sessionId, data);
        break;
      case "quote_with_contact":
        await handleQuoteContactRecovery(sessionId, data);
        break;
      case "payment_abandoned":
        await handlePaymentAbandonRecovery(sessionId, data);
        break;
      default:
        logger.warn(
          `Type d'abandon non géré pour récupération immédiate: ${stage}`,
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Erreur lors de la récupération immédiate:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

async function handleFormPartialRecovery(
  sessionId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const formId = data?.formId as string;
  const completion = (data?.completion as number) || 0;

  logger.info(`Récupération formulaire partiel: ${formId} (${completion}%)`);

  // Sauvegarder le brouillon si données disponibles
  await saveFormDraft(formId, data?.formData);
}

async function handleQuoteContactRecovery(
  sessionId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const quoteId = data?.quoteId as string;
  const quoteData = (data?.quoteData as Record<string, unknown>) || {};
  const customerInfo =
    (quoteData.customerInfo as Record<string, unknown>) || {};
  const totalPrice = quoteData.totalPrice;
  const name = (customerInfo.firstName as string) || "";

  logger.info(`Récupération devis avec contact: ${quoteId} (${totalPrice}€)`);

  await Promise.allSettled([
    sendImmediateRecoveryEmail(customerInfo.email as string | undefined, {
      subject: "Votre devis de déménagement vous attend",
      content: `Bonjour ${name},\n\nVotre devis de ${totalPrice}€ est prêt. Finalisez votre réservation maintenant sur quotin.fr\n\nCordialement,\nL'équipe Quotin`,
      metadata: { sessionId, quoteId },
    }),
  ]);
}

async function handlePaymentAbandonRecovery(
  sessionId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const bookingId = data?.bookingId as string;
  const paymentData = (data?.paymentData as Record<string, unknown>) || {};
  const customerInfo =
    (paymentData.customerInfo as Record<string, unknown>) || {};
  const amount = paymentData.amount;
  const name = (customerInfo.firstName as string) || "";

  logger.info(`Récupération paiement abandonné: ${bookingId} (${amount}€)`);

  await Promise.allSettled([
    sendImmediateRecoveryEmail(customerInfo.email as string | undefined, {
      subject: "Votre paiement a été interrompu",
      content: `Bonjour ${name},\n\nVotre paiement de ${amount}€ est en attente. Finalisez votre réservation pour confirmer votre déménagement.\n\nCordialement,\nL'équipe Quotin`,
      metadata: { sessionId, bookingId },
    }),
    sendRecoverySMS(customerInfo.phone as string | undefined, {
      content: `Quotin : Votre paiement de ${amount}€ est en attente. Finalisez votre réservation sur quotin.fr`,
      metadata: { sessionId, bookingId },
    }),
  ]);
}

async function sendImmediateRecoveryEmail(
  email: string | undefined,
  options: {
    subject: string;
    content: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  if (!email) return;
  try {
    const service = await getGlobalNotificationService();
    await service.sendNotification({
      id: `recovery-imm-email-${Date.now()}`,
      type: "email",
      recipient: email,
      subject: options.subject,
      content: options.content,
      priority: "high",
      metadata: options.metadata,
    });
    logger.info(`Email de récupération immédiate envoyé à ${email}`);
  } catch (error) {
    logger.error("Erreur lors de l'envoi d'email de récupération:", error);
  }
}

async function sendRecoverySMS(
  phone: string | undefined,
  options: { content: string; metadata?: Record<string, unknown> },
): Promise<void> {
  if (!phone) return;
  try {
    const service = await getGlobalNotificationService();
    await service.sendNotification({
      id: `recovery-imm-sms-${Date.now()}`,
      type: "sms",
      recipient: phone,
      content: options.content,
      priority: "critical",
      metadata: options.metadata,
    });
    logger.info(`SMS de récupération envoyé à ${phone}`);
  } catch (error) {
    logger.error("Erreur lors de l'envoi de SMS de récupération:", error);
  }
}

async function saveFormDraft(formId: string, formData: unknown): Promise<void> {
  if (!formId || !formData) return;
  try {
    const completion = calculateFormCompletion(
      formData as Record<string, unknown>,
    );
    logger.info(`Brouillon sauvegardé: ${formId} (${completion}%)`);
    // TODO: Persister via modèle abandonEvent Prisma
  } catch (error) {
    logger.error("Erreur lors de la sauvegarde du brouillon:", error);
  }
}

function calculateFormCompletion(formData: Record<string, unknown>): number {
  const fields = Object.entries(formData);
  if (fields.length === 0) return 0;
  const filledFields = fields.filter(([, value]) => {
    if (value === null || value === undefined || value === "") return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  });
  return Math.round((filledFields.length / fields.length) * 100);
}
