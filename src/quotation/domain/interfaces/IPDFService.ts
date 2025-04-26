import { Booking } from '../entities/Booking';
import { QuoteRequest } from '../entities/QuoteRequest';

export interface IPDFService {
    /**
     * Génère un PDF pour un devis
     * @param quoteRequest La demande de devis
     * @returns Une promesse contenant le chemin du fichier PDF généré
     */
    generateQuotePDF(quoteRequest: QuoteRequest): Promise<string>;
    
    /**
     * Génère un PDF pour une réservation
     * @param booking La réservation
     * @returns Une promesse contenant le chemin du fichier PDF généré
     */
    generateBookingPDF(booking: Booking): Promise<string>;
    
    /**
     * Génère un PDF pour une facture basée sur une réservation
     * @param booking La réservation
     * @returns Une promesse contenant le chemin du fichier PDF généré
     */
    generateInvoicePDF(booking: Booking): Promise<string>;
} 