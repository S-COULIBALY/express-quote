import type IProfessionalRepository from "@/quotation/domain/repositories/IProfessionalRepository";
import { Professional, ProfessionalType } from "../../domain/entities/Professional";
import {
  ProfessionalDTO,
  CreateProfessionalDTO,
  UpdateProfessionalDTO,
  UpdateProfessionalEmailDTO,
  ProfessionalSummaryDTO
} from "../dtos/ProfessionalDTO";
import { ContactInfo } from "../../domain/valueObjects/ContactInfo";
import { inject, injectable } from "tsyringe";
import { logger } from "@/lib/logger";
import type { ILogger } from "@/notifications/core/interfaces/ILogger";

/**
 * Service pour la gestion des professionnels
 */
@injectable()
export class ProfessionalService {
  constructor(
    @inject("IProfessionalRepository") 
    private professionalRepository: IProfessionalRepository,
    @inject("Logger")
    private logger: ILogger
  ) {}

  /**
   * Convertit un professionnel en DTO
   */
  private toProfessionalDTO(professional: Professional): ProfessionalDTO {
    return {
      id: professional.getId(),
      name: professional.getCompanyName(),
      email: professional.getEmail(),
      phone: professional.getPhone(),
      businessType: professional.getBusinessType() as any,
      city: professional.getCity() || '',
      isVerified: professional.isVerified(),
      description: professional.getDescription(),
      createdAt: professional.getCreatedAt(),
      updatedAt: professional.getUpdatedAt()
    };
  }

  /**
   * Convertit un professionnel en DTO simplifié
   */
  private toProfessionalSummaryDTO(professional: Professional): ProfessionalSummaryDTO {
    return {
      id: professional.getId(),
      name: professional.getCompanyName(),
      email: professional.getEmail(),
      businessType: professional.getBusinessType() as any,
      city: professional.getCity() || '',
      isVerified: professional.isVerified()
    };
  }

  /**
   * Crée un nouveau professionnel
   */
  async createProfessional(dto: CreateProfessionalDTO): Promise<ProfessionalDTO> {
    try {
      // ContactInfo n'est pas utilisé pour Professional (qui utilise directement email/phone)
      // On peut créer un ContactInfo vide ou utiliser les valeurs directement
      const contactInfo = new ContactInfo(
        dto.name || '',
        '',
        dto.email,
        dto.phone || ''
      );
      
      const professional = new Professional(
        dto.name,
        dto.businessType as any,
        dto.email,
        dto.phone || '',
        undefined, // address
        dto.city,
        undefined, // postalCode
        'France', // country
        undefined, // website
        undefined, // logoUrl
        dto.description,
        undefined, // taxIdNumber
        undefined, // insuranceNumber
        false, // verified
        undefined, // verifiedAt
        undefined, // rating
        undefined, // servicedAreas
        undefined, // specialties
        undefined // availabilities
      );
      
      const savedProfessional = await this.professionalRepository.create(professional);
      this.logger.info(`Professionnel créé avec succès: ${savedProfessional.getId()}`);
      
      return this.toProfessionalDTO(savedProfessional);
    } catch (error: any) {
      this.logger.error(`Erreur lors de la création du professionnel: ${error.message}`);
      throw error;
    }
  }

  /**
   * Met à jour un professionnel existant
   */
  async updateProfessional(dto: UpdateProfessionalDTO): Promise<ProfessionalDTO> {
    try {
      const professional = await this.professionalRepository.findById(dto.id);
      
      if (!professional) {
        throw new Error(`Professionnel non trouvé avec l'ID: ${dto.id}`);
      }
      
      // Professional n'utilise pas ContactInfo, mais email/phone directement
      // Utiliser updateCompanyInfo et updateAddress pour mettre à jour
      if (dto.name || dto.description !== undefined) {
        professional.updateCompanyInfo(
          dto.name,
          undefined, // website
          dto.description,
          undefined // logoUrl
        );
      }
      if (dto.city) {
        professional.updateAddress(
          undefined, // address
          dto.city,
          undefined, // postalCode
          undefined // country
        );
      }
      
      const updatedProfessional = await this.professionalRepository.update(dto.id, professional);
      this.logger.info(`Professionnel mis à jour avec succès: ${updatedProfessional.getId()}`);
      
      return this.toProfessionalDTO(updatedProfessional);
    } catch (error: any) {
      this.logger.error(`Erreur lors de la mise à jour du professionnel: ${error.message}`);
      throw error;
    }
  }

