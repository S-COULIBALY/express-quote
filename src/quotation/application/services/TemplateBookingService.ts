import { Booking } from '../../domain/entities/Booking';
import { BookingType } from '../../domain/enums/BookingType';
import { Moving } from '../../domain/entities/Moving';
import { IBookingRepository } from '../../domain/repositories/IBookingRepository';
import { IMovingRepository } from '../../domain/repositories/IMovingRepository';
import { IItemRepository } from '../../domain/repositories/IItemRepository';
import { ITemplateRepository } from '../../domain/repositories/ITemplateRepository';
import { IQuoteRequestRepository } from '../../domain/repositories/IQuoteRequestRepository';
import { Money } from '../../domain/valueObjects/Money';
import { QuoteRequest } from '../../domain/entities/QuoteRequest';
import { CustomerService } from './CustomerService';
import { ServiceType } from '../../domain/enums/ServiceType';
import { Item, ItemType } from '../../domain/entities/Item';
import { Template } from '../../domain/entities/Template';
// Nouveau système de calcul modulaire
import { BaseCostEngine } from '@/quotation-module/core/BaseCostEngine';
import { FormAdapter } from '@/quotation-module/adapters/FormAdapter';
import { getAllModules } from '@/quotation-module/core/ModuleRegistry';

export class TemplateBookingService {
  private readonly baseCostEngine: BaseCostEngine;

  constructor(
    private readonly bookingRepository: IBookingRepository,
    private readonly movingRepository: IMovingRepository,
    private readonly itemRepository: IItemRepository,
    private readonly templateRepository: ITemplateRepository,
    private readonly quoteRequestRepository: IQuoteRequestRepository,
    private readonly customerService: CustomerService,
    private readonly transactionService: any,
    private readonly documentService: any,
    private readonly emailService: any,
    private readonly pdfService: any
  ) {
    this.baseCostEngine = new BaseCostEngine(getAllModules());
  }

  /**
   * Crée une demande de devis basée sur un template
   * @param templateId ID du template à utiliser
   * @param dto Données de personnalisation
   * @returns La demande de devis créée
   */
  async createQuoteFromTemplate(templateId: string, dto: any): Promise<QuoteRequest> {
    console.log('🔄 [TemplateBookingService] Début createQuoteFromTemplate avec templateId:', templateId);
    
    // Récupérer le template
    const template = await this.templateRepository.findById(templateId);
    if (!template) {
      throw new Error(`Template introuvable: ${templateId}`);
    }
    
    // Déterminer le type de demande selon le template
    const quoteType = this.mapServiceTypeToQuoteRequestType(template.getServiceType());
    
    // Créer la demande de devis
    const quoteRequest = new QuoteRequest(
      quoteType,
      { ...dto, templateId, originalTemplate: template }
    );
    
    console.log('📝 [TemplateBookingService] QuoteRequest créé:', quoteRequest.getId());
    
    // Sauvegarder la demande
    const savedQuoteRequest = await this.quoteRequestRepository.save(quoteRequest);
    
    // Créer un Item personnalisé basé sur le template
    await this.createItemFromTemplate(template, dto, savedQuoteRequest.getId());
    
    // Créer Moving si nécessaire (pour les déménagements)
    if (template.getServiceType() === 'MOVING') {
      await this.createMovingQuote(dto, savedQuoteRequest.getId());
    }
    
    console.log('✅ [TemplateBookingService] Fin createQuoteFromTemplate - QuoteRequest créé avec succès:', savedQuoteRequest.getId());
    return savedQuoteRequest;
  }

