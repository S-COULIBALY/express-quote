/**
 * NotificationValidator - Validation et sanitization des notifications
 * 
 * Responsabilité unique : Validation et nettoyage du contenu des notifications
 */

import { ContentSanitizer } from '../../../infrastructure/security/content.sanitizer';
import { ProductionLogger } from '../../../infrastructure/logging/logger.production';
import { NotificationMessage } from '../notification.service.production';

export class NotificationValidator {
  private logger = new ProductionLogger('NotificationValidator');

  constructor(private sanitizer: ContentSanitizer) {}

  /**
   * Valide et nettoie une notification
   */
  async validateAndSanitizeNotification(notification: NotificationMessage): Promise<void> {
    // Validation de base
    if (!notification.id) {
      throw new Error('Notification ID is required');
    }
    
    if (!notification.recipient?.trim()) {
      throw new Error('Valid recipient is required');
    }
    
    if (!notification.content?.trim()) {
      throw new Error('Non-empty content is required');
    }
    
    // Validation du type de notification
    const allowedTypes = ['email', 'sms', 'whatsapp'];
    if (!allowedTypes.includes(notification.type)) {
      throw new Error(`Invalid notification type: ${notification.type}. Allowed: ${allowedTypes.join(', ')}`);
    }
    
    // Validation des priorités
    const allowedPriorities = ['low', 'normal', 'high', 'critical'];
    if (notification.priority && !allowedPriorities.includes(notification.priority)) {
      throw new Error(`Invalid priority: ${notification.priority}. Allowed: ${allowedPriorities.join(', ')}`);
    }
    
    // Validation de la date programmée
    if (notification.scheduledAt) {
      const scheduledTime = notification.scheduledAt.getTime();
      const now = Date.now();
      const maxFutureTime = now + (365 * 24 * 60 * 60 * 1000); // 1 an maximum
      
      if (scheduledTime <= now) {
        throw new Error('Scheduled time cannot be in the past');
      }
      
      if (scheduledTime > maxFutureTime) {
        throw new Error('Scheduled time cannot be more than 1 year in the future');
      }
    }
    
    // Validation spécifique par type
    switch (notification.type) {
      case 'email':
        // Validation email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(notification.recipient)) {
          throw new Error('Invalid email format');
        }
        
        // Validation sujet email
        if (notification.subject && notification.subject.length > 200) {
          throw new Error('Email subject cannot exceed 200 characters');
        }
        
        // Validation contenu email
        if (notification.content.length > 100000) {
          throw new Error('Email content cannot exceed 100,000 characters');
        }
        
        break;
        
      case 'sms':
        // Validation numéro de téléphone (format international)
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(notification.recipient.replace(/[\s\-\(\)]/g, ''))) {
          throw new Error('Invalid phone number format');
        }
        
        // Validation longueur SMS (160 caractères max pour compatibilité)
        if (notification.content.length > 160) {
          this.logger.warn(`SMS content exceeds 160 characters (${notification.content.length}), may be split`, {
            notificationId: notification.id
          });
        }
        
        break;
        
      case 'whatsapp':
        // Validation numéro WhatsApp (format international)
        const whatsappPhoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!whatsappPhoneRegex.test(notification.recipient.replace(/[\s\-\(\)]/g, ''))) {
          throw new Error('Invalid WhatsApp phone number format');
        }
        
        // Validation contenu WhatsApp
        if (notification.content.length > 4096) {
          throw new Error('WhatsApp content cannot exceed 4096 characters');
        }
        
        break;
    }
    
    // Nettoyage du contenu selon le type
    try {
      switch (notification.type) {
        case 'email':
          if (notification.subject) {
            notification.subject = await this.sanitizer.sanitizeSubject(notification.subject);
          }
          notification.content = await this.sanitizer.sanitizeHtml(notification.content);
          notification.recipient = await this.sanitizer.sanitizeEmail(notification.recipient);
          break;
          
        case 'sms':
          notification.content = await this.sanitizer.sanitizeText(notification.content);
          notification.recipient = await this.sanitizer.sanitizePhoneNumber(notification.recipient);
          break;
          
        case 'whatsapp':
          notification.content = await this.sanitizer.sanitizeText(notification.content);
          notification.recipient = await this.sanitizer.sanitizePhoneNumber(notification.recipient);
          break;
      }
    } catch (sanitizeError) {
      throw new Error(`Content sanitization failed: ${(sanitizeError as Error).message}`);
    }
    
    // Validation de sécurité finale
    try {
      const isValid = await this.sanitizer.validateForInjection(notification.content);
      if (!isValid) {
        throw new Error('Content contains potentially malicious patterns');
      }
    } catch (securityError) {
      throw new Error(`Security validation failed: ${(securityError as Error).message}`);
    }
  }
}

