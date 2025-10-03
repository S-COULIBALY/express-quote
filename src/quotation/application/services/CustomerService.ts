import { Customer } from '../../domain/entities/Customer';
import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository';
import { IBookingRepository } from '../../domain/repositories/IBookingRepository';
import { ContactInfo } from '../../domain/valueObjects/ContactInfo';
import { ValidationError } from '../../domain/errors/ValidationError';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

interface CustomerData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface CustomerSearchParams {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  limit?: number;
  offset?: number;
}

export class CustomerService {
  constructor(
    private readonly customerRepository: ICustomerRepository,
    private readonly bookingRepository?: IBookingRepository
  ) {}

  /**
   * Crée un nouveau client
   * POST /api/customers/
   */
  async createCustomer(data: CustomerData): Promise<Customer> {
    logger.info('👤 Création d\'un nouveau client', { email: data.email });
    
    try {
      // Valider les données
      this.validateCustomerData(data);
      
      // Vérifier si le client existe déjà
      const existingCustomer = await this.customerRepository.findByEmail(data.email);
      if (existingCustomer) {
        throw new ValidationError(`Un client avec l'email ${data.email} existe déjà`);
      }
      
      // Créer le ContactInfo
      const contactInfo = new ContactInfo(
        data.firstName,
        data.lastName,
        data.email,
        data.phone || ''
      );
      
      // Créer le client
      const newCustomer = new Customer(
        crypto.randomUUID(),
        contactInfo
      );
      
      const savedCustomer = await this.customerRepository.save(newCustomer);
      
      logger.info('✅ Client créé avec succès', { 
        id: savedCustomer.getId(),
        email: savedCustomer.getEmail()
      });
      
      return savedCustomer;
    } catch (error) {
      logger.error('❌ Erreur lors de la création du client:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les clients avec pagination
   * GET /api/customers/
   */
  async getAllCustomers(limit?: number, offset?: number): Promise<{ customers: Customer[], total: number }> {
    logger.info('📋 Récupération de tous les clients');
    
    try {
      const customers = await this.customerRepository.findAll();
      
      // Pagination simple (à améliorer si besoin)
      const total = customers.length;
      const startIndex = offset || 0;
      const endIndex = limit ? startIndex + limit : customers.length;
      const paginatedCustomers = customers.slice(startIndex, endIndex);
      
      logger.info('✅ Clients récupérés', { 
        total,
        returned: paginatedCustomers.length 
      });
      
      return {
        customers: paginatedCustomers,
        total
      };
    } catch (error) {
      logger.error('❌ Erreur lors de la récupération des clients:', error);
      throw error;
    }
  }

  /**
   * Recherche des clients selon des critères
   * GET /api/customers/search
   */
  async searchCustomers(searchParams: CustomerSearchParams): Promise<Customer[]> {
    logger.info('🔍 Recherche de clients', searchParams);
    
    try {
      // Pour l'instant, récupérer tous les clients et filtrer en mémoire
      // Dans un vrai projet, on implémenterait une méthode de recherche dans le repository
      const allCustomers = await this.customerRepository.findAll();
      
      let filteredCustomers = allCustomers;
      
      // Filtrage par email
      if (searchParams.email) {
        filteredCustomers = filteredCustomers.filter(customer =>
          customer.getEmail().toLowerCase().includes(searchParams.email!.toLowerCase())
        );
      }
      
      // Filtrage par prénom
      if (searchParams.firstName) {
        filteredCustomers = filteredCustomers.filter(customer =>
          customer.getContactInfo().getFirstName().toLowerCase().includes(searchParams.firstName!.toLowerCase())
        );
      }
      
      // Filtrage par nom
      if (searchParams.lastName) {
        filteredCustomers = filteredCustomers.filter(customer =>
          customer.getContactInfo().getLastName().toLowerCase().includes(searchParams.lastName!.toLowerCase())
        );
      }
      
      // Filtrage par téléphone
      if (searchParams.phone) {
        filteredCustomers = filteredCustomers.filter(customer =>
          customer.getPhone().includes(searchParams.phone!)
        );
      }
      
      // Pagination
      const offset = searchParams.offset || 0;
      const limit = searchParams.limit || 50;
      const paginatedResults = filteredCustomers.slice(offset, offset + limit);
      
      logger.info('✅ Recherche terminée', { 
        found: filteredCustomers.length,
        returned: paginatedResults.length
      });
      
      return paginatedResults;
    } catch (error) {
      logger.error('❌ Erreur lors de la recherche de clients:', error);
      throw error;
    }
  }

  /**
   * Récupère les réservations d'un client
   * GET /api/customers/[id]/bookings
   */
  async getCustomerBookings(customerId: string): Promise<any[]> {
    logger.info('📅 Récupération des réservations client', { customerId });
    
    try {
      // Vérifier que le client existe
      const customer = await this.customerRepository.findById(customerId);
      if (!customer) {
        throw new ValidationError(`Client non trouvé: ${customerId}`);
      }
      
      // Récupérer les réservations si le repository est disponible
      if (!this.bookingRepository) {
        logger.warn('⚠️ Repository de réservations non disponible');
        return [];
      }
      
      // Supposons qu'il y a une méthode findByCustomerId dans le booking repository
      // (à implémenter si elle n'existe pas)
      const bookings = await this.bookingRepository.findByCustomerId(customerId);
      
      logger.info('✅ Réservations récupérées', { 
        customerId,
        count: bookings.length
      });
      
      return bookings;
    } catch (error) {
      logger.error('❌ Erreur lors de la récupération des réservations:', error);
      throw error;
    }
  }

  /**
   * Supprime un client
   * DELETE /api/customers/[id]
   */
  async deleteCustomer(customerId: string): Promise<boolean> {
    logger.info('🗑️ Suppression du client', { customerId });
    
    try {
      // Vérifier que le client existe
      const customer = await this.customerRepository.findById(customerId);
      if (!customer) {
        throw new ValidationError(`Client non trouvé: ${customerId}`);
      }
      
      // Vérifier s'il a des réservations actives
      if (this.bookingRepository) {
        const bookings = await this.bookingRepository.findByCustomerId(customerId);
        if (bookings.length > 0) {
          throw new ValidationError(`Impossible de supprimer le client: ${bookings.length} réservation(s) active(s)`);
        }
      }
      
      // Supprimer le client
      const deleted = await this.customerRepository.delete(customerId);
      
      if (deleted) {
        logger.info('✅ Client supprimé avec succès', { customerId });
      } else {
        logger.warn('⚠️ Client non trouvé pour suppression', { customerId });
      }
      
      return deleted;
    } catch (error) {
      logger.error('❌ Erreur lors de la suppression du client:', error);
      throw error;
    }
  }

  // === MÉTHODES EXISTANTES AMÉLIORÉES ===

  /**
   * Trouve un client par email ou en crée un nouveau
   */
  async findOrCreateCustomer(data: CustomerData): Promise<Customer> {
    logger.info('🔍 Recherche ou création client', { email: data.email });
    
    try {
      // Recherche du client par email
      const existingCustomer = await this.customerRepository.findByEmail(data.email);
      
      if (existingCustomer) {
        logger.info('✅ Client existant trouvé', { id: existingCustomer.getId() });
        return existingCustomer;
      }
      
      // Créer un nouveau client
      logger.info('➕ Création nouveau client', { email: data.email });
      return await this.createCustomer(data);
    } catch (error) {
      logger.error('❌ Erreur lors de la recherche ou création du client:', error);
      throw error;
    }
  }

  /**
   * Trouve un client par ID
   */
  async findCustomerById(id: string): Promise<Customer | null> {
    logger.info('🔍 Recherche client par ID', { id });
    
    try {
      const customer = await this.customerRepository.findById(id);
      
      if (customer) {
        logger.info('✅ Client trouvé', { id });
      } else {
        logger.info('ℹ️ Client non trouvé', { id });
      }
      
      return customer;
    } catch (error) {
      logger.error('❌ Erreur lors de la recherche du client:', error);
      throw error;
    }
  }

  /**
   * Trouve un client par email
   */
  async findCustomerByEmail(email: string): Promise<Customer | null> {
    logger.info('🔍 Recherche client par email', { email });
    
    try {
      const customer = await this.customerRepository.findByEmail(email);
      
      if (customer) {
        logger.info('✅ Client trouvé par email', { email });
      } else {
        logger.info('ℹ️ Client non trouvé par email', { email });
      }
      
      return customer;
    } catch (error) {
      logger.error('❌ Erreur lors de la recherche du client par email:', error);
      throw error;
    }
  }

  /**
   * Met à jour un client
   */
  async updateCustomer(id: string, data: Partial<CustomerData>): Promise<Customer> {
    logger.info('📝 Mise à jour client', { id });
    
    try {
      const customer = await this.customerRepository.findById(id);
      
      if (!customer) {
        throw new ValidationError(`Client non trouvé: ${id}`);
      }
      
      // Récupérer les informations de contact actuelles
      const currentContactInfo = customer.getContactInfo();
      
      // Valider les nouvelles données
      const updatedData = {
        firstName: data.firstName || currentContactInfo.getFirstName(),
        lastName: data.lastName || currentContactInfo.getLastName(),
        email: data.email || currentContactInfo.getEmail(),
        phone: data.phone || currentContactInfo.getPhone()
      };
      
      this.validateCustomerData(updatedData);
      
      // Vérifier si le nouvel email est déjà utilisé par un autre client
      if (data.email && data.email !== currentContactInfo.getEmail()) {
        const existingCustomer = await this.customerRepository.findByEmail(data.email);
        if (existingCustomer && existingCustomer.getId() !== id) {
          throw new ValidationError(`L'email ${data.email} est déjà utilisé par un autre client`);
        }
      }
      
      // Créer un nouvel objet ContactInfo avec les données mises à jour
      const updatedContactInfo = new ContactInfo(
        updatedData.firstName,
        updatedData.lastName,
        updatedData.email,
        updatedData.phone
      );
      
      // Créer une nouvelle instance avec les données mises à jour
      const updatedCustomer = new Customer(
        customer.getId(),
        updatedContactInfo
      );
      
      const savedCustomer = await this.customerRepository.update(id, updatedCustomer);
      
      logger.info('✅ Client mis à jour avec succès', { id });
      
      return savedCustomer;
    } catch (error) {
      logger.error('❌ Erreur lors de la mise à jour du client:', error);
      throw error;
    }
  }

  // === MÉTHODES PRIVÉES ===

  /**
   * Valide les données client
   */
  private validateCustomerData(data: CustomerData): void {
    if (!data.email || !data.email.trim()) {
      throw new ValidationError('L\'email est requis');
    }
    
    if (!data.firstName || !data.firstName.trim()) {
      throw new ValidationError('Le prénom est requis');
    }
    
    if (!data.lastName || !data.lastName.trim()) {
      throw new ValidationError('Le nom est requis');
    }
    
    // Validation email simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new ValidationError('Format d\'email invalide');
    }
    
    // Validation téléphone si fourni
    if (data.phone && data.phone.trim() && data.phone.length < 10) {
      throw new ValidationError('Le numéro de téléphone doit contenir au moins 10 caractères');
    }
  }

  /**
   * Crée un DTO pour la réponse API
   */
  public createCustomerDTO(customer: Customer): any {
    return {
      id: customer.getId(),
      email: customer.getEmail(),
      firstName: customer.getContactInfo().getFirstName(),
      lastName: customer.getContactInfo().getLastName(),
      phone: customer.getPhone(),
      fullName: customer.getFullName(),
      createdAt: customer.getCustomerCreatedAt(),
      lastActivity: customer.getLastActivity()
    };
  }
} 