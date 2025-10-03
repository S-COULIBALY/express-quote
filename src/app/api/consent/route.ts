import { NextRequest, NextResponse } from 'next/server';
import { ConsentController } from '@/quotation/infrastructure/adapters/controllers/ConsentController';
import { container } from '@/quotation/application/container';

const consentController = container.resolve(ConsentController);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await consentController.recordConsent(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error recording consent:', error);
    return NextResponse.json(
      { error: 'Failed to record consent' },
      { status: 500 }
    );
  }
}