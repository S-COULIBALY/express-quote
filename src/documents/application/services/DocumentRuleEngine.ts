/**
 * DocumentRuleEngine - Gestion des règles métier pour la génération de documents
 * 
 * Responsabilité unique : Évaluation et configuration des règles de génération
 */

import { DocumentTrigger, DocumentRecipient } from './DocumentOrchestrationService';
import { DocumentType } from '../../domain/entities/Document';
import { Booking, BookingType } from '@/quotation/domain/entities/Booking';
import { QuoteRequest } from '@/quotation/domain/entities/QuoteRequest';

/**
 * Règle de génération automatique de documents
 * Les règles sont évaluées par ordre de priorité (1 = urgent, 3 = normal)
 */
export interface DocumentRule {
  trigger: DocumentTrigger;
  documentType: DocumentType;
  recipients: DocumentRecipient[];
  conditions?: (booking: Booking) => boolean;
  autoGenerate: boolean;
  requiresApproval: boolean;
  priority: number;
}

export class DocumentRuleEngine {
  private defaultRules: DocumentRule[] = [
    // PHASE DE DEVIS INITIAL
    {
      trigger: DocumentTrigger.QUOTE_CREATED,
      documentType: DocumentType.QUOTE,
      recipients: [DocumentRecipient.CUSTOMER],
      autoGenerate: true,
      requiresApproval: false,
      priority: 2
    },

    // PHASE DE PAIEMENT (documents financiers)
    {
      trigger: DocumentTrigger.PAYMENT_COMPLETED,
      documentType: DocumentType.PAYMENT_RECEIPT,
      recipients: [DocumentRecipient.CUSTOMER],
      autoGenerate: true,
      requiresApproval: false,
      priority: 1
    },
    {
      trigger: DocumentTrigger.PAYMENT_COMPLETED,
      documentType: DocumentType.INVOICE,
      recipients: [DocumentRecipient.CUSTOMER, DocumentRecipient.ACCOUNTING],
      autoGenerate: true,
      requiresApproval: false,
      priority: 1
    },

    // PHASE DE CONFIRMATION (devis confirmé)
    {
      trigger: DocumentTrigger.BOOKING_CONFIRMED,
      documentType: DocumentType.QUOTE,
      recipients: [DocumentRecipient.CUSTOMER],
      autoGenerate: true,
      requiresApproval: false,
      priority: 1
    },
    {
      trigger: DocumentTrigger.BOOKING_CONFIRMED,
      documentType: DocumentType.PAYMENT_RECEIPT,
      recipients: [DocumentRecipient.CUSTOMER],
      autoGenerate: true,
      requiresApproval: false,
      priority: 1
    },
    {
      trigger: DocumentTrigger.BOOKING_CONFIRMED,
      documentType: DocumentType.BOOKING_CONFIRMATION,
      recipients: [DocumentRecipient.CUSTOMER],
      autoGenerate: true,
      requiresApproval: false,
      priority: 1
    },
    {
      trigger: DocumentTrigger.BOOKING_CONFIRMED,
      documentType: DocumentType.QUOTE,
      recipients: [DocumentRecipient.PROFESSIONAL],
      autoGenerate: true,
      requiresApproval: false,
      priority: 1
    },
    {
      trigger: DocumentTrigger.BOOKING_CONFIRMED,
      documentType: DocumentType.BOOKING_CONFIRMATION,
      recipients: [DocumentRecipient.PROFESSIONAL],
      autoGenerate: true,
      requiresApproval: false,
      priority: 1
    },
    {
      trigger: DocumentTrigger.BOOKING_CONFIRMED,
      documentType: DocumentType.DELIVERY_NOTE,
      recipients: [DocumentRecipient.PROFESSIONAL],
      autoGenerate: true,
      requiresApproval: false,
      priority: 1
    },
    {
      trigger: DocumentTrigger.BOOKING_CONFIRMED,
      documentType: DocumentType.CONTRACT,
      recipients: [DocumentRecipient.PROFESSIONAL],
      autoGenerate: true,
      requiresApproval: false,
      priority: 1
    },

    // Phase logistique (déménagement uniquement)
    {
      trigger: DocumentTrigger.BOOKING_SCHEDULED,
      documentType: DocumentType.DELIVERY_NOTE,
      recipients: [DocumentRecipient.PROFESSIONAL, DocumentRecipient.CUSTOMER],
      conditions: (booking) => booking.getType() === BookingType.MOVING_QUOTE,
      autoGenerate: true,
      requiresApproval: false,
      priority: 2
    },
    {
      trigger: DocumentTrigger.SERVICE_STARTED,
      documentType: DocumentType.TRANSPORT_MANIFEST,
      recipients: [DocumentRecipient.PROFESSIONAL],
      conditions: (booking) => booking.getType() === BookingType.MOVING_QUOTE,
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
      autoGenerate: false,
      requiresApproval: true,
      priority: 2
    }
  ];

  /**
   * Évalue les règles applicables pour un trigger donné
   */
  getApplicableRules(trigger: DocumentTrigger, entity: Booking | QuoteRequest): DocumentRule[] {
    const applicableRules = this.defaultRules
      .filter(rule => rule.trigger === trigger)
      .filter(rule => {
        if (entity instanceof QuoteRequest) {
          return true;
        }
        return !rule.conditions || rule.conditions(entity as Booking);
      })
      .sort((a, b) => a.priority - b.priority);

    return applicableRules;
  }

  /**
   * Configure des règles personnalisées qui s'ajoutent aux règles par défaut
   */
  configureCustomRules(customRules: DocumentRule[]): void {
    this.defaultRules = [...this.defaultRules, ...customRules];
  }

  /**
   * Retourne une copie des règles actives pour inspection/debug
   */
  getRules(): DocumentRule[] {
    return [...this.defaultRules];
  }
}

