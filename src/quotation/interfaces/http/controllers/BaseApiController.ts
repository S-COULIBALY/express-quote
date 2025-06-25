import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '@/quotation/application/services/BookingService';
import { PrismaBookingRepository } from '@/quotation/infrastructure/repositories/PrismaBookingRepository';
import { PrismaMovingRepository } from '@/quotation/infrastructure/repositories/PrismaMovingRepository';
import { PrismaPackRepository } from '@/quotation/infrastructure/repositories/PrismaPackRepository';
import { PrismaServiceRepository } from '@/quotation/infrastructure/repositories/PrismaServiceRepository';
import { PrismaCustomerRepository } from '@/quotation/infrastructure/repositories/PrismaCustomerRepository';
import { PrismaQuoteRequestRepository } from '@/quotation/infrastructure/repositories/PrismaQuoteRequestRepository';
import { CustomerService } from '@/quotation/application/services/CustomerService';
import { QuoteCalculatorBuilder } from '@/quotation/application/builders/QuoteCalculatorBuilder';
import { FallbackCalculatorService } from '@/quotation/application/services/FallbackCalculatorService';
import { ConfigurationService } from '@/quotation/domain/services/ConfigurationService';
import { QuoteCalculator } from '@/quotation/domain/calculators/MovingQuoteCalculator';
import { ServiceType } from '@/quotation/domain/enums/ServiceType';
import { logger } from '@/lib/logger';
import { PDFService } from '@/quotation/infrastructure/adapters/PDFService';
import { EmailService } from '@/quotation/infrastructure/adapters/EmailService';
import { prisma } from '@/lib/prisma';

/**
 * Contrôleur de base pour toutes les routes API
 * Factorise l'initialisation des services et la gestion des erreurs
 */
export class BaseApiController {
  // Singleton pour éviter les réinitialisations multiples
  private static instance: BaseApiController;
  
  // Services partagés
  private fallbackService: FallbackCalculatorService;
  private configService: ConfigurationService;
  
  // Repositories
  private bookingRepository: PrismaBookingRepository;
  private movingRepository: PrismaMovingRepository;
  private packRepository: PrismaPackRepository;
  private serviceRepository: PrismaServiceRepository;
  private customerRepository: PrismaCustomerRepository;
  private quoteRequestRepo: PrismaQuoteRequestRepository;
  
  // Services métier
  private customerService: CustomerService;
  private bookingServiceInstance: BookingService | null = null;
  private quoteCalculator: QuoteCalculator | null = null;
  
  // Services utilitaires
  private pdfService: PDFService;
  private emailService: EmailService;
  
  // État d'initialisation
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    console.log("🏗️ Initialisation du BaseApiController");
    
    // Initialiser les services singleton
    this.fallbackService = FallbackCalculatorService.getInstance();
    this.configService = new ConfigurationService();
    
    // Initialiser les repositories (ils utilisent le client Prisma unifié)
    this.bookingRepository = new PrismaBookingRepository();
    this.movingRepository = new PrismaMovingRepository();
    this.packRepository = new PrismaPackRepository();
    this.serviceRepository = new PrismaServiceRepository();
    this.customerRepository = new PrismaCustomerRepository();
    this.quoteRequestRepo = new PrismaQuoteRequestRepository();
    
    // Initialiser les services métier
    this.customerService = new CustomerService(this.customerRepository);
    
