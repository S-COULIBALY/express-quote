/**
 * 🎼 SERVICE D'ORCHESTRATION DES DOCUMENTS
 *
 * Responsabilité principale :
 * - Chef d'orchestre pour la génération et distribution automatique des documents
 * - Gère les règles métier de génération selon les événements (triggers)
 * - Coordonne les différents services spécialisés pour la distribution
 *
 * Architecture déléguée :
 * - 📄 DocumentService : Génération des PDF
 * - 👥 InternalStaffNotificationService : Notifications équipe interne (données complètes)
 * - 🚚 AttributionNotificationService : Notifications prestataires externes (données restreintes)
 * - 🎯 DocumentNotificationService : Notifications client
 *
 * Flux simplifié après refactorisation :
 * 1. Reçoit un trigger (BOOKING_CONFIRMED, PAYMENT_COMPLETED, etc.)
 * 2. Applique les règles de génération configurées
 * 3. Génère les documents via DocumentService
 * 4. Délègue la distribution aux services spécialisés selon les destinataires
 */

import { DocumentService } from './DocumentService';
import { DocumentNotificationService } from './DocumentNotificationService';
import { DocumentType } from '../../domain/entities/Document';
import { Booking } from '@/quotation/domain/entities/Booking';
import { BookingStatus } from '@/quotation/domain/enums/BookingStatus';
import { BookingType } from '@/quotation/domain/enums/BookingType';
import { InternalStaffNotificationService } from '@/internalStaffNotification/InternalStaffNotificationService';
import { logger } from '@/lib/logger';

/**
 * 🎯 ÉVÉNEMENTS DÉCLENCHEURS
 *
 * Événements métier qui déclenchent automatiquement la génération de documents.
 * Chaque trigger active des règles spécifiques définies dans defaultRules[].
 */
export enum DocumentTrigger {
  QUOTE_CREATED = 'quote_created',           // Création d'un devis
  QUOTE_ACCEPTED = 'quote_accepted',         // Acceptation du devis par le client
  PAYMENT_COMPLETED = 'payment_completed',   // ✨ Paiement validé (PDF reçu/facture)
  BOOKING_CONFIRMED = 'booking_confirmed',   // ✨ Réservation confirmée (PDF devis)
  BOOKING_SCHEDULED = 'booking_scheduled',   // Planification du service
  SERVICE_STARTED = 'service_started',       // Début du service
  SERVICE_COMPLETED = 'service_completed',   // Fin du service
  BOOKING_CANCELLED = 'booking_cancelled',   // Annulation
  BOOKING_MODIFIED = 'booking_modified'      // Modification
}

/**
 * 📋 RÈGLES DE GÉNÉRATION AUTOMATIQUE
 *
 * Définit quand générer quel document pour quels destinataires.
 * Les règles sont évaluées par ordre de priorité (1 = urgent, 3 = normal).
 */
interface DocumentRule {
  trigger: DocumentTrigger;                    // Événement déclencheur
  documentType: DocumentType;                 // Type de document à générer
  recipients: DocumentRecipient[];            // Qui doit recevoir le document
  conditions?: (booking: Booking) => boolean; // Conditions optionnelles (ex: type service)
  autoGenerate: boolean;                      // Génération automatique activée
  requiresApproval: boolean;                  // Approbation manuelle requise
  priority: number;                           // 1 = haute priorité, 3 = basse
}

/**
 * 👥 DESTINATAIRES DES DOCUMENTS
 *
 * Types de destinataires pour la distribution automatique.
 * Chaque type déclenche une logique de distribution spécialisée.
 */
export enum DocumentRecipient {
  CUSTOMER = 'customer',        // 🎯 Client final (via DocumentNotificationService)
  PROFESSIONAL = 'professional', // 👥 Équipe interne + 🚚 Prestataires externes
  ADMIN = 'admin',              // 🏢 Administration (fallback email)
  ACCOUNTING = 'accounting'     // 💰 Comptabilité (via équipe interne)
}

/**
 * 📊 MATRICE DE DISTRIBUTION
 *
 * Configuration par défaut pour la distribution selon le type de document.
 * Définit les canaux de communication et l'inclusion des PDF.
 */
