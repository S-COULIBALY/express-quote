import PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Service d'infrastructure pour la génération de documents PDF
 */
export class PdfGeneratorService {
  private storagePath: string;
  private defaultLogoPath?: string;

  /**
   * Constructeur avec injection des dépendances
   */
  constructor(storagePath: string, defaultLogoPath?: string) {
    this.storagePath = storagePath;
    this.defaultLogoPath = defaultLogoPath;
    
    // Créer le répertoire de stockage s'il n'existe pas
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  /**
   * Génère un document PDF à partir d'un template et de données
   */
  async generatePdf(
    fileName: string,
    title: string,
    content: string,
    logoPath?: string,
    saveToFile: boolean = true,
    footerText: string = 'Express Quote - Solution de devis et réservations'
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];
        
        // Collecter les données du PDF
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          
          // Sauvegarder le fichier si demandé
          if (saveToFile) {
            const filePath = path.join(this.storagePath, fileName);
            fs.writeFileSync(filePath, pdfBuffer);
            console.log(`PDF sauvegardé: ${filePath}`);
          }
          
          resolve(pdfBuffer);
        });
        
        // Ajouter le logo si disponible
        const logo = logoPath || this.defaultLogoPath;
        if (logo && fs.existsSync(logo)) {
          doc.image(logo, 50, 45, { width: 150 })
             .moveDown();
        }
        
        // Ajouter l'en-tête
        doc.fontSize(20)
           .text(title, { align: 'center' })
           .moveDown();
        
        // Ajouter la date
        const date = new Date().toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        doc.fontSize(10)
           .text(`Date: ${date}`, { align: 'right' })
           .moveDown();
        
        // Ajouter le contenu principal
        doc.fontSize(12)
           .text(content, { align: 'left' })
           .moveDown(2);
        
        // Ajouter le pied de page
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          
          // Positionnement en bas de la page
          const bottomPos = doc.page.height - 50;
          
          doc.fontSize(10)
             .text(footerText, 50, bottomPos, { align: 'center' })
             .text(`Page ${i + 1} sur ${pageCount}`, 50, bottomPos + 15, { align: 'center' });
        }
        
        doc.end();
      } catch (error) {
        console.error('Erreur lors de la génération du PDF:', error);
        reject(new Error(`Erreur lors de la génération du PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`));
      }
    });
  }

  /**
   * Génère une facture
   */
  async generateInvoice(
    invoiceNumber: string,
    customerName: string,
    customerEmail: string,
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>,
    totalAmount: number,
    additionalInfo?: string
  ): Promise<Buffer> {
    let content = `
      FACTURE N° ${invoiceNumber}
      
      Facturé à:
      ${customerName}
      Email: ${customerEmail}
      
      Détails:
      --------------------------------------
    `;
    
    // Ajouter les éléments de la facture
    items.forEach(item => {
      content += `
      ${item.description}
      Quantité: ${item.quantity} x ${item.unitPrice.toFixed(2)} € = ${item.total.toFixed(2)} €
      `;
    });
    
    content += `
      --------------------------------------
      Montant total: ${totalAmount.toFixed(2)} €
      
      ${additionalInfo || ''}
      
      Cette facture fait office de reçu pour votre paiement.
    `;
    
    return this.generatePdf(
      `invoice_${invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      `FACTURE N° ${invoiceNumber}`,
      content
    );
  }

  /**
   * Génère une confirmation de réservation
   */
  async generateBookingConfirmation(
    bookingId: string,
    customerName: string,
    serviceType: string,
    serviceDate: Date | string | undefined,
    totalAmount: number,
    professionalName?: string,
    additionalInfo?: string
  ): Promise<Buffer> {
    const formattedDate = serviceDate 
      ? typeof serviceDate === 'string' 
        ? serviceDate 
        : serviceDate.toLocaleDateString('fr-FR')
      : 'À définir';
    
    let content = `
      CONFIRMATION DE RÉSERVATION
      
      Cher/Chère ${customerName},
      
      Nous vous confirmons votre réservation pour le service suivant:
      
      Réservation ID: ${bookingId}
      Type de service: ${serviceType}
      Date prévue: ${formattedDate}
      
      Montant total: ${totalAmount.toFixed(2)} €
      
      ${professionalName ? `Professionnel assigné: ${professionalName}` : 'Un professionnel sera bientôt assigné à votre réservation.'}
      
      ${additionalInfo || ''}
      
      Merci de votre confiance.
    `;
    
    return this.generatePdf(
      `booking_confirmation_${bookingId.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      'Confirmation de Réservation',
      content
    );
  }

  /**
   * Génère un contrat
   */
  async generateContract(
    contractId: string,
    customerName: string,
    customerEmail: string,
    professionalName: string,
    professionalEmail: string,
    serviceType: string,
    serviceDate: Date | string | undefined,
    totalAmount: number,
    termsAndConditions?: string
  ): Promise<Buffer> {
    const formattedDate = serviceDate 
      ? typeof serviceDate === 'string' 
        ? serviceDate 
        : serviceDate.toLocaleDateString('fr-FR')
      : 'À définir';
    
    let content = `
      CONTRAT DE SERVICE
      
      Entre:
      ${customerName}
      Email: ${customerEmail}
      
      Et:
      ${professionalName}
      Email: ${professionalEmail}
      
      Objet du contrat:
      Service de ${serviceType} tel que décrit dans la réservation ID ${contractId}.
      
      Montant: ${totalAmount.toFixed(2)} €
      
      Date d'exécution prévue: ${formattedDate}
      
      Conditions générales:
      1. Le client s'engage à permettre l'accès aux lieux pour l'exécution du service.
      2. Le prestataire s'engage à fournir le service tel que décrit dans les meilleurs délais.
      3. Toute annulation doit être notifiée au moins 48 heures à l'avance.
      4. Le paiement est dû conformément aux conditions générales de vente.
      
      ${termsAndConditions || ''}
    `;
    
    return this.generatePdf(
      `contract_${contractId.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      'Contrat de Service',
      content
    );
  }
} 