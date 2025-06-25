import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/quotation/infrastructure/adapters/WhatsAppService';
import { logger } from '@/lib/logger';
import { whatsAppService } from '@/config/services';

const webhookLogger = logger.withContext('WhatsAppWebhookController');

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const mode = searchParams.get('hub.mode');
        const token = searchParams.get('hub.verify_token');
        const challenge = searchParams.get('hub.challenge');

        if (!mode || !token || !challenge) {
            webhookLogger.warn('Missing required webhook verification parameters');
            return new NextResponse('Missing parameters', { status: 400 });
        }

        const response = whatsAppService.verifyWebhook(mode, token, challenge);
        
        if (response === null) {
            webhookLogger.warn('Webhook verification failed');
            return new NextResponse('Forbidden', { status: 403 });
        }

        webhookLogger.info('Webhook verified successfully');
        return new NextResponse(response);

    } catch (error) {
        webhookLogger.error('Error processing webhook verification:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json();

        if (!payload) {
            webhookLogger.warn('Empty webhook payload received');
            return new NextResponse('No payload', { status: 400 });
        }

        await whatsAppService.handleWebhook(payload);
        
        webhookLogger.info('Webhook processed successfully');
        return new NextResponse('OK');

    } catch (error) {
        webhookLogger.error('Error processing webhook:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
} 