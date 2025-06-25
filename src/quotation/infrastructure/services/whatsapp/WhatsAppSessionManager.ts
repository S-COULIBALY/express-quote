import { differenceInHours, differenceInMinutes } from 'date-fns';
import { logger } from '@/lib/logger';

const sessionLogger = logger.withContext('WhatsAppSessionManager');

interface Session {
    lastInteraction: Date;
    status: 'active' | 'expired';
    context: Record<string, any>;
}

export class WhatsAppSessionManager {
    private sessions: Map<string, Session>;
    private readonly SESSION_TIMEOUT_HOURS = 24;
    private readonly CLEANUP_INTERVAL_MINUTES = 60;

    constructor() {
        this.sessions = new Map();
        this.startCleanupInterval();
    }

    public isSessionActive(phoneNumber: string): boolean {
        const session = this.sessions.get(phoneNumber);
        if (!session) return false;

        const hoursSinceLastInteraction = differenceInHours(
            new Date(),
            session.lastInteraction
        );

        const isActive = hoursSinceLastInteraction < this.SESSION_TIMEOUT_HOURS;
        
        if (!isActive && session.status === 'active') {
            session.status = 'expired';
            sessionLogger.info(`Session expired for ${phoneNumber}`);
        }

        return isActive;
    }

    public canSendTemplate(phoneNumber: string): boolean {
        return !this.isSessionActive(phoneNumber);
    }

    public updateSession(phoneNumber: string, interaction: 'incoming' | 'outgoing'): void {
        const existingSession = this.sessions.get(phoneNumber);
        const now = new Date();

        if (existingSession) {
            existingSession.lastInteraction = now;
            existingSession.status = 'active';
        } else {
            this.sessions.set(phoneNumber, {
                lastInteraction: now,
                status: 'active',
                context: {}
            });
            sessionLogger.info(`New session created for ${phoneNumber}`);
        }
    }

    public setSessionContext(phoneNumber: string, key: string, value: any): void {
        const session = this.sessions.get(phoneNumber);
        if (session) {
            session.context[key] = value;
        }
    }

    public getSessionContext(phoneNumber: string, key: string): any {
        const session = this.sessions.get(phoneNumber);
        return session?.context[key];
    }

    public clearSession(phoneNumber: string): void {
        this.sessions.delete(phoneNumber);
        sessionLogger.info(`Session cleared for ${phoneNumber}`);
    }

    private startCleanupInterval(): void {
        setInterval(() => {
            this.cleanupExpiredSessions();
        }, this.CLEANUP_INTERVAL_MINUTES * 60 * 1000);
    }

    private cleanupExpiredSessions(): void {
        const now = new Date();
        let expiredCount = 0;

        for (const [phoneNumber, session] of this.sessions.entries()) {
            const hoursSinceLastInteraction = differenceInHours(
                now,
                session.lastInteraction
            );

            if (hoursSinceLastInteraction >= this.SESSION_TIMEOUT_HOURS) {
                this.sessions.delete(phoneNumber);
                expiredCount++;
            }
        }

        if (expiredCount > 0) {
            sessionLogger.info(`Cleaned up ${expiredCount} expired sessions`);
        }
    }

    public getSessionStats(): {
        total: number;
        active: number;
        expired: number;
    } {
        let active = 0;
        let expired = 0;

        for (const [_, session] of this.sessions.entries()) {
            if (session.status === 'active') {
                active++;
            } else {
                expired++;
            }
        }

        return {
            total: this.sessions.size,
            active,
            expired
        };
    }
} 