import PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Configuration pour PdfGeneratorService
 */
interface PdfGeneratorConfig {
  storagePath: string;
  defaultLogoPath?: string;
  companyName: string;
  companyLogo?: string;
  brandColor?: string;
  footerText?: string;
  fonts?: {
    primary: string;
    fallback: string;
  };
}

/**
 * Service d'infrastructure pour la génération de documents PDF
 */
export class PdfGeneratorService {
  private config: PdfGeneratorConfig;

  /**
   * Constructeur avec configuration externalisée
   */
  constructor(config?: Partial<PdfGeneratorConfig>) {
    this.config = {
      storagePath: config?.storagePath || process.env.PDF_STORAGE_PATH || './storage/documents',
      defaultLogoPath: config?.defaultLogoPath || process.env.DEFAULT_LOGO_PATH,
      companyName: config?.companyName || process.env.COMPANY_NAME || 'Express Quote',
      companyLogo: config?.companyLogo || process.env.COMPANY_LOGO_URL,
      brandColor: config?.brandColor || process.env.BRAND_COLOR || '#007ee6',
      footerText: config?.footerText || process.env.PDF_FOOTER_TEXT || 'Express Quote - Solution de devis et réservations',
      fonts: {
        primary: config?.fonts?.primary || process.env.PDF_PRIMARY_FONT || '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
        fallback: config?.fonts?.fallback || 'Arial, sans-serif'
      }
    };

    // Créer le répertoire de stockage s'il n'existe pas
    this.ensureStorageExists();
  }

  /**
   * Assure que le répertoire de stockage existe
   */
  private ensureStorageExists(): void {
    try {
      if (!fs.existsSync(this.config.storagePath)) {
        fs.mkdirSync(this.config.storagePath, { recursive: true });
      }
    } catch (error) {
      console.error('Erreur lors de la création du répertoire de stockage:', error);
      throw new Error(`Impossible de créer le répertoire de stockage: ${this.config.storagePath}`);
    }
  }

