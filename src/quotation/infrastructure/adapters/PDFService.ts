import { IPDFService } from '../../domain/interfaces/IPDFService';
import { Booking } from '../../domain/entities/Booking';
import { QuoteRequest } from '../../domain/entities/QuoteRequest';
import * as fs from 'fs';
import * as path from 'path';

export class PDFService implements IPDFService {
    private readonly baseOutputDir: string;
    
    constructor(baseOutputDir: string = './output/pdfs') {
        this.baseOutputDir = baseOutputDir;
        this.ensureDirectoryExists(this.baseOutputDir);
    }
    
    public async generateQuotePDF(quoteRequest: QuoteRequest): Promise<string> {
        try {
            console.log(`[PDF] Generating quote PDF for request ID: ${quoteRequest.getId()}`);
            
            // Simuler un délai pour la génération de PDF
            await this.delay(1000);
            
            // Créer le chemin de sortie
            const fileName = `quote_${quoteRequest.getId()}_${Date.now()}.pdf`;
            const outputPath = path.join(this.baseOutputDir, fileName);
            
            // Simuler la création d'un fichier (en mode simulé, on crée juste un fichier texte)
            this.createMockPDF(outputPath, `Quote request for ID: ${quoteRequest.getId()}`);
            
            console.log(`[PDF] Quote PDF generated at: ${outputPath}`);
            return outputPath;
        } catch (error) {
            console.error('[PDF] Failed to generate quote PDF:', error);
            throw new Error(`Failed to generate quote PDF: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    
    public async generateBookingPDF(booking: Booking): Promise<string> {
        try {
            console.log(`[PDF] Generating booking PDF for booking ID: ${booking.getId()}`);
            
            // Simuler un délai pour la génération de PDF
            await this.delay(1000);
            
            // Créer le chemin de sortie
            const fileName = `booking_${booking.getId()}_${Date.now()}.pdf`;
            const outputPath = path.join(this.baseOutputDir, fileName);
            
            // Simuler la création d'un fichier
            this.createMockPDF(outputPath, `Booking confirmation for ID: ${booking.getId()}`);
            
            console.log(`[PDF] Booking PDF generated at: ${outputPath}`);
            return outputPath;
        } catch (error) {
            console.error('[PDF] Failed to generate booking PDF:', error);
            throw new Error(`Failed to generate booking PDF: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    
    public async generateInvoicePDF(booking: Booking): Promise<string> {
        try {
            console.log(`[PDF] Generating invoice PDF for booking ID: ${booking.getId()}`);
            
            // Simuler un délai pour la génération de PDF
            await this.delay(1000);
            
            // Créer le chemin de sortie
            const fileName = `invoice_${booking.getId()}_${Date.now()}.pdf`;
            const outputPath = path.join(this.baseOutputDir, fileName);
            
            // Simuler la création d'un fichier
            this.createMockPDF(outputPath, `Invoice for booking ID: ${booking.getId()}, Amount: ${booking.getTotalAmount().toString()}`);
            
            console.log(`[PDF] Invoice PDF generated at: ${outputPath}`);
            return outputPath;
        } catch (error) {
            console.error('[PDF] Failed to generate invoice PDF:', error);
            throw new Error(`Failed to generate invoice PDF: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    
    private createMockPDF(filePath: string, content: string): void {
        // En mode simulé, on crée simplement un fichier texte
        // Dans une application réelle, on utiliserait une bibliothèque comme PDFKit
        fs.writeFileSync(filePath, content);
    }
    
    private ensureDirectoryExists(directory: string): void {
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
        }
    }
    
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
} 