  /**
   * Crée un Item personnalisé basé sur un template
   */
  private async createItemFromTemplate(template: Template, dto: any, quoteRequestId: string): Promise<Item> {
    console.log('🔄 [TemplateBookingService] Début createItemFromTemplate pour template:', template.getId());
    
    // Déterminer le type d'item selon le service type du template
    const itemType = this.mapServiceTypeToItemType(template.getServiceType());
    
    // Calculer le prix personnalisé
    const customPrice = await this.calculateCustomPrice(template, dto);
    
    // Créer l'item personnalisé
    const item = new Item(
      crypto.randomUUID(),
      itemType,
      template.getId(), // Référence au template
      null, // customerId sera ajouté lors de la finalisation
      null, // bookingId sera ajouté lors de la finalisation
      dto.catalogId || null, // Référence au catalogSelection si applicable
      dto.name || template.getName(),
      dto.description || template.getDescription(),
      customPrice,
      dto.workers || template.getWorkers(),
      dto.duration || template.getDuration(),
      dto.features || [],
      dto.includedDistance || 0,
      dto.distanceUnit || 'km',
      dto.includes || [],
      dto.categoryId || null,
      dto.popular || false,
      dto.imagePath || null,
      true, // isActive
      'TEMPLATE_CUSTOMIZED' // status
    );
    
    const result = await this.itemRepository.save(item);
    console.log('✅ [TemplateBookingService] Item créé avec succès:', result.getId());
    return result;
  }

  /**
   * Calcule le prix personnalisé avec le système modulaire
   */
  private async calculateCustomPrice(template: Template, dto: any): Promise<Money> {
    console.log('💰 [TemplateBookingService] Calcul du prix personnalisé pour template:', template.getId());

    const basePrice = template.getBasePrice();

    try {
      // Utiliser le nouveau système de calcul modulaire
      const formData = {
        serviceType: template.getServiceType() || ServiceType.MOVING,
        templateId: template.getId(),
        duration: dto.duration || template.getDuration(),
        workers: dto.workers || template.getWorkers(),
        distance: dto.distance || 0,
        volume: dto.volume || 0,
        scheduledDate: dto.scheduledDate || dto.serviceDate,
        ...dto
      };

      const context = FormAdapter.toQuoteContext(formData);
      const result = this.baseCostEngine.execute(context);
      const finalPrice = result.baseCost || basePrice.getAmount();

      console.log(`💰 Prix final calculé avec système modulaire: ${basePrice.getAmount()}€ -> ${finalPrice}€`);
      return new Money(finalPrice);
    } catch (error) {
      console.error('❌ Erreur calcul prix, utilisation prix de base:', error);
      return basePrice;
    }
  }

  /**
   * Finalise une réservation basée sur Template/Item
   */
  async finalizeTemplateBooking(quoteRequestId: string, customerData: any): Promise<Booking> {
    console.log('🔄 [TemplateBookingService] Début finalizeTemplateBooking pour QuoteRequest:', quoteRequestId);
    
    // Récupérer la demande de devis
    const quoteRequest = await this.quoteRequestRepository.findById(quoteRequestId);
    if (!quoteRequest) {
      throw new Error(`QuoteRequest introuvable: ${quoteRequestId}`);
    }
    
    // Créer ou récupérer le client
    const customer = await this.customerService.createCustomer(customerData as any);
    
    // Récupérer l'item associé
    const items = await this.itemRepository.findByTemplateId(quoteRequest.getQuoteData().templateId);
    const item = items.find(i => i.getTemplateId() === quoteRequest.getQuoteData().templateId);
    
    if (!item) {
      throw new Error(`Item introuvable pour QuoteRequest: ${quoteRequestId}`);
    }
    
    // Créer la réservation
    const booking = new Booking(
      this.mapQuoteRequestTypeToBookingType(quoteRequest.getType()) as any,
      customer,
      null as any, // Quote sera ajouté plus tard
      new Money(item.getPrice().getAmount()),
      undefined,
      undefined,
      undefined
    );
    
    // Sauvegarder la réservation
    const savedBooking = await this.bookingRepository.save(booking);
    
    // Mettre à jour l'item avec l'ID de réservation
    await this.itemRepository.update(item.getId(), {
      ...item,
      bookingId: savedBooking.getId(),
      customerId: customer.getId()
    } as any);
    
    console.log('✅ [TemplateBookingService] Réservation finalisée avec succès:', savedBooking.getId());
    return savedBooking;
  }

  /**
   * Récupère une réservation avec ses détails Template/Item
   */
  async getTemplateBookingById(id: string): Promise<{ booking: Booking, item: Item | null, template: Template | null }> {
    console.log('🔄 [TemplateBookingService] Récupération de la réservation:', id);
    
    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new Error(`Réservation introuvable: ${id}`);
    }
    
