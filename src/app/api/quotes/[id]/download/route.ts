import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '@/quotation/application/services/BookingService';
import { pdfService, emailService } from '@/config/services';
import { logger } from '@/lib/logger';
import fs from 'fs';

// Logger
const pdfLogger = logger.withContext ? 
  logger.withContext('PDFDownload') : 
  {
    debug: (msg: string, ...args: any[]) => console.debug('[PDFDownload]', msg, ...args),
    info: (msg: string, ...args: any[]) => console.info('[PDFDownload]', msg, ...args),
    warn: (msg: string, ...args: any[]) => console.warn('[PDFDownload]', msg, ...args),
    error: (msg: string | Error, ...args: any[]) => console.error('[PDFDownload]', msg, ...args)
  };

// Initialiser les services nécessaires
const bookingService = new BookingService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quoteId = params.id;
    const paymentIntentId = request.nextUrl.searchParams.get('payment_intent');
    const sendEmail = request.nextUrl.searchParams.get('send_email') === 'true';
    const pdfType = request.nextUrl.searchParams.get('type') || 'quote';

    if (!quoteId) {
      pdfLogger.warn('Tentative de téléchargement sans ID de devis');
      return NextResponse.json(
        { error: 'ID du devis manquant' },
        { status: 400 }
      );
    }

    pdfLogger.info(`Demande de téléchargement de PDF pour le devis: ${quoteId}, type: ${pdfType}`);

    // Récupérer les informations du devis ou de la réservation
    try {
      const bookingData = await bookingService.getBookingById(quoteId);
      if (!bookingData || !bookingData.booking) {
        pdfLogger.warn(`Devis/réservation non trouvé: ${quoteId}`);
        return NextResponse.json(
          { error: 'Devis ou réservation non trouvé' },
          { status: 404 }
        );
      }

      let pdfPath;

      // Générer le PDF selon le type demandé
      try {
        switch (pdfType) {
          case 'invoice':
            pdfLogger.info(`Génération du PDF de facture pour: ${quoteId}`);
            pdfPath = await pdfService.generateInvoicePDF(bookingData.booking);
            break;
          case 'booking':
            pdfLogger.info(`Génération du PDF de réservation pour: ${quoteId}`);
            pdfPath = await pdfService.generateBookingPDF(bookingData.booking);
            break;
          case 'quote':
          default:
            // Si nous avons une demande de devis associée
            if (bookingData.booking.getQuoteRequestId()) {
              pdfLogger.info(`Récupération de la demande de devis: ${bookingData.booking.getQuoteRequestId()}`);
              const quoteRequest = await bookingService.getQuoteRequestById(
                bookingData.booking.getQuoteRequestId()
              );
              if (quoteRequest) {
                pdfLogger.info(`Génération du PDF de devis pour la demande: ${quoteRequest.getId()}`);
                pdfPath = await pdfService.generateQuotePDF(quoteRequest);
              } else {
                // Fallback: générer le PDF de réservation si la demande de devis n'est pas trouvée
                pdfLogger.warn(`Demande de devis non trouvée, utilisation du fallback pour: ${quoteId}`);
                pdfPath = await pdfService.generateBookingPDF(bookingData.booking);
              }
            } else {
              // Aucune demande de devis associée, générer le PDF de réservation
              pdfLogger.info(`Pas de demande de devis associée, génération du PDF de réservation pour: ${quoteId}`);
              pdfPath = await pdfService.generateBookingPDF(bookingData.booking);
            }
            break;
        }

        // Vérifier si le PDF a été généré
        if (!pdfPath || !fs.existsSync(pdfPath)) {
          pdfLogger.error(`Échec de la génération du PDF pour: ${quoteId}, chemin: ${pdfPath || 'non défini'}`);
          return NextResponse.json(
            { error: 'Échec de la génération du PDF' },
            { status: 500 }
          );
        }

        // Lire le fichier
        const pdfBuffer = fs.readFileSync(pdfPath);

        // Envoyer par email si demandé
        if (sendEmail) {
          const customer = bookingData.booking.getCustomer();
          const contactInfo = customer?.getContactInfo();
          const email = contactInfo?.getEmail();

          if (email) {
            try {
              pdfLogger.info(`Envoi du PDF par email à: ${email}, type: ${pdfType}`);
              // Envoyer selon le type de document
              if (pdfType === 'invoice') {
                await emailService.sendPaymentConfirmation(
                  bookingData.booking,
                  paymentIntentId || 'unknown'
                );
              } else if (pdfType === 'booking') {
                await emailService.sendBookingConfirmation(bookingData.booking);
              } else {
                const quoteRequest = bookingData.booking.getQuoteRequestId()
                  ? await bookingService.getQuoteRequestById(
                      bookingData.booking.getQuoteRequestId()
                    )
                  : null;
                
                if (quoteRequest) {
                  await emailService.sendQuoteConfirmation(quoteRequest, pdfPath);
                } else {
                  pdfLogger.warn(`Impossible d'envoyer l'email de confirmation de devis: demande de devis non trouvée`);
                }
              }
              pdfLogger.info(`Email envoyé avec succès à ${email}`);
            } catch (emailError) {
              pdfLogger.error('Erreur lors de l\'envoi de l\'email:', emailError);
              // Ne pas bloquer la réponse même si l'envoi d'email échoue
            }
          } else {
            pdfLogger.warn(`Impossible d'envoyer l'email: adresse email non disponible pour ${quoteId}`);
          }
        }

        // Définir le nom du fichier selon le type
        let filename;
        switch (pdfType) {
          case 'invoice':
            filename = `facture-${quoteId}.pdf`;
            break;
          case 'booking':
            filename = `reservation-${quoteId}.pdf`;
            break;
          case 'quote':
          default:
            filename = `devis-${quoteId}.pdf`;
            break;
        }

        pdfLogger.info(`PDF généré avec succès: ${filename}, taille: ${pdfBuffer.length} octets`);
        
        // Supprimer le fichier temporaire après envoi (sécurité)
        try {
          // Décommenter la ligne suivante en production
          // fs.unlinkSync(pdfPath);
        } catch (unlinkError) {
          pdfLogger.warn(`Impossible de supprimer le fichier temporaire: ${pdfPath}`, unlinkError);
        }

        // Retourner le fichier PDF
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': pdfBuffer.length.toString(),
          },
        });
      } catch (pdfError) {
        pdfLogger.error(`Erreur lors de la génération du PDF pour ${quoteId}:`, pdfError);
        return NextResponse.json(
          {
            error: 'Erreur lors de la génération du PDF',
            details: pdfError instanceof Error ? pdfError.message : String(pdfError)
          },
          { status: 500 }
        );
      }
    } catch (bookingError) {
      pdfLogger.error(`Erreur lors de la récupération des données pour ${quoteId}:`, bookingError);
      return NextResponse.json(
        {
          error: 'Erreur lors de la récupération des données de réservation',
          details: bookingError instanceof Error ? bookingError.message : String(bookingError)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    pdfLogger.error('Erreur globale lors du traitement de la demande:', error);
    return NextResponse.json(
      {
        error: 'Une erreur est survenue lors du traitement de la demande',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
} 