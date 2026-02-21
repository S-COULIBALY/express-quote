import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force le rendu dynamique (évite erreur de build Vercel)
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Health check
    if (searchParams.has("health")) {
      return NextResponse.json({
        status: "healthy",
        service: "notifications",
        timestamp: new Date().toISOString(),
      });
    }

    // Get recent notifications
    const recipientId = searchParams.get("recipientId");
    const limit = parseInt(searchParams.get("limit") || "20");

    const notifications = await prisma.notifications.findMany({
      where: recipientId ? { recipient_id: recipientId } : {},
      orderBy: { created_at: "desc" },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error("Error with notifications:", error);
    return NextResponse.json(
      { error: "Notification service error" },
      { status: 500 },
    );
  }
}
