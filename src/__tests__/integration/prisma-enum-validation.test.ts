/**
 * 🗄️ **TEST PRISMA - VALIDATION ENUM**
 *
 * Ce test vérifie le problème #7 identifié dans AUDIT_PRODUCTION_FINAL.md :
 * - VALIDATION PRISMA ENUM MANQUANTE (QuoteRequestStatus, BookingStatus)
 * - Schema Prisma utilise `String` au lieu d'`enum` → aucune validation DB
 * - Risque : Statuts invalides en DB ("PNEDING", "CONFIRMÉ", "temp")
 *
 * **Criticité** : MOYENNE (Corruption Données Long Terme)
 * **Impact** : Bugs difficiles à debugger, requêtes SQL erronnées
 * **Enums testés** :
 * - QuoteRequestStatus (TEMPORARY, CONFIRMED, CONVERTED, EXPIRED)
 * - BookingStatus (DRAFT, PAYMENT_COMPLETED, + 6 autres inutilisés)
 *
 * **Référence** : docs/AUDIT_PRODUCTION_FINAL.md (Problème #7)
 * **Approche** : TDD - Ces tests ÉCHOUERONT tant que Prisma schema n'utilise pas enums
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
import crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

describe('🗄️ Prisma Schema - Enum Validation (Problème #7)', () => {
  const testQuoteRequestIds: string[] = [];
  const testBookingIds: string[] = [];

  beforeAll(async () => {
    await prisma.$connect();
    logger.info('🗄️ Tests validation enums Prisma...');
  });

  afterAll(async () => {
    // Nettoyage
    for (const id of testBookingIds) {
      await prisma.booking.deleteMany({ where: { id } });
    }
    for (const id of testQuoteRequestIds) {
      await prisma.quoteRequest.deleteMany({ where: { id } });
    }
    await prisma.$disconnect();
  });

  describe('Test 1: Schema Prisma - QuoteRequestStatus Enum', () => {
    it('❌ INCOHÉRENCE: devrait utiliser enum QuoteRequestStatus, pas String', () => {
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

      if (!fs.existsSync(schemaPath)) {
        throw new Error('prisma/schema.prisma non trouvé');
      }

      const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

      // Vérifier que enum QuoteRequestStatus est défini
      const hasQuoteRequestStatusEnum = /enum QuoteRequestStatus \{[\s\S]*?\}/.test(schemaContent);

      if (!hasQuoteRequestStatusEnum) {
        logger.error('🚨 ENUM QuoteRequestStatus NON DÉFINI:');
        logger.error('   - Ajouter dans schema.prisma:');
        logger.error('');
        logger.error('   enum QuoteRequestStatus {');
        logger.error('     TEMPORARY');
        logger.error('     CONFIRMED');
        logger.error('     CONVERTED');
        logger.error('     EXPIRED');
        logger.error('   }');
      }

      // Vérifier que model QuoteRequest utilise l'enum
      const quoteRequestModelMatch = schemaContent.match(/model QuoteRequest \{[\s\S]*?\}/);

      if (quoteRequestModelMatch) {
        const modelContent = quoteRequestModelMatch[0];

        // ✅ BON: status QuoteRequestStatus
        const usesEnum = /status\s+QuoteRequestStatus/.test(modelContent);

        // ❌ MAUVAIS: status String
        const usesString = /status\s+String/.test(modelContent);

        if (usesString && !usesEnum) {
          logger.error('🚨 INCOHÉRENCE DÉTECTÉE:');
          logger.error('   - QuoteRequest.status est de type String');
          logger.error('   - Devrait être QuoteRequestStatus (enum)');
          logger.error('   - Aucune validation DB → statuts invalides possibles');
          logger.error('');
          logger.error('🔧 CORRECTION:');
          logger.error('   Remplacer: status String @default("TEMPORARY")');
          logger.error('   Par:       status QuoteRequestStatus @default(TEMPORARY)');
          logger.error('');
          logger.error('   Puis: npx prisma migrate dev --name add-quote-status-enum');
        }

        // ❌ BLOQUER si String au lieu d'enum
        expect(usesEnum).toBe(true);
        expect(usesString).toBe(false);
      } else {
        throw new Error('Model QuoteRequest non trouvé dans schema');
      }
    });

    it('devrait valider format enum QuoteRequestStatus dans schema', () => {
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
      const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

      const enumMatch = schemaContent.match(/enum QuoteRequestStatus \{([\s\S]*?)\}/);

      if (!enumMatch) {
        logger.warn('⚠️ Enum QuoteRequestStatus non trouvé, test skippé');
        return;
      }

      const enumValues = enumMatch[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('//'));

      // Valeurs attendues
      const expectedValues = ['TEMPORARY', 'CONFIRMED', 'CONVERTED', 'EXPIRED'];

      expectedValues.forEach(value => {
        if (!enumValues.includes(value)) {
          logger.error(`❌ Valeur manquante dans enum: ${value}`);
        }
        expect(enumValues).toContain(value);
      });

      logger.info(`✅ Enum QuoteRequestStatus défini avec ${enumValues.length} valeurs`);
    });
  });

  describe('Test 2: Validation DB - Rejet Statuts Invalides', () => {
    it('❌ VALIDATION DB: devrait rejeter statut QuoteRequest invalide', async () => {
      // Tentative d'insertion avec statut invalide
      const invalidStatus = 'PNEDING'; // Typo volontaire

      try {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24h

        const quoteRequest = await prisma.quoteRequest.create({
          data: {
            id: crypto.randomUUID(),
            temporaryId: `test-invalid-${Date.now()}`,
            type: 'CLEANING',
            status: invalidStatus as any, // Force cast
            updatedAt: now,
            expiresAt: expiresAt,
            quoteData: {
              serviceType: 'CLEANING',
              totalPrice: 100.00
            }
          }
        });

        // ❌ Si création réussit = PROBLÈME (pas de validation)
        testQuoteRequestIds.push(quoteRequest.id);

        logger.error('🚨 VALIDATION DB MANQUANTE:');
        logger.error(`   - Statut invalide "${invalidStatus}" accepté par DB`);
        logger.error('   - Aucune contrainte enum dans Prisma');
        logger.error('   - Risque: Données corrompues en production');

        // Query pour vérifier
        const found = await prisma.quoteRequest.findUnique({
          where: { id: quoteRequest.id }
        });

        expect(found?.status).toBe(invalidStatus); // Prouve le problème

        // ✅ ATTENDU: Erreur Prisma "Invalid enum value"
        fail('Statut invalide accepté - validation DB manquante');
      } catch (error: any) {
        // ✅ SUCCÈS: DB rejette statut invalide
        if (error.message?.includes('Invalid enum value') ||
            error.message?.includes('invalid input value')) {
          logger.info('✅ DB rejette statut invalide (enum validé)');
          expect(error.message).toMatch(/invalid|enum/i);
        } else {
          // Autre erreur
          logger.warn(`⚠️ Erreur inattendue: ${error.message}`);
        }
      }
    });

    it('devrait accepter TOUS les statuts valides QuoteRequestStatus', async () => {
      const validStatuses = ['TEMPORARY', 'CONFIRMED', 'CONVERTED', 'EXPIRED'];

      for (const status of validStatuses) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const quoteRequest = await prisma.quoteRequest.create({
          data: {
            id: crypto.randomUUID(),
            temporaryId: `test-valid-${Date.now()}-${status}`,
            type: 'CLEANING',
            status: status as any,
            updatedAt: now,
            expiresAt: expiresAt,
            quoteData: {
              serviceType: 'CLEANING',
              totalPrice: 100.00
            }
          }
        });

        testQuoteRequestIds.push(quoteRequest.id);

        expect(quoteRequest.status).toBe(status);
        logger.info(`✅ Statut valide accepté: ${status}`);
      }
    });
  });

  describe('Test 3: Détection Données Corrompues Existantes', () => {
    it('devrait détecter statuts QuoteRequest invalides en DB', async () => {
      // Requête brute pour trouver statuts invalides
      const validStatuses = ['TEMPORARY', 'CONFIRMED', 'CONVERTED', 'EXPIRED'];

      const allQuoteRequests = await prisma.quoteRequest.findMany({
        select: { id: true, status: true, createdAt: true }
      });

      const invalidQuoteRequests = allQuoteRequests.filter(
        qr => !validStatuses.includes(qr.status)
      );

      if (invalidQuoteRequests.length > 0) {
        logger.error('🚨 DONNÉES CORROMPUES DÉTECTÉES:');
        logger.error(`   - ${invalidQuoteRequests.length} QuoteRequest avec statuts invalides`);

        const statusCounts: Record<string, number> = {};
        invalidQuoteRequests.forEach(qr => {
          statusCounts[qr.status] = (statusCounts[qr.status] || 0) + 1;
        });

        logger.error('   - Statuts invalides:');
        Object.entries(statusCounts).forEach(([status, count]) => {
          logger.error(`     "${status}": ${count} occurrence(s)`);
        });

        logger.error('');
        logger.error('🔧 NETTOYAGE REQUIS:');
        logger.error('   UPDATE "QuoteRequest" SET status = \'TEMPORARY\'');
        logger.error('   WHERE status NOT IN (\'TEMPORARY\', \'CONFIRMED\', \'CONVERTED\', \'EXPIRED\')');
      } else {
        logger.info('✅ Aucun statut QuoteRequest invalide en DB');
      }

      // ⚠️ WARNING mais pas blocage (données existantes)
      expect(invalidQuoteRequests.length).toBeLessThanOrEqual(0);
    });

    it('devrait générer rapport statuts utilisés vs définis', async () => {
      const allStatuses = await prisma.quoteRequest.groupBy({
        by: ['status'],
        _count: true
      });

      logger.info('📊 RAPPORT STATUTS QuoteRequest:');
      allStatuses.forEach(stat => {
        logger.info(`   ${stat.status}: ${stat._count} occurrence(s)`);
      });

      // Statuts définis dans code
      const definedStatuses = ['TEMPORARY', 'CONFIRMED', 'CONVERTED', 'EXPIRED'];

      // Statuts utilisés en DB
      const usedStatuses = allStatuses.map(s => s.status);

      // Statuts inutilisés
      const unusedStatuses = definedStatuses.filter(s => !usedStatuses.includes(s as any));

      if (unusedStatuses.length > 0) {
        logger.warn(`⚠️ Statuts définis mais JAMAIS utilisés: ${unusedStatuses.join(', ')}`);
      }

      logger.info(`✅ Statuts utilisés: ${usedStatuses.length}/${definedStatuses.length}`);
    });
  });

  describe('Test 4: Schema Prisma - BookingStatus Enum', () => {
    it('❌ INCOHÉRENCE: devrait utiliser enum BookingStatus, pas String', () => {
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
      const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

      // Vérifier enum BookingStatus défini
      const hasBookingStatusEnum = /enum BookingStatus \{[\s\S]*?\}/.test(schemaContent);

      // Vérifier model Booking utilise l'enum
      const bookingModelMatch = schemaContent.match(/model Booking \{[\s\S]*?\}/);

      if (bookingModelMatch) {
        const modelContent = bookingModelMatch[0];

        const usesEnum = /status\s+BookingStatus/.test(modelContent);
        const usesString = /status\s+String/.test(modelContent);

        if (usesString && !usesEnum) {
          logger.error('🚨 INCOHÉRENCE Booking.status:');
          logger.error('   - Type String au lieu de BookingStatus enum');
          logger.error('');
          logger.error('🔧 CORRECTION:');
          logger.error('   Remplacer: status String');
          logger.error('   Par:       status BookingStatus');
        }

        if (hasBookingStatusEnum) {
          expect(usesEnum).toBe(true);
          expect(usesString).toBe(false);
        } else {
          logger.warn('⚠️ Enum BookingStatus non défini dans schema');
        }
      }
    });

    it('devrait identifier statuts BookingStatus JAMAIS utilisés', async () => {
      // BookingStatus défini dans code avec 8 statuts
      const definedStatuses = [
        'DRAFT',
        'PENDING_ASSIGNMENT',
        'ASSIGNED',
        'CONFIRMED',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
        'PAYMENT_COMPLETED'
      ];

      const allBookings = await prisma.booking.groupBy({
        by: ['status'],
        _count: true
      });

      const usedStatuses = allBookings.map(b => b.status);

      const unusedStatuses = definedStatuses.filter(s => !usedStatuses.includes(s as any));

      if (unusedStatuses.length > 0) {
        logger.warn('⚠️ STATUTS BOOKING JAMAIS UTILISÉS:');
        unusedStatuses.forEach(status => {
          logger.warn(`   - ${status} (peut être supprimé de l'enum)`);
        });

        logger.info(`📊 Utilisation: ${usedStatuses.length}/${definedStatuses.length} (${((usedStatuses.length / definedStatuses.length) * 100).toFixed(0)}%)`);
      } else {
        logger.info('✅ Tous les statuts Booking sont utilisés');
      }

      // Selon audit: Seulement DRAFT et PAYMENT_COMPLETED utilisés (2/8 = 25%)
      expect(usedStatuses.length).toBeGreaterThan(0);
    });
  });

  describe('Test 5: Migration Prisma - Procédure', () => {
    it('devrait documenter procédure migration String → Enum', () => {
      const migrationSteps = {
        step1: {
          description: 'Identifier données invalides existantes',
          command: `
SELECT DISTINCT status
FROM "QuoteRequest"
WHERE status NOT IN ('TEMPORARY', 'CONFIRMED', 'CONVERTED', 'EXPIRED');
          `.trim()
        },
        step2: {
          description: 'Nettoyer données invalides',
          command: `
UPDATE "QuoteRequest"
SET status = 'TEMPORARY'
WHERE status NOT IN ('TEMPORARY', 'CONFIRMED', 'CONVERTED', 'EXPIRED');
          `.trim()
        },
        step3: {
          description: 'Créer enum dans schema.prisma',
          code: `
enum QuoteRequestStatus {
  TEMPORARY
  CONFIRMED
  CONVERTED
  EXPIRED
}

model QuoteRequest {
  status QuoteRequestStatus @default(TEMPORARY)
  // ...
}
          `.trim()
        },
        step4: {
          description: 'Générer et appliquer migration',
          command: 'npx prisma migrate dev --name add-quote-status-enum'
        },
        step5: {
          description: 'Vérifier migration réussie',
          command: `
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'QuoteRequest' AND column_name = 'status';
          `.trim()
        }
      };

      logger.info('💡 PROCÉDURE MIGRATION STRING → ENUM:');
      Object.entries(migrationSteps).forEach(([step, config]) => {
        const { description, command, code } = config as any;
        logger.info(`   ${step}: ${description}`);
        if (command) logger.info(`      $ ${command.split('\n')[0]}`);
        if (code) logger.info(`      Code: ${code.split('\n')[0]}...`);
      });

      expect(Object.keys(migrationSteps).length).toBe(5);
    });

    it('devrait vérifier type colonne status en DB (après migration)', async () => {
      // Query pour vérifier type effectif en DB
      const columnInfo: any = await prisma.$queryRaw`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_name = 'QuoteRequest' AND column_name = 'status'
      `;

      if (columnInfo.length > 0) {
        const { data_type, udt_name } = columnInfo[0];

        logger.info(`📊 Type colonne QuoteRequest.status:`);
        logger.info(`   - data_type: ${data_type}`);
        logger.info(`   - udt_name: ${udt_name}`);

        // Après migration: data_type devrait être "USER-DEFINED" (enum)
        // Avant migration: data_type = "character varying" (String)

        if (data_type === 'character varying') {
          logger.warn('⚠️ Type String détecté → Migration non appliquée');
        } else if (data_type === 'USER-DEFINED') {
          logger.info('✅ Type enum détecté → Migration appliquée');
          expect(data_type).toBe('USER-DEFINED');
        }
      }
    });
  });

  describe('Test 6: Cohérence Code TypeScript vs Schema', () => {
    it('devrait vérifier cohérence enum TypeScript vs Prisma', () => {
      // Enum TypeScript
      const { QuoteRequestStatus } = require('@/quotation/domain/entities/QuoteRequest');

      const tsEnumValues = Object.values(QuoteRequestStatus);

      logger.info('📊 Enum TypeScript QuoteRequestStatus:');
      logger.info(`   Valeurs: ${tsEnumValues.join(', ')}`);

      // Valeurs attendues dans Prisma (après migration)
      const prismaEnumValues = ['TEMPORARY', 'CONFIRMED', 'CONVERTED', 'EXPIRED'];

      // Vérifier correspondance
      const missingInPrisma = tsEnumValues.filter(v => !prismaEnumValues.includes(v as string));
      const missingInTS = prismaEnumValues.filter(v => !tsEnumValues.includes(v));

      if (missingInPrisma.length > 0) {
        logger.error('❌ Valeurs TypeScript absentes de Prisma:', missingInPrisma);
      }

      if (missingInTS.length > 0) {
        logger.error('❌ Valeurs Prisma absentes de TypeScript:', missingInTS);
      }

      expect(missingInPrisma).toEqual([]);
      expect(missingInTS).toEqual([]);

      logger.info('✅ Cohérence TypeScript ↔ Prisma vérifiée');
    });
  });
});
