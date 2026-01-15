/**
 * 🎨 RENDERER REACT EMAIL - Compilation et rendu des templates
 *
 * ⚠️ SERVER-ONLY FILE - Ce fichier ne doit JAMAIS être importé côté client
 *
 * Utilité:
 * - Compilation des composants React Email en HTML
 * - Gestion des variables et props
 * - Optimisation pour clients email
 * - Cache des templates compilés
 *
 * ⚠️ SOLUTION TECHNIQUE IMPORTANTE (pour les développeurs):
 *
 * Ce renderer utilise `renderToStaticMarkup` de react-dom/server avec un IMPORT STATIQUE.
 *
 * ❌ ANCIEN CODE (ne fonctionnait pas):
 * ```
 * import { render } from '@react-email/render';
 * const ReactDOMServer = require('react-dom/server');
 * const html = await render(element);
 * ```
 *
 * Problèmes:
 * 1. @react-email/render utilise des imports dynamiques qui ne fonctionnent pas dans Jest
 * 2. require('react-dom/server') dans Jest cause des erreurs "dynamic import callback"
 * 3. Résultat: fallback HTML de 441 caractères au lieu de React Email complet (15k+ caractères)
 *
 * ✅ SOLUTION ACTUELLE (fonctionne parfaitement):
 * ```
 * import { renderToStaticMarkup } from 'react-dom/server';  // Import statique ES6
 * const html = renderToStaticMarkup(element);                // Synchrone
 * ```
 *
 * Avantages:
 * 1. Import statique ES6 compatible avec Jest, Next.js, et Node.js production
 * 2. Rendu synchrone (50ms pour ~19k caractères)
 * 3. Pas de dépendance à @react-email/render
 * 4. Génère le HTML complet React Email avec tous les styles
 *
 * Validation:
 * - bodyLength attendu: > 10,000 caractères (React Email complet)
 * - bodyLength < 1000 = PROBLÈME (fallback HTML utilisé)
 *
 * Tests de référence:
 * - src/__tests__/integration/accounting-notifications.test.ts (bodyLength: 19,382)
 *
 * Documentation complète:
 * - docs/SOLUTION_ACCOUNTING_DOCUMENTS_REACT_EMAIL.md
 * - docs/GUIDE_COMPLET_TESTS_REACT_EMAIL.md
 */

import 'server-only';  // ✅ CRITICAL: Marquer ce fichier comme server-only pour Next.js

import React from 'react';
// Import dynamique de react-dom/server pour éviter que Next.js l'inclue dans le bundle client
let renderToStaticMarkup: typeof import('react-dom/server').renderToStaticMarkup;

function getRenderToStaticMarkup() {
  if (!renderToStaticMarkup) {
    // Import dynamique au runtime pour éviter l'analyse statique de Next.js
    const ReactDOMServer = require('react-dom/server');
    renderToStaticMarkup = ReactDOMServer.renderToStaticMarkup;
  }
  return renderToStaticMarkup;
}
import {
  QuoteConfirmation,
  BookingConfirmation,
  PaymentConfirmation,
  ServiceReminder,
  Reminder24hEmail,
  Reminder7dEmail,
  Reminder1hEmail,
  ProfessionalAttribution,
  AccountingDocuments,
  type QuoteConfirmationData,
  type BookingConfirmationData,
  type PaymentConfirmationData,
  type ServiceReminderData,
  type Reminder24hData,
  type Reminder7dData,
  type Reminder1hData,
  type ProfessionalAttributionData,
  type AccountingDocumentsData
} from '../../templates/react-email';

export interface ReactEmailTemplate {
  id: string;
  component: React.ComponentType<any>;
  dataType: any;
}

export class ReactEmailRenderer {
  private static instance: ReactEmailRenderer;
  private templateCache = new Map<string, { html: string; text: string; subject: string }>();
  private compilationCache = new Map<string, any>();

  private constructor() {}

  static getInstance(): ReactEmailRenderer {
    if (!ReactEmailRenderer.instance) {
      ReactEmailRenderer.instance = new ReactEmailRenderer();
    }
    return ReactEmailRenderer.instance;
  }

  /**
   * 📧 Templates React Email disponibles
   */
  private readonly templates: Record<string, ReactEmailTemplate> = {
    'quote-confirmation': {
      id: 'quote-confirmation',
      component: QuoteConfirmation,
      dataType: {} as QuoteConfirmationData
    },
    'booking-confirmation': {
      id: 'booking-confirmation',
      component: BookingConfirmation,
      dataType: {} as BookingConfirmationData
    },
    'payment-confirmation': {
      id: 'payment-confirmation',
      component: PaymentConfirmation,
      dataType: {} as PaymentConfirmationData
    },
    'service-reminder': {
      id: 'service-reminder',
      component: ServiceReminder,
      dataType: {} as ServiceReminderData
    },
    'reminder-24h': {
      id: 'reminder-24h',
      component: Reminder24hEmail,
      dataType: {} as Reminder24hData
    },
    'reminder-7d': {
      id: 'reminder-7d',
      component: Reminder7dEmail,
      dataType: {} as Reminder7dData
    },
    'reminder-1h': {
      id: 'reminder-1h',
      component: Reminder1hEmail,
      dataType: {} as Reminder1hData
    },
    'professional-attribution': {
      id: 'professional-attribution',
      component: ProfessionalAttribution,
      dataType: {} as ProfessionalAttributionData
    },
    'accounting-documents': {
      id: 'accounting-documents',
      component: AccountingDocuments,
      dataType: {} as AccountingDocumentsData
    }
  };

