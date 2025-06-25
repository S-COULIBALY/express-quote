import { ProfessionalType } from '@prisma/client';

/**
 * DTO pour les informations de base d'un professionnel
 */
export interface ProfessionalDTO {
  id: string;
  name: string;
  email: string;
  phone?: string;
  businessType: ProfessionalType;
  city: string;
  isVerified: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO pour la création d'un professionnel
 */
export interface CreateProfessionalDTO {
  name: string;
  email: string;
  phone?: string;
  businessType: ProfessionalType;
  city: string;
  description?: string;
}

/**
 * DTO pour la mise à jour d'un professionnel
 */
export interface UpdateProfessionalDTO {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  businessType?: ProfessionalType;
  city?: string;
  isVerified?: boolean;
  description?: string;
}

/**
 * DTO pour la mise à jour de l'email d'un professionnel
 */
export interface UpdateProfessionalEmailDTO {
  id: string;
  email: string;
}

/**
 * DTO pour les informations simplifiées d'un professionnel (utilisé dans les listes)
 */
export interface ProfessionalSummaryDTO {
  id: string;
  name: string;
  email: string;
  businessType: ProfessionalType;
  city: string;
  isVerified: boolean;
} 