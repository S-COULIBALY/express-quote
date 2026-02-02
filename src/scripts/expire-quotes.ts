#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

/**
 * Script de traitement automatique des devis expirés
 * 
 * Fonctionnalités :
 * - Identification des devis expirés
 * - Marquage comme EXPIRED
 * - Nettoyage des anciens devis
 * - Analytics et métriques
 * 
 * Usage :
 * npx tsx src/scripts/expire-quotes.ts
 * 
 * Cron job recommandé :
 * 0 * * * * (toutes les heures)
 */

class QuoteExpirationProcessor {
  private readonly logger = logger.withContext('QuoteExpirationProcessor');
  private readonly prisma = new PrismaClient();

  constructor() {
    this.logger.info('🔄 Initialisation du processeur d\'expiration des devis');
  }

  /**
   * Point d'entrée principal pour traiter les devis expirés
   */
  async processExpiredQuotes(): Promise<void> {
    const startTime = Date.now();
    this.logger.info('🚀 Début du traitement des devis expirés');

    try {
      // 1. Identifier les devis expirés
      const expiredQuotes = await this.identifyExpiredQuotes();
      
      if (expiredQuotes.length === 0) {
        this.logger.info('ℹ️ Aucun devis expiré trouvé');
        return;
      }

      this.logger.info(`📊 ${expiredQuotes.length} devis expirés identifiés`);

      // 2. Traiter chaque devis expiré
      const results = await this.processQuotes(expiredQuotes);

      // 3. Envoyer les notifications de renouvellement (si email disponible)
      await this.logRenewalOpportunities(results.processedQuotes);

      // 4. Nettoyer les anciens devis
      await this.cleanupOldQuotes();

      // 5. Enregistrer les métriques
      await this.recordMetrics(results);

      const processingTime = Date.now() - startTime;
      this.logger.info(`✅ Traitement terminé en ${processingTime}ms`, {
        totalProcessed: results.processedQuotes.length,
        totalErrors: results.errors.length,
        renewalOpportunities: results.renewalOpportunities
      });

    } catch (error) {
      this.logger.error('❌ Erreur fatale lors du traitement:', error);
      throw error;
    }
  }

  /**
   * Identifie les devis expirés
   */
  private async identifyExpiredQuotes(): Promise<any[]> {
    try {
      const expiredQuotes = await this.prisma.quoteRequest.findMany({
        where: {
          expiresAt: {
            lt: new Date()
          },
          status: {
            notIn: ['EXPIRED', 'CONFIRMED', 'CONVERTED']
          }
        },
        orderBy: {
          expiresAt: 'asc'
        }
      });

      return expiredQuotes;
    } catch (error) {
      this.logger.error('❌ Erreur lors de l\'identification des devis expirés:', error);
      throw error;
    }
  }

  /**
   * Traite les devis expirés individuellement
   */
  private async processQuotes(expiredQuotes: any[]): Promise<{
    processedQuotes: any[];
    errors: Array<{ quoteId: string; error: string }>;
    renewalOpportunities: number;
  }> {
    const processedQuotes: any[] = [];
    const errors: Array<{ quoteId: string; error: string }> = [];
    let renewalOpportunities = 0;

    for (const quote of expiredQuotes) {
      try {
        // Marquer comme expiré
        await this.markAsExpired(quote.id);
        
        // Vérifier si c'est une opportunité de renouvellement
        if (this.hasContactInfo(quote)) {
          renewalOpportunities++;
        }
        
        processedQuotes.push(quote);
        this.logger.info(`✅ Devis ${quote.temporaryId} marqué comme expiré`);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        errors.push({ quoteId: quote.id, error: errorMessage });
        this.logger.error(`❌ Erreur lors du traitement du devis ${quote.temporaryId}:`, error);
      }
    }

    return { processedQuotes, errors, renewalOpportunities };
  }

