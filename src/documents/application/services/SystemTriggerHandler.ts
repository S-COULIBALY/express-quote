/**
 * SystemTriggerHandler - Gestion des triggers système (notifications sans documents PDF)
 * 
 * Responsabilité unique : Traitement des triggers système (rappel, maintenance, newsletter, etc.)
 */

import { DocumentTrigger } from './DocumentOrchestrationService';
import { DocumentType } from '../../domain/entities/Document';
import { Booking } from '@/quotation/domain/entities/Booking';
import { QuoteRequest } from '@/quotation/domain/entities/QuoteRequest';
import { logger } from '@/lib/logger';

export class SystemTriggerHandler {
  private logger = logger.withContext('SystemTriggerHandler');

  /**
   * Vérifie si un trigger est un trigger système (pas de documents PDF, juste notifications)
   */
  isSystemTrigger(trigger: DocumentTrigger): boolean {
    return [
      DocumentTrigger.SERVICE_REMINDER,
      DocumentTrigger.SYSTEM_MAINTENANCE,
      DocumentTrigger.SYSTEM_UPDATE,
      DocumentTrigger.PROMOTIONAL_OFFER,
      DocumentTrigger.NEWSLETTER
    ].includes(trigger);
  }

  /**
   * Traite un trigger système (notifications sans documents)
   */
  async handle(
    trigger: DocumentTrigger,
    entity: Booking | QuoteRequest | null,
    options?: any
  ): Promise<Array<{
    documentType: DocumentType;
    success: boolean;
    documentId?: string;
    error?: string;
  }>> {
    const results: Array<{
      documentType: DocumentType;
      success: boolean;
      documentId?: string;
      error?: string;
    }> = [];

    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.INTERNAL_API_URL || 'http://localhost:3000';
      const customOptions = options?.customOptions || {};

      let recipients: string[] = [];
      let notificationData: any = {};

      switch (trigger) {
        case DocumentTrigger.SERVICE_REMINDER:
          // Rappel de service : client uniquement (si booking disponible)
          if (entity instanceof Booking) {
            const customer = entity.getCustomer();
            if (customer) {
              recipients = [customer.getContactInfo().getEmail()];
              notificationData = {
                email: customer.getContactInfo().getEmail(),
                customerName: customer.getFullName(),
                bookingId: entity.getId(),
                bookingReference: `EQ-${entity.getId()!.slice(-8).toUpperCase()}`,
                serviceType: entity.getType(),
                reminderType: customOptions.reminderType || '24h',
                scheduledDate: entity.getScheduledDate()?.toISOString(),
                trigger: trigger.toString(),
                reason: `Rappel de service ${customOptions.reminderType || '24h'} avant le rendez-vous`
              };
            }
          }
          break;

        case DocumentTrigger.SYSTEM_MAINTENANCE:
        case DocumentTrigger.SYSTEM_UPDATE:
          // Notifications système : nécessite un service dédié pour broadcast
          results.push({
            documentType: DocumentType.OTHER,
            success: true
          });
          return results;

        case DocumentTrigger.PROMOTIONAL_OFFER:
        case DocumentTrigger.NEWSLETTER:
          // Marketing : nécessite un service dédié pour broadcast
          results.push({
            documentType: DocumentType.OTHER,
            success: true
          });
          return results;

        default:
          this.logger.warn('Trigger système non géré', { trigger });
          results.push({
            documentType: DocumentType.OTHER,
            success: false,
            error: `Trigger système non géré: ${trigger}`
          });
          return results;
      }

      // Envoyer les notifications via l'API service-reminder (pour SERVICE_REMINDER)
      if (trigger === DocumentTrigger.SERVICE_REMINDER && recipients.length > 0) {
        const response = await fetch(`${baseUrl}/api/notifications/email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'DocumentOrchestrationService/1.0'
          },
          body: JSON.stringify({
            to: notificationData.email,
            template: 'service-reminder',
            data: notificationData,
            priority: 'HIGH',
            metadata: {
              trigger: trigger.toString(),
              reminderType: notificationData.reminderType,
              source: 'DocumentOrchestrationService'
            }
          })
        });

        if (response.ok) {
          await response.json();
          results.push({
            documentType: DocumentType.OTHER,
            success: true
          });
        } else {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      }

    } catch (error) {
      this.logger.error('Erreur lors du traitement du trigger système', {
        trigger: trigger.toString(),
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      results.push({
        documentType: DocumentType.OTHER,
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }

    return results;
  }
}

