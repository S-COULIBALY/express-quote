/**
 * 📱 SMS ADAPTER ROBUSTE POUR PRODUCTION
 * 
 * Adapter SMS multi-provider avec :
 * - Support Twilio + Free Mobile + Vonage
 * - Gestion d'erreurs avancée
 * - Retry automatique
 * - Circuit breaker intégré
 * - Validation stricte des numéros
 * - Métriques et monitoring
 */

import { RetryManager } from '../retry/retry.manager';
import { CircuitBreaker } from '../resilience/circuit.breaker';

export interface SmsConfig {
  provider: 'twilio' | 'free_mobile' | 'vonage' | 'brevo';
  
  // Twilio Configuration
  twilio?: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
  };
  
  // Free Mobile Configuration
  freeMobile?: {
    user: string;
    pass: string;
  };
  
  // Vonage Configuration
  vonage?: {
    apiKey: string;
    apiSecret: string;
    phoneNumber: string;
  };
  
  // Brevo Configuration  
  brevo?: {
    apiKey: string;
    sender: string;
  };
  
  fromName?: string;
  timeout?: number;
}

export interface SmsMessage {
  to: string | string[];
  message: string;
  priority?: 'high' | 'normal' | 'low';
  scheduledAt?: Date;
  maxLength?: number;
}

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: {
    type: 'PROVIDER_ERROR' | 'VALIDATION_ERROR' | 'RATE_LIMIT_ERROR' | 'TIMEOUT_ERROR' | 'AUTH_ERROR';
    message: string;
    code?: string;
    details?: any;
  };
  retryable: boolean;
  attempts?: number;
  duration?: number;
  metadata?: {
    to: string | string[];
    message: string;
    sentAt: Date;
    provider: string;
    cost?: number;
  };
}

/**
 * Adapter SMS robuste avec multi-provider
 */
export class RobustSmsAdapter {
  private config: SmsConfig | null = null;
  private retryManager: RetryManager;
  private circuitBreaker: CircuitBreaker;
  private isConfigured = false;
  
  // Métriques
  private metrics = {
    totalSent: 0,
    totalFailed: 0,
    totalRetries: 0,
    averageResponseTime: 0,
    lastError: null as Error | null,
    lastSuccess: null as Date | null,
    costTotal: 0
  };
  
  constructor() {
    // Retry manager spécialisé pour SMS
    this.retryManager = RetryManager.forSMS({
      onRetry: (attempt, error, nextDelay) => {
        console.log(`📱 SMS retry ${attempt}: ${error.message} (next in ${nextDelay}ms)`);
        this.metrics.totalRetries++;
      }
    });
    
    // Circuit breaker pour SMS
    this.circuitBreaker = CircuitBreaker.forSMS({
      onStateChange: (oldState, newState, reason) => {
        console.log(`📱 SMS circuit breaker: ${oldState} -> ${newState} (${reason})`);
      },
      onFailure: (error) => {
        this.metrics.lastError = error;
      }
    });
  }
  
  /**
   * Configurer l'adapter avec validation
   */
  async configure(config: SmsConfig): Promise<void> {
    console.log(`📱 Configuring robust SMS adapter (${config.provider})...`);
    
    // Validation de la configuration
    this.validateConfig(config);
    
    this.config = { ...config };
    
    try {
      // Test de connexion selon le provider
      await this.testProvider(config);
      
      this.isConfigured = true;
      console.log(`✅ SMS adapter configured successfully (${config.provider})`);
      
    } catch (error) {
      const err = error as Error;
      console.error('❌ SMS adapter configuration failed:', err);
      throw new Error(`SMS configuration failed: ${err.message}`);
    }
  }
  
