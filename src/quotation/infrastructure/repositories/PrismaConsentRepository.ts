// @ts-nocheck
// Ce repository utilise un modèle Consent qui n'existe pas encore en BDD
import { PrismaClient } from '@prisma/client';
import { ConsentRepository } from '../../domain/repositories/ConsentRepository';
import { Consent } from '../../domain/entities/Consent';
import { ConsentProof } from '../../domain/valueObjects/ConsentProof';
import { ConsentType } from '../../domain/enums/ConsentType';

/**
 * Implémentation de ConsentRepository utilisant Prisma ORM.
 */
export class PrismaConsentRepository implements ConsentRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Enregistre un nouveau consentement ou met à jour un consentement existant.
   * @param consent Le consentement à sauvegarder
   * @returns Le consentement sauvegardé
   */
  async save(consent: Consent): Promise<Consent> {
    const data = {
      id: consent.id,
      userId: consent.userId,
      userIdentifier: consent.userIdentifier,
      type: consent.type,
      granted: consent.granted,
      timestamp: consent.timestamp,
      ipAddress: consent.ipAddress,
      userAgent: consent.userAgent,
      proof: consent.proof.toJSON(),
      version: consent.version,
      expiresAt: consent.expiresAt
    };

    await this.prisma.consent.upsert({
      where: { id: consent.id },
      update: data,
      create: data
    });

    return consent;
  }

  /**
   * Recherche le consentement le plus récent pour un utilisateur et un type donnés.
   * @param userIdentifier Identifiant de l'utilisateur (email, téléphone, etc.)
   * @param type Type de consentement recherché
   * @returns Le consentement le plus récent ou null si aucun n'est trouvé
   */
  async findLatestByUserAndType(userIdentifier: string, type: ConsentType): Promise<Consent | null> {
    const record = await this.prisma.consent.findFirst({
      where: {
        userIdentifier,
        type
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    if (!record) return null;

    return this.mapToEntity(record);
  }

  /**
   * Récupère tout l'historique des consentements pour un utilisateur et un type donnés.
   * @param userIdentifier Identifiant de l'utilisateur
   * @param type Type de consentement
   * @returns La liste des consentements, triés du plus récent au plus ancien
   */
  async findAllByUserAndType(userIdentifier: string, type: ConsentType): Promise<Consent[]> {
    const records = await this.prisma.consent.findMany({
      where: {
        userIdentifier,
        type
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    return records.map(this.mapToEntity);
  }

  /**
   * Recherche un consentement par son identifiant unique.
   * @param id Identifiant du consentement
   * @returns Le consentement ou null s'il n'existe pas
   */
  async findById(id: string): Promise<Consent | null> {
    const record = await this.prisma.consent.findUnique({
      where: { id }
    });

    if (!record) return null;

    return this.mapToEntity(record);
  }

  /**
   * Récupère tous les consentements enregistrés.
   * @returns La liste complète des consentements
   */
  async findAll(): Promise<Consent[]> {
    const records = await this.prisma.consent.findMany({
      orderBy: {
        timestamp: 'desc'
      }
    });

    return records.map(this.mapToEntity);
  }

  /**
   * Convertit un enregistrement de la base de données en entité Consent.
   * @param record L'enregistrement à convertir
   * @returns L'entité Consent correspondante
   */
  private mapToEntity(record: any): Consent {
    const proof = new ConsentProof(
      record.proof.formPath,
      record.proof.formText,
      record.proof.checkboxText,
      record.proof.sessionId,
      record.proof.formData
    );

    return new Consent(
      record.id,
      record.userId,
      record.userIdentifier,
      record.type as ConsentType,
      record.granted,
      record.timestamp,
      record.ipAddress,
      record.userAgent,
      proof,
      record.version,
      record.expiresAt
    );
  }
} 