interface DistributionMatrix {
  [key: string]: {
    recipients: DocumentRecipient[];           // Destinataires par défaut
    channel: 'email' | 'sms' | 'both';        // Canal de communication
    attachPdf: boolean;                       // Inclure le PDF en pièce jointe
  };
}

/**
 * 🎼 ORCHESTRATEUR DE DOCUMENTS - SERVICE PRINCIPAL
 *
 * Chef d'orchestre pour la génération et distribution automatique des documents.
 *
 * RESPONSABILITÉS PRINCIPALES :
 * ✅ Évaluation des règles métier selon les triggers
 * ✅ Génération des documents via DocumentService
 * ✅ Coordination avec les services de notification spécialisés
 * ✅ Gestion des erreurs sans interrompre le flux global
 *
 * SERVICES DÉLÉGUÉS :
 * - 📄 DocumentService : Génération PDF avec templates
 * - 🎯 DocumentNotificationService : Notifications client
 * - 👥 InternalStaffNotificationService : Équipe interne (données complètes)
 * - 🚚 [AttributionNotificationService] : Prestataires externes (données restreintes)
 *
 * REFACTORISATION 2024 :
 * - Logique équipe interne extraite vers module spécialisé
 * - Utilisation des APIs de génération et notification
 * - Architecture cohérente avec le système d'attribution
 */
export class DocumentOrchestrationService {
  private documentLogger = logger.withContext('DocumentOrchestrator');
  private documentService: DocumentService;
  private notificationService: DocumentNotificationService;
  private internalStaffNotificationService: InternalStaffNotificationService;

  /**
   * 📋 RÈGLES DE GÉNÉRATION PAR DÉFAUT
   *
   * Configuration des documents automatiques selon les événements métier.
   * Ces règles définissent le comportement standard du système.
   */
  private defaultRules: DocumentRule[] = [
    // 📄 PHASE DE DEVIS INITIAL
    {
      trigger: DocumentTrigger.QUOTE_CREATED,
      documentType: DocumentType.QUOTE,
      recipients: [DocumentRecipient.CUSTOMER],    // → Client uniquement
      autoGenerate: true,
      requiresApproval: false,
      priority: 2
    },

    // 💰 PHASE DE PAIEMENT (documents financiers)
    {
      trigger: DocumentTrigger.PAYMENT_COMPLETED,
      documentType: DocumentType.PAYMENT_RECEIPT,
      recipients: [DocumentRecipient.CUSTOMER],    // → Reçu pour le client
      autoGenerate: true,
      requiresApproval: false,
      priority: 1
    },
    {
      trigger: DocumentTrigger.PAYMENT_COMPLETED,
      documentType: DocumentType.INVOICE,
      recipients: [DocumentRecipient.CUSTOMER, DocumentRecipient.ACCOUNTING], // → Facture client + comptabilité
      autoGenerate: true,
      requiresApproval: false,
      priority: 1
    },

    // ✅ PHASE DE CONFIRMATION (devis confirmé)
    {
      trigger: DocumentTrigger.BOOKING_CONFIRMED,
      documentType: DocumentType.QUOTE,
      recipients: [DocumentRecipient.CUSTOMER],    // → Devis confirmé pour client
      autoGenerate: true,
      requiresApproval: false,
      priority: 1
    },
    {
      trigger: DocumentTrigger.BOOKING_CONFIRMED,
      documentType: DocumentType.QUOTE,
      recipients: [DocumentRecipient.PROFESSIONAL], // → Devis pour équipe interne
      autoGenerate: true,
      requiresApproval: false,
      priority: 1
    },

    // Phase logistique (déménagement uniquement)
    {
      trigger: DocumentTrigger.BOOKING_SCHEDULED,
      documentType: DocumentType.DELIVERY_NOTE,
      recipients: [DocumentRecipient.PROFESSIONAL, DocumentRecipient.CUSTOMER],
      conditions: (booking) => booking.getType() === BookingType.MOVING,
      autoGenerate: true,
      requiresApproval: false,
      priority: 2
    },
    {
      trigger: DocumentTrigger.SERVICE_STARTED,
      documentType: DocumentType.TRANSPORT_MANIFEST,
      recipients: [DocumentRecipient.PROFESSIONAL],
      conditions: (booking) => booking.getType() === BookingType.MOVING,
      autoGenerate: true,
      requiresApproval: false,
      priority: 3
    },

    // Documents administratifs
    {
      trigger: DocumentTrigger.BOOKING_CANCELLED,
      documentType: DocumentType.CANCELLATION_NOTICE,
      recipients: [DocumentRecipient.CUSTOMER, DocumentRecipient.PROFESSIONAL],
      autoGenerate: true,
      requiresApproval: false,
      priority: 1
    },
    {
      trigger: DocumentTrigger.BOOKING_MODIFIED,
      documentType: DocumentType.MODIFICATION_NOTICE,
      recipients: [DocumentRecipient.CUSTOMER],
      autoGenerate: false, // Génération manuelle pour éviter le spam
      requiresApproval: true,
      priority: 2
    }
  ];