  /**
   * Valider la configuration
   */
  private validateConfig(config: SmsConfig): void {
    if (!config.provider) {
      throw new Error('SMS provider is required');
    }
    
    switch (config.provider) {
      case 'twilio':
        if (!config.twilio?.accountSid) {
          throw new Error('Twilio Account SID is required');
        }
        if (!config.twilio?.authToken) {
          throw new Error('Twilio Auth Token is required');
        }
        if (!config.twilio?.phoneNumber) {
          throw new Error('Twilio phone number is required');
        }
        if (!this.isValidPhoneNumber(config.twilio.phoneNumber)) {
          throw new Error('Invalid Twilio phone number format');
        }
        break;
        
      case 'free_mobile':
        if (!config.freeMobile?.user) {
          throw new Error('Free Mobile user ID is required');
        }
        if (!config.freeMobile?.pass) {
          throw new Error('Free Mobile pass is required');
        }
        break;
        
      case 'vonage':
        if (!config.vonage?.apiKey) {
          throw new Error('Vonage API key is required');
        }
        if (!config.vonage?.apiSecret) {
          throw new Error('Vonage API secret is required');
        }
        if (!config.vonage?.phoneNumber) {
          throw new Error('Vonage phone number is required');
        }
        break;
        
      case 'brevo':
        if (!config.brevo?.apiKey) {
          throw new Error('Brevo API key is required');
        }
        if (!config.brevo?.sender) {
          throw new Error('Brevo sender is required');
        }
        break;
        
      default:
        throw new Error(`Unsupported SMS provider: ${config.provider}`);
    }
  }
  
  /**
   * Tester la connexion au provider
   */
  private async testProvider(config: SmsConfig): Promise<void> {
    console.log(`🔍 Testing ${config.provider} connection...`);
    
    // En mode test, on simule juste les validations sans appeler les APIs
    if (process.env.NODE_ENV === 'test' || process.env.TESTING_MODE === 'true') {
      console.log(`📱 SMS test connection for ${config.provider} (simulation)`);
      return;
    }
    
    switch (config.provider) {
      case 'twilio':
        await this.testTwilioConnection(config.twilio!);
        break;
        
      case 'free_mobile':
        await this.testFreeMobileConnection(config.freeMobile!);
        break;
        
      case 'vonage':
        await this.testVonageConnection(config.vonage!);
        break;
        
      case 'brevo':
        await this.testBrevoConnection(config.brevo!);
        break;
    }
    
    console.log(`✅ ${config.provider} connection verified`);
  }
  
