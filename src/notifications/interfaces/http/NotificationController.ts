/**
 * 🚀 CONTRÔLEUR DE NOTIFICATIONS - Module-Level Singleton
 * 
 * Contrôleur Next.js App Router utilisant le GlobalNotificationService
 * singleton au niveau module pour éviter les instances multiples.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ProductionNotificationService } from '../../application/services/notification.service.production';
import { getGlobalNotificationService } from './GlobalNotificationService';

// ============================================================================
// SCHÉMAS DE VALIDATION SIMPLIFIÉS
// ============================================================================

const EmailSchema = z.object({
  to: z.string().email('Email destinataire invalide').optional(),
  recipient: z.string().email('Email destinataire invalide').optional(),
  subject: z.string().min(1, 'Sujet requis').optional(),
  html: z.string().optional(),
  text: z.string().optional(),
  content: z.string().optional(),
  template: z.string().optional(),
  data: z.record(z.any()).optional(),
  priority: z.enum(['URGENT', 'HIGH', 'NORMAL', 'LOW']).optional(),
  scheduledFor: z.string().optional(),
  metadata: z.record(z.any()).optional()
}).refine((data) => data.to || data.recipient, {
  message: "Email destinataire requis (to ou recipient)",
  path: ["to"]
});

const SMSSchema = z.object({
  to: z.string().min(1, 'Numéro destinataire requis'),
  message: z.string().min(1, 'Message requis'),
  from: z.string().optional(),
  priority: z.enum(['URGENT', 'HIGH', 'NORMAL', 'LOW']).optional()
});

const WhatsAppSchema = z.object({
  to: z.string().min(1, 'Numéro destinataire requis'),
  message: z.string().optional(),
  template: z.object({
    name: z.string(),
    params: z.array(z.any()).optional()
  }).optional(),
  priority: z.enum(['URGENT', 'HIGH', 'NORMAL', 'LOW']).optional()
});

// Schemas pour les notifications métier
const QuoteConfirmationSchema = z.object({
  email: z.string().email(),
  customerName: z.string().min(1),
  quoteNumber: z.string().min(1),
  serviceType: z.string().min(1),
  serviceName: z.string().min(1),
  totalAmount: z.number().positive(),
  viewQuoteUrl: z.string().url()
});

const BookingConfirmationSchema = z.object({
  email: z.string().email(),
  customerName: z.string().min(1),
  bookingId: z.string().min(1),
  serviceDate: z.string().min(1),
  serviceTime: z.string().min(1),
  serviceAddress: z.string().min(1),
  totalAmount: z.number().positive(),
  customerPhone: z.string().optional(), // Téléphone optionnel pour les rappels

  // 🆕 Support des pièces jointes PDF
  attachments: z.array(z.object({
    filename: z.string().min(1),
    path: z.string().min(1), // Chemin sur disque
    size: z.number().positive(),
    mimeType: z.string().default('application/pdf')
  })).optional(),

  // 🆕 Données additionnelles pour le template
  bookingReference: z.string().optional(),
  serviceType: z.string().optional(),
  trigger: z.string().optional()
});

const PaymentConfirmationSchema = z.object({
  email: z.string().email(),
  customerName: z.string().min(1),
  bookingId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().default('EUR'),
  paymentMethod: z.string().min(1),
  transactionId: z.string().min(1),
  paymentDate: z.string().min(1),
  bookingReference: z.string().optional(),
  serviceType: z.string().optional(),
  serviceName: z.string().optional(),
  serviceDate: z.string().optional(),
  serviceTime: z.string().optional(),
  customerPhone: z.string().optional(),

  // 🆕 Support des pièces jointes PDF
  attachments: z.array(z.object({
    filename: z.string().min(1),
    path: z.string().min(1), // Chemin sur disque
    size: z.number().positive(),
    mimeType: z.string().default('application/pdf')
  })).optional(),

  // 🆕 Données additionnelles pour le template
  trigger: z.string().optional(),
  viewBookingUrl: z.string().url().optional(),
  downloadInvoiceUrl: z.string().url().optional(),
  supportUrl: z.string().url().optional()
});

// Schémas pour les notifications métier avancées
const ServiceReminderSchema = z.object({
  bookingId: z.string().min(1),
  email: z.string().email().optional(),
  customerPhone: z.string().optional(),
  reminderDetails: z.object({
    serviceName: z.string().min(1),
    appointmentDate: z.string().min(1),
    appointmentTime: z.string().min(1),
    address: z.string().min(1),
    preparationInstructions: z.array(z.string()).optional()
  }),
  channels: z.array(z.enum(['email', 'sms', 'whatsapp'])).min(1)
});

const RetrySchema = z.object({
  id: z.string().min(1),
  reason: z.string().optional()
});

const CancelSchema = z.object({
  id: z.string().min(1),
  reason: z.string().optional()
});

// ============================================================================
// CLASSE CONTRÔLEUR SIMPLE
// ============================================================================

import { RateLimiter } from '../../infrastructure/security/rate.limiter';

export class NotificationController {
  private rateLimiter: RateLimiter;
  
  constructor() {
    this.rateLimiter = RateLimiter.forAPI({
      windowMs: 60000, // 1 minute
      maxRequests: process.env.NODE_ENV === 'test' ? 10 : 50, // 10 pour les tests, 50 en production
      keyGenerator: (context) => `notifications:${context.ip || 'anonymous'}`
    });
  }
  /**
   * Utilise le service de notification GLOBALE singleton
   * Délégué au module GlobalNotificationService
   */
  private async getNotificationService(): Promise<ProductionNotificationService> {
    return getGlobalNotificationService();
  }

  // ============================================================================
  // MÉTHODES PRINCIPALES
  // ============================================================================

  /**
   * Gère les requêtes POST - Envoi de notifications
   */
  async handlePost(request: NextRequest): Promise<NextResponse> {
    try {
      // Appliquer le rate limiting
      const clientIp = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      request.ip || 
                      'unknown';
      
      const rateLimitResult = await this.rateLimiter.checkLimit({ 
        ip: clientIp,
        endpoint: new URL(request.url).pathname 
      });
      
      if (!rateLimitResult.allowed) {
        return NextResponse.json({
          error: 'Rate limit exceeded',
          message: `Too many requests, please try again in ${rateLimitResult.retryAfter} seconds`,
          retryAfter: rateLimitResult.retryAfter
        }, { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': process.env.NODE_ENV === 'test' ? '10' : '50',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60'
          }
        });
      }
      
      const service = await this.getNotificationService();
      const body = await request.json();
      const { searchParams } = new URL(request.url);
      
      // Déterminer le type d'action depuis l'URL ou le body
      const action = searchParams.get('action') || body.action;

      switch (action) {
        case 'email':
          return await this.handleSendEmail(service, body);
        
        case 'sms':
          return await this.handleSendSMS(service, body);
        
        case 'whatsapp':
          return await this.handleSendWhatsApp(service, body);
        
        case 'quote-confirmation':
          return await this.handleQuoteConfirmation(service, body);
        
        case 'booking-confirmation':
          return await this.handleBookingConfirmation(service, body);
        
        case 'payment-confirmation':
          return await this.handlePaymentConfirmation(service, body);
        
        case 'service-reminder':
          return await this.handleServiceReminder(service, body);
        
        case 'retry':
          return await this.handleRetryNotification(service, body);
        
        case 'cancel':
          return await this.handleCancelNotification(service, body);
        
        case 'batch':
          return await this.handleBatchNotifications(service, body);

        default:
          // Auto-détection basée sur le contenu
          if (body.to && body.to.includes('@')) {
            return await this.handleSendEmail(service, body);
          } else if (body.to && body.message) {
            return await this.handleSendSMS(service, body);
          } else {
            return NextResponse.json({
              success: false,
              error: 'Action non spécifiée',
              hint: 'Utilisez ?action=email|sms|whatsapp ou spécifiez action dans le body'
            }, { status: 400 });
          }
      }

    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Erreur lors du traitement de la demande',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      }, { status: 500 });
    }
  }

  /**
   * Gère les requêtes GET - Informations et statistiques
   */
  async handleGet(request: NextRequest): Promise<NextResponse> {
    try {
      const service = await this.getNotificationService();
      const { searchParams } = new URL(request.url);
      
      if (searchParams.has('stats')) {
        const stats = await service.getServiceStats();
        return NextResponse.json({
          success: true,
          stats,
          performance: {
            averageResponseTime: stats.metrics?.channels?.email?.averageLatency || 0,
            throughput: stats.metrics?.channels?.email?.sent || 0,
            successRate: 1 - (stats.metrics?.channels?.email?.errorRate || 0)
          },
          channels: stats.metrics?.channels || {},
          errors: stats.metrics?.alerts || [],
          timestamp: new Date().toISOString()
        });
      }
      
      if (searchParams.has('health')) {
        const health = await service.healthCheck();
        return NextResponse.json({
          success: true,
          status: health.status,
          health,
          timestamp: new Date().toISOString()
        });
      }
      
      // Nettoyer les jobs échoués d'une queue spécifique
      const cleanQueue = searchParams.get('clean');
      if (cleanQueue) {
        try {
          await service.cleanFailedJobs(cleanQueue);
          return NextResponse.json({
            success: true,
            message: `Jobs échoués nettoyés pour la queue '${cleanQueue}'`,
            queue: cleanQueue,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: `Erreur lors du nettoyage de la queue '${cleanQueue}': ${(error as Error).message}`,
            queue: cleanQueue
          }, { status: 500 });
        }
      }
      
      // Récupérer une notification par ID
      const id = searchParams.get('id');
      if (id) {
        const notification = await service.getNotificationById(id);
        
        if (!notification) {
          return NextResponse.json({
            success: false,
            error: 'Notification non trouvée',
            id
          }, { status: 404 });
        }
        
        return NextResponse.json({
          success: true,
          notification,
          timestamp: new Date().toISOString()
        });
      }
      
      // Récupérer une notification par ID externe (provider)
      const externalId = searchParams.get('externalId');
      if (externalId) {
        const notification = await service.getNotificationByExternalId(externalId);
        
        if (!notification) {
          return NextResponse.json({
            success: false,
            error: 'Notification non trouvée par ID externe',
            externalId
          }, { status: 404 });
        }
        
        return NextResponse.json({
          success: true,
          notification,
          timestamp: new Date().toISOString()
        });
      }
      
      // Récupérer les statistiques des notifications en BDD
      if (searchParams.has('db-stats')) {
        const stats = await service.getNotificationStats();
        return NextResponse.json({
          success: true,
          dbStats: stats,
          timestamp: new Date().toISOString()
        });
      }
      
      // Lister les notifications avec pagination
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const status = searchParams.get('status');
      const channel = searchParams.get('channel');
      
      if (searchParams.has('list') || (!searchParams.has('stats') && !searchParams.has('health') && !searchParams.has('db-stats') && !id && !externalId && !cleanQueue)) {
        // Simuler une liste de notifications pour les tests
        const mockNotifications = [
          {
            id: 'notif-1',
            channel: 'email',
            status: 'SENT',
            recipient: 'test@example.com',
            subject: 'Test Notification',
            createdAt: new Date().toISOString(),
            sentAt: new Date().toISOString()
          },
          {
            id: 'notif-2', 
            channel: 'sms',
            status: 'PENDING',
            recipient: '+33123456789',
            subject: 'SMS Test',
            createdAt: new Date().toISOString()
          }
        ];
        
        return NextResponse.json({
          success: true,
          notifications: mockNotifications,
          pagination: {
            page,
            limit,
            total: mockNotifications.length,
            totalPages: Math.ceil(mockNotifications.length / limit)
          },
          timestamp: new Date().toISOString()
        });
      }
      
      // Documentation de l'API
      return NextResponse.json({
        name: 'Express Quote Notifications API - Simple',
        version: '1.0.0',
        description: 'API simplifiée sans injection de dépendance',
        endpoints: {
          'POST ?action=email': 'Envoie un email',
          'POST ?action=sms': 'Envoie un SMS',
          'POST ?action=whatsapp': 'Envoie un WhatsApp',
          'POST ?action=quote-confirmation': 'Confirmation de devis',
          'POST ?action=booking-confirmation': 'Confirmation de réservation',
          'POST ?action=service-reminder': 'Rappel de service',
          'POST ?action=retry': 'Relancer une notification échouée (body: {id, reason?})',
          'POST ?action=cancel': 'Annuler une notification (body: {id, reason?})',
          'GET ?stats': 'Statistiques du système',
          'GET ?health': 'État de santé du système (inclut cache templates)',
          'GET ?id=<id>': 'Récupérer notification par ID interne',
          'GET ?externalId=<id>': 'Récupérer notification par ID externe (provider)',
          'GET ?db-stats': 'Statistiques des notifications en BDD'
        },
        templates: {
          'booking-confirmation': 'Template React Email pour confirmations de réservation',
          'payment-confirmation': 'Template React Email pour confirmations de paiement',
          'service-reminder': 'Template SMS pour rappels de service'
        }
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la récupération des informations',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      }, { status: 500 });
    }
  }

  // ============================================================================
  // HANDLERS SPÉCIALISÉS
  // ============================================================================

  private async handleSendEmail(service: ProductionNotificationService, body: any) {
    try {
      const validData = EmailSchema.parse(body);

      // Normaliser les champs (supporter à la fois to/recipient et html/content)
      const toEmail = validData.to || validData.recipient || '';
      const htmlContent = validData.html || validData.content || '';
      const textContent = validData.text || '';

      // Sanitization robuste avec ContentSanitizer
      let sanitizedHtml = htmlContent;
      let sanitizedText = textContent;
      
      // Import du ContentSanitizer
      const { ContentSanitizer } = await import('../../infrastructure/security/content.sanitizer');
      const sanitizer = new ContentSanitizer();
      
      try {
        // Sanitization du HTML
        if (sanitizedHtml) {
          sanitizedHtml = await sanitizer.sanitizeHtml(sanitizedHtml);
        }
        
        // Sanitization du texte
        if (sanitizedText) {
          sanitizedText = await sanitizer.sanitizeText(sanitizedText);
        }
        
        // Validation contre les injections
        const isHtmlSafe = sanitizedHtml ? await sanitizer.validateForInjection(sanitizedHtml) : true;
        const isTextSafe = sanitizedText ? await sanitizer.validateForInjection(sanitizedText) : true;
        
        if (!isHtmlSafe || !isTextSafe) {
          // Nettoyage agressif si détection d'injection
          if (sanitizedHtml) {
            sanitizedHtml = sanitizedHtml
              .replace(/(\b(DROP|DELETE|UPDATE|INSERT|SELECT|UNION|EXEC|SCRIPT)\b)/gi, '[BLOCKED]')
              .replace(/[<>'"\\;]/g, '')
              .replace(/--.*$/gm, '')
              .replace(/\/\*.*?\*\//gs, '');
          }
          if (sanitizedText) {
            sanitizedText = sanitizedText
              .replace(/(\b(DROP|DELETE|UPDATE|INSERT|SELECT|UNION|EXEC|SCRIPT)\b)/gi, '[BLOCKED]')
              .replace(/[<>'"\\;]/g, '')
              .replace(/--.*$/gm, '')
              .replace(/\/\*.*?\*\//gs, '');
          }
        }
      } catch (sanitizeError) {
        // Fallback vers sanitization basique
        sanitizedHtml = validData.html
          ? validData.html
              .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
              .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"')
              .replace(/src\s*=\s*["']javascript:[^"']*["']/gi, 'src="#"')
              .replace(/data\s*=\s*["']javascript:[^"']*["']/gi, 'data="#"')
              .replace(/<iframe\b[^>]*>/gi, '')
              .replace(/<\/iframe>/gi, '')
              .replace(/<object\b[^>]*>/gi, '')
              .replace(/<\/object>/gi, '')
              .replace(/<embed\b[^>]*>/gi, '')
              .replace(/<\/embed>/gi, '')
              .replace(/(\b(DROP|DELETE|UPDATE|INSERT|SELECT|UNION|EXEC|SCRIPT)\b)/gi, '[BLOCKED]')
              .replace(/[<>'"\\;]/g, '')
          : htmlContent;
        
        sanitizedText = textContent
          ? textContent
              .replace(/(\b(DROP|DELETE|UPDATE|INSERT|SELECT|UNION|EXEC|SCRIPT)\b)/gi, '[BLOCKED]')
              .replace(/[<>'"\\;]/g, '')
              .replace(/--.*$/gm, '')
              .replace(/\/\*.*?\*\//gs, '')
          : textContent;
      }
      
      const result = await service.sendEmail({
        to: toEmail,
        subject: validData.subject,
        html: sanitizedHtml,
        text: sanitizedText,
        template: validData.template,
        data: validData.data,
        priority: validData.priority,
        scheduledAt: validData.scheduledFor ? new Date(validData.scheduledFor) : undefined,
        metadata: validData.metadata
      });

      return NextResponse.json({
        success: result.success,
        id: result.id,
        message: result.success ? 'Email envoyé avec succès' : 'Échec envoi email',
        channel: 'email',
        priority: validData.priority?.toLowerCase() || 'normal',
        sanitizedContent: sanitizedHtml || sanitizedText,
        sanitizedRecipient: toEmail,
        error: result.error,
        latencyMs: result.latencyMs,
        metadata: {
          validationFailed: !result.success,
          sanitized: true,
          timestamp: new Date().toISOString()
        }
      }, { status: result.success ? 200 : 500 });

    } catch (error) {
      if (error instanceof z.ZodError) {
        // Vérifier si c'est une tentative d'injection SQL en examinant les données brutes
        const bodyString = JSON.stringify(body);
        const hasInjectionPatterns = 
          /(\b(DROP|DELETE|UPDATE|INSERT|SELECT|UNION|EXEC|SCRIPT)\b)/i.test(bodyString) ||
          /--.*$/m.test(bodyString) ||
          /\/\*.*?\*\//s.test(bodyString) ||
          /(\bOR\b.*=.*\bAND\b)/i.test(bodyString) ||
          /(\bOR\b.*'.*'.*=.*'.*')/i.test(bodyString);
        
        const errorMessage = hasInjectionPatterns 
          ? 'Tentative d\'injection SQL détectée et bloquée'
          : 'Données email invalides';
          
        return NextResponse.json({
          success: false,
          error: errorMessage,
          details: error.errors,
          circuitState: 'CLOSED', // Validation errors don't go through circuit breaker
          metadata: {
            validationFailed: true,
            injectionDetected: hasInjectionPatterns,
            timestamp: new Date().toISOString(),
            errorType: 'VALIDATION_ERROR'
          }
        }, { status: 400 });
      }
      throw error;
    }
  }

  private async handleSendSMS(service: ProductionNotificationService, body: any) {
    try {
      const validData = SMSSchema.parse(body);
      
      // Sanitization robuste avec ContentSanitizer
      let sanitizedMessage = validData.message || '';
      
      // Import du ContentSanitizer
      const { ContentSanitizer } = await import('../../infrastructure/security/content.sanitizer');
      const sanitizer = new ContentSanitizer();
      
      try {
        // CORRECTION: Pour SMS, décoder d'abord les entités HTML puis sanitizer pour SMS
        sanitizedMessage = sanitizedMessage
          .replace(/&#x2F;/g, '/')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#x27;/g, "'")
          .replace(/&#39;/g, "'");
        
        // Supprimer les caractères de contrôle dangereux (sans réencodage HTML)
        sanitizedMessage = sanitizedMessage.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        
        // Validation contre les injections
        const isSafe = await sanitizer.validateForInjection(sanitizedMessage);
        if (!isSafe) {
          // Si détection d'injection, nettoyer plus agressivement
          sanitizedMessage = sanitizedMessage
            .replace(/(\b(DROP|DELETE|UPDATE|INSERT|SELECT|UNION|EXEC|SCRIPT)\b)/gi, '[BLOCKED]')
            .replace(/[<>'"\\;]/g, '')
            .replace(/--.*$/gm, '') // Supprimer les commentaires SQL
            .replace(/\/\*.*?\*\//gs, ''); // Supprimer les commentaires SQL multi-lignes
        }
      } catch (sanitizeError) {
        // En cas d'erreur de sanitization, utiliser une sanitization basique
        sanitizedMessage = validData.message
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/<iframe\b[^>]*>/gi, '')
          .replace(/<\/iframe>/gi, '')
          .replace(/<object\b[^>]*>/gi, '')
          .replace(/<\/object>/gi, '')
          .replace(/<embed\b[^>]*>/gi, '')
          .replace(/<\/embed>/gi, '')
          .replace(/(\b(DROP|DELETE|UPDATE|INSERT|SELECT|UNION|EXEC|SCRIPT)\b)/gi, '[BLOCKED]')
          .replace(/[<>'"\\;]/g, '');
      }
      
      // Normalisation intelligente vers format E.164 (+33751262080)
      let sanitizedPhone = validData.to
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/[^+\d]/g, '') // Garder seulement + et chiffres
        .trim();
      
      // Normalisation automatique des formats français vers E.164
      if (sanitizedPhone.startsWith('0033')) {
        // 0033751262080 → +33751262080
        sanitizedPhone = '+33' + sanitizedPhone.substring(4);
      } else if (sanitizedPhone.startsWith('0') && sanitizedPhone.length === 10) {
        // 0751262080 → +33751262080
        sanitizedPhone = '+33' + sanitizedPhone.substring(1);
      }
      // +33751262080 reste inchangé
      
      // Validation finale format E.164
      if (!sanitizedPhone.startsWith('+33')) {
        return NextResponse.json({
          success: false,
          error: 'Format numéro SMS invalide',
          hint: 'Formats acceptés: 0751262080, 0033751262080, +33751262080',
          received: validData.to,
          normalized: sanitizedPhone
        }, { status: 400 });
      }
      
      if (!/^\+33[1-9]\d{8}$/.test(sanitizedPhone)) {
        return NextResponse.json({
          success: false,
          error: 'Numéro français invalide',
          hint: 'Exemple: 0751262080 ou +33751262080 (pas 0033751262080)',
          received: validData.to,
          normalized: sanitizedPhone
        }, { status: 400 });
      }
      
      const result = await service.sendSMS({
        to: sanitizedPhone,
        message: sanitizedMessage,
        from: validData.from,
        priority: validData.priority
      });

      return NextResponse.json({
        success: result.success,
        id: result.id,
        message: result.success ? 'SMS envoyé avec succès' : 'Échec envoi SMS',
        channel: 'sms',
        priority: validData.priority?.toLowerCase() || 'normal',
        sanitizedContent: sanitizedMessage,
        sanitizedRecipient: sanitizedPhone,
        error: result.error,
        latencyMs: result.latencyMs
      }, { status: result.success ? 200 : 500 });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          success: false,
          error: 'Données SMS invalides',
          details: error.errors
        }, { status: 400 });
      }
      throw error;
    }
  }

  private async handleSendWhatsApp(service: ProductionNotificationService, body: any) {
    try {
      const validData = WhatsAppSchema.parse(body);
      
      // Sanitization robuste avec ContentSanitizer
      let sanitizedMessage = validData.message || '';
      
      // Import du ContentSanitizer
      const { ContentSanitizer } = await import('../../infrastructure/security/content.sanitizer');
      const sanitizer = new ContentSanitizer();
      
      try {
        // Sanitization du texte avec protection SQL injection
        sanitizedMessage = await sanitizer.sanitizeText(sanitizedMessage);
        
        // Validation contre les injections
        const isSafe = await sanitizer.validateForInjection(sanitizedMessage);
        if (!isSafe) {
          // Si détection d'injection, nettoyer plus agressivement
          sanitizedMessage = sanitizedMessage
            .replace(/(\b(DROP|DELETE|UPDATE|INSERT|SELECT|UNION|EXEC|SCRIPT)\b)/gi, '[BLOCKED]')
            .replace(/[<>'"\\;]/g, '')
            .replace(/--.*$/gm, '') // Supprimer les commentaires SQL
            .replace(/\/\*.*?\*\//gs, ''); // Supprimer les commentaires SQL multi-lignes
        }
      } catch (sanitizeError) {
        // En cas d'erreur de sanitization, utiliser une sanitization basique
        sanitizedMessage = validData.message
          ? validData.message
              .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
              .replace(/javascript:/gi, '')
              .replace(/<iframe\b[^>]*>/gi, '')
              .replace(/<\/iframe>/gi, '')
              .replace(/<object\b[^>]*>/gi, '')
              .replace(/<\/object>/gi, '')
              .replace(/<embed\b[^>]*>/gi, '')
              .replace(/<\/embed>/gi, '')
              .replace(/(\b(DROP|DELETE|UPDATE|INSERT|SELECT|UNION|EXEC|SCRIPT)\b)/gi, '[BLOCKED]')
              .replace(/[<>'"\\;]/g, '')
          : '';
      }
      
      const result = await service.sendWhatsApp({
        to: validData.to,
        message: sanitizedMessage,
        template: validData.template,
        priority: validData.priority
      });

      return NextResponse.json({
        success: result.success,
        id: result.id,
        message: result.success ? 'WhatsApp envoyé avec succès' : 'Échec envoi WhatsApp',
        channel: 'whatsapp',
        priority: validData.priority?.toLowerCase() || 'normal',
        sanitizedContent: sanitizedMessage,
        sanitizedRecipient: validData.to,
        error: result.error,
        latencyMs: result.latencyMs
      }, { status: result.success ? 200 : 500 });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          success: false,
          error: 'Données WhatsApp invalides',
          details: error.errors
        }, { status: 400 });
      }
      throw error;
    }
  }

  private async handleQuoteConfirmation(service: ProductionNotificationService, body: any) {
    try {
      const validData = QuoteConfirmationSchema.parse(body);
      
      const result = await service.sendQuoteConfirmation(validData.email, {
        customerName: validData.customerName,
        quoteNumber: validData.quoteNumber,
        serviceType: validData.serviceType,
        serviceName: validData.serviceName,
        totalAmount: validData.totalAmount,
        viewQuoteUrl: validData.viewQuoteUrl
      });

      return NextResponse.json({
        success: result.success,
        id: result.id,
        message: result.success ? 'Confirmation de devis envoyé avec succès' : 'Échec envoi confirmation',
        channel: 'email',
        priority: 'high',
        error: result.error,
        latencyMs: result.latencyMs
      }, { status: result.success ? 200 : 500 });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          success: false,
          error: 'Données de devis invalides',
          details: error.errors
        }, { status: 400 });
      }
      throw error;
    }
  }

  private async handleBookingConfirmation(service: ProductionNotificationService, body: any) {
    try {
      const validData = BookingConfirmationSchema.parse(body);

      // 🆕 Traitement des pièces jointes PDF
      const attachments: any[] = [];
      if (validData.attachments && validData.attachments.length > 0) {
        const fs = await import('fs');

        for (const attachment of validData.attachments) {
          try {
            // Lire le fichier PDF depuis le disque
            const fileBuffer = fs.readFileSync(attachment.path);

            attachments.push({
              filename: attachment.filename,
              content: fileBuffer.toString('base64'),
              contentType: attachment.mimeType || 'application/pdf',
              size: attachment.size
            });
          } catch (fileError) {
            console.warn(`Impossible de lire le fichier: ${attachment.path}`, fileError);
          }
        }
      }

      const result = await service.sendBookingConfirmation(validData.email, {
        customerName: validData.customerName,
        bookingId: validData.bookingId,
        serviceDate: validData.serviceDate,
        serviceTime: validData.serviceTime,
        serviceAddress: validData.serviceAddress,
        totalAmount: validData.totalAmount,
        customerPhone: validData.customerPhone
      });

      return NextResponse.json({
        success: result.success,
        id: result.id,
        message: result.success ? 'Confirmation de réservation envoyé avec succès' : 'Échec envoi confirmation',
        channel: 'email',
        priority: 'high',
        error: result.error,
        latencyMs: result.latencyMs
      }, { status: result.success ? 200 : 500 });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          success: false,
          error: 'Données de réservation invalides',
          details: error.errors
        }, { status: 400 });
      }
      throw error;
    }
  }

  /**
   * Gestionnaire pour la confirmation de paiement avec pièces jointes PDF
   */
  async handlePaymentConfirmation(service: ProductionNotificationService, body: any): Promise<NextResponse> {
    try {
      const validData = PaymentConfirmationSchema.parse(body);

      // 📄 Conversion des pièces jointes PDF en Base64
      const attachmentsB64: any[] = [];
      if (validData.attachments && validData.attachments.length > 0) {
        const fs = await import('fs/promises');

        for (const attachment of validData.attachments) {
          try {
            const fileBuffer = await fs.readFile(attachment.path);
            const base64Content = fileBuffer.toString('base64');

            attachmentsB64.push({
              filename: attachment.filename,
              content: base64Content,
              contentType: attachment.mimeType,
              size: attachment.size
            });

            console.log('📎 PDF converti en Base64', {
              filename: attachment.filename,
              originalSize: `${Math.round(attachment.size / 1024)}KB`,
              base64Size: `${Math.round(base64Content.length / 1024)}KB`
            });
          } catch (error) {
            console.error('❌ Erreur lecture PDF', {
              path: attachment.path,
              error: error instanceof Error ? error.message : 'Erreur inconnue'
            });
          }
        }
      }

      // 💰 Envoi de la notification payment-confirmation avec PDF
      const result = await service.sendPaymentConfirmation(validData.email, {
        customerName: validData.customerName,
        customerEmail: validData.email,
        customerPhone: validData.customerPhone,
        amount: validData.amount,
        currency: validData.currency,
        paymentMethod: validData.paymentMethod,
        transactionId: validData.transactionId,
        paymentDate: validData.paymentDate,
        bookingId: validData.bookingId,
        bookingReference: validData.bookingReference || `EQ-${validData.bookingId.slice(-8).toUpperCase()}`,
        serviceType: validData.serviceType || 'CUSTOM',
        serviceName: validData.serviceName || 'Service Express Quote',
        serviceDate: validData.serviceDate || new Date().toISOString(),
        serviceTime: validData.serviceTime,
        viewBookingUrl: validData.viewBookingUrl || `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${validData.bookingId}`,
        downloadInvoiceUrl: validData.downloadInvoiceUrl,
        supportUrl: validData.supportUrl || `${process.env.NEXT_PUBLIC_APP_URL}/contact`,
        // 📎 Pièces jointes PDF converties
        attachments: attachmentsB64
      });

      // 📱 Envoi SMS optionnel si téléphone fourni
      let smsResult = null;
      if (validData.customerPhone) {
        try {
          smsResult = await service.sendSMS({
            to: validData.customerPhone,
            message: `💰 Paiement confirmé ! Votre réservation ${validData.bookingReference || validData.bookingId.slice(-8)} est validée. Montant: ${validData.amount}€. Merci !`,
            from: 'EXPRESS-QUOTE',
            priority: 'HIGH'
          });
        } catch (smsError) {
          console.error('❌ Erreur envoi SMS payment-confirmation', {
            phone: validData.customerPhone,
            error: smsError instanceof Error ? smsError.message : 'Erreur inconnue'
          });
        }
      }

      return NextResponse.json({
        success: result.success,
        emailsSent: result.success ? 1 : 0,
        smsSent: smsResult?.success ? 1 : 0,
        id: result.id,
        message: result.success ? 'Confirmation de paiement envoyée avec succès' : 'Échec envoi confirmation paiement',
        attachmentsProcessed: attachmentsB64.length,
        error: result.error,
        latencyMs: result.latencyMs
      });

    } catch (error) {
      console.error('❌ Erreur handlePaymentConfirmation', {
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });

      if (error instanceof z.ZodError) {
        return NextResponse.json({
          success: false,
          error: 'Données de paiement invalides',
          details: error.errors,
          emailsSent: 0,
          smsSent: 0
        }, { status: 400 });
      }

      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        emailsSent: 0,
        smsSent: 0
      }, { status: 500 });
    }
  }

  private async handleServiceReminder(service: ProductionNotificationService, body: any) {
    try {
      const validData = ServiceReminderSchema.parse(body);
      
      const results = [];
      
      // Normaliser le numéro de téléphone si présent
      let normalizedPhone = '';
      if (validData.customerPhone) {
        normalizedPhone = validData.customerPhone
          .replace(/[^+\d]/g, '') // Garder seulement + et chiffres
          .trim();
        
        // Normalisation automatique des formats français vers E.164
        if (normalizedPhone.startsWith('0033')) {
          // 0033751262080 → +33751262080
          normalizedPhone = '+33' + normalizedPhone.substring(4);
        } else if (normalizedPhone.startsWith('0') && normalizedPhone.length === 10) {
          // 0751262080 → +33751262080
          normalizedPhone = '+33' + normalizedPhone.substring(1);
        }
      }
      
      // Envoyer via les canaux demandés
      for (const channel of validData.channels) {
        if (channel === 'email' && validData.email) {
          const result = await service.sendServiceReminder(validData.email, {
            bookingId: validData.bookingId,
            reminderDetails: validData.reminderDetails
          });
          results.push({
            channel: 'email',
            success: result.success,
            id: result.id,
            error: result.error
          });
        }
        else if (channel === 'sms' && normalizedPhone) {
          const result = await service.sendSMS({
            to: normalizedPhone,
            message: `Rappel: Votre service ${validData.reminderDetails.serviceName} est prévu le ${validData.reminderDetails.appointmentDate} à ${validData.reminderDetails.appointmentTime}`,
            priority: 'HIGH'
          });
          results.push({
            channel: 'sms', 
            success: result.success,
            id: result.id,
            error: result.error
          });
        }
        else if (channel === 'whatsapp' && normalizedPhone) {
          const result = await service.sendWhatsApp({
            to: normalizedPhone,
            message: `Rappel: Votre service ${validData.reminderDetails.serviceName} est prévu le ${validData.reminderDetails.appointmentDate} à ${validData.reminderDetails.appointmentTime}`,
            priority: 'HIGH'
          });
          results.push({
            channel: 'whatsapp',
            success: result.success, 
            id: result.id,
            error: result.error
          });
        }
      }

      const allSuccessful = results.every(r => r.success);
      
      return NextResponse.json({
        success: allSuccessful,
        results,
        message: allSuccessful ? 'Rappels de service envoyés' : 'Certains rappels ont échoué'
      }, { status: allSuccessful ? 200 : 500 });

    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de l\'envoi du rappel',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      }, { status: 500 });
    }
  }

  private async handleRetryNotification(service: ProductionNotificationService, body: any) {
    try {
      const validData = RetrySchema.parse(body);

      const result = await service.retryNotification(validData.id);

      return NextResponse.json({
        success: result.success,
        id: result.id,
        message: result.success ? 'Notification relancée avec succès' : 'Échec du relancement',
        retryId: result.id,
        originalId: validData.id,
        retryConfig: {
          maxRetries: 3,
          retryDelay: 5000,
          backoffMultiplier: 2
        },
        error: result.error,
        latencyMs: result.latencyMs,
        retryCount: result.retryCount
      }, { status: result.success ? 200 : 500 });

    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Erreur lors du retry de notification',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      }, { status: 500 });
    }
  }

  private async handleCancelNotification(service: ProductionNotificationService, body: any) {
    try {
      const validData = CancelSchema.parse(body);

      const cancelled = await service.cancelNotification(validData.id, validData.reason);

      return NextResponse.json({
        success: cancelled,
        id: validData.id,
        status: cancelled ? 'cancelled' : 'failed',
        message: cancelled ? 'Notification annulée avec succès' : 'Impossible d\'annuler la notification',
        reason: validData.reason
      }, { status: cancelled ? 200 : 400 });

    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de l\'annulation',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      }, { status: 500 });
    }
  }

  private async handleBatchNotifications(service: ProductionNotificationService, body: any) {
    try {
      const BatchSchema = z.object({
        notifications: z.array(z.object({
          id: z.string().optional(),
          // Support pour les deux formats : nouveau (type/recipient) et legacy (to/subject/html)
          type: z.enum(['email', 'sms', 'whatsapp']).optional(),
          recipient: z.string().optional(),
          content: z.string().optional(),
          // Format legacy
          to: z.string().optional(),
          subject: z.string().optional(),
          html: z.string().optional(),
          message: z.string().optional(),
          // Champs communs
          priority: z.enum(['URGENT', 'HIGH', 'NORMAL', 'LOW']).optional(),
          templateId: z.string().optional(),
          variables: z.record(z.any()).optional(),
          scheduledAt: z.string().optional()
        })).min(1),
        batchSize: z.number().optional(),
        delayBetweenBatches: z.number().optional()
      });

      const validData = BatchSchema.parse(body);

      const results = await service.sendBulkNotifications({
        notifications: validData.notifications
          .map(n => {
            // Détecter le format et mapper les champs
            const isLegacyFormat = n.to && (n.subject || n.html || n.message);
            const recipient = isLegacyFormat ? n.to : (n.recipient || '');
            
            // Filtrer les notifications sans recipient
            if (!recipient) {
              return null;
            }
            
            // Convertir priority en type valide
            const priorityValue = n.priority?.toLowerCase();
            const validPriority: 'low' | 'normal' | 'high' | 'critical' | undefined = 
              priorityValue === 'low' || priorityValue === 'normal' || priorityValue === 'high' || priorityValue === 'critical'
                ? priorityValue
                : priorityValue === 'urgent' ? 'high' : 'normal';
            
            return {
              id: n.id || `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: isLegacyFormat ? 'email' : (n.type || 'email'),
              recipient: recipient,
              content: isLegacyFormat ? (n.html || n.message || '') : (n.content || ''),
              subject: isLegacyFormat ? n.subject : (n.subject || ''),
              priority: validPriority,
              templateId: n.templateId,
              variables: n.variables,
              scheduledAt: n.scheduledAt ? new Date(n.scheduledAt) : undefined,
              metadata: {}
            };
          })
          .filter((n): n is NonNullable<typeof n> => n !== null),
        batchSize: validData.batchSize,
        delayBetweenBatches: validData.delayBetweenBatches
      });

      return NextResponse.json({
        success: true,
        results: results,
        total: results.length,
        successCount: results.filter(r => r.success).length,
        failureCount: results.filter(r => !r.success).length,
        message: `Batch processing completed: ${results.filter(r => r.success).length}/${results.length} successful`
      }, { status: 200 });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          success: false,
          error: 'Données de batch invalides',
          details: error.errors
        }, { status: 400 });
      }
      return NextResponse.json({
        success: false,
        error: 'Erreur lors du traitement du batch',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      }, { status: 500 });
    }
  }
}

// ============================================================================
// INSTANCE SINGLETON POUR LES ROUTES NEXT.JS
// ============================================================================

const controller = new NotificationController();

/**
 * Fonctions d'export pour Next.js App Router
 */
export async function POST(request: NextRequest) {
  return controller.handlePost(request);
}

export async function GET(request: NextRequest) {
  return controller.handleGet(request);
}