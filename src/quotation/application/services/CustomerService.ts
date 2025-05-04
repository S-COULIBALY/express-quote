import { Customer } from '../../domain/entities/Customer';
import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository';
import { ContactInfo } from '../../domain/valueObjects/ContactInfo';
import crypto from 'crypto';

interface CustomerData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export class CustomerService {
  constructor(private readonly customerRepository: ICustomerRepository) {}

  /**
   * Trouve un client par email ou en crée un nouveau
   */
  async findOrCreateCustomer(data: CustomerData): Promise<Customer> {
    try {
      // Recherche du client par email
      const existingCustomer = await this.customerRepository.findByEmail(data.email);
      
      if (existingCustomer) {
        return existingCustomer;
      }
      
      // Création du ContactInfo pour le nouveau client
      const contactInfo = new ContactInfo(
        data.firstName,
        data.lastName,
        data.email,
        data.phone || ''
      );
      
      // Création d'un nouveau client avec le bon constructeur
      const newCustomer = new Customer(
        crypto.randomUUID(), // Génération d'un nouvel ID
        contactInfo
      );
      
      return this.customerRepository.save(newCustomer);
    } catch (error) {
      console.error('Erreur lors de la recherche ou création du client:', error);
      throw new Error(`Erreur lors de la recherche ou création du client: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve un client par ID
   */
  async findCustomerById(id: string): Promise<Customer | null> {
    try {
      return this.customerRepository.findById(id);
    } catch (error) {
      console.error(`Erreur lors de la recherche du client ${id}:`, error);
      throw new Error(`Erreur lors de la recherche du client: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve un client par email
   */
  async findCustomerByEmail(email: string): Promise<Customer | null> {
    try {
      return this.customerRepository.findByEmail(email);
    } catch (error) {
      console.error(`Erreur lors de la recherche du client avec l'email ${email}:`, error);
      throw new Error(`Erreur lors de la recherche du client: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Met à jour un client
   */
  async updateCustomer(id: string, data: Partial<CustomerData>): Promise<Customer> {
    try {
      const customer = await this.customerRepository.findById(id);
      
      if (!customer) {
        throw new Error(`Client non trouvé: ${id}`);
      }
      
      // Récupérer les informations de contact actuelles
      const currentContactInfo = customer.getContactInfo();
      
      // Créer un nouvel objet ContactInfo avec les données mises à jour
      const updatedContactInfo = new ContactInfo(
        data.firstName || currentContactInfo.getFirstName(),
        data.lastName || currentContactInfo.getLastName(),
        data.email || currentContactInfo.getEmail(),
        data.phone || currentContactInfo.getPhone() || ''
      );
      
      // Créer une nouvelle instance avec les données mises à jour
      const updatedCustomer = new Customer(
        customer.getId(),
        updatedContactInfo
      );
      
      return this.customerRepository.update(id, updatedCustomer);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du client ${id}:`, error);
      throw new Error(`Erreur lors de la mise à jour du client: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }
} 