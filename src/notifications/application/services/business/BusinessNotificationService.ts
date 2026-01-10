/**
 * BusinessNotificationService - Méthodes métier Express Quote
 * 
 * Responsabilité unique : Notifications métier spécifiques (quote, booking, payment, etc.)
 */

import { ProductionLogger } from '../../../infrastructure/logging/logger.production';
import { NotificationSender } from '../senders/NotificationSender';
import { ExpressQuoteSMSTemplates } from '../../../infrastructure/templates/sms.templates';
import { NotificationResult } from '../notification.service.production';

export class BusinessNotificationService {
  private logger = new ProductionLogger('BusinessNotificationService');
  private smsTemplates = new ExpressQuoteSMSTemplates();

  constructor(private notificationSender: NotificationSender) {}

  /**
   * Envoie une notification de confirmation de devis
   */
  async sendQuoteConfirmation(email: string, data: {
    customerName: string;
    quoteNumber: string;
    serviceType: string;
    serviceName: string;
    totalAmount: number;
    viewQuoteUrl: string;
  }): Promise<NotificationResult> {
    return await this.notificationSender.sendEmail({
      to: email,
      template: 'quote-confirmation',
      data: {
        customerName: data.customerName,
        customerPhone: undefined,
        quoteReference: data.quoteNumber,
        serviceType: data.serviceType,
        serviceName: data.serviceName,
        totalAmount: data.totalAmount,
        viewQuoteUrl: data.viewQuoteUrl,
        companyName: 'Express Quote',
        supportPhone: '01 23 45 67 89'
      },
      priority: 'HIGH'
    });
  }

  /**
   * Envoie une notification de confirmation de réservation
   */
  async sendBookingConfirmation(email: string, data: {
    customerName: string;
    customerPhone?: string;
    bookingId: string;
    serviceDate: string;
    serviceTime: string;
    serviceAddress: string;
    totalAmount: number;
  }): Promise<NotificationResult> {
    return await this.notificationSender.sendEmail({
      to: email,
      template: 'booking-confirmation',
      data: {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        bookingReference: data.bookingId,
        serviceType: 'CUSTOM',
        serviceName: 'Service Express Quote',
        serviceDate: data.serviceDate,
        serviceTime: data.serviceTime,
        estimatedDuration: 2,
        hoursUntilService: 24,
        primaryAddress: data.serviceAddress,
        secondaryAddress: undefined,
        teamLeaderName: 'Équipe Express Quote',
        teamLeaderPhone: '01 23 45 67 89',
        teamSize: 2,
        vehicleInfo: undefined,
        weatherForecast: undefined,
        finalChecklist: [
          'Préparer l\'accès au domicile',
          'Vérifier la disponibilité',
          'Préparer les documents nécessaires'
        ],
        lastMinuteInstructions: [],
        teamLeaderContact: '01 23 45 67 89',
        emergencyContact: '01 23 45 67 89',
        modifyUrl: undefined,
        cancelUrl: undefined,
        trackingUrl: undefined,
        companyName: 'Express Quote',
        allowsModification: true,
        allowsCancellation: true,
        cancellationDeadlineHours: 12,
        totalAmount: data.totalAmount
      },
      priority: 'HIGH'
    });
  }