    // Récupérer l'item associé
    const items = await this.itemRepository.findByBookingId(id);
    const item = items[0] || null;
    
    // Récupérer le template si disponible
    let template: Template | null = null;
    if (item && item.getTemplateId()) {
      template = await this.templateRepository.findById(item.getTemplateId()!);
    }
    
    return { booking, item, template };
  }

  /**
   * Met à jour une réservation Template/Item
   */
  async updateTemplateBooking(id: string, dto: any): Promise<Booking> {
    console.log('🔄 [TemplateBookingService] Mise à jour de la réservation:', id);
    
    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new Error(`Réservation introuvable: ${id}`);
    }
    
    // Mettre à jour la réservation
    const updatedBooking = await this.bookingRepository.update(booking);
    
    // Mettre à jour l'item associé si nécessaire
    if (dto.itemData) {
      const items = await this.itemRepository.findByBookingId(id);
      if (items.length > 0) {
        await this.itemRepository.update(items[0].getId(), dto.itemData);
      }
    }
    
    console.log('✅ [TemplateBookingService] Réservation mise à jour avec succès:', updatedBooking.getId());
    return updatedBooking;
  }

  /**
   * Supprime une réservation Template/Item
   */
  async deleteTemplateBooking(id: string): Promise<boolean> {
    console.log('🔄 [TemplateBookingService] Suppression de la réservation:', id);
    
    try {
      // Supprimer les items associés
      const items = await this.itemRepository.findByBookingId(id);
      for (const item of items) {
        await this.itemRepository.delete(item.getId());
      }
      
      // Supprimer la réservation
      await this.bookingRepository.hardDelete(id);
      
      console.log('✅ [TemplateBookingService] Réservation supprimée avec succès:', id);
      return true;
    } catch (error) {
      console.error('❌ [TemplateBookingService] Erreur lors de la suppression:', error);
      return false;
    }
  }

  // === MÉTHODES UTILITAIRES ===

  private mapServiceTypeToQuoteRequestType(serviceType: string): ServiceType {
    switch (serviceType.toLowerCase()) {
      case 'moving':
      case 'demenagement':
        return ServiceType.MOVING_PREMIUM;
      case 'cleaning':
      case 'menage':
        return ServiceType.CLEANING;
      case 'transport':
      case 'packing':
        return ServiceType.PACKING;
      case 'delivery':
      case 'livraison':
        return ServiceType.DELIVERY;
      default:
        return ServiceType.MOVING_PREMIUM;
    }
  }

  private mapServiceTypeToItemType(serviceType: string): ItemType {
    switch (serviceType.toLowerCase()) {
      case 'moving':
      case 'demenagement':
        return ItemType.DEMENAGEMENT;
      case 'cleaning':
      case 'menage':
        return ItemType.MENAGE;
      case 'transport':
        return ItemType.TRANSPORT;
      case 'delivery':
      case 'livraison':
        return ItemType.LIVRAISON;
      default:
        return ItemType.DEMENAGEMENT;
    }
  }

  private mapQuoteRequestTypeToBookingType(type: ServiceType): BookingType {
    switch (type) {
      case ServiceType.MOVING_PREMIUM:
        return BookingType.MOVING_QUOTE;
      case ServiceType.PACKING:
        return BookingType.PACK;
      case ServiceType.CLEANING:
      case ServiceType.DELIVERY:
        return BookingType.SERVICE;
      default:
        return BookingType.MOVING_QUOTE;
    }
  }

  private async createMovingQuote(dto: any, quoteRequestId: string): Promise<Moving> {
    console.log('🔄 [TemplateBookingService] Création Moving pour QuoteRequest:', quoteRequestId);
    
    const moving = new Moving(
      new Date(dto.moveDate || dto.scheduledDate),
      dto.pickupAddress,
      dto.deliveryAddress,
      dto.distance || 0,
      dto.volume || 0,
      quoteRequestId
    );
    
    const result = await this.movingRepository.save(moving);
    console.log('✅ [TemplateBookingService] Moving créé avec succès:', result.getId());
    return result;
  }
} 