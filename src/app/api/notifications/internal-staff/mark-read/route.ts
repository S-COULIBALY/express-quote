import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationIds, staffId } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: "notificationIds array is required" },
        { status: 400 },
      );
    }

    // Marquer les notifications comme lues
    const result = await prisma.notifications.updateMany({
      where: {
        id: { in: notificationIds },
        ...(staffId ? { recipient_id: staffId } : {}),
      },
      data: {
        read_at: new Date(),
        status: "READ",
      },
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 },
    );
  }
}
