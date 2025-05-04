import { IPDFService } from '../../domain/interfaces/IPDFService';
import { Booking } from '../../domain/entities/Booking';
import { QuoteRequest } from '../../domain/entities/QuoteRequest';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';

export class PDFService implements IPDFService {
    private readonly baseOutputDir: string;
    
    constructor(baseOutputDir: string = './storage/pdfs') {
        this.baseOutputDir = baseOutputDir;
        this.ensureDirectoryExists(this.baseOutputDir);
    }
    
    private ensureDirectoryExists(dir: string): void {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    
    async generateQuotePDF(quoteRequest: QuoteRequest): Promise<string> {
        const quoteData = quoteRequest.getQuoteData();
        const quoteId = quoteRequest.getId();
        
        if (!quoteData) {
            throw new Error('Quote data not available');
        }
        
        const fileName = `quote_${quoteId}_${Date.now()}.pdf`;
        const filePath = path.join(this.baseOutputDir, fileName);
        
        const doc = new PDFDocument({ margin: 50 });
        const writeStream = fs.createWriteStream(filePath);
        
        doc.pipe(writeStream);
        
        // En-tête
        doc.fontSize(20)
           .text('Devis de service', { align: 'center' })
           .moveDown();
        
        // Informations du devis
        doc.fontSize(12)
           .text(`Référence: ${quoteId}`, { align: 'right' })
           .text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' })
           .moveDown();
        
        // Informations du client
        doc.fontSize(14)
           .text('Informations client', { underline: true })
           .moveDown()
           .fontSize(12);
           
        if (quoteData.email) {
            doc.text(`Email: ${quoteData.email}`);
        }
        
        if (quoteData.firstName && quoteData.lastName) {
            doc.text(`Client: ${quoteData.firstName} ${quoteData.lastName}`);
        }
        
        if (quoteData.phone) {
            doc.text(`Téléphone: ${quoteData.phone}`);
        }
        
        doc.moveDown();
        
        // Détails du service
        doc.fontSize(14)
           .text('Détails du service', { underline: true })
           .moveDown()
           .fontSize(12);
        
        if (quoteData.type) {
            doc.text(`Type de service: ${quoteData.type}`);
        }
        
        if (quoteData.scheduledDate) {
            const date = new Date(quoteData.scheduledDate);
            doc.text(`Date prévue: ${date.toLocaleDateString('fr-FR')}`);
        }
        
        if (quoteData.location) {
            doc.text(`Lieu: ${quoteData.location}`);
        }
        
        // Détails spécifiques selon le type de service
        if (quoteData.type === 'MOVING') {
            if (quoteData.pickupAddress) {
                doc.text(`Adresse de départ: ${quoteData.pickupAddress}`);
            }
            if (quoteData.deliveryAddress) {
                doc.text(`Adresse d'arrivée: ${quoteData.deliveryAddress}`);
            }
            if (quoteData.volume) {
                doc.text(`Volume: ${quoteData.volume} m³`);
            }
        } else if (quoteData.type === 'CLEANING') {
            if (quoteData.propertyType) {
                doc.text(`Type de propriété: ${quoteData.propertyType}`);
            }
            if (quoteData.squareMeters) {
                doc.text(`Surface: ${quoteData.squareMeters} m²`);
            }
        }
        
        doc.moveDown();
        
        // Prix et conditions
        if (quoteData.price) {
            doc.fontSize(14)
               .text('Tarification', { underline: true })
               .moveDown()
               .fontSize(12)
               .text(`Prix total: ${quoteData.price.toFixed(2)} €`)
               .text(`Acompte demandé: ${(quoteData.price * 0.3).toFixed(2)} €`)
               .text(`Solde à régler: ${(quoteData.price * 0.7).toFixed(2)} €`);
        }
        
        doc.moveDown();
        
        // Conditions générales
        doc.fontSize(14)
           .text('Conditions générales', { underline: true })
           .moveDown()
           .fontSize(10)
           .text('1. Ce devis est valable pour une durée de 30 jours à compter de sa date d\'émission.')
           .text('2. Un acompte de 30% est demandé pour confirmer la réservation.')
           .text('3. Le solde est à régler le jour de la prestation.')
           .text('4. Toute annulation doit être signalée au moins 48 heures à l\'avance.')
           .moveDown(2);
        
        // Pied de page
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            doc.fontSize(8)
               .text(
                 `Ce document a été généré automatiquement le ${new Date().toLocaleString('fr-FR')}`,
                 50,
                 doc.page.height - 50,
                 { align: 'center' }
               );
        }
        
        doc.end();
        
        return new Promise((resolve, reject) => {
            writeStream.on('finish', () => {
                resolve(filePath);
            });
            writeStream.on('error', reject);
        });
    }
    
