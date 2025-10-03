/**
 * 📄 Service de génération de documents PDF pour prestataires externes
 *
 * Responsabilité UNIQUE :
 * - Génère des PDF avec données limitées/sécurisées pour prestataires
 * - Utilise des templates spécialisés sans informations confidentielles
 * - Stockage séparé des documents confidentiels
 */

import { PdfGeneratorService } from '../../infrastructure/services/PdfGeneratorService';
import { StorageService } from '../../infrastructure/services/StorageService';
import { LimitedClientData, ProfessionalPDFData } from '@/types/professional-attribution';
import { logger } from '@/lib/logger';

export interface ProfessionalDocumentRequest {
  attributionId: string;
  professionalId: string;
  professionalEmail: string;
  professionalCompany: string;

  // Données de mission avec infos limitées
  bookingId: string;
  bookingReference: string;
  serviceDate: string;
  serviceTime: string;
  serviceType: string;
  estimatedDuration: string;
  priority: 'normal' | 'high' | 'urgent';

  // Client - DONNÉES LIMITÉES uniquement
  limitedClientData: LimitedClientData;

  // Géolocalisation
  distanceKm: number;

  // URLs d'action
  acceptUrl: string;
  refuseUrl: string;
  timeoutDate: string;

  // Options
  documentType: 'MISSION_PROPOSAL' | 'SERVICE_REMINDER';
  saveToSubDir?: string;
}

export interface ProfessionalDocumentResult {
  success: boolean;
  documents: Array<{
    type: string;
    filename: string;
    path: string;
    size: number;
    mimeType: string;
  }>;
  error?: string;
  metadata: {
    attributionId: string;
    professionalId: string;
    documentType: string;
    generatedAt: Date;
    totalFiles: number;
    totalSize: number;
  };
}

/**
 * Service spécialisé pour la génération de documents prestataires
 * AUCUNE donnée confidentielle client ne transite par ce service
 */
export class ProfessionalDocumentService {
  private documentLogger = logger.withContext('ProfessionalDocumentService');
  private pdfService: PdfGeneratorService;
  private storageService: StorageService;

  constructor() {
    this.pdfService = new PdfGeneratorService();
    this.storageService = new StorageService(
      process.env.PROFESSIONAL_PDF_STORAGE_PATH || './storage/professional-documents'
    );
  }

  /**
   * Génère des documents PDF sécurisés pour un prestataire
   */
  async generateProfessionalDocuments(request: ProfessionalDocumentRequest): Promise<ProfessionalDocumentResult> {
    const startTime = Date.now();

    this.documentLogger.info('📄 Génération documents prestataire', {
      attributionId: request.attributionId,
      professionalCompany: request.professionalCompany,
      documentType: request.documentType,
      serviceType: request.serviceType
    });

    try {
      const generatedDocuments: Array<{
        type: string;
        filename: string;
        path: string;
        size: number;
        mimeType: string;
      }> = [];

      let totalSize = 0;

      // Générer le document selon le type
      const document = await this.generateSingleProfessionalDocument(request);

      generatedDocuments.push(document);
      totalSize += document.size;

      this.documentLogger.info('✅ Document prestataire généré', {
        type: request.documentType,
        filename: document.filename,
        size: `${Math.round(document.size / 1024)}KB`,
        professionalCompany: request.professionalCompany
      });

      const duration = Date.now() - startTime;
      this.documentLogger.info('🎉 Génération documents prestataire terminée', {
        documentsGenerated: generatedDocuments.length,
        totalSize: `${Math.round(totalSize / 1024)}KB`,
        duration: `${duration}ms`
      });

      return {
        success: true,
        documents: generatedDocuments,
        metadata: {
          attributionId: request.attributionId,
          professionalId: request.professionalId,
          documentType: request.documentType,
          generatedAt: new Date(),
          totalFiles: generatedDocuments.length,
          totalSize
        }
      };

    } catch (error) {
      this.documentLogger.error('❌ Erreur génération documents prestataire', {
        attributionId: request.attributionId,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });

      return {
        success: false,
        documents: [],
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        metadata: {
          attributionId: request.attributionId,
          professionalId: request.professionalId,
          documentType: request.documentType,
          generatedAt: new Date(),
          totalFiles: 0,
          totalSize: 0
        }
      };
    }
  }

