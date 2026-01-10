/**
 * ReminderScheduler - Programmation et envoi des rappels automatiques
 * 
 * Responsabilité unique : Gestion des rappels programmés (7d, 24h, 1h)
 */

import { ProductionQueueManager } from '../../../infrastructure/queue/queue.manager.production';
import { ProductionLogger } from '../../../infrastructure/logging/logger.production';
import { NotificationSender, SendEmailWithFallbackOptions } from '../senders/NotificationSender';
import { ReminderJobData, NotificationResult } from '../notification.service.production';

export interface ReminderHandler {
  sendReminder7d: (data: ReminderJobData) => Promise<NotificationResult[]>;
  sendReminder24h: (data: ReminderJobData) => Promise<NotificationResult[]>;
  sendReminder1h: (data: ReminderJobData) => Promise<NotificationResult[]>;
}

export class ReminderScheduler {
  private logger = new ProductionLogger('ReminderScheduler');

  constructor(
    private queueManager: ProductionQueueManager,
    private notificationSender: NotificationSender,
    private reminderHandler: ReminderHandler
  ) {}

  /**
   * Programmer les rappels automatiques pour une réservation
   */
  async scheduleBookingReminders(bookingData: {
    bookingId: string;
    customerPhone?: string;
    customerName: string;
    serviceName: string;
    serviceDate: string;
    serviceTime: string;
    customerEmail?: string;
    serviceAddress?: string;
  }): Promise<{
    success: boolean;
    scheduledReminders: Array<{ type: string; scheduledFor: Date }>;
    errors: Array<{ type: string; error: string }>;
  }> {
    try {
      // Validation des données requises
      if (!bookingData.serviceDate || !bookingData.serviceTime) {
        throw new Error('Missing required service scheduling data: serviceDate or serviceTime');
      }
      
      const serviceDateTime = new Date(`${bookingData.serviceDate}T${bookingData.serviceTime}`);
      if (isNaN(serviceDateTime.getTime())) {
        throw new Error(`Invalid service date/time format: ${bookingData.serviceDate}T${bookingData.serviceTime}`);
      }
      
      if (serviceDateTime <= new Date()) {
        throw new Error(`Service date/time is in the past: ${serviceDateTime.toISOString()}`);
      }
      
      this.logger.info(`Scheduling reminders for booking ${bookingData.bookingId}`, {
        serviceDateTime: serviceDateTime.toISOString(),
        customerName: bookingData.customerName,
        serviceName: bookingData.serviceName
      });
      
      const reminders = [
        { type: '7d' as const, hours: 168, description: '7 jours avant' },
        { type: '24h' as const, hours: 24, description: '24 heures avant' },
        { type: '1h' as const, hours: 1, description: '1 heure avant' }
      ];
      
      const scheduledReminders: Array<{ type: string; scheduledFor: Date }> = [];
      const errors: Array<{ type: string; error: string }> = [];
      
      for (const reminder of reminders) {
        try {
          const scheduledDate = new Date(serviceDateTime.getTime() - (reminder.hours * 60 * 60 * 1000));
          
          // Ne pas programmer si la date est dans le passé
          if (scheduledDate <= new Date()) {
            const skipReason = `Reminder ${reminder.type} would be in the past (${scheduledDate.toISOString()})`;
            this.logger.warn(`Skipping reminder ${reminder.type} for booking ${bookingData.bookingId} (${skipReason})`, {
              scheduledDate: scheduledDate.toISOString(),
              now: new Date().toISOString()
            });
            continue;
          }
          
          const reminderData: ReminderJobData = {
            bookingId: bookingData.bookingId,
            customerPhone: bookingData.customerPhone,
            customerName: bookingData.customerName,
            serviceName: bookingData.serviceName,
            serviceDate: bookingData.serviceDate,
            serviceTime: bookingData.serviceTime,
            serviceAddress: bookingData.serviceAddress,
            customerEmail: bookingData.customerEmail,
            reminderType: reminder.type,
            scheduledFor: scheduledDate
          };
          
          await this.scheduleReminder(reminderData);
          
          scheduledReminders.push({
            type: reminder.type,
            scheduledFor: scheduledDate
          });
          
          this.logger.info(`Reminder ${reminder.type} scheduled for booking ${bookingData.bookingId}`, {
            scheduledFor: scheduledDate.toISOString()
          });
          
        } catch (error) {
          const errorMsg = `Failed to schedule reminder ${reminder.type}: ${(error as Error).message}`;
          this.logger.error(errorMsg, { bookingId: bookingData.bookingId });
          errors.push({ type: reminder.type, error: (error as Error).message });
        }
      }
      
      this.logger.info(`Reminder scheduling completed for booking ${bookingData.bookingId}`, {
        scheduled: scheduledReminders.length,
        errors: errors.length
      });
      
      return {
        success: errors.length === 0,
        scheduledReminders,
        errors
      };
      
    } catch (error) {
      this.logger.error(`Failed to schedule reminders for booking ${bookingData.bookingId}`, {
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Programmer un rappel unique
   */
  async scheduleReminder(reminderData: ReminderJobData): Promise<void> {
    const delay = Math.max(0, reminderData.scheduledFor.getTime() - Date.now());
    
    await this.queueManager.addJob('reminders', 'send', reminderData, {
      delay,
      priority: reminderData.reminderType === '1h' ? 1 : 5
    });
  }

  /**
   * Envoyer rappel 7 jours avant (SMS ou Email selon disponibilité)
   */
  async sendReminder7d(reminderData: ReminderJobData): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];
    
    // 1. SMS si téléphone disponible
    if (reminderData.customerPhone) {
      const smsMessage = `Express Quote: Rappel - Votre service ${reminderData.serviceName} est prevu dans 7 jours le ${reminderData.serviceDate} a ${reminderData.serviceTime}. Reference: ${reminderData.bookingId}. Contact: 01.23.45.67.89`;
      
      const smsResult = await this.notificationSender.sendSMS({
        to: reminderData.customerPhone,
        message: smsMessage,
        from: 'EXPRESS-QUOTE',
        priority: 'HIGH',
        metadata: {
          bookingId: reminderData.bookingId,
          reminderType: '7d'
        }
      });
      results.push(smsResult);
    }
    
    // 2. Email (si on a l'email du client)
    if (reminderData.customerEmail) {
      const emailOptions: SendEmailWithFallbackOptions = {
        to: reminderData.customerEmail,
        primaryTemplate: 'reminder-7d',
        fallbackTemplate: 'service-reminder',
        data: {
          customerName: reminderData.customerName,
          serviceName: reminderData.serviceName,
          serviceDate: reminderData.serviceDate,
          serviceTime: reminderData.serviceTime,
          bookingId: reminderData.bookingId,
          serviceAddress: reminderData.serviceAddress,
          companyName: 'Express Quote',
          supportPhone: '01 23 45 67 89',
          preparationItems: [
            'Vérifier la disponibilité',
            'Préparer les documents nécessaires'
          ]
        },
        priority: 'HIGH'
      };
      
      const emailResult = await this.notificationSender.sendEmailWithFallback(emailOptions);
      results.push(emailResult);
    }
    
    return results;
  }

  /**
   * Envoyer rappel 24h avant (SMS + Email ou Email seul selon disponibilité)
   */
  async sendReminder24h(reminderData: ReminderJobData): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];
    
    // 1. SMS si téléphone disponible
    if (reminderData.customerPhone) {
      const smsMessage = `Express Quote: IMPORTANT - Rappel: Votre service ${reminderData.serviceName} est prevu DEMAIN le ${reminderData.serviceDate} a ${reminderData.serviceTime}. Reference: ${reminderData.bookingId}. Contact: 01.23.45.67.89`;
      
      const smsResult = await this.notificationSender.sendSMS({
        to: reminderData.customerPhone,
        message: smsMessage,
        from: 'EXPRESS-QUOTE',
        priority: 'HIGH',
        metadata: {
          bookingId: reminderData.bookingId,
          reminderType: '24h'
        }
      });
      results.push(smsResult);
    }
    
    // 2. Email (si on a l'email du client)
    if (reminderData.customerEmail) {
      const emailOptions: SendEmailWithFallbackOptions = {
        to: reminderData.customerEmail,
        primaryTemplate: 'reminder-24h',
        fallbackTemplate: 'service-reminder',
        data: {
          customerName: reminderData.customerName,
          serviceName: reminderData.serviceName,
          serviceDate: reminderData.serviceDate,
          serviceTime: reminderData.serviceTime,
          bookingId: reminderData.bookingId,
          serviceAddress: reminderData.serviceAddress,
          estimatedDuration: 2,
          companyName: 'Express Quote',
          supportPhone: '01 23 45 67 89',
          preparationItems: [
            'Vérifier la disponibilité',
            'Préparer les documents nécessaires'
          ]
        },
        priority: 'HIGH'
      };
      
      const emailResult = await this.notificationSender.sendEmailWithFallback(emailOptions);
      results.push(emailResult);
    }
    
    return results;
  }

