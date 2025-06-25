import { logger } from '@/lib/logger';

const rateLimiterLogger = logger.withContext('WhatsAppRateLimiter');

interface RateLimit {
    count: number;
    resetAt: Date;
}

export class WhatsAppRateLimiter {
    private limits: Map<string, RateLimit>;
    
    // Limites par défaut de l'API WhatsApp Business
    private readonly DEFAULT_LIMITS = {
        MESSAGES_PER_SECOND: 20,
        MESSAGES_PER_DAY: 1000,
        TEMPLATE_MESSAGES_PER_DAY: 500,
        MEDIA_MESSAGES_PER_DAY: 300
    };

    constructor() {
        this.limits = new Map();
        this.initializeLimits();
    }

    private initializeLimits(): void {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        this.limits.set('messages_per_second', {
            count: 0,
            resetAt: new Date(now.getTime() + 1000)
        });

        this.limits.set('messages_per_day', {
            count: 0,
            resetAt: tomorrow
        });

        this.limits.set('template_messages', {
            count: 0,
            resetAt: tomorrow
        });

        this.limits.set('media_messages', {
            count: 0,
            resetAt: tomorrow
        });
    }

    public async canSendMessage(type: 'regular' | 'template' | 'media' = 'regular'): Promise<boolean> {
        this.checkAndResetLimits();

        // Vérifier la limite par seconde
        const perSecondLimit = this.limits.get('messages_per_second')!;
        if (perSecondLimit.count >= this.DEFAULT_LIMITS.MESSAGES_PER_SECOND) {
            rateLimiterLogger.warn('Rate limit reached: messages per second');
            return false;
        }

        // Vérifier la limite quotidienne
        const perDayLimit = this.limits.get('messages_per_day')!;
        if (perDayLimit.count >= this.DEFAULT_LIMITS.MESSAGES_PER_DAY) {
            rateLimiterLogger.warn('Rate limit reached: messages per day');
            return false;
        }

        // Vérifier les limites spécifiques au type
        if (type === 'template') {
            const templateLimit = this.limits.get('template_messages')!;
            if (templateLimit.count >= this.DEFAULT_LIMITS.TEMPLATE_MESSAGES_PER_DAY) {
                rateLimiterLogger.warn('Rate limit reached: template messages per day');
                return false;
            }
        } else if (type === 'media') {
            const mediaLimit = this.limits.get('media_messages')!;
            if (mediaLimit.count >= this.DEFAULT_LIMITS.MEDIA_MESSAGES_PER_DAY) {
                rateLimiterLogger.warn('Rate limit reached: media messages per day');
                return false;
            }
        }

        return true;
    }

    public async incrementCounter(type: 'regular' | 'template' | 'media' = 'regular'): Promise<void> {
        this.checkAndResetLimits();

        // Incrémenter le compteur par seconde
        const perSecondLimit = this.limits.get('messages_per_second')!;
        perSecondLimit.count++;

        // Incrémenter le compteur quotidien
        const perDayLimit = this.limits.get('messages_per_day')!;
        perDayLimit.count++;

        // Incrémenter le compteur spécifique au type
        if (type === 'template') {
            const templateLimit = this.limits.get('template_messages')!;
            templateLimit.count++;
        } else if (type === 'media') {
            const mediaLimit = this.limits.get('media_messages')!;
            mediaLimit.count++;
        }

        rateLimiterLogger.debug(`Incremented counter for ${type} message`);
    }

    private checkAndResetLimits(): void {
        const now = new Date();

        for (const [key, limit] of this.limits.entries()) {
            if (now >= limit.resetAt) {
                limit.count = 0;
                
                if (key === 'messages_per_second') {
                    limit.resetAt = new Date(now.getTime() + 1000);
                } else {
                    const tomorrow = new Date(now);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(0, 0, 0, 0);
                    limit.resetAt = tomorrow;
                }

                rateLimiterLogger.info(`Reset counter for ${key}`);
            }
        }
    }

    public getLimitStatus(): Record<string, {
        current: number;
        limit: number;
        resetIn: number;
    }> {
        const now = new Date();
        const status: Record<string, any> = {};

        for (const [key, limit] of this.limits.entries()) {
            let maxLimit: number;
            switch (key) {
                case 'messages_per_second':
                    maxLimit = this.DEFAULT_LIMITS.MESSAGES_PER_SECOND;
                    break;
                case 'messages_per_day':
                    maxLimit = this.DEFAULT_LIMITS.MESSAGES_PER_DAY;
                    break;
                case 'template_messages':
                    maxLimit = this.DEFAULT_LIMITS.TEMPLATE_MESSAGES_PER_DAY;
                    break;
                case 'media_messages':
                    maxLimit = this.DEFAULT_LIMITS.MEDIA_MESSAGES_PER_DAY;
                    break;
                default:
                    maxLimit = 0;
            }

            status[key] = {
                current: limit.count,
                limit: maxLimit,
                resetIn: Math.max(0, limit.resetAt.getTime() - now.getTime())
            };
        }

        return status;
    }
} 