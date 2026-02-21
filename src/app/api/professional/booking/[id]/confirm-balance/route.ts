import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { getGlobalNotificationService } from "@/notifications/interfaces/http/GlobalNotificationService";

async function authenticateProfessional(request: NextRequest): Promise<string> {
  const token =
    request.cookies.get("professional_token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("Non authentifié");
  const jwtSecret = process.env.JWT_SECRET || process.env.SIGNATURE_SECRET;
  if (!jwtSecret) throw new Error("JWT_SECRET non configuré");
  const decoded = jwt.verify(token, jwtSecret) as {
    type: string;
    professionalId: string;
  };
  if (decoded.type !== "professional")
    throw new Error("Type de token invalide");
  return decoded.professionalId;
}

/**
 * POST /api/professional/booking/[id]/confirm-balance
 * Confirme l'encaissement du solde (70%) par le chef d'équipe
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  let professionalId: string;
  try {
    professionalId = await authenticateProfessional(request);
  } catch {
    return NextResponse.json(
      { success: false, error: "Non authentifié" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const { paymentMethod } = body as { paymentMethod: string };

    if (!paymentMethod || !["CHEQUE", "TPE"].includes(paymentMethod)) {
      return NextResponse.json(
        {
          success: false,
          error: "Moyen de paiement invalide — CHEQUE ou TPE requis",
        },
        { status: 400 },
      );
    }

    const bookingId = params.id;

    // Récupérer la réservation avec le client et l'attribution
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        Customer: true,
        booking_attributions: {
          where: {
            accepted_professional_id: professionalId,
            status: "ACCEPTED",
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Réservation introuvable" },
        { status: 404 },
      );
    }

    // Vérifier que ce professionnel est attribué à cette réservation
    if (booking.booking_attributions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Non autorisé — vous n'êtes pas attribué à cette réservation",
        },
        { status: 403 },
      );
    }

    // Idempotence : solde déjà confirmé
    if (booking.balance_paid) {
      return NextResponse.json(
        {
          success: false,
          error: "Le solde a déjà été confirmé pour cette réservation",
        },
        { status: 409 },
      );
    }

    const balanceAmount = Math.round(booking.totalAmount * 0.7 * 100) / 100;
    const reference = `EQ-${bookingId.slice(-8).toUpperCase()}`;
    const methodLabel = paymentMethod === "CHEQUE" ? "Chèque" : "TPE";
    const now = new Date();

    // Récupérer les infos du professionnel
    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
      select: { companyName: true, phone: true },
    });

    // Mettre à jour le booking
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        balance_paid: true,
        balance_paid_at: now,
        balance_payment_method: paymentMethod,
        balance_paid_by_professional_id: professionalId,
      },
    });

    // Notifications admin (non bloquantes)
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPhone = process.env.SUPPORT_PHONE;
    const customerName = `${booking.Customer.firstName} ${booking.Customer.lastName}`;
    const companyName = professional?.companyName ?? professionalId;

    try {
      const service = await getGlobalNotificationService();

      if (adminEmail) {
        await service.sendNotification({
          id: `balance-email-${bookingId}-${Date.now()}`,
          type: "email",
          recipient: adminEmail,
          subject: `Solde encaissé — ${reference} (${balanceAmount}€)`,
          content: [
            `Solde encaissé pour la réservation ${reference}.`,
            ``,
            `Montant    : ${balanceAmount}€`,
            `Moyen      : ${methodLabel}`,
            `Prestataire: ${companyName}`,
            `Client     : ${customerName}`,
            `Date       : ${now.toLocaleString("fr-FR")}`,
          ].join("\n"),
          priority: "high",
          metadata: { bookingId, professionalId, paymentMethod },
        });
      }

      if (adminPhone) {
        await service.sendNotification({
          id: `balance-whatsapp-${bookingId}-${Date.now()}`,
          type: "whatsapp",
          recipient: adminPhone,
          content: `*Solde encaissé* — ${reference}\n${balanceAmount}€ par ${methodLabel}\nPrestataire : ${companyName}\nClient : ${customerName}`,
          priority: "high",
          metadata: { bookingId, professionalId, paymentMethod },
        });
      }
    } catch (notifError) {
      console.error(
        "[confirm-balance] Erreur notification (non bloquante):",
        notifError,
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        bookingId,
        reference,
        balanceAmount,
        paymentMethod,
        confirmedAt: updatedBooking.balance_paid_at,
      },
    });
  } catch (error) {
    console.error("[confirm-balance] Erreur:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 },
    );
  }
}
