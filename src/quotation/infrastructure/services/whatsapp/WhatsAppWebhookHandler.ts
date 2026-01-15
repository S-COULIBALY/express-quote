// @ts-nocheck
// Types d'indexation sur tableaux optionnels (messages?[0])
import { logger } from '@/lib/logger';
import { WhatsAppSessionManager } from './WhatsAppSessionManager';
import { WhatsAppMessageQueue } from './WhatsAppMessageQueue';
import { WhatsAppAnalytics } from './WhatsAppAnalytics';

const webhookLogger = logger.withContext('WhatsAppWebhookHandler');

interface WebhookPayload {
    object: string;
    entry: Array<{
        id: string;
        changes: Array<{
            value: {
                messaging_product: string;
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                contacts?: Array<{
                    profile: {
                        name: string;
                    };
                    wa_id: string;
                }>;
                messages?: Array<{
                    from: string;
                    id: string;
                    timestamp: string;
                    type: string;
                    text?: {
                        body: string;
                    };
                    interactive?: {
                        type: string;
                        button_reply?: {
                            id: string;
                            title: string;
                        };
                        list_reply?: {
                            id: string;
                            title: string;
                            description?: string;
                        };
                    };
                    image?: {
                        mime_type: string;
                        sha256: string;
                        id: string;
                    };
                    document?: {
                        filename: string;
                        mime_type: string;
                        sha256: string;
                        id: string;
                    };
                }>;
                statuses?: Array<{
                    id: string;
                    status: string;
                    timestamp: string;
                    recipient_id: string;
                    errors?: Array<{
                        code: number;
                        title: string;
                    }>;
                }>;
            };
            field: string;
        }>;
    }>;
}

export class WhatsAppWebhookHandler {
    private readonly VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
    private sessionManager: WhatsAppSessionManager;
    private messageQueue: WhatsAppMessageQueue;
    private analytics: WhatsAppAnalytics;

    constructor(
        sessionManager: WhatsAppSessionManager,
        messageQueue: WhatsAppMessageQueue,
        analytics: WhatsAppAnalytics
    ) {
        this.sessionManager = sessionManager;
        this.messageQueue = messageQueue;
        this.analytics = analytics;
    }

    public verifyWebhook(mode: string, token: string, challenge: string): string | null {
        if (mode === 'subscribe' && token === this.VERIFY_TOKEN) {
            webhookLogger.info('Webhook verified successfully');
            return challenge;
        }
        webhookLogger.warn('Webhook verification failed');
        return null;
    }

    public async handleWebhook(payload: WebhookPayload): Promise<void> {
        try {
            if (payload.object !== 'whatsapp_business_account') {
                webhookLogger.warn(`Received webhook for unknown object type: ${payload.object}`);
                return;
            }

            for (const entry of payload.entry) {
                for (const change of entry.changes) {
                    if (change.field !== 'messages') {
                        continue;
                    }

                    const value = change.value;

                    // Traiter les messages entrants
                    if (value.messages) {
                        await this.handleIncomingMessages(value.messages);
                    }

                    // Traiter les mises à jour de statut
                    if (value.statuses) {
                        await this.handleStatusUpdates(value.statuses);
                    }
                }
            }
        } catch (error) {
            webhookLogger.error('Error processing webhook:', error);
            throw error;
        }
    }

    private async handleIncomingMessages(messages: WebhookPayload['entry'][0]['changes'][0]['value']['messages']): Promise<void> {
        if (!messages) return;

        for (const message of messages) {
            try {
                // Mettre à jour la session
                this.sessionManager.updateSession(message.from, 'incoming');

                // Enregistrer l'analytique
                await this.analytics.trackIncomingMessage({
                    from: message.from,
                    type: message.type,
                    timestamp: new Date(parseInt(message.timestamp) * 1000)
                });

                // Traiter selon le type de message
                switch (message.type) {
                    case 'text':
                        await this.handleTextMessage(message);
                        break;
                    case 'interactive':
                        await this.handleInteractiveMessage(message);
                        break;
                    case 'image':
                    case 'document':
                        await this.handleMediaMessage(message);
                        break;
                    default:
                        webhookLogger.warn(`Received unsupported message type: ${message.type}`);
                }

            } catch (error) {
                webhookLogger.error(`Error processing message ${message.id}:`, error);
            }
        }
    }

    private async handleStatusUpdates(statuses: WebhookPayload['entry'][0]['changes'][0]['value']['statuses']): Promise<void> {
        if (!statuses) return;

        for (const status of statuses) {
            try {
                await this.analytics.trackMessageStatus({
                    messageId: status.id,
                    recipientId: status.recipient_id,
                    status: status.status,
                    timestamp: new Date(parseInt(status.timestamp) * 1000),
                    errors: status.errors
                });

                if (status.status === 'failed') {
                    webhookLogger.error(`Message ${status.id} failed:`, status.errors);
                    // Implémenter la logique de retry si nécessaire
                }

            } catch (error) {
                webhookLogger.error(`Error processing status update ${status.id}:`, error);
            }
        }
    }

    private async handleTextMessage(message: WebhookPayload['entry'][0]['changes'][0]['value']['messages'][0]): Promise<void> {
        if (!message.text) return;

        // Ici, vous pouvez implémenter la logique de traitement des messages texte
        // Par exemple, un système de mots-clés ou l'intégration avec un chatbot
        webhookLogger.info(`Received text message from ${message.from}: ${message.text.body}`);
    }

    private async handleInteractiveMessage(message: WebhookPayload['entry'][0]['changes'][0]['value']['messages'][0]): Promise<void> {
        if (!message.interactive) return;

        const response = message.interactive.button_reply || message.interactive.list_reply;
        if (!response) return;

        // Traiter la réponse interactive
        webhookLogger.info(`Received interactive response from ${message.from}: ${response.id} - ${response.title}`);
        
        // Ici, vous pouvez implémenter la logique de traitement des réponses interactives
        // Par exemple, mettre à jour le statut d'une réservation ou confirmer un rendez-vous
    }

    private async handleMediaMessage(message: WebhookPayload['entry'][0]['changes'][0]['value']['messages'][0]): Promise<void> {
        const mediaInfo = message.image || message.document;
        if (!mediaInfo) return;

        // Ici, vous pouvez implémenter la logique de traitement des médias
        // Par exemple, télécharger et stocker les fichiers, analyser les images, etc.
        webhookLogger.info(`Received media message from ${message.from}: ${mediaInfo.mime_type}`);
    }
} 