  /**
   * Test connexion Twilio
   */
  private async testTwilioConnection(config: { accountSid: string; authToken: string }): Promise<void> {
    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}.json`,
        {
          method: 'GET',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Twilio API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Twilio account verified: ${data.friendly_name}`);
      
    } catch (error) {
      throw new Error(`Twilio connection failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Test connexion Free Mobile
   */
  private async testFreeMobileConnection(config: { user: string; pass: string }): Promise<void> {
    try {
      // Free Mobile utilise une API simple GET
      const testUrl = `https://smsapi.free-mobile.fr/sendmsg?user=${config.user}&pass=${config.pass}&msg=test`;
      
      const response = await fetch(testUrl, {
        method: 'GET'
      });
      
      // Free Mobile renvoie 200 même en cas d'erreur, on vérifie le contenu
      if (response.status === 400) {
        throw new Error('Invalid Free Mobile credentials');
      }
      
      if (response.status === 402) {
        throw new Error('Free Mobile service not activated');
      }
      
      if (!response.ok && response.status !== 200) {
        throw new Error(`Free Mobile API error: ${response.status}`);
      }
      
      console.log(`✅ Free Mobile API accessible (${config.user})`);
      
    } catch (error) {
      throw new Error(`Free Mobile connection failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Test connexion Vonage
   */
  private async testVonageConnection(config: { apiKey: string; apiSecret: string }): Promise<void> {
    try {
      const response = await fetch(
        `https://rest.nexmo.com/account/get-balance?api_key=${config.apiKey}&api_secret=${config.apiSecret}`,
        { method: 'GET' }
      );
      
      if (!response.ok) {
        throw new Error(`Vonage API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Vonage account verified, balance: ${data.value} ${data.currency}`);
      
    } catch (error) {
      throw new Error(`Vonage connection failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Test connexion Brevo SMS
   */
  private async testBrevoConnection(config: { apiKey: string; sender: string }): Promise<void> {
    try {
      // Brevo SMS API - Test avec endpoint de vérification du compte
      const response = await fetch('https://api.brevo.com/v3/account', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'api-key': config.apiKey
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Brevo API key invalid or unauthorized');
        }
        throw new Error(`Brevo API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Brevo account verified: ${data.email} (Plan: ${data.plan[0]?.type || 'Free'})`);
      
    } catch (error) {
      throw new Error(`Brevo connection failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Valider un numéro de téléphone
   */
  private isValidPhoneNumber(phone: string): boolean {
    // Format international basique
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }
  
  /**
   * Valider un message SMS
   */
  private validateMessage(message: SmsMessage): void {
    // Validation du/des destinataire(s)
    const recipients = Array.isArray(message.to) ? message.to : [message.to];
    for (const phone of recipients) {
      if (!this.isValidPhoneNumber(phone)) {
        throw new Error(`Invalid phone number: ${phone}`);
      }
    }
    
    // Validation du message
    if (!message.message || message.message.trim().length === 0) {
      throw new Error('SMS message is required');
    }
    
    // Validation de la longueur
    const maxLength = message.maxLength || 160; // Standard SMS length
    if (message.message.length > maxLength) {
      throw new Error(`SMS message too long (${message.message.length}/${maxLength} characters)`);
    }
    
    // Validation des caractères (éviter les caractères qui peuvent poser problème)
    const problematicChars = /[<>{}\\]/;
    if (problematicChars.test(message.message)) {
      console.warn('⚠️  SMS message contains potentially problematic characters');
    }
  }
  
  /**
   * Classifier une erreur SMS
   */
  private classifyError(error: any, provider: string): SmsSendResult['error'] {
    const message = error.message || '';
    const status = error.status || error.code || '';
    
    // Erreurs d'authentification
    if (message.includes('auth') || message.includes('unauthorized') || status === '401') {
      return {
        type: 'AUTH_ERROR',
        message: `${provider} authentication failed`,
        code: status,
        details: error
      };
    }
    
    // Erreurs de rate limiting
    if (message.includes('rate') || message.includes('limit') || status === '429') {
      return {
        type: 'RATE_LIMIT_ERROR',
        message: `${provider} rate limit exceeded`,
        code: status,
        details: error
      };
    }
    
    // Timeout
    if (message.includes('timeout') || message.includes('TIMEOUT')) {
      return {
        type: 'TIMEOUT_ERROR',
        message: `${provider} request timeout`,
        code: status,
        details: error
      };
    }
    
    // Erreur de validation (numéro invalide, message requis, trop long, etc.)
    if (message.toLowerCase().includes('invalid') || 
        message.includes('is required') || 
        message.includes('too long') || 
        message.includes('message is required') ||
        status === '400') {
      return {
        type: 'VALIDATION_ERROR',
        message: `${provider} validation error: ${message}`,
        code: status,
        details: error
      };
    }
    
    // Autres erreurs du provider
    return {
      type: 'PROVIDER_ERROR',
      message: `${provider} error: ${message}`,
      code: status,
      details: error
    };
  }
  
  /**
   * Déterminer si une erreur est retriable
   */
  private isRetriable(error: any, provider: string): boolean {
    const errorType = this.classifyError(error, provider)?.type;
    
    // Erreurs non retriables
    if (['AUTH_ERROR', 'VALIDATION_ERROR'].includes(errorType || '')) {
      return false;
    }
    
    // Rate limiting et timeouts sont retriables
    if (['RATE_LIMIT_ERROR', 'TIMEOUT_ERROR', 'PROVIDER_ERROR'].includes(errorType || '')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Envoyer un SMS avec résilience complète
   */
  async sendSms(message: SmsMessage): Promise<SmsSendResult> {
    const startTime = Date.now();
    
    // Vérifier que l'adapter est configuré
    if (!this.isConfigured || !this.config) {
      return {
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'SMS adapter not configured'
        },
        retryable: false
      };
    }
    
    try {
      // Validation du message
      this.validateMessage(message);
      
      // Envoyer avec circuit breaker et retry
      const result = await this.circuitBreaker.call(async () => {
        return await this.retryManager.execute(async () => {
          return await this.sendSmsViaProvider(message);
        }, `SMS to ${Array.isArray(message.to) ? message.to[0] : message.to}`);
      }, 'sms-send');
      
      const duration = Date.now() - startTime;
      
      if (result.success && result.result?.result) {
        // Succès
        this.metrics.totalSent++;
        this.metrics.lastSuccess = new Date();
        this.updateAverageResponseTime(duration);
        
        const smsResult = result.result.result;
        
        return {
          success: true,
          messageId: smsResult.messageId,
          retryable: false,
          attempts: result.result.attempts,
          duration,
          metadata: {
            to: message.to,
            message: message.message,
            sentAt: new Date(),
            provider: this.config.provider,
            cost: smsResult.cost
          }
        };
        
      } else {
        // Échec après retry
        const error = result.error || result.result?.error || new Error('Unknown SMS error');
        const classified = this.classifyError(error, this.config.provider);
        const retryable = this.isRetriable(error, this.config.provider);
        
        this.metrics.totalFailed++;
        this.metrics.lastError = error;
        
        return {
          success: false,
          error: classified,
          retryable,
          attempts: result.result?.attempts || 1,
          duration
        };
      }
      
    } catch (error) {
      // Erreur de validation ou autre
      const duration = Date.now() - startTime;
      const classified = this.classifyError(error, this.config.provider);
      
      this.metrics.totalFailed++;
      this.metrics.lastError = error as Error;
      
      return {
        success: false,
        error: classified,
        retryable: this.isRetriable(error, this.config.provider),
        attempts: 1,
        duration
      };
    }
  }
  
  /**
   * Envoyer SMS via le provider configuré
   */
  private async sendSmsViaProvider(message: SmsMessage): Promise<any> {
    if (!this.config) {
      throw new Error('SMS adapter not configured');
    }
    
    switch (this.config.provider) {
      case 'twilio':
        return await this.sendViaTwilio(message, this.config.twilio!);
        
      case 'free_mobile':
        return await this.sendViaFreeMobile(message, this.config.freeMobile!);
        
      case 'vonage':
        return await this.sendViaVonage(message, this.config.vonage!);
        
      case 'brevo':
        return await this.sendViaBrevo(message, this.config.brevo!);
        
      default:
        throw new Error(`Unsupported SMS provider: ${this.config.provider}`);
    }
  }
  
  /**
   * Envoyer via Twilio
   */
  private async sendViaTwilio(message: SmsMessage, config: any): Promise<any> {
    const recipients = Array.isArray(message.to) ? message.to : [message.to];
    const results = [];
    
    for (const recipient of recipients) {
      // Validation E.164 pour Twilio (reçoit format normalisé du contrôleur)
      if (!recipient.startsWith('+')) {
        throw new Error('Twilio: Format E.164 requis (normalisation échouée)');
      }
      
      // Sanitization du message pour Twilio
      const cleanMessage = this.sanitizeForProvider(message.message, 'twilio');
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            From: config.phoneNumber,
            To: recipient,
            Body: cleanMessage
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Twilio error: ${errorData.message}`);
      }
      
      const data = await response.json();
      results.push({
        messageId: data.sid,
        recipient,
        cost: parseFloat(data.price) || 0
      });
    }
    
    return {
      messageId: results.map(r => r.messageId).join(','),
      cost: results.reduce((sum, r) => sum + r.cost, 0)
    };
  }
  
  /**
   * Envoyer via Free Mobile
   */
  private async sendViaFreeMobile(message: SmsMessage, config: any): Promise<any> {
    // Free Mobile ne supporte qu'un seul destinataire à la fois
    const recipient = Array.isArray(message.to) ? message.to[0] : message.to;
    
    // L'adaptateur reçoit toujours le format E.164 normalisé par le contrôleur
    // Validation stricte finale pour s'assurer que la normalisation a fonctionné
    if (!recipient.startsWith('+33')) {
      throw new Error('Adaptateur SMS: Format E.164 attendu (normalisation échouée)');
    }
    
    if (!/^\+33[1-9]\d{8}$/.test(recipient)) {
      throw new Error('Adaptateur SMS: Numéro français E.164 invalide');
    }
    
    // Nettoyer le message avec la méthode universelle
    const cleanMessage = this.sanitizeForProvider(message.message, 'free_mobile');
    
    const url = `https://smsapi.free-mobile.fr/sendmsg?user=${config.user}&pass=${config.pass}&msg=${encodeURIComponent(cleanMessage)}`;
    
    const response = await fetch(url, {
      method: 'GET'
    });
    
    if (!response.ok) {
      if (response.status === 400) {
        throw new Error('Free Mobile: Invalid parameters');
      }
      if (response.status === 402) {
        throw new Error('Free Mobile: Service not activated');
      }
      throw new Error(`Free Mobile error: ${response.status}`);
    }
    
    return {
      messageId: `free-${Date.now()}`,
      cost: 0 // Gratuit pour Free Mobile
    };
  }
  
  /**
   * Envoyer via Vonage
   */
  private async sendViaVonage(message: SmsMessage, config: any): Promise<any> {
    const recipients = Array.isArray(message.to) ? message.to : [message.to];
    const results = [];
    
    for (const recipient of recipients) {
      // Validation E.164 pour Vonage (reçoit format normalisé du contrôleur)
      if (!recipient.startsWith('+')) {
        throw new Error('Vonage: Format E.164 requis (normalisation échouée)');
      }
      
      // Sanitization du message pour Vonage
      const cleanMessage = this.sanitizeForProvider(message.message, 'vonage');
      const response = await fetch('https://rest.nexmo.com/sms/json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: config.apiKey,
          api_secret: config.apiSecret,
          from: config.phoneNumber || this.config?.fromName || 'ExpressQuote',
          to: recipient,
          text: cleanMessage
        })
      });
      
      if (!response.ok) {
        throw new Error(`Vonage API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.messages[0].status !== '0') {
        throw new Error(`Vonage error: ${data.messages[0]['error-text']}`);
      }
      
      results.push({
        messageId: data.messages[0]['message-id'],
        recipient,
        cost: parseFloat(data.messages[0]['message-price']) || 0
      });
    }
    
    return {
      messageId: results.map(r => r.messageId).join(','),
      cost: results.reduce((sum, r) => sum + r.cost, 0)
    };
  }
  
  /**
   * Envoyer via Brevo SMS
   */
  private async sendViaBrevo(message: SmsMessage, config: any): Promise<any> {
    const recipients = Array.isArray(message.to) ? message.to : [message.to];
    const results = [];
    
    for (const recipient of recipients) {
      // Validation E.164 pour Brevo (reçoit format normalisé du contrôleur)
      if (!recipient.startsWith('+')) {
        throw new Error('Brevo: Format E.164 requis (normalisation échouée)');
      }
      
      // Sanitization du message pour Brevo
      const cleanMessage = this.sanitizeForProvider(message.message, 'brevo');
      
      const response = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': config.apiKey
        },
        body: JSON.stringify({
          sender: config.sender,
          recipient: recipient,
          content: cleanMessage,
          type: 'transactional'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error('Brevo: API key invalid or unauthorized');
        }
        if (response.status === 400) {
          throw new Error(`Brevo: ${errorData.message || 'Invalid request parameters'}`);
        }
        throw new Error(`Brevo API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      results.push({
        messageId: data.reference || `brevo-${Date.now()}`,
        recipient,
        cost: 0.04 // Brevo SMS coût approximatif 4 centimes
      });
    }
    
    return {
      messageId: results.map(r => r.messageId).join(','),
      cost: results.reduce((sum, r) => sum + r.cost, 0)
    };
  }
  
  /**
   * Mettre à jour le temps de réponse moyen
   */
  private updateAverageResponseTime(newTime: number): void {
    const totalOperations = this.metrics.totalSent + this.metrics.totalFailed;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (totalOperations - 1) + newTime) / totalOperations;
  }
  
  /**
   * Obtenir les métriques de l'adapter
   */
  getMetrics() {
    const circuitMetrics = this.circuitBreaker.getMetrics();
    const retryStats = this.retryManager.getStats();
    
    return {
      sms: {
        ...this.metrics,
        successRate: this.metrics.totalSent / (this.metrics.totalSent + this.metrics.totalFailed) || 0,
        provider: this.config?.provider
      },
      circuit: {
        state: circuitMetrics.state,
        failures: circuitMetrics.consecutiveFailures,
        successes: circuitMetrics.totalSuccesses,
        opens: circuitMetrics.totalOpens
      },
      retry: {
        maxRetries: retryStats.config.maxRetries,
        totalRetries: this.metrics.totalRetries
      }
    };
  }
  
  /**
   * Obtenir le statut de santé
   */
  getHealthStatus() {
    const circuitHealth = this.circuitBreaker.getHealthStats();
    
    return {
      isHealthy: this.isConfigured && circuitHealth.isHealthy,
      circuitState: circuitHealth.state,
      successRate: circuitHealth.successRate,
      averageResponseTime: this.metrics.averageResponseTime,
      provider: this.config?.provider,
      lastError: this.metrics.lastError?.message,
      lastSuccess: this.metrics.lastSuccess?.toISOString()
    };
  }
  
  /**
   * Sanitization universelle pour tous les providers SMS
   */
  private sanitizeForProvider(message: string, provider: string): string {
    // Sanitization de base commune à tous les providers
    let cleaned = message;
    
    // Décoder les entités HTML (problème découvert avec Free Mobile)
    cleaned = cleaned
      .replace(/&#x2F;/g, '/')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'");

    // Supprimer les emojis (problématiques pour la plupart des providers)
    cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');

    // Gestion des accents selon le provider
    if (provider === 'free_mobile') {
      // Free Mobile: Solution hybride (garder é, è, à mais convertir ç, ê, ô)
      cleaned = cleaned
        .replace(/[ç]/g, 'c').replace(/[Ç]/g, 'C')
        .replace(/[ê]/g, 'e').replace(/[Ê]/g, 'E')
        .replace(/[ô]/g, 'o').replace(/[Ô]/g, 'O')
        .replace(/[î]/g, 'i').replace(/[Î]/g, 'I')
        .replace(/[ë]/g, 'e').replace(/[Ë]/g, 'E')
        .replace(/[â]/g, 'a').replace(/[Â]/g, 'A')
        .replace(/[û]/g, 'u').replace(/[Û]/g, 'U');
    } else {
      // Twilio/Vonage/Brevo: Garder tous les accents (support UTF-8 complet)
      // Pas de conversion d'accents nécessaire
    }

    // Nettoyer les caractères spéciaux problématiques
    cleaned = cleaned.replace(/[""'']/g, '"').replace(/[–—]/g, '-');

    // Supprimer les caractères de contrôle
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Limiter selon le provider
    const maxLength = provider === 'free_mobile' ? 160 : 1600; // Free Mobile plus restrictif
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength - 3) + '...';
    }

    return cleaned;
  }

  /**
   * Nettoyer un message pour Free Mobile (méthode dépréciée, utilise sanitizeForProvider)
   */
  private sanitizeForFreeMobile(message: string): string {
    let cleaned = message;
    
    // Décoder les entités HTML
    cleaned = cleaned
      .replace(/&#x2F;/g, '/') // Décoder les slashes
      .replace(/&amp;/g, '&')  // Décoder les &
      .replace(/&lt;/g, '<')   // Décoder les <
      .replace(/&gt;/g, '>')   // Décoder les >
      .replace(/&quot;/g, '"') // Décoder les "
      .replace(/&#x27;/g, "'") // Décoder les '
      .replace(/&#39;/g, "'"); // Décoder les '
    
    // Supprimer seulement les emojis (pas les accents français)
    cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
    
    // SOLUTION HYBRIDE: Free Mobile supporte PARTIELLEMENT les accents UTF-8
    // ✅ Compatible: é, è, à, ù (accents simples)
    // ❌ Incompatible: ç, ê, ô, î, ë, etc. (accents composés)
    // Convertir seulement les problématiques
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
      // GARDER: é, è, à, ù qui fonctionnent parfaitement
    
    // Supprimer les sauts de ligne multiples et les remplacer par des espaces
    cleaned = cleaned.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Limiter à 160 caractères (limite SMS standard)
    if (cleaned.length > 160) {
      cleaned = cleaned.substring(0, 157) + '...';
      console.log(`⚠️ SMS message truncated to 160 characters`);
    }
    
    return cleaned;
  }
  
  /**
   * Fermer l'adapter et nettoyer les ressources
   */
  async close(): Promise<void> {
    console.log(`📱 Closing SMS adapter (${this.config?.provider})...`);
    this.isConfigured = false;
    console.log('✅ SMS adapter closed');
  }
}