  // Matrice de distribution par type de document
  private distributionMatrix: DistributionMatrix = {
    [DocumentType.QUOTE]: {
      recipients: [DocumentRecipient.CUSTOMER],
      channel: 'email',
      attachPdf: true
    },
    [DocumentType.PAYMENT_RECEIPT]: {
      recipients: [DocumentRecipient.CUSTOMER],
      channel: 'both',
      attachPdf: true
    },
    [DocumentType.INVOICE]: {
      recipients: [DocumentRecipient.CUSTOMER, DocumentRecipient.ACCOUNTING],
      channel: 'email',
      attachPdf: true
    },
    [DocumentType.BOOKING_CONFIRMATION]: {
      recipients: [DocumentRecipient.CUSTOMER],
      channel: 'both',
      attachPdf: true
    },
    [DocumentType.CONTRACT]: {
      recipients: [DocumentRecipient.CUSTOMER, DocumentRecipient.PROFESSIONAL],
      channel: 'email',
      attachPdf: true
    },
    [DocumentType.DELIVERY_NOTE]: {
      recipients: [DocumentRecipient.PROFESSIONAL, DocumentRecipient.CUSTOMER],
      channel: 'email',
      attachPdf: true
    },
    [DocumentType.TRANSPORT_MANIFEST]: {
      recipients: [DocumentRecipient.PROFESSIONAL],
      channel: 'email',
      attachPdf: true
    },
    [DocumentType.CANCELLATION_NOTICE]: {
      recipients: [DocumentRecipient.CUSTOMER, DocumentRecipient.PROFESSIONAL],
      channel: 'both',
      attachPdf: true
    },
    [DocumentType.MODIFICATION_NOTICE]: {
      recipients: [DocumentRecipient.CUSTOMER],
      channel: 'email',
      attachPdf: true
    }
  };

  constructor(documentService?: DocumentService) {
    this.documentService = documentService || new DocumentService();
    this.notificationService = new DocumentNotificationService(this.documentService);
    this.internalStaffNotificationService = new InternalStaffNotificationService();
  }

