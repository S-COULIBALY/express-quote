import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TODO: Réactiver l'auth admin quand le système d'auth admin sera unifié
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/balance
 * Retourne les soldes en attente et les soldes confirmés récemment
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") ?? "pending"; // pending | confirmed | all

    const where: Record<string, unknown> =
      filter === "pending"
        ? { status: "PAYMENT_COMPLETED", balance_paid: false }
        : filter === "confirmed"
          ? { balance_paid: true }
          : {};

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        Customer: {
          select: { firstName: true, lastName: true, phone: true, email: true },
        },
        booking_attributions: {
          where: { status: "ACCEPTED" },
          include: {
            Professional: { select: { companyName: true, phone: true } },
          },
        },
        Moving: { select: { moveDate: true } },
      },
      orderBy: { scheduledDate: "asc" },
      take: 50,
    });

    const data = bookings.map((b) => {
      const attribution = b.booking_attributions[0];
      return {
        id: b.id,
        reference: `EQ-${b.id.slice(-8).toUpperCase()}`,
        totalAmount: b.totalAmount,
        balanceAmount: Math.round(b.totalAmount * 0.7 * 100) / 100,
        depositAmount: Math.round(b.totalAmount * 0.3 * 100) / 100,
        status: b.status,
        scheduledDate: b.scheduledDate ?? b.Moving?.moveDate ?? null,
        balance_paid: b.balance_paid,
        balance_paid_at: b.balance_paid_at,
        balance_payment_method: b.balance_payment_method,
        customer: {
          name: `${b.Customer.firstName} ${b.Customer.lastName}`,
          phone: b.Customer.phone,
          email: b.Customer.email,
        },
        professional: attribution?.Professional
          ? {
              companyName: attribution.Professional.companyName,
              phone: attribution.Professional.phone,
            }
          : null,
      };
    });

    const totalPendingAmount = data
      .filter((b) => !b.balance_paid)
      .reduce((sum, b) => sum + b.balanceAmount, 0);

    return NextResponse.json({
      success: true,
      data,
      meta: {
        total: data.length,
        totalPendingAmount: Math.round(totalPendingAmount * 100) / 100,
      },
    });
  } catch (error) {
    console.error("[admin/balance] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
