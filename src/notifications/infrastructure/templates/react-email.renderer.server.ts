/**
 * 🔒 SERVER-ONLY WRAPPER - Renderer React Email
 *
 * Ce fichier est un wrapper server-only pour isoler react-dom/server
 * et éviter que Next.js essaie de l'inclure dans le bundle client.
 *
 * ⚠️ IMPORTANT: Ce fichier doit UNIQUEMENT être importé dans:
 * - API routes (app/api/**/route.ts)
 * - Server Components
 * - Code backend (services, repositories)
 *
 * ❌ NE JAMAIS importer dans:
 * - Client Components ('use client')
 * - Code partagé client/serveur
 * - Middleware
 */

import 'server-only';

// Import du renderer React Email (qui utilise react-dom/server)
import { ReactEmailRenderer } from './react-email.renderer';

/**
 * 🎨 Instance singleton du renderer React Email (server-side only)
 */
export function getReactEmailRenderer(): ReactEmailRenderer {
  return ReactEmailRenderer.getInstance();
}

/**
 * 📧 Rendre un template React Email (server-side only)
 */
export function renderReactEmailTemplate(
  templateId: string,
  data: any
): { html: string; text: string; subject: string } {
  const renderer = ReactEmailRenderer.getInstance();
  return renderer.renderTemplate(templateId, data);
}

/**
 * ✅ Vérifier si un template React Email existe
 */
export function hasReactEmailTemplate(templateId: string): boolean {
  const renderer = ReactEmailRenderer.getInstance();
  return renderer.hasTemplate(templateId);
}

/**
 * 📋 Lister tous les templates React Email disponibles
 */
export function getAvailableReactEmailTemplates(): string[] {
  const renderer = ReactEmailRenderer.getInstance();
  return renderer.getAvailableTemplates();
}
