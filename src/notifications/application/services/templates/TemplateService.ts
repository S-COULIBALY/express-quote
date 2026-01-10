/**
 * TemplateService - Gestion des templates
 * 
 * Responsabilité unique : Chargement, rendu et cache des templates
 */

import { NotificationTemplate, SupportedLanguage } from '../../../core/entities/NotificationTemplate';
import { TemplateCache } from '../../../infrastructure/cache/template-cache.production';
import { ProductionLogger } from '../../../infrastructure/logging/logger.production';
import { NotificationMessage } from '../notification.service.production';

export class TemplateService {
  private templateRegistry: Map<string, NotificationTemplate> = new Map();
  private logger = new ProductionLogger('TemplateService');

  constructor(private templateCache: TemplateCache) {}

  /**
   * Charger les templates depuis les fichiers JSON
   */
  async loadDefaultTemplatesFromFactory(): Promise<void> {
    try {
      // Templates Express Quote chargés depuis JSON (12 templates au total)
      const templateFiles = [
        { id: 'quote-confirmation-email', file: 'quote-confirmation.json' },
        { id: 'booking-confirmation-email', file: 'booking-confirmation.json' },
        { id: 'payment-confirmation-email', file: 'payment-confirmation.json' },
        { id: 'appointment-reminder-sms', file: 'appointment-reminder.json' },
        { id: 'service-reminder-email', file: 'service-reminder.json' },
        { id: 'reminder-24h', file: 'reminder-24h.json' },
        { id: 'reminder-7d', file: 'reminder-7d.json' },
        { id: 'reminder-1h', file: 'reminder-1h.json' },
        { id: 'accounting-documents-email', file: 'accounting-documents.json' },
        { id: 'professional-attribution', file: 'professional-attribution.json' },
        { id: 'professional-document', file: 'professional-document.json' },
        { id: 'mission-accepted-confirmation', file: 'mission-accepted-confirmation.json' }
      ];
      
      for (const { id, file } of templateFiles) {
        try {
          // Charger le fichier JSON
          const templateData = await import(`../../../templates/config/${file}`);
          const template = NotificationTemplate.fromJSON(templateData.default || templateData);
          
          this.templateRegistry.set(id, template);
        } catch (error) {
          this.logger.error(`Failed to load template '${id}' from ${file}`, {
            error: (error as Error).message
          });
        }
      }
      
      // Alias pour compatibilité avec les anciennes références
      const quoteConfirmationEmail = this.templateRegistry.get('quote-confirmation-email');
      const bookingConfirmationEmail = this.templateRegistry.get('booking-confirmation-email');
      const paymentConfirmationEmail = this.templateRegistry.get('payment-confirmation-email');
      const appointmentReminderSms = this.templateRegistry.get('appointment-reminder-sms');
      const serviceReminderEmail = this.templateRegistry.get('service-reminder-email');
      
      if (quoteConfirmationEmail) {
        this.templateRegistry.set('quote-confirmation', quoteConfirmationEmail);
      } else {
        this.logger.error('Template quote-confirmation-email non trouvé pour créer l\'alias');
      }
      
      if (bookingConfirmationEmail) {
        this.templateRegistry.set('booking-confirmation', bookingConfirmationEmail);
      } else {
        this.logger.error('Template booking-confirmation-email non trouvé pour créer l\'alias');
      }
      
      if (paymentConfirmationEmail) {
        this.templateRegistry.set('payment-confirmation', paymentConfirmationEmail);
      } else {
        this.logger.error('Template payment-confirmation-email non trouvé pour créer l\'alias');
      }
      
      if (serviceReminderEmail) {
        this.templateRegistry.set('service-reminder', serviceReminderEmail);
      } else {
        this.logger.error('Template service-reminder-email non trouvé pour créer l\'alias');
      }
      
      this.logger.info(`Loaded ${this.templateRegistry.size} templates`);
      
    } catch (error) {
      this.logger.error('Failed to load templates', { error: (error as Error).message });
    }
  }

  /**
   * Appliquer un template à une notification
   */
  async applyTemplate(notification: NotificationMessage): Promise<NotificationMessage> {
    // 1. Recherche du template dans le registry
    let template = this.templateRegistry.get(notification.templateId!);

    if (!template && !notification.templateId!.endsWith('-email')) {
      // Réessayer avec le suffixe -email
      const templateIdWithEmail = `${notification.templateId}-email`;
      template = this.templateRegistry.get(templateIdWithEmail);
    }

    if (!template) {
      throw new Error(`Template '${notification.templateId}' not found`);
    }
    
    try {
      const language = SupportedLanguage.FR;
      
      // 2. Mapping des variables
      let mappedVariables = { ...(notification.variables || {}) };
      
      // Mapping spécifique pour le template quote-confirmation (compatibilité legacy)
      if (notification.templateId === 'quote-confirmation') {
        // Mapper quoteNumber → quoteReference si quoteReference n'existe pas
        if (mappedVariables.quoteNumber && !mappedVariables.quoteReference) {
          mappedVariables.quoteReference = mappedVariables.quoteNumber;
        }
        // Mapper subtotalAmount ou estimatedPrice → totalAmount si totalAmount n'existe pas
        if (!mappedVariables.totalAmount) {
          if (mappedVariables.subtotalAmount !== undefined) {
            mappedVariables.totalAmount = mappedVariables.subtotalAmount;
          } else if (mappedVariables.estimatedPrice !== undefined) {
            mappedVariables.totalAmount = mappedVariables.estimatedPrice;
          }
        }
      }
      
      // 3. Rendu du template
      const rendered = await template.render(language, mappedVariables);
      
      // 4. Retour de la notification avec contenu rendu
      return {
        ...notification,
        content: rendered.body,
        subject: rendered.subject
      };
    } catch (error) {
      this.logger.error(`Failed to render template '${notification.templateId}'`, {
        error: (error as Error).message,
        stack: (error as Error).stack,
        variables: notification.variables
      });
      throw error;
    }
  }

  /**
   * Obtenir un template par ID
   */
  getTemplate(templateId: string): NotificationTemplate | undefined {
    return this.templateRegistry.get(templateId);
  }

  /**
   * Vérifier si un template existe
   */
  hasTemplate(templateId: string): boolean {
    return this.templateRegistry.has(templateId);
  }

  /**
   * Obtenir le nombre de templates chargés
   */
  getTemplateCount(): number {
    return this.templateRegistry.size;
  }
}

