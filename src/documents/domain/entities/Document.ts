import { Entity, UniqueId } from '@/quotation/domain/entities/Entity';
import { Booking } from '@/quotation/domain/entities/Booking';

export enum DocumentType {
    // Documents de devis et réservation
    QUOTE = 'QUOTE',                           // Devis initial
    BOOKING_CONFIRMATION = 'BOOKING_CONFIRMATION', // Confirmation de réservation
    
    // Documents financiers
    INVOICE = 'INVOICE',                       // Facture
    PAYMENT_RECEIPT = 'PAYMENT_RECEIPT',       // Reçu de paiement
    
    // Documents contractuels
    CONTRACT = 'CONTRACT',                     // Contrat de service
    SERVICE_AGREEMENT = 'SERVICE_AGREEMENT',   // Accord de service
    
    // Documents logistiques (spécifiques déménagement/transport)
    DELIVERY_NOTE = 'DELIVERY_NOTE',           // Lettre de voiture/Bon de livraison
    TRANSPORT_MANIFEST = 'TRANSPORT_MANIFEST', // Manifeste de transport
    INVENTORY_LIST = 'INVENTORY_LIST',         // Liste d'inventaire
    PACKING_LIST = 'PACKING_LIST',            // Liste d'emballage
    
    // Documents administratifs
    CANCELLATION_NOTICE = 'CANCELLATION_NOTICE',     // Avis d'annulation
    MODIFICATION_NOTICE = 'MODIFICATION_NOTICE',     // Avis de modification
    COMPLETION_CERTIFICATE = 'COMPLETION_CERTIFICATE', // Certificat d'achèvement
    
    // Documents divers
    OTHER = 'OTHER'
}

export class Document extends Entity {
    private readonly createdAt: Date;

    constructor(
        private booking: Booking,
        private type: DocumentType,
        private filename: string,
        private content: Buffer,
        id?: UniqueId
    ) {
        super(id);
        this.createdAt = new Date();
        this.validate();
    }

    private validate(): void {
        if (!this.booking) {
            throw new Error('Booking is required');
        }
        if (!Object.values(DocumentType).includes(this.type)) {
            throw new Error('Invalid document type');
        }
        if (!this.filename || this.filename.trim().length === 0) {
            throw new Error('Filename is required');
        }
        if (!this.content || this.content.length === 0) {
            throw new Error('Content is required');
        }
    }

    public updateContent(content: Buffer): void {
        if (!content || content.length === 0) {
            throw new Error('Content cannot be empty');
        }
        this.content = content;
    }

    public updateFilename(filename: string): void {
        if (!filename || filename.trim().length === 0) {
            throw new Error('Filename cannot be empty');
        }
        this.filename = filename;
    }

    // Getters
    public getBooking(): Booking {
        return this.booking;
    }

    public getType(): DocumentType {
        return this.type;
    }

    public getFilename(): string {
        return this.filename;
    }

    public getContent(): Buffer {
        return Buffer.from(this.content);
    }

    public getCreatedAt(): Date {
        return new Date(this.createdAt);
    }
} 