import "reflect-metadata";
import { container } from "tsyringe";
import { PrismaProfessionalRepository } from "@/quotation/infrastructure/repositories/PrismaProfessionalRepository";
import { BookingRepository } from "@/quotation/infrastructure/repositories/BookingRepository";
import { CustomerRepository } from "@/quotation/infrastructure/repositories/CustomerRepository";
import { IProfessionalRepository } from "@/quotation/domain/repositories/IProfessionalRepository";
import { IBookingRepository } from "@/quotation/domain/repositories/IBookingRepository";
import { ICustomerRepository } from "@/quotation/domain/repositories/ICustomerRepository";
// Documents module is autonomous - no IoC needed
import { IQuoteRequestRepository } from "@/quotation/domain/repositories/IQuoteRequestRepository";
import { PrismaQuoteRequestRepository } from "@/quotation/infrastructure/repositories/PrismaQuoteRequestRepository";
import { WhatsAppDistributionService } from "@/quotation/infrastructure/services/whatsapp/WhatsAppDistributionService";
import { NotificationMetricsService } from "@/quotation/infrastructure/services/NotificationMetricsService";
import { WhatsAppAnalytics } from "@/quotation/infrastructure/services/whatsapp/WhatsAppAnalytics";
import { AnalyticsService } from "@/quotation/application/services/AnalyticsService";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Configuration du container de dépendances
export function configureDependencyInjection() {
  // Base de données
  container.registerInstance(PrismaClient, prisma);

  // Repositories
  container.register<IProfessionalRepository>(
    "IProfessionalRepository",
    PrismaProfessionalRepository as any,
  );

  container.register<IBookingRepository>(
    "IBookingRepository",
    BookingRepository as any,
  );

  container.register<ICustomerRepository>(
    "ICustomerRepository",
    CustomerRepository as any,
  );

  // Documents module is autonomous - no registration needed

  container.register<IQuoteRequestRepository>(
    "IQuoteRequestRepository",
    PrismaQuoteRequestRepository as any,
  );

  // Services d'infrastructure

  container.register<WhatsAppDistributionService>(
    "WhatsAppDistributionService",
    WhatsAppDistributionService as any,
  );

  container.register<NotificationMetricsService>(
    "NotificationMetricsService",
    NotificationMetricsService as any,
  );

  container.register<WhatsAppAnalytics>(
    "WhatsAppAnalytics",
    WhatsAppAnalytics as any,
  );

  // Services applicatifs

  container.register<AnalyticsService>(
    "AnalyticsService",
    AnalyticsService as any,
  );

  console.log("✅ Configuration d'injection de dépendances terminée");
}

// Initialiser la configuration
configureDependencyInjection();

// Alias pour compatibilité
export const initializeDependencyInjection = configureDependencyInjection;

// Fonction pour obtenir une instance d'un service
export function getService<T>(token: string): T {
  return container.resolve<T>(token);
}

// Fonctions utilitaires pour obtenir les services spécifiques

// Export du container pour utilisation dans d'autres fichiers
export { container };
