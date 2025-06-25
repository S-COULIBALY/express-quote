import { IProfessionalRepository } from "../../domain/repositories/IProfessionalRepository";
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
import { ILogger } from "@/lib/logger";

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
      name: professional.getName(),
      email: professional.getContactInfo().getEmail(),
      phone: professional.getContactInfo().getPhone(),
      businessType: professional.getBusinessType(),
      city: professional.getCity(),
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
      name: professional.getName(),
      email: professional.getContactInfo().getEmail(),
      businessType: professional.getBusinessType(),
      city: professional.getCity(),
      isVerified: professional.isVerified()
    };
  }

  /**
   * Crée un nouveau professionnel
   */
  async createProfessional(dto: CreateProfessionalDTO): Promise<ProfessionalDTO> {
    try {
      const contactInfo = new ContactInfo(dto.email, dto.phone);
      
      const professional = new Professional(
        undefined,
        dto.name,
        contactInfo,
        dto.businessType,
        dto.city,
        false, // Les nouveaux professionnels ne sont pas vérifiés par défaut
        dto.description,
        new Date(),
        new Date()
      );
      
      const savedProfessional = await this.professionalRepository.save(professional);
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
      
      if (dto.name) professional.setName(dto.name);
      if (dto.email || dto.phone) {
        const currentContactInfo = professional.getContactInfo();
        const newContactInfo = new ContactInfo(
          dto.email || currentContactInfo.getEmail(),
          dto.phone !== undefined ? dto.phone : currentContactInfo.getPhone()
        );
        professional.setContactInfo(newContactInfo);
      }
      if (dto.businessType) professional.setBusinessType(dto.businessType);
      if (dto.city) professional.setCity(dto.city);
      if (dto.isVerified !== undefined) professional.setVerified(dto.isVerified);
      if (dto.description !== undefined) professional.setDescription(dto.description);
      
      professional.setUpdatedAt(new Date());
      
      const updatedProfessional = await this.professionalRepository.save(professional);
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
      const professionals = await this.professionalRepository.findByBusinessType(type);
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
      const professionals = await this.professionalRepository.findVerified();
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
      const updatedProfessional = await this.professionalRepository.updateEmail(dto.id, dto.email);
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
      const result = await this.professionalRepository.updateEmails(updates);
      this.logger.info(`${result} emails de professionnels mis à jour avec succès`);
      
      return result;
    } catch (error: any) {
      this.logger.error(`Erreur lors de la mise à jour des emails: ${error.message}`);
      throw error;
    }
  }
} 