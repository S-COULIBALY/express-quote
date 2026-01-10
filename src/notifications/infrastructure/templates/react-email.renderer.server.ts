/**
 * 🔒 SERVER-ONLY WRAPPER - Renderer React Email
 *
 * Ce fichier est un wrapper server-only pour isoler react-dom/server
 * et éviter que Next.js essaie de l'inclure dans le bundle client.
 *
 * ⚠️ IMPORTANT: Ce fichier doit UNIQUEMENT être importé dans:
 * - API routes (dans le dossier app/api)
 * - Server Components
 * - Code backend (services, repositories)
 *
 * ❌ NE JAMAIS importer dans:
 * - Client Components ('use client')
 * - Code partagé client/serveur
 * - Middleware
 */

import 'server-only';

/**
 * 🎨 Instance singleton du renderer React Email (server-side only)
 * Utilise un import dynamique pour éviter que Next.js inclue react-dom/server dans le bundle client
 */
export async function getReactEmailRenderer() {
  const { ReactEmailRenderer } = await import('./react-email.renderer');
  return ReactEmailRenderer.getInstance();
}

/**
 * 📧 Rendre un template React Email (server-side only)
 */
export function renderReactEmailTemplate(
  templateId: string,
  data: any
): { html: string; text: string; subject: string } {
  // Import dynamique pour éviter que Next.js inclue react-dom/server dans le bundle client
  const { ReactEmailRenderer } = require('./react-email.renderer');
  const renderer = ReactEmailRenderer.getInstance();
  return renderer.renderTemplate(templateId, data);
}

/**
 * ✅ Vérifier si un template React Email existe
 */
export function hasReactEmailTemplate(templateId: string): boolean {
  // Import dynamique pour éviter que Next.js inclue react-dom/server dans le bundle client
  const { ReactEmailRenderer } = require('./react-email.renderer');
  const renderer = ReactEmailRenderer.getInstance();
  return renderer.hasTemplate(templateId);
}

/**
 * 📋 Lister tous les templates React Email disponibles
 */
export function getAvailableReactEmailTemplates(): string[] {
  // Import dynamique pour éviter que Next.js inclue react-dom/server dans le bundle client
  const { ReactEmailRenderer } = require('./react-email.renderer');
  const renderer = ReactEmailRenderer.getInstance();
  return renderer.getAvailableTemplates();
}