  /**
   * 🎯 MÉTHODE PRINCIPALE - TRAITEMENT DES TRIGGERS
   *
   * Point d'entrée principal pour le traitement des événements métier.
   *
   * FLUX D'EXÉCUTION :
   * 1. 📋 Sélection des règles applicables selon le trigger
   * 2. 🔍 Validation des conditions (autoGenerate, approval, etc.)
   * 3. 📄 Génération des documents via DocumentService
   * 4. 📡 Distribution via services spécialisés selon les destinataires
   * 5. 📊 Collecte et retour des résultats
   *
   * @param trigger - Événement métier déclencheur
   * @param booking - Réservation concernée
   * @param options - Options de génération (force, skip approval, etc.)
   * @returns Résultats de génération par document
   */
  async handleTrigger(
    trigger: DocumentTrigger,
    booking: Booking,
    options?: {
      forceGeneration?: boolean;    // Force la génération même si autoGenerate = false
      skipApproval?: boolean;       // Ignore le système d'approbation
      customOptions?: any;          // Options personnalisées pour génération
    }
  ): Promise<Array<{
    documentType: DocumentType;
    success: boolean;
    documentId?: string;
    error?: string;
  }>> {
    this.documentLogger.info('🎯 Traitement du déclencheur de document', {
      trigger,
      bookingId: booking.getId(),
      bookingType: booking.getType(),
      options
    });

    // 📋 ÉTAPE 1: Sélection des règles applicables
    const applicableRules = this.getApplicableRules(trigger, booking);
    const results = [];

    this.documentLogger.info('📋 Règles applicables trouvées', {
      rulesCount: applicableRules.length,
      rules: applicableRules.map(r => ({ type: r.documentType, recipients: r.recipients }))
    });

    // 🔄 ÉTAPE 2: Traitement de chaque règle
    for (const rule of applicableRules) {
      try {
        // 🔍 Validation : Génération automatique
        if (!rule.autoGenerate && !options?.forceGeneration) {
          this.documentLogger.info('📋 Génération automatique désactivée', {
            documentType: rule.documentType,
            trigger
          });
          continue;
        }

        // 🔍 Validation : Système d'approbation
        if (rule.requiresApproval && !options?.skipApproval) {
          this.documentLogger.info('⏳ Document en attente d\'approbation', {
            documentType: rule.documentType,
            trigger
          });
          // TODO: Implémenter le système d'approbation avec workflow
          continue;
        }

        // 📄 ÉTAPE 3: Génération du document
        this.documentLogger.info('📄 Génération document', {
          documentType: rule.documentType,
          trigger
        });

        const result = await this.generateDocument(rule.documentType, booking, {
          ...(options?.customOptions || {}),
          trigger: trigger
        });

        if (result.success) {
          // 📡 ÉTAPE 4: Distribution aux destinataires
          this.documentLogger.info('📡 Distribution aux destinataires', {
            documentType: rule.documentType,
            recipients: rule.recipients,
            documentId: result.document!.getId()
          });

          await this.distributeDocumentWithNotification(
            result.document!,
            booking,
            rule.recipients,
            trigger
          );

          results.push({
            documentType: rule.documentType,
            success: true,
            documentId: result.document!.getId()
          });

          this.documentLogger.info('✅ Document généré et distribué avec succès', {
            documentType: rule.documentType,
            documentId: result.document!.getId(),
            recipients: rule.recipients
          });
        } else {
          results.push({
            documentType: rule.documentType,
            success: false,
            error: result.error
          });

          this.documentLogger.error('❌ Erreur lors de la génération de document', {
            documentType: rule.documentType,
            error: result.error
          });
        }

      } catch (error) {
        results.push({
          documentType: rule.documentType,
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        });

        this.documentLogger.error('❌ Erreur lors du traitement de la règle', {
          documentType: rule.documentType,
          trigger,
          error
        });
      }
    }

    return results;
  }

  /**
   * 📝 GÉNÉRATION MANUELLE DE DOCUMENT
   *
   * Génère un document spécifique en contournant les règles automatiques.
   * Utile pour les cas particuliers ou les demandes administratives.
   *
   * @param documentType - Type de document à générer
   * @param booking - Réservation concernée
   * @param options - Options de génération personnalisées
   */
  async generateDocumentManually(
    documentType: DocumentType,
    booking: Booking,
    options?: any
  ) {
    this.documentLogger.info('📝 Génération manuelle de document', {
      documentType,
      bookingId: booking.getId(),
      options
    });

    const result = await this.generateDocument(documentType, booking, options);

    if (result.success) {
      // Obtenir les destinataires par défaut pour ce type de document
      const distributionConfig = this.distributionMatrix[documentType];
      if (distributionConfig) {
        await this.distributeDocument(
          result.document!,
          booking,
          distributionConfig.recipients
        );
      }
    }

    return result;
  }

