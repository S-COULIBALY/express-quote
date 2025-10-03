/**
 * Types pour l'attribution aux prestataires externes
 * Séparation claire entre données confidentielles et données partagées
 */

// ❌ Données CONFIDENTIELLES - NE PAS envoyer aux prestataires externes
export interface RestrictedClientData {
  email: string;              // Confidentiel
  customerPhone?: string;     // Confidentiel
  fullAddress: string;        // Adresse complète avec numéro
  paymentInfo: any;           // Informations bancaires
  quoteDetails: {             // Tarification détaillée
    basePrice: number;
    options: any[];
    discounts: any[];
    finalPrice: number;
    commissions: number;
  };
}

// ✅ Données PARTAGÉES - OK pour les prestataires externes
export interface LimitedClientData {
  customerName: string;       // "M. Dupont" uniquement
  pickupAddress: string;      // Ville uniquement: "Paris 15ème"
  deliveryAddress?: string;   // Ville uniquement: "Neuilly-sur-Seine"
  serviceType: string;        // Type de service
  quoteDetails: {            // Infos très limitées
    estimatedAmount: number;  // Montant estimé (sans détails)
    currency: string;
    serviceCategory: string;  // "Déménagement", "Nettoyage", etc.
  };
}

// 📄 Types pour les PDF destinés aux prestataires
export interface ProfessionalPDFData {
  // Identification mission
  attributionId: string;
  bookingReference: string;
  serviceDate: string;
  serviceTime: string;

  // Client (données limitées)
  clientData: LimitedClientData;

  // Mission
  serviceType: string;
  estimatedDuration: string;
  priority: 'normal' | 'high' | 'urgent';

  // Prestataire
  professionalCompany: string;
  professionalEmail: string;
  distanceKm: number;

  // Actions
  acceptUrl: string;
  refuseUrl: string;
  timeoutDate: string;

  // Documents
  documentType: 'MISSION_PROPOSAL' | 'SERVICE_REMINDER';
}

// 🔔 Interface pour les rappels programmés
export interface ScheduledServiceReminder {
  id: string;
  bookingId: string;
  professionalId: string;
  attributionId: string;

  // Planification
  scheduledDate: Date;        // 4h du matin le jour J
  serviceDate: Date;          // Date du service

  // Données complètes (révélées le jour J)
  fullClientData: {
    customerName: string;
    customerPhone: string;
    fullPickupAddress: string;
    fullDeliveryAddress?: string;
    specialInstructions?: string;
  };

  // Statut
  status: 'SCHEDULED' | 'SENT' | 'CANCELLED';
  cancelReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

// 🎯 Interface pour l'attribution avec nouveau flux
export interface EnhancedAttributionRequest {
  bookingId: string;
  serviceType: string;
  serviceLatitude: number;
  serviceLongitude: number;
  maxDistanceKm?: number;

  // Données client (complètes en interne)
  fullClientData: {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    fullPickupAddress: string;
    fullDeliveryAddress?: string;
  };

  // Données pour prestataires (limitées)
  limitedClientData: LimitedClientData;

  // Mission
  bookingData: {
    totalAmount: number;
    scheduledDate: Date;
    priority: 'normal' | 'high' | 'urgent';
    additionalInfo?: any;
  };
}

// 📧 Nouvelle interface pour l'API payment-confirmation des prestataires
export interface ProfessionalPaymentNotificationData {
  // Standard payment-confirmation fields
  email: string;
  customerName: string;        // Nom limité: "M. Dupont"
  bookingId: string;
  amount: number;             // Montant estimé uniquement
  currency: string;
  paymentMethod: string;      // "Attribution Express Quote"
  transactionId: string;      // attributionId
  paymentDate: string;

  // Attribution spécifique
  bookingReference: string;
  serviceType: string;
  serviceName: string;
  serviceDate: string;
  serviceTime: string;

  // Actions prestataire
  viewBookingUrl: string;     // URL d'acceptation
  supportUrl: string;

  // PDF restreint pour prestataires
  attachments: Array<{
    filename: string;
    path: string;
    size: number;
    mimeType: string;
  }>;

  // Context
  trigger: 'PROFESSIONAL_ATTRIBUTION';

  // Données limitées pour template
  limitedData: LimitedClientData;
}

export default {
  RestrictedClientData,
  LimitedClientData,
  ProfessionalPDFData,
  ScheduledServiceReminder,
  EnhancedAttributionRequest,
  ProfessionalPaymentNotificationData
};