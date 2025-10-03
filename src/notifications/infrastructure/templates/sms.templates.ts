/**
 * 📱 TEMPLATES SMS OPTIMISES - Express Quote
 * 
 * Templates SMS spécifiquement optimisés pour Free Mobile :
 * - 160 caractères maximum
 * - Pas d'emojis ni d'accents
 * - Contenu professionnel et clair
 * - Support variables dynamiques
 */

export interface SMSTemplateData {
  customerName: string;
  bookingId: string;
  serviceDate?: string;
  serviceTime?: string;
  totalAmount?: number;
  serviceType?: string;
  contactPhone?: string;
  confirmationUrl?: string;
}

export class ExpressQuoteSMSTemplates {
  private readonly contactPhone = '01.23.45.67.89';
  private readonly maxLength = 160;
  private readonly senderName = 'EXPRESS-QUOTE';
  private readonly unsubscribeInfo = 'STOP au 36180';

  /**
   * Confirme une réservation de déménagement
   */
  movingConfirmation(data: SMSTemplateData): string {
    const message = `Express Quote: Reservation ${data.bookingId} confirmee. ${data.customerName}, demenagement le ${data.serviceDate} a ${data.serviceTime}. Total: ${data.totalAmount}EUR. Contact: ${this.contactPhone}`;
    return this.sanitizeAndTrim(message);
  }

  /**
   * Confirme une réservation de ménage
   */
  cleaningConfirmation(data: SMSTemplateData): string {
    const message = `Express Quote: Reservation ${data.bookingId} confirmee. ${data.customerName}, menage le ${data.serviceDate} a ${data.serviceTime}. Total: ${data.totalAmount}EUR. Contact: ${this.contactPhone}`;
    return this.sanitizeAndTrim(message);
  }

  /**
   * Notification générique de confirmation
   */
  genericConfirmation(data: SMSTemplateData): string {
    const serviceText = data.serviceType || 'service';
    const message = `Express Quote: Reservation ${data.bookingId} confirmee. ${data.customerName}, ${serviceText} le ${data.serviceDate} a ${data.serviceTime}. Total: ${data.totalAmount}EUR. Contact: ${this.contactPhone}`;
    return this.sanitizeAndTrim(message);
  }

  /**
   * Rappel de rendez-vous (24h avant)
   */
  appointmentReminder(data: SMSTemplateData): string {
    const message = `Express Quote: Rappel rendez-vous ${data.bookingId} demain ${data.serviceDate} a ${data.serviceTime}. ${data.customerName}, notre equipe sera presente. Contact: ${this.contactPhone}`;
    return this.sanitizeAndTrim(message);
  }

  /**
   * Équipe en route
   */
  teamOnWay(data: SMSTemplateData): string {
    const message = `Express Quote: Notre equipe est en route pour votre ${data.serviceType || 'service'} ${data.bookingId}. Arrivee prevue: ${data.serviceTime}. ${data.customerName}. Contact: ${this.contactPhone}`;
    return this.sanitizeAndTrim(message);
  }

  /**
   * Service terminé
   */
  serviceCompleted(data: SMSTemplateData): string {
    const message = `Express Quote: Service ${data.bookingId} termine avec succes. ${data.customerName}, merci pour votre confiance. Laissez un avis sur notre site. Contact: ${this.contactPhone}`;
    return this.sanitizeAndTrim(message);
  }

  /**
   * Annulation de service
   */
  serviceCancelled(data: SMSTemplateData): string {
    const message = `Express Quote: Votre reservation ${data.bookingId} a ete annulee. ${data.customerName}, remboursement en cours si applicable. Contact: ${this.contactPhone}`;
    return this.sanitizeAndTrim(message);
  }

  /**
   * Report de service
   */
  serviceRescheduled(data: SMSTemplateData): string {
    const message = `Express Quote: Reservation ${data.bookingId} reportee. ${data.customerName}, nouveau creneau: ${data.serviceDate} a ${data.serviceTime}. Contact: ${this.contactPhone}`;
    return this.sanitizeAndTrim(message);
  }

  /**
   * Devis accepté
   */
  quoteAccepted(data: SMSTemplateData): string {
    const message = `Express Quote: Devis accepte! ${data.customerName}, reservation ${data.bookingId} creee pour le ${data.serviceDate}. Total: ${data.totalAmount}EUR. Contact: ${this.contactPhone}`;
    return this.sanitizeAndTrim(message);
  }

  /**
   * Message de bienvenue
   */
  welcome(data: SMSTemplateData): string {
    const message = `Bienvenue chez Express Quote ${data.customerName}! Votre demande de devis est en cours de traitement. Vous recevrez une reponse rapide. Contact: ${this.contactPhone}`;
    return this.sanitizeAndTrim(message);
  }

  /**
   * Message promotionnel (avec STOP obligatoire)
   */
  promotional(data: SMSTemplateData & { offer: string }): string {
    const message = `Express Quote: ${data.offer} ${data.customerName}! Profitez de nos services premium. Contact: ${this.contactPhone}`;
    return this.sanitizeAndTrim(message, true); // isMarketing = true
  }

  /**
   * Code de validation (pour authentification)
   */
  verificationCode(data: SMSTemplateData & { code: string }): string {
    const message = `Express Quote: Votre code de validation est ${data.code}. ${data.customerName}, ce code expire dans 10 minutes. Ne le partagez pas.`;
    return this.sanitizeAndTrim(message);
  }

  /**
   * Facture disponible
   */
  invoiceReady(data: SMSTemplateData): string {
    const message = `Express Quote: Facture ${data.bookingId} disponible. ${data.customerName}, consultez votre espace client ou contactez-nous: ${this.contactPhone}`;
    return this.sanitizeAndTrim(message);
  }

