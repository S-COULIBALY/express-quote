import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { logger } from '@/lib/logger';
import WhatsAppConfig from '@/quotation/infrastructure/config/whatsapp.config';

const middlewareLogger = logger.withContext('WhatsAppWebhookMiddleware');

export async function middleware(request: NextRequest) {
    try {
        // Vérifier la méthode HTTP
        if (!WhatsAppConfig.webhook.methods.includes(request.method as any)) {
            middlewareLogger.warn(`Method ${request.method} not allowed`);
            return new NextResponse('Method not allowed', { status: 405 });
        }

        // Pour les requêtes GET (vérification du webhook), on laisse passer
        if (request.method === 'GET') {
            return NextResponse.next();
        }

        // Pour les requêtes POST, on vérifie la signature
        const signature = request.headers.get('x-hub-signature-256');
        if (!signature) {
            middlewareLogger.warn('Missing signature header');
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Cloner le corps de la requête pour la vérification
        const body = await request.clone().text();
        
        // Vérifier la signature
        const isValid = verifySignature(body, signature);
        if (!isValid) {
            middlewareLogger.warn('Invalid signature');
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Vérifier l'IP source si configuré
        if (WhatsAppConfig.webhook.allowedIPs?.length > 0) {
            const clientIP = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0];
            if (!clientIP || !isAllowedIP(clientIP)) {
                middlewareLogger.warn(`Unauthorized IP: ${clientIP}`);
                return new NextResponse('Unauthorized', { status: 401 });
            }
        }

        // Rate limiting basique
        const rateLimitResult = await checkRateLimit(request);
        if (!rateLimitResult.allowed) {
            middlewareLogger.warn(`Rate limit exceeded for ${request.ip}`);
            return new NextResponse('Too Many Requests', {
                status: 429,
                headers: {
                    'Retry-After': rateLimitResult.retryAfter.toString()
                }
            });
        }

        return NextResponse.next();

    } catch (error) {
        middlewareLogger.error('Middleware error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

function verifySignature(body: string, signature: string): boolean {
    try {
        const appSecret = process.env.WHATSAPP_APP_SECRET;
        if (!appSecret) {
            throw new Error('WHATSAPP_APP_SECRET is not configured');
        }

        const expectedSignature = createHmac('sha256', appSecret)
            .update(body)
            .digest('hex');

        const providedSignature = signature.replace('sha256=', '');

        return expectedSignature === providedSignature;
    } catch (error) {
        middlewareLogger.error('Error verifying signature:', error);
        return false;
    }
}

function isAllowedIP(ip: string): boolean {
    const allowedIPs = WhatsAppConfig.webhook.allowedIPs || [];
    return allowedIPs.some(allowedIP => {
        // Support pour les plages CIDR
        if (allowedIP.includes('/')) {
            return isIPInCIDR(ip, allowedIP);
        }
        return ip === allowedIP;
    });
}

function isIPInCIDR(ip: string, cidr: string): boolean {
    try {
        const [range, bits = "32"] = cidr.split("/");
        const mask = ~((1 << (32 - parseInt(bits))) - 1);
        
        const ipInt = ipToInt(ip);
        const rangeInt = ipToInt(range);
        
        return (ipInt & mask) === (rangeInt & mask);
    } catch {
        return false;
    }
}

function ipToInt(ip: string): number {
    return ip.split('.')
        .reduce((int, oct) => (int << 8) + parseInt(oct), 0) >>> 0;
}

// Simple rate limiting en mémoire
const rateLimits = new Map<string, {
    count: number;
    timestamp: number;
}>();

async function checkRateLimit(request: NextRequest): Promise<{
    allowed: boolean;
    retryAfter: number;
}> {
    const WINDOW_MS = 60000; // 1 minute
    const MAX_REQUESTS = 100; // 100 requêtes par minute

    const now = Date.now();
    const ip = request.ip || 'unknown';

    const current = rateLimits.get(ip) || {
        count: 0,
        timestamp: now
    };

    // Réinitialiser si la fenêtre est passée
    if (now - current.timestamp > WINDOW_MS) {
        current.count = 0;
        current.timestamp = now;
    }

    current.count++;
    rateLimits.set(ip, current);

    // Nettoyer les anciennes entrées périodiquement
    if (Math.random() < 0.01) { // 1% de chance de nettoyage à chaque requête
        for (const [key, value] of rateLimits.entries()) {
            if (now - value.timestamp > WINDOW_MS) {
                rateLimits.delete(key);
            }
        }
    }

    const isAllowed = current.count <= MAX_REQUESTS;
    const retryAfter = Math.ceil((WINDOW_MS - (now - current.timestamp)) / 1000);

    return {
        allowed: isAllowed,
        retryAfter: isAllowed ? 0 : retryAfter
    };
} 