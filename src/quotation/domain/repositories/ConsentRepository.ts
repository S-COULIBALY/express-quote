import { Consent } from '../entities/Consent';
import { ConsentType } from '../enums/ConsentType';

/**
 * Interface définissant les opérations de persistence pour les entités de consentement.
 */
export interface ConsentRepository {
  /**
   * Enregistre un nouveau consentement ou met à jour un consentement existant.
   * @param consent Le consentement à sauvegarder
   * @returns Le consentement sauvegardé
   */
  save(consent: Consent): Promise<Consent>;

  /**
   * Recherche le consentement le plus récent pour un utilisateur et un type donnés.
   * @param userIdentifier Identifiant de l'utilisateur (email, téléphone, etc.)
   * @param type Type de consentement recherché
   * @returns Le consentement le plus récent ou null si aucun n'est trouvé
   */
  findLatestByUserAndType(userIdentifier: string, type: ConsentType): Promise<Consent | null>;

  /**
   * Récupère tout l'historique des consentements pour un utilisateur et un type donnés.
   * @param userIdentifier Identifiant de l'utilisateur
   * @param type Type de consentement
   * @returns La liste des consentements, triés du plus récent au plus ancien
   */
  findAllByUserAndType(userIdentifier: string, type: ConsentType): Promise<Consent[]>;

  /**
   * Recherche un consentement par son identifiant unique.
   * @param id Identifiant du consentement
   * @returns Le consentement ou null s'il n'existe pas
   */
  findById(id: string): Promise<Consent | null>;

  /**
   * Récupère tous les consentements enregistrés.
   * @returns La liste complète des consentements
   */
  findAll(): Promise<Consent[]>;
} 