  /**
   * Ajoute l'option de désabonnement si nécessaire et si la place le permet
   */
  private addUnsubscribeIfNeeded(message: string, isMarketing: boolean = false): string {
    if (!isMarketing) {
      return message; // Messages transactionnels n'ont pas besoin de STOP
    }
    
    const withUnsubscribe = `${message} ${this.unsubscribeInfo}`;
    if (withUnsubscribe.length <= this.maxLength) {
      return withUnsubscribe;
    }
    
    // Si pas assez de place, garder le message sans STOP
    return message;
  }

  /**
   * Sanitise et tronque le message pour Free Mobile
   */
  private sanitizeAndTrim(message: string, isMarketing: boolean = false): string {
    // Supprimer les entités HTML
    let cleaned = message
      .replace(/&#x2F;/g, '/')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'");

    // Supprimer les emojis
    cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');

    // SOLUTION HYBRIDE: Free Mobile supporte PARTIELLEMENT les accents UTF-8
    // ✅ Compatible: é, è, à, ù (accents simples)
    // ❌ Incompatible: ç, ê, ô, î, ë, etc. (accents composés)
    // Convertir seulement les problématiques pour garder une bonne lisibilité
    cleaned = cleaned
      .replace(/[ç]/g, 'c')        // ç → c (problématique)
      .replace(/[ê]/g, 'e')        // ê → e (problématique)  
      .replace(/[ô]/g, 'o')        // ô → o (problématique)
      .replace(/[î]/g, 'i')        // î → i (problématique)
      .replace(/[ë]/g, 'e')        // ë → e (problématique)
      .replace(/[â]/g, 'a')        // â → a (problématique)
      .replace(/[û]/g, 'u')        // û → u (problématique)
      .replace(/[ä]/g, 'a')        // ä → a (problématique)
      .replace(/[ü]/g, 'u')        // ü → u (problématique)
      .replace(/[ö]/g, 'o')        // ö → o (problématique)
      .replace(/[Ç]/g, 'C')        // Ç → C (problématique)
      .replace(/[Ê]/g, 'E')        // Ê → E (problématique)
      .replace(/[Ô]/g, 'O')        // Ô → O (problématique)
      .replace(/[Î]/g, 'I')        // Î → I (problématique)
      .replace(/[Ë]/g, 'E')        // Ë → E (problématique)
      .replace(/[Â]/g, 'A')        // Â → A (problématique)
      .replace(/[Û]/g, 'U')        // Û → U (problématique)
      // GARDER: é, è, à, ù qui s'affichent parfaitement

    // Nettoyer les caractères spéciaux problématiques
    cleaned = cleaned.replace(/[""'']/g, '"').replace(/[–—]/g, '-');

    // Ajouter STOP si c'est du marketing
    cleaned = this.addUnsubscribeIfNeeded(cleaned, isMarketing);

    // Limiter à 160 caractères
    if (cleaned.length > this.maxLength) {
      cleaned = cleaned.substring(0, this.maxLength - 3) + '...';
    }

    return cleaned;
  }

  /**
   * Obtient la liste des templates disponibles
   */
  getAvailableTemplates(): string[] {
    return [
      'movingConfirmation',
      'cleaningConfirmation', 
      'genericConfirmation',
      'appointmentReminder',
      'teamOnWay',
      'serviceCompleted',
      'serviceCancelled',
      'serviceRescheduled',
      'quoteAccepted',
      'welcome',
      'verificationCode',
      'invoiceReady'
    ];
  }

  /**
   * Valide les données du template
   */
  validateTemplateData(data: SMSTemplateData): string[] {
    const errors: string[] = [];
    
    if (!data.customerName || data.customerName.trim().length === 0) {
      errors.push('customerName is required');
    }
    
    if (!data.bookingId || data.bookingId.trim().length === 0) {
      errors.push('bookingId is required');
    }
    
    if (data.customerName && data.customerName.length > 50) {
      errors.push('customerName too long (max 50 chars)');
    }
    
    if (data.bookingId && data.bookingId.length > 20) {
      errors.push('bookingId too long (max 20 chars)');
    }
    
    return errors;
  }

  /**
   * Statistiques des templates
   */
  getTemplateStats(templateName: string, data: SMSTemplateData): {
    name: string;
    length: number;
    isValid: boolean;
    errors: string[];
  } {
    const errors = this.validateTemplateData(data);
    let message = '';
    
    try {
      switch (templateName) {
        case 'movingConfirmation':
          message = this.movingConfirmation(data);
          break;
        case 'cleaningConfirmation':
          message = this.cleaningConfirmation(data);
          break;
        case 'genericConfirmation':
          message = this.genericConfirmation(data);
          break;
        case 'appointmentReminder':
          message = this.appointmentReminder(data);
          break;
        case 'teamOnWay':
          message = this.teamOnWay(data);
          break;
        case 'serviceCompleted':
          message = this.serviceCompleted(data);
          break;
        case 'serviceCancelled':
          message = this.serviceCancelled(data);
          break;
        case 'serviceRescheduled':
          message = this.serviceRescheduled(data);
          break;
        case 'quoteAccepted':
          message = this.quoteAccepted(data);
          break;
        case 'welcome':
          message = this.welcome(data);
          break;
        case 'invoiceReady':
          message = this.invoiceReady(data);
          break;
        default:
          errors.push('Unknown template name');
      }
    } catch (error) {
      errors.push(`Template generation failed: ${error}`);
    }
    
    return {
      name: templateName,
      length: message.length,
      isValid: errors.length === 0 && message.length <= this.maxLength,
      errors
    };
  }
}