  /**
   * Trouve un professionnel par son ID
   */
  async getProfessionalById(id: string): Promise<ProfessionalDTO | null> {
    try {
      const professional = await this.professionalRepository.findById(id);
      
      if (!professional) {
        return null;
      }
      
      return this.toProfessionalDTO(professional);
    } catch (error: any) {
      this.logger.error(`Erreur lors de la recherche du professionnel: ${error.message}`);
      throw error;
    }
  }

  /**
   * Trouve tous les professionnels
   */
  async getAllProfessionals(): Promise<ProfessionalSummaryDTO[]> {
    try {
      const professionals = await this.professionalRepository.findAll();
      return professionals.map(p => this.toProfessionalSummaryDTO(p));
    } catch (error: any) {
      this.logger.error(`Erreur lors de la récupération des professionnels: ${error.message}`);
      throw error;
    }
  }

  /**
   * Trouve les professionnels par type d'activité
   */
  async getProfessionalsByBusinessType(type: ProfessionalType): Promise<ProfessionalSummaryDTO[]> {
    try {
      const allProfessionals = await this.professionalRepository.findAll();
      const professionals = allProfessionals.filter((p: any) => p.getBusinessType() === type);
      return professionals.map(p => this.toProfessionalSummaryDTO(p));
    } catch (error: any) {
      this.logger.error(`Erreur lors de la récupération des professionnels par type: ${error.message}`);
      throw error;
    }
  }

  /**
   * Trouve les professionnels vérifiés
   */
  async getVerifiedProfessionals(): Promise<ProfessionalSummaryDTO[]> {
    try {
      const allProfessionals = await this.professionalRepository.findAll();
      const professionals = allProfessionals.filter((p: any) => p.isVerified());
      return professionals.map(p => this.toProfessionalSummaryDTO(p));
    } catch (error: any) {
      this.logger.error(`Erreur lors de la récupération des professionnels vérifiés: ${error.message}`);
      throw error;
    }
  }

  /**
   * Met à jour l'email d'un professionnel
   */
  async updateProfessionalEmail(dto: UpdateProfessionalEmailDTO): Promise<ProfessionalDTO> {
    try {
      const professional = await this.professionalRepository.findById(dto.id);
      if (!professional) {
        throw new Error(`Professionnel non trouvé avec l'ID: ${dto.id}`);
      }
      professional.updateContactInfo(dto.email, professional.getPhone());
      const updatedProfessional = await this.professionalRepository.update(dto.id, professional);
      this.logger.info(`Email du professionnel mis à jour avec succès: ${updatedProfessional.getId()}`);
      
      return this.toProfessionalDTO(updatedProfessional);
    } catch (error: any) {
      this.logger.error(`Erreur lors de la mise à jour de l'email: ${error.message}`);
      throw error;
    }
  }

  /**
   * Met à jour plusieurs emails de professionnels
   */
  async updateProfessionalEmails(updates: UpdateProfessionalEmailDTO[]): Promise<number> {
    try {
      let count = 0;
      for (const update of updates) {
        try {
          await this.updateProfessionalEmail(update);
          count++;
        } catch (error: any) {
          this.logger.error(`Erreur lors de la mise à jour de l'email pour ${update.id}: ${error.message}`);
        }
      }
      const result = count;
      this.logger.info(`${result} emails de professionnels mis à jour avec succès`);
      
      return result;
    } catch (error: any) {
      this.logger.error(`Erreur lors de la mise à jour des emails: ${error.message}`);
      throw error;
    }
  }
} 