    async generateBookingPDF(booking: Booking): Promise<string> {
        const bookingId = booking.getId();
        const customer = booking.getCustomer();
        const quote = booking.getQuote();
        
        const fileName = `booking_${bookingId}_${Date.now()}.pdf`;
        const filePath = path.join(this.baseOutputDir, fileName);
        
        const doc = new PDFDocument({ margin: 50 });
        const writeStream = fs.createWriteStream(filePath);
        
        doc.pipe(writeStream);
        
        // En-tête
        doc.fontSize(20)
           .text('Confirmation de réservation', { align: 'center' })
           .moveDown();
        
        // Informations de la réservation
        doc.fontSize(12)
           .text(`Référence: ${bookingId}`, { align: 'right' })
           .text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' })
           .moveDown();
        
        // Informations du client
        doc.fontSize(14)
           .text('Informations client', { underline: true })
           .moveDown()
           .fontSize(12);
           
        if (customer) {
            const contactInfo = customer.getContactInfo();
            doc.text(`Client: ${contactInfo.getFullName()}`);
            doc.text(`Email: ${contactInfo.getEmail()}`);
            doc.text(`Téléphone: ${contactInfo.getPhone()}`);
        }
        
        doc.moveDown();
        
        // Détails du service
        doc.fontSize(14)
           .text('Détails du service', { underline: true })
           .moveDown()
           .fontSize(12);
        
        const scheduledDate = booking.getScheduledDate();
        if (scheduledDate) {
            doc.text(`Date prévue: ${scheduledDate.toLocaleDateString('fr-FR')}`);
        }
        
        const location = booking.getLocation();
        if (location) {
            doc.text(`Lieu: ${location}`);
        }
        
        // Informations de paiement
        if (quote) {
            const total = quote.getTotalAmount();
            const deposit = total * 0.3; // Acompte de 30%
            
            doc.moveDown()
               .fontSize(14)
               .text('Informations de paiement', { underline: true })
               .moveDown()
               .fontSize(12)
               .text(`Prix total: ${total.toFixed(2)} €`)
               .text(`Acompte payé: ${deposit.toFixed(2)} €`)
               .text(`Solde à régler: ${(total - deposit).toFixed(2)} €`);
        }
        
        doc.moveDown();
        
        // Instructions
        doc.fontSize(14)
           .text('Instructions importantes', { underline: true })
           .moveDown()
           .fontSize(12)
           .text('1. Le prestataire arrivera à l\'heure prévue le jour du service.')
           .text('2. Veuillez assurer l\'accès à tous les espaces concernés par le service.')
           .text('3. Le solde de la prestation sera à régler le jour du service.')
           .text('4. Pour toute question ou modification, veuillez nous contacter au moins 24h avant la date prévue.')
           .moveDown(2);
        
        // Pied de page
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            doc.fontSize(8)
               .text(
                 `Ce document a été généré automatiquement le ${new Date().toLocaleString('fr-FR')}`,
                 50,
                 doc.page.height - 50,
                 { align: 'center' }
               );
        }
        
        doc.end();
        