  /**
   * Envoie un rappel de service
   */
  async sendServiceReminder(email: string, data: {
    bookingId: string;
    reminderDetails: {
      serviceName: string;
      appointmentDate: string;
      appointmentTime: string;
      address: string;
      preparationInstructions?: string[];
    };
  }): Promise<NotificationResult> {
    // Convertir appointmentDate du format français (dd/mm/yyyy) vers format ISO (yyyy-mm-dd)
    let isoDate = data.reminderDetails.appointmentDate;
    if (data.reminderDetails.appointmentDate.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      const [day, month, year] = data.reminderDetails.appointmentDate.split('/');
      isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Calculer les heures jusqu'au service
    const serviceDateTime = new Date(`${isoDate}T${data.reminderDetails.appointmentTime}`);
    const now = new Date();
    const hoursUntilService = Math.max(1, Math.round((serviceDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)));

    return await this.notificationSender.sendEmail({
      to: email,
      template: 'service-reminder',
      data: {
        customerName: 'Client Express Quote',
        bookingReference: data.bookingId,
        serviceType: 'CUSTOM',
        serviceName: data.reminderDetails.serviceName,
        serviceDate: isoDate,
        serviceTime: data.reminderDetails.appointmentTime,
        estimatedDuration: 2,
        hoursUntilService: hoursUntilService,
        primaryAddress: data.reminderDetails.address,
        secondaryAddress: undefined,
        teamLeaderName: 'Équipe Express Quote',
        teamLeaderPhone: '01 23 45 67 89',
        teamSize: 2,
        vehicleInfo: undefined,
        weatherForecast: undefined,
        finalChecklist: data.reminderDetails.preparationInstructions || [],
        lastMinuteInstructions: [],
        teamLeaderContact: '01 23 45 67 89',
        emergencyContact: '01 23 45 67 89',
        modifyUrl: undefined,
        cancelUrl: undefined,
        trackingUrl: undefined,
        companyName: 'Express Quote',
        allowsModification: true,
        allowsCancellation: true,
        cancellationDeadlineHours: 12
      },
      priority: 'HIGH'
    });
  }

  /**
   * Envoie une notification de confirmation de paiement
   */
  async sendPaymentConfirmation(email: string, data: {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    transactionId: string;
    paymentDate: string;
    bookingId: string;
    bookingReference: string;
    serviceType: string;
    serviceName: string;
    serviceDate: string;
    serviceTime?: string;
    viewBookingUrl: string;
    downloadInvoiceUrl?: string;
    supportUrl?: string;
    attachments?: Array<{
      filename: string;
      content: string;
      contentType: string;
      size: number;
    }>;
    trigger?: string;
    limitedData?: any;
    acceptUrl?: string;
    refuseUrl?: string;
    timeoutDate?: string;
  }): Promise<NotificationResult> {
    return await this.notificationSender.sendEmail({
      to: email,
      template: 'payment-confirmation',
      attachments: data.attachments,
      data: {
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        amount: data.amount,
        currency: data.currency,
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
        paymentDate: data.paymentDate,
        bookingId: data.bookingId,
        bookingReference: data.bookingReference,
        serviceType: data.serviceType,
        serviceName: data.serviceName,
        serviceDate: data.serviceDate,
        serviceTime: data.serviceTime,
        viewBookingUrl: data.viewBookingUrl,
        downloadInvoiceUrl: data.downloadInvoiceUrl,
        supportUrl: data.supportUrl,
        attachments: data.attachments,
        trigger: data.trigger || 'PAYMENT_COMPLETED',
        companyName: 'Express Quote',
        paymentReference: data.transactionId,
        paymentAmount: data.amount,
        isProfessionalAttribution: data.trigger === 'PROFESSIONAL_ATTRIBUTION',
        limitedData: data.limitedData,
        acceptUrl: data.acceptUrl,
        refuseUrl: data.refuseUrl,
        timeoutDate: data.timeoutDate
      },
      priority: 'HIGH'
    });
  }

  /**
   * Envoie un SMS de confirmation de réservation (optimisé Free Mobile)
   */
  async sendBookingConfirmationSMS(phoneNumber: string, data: {
    customerName: string;
    bookingId: string;
    serviceDate: string;
    serviceTime: string;
    totalAmount: number;
    serviceType?: string;
  }): Promise<NotificationResult> {
    const message = this.smsTemplates.genericConfirmation({
      customerName: data.customerName,
      bookingId: data.bookingId,
      serviceDate: data.serviceDate,
      serviceTime: data.serviceTime,
      totalAmount: data.totalAmount,
      serviceType: data.serviceType
    });

    return await this.notificationSender.sendSMS({
      to: phoneNumber,
      message: message,
      from: 'EXPRESS-QUOTE',
      priority: 'HIGH',
      metadata: {
        bookingId: data.bookingId,
        source: 'booking-confirmation-sms',
        serviceType: data.serviceType
      }
    });
  }
}

