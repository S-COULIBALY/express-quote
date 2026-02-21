import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getGlobalNotificationService } from "@/notifications/interfaces/http/GlobalNotificationService";

/**
 * POST /api/analytics/abandon
 * Enregistre un événement d'abandon
 */
export async function POST(request: NextRequest) {
  try {
    const abandonEvent = await request.json();

    // Validation des données
    if (!abandonEvent.sessionId || !abandonEvent.stage) {
      return NextResponse.json(
        { error: "Session ID et stage requis" },
        { status: 400 },
      );
    }

    // Enrichir avec des métadonnées serveur
    const enrichedEvent = {
      ...abandonEvent,
      ipAddress: getClientIP(request),
      serverTimestamp: new Date(),
      userAgent: request.headers.get("user-agent") || "unknown",
    };

    // TODO: Enregistrer dans la base de données (modèle abandonEvent à créer dans Prisma)
    // await prisma.abandonEvent.create({ ... });

    // Déclencher le processus de récupération (BullMQ — résistant aux redémarrages serverless)
    await triggerRecoveryProcess(enrichedEvent);

    // Logger l'événement
    logger.warn(`Abandon enregistré: ${abandonEvent.stage}`, {
      sessionId: abandonEvent.sessionId,
      stage: abandonEvent.stage,
      timeSpent: abandonEvent.timeSpent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Erreur lors de l'enregistrement de l'abandon:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * GET /api/analytics/abandon
 * Récupère les statistiques d'abandon
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const stage = searchParams.get("stage");
    const days = parseInt(searchParams.get("days") || "7");

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const where: Record<string, unknown> = {
      timestamp: { gte: dateFrom },
    };

    if (sessionId) where.sessionId = sessionId;
    if (stage) where.stage = stage;

    // TODO: Récupérer les événements (modèle abandonEvent à créer dans Prisma)
    const events: unknown[] = [];

    const stats = await calculateAbandonStats(dateFrom);

    return NextResponse.json({
      success: true,
      data: { events, stats },
    });
  } catch (error) {
    logger.error("Erreur lors de la récupération des abandons:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * Déclencher le processus de récupération via BullMQ
 * - Immédiat : notification queued maintenant
 * - Différé : notification queued avec scheduledAt (BullMQ delay — survit aux redémarrages)
 */
async function triggerRecoveryProcess(event: {
  sessionId: string;
  stage: string;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const immediateStages = [
      "form_partial",
      "quote_with_contact",
      "payment_abandoned",
    ];
    if (immediateStages.includes(event.stage)) {
      await scheduleImmediateRecovery(event);
    }
    await scheduleDelayedRecovery(event);
  } catch (error) {
    logger.error("Erreur lors du déclenchement de la récupération:", error);
  }
}

/**
 * Récupération immédiate — queued dans BullMQ maintenant
 */
async function scheduleImmediateRecovery(event: {
  sessionId: string;
  stage: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  const { sessionId, stage, data } = event;

  try {
    const service = await getGlobalNotificationService();

    if (stage === "quote_with_contact") {
      const quoteData = (data?.quoteData as Record<string, unknown>) || {};
      const customerInfo =
        (quoteData.customerInfo as Record<string, unknown>) || {};
      const totalPrice = quoteData.totalPrice;
      const quoteId = data?.quoteId as string | undefined;
      const name = (customerInfo.firstName as string) || "";

      if (customerInfo.email) {
        await service.sendNotification({
          id: `recovery-imm-email-${sessionId}-${Date.now()}`,
          type: "email",
          recipient: customerInfo.email as string,
          subject: "Votre devis de déménagement vous attend",
          content: `Bonjour ${name},\n\nVotre devis de ${totalPrice}€ est prêt. Finalisez votre réservation maintenant.\n\nCordialement,\nL'équipe Quotin`,
          priority: "high",
          metadata: { sessionId, stage, quoteId },
        });
      }
    }

    if (stage === "payment_abandoned") {
      const paymentData = (data?.paymentData as Record<string, unknown>) || {};
      const customerInfo =
        (paymentData.customerInfo as Record<string, unknown>) || {};
      const amount = paymentData.amount;
      const bookingId = data?.bookingId as string | undefined;
      const name = (customerInfo.firstName as string) || "";

      if (customerInfo.email) {
        await service.sendNotification({
          id: `recovery-imm-email-${sessionId}-${Date.now()}`,
          type: "email",
          recipient: customerInfo.email as string,
          subject: "Votre paiement a été interrompu",
          content: `Bonjour ${name},\n\nVotre paiement de ${amount}€ est en attente. Finalisez votre réservation pour confirmer votre déménagement.\n\nCordialement,\nL'équipe Quotin`,
          priority: "critical",
          metadata: { sessionId, stage, bookingId },
        });
      }

      if (customerInfo.phone) {
        await service.sendNotification({
          id: `recovery-imm-sms-${sessionId}-${Date.now()}`,
          type: "sms",
          recipient: customerInfo.phone as string,
          content: `Quotin : Votre paiement de ${amount}€ est en attente. Finalisez votre réservation sur quotin.fr`,
          priority: "critical",
          metadata: { sessionId, stage, bookingId },
        });
      }
    }
  } catch (error) {
    logger.error("Erreur lors de la récupération immédiate:", error);
  }
}

/**
 * Récupération différée — queued dans BullMQ avec scheduledAt
 * Résistant aux redémarrages contrairement à setTimeout
 */
async function scheduleDelayedRecovery(event: {
  sessionId: string;
  stage: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  const delays: Record<string, number> = {
    catalog_early: 0,
    form_incomplete: 15 * 60 * 1000,
    form_partial: 5 * 60 * 1000,
    quote_created: 30 * 60 * 1000,
    quote_viewed: 60 * 60 * 1000,
    quote_with_contact: 15 * 60 * 1000,
    booking_created: 30 * 60 * 1000,
    payment_page: 10 * 60 * 1000,
    payment_abandoned: 5 * 60 * 1000,
    payment_failed: 1 * 60 * 1000,
  };

  const delayMs = delays[event.stage] ?? 0;
  if (delayMs === 0) return;

  const { sessionId, stage, data } = event;
  const scheduledAt = new Date(Date.now() + delayMs);

  try {
    const service = await getGlobalNotificationService();

    let email: string | undefined;
    let phone: string | undefined;
    let emailSubject = "";
    let emailContent = "";
    let smsContent = "";

    switch (stage) {
      case "form_incomplete":
      case "form_partial": {
        const formData = (data?.formData as Record<string, unknown>) || {};
        email = formData.email as string | undefined;
        phone = formData.phone as string | undefined;
        const completion = (data?.completion as number) || 0;
        emailSubject = "Votre demande de devis est incomplète";
        emailContent = `Votre formulaire est complété à ${completion}%. Revenez terminer votre demande de déménagement sur quotin.fr`;
        smsContent = `Quotin : Votre demande est incomplète (${completion}%). Finalisez-la sur quotin.fr`;
        break;
      }

      case "quote_created":
      case "quote_viewed":
      case "quote_with_contact": {
        const quoteData = (data?.quoteData as Record<string, unknown>) || {};
        const customerInfo =
          (quoteData.customerInfo as Record<string, unknown>) || {};
        email = customerInfo.email as string | undefined;
        phone = customerInfo.phone as string | undefined;
        const name = (customerInfo.firstName as string) || "";
        const price = quoteData.totalPrice;
        emailSubject = "Votre devis de déménagement est disponible";
        emailContent = `Bonjour ${name},\n\nVotre devis de ${price}€ vous attend. Réservez votre déménagement sur quotin.fr\n\nCordialement,\nL'équipe Quotin`;
        smsContent = `Quotin : Votre devis de ${price}€ vous attend. Réservez sur quotin.fr`;
        break;
      }

      case "booking_created":
      case "payment_page":
      case "payment_abandoned": {
        const paymentData =
          (data?.paymentData as Record<string, unknown>) || {};
        const bookingData =
          (data?.bookingData as Record<string, unknown>) || {};
        const customerInfo =
          ((paymentData.customerInfo || bookingData.customerInfo) as Record<
            string,
            unknown
          >) || {};
        email = customerInfo.email as string | undefined;
        phone = customerInfo.phone as string | undefined;
        const name = (customerInfo.firstName as string) || "";
        const amount = paymentData.amount || bookingData.totalAmount;
        emailSubject = "Votre réservation est en attente de paiement";
        emailContent = `Bonjour ${name},\n\nVotre réservation de ${amount}€ est en attente de paiement. Finalisez votre paiement sur quotin.fr\n\nCordialement,\nL'équipe Quotin`;
        smsContent = `Quotin : Paiement de ${amount}€ en attente. Finalisez sur quotin.fr`;
        break;
      }
    }

    if (email && emailContent) {
      await service.sendNotification({
        id: `recovery-del-email-${sessionId}-${Date.now()}`,
        type: "email",
        recipient: email,
        subject: emailSubject,
        content: emailContent,
        priority: "normal",
        scheduledAt,
        metadata: { sessionId, stage },
      });
    }

    if (phone && smsContent) {
      await service.sendNotification({
        id: `recovery-del-sms-${sessionId}-${Date.now()}`,
        type: "sms",
        recipient: phone,
        content: smsContent,
        priority: "normal",
        scheduledAt,
        metadata: { sessionId, stage },
      });
    }
  } catch (error) {
    logger.error(
      "Erreur lors de la planification de récupération différée:",
      error,
    );
  }
}

/**
 * Calculer les statistiques d'abandon
 */
async function calculateAbandonStats(_dateFrom: Date) {
  // TODO: Implémenter via modèle abandonEvent Prisma
  return {
    totalAbandons: 0,
    recoveredAbandons: 0,
    recoveryRate: 0,
    abandonsByStage: [],
    hourlyAbandons: [],
    topAbandonPages: [],
  };
}

/**
 * Obtenir l'IP du client
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const real = request.headers.get("x-real-ip");

  if (forwarded) return forwarded.split(",")[0].trim();
  if (real) return real;
  return "unknown";
}