  /**
   * Met à jour la configuration
   */
  public updateConfig(newConfig: Partial<PdfGeneratorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.storagePath) {
      this.ensureStorageExists();
    }
  }

  /**
   * Obtient la configuration actuelle
   */
  public getConfig(): PdfGeneratorConfig {
    return { ...this.config };
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
    footerText?: string
  ): Promise<Buffer> {
    const finalFooterText = footerText || this.config.footerText;
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
            const filePath = path.join(this.config.storagePath, fileName);
            fs.writeFileSync(filePath, pdfBuffer);
            console.log(`PDF sauvegardé: ${filePath}`);
          }
          
          resolve(pdfBuffer);
        });
        
        // Ajouter le logo si disponible
        const logo = logoPath || this.config.defaultLogoPath || this.config.companyLogo;
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
             .text(finalFooterText, 50, bottomPos, { align: 'center' })
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
    
    const content = `
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
   * Génère un devis
   */
  async generateQuote(
    quoteId: string,
    customerName: string,
    customerEmail: string,
    serviceType: string,
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>,
    totalAmount: number,
    validUntil?: Date,
    additionalInfo?: string
  ): Promise<Buffer> {
    const validityDate = validUntil 
      ? validUntil.toLocaleDateString('fr-FR')
      : 'Non spécifiée';
    
    let content = `
      DEVIS N° ${quoteId}
      
      Client:
      ${customerName}
      Email: ${customerEmail}
      
      Service demandé: ${serviceType}
      
      Détails du devis:
      --------------------------------------
    `;
    
    // Ajouter les éléments du devis
    items.forEach(item => {
      content += `
      ${item.description}
      Quantité: ${item.quantity} x ${item.unitPrice.toFixed(2)} € = ${item.total.toFixed(2)} €
      `;
    });
    
    content += `
      --------------------------------------
      Montant total: ${totalAmount.toFixed(2)} €
      
      Validité du devis: ${validityDate}
      
      ${additionalInfo || ''}
      
      Ce devis est valable sous réserve d'acceptation dans les délais indiqués.
    `;
    
    return this.generatePdf(
      `quote_${quoteId.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      `DEVIS N° ${quoteId}`,
      content
    );
  }

  /**
   * Génère un reçu de paiement
   */
  async generatePaymentReceipt(
    receiptId: string,
    customerName: string,
    customerEmail: string,
    paymentAmount: number,
    paymentMethod: string,
    paymentDate: Date,
    bookingReference?: string,
    additionalInfo?: string
  ): Promise<Buffer> {
    const formattedDate = paymentDate.toLocaleDateString('fr-FR');
    
    const content = `
      REÇU DE PAIEMENT N° ${receiptId}
      
      Reçu de:
      ${customerName}
      Email: ${customerEmail}
      
      Montant reçu: ${paymentAmount.toFixed(2)} €
      Mode de paiement: ${paymentMethod}
      Date de paiement: ${formattedDate}
      
      ${bookingReference ? `Référence réservation: ${bookingReference}` : ''}
      
      ${additionalInfo || ''}
      
      Nous accusons réception de votre paiement.
      Ce reçu fait office de justificatif de paiement.
    `;
    
    return this.generatePdf(
      `receipt_${receiptId.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      `REÇU DE PAIEMENT N° ${receiptId}`,
      content
    );
  }

  /**
   * Génère une lettre de voiture / bon de livraison
   */
  async generateDeliveryNote(
    deliveryId: string,
    customerName: string,
    customerAddress: string,
    professionalName: string,
    serviceType: string,
    scheduledDate: Date | string | undefined,
    itemsList: string[],
    specialInstructions?: string
  ): Promise<Buffer> {
    const formattedDate = scheduledDate 
      ? typeof scheduledDate === 'string' 
        ? scheduledDate 
        : scheduledDate.toLocaleDateString('fr-FR')
      : 'À définir';
    
    const itemsContent = itemsList.length > 0 
      ? itemsList.map(item => `• ${item}`).join('\n      ')
      : 'Détails à préciser sur site';
    
    const content = `
      LETTRE DE VOITURE / BON DE LIVRAISON
      N° ${deliveryId}
      
      Client:
      ${customerName}
      Adresse: ${customerAddress}
      
      Prestataire:
      ${professionalName}
      
      Type de service: ${serviceType}
      Date prévue: ${formattedDate}
      
      Liste des éléments à transporter/traiter:
      ${itemsContent}
      
      Instructions spéciales:
      ${specialInstructions || 'Aucune instruction particulière'}
      
      Ce document accompagne les biens durant le transport.
      
      Signature client: ________________    Signature prestataire: ________________
    `;
    
    return this.generatePdf(
      `delivery_note_${deliveryId.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      'LETTRE DE VOITURE',
      content
    );
  }

  /**
   * Génère un manifeste de transport
   */
  async generateTransportManifest(
    manifestId: string,
    professionalName: string,
    vehicleInfo: string,
    transportDate: Date,
    route: Array<{
      customerName: string;
      address: string;
      items: string[];
      timeSlot?: string;
    }>,
    additionalInfo?: string
  ): Promise<Buffer> {
    const formattedDate = transportDate.toLocaleDateString('fr-FR');
    
    let routeContent = '';
    route.forEach((stop, index) => {
      routeContent += `
      ${index + 1}. ${stop.customerName}
         Adresse: ${stop.address}
         Créneau: ${stop.timeSlot || 'Non défini'}
         Éléments: ${stop.items.join(', ')}
      `;
    });
    
    const content = `
      MANIFESTE DE TRANSPORT N° ${manifestId}
      
      Prestataire: ${professionalName}
      Véhicule: ${vehicleInfo}
      Date de transport: ${formattedDate}
      
      Itinéraire prévu:
      ${routeContent}
      
      ${additionalInfo || ''}
      
      Document interne pour la planification du transport.
    `;
    
    return this.generatePdf(
      `transport_manifest_${manifestId.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      'MANIFESTE DE TRANSPORT',
      content
    );
  }

  /**
   * Génère une liste d'inventaire
   */
  async generateInventoryList(
    inventoryId: string,
    customerName: string,
    location: string,
    inventoryDate: Date,
    items: Array<{
      category: string;
      description: string;
      condition: string;
      quantity: number;
      estimatedValue?: number;
    }>,
    additionalNotes?: string
  ): Promise<Buffer> {
    const formattedDate = inventoryDate.toLocaleDateString('fr-FR');
    
    let itemsContent = '';
    let totalValue = 0;
    
    // Grouper par catégorie
    const groupedItems = items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      if (item.estimatedValue) {
        totalValue += item.estimatedValue;
      }
      return acc;
    }, {} as Record<string, typeof items>);
    
    Object.entries(groupedItems).forEach(([category, categoryItems]) => {
      itemsContent += `
      
      ${category.toUpperCase()}:
      `;
      categoryItems.forEach(item => {
        itemsContent += `
      • ${item.description} (Qté: ${item.quantity})
        État: ${item.condition}${item.estimatedValue ? ` - Valeur estimée: ${item.estimatedValue.toFixed(2)} €` : ''}
      `;
      });
    });
    
    const content = `
      LISTE D'INVENTAIRE N° ${inventoryId}
      
      Client: ${customerName}
      Lieu: ${location}
      Date d'inventaire: ${formattedDate}
      
      INVENTAIRE DES BIENS:
      ${itemsContent}
      
      ${totalValue > 0 ? `Valeur totale estimée: ${totalValue.toFixed(2)} €` : ''}
      
      ${additionalNotes || ''}
      
      Cette liste d'inventaire a été établie contradictoirement.
      
      Signature client: ________________    Signature prestataire: ________________
    `;
    
    return this.generatePdf(
      `inventory_${inventoryId.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      'LISTE D\'INVENTAIRE',
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
    
    const content = `
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