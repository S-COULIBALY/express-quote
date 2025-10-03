/**
 * Service pour la gestion de la blacklist des professionnels
 * Gère les refus consécutifs et les sanctions temporaires
 */

import { PrismaClient } from '@prisma/client';
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

    await this.prisma.$transaction(async (tx) => {
      // 1. Récupérer ou créer l'entrée de blacklist
      let blacklistEntry = await tx.professionalBlacklist.findUnique({
        where: {
          professionalId_serviceType: {
            professionalId,
            serviceType
          }
        }
      });

      if (!blacklistEntry) {
        blacklistEntry = await tx.professionalBlacklist.create({
          data: {
            professionalId,
            serviceType,
            consecutiveRefusals: 1,
            totalRefusals: 1,
            lastRefusalAt: new Date(),
            lastAttributionId: attributionId
          }
        });
      } else {
        // 2. Incrémenter les compteurs
        await tx.professionalBlacklist.update({
          where: { id: blacklistEntry.id },
          data: {
            consecutiveRefusals: { increment: 1 },
            totalRefusals: { increment: 1 },
            lastRefusalAt: new Date(),
            lastAttributionId: attributionId
          }
        });

        blacklistEntry.consecutiveRefusals += 1;
      }

      // 3. Vérifier si blacklist nécessaire (2 refus consécutifs)
      if (blacklistEntry.consecutiveRefusals >= 2) {
        console.log(`🚫 Professionnel ${professionalId} blacklisté temporairement pour ${serviceType}`);
        
        // Blacklist temporaire : exclure seulement de cette réservation spécifique
        // (selon votre spécification : "ne plus lui attribuer la réservation qu'il a refusé")
        await tx.professionalBlacklist.update({
          where: { id: blacklistEntry.id },
          data: {
            isBlacklisted: true,
            blacklistedAt: new Date(),
            // Pas d'expiration car il devient éligible aux prochaines réservations
            blacklistExpiresAt: null
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

    await this.prisma.$transaction(async (tx) => {
      // 1. Récupérer ou créer l'entrée de blacklist
      let blacklistEntry = await tx.professionalBlacklist.findUnique({
        where: {
          professionalId_serviceType: {
            professionalId,
            serviceType
          }
        }
      });

      if (!blacklistEntry) {
        blacklistEntry = await tx.professionalBlacklist.create({
          data: {
            professionalId,
            serviceType,
            consecutiveRefusals: 0,
            totalRefusals: 0,
            lastRefusalAt: new Date(),
            lastAttributionId: attributionId
          }
        });
      }

      // 2. Une annulation = plus grave, impact immédiat
      await tx.professionalBlacklist.update({
        where: { id: blacklistEntry.id },
        data: {
          consecutiveRefusals: Math.max(2, blacklistEntry.consecutiveRefusals), // Au minimum 2 pour déclencher blacklist
          isBlacklisted: true,
          blacklistedAt: new Date(),
          lastRefusalAt: new Date(),
          lastAttributionId: attributionId
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

    await this.prisma.professionalBlacklist.updateMany({
      where: {
        professionalId,
        serviceType
      },
      data: {
        consecutiveRefusals: 0,
        isBlacklisted: false,
        blacklistedAt: null,
        blacklistExpiresAt: null
      }
    });
  }

  /**
   * Récupère la liste des professionnels blacklistés pour un type de service
   */
  async getBlacklistedProfessionals(serviceType: ServiceType): Promise<string[]> {
    const blacklistedEntries = await this.prisma.professionalBlacklist.findMany({
      where: {
        serviceType,
        isBlacklisted: true,
        // Note: Selon votre spécification, la blacklist est liée à une réservation spécifique
        // Ici on retourne ceux qui sont globalement blacklistés
        OR: [
          { blacklistExpiresAt: null }, // Pas d'expiration définie
          { blacklistExpiresAt: { gt: new Date() } } // Expiration dans le futur
        ]
      },
      select: {
        professionalId: true
      }
    });

    return blacklistedEntries.map(entry => entry.professionalId);
  }

  /**
   * Vérifie si un professionnel est blacklisté pour un service donné
   */
  async isProfessionalBlacklisted(professionalId: string, serviceType: ServiceType): Promise<boolean> {
    const blacklistEntry = await this.prisma.professionalBlacklist.findUnique({
      where: {
        professionalId_serviceType: {
          professionalId,
          serviceType
        }
      }
    });

    if (!blacklistEntry || !blacklistEntry.isBlacklisted) {
      return false;
    }

    // Vérifier l'expiration
    if (blacklistEntry.blacklistExpiresAt && blacklistEntry.blacklistExpiresAt <= new Date()) {
      // Expirée, lever la blacklist
      await this.prisma.professionalBlacklist.update({
        where: { id: blacklistEntry.id },
        data: {
          isBlacklisted: false,
          blacklistExpiresAt: null
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
    const entries = await this.prisma.professionalBlacklist.findMany({
      where: { professionalId },
      include: {
        professional: {
          select: {
            companyName: true
          }
        }
      }
    });

    const stats = entries.map(entry => ({
      serviceType: entry.serviceType,
      consecutiveRefusals: entry.consecutiveRefusals,
      totalRefusals: entry.totalRefusals,
      isBlacklisted: entry.isBlacklisted,
      blacklistedAt: entry.blacklistedAt,
      blacklistExpiresAt: entry.blacklistExpiresAt,
      lastRefusalAt: entry.lastRefusalAt
    }));

    return {
      professionalId,
      companyName: entries[0]?.professional?.companyName || 'Inconnu',
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

    await this.prisma.professionalBlacklist.updateMany({
      where: {
        professionalId,
        serviceType
      },
      data: {
        isBlacklisted: false,
        consecutiveRefusals: 0,
        blacklistedAt: null,
        blacklistExpiresAt: null
      }
    });
  }

  /**
   * Récupère tous les professionnels blacklistés (admin)
   */
  async getAllBlacklistedProfessionals() {
    const blacklisted = await this.prisma.professionalBlacklist.findMany({
      where: {
        isBlacklisted: true
      },
      include: {
        professional: {
          select: {
            companyName: true,
            email: true,
            city: true
          }
        }
      },
      orderBy: {
        blacklistedAt: 'desc'
      }
    });

    return blacklisted.map(entry => ({
      id: entry.id,
      professionalId: entry.professionalId,
      companyName: entry.professional.companyName,
      email: entry.professional.email,
      city: entry.professional.city,
      serviceType: entry.serviceType,
      consecutiveRefusals: entry.consecutiveRefusals,
      totalRefusals: entry.totalRefusals,
      blacklistedAt: entry.blacklistedAt,
      blacklistExpiresAt: entry.blacklistExpiresAt,
      lastRefusalAt: entry.lastRefusalAt
    }));
  }

  /**
   * Nettoie les blacklists expirées (tâche de maintenance)
   */
  async cleanExpiredBlacklists(): Promise<number> {
    const result = await this.prisma.professionalBlacklist.updateMany({
      where: {
        isBlacklisted: true,
        blacklistExpiresAt: {
          lte: new Date()
        }
      },
      data: {
        isBlacklisted: false,
        blacklistExpiresAt: null
      }
    });

    console.log(`🧹 ${result.count} blacklists expirées nettoyées`);
    return result.count;
  }
}