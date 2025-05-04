import { PrismaClient } from '@prisma/client';
import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository';
import { Customer } from '../../domain/entities/Customer';
import { Database } from '../config/database';
import { ContactInfo } from '../../domain/valueObjects/ContactInfo';

export class PrismaCustomerRepository implements ICustomerRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = Database.getClient();
  }

  /**
   * Enregistre un client en base de données
   */
  async save(customer: Customer): Promise<Customer> {
    try {
      const contactInfo = customer.getContactInfo();
      const existingCustomer = customer.getId() 
        ? await this.prisma.customer.findUnique({ where: { id: customer.getId() } })
        : null;

      const customerData = {
        email: contactInfo.getEmail(),
        firstName: contactInfo.getFirstName(),
        lastName: contactInfo.getLastName(),
        phone: contactInfo.getPhone() || null,
      };

      if (existingCustomer) {
        // Mise à jour d'un client existant
        await this.prisma.customer.update({
          where: { id: customer.getId() },
          data: customerData
        });
        return customer;
      } else {
        // Création d'un nouveau client
        const id = customer.getId() || undefined;
        const createdCustomer = await this.prisma.customer.create({
          data: {
            ...customerData,
            id
          }
        });

        // Retourne le client avec l'ID généré
        const newContactInfo = new ContactInfo(
          createdCustomer.firstName,
          createdCustomer.lastName,
          createdCustomer.email,
          createdCustomer.phone || ''
        );
        
        return new Customer(
          createdCustomer.id,
          newContactInfo
        );
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du client:', error);
      throw new Error(`Erreur lors de la sauvegarde du client: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve un client par son ID
   */
  async findById(id: string): Promise<Customer | null> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id }
      });

      if (!customer) {
        return null;
      }

      const contactInfo = new ContactInfo(
        customer.firstName,
        customer.lastName,
        customer.email,
        customer.phone || ''
      );
      
      return new Customer(
        customer.id,
        contactInfo
      );
    } catch (error) {
      console.error(`Erreur lors de la recherche du client par ID ${id}:`, error);
      throw new Error(`Erreur lors de la recherche du client: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve un client par son email
   */
  async findByEmail(email: string): Promise<Customer | null> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { email }
      });

      if (!customer) {
        return null;
      }

      const contactInfo = new ContactInfo(
        customer.firstName,
        customer.lastName,
        customer.email,
        customer.phone || ''
      );
      
      return new Customer(
        customer.id,
        contactInfo
      );
    } catch (error) {
      console.error(`Erreur lors de la recherche du client par email ${email}:`, error);
      throw new Error(`Erreur lors de la recherche du client: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve tous les clients
   */
  async findAll(): Promise<Customer[]> {
    try {
      const customers = await this.prisma.customer.findMany({
        orderBy: { createdAt: 'desc' }
      });

      return customers.map(customer => {
        const contactInfo = new ContactInfo(
          customer.firstName,
          customer.lastName,
          customer.email,
          customer.phone || ''
        );
        
        return new Customer(
          customer.id,
          contactInfo
        );
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les clients:', error);
      throw new Error(`Erreur lors de la récupération des clients: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Met à jour un client existant
   */
  async update(id: string, customer: Customer): Promise<Customer> {
    try {
      // Vérifier que le client existe
      const existingCustomer = await this.prisma.customer.findUnique({ 
        where: { id } 
      });
      
      if (!existingCustomer) {
        throw new Error(`Client avec l'ID ${id} non trouvé`);
      }

      const contactInfo = customer.getContactInfo();
      
      // Mettre à jour le client
      await this.prisma.customer.update({
        where: { id },
        data: {
          email: contactInfo.getEmail(),
          firstName: contactInfo.getFirstName(),
          lastName: contactInfo.getLastName(),
          phone: contactInfo.getPhone() || null,
        }
      });

      // Retourner le client mis à jour
      return customer;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du client ${id}:`, error);
      throw new Error(`Erreur lors de la mise à jour du client: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Supprime un client par son ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      // Vérifier que le client existe
      const existingCustomer = await this.prisma.customer.findUnique({ 
        where: { id } 
      });
      
      if (!existingCustomer) {
        return false;
      }

      // Supprimer le client
      await this.prisma.customer.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression du client ${id}:`, error);
      throw new Error(`Erreur lors de la suppression du client: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }
} 