  /**
   * 📋 SÉLECTION DES RÈGLES APPLICABLES
   *
   * Filtre et trie les règles selon le trigger et les conditions métier.
   *
   * LOGIQUE DE FILTRAGE :
   * 1. Filtre par trigger exact
   * 2. Évalue les conditions optionnelles (ex: type de service)
   * 3. Trie par priorité (1 = urgent, 3 = normal)
   *
   * @param trigger - Événement déclencheur
   * @param booking - Réservation pour évaluation des conditions
   * @returns Règles applicables triées par priorité
   */
  private getApplicableRules(trigger: DocumentTrigger, booking: Booking): DocumentRule[] {
    const applicableRules = this.defaultRules
      .filter(rule => rule.trigger === trigger)                    // Filtre par trigger
      .filter(rule => !rule.conditions || rule.conditions(booking)) // Évalue les conditions
      .sort((a, b) => a.priority - b.priority);                    // Trie par priorité (1 = haute)

    return applicableRules;
  }

  /**
   * Génère un document via le DocumentService
   */
  private async generateDocument(
    documentType: DocumentType,
    booking: Booking,
    options?: any
  ) {
    return await this.documentService.generateDocument({
      type: documentType,
      booking,
      options: options || {}
    });
  }

  /**
   * Distribue un document aux destinataires via le système de notifications avec pièces jointes
   */
  private async distributeDocumentWithNotification(
    document: any,
    booking: Booking,
    recipients: DocumentRecipient[],
    trigger: DocumentTrigger
  ): Promise<void> {
    this.documentLogger.info('📤 Distribution du document avec notifications', {
      documentId: document.getId(),
      documentType: document.getType(),
      recipients,
      trigger
    });

    for (const recipient of recipients) {
      try {
        switch (recipient) {
          case DocumentRecipient.CUSTOMER:
            await this.sendToCustomer(document, booking, trigger);
            break;

          case DocumentRecipient.PROFESSIONAL:
            await this.sendToProfessional(document, booking, trigger);
            break;

          case DocumentRecipient.ADMIN:
          case DocumentRecipient.ACCOUNTING:
            await this.sendToAdministration(document, booking, recipient, trigger);
            break;
        }
      } catch (error) {
        this.documentLogger.error('❌ Erreur lors de l\'envoi à un destinataire', {
          recipient,
          documentId: document.getId(),
          error
        });
        // Continue avec les autres destinataires
      }
    }
  }

  /**
   * 🎯 ENVOI AU CLIENT FINAL
   *
   * Utilise DocumentNotificationService pour envoyer au client avec template approprié.
   * Le client reçoit toujours les données complètes de sa réservation.
   *
   * @param document - Document généré
   * @param booking - Réservation
   * @param trigger - Événement pour contexte
   */
  private async sendToCustomer(document: any, booking: Booking, trigger: DocumentTrigger): Promise<void> {
    const customer = booking.getCustomer();
    if (!customer) {
      this.documentLogger.warn('⚠️ Aucun client trouvé pour l\'envoi de document');
      return;
    }

    this.documentLogger.info('📧 Envoi de document au client', {
      customerEmail: customer.getContactInfo().getEmail(),
      documentType: document.getType()
    });

    await this.notificationService.sendDocumentGenerationNotification(
      booking,
      customer,
      [document],
      {
        trigger: trigger,
        reason: `Document ${document.getType()} généré suite à: ${trigger}`
      }
    );
  }

