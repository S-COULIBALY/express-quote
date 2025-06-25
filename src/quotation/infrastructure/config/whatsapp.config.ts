export const WhatsAppConfig = {
    api: {
        version: 'v17.0',
        baseUrl: `https://graph.facebook.com/v17.0`,
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
        businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
        verifyToken: process.env.WHATSAPP_VERIFY_TOKEN
    },

    rateLimits: {
        messagesPerSecond: parseInt(process.env.WHATSAPP_RATE_LIMIT_MESSAGES_PER_SECOND || '20'),
        messagesPerDay: parseInt(process.env.WHATSAPP_RATE_LIMIT_MESSAGES_PER_DAY || '1000'),
        templateMessagesPerDay: parseInt(process.env.WHATSAPP_RATE_LIMIT_TEMPLATE_MESSAGES_PER_DAY || '500'),
        mediaMessagesPerDay: parseInt(process.env.WHATSAPP_RATE_LIMIT_MEDIA_MESSAGES_PER_DAY || '300')
    },

    queue: {
        batchSize: parseInt(process.env.WHATSAPP_QUEUE_BATCH_SIZE || '10'),
        processInterval: parseInt(process.env.WHATSAPP_QUEUE_PROCESS_INTERVAL || '1000'),
        maxRetries: parseInt(process.env.WHATSAPP_QUEUE_MAX_RETRIES || '3'),
        retryDelays: [1000, 5000, 15000] // ms
    },

    session: {
        timeoutHours: parseInt(process.env.WHATSAPP_SESSION_TIMEOUT_HOURS || '24'),
        cleanupIntervalMinutes: parseInt(process.env.WHATSAPP_SESSION_CLEANUP_INTERVAL_MINUTES || '60')
    },

    analytics: {
        maxHistorySize: parseInt(process.env.WHATSAPP_ANALYTICS_MAX_HISTORY_SIZE || '1000'),
        exportFormat: (process.env.WHATSAPP_ANALYTICS_EXPORT_FORMAT || 'json') as 'json' | 'csv'
    },

    templates: {
        defaultLanguage: 'fr',
        supportedLanguages: ['fr', 'en'],
        categories: ['MARKETING', 'UTILITY', 'AUTHENTICATION'] as const
    },

    webhook: {
        path: '/api/whatsapp/webhook',
        methods: ['GET', 'POST'] as const
    }
} as const;

// Types dérivés de la configuration
export type WhatsAppTemplateCategory = typeof WhatsAppConfig.templates.categories[number];
export type WhatsAppWebhookMethod = typeof WhatsAppConfig.webhook.methods[number];
export type WhatsAppExportFormat = typeof WhatsAppConfig.analytics.exportFormat;

// Validation de la configuration
function validateConfig(): void {
    const requiredEnvVars = [
        'WHATSAPP_ACCESS_TOKEN',
        'WHATSAPP_PHONE_NUMBER_ID',
        'WHATSAPP_BUSINESS_ACCOUNT_ID',
        'WHATSAPP_VERIFY_TOKEN'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        throw new Error(`Missing required WhatsApp configuration variables: ${missingVars.join(', ')}`);
    }

    // Validation des limites
    if (WhatsAppConfig.rateLimits.messagesPerSecond <= 0) {
        throw new Error('Invalid rate limit: messagesPerSecond must be positive');
    }
    if (WhatsAppConfig.rateLimits.messagesPerDay <= 0) {
        throw new Error('Invalid rate limit: messagesPerDay must be positive');
    }

    // Validation de la file d'attente
    if (WhatsAppConfig.queue.batchSize <= 0) {
        throw new Error('Invalid queue configuration: batchSize must be positive');
    }
    if (WhatsAppConfig.queue.processInterval <= 0) {
        throw new Error('Invalid queue configuration: processInterval must be positive');
    }
    if (WhatsAppConfig.queue.maxRetries <= 0) {
        throw new Error('Invalid queue configuration: maxRetries must be positive');
    }

    // Validation des sessions
    if (WhatsAppConfig.session.timeoutHours <= 0) {
        throw new Error('Invalid session configuration: timeoutHours must be positive');
    }
    if (WhatsAppConfig.session.cleanupIntervalMinutes <= 0) {
        throw new Error('Invalid session configuration: cleanupIntervalMinutes must be positive');
    }

    // Validation des analytics
    if (WhatsAppConfig.analytics.maxHistorySize <= 0) {
        throw new Error('Invalid analytics configuration: maxHistorySize must be positive');
    }
    if (!['json', 'csv'].includes(WhatsAppConfig.analytics.exportFormat)) {
        throw new Error('Invalid analytics configuration: exportFormat must be either "json" or "csv"');
    }
}

// Valider la configuration au démarrage
validateConfig();

export default WhatsAppConfig; 