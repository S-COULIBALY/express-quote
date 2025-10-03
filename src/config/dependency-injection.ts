import 'reflect-metadata';
import { container } from 'tsyringe';
import { PrismaProfessionalRepository } from '@/quotation/infrastructure/repositories/PrismaProfessionalRepository';
import { BookingRepository } from '@/quotation/infrastructure/repositories/BookingRepository';
import { CustomerRepository } from '@/quotation/infrastructure/repositories/CustomerRepository';
import { IProfessionalRepository } from '@/quotation/domain/repositories/IProfessionalRepository';
import { IBookingRepository } from '@/quotation/domain/repositories/IBookingRepository';
import { ICustomerRepository } from '@/quotation/domain/repositories/ICustomerRepository';
// Documents module is autonomous - no IoC needed
import { IQuoteRequestRepository } from '@/quotation/domain/repositories/IQuoteRequestRepository';
import { PrismaQuoteRequestRepository } from '@/quotation/infrastructure/repositories/PrismaQuoteRequestRepository';
import { WhatsAppDistributionService } from '@/quotation/infrastructure/services/whatsapp/WhatsAppDistributionService';
import { NotificationMetricsService } from '@/quotation/infrastructure/services/NotificationMetricsService';
import { WhatsAppAnalytics } from '@/quotation/infrastructure/services/whatsapp/WhatsAppAnalytics';
import { AnalyticsService } from '@/quotation/application/services/AnalyticsService';
import { PrismaClient } from '@prisma/client';

// Configuration du container de dépendances
export function configureDependencyInjection() {
  // Base de données
  const prisma = new PrismaClient();
  container.registerInstance(PrismaClient, prisma);

  // Repositories
  container.register<IProfessionalRepository>('IProfessionalRepository', {
    useClass: PrismaProfessionalRepository
  });
  
  container.register<IBookingRepository>('IBookingRepository', {
    useClass: BookingRepository
  });
  
  container.register<ICustomerRepository>('ICustomerRepository', {
    useClass: CustomerRepository
  });

  // Documents module is autonomous - no registration needed

  container.register<IQuoteRequestRepository>('IQuoteRequestRepository', {
    useClass: PrismaQuoteRequestRepository
  });

  // Services d'infrastructure

  container.register<WhatsAppDistributionService>('WhatsAppDistributionService', {
    useClass: WhatsAppDistributionService
  });

  container.register<NotificationMetricsService>('NotificationMetricsService', {
    useClass: NotificationMetricsService
  });



  container.register<WhatsAppAnalytics>('WhatsAppAnalytics', {
    useClass: WhatsAppAnalytics
  });

  // Services applicatifs


  container.register<AnalyticsService>('AnalyticsService', {
    useClass: AnalyticsService
  });


  console.log('✅ Configuration d\'injection de dépendances terminée');
}

// Initialiser la configuration
configureDependencyInjection();

// Fonction pour obtenir une instance d'un service
export function getService<T>(token: string): T {
  return container.resolve<T>(token);
}

// Fonctions utilitaires pour obtenir les services spécifiques

// Export du container pour utilisation dans d'autres fichiers
export { container }; 