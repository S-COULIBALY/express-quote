import { NextRequest, NextResponse } from 'next/server';
import { NotificationController } from '@/notifications/interfaces/http/NotificationController';
import { container } from '@/quotation/application/container';

const notificationController = container.resolve(NotificationController);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    if (searchParams.has('health')) {
      const health = await notificationController.checkHealth();
      return NextResponse.json(health);
    }
    
    const notifications = await notificationController.getNotifications();
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error with notifications:', error);
    return NextResponse.json(
      { error: 'Notification service error' },
      { status: 500 }
    );
  }
}