  /**
   * Marque un devis comme expiré
   */
  private async markAsExpired(quoteId: string): Promise<void> {
    await this.prisma.quoteRequest.update({
      where: { id: quoteId },
      data: { 
        status: 'EXPIRED',
        updatedAt: new Date()
      }
    });
  }

  /**
   * Vérifie si un devis contient des informations de contact
   */
  private hasContactInfo(quote: any): boolean {
    const quoteData = quote.quoteData || {};
    return !!(quoteData.email || quoteData.phone || 
             quoteData.customerInfo?.email || quoteData.customerInfo?.phone);
  }

  /**
   * Log les opportunités de renouvellement
   */
  private async logRenewalOpportunities(processedQuotes: any[]): Promise<void> {
    const renewalOpportunities = processedQuotes.filter(quote => this.hasContactInfo(quote));
    
    if (renewalOpportunities.length > 0) {
      this.logger.info(`📧 ${renewalOpportunities.length} opportunités de renouvellement identifiées`);
      
      // Log des détails pour chaque opportunité
      renewalOpportunities.forEach(quote => {
        const quoteData = quote.quoteData || {};
        const customerName = this.extractCustomerName(quoteData);
        const serviceName = quote.catalogSelection?.marketingTitle || 'Service personnalisé';
        
        this.logger.info(`📬 Opportunité de renouvellement: ${quote.temporaryId}`, {
          customerName,
          serviceName,
          originalPrice: quoteData.totalPrice || quote.catalogSelection?.marketingPrice || 0,
          email: quoteData.email || quoteData.customerInfo?.email,
          phone: quoteData.phone || quoteData.customerInfo?.phone
        });
      });
    }
  }

  /**
   * Extrait le nom du client des données du devis
   */
  private extractCustomerName(quoteData: any): string {
    if (quoteData.customerInfo?.firstName && quoteData.customerInfo?.lastName) {
      return `${quoteData.customerInfo.firstName} ${quoteData.customerInfo.lastName}`;
    }
    
    if (quoteData.firstName && quoteData.lastName) {
      return `${quoteData.firstName} ${quoteData.lastName}`;
    }
    
    return 'Client';
  }

  /**
   * Nettoie les anciens devis expirés
   */
  private async cleanupOldQuotes(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // Supprimer les devis expirés depuis plus de 30 jours

      const result = await this.prisma.quoteRequest.deleteMany({
        where: {
          status: 'EXPIRED',
          updatedAt: {
            lt: cutoffDate
          }
        }
      });

      if (result.count > 0) {
        this.logger.info(`🧹 ${result.count} anciens devis supprimés`);
      }

    } catch (error) {
      this.logger.error('❌ Erreur lors du nettoyage des anciens devis:', error);
    }
  }

  /**
   * Enregistre les métriques du traitement
   */
  private async recordMetrics(results: any): Promise<void> {
    try {
      const metrics = {
        totalProcessed: results.processedQuotes.length,
        totalErrors: results.errors.length,
        renewalOpportunities: results.renewalOpportunities,
        processingDate: new Date().toISOString()
      };

      this.logger.info('📊 Métriques du traitement:', metrics);

      // Optionnel : Enregistrer dans une table de métriques
      // await this.prisma.systemMetrics.create({
      //   data: {
      //     type: 'quote_expiration_processing',
      //     data: metrics
      //   }
      // });

    } catch (error) {
      this.logger.error('❌ Erreur lors de l\'enregistrement des métriques:', error);
    }
  }

  /**
   * Nettoyage des ressources
   */
  async cleanup(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.logger.info('🧹 Nettoyage terminé');
    } catch (error) {
      this.logger.error('❌ Erreur lors du nettoyage:', error);
    }
  }
}

/**
 * Fonction principale pour exécution en script
 */
async function main() {
  const processor = new QuoteExpirationProcessor();
  
  try {
    await processor.processExpiredQuotes();
    process.exit(0);
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  } finally {
    await processor.cleanup();
  }
}

// Exécuter le script si lancé directement
if (require.main === module) {
  main();
}

export { QuoteExpirationProcessor }; 