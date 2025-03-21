import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Booking, Customer, Professional } from '@prisma/client';
import { Buffer } from 'buffer';
import { prisma } from '@/lib/prisma';
import { DocumentType } from '@prisma/client';

interface Customer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface BookingWithPrice extends Booking {
  totalPrice: number;
}

interface BookingDetails {
  id: string;
  type: 'quote' | 'pack' | 'service';
  scheduledDate: Date;
  originAddress?: string;
  destAddress: string;
  customer: Customer;
  price: number;
  deposit: number;
  serviceName?: string;
  packName?: string;
  quoteSummary?: {
    volume: number;
    distance: number;
    options: string[];
  };
  name: string;
  date: string;
  details: any;
}

// Type de document pour stocker les PDFs
enum DocumentType {
  BOOKING_CONFIRMATION = 'BOOKING_CONFIRMATION',
  PAYMENT_RECEIPT = 'PAYMENT_RECEIPT',
  CONTRACT = 'CONTRACT',
  INVOICE = 'INVOICE'
}

interface BookingData {
  id: string;
  type: 'QUOTE' | 'PACK' | 'SERVICE';
  status: string;
  scheduledDate: string;
  scheduledTime?: string;
  originAddress?: string;
  destAddress: string;
  totalAmount: number;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  quote?: {
    basePrice: number;
    finalPrice: number;
    volume?: number;
    distance?: number;
  };
  pack?: {
    name: string;
    description: string;
    price: number;
  };
  services?: Array<{
    service: {
      name: string;
      description: string;
      price: number;
    };
    serviceDate: string;
  }>;
  items?: Array<{
    name: string;
    quantity: number;
  }>;
}

interface GeneratePdfOptions {
  title: string;
  filename: string;
  data: any;
}

/**
 * Génère un PDF de confirmation pour une réservation
 * @param booking Données de la réservation
 * @returns Buffer contenant le PDF généré
 */
export async function generateBookingConfirmationPdf(booking: BookingData): Promise<Buffer> {
  console.log('Génération du PDF pour la réservation', booking.id);
  
  const doc = new PDFDocument({ margin: 50 });
  
  // Capture le document PDF en morceaux de buffer
  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  
  // Définition des styles et constantes
  const titleFontSize = 26;
  const headingFontSize = 16;
  const regularFontSize = 12;
  const smallFontSize = 10;
  
  // Logo et en-tête
  doc.fontSize(titleFontSize)
     .text('Express Déménagement', { align: 'center' });
  
  doc.moveDown(1);
  doc.fontSize(headingFontSize)
     .text('Confirmation de Réservation', { align: 'center' });

  doc.moveDown(1);
  addSeparator(doc);
  
  // Informations générales sur la réservation
  doc.moveDown(1);
  doc.fontSize(headingFontSize)
     .text('Détails de la réservation');
  
  doc.moveDown(0.5);
  doc.fontSize(regularFontSize)
     .text(`Numéro de référence: ${booking.id}`);
  
  doc.moveDown(0.5);
  doc.text(`Date: ${formatDate(booking.scheduledDate)}` + 
           (booking.scheduledTime ? ` à ${booking.scheduledTime}` : ''));
  
  doc.moveDown(0.5);
  doc.text(`Statut: ${booking.status}`);
  
  // Adresses
  doc.moveDown(1);
  doc.fontSize(headingFontSize)
     .text('Adresses');
  
  doc.moveDown(0.5);
  doc.fontSize(regularFontSize);
  
  if (booking.originAddress) {
    doc.text('Adresse de départ:');
    doc.moveDown(0.2);
    doc.fontSize(smallFontSize)
       .text(booking.originAddress, { indent: 20 });
    doc.moveDown(0.5);
    doc.fontSize(regularFontSize);
  }
  
  doc.text('Adresse de destination:');
  doc.moveDown(0.2);
  doc.fontSize(smallFontSize)
     .text(booking.destAddress, { indent: 20 });
  
  // Informations du client
  doc.moveDown(1);
  doc.fontSize(headingFontSize)
     .text('Informations client');
  
  doc.moveDown(0.5);
  doc.fontSize(regularFontSize)
     .text(`Nom: ${booking.customer.firstName} ${booking.customer.lastName}`);
  doc.moveDown(0.2);
  doc.text(`Email: ${booking.customer.email}`);
  doc.moveDown(0.2);
  doc.text(`Téléphone: ${booking.customer.phone}`);
  
  // Ajoute des détails spécifiques selon le type de réservation
  doc.moveDown(1);
  addSpecificDetails(doc, booking);
  
  // Pied de page avec total
  doc.moveDown(1);
  addSeparator(doc);
  
  doc.moveDown(1);
  doc.fontSize(headingFontSize)
     .text('Montant total: ' + formatPrice(booking.totalAmount), { align: 'right' });
  
  doc.moveDown(2);
  doc.fontSize(smallFontSize)
     .text('Merci d\'avoir choisi Express Déménagement pour vos besoins de déménagement.', 
           { align: 'center' });
  
  doc.moveDown(0.5);
  doc.text('Pour toute question, n\'hésitez pas à nous contacter au 01 23 45 67 89', 
           { align: 'center' });
  
  // Finalisation du document
  doc.end();
  
  // Attendre que le document soit complètement généré
  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      
      // Sauvegarder le PDF dans la base de données
      savePdfToDatabase(booking, pdfBuffer)
        .then(() => {
          resolve(pdfBuffer);
        })
        .catch(error => {
          console.error('Erreur lors de la sauvegarde du PDF en base de données:', error);
          // On retourne quand même le PDF même si la sauvegarde a échoué
          resolve(pdfBuffer);
        });
    });
    
    doc.on('error', reject);
  });
}