  /**
   * 👥 ENVOI AUX PROFESSIONNELS (ARCHITECTURE REFACTORISÉE)
   *
   * Délègue intelligemment aux services spécialisés selon le type de professionnel :
   *
   * 🏢 ÉQUIPE INTERNE :
   * - Utilise InternalStaffNotificationService
   * - Accès complet aux données client
   * - Sélection par rôle et type de service
   * - APIs /api/documents/generate + /api/notifications/business/*
   *
   * 🚚 PRESTATAIRES EXTERNES :
   * - Utilise AttributionNotificationService (via BookingAttribution)
   * - Données client restreintes pour confidentialité
   * - PDF avec informations limitées
   * - Flux en 2 étapes (attribution → révélation jour J)
   *
   * @param document - Document généré (utilisé pour prestataires externes)
   * @param booking - Réservation
   * @param trigger - Événement déclencheur
   */
  private async sendToProfessional(document: any, booking: Booking, trigger: DocumentTrigger): Promise<void> {
    try {
      // 👥 PARTIE 1: ÉQUIPE INTERNE (données complètes)
      this.documentLogger.info('👥 Envoi aux responsables internes via service spécialisé', {
        trigger: trigger.toString()
      });

      await this.internalStaffNotificationService.sendInternalStaffNotifications(
        booking,
        trigger.toString(),
        {
          // Context riche selon le trigger
          confirmationDate: trigger === DocumentTrigger.BOOKING_CONFIRMED ? new Date() : undefined,
          paymentDate: trigger === DocumentTrigger.PAYMENT_COMPLETED ? new Date() : undefined
        }
      );

      // 🚚 PARTIE 2: PRESTATAIRES EXTERNES (données restreintes si attribution active)
      this.documentLogger.info('🚚 Vérification prestataires externes', {
        trigger: trigger.toString()
      });

      await this.sendToExternalProfessionals(document, booking, trigger);

      this.documentLogger.info('✅ Distribution professionnelle terminée', {
        bookingId: booking.getId(),
        trigger: trigger.toString()
      });

    } catch (error) {
      this.documentLogger.error('❌ Erreur lors de l\'envoi aux professionnels', {
        bookingType: booking.getType(),
        documentType: document.getType(),
        trigger: trigger.toString(),
        error
      });
    }
  }

  /**
   * 🚚 ENVOI AUX PRESTATAIRES EXTERNES
   *
   * Vérifie s'il existe des attributions actives pour cette réservation.
   * Si oui, envoie les documents aux prestataires ayant accepté la mission.
   *
   * LOGIQUE D'ATTRIBUTION :
   * - Recherche BookingAttribution avec statuts actifs
   * - Sélectionne les professionnels ayant accepté (ACCEPTED)
   * - Envoie documents via sendDocumentToExternalProfessional
   *
   * NOTE: Le système d'attribution gère déjà les données restreintes
   * via AttributionNotificationService lors du trigger PAYMENT_COMPLETED.
   *
   * @param document - Document à envoyer
   * @param booking - Réservation concernée
   * @param trigger - Événement déclencheur
   */
  private async sendToExternalProfessionals(document: any, booking: Booking, trigger: DocumentTrigger): Promise<void> {
    try {
      // Récupérer les attributions actives pour cette réservation
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      const activeAttributions = await prisma.bookingAttribution.findMany({
        where: {
          bookingId: booking.getId(),
          status: {
            in: ['BROADCASTING', 'PENDING_RESPONSE', 'ACCEPTED']
          }
        },
        include: {
          responses: {
            where: {
              responseType: 'ACCEPTED'
            },
            include: {
              professional: true
            }
          }
        }
      });

      await prisma.$disconnect();

      if (activeAttributions.length === 0) {
        this.documentLogger.info('ℹ️ Aucune attribution active trouvée pour envoi aux professionnels externes', {
          bookingId: booking.getId()
        });
        return;
      }

      // Pour chaque attribution active, envoyer les documents
      for (const attribution of activeAttributions) {
        // Si des professionnels ont accepté la mission
        for (const response of attribution.responses) {
          if (response.professional) {
            await this.sendDocumentToExternalProfessional(
              document,
              booking,
              response.professional,
              attribution,
              trigger
            );
          }
        }

        // Si attribution en cours de diffusion, envoyer aux professionnels éligibles
        if (attribution.status === 'BROADCASTING' && this.shouldSendToAll(trigger)) {
          await this.sendToAllEligibleProfessionals(document, booking, attribution, trigger);
        }
      }

    } catch (error) {
      this.documentLogger.error('❌ Erreur lors de l\'envoi aux professionnels externes', {
        bookingId: booking.getId(),
        error
      });
    }
  }

