import { NextRequest, NextResponse } from 'next/server';
import { NotificationController } from '@/notifications/interfaces/http/NotificationController';
import { container } from '@/config/dependency-injection';

const notificationController = container.resolve(NotificationController);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await notificationController.markInternalStaffNotificationsAsRead(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}