  /**
   * Envoyer rappel 1h avant (SMS uniquement - URGENT)
   */
  async sendReminder1h(reminderData: ReminderJobData): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];
    
    // 1. SMS si téléphone disponible (priorité URGENT)
    if (reminderData.customerPhone) {
      const smsMessage = `Express Quote: URGENT - Votre service ${reminderData.serviceName} est prevu dans 1 HEURE le ${reminderData.serviceDate} a ${reminderData.serviceTime}. Reference: ${reminderData.bookingId}. Contact: 01.23.45.67.89`;
      
      const smsResult = await this.notificationSender.sendSMS({
        to: reminderData.customerPhone,
        message: smsMessage,
        from: 'EXPRESS-QUOTE',
        priority: 'URGENT',
        metadata: {
          bookingId: reminderData.bookingId,
          reminderType: '1h'
        }
      });
      results.push(smsResult);
    }
    
    // 2. Email de secours si pas de téléphone
    if (!reminderData.customerPhone && reminderData.customerEmail) {
      const emailOptions: SendEmailWithFallbackOptions = {
        to: reminderData.customerEmail,
        primaryTemplate: 'reminder-1h',
        fallbackTemplate: 'service-reminder',
        data: {
          customerName: reminderData.customerName,
          serviceName: reminderData.serviceName,
          serviceDate: reminderData.serviceDate,
          serviceTime: reminderData.serviceTime,
          bookingId: reminderData.bookingId,
          serviceAddress: reminderData.serviceAddress,
          companyName: 'Express Quote',
          supportPhone: '01 23 45 67 89'
        },
        priority: 'URGENT'
      };
      
      const emailResult = await this.notificationSender.sendEmailWithFallback(emailOptions);
      results.push(emailResult);
    }
    
    return results;
  }
}