/**
 * Sauvegarde le PDF généré dans la base de données
 * @param booking Données de la réservation
 * @param pdfBuffer Contenu du PDF
 */
async function savePdfToDatabase(booking: BookingData, pdfBuffer: Buffer): Promise<void> {
  try {
    // Vérifier si un document existe déjà pour cette réservation
    const existingDocument = await prisma.document.findFirst({
      where: {
        bookingId: booking.id,
        type: DocumentType.BOOKING_CONFIRMATION
      }
    });

    if (existingDocument) {
      // Mettre à jour le document existant
      await prisma.document.update({
        where: { id: existingDocument.id },
        data: {
          content: pdfBuffer,
          size: pdfBuffer.length,
          updatedAt: new Date()
        }
      });
      console.log(`Document PDF mis à jour pour la réservation ${booking.id}`);
    } else {
      // Créer un nouveau document
      const documentName = `reservation-${booking.id.slice(0, 8)}.pdf`;
      
      try {
        await prisma.$transaction(async (tx) => {
          await tx.document.create({
            data: {
              type: DocumentType.BOOKING_CONFIRMATION,
              name: documentName,
              content: pdfBuffer,
              mimeType: 'application/pdf',
              size: pdfBuffer.length,
              bookingId: booking.id
            }
          });
        });
        console.log(`Document PDF créé pour la réservation ${booking.id}`);
      } catch (txError) {
        console.error('Erreur lors de la transaction:', txError);
        throw txError;
      }
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du PDF:', error);
    throw error;
  }
}

/**
 * Ajoute des détails spécifiques au PDF en fonction du type de réservation
 */
function addSpecificDetails(doc: PDFKit.PDFDocument, booking: BookingData) {
  switch(booking.type) {
    case 'QUOTE':
      // Détails spécifiques aux devis
      if (booking.quote) {
        doc.fontSize(16) // headingFontSize
           .text('Détails du devis');
        
        doc.moveDown(0.5);
        doc.fontSize(12); // regularFontSize
        
        if (booking.quote.volume !== undefined) {
          doc.text(`Volume estimé: ${booking.quote.volume} m³`);
          doc.moveDown(0.2);
        }
        
        if (booking.quote.distance !== undefined) {
          doc.text(`Distance: ${booking.quote.distance} km`);
          doc.moveDown(0.2);
        }
        
        doc.text(`Prix de base: ${formatPrice(booking.quote.basePrice)}`);
        doc.moveDown(0.2);
        doc.text(`Prix final: ${formatPrice(booking.quote.finalPrice)}`);
        
        // Liste des articles pour les devis
        if (booking.items && booking.items.length > 0) {
          doc.moveDown(1);
          doc.fontSize(16) // headingFontSize
             .text('Articles à déménager');
          
          doc.moveDown(0.5);
          
          booking.items.forEach(item => {
            doc.fontSize(12) // regularFontSize
               .text(`${item.name} (x${item.quantity})`, { indent: 20 });
            doc.moveDown(0.2);
          });
        }
      }
      break;
      
    case 'PACK':
      // Détails spécifiques aux packs
      if (booking.pack) {
        doc.fontSize(16) // headingFontSize
           .text('Détails du pack');
        
        doc.moveDown(0.5);
        doc.fontSize(12) // regularFontSize
           .text(`Pack: ${booking.pack.name}`);
        
        doc.moveDown(0.2);
        doc.fontSize(10) // smallFontSize
           .text(booking.pack.description, { indent: 20 });
        
        doc.moveDown(0.5);
        doc.fontSize(12) // regularFontSize
           .text(`Prix du pack: ${formatPrice(booking.pack.price)}`);
      }
      break;
      
    case 'SERVICE':
      // Détails spécifiques aux services
      if (booking.services && booking.services.length > 0) {
        doc.fontSize(16) // headingFontSize
           .text('Services réservés');
        
        doc.moveDown(0.5);
        
        let totalServicesPrice = 0;
        
        booking.services.forEach(service => {
          totalServicesPrice += service.service.price;
          
          doc.fontSize(12) // regularFontSize
             .text(service.service.name, { continued: true })
             .text(`: ${formatPrice(service.service.price)}`, { align: 'right' });
          
          doc.moveDown(0.2);
          doc.fontSize(10) // smallFontSize
             .text(service.service.description, { indent: 20 });
          
          doc.moveDown(0.2);
          doc.text(`Date: ${formatDate(service.serviceDate)}`, { indent: 20 });
          
          doc.moveDown(0.5);
        });
        
        doc.moveDown(0.5);
        doc.fontSize(12) // regularFontSize
           .text(`Total des services: ${formatPrice(totalServicesPrice)}`, { align: 'right' });
      }
      break;
  }
}

// Fonctions utilitaires
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatPrice(price: number): string {
  return `${price.toFixed(2)} €`;
}

function addSeparator(doc: PDFKit.PDFDocument) {
  doc.strokeColor('#cccccc')
     .lineWidth(1)
     .moveTo(50, doc.y)
     .lineTo(doc.page.width - 50, doc.y)
     .stroke();
}

/**
 * Récupère un PDF stocké en base de données
 * @param bookingId ID de la réservation
 * @param documentType Type de document à récupérer
 * @returns Buffer contenant le PDF ou null si non trouvé
 */
export async function getStoredPdf(bookingId: string, documentType: DocumentType = DocumentType.BOOKING_CONFIRMATION): Promise<Buffer | null> {
  try {
    const document = await prisma.$queryRaw`
      SELECT content FROM "documents" 
      WHERE booking_id = ${bookingId} 
      AND type = ${documentType}
      LIMIT 1
    `;
    
    if (!document || !Array.isArray(document) || document.length === 0) {
      return null;
    }
    
    return document[0].content;
  } catch (error) {
    console.error('Erreur lors de la récupération du PDF:', error);
    return null;
  }
} 