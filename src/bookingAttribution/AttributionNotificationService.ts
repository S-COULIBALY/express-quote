/**
 * Service de notification pour l'attribution des réservations aux professionnels
 * NOUVEAU FLUX : Utilise l'API payment-confirmation avec PDF restreints pour prestataires
 * + Programmation automatique des rappels jour J
 */

import { EligibleProfessional } from './ProfessionalLocationService';
import { LimitedClientData, ProfessionalPaymentNotificationData, ScheduledServiceReminder } from '@/types/professional-attribution';
import { ProfessionalDocumentService } from '@/documents/application/services/ProfessionalDocumentService';
import { AttributionUtils } from './AttributionUtils';
import { logger } from '@/lib/logger';
import { getGlobalNotificationService } from '@/notifications/interfaces/http/GlobalNotificationService';
import * as fs from 'fs/promises';

interface AttributionNotificationData {
  attributionId: string;
  bookingData: {
    totalAmount: number;
    scheduledDate: Date;
    locationAddress: string;
    customerFirstName?: string;
    customerLastName?: string;
    customerPhone?: string;
    additionalInfo?: any;
  };
  missionDetails: {
    serviceType: string;
    duration: string;
    description: string;
    requirements?: string[];
  };
  acceptUrl: string;
  refuseUrl: string;
  distanceKm: number;
  priority: 'normal' | 'high' | 'urgent';
}