    // Initialiser les services utilitaires
    this.pdfService = new PDFService();
    this.emailService = new EmailService();
  }

  /**
   * Obtient l'instance unique du contrôleur (pattern Singleton)
   */
  public static getInstance(): BaseApiController {
    if (!BaseApiController.instance) {
      BaseApiController.instance = new BaseApiController();
    }
    return BaseApiController.instance;
  }

  /**
   * Initialise tous les services de manière asynchrone
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._performInitialization();
    return this.initPromise;
  }

  private async _performInitialization(): Promise<void> {
    try {
      console.log("🚀 Initialisation des services BaseApiController...");
      
      // Initialiser le calculateur via le Builder
      this.quoteCalculator = await QuoteCalculatorBuilder.create();
      console.log("✅ QuoteCalculator récupéré via Builder");
      
      // Initialiser le BookingService
      await this.ensureBookingServiceAvailable();
      console.log("✅ BookingService initialisé");
      
      this.isInitialized = true;
      console.log("✅ BaseApiController complètement initialisé");
      
    } catch (error) {
      logger.error('❌ Erreur lors de l\'initialisation du BaseApiController:', error);
      console.error('❌ Erreur lors de l\'initialisation du BaseApiController:', error);
      
      // Utiliser le fallback
      console.log("🔄 Utilisation du service fallback");
      this.quoteCalculator = this.fallbackService.createFallbackCalculator(this.configService);
      
      // Réessayer l'initialisation du BookingService avec le fallback
      await this.ensureBookingServiceAvailable();
      
      this.isInitialized = true;
      console.log("✅ BaseApiController initialisé avec fallback");
    }
  }

  /**
   * S'assure que le BookingService est disponible
   */
  private async ensureBookingServiceAvailable(): Promise<BookingService> {
    if (!this.bookingServiceInstance) {
      console.log("⚠️ BookingService non initialisé, création...");
      
      // S'assurer que le calculateur est disponible
      if (!this.quoteCalculator) {
        this.quoteCalculator = await QuoteCalculatorBuilder.create();
      }
      
      // Vérifier que le calculateur n'est pas null
      if (!this.quoteCalculator) {
        throw new Error("Impossible de créer le QuoteCalculator");
      }
      
      // Créer le service de réservation
      this.bookingServiceInstance = new BookingService(
        this.bookingRepository,
        this.movingRepository,
        this.packRepository,
        this.serviceRepository,
        this.quoteCalculator,
        this.quoteRequestRepo,
        this.customerService,
        {} as any, // transactionService
        {} as any, // documentService
        this.emailService,
        {} as any  // Paramètre supplémentaire requis
      );
      
      console.log("✅ BookingService créé avec succès");
    }
    
    return this.bookingServiceInstance;
  }

  /**
   * Obtient le BookingService initialisé
   */
  public async getBookingService(): Promise<BookingService> {
    await this.initialize();
    return this.ensureBookingServiceAvailable();
  }

  /**
   * Obtient le QuoteCalculator initialisé
   */
  public async getQuoteCalculator(): Promise<QuoteCalculator> {
    await this.initialize();
    if (!this.quoteCalculator) {
      throw new Error("QuoteCalculator non disponible après initialisation");
    }
    return this.quoteCalculator;
  }

  /**
   * Crée un calculateur pour un type de service spécifique
   */
  public async getCalculatorForService(serviceType: ServiceType): Promise<QuoteCalculator> {
    return await QuoteCalculatorBuilder.create(serviceType);
  }

  /**
   * Obtient le CustomerService
   */
  public getCustomerService(): CustomerService {
    return this.customerService;
  }

  /**
   * Obtient le PDFService
   */
  public getPDFService(): PDFService {
    return this.pdfService;
  }

  /**
   * Obtient l'EmailService
   */
  public getEmailService(): EmailService {
    return this.emailService;
  }

  /**
   * Obtient tous les repositories
   */
  public getRepositories() {
    return {
      booking: this.bookingRepository,
      moving: this.movingRepository,
      pack: this.packRepository,
      service: this.serviceRepository,
      customer: this.customerRepository,
      quoteRequest: this.quoteRequestRepo
    };
  }

  /**
   * Gestion standardisée des erreurs pour toutes les routes
   */
  public handleError(error: any, context: string = 'API'): NextResponse {
    // Protection contre les erreurs undefined ou null
    if (!error) {
      console.error(`Error in ${context}: error is null or undefined`);
      return NextResponse.json(
        { 
          error: 'Une erreur inconnue est survenue',
          context,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    // Extraire le message d'erreur de manière sécurisée
    let errorMessage = 'Erreur inconnue';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      // Tenter d'extraire un message d'un objet d'erreur
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      } else {
        try {
          errorMessage = error.toString();
        } catch {
          errorMessage = 'Erreur d\'objet inconnue';
        }
      }
    }
    
    // Logging sécurisé avec protection contre les erreurs de logger
    try {
      if (logger && typeof logger.error === 'function') {
      logger.error(`Error in ${context}:`, error);
      } else {
        console.error(`Logger unavailable in ${context}:`, error);
      }
    } catch (loggerError) {
      console.error(`Logger error in ${context}:`, loggerError);
    }
    
    console.error(`Error in ${context}:`, error);
    
    return NextResponse.json(
      { 
        error: `Une erreur est survenue: ${errorMessage}`,
        context,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }

  /**
   * Validation standardisée des requêtes
   */
  public validateRequest(body: any, requiredFields: string[]): { isValid: boolean; error?: NextResponse } {
    for (const field of requiredFields) {
      if (!body[field]) {
        return {
          isValid: false,
          error: NextResponse.json(
            { error: `Le champ '${field}' est obligatoire` },
            { status: 400 }
          )
        };
      }
    }
    
    return { isValid: true };
  }

  /**
   * Parsing sécurisé du body JSON
   */
  public async parseRequestBody(request: NextRequest): Promise<{ body?: any; error?: NextResponse }> {
    try {
      const bodyText = await request.text();
      
      if (!bodyText.trim()) {
        return {
          error: NextResponse.json(
            { error: 'Corps de la requête vide' },
            { status: 400 }
          )
        };
      }
      
      const body = JSON.parse(bodyText);
      return { body };
      
    } catch (parseError) {
      console.error('Erreur de parsing JSON:', parseError);
      return {
        error: NextResponse.json(
          { error: 'Format JSON invalide', details: String(parseError) },
          { status: 400 }
        )
      };
    }
  }

  /**
   * Logging standardisé pour les routes
   */
  public logRequest(method: string, path: string, body?: any): void {
    console.log(`\n========== ${method} ${path} ==========`);
    if (body) {
      console.log("REQUEST BODY:", JSON.stringify(body, null, 2));
    }
  }

  /**
   * Réponse de succès standardisée
   */
  public successResponse(data: any, status: number = 200): NextResponse {
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    }, { status });
  }

  /**
   * Force le rafraîchissement de tous les services
   */
  public async refresh(): Promise<void> {
    this.isInitialized = false;
    this.initPromise = null;
    this.bookingServiceInstance = null;
    this.quoteCalculator = null;
    
    // Pas besoin de rafraîchir le Builder (il n'a pas d'état)
    await this.initialize();
  }
} 