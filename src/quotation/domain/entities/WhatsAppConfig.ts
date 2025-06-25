export class WhatsAppConfig {
    constructor(
        public readonly apiKey: string,
        public readonly phoneNumberId: string,
        public readonly businessAccountId: string,
        public readonly enabled: boolean,
        public readonly messageTypes: Record<string, WhatsAppMessageType>
    ) {}
}

export class WhatsAppMessageType {
    constructor(
        public readonly templateName: string,
        public readonly enabled: boolean,
        public readonly variables: string[]
    ) {}
} 