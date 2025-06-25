export type MessageType = 'text' | 'template' | 'interactive' | 'media';
export type MediaType = 'image' | 'document' | 'video' | 'audio';

export interface WhatsAppMessage {
    id?: string;
    to: string;
    type: MessageType;
    text?: {
        body: string;
    };
    template?: WhatsAppTemplate;
    interactive?: InteractiveTemplate;
    media?: WhatsAppMediaMessage;
    timestamp?: Date;
    status?: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface WhatsAppTemplate {
    name: string;
    language: {
        code: string;
    };
    components?: Array<{
        type: string;
        parameters: Array<{
            type: string;
            text: string;
        }>;
    }>;
}

export interface WhatsAppMediaMessage {
    type: MediaType;
    url: string;
    caption?: string;
}

export interface InteractiveTemplate {
    type: 'list' | 'button';
    header?: {
        type: 'text';
        text: string;
    };
    body: {
        text: string;
    };
    footer?: {
        text: string;
    };
    action: {
        button?: string;
        buttons?: Array<{
            type: 'reply';
            reply: {
                id: string;
                title: string;
            };
        }>;
        sections?: Array<{
            title: string;
            rows: Array<{
                id: string;
                title: string;
                description?: string;
            }>;
        }>;
    };
}

export interface WhatsAppContact {
    phoneNumber: string;
    name?: string;
    optInStatus: 'opted_in' | 'opted_out' | 'unknown';
    lastInteraction?: Date;
    tags?: string[];
    preferences?: {
        language?: string;
        notifications?: {
            marketing: boolean;
            transactional: boolean;
            reminders: boolean;
        };
    };
}

export interface WhatsAppMessageStatus {
    id: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: Date;
    error?: {
        code: number;
        title: string;
    };
}

export interface WhatsAppAnalytics {
    period: 'day' | 'week' | 'month';
    metrics: {
        messagesSent: number;
        messagesDelivered: number;
        messagesRead: number;
        messagesFailed: number;
        averageResponseTime: number;
        templatePerformance: Record<string, {
            sent: number;
            delivered: number;
            read: number;
            responseRate: number;
        }>;
    };
    errors: Array<{
        code: string;
        count: number;
        percentage: number;
    }>;
} 