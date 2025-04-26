import { PrismaClient } from '@prisma/client';
import { IProfessionalRepository } from '../../application/services/ProfessionalService';
import { Professional, ProfessionalType } from '../../domain/entities/Professional';
import { Database } from '../config/database';

export class PrismaProfessionalRepository implements IProfessionalRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = Database.getClient();
  }

  /**
   * Enregistre un professionnel en base de données
   */
  async save(professional: Professional): Promise<Professional> {
    try {
      const existingProfessional = professional.getId() 
        ? await this.prisma.professional.findUnique({ where: { id: professional.getId() } })
        : null;

      const professionalData = {
        companyName: professional.getCompanyName(),
        businessType: professional.getBusinessType(),
        email: professional.getEmail(),
        phone: professional.getPhone(),
        address: professional.getAddress() || null,
        city: professional.getCity() || null,
        postalCode: professional.getPostalCode() || null,
        country: professional.getCountry(),
        website: professional.getWebsite() || null,
        logoUrl: professional.getLogoUrl() || null,
        description: professional.getDescription() || null,
        taxIdNumber: professional.getTaxIdNumber() || null,
        insuranceNumber: professional.getInsuranceNumber() || null,
        verified: professional.isVerified(),
        verifiedAt: professional.getVerifiedAt() || null,
        rating: professional.getRating() || null,
        servicedAreas: professional.getServicedAreas() || null,
        specialties: professional.getSpecialties() || null,
        availabilities: professional.getAvailabilities() || null
      };

      if (existingProfessional) {
        // Mise à jour d'un professionnel existant
        await this.prisma.professional.update({
          where: { id: professional.getId() },
          data: professionalData
        });
        return professional;
      } else {
        // Création d'un nouveau professionnel
        const id = professional.getId() || undefined;
        const createdProfessional = await this.prisma.professional.create({
          data: {
            ...professionalData,
            id
          }
        });

        // Construction et retour du professionnel avec l'ID généré
        return this.mapDbToDomain(createdProfessional);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du professionnel:', error);
      throw new Error(`Erreur lors de la sauvegarde du professionnel: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve un professionnel par son ID
   */
  async findById(id: string): Promise<Professional | null> {
    try {
      const professional = await this.prisma.professional.findUnique({
        where: { id }
      });

      if (!professional) {
        return null;
      }

      return this.mapDbToDomain(professional);
    } catch (error) {
      console.error(`Erreur lors de la recherche du professionnel par ID ${id}:`, error);
      throw new Error(`Erreur lors de la recherche du professionnel: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve un professionnel par son email
   */
  async findByEmail(email: string): Promise<Professional | null> {
    try {
      const professional = await this.prisma.professional.findUnique({
        where: { email }
      });

      if (!professional) {
        return null;
      }

      return this.mapDbToDomain(professional);
    } catch (error) {
      console.error(`Erreur lors de la recherche du professionnel par email ${email}:`, error);
      throw new Error(`Erreur lors de la recherche du professionnel: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve les professionnels par type d'activité
   */
  async findByBusinessType(type: ProfessionalType): Promise<Professional[]> {
    try {
      const professionals = await this.prisma.professional.findMany({
        where: { businessType: type },
        orderBy: { companyName: 'asc' }
      });

      return professionals.map(pro => this.mapDbToDomain(pro));
    } catch (error) {
      console.error(`Erreur lors de la recherche des professionnels par type ${type}:`, error);
      throw new Error(`Erreur lors de la recherche des professionnels: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve les professionnels vérifiés
   */
  async findVerified(): Promise<Professional[]> {
    try {
      const professionals = await this.prisma.professional.findMany({
        where: { verified: true },
        orderBy: { companyName: 'asc' }
      });

      return professionals.map(pro => this.mapDbToDomain(pro));
    } catch (error) {
      console.error('Erreur lors de la recherche des professionnels vérifiés:', error);
      throw new Error(`Erreur lors de la recherche des professionnels: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve les professionnels par ville
   */
  async findByCity(city: string): Promise<Professional[]> {
    try {
      const professionals = await this.prisma.professional.findMany({
        where: { city: { contains: city, mode: 'insensitive' } },
        orderBy: { companyName: 'asc' }
      });

      return professionals.map(pro => this.mapDbToDomain(pro));
    } catch (error) {
      console.error(`Erreur lors de la recherche des professionnels par ville ${city}:`, error);
      throw new Error(`Erreur lors de la recherche des professionnels: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve tous les professionnels
   */
  async findAll(): Promise<Professional[]> {
    try {
      const professionals = await this.prisma.professional.findMany({
        orderBy: { companyName: 'asc' }
      });

      return professionals.map(pro => this.mapDbToDomain(pro));
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les professionnels:', error);
      throw new Error(`Erreur lors de la récupération des professionnels: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Convertit un objet professionnel de la base de données en entité du domaine
   */
  private mapDbToDomain(dbProfessional: any): Professional {
    return new Professional(
      dbProfessional.companyName,
      dbProfessional.businessType,
      dbProfessional.email,
      dbProfessional.phone,
      dbProfessional.address || undefined,
      dbProfessional.city || undefined,
      dbProfessional.postalCode || undefined,
      dbProfessional.country,
      dbProfessional.website || undefined,
      dbProfessional.logoUrl || undefined,
      dbProfessional.description || undefined,
      dbProfessional.taxIdNumber || undefined,
      dbProfessional.insuranceNumber || undefined,
      dbProfessional.id,
      dbProfessional.verified,
      dbProfessional.verifiedAt || undefined,
      dbProfessional.rating || undefined,
      dbProfessional.servicedAreas || undefined,
      dbProfessional.specialties || undefined,
      dbProfessional.availabilities || undefined
    );
  }
} 