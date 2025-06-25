import { Professional, ProfessionalType } from '../entities/Professional';

/**
 * Interface pour le repository des professionnels
 * Définit les méthodes pour accéder et manipuler les professionnels dans la base de données
 */
export interface IProfessionalRepository {
  /**
   * Enregistre un professionnel en base de données
   * @param professional Professionnel à sauvegarder
   * @returns Le professionnel sauvegardé avec son ID
   */
  save(professional: Professional): Promise<Professional>;
  
  /**
   * Trouve un professionnel par son ID
   * @param id ID du professionnel à rechercher
   * @returns Le professionnel trouvé ou null
   */
  findById(id: string): Promise<Professional | null>;
  
  /**
   * Trouve un professionnel par son email
   * @param email Email du professionnel à rechercher
   * @returns Le professionnel trouvé ou null
   */
  findByEmail(email: string): Promise<Professional | null>;
  
  /**
   * Trouve les professionnels par type d'activité
   * @param type Type d'activité des professionnels à rechercher
   * @returns Liste des professionnels correspondant au type
   */
  findByBusinessType(type: ProfessionalType): Promise<Professional[]>;
  
  /**
   * Trouve les professionnels vérifiés
   * @returns Liste des professionnels vérifiés
   */
  findVerified(): Promise<Professional[]>;
  
  /**
   * Trouve les professionnels par ville
   * @param city Ville des professionnels à rechercher
   * @returns Liste des professionnels correspondant à la ville
   */
  findByCity(city: string): Promise<Professional[]>;
  
  /**
   * Trouve tous les professionnels
   * @returns Liste de tous les professionnels
   */
  findAll(): Promise<Professional[]>;
  
  /**
   * Met à jour l'email d'un professionnel
   * @param id ID du professionnel à mettre à jour
   * @param email Nouvel email
   * @returns Le professionnel mis à jour
   */
  updateEmail(id: string, email: string): Promise<Professional>;
  
  /**
   * Met à jour plusieurs emails de professionnels en une seule opération
   * @param updates Liste des mises à jour (ID et email)
   * @returns Nombre de professionnels mis à jour
   */
  updateEmails(updates: { id: string; email: string }[]): Promise<number>;
} 