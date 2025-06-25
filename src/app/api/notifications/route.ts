import { NextRequest, NextResponse } from 'next/server';
import { NotificationController } from '@/quotation/interfaces/controllers/NotificationController';

export async function POST(request: NextRequest) {
  return NotificationController.handleNotification(request);
} 