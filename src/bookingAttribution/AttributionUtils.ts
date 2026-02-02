/**
 * 🛠️ Utilitaires partagés pour le système d'attribution
 *
 * Responsabilité :
 * - Éviter la duplication de logique entre AttributionService et AttributionNotificationService
 * - Centraliser les transformations de données communes
 * - Fournir des méthodes réutilisables pour l'attribution
 */

export class AttributionUtils {

  /**
   * Extrait la ville d'une adresse complète
   */
  static extractCityFromAddress(address: string): string {
    const parts = address.split(',');
    return parts[parts.length - 1]?.trim() || 'Ville non spécifiée';
  }

  /**
   * Extrait le quartier d'une adresse complète
   */
  static extractDistrictFromAddress(address: string): string {
    const parts = address.split(',');
    return parts[parts.length - 2]?.trim() || 'Centre-ville';
  }

  /**
   * Détermine la catégorie de service.
   * CLEANING, PACKING, DELIVERY conservés pour compatibilité affichage des données existantes.
   */
  static getServiceCategory(serviceType: string): string {
    const categories: Record<string, string> = {
      'MOVING': 'Déménagement',
      'MOVING_PREMIUM': 'Déménagement premium',
      'CLEANING': 'Nettoyage',
      'DELIVERY': 'Livraison',
      'TRANSPORT': 'Transport',
      'PACKING': 'Emballage',
      'SERVICE': 'Service sur mesure',
      'CUSTOM': 'Service personnalisé'
    };
    return categories[serviceType] || 'Service personnalisé';
  }

  /**
   * Obtient le label du type de service
   */
  static getServiceTypeLabel(serviceType: string): string {
    return this.getServiceCategory(serviceType);
  }

  /**
   * Estime la durée de la mission selon le type et les données
   */
  static estimateDuration(bookingData: any): string {
    const baseHours: Record<string, number> = {
      'MOVING': 4,
      'MOVING_PREMIUM': 5,
      'CLEANING': 3,
      'DELIVERY': 2,
      'TRANSPORT': 2,
      'PACKING': 3,
      'CUSTOM': 3
    };

    const serviceType = bookingData.serviceType || 'CUSTOM';
    let estimatedHours = baseHours[serviceType] || 3;

    // Ajuster selon les données disponibles
    if (bookingData.additionalInfo?.volume) {
      estimatedHours += Math.ceil(bookingData.additionalInfo.volume / 20);
    }

    if (bookingData.totalAmount) {
      // Estimation basée sur le montant
      const amount = bookingData.totalAmount;
      if (amount < 100) return '2-3h';
      if (amount < 300) return '4-6h';
      if (amount < 600) return '1 journée';
      return '1-2 jours';
    }

    return `${estimatedHours}h environ`;
  }

  /**
   * Détermine la priorité en fonction de la date de service
   */
  static determinePriority(serviceDate: Date | string): 'normal' | 'high' | 'urgent' {
    const scheduledDate = typeof serviceDate === 'string' ? new Date(serviceDate) : serviceDate;
    const now = new Date();
    const hoursUntilService = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilService < 24) return 'urgent';
    if (hoursUntilService < 72) return 'high';
    return 'normal';
  }

  /**
   * Génère un token sécurisé pour les liens d'action
   */
  static generateSecureToken(professionalId: string, attributionId: string): string {
    // En production, utiliser un vrai système de tokens JWT ou crypto
    const crypto = require('crypto');
    const secret = process.env.ATTRIBUTION_SECRET || 'default-secret';
    const data = `${professionalId}:${attributionId}:${Date.now()}`;

    return crypto.createHmac('sha256', secret).update(data).digest('hex').substring(0, 16);
  }

  /**
   * Calcule la date limite pour accepter une attribution
   */
  static calculateTimeoutDate(priority: 'normal' | 'high' | 'urgent'): string {
    const timeoutHours = {
      'urgent': 1,
      'high': 2,
      'normal': 4
    };

    const timeoutDate = new Date();
    timeoutDate.setHours(timeoutDate.getHours() + timeoutHours[priority]);

    return timeoutDate.toLocaleString('fr-FR');
  }

  /**
   * Masque une adresse pour la sécurité (garde ville/quartier)
   */
  static sanitizeAddress(address: string): string {
    // Masquer les numéros de rue complets, garder ville/quartier
    return address.replace(/^\d+\s/, '*** ').split(',')[0] + ', [Ville masquée]';
  }

  /**
   * Génère la description d'une mission
   */
  static generateMissionDescription(bookingData: any): string {
    const serviceType = this.getServiceCategory(bookingData.serviceType || 'SERVICE');
    const address = this.extractCityFromAddress(bookingData.locationAddress || '');

    return `Mission de ${serviceType.toLowerCase()} à ${address}. Détails complets disponibles après acceptation.`;
  }

  /**
   * Extrait les exigences d'une mission
   */
  static extractRequirements(bookingData: any): string[] {
    const requirements: string[] = [];

    if (bookingData.volume > 20) requirements.push('Véhicule grand volume');
    if (bookingData.distance > 50) requirements.push('Déplacement longue distance');
    if (bookingData.fragile) requirements.push('Objets fragiles');
    if (bookingData.packaging) requirements.push('Matériel d\'emballage');

    return requirements.length > 0 ? requirements : ['Matériel standard'];
  }

  /**
   * Formate un message WhatsApp pour attribution
   */
  static formatWhatsAppMessage(data: {
    serviceType: string;
    totalAmount: number;
    scheduledDate: Date;
    locationAddress: string;
    distanceKm: number;
    duration: string;
    description: string;
    acceptUrl: string;
    refuseUrl: string;
    baseUrl: string;
  }): string {
    return `🚀 **Nouvelle Mission Disponible**

📍 **${data.serviceType}**
💰 ${data.totalAmount}€
📅 ${data.scheduledDate.toLocaleDateString('fr-FR')}
📍 ${this.extractCityFromAddress(data.locationAddress)} (${data.distanceKm}km)
⏱️ Durée estimée: ${data.duration}

${data.description}

**Actions rapides:**
✅ Accepter: ${data.acceptUrl}
❌ Refuser: ${data.refuseUrl}

📱 Dashboard: ${data.baseUrl}/professional/dashboard`;
  }

  /**
   * Obtient l'emoji correspondant au type de service
   */
  static getServiceEmoji(serviceType: string): string {
    switch (serviceType) {
      case 'MOVING': return '📦';
      case 'CLEANING': return '🧹';
      case 'DELIVERY': return '🚚';
      case 'TRANSPORT': return '🚛';
      case 'PACKING': return '📦';
      default: return '⚡';
    }
  }
}