        return new Promise((resolve, reject) => {
            writeStream.on('finish', () => {
                resolve(filePath);
            });
            writeStream.on('error', reject);
        });
    }
    
    async generateInvoicePDF(booking: Booking): Promise<string> {
        const bookingId = booking.getId();
        const customer = booking.getCustomer();
        const quote = booking.getQuote();
        
        const fileName = `invoice_${bookingId}_${Date.now()}.pdf`;
        const filePath = path.join(this.baseOutputDir, fileName);
        
        const doc = new PDFDocument({ margin: 50 });
        const writeStream = fs.createWriteStream(filePath);
        
        doc.pipe(writeStream);
        
        // En-tête
        doc.fontSize(20)
           .text('Facture', { align: 'center' })
           .moveDown();
        
        // Informations de la facture
        const invoiceNumber = `F${bookingId.substring(0, 8)}`;
        doc.fontSize(12)
           .text(`Numéro de facture: ${invoiceNumber}`, { align: 'right' })
           .text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' })
           .moveDown();
        
        // Informations du client
        doc.fontSize(14)
           .text('Facturé à', { underline: true })
           .moveDown()
           .fontSize(12);
           
        if (customer) {
            const contactInfo = customer.getContactInfo();
            doc.text(`Client: ${contactInfo.getFullName()}`);
            doc.text(`Email: ${contactInfo.getEmail()}`);
            doc.text(`Téléphone: ${contactInfo.getPhone()}`);
        }
        
        doc.moveDown();
        
        // Détails du service
        doc.fontSize(14)
           .text('Détails de la prestation', { underline: true })
           .moveDown();
        
        // Table d'items
        const tableTop = doc.y;
        const tableLeft = 50;
        const colWidths = [280, 80, 80];
        
        // En-têtes de colonne
        doc.font('Helvetica-Bold')
           .text('Description', tableLeft, tableTop)
           .text('Prix', tableLeft + colWidths[0], tableTop)
           .text('Total', tableLeft + colWidths[0] + colWidths[1], tableTop)
           .moveDown();
        
        let y = doc.y;
        
        // Ligne
        doc.moveTo(tableLeft, y)
           .lineTo(tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y)
           .stroke();
        
        doc.moveDown();
        y = doc.y;
        
        // Item principal
        if (quote) {
            doc.font('Helvetica')
               .text(booking.getDescription() || 'Service', tableLeft, y)
               .text(`${quote.getTotalAmount().toFixed(2)} €`, tableLeft + colWidths[0], y)
               .text(`${quote.getTotalAmount().toFixed(2)} €`, tableLeft + colWidths[0] + colWidths[1], y);
            
            doc.moveDown();
            
            y = doc.y;
            // Ligne de séparation
            doc.moveTo(tableLeft, y - 5)
               .lineTo(tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y - 5)
               .stroke();
            
            // Totaux
            const total = quote.getTotalAmount();
            const deposit = total * 0.3; // Considérer un acompte de 30%
            
            doc.moveDown()
               .font('Helvetica-Bold')
               .text('Sous-total', tableLeft + colWidths[0], y + 10)
               .text(`${total.toFixed(2)} €`, tableLeft + colWidths[0] + colWidths[1], y + 10);
            
            doc.moveDown();
            y = doc.y;
            
            doc.text('Acompte payé', tableLeft + colWidths[0], y)
               .text(`${deposit.toFixed(2)} €`, tableLeft + colWidths[0] + colWidths[1], y);
            
            doc.moveDown();
            y = doc.y;
            
            doc.text('Solde à payer', tableLeft + colWidths[0], y)
               .text(`${(total - deposit).toFixed(2)} €`, tableLeft + colWidths[0] + colWidths[1], y);
        }
        
        doc.moveDown(2);
        
        // Modalités de paiement
        doc.fontSize(14)
           .text('Modalités de paiement', { underline: true })
           .moveDown()
           .fontSize(12)
           .text('Le solde est à régler le jour de la prestation.')
           .text('Modes de paiement acceptés: Carte bancaire, Espèces')
           .moveDown();
        
        // Mentions légales
        doc.fontSize(10)
           .text('TVA non applicable, art. 293 B du CGI', { align: 'center' })
           .moveDown();
        
        // Pied de page
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            doc.fontSize(8)
               .text(
                 `Facture générée automatiquement le ${new Date().toLocaleString('fr-FR')}`,
                 50,
                 doc.page.height - 50,
                 { align: 'center' }
               );
        }
        
        doc.end();
        
        return new Promise((resolve, reject) => {
            writeStream.on('finish', () => {
                resolve(filePath);
            });
            writeStream.on('error', reject);
        });
    }
} 