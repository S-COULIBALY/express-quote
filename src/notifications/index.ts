/**
 * Point d'entrée principal du système de notifications
 * Exporte le NotificationSystem pour les imports dynamiques
 */

import { NotificationController } from './interfaces/http/NotificationController';
import { setupSimpleNotifications } from './interfaces';

/**
 * Système de notifications principal
 */
class NotificationSystem {
  private static instance: NotificationSystem | null = null;
  private controller: NotificationController | null = null;

  /**
   * Initialise le système de notifications
   */
  static async initialize(): Promise<NotificationSystem> {
    if (!NotificationSystem.instance) {
      NotificationSystem.instance = new NotificationSystem();
      const { controller } = await setupSimpleNotifications({
        cron: {
          enabled: process.env.NODE_ENV === 'production',
          autoStart: false
        }
      });
      NotificationSystem.instance.controller = controller;
    }
    return NotificationSystem.instance;
  }

  /**
   * Envoie un email
   */
  async sendEmail(options: {
    to: string;
    subject: string;
    template: string;
    data: any;
    attachments?: any[];
  }) {
    if (!this.controller) {
      throw new Error('NotificationSystem not initialized');
    }

    // Simuler l'envoi d'email pour l'instant
    console.log('📧 Sending email:', {
      to: options.to,
      subject: options.subject,
      template: options.template
    });

    return {
      messageId: `msg_${Date.now()}`,
      success: true
    };
  }
}

export default NotificationSystem;
