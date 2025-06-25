import { WhatsAppMessage } from '../../../domain/interfaces/whatsapp/types';
import { logger } from '@/lib/logger';
import { WhatsAppRateLimiter } from './WhatsAppRateLimiter';

const queueLogger = logger.withContext('WhatsAppMessageQueue');

interface QueueItem {
    id: string;
    message: WhatsAppMessage;
    attempts: number;
    lastAttempt?: Date;
    priority: 'high' | 'normal' | 'low';
    addedAt: Date;
}

export class WhatsAppMessageQueue {
    private queue: QueueItem[];
    private processing: boolean;
    private rateLimiter: WhatsAppRateLimiter;

    private readonly MAX_ATTEMPTS = 3;
    private readonly RETRY_DELAYS = [1000, 5000, 15000]; // Délais en millisecondes
    private readonly BATCH_SIZE = 10;
    private readonly PROCESS_INTERVAL = 1000; // 1 seconde

    constructor(rateLimiter: WhatsAppRateLimiter) {
        this.queue = [];
        this.processing = false;
        this.rateLimiter = rateLimiter;
        this.startProcessing();
    }

    public async addMessage(
        message: WhatsAppMessage,
        priority: 'high' | 'normal' | 'low' = 'normal'
    ): Promise<string> {
        const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const queueItem: QueueItem = {
            id,
            message,
            attempts: 0,
            priority,
            addedAt: new Date()
        };

        this.queue.push(queueItem);
        this.sortQueue();

        queueLogger.info(`Message added to queue: ${id} (Priority: ${priority})`);
        return id;
    }

    public getQueueStatus(messageId: string): {
        position: number;
        status: 'queued' | 'processing' | 'not_found';
        attempts?: number;
        waitTime?: number;
    } {
        const index = this.queue.findIndex(item => item.id === messageId);
        
        if (index === -1) {
            return { position: -1, status: 'not_found' };
        }

        const item = this.queue[index];
        const waitTime = this.estimateWaitTime(index);

        return {
            position: index + 1,
            status: 'queued',
            attempts: item.attempts,
            waitTime
        };
    }

    private sortQueue(): void {
        this.queue.sort((a, b) => {
            // D'abord par priorité
            const priorityOrder = { high: 0, normal: 1, low: 2 };
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) return priorityDiff;

            // Ensuite par nombre de tentatives (moins de tentatives d'abord)
            const attemptsDiff = a.attempts - b.attempts;
            if (attemptsDiff !== 0) return attemptsDiff;

            // Enfin par date d'ajout
            return a.addedAt.getTime() - b.addedAt.getTime();
        });
    }

    private async startProcessing(): Promise<void> {
        if (this.processing) return;

        this.processing = true;
        while (true) {
            try {
                const batch = this.queue.slice(0, this.BATCH_SIZE);
                if (batch.length === 0) {
                    await new Promise(resolve => setTimeout(resolve, this.PROCESS_INTERVAL));
                    continue;
                }

                await Promise.all(
                    batch.map(item => this.processItem(item))
                );

                // Retirer les messages traités avec succès
                this.queue = this.queue.filter(item => 
                    !batch.find(processedItem => 
                        processedItem.id === item.id && 
                        processedItem.attempts <= this.MAX_ATTEMPTS
                    )
                );
            } catch (error) {
                queueLogger.error('Error processing message batch:', error);
                await new Promise(resolve => setTimeout(resolve, this.PROCESS_INTERVAL));
            }
        }
    }

    private async processItem(item: QueueItem): Promise<void> {
        if (!await this.rateLimiter.canSendMessage()) {
            queueLogger.warn(`Rate limit reached, delaying message: ${item.id}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return;
        }

        try {
            // Ici, vous devrez implémenter l'envoi réel du message via l'API WhatsApp
            // await this.whatsappApi.sendMessage(item.message);
            
            queueLogger.info(`Message sent successfully: ${item.id}`);
            item.attempts = this.MAX_ATTEMPTS + 1; // Marquer comme traité
        } catch (error) {
            item.attempts++;
            item.lastAttempt = new Date();

            if (item.attempts >= this.MAX_ATTEMPTS) {
                queueLogger.error(`Message failed after ${this.MAX_ATTEMPTS} attempts: ${item.id}`, error);
                // Ici, vous pourriez implémenter une logique de notification d'échec
            } else {
                const delay = this.RETRY_DELAYS[item.attempts - 1] || this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1];
                queueLogger.warn(`Message failed, retry ${item.attempts}/${this.MAX_ATTEMPTS} in ${delay}ms: ${item.id}`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    private estimateWaitTime(position: number): number {
        // Estimation basée sur la position dans la file et les limites de taux
        const averageProcessingTime = 200; // ms par message
        return position * averageProcessingTime;
    }

    public getQueueStats(): {
        total: number;
        high: number;
        normal: number;
        low: number;
        processing: number;
        failed: number;
    } {
        return {
            total: this.queue.length,
            high: this.queue.filter(item => item.priority === 'high').length,
            normal: this.queue.filter(item => item.priority === 'normal').length,
            low: this.queue.filter(item => item.priority === 'low').length,
            processing: this.queue.filter(item => item.attempts > 0 && item.attempts <= this.MAX_ATTEMPTS).length,
            failed: this.queue.filter(item => item.attempts >= this.MAX_ATTEMPTS).length
        };
    }
} 