export class AttributionNotificationService {
  private baseUrl: string;
  private professionalDocService: ProfessionalDocumentService;
  private notificationLogger = logger.withContext('AttributionNotificationService');

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.INTERNAL_API_URL || 'http://localhost:3000';
    this.professionalDocService = new ProfessionalDocumentService();
  }

  /**
   * 🆕 NOUVEAU FLUX : Envoie notifications d'attribution via payment-confirmation + PDF restreints
   */
  async sendAttributionNotifications(
    attributionId: string,
    eligibleProfessionals: EligibleProfessional[],
    bookingData: {
      bookingId: string;
      bookingReference: string;
      serviceType: string;
      serviceDate: Date;
      serviceTime: string;
      totalAmount: number;
      priority: 'normal' | 'high' | 'urgent';
      // Données complètes (pour usage interne uniquement)
      fullClientData: {
        customerName: string;
        customerEmail: string;
        customerPhone?: string;
        fullPickupAddress: string;
        fullDeliveryAddress?: string;
      };
      // Données limitées (pour prestataires)
      limitedClientData: LimitedClientData;
    }
  ): Promise<void> {
    this.notificationLogger.info('📡 NOUVEAU FLUX: Attribution via payment-confirmation', {
      attributionId,
      professionalsCount: eligibleProfessionals.length,
      serviceType: bookingData.serviceType
    });

    // Traitement en parallèle + programmation des rappels
    const notifications = await Promise.allSettled([
      // Envois immédiats aux prestataires
      ...eligibleProfessionals.map(professional =>
        this.sendProfessionalAttributionNotification(attributionId, professional, bookingData)
      ),
      // Programmation des rappels jour J
      this.scheduleServiceReminders(attributionId, eligibleProfessionals, bookingData)
    ]);

    const successfulNotifications = notifications.slice(0, eligibleProfessionals.length).filter(r => r.status === 'fulfilled').length;
    const failedNotifications = notifications.slice(0, eligibleProfessionals.length).filter(r => r.status === 'rejected').length;
    const reminderScheduled = notifications[notifications.length - 1].status === 'fulfilled';

    this.notificationLogger.info('✅ Attribution terminée', {
      attributionId,
      notificationsSent: successfulNotifications,
      notificationsFailed: failedNotifications,
      remindersScheduled: reminderScheduled
    });

    if (failedNotifications > 0) {
      this.notificationLogger.warn(`⚠️ ${failedNotifications} notifications d'attribution ont échoué`);
    }
  }

  /**
   * 🆕 Envoie notification d'attribution via API payment-confirmation avec PDF restreint
   */
  private async sendProfessionalAttributionNotification(
    attributionId: string,
    professional: EligibleProfessional,
    bookingData: any
  ): Promise<void> {
    try {
      this.notificationLogger.info('📧 Attribution prestataire via payment-confirmation', {
        professionalCompany: professional.companyName,
        distanceKm: professional.distanceKm,
        serviceType: bookingData.serviceType
      });

      // ÉTAPE 1 : Génération PDF restreint pour prestataire
      const acceptUrl = `${this.baseUrl}/api/attribution/${attributionId}/accept?professionalId=${professional.id}&token=${this.generateSecureToken(professional.id, attributionId)}`;
      const refuseUrl = `${this.baseUrl}/api/attribution/${attributionId}/refuse?professionalId=${professional.id}&token=${this.generateSecureToken(professional.id, attributionId)}`;

      const documentRequest = {
        attributionId,
        professionalId: professional.id,
        professionalEmail: professional.email,
        professionalCompany: professional.companyName,
        bookingId: bookingData.bookingId,
        bookingReference: bookingData.bookingReference,
        serviceDate: bookingData.serviceDate.toISOString(),
        serviceTime: bookingData.serviceTime,
        serviceType: bookingData.serviceType,
        estimatedDuration: AttributionUtils.estimateDuration(bookingData),
        priority: bookingData.priority,
        limitedClientData: bookingData.limitedClientData,
        distanceKm: professional.distanceKm,
        acceptUrl,
        refuseUrl,
        timeoutDate: AttributionUtils.calculateTimeoutDate(bookingData.priority),
        documentType: 'MISSION_PROPOSAL' as const,
        saveToSubDir: `attributions/${attributionId.slice(0, 8)}`
      };

      const documentsResult = await this.professionalDocService.generateProfessionalDocuments(documentRequest);

      if (!documentsResult.success || documentsResult.documents.length === 0) {
        throw new Error(`Erreur génération PDF: ${documentsResult.error}`);
      }

      this.notificationLogger.info('📄 PDF prestataire généré', {
        attributionId,
        documents: documentsResult.documents.length,
        totalSize: `${Math.round(documentsResult.metadata.totalSize / 1024)}KB`
      });

      // ✅ ÉTAPE 2 : Ajouter à la queue via système de notification
      const notificationService = await getGlobalNotificationService();

      // Préparer les pièces jointes en lisant le contenu des fichiers
      const attachments = await Promise.all(
        documentsResult.documents
          .filter(doc => doc.path)
          .map(async doc => {
            const content = await fs.readFile(doc.path);
            return {
              filename: doc.filename,
              content: content,
              contentType: doc.mimeType || 'application/pdf'
            };
          })
      );

      this.notificationLogger.info('📧 Ajout attribution prestataire à la queue', {
        professionalCompany: professional.companyName,
        professionalEmail: professional.email.replace(/(.{3}).*(@.*)/, '$1***$2'),
        attachmentsCount: attachments.length
      });

      // ✅ Ajouter à la queue email avec PDF restreint
      const notificationResult = await notificationService.sendEmail({
        to: professional.email,
        template: 'external-professional-attribution',
        data: {
          // Données professionnel
          professionalName: professional.companyName,
          professionalEmail: professional.email,
          professionalId: professional.id,

          // Données mission (limitées)
          bookingId: bookingData.bookingId,
          bookingReference: bookingData.bookingReference,
          serviceType: bookingData.serviceType,
          serviceName: `Mission ${bookingData.serviceType} - ${professional.companyName}`,
          serviceDate: bookingData.serviceDate.toISOString(),
          serviceTime: bookingData.serviceTime,
          estimatedDuration: AttributionUtils.estimateDuration(bookingData),
          distanceKm: professional.distanceKm,

          // Données client (limitées)
          customerName: bookingData.limitedClientData.customerName,
          pickupAddress: bookingData.limitedClientData.pickupAddress,
          deliveryAddress: bookingData.limitedClientData.deliveryAddress,
          quoteDetails: bookingData.limitedClientData.quoteDetails,

          // Actions prestataire
          acceptUrl,
          refuseUrl,
          timeoutDate: AttributionUtils.calculateTimeoutDate(bookingData.priority),
          viewBookingUrl: acceptUrl,
          supportUrl: `${this.baseUrl}/contact`,

          // Context
          trigger: 'PROFESSIONAL_ATTRIBUTION',
          attributionId,
          priority: bookingData.priority
        },
        attachments: attachments,
        priority: bookingData.priority === 'urgent' ? 'HIGH' : 'NORMAL',
        metadata: {
          attributionId,
          professionalId: professional.id,
          bookingId: bookingData.bookingId,
          source: 'professional-attribution',
          limitedData: true // Flag pour indiquer données limitées
        }
      });

      this.notificationLogger.info('✅ Attribution ajoutée à la queue', {
        professionalCompany: professional.companyName,
        emailJobId: notificationResult.id,
        attachmentsQueued: attachments.length
      });

    } catch (error) {
      this.notificationLogger.error('❌ Erreur envoi attribution prestataire', {
        professionalCompany: professional.companyName,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      throw error;
    }
  }

  /**
   * 🕐 Programme les rappels de service à 4h du matin le jour J
   */
  private async scheduleServiceReminders(
    attributionId: string,
    professionals: EligibleProfessional[],
    bookingData: any
  ): Promise<void> {
    try {
      this.notificationLogger.info('⏰ Programmation rappels service jour J', {
        attributionId,
        serviceDate: bookingData.serviceDate,
        professionalsCount: professionals.length
      });

      // Calculer 4h du matin le jour du service
      const serviceDate = new Date(bookingData.serviceDate);
      const reminderDate = new Date(serviceDate);
      reminderDate.setHours(4, 0, 0, 0); // 4h00 du matin

      // Si c'est aujourd'hui et qu'il est déjà plus de 4h, programmer pour maintenant + 5 minutes
      if (reminderDate <= new Date()) {
        reminderDate.setTime(Date.now() + 5 * 60 * 1000); // Dans 5 minutes
        this.notificationLogger.warn('⚠️ Service aujourd\'hui, rappel programmé dans 5 minutes', {
          attributionId,
          reminderDate
        });
      }

      // Créer des rappels programmés pour chaque professionnel
      for (const professional of professionals) {
        const reminderData: ScheduledServiceReminder = {
          id: `reminder_${attributionId}_${professional.id}`,
          bookingId: bookingData.bookingId,
          professionalId: professional.id,
          attributionId,
          scheduledDate: reminderDate,
          serviceDate: serviceDate,

          // Données complètes révélées le jour J
          fullClientData: {
            customerName: bookingData.fullClientData.customerName,
            customerPhone: bookingData.fullClientData.customerPhone || '',
            fullPickupAddress: bookingData.fullClientData.fullPickupAddress,
            fullDeliveryAddress: bookingData.fullClientData.fullDeliveryAddress || '',
            specialInstructions: bookingData.additionalInfo || ''
          },

          status: 'SCHEDULED',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Sauvegarder le rappel (en base ou système de queue)
        await this.saveScheduledReminder(reminderData);
      }

      this.notificationLogger.info('✅ Rappels service programmés', {
        attributionId,
        reminderDate: reminderDate.toISOString(),
        remindersScheduled: professionals.length
      });

    } catch (error) {
      this.notificationLogger.error('❌ Erreur programmation rappels', {
        attributionId,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      throw error;
    }
  }

  /**
   * 🔔 Envoie un rappel de service avec données complètes
   */
  async sendServiceReminder(reminderId: string): Promise<void> {
    try {
      // Récupérer les données du rappel
      const reminder = await this.getScheduledReminder(reminderId);
      if (!reminder || reminder.status !== 'SCHEDULED') {
        this.notificationLogger.warn('⚠️ Rappel non trouvé ou déjà traité', { reminderId });
        return;
      }

      this.notificationLogger.info('🔔 Envoi rappel service avec données complètes', {
        reminderId,
        professionalId: reminder.professionalId,
        serviceDate: reminder.serviceDate
      });

      // Récupérer les données du professionnel
      const professional = await this.getProfessionalById(reminder.professionalId);
      if (!professional) {
        throw new Error(`Professionnel non trouvé: ${reminder.professionalId}`);
      }

      // Préparer les données de rappel via service-reminder API
      const serviceReminderData = {
        bookingId: reminder.bookingId,
        email: professional.email,
        customerPhone: reminder.fullClientData.customerPhone,
        reminderDetails: {
          serviceName: `Service ${reminder.serviceDate.toLocaleDateString('fr-FR')}`,
          appointmentDate: reminder.serviceDate.toLocaleDateString('fr-FR'),
          appointmentTime: reminder.serviceDate.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          address: reminder.fullClientData.fullPickupAddress,
          preparationInstructions: [
            'Vérifier le matériel nécessaire',
            'Confirmer l\'heure d\'arrivée',
            'Préparer les documents contractuels',
            reminder.fullClientData.specialInstructions || 'Aucune instruction spéciale'
          ].filter(Boolean)
        },
        // Données client complètes révélées
        fullClientData: reminder.fullClientData,
        professionalCompany: professional.companyName,
        supportUrl: `${this.baseUrl}/contact`,
        urgentContact: reminder.fullClientData.customerPhone
      };

      // Appel à l'API service-reminder
      const reminderResponse = await fetch(`${this.baseUrl}/api/notifications/business/service-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ServiceReminderScheduler/1.0'
        },
        body: JSON.stringify(serviceReminderData)
      });

      if (!reminderResponse.ok) {
        const errorText = await reminderResponse.text();
        throw new Error(`Erreur API service-reminder: ${reminderResponse.status} - ${errorText}`);
      }

      const reminderResult = await reminderResponse.json();

      // Marquer le rappel comme envoyé
      await this.updateReminderStatus(reminderId, 'SENT');

      this.notificationLogger.info('✅ Rappel service envoyé', {
        reminderId,
        professionalCompany: professional.companyName,
        emailsSent: reminderResult.emailsSent,
        smsSent: reminderResult.smsSent
      });

    } catch (error) {
      this.notificationLogger.error('❌ Erreur envoi rappel service', {
        reminderId,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });

      // Marquer le rappel comme échoué mais ne pas le supprimer
      try {
        await this.updateReminderStatus(reminderId, 'SCHEDULED');
      } catch {}

      throw error;
    }
  }

  /**
   * 🚫 Annule tous les rappels liés à une attribution
   */
  async cancelAttributionReminders(attributionId: string, reason: string = 'Attribution annulée'): Promise<void> {
    try {
      this.notificationLogger.info('🚫 Annulation rappels attribution', {
        attributionId,
        reason
      });

      const cancelledCount = await this.cancelRemindersByAttribution(attributionId, reason);

      this.notificationLogger.info('✅ Rappels annulés', {
        attributionId,
        cancelledCount,
        reason
      });

    } catch (error) {
      this.notificationLogger.error('❌ Erreur annulation rappels', {
        attributionId,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      throw error;
    }
  }

  // ============================================================================
  // MÉTHODES DE PERSISTANCE ET RÉCUPÉRATION DES RAPPELS
  // ============================================================================

  /**
   * Sauvegarde un rappel programmé
   */
  private async saveScheduledReminder(reminder: ScheduledServiceReminder): Promise<void> {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
      this.notificationLogger.info('💾 Sauvegarde rappel programmé', {
        reminderId: reminder.id,
        scheduledDate: reminder.scheduledDate.toISOString(),
        professionalId: reminder.professionalId
      });

      await prisma.scheduledReminder.create({
        data: {
          id: reminder.id,
          bookingId: reminder.bookingId,
          professionalId: reminder.professionalId,
          attributionId: reminder.attributionId,
          reminderType: 'SERVICE_DAY_REMINDER',
          scheduledDate: reminder.scheduledDate,
          serviceDate: reminder.serviceDate,
          recipientEmail: '', // Sera rempli lors de l'envoi
          fullClientData: reminder.fullClientData,
          status: 'SCHEDULED',
          attempts: 0,
          maxAttempts: 3,
          createdAt: reminder.createdAt,
          updatedAt: reminder.updatedAt
        }
      });

      this.notificationLogger.info('✅ Rappel sauvegardé en base', {
        reminderId: reminder.id
      });

    } catch (error) {
      this.notificationLogger.error('❌ Erreur sauvegarde rappel', {
        reminderId: reminder.id,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Récupère un rappel programmé
   */
  private async getScheduledReminder(reminderId: string): Promise<ScheduledServiceReminder | null> {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
      const reminder = await prisma.scheduledReminder.findUnique({
        where: { id: reminderId }
      });

      if (!reminder) {
        return null;
      }

      return {
        id: reminder.id,
        bookingId: reminder.bookingId,
        professionalId: reminder.professionalId || '',
        attributionId: reminder.attributionId || '',
        scheduledDate: reminder.scheduledDate,
        serviceDate: reminder.serviceDate,
        fullClientData: reminder.fullClientData as any,
        status: reminder.status as 'SCHEDULED' | 'SENT' | 'CANCELLED',
        cancelReason: reminder.cancelReason || undefined,
        createdAt: reminder.createdAt,
        updatedAt: reminder.updatedAt
      };

    } catch (error) {
      this.notificationLogger.error('❌ Erreur récupération rappel', {
        reminderId,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      return null;
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Met à jour le statut d'un rappel
   */
  private async updateReminderStatus(reminderId: string, status: 'SCHEDULED' | 'SENT' | 'CANCELLED'): Promise<void> {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
      await prisma.scheduledReminder.update({
        where: { id: reminderId },
        data: {
          status: status,
          sentAt: status === 'SENT' ? new Date() : undefined,
          updatedAt: new Date()
        }
      });

      this.notificationLogger.info('🔄 Statut rappel mis à jour', {
        reminderId,
        status
      });

    } catch (error) {
      this.notificationLogger.error('❌ Erreur mise à jour statut rappel', {
        reminderId,
        status,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Annule tous les rappels d'une attribution
   */
  private async cancelRemindersByAttribution(attributionId: string, reason: string): Promise<number> {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
      const result = await prisma.scheduledReminder.updateMany({
        where: {
          attributionId,
          status: 'SCHEDULED'
        },
        data: {
          status: 'CANCELLED',
          cancelReason: reason,
          updatedAt: new Date()
        }
      });

      this.notificationLogger.info('🚫 Rappels annulés par attribution', {
        attributionId,
        cancelledCount: result.count,
        reason
      });

      return result.count;

    } catch (error) {
      this.notificationLogger.error('❌ Erreur annulation rappels attribution', {
        attributionId,
        reason,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Récupère les données d'une attribution avec données limitées pour prestataires
   */
  private async getAttributionData(attributionId: string): Promise<any> {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
      // Récupérer l'attribution avec toutes les données liées
      const attribution = await prisma.attribution.findUnique({
        where: { id: attributionId },
        include: {
          booking: {
            include: {
              customer: true,
              moving: true,
              quoteRequest: true
            }
          }
        }
      });

      if (!attribution) {
        throw new Error(`Attribution ${attributionId} non trouvée`);
      }

      const booking = attribution.booking;

      // Préparer les données limitées (respectant RGPD pour prestataires)
      const limitedClientData = {
        customerName: booking.customer.firstName || 'Client', // Prénom seulement
        serviceType: booking.serviceType,
        generalLocation: this.extractGeneralLocation(
          booking.moving?.pickupAddress || booking.address || ''
        ),
        quoteDetails: {
          estimatedAmount: Math.round(booking.totalAmount * 0.7), // Montant estimé (70% du total)
          currency: 'EUR',
          serviceDate: attribution.serviceDate,
          serviceTime: attribution.serviceTime || booking.preferredTime
        }
      };

      // Données complètes (pour usage interne uniquement - rappels jour J)
      const fullClientData = {
        customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
        customerEmail: booking.customer.email,
        customerPhone: booking.customer.phone,
        fullPickupAddress: booking.moving?.pickupAddress || booking.address,
        fullDeliveryAddress: booking.moving?.deliveryAddress || ''
      };

      this.notificationLogger.info('📊 Données attribution récupérées', {
        attributionId,
        bookingId: booking.id,
        dataLevel: 'MIXED_LIMITED_AND_FULL'
      });

      return {
        attributionId: attribution.id,
        bookingId: booking.id,
        bookingReference: booking.reference,
        serviceDate: new Date(attribution.serviceDate),
        serviceTime: attribution.serviceTime || booking.preferredTime,
        totalAmount: booking.totalAmount,

        // 🔒 Données limitées pour prestataires
        limitedClientData,

        // 🔓 Données complètes pour usage interne seulement
        fullClientData
      };

    } catch (error) {
      this.notificationLogger.error('❌ Erreur récupération attribution', {
        attributionId,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Extrait la localisation générale (ville/arrondissement) d'une adresse complète
   */
  private extractGeneralLocation(fullAddress: string): string {
    if (!fullAddress) return 'Non spécifié';

    // Extraire ville et code postal des derniers éléments de l'adresse
    const parts = fullAddress.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      return parts.slice(-2).join(', '); // Ex: "75001 Paris"
    }

    // Fallback: garder seulement ville
    const cityMatch = fullAddress.match(/\d{5}\s+([^,]+)/);
    if (cityMatch) {
      return cityMatch[0]; // "75001 Paris"
    }

    return 'Région parisienne'; // Fallback général
  }

  /**
   * Récupère les données d'un professionnel
   */
  private async getProfessionalById(professionalId: string): Promise<EligibleProfessional | null> {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
      const prof = await prisma.professional.findUnique({
        where: { id: professionalId },
        select: {
          id: true,
          companyName: true,
          email: true,
          phone: true,
          city: true,
          address: true,
          latitude: true,
          longitude: true
        }
      });

      if (!prof) {
        return null;
      }

      return {
        id: prof.id,
        companyName: prof.companyName,
        email: prof.email,
        phone: prof.phone,
        latitude: prof.latitude,
        longitude: prof.longitude,
        city: prof.city,
        address: prof.address,
        distanceKm: 0 // Distance sera calculée si nécessaire
      };

    } catch (error) {
      this.notificationLogger.error('❌ Erreur récupération professionnel', {
        professionalId,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      return null;
    } finally {
      await prisma.$disconnect();
    }
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES
  // ============================================================================

  // Les méthodes utilitaires ont été déplacées vers AttributionUtils

  /**
   * Génère un token sécurisé pour les liens d'action
   */
  private generateSecureToken(professionalId: string, attributionId: string): string {
    return AttributionUtils.generateSecureToken(professionalId, attributionId);
  }

  /**
   * Envoie notification email avec template d'attribution
   */
  private async sendEmailNotification(
    email: string,
    data: AttributionNotificationData
  ): Promise<void> {
    const requestBody = {
      email,
      subject: `🚀 Nouvelle mission disponible - ${data.missionDetails.serviceType}`,
      templateType: 'professional-attribution',
      data: {
        // Données professionnelles
        professionalEmail: email,
        
        // Données mission
        attributionId: data.attributionId,
        serviceType: data.missionDetails.serviceType,
        totalAmount: data.bookingData.totalAmount,
        scheduledDate: data.bookingData.scheduledDate.toLocaleDateString('fr-FR'),
        scheduledTime: data.bookingData.scheduledDate.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        locationCity: AttributionUtils.extractCityFromAddress(data.bookingData.locationAddress),
        locationDistrict: AttributionUtils.extractDistrictFromAddress(data.bookingData.locationAddress),
        distanceKm: data.distanceKm,
        
        // Détails mission
        duration: data.missionDetails.duration,
        description: data.missionDetails.description,
        requirements: data.missionDetails.requirements?.join(', ') || 'Standard',
        
        // Actions
        acceptUrl: data.acceptUrl,
        refuseUrl: data.refuseUrl,
        
        // URLs dashboard
        dashboardUrl: `${this.baseUrl}/professional/dashboard`,
        attributionDetailsUrl: `${this.baseUrl}/professional/attributions/${data.attributionId}`,
        
        // Métadonnées
        priority: data.priority,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
        
        // Informations de contact
        supportEmail: process.env.SUPPORT_EMAIL || 'support@express-quote.com',
        supportPhone: process.env.SUPPORT_PHONE || '+33 1 23 45 67 89'
      }
    };

    const response = await fetch(`${this.baseUrl}/api/notifications/business`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AttributionNotificationService/1.0'
      },
      body: JSON.stringify({
        type: 'professional-attribution',
        ...requestBody.data
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
    }
  }

  /**
   * Envoie notification WhatsApp avec liens d'action
   */
  private async sendWhatsAppNotification(
    phone: string,
    data: AttributionNotificationData
  ): Promise<void> {
    if (!phone) return;

    const message = AttributionUtils.formatWhatsAppMessage({
      serviceType: data.missionDetails.serviceType,
      totalAmount: data.bookingData.totalAmount,
      scheduledDate: data.bookingData.scheduledDate,
      locationAddress: data.bookingData.locationAddress,
      distanceKm: data.distanceKm,
      duration: data.missionDetails.duration,
      description: data.missionDetails.description,
      acceptUrl: data.acceptUrl,
      refuseUrl: data.refuseUrl,
      baseUrl: this.baseUrl
    });

    const requestBody = {
      phone,
      message,
      templateType: 'attribution-whatsapp',
      priority: data.priority
    };

    const response = await fetch(`${this.baseUrl}/api/notifications/whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AttributionNotificationService-WhatsApp/1.0'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.warn(`⚠️ Échec WhatsApp pour ${phone}: ${response.status}`);
    }
  }

  /**
   * Notifie tous les autres professionnels qu'une mission a été prise
   */
  async notifyAttributionTaken(attributionId: string, acceptedProfessionalId: string): Promise<void> {
    console.log(`🔔 Notification mission prise pour attribution ${attributionId}`);

    // WebSocket notification pour masquer l'offre en temps réel
    await this.sendWebSocketUpdate(attributionId, {
      type: 'attribution_taken',
      attributionId,
      acceptedBy: acceptedProfessionalId,
      timestamp: new Date().toISOString()
    });

    // Email de confirmation à celui qui a accepté
    await this.sendAcceptanceConfirmation(acceptedProfessionalId, attributionId);
  }

  /**
   * Envoie confirmation d'acceptation au professionnel avec données RESTREINTES
   */
  private async sendAcceptanceConfirmation(professionalId: string, attributionId: string): Promise<void> {
    try {
      this.notificationLogger.info('📧 Envoi confirmation acceptation avec données limitées', {
        professionalId,
        attributionId
      });

      // 1. Récupérer les données du professionnel et de l'attribution
      const professional = await this.getProfessionalById(professionalId);
      const attribution = await this.getAttributionData(attributionId);

      if (!professional || !attribution) {
        throw new Error(`Données manquantes: professional=${!!professional}, attribution=${!!attribution}`);
      }

      // 2. Générer document de confirmation avec données RESTREINTES uniquement
      const confirmationDoc = await this.professionalDocService.generateProfessionalDocuments({
        attributionId,
        professionalId,
        professionalEmail: professional.email,
        professionalCompany: professional.companyName,
        bookingId: attribution.bookingId,
        bookingReference: attribution.bookingReference,
        serviceDate: attribution.serviceDate,
        serviceTime: attribution.serviceTime,
        serviceType: attribution.serviceType || 'MOVING',
        estimatedDuration: attribution.estimatedDuration || '2h',
        priority: attribution.priority || 'normal',
        distanceKm: 0,
        acceptUrl: '',
        refuseUrl: '',
        timeoutDate: new Date().toISOString(),
        documentType: 'MISSION_CONFIRMATION',

        // 🔒 DONNÉES LIMITÉES SEULEMENT (respect RGPD)
        limitedClientData: attribution.limitedClientData,

        confirmationDate: new Date(),
        saveToSubDir: `confirmations/${attributionId.slice(0, 8)}`
      });

      // 3. Envoyer via API avec données RESTREINTES
      const confirmationData = {
        email: professional.email,
        professionalCompany: professional.companyName,
        bookingId: attribution.bookingId,
        bookingReference: attribution.bookingReference,
        serviceDate: attribution.serviceDate,
        serviceTime: attribution.serviceTime,

        // 🔒 DONNÉES CLIENT LIMITÉES (zone générale, pas d'adresse exacte)
        limitedClientData: attribution.limitedClientData,

        attachments: confirmationDoc.documents.map(doc => ({
          filename: doc.filename,
          path: doc.path,
          size: doc.size,
          mimeType: doc.mimeType
        })),

        trigger: 'MISSION_ACCEPTED_CONFIRMATION',

        // Informations mission seulement
        missionStatus: 'CONFIRMED',
        nextSteps: [
          'Vous serez contacté par notre équipe avant le jour J',
          'Un rappel sera envoyé le matin du service',
          'Les coordonnées exactes seront communiquées le jour même'
        ]
      };

      const response = await fetch(`${this.baseUrl}/api/notifications/business/booking-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(confirmationData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur API confirmation: ${response.status} - ${errorText}`);
      }

      this.notificationLogger.info('✅ Confirmation d\'acceptation envoyée (données limitées)', {
        professionalId,
        attributionId,
        professionalCompany: professional.companyName,
        dataLevel: 'RESTRICTED'
      });

    } catch (error) {
      this.notificationLogger.error('❌ Erreur confirmation acceptation', {
        professionalId,
        attributionId,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      throw error;
    }
  }

  /**
   * Envoie mise à jour temps réel via système REST polling
   */
  private async sendWebSocketUpdate(attributionId: string, data: any): Promise<void> {
    try {
      this.notificationLogger.info('🔄 Envoi mise à jour temps réel (REST polling)', {
        attributionId,
        updateType: data.type,
        timestamp: data.timestamp
      });

      // ÉTAPE 1: Sauvegarder l'événement pour polling côté client
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      await prisma.attributionUpdate.create({
        data: {
          attributionId,
          updateType: data.type,
          updateData: JSON.stringify(data),
          timestamp: new Date(),
          acknowledged: false,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000) // Expire dans 10 minutes
        }
      });

      // ÉTAPE 2: Notifier via API de diffusion si disponible
      try {
        await fetch(`${this.baseUrl}/api/attribution/broadcast-update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'AttributionNotificationService-Update/1.0'
          },
          body: JSON.stringify({
            attributionId,
            updateType: data.type,
            updateData: data,
            targetAudience: 'PROFESSIONALS_EXCLUDING_ACCEPTED',
            timestamp: new Date().toISOString()
          })
        });
      } catch (apiError) {
        // API de diffusion pas encore implémentée - continue avec la persistence
        this.notificationLogger.warn('⚠️ API broadcast non disponible, utilisation du polling seulement', {
          attributionId,
          error: apiError instanceof Error ? apiError.message : 'API error'
        });
      }

      this.notificationLogger.info('✅ Mise à jour temps réel diffusée', {
        attributionId,
        updateType: data.type,
        method: 'REST_POLLING',
        expiresIn: '10 minutes'
      });

      await prisma.$disconnect();

    } catch (error) {
      this.notificationLogger.error('❌ Erreur mise à jour temps réel', {
        attributionId,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });

      // Ne pas faire échouer le processus principal
      console.warn(`⚠️ Échec update temps réel pour ${attributionId}:`, error);
    }
  }

  // Toutes les méthodes utilitaires ont été centralisées dans AttributionUtils
}