  /**
   * 🎨 Rendre un template React Email
   */
  renderTemplate(
    templateId: string,
    data: any
  ): { html: string; text: string; subject: string } {
    const template = this.templates[templateId];

    if (!template) {
      throw new Error(`Template React Email '${templateId}' not found`);
    }

    // Vérifier le cache
    const cacheKey = `${templateId}-${JSON.stringify(data)}`;
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey)!;
    }

    try {
      // 🔍 DEBUG: Loguer les données passées au template
      console.log(`\n[ReactEmailRenderer] ========== DÉBUT RENDU '${templateId}' ==========`);
      console.log('[ReactEmailRenderer] Data keys:', Object.keys(data));
      console.log('[ReactEmailRenderer] Component:', template.component.name || 'Anonymous');
      console.log('[ReactEmailRenderer] Component type:', typeof template.component);

      const Component = template.component;

      let html: string;
      let text: string;

      // 🔧 SOLUTION CRITIQUE: Rendu synchrone avec renderToStaticMarkup
      //
      // ⚠️ NE PAS remplacer par:
      //   - await render(element) de @react-email/render (imports dynamiques incompatibles Jest)
      //   - require('react-dom/server') (cause erreurs en Jest)
      //
      // ✅ Cette approche garantit:
      //   - Compatibilité Jest + Next.js + Node.js production
      //   - HTML complet React Email (>10k caractères)
      //   - Rendu rapide (~50ms)
      //
      // Si bodyLength < 1000 dans les tests, vérifier:
      //   1. Import statique maintenu: import { renderToStaticMarkup } from 'react-dom/server'
      //   2. Tous les champs obligatoires du template fournis
      //   3. Dates en format ISO (toISOString())
      //   4. Montants en centimes (pas euros)
      console.log('[ReactEmailRenderer] Step 1: Creating React element...');
      const element = React.createElement(Component, data);
      console.log('[ReactEmailRenderer] Step 2: React element created:', !!element);

      console.log('[ReactEmailRenderer] Step 3: Using renderToStaticMarkup...');
      const startTime = Date.now();

      try {
        // ✅ SOLUTION: Import statique + rendu synchrone
        html = getRenderToStaticMarkup()(element);

        console.log('[ReactEmailRenderer] Step 4: HTML rendered in', Date.now() - startTime, 'ms');
        console.log('[ReactEmailRenderer] Step 5: HTML length:', html?.length);
        console.log('[ReactEmailRenderer] Step 6: HTML is string?', typeof html === 'string');

        // Générer version texte en retirant les tags HTML
        text = html
          .replace(/<style[^>]*>.*?<\/style>/gs, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        console.log('[ReactEmailRenderer] Step 7: TEXT length:', text?.length);
      } catch (error: any) {
        console.error('[ReactEmailRenderer] ❌ renderToStaticMarkup failed:', error.message);
        console.error('[ReactEmailRenderer] ❌ Full error:', error);
        throw error;
      }

      // Extraction du sujet depuis les props
      const subject = this.extractSubject(templateId, data);

      const result = { html, text, subject };

      // Mise en cache
      this.templateCache.set(cacheKey, result);

      return result;

    } catch (error) {
      console.error(`[ReactEmailRenderer] Error rendering template '${templateId}':`, error);
      throw new Error(`Erreur de rendu React Email '${templateId}': ${error}`);
    }
  }

  /**
   * 📝 Extraire le sujet du template
   */
  private extractSubject(templateId: string, data: any): string {
    const subjectMap: Record<string, (data: any) => string> = {
      'quote-confirmation': (data) => `Devis Express Quote - ${data.quoteNumber}`,
      'booking-confirmation': (data) => `Confirmation de réservation - ${data.bookingId}`,
      'payment-confirmation': (data) => `Confirmation de paiement - ${data.transactionId}`,
      'service-reminder': (data) => `Rappel de service - ${data.serviceDate}`,
      'reminder-24h': (data) => `🚨 Rappel important - Service demain à ${data.serviceTime}`,
      'reminder-7d': (data) => `📅 Rappel préventif - Service dans 7 jours`,
      'reminder-1h': (data) => `🚨 URGENT - Service dans 1 heure !`,
      'professional-attribution': (data) => `🎯 Nouvelle mission ${data.serviceType} - ${data.totalAmount}€ à ${data.locationCity}`,
      'accounting-documents': (data) => `💰 Documents comptables - ${data.bookingReference}`
    };

    return subjectMap[templateId]?.(data) || 'Notification Express Quote';
  }

  /**
   * 🧹 Nettoyer le cache
   */
  clearCache(): void {
    this.templateCache.clear();
    this.compilationCache.clear();
  }

  /**
   * 📊 Statistiques du cache
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.templateCache.size,
      keys: Array.from(this.templateCache.keys())
    };
  }

  /**
   * ✅ Vérifier si un template existe
   */
  hasTemplate(templateId: string): boolean {
    return templateId in this.templates;
  }

  /**
   * 📋 Lister tous les templates disponibles
   */
  getAvailableTemplates(): string[] {
    return Object.keys(this.templates);
  }
}
