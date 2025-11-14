/**
 * 🎭 **SETUP PLAYWRIGHT - Tests de Réservation**
 * 
 * Configuration globale pour les tests Playwright
 */

import { test as base, expect } from '@playwright/test';

// Configuration des tests Playwright
export const test = base.extend({
  // Configuration de base pour chaque test
  page: async ({ page }, use) => {
    // Configuration des timeouts
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);
    
    // Configuration des viewports
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Configuration des mocks
    await page.route('**/api/health', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok' })
      });
    });
    
    await use(page);
  }
});

// Configuration des tests
test.beforeEach(async ({ page }) => {
  // Configuration de base pour chaque test
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});

// Configuration des tests après chaque test
test.afterEach(async ({ page }) => {
  // Nettoyer les données de test
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});

// Configuration des tests après tous les tests
test.afterAll(async () => {
  // Nettoyer les données de test globales
});

// Configuration des mocks globaux
test.beforeAll(async () => {
  // Configuration des mocks globaux
});

// Configuration des tests
export { expect };