  /**
   * Génère un document PDF spécifique pour prestataire
   */
  private async generateSingleProfessionalDocument(request: ProfessionalDocumentRequest) {
    let pdfBuffer: Buffer;
    let filename: string;

    const pdfData: ProfessionalPDFData = {
      attributionId: request.attributionId,
      bookingReference: request.bookingReference,
      serviceDate: request.serviceDate,
      serviceTime: request.serviceTime,
      clientData: request.limitedClientData, // ⚠️ DONNÉES LIMITÉES uniquement
      serviceType: request.serviceType,
      estimatedDuration: request.estimatedDuration,
      priority: request.priority,
      professionalCompany: request.professionalCompany,
      professionalEmail: request.professionalEmail,
      distanceKm: request.distanceKm,
      acceptUrl: request.acceptUrl,
      refuseUrl: request.refuseUrl,
      timeoutDate: request.timeoutDate,
      documentType: request.documentType
    };

    // Générer le PDF selon le type
    switch (request.documentType) {
      case 'MISSION_PROPOSAL':
        filename = `mission_${request.attributionId}_${request.professionalCompany.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        pdfBuffer = await this.generateMissionProposalPDF(pdfData);
        break;

      case 'SERVICE_REMINDER':
        filename = `rappel_${request.attributionId}_${new Date().toISOString().split('T')[0]}.pdf`;
        pdfBuffer = await this.generateServiceReminderPDF(pdfData);
        break;

      default:
        throw new Error(`Type de document prestataire non supporté: ${request.documentType}`);
    }

    // Sauvegarder dans un répertoire séparé
    const subDirectory = request.saveToSubDir || `attributions/${request.attributionId.slice(0, 8)}`;
    const filePath = await this.storageService.saveFile(
      pdfBuffer,
      filename,
      subDirectory
    );

    return {
      type: request.documentType,
      filename,
      path: filePath,
      size: pdfBuffer.length,
      mimeType: 'application/pdf'
    };
  }

  /**
   * Génère un PDF de proposition de mission (données limitées)
   */
  private async generateMissionProposalPDF(data: ProfessionalPDFData): Promise<Buffer> {
    // Utiliser le service PDF avec template spécialisé
    return await this.pdfService.generateCustomPDF({
      title: `Mission ${data.serviceType} - ${data.bookingReference}`,
      template: 'professional-mission-proposal',
      data: {
        // En-tête mission
        attributionId: data.attributionId,
        bookingReference: data.bookingReference,
        serviceDate: data.serviceDate,
        serviceTime: data.serviceTime,
        serviceType: data.serviceType,
        estimatedDuration: data.estimatedDuration,
        priority: data.priority,

        // Client - DONNÉES LIMITÉES uniquement
        customerName: data.clientData.customerName,
        pickupCity: data.clientData.pickupAddress,
        deliveryCity: data.clientData.deliveryAddress,
        estimatedAmount: data.clientData.quoteDetails.estimatedAmount,
        serviceCategory: data.clientData.quoteDetails.serviceCategory,

        // Prestataire
        professionalCompany: data.professionalCompany,
        distanceKm: data.distanceKm,

        // Actions
        acceptUrl: data.acceptUrl,
        refuseUrl: data.refuseUrl,
        timeoutDate: data.timeoutDate,

        // Note de confidentialité
        confidentialityNote: "📍 Informations complètes du client communiquées après acceptation de la mission",

        // Footer sécurisé
        generatedAt: new Date().toISOString(),
        documentType: 'Proposition de mission - Données limitées'
      }
    });
  }

  /**
   * Génère un PDF de rappel de service (avec toutes les données)
   */
  private async generateServiceReminderPDF(data: ProfessionalPDFData): Promise<Buffer> {
    // Ce PDF sera généré le jour J avec toutes les informations
    return await this.pdfService.generateCustomPDF({
      title: `Rappel Service - ${data.bookingReference}`,
      template: 'professional-service-reminder',
      data: {
        // En-tête
        attributionId: data.attributionId,
        bookingReference: data.bookingReference,
        serviceDate: data.serviceDate,
        serviceTime: data.serviceTime,
        serviceType: data.serviceType,

        // Client - DONNÉES COMPLÈTES (jour J uniquement)
        customerName: data.clientData.customerName,
        // Note: Les données complètes seront injectées par le service de rappel
        pickupAddress: data.clientData.pickupAddress,
        deliveryAddress: data.clientData.deliveryAddress,

        // Mission
        estimatedDuration: data.estimatedDuration,
        priority: data.priority,

        // Prestataire
        professionalCompany: data.professionalCompany,

        // Note
        reminderNote: "🕐 Service prévu aujourd'hui - Toutes les informations client sont désormais disponibles",

        generatedAt: new Date().toISOString(),
        documentType: 'Rappel de service - Jour J'
      }
    });
  }

  /**
   * Nettoie les documents d'attribution expirés
   */
  async cleanExpiredAttributionDocuments(daysOld: number = 30): Promise<void> {
    this.documentLogger.info(`🧹 Nettoyage documents attribution > ${daysOld} jours`);

    // TODO: Implémenter nettoyage automatique
    // await this.storageService.cleanOldFiles('attributions', daysOld);
  }
}

export default ProfessionalDocumentService;