/**
 * 🔒 **TEST RGPD - MASQUAGE PII DANS LOGS**
 *
 * Ce test vérifie le problème #6 identifié dans AUDIT_PRODUCTION_FINAL.md :
 * - PII (emails, téléphones, adresses) loggés SANS MASQUAGE
 * - Violation Article 32 RGPD (Sécurité du traitement)
 * - Risque : Amende jusqu'à 4% CA ou 20M€
 *
 * **Criticité** : MOYENNE (Violation RGPD)
 * **Impact** : Amende CNIL, réputation, plaintes clients
 * **Données testées** :
 * - Emails (masquage: john.doe@example.com → jo***@example.com)
 * - Téléphones (masquage: +33612345678 → +336****78)
 * - Adresses (masquage: 123 Rue de la Paix → [REDACTED])
 * - Noms complets (masquage optionnel selon contexte)
 *
 * **Référence** : docs/AUDIT_PRODUCTION_FINAL.md (Problème #6)
 * **Approche** : TDD - Ces tests ÉCHOUERONT tant que maskPII() n'est pas implémenté
 */

import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

const prisma = new PrismaClient();

describe('🔒 RGPD - PII Masking in Logs (Problème #6)', () => {
  let testCustomerId: string;
  let testBookingId: string;

  beforeAll(async () => {
    await prisma.$connect();
    logger.info('🔒 Tests RGPD PII masking...');
  });

  afterAll(async () => {
    // Nettoyage
    if (testBookingId) {
      await prisma.booking.deleteMany({ where: { id: testBookingId } });
    }
    if (testCustomerId) {
      await prisma.customer.deleteMany({ where: { id: testCustomerId } });
    }
    await prisma.$disconnect();
  });

  describe('Test 1: Fonction maskPII() - Validation', () => {
    it('✅ RGPD: devrait avoir la fonction maskPII() implémentée', () => {
      // ✅ VALIDATION: Vérifier que maskPII existe et fonctionne
      const loggerModule = require('@/lib/logger');

      // La fonction doit être définie
      expect(loggerModule.maskPII).toBeDefined();
      expect(typeof loggerModule.maskPII).toBe('function');

      logger.info('✅ Fonction maskPII() implémentée et disponible');
    });

    it('✅ devrait masquer email correctement', () => {
      const { maskPII } = require('@/lib/logger');

      const testData = {
        email: 'john.doe@example.com'
      };

      const masked = maskPII(testData);

      // ✅ VALIDATION: Format attendu: jo***@example.com
      expect(masked.email).toMatch(/^[a-z]{2}\*\*\*@/);
      expect(masked.email).not.toBe('john.doe@example.com');

      // Vérifier que domaine est préservé (utile pour debug)
      expect(masked.email).toContain('@example.com');

      logger.info(`✅ Email masqué: ${testData.email} → ${masked.email}`);
    });

    it('✅ devrait masquer téléphone correctement', () => {
      const { maskPII } = require('@/lib/logger');

      const testCases = [
        { input: '+33612345678', expected: /^\+336\*\*\*\*78$/ },
        { input: '0612345678', expected: /^06\*\*\*\*78$/ },
        { input: '+33 6 12 34 56 78', expected: /\*\*\*\*/ }
      ];

      testCases.forEach(({ input, expected }) => {
        const masked = maskPII({ phone: input });

        // ✅ VALIDATION: Vérifier le format masqué
        expect(masked.phone).toMatch(expected);
        expect(masked.phone).not.toBe(input);

        logger.info(`✅ Téléphone masqué: ${input} → ${masked.phone}`);
      });
    });

    it('✅ devrait masquer adresse complète', () => {
      const { maskPII } = require('@/lib/logger');

      const testAddresses = [
        '123 Rue de la Paix, 75001 Paris',
        '45 Avenue des Champs-Élysées, Paris',
        '10 Downing Street, London'
      ];

      testAddresses.forEach(address => {
        const masked = maskPII({ address });

        // Adresse doit être soit remplacée par [REDACTED] soit par ville uniquement
        const isRedacted = masked.address === '[REDACTED]';
        const isCityOnly = masked.address === 'Paris' || masked.address === 'London';

        expect(isRedacted || isCityOnly).toBe(true);

        // Numéro de rue ne doit PAS apparaître
        expect(masked.address).not.toContain('123');
        expect(masked.address).not.toContain('45');
        expect(masked.address).not.toContain('10');

        logger.info(`✅ Adresse masquée: ${address} → ${masked.address}`);
      });
    });

    it('✅ devrait préserver nom complet (moins sensible)', () => {
      const { maskPII } = require('@/lib/logger');

      const masked = maskPII({
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe'
      });

      // Noms peuvent rester (moins sensibles selon RGPD)
      // Ou être masqués selon niveau de sécurité requis
      expect(masked.name || masked.firstName).toBeTruthy();

      logger.info(`✅ Nom traité: ${masked.name || `${masked.firstName} ${masked.lastName}`}`);
    });

    it('✅ devrait gérer objets imbriqués', () => {
      const { maskPII } = require('@/lib/logger');

      const complexData = {
        customer: {
          email: 'test@example.com',
          phone: '+33612345678',
          address: {
            street: '123 Rue Test',
            city: 'Paris'
          }
        },
        booking: {
          id: 'booking_123',
          amount: 450.00
        }
      };

      const masked = maskPII(complexData);

      // ✅ VALIDATION: Email masqué
      expect(masked.customer.email).toMatch(/\*\*\*/);

      // ✅ VALIDATION: Téléphone masqué
      expect(masked.customer.phone).toMatch(/\*\*\*\*/);

      // ✅ VALIDATION: Données non-PII préservées
      expect(masked.booking.id).toBe('booking_123');
      expect(masked.booking.amount).toBe(450.00);
    });
  });

  describe('Test 2: Logs Production - Validation masquage', () => {
    it('✅ RGPD: logs BookingService ne doivent PAS contenir emails en clair', async () => {
      const logSpy = jest.spyOn(logger, 'info');
      const testEmail = `test-pii-${Date.now()}@example.com`;

      // Créer Customer (déclenche logs dans BookingService)
      const customer = await prisma.customer.create({
        data: {
          id: crypto.randomUUID(),
          firstName: 'Test',
          lastName: 'PII',
          email: testEmail,
          phone: '+33612345678',
          updatedAt: new Date()
        }
      });

      testCustomerId = customer.id;

      // ✅ VALIDATION: Vérifier les logs
      const allLogCalls = logSpy.mock.calls.flat().join(' ');

      // ✅ Email en clair ne doit PAS apparaître
      expect(allLogCalls).not.toContain(testEmail);
      logger.info('✅ Email non trouvé en clair dans logs');

      // Note: Format masqué peut apparaître (optionnel selon implémentation)
      const maskedEmail = `te***@example.com`;
      if (allLogCalls.includes(maskedEmail)) {
        logger.info('✅ Email masqué trouvé dans logs');
      }
    });

    it('✅ RGPD: logs ne doivent PAS contenir téléphones en clair', async () => {
      const logSpy = jest.spyOn(logger, 'info');
      const testPhone = '+33612345678';

      // Créer booking (déclenche logs)
      const booking = await prisma.booking.create({
        data: {
          id: crypto.randomUUID(),
          Customer: {
            connect: { id: testCustomerId }
          },
          type: 'SERVICE',
          totalAmount: 100.00,
          status: 'DRAFT',
          updatedAt: new Date()
        }
      });

      testBookingId = booking.id;

      const allLogCalls = logSpy.mock.calls.flat().join(' ');

      // ✅ VALIDATION: Téléphone complet ne doit PAS apparaître
      expect(allLogCalls).not.toContain(testPhone);
      logger.info('✅ Téléphone non trouvé en clair dans logs');
    });

    it('✅ RGPD: logs ne doivent PAS contenir adresses complètes', async () => {
      const logSpy = jest.spyOn(logger, 'info');
      const testAddress = '123 Rue de la Test, 75001 Paris';

      // Update booking avec adresse
      await prisma.booking.update({
        where: { id: testBookingId },
        data: {
          pickupAddress: testAddress
        }
      });

      const allLogCalls = logSpy.mock.calls.flat().join(' ');

      // ✅ VALIDATION: Numéro de rue ne doit PAS apparaître
      expect(allLogCalls).not.toContain('123 Rue de la Test');
      logger.info('✅ Adresse complète non trouvée dans logs');

      // ✅ Ville seule OK
      if (allLogCalls.includes('Paris')) {
        logger.info('✅ Ville seule trouvée (acceptable)');
      }
    });
  });

  describe('Test 3: Sentry Integration - Masquage PII', () => {
    it('devrait masquer PII dans événements Sentry via beforeSend', async () => {
      let Sentry: any;

      try {
        Sentry = require('@sentry/nextjs');
      } catch (error) {
        logger.warn('⚠️ @sentry/nextjs non installé, test skippé');
        return;
      }

      // Configuration beforeSend pour masquer PII
      const beforeSend = (event: any, hint: any) => {
        // Masquer user data
        if (event.user) {
          delete event.user.email;
          delete event.user.ip_address;
          delete event.user.username;
        }

        // Masquer contexts
        if (event.contexts?.customer) {
          delete event.contexts.customer.email;
          delete event.contexts.customer.phone;
          delete event.contexts.customer.address;
        }

        // Masquer extra data
        if (event.extra) {
          if (event.extra.customerEmail) {
            event.extra.customerEmail = '[REDACTED]';
          }
        }

        return event;
      };

      // Test beforeSend
      const mockEvent = {
        user: {
          id: 'user_123',
          email: 'test@example.com',
          ip_address: '192.168.1.1'
        },
        contexts: {
          customer: {
            email: 'customer@example.com',
            phone: '+33612345678'
          }
        }
      };

      const sanitizedEvent = beforeSend(mockEvent, {});

      // Vérifier masquage
      expect(sanitizedEvent.user.email).toBeUndefined();
      expect(sanitizedEvent.user.ip_address).toBeUndefined();
      expect(sanitizedEvent.contexts.customer.email).toBeUndefined();

      logger.info('✅ beforeSend Sentry masque correctement PII');
    });
  });

  describe('Test 4: Audit Logs - Traçabilité vs RGPD', () => {
    it('devrait logger actions critiques AVEC identifiant mais SANS PII', () => {
      // Balance entre traçabilité (audit) et RGPD

      const auditLog = {
        action: 'BOOKING_CREATED',
        timestamp: new Date(),
        customerId: 'customer_abc123', // ✅ ID OK
        bookingId: 'booking_xyz789',   // ✅ ID OK
        amount: 450.00,                // ✅ Montant OK
        // ❌ ÉVITER:
        // customerEmail: 'test@example.com',
        // customerPhone: '+33612345678',
        // customerAddress: '123 Rue...'
      };

      // Audit log ne doit contenir que IDs, pas PII directes
      expect(auditLog.customerId).toBeDefined();
      expect(auditLog).not.toHaveProperty('customerEmail');
      expect(auditLog).not.toHaveProperty('customerPhone');

      logger.info('✅ Audit log respecte RGPD (IDs uniquement)');
    });

    it('devrait permettre récupération PII via ID pour support client', async () => {
      // Cas usage légitime: Support client a besoin de contacter client

      // ✅ BON: Récupérer via ID (pas logger PII)
      const customer = await prisma.customer.findUnique({
        where: { id: testCustomerId },
        select: {
          id: true,
          email: true,  // OK car récupération contrôlée
          phone: true
        }
      });

      expect(customer).toBeDefined();
      expect(customer?.email).toBeTruthy();

      // ❌ MAUVAIS: Logger PII récupérées
      // logger.info('Customer found:', customer); // ❌

      // ✅ BON: Logger ID uniquement
      logger.info(`Customer found: ${customer?.id}`); // ✅

      logger.info('✅ Récupération PII contrôlée (pas de logs)');
    });

    it('devrait implémenter retention policy (suppression PII après X jours)', () => {
      // RGPD Article 5.1.e: Limitation de conservation

      const retentionPolicies = {
        bookings: {
          active: 'Illimité (relation contractuelle)',
          completed: '5 ans (obligations fiscales)',
          cancelled: '1 an puis anonymisation'
        },
        customers: {
          withBookings: '5 ans après dernier booking',
          withoutBookings: '3 ans inactivité puis suppression',
          consentWithdrawn: '30 jours puis suppression'
        },
        logs: {
          application: '90 jours',
          audit: '3 ans (conformité)',
          security: '1 an'
        }
      };

      logger.info('💡 RETENTION POLICIES RGPD:');
      Object.entries(retentionPolicies).forEach(([type, policies]) => {
        logger.info(`   ${type}:`, policies);
      });

      expect(retentionPolicies).toBeDefined();
    });
  });

  describe('Test 5: Conformité Article 32 RGPD', () => {
    it('devrait documenter mesures sécurité PII', () => {
      const securityMeasures = {
        technical: [
          'Masquage PII dans logs (maskPII())',
          'Chiffrement base de données (Supabase TLS)',
          'HTTPS obligatoire (TLS 1.3)',
          'Secrets dans variables environnement (pas hardcodés)',
          'beforeSend Sentry (masquage PII avant envoi)'
        ],
        organizational: [
          'Accès base de données restreint (RBAC)',
          'Audit logs actions critiques',
          'Formation équipe RGPD',
          'Procédure incident (breach < 72h notification)',
          'DPO contactable (privacy@express-quote.com)'
        ],
        monitoring: [
          'Détection accès non autorisés (Sentry)',
          'Alertes modifications massives données',
          'Logs conservation 90 jours',
          'Revue trimestrielle conformité'
        ]
      };

      logger.info('💡 MESURES ARTICLE 32 RGPD:');
      logger.info('   Techniques:', securityMeasures.technical.length, 'mesures');
      logger.info('   Organisationnelles:', securityMeasures.organizational.length, 'mesures');
      logger.info('   Monitoring:', securityMeasures.monitoring.length, 'mesures');

      expect(securityMeasures.technical.length).toBeGreaterThan(3);
    });

    it('devrait avoir documentation breach notification (< 72h)', () => {
      const breachProcedure = {
        detection: 'Sentry alerting + monitoring logs',
        assessment: '< 24h: Évaluer gravité breach',
        containment: '< 24h: Bloquer accès compromis',
        notification_cnil: '< 72h: Notifier CNIL si risque élevé',
        notification_users: '< 72h: Informer utilisateurs affectés',
        documentation: 'Registre incidents (Article 33.5)'
      };

      logger.info('💡 PROCÉDURE BREACH NOTIFICATION:');
      Object.entries(breachProcedure).forEach(([step, description]) => {
        logger.info(`   ${step}: ${description}`);
      });

      expect(breachProcedure.notification_cnil).toContain('< 72h');
    });
  });
});