  /**
   * Envoie un document à un professionnel externe spécifique
   */
  private async sendDocumentToExternalProfessional(
    document: any,
    booking: Booking,
    professional: any,
    attribution: any,
    trigger: DocumentTrigger
  ): Promise<void> {
    try {
      this.documentLogger.info('📧 Envoi de document à un professionnel EXTERNE', {
        professionalId: professional.id,
        companyName: professional.companyName,
        email: professional.email.replace(/(.{3}).*(@.*)/, '$1***$2'),
        documentType: document.getType()
      });

      // Préparer les données pour l'API externe
      const customer = booking.getCustomer();
      const attachmentData = {
        filename: `${document.getType().toLowerCase()}_${booking.getId().slice(-8)}.pdf`,
        content: document.getContent().toString('base64'),
        mimeType: 'application/pdf',
        documentId: document.getId(),
        documentType: document.getType()
      };

      const attributionData = {
        // Données professionnel externe
        professionalEmail: professional.email,
        companyName: professional.companyName,
        businessType: professional.businessType,
        professionalId: professional.id,

        // Données mission
        bookingId: booking.getId(),
        bookingReference: `EQ-${booking.getId().slice(-8).toUpperCase()}`,
        serviceType: booking.getType(),
        totalAmount: booking.getTotalAmount().getAmount(),

        // Données client (limitées)
        customerName: `${customer.getFirstName()} ${customer.getLastName()}`,
        customerPhone: customer.getPhone(),

        // Détails mission (à adapter selon les données disponibles)
        serviceDate: booking.getScheduledDate()?.toISOString().split('T')[0] || 'À planifier',
        serviceTime: '09:00', // Par défaut
        pickupAddress: 'Voir détails dans les documents',

        // Attribution
        attributionId: attribution.id,
        priority: this.getPriorityFromTrigger(trigger),
        acceptUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/attribution/accept`,
        refuseUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/attribution/refuse`,

        // Documents
        attachments: [attachmentData],
        attachedDocuments: [{
          type: document.getType(),
          filename: attachmentData.filename,
          size: document.getContent().length
        }]
      };

      // Appeler l'API d'attribution externe
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/business/external-professional-attribution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DocumentOrchestrationService/1.0'
        },
        body: JSON.stringify(attributionData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();

      this.documentLogger.info('✅ Document envoyé au professionnel externe', {
        professionalId: professional.id,
        messageId: result.messageId,
        success: result.success
      });

    } catch (error) {
      this.documentLogger.error('❌ Erreur envoi document professionnel externe', {
        professionalId: professional.id,
        error
      });
    }
  }

  /**
   * Détermine si on doit envoyer à tous les professionnels éligibles
   */
  private shouldSendToAll(trigger: DocumentTrigger): boolean {
    // Envoyer à tous seulement pour certains triggers critiques
    return [
      DocumentTrigger.BOOKING_CONFIRMED,
      DocumentTrigger.PAYMENT_COMPLETED,
      DocumentTrigger.SERVICE_STARTED
    ].includes(trigger);
  }

  /**
   * Envoie à tous les professionnels éligibles pour une attribution
   */
  private async sendToAllEligibleProfessionals(
    document: any,
    booking: Booking,
    attribution: any,
    trigger: DocumentTrigger
  ): Promise<void> {
    try {
      // Cette fonctionnalité nécessiterait l'intégration avec AttributionService
      // Pour l'instant, on log seulement
      this.documentLogger.info('📡 Envoi de document à tous les professionnels éligibles', {
        attributionId: attribution.id,
        documentType: document.getType(),
        trigger,
        note: 'Fonctionnalité à implémenter avec AttributionService'
      });

    } catch (error) {
      this.documentLogger.error('❌ Erreur envoi global professionnels externes', {
        error
      });
    }
  }

  /**
   * Détermine la priorité selon le trigger
   */
  private getPriorityFromTrigger(trigger: DocumentTrigger): 'normal' | 'high' | 'urgent' {
    const urgentTriggers = [
      DocumentTrigger.PAYMENT_COMPLETED,
      DocumentTrigger.SERVICE_STARTED
    ];

    const highTriggers = [
      DocumentTrigger.BOOKING_CONFIRMED,
      DocumentTrigger.BOOKING_SCHEDULED
    ];

    if (urgentTriggers.includes(trigger)) return 'urgent';
    if (highTriggers.includes(trigger)) return 'high';
    return 'normal';
  }

