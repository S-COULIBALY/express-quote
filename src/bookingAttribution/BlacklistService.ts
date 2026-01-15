/**
 * Service pour la gestion de la blacklist des professionnels
 * Gère les refus consécutifs et les sanctions temporaires
 */

import { PrismaClient, ServiceType as PrismaServiceType } from '@prisma/client';
import { ServiceType } from '@/quotation/domain/enums/ServiceType';

export class BlacklistService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Traite un refus de professionnel
   */
  async handleRefusal(professionalId: string, serviceType: ServiceType, attributionId: string): Promise<void> {
    console.log(`❌ Traitement refus professionnel ${professionalId} pour service ${serviceType}`);

    const prismaServiceType = serviceType as unknown as PrismaServiceType;

    await this.prisma.$transaction(async (tx) => {
      // 1. Récupérer ou créer l'entrée de blacklist
      let blacklistEntry = await tx.professional_blacklists.findUnique({
        where: {
          professional_id_service_type: {
            professional_id: professionalId,
            service_type: prismaServiceType
          }
        }
      });

      if (!blacklistEntry) {
        blacklistEntry = await tx.professional_blacklists.create({
          data: {
            id: crypto.randomUUID(),
            professional_id: professionalId,
            service_type: prismaServiceType,
            consecutive_refusals: 1,
            total_refusals: 1,
            last_refusal_at: new Date(),
            last_attribution_id: attributionId,
            updated_at: new Date()
          }
        });
      } else {
        // 2. Incrémenter les compteurs
        await tx.professional_blacklists.update({
          where: { id: blacklistEntry.id },
          data: {
            consecutive_refusals: { increment: 1 },
            total_refusals: { increment: 1 },
            last_refusal_at: new Date(),
            last_attribution_id: attributionId,
            updated_at: new Date()
          }
        });

        blacklistEntry.consecutive_refusals += 1;
      }

      // 3. Vérifier si blacklist nécessaire (2 refus consécutifs)
      if (blacklistEntry.consecutive_refusals >= 2) {
        console.log(`🚫 Professionnel ${professionalId} blacklisté temporairement pour ${serviceType}`);

        // Blacklist temporaire : exclure seulement de cette réservation spécifique
        // (selon votre spécification : "ne plus lui attribuer la réservation qu'il a refusé")
        await tx.professional_blacklists.update({
          where: { id: blacklistEntry.id },
          data: {
            is_blacklisted: true,
            blacklisted_at: new Date(),
            // Pas d'expiration car il devient éligible aux prochaines réservations
            blacklist_expires_at: null,
            updated_at: new Date()
          }
        });
      }
    });
  }

  /**
   * Traite une annulation (plus sévère qu'un refus)
   */
  async handleCancellation(professionalId: string, serviceType: ServiceType, attributionId: string): Promise<void> {
    console.log(`🚫 Traitement annulation professionnel ${professionalId} pour service ${serviceType}`);

    const prismaServiceType = serviceType as unknown as PrismaServiceType;

    await this.prisma.$transaction(async (tx) => {
      // 1. Récupérer ou créer l'entrée de blacklist
      let blacklistEntry = await tx.professional_blacklists.findUnique({
        where: {
          professional_id_service_type: {
            professional_id: professionalId,
            service_type: prismaServiceType
          }
        }
      });

      if (!blacklistEntry) {
        blacklistEntry = await tx.professional_blacklists.create({
          data: {
            id: crypto.randomUUID(),
            professional_id: professionalId,
            service_type: prismaServiceType,
            consecutive_refusals: 0,
            total_refusals: 0,
            last_refusal_at: new Date(),
            last_attribution_id: attributionId,
            updated_at: new Date()
          }
        });
      }

      // 2. Une annulation = plus grave, impact immédiat
      await tx.professional_blacklists.update({
        where: { id: blacklistEntry.id },
        data: {
          consecutive_refusals: Math.max(2, blacklistEntry.consecutive_refusals), // Au minimum 2 pour déclencher blacklist
          is_blacklisted: true,
          blacklisted_at: new Date(),
          last_refusal_at: new Date(),
          last_attribution_id: attributionId,
          updated_at: new Date()
        }
      });

      console.log(`🚫 Professionnel ${professionalId} blacklisté pour annulation`);
    });
  }

  /**
   * Remet à zéro les refus consécutifs après une acceptation
   */
  async resetConsecutiveRefusals(professionalId: string, serviceType: ServiceType): Promise<void> {
    console.log(`✅ Reset refus consécutifs pour professionnel ${professionalId}`);

    const prismaServiceType = serviceType as unknown as PrismaServiceType;

    await this.prisma.professional_blacklists.updateMany({
      where: {
        professional_id: professionalId,
        service_type: prismaServiceType
      },
      data: {
        consecutive_refusals: 0,
        is_blacklisted: false,
        blacklisted_at: null,
        blacklist_expires_at: null,
        updated_at: new Date()
      }
    });
  }

  /**
   * Récupère la liste des professionnels blacklistés pour un type de service
   */
  async getBlacklistedProfessionals(serviceType: ServiceType): Promise<string[]> {
    const prismaServiceType = serviceType as unknown as PrismaServiceType;

    const blacklistedEntries = await this.prisma.professional_blacklists.findMany({
      where: {
        service_type: prismaServiceType,
        is_blacklisted: true,
        // Note: Selon votre spécification, la blacklist est liée à une réservation spécifique
        // Ici on retourne ceux qui sont globalement blacklistés
        OR: [
          { blacklist_expires_at: null }, // Pas d'expiration définie
          { blacklist_expires_at: { gt: new Date() } } // Expiration dans le futur
        ]
      },
      select: {
        professional_id: true
      }
    });

    return blacklistedEntries.map(entry => entry.professional_id);
  }

  /**
   * Vérifie si un professionnel est blacklisté pour un service donné
   */
  async isProfessionalBlacklisted(professionalId: string, serviceType: ServiceType): Promise<boolean> {
    const prismaServiceType = serviceType as unknown as PrismaServiceType;

    const blacklistEntry = await this.prisma.professional_blacklists.findUnique({
      where: {
        professional_id_service_type: {
          professional_id: professionalId,
          service_type: prismaServiceType
        }
      }
    });

    if (!blacklistEntry || !blacklistEntry.is_blacklisted) {
      return false;
    }

    // Vérifier l'expiration
    if (blacklistEntry.blacklist_expires_at && blacklistEntry.blacklist_expires_at <= new Date()) {
      // Expirée, lever la blacklist
      await this.prisma.professional_blacklists.update({
        where: { id: blacklistEntry.id },
        data: {
          is_blacklisted: false,
          blacklist_expires_at: null,
          updated_at: new Date()
        }
      });
      return false;
    }

    return true;
  }

  /**
   * Récupère les statistiques de blacklist d'un professionnel
   */
  async getProfessionalBlacklistStats(professionalId: string) {
    const entries = await this.prisma.professional_blacklists.findMany({
      where: { professional_id: professionalId },
      include: {
        Professional: {
          select: {
            companyName: true
          }
        }
      }
    });

    const stats = entries.map(entry => ({
      serviceType: entry.service_type,
      consecutiveRefusals: entry.consecutive_refusals,
      totalRefusals: entry.total_refusals,
      isBlacklisted: entry.is_blacklisted,
      blacklistedAt: entry.blacklisted_at,
      blacklistExpiresAt: entry.blacklist_expires_at,
      lastRefusalAt: entry.last_refusal_at
    }));

    return {
      professionalId,
      companyName: entries[0]?.Professional?.companyName || 'Inconnu',
      blacklistEntries: stats,
      totalServices: stats.length,
      activeBlacklists: stats.filter(s => s.isBlacklisted).length
    };
  }

  /**
   * Lève manuellement la blacklist d'un professionnel (admin)
   */
  async removeBlacklist(professionalId: string, serviceType: ServiceType): Promise<void> {
    console.log(`🔓 Levée manuelle blacklist professionnel ${professionalId} pour ${serviceType}`);

    const prismaServiceType = serviceType as unknown as PrismaServiceType;

    await this.prisma.professional_blacklists.updateMany({
      where: {
        professional_id: professionalId,
        service_type: prismaServiceType
      },
      data: {
        is_blacklisted: false,
        consecutive_refusals: 0,
        blacklisted_at: null,
        blacklist_expires_at: null,
        updated_at: new Date()
      }
    });
  }

  /**
   * Récupère tous les professionnels blacklistés (admin)
   */
  async getAllBlacklistedProfessionals() {
    const blacklisted = await this.prisma.professional_blacklists.findMany({
      where: {
        is_blacklisted: true
      },
      include: {
        Professional: {
          select: {
            companyName: true,
            email: true,
            city: true
          }
        }
      },
      orderBy: {
        blacklisted_at: 'desc'
      }
    });

    return blacklisted.map(entry => ({
      id: entry.id,
      professionalId: entry.professional_id,
      companyName: entry.Professional.companyName,
      email: entry.Professional.email,
      city: entry.Professional.city,
      serviceType: entry.service_type,
      consecutiveRefusals: entry.consecutive_refusals,
      totalRefusals: entry.total_refusals,
      blacklistedAt: entry.blacklisted_at,
      blacklistExpiresAt: entry.blacklist_expires_at,
      lastRefusalAt: entry.last_refusal_at
    }));
  }

  /**
   * Nettoie les blacklists expirées (tâche de maintenance)
   */
  async cleanExpiredBlacklists(): Promise<number> {
    const result = await this.prisma.professional_blacklists.updateMany({
      where: {
        is_blacklisted: true,
        blacklist_expires_at: {
          lte: new Date()
        }
      },
      data: {
        is_blacklisted: false,
        blacklist_expires_at: null,
        updated_at: new Date()
      }
    });

    console.log(`🧹 ${result.count} blacklists expirées nettoyées`);
    return result.count;
  }
}
