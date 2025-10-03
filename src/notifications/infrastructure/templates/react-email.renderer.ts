/**
 * 🎨 RENDERER REACT EMAIL - Compilation et rendu des templates
 * 
 * Utilité:
 * - Compilation des composants React Email en HTML
 * - Gestion des variables et props
 * - Optimisation pour clients email
 * - Cache des templates compilés
 */

import { render } from '@react-email/render';
import { 
  QuoteConfirmation, 
  BookingConfirmation, 
  PaymentConfirmation, 
  ServiceReminder,
  Reminder24hEmail,
  Reminder7dEmail,
  Reminder1hEmail,
  type QuoteConfirmationData,
  type BookingConfirmationData,
  type PaymentConfirmationData,
  type ServiceReminderData,
  type Reminder24hData,
  type Reminder7dData,
  type Reminder1hData
} from '../../templates/react-email';

export interface ReactEmailTemplate {
  id: string;
  component: React.ComponentType<any>;
  dataType: any;
}

export class ReactEmailRenderer {
  private static instance: ReactEmailRenderer;
  private templateCache = new Map<string, string>();
  private compilationCache = new Map<string, any>();

  private constructor() {}

  static getInstance(): ReactEmailRenderer {
    if (!ReactEmailRenderer.instance) {
      ReactEmailRenderer.instance = new ReactEmailRenderer();
    }
    return ReactEmailRenderer.instance;
  }

  /**
   * 📧 Templates React Email disponibles
   */
  private readonly templates: Record<string, ReactEmailTemplate> = {
    'quote-confirmation': {
      id: 'quote-confirmation',
      component: QuoteConfirmation,
      dataType: {} as QuoteConfirmationData
    },
    'booking-confirmation': {
      id: 'booking-confirmation', 
      component: BookingConfirmation,
      dataType: {} as BookingConfirmationData
    },
    'payment-confirmation': {
      id: 'payment-confirmation',
      component: PaymentConfirmation, 
      dataType: {} as PaymentConfirmationData
    },
    'service-reminder': {
      id: 'service-reminder',
      component: ServiceReminder,
      dataType: {} as ServiceReminderData
    },
    'reminder-24h': {
      id: 'reminder-24h',
      component: Reminder24hEmail,
      dataType: {} as Reminder24hData
    },
    'reminder-7d': {
      id: 'reminder-7d',
      component: Reminder7dEmail,
      dataType: {} as Reminder7dData
    },
    'reminder-1h': {
      id: 'reminder-1h',
      component: Reminder1hEmail,
      dataType: {} as Reminder1hData
    }
  };

  /**
   * 🎨 Rendre un template React Email
   */
  async renderTemplate(
    templateId: string, 
    data: any
  ): Promise<{ html: string; text: string; subject: string }> {
    const template = this.templates[templateId];
    
    if (!template) {
      throw new Error(`Template React Email '${templateId}' not found`);
    }

    // Vérifier le cache
    const cacheKey = `${templateId}-${JSON.stringify(data)}`;
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey)!;
    }

    try {
      // Rendu HTML
      const html = await render(template.component(data), {
        pretty: true,
        plainText: false
      });

      // Rendu texte
      const text = await render(template.component(data), {
        pretty: false,
        plainText: true
      });

      // Extraction du sujet depuis les props
      const subject = this.extractSubject(templateId, data);

      const result = { html, text, subject };

      // Mise en cache
      this.templateCache.set(cacheKey, result);

      return result;

    } catch (error) {
      throw new Error(`Erreur de rendu React Email '${templateId}': ${error}`);
    }
  }

  /**
   * 📝 Extraire le sujet du template
   */
  private extractSubject(templateId: string, data: any): string {
    const subjectMap: Record<string, (data: any) => string> = {
      'quote-confirmation': (data) => `Devis Express Quote - ${data.quoteNumber}`,
      'booking-confirmation': (data) => `Confirmation de réservation - ${data.bookingId}`,
      'payment-confirmation': (data) => `Confirmation de paiement - ${data.paymentId}`,
      'service-reminder': (data) => `Rappel de service - ${data.serviceDate}`,
      'reminder-24h': (data) => `🚨 Rappel important - Service demain à ${data.serviceTime}`,
      'reminder-7d': (data) => `📅 Rappel préventif - Service dans 7 jours`,
      'reminder-1h': (data) => `🚨 URGENT - Service dans 1 heure !`
    };

    return subjectMap[templateId]?.(data) || 'Notification Express Quote';
  }

  /**
   * 🧹 Nettoyer le cache
   */
  clearCache(): void {
    this.templateCache.clear();
    this.compilationCache.clear();
  }

  /**
   * 📊 Statistiques du cache
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.templateCache.size,
      keys: Array.from(this.templateCache.keys())
    };
  }

  /**
   * ✅ Vérifier si un template existe
   */
  hasTemplate(templateId: string): boolean {
    return templateId in this.templates;
  }

  /**
   * 📋 Lister tous les templates disponibles
   */
  getAvailableTemplates(): string[] {
    return Object.keys(this.templates);
  }
}