  /**
   * 🏢 ENVOI À L'ADMINISTRATION ET COMPTABILITÉ
   *
   * Gère l'envoi aux rôles administratifs selon le type de destinataire.
   *
   * LOGIQUE DE ROUTAGE :
   * - 💰 ACCOUNTING → Délégué à InternalStaffNotificationService (rôle ACCOUNTING)
   * - 🏢 ADMIN → Fallback email d'administration (variables d'environnement)
   *
   * La comptabilité est traitée comme faisant partie de l'équipe interne
   * pour bénéficier de la logique unifiée et des APIs standardisées.
   *
   * @param document - Document généré
   * @param booking - Réservation
   * @param recipient - Type de destinataire admin
   * @param trigger - Événement déclencheur
   */
  private async sendToAdministration(
    document: any,
    booking: Booking,
    recipient: DocumentRecipient,
    trigger: DocumentTrigger
  ): Promise<void> {
    try {
      if (recipient === DocumentRecipient.ACCOUNTING) {
        // 💰 COMPTABILITÉ → Service équipe interne (architecture unifiée)
        this.documentLogger.info('💰 Notification comptabilité via service équipe interne', {
          documentType: document.getType(),
          trigger: trigger.toString()
        });

        // La comptabilité fait partie de l'équipe interne, utiliser le service unifié
        // qui sélectionnera automatiquement les membres avec rôle ACCOUNTING
        await this.internalStaffNotificationService.sendInternalStaffNotifications(
          booking,
          trigger.toString(),
          {
            paymentDate: trigger === DocumentTrigger.PAYMENT_COMPLETED ? new Date() : undefined
          }
        );

        this.documentLogger.info('✅ Notification comptabilité déléguée avec succès', {
          documentType: document.getType(),
          trigger: trigger.toString()
        });

      } else {
        // 🏢 ADMIN → Fallback email d'administration (configuration environnement)
        const adminEmail = process.env.ADMIN_EMAIL;

        if (!adminEmail) {
          this.documentLogger.warn('⚠️ ADMIN_EMAIL non configuré dans les variables d\'environnement');
          return;
        }

        this.documentLogger.info('🏢 Envoi document admin via fallback email', {
          adminEmail: adminEmail.replace(/(.{3}).*(@.*)/, '$1***$2'),
          documentType: document.getType()
        });

        // TODO: Implémenter l'envoi direct via service email avec template admin
        // await this.sendDirectAdminEmail(adminEmail, document, booking, trigger);
      }
    } catch (error) {
      this.documentLogger.error('❌ Erreur lors de l\'envoi à l\'administration', {
        recipient,
        documentType: document.getType(),
        error
      });
    }
  }

  /**
   * ⚙️ CONFIGURATION DE RÈGLES PERSONNALISÉES
   *
   * Permet d'ajouter des règles métier spécifiques selon les besoins business.
   * Les règles personnalisées s'ajoutent aux règles par défaut.
   *
   * @param customRules - Règles additionnelles à appliquer
   */
  public configureCustomRules(customRules: DocumentRule[]): void {
    // Fusionner avec les règles par défaut
    this.defaultRules = [...this.defaultRules, ...customRules];
    this.documentLogger.info('⚙️ Règles personnalisées configurées', {
      totalRules: this.defaultRules.length,
      customRulesAdded: customRules.length
    });
  }

  /**
   * 📋 CONSULTATION DES RÈGLES CONFIGURÉES
   *
   * Retourne une copie des règles actives pour inspection/debug.
   *
   * @returns Copie des règles de génération
   */
  public getRules(): DocumentRule[] {
    return [...this.defaultRules];
  }

  /**
   * 📊 CONSULTATION DE LA MATRICE DE DISTRIBUTION
   *
   * Retourne la configuration de distribution par type de document.
   *
   * @returns Copie de la matrice de distribution
   */
  public getDistributionMatrix(): DistributionMatrix {
    return { ...this.distributionMatrix };
  }
}